import type { ComponentType } from 'react';

export interface WalletScreenProps {
  navigation?: any;
}

export type Period = 'today' | 'week' | 'month';

export interface PeriodStats {
  saved: string;
  tasks: number;
  efficiency: number;
}

export interface WalletData {
  totalTimeSaved: string;
  streak: number;
  bestStreak: number;
  tasksCompleted: number;
  avgDaily: string;
  xp: number;
  level: number;
  xpToNextLevel: number;
  challengesWon: number;
}

export interface Milestone {
  id: number;
  title: string;
  reached: boolean;
  reward: string;
  progress: number;
}

export interface WeekDay {
  day: string;
  time: number;
  label: string;
}

export interface RecentSaving {
  id: number;
  action: string;
  time: string;
  when: string;
  icon: string;
}

export interface HowItWorksItem {
  icon: string;
  action: string;
  example: string;
}

export interface ShareOption {
  id: string;
  icon: ComponentType<{ color: string; size: number }>;
  label: string;
  color: string;
}

export interface InfoModalData {
  title: string;
  description: string;
  details?: string[];
  tips?: string[];
}
