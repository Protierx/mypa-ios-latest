/**
 * useAnalytics — server-driven analytics hook (Pass 3 + 4)
 *
 * Fetches analytics from GET /analytics-summary with period switching,
 * caching, loading/error/empty states.
 *
 * Falls back to client-side task counting if the edge function fails.
 *
 * Subscribes to analyticsInvalidationBus so data refreshes immediately
 * after task/focus/check-in events (fixes the core analytics-not-updating bug).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  AnalyticsPeriod,
  AnalyticsSummaryResponse,
  AnalyticsState,
} from '@/types/analytics';
import { api } from '@/services/supabaseApi';
import { supabase } from '@/lib/supabase';
import { analyticsInvalidationBus } from '@/services/analyticsInvalidationBus';

const CACHE_TTL_MS = 60_000; // 1 min

interface CacheEntry {
  data: AnalyticsSummaryResponse;
  ts: number;
}

// ── Client-side fallback when edge function is unavailable ──────────

function periodStartDate(period: AnalyticsPeriod): string {
  const now = new Date();
  switch (period) {
    case 'today': {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    }
    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    case 'all':
      return '2020-01-01T00:00:00';
    default:
      return '2020-01-01T00:00:00';
  }
}

async function buildFallbackData(
  userId: string,
  period: AnalyticsPeriod,
): Promise<AnalyticsSummaryResponse> {
  const startISO = periodStartDate(period);
  const endISO = new Date().toISOString();
  const todayStr = endISO.slice(0, 10);

  // Count completed tasks in the period
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('id, due_date, completed_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', startISO)
    .lte('completed_at', endISO);

  // Count scheduled tasks in the period
  const { count: scheduledCount } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('due_date', startISO)
    .lte('due_date', endISO);

  const tasksCompleted = completedTasks?.length ?? 0;
  let onTimeCount = 0;
  let lateCount = 0;
  for (const t of completedTasks ?? []) {
    if (!t.due_date) {
      onTimeCount++;
    } else {
      const comp = new Date(t.completed_at);
      const due = new Date(t.due_date);
      if (comp <= due) onTimeCount++;
      else lateCount++;
    }
  }

  const scheduled = scheduledCount ?? tasksCompleted;
  const completionRate = scheduled > 0
    ? Math.min(Math.round((tasksCompleted / scheduled) * 100), 100)
    : (tasksCompleted > 0 ? 100 : 0);
  const onTimeRate = tasksCompleted > 0
    ? Math.round((onTimeCount / tasksCompleted) * 100)
    : 0;

  // Load gamification state
  const { data: gamState } = await supabase
    .from('user_gamification_state')
    .select('total_xp, level, xp_into_level, xp_for_next_level, current_streak, longest_streak')
    .eq('user_id', userId)
    .maybeSingle();

  const streakCurrent = gamState?.current_streak ?? 0;
  const streakLongest = gamState?.longest_streak ?? 0;

  // Productivity score (simplified)
  const focusNorm = 0;
  const streakNorm = Math.min(streakCurrent / 14, 1) * 100;
  const prodScore = Math.round(
    completionRate * 0.4 + onTimeRate * 0.25 + focusNorm * 0.2 + streakNorm * 0.15,
  );

  return {
    period,
    range: { start: startISO.slice(0, 10), end: todayStr },
    productivityScore: prodScore,
    productivityScoreDelta: 0,
    insight: tasksCompleted > 0
      ? 'Keep going — momentum builds with each completed task.'
      : 'Start completing tasks to build momentum.',
    tasksCompleted,
    completionRate,
    onTimeRate,
    overdueRecovered: 0,
    focusMinutes: 0,
    xpGained: 0,
    timeSaved: {
      totalMinutes: tasksCompleted * 15,
      taskMinutes: tasksCompleted * 15,
      focusMinutes: 0,
      prevTotalMinutes: 0,
    },
    streakCurrent,
    streakLongest,
    streakHeatmap: [false, false, false, false, false, false, false],
    streakHeatLabels: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
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
    previousStats: null,
    deltas: null,
    execution: {
      completed: tasksCompleted,
      avgMinutes: 15,
      overdueRecovered: 0,
    },
    challengeCheckinsAccepted: 0,
    challengesCompleted: 0,
    aiInsights: [],
    daily: [],
  };
}

// ── Main hook ──────────────────────────────────────────────────────

/**
 * Fetches the analytics summary from the edge function and caches
 * by period for CACHE_TTL_MS. Returns data, loading, error, period,
 * setPeriod, and a refresh() method.
 */
export function useAnalytics(initialPeriod: AnalyticsPeriod = '7d') {
  const [state, setState] = useState<AnalyticsState>({
    data: null,
    loading: true,
    error: null,
    period: initialPeriod,
  });

  const cache = useRef<Record<string, CacheEntry>>({});
  const mountedRef = useRef(true);
  const periodRef = useRef(state.period);
  periodRef.current = state.period;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async (period: AnalyticsPeriod, force = false) => {
    // Guard: don't call edge function if there's no auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('[useAnalytics] No auth session, skipping fetch');
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, loading: false, error: 'Please sign in to view analytics', period }));
      }
      return;
    }

    // Check cache
    const cached = cache.current[period];
    if (!force && cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setState({ data: cached.data, loading: false, error: null, period });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null, period }));

    try {
      const data = await api.getAnalyticsSummary(period);
      console.log('[useAnalytics] Response for', period, '→ tasksCompleted:', data?.tasksCompleted, 'focusMinutes:', data?.focusMinutes, 'keys:', data ? Object.keys(data).slice(0, 8) : 'null');
      if (!mountedRef.current) return;
      cache.current[period] = { data, ts: Date.now() };
      setState({ data, loading: false, error: null, period });
    } catch (err: any) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      // Log the error for debugging
      let serverError = '';
      try {
        if (err?.context?.json) {
          const body = await err.context.json();
          serverError = body?.error || body?.message || '';
        }
      } catch { /* ignore */ }
      console.warn('[useAnalytics] edge function failed:', message, serverError ? `| server: ${serverError}` : '', '— falling back to client-side');

      // Fallback: compute analytics from the tasks table directly
      try {
        const { data: { session: fallbackSession } } = await supabase.auth.getSession();
        if (fallbackSession?.user?.id) {
          const fallbackData = await buildFallbackData(fallbackSession.user.id, period);
          if (!mountedRef.current) return;
          cache.current[period] = { data: fallbackData, ts: Date.now() };
          setState({ data: fallbackData, loading: false, error: null, period });
          return;
        }
      } catch (fallbackErr) {
        console.warn('[useAnalytics] fallback also failed:', fallbackErr);
      }

      // If even the fallback failed, show a user-friendly error
      setState((prev) => ({ ...prev, loading: false, error: "Couldn't load analytics. Please try again." }));
    }
  }, []);

  // Fetch on mount + when period changes
  useEffect(() => {
    fetchData(state.period);
  }, [state.period, fetchData]);

  // Listen for invalidation events from gamification context
  useEffect(() => {
    const unsubscribe = analyticsInvalidationBus.subscribe(() => {
      // Clear all cached periods and refetch the current one
      cache.current = {};
      if (mountedRef.current) {
        fetchData(periodRef.current, true);
      }
    });
    return unsubscribe;
  }, [fetchData]);

  const setPeriod = useCallback((p: AnalyticsPeriod) => {
    setState((prev) => ({ ...prev, period: p }));
  }, []);

  const refresh = useCallback(() => {
    fetchData(state.period, true);
  }, [state.period, fetchData]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    period: state.period,
    setPeriod,
    refresh,
    hasData: !!state.data && (state.data.tasksCompleted > 0 || state.data.focusMinutes > 0),
  };
}
