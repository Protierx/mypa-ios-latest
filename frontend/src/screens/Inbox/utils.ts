// Inbox helper utilities
import { Assignment, NotificationItem } from './types';
import {
  AlarmClock,
  Heart,
  Inbox,
  MessageSquare,
  Users,
} from 'lucide-react-native';

// Helper: Format time ago
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

// Helper: Format due date
export const formatDueDate = (dateString: string): string => {
  // Parse the date - handle ISO strings properly
  const date = new Date(dateString);
  
  // Get today and tomorrow in local time (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Compare just the date parts
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) return 'Today';
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Icon mapping for notification types
export const iconFor = (type: NotificationItem['type']) => {
  switch (type) {
    case 'message':
      return { Icon: MessageSquare, color: '#2563EB', bg: '#DBEAFE' };
    case 'reminder':
      return { Icon: AlarmClock, color: '#D97706', bg: '#FEF3C7' };
    case 'invite':
      return { Icon: Users, color: '#7C3AED', bg: '#EDE9FE' };
    case 'social':
      return { Icon: Heart, color: '#DB2777', bg: '#FCE7F3' };
    default:
      return { Icon: Inbox, color: '#64748B', bg: '#E2E8F0' };
  }
};

// Status styling
export const statusTone = (status: Assignment['status']) => {
  switch (status) {
    case 'pending':
      return { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' };
    case 'accepted':
      return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
    case 'completed':
      return { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' };
    case 'declined':
      return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
    default:
      return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
  }
};

// Status label
export const statusLabel = (status: Assignment['status']) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Accepted';
    case 'completed':
      return 'Done';
    case 'declined':
      return 'Declined';
    default:
      return status;
  }
};
