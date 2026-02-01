import { BrainDumpTask, DateOption } from './types';

// Colors
export const Colors = {
  primary: '#7c3aed',
  primaryLight: '#f3e8ff',
  white: '#ffffff',
  background: '#f8fafc',
  surface: '#f1f5f9',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  success: '#10b981',
  successLight: '#d1fae5',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  blue: '#3b82f6',
  blueLight: '#dbeafe',
  rose: '#f43f5e',
  roseLight: '#ffe4e6',
  purple: '#8b5cf6',
  purpleLight: '#ede9fe',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
  emerald: '#10b981',
  emeraldLight: '#d1fae5',
  green: '#22c55e',
  greenLight: '#dcfce7',
  orange: '#f97316',
  orangeLight: '#ffedd5',
  gray: '#6b7280',
  grayLight: '#f3f4f6',
};

// Category config
export const categoryConfig: Record<string, { color: string; lightColor: string; icon: string; label: string }> = {
  work: { color: Colors.blue, lightColor: Colors.blueLight, icon: 'briefcase', label: 'Work' },
  health: { color: Colors.rose, lightColor: Colors.roseLight, icon: 'heart-pulse', label: 'Health' },
  personal: { color: Colors.purple, lightColor: Colors.purpleLight, icon: 'account', label: 'Personal' },
  learning: { color: Colors.amber, lightColor: Colors.amberLight, icon: 'book-open-variant', label: 'Learning' },
  social: { color: Colors.emerald, lightColor: Colors.emeraldLight, icon: 'account-group', label: 'Social' },
  finance: { color: Colors.green, lightColor: Colors.greenLight, icon: 'wallet', label: 'Finance' },
  home: { color: Colors.orange, lightColor: Colors.orangeLight, icon: 'home', label: 'Home' },
};

// Priority config
export const priorityConfig: Record<string, { color: string; textColor: string; label: string }> = {
  urgent: { color: Colors.danger, textColor: Colors.white, label: 'Urgent' },
  important: { color: Colors.warning, textColor: Colors.white, label: 'Important' },
  normal: { color: Colors.grayLight, textColor: Colors.textSecondary, label: '' },
  low: { color: Colors.surface, textColor: Colors.textMuted, label: '' },
};

// Quick templates
export const quickTemplates = [
  { icon: 'phone', label: 'Call', text: 'Call ' },
  { icon: 'email', label: 'Email', text: 'Email ' },
  { icon: 'dumbbell', label: 'Exercise', text: 'Go to gym' },
  { icon: 'cart', label: 'Shopping', text: 'Buy groceries' },
  { icon: 'clipboard-check', label: 'Review', text: 'Review ' },
  { icon: 'handshake', label: 'Meeting', text: 'Meeting with ' },
];
