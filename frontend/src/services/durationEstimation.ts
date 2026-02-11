/**
 * Duration Estimation Service
 * 
 * Estimates task duration based on:
 * - Title keywords (e.g., "meeting" ~30m, "email" ~10m)
 * - User's historical patterns (via user model)
 * - Priority level
 * 
 * This is a local heuristic. Future: replace with ML model.
 * Only active when DURATION_ESTIMATION feature is unlocked.
 */

import { Task } from '@/lib/supabase';

interface DurationEstimateOptions {
  userModel?: any;
  isDurationUnlocked: boolean;
}

interface DurationEstimate {
  minutes: number;
  confidence: 'low' | 'medium' | 'high';
  source: 'keyword' | 'history' | 'default';
}

// Keyword-based duration estimates (minutes)
const KEYWORD_DURATIONS: Record<string, number> = {
  // Quick tasks
  call: 15,
  text: 5,
  message: 5,
  email: 10,
  reply: 10,
  pay: 5,
  buy: 15,
  pick: 15,
  drop: 15,
  // Medium tasks
  meeting: 30,
  review: 30,
  clean: 30,
  cook: 45,
  shop: 45,
  groceries: 45,
  exercise: 45,
  workout: 45,
  gym: 60,
  run: 30,
  walk: 30,
  // Longer tasks
  project: 60,
  study: 60,
  read: 45,
  write: 60,
  report: 60,
  presentation: 90,
  // Appointments
  doctor: 60,
  dentist: 60,
  appointment: 45,
};

/**
 * Estimate task duration from title keywords and user model.
 */
export function estimateTaskDuration(
  task: Partial<Task>,
  options: DurationEstimateOptions,
): DurationEstimate {
  if (!options.isDurationUnlocked) {
    return { minutes: 30, confidence: 'low', source: 'default' };
  }

  // If task already has a duration, return it
  if (task.estimated_duration) {
    return {
      minutes: task.estimated_duration,
      confidence: 'high',
      source: 'keyword',
    };
  }

  const title = (task.title || '').toLowerCase();

  // Check for keyword matches
  let bestMatch: string | null = null;
  let bestDuration = 0;

  for (const [keyword, duration] of Object.entries(KEYWORD_DURATIONS)) {
    if (title.includes(keyword)) {
      if (!bestMatch || keyword.length > bestMatch.length) {
        bestMatch = keyword;
        bestDuration = duration;
      }
    }
  }

  if (bestMatch) {
    // Adjust by priority (urgent tasks feel shorter, low-priority feel longer)
    let multiplier = 1;
    if (task.priority === 'urgent') multiplier = 0.8;
    if (task.priority === 'low') multiplier = 1.2;

    return {
      minutes: Math.round(bestDuration * multiplier / 5) * 5, // Round to 5min
      confidence: 'medium',
      source: 'keyword',
    };
  }

  // Default estimate based on priority
  const defaults: Record<string, number> = {
    low: 15,
    medium: 30,
    high: 45,
    urgent: 30,
  };

  return {
    minutes: defaults[task.priority || 'medium'] || 30,
    confidence: 'low',
    source: 'default',
  };
}
