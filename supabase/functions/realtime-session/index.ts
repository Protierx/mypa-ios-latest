/**
 * Realtime Session Edge Function
 *
 * Returns an ephemeral client secret for the OpenAI Realtime API.
 * Client uses this key to connect via WebSocket/WebRTC — API key stays on server.
 *
 * Docs: https://platform.openai.com/docs/guides/realtime#generating-ephemeral-api-keys
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CORS_HEADERS, MYPA_SYSTEM_PROMPT, ACTION_TOOLS } from '../_shared/config.ts'

/** Transform Chat Completions tool format to Realtime API format (name/description/parameters at top level) */
function toRealtimeTools(tools: typeof ACTION_TOOLS) {
  return tools.map((t) => ({
    type: 'function' as const,
    name: t.function.name,
    description: t.function.description,
    parameters: t.function.parameters,
  }))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
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

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Parse optional body for voice preference
    let voice = 'shimmer'
    try {
      if (req.method === 'POST' && req.headers.get('Content-Type')?.includes('application/json')) {
        const body = await req.json().catch(() => ({}))
        if (body.voice && ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(body.voice)) {
          voice = body.voice
        }
      }
    } catch {
      // Ignore, use default voice
    }

    const sessionConfig = {
      model: 'gpt-4o-realtime-preview',
      voice: voice,
      instructions: MYPA_SYSTEM_PROMPT,
      tools: toRealtimeTools(ACTION_TOOLS),
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'whisper-1',
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 1500,
      },
    }

    console.log('[realtime-session] Calling OpenAI /v1/realtime/sessions (beta)')

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
      },
      body: JSON.stringify(sessionConfig),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[realtime-session] OpenAI error:', errText)
      return new Response(
        JSON.stringify({ error: 'Failed to create realtime session', details: errText }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const ephemeralKey = data.client_secret?.value || data.value
    if (!ephemeralKey) {
      console.error('[realtime-session] Unexpected response shape:', JSON.stringify(data))
      return new Response(
        JSON.stringify({ error: 'No ephemeral key in response' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ value: ephemeralKey }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[realtime-session] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
