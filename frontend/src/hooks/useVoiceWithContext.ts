/**
 * Context-Aware Voice Commands Hook
 * 
 * Provides current screen context to voice commands.
 * Different screens enable different voice shortcuts.
 */

import { useCallback, useMemo } from 'react';
import { useVoice } from '../contexts/VoiceContext';

export type ScreenContext = 
  | 'ai_home' 
  | 'tasks' 
  | 'social' 
  | 'profile' 
  | 'focus'
  | 'task_detail'
  | 'circle_detail'
  | 'challenge_detail';

interface ContextHints {
  examples: string[];
  quickActions: string[];
}

const CONTEXT_HINTS: Record<ScreenContext, ContextHints> = {
  ai_home: {
    examples: [
      "What's on my plate today?",
      "Add task buy groceries",
      "Start a focus session",
      "How am I doing?",
    ],
    quickActions: ['add_task', 'query_tasks', 'start_focus', 'status'],
  },
  tasks: {
    examples: [
      "Show tomorrow's tasks",
      "Add new task",
      "Mark first one done",
      "Sort by priority",
    ],
    quickActions: ['filter_tasks', 'add_task', 'complete_task', 'sort_tasks'],
  },
  social: {
    examples: [
      "Open Work circle",
      "Who's active?",
      "Show my challenges",
      "Create a challenge",
    ],
    quickActions: ['open_circle', 'view_challenges', 'create_challenge', 'view_activity'],
  },
  profile: {
    examples: [
      "Show my stats",
      "What's my streak?",
      "Open settings",
      "How much XP do I have?",
    ],
    quickActions: ['view_stats', 'view_streak', 'open_settings'],
  },
  focus: {
    examples: [
      "How much time left?",
      "Add 10 minutes",
      "I'm done",
      "Pause",
    ],
    quickActions: ['time_remaining', 'extend_session', 'end_session', 'pause'],
  },
  task_detail: {
    examples: [
      "Start working on this",
      "Change priority to high",
      "Move to tomorrow",
      "Mark as done",
    ],
    quickActions: ['start_focus', 'change_priority', 'reschedule', 'complete'],
  },
  circle_detail: {
    examples: [
      "Show activity",
      "Who's online?",
      "View tasks",
      "Start a challenge",
    ],
    quickActions: ['view_activity', 'view_members', 'view_tasks', 'start_challenge'],
  },
  challenge_detail: {
    examples: [
      "What's my rank?",
      "Submit my progress",
      "Who's winning?",
      "Leave challenge",
    ],
    quickActions: ['view_rank', 'submit_proof', 'view_leaderboard', 'leave'],
  },
};

interface UseVoiceWithContextReturn {
  // From VoiceContext
  voiceState: ReturnType<typeof useVoice>['voiceState'];
  audioLevel: number;
  transcript: string;
  aiResponse: string;
  error: string | null;
  
  // Context-aware functions
  startListeningWithContext: () => Promise<void>;
  stopListeningWithContext: () => Promise<string>;
  cancelListening: () => void;
  
  // Context info
  contextHints: ContextHints;
  currentContext: ScreenContext;
}

export function useVoiceWithContext(screenContext: ScreenContext): UseVoiceWithContextReturn {
  const voice = useVoice();
  
  const contextHints = useMemo(() => {
    return CONTEXT_HINTS[screenContext] || CONTEXT_HINTS.ai_home;
  }, [screenContext]);

  const startListeningWithContext = useCallback(async () => {
    // Store context for when we process the command
    await voice.startListening();
  }, [voice.startListening]);

  const stopListeningWithContext = useCallback(async () => {
    // The voice command will be processed with context by the Edge Function
    return await voice.stopListening();
  }, [voice.stopListening]);

  return {
    voiceState: voice.voiceState,
    audioLevel: voice.audioLevel,
    transcript: voice.transcript,
    aiResponse: voice.aiResponse,
    error: voice.error,
    startListeningWithContext,
    stopListeningWithContext,
    cancelListening: voice.cancelListening,
    contextHints,
    currentContext: screenContext,
  };
}

export default useVoiceWithContext;
