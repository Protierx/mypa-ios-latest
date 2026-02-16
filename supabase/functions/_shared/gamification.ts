// ============================================================
// Shared gamification helpers — pure functions, no DB access
// Used by task-completed and analytics-summary edge functions
// ============================================================

// ---------- Constants ----------

export const XP_ON_TIME = 12;
export const XP_LATE = 8;
export const XP_OVERDUE_RECOVERED = 5;   // bonus on top of base
export const DAILY_XP_CAP = 120;

/** XP needed to go from Level 1 → Level 2 */
export const BASE_XP_FOR_LEVEL = 100;
/** Each subsequent level costs this much more XP */
export const XP_INCREMENT_PER_LEVEL = 60;

// ---------- Interfaces ----------

export interface LevelState {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

export interface CalcTaskXpInput {
  isOnTime: boolean;
  wasOverdue: boolean;
  todayXpSoFar: number;
}

export interface CalcTaskXpResult {
  xpAwarded: number;
  breakdown: {
    base: number;
    overdueBonus: number;
    cappedAmount: number;
  };
}

export interface UpdateStreakInput {
  todayStr: string;         // YYYY-MM-DD
  lastActiveDate: string | null;
  currentStreak: number;
  longestStreak: number;
}

export interface UpdateStreakResult {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

// ---------- Level helpers ----------

/**
 * XP required to advance FROM a given level to the next.
 * L1→L2: 100,  L2→L3: 160,  L3→L4: 220,  …
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return BASE_XP_FOR_LEVEL;
  return BASE_XP_FOR_LEVEL + (level - 1) * XP_INCREMENT_PER_LEVEL;
}

/**
 * Given a total XP value, compute the current level and progress within that level.
 */
export function calcLevelState(totalXp: number): LevelState {
  let level = 1;
  let remaining = totalXp;

  while (true) {
    const needed = xpForLevel(level);
    if (remaining < needed) {
      return { level, xpIntoLevel: remaining, xpForNextLevel: needed };
    }
    remaining -= needed;
    level++;
  }
}

// ---------- XP calculation ----------

/**
 * Determine how much XP to award for a completed task, respecting the daily cap.
 */
export function calcTaskXp(input: CalcTaskXpInput): CalcTaskXpResult {
  const base = input.isOnTime ? XP_ON_TIME : XP_LATE;
  const overdueBonus = input.wasOverdue ? XP_OVERDUE_RECOVERED : 0;
  const raw = base + overdueBonus;

  const headroom = Math.max(0, DAILY_XP_CAP - input.todayXpSoFar);
  const cappedAmount = Math.min(raw, headroom);

  return {
    xpAwarded: cappedAmount,
    breakdown: { base, overdueBonus, cappedAmount },
  };
}

// ---------- Streak ----------

/**
 * Advance or reset the streak based on whether the user was active yesterday.
 * Pure function — does NOT touch the database.
 */
export function updateStreak(input: UpdateStreakInput): UpdateStreakResult {
  const { todayStr, lastActiveDate, currentStreak, longestStreak } = input;

  // Already recorded today
  if (lastActiveDate === todayStr) {
    return { currentStreak, longestStreak, lastActiveDate: todayStr };
  }

  const yesterday = shiftDateString(todayStr, -1);

  let newStreak: number;
  if (lastActiveDate === yesterday) {
    newStreak = currentStreak + 1; // consecutive day
  } else {
    newStreak = 1; // gap — reset
  }

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
    lastActiveDate: todayStr,
  };
}

// ---------- Task timing helpers ----------

/**
 * Whether the task was completed on time (before or on the due date/time).
 * `dueDate` can be a full ISO timestamp (from Supabase TIMESTAMPTZ) or YYYY-MM-DD.
 * If only a date (no time), treats end of day as the deadline.
 */
export function isOnTime(
  completedAt: Date | string,
  dueDate: string,
  dueTime?: string | null,
): boolean {
  const due = parseDueDate(dueDate, dueTime);
  const completed = typeof completedAt === 'string' ? new Date(completedAt) : completedAt;
  return completed <= due;
}

/**
 * Whether the task was overdue (past due date) before being completed.
 * A task is "overdue-recovered" if it was past due before the user completed it.
 */
export function wasOverdue(
  taskStatus: string,
  dueDate: string,
  dueTime?: string | null,
): boolean {
  // If the task was explicitly marked OVERDUE, it's overdue
  if (taskStatus === 'OVERDUE') return true;
  // Otherwise check if current moment is past due
  const due = parseDueDate(dueDate, dueTime);
  return new Date() > due;
}

// ---------- Date helpers ----------

/** Convert a Date to 'YYYY-MM-DD' in UTC. */
export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Parse a due date string into a Date object.
 * Handles:
 *   - Full ISO timestamps from Supabase (e.g. '2025-01-15T14:00:00+00:00')
 *   - YYYY-MM-DD date strings (with optional separate time)
 * If only a date (no time component), defaults to end of day.
 */
export function parseDueDate(date: string, time?: string | null): Date {
  // If it already looks like a full ISO timestamp (has T and timezone info)
  if (date.includes('T')) {
    return new Date(date);
  }
  // Separate date + time
  if (time) {
    return new Date(`${date}T${time}`);
  }
  // No time specified → end of day
  return new Date(`${date}T23:59:59`);
}

/** Build a Date from a date string and optional time string (alias for parseDueDate). */
export function buildDueDate(date: string, time?: string | null): Date {
  return parseDueDate(date, time);
}

/** Shift a YYYY-MM-DD string by `days` (positive = future, negative = past). */
export function shiftDateString(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`); // noon UTC to avoid DST issues
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
