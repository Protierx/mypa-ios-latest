export interface AIInsightsScreenProps {
  // Navigation props if needed
}

export type SuggestionType = 
  | 'reschedule' 
  | 'break_down' 
  | 'delegate' 
  | 'prioritize' 
  | 'combine' 
  | 'defer' 
  | 'quick_win' 
  | 'balance';

export type InsightType = 'success' | 'warning' | 'info' | 'tip' | 'alert';

export type ImpactLevel = 'high' | 'medium' | 'low';

export interface TaskSuggestion {
  id: string;
  taskId?: string;
  taskTitle?: string;
  type: SuggestionType;
  message: string;
  action?: () => void;
  impact?: ImpactLevel;
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  icon: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface DayStats {
  pending: number;
  completed: number;
  highPriority: number;
  streak: number;
  weeklyCompleted: number;
  focusMinutes: number;
  overdue: number;
  productivity: number;
}

export interface ProductivityTip {
  title: string;
  message: string;
}
