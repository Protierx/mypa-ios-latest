import { FAQ, QuickLink, ContactTypeOption } from './types';

export const FAQS: FAQ[] = [
  {
    id: 1,
    question: 'How do I connect my calendar?',
    answer:
      'Go to Settings > App Settings > Connected Services. You can connect Google Calendar, Apple Calendar, or Outlook.',
  },
  {
    id: 2,
    question: 'What is a Circle?',
    answer:
      'Circles are accountability groups where you can share your daily progress with friends, family, or colleagues.',
  },
  {
    id: 3,
    question: 'How does the Time Wallet work?',
    answer:
      'The Time Wallet tracks time you save by completing tasks efficiently. When you finish a task early, MYPA calculates the time saved.',
  },
  {
    id: 4,
    question: 'How do I change my notification settings?',
    answer:
      'Go to Profile > App Settings > Permissions. You can customize what types of notifications you receive.',
  },
  {
    id: 5,
    question: 'Can I export my data?',
    answer:
      'Yes! Go to Settings > App Settings > Data & Storage > Export My Data.',
  },
  {
    id: 6,
    question: 'What are XP and Levels?',
    answer:
      'XP (Experience Points) are earned by completing tasks, maintaining streaks, and participating in circles. Higher levels unlock new features.',
  },
];

export const QUICK_LINKS: QuickLink[] = [
  { id: 'guide', label: 'Getting Started Guide', icon: 'book', color: '#3B82F6' },
  { id: 'video', label: 'Video Tutorials', icon: 'play-circle', color: '#EF4444' },
  { id: 'privacy', label: 'Privacy Policy', icon: 'shield-checkmark', color: '#10B981' },
  { id: 'terms', label: 'Terms of Service', icon: 'document-text', color: '#64748B' },
];

export const CONTACT_TYPES: ContactTypeOption[] = [
  { id: 'general', label: 'General', icon: 'chatbubble' },
  { id: 'bug', label: 'Bug', icon: 'bug' },
  { id: 'feature', label: 'Feature', icon: 'bulb' },
];

export const SUPPORT_EMAIL = 'support@mypa.app';
export const SUCCESS_TOAST_DURATION = 2000;
