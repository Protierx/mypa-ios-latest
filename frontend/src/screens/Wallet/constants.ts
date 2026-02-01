import type { Period } from './types';

export const PERIODS: Period[] = ['today', 'week', 'month'];

export const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'Month',
};

export const HOW_IT_WORKS = [
  { icon: '⚡', action: 'Complete tasks faster than estimated', example: 'Avg +5-15m' },
  { icon: '📦', action: 'Batch similar tasks together', example: 'Avg +10-20m' },
  { icon: '🔄', action: 'Auto-optimized scheduling', example: 'Avg +5-10m' },
  { icon: '🚗', action: 'Reduced travel/transitions', example: 'Avg +10-30m' },
];
