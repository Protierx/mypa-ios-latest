/**
 * Analytics Types — Pass 3
 *
 * Shared TypeScript types for the analytics-summary API response
 * and the useAnalytics hook UI state.
 */

// ── Period filter ────────────────────────────────────────────

export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'all';

// ── API response shape (GET /analytics-summary?period=…) ────

export interface AnalyticsSummaryResponse {
  period: AnalyticsPeriod;
  range: { start: string; end: string };

  // Hero summary
  productivityScore: number;          // 0-100
  productivityScoreDelta: number;     // vs previous period
  insight: string;                    // one-liner

  // Core metrics
  tasksCompleted: number;
  completionRate: number;             // 0-100
  onTimeRate: number;                 // 0-100
  overdueRecovered: number;
  focusMinutes: number;
  xpGained: number;

  // Time saved
  timeSaved: {
    totalMinutes: number;
    taskMinutes: number;
    focusMinutes: number;
    prevTotalMinutes: number;
  };

  // Streak
  streakCurrent: number;
  streakLongest: number;
  streakHeatmap: boolean[];           // 7 booleans (6 days ago → today)
  streakHeatLabels: string[];         // ['S','M','T',…]

  // Gamification
  gamification: {
    totalXp: number;
    level: number;
    xpIntoLevel: number;
    xpForNextLevel: number;
    currentStreak: number;
    longestStreak: number;
  } | null;

  // Previous period
  previousStats: {
    tasksCompleted: number;
    completionRate: number;
    onTimeRate: number;
    focusMinutes: number;
    xpGained: number;
    overdueRecovered: number;
  } | null;

  // Deltas (current - previous)
  deltas: {
    tasksCompleted: number;
    xpGained: number;
    completionRate: number;
    onTimeRate: number;
    focusMinutes: number;
    timeSaved: number;
  } | null;

  // Execution summary
  execution: {
    completed: number;
    avgMinutes: number;
    overdueRecovered: number;
  };

  // Challenge metrics
  challengeCheckinsAccepted: number;
  challengesCompleted: number;

  // AI Insights (max 3)
  aiInsights: AnalyticsInsight[];

  // Daily chart data
  daily: DailyRow[];
}

export interface AnalyticsInsight {
  id: string;
  icon: string;
  iconColor: string;
  text: string;
  cta?: string;
  ctaAction?: string;
}

export interface DailyRow {
  date: string;
  tasks_completed: number;
  tasks_completed_on_time: number;
  xp_gained: number;
  focus_minutes: number;
}

// ── Hook state ───────────────────────────────────────────────

export interface AnalyticsState {
  data: AnalyticsSummaryResponse | null;
  loading: boolean;
  error: string | null;
  period: AnalyticsPeriod;
}
