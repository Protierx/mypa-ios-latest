// =================================================================
// Gamification helper tests — Deno test runner
// Run: deno test supabase/functions/_shared/gamification.test.ts
// =================================================================

import {
  assertEquals,
  assertAlmostEquals,
} from 'https://deno.land/std@0.168.0/testing/asserts.ts';

import {
  calcLevelState,
  calcTaskXp,
  updateStreak,
  isOnTime,
  wasOverdue,
  toDateString,
  shiftDateString,
  parseDueDate,
  xpForLevel,
  XP_ON_TIME,
  XP_LATE,
  XP_OVERDUE_RECOVERED,
  DAILY_XP_CAP,
  BASE_XP_FOR_LEVEL,
  XP_INCREMENT_PER_LEVEL,
} from './gamification.ts';

// ============================================================
// xpForLevel
// ============================================================

Deno.test('xpForLevel: L1→L2 requires BASE_XP_FOR_LEVEL (100)', () => {
  assertEquals(xpForLevel(1), 100);
});

Deno.test('xpForLevel: L2→L3 requires 160', () => {
  assertEquals(xpForLevel(2), 160);
});

Deno.test('xpForLevel: L3→L4 requires 220', () => {
  assertEquals(xpForLevel(3), 220);
});

Deno.test('xpForLevel: increments by XP_INCREMENT_PER_LEVEL each level', () => {
  const l4 = xpForLevel(4);
  const l5 = xpForLevel(5);
  assertEquals(l5 - l4, XP_INCREMENT_PER_LEVEL);
});

// ============================================================
// calcLevelState
// ============================================================

Deno.test('calcLevelState: 0 XP = level 1, 0 into level, need 100', () => {
  const s = calcLevelState(0);
  assertEquals(s.level, 1);
  assertEquals(s.xpIntoLevel, 0);
  assertEquals(s.xpForNextLevel, 100);
});

Deno.test('calcLevelState: 50 XP = level 1, 50 into level', () => {
  const s = calcLevelState(50);
  assertEquals(s.level, 1);
  assertEquals(s.xpIntoLevel, 50);
});

Deno.test('calcLevelState: exactly 100 XP = level 2, 0 into level, need 160', () => {
  const s = calcLevelState(100);
  assertEquals(s.level, 2);
  assertEquals(s.xpIntoLevel, 0);
  assertEquals(s.xpForNextLevel, 160);
});

Deno.test('calcLevelState: 260 XP (100+160) = level 3, 0 into level', () => {
  const s = calcLevelState(260);
  assertEquals(s.level, 3);
  assertEquals(s.xpIntoLevel, 0);
  assertEquals(s.xpForNextLevel, 220);
});

Deno.test('calcLevelState: 480 XP (100+160+220) = level 4', () => {
  const s = calcLevelState(480);
  assertEquals(s.level, 4);
  assertEquals(s.xpIntoLevel, 0);
});

Deno.test('calcLevelState: 150 XP = level 2, 50 into level', () => {
  const s = calcLevelState(150);
  assertEquals(s.level, 2);
  assertEquals(s.xpIntoLevel, 50);
  assertEquals(s.xpForNextLevel, 160);
});

Deno.test('calcLevelState: large XP handles correctly', () => {
  const s = calcLevelState(10000);
  // Should be a high level, not crash
  assertEquals(typeof s.level, 'number');
  assertEquals(s.level > 1, true);
  assertEquals(s.xpIntoLevel >= 0, true);
  assertEquals(s.xpIntoLevel < s.xpForNextLevel, true);
});

// ============================================================
// calcTaskXp
// ============================================================

Deno.test('calcTaskXp: on-time task = 12 XP', () => {
  const r = calcTaskXp({ isOnTime: true, wasOverdue: false, todayXpSoFar: 0 });
  assertEquals(r.xpAwarded, XP_ON_TIME);
  assertEquals(r.breakdown.base, XP_ON_TIME);
  assertEquals(r.breakdown.overdueBonus, 0);
});

Deno.test('calcTaskXp: late task = 8 XP', () => {
  const r = calcTaskXp({ isOnTime: false, wasOverdue: false, todayXpSoFar: 0 });
  assertEquals(r.xpAwarded, XP_LATE);
  assertEquals(r.breakdown.base, XP_LATE);
});

Deno.test('calcTaskXp: overdue-recovered on-time = 12+5 = 17 XP', () => {
  const r = calcTaskXp({ isOnTime: true, wasOverdue: true, todayXpSoFar: 0 });
  assertEquals(r.xpAwarded, XP_ON_TIME + XP_OVERDUE_RECOVERED);
  assertEquals(r.breakdown.overdueBonus, XP_OVERDUE_RECOVERED);
});

Deno.test('calcTaskXp: overdue-recovered late = 8+5 = 13 XP', () => {
  const r = calcTaskXp({ isOnTime: false, wasOverdue: true, todayXpSoFar: 0 });
  assertEquals(r.xpAwarded, XP_LATE + XP_OVERDUE_RECOVERED);
});

Deno.test('calcTaskXp: daily cap reached = 0 XP', () => {
  const r = calcTaskXp({ isOnTime: true, wasOverdue: false, todayXpSoFar: DAILY_XP_CAP });
  assertEquals(r.xpAwarded, 0);
});

Deno.test('calcTaskXp: near daily cap = partial XP', () => {
  const r = calcTaskXp({ isOnTime: true, wasOverdue: false, todayXpSoFar: DAILY_XP_CAP - 5 });
  assertEquals(r.xpAwarded, 5); // only 5 remaining headroom
});

Deno.test('calcTaskXp: just under cap = full award', () => {
  const r = calcTaskXp({ isOnTime: true, wasOverdue: false, todayXpSoFar: DAILY_XP_CAP - 20 });
  assertEquals(r.xpAwarded, XP_ON_TIME); // 12 fits within 20 headroom
});

// ============================================================
// updateStreak
// ============================================================

Deno.test('updateStreak: first activity ever = streak 1', () => {
  const r = updateStreak({
    todayStr: '2025-01-15',
    lastActiveDate: null,
    currentStreak: 0,
    longestStreak: 0,
  });
  assertEquals(r.currentStreak, 1);
  assertEquals(r.longestStreak, 1);
  assertEquals(r.lastActiveDate, '2025-01-15');
});

Deno.test('updateStreak: consecutive day = streak + 1', () => {
  const r = updateStreak({
    todayStr: '2025-01-16',
    lastActiveDate: '2025-01-15',
    currentStreak: 3,
    longestStreak: 5,
  });
  assertEquals(r.currentStreak, 4);
  assertEquals(r.longestStreak, 5);
});

Deno.test('updateStreak: consecutive day beats longest = new longest', () => {
  const r = updateStreak({
    todayStr: '2025-01-16',
    lastActiveDate: '2025-01-15',
    currentStreak: 5,
    longestStreak: 5,
  });
  assertEquals(r.currentStreak, 6);
  assertEquals(r.longestStreak, 6);
});

Deno.test('updateStreak: gap of 1 day = reset to 1', () => {
  const r = updateStreak({
    todayStr: '2025-01-17',
    lastActiveDate: '2025-01-15', // skipped the 16th
    currentStreak: 5,
    longestStreak: 10,
  });
  assertEquals(r.currentStreak, 1);
  assertEquals(r.longestStreak, 10);
});

Deno.test('updateStreak: same day = no change', () => {
  const r = updateStreak({
    todayStr: '2025-01-15',
    lastActiveDate: '2025-01-15',
    currentStreak: 3,
    longestStreak: 7,
  });
  assertEquals(r.currentStreak, 3);
  assertEquals(r.longestStreak, 7);
});

Deno.test('updateStreak: month boundary works correctly', () => {
  const r = updateStreak({
    todayStr: '2025-02-01',
    lastActiveDate: '2025-01-31',
    currentStreak: 10,
    longestStreak: 10,
  });
  assertEquals(r.currentStreak, 11);
  assertEquals(r.longestStreak, 11);
});

Deno.test('updateStreak: year boundary works correctly', () => {
  const r = updateStreak({
    todayStr: '2025-01-01',
    lastActiveDate: '2024-12-31',
    currentStreak: 30,
    longestStreak: 30,
  });
  assertEquals(r.currentStreak, 31);
  assertEquals(r.longestStreak, 31);
});

// ============================================================
// isOnTime
// ============================================================

Deno.test('isOnTime: completed before due = true', () => {
  assertEquals(isOnTime(new Date('2025-01-15T10:00:00'), '2025-01-15', '14:00:00'), true);
});

Deno.test('isOnTime: completed at due = true', () => {
  assertEquals(isOnTime(new Date('2025-01-15T14:00:00'), '2025-01-15', '14:00:00'), true);
});

Deno.test('isOnTime: completed after due = false', () => {
  assertEquals(isOnTime(new Date('2025-01-15T14:00:01'), '2025-01-15', '14:00:00'), false);
});

Deno.test('isOnTime: no time = end of day', () => {
  assertEquals(isOnTime(new Date('2025-01-15T23:59:58'), '2025-01-15'), true);
});

Deno.test('isOnTime: next day = false', () => {
  assertEquals(isOnTime(new Date('2025-01-16T01:00:00'), '2025-01-15'), false);
});

Deno.test('isOnTime: full ISO timestamp due_date (on time)', () => {
  assertEquals(isOnTime(new Date('2025-01-15T13:00:00Z'), '2025-01-15T14:00:00+00:00'), true);
});

Deno.test('isOnTime: full ISO timestamp due_date (late)', () => {
  assertEquals(isOnTime(new Date('2025-01-15T15:00:00Z'), '2025-01-15T14:00:00+00:00'), false);
});

// ============================================================
// parseDueDate
// ============================================================

Deno.test('parseDueDate: full ISO timestamp', () => {
  const d = parseDueDate('2025-01-15T14:00:00+00:00');
  assertEquals(d.toISOString(), '2025-01-15T14:00:00.000Z');
});

Deno.test('parseDueDate: date + separate time', () => {
  const d = parseDueDate('2025-01-15', '14:00:00');
  assertEquals(d.getHours(), 14);
});

Deno.test('parseDueDate: date only = end of day', () => {
  const d = parseDueDate('2025-01-15');
  assertEquals(d.getHours(), 23);
  assertEquals(d.getMinutes(), 59);
});

// ============================================================
// wasOverdue
// ============================================================

Deno.test('wasOverdue: OVERDUE status = true', () => {
  assertEquals(wasOverdue('OVERDUE', '2099-12-31'), true);
});

Deno.test('wasOverdue: pending with future due = false', () => {
  assertEquals(wasOverdue('pending', '2099-12-31'), false);
});

// ============================================================
// toDateString
// ============================================================

Deno.test('toDateString: produces YYYY-MM-DD in UTC', () => {
  const d = new Date('2025-01-15T12:00:00Z');
  assertEquals(toDateString(d), '2025-01-15');
});

// ============================================================
// shiftDateString
// ============================================================

Deno.test('shiftDateString: +1 day', () => {
  assertEquals(shiftDateString('2025-01-15', 1), '2025-01-16');
});

Deno.test('shiftDateString: -1 day', () => {
  assertEquals(shiftDateString('2025-01-15', -1), '2025-01-14');
});

Deno.test('shiftDateString: across month boundary', () => {
  assertEquals(shiftDateString('2025-01-31', 1), '2025-02-01');
});

Deno.test('shiftDateString: across year boundary', () => {
  assertEquals(shiftDateString('2024-12-31', 1), '2025-01-01');
});

// ============================================================
// Constants sanity
// ============================================================

Deno.test('constants: XP values are reasonable', () => {
  assertEquals(XP_ON_TIME > XP_LATE, true);
  assertEquals(XP_OVERDUE_RECOVERED > 0, true);
  assertEquals(DAILY_XP_CAP > XP_ON_TIME, true);
  assertEquals(BASE_XP_FOR_LEVEL, 100);
  assertEquals(XP_INCREMENT_PER_LEVEL, 60);
});
