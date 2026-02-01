import { Quote, TimeColors, ScoreInfo } from './types';
import { MORNING_QUOTES, AFTERNOON_QUOTES, EVENING_QUOTES, CATEGORY_EMOJIS } from './constants';

export const getQuoteForTime = (): Quote => {
  const hour = new Date().getHours();
  const quotes = hour < 12 ? MORNING_QUOTES : hour < 17 ? AFTERNOON_QUOTES : EVENING_QUOTES;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return quotes[dayOfYear % quotes.length];
};

export const getTimeColors = (): TimeColors => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    // Morning
    return {
      gradient: ['#FF9500', '#FF6B00', '#FF3B30'],
      accent: '#FF9500',
      bg: '#FFF9F0',
    };
  } else if (hour >= 12 && hour < 17) {
    // Afternoon
    return {
      gradient: ['#007AFF', '#5856D6', '#AF52DE'],
      accent: '#007AFF',
      bg: '#F0F6FF',
    };
  } else if (hour >= 17 && hour < 21) {
    // Evening
    return {
      gradient: ['#AF52DE', '#FF6B9D', '#FF9500'],
      accent: '#AF52DE',
      bg: '#F5F0FF',
    };
  } else {
    // Night
    return {
      gradient: ['#5856D6', '#007AFF', '#34C759'],
      accent: '#5856D6',
      bg: '#F0F0FF',
    };
  }
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
};

export const calculateProductivityScore = (
  completedToday: number,
  totalToday: number,
  streak: number,
  weeklyCompleted: number
): number => {
  let score = 0;

  // Task completion rate (40 points max)
  if (totalToday > 0) {
    score += Math.round((completedToday / totalToday) * 40);
  } else {
    score += 20; // Neutral if no tasks
  }

  // Streak bonus (30 points max)
  score += Math.min(streak * 3, 30);

  // Weekly momentum (30 points max)
  score += Math.min(weeklyCompleted * 3, 30);

  return Math.min(score, 100);
};

export const getScoreInfo = (score: number): ScoreInfo => {
  if (score >= 80) return { color: '#34C759', label: 'Excellent', emoji: '🚀' };
  if (score >= 60) return { color: '#007AFF', label: 'Good', emoji: '💪' };
  if (score >= 40) return { color: '#FF9500', label: 'Building', emoji: '🌱' };
  return { color: '#FF3B30', label: 'Getting Started', emoji: '✨' };
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'HIGH': return '#FF3B30';
    case 'NORMAL': return '#FF9500';
    case 'LOW': return '#34C759';
    default: return '#8E8E93';
  }
};

export const getCategoryEmoji = (category: string): string => {
  return CATEGORY_EMOJIS[category] || '📋';
};
