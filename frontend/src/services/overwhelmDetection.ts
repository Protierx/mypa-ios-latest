/**
 * Overwhelm Detection Service
 * 
 * Detects when user has too many tasks and offers help.
 * Uses learned patterns to identify user's threshold.
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 6, Step 6.7
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 5 "Learning System"
 */

import { Task } from '@/lib/supabase';
import { UserModelData } from '@/contexts/UserModelContext';

// ============================================================================
// Types
// ============================================================================

export interface OverwhelmStatus {
  /** Whether user is currently overwhelmed */
  isOverwhelmed: boolean;
  /** Current task count */
  taskCount: number;
  /** User's threshold (if known) */
  threshold: number | null;
  /** How far over threshold (if overwhelmed) */
  overflowCount: number;
  /** Severity level */
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  /** Suggested actions */
  suggestions: OverwhelmSuggestion[];
  /** AI message to show user */
  message: string | null;
}

export interface OverwhelmSuggestion {
  type: 'defer' | 'delegate' | 'break_down' | 'prioritize' | 'focus';
  title: string;
  description: string;
  action?: string;
}

export interface OverwhelmContext {
  /** User's learned patterns */
  userModel: UserModelData | null;
  /** Whether overwhelm detection is unlocked */
  isOverwhelmUnlocked: boolean;
  /** Current tasks to analyze */
  tasks: Task[];
}

// ============================================================================
// Default Thresholds
// ============================================================================

// If no learned threshold, use sensible defaults
const DEFAULT_THRESHOLDS = {
  comfortable: 5,  // Most people comfortable with 5 tasks
  mild: 8,         // 8+ starts to feel like a lot
  moderate: 12,    // 12+ is definitely overwhelming
  severe: 15,      // 15+ is crisis mode
};

// ============================================================================
// Overwhelm Detection
// ============================================================================

/**
 * Check if user is overwhelmed and get status
 */
export function checkOverwhelmStatus(context: OverwhelmContext): OverwhelmStatus {
  const { userModel, isOverwhelmUnlocked, tasks } = context;

  // Filter to pending tasks only
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const taskCount = pendingTasks.length;

  // If feature not unlocked, return basic status
  if (!isOverwhelmUnlocked) {
    return {
      isOverwhelmed: false,
      taskCount,
      threshold: null,
      overflowCount: 0,
      severity: 'none',
      suggestions: [],
      message: null,
    };
  }

  // Get threshold from user model or use default
  const threshold = userModel?.overwhelmThreshold || DEFAULT_THRESHOLDS.comfortable;
  const isOverwhelmed = taskCount > threshold;
  const overflowCount = Math.max(0, taskCount - threshold);

  // Calculate severity
  const severity = calculateSeverity(taskCount, threshold);

  // Generate suggestions based on severity
  const suggestions = generateSuggestions(severity, pendingTasks);

  // Generate message
  const message = generateOverwhelmMessage(severity, taskCount, threshold, pendingTasks);

  return {
    isOverwhelmed,
    taskCount,
    threshold,
    overflowCount,
    severity,
    suggestions,
    message,
  };
}

/**
 * Calculate overwhelm severity
 */
function calculateSeverity(
  taskCount: number,
  threshold: number
): 'none' | 'mild' | 'moderate' | 'severe' {
  const ratio = taskCount / threshold;

  if (ratio <= 1) return 'none';
  if (ratio <= 1.3) return 'mild';
  if (ratio <= 1.6) return 'moderate';
  return 'severe';
}

/**
 * Generate suggestions based on severity
 */
function generateSuggestions(
  severity: 'none' | 'mild' | 'moderate' | 'severe',
  tasks: Task[]
): OverwhelmSuggestion[] {
  const suggestions: OverwhelmSuggestion[] = [];

  if (severity === 'none') return suggestions;

  // Always suggest focusing on one task
  suggestions.push({
    type: 'focus',
    title: 'Focus on one task',
    description: 'Pick the most important task and start a focus session',
    action: 'start_focus',
  });

  // Find low priority tasks to defer
  const lowPriorityTasks = tasks.filter(t => t.priority === 'low');
  if (lowPriorityTasks.length > 0) {
    suggestions.push({
      type: 'defer',
      title: 'Defer low priority tasks',
      description: `You have ${lowPriorityTasks.length} low priority task${lowPriorityTasks.length > 1 ? 's' : ''} that could wait`,
      action: 'defer_low',
    });
  }

  // Find tasks without due dates (can be pushed back)
  const noDueDateTasks = tasks.filter(t => !t.due_date);
  if (noDueDateTasks.length > 0) {
    suggestions.push({
      type: 'prioritize',
      title: 'Set priorities',
      description: `${noDueDateTasks.length} task${noDueDateTasks.length > 1 ? 's' : ''} ${noDueDateTasks.length > 1 ? 'have' : 'has'} no due date`,
      action: 'set_due_dates',
    });
  }

  // For moderate/severe, suggest breaking down tasks
  if (severity === 'moderate' || severity === 'severe') {
    suggestions.push({
      type: 'break_down',
      title: 'Break down big tasks',
      description: 'Large tasks feel more manageable when split up',
      action: 'break_down',
    });

    suggestions.push({
      type: 'delegate',
      title: 'Share with your circle',
      description: 'Assign tasks to circle members for help',
      action: 'assign_to_circle',
    });
  }

  return suggestions.slice(0, 4); // Max 4 suggestions
}

/**
 * Generate a friendly overwhelm message
 */
function generateOverwhelmMessage(
  severity: 'none' | 'mild' | 'moderate' | 'severe',
  taskCount: number,
  threshold: number,
  tasks: Task[]
): string | null {
  switch (severity) {
    case 'none':
      return null;

    case 'mild':
      return `You have ${taskCount} tasks today. That's a bit more than your usual ${threshold}. Want help prioritizing?`;

    case 'moderate':
      return `Hey, you've got ${taskCount} tasks right now. I've noticed you're most effective with around ${threshold}. Let's figure out what's most important.`;

    case 'severe':
      return `Whoa, ${taskCount} tasks is a lot! Your sweet spot is around ${threshold}. Let me help you get this under control – what's the ONE thing that absolutely needs to happen today?`;

    default:
      return null;
  }
}

/**
 * Get tasks recommended to defer
 */
export function getTasksToDefer(tasks: Task[], count: number = 3): Task[] {
  // Sort by: low priority first, then no due date, then furthest due date
  return [...tasks]
    .filter(t => t.status === 'pending')
    .sort((a, b) => {
      // Low priority first
      const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;
      if (priorityA !== priorityB) return priorityA - priorityB;

      // No due date first (more flexible)
      if (!a.due_date && b.due_date) return -1;
      if (a.due_date && !b.due_date) return 1;

      // Furthest due date first
      if (a.due_date && b.due_date) {
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      }

      return 0;
    })
    .slice(0, count);
}

/**
 * Get the most important task to focus on
 */
export function getMostImportantTask(tasks: Task[]): Task | null {
  const pending = tasks.filter(t => t.status === 'pending');
  if (pending.length === 0) return null;

  // Sort by: urgent first, then high, then soonest due date
  return [...pending].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
    const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
    
    if (priorityA !== priorityB) return priorityA - priorityB;

    // Soonest due date
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;

    return 0;
  })[0];
}

/**
 * Calculate if adding more tasks would overwhelm the user
 */
export function wouldOverwhelm(
  currentTasks: Task[],
  tasksToAdd: number,
  userModel: UserModelData | null
): boolean {
  const currentCount = currentTasks.filter(t => t.status === 'pending').length;
  const threshold = userModel?.overwhelmThreshold || DEFAULT_THRESHOLDS.comfortable;
  
  return (currentCount + tasksToAdd) > threshold;
}

export default {
  checkOverwhelmStatus,
  getTasksToDefer,
  getMostImportantTask,
  wouldOverwhelm,
};
