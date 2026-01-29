/**
 * Analytics Service
 * User productivity metrics, trends, and insights
 */

import prisma from '../config/database.js';

// ==========================================
// TYPES
// ==========================================

export interface DailyStats {
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
  focusMinutes: number;
  xpEarned: number;
  streak: number;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalTasksCompleted: number;
  totalFocusMinutes: number;
  totalXpEarned: number;
  averageTasksPerDay: number;
  mostProductiveDay: string;
  categoryBreakdown: { category: string; count: number; percentage: number }[];
  priorityBreakdown: { priority: string; count: number; percentage: number }[];
}

export interface ProductivityTrends {
  last7Days: DailyStats[];
  last30Days: { week: string; stats: DailyStats }[];
  completionRate: number;
  averageFocusTime: number;
  peakHours: { hour: number; completions: number }[];
  streakHistory: { date: string; streak: number }[];
}

export interface UserInsights {
  currentLevel: number;
  xpToNextLevel: number;
  totalXp: number;
  lifetimeStats: {
    tasksCompleted: number;
    focusMinutes: number;
    challengesWon: number;
    longestStreak: number;
    daysActive: number;
  };
  achievements: {
    id: string;
    name: string;
    unlockedAt: string;
  }[];
  recentMilestones: string[];
}

// ==========================================
// DAILY STATISTICS
// ==========================================

export async function getDailyStats(userId: string, date: string): Promise<DailyStats> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Tasks completed on this date
  const tasksCompleted = await prisma.task.count({
    where: {
      userId,
      completed: true,
      completedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // Tasks created on this date
  const tasksCreated = await prisma.task.count({
    where: {
      userId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // Focus sessions on this date
  const focusSessions = await prisma.focusSession.aggregate({
    where: {
      userId,
      startedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: 'COMPLETED',
    },
    _sum: {
      actualMinutes: true,
    },
  });

  // XP earned - sum from tasks and focus sessions
  const xpFromTasks = await prisma.task.aggregate({
    where: {
      userId,
      completed: true,
      completedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    _sum: {
      xpAwarded: true,
    },
  });

  const xpFromFocus = await prisma.focusSession.aggregate({
    where: {
      userId,
      startedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: 'COMPLETED',
    },
    _sum: {
      xpAwarded: true,
    },
  });

  // Get user's streak on that date (approximate)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true },
  });

  return {
    date,
    tasksCompleted,
    tasksCreated,
    focusMinutes: focusSessions._sum.actualMinutes || 0,
    xpEarned: (xpFromTasks._sum.xpAwarded || 0) + (xpFromFocus._sum.xpAwarded || 0),
    streak: user?.currentStreak || 0,
  };
}

// ==========================================
// WEEKLY STATISTICS
// ==========================================

export async function getWeeklyStats(userId: string, weekStart?: Date): Promise<WeeklyStats> {
  const start = weekStart || getStartOfWeek(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  // Get all completed tasks this week
  const completedTasks = await prisma.task.findMany({
    where: {
      userId,
      completed: true,
      completedAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      category: true,
      priority: true,
      completedAt: true,
    },
  });

  // Focus sessions this week
  const focusSessions = await prisma.focusSession.aggregate({
    where: {
      userId,
      startedAt: { gte: start, lte: end },
      status: 'COMPLETED',
    },
    _sum: { actualMinutes: true },
  });

  // XP earned this week
  const xpEarned = await prisma.task.aggregate({
    where: {
      userId,
      completed: true,
      completedAt: { gte: start, lte: end },
    },
    _sum: { xpAwarded: true },
  });

  // Category breakdown
  const categoryMap = new Map<string, number>();
  completedTasks.forEach(t => {
    categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + 1);
  });
  const total = completedTasks.length || 1;
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({
    category,
    count,
    percentage: Math.round((count / total) * 100),
  })).sort((a, b) => b.count - a.count);

  // Priority breakdown
  const priorityMap = new Map<string, number>();
  completedTasks.forEach(t => {
    priorityMap.set(t.priority, (priorityMap.get(t.priority) || 0) + 1);
  });
  const priorityBreakdown = Array.from(priorityMap.entries()).map(([priority, count]) => ({
    priority,
    count,
    percentage: Math.round((count / total) * 100),
  }));

  // Most productive day
  const dayMap = new Map<string, number>();
  completedTasks.forEach(t => {
    if (t.completedAt) {
      const day = t.completedAt.toLocaleDateString('en-US', { weekday: 'long' });
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    }
  });
  const mostProductiveDay = Array.from(dayMap.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    weekStart: start.toISOString().split('T')[0],
    weekEnd: end.toISOString().split('T')[0],
    totalTasksCompleted: completedTasks.length,
    totalFocusMinutes: focusSessions._sum.actualMinutes || 0,
    totalXpEarned: xpEarned._sum.xpAwarded || 0,
    averageTasksPerDay: Math.round((completedTasks.length / 7) * 10) / 10,
    mostProductiveDay,
    categoryBreakdown,
    priorityBreakdown,
  };
}

// ==========================================
// PRODUCTIVITY TRENDS
// ==========================================

export async function getProductivityTrends(userId: string): Promise<ProductivityTrends> {
  const today = new Date();
  const last7Days: DailyStats[] = [];
  const last30Days: { week: string; stats: DailyStats }[] = [];

  // Get last 7 days stats
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const stats = await getDailyStats(userId, dateStr);
    last7Days.push(stats);
  }

  // Get last 30 days (grouped by week)
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i * 7) - today.getDay());
    const weekStats = await getWeeklyStats(userId, weekStart);
    last30Days.push({
      week: weekStats.weekStart,
      stats: {
        date: weekStats.weekStart,
        tasksCompleted: weekStats.totalTasksCompleted,
        tasksCreated: 0, // Not tracked per week
        focusMinutes: weekStats.totalFocusMinutes,
        xpEarned: weekStats.totalXpEarned,
        streak: 0,
      },
    });
  }

  // Completion rate (last 7 days)
  const totalCreated = last7Days.reduce((sum, d) => sum + d.tasksCreated, 0);
  const totalCompleted = last7Days.reduce((sum, d) => sum + d.tasksCompleted, 0);
  const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

  // Average focus time (last 7 days)
  const totalFocusMinutes = last7Days.reduce((sum, d) => sum + d.focusMinutes, 0);
  const averageFocusTime = Math.round(totalFocusMinutes / 7);

  // Peak hours (when tasks are completed)
  const completedTasks = await prisma.task.findMany({
    where: {
      userId,
      completed: true,
      completedAt: {
        gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    select: { completedAt: true },
  });

  const hourMap = new Map<number, number>();
  completedTasks.forEach(t => {
    if (t.completedAt) {
      const hour = t.completedAt.getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    }
  });

  const peakHours = Array.from(hourMap.entries())
    .map(([hour, completions]) => ({ hour, completions }))
    .sort((a, b) => b.completions - a.completions)
    .slice(0, 5);

  // Streak history (simplified - last 7 days of current streak)
  const streakHistory = last7Days.map(d => ({
    date: d.date,
    streak: d.streak,
  }));

  return {
    last7Days,
    last30Days,
    completionRate,
    averageFocusTime,
    peakHours,
    streakHistory,
  };
}

// ==========================================
// USER INSIGHTS
// ==========================================

export async function getUserInsights(userId: string): Promise<UserInsights> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      level: true,
      tasksCompleted: true,
      focusMinutes: true,
      challengesWon: true,
      longestStreak: true,
      currentStreak: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Calculate XP needed for next level
  const xpForCurrentLevel = (user.level - 1) * 1000;
  const xpForNextLevel = user.level * 1000;
  const xpToNextLevel = xpForNextLevel - user.xp;

  // Days active (days since account creation with activity)
  const activeDays = await prisma.task.groupBy({
    by: ['date'],
    where: {
      userId,
      completed: true,
    },
    _count: true,
  });

  // Get achievements
  const achievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: {
      id: true,
      achievementId: true,
      unlockedAt: true,
    },
    orderBy: { unlockedAt: 'desc' },
    take: 10,
  });

  // Recent milestones based on stats
  const recentMilestones: string[] = [];
  
  if (user.tasksCompleted >= 100) recentMilestones.push('🎯 100+ tasks completed!');
  if (user.tasksCompleted >= 500) recentMilestones.push('🏆 500+ tasks completed!');
  if (user.focusMinutes >= 600) recentMilestones.push('⏱️ 10+ hours of focus time!');
  if (user.focusMinutes >= 3000) recentMilestones.push('🔥 50+ hours of focus time!');
  if (user.currentStreak >= 7) recentMilestones.push('🔥 7+ day streak!');
  if (user.currentStreak >= 30) recentMilestones.push('🌟 30+ day streak!');
  if (user.level >= 5) recentMilestones.push('⭐ Reached Level 5!');
  if (user.level >= 10) recentMilestones.push('👑 Reached Level 10!');
  if (user.challengesWon >= 5) recentMilestones.push('🏅 Won 5+ challenges!');

  return {
    currentLevel: user.level,
    xpToNextLevel: Math.max(0, xpToNextLevel),
    totalXp: user.xp,
    lifetimeStats: {
      tasksCompleted: user.tasksCompleted,
      focusMinutes: user.focusMinutes,
      challengesWon: user.challengesWon,
      longestStreak: user.longestStreak,
      daysActive: activeDays.length,
    },
    achievements: achievements.map(a => ({
      id: a.id,
      name: a.achievementId, // Would need achievement name lookup
      unlockedAt: a.unlockedAt.toISOString(),
    })),
    recentMilestones: recentMilestones.slice(0, 5),
  };
}

// ==========================================
// CIRCLE ANALYTICS
// ==========================================

export interface CircleAnalytics {
  circleId: string;
  totalMembers: number;
  totalXp: number;
  assignmentsCompleted: number;
  assignmentsPending: number;
  completionRate: number;
  topContributors: { userId: string; name: string; xp: number }[];
  recentActivity: { type: string; description: string; timestamp: string }[];
  weeklyProgress: { day: string; completions: number }[];
}

export async function getCircleAnalytics(circleId: string): Promise<CircleAnalytics> {
  // Get circle with members
  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { xpContributed: 'desc' },
      },
      assignments: {
        select: { status: true },
      },
    },
  });

  if (!circle) {
    throw new Error('Circle not found');
  }

  const completedAssignments = circle.assignments.filter(a => a.status === 'COMPLETED').length;
  const pendingAssignments = circle.assignments.filter(a => 
    a.status === 'PENDING' || a.status === 'ACCEPTED'
  ).length;
  const totalAssignments = circle.assignments.length || 1;

  // Get recent posts for activity
  const recentPosts = await prisma.post.findMany({
    where: { circleId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      author: { select: { name: true } },
    },
  });

  // Weekly progress (last 7 days)
  const today = new Date();
  const weeklyProgress: { day: string; completions: number }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const completions = await prisma.assignment.count({
      where: {
        circleId,
        status: 'COMPLETED',
        updatedAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    });
    
    weeklyProgress.push({ day: dayStr, completions });
  }

  return {
    circleId,
    totalMembers: circle.members.length,
    totalXp: circle.totalXp,
    assignmentsCompleted: completedAssignments,
    assignmentsPending: pendingAssignments,
    completionRate: Math.round((completedAssignments / totalAssignments) * 100),
    topContributors: circle.members.slice(0, 5).map(m => ({
      userId: m.userId,
      name: m.user.name || 'Unknown',
      xp: m.xpContributed,
    })),
    recentActivity: recentPosts.map(p => ({
      type: p.type || 'POST',
      description: `${p.author.name || 'Someone'} posted`,
      timestamp: p.createdAt.toISOString(),
    })),
    weeklyProgress,
  };
}

// ==========================================
// LEADERBOARD
// ==========================================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  streak: number;
  tasksCompleted: number;
}

export async function getGlobalLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { xp: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      xp: true,
      level: true,
      currentStreak: true,
      tasksCompleted: true,
    },
  });

  return users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    name: u.name || 'Anonymous',
    avatarUrl: u.avatarUrl,
    xp: u.xp,
    level: u.level,
    streak: u.currentStreak,
    tasksCompleted: u.tasksCompleted,
  }));
}

export async function getCircleLeaderboard(circleId: string): Promise<LeaderboardEntry[]> {
  const members = await prisma.circleMember.findMany({
    where: { circleId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          xp: true,
          level: true,
          currentStreak: true,
          tasksCompleted: true,
        },
      },
    },
    orderBy: { xpContributed: 'desc' },
  });

  return members.map((m, i) => ({
    rank: i + 1,
    userId: m.user.id,
    name: m.user.name || 'Anonymous',
    avatarUrl: m.user.avatarUrl,
    xp: m.xpContributed,
    level: m.user.level,
    streak: m.user.currentStreak,
    tasksCompleted: m.tasksCompleted,
  }));
}

// ==========================================
// HELPERS
// ==========================================

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
