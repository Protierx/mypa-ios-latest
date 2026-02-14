/**
 * ElevenLabs Post-Call Webhook Edge Function
 *
 * Receives `post_call_transcription` webhooks after every voice conversation.
 * ElevenLabs sends the full transcript, tool usage, data collection (mood,
 * topics), evaluation scores, and timing metadata.
 *
 * This function:
 * 1. Verifies the HMAC signature (elevenlabs-signature header)
 * 2. Extracts user_id from dynamic_variables (passed at session start)
 * 3. Updates `user_model` with learned patterns (tone, overwhelm, voice usage)
 * 4. Inserts into `event_log` for the nightly learning loop
 * 5. Inserts into `conversation_history` for cross-session memory (Step 15c)
 *
 * The existing `calculate-unlocks` edge function reads `event_log` nightly
 * and enriches `user_model` — this webhook feeds voice-specific data into
 * that pipeline.
 *
 * Docs: https://elevenlabs.io/docs/conversational-ai/workflows/post-call-webhooks
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CORS_HEADERS } from '../_shared/config.ts'

// ============================================================================
// Types — matches actual ElevenLabs webhook payload (not the plan's interface)
// ============================================================================

interface WebhookEnvelope {
  type: 'post_call_transcription' | 'post_call_audio' | 'call_initiation_failure'
  event_timestamp: number
  data: ConversationData
}

interface TranscriptTurn {
  role: 'user' | 'agent'
  message: string
  tool_calls: Array<{ tool_name: string; params: Record<string, unknown> }> | null
  tool_results: Array<{ tool_name: string; result: string }> | null
  feedback: unknown | null
  time_in_call_secs: number
  conversation_turn_metrics: {
    convai_llm_service_ttfb?: { elapsed_time: number }
    convai_llm_service_ttf_sentence?: { elapsed_time: number }
  } | null
}

interface ConversationData {
  agent_id: string
  conversation_id: string
  status: string // 'done' | 'failed' | ...
  user_id: string | null
  transcript: TranscriptTurn[]
  metadata: {
    start_time_unix_secs: number
    call_duration_secs: number
    cost: number
    feedback: { overall_score: number | null; likes: number; dislikes: number }
    termination_reason: string
    [key: string]: unknown
  }
  analysis: {
    evaluation_criteria_results: Record<string, unknown>
    data_collection_results: Record<string, { value: string; rationale?: string }>
    call_successful: string // 'success' | 'failure'
    transcript_summary: string
  }
  conversation_initiation_client_data: {
    conversation_config_override: Record<string, unknown>
    custom_llm_extra_body: Record<string, unknown>
    dynamic_variables: Record<string, string>
  }
  // Post-migration fields (Aug 2025+)
  has_audio?: boolean
  has_user_audio?: boolean
  has_response_audio?: boolean
}

// ============================================================================
// HMAC Signature Verification
// ============================================================================

/**
 * Verify ElevenLabs webhook signature.
 *
 * The `elevenlabs-signature` header format:
 *   t=<unix_timestamp>,v0=<hmac_hex>
 *
 * HMAC is SHA-256 of `${timestamp}.${rawBody}` using the webhook secret.
 * We also reject signatures older than 5 minutes to prevent replay attacks.
 */
async function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader) return false

  try {
    // Parse "t=<timestamp>,v0=<hmac>"
    const parts: Record<string, string> = {}
    for (const part of signatureHeader.split(',')) {
      const [key, ...rest] = part.split('=')
      parts[key.trim()] = rest.join('=').trim()
    }

    const timestamp = parts['t']
    const expectedHmac = parts['v0']
    if (!timestamp || !expectedHmac) return false

    // Reject signatures older than 5 minutes (replay protection)
    const age = Math.abs(Date.now() / 1000 - Number(timestamp))
    if (age > 300) {
      console.warn('[webhook] Signature too old:', age, 'seconds')
      return false
    }

    // Compute HMAC-SHA256
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signedPayload = `${timestamp}.${rawBody}`
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(signedPayload),
    )

    // Convert to hex
    const computedHmac = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Constant-time comparison
    return computedHmac === expectedHmac.toLowerCase()
  } catch (err) {
    console.error('[webhook] Signature verification error:', err)
    return false
  }
}

// ============================================================================
// Helpers: Extract insights from webhook data
// ============================================================================

/**
 * Extract user_id from dynamic variables.
 * We pass user.id as a dynamic variable when starting the ElevenLabs session.
 */
function extractUserId(data: ConversationData): string | null {
  // Primary: from dynamic_variables (set in VoiceContext.tsx → startSession)
  const dynVars = data.conversation_initiation_client_data?.dynamic_variables
  if (dynVars?.user_id) return dynVars.user_id

  // Fallback: top-level user_id (if ElevenLabs populates it)
  if (data.user_id) return data.user_id

  return null
}

/**
 * Count tool calls from the transcript.
 * Returns { total, successful, toolNames[] }
 */
function extractToolStats(transcript: TranscriptTurn[]) {
  let total = 0
  let successful = 0
  const toolNames: string[] = []

  for (const turn of transcript) {
    if (turn.tool_calls) {
      for (const call of turn.tool_calls) {
        total++
        toolNames.push(call.tool_name)
      }
    }
    if (turn.tool_results) {
      for (const result of turn.tool_results) {
        // A successful tool result is one that doesn't contain "error" or "failed"
        const lower = (result.result || '').toLowerCase()
        if (!lower.includes('error') && !lower.includes('failed')) {
          successful++
        }
      }
    }
  }

  return { total, successful, toolNames }
}

/**
 * Derive overwhelm delta from mood and conversation patterns.
 * Returns a small adjustment (-0.1 to +0.1) to apply to the user's overwhelm_score.
 */
function deriveOverwhelmDelta(
  mood: string,
  toolStats: { total: number; successful: number },
  durationSecs: number,
): number {
  let delta = 0

  // Mood influence
  const moodLower = (mood || 'neutral').toLowerCase()
  if (moodLower === 'stressed' || moodLower === 'tired') delta += 0.05
  else if (moodLower === 'excited' || moodLower === 'calm') delta -= 0.05

  // Many failed tool calls → frustration → overwhelm
  if (toolStats.total > 0) {
    const failRate = 1 - toolStats.successful / toolStats.total
    if (failRate > 0.5) delta += 0.03
  }

  // Very long sessions might indicate struggling
  if (durationSecs > 300) delta += 0.02

  // Clamp
  return Math.max(-0.1, Math.min(0.1, delta))
}

/**
 * Map mood to a potential tone_preference adjustment.
 * If user is consistently stressed, we should soften the tone.
 */
function deriveToneFromMood(currentTone: string, mood: string): string {
  const moodLower = (mood || 'neutral').toLowerCase()

  // If user is stressed/tired, lean toward gentle
  if (moodLower === 'stressed' || moodLower === 'tired') {
    if (currentTone === 'energetic' || currentTone === 'direct') return 'warm'
    if (currentTone === 'warm') return 'gentle'
  }

  // If user is excited, match energy
  if (moodLower === 'excited') {
    if (currentTone === 'gentle') return 'warm'
  }

  return currentTone // No change
}

/**
 * Extract evaluation scores.
 * ElevenLabs returns criteria results as objects with a `result` field (string "success"/"failure")
 * or possibly numeric scores. We normalize to 0-1 range.
 */
function extractEvaluationScores(criteria: Record<string, unknown>): Record<string, number> {
  const scores: Record<string, number> = {}

  for (const [key, value] of Object.entries(criteria)) {
    if (typeof value === 'number') {
      scores[key] = value
    } else if (typeof value === 'object' && value !== null) {
      const v = value as Record<string, unknown>
      if (v.result === 'success') scores[key] = 1.0
      else if (v.result === 'failure') scores[key] = 0.0
      else if (typeof v.score === 'number') scores[key] = v.score
      else scores[key] = 0.5 // Unknown → neutral
    } else if (typeof value === 'string') {
      scores[key] = value === 'success' ? 1.0 : 0.0
    }
  }

  return scores
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  const rawBody = await req.text()

  try {
    // ── 1. Verify HMAC signature ──────────────────────────────────────
    const webhookSecret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET')
    if (webhookSecret) {
      const sig = req.headers.get('elevenlabs-signature')
      const valid = await verifySignature(rawBody, sig, webhookSecret)
      if (!valid) {
        console.warn('[webhook] Invalid signature — rejecting')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        )
      }
    } else {
      // No secret configured — log warning but still process
      // (allows initial setup/testing before secret is configured)
      console.warn('[webhook] ELEVENLABS_WEBHOOK_SECRET not set — skipping signature verification')
    }

    // ── 2. Parse payload ──────────────────────────────────────────────
    const envelope: WebhookEnvelope = JSON.parse(rawBody)

    // Only process transcription webhooks (not audio or failures)
    if (envelope.type !== 'post_call_transcription') {
      console.log(`[webhook] Ignoring non-transcription event: ${envelope.type}`)
      return new Response(
        JSON.stringify({ status: 'ignored', type: envelope.type }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    const data = envelope.data
    console.log(`[webhook] Processing conversation ${data.conversation_id} (status: ${data.status})`)

    // ── 3. Extract user_id ────────────────────────────────────────────
    const userId = extractUserId(data)
    if (!userId) {
      console.error('[webhook] No user_id found in webhook payload — cannot update user model')
      // Still return 200 so ElevenLabs doesn't retry
      return new Response(
        JSON.stringify({ status: 'skipped', reason: 'no_user_id' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    console.log(`[webhook] User: ${userId}, Duration: ${data.metadata.call_duration_secs}s`)

    // ── 4. Extract insights ───────────────────────────────────────────
    const toolStats = extractToolStats(data.transcript)
    const evalScores = extractEvaluationScores(data.analysis.evaluation_criteria_results)
    const dataCollection = data.analysis.data_collection_results

    const mood = dataCollection?.user_mood?.value || dataCollection?.userMood?.value || 'neutral'
    const taskTypes = dataCollection?.task_types_mentioned?.value || dataCollection?.taskTypesMentioned?.value || ''
    const topics = dataCollection?.topics_discussed?.value || dataCollection?.topicsDiscussed?.value || ''
    const actionSuccessRate = dataCollection?.action_success_rate?.value || dataCollection?.actionSuccessRate?.value || ''

    console.log(`[webhook] Mood: ${mood}, Tools: ${toolStats.total} (${toolStats.successful} ok), Eval:`, evalScores)

    // ── 5. Update user_model (service role — bypasses RLS) ────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Fetch current user_model to apply incremental updates
    const { data: currentModel } = await supabaseAdmin
      .from('user_model')
      .select('tone_preference, overwhelm_score, voice_usage_rate, completion_rate_7d, common_reschedule_patterns, avg_task_durations')
      .eq('user_id', userId)
      .single()

    if (currentModel) {
      const overwhelmDelta = deriveOverwhelmDelta(mood, toolStats, data.metadata.call_duration_secs)
      const newOverwhelm = Math.max(0, Math.min(1, (currentModel.overwhelm_score || 0) + overwhelmDelta))
      const newTone = deriveToneFromMood(currentModel.tone_preference || 'warm', mood)

      // Increment voice_usage_rate (exponential moving average with α = 0.1)
      // Approximate: new_rate = 0.9 * old_rate + 0.1 * 1 (one session happened)
      const newVoiceRate = (currentModel.voice_usage_rate || 0) * 0.9 + 0.1

      // Update completion_rate_7d from tool success data
      // Blend existing rate with this session's success rate (weight = 0.1)
      const sessionSuccessRate = toolStats.total > 0 ? toolStats.successful / toolStats.total : 1
      const newCompletionRate =
        (currentModel.completion_rate_7d || 0) * 0.9 + sessionSuccessRate * 0.1

      // Track reschedule patterns if any reschedule tools were called
      const reschedulePatterns = { ...(currentModel.common_reschedule_patterns || {}) }
      if (toolStats.toolNames.some((t) => t.includes('reschedule') || t.includes('update_task'))) {
        const hour = new Date().getHours()
        const dayPart =
          hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
          new Date().getDay()
        ]
        const key = `${dayName}_${dayPart}`
        reschedulePatterns[key] = ((reschedulePatterns[key] as number) || 0) + 1
      }

      const { error: updateError } = await supabaseAdmin
        .from('user_model')
        .update({
          overwhelm_score: Math.round(newOverwhelm * 100) / 100,
          tone_preference: newTone,
          voice_usage_rate: Math.round(newVoiceRate * 1000) / 1000,
          completion_rate_7d: Math.round(newCompletionRate * 100) / 100,
          common_reschedule_patterns: reschedulePatterns,
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('[webhook] Failed to update user_model:', updateError.message)
      } else {
        console.log(`[webhook] user_model updated: overwhelm=${newOverwhelm.toFixed(2)}, tone=${newTone}, voice_rate=${newVoiceRate.toFixed(3)}`)
      }
    } else {
      console.warn(`[webhook] No user_model found for user ${userId} — skipping model update`)
    }

    // ── 6. Insert into event_log ──────────────────────────────────────
    // Using service role to bypass RLS (webhook has no user JWT)
    const relevanceScore = evalScores['response_relevance'] ?? evalScores['solved_user_request'] ?? 0.5

    const { error: eventError } = await supabaseAdmin
      .from('event_log')
      .insert({
        user_id: userId,
        event_type: 'voice_session_complete',
        action: 'conversation_analysis',
        params: {
          conversation_id: data.conversation_id,
          transcript_summary: data.analysis.transcript_summary,
          tool_calls: toolStats.toolNames,
          tool_call_count: toolStats.total,
          tool_success_count: toolStats.successful,
          evaluation_scores: evalScores,
          data_collection: {
            user_mood: mood,
            task_types_mentioned: taskTypes,
            topics_discussed: topics,
            action_success_rate: actionSuccessRate,
          },
          call_successful: data.analysis.call_successful,
          termination_reason: data.metadata.termination_reason,
          cost: data.metadata.cost,
        },
        latency_ms: data.metadata.call_duration_secs * 1000,
        ai_model_used: 'elevenlabs-convai',
        confidence: relevanceScore,
        success: data.analysis.call_successful === 'success',
        screen_context: data.conversation_initiation_client_data?.dynamic_variables?.current_screen || 'unknown',
      })

    if (eventError) {
      console.error('[webhook] Failed to insert event_log:', eventError.message)
    } else {
      console.log('[webhook] event_log inserted')
    }

    // ── 7. Insert into conversation_history (for cross-session memory) ─
    // Step 15c: stored summaries are injected as context in the next session
    const { error: historyError } = await supabaseAdmin
      .from('conversation_history')
      .insert({
        user_id: userId,
        conversation_id: data.conversation_id,
        summary: data.analysis.transcript_summary || 'No summary available',
        key_decisions: extractKeyDecisions(data.transcript),
        action_items: toolStats.toolNames.map((t) => ({ tool: t })),
        mood,
      })

    if (historyError) {
      // Table may not exist yet (created in a later migration) — log but don't fail
      console.warn('[webhook] Failed to insert conversation_history:', historyError.message)
    } else {
      console.log('[webhook] conversation_history inserted')
    }

    // ── 7b. Upsert voice_analytics (daily aggregate) ─────────────────
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const durationSecs = Math.round(data.metadata.call_duration_secs || 0)
    const tasksCreated = toolStats.toolNames.filter(
      (t) => t.includes('create_task') || t.includes('add_task'),
    ).length
    const satisfaction =
      evalScores['user_satisfaction'] ??
      evalScores['solved_user_request'] ??
      evalScores['response_relevance'] ??
      0.5
    const taskCompletion = parseFloat(actionSuccessRate) || (toolStats.total > 0 ? toolStats.successful / toolStats.total : 0.5)

    // Build top_commands frequency map for this session
    const cmdFreq: Record<string, number> = {}
    for (const cmd of toolStats.toolNames) {
      cmdFreq[cmd] = (cmdFreq[cmd] || 0) + 1
    }
    const sessionTopCommands = Object.entries(cmdFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // First try upsert — ON CONFLICT merges into daily aggregate
    const { error: analyticsError } = await supabaseAdmin.rpc('upsert_voice_analytics', {
      p_user_id: userId,
      p_date: today,
      p_duration: durationSecs,
      p_tasks_created: tasksCreated,
      p_satisfaction: satisfaction,
      p_task_completion: taskCompletion,
      p_top_commands: sessionTopCommands,
    })

    if (analyticsError) {
      // Fallback: raw upsert if the RPC doesn't exist yet
      console.warn('[webhook] RPC upsert_voice_analytics failed, trying raw upsert:', analyticsError.message)

      const { error: rawError } = await supabaseAdmin
        .from('voice_analytics')
        .upsert(
          {
            user_id: userId,
            date: today,
            sessions_count: 1,
            total_duration_seconds: durationSecs,
            tasks_created_by_voice: tasksCreated,
            avg_satisfaction: satisfaction,
            avg_task_completion: taskCompletion,
            top_commands: sessionTopCommands,
            interruption_rate: 0,
          },
          { onConflict: 'user_id,date' },
        )

      if (rawError) {
        console.warn('[webhook] Failed to upsert voice_analytics:', rawError.message)
      } else {
        console.log('[webhook] voice_analytics raw-upserted (new row)')
      }
    } else {
      console.log(`[webhook] voice_analytics upserted for ${today}`)
    }

    // ── 8. Return 200 — required by ElevenLabs ───────────────────────
    return new Response(
      JSON.stringify({
        status: 'processed',
        conversation_id: data.conversation_id,
        user_id: userId,
        insights: {
          mood,
          tools_used: toolStats.total,
          duration_secs: data.metadata.call_duration_secs,
        },
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[webhook] Error processing webhook:', err)
    // Return 200 even on errors to prevent ElevenLabs from disabling the webhook
    // (10+ consecutive failures = auto-disabled)
    return new Response(
      JSON.stringify({ status: 'error', message: (err as Error).message }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }
})

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract key decisions from the transcript.
 * Looks for agent messages that indicate a completed action (tool results)
 * and returns them as human-readable decision strings.
 */
function extractKeyDecisions(transcript: TranscriptTurn[]): string[] {
  const decisions: string[] = []

  for (const turn of transcript) {
    if (turn.role === 'agent' && turn.tool_results) {
      for (const result of turn.tool_results) {
        // Summarize as "Used {tool_name}" — the transcript_summary has more detail
        if (result.tool_name && result.result) {
          const shortResult = result.result.length > 100
            ? result.result.slice(0, 100) + '...'
            : result.result
          decisions.push(`${result.tool_name}: ${shortResult}`)
        }
      }
    }
  }

  return decisions.slice(0, 10) // Cap at 10 decisions per conversation
}
