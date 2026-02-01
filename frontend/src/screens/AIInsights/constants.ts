import { ProductivityTip } from './types';

export const PRODUCTIVITY_TIPS: ProductivityTip[] = [
  { 
    title: "Two-Minute Rule", 
    message: "If a task takes less than 2 minutes, do it now!" 
  },
  { 
    title: "Time Blocking", 
    message: "Schedule dedicated blocks for deep work" 
  },
  { 
    title: "Eat the Frog", 
    message: "Tackle your hardest task first thing in the morning" 
  },
  { 
    title: "Pomodoro Technique", 
    message: "Work in 25-minute focused sprints with 5-minute breaks" 
  },
  { 
    title: "Energy Management", 
    message: "Schedule creative work when your energy peaks" 
  },
  { 
    title: "Batch Similar Tasks", 
    message: "Group similar tasks together to minimize context switching" 
  },
  { 
    title: "Weekly Review", 
    message: "Spend 30 minutes each week planning ahead" 
  },
  { 
    title: "Single Tasking", 
    message: "Focus on one task at a time for better quality" 
  },
];

export const SUGGESTION_CONFIG = {
  reschedule: { icon: 'time-outline', color: '#FF9500' },
  break_down: { icon: 'git-branch-outline', color: '#5856D6' },
  delegate: { icon: 'people-outline', color: '#007AFF' },
  prioritize: { icon: 'flag-outline', color: '#FF3B30' },
  combine: { icon: 'git-merge-outline', color: '#34C759' },
  defer: { icon: 'calendar-outline', color: '#8E8E93' },
  quick_win: { icon: 'flash-outline', color: '#FFCC00' },
  balance: { icon: 'analytics-outline', color: '#AF52DE' },
} as const;

export const INSIGHT_COLORS = {
  success: '#34C759',
  warning: '#FF9500',
  info: '#007AFF',
  tip: '#5856D6',
  alert: '#FF3B30',
} as const;

export const IMPACT_CONFIG = {
  high: { color: '#34C759', bg: '#E8F5E9', label: 'High Impact' },
  medium: { color: '#FF9500', bg: '#FFF3E0', label: 'Medium Impact' },
  low: { color: '#8E8E93', bg: '#F2F2F7', label: 'Low Impact' },
} as const;
