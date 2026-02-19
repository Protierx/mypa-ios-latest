/**
 * AI Task Insights
 *
 * Generates contextual, time-aware messages about the user's tasks.
 * This is what makes the Tasks page feel like talking to an assistant,
 * not just looking at a database table.
 */

import { Task } from '@/lib/supabase';
import { SortedTask } from './aiTaskSorting';

export interface TaskInsight {
  message: string;
  submessage?: string;
  icon: string;
  accent: string; // color
  action?: {
    label: string;
    type: 'focus_top' | 'reschedule_overdue' | 'plan_day' | 'add_task';
  };
}

/**
 * Compact suggestion for the AI Task Assistant strip.
 * Task-management focused (no Focus CTAs).
 */
export interface AITaskSuggestion {
  text: string;
  type: 'overdue' | 'missing_duration' | 'prioritize' | 'cleanup' | 'default';
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Late night';
}

function getTimeContext(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

export function generateTaskInsight(
  tasks: (Task | SortedTask)[],
): TaskInsight {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const active = tasks.filter((t) => t.status !== 'completed');
  const completed = tasks.filter((t) => t.status === 'completed');

  const overdue = active.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()) < today;
  });

  const todayTasks = active.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  const urgent = active.filter((t) => t.priority === 'urgent' || t.priority === 'high');
  const greeting = getGreeting();
  const timeCtx = getTimeContext();

  // ── Priority 1: Overdue tasks ──
  if (overdue.length > 0) {
    const topOverdue = overdue[0];
    return {
      message: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
      submessage: overdue.length === 1
        ? `"${topOverdue.title}" needs your attention`
        : `Starting with "${topOverdue.title}" would help clear the backlog`,
      icon: 'alert-circle',
      accent: '#EF4444',
      action: { label: 'Reschedule All', type: 'reschedule_overdue' },
    };
  }

  // ── Priority 2: Urgent/high tasks today ──
  if (urgent.length > 0 && todayTasks.length > 0) {
    const topUrgent = urgent[0];
    return {
      message: `${greeting}. Focus on what matters.`,
      submessage: `"${topUrgent.title}" is ${topUrgent.priority} priority — tackle it ${timeCtx === 'morning' ? 'this morning' : 'next'}`,
      icon: 'flash',
      accent: '#F97316',
      action: { label: 'Start Focus', type: 'focus_top' },
    };
  }

  // ── Priority 3: Has tasks today ──
  if (todayTasks.length > 0) {
    const plural = todayTasks.length > 1;
    return {
      message: `${greeting}. ${todayTasks.length} task${plural ? 's' : ''} for today.`,
      submessage: plural
        ? `Start with "${todayTasks[0].title}" and build momentum`
        : `Just "${todayTasks[0].title}" — you've got this`,
      icon: 'sunny',
      accent: '#4AADA1',
      action: { label: 'Plan My Day', type: 'plan_day' },
    };
  }

  // ── Priority 4: Has tasks but none today ──
  if (active.length > 0) {
    return {
      message: `${greeting}. Nothing due today.`,
      submessage: `You have ${active.length} upcoming task${active.length > 1 ? 's' : ''}. Want to get ahead?`,
      icon: 'leaf',
      accent: '#22C55E',
      action: { label: 'Plan Ahead', type: 'plan_day' },
    };
  }

  // ── Priority 5: Completed tasks but no active ──
  if (completed.length > 0) {
    return {
      message: `${greeting}. All tasks complete!`,
      submessage: `You've completed ${completed.length} task${completed.length > 1 ? 's' : ''}. Time to plan what's next?`,
      icon: 'trophy',
      accent: '#EAB308',
      action: { label: 'Add Task', type: 'add_task' },
    };
  }

  // ── Priority 6: No tasks at all ──
  return {
    message: `${greeting}. Your slate is clean.`,
    submessage: 'Add your first task and let me help you stay on track.',
    icon: 'sparkles',
    accent: '#4AADA1',
    action: { label: 'Add Task', type: 'add_task' },
  };
}

/**
 * Generate a short AI tip based on task patterns.
 */
export function generateQuickTip(tasks: (Task | SortedTask)[]): string | null {
  const active = tasks.filter((t) => t.status !== 'completed');
  if (active.length === 0) return null;

  const noDate = active.filter((t) => !t.due_date);
  if (noDate.length > 2) {
    return `Tip: ${noDate.length} tasks have no due date. Adding dates helps me prioritise better.`;
  }

  const noDuration = active.filter((t) => !t.estimated_duration);
  if (noDuration.length > 3) {
    return `Tip: Adding time estimates helps me suggest the right task for the right moment.`;
  }

  const allLow = active.every((t) => t.priority === 'low' || t.priority === 'medium');
  if (active.length > 5 && allLow) {
    return `Tip: Mark your most important task as 'high' so I can surface it first.`;
  }

  return null;
}

/**
 * Generate a compact AI suggestion for the Task Assistant strip.
 * Focuses on task management actions only (no Focus CTAs).
 */
export function generateTaskAssistantSuggestion(
  tasks: (Task | SortedTask)[],
): AITaskSuggestion {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const active = tasks.filter((t) => t.status !== 'completed');

  // Count overdue tasks
  const overdue = active.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()) < today;
  });

  // Count tasks missing duration
  const missingDuration = active.filter((t) => !t.estimated_duration);

  // Count today's tasks
  const todayTasks = active.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  // Priority 1: Overdue tasks
  if (overdue.length > 0) {
    return {
      text: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} — reorder by urgency?`,
      type: 'overdue',
    };
  }

  // Priority 2: Many tasks missing duration
  if (missingDuration.length >= 3) {
    return {
      text: `${missingDuration.length} tasks missing duration — add estimates?`,
      type: 'missing_duration',
    };
  }

  // Priority 3: Many tasks today - offer to prioritize
  if (todayTasks.length >= 4) {
    return {
      text: `${todayTasks.length} tasks today — want me to prioritize?`,
      type: 'prioritize',
    };
  }

  // Priority 4: Have tasks - offer planning
  if (active.length > 0) {
    const topTask = active[0];
    const shortTitle = topTask.title.length > 25
      ? topTask.title.substring(0, 25) + '...'
      : topTask.title;
    return {
      text: `Ready to tackle "${shortTitle}"?`,
      type: 'default',
    };
  }

  // Priority 5: No active tasks
  return {
    text: 'All clear! Want to plan ahead?',
    type: 'default',
  };
}
