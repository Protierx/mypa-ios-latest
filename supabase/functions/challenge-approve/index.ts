// =================================================================
// POST /challenge-approve
// Allows challenge creator to approve/reject pending check-ins
// On approval: awards XP, updates progress, updates daily stats
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

    const reviewerId = user.id;

    // ---------- Parse body ----------
    const body = await req.json();
    const { checkin_id, decision } = body;  // decision: 'accepted' | 'rejected'

    if (!checkin_id || !decision) {
      return new Response(
        JSON.stringify({ error: 'checkin_id and decision are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    if (!['accepted', 'rejected'].includes(decision)) {
      return new Response(
        JSON.stringify({ error: 'decision must be "accepted" or "rejected"' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Load check-in ----------
    const { data: checkin, error: checkinError } = await supabase
      .from('challenge_checkins')
      .select('id, challenge_id, user_id, status, occurred_at')
      .eq('id', checkin_id)
      .single();

    if (checkinError || !checkin) {
      return new Response(
        JSON.stringify({ error: 'Check-in not found' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    if (checkin.status !== 'pending') {
      return new Response(
        JSON.stringify({ ok: true, message: 'Check-in already reviewed', status: checkin.status }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Verify reviewer is challenge creator ----------
    const { data: challenge } = await supabase
      .from('challenges')
      .select('id, creator_id, type, goal_value, status, ends_at')
      .eq('id', checkin.challenge_id)
      .single();

    if (!challenge || challenge.creator_id !== reviewerId) {
      return new Response(
        JSON.stringify({ error: 'Only the challenge creator can approve check-ins' }),
        { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Update check-in status ----------
    await supabase
      .from('challenge_checkins')
      .update({
        status: decision,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', checkin_id);

    if (decision === 'rejected') {
      return new Response(
        JSON.stringify({ ok: true, status: 'rejected', message: 'Check-in rejected' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Accepted: award XP + update progress for the check-in user ----------
    const checkinUserId = checkin.user_id;
    const todayStr = toDateString(new Date());

    // Load gamification state for the check-in user
    let { data: gamState } = await supabase
      .from('user_gamification_state')
      .select('*')
      .eq('user_id', checkinUserId)
      .maybeSingle();

    if (!gamState) {
      const { data: newState } = await supabase
        .from('user_gamification_state')
        .insert({
          user_id: checkinUserId,
          total_xp: 0, level: 1, xp_into_level: 0, xp_for_next_level: 100,
          current_streak: 0, longest_streak: 0, last_active_date: null,
        })
        .select()
        .single();
      gamState = newState;
    }

    // Load today's daily stats
    const { data: todayStats } = await supabase
      .from('daily_user_stats')
      .select('*')
      .eq('user_id', checkinUserId)
      .eq('date', todayStr)
      .maybeSingle();

    const todayXpSoFar = todayStats?.xp_gained ?? 0;
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
      .eq('user_id', checkinUserId);

    // Sync profiles
    await supabase
      .from('profiles')
      .update({
        xp: newTotalXp,
        level: levelState.level,
        streak_current: streakResult.currentStreak,
        streak_longest: streakResult.longestStreak,
        streak_last_activity: streakResult.lastActiveDate,
      })
      .eq('id', checkinUserId);

    // Update challenge progress
    const { data: progress } = await supabase
      .from('challenge_progress')
      .select('progress_value')
      .eq('challenge_id', challenge.id)
      .eq('user_id', checkinUserId)
      .maybeSingle();

    const newProgressValue = (progress?.progress_value ?? 0) + 1;
    const challengeCompleted = newProgressValue >= challenge.goal_value;

    await supabase
      .from('challenge_progress')
      .upsert({
        challenge_id: challenge.id,
        user_id: checkinUserId,
        progress_value: newProgressValue,
        last_counted_date: todayStr,
        updated_at: new Date().toISOString(),
      });

    await supabase
      .from('challenge_participants')
      .update({ progress: newProgressValue })
      .eq('challenge_id', challenge.id)
      .eq('user_id', checkinUserId);

    // Upsert daily stats
    const challengesCompletedInc = challengeCompleted ? 1 : 0;
    await supabase
      .from('daily_user_stats')
      .upsert({
        user_id: checkinUserId,
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

    return new Response(
      JSON.stringify({
        ok: true,
        status: 'accepted',
        xpDelta: xpResult.xpAwarded,
        challengeUpdate: {
          challengeId: challenge.id,
          type: challenge.type,
          progressValue: newProgressValue,
          target: challenge.goal_value,
          completed: challengeCompleted,
        },
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('challenge-approve error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
