import { AssistantState } from './types';
import { STATUS_COLORS } from './constants';

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning! I'm listening. How can I help you?";
  if (hour < 17) return "Good afternoon! What would you like me to do?";
  return "Good evening! I'm here to help.";
};

export const getStatusText = (state: AssistantState): string => {
  switch (state) {
    case 'listening':
      return 'Listening...';
    case 'processing':
      return 'Thinking...';
    case 'speaking':
      return 'Speaking...';
    default:
      return 'Tap to talk';
  }
};

export const getStatusColor = (state: AssistantState): string => {
  return STATUS_COLORS[state] || STATUS_COLORS.idle;
};

export const getOrbHint = (state: AssistantState): string => {
  switch (state) {
    case 'listening':
      return 'Speak now...';
    case 'idle':
      return 'Tap to start talking';
    default:
      return '';
  }
};
