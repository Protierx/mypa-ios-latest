// @ts-nocheck — Deno edge function; not type-checked by Node/TS
/**
 * Calendar Sync Edge Function
 *
 * Server-side calendar integration that processes calendar events
 * and syncs them with MYPA tasks. Handles Google Calendar OAuth
 * token refresh and Apple Calendar event imports.
 *
 * Endpoints:
 *   POST /calendar-sync  { action: 'connect', provider, tokens }
 *   POST /calendar-sync  { action: 'disconnect', provider }
 *   POST /calendar-sync  { action: 'sync', provider? }
 *   POST /calendar-sync  { action: 'import_events', events[] }
 *   POST /calendar-sync  { action: 'status' }
 *
 * Reference: PRD Section 12 (Calendar Integration)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/config.ts';
import { checkRateLimit, rateLimitResponse, getUserWithPremiumStatus } from '../_shared/rateLimit.ts';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    // ── Auth ─────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json();
    const action = body.action || 'status';

    // Rate limit
    const { isPremium, timezone } = await getUserWithPremiumStatus(supabaseAdmin, user.id);
    const rateCheck = await checkRateLimit(supabaseAdmin, user.id, 'calendar_sync', isPremium, timezone);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck);
    }

    // ── Action: status ──────────────────────────────────────────
    if (action === 'status') {
      const { data: connections } = await supabaseAdmin
        .from('integration_connections')
        .select('provider, status, last_sync_at, sync_error, metadata, connected_at')
        .eq('user_id', user.id)
        .in('provider', ['apple_calendar', 'google_calendar', 'outlook_calendar']);

      return new Response(JSON.stringify({
        connections: connections || [],
        supported_providers: ['apple_calendar', 'google_calendar', 'outlook_calendar'],
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Action: connect ─────────────────────────────────────────
    if (action === 'connect') {
      const { provider, access_token, refresh_token, token_expires_at, scopes, metadata } = body;

      if (!provider || !['apple_calendar', 'google_calendar', 'outlook_calendar'].includes(provider)) {
        return new Response(JSON.stringify({ error: 'Invalid provider' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseAdmin
        .from('integration_connections')
        .upsert({
          user_id: user.id,
          provider,
          access_token: access_token || null,
          refresh_token: refresh_token || null,
          token_expires_at: token_expires_at || null,
          scopes: scopes || [],
          metadata: metadata || {},
          status: 'active',
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,provider',
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to connect', details: error.message }), {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      await supabaseAdmin.from('event_log').insert({
        user_id: user.id,
        event_type: 'calendar_connected',
        params: { provider },
      });

      return new Response(JSON.stringify({
        connected: true,
        provider,
        connection_id: data.id,
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Action: disconnect ──────────────────────────────────────
    if (action === 'disconnect') {
      const { provider } = body;

      if (!provider) {
        return new Response(JSON.stringify({ error: 'Provider required' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      await supabaseAdmin
        .from('integration_connections')
        .update({
          status: 'inactive',
          access_token: null,
          refresh_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('provider', provider);

      await supabaseAdmin.from('event_log').insert({
        user_id: user.id,
        event_type: 'calendar_disconnected',
        params: { provider },
      });

      return new Response(JSON.stringify({ disconnected: true, provider }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Action: sync ────────────────────────────────────────────
    if (action === 'sync') {
      const provider = body.provider; // optional: sync all if not specified

      const query = supabaseAdmin
        .from('integration_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (provider) {
        query.eq('provider', provider);
      } else {
        query.in('provider', ['apple_calendar', 'google_calendar', 'outlook_calendar']);
      }

      const { data: connections } = await query;

      if (!connections || connections.length === 0) {
        return new Response(JSON.stringify({
          synced: false,
          message: 'No active calendar connections found',
        }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      const syncResults: any[] = [];

      for (const connection of connections) {
        try {
          // Google Calendar: refresh token if expired
          if (connection.provider === 'google_calendar' && connection.refresh_token) {
            const now = new Date();
            const tokenExpiry = connection.token_expires_at ? new Date(connection.token_expires_at) : now;

            if (tokenExpiry <= now) {
              const googleClientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
              const googleClientSecret = Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');

              if (googleClientId && googleClientSecret) {
                try {
                  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                      client_id: googleClientId,
                      client_secret: googleClientSecret,
                      refresh_token: connection.refresh_token,
                      grant_type: 'refresh_token',
                    }),
                  });

                  if (tokenResponse.ok) {
                    const tokenData = await tokenResponse.json();
                    await supabaseAdmin
                      .from('integration_connections')
                      .update({
                        access_token: tokenData.access_token,
                        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
                        updated_at: new Date().toISOString(),
                      })
                      .eq('id', connection.id);

                    connection.access_token = tokenData.access_token;
                  } else {
                    throw new Error('Token refresh failed');
                  }
                } catch (refreshErr) {
                  await supabaseAdmin
                    .from('integration_connections')
                    .update({
                      status: 'expired',
                      sync_error: 'Token refresh failed',
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', connection.id);

                  syncResults.push({
                    provider: connection.provider,
                    success: false,
                    error: 'Token expired, re-authentication required',
                  });
                  continue;
                }
              }
            }

            // Fetch Google Calendar events
            if (connection.access_token) {
              try {
                const now = new Date();
                const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

                const calendarResponse = await fetch(
                  `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                  `timeMin=${now.toISOString()}&timeMax=${weekFromNow.toISOString()}&singleEvents=true&orderBy=startTime`,
                  {
                    headers: {
                      'Authorization': `Bearer ${connection.access_token}`,
                    },
                  },
                );

                if (calendarResponse.ok) {
                  const calData = await calendarResponse.json();
                  const events = calData.items || [];

                  // Update last sync
                  await supabaseAdmin
                    .from('integration_connections')
                    .update({
                      last_sync_at: new Date().toISOString(),
                      sync_error: null,
                      metadata: {
                        ...connection.metadata,
                        last_event_count: events.length,
                      },
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', connection.id);

                  syncResults.push({
                    provider: connection.provider,
                    success: true,
                    events_found: events.length,
                    synced_at: new Date().toISOString(),
                  });
                } else {
                  throw new Error(`Calendar API returned ${calendarResponse.status}`);
                }
              } catch (fetchErr) {
                syncResults.push({
                  provider: connection.provider,
                  success: false,
                  error: fetchErr.message,
                });
              }
            }
          } else {
            // Apple Calendar / Outlook: events come from client
            await supabaseAdmin
              .from('integration_connections')
              .update({
                last_sync_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', connection.id);

            syncResults.push({
              provider: connection.provider,
              success: true,
              message: 'Sync timestamp updated (events synced client-side)',
            });
          }
        } catch (syncErr) {
          syncResults.push({
            provider: connection.provider,
            success: false,
            error: syncErr.message,
          });
        }
      }

      return new Response(JSON.stringify({ synced: true, results: syncResults }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Action: import_events ───────────────────────────────────
    if (action === 'import_events') {
      const events = body.events;

      if (!Array.isArray(events) || events.length === 0) {
        return new Response(JSON.stringify({ error: 'events array required' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      // Import calendar events as time-block tasks
      const importedTasks: any[] = [];

      for (const event of events.slice(0, 50)) { // Cap at 50 events per request
        const { title, start_date, end_date, all_day, location, notes, source_provider, source_event_id } = event;

        if (!title || !start_date) continue;

        const startDate = new Date(start_date);
        const endDate = end_date ? new Date(end_date) : new Date(startDate.getTime() + 60 * 60 * 1000);
        const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

        // Check for duplicate (same source event ID)
        if (source_event_id) {
          const { data: existing } = await supabaseAdmin
            .from('tasks')
            .select('id')
            .eq('user_id', user.id)
            .contains('metadata', { calendar_event_id: source_event_id })
            .limit(1);

          if (existing && existing.length > 0) {
            continue; // Skip duplicate
          }
        }

        const { data: task, error: taskError } = await supabaseAdmin
          .from('tasks')
          .insert({
            user_id: user.id,
            title: `📅 ${title}`,
            description: [notes, location ? `📍 ${location}` : null].filter(Boolean).join('\n'),
            due_date: startDate.toISOString(),
            estimated_duration: durationMinutes,
            priority: 'medium',
            status: 'pending',
            metadata: {
              source: 'calendar_import',
              calendar_provider: source_provider || 'unknown',
              calendar_event_id: source_event_id || null,
              all_day: all_day || false,
              location: location || null,
              end_date: endDate.toISOString(),
            },
          })
          .select()
          .single();

        if (!taskError && task) {
          importedTasks.push(task);
        }
      }

      await supabaseAdmin.from('event_log').insert({
        user_id: user.id,
        event_type: 'calendar_events_imported',
        params: {
          total_received: events.length,
          imported: importedTasks.length,
        },
      });

      return new Response(JSON.stringify({
        imported: importedTasks.length,
        total_received: events.length,
        tasks: importedTasks.map(t => ({ id: t.id, title: t.title })),
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[calendar-sync] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
