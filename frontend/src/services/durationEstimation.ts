/**
 * Duration Estimation Service
 * 
 * AI-powered task duration estimation based on:
 * - Historical focus session data
 * - Task category/keywords
 * - User's typical pace
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 6, Step 6.6
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 5 "Learning System"
 */

import { Task } from '@/lib/supabase';
import { UserModelData } from '@/contexts/UserModelContext';

// ============================================================================
// Types
// ============================================================================

export interface DurationEstimate {
  /** Estimated duration in minutes */
  minutes: number;
  /** Confidence level (0-1) */
  confidence: number;
  /** How the estimate was calculated */
  basis: 'historical' | 'category' | 'default' | 'user_typical';
  /** Human-readable explanation */
  explanation: string;
}

export interface EstimationContext {
  /** User's learned patterns */
  userModel: UserModelData | null;
  /** Whether duration estimation feature is unlocked */
  isDurationUnlocked: boolean;
}

// ============================================================================
// Default Durations (fallback values)
// ============================================================================

const DEFAULT_DURATIONS: Record<string, number> = {
  // Common task keywords
  email: 10,
  call: 15,
  meeting: 30,
  review: 20,
  write: 45,
  read: 30,
  research: 60,
  plan: 25,
  design: 45,
  code: 60,
  test: 30,
  fix: 25,
  update: 15,
  create: 45,
  organize: 20,
  clean: 30,
  
  // Priority-based defaults
  urgent: 20,
  high: 30,
  medium: 25,
  low: 20,
};

// Absolute default
const FALLBACK_DURATION = 25;

// ============================================================================
// Duration Estimation
// ============================================================================

/**
 * Estimate duration for a task
 */
export function estimateTaskDuration(
  task: Partial<Task>,
  context: EstimationContext
): DurationEstimate {
  const { userModel, isDurationUnlocked } = context;

  // If feature not unlocked, return simple default
  if (!isDurationUnlocked) {
    return getDefaultEstimate(task);
  }

  // Try different estimation methods in order of accuracy
  
  // 1. Check if user has typical duration in their model
  if (userModel?.taskPreferences?.typicalDuration) {
    return {
      minutes: userModel.taskPreferences.typicalDuration,
      confidence: 0.7,
      basis: 'user_typical',
      explanation: 'Based on your typical task duration',
    };
  }

  // 2. Check completion patterns for average time
  if (userModel?.completionPatterns?.avgCompletionTime) {
    return {
      minutes: Math.round(userModel.completionPatterns.avgCompletionTime),
      confidence: 0.8,
      basis: 'historical',
      explanation: 'Based on your focus session history',
    };
  }

  // 3. Analyze task title for keywords
  const keywordEstimate = estimateFromKeywords(task.title || '');
  if (keywordEstimate) {
    return keywordEstimate;
  }

  // 4. Use priority-based estimate
  if (task.priority) {
    const priorityDuration = DEFAULT_DURATIONS[task.priority];
    if (priorityDuration) {
      return {
        minutes: priorityDuration,
        confidence: 0.4,
        basis: 'category',
        explanation: `Typical for ${task.priority} priority tasks`,
      };
    }
  }

  // 5. Fall back to default
  return getDefaultEstimate(task);
}

/**
 * Get a default estimate (no AI)
 */
function getDefaultEstimate(task: Partial<Task>): DurationEstimate {
  return {
    minutes: FALLBACK_DURATION,
    confidence: 0.3,
    basis: 'default',
    explanation: 'Default estimate',
  };
}

/**
 * Estimate duration from task title keywords
 */
function estimateFromKeywords(title: string): DurationEstimate | null {
  const lowerTitle = title.toLowerCase();
  
  // Check for keyword matches
  for (const [keyword, minutes] of Object.entries(DEFAULT_DURATIONS)) {
    if (lowerTitle.includes(keyword)) {
      return {
        minutes,
        confidence: 0.5,
        basis: 'category',
        explanation: `Based on "${keyword}" task type`,
      };
    }
  }

  // Check for time mentions (e.g., "30 minute meeting")
  const timeMatch = lowerTitle.match(/(\d+)\s*(min|minute|mins|hour|hr)/i);
  if (timeMatch) {
    let minutes = parseInt(timeMatch[1], 10);
    if (timeMatch[2].toLowerCase().includes('hour') || timeMatch[2].toLowerCase().includes('hr')) {
      minutes *= 60;
    }
    return {
      minutes: Math.min(minutes, 180), // Cap at 3 hours
      confidence: 0.9,
      basis: 'category',
      explanation: 'Duration mentioned in task',
    };
  }

  return null;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get duration suggestion text
 */
export function getDurationSuggestion(estimate: DurationEstimate): string {
  const formatted = formatDuration(estimate.minutes);
  
  switch (estimate.confidence) {
    case 0.9:
    case 0.8:
      return `~${formatted}`;
    case 0.7:
    case 0.6:
    case 0.5:
      return `~${formatted}`;
    default:
      return `~${formatted}`;
  }
}

/**
 * Get focus session duration options based on user patterns
 */
export function getSuggestedFocusDurations(
  userModel: UserModelData | null
): number[] {
  const defaults = [15, 25, 45, 60];

  if (!userModel?.taskPreferences?.typicalDuration) {
    return defaults;
  }

  const typical = userModel.taskPreferences.typicalDuration;
  
  // Create options around the user's typical duration
  const options = new Set<number>();
  
  // Add standard options
  options.add(15);
  options.add(25);
  
  // Add user's typical (rounded to 5 mins)
  const roundedTypical = Math.round(typical / 5) * 5;
  options.add(roundedTypical);
  
  // Add 1.5x and 2x typical if reasonable
  if (roundedTypical * 1.5 <= 90) {
    options.add(Math.round((roundedTypical * 1.5) / 5) * 5);
  }
  if (roundedTypical * 2 <= 120) {
    options.add(Math.round((roundedTypical * 2) / 5) * 5);
  }
  
  // Add standard longer options
  options.add(45);
  options.add(60);

  // Sort and return up to 4 options
  return Array.from(options)
    .filter(d => d >= 15 && d <= 120)
    .sort((a, b) => a - b)
    .slice(0, 4);
}

/**
 * Analyze task durations for insights
 */
export function analyzeDurationPatterns(
  focusSessions: Array<{
    duration_planned: number;
    duration_actual: number | null;
    ended_at: string | null;
  }>
): {
  avgPlanned: number;
  avgActual: number;
  completionRate: number;
  overrunRate: number;
} {
  const completedSessions = focusSessions.filter(
    s => s.ended_at && s.duration_actual !== null
  );

  if (completedSessions.length === 0) {
    return {
      avgPlanned: FALLBACK_DURATION,
      avgActual: FALLBACK_DURATION,
      completionRate: 0,
      overrunRate: 0,
    };
  }

  const totalPlanned = completedSessions.reduce((sum, s) => sum + s.duration_planned, 0);
  const totalActual = completedSessions.reduce((sum, s) => sum + (s.duration_actual || 0), 0);
  
  const overruns = completedSessions.filter(
    s => (s.duration_actual || 0) > s.duration_planned
  );

  return {
    avgPlanned: Math.round(totalPlanned / completedSessions.length),
    avgActual: Math.round(totalActual / completedSessions.length),
    completionRate: focusSessions.length > 0 
      ? completedSessions.length / focusSessions.length 
      : 0,
    overrunRate: completedSessions.length > 0
      ? overruns.length / completedSessions.length
      : 0,
  };
}

export default {
  estimateTaskDuration,
  formatDuration,
  getDurationSuggestion,
  getSuggestedFocusDurations,
  analyzeDurationPatterns,
};
