/**
 * Screen Context Service — Dynamic Contextual Awareness
 *
 * Builds screen-specific context strings that are sent to the ElevenLabs
 * agent via `sendContextualUpdate()` whenever the user navigates between
 * screens. This lets the agent give relevant responses without the user
 * having to explain what they're looking at.
 *
 * Reference: ELEVENLABS_VOICE_MIGRATION_PLAN.md — Step 14a
 */

import type { Screen } from '../../navigation-v2/GestureContext';

// ============================================================================
// Screen-specific context builders
// ============================================================================

export interface ScreenContextData {
  // Hub / Home
  tasksTodayCount?: number;
  overdueCount?: number;
  streakDays?: number;

  // Tasks
  taskCategory?: string;
  incompleteCount?: number;
  dueSoonCount?: number;

  // Focus
  focusTaskName?: string;
  focusMinutesRemaining?: number;

  // Circles / Social
  circleName?: string;
  circleMemberCount?: number;
  challengeCount?: number;

  // Brain Dump
  brainDumpItemCount?: number;

  // Settings
  voiceName?: string;
  voiceSpeed?: number;

  // Profile
  userName?: string;
  userLevel?: number;
  userXP?: number;
}

/**
 * Map a Screen identifier to a human-friendly name for the agent.
 */
function screenDisplayName(screen: Screen): string {
  switch (screen) {
    case 'ai_hub':
      return 'AI Hub (Home)';
    case 'tasks':
      return 'Tasks View';
    case 'social':
      return 'Circles & Challenges (Social)';
    case 'profile':
      return 'Profile & Settings';
    case 'focus':
      return 'Focus Timer';
    default:
      return 'Unknown Screen';
  }
}

/**
 * Build a context string for the given screen + available data.
 * This is sent to the ElevenLabs agent so it knows what the user sees.
 */
export function buildScreenContext(
  screen: Screen,
  data: ScreenContextData = {},
): string {
  const base = `User is now viewing their ${screenDisplayName(screen)}.`;

  switch (screen) {
    case 'ai_hub': {
      const parts: string[] = [];
      if (data.tasksTodayCount !== undefined) {
        parts.push(`${data.tasksTodayCount} tasks due today`);
      }
      if (data.overdueCount !== undefined && data.overdueCount > 0) {
        parts.push(`${data.overdueCount} overdue`);
      }
      if (data.streakDays !== undefined && data.streakDays > 0) {
        parts.push(`current streak: ${data.streakDays} days`);
      }
      return parts.length > 0
        ? `${base} ${parts.join(', ')}.`
        : base;
    }

    case 'tasks': {
      const parts: string[] = [];
      if (data.taskCategory) {
        parts.push(`viewing ${data.taskCategory} tasks`);
      }
      if (data.incompleteCount !== undefined) {
        parts.push(`${data.incompleteCount} incomplete`);
      }
      if (data.dueSoonCount !== undefined && data.dueSoonCount > 0) {
        parts.push(`${data.dueSoonCount} due soon`);
      }
      return parts.length > 0
        ? `${base} ${parts.join(', ')}.`
        : base;
    }

    case 'focus': {
      if (data.focusTaskName) {
        const mins = data.focusMinutesRemaining ?? 0;
        return `${base} In a focus session for '${data.focusTaskName}'. ${mins} minutes remaining.`;
      }
      return `${base} Selecting a task for a focus session.`;
    }

    case 'social': {
      const parts: string[] = [];
      if (data.circleName) {
        parts.push(`viewing circle '${data.circleName}'`);
        if (data.circleMemberCount !== undefined) {
          parts.push(`with ${data.circleMemberCount} members`);
        }
      }
      if (data.challengeCount !== undefined && data.challengeCount > 0) {
        parts.push(`${data.challengeCount} active challenges`);
      }
      return parts.length > 0
        ? `${base} ${parts.join(', ')}.`
        : base;
    }

    case 'profile': {
      const parts: string[] = [];
      if (data.userName) parts.push(`name: ${data.userName}`);
      if (data.userLevel !== undefined) parts.push(`level ${data.userLevel}`);
      if (data.userXP !== undefined) parts.push(`${data.userXP} XP`);
      return parts.length > 0
        ? `${base} ${parts.join(', ')}.`
        : base;
    }

    default:
      return base;
  }
}

// ============================================================================
// Task context for session start (14b)
// ============================================================================

export interface TaskSummaryData {
  recentTaskTitles: string[];
  overdueCount: number;
  todayCount: number;
  topCategory: string;
  peakHours: string[];
}

/**
 * Build a task context string injected at the start of an ElevenLabs session.
 */
export function buildTaskContext(data: TaskSummaryData): string {
  const parts: string[] = [];

  if (data.recentTaskTitles.length > 0) {
    parts.push(`Recent tasks: ${data.recentTaskTitles.slice(0, 8).join(', ')}`);
  }
  if (data.overdueCount > 0) {
    parts.push(`Overdue: ${data.overdueCount}`);
  }
  if (data.todayCount > 0) {
    parts.push(`Due today: ${data.todayCount}`);
  }
  if (data.topCategory) {
    parts.push(`Most common category: ${data.topCategory}`);
  }
  if (data.peakHours.length > 0) {
    parts.push(`User's peak productivity hours: ${data.peakHours.join(', ')}`);
  }

  return parts.length > 0
    ? `TASK SUMMARY: ${parts.join('. ')}.`
    : 'No recent task data available.';
}

// ============================================================================
// Emotional / energy awareness (14c)
// ============================================================================

export interface UserStateData {
  overwhelmScore: number;
  completionRate7d: number;
  streakDays: number;
  tonePreference: string;
}

/**
 * Build a user-state context string so the agent adapts its tone.
 */
export function buildUserStateContext(data: UserStateData): string {
  if (data.overwhelmScore > 0.7) {
    return 'USER STATE: User appears overwhelmed. Be extra gentle, suggest breaks, and avoid adding pressure. Keep responses short and calming.';
  }
  if (data.completionRate7d > 0.8) {
    const streakNote = data.streakDays > 3
      ? ` They're on a ${data.streakDays}-day streak!`
      : '';
    return `USER STATE: User is in a great flow.${streakNote} Encourage momentum and celebrate wins. Be enthusiastic.`;
  }
  if (data.completionRate7d < 0.3) {
    return 'USER STATE: User has been completing few tasks recently. Be encouraging without pressure. Gently suggest small wins.';
  }
  return `USER STATE: Normal state. Be warm and supportive. User prefers a ${data.tonePreference} tone.`;
}
