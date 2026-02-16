// @ts-nocheck — Deno edge function; not type-checked by Node/TS
/**
 * Voice Isolation Edge Function — ElevenLabs Audio Isolation API
 *
 * Cleans the user's audio in noisy environments (coffee shops, commute, gym)
 * before STT processing, dramatically improving transcription accuracy.
 *
 * Flow:
 *   Client sends base64 audio → this function isolates voice → returns cleaned base64 audio
 *   OR: voice-command calls this internally before Whisper STT
 *
 * ElevenLabs Audio Isolation API:
 *   POST https://api.elevenlabs.io/v1/audio-isolation
 *   Body: multipart/form-data with audio file
 *   Returns: cleaned audio stream (same format)
 *
 * Usage:
 *   POST /functions/v1/voice-isolate
 *   Body: { audio: "<base64-encoded-audio>", format?: "m4a" }
 *   Response: { audio: "<base64-cleaned-audio>", isolated: true }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { CORS_HEADERS, withTimeout } from '../_shared/config.ts'

/** Timeout for ElevenLabs Audio Isolation API (20s — processing can be slow) */
const ISOLATION_TIMEOUT_MS = 20_000

/** Convert ArrayBuffer to base64 string */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Core isolation logic — takes base64 audio, returns base64 cleaned audio.
 * Exported so voice-command can call it directly without an HTTP round-trip.
 */
export async function isolateVoice(
  audioBase64: string,
  format: string = 'm4a',
): Promise<string> {
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured')
  }

  // Decode base64 → binary
  const binaryString = atob(audioBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Determine MIME type from format
  const mimeMap: Record<string, string> = {
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    mp4: 'audio/mp4',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
  }
  const mimeType = mimeMap[format] || 'audio/mp4'

  const audioBlob = new Blob([bytes], { type: mimeType })

  // Build multipart form data for ElevenLabs Audio Isolation API
  const formData = new FormData()
  formData.append('audio', audioBlob, `audio.${format}`)

  console.log(`[voice-isolate] Sending ${bytes.length} bytes (${format}) for isolation`)

  const response = await withTimeout(
    fetch('https://api.elevenlabs.io/v1/audio-isolation', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    }),
    ISOLATION_TIMEOUT_MS,
    'Voice isolation timed out',
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[voice-isolate] ElevenLabs API error:', response.status, errorText)
    throw new Error(`Voice isolation failed: ${response.status} ${errorText}`)
  }

  // ElevenLabs returns the cleaned audio as a binary stream
  const cleanedBuffer = await response.arrayBuffer()
  const cleanedBase64 = arrayBufferToBase64(cleanedBuffer)

  console.log(`[voice-isolate] Isolated audio: ${cleanedBuffer.byteLength} bytes`)

  return cleanedBase64
}

// ============================================================================
// HTTP Handler
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { audio, format = 'm4a' } = await req.json()

    if (!audio) {
      return new Response(
        JSON.stringify({ error: 'No audio provided' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    const cleanedAudio = await isolateVoice(audio, format)

    return new Response(
      JSON.stringify({
        audio: cleanedAudio,
        format,
        isolated: true,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('[voice-isolate] Error:', err)

    const message = err instanceof Error ? err.message : 'Voice isolation failed'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }
})
