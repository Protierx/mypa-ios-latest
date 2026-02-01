export interface AnalyticsScreenProps {
  navigation?: any;
}

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
  categoryBreakdown: CategoryBreakdown[];
  priorityBreakdown: PriorityBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface PriorityBreakdown {
  priority: string;
  count: number;
  percentage: number;
}

export interface UserInsights {
  currentLevel: number;
  xpToNextLevel: number;
  totalXp: number;
  lifetimeStats: LifetimeStats;
  recentMilestones: string[];
}

export interface LifetimeStats {
  tasksCompleted: number;
  focusMinutes: number;
  challengesWon: number;
  longestStreak: number;
  daysActive: number;
}

export interface ProductivityTrends {
  last7Days: DailyStats[];
  completionRate: number;
  averageFocusTime: number;
  peakHours: PeakHour[];
}

export interface PeakHour {
  hour: number;
  completions: number;
}

export type PeriodType = 'day' | 'week' | 'month';
