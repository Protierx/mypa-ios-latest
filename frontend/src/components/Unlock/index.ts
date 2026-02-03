/**
 * Unlock components index
 */

export { UnlockProgressCard } from './UnlockProgressCard';
export type { UnlockableFeature, UnlockRequirement } from './UnlockProgressCard';

export { UnlockCelebration } from './UnlockCelebration';

export { UnlockTimeline } from './UnlockTimeline';

// Feature unlock definitions based on the app spec
export const APP_FEATURES: UnlockableFeature[] = [
  {
    id: 'circles',
    name: 'Circles',
    description: 'Create and join accountability groups with friends and family.',
    icon: 'people-circle',
    unlocked: false,
    requirements: [
      {
        id: 'circles-time',
        type: 'time',
        description: 'Use app for 3 days',
        current: 0,
        target: 3,
        met: false,
      },
      {
        id: 'circles-tasks',
        type: 'milestone',
        description: 'Complete 5 tasks',
        current: 0,
        target: 5,
        met: false,
      },
    ],
  },
  {
    id: 'challenges',
    name: 'Challenges',
    description: 'Compete in challenges with your circles for rewards and XP.',
    icon: 'trophy',
    unlocked: false,
    requirements: [
      {
        id: 'challenges-circles',
        type: 'milestone',
        description: 'Join or create 1 circle',
        current: 0,
        target: 1,
        met: false,
      },
      {
        id: 'challenges-time',
        type: 'time',
        description: 'Use app for 5 days',
        current: 0,
        target: 5,
        met: false,
      },
    ],
  },
  {
    id: 'focus-modes',
    name: 'Focus Modes',
    description: 'Custom focus modes like Deep Work, Creative, and Study.',
    icon: 'eye',
    unlocked: false,
    requirements: [
      {
        id: 'focus-sessions',
        type: 'milestone',
        description: 'Complete 3 focus sessions',
        current: 0,
        target: 3,
        met: false,
      },
    ],
  },
  {
    id: 'themes',
    name: 'Custom Themes',
    description: 'Personalize your app with custom color themes.',
    icon: 'color-palette',
    unlocked: false,
    requirements: [
      {
        id: 'themes-time',
        type: 'time',
        description: 'Use app for 7 days',
        current: 0,
        target: 7,
        met: false,
      },
      {
        id: 'themes-streak',
        type: 'milestone',
        description: 'Reach a 3-day streak',
        current: 0,
        target: 3,
        met: false,
      },
    ],
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights into your productivity patterns and trends.',
    icon: 'analytics',
    unlocked: false,
    requirements: [
      {
        id: 'analytics-time',
        type: 'time',
        description: 'Use app for 14 days',
        current: 0,
        target: 14,
        met: false,
      },
      {
        id: 'analytics-tasks',
        type: 'milestone',
        description: 'Complete 25 tasks',
        current: 0,
        target: 25,
        met: false,
      },
    ],
  },
  {
    id: 'voice-commands',
    name: 'Voice Commands',
    description: 'Control the app hands-free with Mylo voice commands.',
    icon: 'mic',
    unlocked: false,
    requirements: [
      {
        id: 'voice-time',
        type: 'time',
        description: 'Use app for 5 days',
        current: 0,
        target: 5,
        met: false,
      },
      {
        id: 'voice-ai',
        type: 'milestone',
        description: 'Have 10 AI conversations',
        current: 0,
        target: 10,
        met: false,
      },
    ],
  },
];

import type { UnlockableFeature } from './UnlockProgressCard';
