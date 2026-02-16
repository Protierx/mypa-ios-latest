// @ts-nocheck — Deno edge function; not type-checked by Node/TS
/**
 * Data Export Edge Function
 *
 * GDPR / Apple App Store compliant data export.
 * Gathers all user data and packages it as downloadable JSON.
 *
 * Endpoints:
 *   POST /data-export  { action: 'request', format?: 'json'|'csv', sections?: string[] }
 *   POST /data-export  { action: 'status', export_id: string }
 *   POST /data-export  { action: 'download', export_id: string }
 *   POST /data-export  { action: 'list' }
 *
 * Reference: PRD Section 10 ("Export my data")
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/config.ts';
import { checkRateLimit, rateLimitResponse, getUserWithPremiumStatus } from '../_shared/rateLimit.ts';

const ALL_SECTIONS = [
  'profile', 'tasks', 'focus_sessions', 'events',
  'circles', 'challenges', 'conversations', 'brain_dumps',
  'notifications', 'user_model', 'gamification',
] as const;

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
    const action = body.action || 'request';

    // ── Action: list ────────────────────────────────────────────
    if (action === 'list') {
      const { data: exports } = await supabaseAdmin
        .from('data_exports')
        .select('id, status, format, file_size_bytes, sections, requested_at, completed_at, expires_at, download_count')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(10);

      return new Response(JSON.stringify({ exports: exports || [] }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Action: status ──────────────────────────────────────────
    if (action === 'status') {
      if (!body.export_id) {
        return new Response(JSON.stringify({ error: 'export_id required' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      const { data: exportRecord } = await supabaseAdmin
        .from('data_exports')
        .select('*')
        .eq('id', body.export_id)
        .eq('user_id', user.id)
        .single();

      if (!exportRecord) {
        return new Response(JSON.stringify({ error: 'Export not found' }), {
          status: 404,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ export: exportRecord }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Action: download ────────────────────────────────────────
    if (action === 'download') {
      if (!body.export_id) {
        return new Response(JSON.stringify({ error: 'export_id required' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      const { data: exportRecord } = await supabaseAdmin
        .from('data_exports')
        .select('*')
        .eq('id', body.export_id)
        .eq('user_id', user.id)
        .single();

      if (!exportRecord) {
        return new Response(JSON.stringify({ error: 'Export not found' }), {
          status: 404,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      if (exportRecord.status !== 'completed') {
        return new Response(JSON.stringify({ error: 'Export not ready', status: exportRecord.status }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      if (new Date(exportRecord.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Export expired' }), {
          status: 410,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      // Generate signed download URL
      const { data: signedUrl } = await supabaseAdmin.storage
        .from('data-exports')
        .createSignedUrl(exportRecord.file_path, 3600); // 1 hour

      // Increment download count
      await supabaseAdmin
        .from('data_exports')
        .update({ download_count: (exportRecord.download_count || 0) + 1 })
        .eq('id', body.export_id);

      return new Response(JSON.stringify({
        download_url: signedUrl?.signedUrl,
        expires_in_seconds: 3600,
        file_size_bytes: exportRecord.file_size_bytes,
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Action: request (generate export) ───────────────────────
    // Rate limit check
    const { isPremium, timezone } = await getUserWithPremiumStatus(supabaseAdmin, user.id);
    const rateCheck = await checkRateLimit(supabaseAdmin, user.id, 'data_export', isPremium, timezone);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck);
    }

    const format = body.format || 'json';
    const sections: string[] = body.sections || [...ALL_SECTIONS];

    // Create export record
    const { data: exportRecord, error: insertError } = await supabaseAdmin
      .from('data_exports')
      .insert({
        user_id: user.id,
        status: 'processing',
        format,
        sections,
      })
      .select()
      .single();

    if (insertError || !exportRecord) {
      return new Response(JSON.stringify({ error: 'Failed to create export request' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Gather data ─────────────────────────────────────────────
    try {
      const exportData: Record<string, any> = {
        export_metadata: {
          export_id: exportRecord.id,
          user_id: user.id,
          exported_at: new Date().toISOString(),
          format,
          sections,
          app: 'MYPA',
          version: '1.0',
        },
      };

      if (sections.includes('profile')) {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        exportData.profile = data;
      }

      if (sections.includes('tasks')) {
        const { data } = await supabaseAdmin
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        exportData.tasks = data || [];
      }

      if (sections.includes('focus_sessions')) {
        const { data } = await supabaseAdmin
          .from('focus_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false });
        exportData.focus_sessions = data || [];
      }

      if (sections.includes('events')) {
        const { data } = await supabaseAdmin
          .from('event_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10000); // Cap at 10K events
        exportData.events = data || [];
      }

      if (sections.includes('circles')) {
        const { data: memberships } = await supabaseAdmin
          .from('circle_members')
          .select('*, circles(*)')
          .eq('user_id', user.id);
        exportData.circles = memberships || [];
      }

      if (sections.includes('challenges')) {
        const { data: participants } = await supabaseAdmin
          .from('challenge_participants')
          .select('*, challenges(*)')
          .eq('user_id', user.id);

        const { data: progress } = await supabaseAdmin
          .from('challenge_progress')
          .select('*')
          .eq('user_id', user.id);

        exportData.challenges = {
          participations: participants || [],
          progress: progress || [],
        };
      }

      if (sections.includes('conversations')) {
        const { data } = await supabaseAdmin
          .from('conversation_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1000);
        exportData.conversations = data || [];
      }

      if (sections.includes('brain_dumps')) {
        const { data } = await supabaseAdmin
          .from('brain_dump_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        exportData.brain_dumps = data || [];
      }

      if (sections.includes('notifications')) {
        const { data } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5000);
        exportData.notifications = data || [];
      }

      if (sections.includes('user_model')) {
        const { data } = await supabaseAdmin
          .from('user_model')
          .select('*')
          .eq('user_id', user.id)
          .single();
        exportData.user_model = data;
      }

      if (sections.includes('gamification')) {
        const { data: gamState } = await supabaseAdmin
          .from('user_gamification_state')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const { data: unlocks } = await supabaseAdmin
          .from('unlocks')
          .select('*')
          .eq('user_id', user.id);

        exportData.gamification = {
          state: gamState,
          unlocks: unlocks || [],
        };
      }

      // ── Upload to Supabase Storage ────────────────────────────
      const jsonContent = JSON.stringify(exportData, null, 2);
      const filePath = `exports/${user.id}/${exportRecord.id}.json`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('data-exports')
        .upload(filePath, jsonContent, {
          contentType: 'application/json',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Update export record
      const fileSize = new TextEncoder().encode(jsonContent).length;
      await supabaseAdmin
        .from('data_exports')
        .update({
          status: 'completed',
          file_path: filePath,
          file_size_bytes: fileSize,
          completed_at: new Date().toISOString(),
        })
        .eq('id', exportRecord.id);

      // Log event
      await supabaseAdmin.from('event_log').insert({
        user_id: user.id,
        event_type: 'data_export',
        params: { export_id: exportRecord.id, sections, format, file_size_bytes: fileSize },
      });

      return new Response(JSON.stringify({
        export_id: exportRecord.id,
        status: 'completed',
        file_size_bytes: fileSize,
        sections,
        message: 'Export ready for download',
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } catch (gatherError) {
      // Mark export as failed
      await supabaseAdmin
        .from('data_exports')
        .update({
          status: 'failed',
          error_message: gatherError.message,
        })
        .eq('id', exportRecord.id);

      throw gatherError;
    }
  } catch (err) {
    console.error('[data-export] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
