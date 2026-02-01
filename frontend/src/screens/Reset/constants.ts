import { Message } from './types';

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    type: 'ai',
    text: "Hey. I noticed you came here. That's okay — everyone needs a moment sometimes.",
  },
];

export const QUICK_PROMPTS = [
  "I'm overwhelmed",
  'Just need to vent',
  'Help me think',
];

export const BREATHE_PHASES: Array<'in' | 'hold' | 'out'> = ['in', 'hold', 'out'];
export const BREATHE_PHASE_DURATION = 4000;
export const AI_RESPONSE_DELAY = 1200;
export const VOICE_RESPONSE_DELAY = 1000;
