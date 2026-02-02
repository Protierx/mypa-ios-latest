import { RouteProp } from '@react-navigation/native';

export interface AISuggestion {
  category: string;
  priority: 'High' | 'Normal' | 'Low';
  suggestedDuration: string;
  confidence: number;
  tags: string[];
}

export interface PlanScreenProps {
  navigation?: any;
  route?: RouteProp<{ Plan: { date?: string; taskId?: string; highlightNew?: boolean } }, 'Plan'>;
}

export interface Task {
  id: number;
  date: string;
  time: string;
  duration: string;
  durationMin: number;
  title: string;
  category: string;
  priority: 'High' | 'Normal' | 'Low';
  completed: boolean;
  isFixed: boolean;
  // Calendar integration
  isFromCalendar?: boolean;
  calendarEventId?: string;
  calendarId?: string;
}

export interface FocusSession {
  id: number;
  taskId: number;
  taskTitle: string;
  category: string;
  date: string;
  startTime: string;
  elapsedSeconds: number;
  targetSeconds: number;
  percentComplete: number;
  wasCompleted: boolean;
  wasAbandoned: boolean;
}

export interface FocusStats {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  totalFocusMinutes: number;
  currentStreak: number;
  bestStreak: number;
  averageCompletion: number;
  lastSessionDate: string | null;
}

export type Priority = 'High' | 'Normal' | 'Low';

export interface CategoryAccent {
  bar: string;
  badge: string;
  tint: string;
}

export interface Greeting {
  text: string;
  emoji: string;
}
