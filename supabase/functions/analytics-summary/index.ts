// =================================================================
// GET /analytics-summary
// Returns aggregated analytics for a user by period
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

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'GET') {
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

    // ---------- Parse query params ----------
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '7d';
    const todayStr = toDateString(new Date());

    // ---------- Current period stats ----------
    const range = periodRange(period, todayStr);
    const currentStats = await aggregateStats(supabase, userId, range);

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

    // ---------- Response ----------
    return new Response(
      JSON.stringify({
        period,
        range,
        // Core metrics (spec fields)
        tasksCompleted: currentStats.tasksCompleted,
        completionRate: currentStats.completionRate,
        onTimeRate: currentStats.onTimeRate,
        overdueRecovered: currentStats.overdueRecovered,
        focusMinutes: currentStats.focusMinutes,
        xpGained: currentStats.xpGained,
        streakCurrent: gamState?.current_streak ?? 0,
        streakLongest: gamState?.longest_streak ?? 0,
        // Detailed breakdowns
        stats: currentStats,
        previousStats: previousStats ?? undefined,
        deltas: deltas ?? undefined,
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
        daily: dailyRows ?? [],
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('analytics-summary error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
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
}

// deno-lint-ignore no-explicit-any
async function aggregateStats(supabase: any, userId: string, range: PeriodRange): Promise<AggregatedStats> {
  const { data: rows } = await supabase
    .from('daily_user_stats')
    .select('tasks_completed, tasks_completed_on_time, tasks_completed_late, overdue_recovered, focus_minutes, xp_gained')
    .eq('user_id', userId)
    .gte('date', range.start)
    .lte('date', range.end);

  if (!rows?.length) {
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
    };
  }

  const tasksCompleted = sum(rows, 'tasks_completed');
  const tasksCompletedOnTime = sum(rows, 'tasks_completed_on_time');
  const tasksCompletedLate = sum(rows, 'tasks_completed_late');
  const overdueRecovered = sum(rows, 'overdue_recovered');
  const focusMinutes = sum(rows, 'focus_minutes');
  const xpGained = sum(rows, 'xp_gained');

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
