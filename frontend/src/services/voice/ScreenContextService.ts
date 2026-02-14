/**
 * Screen Context Service — Dynamic Contextual Awareness
 *
 * Builds screen-specific context strings that are sent to the ElevenLabs
 * agent via `sendContextualUpdate()` whenever the user navigates between
 * screens. This lets the agent give relevant responses without the user
 * having to explain what they're looking at.
 *
 * Also provides per-session knowledge injection (Step 15b) that grounds
 * the agent in the user's actual data — tasks, focus history, preferences.
 *
 * Reference: ELEVENLABS_VOICE_MIGRATION_PLAN.md — Steps 14a, 15b
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

// ============================================================================
// Per-session knowledge injection (Step 15b)
// ============================================================================

export interface FocusSessionSummary {
  taskTitle?: string;
  durationPlanned: number;   // minutes
  durationActual?: number;   // minutes
  startedAt: string;         // ISO date string
}

export interface KnowledgeContextData {
  /** Task titles with status + due date (pre-fetched in VoiceContext) */
  tasks: Array<{
    title: string;
    status: string;
    due_date: string | null;
    priority: string | null;
    category: string | null;
  }>;
  /** Recent focus sessions */
  focusSessions: FocusSessionSummary[];
  /** User preferences from user_model + profile */
  preferences: {
    tonePreference: string;
    peakHours: number[];
    overwhelmScore: number;
    preferredFocusDuration: number;
  };
  /** Previous conversation summaries (Step 15c — optional) */
  conversationHistory?: Array<{
    summary: string;
    mood?: string;
    created_at: string;
  }>;
}

/**
 * Build a rich knowledge context string injected once at the start of each
 * ElevenLabs session. This grounds the agent in the user's actual data so
 * responses are personalized and relevant.
 */
export function buildKnowledgeContext(data: KnowledgeContextData): string {
  const sections: string[] = [];

  // --- Tasks ----------------------------------------------------------------
  if (data.tasks.length > 0) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const pending = data.tasks.filter(t => t.status !== 'completed');
    const overdue = pending.filter(t => t.due_date && t.due_date < todayStr);
    const today = pending.filter(t => t.due_date?.startsWith(todayStr));
    const upcoming = pending.filter(t => t.due_date && t.due_date > todayStr).slice(0, 5);

    const taskLines: string[] = [];
    if (today.length > 0) {
      taskLines.push(`Due today (${today.length}): ${today.map(t => t.title).join(', ')}`);
    }
    if (overdue.length > 0) {
      taskLines.push(`Overdue (${overdue.length}): ${overdue.map(t => t.title).join(', ')}`);
    }
    if (upcoming.length > 0) {
      taskLines.push(`Upcoming: ${upcoming.map(t => `${t.title} (${t.due_date})`).join(', ')}`);
    }
    // Category breakdown
    const cats: Record<string, number> = {};
    pending.forEach(t => { if (t.category) cats[t.category] = (cats[t.category] || 0) + 1; });
    const topCats = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topCats.length > 0) {
      taskLines.push(`Categories: ${topCats.map(([c, n]) => `${c} (${n})`).join(', ')}`);
    }

    sections.push(`TASKS:\n${taskLines.join('\n')}`);
  }

  // --- Focus sessions -------------------------------------------------------
  if (data.focusSessions.length > 0) {
    const totalMinutes = data.focusSessions.reduce((sum, s) => sum + (s.durationActual ?? s.durationPlanned), 0);
    const avgMinutes = Math.round(totalMinutes / data.focusSessions.length);
    const recent = data.focusSessions.slice(0, 3);
    const focusLines = [
      `Recent sessions: ${recent.map(s => `${s.taskTitle || 'untitled'} (${s.durationActual ?? s.durationPlanned}min)`).join(', ')}`,
      `Average duration: ${avgMinutes}min across last ${data.focusSessions.length} sessions`,
      `Total focus time: ${totalMinutes}min`,
    ];
    sections.push(`FOCUS HISTORY:\n${focusLines.join('\n')}`);
  }

  // --- Preferences ----------------------------------------------------------
  const prefs = data.preferences;
  const prefLines: string[] = [];
  if (prefs.peakHours.length > 0) {
    prefLines.push(`Peak productivity hours: ${prefs.peakHours.map(h => `${h}:00`).join(', ')}`);
  }
  prefLines.push(`Preferred focus duration: ${prefs.preferredFocusDuration}min`);
  prefLines.push(`Tone: ${prefs.tonePreference}`);
  sections.push(`PREFERENCES:\n${prefLines.join('\n')}`);

  // --- Conversation history (15c — injected when available) ------------------
  if (data.conversationHistory && data.conversationHistory.length > 0) {
    const histLines = data.conversationHistory.map((h, i) => {
      const date = new Date(h.created_at);
      const dayLabel = formatRelativeDay(date);
      const mood = h.mood ? ` (mood: ${h.mood})` : '';
      return `${i + 1}. ${dayLabel}${mood}: ${h.summary}`;
    });
    sections.push(`PREVIOUS CONVERSATIONS:\n${histLines.join('\n')}`);
  }

  return sections.join('\n\n');
}

/** Format a date as a friendly relative day label */
function formatRelativeDay(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
