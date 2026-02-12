/**
 * ElevenLabs Conversation Token Edge Function
 *
 * Returns a short-lived JWT conversation token for the ElevenLabs
 * Conversational AI agent. The @elevenlabs/react-native SDK passes this
 * token as `conversationToken` in `startSession()` to open a LiveKit-
 * backed WebRTC session.
 *
 * Why a JWT, not a signed URL?
 *   The React Native SDK internally parses the token with
 *   `atob(token.split('.')[1])` to extract the LiveKit room name.
 *   The `/v1/convai/conversation/get-signed-url` endpoint returns a wss://
 *   URL which the SDK cannot parse → we must use the `/conversation/token`
 *   endpoint instead.
 *
 * The ELEVENLABS_API_KEY never leaves the server.
 *
 * Docs: https://elevenlabs.io/docs/conversational-ai/guides/conversational-ai-sdk/react-native
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
    const agentId = Deno.env.get('ELEVENLABS_AGENT_ID')

    if (!apiKey) {
      console.error('[elevenlabs-token] ELEVENLABS_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    if (!agentId) {
      console.error('[elevenlabs-token] ELEVENLABS_AGENT_ID not configured')
      return new Response(
        JSON.stringify({ error: 'ElevenLabs Agent ID not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // ── 3. Request conversation token from ElevenLabs ─────────────────
    // The /conversation/token endpoint returns a JWT that the RN SDK
    // passes to LiveKit. The API key stays server-side.
    console.log(`[elevenlabs-token] Requesting conversation token for agent=${agentId}, user=${user.id}`)

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`

    const response = await withTimeout(
      fetch(elevenLabsUrl, {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }),
      ELEVENLABS_TIMEOUT_MS,
      'ElevenLabs token request timed out'
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[elevenlabs-token] ElevenLabs error (${response.status}):`, errText)
      return new Response(
        JSON.stringify({ error: 'Failed to get conversation token', details: errText }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const token = data.token

    if (!token) {
      console.error('[elevenlabs-token] Unexpected response shape:', JSON.stringify(data))
      return new Response(
        JSON.stringify({ error: 'No token in response' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[elevenlabs-token] Token obtained for user=${user.id}`)

    // ── 4. Return token to the client ─────────────────────────────────
    return new Response(
      JSON.stringify({ token }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[elevenlabs-token] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
