import { NotificationSettings, NotificationCategory } from './types';

export const defaultSettings: NotificationSettings = {
  pushEnabled: true,
  taskReminders: true,
  assignmentAlerts: true,
  streakReminders: true,
  dailyBriefing: true,
  levelUpAlerts: true,
  challengeUpdates: true,
  circleActivity: true,
  aiInsights: true,
  weeklyDigest: true,
  soundEnabled: true,
  vibrationEnabled: true,
  badgeEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

export const NOTIFICATION_CATEGORIES: Record<string, NotificationCategory> = {
  tasks: {
    title: 'Tasks & Productivity',
    icon: 'checkmark-circle',
    color: '#007AFF',
    items: [
      { key: 'taskReminders', icon: 'alarm', color: '#FF9500', title: 'Task Reminders', subtitle: 'Get reminded before tasks are due' },
      { key: 'dailyBriefing', icon: 'sunny', color: '#FF6B00', title: 'Daily Briefing', subtitle: 'Morning summary of your day' },
      { key: 'aiInsights', icon: 'sparkles', color: '#AF52DE', title: 'AI Insights', subtitle: 'Smart suggestions and tips' },
    ],
  },
  social: {
    title: 'Social & Circles',
    icon: 'people',
    color: '#34C759',
    items: [
      { key: 'assignmentAlerts', icon: 'paper-plane', color: '#5856D6', title: 'Mission Alerts', subtitle: 'When someone assigns you a task' },
      { key: 'circleActivity', icon: 'chatbubbles', color: '#34C759', title: 'Circle Activity', subtitle: 'Posts and updates from your circles' },
    ],
  },
  progress: {
    title: 'Progress & Achievements',
    icon: 'trophy',
    color: '#FFD60A',
    items: [
      { key: 'streakReminders', icon: 'flame', color: '#FF3B30', title: 'Streak Reminders', subtitle: 'Keep your streak alive' },
      { key: 'levelUpAlerts', icon: 'arrow-up-circle', color: '#FFD60A', title: 'Level Up Alerts', subtitle: 'When you reach a new level' },
      { key: 'challengeUpdates', icon: 'flag', color: '#FF2D55', title: 'Challenge Updates', subtitle: 'Challenge progress and completions' },
      { key: 'weeklyDigest', icon: 'stats-chart', color: '#5AC8FA', title: 'Weekly Digest', subtitle: 'Your productivity summary' },
    ],
  },
};

export const DELIVERY_OPTIONS = [
  { key: 'soundEnabled', icon: 'volume-high', color: '#FF375F', title: 'Sound', subtitle: 'Play sound for notifications' },
  { key: 'vibrationEnabled', icon: 'phone-portrait', color: '#AF52DE', title: 'Vibration', subtitle: 'Vibrate on notifications' },
  { key: 'badgeEnabled', icon: 'ellipse', color: '#FF9500', title: 'Badge Count', subtitle: 'Show number on app icon' },
];

export const QUICK_TIME_OPTIONS = [
  { hour: 10, minute: 0, period: 'PM' as const, label: '10:00 PM' },
  { hour: 11, minute: 0, period: 'PM' as const, label: '11:00 PM' },
  { hour: 7, minute: 0, period: 'AM' as const, label: '7:00 AM' },
  { hour: 8, minute: 0, period: 'AM' as const, label: '8:00 AM' },
];
