import { ChallengeCategory } from './types';

export const categoryColors: Record<ChallengeCategory, { bg: string }> = {
  fitness: { bg: '#F43F5E' },
  wellness: { bg: '#8B5CF6' },
  learning: { bg: '#3B82F6' },
  productivity: { bg: '#F59E0B' },
  social: { bg: '#10B981' },
};

export const dayOptions = [7, 14, 21, 30, 60, 90];
export const xpOptions = [25, 50, 75, 100, 150, 200];

export const categoryList: ChallengeCategory[] = ['fitness', 'wellness', 'learning', 'productivity', 'social'];
