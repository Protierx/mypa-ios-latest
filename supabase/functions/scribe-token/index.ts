/**
 * Scribe Token Edge Function
 *
 * Returns a single-use token for the ElevenLabs Realtime Speech-to-Text
 * (Scribe v2 Realtime) API. The client connects directly to the Scribe
 * WebSocket with this token — no API key leaves the server.
 *
 * Token automatically expires after 15 minutes and is consumed on first use.
 *
 * Endpoint: POST /v1/single-use-token/realtime_scribe
 * Docs: https://elevenlabs.io/docs/api-reference/tokens/create
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CORS_HEADERS, withTimeout } from '../_shared/config.ts'

/** Timeout for ElevenLabs API call (10 seconds) */
const ELEVENLABS_TIMEOUT_MS = 10_000

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // ── 1. Authenticate via Supabase JWT ──────────────────────────────
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // ── 2. Validate server-side secrets ───────────────────────────────
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')

    if (!apiKey) {
      console.error('[scribe-token] ELEVENLABS_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // ── 3. Request single-use Scribe token from ElevenLabs ────────────
    console.log(`[scribe-token] Requesting Scribe token for user=${user.id}`)

    const response = await withTimeout(
      fetch('https://api.elevenlabs.io/v1/single-use-token/realtime_scribe', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
      }),
      ELEVENLABS_TIMEOUT_MS,
      'ElevenLabs Scribe token request timed out'
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[scribe-token] ElevenLabs error (${response.status}):`, errText)
      return new Response(
        JSON.stringify({ error: 'Failed to get Scribe token', details: errText }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const token = data.token

    if (!token) {
      console.error('[scribe-token] Unexpected response shape:', JSON.stringify(data))
      return new Response(
        JSON.stringify({ error: 'No token in response' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[scribe-token] Token obtained for user=${user.id}`)

    // ── 4. Return token to the client ─────────────────────────────────
    return new Response(
      JSON.stringify({ token }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[scribe-token] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
