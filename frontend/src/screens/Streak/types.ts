export interface StreakScreenProps {
  navigation?: any;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  xpMultiplier: number;
  nextMilestone: number;
  daysToMilestone: number;
}

export interface CalendarDay {
  date: Date;
  isActive: boolean;
  isToday: boolean;
}

export interface Milestone {
  days: number;
  reward: string;
  icon: string;
  color: string;
  achieved: boolean;
  current?: boolean;
}

export interface StreakBenefit {
  icon: string;
  title: string;
  desc: string;
  active: boolean;
}
