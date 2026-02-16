// @ts-nocheck — Deno edge function; not type-checked by Node/TS
/**
 * Voice Command Processing Edge Function
 *
 * PRD 4.7 Action System Contract:
 * - Uses GPT function calling (tool_use) instead of regex-based intent parsing
 * - Mutation actions return ActionJSON for client-side execution (rule 8)
 * - Query actions execute server-side reads and return results
 * - Capability-based model routing via _shared/config.ts (rule 12)
 * - Returns confidence, model_used, tokens_used for event logging (PRD 4.8)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  MODEL_CONFIG,
  ACTION_TOOLS,
  MYPA_SYSTEM_PROMPT,
  CORS_HEADERS,
  CONFIRMATION_REQUIRED_ACTIONS,
  QUERY_ACTIONS,
  OPENAI_TIMEOUT_MS,
  withTimeout,
} from '../_shared/config.ts'
import { isolateVoice } from '../voice-isolate/index.ts'

// ============================================================================
// Whisper STT
// ============================================================================

async function transcribeAudio(audioBase64: string): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) throw new Error('OpenAI API key not configured')

  console.log('[voice-command] Transcribing audio, base64 length:', audioBase64.length)

  const binaryString = atob(audioBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  // Whisper API supports: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
  // iOS expo-av records as m4a/AAC; use .m4a extension so Whisper accepts it
  const audioBlob = new Blob([bytes], { type: 'audio/mp4' })

  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.m4a')
  formData.append('model', 'whisper-1')
  // Don't force language - let Whisper auto-detect for better accuracy
  // formData.append('language', 'en')

  const response = await withTimeout(
    fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}` },
      body: formData,
    }),
    OPENAI_TIMEOUT_MS,
    'Speech transcription timed out'
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('[voice-command] Whisper error:', error)
    throw new Error(`Whisper API error: ${error}`)
  }

  const result = await response.json()
  console.log('[voice-command] Transcription result:', result.text?.substring(0, 100) || '(empty)')
  return result.text || ''
}

// ============================================================================
// Query Handlers (read-only, safe to execute server-side)
// ============================================================================

interface QueryResult {
  response_text: string
  data: Record<string, unknown>
}

async function handleQueryAction(
  actionName: string,
  params: Record<string, unknown>,
  userId: string,
  supabaseClient: ReturnType<typeof createClient>,
): Promise<QueryResult> {
  switch (actionName) {
    case 'query_tasks': {
      const dateParam = (params.date as string) || 'today'
      const today = new Date()
      let startDate: Date
      let endDate: Date

      if (dateParam.toLowerCase().includes('tomorrow')) {
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() + 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
      } else {
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date()
        endDate.setHours(23, 59, 59, 999)
      }

      const { data: tasks } = await supabaseClient
        .from('tasks')
        .select('title, priority, due_date')
        .eq('user_id', userId)
        .gte('due_date', startDate.toISOString())
        .lte('due_date', endDate.toISOString())
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(10)

      const label = dateParam.toLowerCase().includes('tomorrow') ? 'tomorrow' : 'today'

      if (!tasks || tasks.length === 0) {
        return {
          response_text: label === 'tomorrow'
            ? "Tomorrow's looking clear! Nothing scheduled yet."
            : "You're all clear for today! Nice work.",
          data: { tasks: [], timeframe: label },
        }
      }

      if (tasks.length === 1) {
        return {
          response_text: `Just one thing ${label}: ${tasks[0].title}.`,
          data: { tasks, timeframe: label },
        }
      }

      const taskList = tasks.map(t => t.title).join(', ')
      return {
        response_text: `You've got ${tasks.length} things ${label}: ${taskList}.`,
        data: { tasks, timeframe: label },
      }
    }

    case 'query_schedule': {
      const dateParam = (params.date as string) || 'today'
      const range = (params.range as string) || 'day'
      const today = new Date()
      let startDate = new Date(today)
      startDate.setHours(0, 0, 0, 0)
      let endDate = new Date(today)

      if (range === 'week') {
        endDate.setDate(endDate.getDate() + 7)
      }
      endDate.setHours(23, 59, 59, 999)

      if (dateParam.toLowerCase().includes('tomorrow')) {
        startDate.setDate(startDate.getDate() + 1)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
      }

      const { data: tasks } = await supabaseClient
        .from('tasks')
        .select('title, due_date, priority, estimated_duration')
        .eq('user_id', userId)
        .gte('due_date', startDate.toISOString())
        .lte('due_date', endDate.toISOString())
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(10)

      if (!tasks || tasks.length === 0) {
        return {
          response_text: "Your schedule is clear! Enjoy the free time.",
          data: { tasks: [], range },
        }
      }

      const taskList = tasks.map(t => t.title).join(', ')
      return {
        response_text: `Here's what's coming up: ${taskList}. That's ${tasks.length} items.`,
        data: { tasks, range },
      }
    }

    case 'query_stats': {
      const metric = (params.metric as string) || 'all'
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('xp, level, streak_current, streak_longest')
        .eq('id', userId)
        .single()

      if (!profile) {
        return { response_text: "I couldn't pull up your stats right now.", data: {} }
      }

      switch (metric) {
        case 'streak':
          if (profile.streak_current > 0) {
            const bestNote = profile.streak_current >= profile.streak_longest
              ? "That's your best yet!"
              : `Your record is ${profile.streak_longest} days.`
            return {
              response_text: `You're on a ${profile.streak_current} day streak! ${bestNote}`,
              data: { profile },
            }
          }
          return { response_text: "No streak yet. Complete a task today to start one!", data: { profile } }
        case 'xp':
          return { response_text: `You've got ${profile.xp} XP total.`, data: { profile } }
        case 'level':
          return { response_text: `You're level ${profile.level}.`, data: { profile } }
        default:
          return {
            response_text: `Level ${profile.level}, ${profile.xp} XP, ${profile.streak_current} day streak. Keep it up!`,
            data: { profile },
          }
      }
    }

    case 'query_circles': {
      const { data: memberships } = await supabaseClient
        .from('circle_members')
        .select('circle:circles(name, emoji)')
        .eq('user_id', userId)
        .limit(5)

      if (!memberships || memberships.length === 0) {
        return {
          response_text: "You're not in any circles yet. Want to create one?",
          data: { circles: [] },
        }
      }

      const names = memberships.map((m: any) => `${m.circle?.emoji || ''} ${m.circle?.name}`).join(', ')
      return {
        response_text: `You're in ${memberships.length} circle${memberships.length > 1 ? 's' : ''}: ${names}.`,
        data: { circles: memberships },
      }
    }

    default:
      return { response_text: "I'm not sure how to look that up.", data: {} }
  }
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json()
    let transcript = body.transcript
    const { audio, context, noise_isolation } = body

    // ── Voice isolation: clean noisy audio before STT ────────────────
    let processedAudio = audio
    if (audio && !transcript && noise_isolation) {
      try {
        console.log('[voice-command] Noise isolation enabled — isolating voice')
        processedAudio = await isolateVoice(audio, 'm4a')
        console.log('[voice-command] Voice isolation complete')
      } catch (err) {
        // Non-fatal: fall back to raw audio if isolation fails
        console.warn('[voice-command] Voice isolation failed, using raw audio:', err)
        processedAudio = audio
      }
    }

    // ── STT: Transcribe audio if provided ────────────────────────────
    if (processedAudio && !transcript) {
      try {
        transcript = await transcribeAudio(processedAudio)
      } catch (err) {
        console.error('Transcription error:', err)
        return new Response(
          JSON.stringify({ error: 'Failed to transcribe audio' }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'No transcript or audio provided' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // ── Auth ─────────────────────────────────────────────────────────
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

    // ── Rate Limiting ────────────────────────────────────────────────
    // Check if user is premium
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('is_premium, timezone')
      .eq('id', user.id)
      .single()

    if (!userProfile?.is_premium) {
      // Compute today's start in user's timezone (or UTC fallback)
      const tz = userProfile?.timezone || 'UTC'
      const nowDate = new Date()
      // Use a simple approach: get today at midnight in the user's perspective
      const todayStr = nowDate.toLocaleDateString('en-CA', { timeZone: tz }) // YYYY-MM-DD
      const todayStart = new Date(`${todayStr}T00:00:00Z`).toISOString()

      // Count today's voice commands
      const { count: dailyCount } = await supabaseClient
        .from('event_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_type', 'voice_command')
        .gte('created_at', todayStart)

      if ((dailyCount || 0) >= 10) {
        console.log(`[voice-command] User ${user.id} hit daily voice limit (${dailyCount}/10)`)
        return new Response(
          JSON.stringify({
            error: 'Daily voice limit reached',
            code: 'VOICE_LIMIT',
            daily_count: dailyCount,
            limit: 10,
          }),
          { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Burst rate limit: 60 requests per minute for all users
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
    const { count: minuteCount } = await supabaseClient
      .from('event_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event_type', 'voice_command')
      .gte('created_at', oneMinuteAgo)

    if ((minuteCount || 0) >= 60) {
      console.log(`[voice-command] User ${user.id} hit burst rate limit (${minuteCount}/min)`)
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please wait a moment.',
          code: 'RATE_LIMIT',
        }),
        { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // ── GPT Function Calling ─────────────────────────────────────────
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!

    console.log('[voice-command] Sending to GPT with', ACTION_TOOLS.length, 'tools, model:', MODEL_CONFIG.fast)
    console.log('[voice-command] Transcript:', transcript)

    const gptRequestBody = {
      model: MODEL_CONFIG.fast,
      messages: [
        { role: 'system', content: MYPA_SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
      tools: ACTION_TOOLS,
      tool_choice: 'auto',
      max_tokens: 300,
    }

    const gptResponse = await withTimeout(
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gptRequestBody),
      }),
      OPENAI_TIMEOUT_MS,
      'AI processing timed out'
    )

    if (!gptResponse.ok) {
      const errText = await gptResponse.text()
      console.error('OpenAI API error:', errText)
      throw new Error(`OpenAI API error: ${gptResponse.status}`)
    }

    const gptData = await gptResponse.json()
    const choice = gptData.choices?.[0]
    const usage = gptData.usage || {}
    const modelUsed = gptData.model || MODEL_CONFIG.fast
    let tokensUsed = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0)

    console.log('[voice-command] GPT response finish_reason:', choice?.finish_reason)
    console.log('[voice-command] Tool calls:', JSON.stringify(choice?.message?.tool_calls || 'none'))
    console.log('[voice-command] Message content:', choice?.message?.content?.substring(0, 100) || 'none')

    // ── Parse GPT Response ───────────────────────────────────────────
    let actionName = 'unknown'
    let actionParams: Record<string, unknown> = {}
    let responseText = ''
    let confidence = 0.5 // default for text-only responses

    const toolCalls = choice?.message?.tool_calls
    if (toolCalls && toolCalls.length > 0) {
      // GPT called a function -> structured action
      const toolCall = toolCalls[0]
      actionName = toolCall.function.name
      try {
        actionParams = JSON.parse(toolCall.function.arguments || '{}')
      } catch {
        actionParams = {}
      }
      confidence = 0.95 // function calls are high confidence

      // Generate a spoken response by asking GPT with the action context
      const confirmationRequired = CONFIRMATION_REQUIRED_ACTIONS.has(actionName)

      // For queries, execute server-side and include results
      if (QUERY_ACTIONS.has(actionName)) {
        const queryResult = await handleQueryAction(actionName, actionParams, user.id, supabaseClient)
        responseText = queryResult.response_text

        return new Response(
          JSON.stringify({
            success: true,
            transcript,
            action: {
              action: actionName,
              params: actionParams,
              confirmation_required: false,
              confidence,
            },
            response_text: responseText,
            model_used: modelUsed,
            tokens_used: tokensUsed,
            query_data: queryResult.data,
          }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      }

      // For mutations, generate a natural response but do NOT execute
      // The client ActionExecutor will handle execution (rule 8)
      // Use a shorter timeout for response generation since it's optional
      try {
        const responseGeneration = await withTimeout(
          fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: MODEL_CONFIG.fast,
              messages: [
                { role: 'system', content: MYPA_SYSTEM_PROMPT },
                { role: 'user', content: transcript },
                {
                  role: 'assistant',
                  content: null,
                  tool_calls: [{ id: toolCall.id, type: 'function', function: toolCall.function }],
                },
                {
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: confirmationRequired
                    ? JSON.stringify({ status: 'awaiting_confirmation', action: actionName, params: actionParams })
                    : JSON.stringify({ status: 'success', action: actionName, params: actionParams }),
                },
              ],
              max_tokens: 150,
            }),
          }),
          10000, // 10 second timeout for response generation
          'Response generation timed out'
        )

        if (responseGeneration.ok) {
          const respData = await responseGeneration.json()
          responseText = respData.choices?.[0]?.message?.content || ''
          const respUsage = respData.usage || {}
          // Add response generation tokens to total
          tokensUsed += (respUsage.prompt_tokens || 0) + (respUsage.completion_tokens || 0)
        }
      } catch (genErr) {
        console.warn('[voice-command] Response generation failed/timed out, using fallback:', genErr)
      }

      // Fallback response if generation failed
      if (!responseText) {
        if (confirmationRequired) {
          const taskName = (actionParams.task_name as string) || 'that'
          responseText = `I'll ${actionName.replace('_', ' ')} "${taskName}" - are you sure?`
        } else {
          responseText = "Done!"
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          transcript,
          action: {
            action: actionName,
            params: actionParams,
            confirmation_required: confirmationRequired,
            confidence,
          },
          response_text: responseText,
          model_used: modelUsed,
          tokens_used: tokensUsed,
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // ── No tool call: conversational/unknown ──────────────────────────
    // GPT responded with text only (no function call)
    responseText = choice?.message?.content || "I'm here! What can I help with?"

    return new Response(
      JSON.stringify({
        success: true,
        transcript,
        action: {
          action: 'unknown',
          params: {},
          confirmation_required: false,
          confidence,
        },
        response_text: responseText,
        model_used: modelUsed,
        tokens_used: tokensUsed,
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in voice-command:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
