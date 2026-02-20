// =================================================================
// POST /challenge-checkin
// Manual check-in for challenges with tracking_method = 'manual'
// Supports: auto_accept (instant XP) and creator_approval (pending)
// =================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/config.ts';
import {
  calcCheckinXp,
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
    const { event_id, challenge_id, note, proof_url } = body;

    if (!event_id || !challenge_id) {
      return new Response(
        JSON.stringify({ error: 'event_id and challenge_id are required' }),
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

    // ---------- Verify challenge + participation ----------
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, type, goal_value, status, ends_at, creator_id, tracking_method, verification_mode')
      .eq('id', challenge_id)
      .single();

    if (challengeError || !challenge) {
      return new Response(
        JSON.stringify({ error: 'Challenge not found' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    if (challenge.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Challenge is not active' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    if (new Date(challenge.ends_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Challenge has ended' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Verify user is a participant
    const { data: participant } = await supabase
      .from('challenge_participants')
      .select('challenge_id')
      .eq('challenge_id', challenge_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!participant) {
      return new Response(
        JSON.stringify({ error: 'You are not a participant in this challenge' }),
        { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Dedupe: one check-in per day per challenge ----------
    const todayStr = toDateString(new Date());
    const { data: todayCheckin } = await supabase
      .from('challenge_checkins')
      .select('id')
      .eq('challenge_id', challenge_id)
      .eq('user_id', userId)
      .gte('occurred_at', `${todayStr}T00:00:00`)
      .lt('occurred_at', `${shiftDate(todayStr, 1)}T00:00:00`)
      .maybeSingle();

    if (todayCheckin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Already checked in today' }),
        { status: 409, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Determine status based on verification_mode ----------
    const verificationMode = challenge.verification_mode ?? 'auto_accept';
    const checkinStatus = verificationMode === 'auto_accept' ? 'accepted' : 'pending';

    // ---------- Insert check-in ----------
    const { error: checkinError } = await supabase
      .from('challenge_checkins')
      .insert({
        challenge_id,
        user_id: userId,
        event_id,
        status: checkinStatus,
        note: note ?? null,
        proof_url: proof_url ?? null,
        occurred_at: new Date().toISOString(),
      });

    if (checkinError) {
      throw new Error(`Failed to insert check-in: ${checkinError.message}`);
    }

    let responsePayload: Record<string, unknown>;

    if (checkinStatus === 'accepted') {
      // Auto-accept: award XP + update progress immediately
      responsePayload = await processAcceptedCheckin(supabase, userId, challenge, todayStr);
    } else {
      // Pending: no XP yet, just record
      responsePayload = {
        status: 'pending',
        message: 'Check-in submitted. Awaiting approval from the challenge creator.',
        challengeId: challenge_id,
      };
    }

    // ---------- Insert event ----------
    await supabase
      .from('events')
      .insert({
        event_id,
        user_id: userId,
        type: 'challenge_checkin',
        task_id: null,
        circle_id: null,
        occurred_at: new Date().toISOString(),
        payload: responsePayload,
      });

    return new Response(
      JSON.stringify({ ok: true, ...responsePayload }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('challenge-checkin error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});

// ============================================================
// PROCESS ACCEPTED CHECK-IN (auto_accept or post-approval)
// ============================================================

async function processAcceptedCheckin(
  supabase: any,
  userId: string,
  challenge: any,
  todayStr: string,
): Promise<Record<string, unknown>> {
  // Load gamification state
  let { data: gamState } = await supabase
    .from('user_gamification_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!gamState) {
    const { data: newState } = await supabase
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
    gamState = newState;
  }

  // Load today's daily stats
  const { data: todayStats } = await supabase
    .from('daily_user_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('date', todayStr)
    .maybeSingle();

  const todayXpSoFar = todayStats?.xp_gained ?? 0;

  // Compute XP
  const xpResult = calcCheckinXp(todayXpSoFar);

  // Update streak
  const streakResult = updateStreak({
    todayStr,
    lastActiveDate: gamState.last_active_date
      ? toDateString(new Date(gamState.last_active_date))
      : null,
    currentStreak: gamState.current_streak,
    longestStreak: gamState.longest_streak,
  });

  // Update gamification state
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

  // Sync to profiles
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

  // Update challenge progress
  const { data: progress } = await supabase
    .from('challenge_progress')
    .select('progress_value')
    .eq('challenge_id', challenge.id)
    .eq('user_id', userId)
    .maybeSingle();

  const newProgressValue = (progress?.progress_value ?? 0) + 1;
  const challengeCompleted = newProgressValue >= challenge.goal_value;

  await supabase
    .from('challenge_progress')
    .upsert({
      challenge_id: challenge.id,
      user_id: userId,
      progress_value: newProgressValue,
      last_counted_date: todayStr,
      updated_at: new Date().toISOString(),
    });

  await supabase
    .from('challenge_participants')
    .update({ progress: newProgressValue })
    .eq('challenge_id', challenge.id)
    .eq('user_id', userId);

  // Upsert daily stats
  const challengesCompletedInc = challengeCompleted ? 1 : 0;
  await supabase
    .from('daily_user_stats')
    .upsert({
      user_id: userId,
      date: todayStr,
      tasks_completed: todayStats?.tasks_completed ?? 0,
      tasks_completed_on_time: todayStats?.tasks_completed_on_time ?? 0,
      tasks_completed_late: todayStats?.tasks_completed_late ?? 0,
      overdue_recovered: todayStats?.overdue_recovered ?? 0,
      focus_minutes: todayStats?.focus_minutes ?? 0,
      xp_gained: todayXpSoFar + xpResult.xpAwarded,
      challenge_checkins_accepted: (todayStats?.challenge_checkins_accepted ?? 0) + 1,
      challenges_completed: (todayStats?.challenges_completed ?? 0) + challengesCompletedInc,
    }, { onConflict: 'user_id,date' });

  return {
    status: 'accepted',
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
    challengeUpdate: {
      challengeId: challenge.id,
      type: challenge.type,
      progressValue: newProgressValue,
      target: challenge.goal_value,
      completed: challengeCompleted,
    },
  };
}

// Date helper
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
