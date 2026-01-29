import prisma from '../config/database.js';
import { AppError } from '../middleware/error.js';
import { addXp } from './user.service.js';
import { autoUpdateChallengeProgress } from './challenge.service.js';
import { checkAndUpdateStreak } from '../utils/streaks.js';
import { XP_REWARDS, calculateXpWithStreak } from '../utils/xp.js';

export type FocusStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';

export interface StartFocusInput {
  taskId?: string;
  targetMinutes?: number;
  category?: string;
}

export interface UpdateFocusInput {
  status?: FocusStatus;
  notes?: string;
}

/**
 * Start a new focus session
 */
export async function startFocusSession(userId: string, input: StartFocusInput) {
  // Check if user already has an active session
  const activeSession = await prisma.focusSession.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'PAUSED'] },
    },
  });

  if (activeSession) {
    throw new AppError('You already have an active focus session', 400, 'SESSION_ACTIVE');
  }

  // If taskId provided, verify it belongs to user
  let category = input.category;
  if (input.taskId) {
    const task = await prisma.task.findFirst({
      where: { id: input.taskId, userId },
    });
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }
    category = category || task.category;
  }

  // Get user's default focus duration from settings
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });
  const targetMinutes = input.targetMinutes ?? settings?.focusSessionDefault ?? 25;

  const session = await prisma.focusSession.create({
    data: {
      userId,
      taskId: input.taskId,
      targetMinutes,
      category,
      status: 'ACTIVE',
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
    },
  });

  return session;
}

/**
 * Get active focus session for user
 */
export async function getActiveSession(userId: string) {
  const session = await prisma.focusSession.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'PAUSED'] },
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Calculate elapsed time
  const now = new Date();
  let elapsedSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);
  elapsedSeconds -= session.totalPausedSec;

  // If paused, subtract time since pause
  if (session.status === 'PAUSED' && session.pausedAt) {
    elapsedSeconds -= Math.floor((now.getTime() - session.pausedAt.getTime()) / 1000);
  }

  return {
    ...session,
    elapsedSeconds: Math.max(0, elapsedSeconds),
    targetSeconds: session.targetMinutes * 60,
    percentComplete: Math.min(100, Math.round((elapsedSeconds / (session.targetMinutes * 60)) * 100)),
  };
}

/**
 * Pause the active focus session
 */
export async function pauseSession(userId: string) {
  const session = await prisma.focusSession.findFirst({
    where: { userId, status: 'ACTIVE' },
  });

  if (!session) {
    throw new AppError('No active session to pause', 404, 'NO_ACTIVE_SESSION');
  }

  return prisma.focusSession.update({
    where: { id: session.id },
    data: {
      status: 'PAUSED',
      pausedAt: new Date(),
    },
  });
}

/**
 * Resume a paused focus session
 */
export async function resumeSession(userId: string) {
  const session = await prisma.focusSession.findFirst({
    where: { userId, status: 'PAUSED' },
  });

  if (!session) {
    throw new AppError('No paused session to resume', 404, 'NO_PAUSED_SESSION');
  }

  // Calculate paused duration
  const pausedDuration = session.pausedAt
    ? Math.floor((new Date().getTime() - session.pausedAt.getTime()) / 1000)
    : 0;

  return prisma.focusSession.update({
    where: { id: session.id },
    data: {
      status: 'ACTIVE',
      pausedAt: null,
      totalPausedSec: session.totalPausedSec + pausedDuration,
    },
  });
}

/**
 * Complete or abandon the focus session
 */
export async function endSession(userId: string, completed: boolean = true) {
  const session = await prisma.focusSession.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'PAUSED'] },
    },
  });

  if (!session) {
    throw new AppError('No active session to end', 404, 'NO_ACTIVE_SESSION');
  }

  const now = new Date();
  let elapsedSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);
  elapsedSeconds -= session.totalPausedSec;

  // If paused, subtract time since pause
  if (session.status === 'PAUSED' && session.pausedAt) {
    elapsedSeconds -= Math.floor((now.getTime() - session.pausedAt.getTime()) / 1000);
  }

  const actualMinutes = Math.floor(elapsedSeconds / 60);
  const status: FocusStatus = completed ? 'COMPLETED' : 'ABANDONED';

  // Calculate XP
  let xpAwarded = 0;
  if (completed && actualMinutes >= 5) {
    // Get user's streak for multiplier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true },
    });

    // Perfect session = reached target without pauses
    const isPerfect = actualMinutes >= session.targetMinutes && session.totalPausedSec === 0;
    const baseXp = isPerfect ? XP_REWARDS.FOCUS_PERFECT_SESSION : XP_REWARDS.FOCUS_SESSION_COMPLETE;
    
    xpAwarded = calculateXpWithStreak(baseXp, user?.currentStreak ?? 0);

    // Award XP
    await addXp(userId, xpAwarded, 'Focus session completed');

    // Update user's focus minutes
    await prisma.user.update({
      where: { id: userId },
      data: {
        focusMinutes: { increment: actualMinutes },
      },
    });

    // Update streak
    const streakResult = await checkAndUpdateStreak(userId);

    // Update challenge progress (focus + streak)
    if (actualMinutes > 0) {
      await autoUpdateChallengeProgress(userId, 'FOCUS_MINUTES', actualMinutes);
    }
    if (streakResult.streakUpdated) {
      await autoUpdateChallengeProgress(userId, 'STREAK_DAYS', 1);
    }
  }

  const updatedSession = await prisma.focusSession.update({
    where: { id: session.id },
    data: {
      status,
      endedAt: now,
      actualMinutes,
      xpAwarded,
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
    },
  });

  return {
    ...updatedSession,
    elapsedSeconds,
    xpAwarded,
  };
}

/**
 * Get focus session history
 */
export async function getSessionHistory(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  } = {}
) {
  const { limit = 20, offset = 0, startDate, endDate } = options;

  const where: any = { userId };

  if (startDate || endDate) {
    where.startedAt = {};
    if (startDate) where.startedAt.gte = new Date(startDate);
    if (endDate) where.startedAt.lte = new Date(endDate);
  }

  const [sessions, total] = await Promise.all([
    prisma.focusSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    }),
    prisma.focusSession.count({ where }),
  ]);

  return { sessions, total };
}

/**
 * Get focus statistics
 */
export async function getFocusStats(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    totalSessions,
    completedSessions,
    totalMinutes,
    todaySessions,
    todayMinutes,
    weekSessions,
    weekMinutes,
  ] = await Promise.all([
    prisma.focusSession.count({ where: { userId } }),
    prisma.focusSession.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.focusSession.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { actualMinutes: true },
    }),
    prisma.focusSession.count({
      where: { userId, startedAt: { gte: today } },
    }),
    prisma.focusSession.aggregate({
      where: { userId, status: 'COMPLETED', startedAt: { gte: today } },
      _sum: { actualMinutes: true },
    }),
    prisma.focusSession.count({
      where: { userId, startedAt: { gte: weekAgo } },
    }),
    prisma.focusSession.aggregate({
      where: { userId, status: 'COMPLETED', startedAt: { gte: weekAgo } },
      _sum: { actualMinutes: true },
    }),
  ]);

  return {
    total: {
      sessions: totalSessions,
      completed: completedSessions,
      minutes: totalMinutes._sum.actualMinutes || 0,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    },
    today: {
      sessions: todaySessions,
      minutes: todayMinutes._sum.actualMinutes || 0,
    },
    week: {
      sessions: weekSessions,
      minutes: weekMinutes._sum.actualMinutes || 0,
      avgPerDay: Math.round((weekMinutes._sum.actualMinutes || 0) / 7),
    },
  };
}
