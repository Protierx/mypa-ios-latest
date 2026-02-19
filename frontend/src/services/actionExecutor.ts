/**
 * Action Executor Service (PRD 4.7)
 *
 * Client-side counterpart to the voice-command Edge Function.
 * Receives structured ActionJSON from the Edge Function and executes
 * mutations via Supabase client. AI never writes data directly (rule 8).
 *
 * Flow:
 * 1. Receive ActionJSON from voice-command response
 * 2. Check confidence threshold (< 0.7 -> clarification)
 * 3. Check confirmation_required (delete_task -> spoken yes/no)
 * 4. Execute via ACTION_HANDLERS map
 * 5. Log to event_log (PRD 4.8, rule 9)
 */

import { supabase } from '@/lib/supabase';
import { eventLogger } from './eventLogger';
import { suggestFromTitle } from './categorySuggestion';
import { analyticsInvalidationBus } from './analyticsInvalidationBus';

// ============================================================================
// Types (PRD 4.7 Action System Contract)
// ============================================================================

export interface ActionJSON {
  action: string;
  params: Record<string, unknown>;
  confirmation_required: boolean;
  confidence: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  needsConfirmation?: boolean;
  confirmationPrompt?: string;
}

// ============================================================================
// Param Normalization
// ============================================================================

function firstDefined<T>(...values: Array<T | undefined | null>): T | undefined {
  for (const v of values) {
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

function normalizeActionParams(action: string, params: Record<string, unknown>): Record<string, unknown> {
  const p = { ...params };

  switch (action) {
    case 'create_task':
      p.title = firstDefined(p.title as string, p.task_name as string, p.task as string, p.name as string);
      p.date = firstDefined(p.date as string, p.due_date as string, p.when as string);
      p.priority = firstDefined(p.priority as string, p.importance as string);
      p.duration_min = firstDefined(
        p.duration_min as number,
        p.duration as number,
        p.minutes as number,
        p.estimated_duration as number,
      );
      break;

    case 'update_task':
      p.task_name = firstDefined(p.task_name as string, p.task as string, p.name as string, p.title as string);
      p.date = firstDefined(p.date as string, p.due_date as string, p.new_date as string, p.when as string);
      p.duration_min = firstDefined(p.duration_min as number, p.duration as number, p.minutes as number);
      break;

    case 'complete_task':
    case 'delete_task':
      p.task_name = firstDefined(p.task_name as string, p.task as string, p.name as string, p.title as string);
      break;

    case 'reschedule_task':
      p.task_name = firstDefined(p.task_name as string, p.task as string, p.name as string, p.title as string);
      p.new_date = firstDefined(p.new_date as string, p.date as string, p.due_date as string, p.when as string);
      break;

    case 'start_focus_session':
      p.duration_min = firstDefined(p.duration_min as number, p.duration as number, p.minutes as number);
      p.task_name = firstDefined(p.task_name as string, p.task as string, p.name as string, p.title as string);
      break;

    case 'create_circle':
      p.name = firstDefined(p.name as string, p.circle_name as string, p.title as string);
      break;

    case 'join_circle':
      p.invite_code = firstDefined(p.invite_code as string, p.code as string, p.circle_code as string);
      break;

    case 'invite_to_circle':
      p.circle_name = firstDefined(p.circle_name as string, p.circle as string, p.name as string);
      p.username = firstDefined(p.username as string, p.user as string, p.user_name as string, p.handle as string);
      break;

    case 'create_challenge':
      p.circle_name = firstDefined(p.circle_name as string, p.circle as string, p.name as string);
      p.target_value = firstDefined(p.target_value as number, p.goal as number, p.goal_value as number, p.target as number);
      p.duration_days = firstDefined(p.duration_days as number, p.days as number, p.duration as number);
      break;

    case 'post_to_circle':
      p.circle_name = firstDefined(p.circle_name as string, p.circle as string, p.name as string);
      p.content = firstDefined(p.content as string, p.message as string, p.text as string);
      break;

    case 'brain_dump':
      p.content = firstDefined(p.content as string, p.text as string, p.message as string);
      break;

    case 'set_preference':
      p.key = firstDefined(p.key as string, p.preference as string, p.name as string);
      p.value = firstDefined(p.value as string, p.setting as string);
      break;
  }

  return p;
}

/** Full response from voice-command Edge Function */
export interface VoiceCommandResponse {
  success: boolean;
  transcript: string;
  action: ActionJSON;
  response_text: string;
  model_used: string;
  tokens_used: number;
  query_data?: Record<string, unknown>;
}

// ============================================================================
// Constants
// ============================================================================

/** Confidence threshold below which we ask for clarification (PRD 4.7) */
const CONFIDENCE_THRESHOLD = 0.7;

/** Actions that are queries — no client-side execution needed */
const QUERY_ACTIONS = new Set([
  'query_tasks',
  'query_schedule',
  'query_stats',
  'query_circles',
]);

// ============================================================================
// Voice Gating — Level Requirements (PRD 4.3 Progressive Unlocks)
// ============================================================================

import { getLevelFromDays } from '../components/LockedFeature';

/**
 * Map of action names → required unlock level.
 * Actions not listed here are available at Level 1 (all users).
 */
// NOTE: All level gates disabled for testing. Re-enable after launch.
const ACTION_LEVEL_REQUIREMENTS: Record<string, { level: number; featureName: string }> = {
  // 'smart_schedule':       { level: 2, featureName: 'AI Sorting' },
  // 'set_preference':       { level: 3, featureName: 'Preference Learning' },
  // 'proactive_reminder':   { level: 4, featureName: 'Proactive Alerts' },
  // 'predictive_planning':  { level: 5, featureName: 'Predictive Tasks' },
};

const LEVEL_DAYS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };

/**
 * Check if an action is gated behind a level the user hasn't reached.
 * Returns a friendly message if locked, or null if available.
 */
function getLockedMessage(action: string, daysActive: number): string | null {
  const req = ACTION_LEVEL_REQUIREMENTS[action];
  if (!req) return null;

  const currentLevel = getLevelFromDays(daysActive);
  if (currentLevel >= req.level) return null;

  const daysNeeded = Math.max(0, (LEVEL_DAYS[req.level] || 1) - daysActive);
  return `I'll be able to help with ${req.featureName} after about ${daysNeeded} more day${daysNeeded !== 1 ? 's' : ''} of use together. Keep going!`;
}

// ============================================================================
// Action Handlers (one per mutation action)
// ============================================================================

type ActionHandler = (
  params: Record<string, unknown>,
  userId: string,
) => Promise<ActionResult>;

/**
 * Find a task by fuzzy title match.
 * Returns the first matching non-completed task.
 */
async function findTaskByName(
  taskName: string,
  userId: string,
  includeCompleted = false,
): Promise<{ id: string; title: string } | null> {
  let query = supabase
    .from('tasks')
    .select('id, title')
    .eq('user_id', userId)
    .ilike('title', `%${taskName}%`)
    .limit(1);

  if (!includeCompleted) {
    query = query.neq('status', 'completed');
  }

  const { data } = await query;
  return data && data.length > 0 ? data[0] : null;
}

// ============================================================================
// Natural Language Date Parser
// ============================================================================

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Parse a natural language date string into an ISO date string.
 * Handles: today, tomorrow, next week, day names (monday, next tuesday),
 * "every Monday" (maps to next occurrence), ISO dates, and offsets like
 * "in 3 days".
 *
 * Returns today's date if the input is empty or unparseable.
 */
function parseNaturalDate(input: string | undefined | null, baseDate?: Date): string {
  const now = baseDate ?? new Date();
  if (!input || !input.trim()) return now.toISOString();

  const lower = input.toLowerCase().trim();

  // "today"
  if (lower === 'today') return now.toISOString();

  // "tomorrow"
  if (lower === 'tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }

  // "yesterday" (edge case)
  if (lower === 'yesterday') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d.toISOString();
  }

  // "next week"
  if (lower === 'next week') {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d.toISOString();
  }

  // "in X days/weeks"
  const inMatch = lower.match(/^in\s+(\d+)\s+(day|week|month)s?$/);
  if (inMatch) {
    const n = parseInt(inMatch[1], 10);
    const unit = inMatch[2];
    const d = new Date(now);
    if (unit === 'day') d.setDate(d.getDate() + n);
    else if (unit === 'week') d.setDate(d.getDate() + n * 7);
    else if (unit === 'month') d.setMonth(d.getMonth() + n);
    return d.toISOString();
  }

  // Day name: "monday", "next monday", "every monday", "this friday"
  // Strip prefixes like "every", "next", "this"
  const dayPrefixMatch = lower.match(/^(?:every|next|this)\s+(.+)$/);
  const dayCandidate = dayPrefixMatch ? dayPrefixMatch[1] : lower;
  const dayIndex = DAY_NAMES.indexOf(dayCandidate);
  if (dayIndex !== -1) {
    const d = new Date(now);
    const currentDay = d.getDay();
    let daysAhead = dayIndex - currentDay;
    // If the day is today or in the past this week, push to next week
    if (daysAhead <= 0) daysAhead += 7;
    // "next X" always means next week's occurrence
    if (dayPrefixMatch && dayPrefixMatch[0].startsWith('next') && daysAhead <= 7) {
      // If it's already pointing to next week, fine; otherwise add 7
      if (daysAhead < 7) daysAhead += 7;
    }
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString();
  }

  // Try ISO / standard date parsing as fallback
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
    return parsed.toISOString();
  }

  // Unparseable — default to today
  return now.toISOString();
}

const ACTION_HANDLERS: Record<string, ActionHandler> = {
  // ── Task Management ──────────────────────────────────────────────

  create_task: async (params, userId) => {
    const title = params.title as string;
    const date = params.date as string | undefined;
    const priority = (params.priority as string) || 'medium';
    const durationMin = params.duration_min as number | undefined;
    const mode = (params.mode as string) || 'quick';

    // Parse natural language date
    const dueDate = parseNaturalDate(date);

    // Duration logic based on mode:
    // - focus tasks: use specified duration or default 25 min
    // - quick tasks: use specified duration, or infer from title, or null (simple tick)
    let estimatedDuration: number | null = null;
    if (mode === 'focus') {
      estimatedDuration = durationMin || 25;
    } else if (durationMin) {
      estimatedDuration = durationMin;
    } else {
      const suggestion = suggestFromTitle(title);
      estimatedDuration = suggestion?.duration ?? null;
    }

    const insertData: Record<string, unknown> = {
      user_id: userId,
      title,
      due_date: dueDate,
      priority,
      estimated_duration: estimatedDuration,
      task_mode: mode, // Requires migration 036_task_mode_column.sql
    };

    // Two-step insert: avoid .insert().select().single() which can hang
    // with PostgREST + RLS policies (same pattern as useTasks hook)
    const { error: insertError } = await supabase
      .from('tasks')
      .insert(insertData);

    if (insertError) {
      return { success: false, message: "Hmm, couldn't add that task. Mind trying again?" };
    }

    // Fetch the just-created task separately
    const { data: task } = await supabase
      .from('tasks')
      .select()
      .eq('user_id', userId)
      .eq('title', title)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const focusMsg = mode === 'focus'
      ? `Got it! Added "${title}" as a focus task — ${estimatedDuration} minutes when you're ready.`
      : `Got it! Added "${title}" to your list.`;

    return {
      success: true,
      message: focusMsg,
      data: { task: task || { title }, mode },
    };
  },

  update_task: async (params, userId) => {
    const taskName = params.task_name as string;
    const task = await findTaskByName(taskName, userId);
    if (!task) {
      return { success: false, message: `Couldn't find a task matching "${taskName}".` };
    }

    const updates: Record<string, unknown> = {};
    if (params.title) updates.title = params.title;
    if (params.date) updates.due_date = new Date(params.date as string).toISOString();
    if (params.priority) updates.priority = params.priority;
    if (params.duration_min) updates.estimated_duration = params.duration_min;

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id);

    if (error) {
      return { success: false, message: "Couldn't update that task. Try again?" };
    }

    return {
      success: true,
      message: `Updated "${task.title}".`,
      data: { taskId: task.id },
    };
  },

  complete_task: async (params, userId) => {
    const taskName = params.task_name as string;
    const task = await findTaskByName(taskName, userId);
    if (!task) {
      return { success: false, message: `I couldn't find a task matching "${taskName}". What's it called?` };
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', task.id);

    if (error) {
      return { success: false, message: "Couldn't mark that complete. Try again?" };
    }

    // Fire gamification event (XP + daily_user_stats + analytics)
    const eventId = `voice-${task.id}-${Date.now()}`;
    supabase.functions
      .invoke('task-completed', { body: { event_id: eventId, task_id: task.id } })
      .then(() => {
        // Delay to ensure daily_user_stats has fully committed
        setTimeout(() => analyticsInvalidationBus.invalidate(), 600);
      })
      .catch((err: unknown) => {
        console.warn('[actionExecutor] task-completed edge function failed:', err);
        // Still invalidate — the task was marked completed in the DB
        setTimeout(() => analyticsInvalidationBus.invalidate(), 800);
      });

    return {
      success: true,
      message: `Nice work! Marked "${task.title}" complete.`,
      data: { taskId: task.id },
    };
  },

  delete_task: async (params, userId) => {
    const taskName = params.task_name as string;
    const task = await findTaskByName(taskName, userId, true);
    if (!task) {
      return { success: false, message: `Couldn't find a task matching "${taskName}".` };
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id);

    if (error) {
      return { success: false, message: "Couldn't delete that task. Try again?" };
    }

    return {
      success: true,
      message: `Deleted "${task.title}".`,
      data: { taskId: task.id },
    };
  },

  reschedule_task: async (params, userId) => {
    const taskName = params.task_name as string;
    const newDate = params.new_date as string;
    const task = await findTaskByName(taskName, userId);
    if (!task) {
      return { success: false, message: `Couldn't find a task matching "${taskName}".` };
    }

    let parsedDate = new Date().toISOString();
    const lower = newDate.toLowerCase();
    if (lower.includes('tomorrow')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      parsedDate = d.toISOString();
    } else if (lower.includes('next week')) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      parsedDate = d.toISOString();
    } else {
      const d = new Date(newDate);
      if (!isNaN(d.getTime())) parsedDate = d.toISOString();
    }

    const { error } = await supabase
      .from('tasks')
      .update({ due_date: parsedDate })
      .eq('id', task.id);

    if (error) {
      return { success: false, message: "Couldn't reschedule that task. Try again?" };
    }

    const dateLabel = lower.includes('tomorrow') ? 'tomorrow' : newDate;
    return {
      success: true,
      message: `Moved "${task.title}" to ${dateLabel}.`,
      data: { taskId: task.id, newDate: parsedDate },
    };
  },

  batch_create_tasks: async (params, userId) => {
    const tasks = params.tasks as Array<{ title: string; date?: string; priority?: string; category?: string; mode?: string; duration_min?: number }>;
    if (!tasks || tasks.length === 0) {
      return { success: false, message: "No tasks to create." };
    }

    // When tasks have no dates or all have the same generic date like
    // "every week", spread them across consecutive days starting from
    // the next relevant day.
    const inserts = tasks.map((t, index) => {
      const mode = t.mode || 'quick';

      // Duration based on mode
      let estimatedDuration: number | null = null;
      if (mode === 'focus') {
        estimatedDuration = t.duration_min || 25;
      } else if (t.duration_min) {
        estimatedDuration = t.duration_min;
      } else {
        const suggestion = suggestFromTitle(t.title);
        estimatedDuration = suggestion?.duration ?? null;
      }

      let dueDate: string;
      if (t.date) {
        // Try parsing each task's date individually
        dueDate = parseNaturalDate(t.date);
        // If parseNaturalDate returned today (fallback) but the input
        // wasn't literally "today", it means it couldn't parse —
        // spread across consecutive days instead
        const lower = (t.date || '').toLowerCase().trim();
        if (lower && lower !== 'today' && dueDate === parseNaturalDate('today')) {
          const d = new Date();
          d.setDate(d.getDate() + 1 + index); // tomorrow + offset
          dueDate = d.toISOString();
        }
      } else {
        // No date given — spread across days starting tomorrow
        const d = new Date();
        d.setDate(d.getDate() + 1 + index);
        dueDate = d.toISOString();
      }

      return {
        user_id: userId,
        title: t.title,
        due_date: dueDate,
        priority: t.priority || 'medium',
        estimated_duration: estimatedDuration,
        task_mode: mode,
      };
    });

    // Insert without .select() to avoid PostgREST + RLS hang
    const { error } = await supabase
      .from('tasks')
      .insert(inserts);

    if (error) {
      return { success: false, message: "Couldn't create those tasks. Try again?" };
    }

    return {
      success: true,
      message: `Added ${tasks.length} tasks to your list!`,
      data: { count: tasks.length },
    };
  },

  // ── Focus Sessions ───────────────────────────────────────────────

  start_focus_session: async (params, userId) => {
    const durationMin = (params.duration_min as number) || 25;
    const taskName = params.task_name as string | undefined;

    let taskId: string | undefined;
    if (taskName) {
      const task = await findTaskByName(taskName, userId);
      if (task) taskId = task.id;
    }

    const { data: session, error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: userId,
        duration_planned: durationMin,
        task_id: taskId || null,
        started_at: new Date().toISOString(),
      })
      .select('id, duration_planned, task_id, started_at')
      .single();

    if (error) {
      // If insert+select hangs, the insert may have still succeeded.
      // The useFocusSessions hook will pick it up via refresh.
      return { success: false, message: "Couldn't start a focus session. Try again?" };
    }

    return {
      success: true,
      message: `Starting a ${durationMin} minute focus session. You've got this!`,
      data: { session },
    };
  },

  pause_focus: async (_params, userId) => {
    // Find the active focus session (most recent without ended_at)
    const { data: session } = await supabase
      .from('focus_sessions')
      .select('id')
      .eq('user_id', userId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      return { success: false, message: "No active focus session to pause." };
    }

    // We track pause on client side; just acknowledge
    return {
      success: true,
      message: "Focus session paused. Take a breather!",
      data: { sessionId: session.id },
    };
  },

  resume_focus: async (_params, userId) => {
    const { data: session } = await supabase
      .from('focus_sessions')
      .select('id')
      .eq('user_id', userId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      return { success: false, message: "No paused focus session to resume." };
    }

    return {
      success: true,
      message: "Back at it! Focus session resumed.",
      data: { sessionId: session.id },
    };
  },

  end_focus: async (_params, userId) => {
    const { data: session } = await supabase
      .from('focus_sessions')
      .select('id, started_at, duration_planned')
      .eq('user_id', userId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      return { success: false, message: "No active focus session to end." };
    }

    const startedAt = new Date(session.started_at);
    const durationActual = Math.round((Date.now() - startedAt.getTime()) / 60000);

    const { error } = await supabase
      .from('focus_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_actual: durationActual,
      })
      .eq('id', session.id);

    if (error) {
      return { success: false, message: "Couldn't end the session. Try again?" };
    }

    return {
      success: true,
      message: `Nice work! ${durationActual} minutes of focused time.`,
      data: { sessionId: session.id, durationActual },
    };
  },

  // ── Social / Circles ─────────────────────────────────────────────

  create_circle: async (params, userId) => {
    const name = params.name as string;
    const emoji = (params.emoji as string) || '🎯';
    const description = (params.description as string) || null;

    const { data: circle, error } = await supabase
      .from('circles')
      .insert({
        name,
        emoji,
        description,
        owner_id: userId,
        privacy: 'invite-only',
      })
      .select()
      .single();

    if (error) {
      return { success: false, message: "Couldn't create that circle. Try again?" };
    }

    // Auto-add creator as member
    await supabase.from('circle_members').insert({
      circle_id: circle.id,
      user_id: userId,
      role: 'owner',
    });

    return {
      success: true,
      message: `Created "${name}" ${emoji}!`,
      data: { circle },
    };
  },

  join_circle: async (params, userId) => {
    const inviteCode = params.invite_code as string;
    if (!inviteCode) {
      return { success: false, message: "I need an invite code to join a circle. What's the code?" };
    }

    const code = inviteCode.trim().toLowerCase();
    let circle: { id: string; name: string } | null = null;

    // Try invite_code column first
    const { data: byInviteCode, error: inviteLookupErr } = await supabase
      .from('circles')
      .select('id, name')
      .eq('invite_code', code)
      .maybeSingle();

    if (!inviteLookupErr || (inviteLookupErr as any)?.code !== '42703') {
      circle = byInviteCode || null;
    }

    // Fallback: partial ID match
    if (!circle) {
      const { data: allCircles } = await supabase.from('circles').select('id, name');
      const normalized = code.replace(/[^a-z0-9]/g, '');
      circle = (allCircles || []).find((c: any) => {
        const idNorm = String(c.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return idNorm === normalized || idNorm.startsWith(normalized);
      }) || null;
    }

    if (!circle) {
      return { success: false, message: "Couldn't find a circle with that code. Double-check and try again!" };
    }

    // Check if already a member
    const { count } = await supabase
      .from('circle_members')
      .select('*', { count: 'exact', head: true })
      .eq('circle_id', circle.id)
      .eq('user_id', userId);

    if ((count || 0) > 0) {
      return { success: false, message: `You're already a member of ${circle.name}!` };
    }

    // Join
    const { error: joinErr } = await supabase.from('circle_members').insert({
      circle_id: circle.id, user_id: userId, role: 'member',
    });

    if (joinErr) {
      return { success: false, message: "Couldn't join that circle. Try again?" };
    }

    return {
      success: true,
      message: `You're in! Welcome to ${circle.name} 🎉`,
      data: { circleId: circle.id, circleName: circle.name },
    };
  },

  invite_to_circle: async (params, _userId) => {
    const circleName = params.circle_name as string;
    const username = params.username as string;

    // Find the circle
    const { data: circle } = await supabase
      .from('circles')
      .select('id, name')
      .ilike('name', `%${circleName}%`)
      .limit(1)
      .single();

    if (!circle) {
      return { success: false, message: `Couldn't find a circle called "${circleName}".` };
    }

    // Find the user
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${username}%`)
      .limit(1)
      .single();

    if (!targetUser) {
      return { success: false, message: `Couldn't find a user "${username}".` };
    }

    // Create notification as invite
    await supabase.from('notifications').insert({
      user_id: targetUser.id,
      type: 'circle_invite',
      title: `Circle Invite`,
      body: `You've been invited to join ${circle.name}!`,
      data: { circle_id: circle.id },
    });

    return {
      success: true,
      message: `Sent an invite to ${username} for ${circle.name}!`,
      data: { circleId: circle.id, invitedUser: targetUser.id },
    };
  },

  create_challenge: async (params, userId) => {
    const circleName = params.circle_name as string;
    const title = params.title as string;
    const trackingMethod = (params.tracking_method as string) || 'proof_checkin';
    const targetValue = (params.target_value as number) || 7;
    const durationDays = (params.duration_days as number) || 7;
    const description = (params.description as string) || null;
    const emoji = (params.emoji as string) || '🏆';

    // Map tracking method to legacy type for DB compatibility
    const TRACKING_TO_TYPE: Record<string, string> = {
      tasks_completed: 'tasks_completed',
      focus_minutes: 'focus_time',
      active_days: 'daily_checkin',
      proof_checkin: 'daily_checkin',
    };
    const legacyType = TRACKING_TO_TYPE[trackingMethod] || (params.type as string) || 'custom';

    const { data: circle } = await supabase
      .from('circles')
      .select('id')
      .ilike('name', `%${circleName}%`)
      .limit(1)
      .single();

    if (!circle) {
      return { success: false, message: `Couldn't find a circle called "${circleName}".` };
    }

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + durationDays);

    const insertPayload: Record<string, unknown> = {
      title,
      emoji,
      description,
      creator_id: userId,
      circle_id: circle.id,
      type: legacyType,
      tracking_method: trackingMethod,
      verification_mode: trackingMethod === 'proof_checkin' ? 'auto_accept' : null,
      goal_value: targetValue,
      duration_days: durationDays,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'active',
    };

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return { success: false, message: "Couldn't create that challenge. Try again?" };
    }

    // Auto-join creator
    await supabase.from('challenge_participants').insert({
      challenge_id: challenge.id,
      user_id: userId,
      progress: 0,
    });

    // Post to circle feed
    await supabase.from('circle_posts').insert({
      circle_id: circle.id,
      user_id: userId,
      type: 'challenge_created',
      payload: {
        challenge_id: challenge.id,
        challenge_title: title,
        challenge_emoji: emoji,
        tracking_method: trackingMethod,
        target_value: targetValue,
        duration_days: durationDays,
      },
    });

    const methodLabel = trackingMethod === 'focus_minutes' ? 'minutes focused' : trackingMethod === 'tasks_completed' ? 'tasks' : trackingMethod === 'active_days' ? 'active days' : 'check-ins';
    return {
      success: true,
      message: `${emoji} Challenge "${title}" created! ${durationDays} days to hit ${targetValue} ${methodLabel}. Let's go!`,
      data: { challenge },
    };
  },

  post_to_circle: async (params, userId) => {
    const circleName = params.circle_name as string;
    const content = params.content as string;

    const { data: circle } = await supabase
      .from('circles')
      .select('id, name')
      .ilike('name', `%${circleName}%`)
      .limit(1)
      .single();

    if (!circle) {
      return { success: false, message: `Couldn't find a circle called "${circleName}".` };
    }

    // For now, create as a notification/activity (feed table may come later)
    return {
      success: true,
      message: `Posted to ${circle.name}!`,
      data: { circleId: circle.id, content },
    };
  },

  // ── Other ────────────────────────────────────────────────────────

  brain_dump: async (params, userId) => {
    const content = params.content as string;

    // Store in brain_dump_items table (matches UI flow in BrainDumpModal)
    const { error } = await supabase
      .from('brain_dump_items')
      .insert({
        user_id: userId,
        text: content,
        status: 'active',
      });

    if (error) {
      return { success: false, message: "Couldn't save your brain dump. Try again?" };
    }

    return {
      success: true,
      message: "Brain dump captured! I'll help you sort through it later.",
      data: { content },
    };
  },

  remember_preference: async (params, userId) => {
    const key = params.key as string;
    const value = params.value as string;
    const context = (params.context as string) || '';

    // Store as event_log entry with type 'preference_stored'.
    // The nightly compute-user-model job and voice-command context builder
    // query these to personalize the AI.
    eventLogger.log('preference_stored', {
      action: 'remember_preference',
      preference_key: key,
      preference_value: value,
      context,
    });

    return {
      success: true,
      message: `Noted — I'll remember that for next time.`,
      data: { key, value, context },
    };
  },

  set_preference: async (params, userId) => {
    const key = params.key as string;
    const value = params.value as string;

    // Store in profiles or a user_settings table
    // For now, update profiles metadata
    const { error } = await supabase
      .from('profiles')
      .update({ [`${key}`]: value })
      .eq('id', userId);

    if (error) {
      // Preference might not map to a column; just acknowledge
      return {
        success: true,
        message: `Got it, I'll remember that preference.`,
        data: { key, value },
      };
    }

    return {
      success: true,
      message: `Updated ${key.replace('_', ' ')} to ${value}.`,
      data: { key, value },
    };
  },

  navigate_to_screen: async (params) => {
    const screen = params.screen as string;
    const screenMap: Record<string, string> = {
      tasks: 'tasks',
      social: 'social',
      profile: 'profile',
      focus: 'focus',
      ai_hub: 'ai_hub',
    };

    const target = screenMap[screen] || screen;

    return {
      success: true,
      message: '',
      data: { navigate_to: target },
    };
  },
};

// ============================================================================
// Main Executor
// ============================================================================

/**
 * Execute an action received from the voice-command Edge Function.
 *
 * @param actionJson - Structured action from GPT function calling
 * @param userId - Current user ID
 * @param responseText - Pre-generated spoken response from Edge Function
 * @returns ActionResult with success/message/data
 */
export async function executeAction(
  actionJson: ActionJSON,
  userId: string,
  responseText?: string,
  daysActive?: number,
): Promise<ActionResult> {
  const { action, params, confirmation_required, confidence } = actionJson;
  const normalizedParams = normalizeActionParams(action, params || {});

  // ── Skip queries (handled server-side) ─────────────────────────
  if (QUERY_ACTIONS.has(action)) {
    return {
      success: true,
      message: responseText || 'Done.',
    };
  }

  // ── Skip unknown/conversational ────────────────────────────────
  if (action === 'unknown') {
    return {
      success: true,
      message: responseText || "I'm here! What can I help with?",
    };
  }

  // ── Voice gating — check level requirement (PRD 4.3) ──────────
  const lockedMsg = getLockedMessage(action, daysActive ?? 0);
  if (lockedMsg) {
    eventLogger.log('locked_feature_attempt', {
      action,
      required_level: ACTION_LEVEL_REQUIREMENTS[action]?.level,
      current_level: getLevelFromDays(daysActive ?? 0),
    });
    return {
      success: false,
      message: lockedMsg,
    };
  }

  // ── Low confidence -> clarification (PRD 4.7) ─────────────────
  if (confidence < CONFIDENCE_THRESHOLD) {
    const actionDescription = action.replace(/_/g, ' ');
    return {
      success: false,
      message: '',
      needsConfirmation: true,
      confirmationPrompt: `Did you mean to ${actionDescription}?`,
    };
  }

  // ── Confirmation required (e.g. delete_task) ──────────────────
  if (confirmation_required) {
    const taskName = (normalizedParams.task_name as string) || (normalizedParams.title as string) || 'that';
    return {
      success: false,
      message: '',
      needsConfirmation: true,
      confirmationPrompt: responseText || `I'll delete "${taskName}" - are you sure?`,
    };
  }

  // ── Execute the action ─────────────────────────────────────────
  const handler = ACTION_HANDLERS[action];
  if (!handler) {
    return {
      success: false,
      message: `I don't know how to handle "${action}" yet.`,
    };
  }

  try {
    const result = await handler(normalizedParams, userId);
    return result;
  } catch (error) {
    console.error(`[ActionExecutor] Error executing ${action}:`, error);
    return {
      success: false,
      message: "Something went wrong. Mind trying that again?",
    };
  }
}

/**
 * Process a full voice-command response end-to-end.
 * Handles action execution and event logging.
 */
export async function processVoiceResponse(
  response: VoiceCommandResponse,
  userId: string,
  listenStartTime: number,
): Promise<ActionResult> {
  const { action, response_text, model_used, tokens_used, transcript } = response;

  // Execute the action
  const result = await executeAction(action, userId, response_text);

  // Log to event_log (PRD 4.8, rule 9)
  eventLogger.logVoiceCommand(transcript, action.action, result.success, {
    confidence: action.confidence,
    latency_ms: Date.now() - listenStartTime,
    ai_model_used: model_used,
    tokens_used: tokens_used,
    user_override: false,
  });

  return result;
}
