/**
 * Unlock Service for Mylo
 * 
 * Manages progressive feature unlocks based on time OR milestones.
 * Implements the hybrid unlock system for engagement.
 */

import { PrismaClient } from '@prisma/client';
import eventService from './event.service';

const prisma = new PrismaClient();

// Feature definitions with unlock requirements
export const FEATURE_UNLOCKS = {
  // Day 3 OR 10 tasks completed
  smart_scheduling: {
    name: 'Smart Scheduling',
    description: 'I can now suggest optimal times for your tasks based on your patterns.',
    icon: 'calendar-clock',
    dayRequirement: 3,
    milestoneType: 'tasks_completed',
    milestoneValue: 10,
  },
  
  // Day 5 OR 3 hours focus
  focus_insights: {
    name: 'Focus Insights',
    description: 'I now track your focus patterns and can recommend when you\'re most productive.',
    icon: 'brain',
    dayRequirement: 5,
    milestoneType: 'focus_hours',
    milestoneValue: 3,
  },
  
  // Day 7 OR 7-day streak
  peak_hours: {
    name: 'Peak Hours Detection',
    description: 'I\'ve learned your peak productivity hours and will suggest important tasks during those times.',
    icon: 'trending-up',
    dayRequirement: 7,
    milestoneType: 'streak_days',
    milestoneValue: 7,
  },
  
  // Day 10 OR 25 tasks completed
  duration_estimates: {
    name: 'Smart Duration Estimates',
    description: 'Based on your history, I can now estimate how long tasks will take.',
    icon: 'clock',
    dayRequirement: 10,
    milestoneType: 'tasks_completed',
    milestoneValue: 25,
  },
  
  // Day 14 OR 50 tasks completed
  pattern_insights: {
    name: 'Pattern Insights',
    description: 'I\'ve detected patterns in your productivity. Check your insights for personalized tips.',
    icon: 'sparkles',
    dayRequirement: 14,
    milestoneType: 'tasks_completed',
    milestoneValue: 50,
  },
  
  // Day 21 OR 10 hours focus
  proactive_suggestions: {
    name: 'Proactive Suggestions',
    description: 'I\'ll now proactively suggest tasks and focus sessions based on your schedule.',
    icon: 'lightbulb',
    dayRequirement: 21,
    milestoneType: 'focus_hours',
    milestoneValue: 10,
  },
  
  // Day 30 OR 100 tasks completed
  weekly_planning: {
    name: 'AI Weekly Planning',
    description: 'I can now help you plan your entire week based on your goals and patterns.',
    icon: 'calendar',
    dayRequirement: 30,
    milestoneType: 'tasks_completed',
    milestoneValue: 100,
  },
} as const;

export type FeatureKey = keyof typeof FEATURE_UNLOCKS;

export interface UnlockStatus {
  feature: FeatureKey;
  isUnlocked: boolean;
  unlockType?: 'TIME' | 'MILESTONE' | 'HYBRID';
  unlockedAt?: Date;
  
  // Progress towards unlock
  dayProgress: number;      // Current day number
  dayRequired: number;      // Days needed for time unlock
  milestoneProgress: number; // Current milestone progress
  milestoneRequired: number; // Milestone target
  milestoneType: string;    // Type of milestone
  
  // Percentage complete (whichever is closer)
  percentComplete: number;
}

export class UnlockService {
  /**
   * Get all unlock statuses for a user
   */
  async getUnlockStatuses(userId: string): Promise<UnlockStatus[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        tasksCompleted: true,
        focusMinutes: true,
        currentStreak: true,
        longestStreak: true,
        userUnlocks: true,
      },
    });

    if (!user) throw new Error('User not found');

    const daysSinceSignup = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1; // Day 1 is signup day

    const focusHours = Math.floor(user.focusMinutes / 60);

    const statuses: UnlockStatus[] = [];

    for (const [key, config] of Object.entries(FEATURE_UNLOCKS)) {
      const featureKey = key as FeatureKey;
      const existingUnlock = user.userUnlocks.find(u => u.feature === featureKey);
      
      // Calculate milestone progress
      let milestoneProgress = 0;
      switch (config.milestoneType) {
        case 'tasks_completed':
          milestoneProgress = user.tasksCompleted;
          break;
        case 'focus_hours':
          milestoneProgress = focusHours;
          break;
        case 'streak_days':
          milestoneProgress = Math.max(user.currentStreak, user.longestStreak);
          break;
      }

      // Calculate percentages
      const dayPercent = Math.min(100, (daysSinceSignup / config.dayRequirement) * 100);
      const milestonePercent = Math.min(100, (milestoneProgress / config.milestoneValue) * 100);
      const percentComplete = Math.max(dayPercent, milestonePercent);

      statuses.push({
        feature: featureKey,
        isUnlocked: !!existingUnlock,
        unlockType: existingUnlock?.unlockType as 'TIME' | 'MILESTONE' | 'HYBRID' | undefined,
        unlockedAt: existingUnlock?.unlockedAt,
        dayProgress: daysSinceSignup,
        dayRequired: config.dayRequirement,
        milestoneProgress,
        milestoneRequired: config.milestoneValue,
        milestoneType: config.milestoneType,
        percentComplete,
      });
    }

    return statuses;
  }

  /**
   * Check and process any new unlocks for a user
   * Returns newly unlocked features
   */
  async checkAndProcessUnlocks(userId: string): Promise<FeatureKey[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        tasksCompleted: true,
        focusMinutes: true,
        currentStreak: true,
        longestStreak: true,
        userUnlocks: {
          select: { feature: true },
        },
      },
    });

    if (!user) throw new Error('User not found');

    const daysSinceSignup = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const focusHours = Math.floor(user.focusMinutes / 60);
    const unlockedFeatures = new Set(user.userUnlocks.map(u => u.feature));
    const newUnlocks: FeatureKey[] = [];

    for (const [key, config] of Object.entries(FEATURE_UNLOCKS)) {
      const featureKey = key as FeatureKey;
      
      // Skip if already unlocked
      if (unlockedFeatures.has(featureKey)) continue;

      let shouldUnlock = false;
      let unlockType: 'TIME' | 'MILESTONE' | 'HYBRID' = 'TIME';

      // Check time-based unlock
      const timeQualifies = daysSinceSignup >= config.dayRequirement;

      // Check milestone-based unlock
      let milestoneQualifies = false;
      switch (config.milestoneType) {
        case 'tasks_completed':
          milestoneQualifies = user.tasksCompleted >= config.milestoneValue;
          break;
        case 'focus_hours':
          milestoneQualifies = focusHours >= config.milestoneValue;
          break;
        case 'streak_days':
          milestoneQualifies = Math.max(user.currentStreak, user.longestStreak) >= config.milestoneValue;
          break;
      }

      // Determine unlock type
      if (timeQualifies && milestoneQualifies) {
        shouldUnlock = true;
        unlockType = 'HYBRID';
      } else if (milestoneQualifies) {
        shouldUnlock = true;
        unlockType = 'MILESTONE';
      } else if (timeQualifies) {
        shouldUnlock = true;
        unlockType = 'TIME';
      }

      if (shouldUnlock) {
        // Create the unlock record
        await prisma.userUnlock.create({
          data: {
            userId,
            feature: featureKey,
            unlockType,
            availableAtDay: config.dayRequirement,
            milestoneTrigger: milestoneQualifies ? config.milestoneType : null,
          },
        });

        // Log the event
        await eventService.logEvent(userId, 'feature_unlocked', {
          featureUnlocked: featureKey,
          unlockType,
          daysSinceSignup,
        });

        newUnlocks.push(featureKey);
      }
    }

    return newUnlocks;
  }

  /**
   * Get pending unlocks (unlocked but not seen by user)
   */
  async getPendingCelebrations(userId: string) {
    const pendingUnlocks = await prisma.userUnlock.findMany({
      where: {
        userId,
        seenByUser: false,
      },
      orderBy: { unlockedAt: 'asc' },
    });

    return pendingUnlocks.map(unlock => ({
      ...unlock,
      config: FEATURE_UNLOCKS[unlock.feature as FeatureKey],
    }));
  }

  /**
   * Mark an unlock as seen (after celebration modal)
   */
  async markUnlockSeen(userId: string, feature: FeatureKey): Promise<void> {
    await prisma.userUnlock.updateMany({
      where: {
        userId,
        feature,
      },
      data: {
        seenByUser: true,
        seenAt: new Date(),
      },
    });
  }

  /**
   * Check if a specific feature is unlocked
   */
  async isFeatureUnlocked(userId: string, feature: FeatureKey): Promise<boolean> {
    const unlock = await prisma.userUnlock.findUnique({
      where: {
        userId_feature: {
          userId,
          feature,
        },
      },
    });
    return !!unlock;
  }

  /**
   * Get feature info
   */
  getFeatureInfo(feature: FeatureKey) {
    return FEATURE_UNLOCKS[feature];
  }

  /**
   * Get all feature definitions
   */
  getAllFeatures() {
    return FEATURE_UNLOCKS;
  }
}

export const unlockService = new UnlockService();
export default unlockService;
