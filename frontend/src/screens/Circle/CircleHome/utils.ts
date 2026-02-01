/**
 * CircleHome Utility Functions
 * Helper functions for formatting and data transformation
 */

/**
 * Format a date string to a relative time (e.g., "2h ago", "just now")
 */
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

/**
 * Format a due date to a human-readable string
 */
export const formatDueTime = (dateString: string): string => {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${timeStr}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${timeStr}`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
  }
};

/**
 * Format a Date object to time string (e.g., "9:30 AM")
 */
export const formatTime = (date: Date): string => {
  const h = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Format a Date object to a short date string (e.g., "Jan 15")
 */
export const formatDate = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

/**
 * Get a due summary text for assignments
 */
export const getDueSummary = (
  dueDay: 'today' | 'tomorrow' | 'custom',
  customDueDate: Date,
  dueTime: Date
): string => {
  const dayLabel = dueDay === 'today' 
    ? 'Today' 
    : dueDay === 'tomorrow' 
      ? 'Tomorrow' 
      : formatDate(customDueDate);
  return `Due: ${dayLabel} at ${formatTime(dueTime)}`;
};

/**
 * Get a due summary text for edit mode
 */
export const getEditDueSummary = (
  editDueDay: 'today' | 'tomorrow' | 'custom',
  editCustomDueDate: Date,
  editDueTime: Date | null
): string => {
  const dayLabel = editDueDay === 'today' 
    ? 'Today' 
    : editDueDay === 'tomorrow' 
      ? 'Tomorrow' 
      : formatDate(editCustomDueDate);
  const timeStr = editDueTime ? formatTime(editDueTime) : '9:00 AM';
  return `Due: ${dayLabel} at ${timeStr}`;
};

/**
 * Extract challenge category from description string
 */
export const extractChallengeCategory = (description?: string): string | null => {
  if (!description) return null;
  const match = description.match(/Category:\s*([^|\n]+)/i);
  return match?.[1]?.trim() || null;
};

/**
 * Get avatar colors based on user name/id
 */
export const getAvatarColors = (name: string): [string, string] => {
  const colorPairs: [string, string][] = [
    ['#8B5CF6', '#A78BFA'], // Purple
    ['#EC4899', '#F472B6'], // Pink
    ['#3B82F6', '#60A5FA'], // Blue
    ['#10B981', '#34D399'], // Green
    ['#F59E0B', '#FBBF24'], // Amber
    ['#EF4444', '#F87171'], // Red
    ['#6366F1', '#818CF8'], // Indigo
  ];
  
  // Simple hash based on first character
  const index = name.charCodeAt(0) % colorPairs.length;
  return colorPairs[index];
};

/**
 * Calculate days remaining until a date
 */
export const getDaysRemaining = (endDate: string | Date): number => {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

/**
 * Calculate total days between two dates
 */
export const getTotalDays = (startDate: string | Date, endDate: string | Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date | string): boolean => {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

/**
 * Check if a date is tomorrow
 */
export const isTomorrow = (date: Date | string): boolean => {
  const d = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.toDateString() === tomorrow.toDateString();
};

/**
 * Get challenge type display text
 */
export const getChallengeTypeText = (type: string, targetValue: number): string => {
  switch (type) {
    case 'FOCUS_MINUTES':
      return `${targetValue} minutes`;
    case 'TASKS_COMPLETED':
      return `${targetValue} tasks`;
    case 'STREAK_DAYS':
      return `${targetValue} days`;
    default:
      return `${targetValue}`;
  }
};

/**
 * Get challenge emoji based on type
 */
export const getChallengeEmoji = (type: string): string => {
  switch (type) {
    case 'FOCUS_MINUTES':
      return '🧠';
    case 'TASKS_COMPLETED':
      return '✅';
    case 'STREAK_DAYS':
      return '🔥';
    default:
      return '🎯';
  }
};
