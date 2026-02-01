export interface NotificationSettings {
  pushEnabled: boolean;
  taskReminders: boolean;
  assignmentAlerts: boolean;
  streakReminders: boolean;
  dailyBriefing: boolean;
  levelUpAlerts: boolean;
  challengeUpdates: boolean;
  circleActivity: boolean;
  aiInsights: boolean;
  weeklyDigest: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface NotificationCategoryItem {
  key: string;
  icon: string;
  color: string;
  title: string;
  subtitle: string;
}

export interface NotificationCategory {
  title: string;
  icon: string;
  color: string;
  items: NotificationCategoryItem[];
}

export type TimeField = 'start' | 'end';
export type TimePeriod = 'AM' | 'PM';

export interface ParsedTime {
  hour: number;
  minute: number;
  period: TimePeriod;
}
