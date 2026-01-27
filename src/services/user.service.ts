import prisma from '../config/database.js';
import { AppError } from '../middleware/error.js';
import { UserPublic, UserStats } from '../types/index.js';
import { formatUserPublic } from './auth.service.js';
import { calculateLevel, xpForLevel, xpToNextLevel } from '../utils/xp.js';
import { checkAndUpdateStreak } from '../utils/streaks.js';

export async function getUserById(userId: string): Promise<UserPublic> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  return formatUserPublic(user);
}

export async function getUserByUsername(username: string): Promise<UserPublic> {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  return formatUserPublic(user);
}

export async function updateProfile(
  userId: string,
  data: {
    name?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    timezone?: string;
    dailyGoalMinutes?: number;
  }
): Promise<UserPublic> {
  // If updating username, check availability
  if (data.username) {
    const normalized = data.username.toLowerCase().trim();
    
    // Validate username format
    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      throw new AppError(
        'Username must be 3-20 characters, only lowercase letters, numbers, and underscores',
        400,
        'INVALID_USERNAME'
      );
    }
    
    const existing = await prisma.user.findFirst({
      where: {
        username: normalized,
        NOT: { id: userId },
      },
    });
    
    if (existing) {
      throw new AppError('Username already taken', 409, 'USERNAME_TAKEN');
    }
    
    data.username = normalized;
  }
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.username && { username: data.username }),
      ...(data.bio !== undefined && { bio: data.bio.trim() }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.dailyGoalMinutes && { dailyGoalMinutes: data.dailyGoalMinutes }),
    },
  });
  
  return formatUserPublic(user);
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const normalized = username.toLowerCase().trim();
  
  const existing = await prisma.user.findUnique({
    where: { username: normalized },
  });
  
  return !existing;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  return {
    xp: user.xp,
    level: user.level,
    xpToNextLevel: xpToNextLevel(user.xp),
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    tasksCompleted: user.tasksCompleted,
    focusMinutes: user.focusMinutes,
    challengesWon: user.challengesWon,
    totalTimeSaved: user.totalTimeSaved,
  };
}

export async function addXp(userId: string, amount: number, reason?: string): Promise<{ xp: number; level: number; leveledUp: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  const newXp = user.xp + amount;
  const newLevel = calculateLevel(newXp);
  const leveledUp = newLevel > user.level;
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      level: newLevel,
    },
  });
  
  // If leveled up, could create notification here
  if (leveledUp) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'ACHIEVEMENT',
        title: '🎉 Level Up!',
        body: `Congratulations! You've reached level ${newLevel}!`,
        data: JSON.stringify({ level: newLevel, xp: newXp }),
      },
    });
  }
  
  return { xp: newXp, level: newLevel, leveledUp };
}

export async function completeOnboarding(userId: string): Promise<UserPublic> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isOnboarded: true },
  });
  
  // Award first-time XP
  await addXp(userId, 50, 'Completed onboarding');
  
  return formatUserPublic(user);
}

export async function deleteAccount(userId: string): Promise<void> {
  // Soft delete - just deactivate
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });
  
  // Delete all refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

export async function recordActivity(userId: string): Promise<void> {
  await checkAndUpdateStreak(userId);
}

export async function getSettings(userId: string) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });
  
  if (!settings) {
    // Create default settings
    return prisma.userSettings.create({
      data: {
        userId,
      },
    });
  }
  
  return settings;
}

export async function updateSettings(
  userId: string,
  data: Partial<{
    pushEnabled: boolean;
    emailNotifications: boolean;
    remindersBefore: number;
    voiceLanguage: string;
    voiceSpeed: string;
    voiceName: string;
    profilePublic: boolean;
    showStreak: boolean;
    showLevel: boolean;
    focusSessionDefault: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsBeforeLongBreak: number;
    theme: string;
  }>
) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });
}
