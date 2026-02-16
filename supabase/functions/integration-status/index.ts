// @ts-nocheck — Deno edge function; not type-checked by Node/TS
/**
 * Integration Status Edge Function
 *
 * Returns a user's integration connections dashboard:
 * all connected services, rate limit status, subscription info.
 *
 * POST /integration-status  { action: 'dashboard' }  → full integration status
 * POST /integration-status  { action: 'rate_limits' } → all rate limit counters
 * POST /integration-status  { action: 'connections' } → connected integrations list
 * POST /integration-status  { action: 'manage', provider, operation }
 *
 * Reference: PRD Section 3 (Tier Limits), Section 12 (Integrations)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/config.ts';
import { RATE_LIMITS, getRateLimitStatus, getUserWithPremiumStatus, type RateLimitResource } from '../_shared/rateLimit.ts';

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
    const action = body.action || 'dashboard';

    const { isPremium, timezone } = await getUserWithPremiumStatus(supabaseAdmin, user.id);

    // ── Action: rate_limits ─────────────────────────────────────
    if (action === 'rate_limits') {
      const resources = Object.keys(RATE_LIMITS) as RateLimitResource[];
      const limits = await Promise.all(
        resources.map(resource => getRateLimitStatus(supabaseAdmin, user.id, resource, isPremium, timezone)),
      );

      return new Response(JSON.stringify({
        is_premium: isPremium,
        rate_limits: limits,
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Action: connections ─────────────────────────────────────
    if (action === 'connections') {
      const { data: connections } = await supabaseAdmin
        .from('integration_connections')
        .select('id, provider, status, last_sync_at, sync_error, metadata, scopes, connected_at, updated_at')
        .eq('user_id', user.id);

      return new Response(JSON.stringify({
        connections: connections || [],
        available_providers: [
          { id: 'apple_calendar', name: 'Apple Calendar', icon: '🍎', premium_only: false },
          { id: 'google_calendar', name: 'Google Calendar', icon: '📅', premium_only: false },
          { id: 'outlook_calendar', name: 'Outlook Calendar', icon: '📧', premium_only: true },
          { id: 'apple_health', name: 'Apple Health', icon: '❤️', premium_only: true },
          { id: 'slack', name: 'Slack', icon: '💬', premium_only: true },
          { id: 'notion', name: 'Notion', icon: '📝', premium_only: true },
          { id: 'todoist', name: 'Todoist', icon: '✅', premium_only: true },
        ],
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Action: manage ──────────────────────────────────────────
    if (action === 'manage') {
      const { provider, operation } = body;

      if (!provider || !operation) {
        return new Response(JSON.stringify({ error: 'provider and operation required' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      if (operation === 'toggle_sync') {
        const { data: connection } = await supabaseAdmin
          .from('integration_connections')
          .select('status')
          .eq('user_id', user.id)
          .eq('provider', provider)
          .single();

        if (!connection) {
          return new Response(JSON.stringify({ error: 'Connection not found' }), {
            status: 404,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const newStatus = connection.status === 'active' ? 'inactive' : 'active';
        await supabaseAdmin
          .from('integration_connections')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('provider', provider);

        return new Response(JSON.stringify({ provider, status: newStatus }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      if (operation === 'clear_error') {
        await supabaseAdmin
          .from('integration_connections')
          .update({ sync_error: null, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('provider', provider);

        return new Response(JSON.stringify({ provider, error_cleared: true }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      if (operation === 'update_metadata') {
        const { metadata } = body;
        if (!metadata) {
          return new Response(JSON.stringify({ error: 'metadata required' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        await supabaseAdmin
          .from('integration_connections')
          .update({
            metadata: metadata,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('provider', provider);

        return new Response(JSON.stringify({ provider, metadata_updated: true }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid operation' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Action: dashboard (default) ─────────────────────────────
    // Gather everything in parallel
    const [
      connectionsResult,
      rateLimitsResult,
      subscriptionResult,
      exportsResult,
    ] = await Promise.all([
      // Connections
      supabaseAdmin
        .from('integration_connections')
        .select('id, provider, status, last_sync_at, sync_error, connected_at')
        .eq('user_id', user.id),

      // Rate limits (read-only)
      Promise.all(
        (Object.keys(RATE_LIMITS) as RateLimitResource[]).map(
          resource => getRateLimitStatus(supabaseAdmin, user.id, resource, isPremium, timezone),
        ),
      ),

      // Subscription
      supabaseAdmin
        .from('profiles')
        .select('is_premium, premium_expires_at, subscription_product_id')
        .eq('id', user.id)
        .single(),

      // Recent exports
      supabaseAdmin
        .from('data_exports')
        .select('id, status, format, file_size_bytes, requested_at, completed_at, expires_at')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(5),
    ]);

    const profile = subscriptionResult.data;

    return new Response(JSON.stringify({
      user_id: user.id,
      is_premium: isPremium,
      subscription: {
        is_premium: profile?.is_premium ?? false,
        expires_at: profile?.premium_expires_at ?? null,
        product_id: profile?.subscription_product_id ?? null,
      },
      connections: connectionsResult.data || [],
      rate_limits: rateLimitsResult,
      recent_exports: exportsResult.data || [],
      capabilities: {
        calendar_sync: true,
        data_export: true,
        voice_commands: true,
        brain_dump: true,
        google_calendar_oauth: !!Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID'),
        revenucat_sync: !!Deno.env.get('REVENUCAT_API_KEY'),
      },
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[integration-status] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
