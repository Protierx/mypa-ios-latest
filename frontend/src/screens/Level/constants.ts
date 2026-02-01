import { Tier } from './types';

export const XP_PER_LEVEL = 100;

export const getTierForLevel = (level: number): Tier => {
  if (level <= 5) return { name: 'Beginner', icon: 'sprout', color: '#10B981' };
  if (level <= 10) return { name: 'Explorer', icon: 'compass', color: '#06B6D4' };
  if (level <= 15) return { name: 'Rising Star', icon: 'star', color: '#8B5CF6' };
  if (level <= 25) return { name: 'Champion', icon: 'trophy', color: '#F59E0B' };
  if (level <= 40) return { name: 'Master', icon: 'diamond-stone', color: '#EC4899' };
  return { name: 'Legend', icon: 'crown', color: '#EAB308' };
};

export const getTiers = (currentLevel: number) => [
  {
    level: '1-5',
    name: 'Beginner',
    icon: 'sprout',
    color: '#10B981',
    current: currentLevel >= 1 && currentLevel <= 5,
  },
  {
    level: '6-10',
    name: 'Explorer',
    icon: 'compass',
    color: '#06B6D4',
    current: currentLevel >= 6 && currentLevel <= 10,
  },
  {
    level: '11-15',
    name: 'Rising Star',
    icon: 'star',
    color: '#8B5CF6',
    current: currentLevel >= 11 && currentLevel <= 15,
  },
  {
    level: '16-25',
    name: 'Champion',
    icon: 'trophy',
    color: '#F59E0B',
    current: currentLevel >= 16 && currentLevel <= 25,
  },
  {
    level: '26-40',
    name: 'Master',
    icon: 'diamond-stone',
    color: '#EC4899',
    current: currentLevel >= 26 && currentLevel <= 40,
  },
  {
    level: '41+',
    name: 'Legend',
    icon: 'crown',
    color: '#EAB308',
    current: currentLevel >= 41,
  },
];

export const getLevelRewards = (currentLevel: number) => [
  {
    level: 10,
    reward: 'Custom Themes',
    icon: 'color-palette',
    color: '#EC4899',
    unlocked: currentLevel >= 10,
    current: false,
  },
  {
    level: 12,
    reward: 'Priority Support',
    icon: 'people',
    color: '#8B5CF6',
    unlocked: currentLevel >= 12,
    current: currentLevel >= 12 && currentLevel < 15,
  },
  {
    level: 15,
    reward: 'Circle Leader Badge',
    icon: 'ribbon',
    color: '#F59E0B',
    unlocked: currentLevel >= 15,
    current: false,
  },
  {
    level: 20,
    reward: 'Unlimited Circles',
    icon: 'infinite',
    color: '#3B82F6',
    unlocked: currentLevel >= 20,
    current: false,
  },
  {
    level: 25,
    reward: 'VIP Status',
    icon: 'diamond',
    color: '#06B6D4',
    unlocked: currentLevel >= 25,
    current: false,
  },
];
