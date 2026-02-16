/**
 * Compute User Model Edge Function
 *
 * Nightly computation of user_model fields from event_log and task data.
 * Called by pg_cron or manually. Processes all active users.
 *
 * Computes: peak_hours, completion_rate_7d, completion_rate_30d,
 * overwhelm_score, voice_usage_rate, avg_task_durations,
 * avg_daily_tasks, common_reschedule_patterns
 *
 * Reference: IMPLEMENTATION_PLAN.md Task 1.2
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CORS_HEADERS } from '../_shared/config.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // Use service role for batch processing (called from cron or admin)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Check if called for a specific user (authenticated) or batch (service role)
    let userIds: string[] = []
    const authHeader = req.headers.get('Authorization') ?? ''

    if (authHeader.includes('service_role') || serviceRoleKey) {
      // Batch mode: process all users active in last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: activeUsers } = await supabase
        .from('event_log')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (activeUsers) {
        const uniqueIds = new Set(activeUsers.map((r: any) => r.user_id))
        userIds = [...uniqueIds]
      }
    }

    // Also support single-user mode via request body
    try {
      const body = await req.json()
      if (body?.user_id) {
        userIds = [body.user_id]
      }
    } catch {
      // No body or invalid JSON — use batch mode
    }

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active users to process', processed: 0 }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[compute-user-model] Processing ${userIds.length} users`)

    let processed = 0
    const errors: string[] = []

    for (const userId of userIds) {
      try {
        await computeUserModel(supabase, userId)
        processed++
      } catch (err) {
        console.error(`[compute-user-model] Error for user ${userId}:`, err)
        errors.push(`${userId}: ${(err as Error).message}`)
      }
    }

    console.log(`[compute-user-model] Done. Processed: ${processed}, Errors: ${errors.length}`)

    return new Response(
      JSON.stringify({ processed, errors: errors.length, errorDetails: errors.slice(0, 10) }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[compute-user-model] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================================
// Core computation for a single user
// ============================================================================

async function computeUserModel(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // ── Fetch all event_log entries for last 30 days ───────────────────
  const { data: events } = await supabase
    .from('event_log')
    .select('event_type, action, params, created_at')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  const allEvents = events || []

  // ── Fetch tasks ─────────────────────────────────────────────────────
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, status, due_date, created_at, completed_at, priority, category')
    .eq('user_id', userId)

  const allTasks = tasks || []

  // ── Fetch focus sessions (last 30 days) ─────────────────────────────
  const { data: focusSessions } = await supabase
    .from('focus_sessions')
    .select('id, duration_actual, duration_planned, task_id, started_at, ended_at')
    .eq('user_id', userId)
    .gte('started_at', thirtyDaysAgo.toISOString())
    .not('ended_at', 'is', null)

  const completedSessions = focusSessions || []

  // ── 1. Peak Hours ──────────────────────────────────────────────────
  // Group task completions by hour of day → find top 3
  const completionHours: Record<number, number> = {}
  const completionEvents = allEvents.filter(
    e => e.action === 'complete_task' || e.event_type === 'task_completed'
  )
  for (const ev of completionEvents) {
    const hour = new Date(ev.created_at).getHours()
    completionHours[hour] = (completionHours[hour] || 0) + 1
  }
  const peakHours = Object.entries(completionHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour))

  // ── 2. Completion Rates ────────────────────────────────────────────
  const tasksCreated7d = allTasks.filter(
    t => new Date(t.created_at) >= sevenDaysAgo
  ).length
  const tasksCompleted7d = allTasks.filter(
    t => t.status === 'completed' && t.completed_at && new Date(t.completed_at) >= sevenDaysAgo
  ).length
  const completionRate7d = tasksCreated7d > 0
    ? Math.round((tasksCompleted7d / tasksCreated7d) * 100) / 100
    : 0

  const tasksCreated30d = allTasks.filter(
    t => new Date(t.created_at) >= thirtyDaysAgo
  ).length
  const tasksCompleted30d = allTasks.filter(
    t => t.status === 'completed' && t.completed_at && new Date(t.completed_at) >= thirtyDaysAgo
  ).length
  const completionRate30d = tasksCreated30d > 0
    ? Math.round((tasksCompleted30d / tasksCreated30d) * 100) / 100
    : 0

  // ── 3. Overwhelm Score ─────────────────────────────────────────────
  // (overdue + deferred) / total active tasks (0.0–1.0)
  const activeTasks = allTasks.filter(t => t.status !== 'completed')
  const overdueTasks = activeTasks.filter(
    t => t.due_date && new Date(t.due_date) < now
  )
  const deferredEvents = allEvents.filter(e => e.action === 'reschedule_task' || e.event_type === 'task_deferred')
  const deferredTaskIds = new Set(deferredEvents.map(e => {
    try { return (e.params as any)?.task_id || '' } catch { return '' }
  }).filter(Boolean))
  const deferredCount = activeTasks.filter(t => deferredTaskIds.has(t.id)).length

  const overwhelmScore = activeTasks.length > 0
    ? Math.min(1.0, Math.round(((overdueTasks.length + deferredCount) / activeTasks.length) * 100) / 100)
    : 0

  // ── 4. Voice Usage Rate ────────────────────────────────────────────
  const voiceEvents = allEvents.filter(e => e.event_type === 'voice_command')
  const totalActionEvents = allEvents.filter(e =>
    e.event_type === 'voice_command' ||
    e.event_type === 'task_created' ||
    e.event_type === 'task_completed' ||
    e.event_type === 'focus_started'
  )
  const voiceUsageRate = totalActionEvents.length > 0
    ? Math.round((voiceEvents.length / totalActionEvents.length) * 100) / 100
    : 0

  // ── 5. Average Task Durations (by category) ────────────────────────
  const categoryDurations: Record<string, number[]> = {}
  for (const session of completedSessions) {
    if (!session.duration_actual || !session.task_id) continue
    // Find the task to get its category
    const task = allTasks.find(t => t.id === session.task_id)
    const category = task?.category || 'Uncategorized'
    if (!categoryDurations[category]) categoryDurations[category] = []
    categoryDurations[category].push(session.duration_actual)
  }
  const avgTaskDurations: Record<string, number> = {}
  for (const [cat, durations] of Object.entries(categoryDurations)) {
    avgTaskDurations[cat] = Math.round(
      durations.reduce((a, b) => a + b, 0) / durations.length
    )
  }

  // ── 6. Average Daily Tasks ─────────────────────────────────────────
  const activeDays = new Set(
    allEvents
      .filter(e => e.event_type === 'task_created' || e.event_type === 'app_opened')
      .map(e => new Date(e.created_at).toISOString().split('T')[0])
  )
  const totalTasksCreated = allEvents.filter(e => e.event_type === 'task_created').length
  const avgDailyTasks = activeDays.size > 0
    ? Math.round((totalTasksCreated / activeDays.size) * 10) / 10
    : 0

  // ── 7. Common Reschedule Patterns ──────────────────────────────────
  const reschedulePatterns: Record<string, number> = {}
  for (const ev of deferredEvents) {
    try {
      const dayOfWeek = new Date(ev.created_at).toLocaleDateString('en-US', { weekday: 'long' })
      const hour = new Date(ev.created_at).getHours()
      const key = `${dayOfWeek}_${hour}`
      reschedulePatterns[key] = (reschedulePatterns[key] || 0) + 1
    } catch { /* skip malformed events */ }
  }
  const topPatterns = Object.entries(reschedulePatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern, count]) => {
      const [day, hour] = pattern.split('_')
      return { day, hour: parseInt(hour), count }
    })

  // ── 8. Days Active ─────────────────────────────────────────────────
  const daysActive = activeDays.size

  // ── Upsert to user_model ───────────────────────────────────────────
  const { error: upsertError } = await supabase
    .from('user_model')
    .upsert({
      user_id: userId,
      peak_hours: peakHours,
      completion_rate_7d: completionRate7d,
      completion_rate_30d: completionRate30d,
      overwhelm_score: overwhelmScore,
      voice_usage_rate: voiceUsageRate,
      avg_task_durations: avgTaskDurations,
      avg_daily_tasks: avgDailyTasks,
      common_reschedule_patterns: topPatterns,
      days_active: daysActive,
      last_calculated_at: now.toISOString(),
    }, { onConflict: 'user_id' })

  if (upsertError) {
    throw new Error(`Failed to upsert user_model for ${userId}: ${upsertError.message}`)
  }

  console.log(`[compute-user-model] Updated user ${userId}: peak_hours=${JSON.stringify(peakHours)}, completion_7d=${completionRate7d}, overwhelm=${overwhelmScore}, days_active=${daysActive}`)
}
