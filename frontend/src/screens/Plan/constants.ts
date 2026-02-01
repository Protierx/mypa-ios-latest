import { FocusStats, CategoryAccent } from './types';

export const STORAGE_KEYS = {
  tasks: 'planTasks',
  sessions: 'focusSessions',
  stats: 'focusStats',
  pending: 'pendingPlanTasks',
  highlight: 'highlightNewTask',
};

export const DEFAULT_STATS: FocusStats = {
  totalSessions: 0,
  completedSessions: 0,
  abandonedSessions: 0,
  totalFocusMinutes: 0,
  currentStreak: 0,
  bestStreak: 0,
  averageCompletion: 0,
  lastSessionDate: null,
};

export const CATEGORY_ACCENTS: Record<string, CategoryAccent> = {
  Work: { bar: '#3B82F6', badge: '#2563EB', tint: '#EFF6FF' },
  Health: { bar: '#10B981', badge: '#059669', tint: '#ECFDF5' },
  Learning: { bar: '#F59E0B', badge: '#D97706', tint: '#FFFBEB' },
  Finance: { bar: '#06B6D4', badge: '#0891B2', tint: '#ECFEFF' },
  Social: { bar: '#EC4899', badge: '#DB2777', tint: '#FDF2F8' },
  Personal: { bar: '#8B5CF6', badge: '#7C3AED', tint: '#F5F3FF' },
};

export const CATEGORIES = ['Personal', 'Work', 'Health', 'Learning', 'Errands'];

export const DURATIONS = ['15m', '30m', '1h', '2h'];

export const PRIORITIES = ['Low', 'Normal', 'High'] as const;

// Focus ring dimensions
export const RING_SIZE = 140;
export const RING_STROKE = 10;
