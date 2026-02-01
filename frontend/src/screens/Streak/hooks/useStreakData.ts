import { useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { StreakData, CalendarDay, Milestone, StreakBenefit } from '../types';
import { getXPMultiplier, getNextMilestone } from '../utils';

export const useStreakData = () => {
  const { user } = useAuth();

  const currentStreak = user?.currentStreak || 0;
  const longestStreak = user?.longestStreak || 0;
  const xpMultiplier = getXPMultiplier(currentStreak);
  const nextMilestone = getNextMilestone(currentStreak);
  const daysToMilestone = nextMilestone - currentStreak;

  const streakData: StreakData = useMemo(() => ({
    currentStreak,
    longestStreak,
    totalDaysActive: Math.max(currentStreak, longestStreak),
    xpMultiplier,
    nextMilestone,
    daysToMilestone,
  }), [currentStreak, longestStreak, xpMultiplier, nextMilestone, daysToMilestone]);

  const calendarDays: CalendarDay[] = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 28 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (27 - i));
      const daysAgo = 27 - i;
      const isActive = daysAgo < currentStreak;
      const isToday = i === 27;
      return { date, isActive, isToday };
    });
  }, [currentStreak]);

  const milestones: Milestone[] = useMemo(() => [
    { days: 3, reward: '1.2x XP', icon: 'flame', color: '#F97316', achieved: currentStreak >= 3 },
    { days: 7, reward: '1.5x XP', icon: 'flame', color: '#F97316', achieved: currentStreak >= 7, current: currentStreak >= 7 && currentStreak < 14 },
    { days: 14, reward: '2x XP', icon: 'diamond-stone', color: '#06B6D4', achieved: currentStreak >= 14, current: currentStreak >= 14 && currentStreak < 30 },
    { days: 30, reward: 'Streak Shield', icon: 'shield', color: '#3B82F6', achieved: currentStreak >= 30, current: currentStreak >= 30 && currentStreak < 60 },
    { days: 60, reward: 'Gold Badge', icon: 'trophy', color: '#F59E0B', achieved: currentStreak >= 60, current: currentStreak >= 60 && currentStreak < 100 },
    { days: 100, reward: 'Legend Status', icon: 'crown', color: '#EAB308', achieved: currentStreak >= 100 },
  ], [currentStreak]);

  const streakBenefits: StreakBenefit[] = useMemo(() => [
    {
      icon: 'flash',
      title: `${xpMultiplier}x XP Multiplier`,
      desc: xpMultiplier > 1 ? `All tasks give ${Math.round((xpMultiplier - 1) * 100)}% more XP` : 'Build streak for bonus XP',
      active: xpMultiplier > 1,
    },
    { icon: 'gift', title: 'Daily Bonus Chest', desc: 'Unlocks at 14 days', active: currentStreak >= 14 },
    { icon: 'shield', title: 'Streak Shield', desc: 'Unlocks at 30 days', active: currentStreak >= 30 },
  ], [xpMultiplier, currentStreak]);

  return {
    streakData,
    calendarDays,
    milestones,
    streakBenefits,
    currentStreak,
  };
};
