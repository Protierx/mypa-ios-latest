/**
 * Text-to-Speech Edge Function — ElevenLabs TTS
 *
 * REST/discreet mode TTS path. Used when:
 * - The ElevenLabs Conversational AI session is NOT active (speak() fallback)
 * - Discreet mode text responses need audio playback
 * - Daily brief / greeting audio generation
 *
 * Caching: SHA-256 hash of (text + voice_id) → check Supabase Storage → serve from cache or generate.
 * Response format preserved: { audio: base64, format: 'mp3', voice: string }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CORS_HEADERS, TTS_TIMEOUT_MS, withTimeout } from '../_shared/config.ts'

// ── Default ElevenLabs voice (MYPA's primary voice from agent config) ─────
const DEFAULT_VOICE_ID = 'cjVigY5qzO86Huf0OWal'

// ── Cache bucket name ─────────────────────────────────────────────────────
const TTS_CACHE_BUCKET = 'tts-cache'

/**
 * Server-side time-of-day voice settings fallback (Step 17a).
 * Used when the client doesn't provide adaptive voice_settings.
 */
function getTimeOfDayVoiceSettings() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) {
    return { stability: 0.4, similarity_boost: 0.7, style: 0.6, use_speaker_boost: true }   // Energetic morning
  } else if (hour >= 12 && hour < 18) {
    return { stability: 0.5, similarity_boost: 0.75, style: 0.5, use_speaker_boost: true }  // Balanced afternoon
  } else {
    return { stability: 0.7, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true }   // Calm evening
  }
}

/**
 * Generate a SHA-256 hex hash for cache key.
 * Key = hash(text + voice_id) so same text with different voice is a cache miss.
 */
async function cacheKey(text: string, voiceId: string): Promise<string> {
  const data = new TextEncoder().encode(`${text}::${voiceId}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Convert ArrayBuffer to base64 string */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { text, voice, speed = 1.0, voice_settings } = await req.json()

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // ── Adaptive voice settings (Step 17) ────────────────────────
    // Client can pass voice_settings computed by AdaptiveVoiceService.
    // If not provided, compute server-side from time-of-day.
    const adaptiveSettings = voice_settings ?? getTimeOfDayVoiceSettings()

    // ── Validate secrets ────────────────────────────────────────────
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!apiKey) {
      console.error('[tts] ELEVENLABS_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Accept either an ElevenLabs voice ID or fall back to the default MYPA voice
    const selectedVoice = voice || DEFAULT_VOICE_ID

    // ── Check Supabase Storage cache ────────────────────────────────
    // Include voice settings in cache key — different moods produce different audio
    const settingsFingerprint = `${adaptiveSettings.stability}:${adaptiveSettings.style}`
    const hash = await cacheKey(`${text}::${settingsFingerprint}`, selectedVoice)
    const cachePath = `${hash}.mp3`

    // Use service role to read/write the cache bucket (public read, server write)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Try to serve from cache first
    const { data: cachedFile, error: cacheError } = await supabaseAdmin
      .storage
      .from(TTS_CACHE_BUCKET)
      .download(cachePath)

    if (cachedFile && !cacheError) {
      console.log(`[tts] Cache HIT: ${cachePath}`)
      const audioBuffer = await cachedFile.arrayBuffer()
      const base64Audio = arrayBufferToBase64(audioBuffer)

      return new Response(
        JSON.stringify({ audio: base64Audio, format: 'mp3', voice: selectedVoice }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[tts] Cache MISS: ${cachePath} — generating via ElevenLabs`)

    // ── Build pronunciation dictionary locators (if configured) ─────
    const dictId = Deno.env.get('PRONUNCIATION_DICT_ID')
    const dictVersion = Deno.env.get('PRONUNCIATION_DICT_VERSION_ID')
    const pronunciationLocators = dictId && dictVersion
      ? [{ pronunciation_dictionary_id: dictId, version_id: dictVersion }]
      : undefined

    if (pronunciationLocators) {
      console.log(`[tts] Using pronunciation dictionary: ${dictId} v${dictVersion}`)
    }

    // ── Call ElevenLabs TTS API ─────────────────────────────────────
    // POST /v1/text-to-speech/{voice_id}
    // Returns raw audio bytes in the requested format.
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}?output_format=mp3_44100_128`

    const response = await withTimeout(
      fetch(elevenLabsUrl, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_flash_v2',   // Optimized for low latency
          voice_settings: adaptiveSettings,
          ...(pronunciationLocators && { pronunciation_dictionary_locators: pronunciationLocators }),
        }),
      }),
      TTS_TIMEOUT_MS,
      'Text-to-speech generation timed out'
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[tts] ElevenLabs error (${response.status}):`, errText)
      return new Response(
        JSON.stringify({ error: 'TTS generation failed', details: errText }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // ── Read audio and cache it ─────────────────────────────────────
    const audioBuffer = await response.arrayBuffer()
    const base64Audio = arrayBufferToBase64(audioBuffer)

    // Write to cache in the background (don't block the response)
    // Fire-and-forget: if caching fails, the audio still returns to the client.
    supabaseAdmin.storage
      .from(TTS_CACHE_BUCKET)
      .upload(cachePath, new Uint8Array(audioBuffer), {
        contentType: 'audio/mpeg',
        upsert: true,
      })
      .then(({ error }) => {
        if (error) console.error(`[tts] Cache write failed for ${cachePath}:`, error.message)
        else console.log(`[tts] Cached: ${cachePath} (${audioBuffer.byteLength} bytes)`)
      })

    // ── Return same format as before so speak() still works ─────────
    return new Response(
      JSON.stringify({ audio: base64Audio, format: 'mp3', voice: selectedVoice }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[tts] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
