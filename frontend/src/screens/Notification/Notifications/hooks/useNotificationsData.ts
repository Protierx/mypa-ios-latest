import { useState } from 'react';
import { NotificationType, DeliveryOption } from '../types';

export const useNotificationsData = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [calendarAlerts, setCalendarAlerts] = useState(true);
  const [circleUpdates, setCircleUpdates] = useState(true);
  const [challengeAlerts, setChallengeAlerts] = useState(true);
  const [nudges, setNudges] = useState(true);
  const [achievements, setAchievements] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [badgeEnabled, setBadgeEnabled] = useState(true);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const notificationTypes: NotificationType[] = [
    { key: 'taskReminders', label: 'Task Reminders', desc: 'Upcoming tasks & deadlines', icon: 'time', color: '#3B82F6', value: taskReminders, setter: setTaskReminders },
    { key: 'dailyBriefing', label: 'Daily Briefing', desc: 'Morning summary at 7:00 AM', icon: 'flash', color: '#8B5CF6', value: dailyBriefing, setter: setDailyBriefing },
    { key: 'calendarAlerts', label: 'Calendar Alerts', desc: 'Event reminders', icon: 'calendar', color: '#EF4444', value: calendarAlerts, setter: setCalendarAlerts },
    { key: 'circleUpdates', label: 'Circle Updates', desc: 'Posts, reactions & assignments', icon: 'people', color: '#EC4899', value: circleUpdates, setter: setCircleUpdates },
    { key: 'challengeAlerts', label: 'Challenges', desc: 'Progress & completions', icon: 'trophy', color: '#F97316', value: challengeAlerts, setter: setChallengeAlerts },
    { key: 'nudges', label: 'Nudges', desc: 'Motivational reminders', icon: 'chatbubble-ellipses', color: '#10B981', value: nudges, setter: setNudges },
    { key: 'achievements', label: 'Achievements', desc: 'Unlocks & milestones', icon: 'ribbon', color: '#F59E0B', value: achievements, setter: setAchievements },
    { key: 'weeklyReport', label: 'Weekly Report', desc: 'Sunday summary email', icon: 'bar-chart', color: '#6366F1', value: weeklyReport, setter: setWeeklyReport },
  ];

  const deliveryOptions: DeliveryOption[] = [
    { key: 'sound', label: 'Sound', icon: 'volume-high', color: '#8B5CF6', value: soundEnabled, setter: setSoundEnabled },
    { key: 'vibration', label: 'Vibration', icon: 'phone-portrait', color: '#F97316', value: vibrationEnabled, setter: setVibrationEnabled },
    { key: 'badge', label: 'Badge Count', icon: 'ellipse', color: '#EF4444', value: badgeEnabled, setter: setBadgeEnabled },
    { key: 'preview', label: 'Show Previews', desc: 'Show content on lock screen', icon: 'eye', color: '#64748B', value: previewEnabled, setter: setPreviewEnabled },
  ];

  return {
    notificationsEnabled,
    setNotificationsEnabled,
    notificationTypes,
    quietHoursEnabled,
    setQuietHoursEnabled,
    deliveryOptions,
  };
};
