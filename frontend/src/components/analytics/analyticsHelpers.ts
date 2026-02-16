/**
 * Analytics Derived Metrics
 *
 * Pure helper functions for computing analytics values
 * from raw task and focus-session data.
 * No hooks, no side-effects — just math.
 */

// ── Range Filtering ──────────────────────────────────────────

export type AnalyticsRange = 'today' | '7d' | '30d' | 'all';

/** Returns the Date object representing the start of a range. */
export function rangeStartDate(range: AnalyticsRange): Date | null {
  if (range === 'all') return null;
  const now = new Date();
  switch (range) {
    case 'today': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
}

/** Returns the previous-period start date for comparison. */
export function previousPeriodStart(range: AnalyticsRange): { start: Date; end: Date } | null {
  if (range === 'all') return null;
  const end = rangeStartDate(range)!;
  const start = new Date(end);
  switch (range) {
    case 'today':
      start.setDate(start.getDate() - 1);
      break;
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
  }
  return { start, end };
}

export function isInRange(dateStr: string | null | undefined, range: AnalyticsRange): boolean {
  if (!dateStr) return false;
  if (range === 'all') return true;
  const d = new Date(dateStr);
  const start = rangeStartDate(range);
  return start ? d >= start : true;
}

export function isInDateRange(dateStr: string | null | undefined, start: Date, end: Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d < end;
}

// ── Derived Metrics ──────────────────────────────────────────

export interface TaskLike {
  status: string;
  completed_at?: string | null;
  updated_at?: string;
  created_at?: string;
  due_date?: string | null;
  estimated_duration?: number | null;
  priority?: string | null;
}

export interface SessionLike {
  started_at: string;
  duration_actual?: number | null;
  duration_planned?: number;
}

/** Completion rate = completed / total */
export function completionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/** On-time rate = completed on or before due / total with due dates */
export function onTimeRate(tasks: TaskLike[]): number {
  const withDue = tasks.filter(
    (t) => t.status === 'completed' && t.due_date && t.completed_at,
  );
  if (withDue.length === 0) return 100; // no due → assume perfect
  const onTime = withDue.filter((t) => {
    const completed = new Date(t.completed_at!);
    const due = new Date(t.due_date!);
    // Set due date to end of day
    due.setHours(23, 59, 59, 999);
    return completed <= due;
  });
  return Math.round((onTime.length / withDue.length) * 100);
}

/** Delta between current and previous period values (percentage points). */
export function periodDelta(current: number, previous: number): number {
  return current - previous;
}

/** Format a delta value as a display string. */
export function formatDelta(delta: number): string {
  if (delta === 0) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}`;
}

/** Trend direction from delta. */
export function trendDirection(delta: number): 'up' | 'down' | 'flat' {
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'flat';
}

/** Productivity score 0–100 from weighted inputs. */
export function productivityScore(opts: {
  completionRate: number;    // 0–100
  onTimeRate: number;        // 0–100
  focusMinutes: number;      // raw minutes
  streakDays: number;        // current streak
}): number {
  // Weights: completion 40%, on-time 25%, focus 20%, streak 15%
  const focusScore = Math.min(opts.focusMinutes / 120, 1) * 100; // 2h = 100
  const streakScore = Math.min(opts.streakDays / 14, 1) * 100;   // 14d = 100

  const score =
    opts.completionRate * 0.4 +
    opts.onTimeRate * 0.25 +
    focusScore * 0.2 +
    streakScore * 0.15;

  return Math.round(Math.min(score, 100));
}

/** Returns a one-line insight for the hero card. */
export function heroInsight(opts: {
  completionRate: number;
  onTimeRate: number;
  streakDays: number;
  completedCount: number;
}): string {
  if (opts.completedCount === 0) return 'Start completing tasks to build momentum.';
  if (opts.completionRate >= 90 && opts.onTimeRate >= 90)
    return 'Outstanding execution — you\'re crushing it.';
  if (opts.completionRate >= 70)
    return 'Strong progress. Focus on on-time delivery next.';
  if (opts.streakDays >= 7)
    return `${opts.streakDays}-day streak! Consistency is paying off.`;
  if (opts.onTimeRate < 60)
    return 'Consider breaking tasks into smaller pieces for better timing.';
  return 'Keep going — momentum builds with each completed task.';
}

// ── Chart Data ───────────────────────────────────────────────

export interface DailyDataPoint {
  label: string;     // "Mon", "2/12", etc.
  value: number;
  date: string;      // ISO date string "2026-02-10"
}

/** Generates daily completed-task counts for the selected range. */
export function dailyCompletedSeries(
  tasks: TaskLike[],
  range: AnalyticsRange,
): DailyDataPoint[] {
  const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 60;
  const points: DailyDataPoint[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    const count = tasks.filter(
      (t) => t.status === 'completed' && t.completed_at?.startsWith(iso),
    ).length;
    const label = days <= 7
      ? dayNames[d.getDay()]
      : `${d.getMonth() + 1}/${d.getDate()}`;
    points.push({ label, value: count, date: iso });
  }
  return points;
}

// ── Formatting ───────────────────────────────────────────────

export function formatMinutes(mins: number): string {
  if (mins === 0) return '0m';
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── AI Insights Generation ───────────────────────────────────

export interface InsightItem {
  id: string;
  icon: string;          // Ionicons name
  iconColor: string;
  text: string;
  cta?: string;
  ctaAction?: string;    // navigation target or action key
}

export function generateInsights(opts: {
  completionRate: number;
  onTimeRate: number;
  completedCount: number;
  overdueCount: number;
  streakDays: number;
  focusMinutes: number;
  range: AnalyticsRange;
}): InsightItem[] {
  const insights: InsightItem[] = [];

  if (opts.completedCount === 0) {
    insights.push({
      id: 'no-tasks',
      icon: 'rocket-outline',
      iconColor: '#3B82F6',
      text: 'No tasks completed yet this period. Start with one small win.',
      cta: 'Add a task',
      ctaAction: 'add-task',
    });
    return insights;
  }

  if (opts.onTimeRate < 70 && opts.completedCount > 2) {
    insights.push({
      id: 'on-time',
      icon: 'alarm-outline',
      iconColor: '#F59E0B',
      text: `Only ${opts.onTimeRate}% of tasks were completed on time. Try shorter deadlines.`,
      cta: 'Review overdue',
      ctaAction: 'review-tasks',
    });
  }

  if (opts.streakDays === 0) {
    insights.push({
      id: 'streak-risk',
      icon: 'flame-outline',
      iconColor: '#EF4444',
      text: 'Your streak reset. Complete one task today to start a new one.',
      cta: 'View tasks',
      ctaAction: 'view-tasks',
    });
  } else if (opts.streakDays >= 3 && opts.streakDays < 7) {
    insights.push({
      id: 'streak-growing',
      icon: 'flame-outline',
      iconColor: '#F97316',
      text: `${opts.streakDays}-day streak! ${7 - opts.streakDays} more days to hit a full week.`,
    });
  }

  if (opts.focusMinutes > 60) {
    insights.push({
      id: 'focus-strong',
      icon: 'timer-outline',
      iconColor: '#3B82F6',
      text: `${formatMinutes(opts.focusMinutes)} of deep focus. That's real productivity.`,
    });
  } else if (opts.focusMinutes === 0 && opts.completedCount > 0) {
    insights.push({
      id: 'no-focus',
      icon: 'timer-outline',
      iconColor: '#8E8E93',
      text: 'Try a focus session to get more done with less distraction.',
      cta: 'Start focus',
      ctaAction: 'start-focus',
    });
  }

  if (opts.completionRate >= 85) {
    insights.push({
      id: 'high-completion',
      icon: 'checkmark-circle-outline',
      iconColor: '#22C55E',
      text: `${opts.completionRate}% completion rate — you're executing at a high level.`,
    });
  }

  // Return max 3 most relevant
  return insights.slice(0, 3);
}
