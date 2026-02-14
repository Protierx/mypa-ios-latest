/**
 * Pronunciation Dictionary Edge Function
 *
 * Manages MYPA's pronunciation dictionary on ElevenLabs using the JSON rules API.
 *
 * POST /pronunciation-dict — Create the dictionary with MYPA pronunciation rules.
 *   Returns { dictionary_id, version_id } which should be set as Supabase secrets:
 *     PRONUNCIATION_DICT_ID, PRONUNCIATION_DICT_VERSION_ID
 *
 * The text-to-speech edge function reads those secrets and includes
 * pronunciation_dictionary_locators in every ElevenLabs TTS request.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { CORS_HEADERS, MYPA_PRONUNCIATION_RULES } from '../_shared/config.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // ── Check if we already have a dictionary to update ───────────
    const existingDictId = Deno.env.get('PRONUNCIATION_DICT_ID')

    if (existingDictId) {
      // ── Update existing dictionary with rules ─────────────────
      console.log(`[pronunciation-dict] Updating existing dictionary: ${existingDictId}`)

      const response = await fetch(
        `https://api.elevenlabs.io/v1/pronunciation-dictionaries/${existingDictId}/add-rules`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rules: MYPA_PRONUNCIATION_RULES }),
        }
      )

      if (!response.ok) {
        const errText = await response.text()
        console.error(`[pronunciation-dict] Update failed (${response.status}):`, errText)

        if (response.status === 404) {
          console.log('[pronunciation-dict] Dictionary not found, creating new one...')
          // Fall through to create
        } else {
          return new Response(
            JSON.stringify({ error: 'Failed to update dictionary', details: errText }),
            { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        const result = await response.json()
        console.log('[pronunciation-dict] Updated successfully:', result)

        return new Response(
          JSON.stringify({
            action: 'updated',
            dictionary_id: result.id ?? existingDictId,
            version_id: result.version_id,
            instructions: `supabase secrets set PRONUNCIATION_DICT_VERSION_ID=${result.version_id}`,
          }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ── Create new pronunciation dictionary from rules ───────────
    console.log('[pronunciation-dict] Creating new pronunciation dictionary...')

    const response = await fetch(
      'https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-rules',
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'MYPA Pronunciation Dictionary',
          description: 'Custom pronunciation rules for MYPA app terminology',
          rules: MYPA_PRONUNCIATION_RULES,
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[pronunciation-dict] Create failed (${response.status}):`, errText)
      return new Response(
        JSON.stringify({ error: 'Failed to create dictionary', details: errText }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    console.log('[pronunciation-dict] Created successfully:', result)

    return new Response(
      JSON.stringify({
        action: 'created',
        dictionary_id: result.id,
        version_id: result.version_id,
        rules_count: result.version_rules_num,
        instructions: [
          `supabase secrets set PRONUNCIATION_DICT_ID=${result.id}`,
          `supabase secrets set PRONUNCIATION_DICT_VERSION_ID=${result.version_id}`,
        ].join('\n'),
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[pronunciation-dict] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
