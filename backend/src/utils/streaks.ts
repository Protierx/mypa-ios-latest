/**
 * Streak System
 * 
 * Tracks daily activity streaks:
 * - Current streak: consecutive days of activity
 * - Longest streak: best ever streak
 * - Activity = completing at least 1 task or 1 focus session
 */

import prisma from '../config/database.js';

// Get today's date as YYYY-MM-DD in user's timezone (or UTC)
export function getTodayString(timezone: string = 'UTC'): string {
  const now = new Date();
  // For simplicity, using UTC. In production, use a proper timezone library
  return now.toISOString().split('T')[0];
}

// Get yesterday's date
export function getYesterdayString(timezone: string = 'UTC'): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

// Check if two date strings are consecutive days
export function isConsecutiveDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// Check if date is today
export function isToday(dateString: string, timezone: string = 'UTC'): boolean {
  return dateString === getTodayString(timezone);
}

/**
 * Update user's streak based on activity
 * Call this when user completes a task or focus session
 */
export async function checkAndUpdateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  streakUpdated: boolean;
  isNewStreak: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActiveDate: true,
      timezone: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const today = getTodayString(user.timezone);
  const lastActive = user.lastActiveDate?.toISOString().split('T')[0] || null;

  // Already active today - no update needed
  if (lastActive === today) {
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      streakUpdated: false,
      isNewStreak: false,
    };
  }

  let newStreak = 1;
  let isNewStreak = false;

  if (lastActive) {
    const yesterday = getYesterdayString(user.timezone);
    
    if (lastActive === yesterday) {
      // Consecutive day - increment streak
      newStreak = user.currentStreak + 1;
    } else {
      // Streak broken - start fresh
      newStreak = 1;
      isNewStreak = true;
    }
  } else {
    // First activity ever
    isNewStreak = true;
  }

  const newLongest = Math.max(newStreak, user.longestStreak);

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: new Date(),
    },
  });

  // Check for streak milestones
  await checkStreakMilestones(userId, newStreak);

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    streakUpdated: true,
    isNewStreak,
  };
}

/**
 * Check if user hit a streak milestone
 */
async function checkStreakMilestones(userId: string, streak: number): Promise<void> {
  const milestones = [3, 7, 14, 30, 60, 100, 365];
  
  if (milestones.includes(streak)) {
    // Create notification
    const emoji = streak >= 30 ? '🔥' : streak >= 7 ? '⚡' : '✨';
    
    await prisma.notification.create({
      data: {
        userId,
        type: 'STREAK',
        title: `${emoji} ${streak} Day Streak!`,
        body: `Amazing! You've been consistent for ${streak} days in a row!`,
        data: JSON.stringify({ streak }),
      },
    });

    // Could also check/award achievements here
  }
}

/**
 * Get streak statistics for a user
 */
export async function getStreakStats(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  daysUntilStreakLoss: number;
  streakAtRisk: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActiveDate: true,
      timezone: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const today = getTodayString(user.timezone);
  const lastActive = user.lastActiveDate?.toISOString().split('T')[0] || null;
  
  // Calculate days until streak loss
  let daysUntilLoss = 2; // Default: today + tomorrow
  let streakAtRisk = false;

  if (lastActive) {
    if (lastActive === today) {
      daysUntilLoss = 2; // Safe until end of tomorrow
    } else {
      const yesterday = getYesterdayString(user.timezone);
      if (lastActive === yesterday) {
        daysUntilLoss = 1; // Need activity today!
        streakAtRisk = true;
      } else {
        daysUntilLoss = 0; // Streak already lost
      }
    }
  }

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastActiveDate: user.lastActiveDate,
    daysUntilStreakLoss: daysUntilLoss,
    streakAtRisk,
  };
}

/**
 * Reset streak (for testing or admin purposes)
 */
export async function resetStreak(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: 0,
      lastActiveDate: null,
    },
  });
}
