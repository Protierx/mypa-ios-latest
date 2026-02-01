import { Task, PriorityConfig } from './types';

export const initialTasks: Task[] = [
  { id: '1', title: 'Complete project proposal', description: 'Draft and review Q1 project proposal', priority: 'high', category: 'Work', categoryIcon: 'briefcase', dueDate: 'Today', completed: false },
  { id: '2', title: 'Morning workout', description: '45 min strength training session', priority: 'medium', category: 'Fitness', categoryIcon: 'barbell', dueDate: 'Today', completed: true },
  { id: '3', title: 'Call with Sarah', description: 'Discuss partnership opportunity', priority: 'high', category: 'Work', categoryIcon: 'phone-portrait', dueDate: 'Today', completed: false },
  { id: '4', title: 'Grocery shopping', description: 'Weekly groceries for meal prep', priority: 'low', category: 'Personal', categoryIcon: 'cart', dueDate: 'Today', completed: false },
  { id: '5', title: 'Read book chapter', description: 'Finish chapter 5 of current book', priority: 'low', category: 'Learning', categoryIcon: 'book', dueDate: 'Tomorrow', completed: false },
  { id: '6', title: 'Team meeting prep', description: 'Prepare slides for Monday meeting', priority: 'medium', category: 'Work', categoryIcon: 'people', dueDate: 'Tomorrow', completed: false },
  { id: '7', title: 'Dentist appointment', description: 'Regular checkup at 3 PM', priority: 'medium', category: 'Health', categoryIcon: 'medkit', dueDate: 'Jan 25', completed: false },
  { id: '8', title: 'Pay bills', description: 'Electricity and internet bills', priority: 'high', category: 'Finance', categoryIcon: 'card', dueDate: 'Jan 26', completed: false },
];

export const priorityConfig: Record<'high' | 'medium' | 'low', PriorityConfig> = {
  high: { color: '#F43F5E', bg: '#FEF2F2', icon: 'alert-circle' },
  medium: { color: '#F59E0B', bg: '#FFFBEB', icon: 'time' },
  low: { color: '#10B981', bg: '#ECFDF5', icon: 'leaf' },
};

export const categoryColors: Record<string, string> = {
  Work: '#3B82F6',
  Fitness: '#F43F5E',
  Personal: '#8B5CF6',
  Learning: '#F59E0B',
  Health: '#10B981',
  Finance: '#06B6D4',
};

export const categoryIcons: Record<string, string> = {
  Work: 'briefcase',
  Fitness: 'barbell',
  Personal: 'person',
  Learning: 'book',
  Health: 'medkit',
  Finance: 'card',
};

export const DUE_OPTIONS = ['Today', 'Tomorrow', 'This week'];

export const STORAGE_KEY = 'tasksList';
