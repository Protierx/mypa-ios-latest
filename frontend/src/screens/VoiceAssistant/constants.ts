import { VoiceOption } from './types';

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'nova',
    name: 'Nova',
    description: 'Warm & friendly',
  },
  {
    id: 'alloy',
    name: 'Alloy',
    description: 'Neutral & clear',
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'Soft & gentle',
  },
];

export const SCREEN_MAP: Record<string, string> = {
  'Home': 'Home',
  'Hub': 'Home',
  'Plan': 'Plan',
  'Profile': 'Profile',
  'Circles': 'Circles',
  'Tasks': 'Tasks',
  'Challenges': 'Challenges',
  'Settings': 'Settings',
  'Inbox': 'Inbox',
  'Wallet': 'Wallet',
  'Streak': 'Streak',
  'Level': 'Level',
};

export const STATUS_COLORS = {
  listening: '#10B981', // Green
  processing: '#F59E0B', // Orange
  speaking: '#8B5CF6', // Purple
  idle: '#64748B', // Gray
};
