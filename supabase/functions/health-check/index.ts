// @ts-nocheck — Deno edge function; not type-checked by Node/TS
/**
 * Health Check Edge Function
 *
 * Reports system health and connectivity for all integrations.
 * Used by monitoring dashboards and the client-side integration status page.
 *
 * GET /health-check  → full health report (authenticated)
 * GET /health-check?quick=true  → lightweight ping (no auth required)
 *
 * Reference: IMPLEMENTATION_PLAN monitoring
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS, withTimeout } from '../_shared/config.ts';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency_ms: number | null;
  message?: string;
  checked_at: string;
}

async function checkService(
  name: string,
  checkFn: () => Promise<{ ok: boolean; message?: string }>,
  timeoutMs = 5000,
): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const result = await withTimeout(checkFn(), timeoutMs, `${name} timeout`);
    return {
      name,
      status: result.ok ? 'healthy' : 'degraded',
      latency_ms: Date.now() - start,
      message: result.message,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name,
      status: 'down',
      latency_ms: Date.now() - start,
      message: err.message,
      checked_at: new Date().toISOString(),
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const isQuick = url.searchParams.get('quick') === 'true';

  // ── Quick ping (no auth) ────────────────────────────────────
  if (isQuick) {
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: Deno.env.get('ENVIRONMENT') || 'production',
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── Full health check (authenticated) ─────────────────────────
  try {
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

    // Run all health checks in parallel
    const checks = await Promise.all([
      // 1. Supabase Database
      checkService('supabase_database', async () => {
        const { count, error } = await supabaseClient
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('id', user.id);
        return { ok: !error, message: error?.message };
      }),

      // 2. Supabase Storage
      checkService('supabase_storage', async () => {
        const { data, error } = await supabaseClient.storage
          .from('tts-cache')
          .list('', { limit: 1 });
        return { ok: !error, message: error?.message };
      }),

      // 3. OpenAI API
      checkService('openai_api', async () => {
        const apiKey = Deno.env.get('OPENAI_API_KEY');
        if (!apiKey) return { ok: false, message: 'API key not configured' };

        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        return {
          ok: response.ok,
          message: response.ok ? 'Connected' : `HTTP ${response.status}`,
        };
      }),

      // 4. ElevenLabs API
      checkService('elevenlabs_api', async () => {
        const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
        if (!apiKey) return { ok: false, message: 'API key not configured' };

        const response = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': apiKey },
        });
        return {
          ok: response.ok,
          message: response.ok ? 'Connected' : `HTTP ${response.status}`,
        };
      }),

      // 5. RevenueCat API
      checkService('revenucat_api', async () => {
        const apiKey = Deno.env.get('REVENUCAT_API_KEY');
        if (!apiKey) return { ok: false, message: 'API key not configured' };

        const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        // 404 is OK — just means no subscriber record
        return {
          ok: response.ok || response.status === 404,
          message: response.ok ? 'Connected' : response.status === 404 ? 'Connected (no subscription)' : `HTTP ${response.status}`,
        };
      }),

      // 6. Expo Push API
      checkService('expo_push', async () => {
        const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [] }),
        });
        return { ok: response.ok, message: response.ok ? 'Connected' : `HTTP ${response.status}` };
      }),
    ]);

    // Compute overall status
    const hasDown = checks.some(c => c.status === 'down');
    const hasDegraded = checks.some(c => c.status === 'degraded');
    const overallStatus = hasDown ? 'degraded' : hasDegraded ? 'degraded' : 'healthy';

    return new Response(JSON.stringify({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: Deno.env.get('ENVIRONMENT') || 'production',
      services: checks,
      summary: {
        total: checks.length,
        healthy: checks.filter(c => c.status === 'healthy').length,
        degraded: checks.filter(c => c.status === 'degraded').length,
        down: checks.filter(c => c.status === 'down').length,
      },
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[health-check] Error:', err);
    return new Response(JSON.stringify({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
