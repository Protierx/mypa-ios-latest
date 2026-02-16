/**
 * Notifications API Edge Function
 *
 * Routes:
 *   GET  /notifications-api              → list (filtered, paginated)
 *   POST /notifications-api/read/:id     → mark single read
 *   POST /notifications-api/read-all     → mark all read (optionally by tab)
 *   POST /notifications-api/delete/:id   → soft-delete single
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/config.ts';

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Auth — create user-scoped client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/notifications-api/, '') || '/';

  try {
    // ── GET / — List notifications ──────────────────────────────────
    if (req.method === 'GET' && (path === '/' || path === '')) {
      const tab = url.searchParams.get('tab') || 'all';
      const cursor = url.searchParams.get('cursor'); // ISO timestamp
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '30', 10), 100);

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by category tab
      if (tab !== 'all') {
        query = query.eq('category', tab);
      }

      // Cursor-based pagination
      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Unread counts (all tabs) — single query with group by
      const { data: countData, error: countError } = await supabase
        .rpc('get_notification_unread_counts', { p_user_id: user.id });

      // Fallback if RPC doesn't exist: calculate from data
      let unreadCounts = { all: 0, social: 0, tasks: 0, system: 0 };
      if (!countError && countData) {
        unreadCounts = countData;
      } else {
        // Fallback: count via separate queries
        const { count: allCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .is('read_at', null);

        const { count: socialCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('category', 'social')
          .is('deleted_at', null)
          .is('read_at', null);

        const { count: tasksCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('category', 'tasks')
          .is('deleted_at', null)
          .is('read_at', null);

        const { count: systemCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('category', 'system')
          .is('deleted_at', null)
          .is('read_at', null);

        unreadCounts = {
          all: allCount ?? 0,
          social: socialCount ?? 0,
          tasks: tasksCount ?? 0,
          system: systemCount ?? 0,
        };
      }

      const nextCursor = data && data.length === limit
        ? data[data.length - 1].created_at
        : null;

      return new Response(
        JSON.stringify({ ok: true, data, nextCursor, unreadCounts }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // ── POST /read/:id — Mark single notification read ──────────────
    const readMatch = path.match(/^\/read\/([a-f0-9-]+)$/i);
    if (req.method === 'POST' && readMatch) {
      const id = readMatch[1];
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // ── POST /read-all — Mark all read (optionally by tab) ──────────
    if (req.method === 'POST' && path === '/read-all') {
      const body = await req.json().catch(() => ({}));
      const tab = body.tab || 'all';

      let query = supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null)
        .is('deleted_at', null);

      if (tab !== 'all') {
        query = query.eq('category', tab);
      }

      const { error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // ── POST /delete/:id — Soft-delete notification ─────────────────
    const deleteMatch = path.match(/^\/delete\/([a-f0-9-]+)$/i);
    if (req.method === 'POST' && deleteMatch) {
      const id = deleteMatch[1];
      const { error } = await supabase
        .from('notifications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // ── 404 — Unknown route ─────────────────────────────────────────
    return new Response(
      JSON.stringify({ ok: false, error: 'Not found' }),
      { status: 404, headers: JSON_HEADERS }
    );
  } catch (err) {
    console.error('notifications-api error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
});
