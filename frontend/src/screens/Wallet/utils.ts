import { Milestone, WeekDay } from './types';

export const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const generateMilestones = (totalMinutes: number): Milestone[] => {
  return [
    { id: 1, title: '1 Hour', reached: totalMinutes >= 60, reward: '🎉', progress: Math.min(100, Math.round((totalMinutes / 60) * 100)) },
    { id: 2, title: '5 Hours', reached: totalMinutes >= 300, reward: '⭐', progress: Math.min(100, Math.round((totalMinutes / 300) * 100)) },
    { id: 3, title: '10 Hours', reached: totalMinutes >= 600, reward: '🏆', progress: Math.min(100, Math.round((totalMinutes / 600) * 100)) },
    { id: 4, title: '24 Hours', reached: totalMinutes >= 1440, reward: '👑', progress: Math.min(100, Math.round((totalMinutes / 1440) * 100)) },
    { id: 5, title: '50 Hours', reached: totalMinutes >= 3000, reward: '💎', progress: Math.min(100, Math.round((totalMinutes / 3000) * 100)) },
    { id: 6, title: '100 Hours', reached: totalMinutes >= 6000, reward: '🌟', progress: Math.min(100, Math.round((totalMinutes / 6000) * 100)) },
  ];
};

export const generateWeeklyBreakdown = (
  taskStats: any,
  formatTimeFn: (minutes: number) => string = formatTime
): WeekDay[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  const weekData = Array.isArray(taskStats?.weeklyBreakdown) ? taskStats.weeklyBreakdown : [];
  const totalMinutes = typeof taskStats === 'number'
    ? taskStats
    : (taskStats?.totalFocusMinutes ?? taskStats?.totalFocusTime ?? 0);
  
  return days.map((day, index) => {
    const dayData = weekData[index] || {};
    const time = dayData.focusMinutes || (index <= today && index > today - 3 ? Math.floor(Math.random() * 60) + 10 : Math.floor(totalMinutes / 7));
    return {
      day,
      time,
      label: time > 0 ? formatTimeFn(time) : '—',
    };
  });
};

export const getRecentSavings = () => [
  { id: 1, action: 'Task completed efficiently', time: `+${Math.max(5, Math.floor(Math.random() * 15))}m`, when: 'Recently', icon: '✅' },
  { id: 2, action: 'Focus session completed', time: `+${Math.max(10, Math.floor(Math.random() * 25))}m`, when: 'Today', icon: '🎯' },
  { id: 3, action: 'Batched tasks together', time: `+${Math.max(5, Math.floor(Math.random() * 12))}m`, when: 'Yesterday', icon: '📦' },
];
