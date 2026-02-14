/**
 * AI Task Sorting Service
 * 
 * Sorts tasks based on user's learned patterns including:
 * - Peak hours (when user is most productive)
 * - Completion patterns (what types of tasks get completed)
 * - Priority and due date
 * - Likelihood of completion
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 6, Step 6.5
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 5 "Learning System"
 */

import { Task } from '@/lib/supabase';
import { UserModelData } from '@/contexts/UserModelContext';

// ============================================================================
// Types
// ============================================================================

export interface SortedTask extends Task {
  /** AI-calculated completion likelihood (0-1) */
  completionLikelihood?: number;
  /** Reason for the sort position */
  sortReason?: string;
  /** Whether this is a good time to do this task */
  isOptimalTime?: boolean;
}

export interface SortOptions {
  /** User's learned patterns */
  userModel: UserModelData | null;
  /** Whether AI sorting feature is unlocked */
  isAISortingUnlocked: boolean;
  /** Current hour (0-23) for peak hours calculation */
  currentHour?: number;
}

// ============================================================================
// Priority Weights
// ============================================================================

const PRIORITY_WEIGHTS: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// ============================================================================
// AI Task Sorter
// ============================================================================

/**
 * Sort tasks using AI-learned patterns
 */
export function sortTasksWithAI(
  tasks: Task[],
  options: SortOptions
): SortedTask[] {
  const { userModel, isAISortingUnlocked, currentHour = new Date().getHours() } = options;

  // If AI sorting not unlocked or no model, use basic sorting
  if (!isAISortingUnlocked || !userModel) {
    return sortTasksBasic(tasks);
  }

  // Calculate completion likelihood for each task
  const scoredTasks = tasks.map(task => {
    const score = calculateCompletionScore(task, userModel, currentHour);
    return {
      ...task,
      completionLikelihood: score.likelihood,
      sortReason: score.reason,
      isOptimalTime: score.isOptimalTime,
    } as SortedTask;
  });

  // Sort chronologically — AI enriches metadata but does NOT reorder by default
  // Reordering only happens when user taps "Prioritize"
  return scoredTasks.sort((a, b) => {
    // 1. Tasks with due_date before tasks without
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;

    // 2. Both have due_date → sort ascending
    if (a.due_date && b.due_date) {
      const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (diff !== 0) return diff;
    }

    // 3. Stable tiebreaker: created_at ascending
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/**
 * Basic task sorting (no AI) — CHRONOLOGICAL DEFAULT
 * Priority does NOT affect default ordering.
 * Sort: due_date ascending → timed tasks before untimed → created_at tiebreaker
 */
export function sortTasksBasic(tasks: Task[]): SortedTask[] {
  return [...tasks].sort((a, b) => {
    // 1. Tasks with due_date before tasks without
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;

    // 2. Both have due_date → sort ascending
    if (a.due_date && b.due_date) {
      const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (diff !== 0) return diff;
    }

    // 3. Stable tiebreaker: created_at ascending
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }) as SortedTask[];
}

/**
 * Calculate completion score for a task based on user patterns
 */
function calculateCompletionScore(
  task: Task,
  model: UserModelData,
  currentHour: number
): {
  likelihood: number;
  reason: string;
  isOptimalTime: boolean;
} {
  let likelihood = 0.5; // Base likelihood
  let reasons: string[] = [];
  let isOptimalTime = false;

  // Factor 1: Peak hours (is now a good time for this user?)
  if (model.peakHours && model.peakHours.length > 0) {
    if (model.peakHours.includes(currentHour)) {
      likelihood += 0.15;
      isOptimalTime = true;
      reasons.push('Peak productivity time');
    }
  }

  // Factor 2: Priority completion patterns
  if (model.completionPatterns?.byPriority) {
    const priorityRate = model.completionPatterns.byPriority[task.priority as keyof typeof model.completionPatterns.byPriority];
    if (priorityRate !== undefined) {
      // Adjust likelihood based on historical completion rate for this priority
      const adjustment = (priorityRate - 0.5) * 0.3; // Scale adjustment
      likelihood += adjustment;
      if (priorityRate > 0.7) {
        reasons.push('You complete these well');
      }
    }
  }

  // Factor 3: Day of week patterns
  if (model.completionPatterns?.byDayOfWeek) {
    const today = new Date().getDay();
    const dayRate = model.completionPatterns.byDayOfWeek[today];
    if (dayRate !== undefined) {
      const adjustment = (dayRate - 0.5) * 0.2;
      likelihood += adjustment;
      if (dayRate > 0.7) {
        reasons.push('Good day for tasks');
      }
    }
  }

  // Factor 4: Time-based patterns
  if (model.completionPatterns?.byHour) {
    const hourRate = model.completionPatterns.byHour[currentHour];
    if (hourRate !== undefined && hourRate > 0.6) {
      likelihood += 0.1;
      if (!isOptimalTime) {
        reasons.push('Good hour for you');
      }
    }
  }

  // Factor 5: Task duration vs user's typical duration
  if (task.estimated_duration && model.taskPreferences?.typicalDuration) {
    const typical = model.taskPreferences.typicalDuration;
    const estimated = task.estimated_duration;
    
    // Users tend to complete tasks closer to their typical duration
    if (Math.abs(estimated - typical) < 15) {
      likelihood += 0.1;
      reasons.push('Fits your style');
    }
  }

  // Ensure likelihood is between 0 and 1
  likelihood = Math.max(0, Math.min(1, likelihood));

  // Build reason string
  const reason = reasons.length > 0 ? reasons[0] : 'Based on patterns';

  return { likelihood, reason, isOptimalTime };
}

/**
 * Group tasks by completion likelihood
 */
export function groupTasksByLikelihood(tasks: SortedTask[]): {
  high: SortedTask[];    // > 0.7
  medium: SortedTask[];  // 0.4 - 0.7
  low: SortedTask[];     // < 0.4
} {
  return {
    high: tasks.filter(t => (t.completionLikelihood || 0.5) > 0.7),
    medium: tasks.filter(t => {
      const l = t.completionLikelihood || 0.5;
      return l >= 0.4 && l <= 0.7;
    }),
    low: tasks.filter(t => (t.completionLikelihood || 0.5) < 0.4),
  };
}

/**
 * Get AI sorting insights for display
 */
export function getAISortingInsights(
  tasks: SortedTask[],
  userModel: UserModelData | null
): string[] {
  const insights: string[] = [];

  if (!userModel) return insights;

  // Peak hours insight
  if (userModel.peakHours && userModel.peakHours.length > 0) {
    const peakStr = userModel.peakHours
      .slice(0, 3)
      .map(h => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        return `${hour}${ampm}`;
      })
      .join(', ');
    insights.push(`Your peak hours: ${peakStr}`);
  }

  // Optimal tasks count
  const optimalCount = tasks.filter(t => t.isOptimalTime).length;
  if (optimalCount > 0) {
    insights.push(`${optimalCount} task${optimalCount > 1 ? 's' : ''} optimal for right now`);
  }

  // High likelihood count
  const highLikelihood = tasks.filter(t => (t.completionLikelihood || 0) > 0.7).length;
  if (highLikelihood > 0) {
    insights.push(`${highLikelihood} task${highLikelihood > 1 ? 's' : ''} you're likely to complete`);
  }

  return insights;
}

export default {
  sortTasksWithAI,
  sortTasksBasic,
  groupTasksByLikelihood,
  getAISortingInsights,
};
