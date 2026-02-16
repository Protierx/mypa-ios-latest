/**
 * Task Notifications Edge Function
 *
 * Called by pg_cron every hour. Scans for:
 *   1. TASK_OVERDUE_SUMMARY — pending tasks whose due_date < now()
 *   2. TASK_DUE_SOON        — pending tasks due within the next 60 minutes
 *
 * De-duplicates by checking existing unread notifications of the same
 * type for the same task within the last 24 hours.
 *
 * Also inserts a DAILY_PLANNING_REMINDER notification once per day
 * (checked via event_log idempotency).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CORS_HEADERS } from '../_shared/config.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  try {
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // ── 1. Get all overdue tasks (due_date < now, still pending) ──────
    const { data: overdueTasks, error: overdueErr } = await supabase
      .from('tasks')
      .select('id, user_id, title, due_date')
      .eq('status', 'pending')
      .lt('due_date', now.toISOString())
      .order('due_date', { ascending: true })

    if (overdueErr) {
      console.error('Error fetching overdue tasks:', overdueErr)
      throw overdueErr
    }

    // ── 2. Get tasks due within the next hour ────────────────────────
    const { data: dueSoonTasks, error: dueSoonErr } = await supabase
      .from('tasks')
      .select('id, user_id, title, due_date')
      .eq('status', 'pending')
      .gte('due_date', now.toISOString())
      .lte('due_date', oneHourFromNow.toISOString())
      .order('due_date', { ascending: true })

    if (dueSoonErr) {
      console.error('Error fetching due-soon tasks:', dueSoonErr)
      throw dueSoonErr
    }

    // ── 3. Get recent notifications for de-duplication ───────────────
    // We only check notifications created in the last 24h to avoid
    // spamming the user with repeat notifications for the same task.
    const { data: recentNotifs, error: recentErr } = await supabase
      .from('notifications')
      .select('type, data')
      .in('type', ['TASK_OVERDUE_SUMMARY', 'TASK_DUE_SOON'])
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .is('deleted_at', null)

    if (recentErr) {
      console.error('Error fetching recent notifications:', recentErr)
    }

    // Build a set of "type:task_id" keys for quick lookup
    const sentKeys = new Set<string>()
    if (recentNotifs) {
      for (const n of recentNotifs) {
        const taskId = n.data?.task_id
        if (taskId) {
          sentKeys.add(`${n.type}:${taskId}`)
        }
        // For summary notifications that have task_ids array
        const taskIds = n.data?.task_ids as string[] | undefined
        if (taskIds) {
          for (const tid of taskIds) {
            sentKeys.add(`${n.type}:${tid}`)
          }
        }
      }
    }

    const notificationsToInsert: Array<{
      user_id: string
      type: string
      title: string
      body: string
      data: Record<string, unknown>
      category: string
    }> = []

    // ── 4. Group overdue tasks by user ───────────────────────────────
    const overdueByUser = new Map<string, typeof overdueTasks>()
    if (overdueTasks) {
      for (const task of overdueTasks) {
        if (sentKeys.has(`TASK_OVERDUE_SUMMARY:${task.id}`)) continue
        const existing = overdueByUser.get(task.user_id) ?? []
        existing.push(task)
        overdueByUser.set(task.user_id, existing)
      }
    }

    for (const [userId, tasks] of overdueByUser) {
      if (tasks.length === 0) continue

      if (tasks.length === 1) {
        notificationsToInsert.push({
          user_id: userId,
          type: 'TASK_OVERDUE_SUMMARY',
          title: '⏰ Task overdue',
          body: `"${tasks[0].title}" is past its due date`,
          data: {
            task_id: tasks[0].id,
            task_ids: [tasks[0].id],
            type: 'TASK_OVERDUE_SUMMARY',
          },
          category: 'tasks',
        })
      } else {
        notificationsToInsert.push({
          user_id: userId,
          type: 'TASK_OVERDUE_SUMMARY',
          title: `⏰ ${tasks.length} tasks overdue`,
          body: `"${tasks[0].title}" and ${tasks.length - 1} more are past due`,
          data: {
            task_ids: tasks.map(t => t.id),
            type: 'TASK_OVERDUE_SUMMARY',
          },
          category: 'tasks',
        })
      }
    }

    // ── 5. Due-soon notifications (per-task) ─────────────────────────
    if (dueSoonTasks) {
      for (const task of dueSoonTasks) {
        if (sentKeys.has(`TASK_DUE_SOON:${task.id}`)) continue

        const dueDate = new Date(task.due_date)
        const minutesUntilDue = Math.round((dueDate.getTime() - now.getTime()) / 60000)

        notificationsToInsert.push({
          user_id: task.user_id,
          type: 'TASK_DUE_SOON',
          title: '🔔 Task due soon',
          body: `"${task.title}" is due in ${minutesUntilDue} minute${minutesUntilDue !== 1 ? 's' : ''}`,
          data: {
            task_id: task.id,
            type: 'TASK_DUE_SOON',
          },
          category: 'tasks',
        })
      }
    }

    // ── 6. Insert all notifications ──────────────────────────────────
    let insertedCount = 0
    if (notificationsToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('notifications')
        .insert(notificationsToInsert)

      if (insertErr) {
        console.error('Error inserting notifications:', insertErr)
        throw insertErr
      }
      insertedCount = notificationsToInsert.length
    }

    console.log(
      `Task notifications: ${overdueTasks?.length ?? 0} overdue tasks, ` +
      `${dueSoonTasks?.length ?? 0} due-soon tasks, ` +
      `${insertedCount} notifications created`
    )

    return new Response(
      JSON.stringify({
        success: true,
        overdue_count: overdueTasks?.length ?? 0,
        due_soon_count: dueSoonTasks?.length ?? 0,
        notifications_created: insertedCount,
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in task-notifications:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
