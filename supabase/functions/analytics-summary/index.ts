// @ts-nocheck — Deno edge function; not type-checked by Node/TS
// =================================================================
// GET /analytics-summary  (v2 — Pass 3)
// Returns aggregated analytics for a user by period, including
// productivity score, previous-period comparison, and AI insights.
//
// Query params: period = 'today' | '7d' | '30d' | 'all'
// =================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/config.ts';
import { toDateString, shiftDateString } from '../_shared/gamification.ts';

interface PeriodRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

function periodRange(period: string, todayStr: string): PeriodRange {
  switch (period) {
    case 'today':
      return { start: todayStr, end: todayStr };
    case '7d':
      return { start: shiftDateString(todayStr, -6), end: todayStr };
    case '30d':
      return { start: shiftDateString(todayStr, -29), end: todayStr };
    case 'all':
      return { start: '2020-01-01', end: todayStr };
    default:
      return { start: shiftDateString(todayStr, -6), end: todayStr }; // default to 7d
  }
}

function previousPeriodRange(period: string, todayStr: string): PeriodRange | null {
  switch (period) {
    case 'today':
      return {
        start: shiftDateString(todayStr, -1),
        end: shiftDateString(todayStr, -1),
      };
    case '7d':
      return {
        start: shiftDateString(todayStr, -13),
        end: shiftDateString(todayStr, -7),
      };
    case '30d':
      return {
        start: shiftDateString(todayStr, -59),
        end: shiftDateString(todayStr, -30),
      };
    default:
      return null; // 'all' has no previous period
  }
}

// ============================================================
// Productivity score — weighted composite 0-100
// Weights: completion 40%, on-time 25%, focus 20%, streak 15%
// ============================================================

function productivityScore(
  completionRate: number,
  onTimeRate: number,
  focusMinutes: number,
  streakDays: number,
): number {
  const focusNorm = Math.min(focusMinutes / 120, 1) * 100; // 2 h = max
  const streakNorm = Math.min(streakDays / 14, 1) * 100;   // 14 d = max
  const raw =
    completionRate * 0.4 +
    onTimeRate * 0.25 +
    focusNorm * 0.2 +
    streakNorm * 0.15;
  return Math.round(Math.min(raw, 100));
}

// ============================================================
// AI Insights — max 3 short actionable tips
// ============================================================

interface InsightOut {
  id: string;
  icon: string;
  iconColor: string;
  text: string;
  cta?: string;
  ctaAction?: string;
}

function fmtMin(m: number): string {
  if (m === 0) return '0 m';
  if (m < 60) return `${Math.round(m)} m`;
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

function generateInsights(
  stats: AggregatedStats,
  prev: AggregatedStats | null,
  streak: number,
  period: string,
): InsightOut[] {
  const out: InsightOut[] = [];

  if (stats.tasksCompleted === 0) {
    out.push({
      id: 'no-tasks',
      icon: 'rocket-outline',
      iconColor: '#3B82F6',
      text: 'No tasks completed yet this period. Start with one small win.',
      cta: 'Add a task',
      ctaAction: 'add-task',
    });
    return out;
  }

  // On-time warning
  if (stats.onTimeRate < 70 && stats.tasksCompleted > 2) {
    out.push({
      id: 'on-time',
      icon: 'alarm-outline',
      iconColor: '#F59E0B',
      text: `Only ${stats.onTimeRate}% on-time this ${period === 'today' ? 'day' : 'period'}. Try shorter deadlines or time-blocking.`,
      cta: 'Review overdue',
      ctaAction: 'review-tasks',
    });
  }

  // Streak
  if (streak === 0) {
    out.push({
      id: 'streak-reset',
      icon: 'flame-outline',
      iconColor: '#EF4444',
      text: 'Your streak reset. Complete one task today to start fresh.',
      cta: 'View tasks',
      ctaAction: 'view-tasks',
    });
  } else if (streak >= 3 && streak < 7) {
    out.push({
      id: 'streak-growing',
      icon: 'flame-outline',
      iconColor: '#F97316',
      text: `${streak}-day streak! ${7 - streak} more days to hit a full week.`,
    });
  }

  // Focus
  if (stats.focusMinutes > 60) {
    out.push({
      id: 'focus-strong',
      icon: 'timer-outline',
      iconColor: '#3B82F6',
      text: `${fmtMin(stats.focusMinutes)} of deep focus — real productivity.`,
    });
  } else if (stats.focusMinutes === 0 && stats.tasksCompleted > 0) {
    out.push({
      id: 'no-focus',
      icon: 'timer-outline',
      iconColor: '#8E8E93',
      text: 'Try a focus session to get more done with less distraction.',
      cta: 'Start focus',
      ctaAction: 'start-focus',
    });
  }

  // High completion
  if (stats.completionRate >= 85) {
    out.push({
      id: 'high-completion',
      icon: 'checkmark-circle-outline',
      iconColor: '#22C55E',
      text: `${stats.completionRate}% completion rate — executing at a high level.`,
    });
  }

  // Improvement vs previous period
  if (prev && prev.tasksCompleted > 0) {
    const delta = stats.tasksCompleted - prev.tasksCompleted;
    if (delta > 0) {
      out.push({
        id: 'improving',
        icon: 'trending-up',
        iconColor: '#22C55E',
        text: `You completed ${delta} more tasks than the previous period. Keep it up.`,
      });
    }
  }

  return out.slice(0, 3);
}

// ============================================================
// Hero insight — one-liner
// ============================================================

function heroInsight(
  completionRate: number,
  onTimeRate: number,
  streakDays: number,
  completedCount: number,
): string {
  if (completedCount === 0) return 'Start completing tasks to build momentum.';
  if (completionRate >= 90 && onTimeRate >= 90)
    return "Outstanding execution — you're crushing it.";
  if (completionRate >= 70)
    return 'Strong progress. Focus on on-time delivery next.';
  if (streakDays >= 7)
    return `${streakDays}-day streak! Consistency is paying off.`;
  if (onTimeRate < 60)
    return 'Consider breaking tasks into smaller pieces for better timing.';
  return 'Keep going — momentum builds with each completed task.';
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
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
    console.log('[analytics-summary] user:', userId, 'method:', req.method);

    // ---------- Parse query params ----------
    const url = new URL(req.url);
    let period = url.searchParams.get('period')
      || req.headers.get('x-period')
      || '';

    // For POST requests, also check the body for period
    if (!period && req.method === 'POST') {
      try {
        const body = await req.json();
        period = body?.period || '';
      } catch { /* no body */ }
    }
    if (!period) period = '7d';
    console.log('[analytics-summary] period:', period);
    const todayStr = toDateString(new Date());

    // ---------- Current period stats ----------
    const range = periodRange(period, todayStr);
    console.log('[analytics-summary] range:', JSON.stringify(range));
    const currentStats = await aggregateStats(supabase, userId, range);
    console.log('[analytics-summary] currentStats.tasksCompleted:', currentStats.tasksCompleted);

    // ---------- Previous period stats (for comparison) ----------
    const prevRange = previousPeriodRange(period, todayStr);
    const previousStats = prevRange
      ? await aggregateStats(supabase, userId, prevRange)
      : null;

    // ---------- Load gamification state ----------
    const { data: gamState } = await supabase
      .from('user_gamification_state')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // ---------- Compute deltas ----------
    const deltas = previousStats
      ? {
          tasksCompleted: currentStats.tasksCompleted - previousStats.tasksCompleted,
          xpGained: currentStats.xpGained - previousStats.xpGained,
          completionRate: round(currentStats.completionRate - previousStats.completionRate, 1),
          onTimeRate: round(currentStats.onTimeRate - previousStats.onTimeRate, 1),
          focusMinutes: currentStats.focusMinutes - previousStats.focusMinutes,
          timeSaved: (currentStats.focusMinutes + avgTaskMin(currentStats)) -
                     (previousStats.focusMinutes + avgTaskMin(previousStats)),
        }
      : null;

    // ---------- Fetch daily breakdown for charts ----------
    const { data: dailyRows } = await supabase
      .from('daily_user_stats')
      .select('date, tasks_completed, tasks_completed_on_time, xp_gained, focus_minutes')
      .eq('user_id', userId)
      .gte('date', range.start)
      .lte('date', range.end)
      .order('date', { ascending: true });

    // ---------- 7-day streak heatmap ----------
    const heatmapStart = shiftDateString(todayStr, -6);
    const { data: heatRows } = await supabase
      .from('daily_user_stats')
      .select('date, tasks_completed')
      .eq('user_id', userId)
      .gte('date', heatmapStart)
      .lte('date', todayStr)
      .order('date', { ascending: true });

    const heatmap: boolean[] = [];
    const heatLabels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(`${shiftDateString(todayStr, -i)}T12:00:00Z`);
      const ds = shiftDateString(todayStr, -i);
      const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      heatLabels.push(dayNames[d.getUTCDay()]);
      heatmap.push(
        (heatRows ?? []).some(
          // deno-lint-ignore no-explicit-any
          (r: any) => r.date === ds && (r.tasks_completed ?? 0) > 0,
        ),
      );
    }

    // ---------- Productivity score ----------
    const streakCurrent = gamState?.current_streak ?? 0;
    const streakLongest = gamState?.longest_streak ?? 0;

    const score = productivityScore(
      currentStats.completionRate,
      currentStats.onTimeRate,
      currentStats.focusMinutes,
      streakCurrent,
    );

    const prevScore = previousStats
      ? productivityScore(
          previousStats.completionRate,
          previousStats.onTimeRate,
          previousStats.focusMinutes,
          Math.max(streakCurrent - 1, 0),
        )
      : score;

    const scoreDelta = score - prevScore;

    // ---------- Insight text ----------
    const insight = heroInsight(
      currentStats.completionRate,
      currentStats.onTimeRate,
      streakCurrent,
      currentStats.tasksCompleted,
    );

    // ---------- AI Insights ----------
    const aiInsights = generateInsights(
      currentStats,
      previousStats,
      streakCurrent,
      period,
    );

    // ---------- Time saved ----------
    const taskEstMinutes = avgTaskMin(currentStats);
    const timeSavedTotal = currentStats.focusMinutes + taskEstMinutes;
    const prevTimeSaved = previousStats
      ? previousStats.focusMinutes + avgTaskMin(previousStats)
      : 0;

    // ---------- Response ----------
    return new Response(
      JSON.stringify({
        period,
        range,

        // ── Hero summary ───────────────────────────────
        productivityScore: score,
        productivityScoreDelta: scoreDelta,
        insight,

        // ── Core metrics ───────────────────────────────
        tasksCompleted: currentStats.tasksCompleted,
        completionRate: currentStats.completionRate,
        onTimeRate: currentStats.onTimeRate,
        overdueRecovered: currentStats.overdueRecovered,
        focusMinutes: currentStats.focusMinutes,
        xpGained: currentStats.xpGained,

        // ── Time Saved ─────────────────────────────────
        timeSaved: {
          totalMinutes: timeSavedTotal,
          taskMinutes: taskEstMinutes,
          focusMinutes: currentStats.focusMinutes,
          prevTotalMinutes: prevTimeSaved,
        },

        // ── Streak ─────────────────────────────────────
        streakCurrent,
        streakLongest,
        streakHeatmap: heatmap,
        streakHeatLabels: heatLabels,

        // ── Gamification ───────────────────────────────
        gamification: gamState
          ? {
              totalXp: gamState.total_xp,
              level: gamState.level,
              xpIntoLevel: gamState.xp_into_level,
              xpForNextLevel: gamState.xp_for_next_level,
              currentStreak: gamState.current_streak,
              longestStreak: gamState.longest_streak,
            }
          : null,

        // ── Previous period values ─────────────────────
        previousStats: previousStats
          ? {
              tasksCompleted: previousStats.tasksCompleted,
              completionRate: previousStats.completionRate,
              onTimeRate: previousStats.onTimeRate,
              focusMinutes: previousStats.focusMinutes,
              xpGained: previousStats.xpGained,
              overdueRecovered: previousStats.overdueRecovered,
            }
          : null,

        // ── Deltas ─────────────────────────────────────
        deltas: deltas ?? null,

        // ── Execution summary ──────────────────────────
        execution: {
          completed: currentStats.tasksCompleted,
          avgMinutes: currentStats.tasksCompleted > 0
            ? round(taskEstMinutes / currentStats.tasksCompleted, 0)
            : 0,
          overdueRecovered: currentStats.overdueRecovered,
        },

        // ── Challenge metrics ──────────────────────────
        challengeCheckinsAccepted: currentStats.challengeCheckinsAccepted,
        challengesCompleted: currentStats.challengesCompleted,

        // ── AI Insights ────────────────────────────────
        aiInsights,

        // ── Daily chart data ───────────────────────────
        daily: dailyRows ?? [],
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : '';
    console.error('analytics-summary error:', errMsg, errStack);
    return new Response(
      JSON.stringify({ error: errMsg, stack: errStack }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});

// ============================================================
// AGGREGATE STATS FROM daily_user_stats
// ============================================================

interface AggregatedStats {
  tasksCompleted: number;
  tasksCompletedOnTime: number;
  tasksCompletedLate: number;
  overdueRecovered: number;
  focusMinutes: number;
  xpGained: number;
  completionRate: number;  // percentage 0-100
  onTimeRate: number;      // percentage 0-100
  daysActive: number;
  challengeCheckinsAccepted: number;
  challengesCompleted: number;
}

// deno-lint-ignore no-explicit-any
async function aggregateStats(supabase: any, userId: string, range: PeriodRange): Promise<AggregatedStats> {
  // Try full column set first; fall back to base columns if challenge columns don't exist yet
  let rows: any[] | null = null;
  const fullCols = 'tasks_completed, tasks_completed_on_time, tasks_completed_late, overdue_recovered, focus_minutes, xp_gained, challenge_checkins_accepted, challenges_completed';
  const baseCols = 'tasks_completed, tasks_completed_on_time, tasks_completed_late, overdue_recovered, focus_minutes, xp_gained';

  const fullResult = await supabase
    .from('daily_user_stats')
    .select(fullCols)
    .eq('user_id', userId)
    .gte('date', range.start)
    .lte('date', range.end);

  if (fullResult.error) {
    // Challenge columns may not exist — retry with base columns
    console.warn('daily_user_stats full select failed, retrying base:', fullResult.error.message);
    const baseResult = await supabase
      .from('daily_user_stats')
      .select(baseCols)
      .eq('user_id', userId)
      .gte('date', range.start)
      .lte('date', range.end);
    rows = baseResult.data;
  } else {
    rows = fullResult.data;
  }

  let tasksCompleted = rows?.length ? sum(rows, 'tasks_completed') : 0;
  let tasksCompletedOnTime = rows?.length ? sum(rows, 'tasks_completed_on_time') : 0;
  let tasksCompletedLate = rows?.length ? sum(rows, 'tasks_completed_late') : 0;
  const overdueRecovered = rows?.length ? sum(rows, 'overdue_recovered') : 0;
  const focusMinutes = rows?.length ? sum(rows, 'focus_minutes') : 0;
  const xpGained = rows?.length ? sum(rows, 'xp_gained') : 0;
  const challengeCheckinsAccepted = rows?.length ? sum(rows, 'challenge_checkins_accepted') : 0;
  const challengesCompleted = rows?.length ? sum(rows, 'challenges_completed') : 0;

  // Fallback: if daily_user_stats has 0 completed tasks, count directly
  // from the tasks table. This covers tasks completed before gamification
  // was deployed, or if the task-completed edge function failed.
  if (tasksCompleted === 0) {
    const { data: completedRows } = await supabase
      .from('tasks')
      .select('id, due_date, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', `${range.start}T00:00:00`)
      .lte('completed_at', `${range.end}T23:59:59`);

    if (completedRows?.length) {
      tasksCompleted = completedRows.length;
      // Estimate on-time: completed_at <= due_date (or no due_date = on time)
      for (const t of completedRows) {
        if (!t.due_date) {
          tasksCompletedOnTime++;
        } else {
          const completedAt = new Date(t.completed_at);
          const dueDate = new Date(t.due_date);
          if (completedAt <= dueDate) {
            tasksCompletedOnTime++;
          } else {
            tasksCompletedLate++;
          }
        }
      }
    }
  }

  if (tasksCompleted === 0) {
    return {
      tasksCompleted: 0,
      tasksCompletedOnTime: 0,
      tasksCompletedLate: 0,
      overdueRecovered: 0,
      focusMinutes: 0,
      xpGained: 0,
      completionRate: 0,
      onTimeRate: 0,
      daysActive: 0,
      challengeCheckinsAccepted: 0,
      challengesCompleted: 0,
    };
  }

  // Count total tasks in the date range (scheduled) from the tasks table
  // For now, use completed tasks as the denominator for rates
  const onTimeRate = tasksCompleted > 0
    ? round((tasksCompletedOnTime / tasksCompleted) * 100, 1)
    : 0;

  // Completion rate: count tasks scheduled in the period vs completed
  // We'll compute this separately from the tasks table
  const scheduledCount = await countScheduledTasks(supabase, userId, range);
  const completionRate = scheduledCount > 0
    ? round((tasksCompleted / scheduledCount) * 100, 1)
    : (tasksCompleted > 0 ? 100 : 0);

  return {
    tasksCompleted,
    tasksCompletedOnTime,
    tasksCompletedLate,
    overdueRecovered,
    focusMinutes,
    xpGained,
    completionRate: Math.min(completionRate, 100), // cap at 100%
    onTimeRate,
    daysActive: rows.length,
    challengeCheckinsAccepted,
    challengesCompleted,
  };
}

// deno-lint-ignore no-explicit-any
async function countScheduledTasks(supabase: any, userId: string, range: PeriodRange): Promise<number> {
  const { count } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('due_date', `${range.start}T00:00:00`)
    .lte('due_date', `${range.end}T23:59:59`);

  return count ?? 0;
}

/** Estimate total task minutes (use estimated_duration sum from tasks table). */
function avgTaskMin(stats: AggregatedStats): number {
  // Rough proxy: 15 min per completed task (a reasonable default).
  // In a full build this would sum estimated_duration from the tasks table.
  return stats.tasksCompleted * 15;
}

// ============================================================
// Utility helpers
// ============================================================

// deno-lint-ignore no-explicit-any
function sum(rows: any[], key: string): number {
  return rows.reduce((acc: number, row: any) => acc + (row[key] ?? 0), 0);
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
