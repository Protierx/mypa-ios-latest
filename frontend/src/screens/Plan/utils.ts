import { Task, CategoryAccent, Greeting } from './types';

export const getTodayStr = (): string => new Date().toISOString().split('T')[0];

export const getYesterdayStr = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

export const formatDuration = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m === 0) return `${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const parseDuration = (dur: string): number => {
  if (dur.includes('h')) {
    const parts = dur.split('h');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }
  return parseInt(dur, 10) || 30;
};

export const formatTimer = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const isQuickTask = (task: Task): boolean => {
  const quickCategories = ['Finance', 'Social'];
  const quickKeywords = [
    'pay', 'reply', 'email', 'call', 'text', 'message', 'order',
    'book', 'schedule', 'confirm', 'cancel', 'check', 'send'
  ];
  const titleLower = task.title.toLowerCase();
  
  if (task.durationMin <= 10) return true;
  if (quickCategories.includes(task.category)) return true;
  if (quickKeywords.some(kw => titleLower.includes(kw))) return true;
  
  return false;
};

export const getGreeting = (): Greeting => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '⛅' };
  if (hour < 21) return { text: 'Good Evening', emoji: '🌅' };
  return { text: 'Good Night', emoji: '🌙' };
};

export const getCategoryAccent = (category: string): CategoryAccent => {
  const categoryAccents: Record<string, CategoryAccent> = {
    Work: { bar: '#3B82F6', badge: '#2563EB', tint: '#EFF6FF' },
    Health: { bar: '#10B981', badge: '#059669', tint: '#ECFDF5' },
    Learning: { bar: '#F59E0B', badge: '#D97706', tint: '#FFFBEB' },
    Finance: { bar: '#06B6D4', badge: '#0891B2', tint: '#ECFEFF' },
    Social: { bar: '#EC4899', badge: '#DB2777', tint: '#FDF2F8' },
    Personal: { bar: '#8B5CF6', badge: '#7C3AED', tint: '#F5F3FF' },
  };
  return categoryAccents[category] || categoryAccents.Personal;
};

export const calculateProgressStats = (tasks: Task[]) => {
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalMinutes = tasks.reduce((sum, t) => sum + t.durationMin, 0);
  const completedMinutes = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.durationMin, 0);
  const nextTask = tasks.find(t => !t.completed);
  
  return {
    completedCount,
    totalCount,
    progressPercent,
    totalMinutes,
    completedMinutes,
    nextTask,
  };
};

export const mapAIPriority = (priority: string): 'High' | 'Normal' | 'Low' => {
  const priorityLower = (priority || '').toLowerCase();
  if (priorityLower === 'high') return 'High';
  if (priorityLower === 'low') return 'Low';
  return 'Normal';
};

export const mapAICategory = (category: string): string => {
  const validCategories = ['Personal', 'Work', 'Health', 'Learning', 'Errands'];
  if (validCategories.includes(category)) return category;
  if (category === 'Finance') return 'Errands';
  if (category === 'Social') return 'Personal';
  return 'Personal';
};

export const mapAIDuration = (duration: string): string => {
  const min = parseInt(duration, 10);
  if (min <= 15) return '15m';
  if (min <= 30) return '30m';
  if (min <= 60) return '1h';
  return '2h';
};
