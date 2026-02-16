// =================================================================
// POST /focus-completed
// Event-driven focus-session completion processor
// Handles: idempotency → XP → streak → challenge progress → stats
// =================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/config.ts';
import {
  calcFocusXp,
  calcLevelState,
  updateStreak,
  toDateString,
} from '../_shared/gamification.ts';

serve(async (req: Request) => {
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
    const { event_id, session_id, actual_minutes, occurred_at } = body;

    if (!event_id || !session_id || actual_minutes == null) {
      return new Response(
        JSON.stringify({ error: 'event_id, session_id, and actual_minutes are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Idempotency ----------
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id, payload')
      .eq('event_id', event_id)
      .maybeSingle();

    if (existingEvent) {
      return new Response(
        JSON.stringify({ ok: true, idempotent: true, ...(existingEvent.payload ?? {}) }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Verify session ----------
    const { data: session, error: sessionError } = await supabase
      .from('focus_sessions')
      .select('id, user_id, duration_planned, duration_actual, ended_at')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Focus session not found' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    if (session.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const completedAt = occurred_at ? new Date(occurred_at) : new Date();
    const todayStr = toDateString(completedAt);
    const minutes = Math.max(0, Math.round(actual_minutes));

    // ---------- Load gamification state ----------
    let { data: gamState } = await supabase
      .from('user_gamification_state')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!gamState) {
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

    // ---------- Load today's daily stats ----------
    let { data: todayStats } = await supabase
      .from('daily_user_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayStr)
      .maybeSingle();

    const todayXpSoFar = todayStats?.xp_gained ?? 0;

    // ---------- Compute XP ----------
    const xpResult = calcFocusXp(minutes, todayXpSoFar);

    // ---------- Update streak ----------
    const streakResult = updateStreak({
      todayStr,
      lastActiveDate: gamState.last_active_date
        ? toDateString(new Date(gamState.last_active_date))
        : null,
      currentStreak: gamState.current_streak,
      longestStreak: gamState.longest_streak,
    });

    // ---------- Update gamification state ----------
    const newTotalXp = gamState.total_xp + xpResult.xpAwarded;
    const levelState = calcLevelState(newTotalXp);
    const previousLevel = gamState.level;
    const leveledUp = levelState.level > previousLevel;

    await supabase
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

    // Sync to legacy profiles
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

    // ---------- Update challenge progress (focus_time type) ----------
    const challengeUpdates = await updateFocusChallengeProgress(supabase, userId, minutes, todayStr);
    const challengesCompletedInc = challengeUpdates.filter(c => c.completed).length;

    // ---------- Upsert daily stats ----------
    const dailyStatsPayload = {
      user_id: userId,
      date: todayStr,
      tasks_completed: todayStats?.tasks_completed ?? 0,
      tasks_completed_on_time: todayStats?.tasks_completed_on_time ?? 0,
      tasks_completed_late: todayStats?.tasks_completed_late ?? 0,
      overdue_recovered: todayStats?.overdue_recovered ?? 0,
      focus_minutes: (todayStats?.focus_minutes ?? 0) + minutes,
      xp_gained: todayXpSoFar + xpResult.xpAwarded,
      challenges_completed: (todayStats?.challenges_completed ?? 0) + challengesCompletedInc,
    };

    await supabase
      .from('daily_user_stats')
      .upsert(dailyStatsPayload, { onConflict: 'user_id,date' });

    // ---------- Build response ----------
    const analyticsDelta = {
      focusMinutesInc: minutes,
      xpGained: xpResult.xpAwarded,
    };

    const responsePayload = {
      xpDelta: xpResult.xpAwarded,
      qualifies: xpResult.qualifies,
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

    // ---------- Insert event ----------
    await supabase
      .from('events')
      .insert({
        event_id,
        user_id: userId,
        type: 'focus_completed',
        task_id: null,
        occurred_at: completedAt.toISOString(),
        payload: responsePayload,
      });

    return new Response(
      JSON.stringify({ ok: true, ...responsePayload }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('focus-completed error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});

// ============================================================
// FOCUS CHALLENGE PROGRESS HELPER
// ============================================================

interface ChallengeUpdate {
  challengeId: string;
  type: string;
  progressValue: number;
  target: number;
  completed: boolean;
}

async function updateFocusChallengeProgress(
  supabase: any,
  userId: string,
  focusMinutes: number,
  todayStr: string,
): Promise<ChallengeUpdate[]> {
  const updates: ChallengeUpdate[] = [];

  const { data: participations } = await supabase
    .from('challenge_participants')
    .select('challenge_id, challenges!inner(id, type, tracking_method, goal_value, status, ends_at)')
    .eq('user_id', userId)
    .eq('challenges.status', 'active');

  if (!participations?.length) return updates;

  for (const p of participations) {
    const challenge = p.challenges;
    if (!challenge) continue;
    if (new Date(challenge.ends_at) < new Date()) continue;

    // Resolve tracking method: prefer tracking_method, fall back to legacy type
    const method = challenge.tracking_method || challenge.type;

    if (method === 'focus_minutes' || method === 'focus_time') {
      // Accumulate focus minutes
      const { data: progress } = await supabase
        .from('challenge_progress')
        .select('progress_value')
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId)
        .maybeSingle();

      const newValue = (progress?.progress_value ?? 0) + focusMinutes;

      await supabase
        .from('challenge_progress')
        .upsert({
          challenge_id: challenge.id,
          user_id: userId,
          progress_value: newValue,
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

    } else if (method === 'active_days') {
      // Max +1 per day — dedupe by last_counted_date
      const { data: progress } = await supabase
        .from('challenge_progress')
        .select('progress_value, last_counted_date')
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId)
        .maybeSingle();

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
    }
    // Note: tasks_completed and proof_checkin are NOT updated by focus-completed
  }

  return updates;
}
