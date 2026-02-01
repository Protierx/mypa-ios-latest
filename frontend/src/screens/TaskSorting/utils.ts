import { BrainDumpTask, DateOption } from './types';

// Helper to map priority from API format
export const mapPriority = (priority?: string): BrainDumpTask['aiPriority'] => {
  if (!priority) return undefined;
  const map: Record<string, BrainDumpTask['aiPriority']> = {
    'HIGH': 'urgent',
    'NORMAL': 'normal',
    'LOW': 'low',
  };
  return map[priority] || 'normal';
};

// Helper to map AI priority format
export const mapPriorityFromAI = (priority: string): BrainDumpTask['aiPriority'] => {
  const map: Record<string, BrainDumpTask['aiPriority']> = {
    'HIGH': 'urgent',
    'NORMAL': 'normal',
    'LOW': 'low',
  };
  return map[priority] || 'normal';
};

// Helper to check if date is within hours
export const isWithinHours = (dateStr: string, hours: number): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  return (now.getTime() - date.getTime()) < hours * 60 * 60 * 1000;
};

// Helper to format time ago
export const formatTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Helper to format duration
export const formatDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

// Helper to format 24h time to 12h
export const formatTime12h = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Generate date options
export const getDateOptions = (): DateOption[] => {
  const options: DateOption[] = [];
  const today = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    options.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[date.getDay()],
      date: `${months[date.getMonth()]} ${date.getDate()}`,
      fullDate: date.toISOString().split('T')[0],
      isRecommended: i === 0,
    });
  }
  return options;
};

// AI Categorization Logic (fallback for local processing)
export const categorizeTask = (title: string): { category: BrainDumpTask['aiCategory']; priority: BrainDumpTask['aiPriority']; time: string } => {
  const lowerTitle = title.toLowerCase();
  
  if (/doctor|dentist|gym|workout|medicine|appointment|health|exercise|run|jog|yoga|fitness/.test(lowerTitle)) {
    return { category: 'health', priority: 'important', time: /gym|workout|exercise|run|jog|yoga/.test(lowerTitle) ? '45m' : '20m' };
  }
  if (/meeting|report|email|project|deadline|client|work|presentation|review|slack|teams/.test(lowerTitle)) {
    return { category: 'work', priority: 'important', time: /meeting|presentation/.test(lowerTitle) ? '45m' : '20m' };
  }
  if (/bill|pay|bank|tax|invoice|budget|money|finance|payment/.test(lowerTitle)) {
    return { category: 'finance', priority: 'important', time: '20m' };
  }
  if (/learn|study|course|read|tutorial|practice|book|lesson/.test(lowerTitle)) {
    return { category: 'learning', priority: 'normal', time: '1h 30m' };
  }
  if (/call|meet|friend|family|dinner|lunch|party|birthday|visit/.test(lowerTitle)) {
    return { category: 'social', priority: 'normal', time: /dinner|lunch|party/.test(lowerTitle) ? '45m' : '10m' };
  }
  if (/clean|organize|laundry|grocery|cook|home|house|dishes|vacuum|trash/.test(lowerTitle)) {
    return { category: 'home', priority: 'normal', time: /cook|clean|organize/.test(lowerTitle) ? '45m' : '20m' };
  }
  
  let time = '30m';
  if (/call|email|message|respond|schedule|book|order/.test(lowerTitle)) time = '10m';
  else if (/pay|bill|review|check|organize|clean/.test(lowerTitle)) time = '20m';
  else if (/meeting|gym|appointment|lunch|dinner|report/.test(lowerTitle)) time = '45m';
  else if (/learn|study|project|design|write|create/.test(lowerTitle)) time = '1h 30m';
  
  return { category: 'personal', priority: 'normal', time };
};

// Get smart time slot
export const getSmartTimeSlot = (task: BrainDumpTask, index: number): string => {
  const urgentSlots = ['9:00 AM', '9:30 AM', '10:00 AM'];
  const workSlots = ['10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'];
  const healthSlots = ['7:00 AM', '6:00 PM', '7:00 PM'];
  const socialSlots = ['12:00 PM', '1:00 PM', '6:00 PM', '7:00 PM'];
  const learningSlots = ['8:00 AM', '4:00 PM', '8:00 PM'];
  const defaultSlots = ['10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

  if (task.aiPriority === 'urgent') return urgentSlots[index % urgentSlots.length];
  switch (task.aiCategory) {
    case 'work': return workSlots[index % workSlots.length];
    case 'health': return healthSlots[index % healthSlots.length];
    case 'social': return socialSlots[index % socialSlots.length];
    case 'learning': return learningSlots[index % learningSlots.length];
    default: return defaultSlots[index % defaultSlots.length];
  }
};

// Format category properly (capitalize first letter)
export const formatCategory = (cat?: string): string => {
  if (!cat) return 'Personal';
  return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
};

// Get total time from sorted tasks
export const getTotalTime = (sortedTasks: { estimatedTime?: string }[]): string => {
  let totalMinutes = 0;
  sortedTasks.forEach(task => {
    const time = task.estimatedTime || '30m';
    if (time.includes('h')) {
      const [hours, mins] = time.split('h');
      totalMinutes += parseInt(hours) * 60;
      if (mins) totalMinutes += parseInt(mins.replace('m', '').trim()) || 0;
    } else {
      totalMinutes += parseInt(time.replace('m', ''));
    }
  });
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${totalMinutes}m`;
};

// Get priority count
export const getPriorityCount = (sortedTasks: { aiPriority?: string }[]): number => {
  return sortedTasks.filter(t => t.aiPriority === 'urgent' || t.aiPriority === 'important').length;
};
