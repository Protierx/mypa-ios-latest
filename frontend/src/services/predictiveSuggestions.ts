/**
 * Predictive Suggestions Service
 * 
 * Analyzes user patterns to proactively suggest:
 * - Recurring tasks (weekly planning, exercise routines)
 * - Time-based suggestions (morning routines)
 * - Context-based recommendations
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 6, Step 6.9
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 5 "Learning System"
 */

import { supabase } from '@/lib/supabase';
import { AI_FEATURES } from '@/contexts/UserModelContext';

// Types
export interface PredictedTask {
  title: string;
  suggestedDueDate: Date;
  reason: string;
  confidence: number; // 0-1
  pattern: PatternType;
  originalTaskId?: string; // If based on a specific past task
}

export interface Suggestion {
  id: string;
  type: 'recurring_task' | 'routine' | 'context' | 'optimization';
  message: string;
  action: SuggestionAction;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
  dismissed?: boolean;
}

export interface SuggestionAction {
  type: 'create_task' | 'start_focus' | 'navigate' | 'defer_tasks' | 'custom';
  payload: any;
}

export type PatternType = 
  | 'weekly_recurring' 
  | 'daily_recurring' 
  | 'monthly_recurring'
  | 'time_of_day'
  | 'day_of_week';

interface RecurringPattern {
  title: string;
  frequency: PatternType;
  dayOfWeek?: number; // 0-6 for weekly
  timeOfDay?: number; // Hour
  occurrences: number;
  lastOccurred: Date;
}

// Pattern detection thresholds
const WEEKLY_PATTERN_THRESHOLD = 3; // Need 3+ occurrences to suggest
const DAILY_PATTERN_THRESHOLD = 5;
const CONFIDENCE_HIGH = 0.8;
const CONFIDENCE_MEDIUM = 0.6;

/**
 * Analyze task history to find recurring patterns
 */
export async function detectRecurringPatterns(userId: string): Promise<RecurringPattern[]> {
  // Get last 90 days of completed tasks
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('title, created_at, completed_at, due_date')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('created_at', ninetyDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error || !tasks || tasks.length < 5) {
    return [];
  }

  const patterns: Map<string, RecurringPattern> = new Map();

  // Group tasks by normalized title
  const tasksByTitle = groupTasksByNormalizedTitle(tasks);

  // Analyze each group for patterns
  for (const [normalizedTitle, taskGroup] of tasksByTitle.entries()) {
    if (taskGroup.length < WEEKLY_PATTERN_THRESHOLD) continue;

    const pattern = analyzeFrequency(normalizedTitle, taskGroup);
    if (pattern) {
      patterns.set(normalizedTitle, pattern);
    }
  }

  return Array.from(patterns.values());
}

/**
 * Group tasks by normalized (lowercased, trimmed) title
 */
function groupTasksByNormalizedTitle(tasks: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();

  for (const task of tasks) {
    const normalized = normalizeTitle(task.title);
    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(task);
  }

  return groups;
}

/**
 * Normalize task title for comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ''); // Remove punctuation
}

/**
 * Analyze a group of tasks to detect frequency pattern
 */
function analyzeFrequency(title: string, tasks: any[]): RecurringPattern | null {
  const dates = tasks.map(t => new Date(t.created_at || t.due_date)).sort((a, b) => a.getTime() - b.getTime());
  
  if (dates.length < 2) return null;

  // Calculate gaps between occurrences
  const gaps: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const daysDiff = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    gaps.push(daysDiff);
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);

  // Determine pattern type based on average gap
  let frequency: PatternType | null = null;
  
  if (avgGap >= 0.5 && avgGap <= 1.5 && stdDev < 0.5) {
    frequency = 'daily_recurring';
  } else if (avgGap >= 6 && avgGap <= 8 && stdDev < 2) {
    frequency = 'weekly_recurring';
  } else if (avgGap >= 25 && avgGap <= 35 && stdDev < 5) {
    frequency = 'monthly_recurring';
  }

  if (!frequency) return null;

  // Determine day of week for weekly patterns
  let dayOfWeek: number | undefined;
  if (frequency === 'weekly_recurring') {
    const dayCount = new Map<number, number>();
    for (const date of dates) {
      const day = date.getDay();
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
    }
    
    // Find most common day
    let maxCount = 0;
    for (const [day, count] of dayCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dayOfWeek = day;
      }
    }
  }

  // Determine typical time of day
  const hourCount = new Map<number, number>();
  for (const date of dates) {
    const hour = date.getHours();
    hourCount.set(hour, (hourCount.get(hour) || 0) + 1);
  }
  
  let timeOfDay: number | undefined;
  let maxHourCount = 0;
  for (const [hour, count] of hourCount.entries()) {
    if (count > maxHourCount) {
      maxHourCount = count;
      timeOfDay = hour;
    }
  }

  return {
    title: tasks[0].title, // Use original title with casing
    frequency,
    dayOfWeek,
    timeOfDay,
    occurrences: tasks.length,
    lastOccurred: dates[dates.length - 1],
  };
}

/**
 * Generate predicted tasks based on detected patterns
 */
export function generatePredictedTasks(patterns: RecurringPattern[]): PredictedTask[] {
  const predictions: PredictedTask[] = [];
  const now = new Date();

  for (const pattern of patterns) {
    const suggestion = generateSuggestionFromPattern(pattern, now);
    if (suggestion) {
      predictions.push(suggestion);
    }
  }

  // Sort by confidence
  return predictions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Generate a task suggestion from a pattern
 */
function generateSuggestionFromPattern(pattern: RecurringPattern, now: Date): PredictedTask | null {
  let suggestedDate: Date;
  let reason: string;
  let confidence: number;

  const daysSinceLastOccurrence = (now.getTime() - pattern.lastOccurred.getTime()) / (1000 * 60 * 60 * 24);

  switch (pattern.frequency) {
    case 'daily_recurring':
      // If it's been more than a day, suggest for today
      if (daysSinceLastOccurrence >= 1) {
        suggestedDate = new Date(now);
        reason = "You do this every day";
        confidence = Math.min(pattern.occurrences / 10, CONFIDENCE_HIGH);
      } else {
        return null; // Already done today
      }
      break;

    case 'weekly_recurring':
      // Suggest for the next occurrence of the pattern day
      if (pattern.dayOfWeek !== undefined) {
        const daysUntilNext = (pattern.dayOfWeek - now.getDay() + 7) % 7;
        
        // If it's the right day and hasn't been done this week
        if (daysUntilNext === 0 && daysSinceLastOccurrence >= 6) {
          suggestedDate = new Date(now);
          reason = `It's ${getDayName(pattern.dayOfWeek)} - you usually do this`;
          confidence = CONFIDENCE_HIGH;
        } else if (daysUntilNext <= 2 && daysSinceLastOccurrence >= 5) {
          // Coming up in the next 2 days
          suggestedDate = new Date(now);
          suggestedDate.setDate(suggestedDate.getDate() + daysUntilNext);
          reason = `You usually do this on ${getDayName(pattern.dayOfWeek)}s`;
          confidence = CONFIDENCE_MEDIUM;
        } else {
          return null; // Not time yet
        }
      } else {
        return null;
      }
      break;

    case 'monthly_recurring':
      // Suggest if it's been close to a month
      if (daysSinceLastOccurrence >= 25 && daysSinceLastOccurrence <= 35) {
        suggestedDate = new Date(now);
        reason = "You do this monthly";
        confidence = CONFIDENCE_MEDIUM;
      } else {
        return null;
      }
      break;

    default:
      return null;
  }

  return {
    title: pattern.title,
    suggestedDueDate: suggestedDate,
    reason,
    confidence,
    pattern: pattern.frequency,
  };
}

/**
 * Get day name from day number
 */
function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
}

/**
 * Generate context-based suggestions
 */
export function generateContextSuggestions(
  userModel: any,
  currentHour: number,
  currentTasks: any[]
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Peak hour suggestion
  if (userModel?.peak_hours?.includes(currentHour)) {
    const hasUrgentTasks = currentTasks.some(t => 
      t.priority === 'urgent' || t.priority === 'high'
    );
    
    if (hasUrgentTasks) {
      suggestions.push({
        id: 'peak-hour-focus',
        type: 'optimization',
        message: "You're in your peak focus time! Perfect for tackling that important task.",
        action: {
          type: 'start_focus',
          payload: { duration: 25 },
        },
        priority: 'high',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });
    }
  }

  // End of day suggestion
  if (currentHour >= 17 && currentHour <= 19) {
    const incompleteTasks = currentTasks.filter(t => t.status !== 'completed');
    if (incompleteTasks.length > 0 && incompleteTasks.length <= 3) {
      suggestions.push({
        id: 'end-of-day-push',
        type: 'optimization',
        message: `Just ${incompleteTasks.length} task${incompleteTasks.length > 1 ? 's' : ''} left today. Quick win?`,
        action: {
          type: 'navigate',
          payload: { screen: 'Tasks' },
        },
        priority: 'medium',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      });
    }
  }

  // Morning planning suggestion
  if (currentHour >= 6 && currentHour <= 9) {
    const todayTasks = currentTasks.filter(t => {
      const dueDate = new Date(t.due_date);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString();
    });
    
    if (todayTasks.length === 0) {
      suggestions.push({
        id: 'morning-planning',
        type: 'routine',
        message: "Good morning! Want to plan out your day?",
        action: {
          type: 'create_task',
          payload: {},
        },
        priority: 'low',
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
      });
    }
  }

  return suggestions;
}

/**
 * Main function: Get all suggestions for a user
 */
export async function getPredictiveSuggestions(
  userId: string,
  userModel: any,
  currentTasks: any[],
  hasUnlock: (feature: string) => boolean
): Promise<{
  predictedTasks: PredictedTask[];
  suggestions: Suggestion[];
}> {
  // Check if user has the predictive mode unlock
  if (!hasUnlock(AI_FEATURES.PREDICTIVE_TASKS)) {
    return {
      predictedTasks: [],
      suggestions: [],
    };
  }

  // Detect recurring patterns
  const patterns = await detectRecurringPatterns(userId);
  
  // Generate predicted tasks
  const predictedTasks = generatePredictedTasks(patterns);

  // Generate context suggestions
  const currentHour = new Date().getHours();
  const suggestions = generateContextSuggestions(userModel, currentHour, currentTasks);

  return {
    predictedTasks: predictedTasks.slice(0, 5), // Top 5 predictions
    suggestions,
  };
}

/**
 * Accept a predicted task and create it
 */
export async function acceptPredictedTask(
  userId: string,
  prediction: PredictedTask
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: prediction.title,
        due_date: prediction.suggestedDueDate.toISOString(),
        priority: 'medium',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, taskId: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Dismiss a suggestion
 */
export async function dismissSuggestion(
  userId: string,
  suggestionId: string
): Promise<void> {
  // In a full implementation, this would be stored in a database
  // For now, we use local storage
  const key = `dismissed_suggestions_${userId}`;
  try {
    const existing = localStorage.getItem(key);
    const dismissed = existing ? JSON.parse(existing) : [];
    dismissed.push({
      id: suggestionId,
      dismissedAt: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(dismissed));
  } catch {
    // Ignore storage errors
  }
}

export default {
  detectRecurringPatterns,
  generatePredictedTasks,
  generateContextSuggestions,
  getPredictiveSuggestions,
  acceptPredictedTask,
  dismissSuggestion,
};
