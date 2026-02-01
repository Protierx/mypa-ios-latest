export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  categoryIcon: string;
  dueDate: string;
  completed: boolean;
}

export type FilterType = 'all' | 'pending' | 'completed';
export type PriorityType = 'high' | 'medium' | 'low';

export interface PriorityConfig {
  color: string;
  bg: string;
  icon: string;
}
