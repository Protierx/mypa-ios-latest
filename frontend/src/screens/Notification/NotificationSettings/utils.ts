import { ParsedTime, TimePeriod, NotificationSettings } from './types';

// Convert 24h time string to 12h format
export const parseTimeString = (timeStr: string): ParsedTime => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period: TimePeriod = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return { hour, minute: minutes, period };
};

// Convert 12h to 24h format string
export const formatTo24Hour = (hour: number, minute: number, period: TimePeriod): string => {
  let hour24 = hour;
  if (period === 'PM' && hour !== 12) hour24 = hour + 12;
  if (period === 'AM' && hour === 12) hour24 = 0;
  return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Format time for display
export const formatTimeForDisplay = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Calculate quiet hours duration
export const getQuietHoursDuration = (start: string, end: string): string => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  if (endMinutes <= startMinutes) endMinutes += 24 * 60; // Handle overnight
  const diffMinutes = endMinutes - startMinutes;
  const hours = Math.floor(diffMinutes / 60);
  return `${hours} hours`;
};

// Count enabled notification types
export const countEnabledNotifications = (settings: NotificationSettings): number => {
  const keys: (keyof NotificationSettings)[] = [
    'taskReminders', 'assignmentAlerts', 'streakReminders', 'dailyBriefing',
    'levelUpAlerts', 'challengeUpdates', 'circleActivity', 'aiInsights', 'weeklyDigest'
  ];
  return keys.filter(key => settings[key] === true).length;
};
