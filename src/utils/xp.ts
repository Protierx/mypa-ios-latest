/**
 * XP & Level System
 * 
 * Level progression uses a curve where each level requires more XP.
 * Formula: XP needed for level N = 100 * N^1.5
 * 
 * Level 1:  0 XP
 * Level 2:  100 XP
 * Level 3:  283 XP
 * Level 4:  520 XP
 * Level 5:  800 XP
 * Level 10: 2,154 XP
 * Level 20: 6,084 XP
 * Level 50: 24,749 XP
 */

// XP required to reach a specific level
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

// Calculate level from total XP
export function calculateLevel(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

// XP needed to reach the next level
export function xpToNextLevel(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  return nextLevelXp - totalXp;
}

// Progress percentage to next level (0-100)
export function levelProgress(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  
  const xpInCurrentLevel = totalXp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  
  return Math.floor((xpInCurrentLevel / xpNeededForLevel) * 100);
}

/**
 * XP Awards
 */
export const XP_REWARDS = {
  // Tasks
  TASK_COMPLETE: 10,
  TASK_COMPLETE_HIGH_PRIORITY: 20,
  TASK_COMPLETE_ON_TIME: 5,  // Bonus for completing before due
  
  // Focus
  FOCUS_SESSION_COMPLETE: 15,
  FOCUS_PERFECT_SESSION: 25,  // No pauses, full duration
  
  // Streaks
  STREAK_DAY: 5,
  STREAK_WEEK: 50,
  STREAK_MONTH: 200,
  
  // Social
  CIRCLE_JOIN: 25,
  ASSIGNMENT_COMPLETE: 30,
  CHALLENGE_WIN: 100,
  DAILY_CARD_POST: 10,
  
  // Achievements
  ACHIEVEMENT_UNLOCK: 50,
  
  // Misc
  ONBOARDING_COMPLETE: 50,
  FIRST_TASK: 25,
  BRAIN_DUMP_PROCESS: 5,
};

/**
 * Streak multipliers
 * Longer streaks = more XP per action
 */
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.5;
  if (streakDays >= 7) return 1.25;
  if (streakDays >= 3) return 1.1;
  return 1.0;
}

// Calculate XP with streak multiplier
export function calculateXpWithStreak(baseXp: number, streakDays: number): number {
  const multiplier = getStreakMultiplier(streakDays);
  return Math.floor(baseXp * multiplier);
}

/**
 * Time saved estimation
 * Based on task category and duration
 */
export function estimateTimeSaved(taskDurationMin: number, category: string): number {
  // AI-assisted tasks save roughly 20-40% of manual time
  const savingsRate: Record<string, number> = {
    Work: 0.3,
    Personal: 0.2,
    Health: 0.15,
    Finance: 0.35,
    Learning: 0.25,
    Social: 0.2,
  };
  
  const rate = savingsRate[category] || 0.2;
  return Math.floor(taskDurationMin * rate);
}

/**
 * Default user settings
 */
export function getDefaultSettings() {
  return {
    pushEnabled: true,
    emailNotifications: true,
    remindersBefore: 15,
    voiceLanguage: 'en',
    voiceSpeed: 'normal',
    voiceName: 'nova',
    profilePublic: true,
    showStreak: true,
    showLevel: true,
    focusSessionDefault: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    theme: 'system',
  };
}
