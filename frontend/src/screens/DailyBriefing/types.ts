export interface BriefingData {
  greeting?: string;
  insights?: string[];
  tip?: string;
  stats?: {
    pending: number;
    completed: number;
    highPriority: number;
    streak: number;
    weeklyCompleted: number;
  };
}

export interface Task {
  id: string;
  title: string;
  priority: string;
  category: string;
  completed: boolean;
  time?: string;
}

export interface Assignment {
  id: string;
  title: string;
  dueDate?: string;
  status: string;
  xpReward?: number;
  assignedByName?: string;
  circleName?: string;
  circleEmoji?: string;
}

export interface Quote {
  text: string;
  author: string;
}

export interface TimeColors {
  gradient: string[];
  accent: string;
  bg: string;
}

export interface WeeklyStats {
  tasksCompleted?: number;
  focusMins?: number;
  xpEarned?: number;
  dailyData?: Array<{ completed: number }>;
}

export interface ScoreInfo {
  color: string;
  label: string;
  emoji: string;
}
