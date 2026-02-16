// @ts-nocheck — Deno edge function; not type-checked by Node/TS
// =================================================================
// POST /task-completed
// Event-driven task-completion processor
// Handles: idempotency → XP → streak → challenge progress → stats
// =================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/config.ts';
import {
  calcLevelState,
  calcTaskXp,
  updateStreak,
  isOnTime,
  wasOverdue,
  toDateString,
} from '../_shared/gamification.ts';

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  try {
    // ---------- Auth ----------
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const userId = user.id;

    // ---------- Parse body ----------
    const body = await req.json();
    const { event_id, task_id, occurred_at } = body;

    if (!event_id || !task_id) {
      return new Response(
        JSON.stringify({ error: 'event_id and task_id are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Step 1: Idempotency check ----------
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id, payload')
      .eq('event_id', event_id)
      .maybeSingle();

    if (existingEvent) {
      // Return the prior computed response stored in payload
      return new Response(
        JSON.stringify({ ok: true, idempotent: true, ...(existingEvent.payload ?? {}) }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Step 2: Load task ----------
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, user_id, title, due_date, status, completed_at')
      .eq('id', task_id)
      .single();

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Verify ownership
    if (task.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Step 3: Compute timing ----------
    const completedAt = occurred_at ? new Date(occurred_at) : new Date();
    const todayStr = toDateString(completedAt);

    let taskIsOnTime = true;
    let taskWasOverdue = false;

    if (task.due_date) {
      taskIsOnTime = isOnTime(completedAt, task.due_date);
      taskWasOverdue = wasOverdue(task.status, task.due_date);
    }

    // ---------- Step 4: Load or initialize gamification state ----------
    let { data: gamState } = await supabase
      .from('user_gamification_state')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!gamState) {
      // First-time user — create initial state
      const { data: newState, error: insertError } = await supabase
        .from('user_gamification_state')
        .insert({
          user_id: userId,
          total_xp: 0,
          level: 1,
          xp_into_level: 0,
          xp_for_next_level: 100,
          current_streak: 0,
          longest_streak: 0,
          last_active_date: null,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create gamification state: ${insertError.message}`);
      }
      gamState = newState;
    }

    // ---------- Step 5: Load today's daily stats for XP cap ----------
    let { data: todayStats } = await supabase
      .from('daily_user_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayStr)
      .maybeSingle();

    const todayXpSoFar = todayStats?.xp_gained ?? 0;

    // ---------- Step 6: Compute XP ----------
    const xpResult = calcTaskXp({
      isOnTime: taskIsOnTime,
      wasOverdue: taskWasOverdue,
      todayXpSoFar,
    });

    // ---------- Step 7: Update streak ----------
    const streakResult = updateStreak({
      todayStr,
      lastActiveDate: gamState.last_active_date
        ? toDateString(new Date(gamState.last_active_date))
        : null,
      currentStreak: gamState.current_streak,
      longestStreak: gamState.longest_streak,
    });

    // ---------- Step 8: Update gamification state ----------
    const newTotalXp = gamState.total_xp + xpResult.xpAwarded;
    const levelState = calcLevelState(newTotalXp);
    const previousLevel = gamState.level;
    const leveledUp = levelState.level > previousLevel;

    const { error: gamUpdateError } = await supabase
      .from('user_gamification_state')
      .update({
        total_xp: newTotalXp,
        level: levelState.level,
        xp_into_level: levelState.xpIntoLevel,
        xp_for_next_level: levelState.xpForNextLevel,
        current_streak: streakResult.currentStreak,
        longest_streak: streakResult.longestStreak,
        last_active_date: streakResult.lastActiveDate,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (gamUpdateError) {
      throw new Error(`Failed to update gamification state: ${gamUpdateError.message}`);
    }

    // Also sync XP + level back to the legacy profiles table
    await supabase
      .from('profiles')
      .update({
        xp: newTotalXp,
        level: levelState.level,
        streak_current: streakResult.currentStreak,
        streak_longest: streakResult.longestStreak,
        streak_last_activity: streakResult.lastActiveDate,
      })
      .eq('id', userId);

    // ---------- Step 9: Mark task completed (if not already) ----------
    if (task.status !== 'completed') {
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: completedAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', task_id);
    }

    // ---------- Step 10: Update challenge progress ----------
    const challengeUpdates = await updateChallengeProgress(supabase, userId, todayStr, streakResult.currentStreak);

    // ---------- Step 11: Upsert daily stats (atomic) ----------
    const challengesCompletedInc = challengeUpdates.filter(c => c.completed).length;
    const dailyStatsPayload = {
      user_id: userId,
      date: todayStr,
      tasks_completed: (todayStats?.tasks_completed ?? 0) + 1,
      tasks_completed_on_time: (todayStats?.tasks_completed_on_time ?? 0) + (taskIsOnTime ? 1 : 0),
      tasks_completed_late: (todayStats?.tasks_completed_late ?? 0) + (!taskIsOnTime ? 1 : 0),
      overdue_recovered: (todayStats?.overdue_recovered ?? 0) + (taskWasOverdue ? 1 : 0),
      xp_gained: todayXpSoFar + xpResult.xpAwarded,
      challenges_completed: (todayStats?.challenges_completed ?? 0) + challengesCompletedInc,
    };

    const { error: statsError } = await supabase
      .from('daily_user_stats')
      .upsert(dailyStatsPayload, { onConflict: 'user_id,date' });

    if (statsError) {
      console.error('daily_user_stats upsert error:', statsError.message);
    }

    // ---------- Step 12: Build response payload ----------
    const analyticsDelta = {
      tasksCompleted: 1,
      onTimeInc: taskIsOnTime ? 1 : 0,
      lateInc: !taskIsOnTime ? 1 : 0,
      overdueRecoveredInc: taskWasOverdue ? 1 : 0,
      xpGained: xpResult.xpAwarded,
    };

    const responsePayload = {
      xpDelta: xpResult.xpAwarded,
      totalXp: newTotalXp,
      level: levelState.level,
      xpIntoLevel: levelState.xpIntoLevel,
      xpForNextLevel: levelState.xpForNextLevel,
      leveledUp,
      streak: {
        current: streakResult.currentStreak,
        longest: streakResult.longestStreak,
      },
      challengeUpdates,
      analyticsDelta,
    };

    // ---------- Step 13: Insert event (store full response for idempotent replay) ----------
    const { error: eventError } = await supabase
      .from('events')
      .insert({
        event_id,
        user_id: userId,
        type: 'task_completed',
        task_id,
        occurred_at: completedAt.toISOString(),
        payload: responsePayload,
      });

    if (eventError) {
      throw new Error(`Failed to insert event: ${eventError.message}`);
    }

    // ---------- Response ----------
    return new Response(
      JSON.stringify({ ok: true, ...responsePayload }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('task-completed error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});

// ============================================================
// CHALLENGE PROGRESS HELPER
// ============================================================

interface ChallengeUpdate {
  challengeId: string;
  type: string;
  progressValue: number;
  target: number;
  completed: boolean;
}

// deno-lint-ignore no-explicit-any
async function updateChallengeProgress(supabase: any, userId: string, todayStr: string, currentStreak: number): Promise<ChallengeUpdate[]> {
  const updates: ChallengeUpdate[] = [];

  // Find active challenges the user participates in
  const { data: participations } = await supabase
    .from('challenge_participants')
    .select('challenge_id, challenges!inner(id, type, tracking_method, goal_value, status, ends_at)')
    .eq('user_id', userId)
    .eq('challenges.status', 'active');

  if (!participations?.length) return updates;

  for (const p of participations) {
    const challenge = p.challenges;
    if (!challenge) continue;

    // Check if challenge has expired
    if (new Date(challenge.ends_at) < new Date()) continue;

    // Resolve tracking method: prefer tracking_method, fall back to legacy type
    const method = challenge.tracking_method || challenge.type;

    if (method === 'tasks_completed') {
      // Increment progress by 1 for each task completed
      const { data: progress } = await supabase
        .from('challenge_progress')
        .select('progress_value')
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId)
        .maybeSingle();

      const newValue = (progress?.progress_value ?? 0) + 1;

      await supabase
        .from('challenge_progress')
        .upsert({
          challenge_id: challenge.id,
          user_id: userId,
          progress_value: newValue,
          updated_at: new Date().toISOString(),
        });

      // Also update legacy challenge_participants.progress
      await supabase
        .from('challenge_participants')
        .update({ progress: newValue })
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId);

      updates.push({
        challengeId: challenge.id,
        type: method,
        progressValue: newValue,
        target: challenge.goal_value,
        completed: newValue >= challenge.goal_value,
      });

    } else if (method === 'active_days') {
      // Max +1 per day — dedupe by last_counted_date
      const { data: progress } = await supabase
        .from('challenge_progress')
        .select('progress_value, last_counted_date')
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId)
        .maybeSingle();

      // Only count once per day
      if (progress?.last_counted_date === todayStr) continue;

      const newValue = (progress?.progress_value ?? 0) + 1;

      await supabase
        .from('challenge_progress')
        .upsert({
          challenge_id: challenge.id,
          user_id: userId,
          progress_value: newValue,
          last_counted_date: todayStr,
          updated_at: new Date().toISOString(),
        });

      await supabase
        .from('challenge_participants')
        .update({ progress: newValue })
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId);

      updates.push({
        challengeId: challenge.id,
        type: method,
        progressValue: newValue,
        target: challenge.goal_value,
        completed: newValue >= challenge.goal_value,
      });

    } else if (method === 'daily_checkin') {
      // Streak-based: use current streak as progress, but dedupe by date
      const { data: progress } = await supabase
        .from('challenge_progress')
        .select('progress_value, last_counted_date')
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId)
        .maybeSingle();

      // Only count once per day
      if (progress?.last_counted_date === todayStr) continue;

      const newValue = currentStreak;

      await supabase
        .from('challenge_progress')
        .upsert({
          challenge_id: challenge.id,
          user_id: userId,
          progress_value: newValue,
          last_counted_date: todayStr,
          updated_at: new Date().toISOString(),
        });

      // Also update legacy challenge_participants.progress
      await supabase
        .from('challenge_participants')
        .update({ progress: newValue })
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId);

      updates.push({
        challengeId: challenge.id,
        type: method,
        progressValue: newValue,
        target: challenge.goal_value,
        completed: newValue >= challenge.goal_value,
      });
    }
    // Note: focus_minutes and proof_checkin are NOT updated by task-completed
  }

  return updates;
}
