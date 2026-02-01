export interface BrainDumpTask {
  id: string;
  title: string;
  status: 'unsorted' | 'reviewed' | 'planned';
  aiCategory?: 'work' | 'health' | 'personal' | 'learning' | 'social' | 'finance' | 'home';
  aiPriority?: 'urgent' | 'important' | 'normal' | 'low';
  estimatedTime?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  reasoning?: string;
  isNew: boolean;
  createdAt: string;
  source: 'voice' | 'typed' | 'ai-chat';
  isStarred: boolean;
}

export interface TaskSortingScreenProps {
  navigation?: any;
}

export interface AIScheduledTask {
  originalId: string;
  title: string;
  category: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  suggestedDate: string;
  suggestedTime: string;
  durationMinutes: number;
  reasoning: string;
}

export interface DateOption {
  label: string;
  date: string;
  fullDate: string;
  isRecommended: boolean;
}

export interface QuickTemplate {
  icon: string;
  label: string;
  text: string;
}

export type FilterType = 'all' | 'unsorted' | 'reviewed';
