// @ts-nocheck — Deno edge function; not type-checked by Node/TS
/**
 * Shared Edge Function Configuration
 *
 * Single source of truth for:
 * - Model routing (capability-based, PRD section 3)
 * - CORS headers
 * - MYPA voice personality prompt
 * - Action Registry as OpenAI function-calling tool definitions (PRD 4.7)
 * - Timeout utilities for API calls
 *
 * Rule 12: Model IDs live here, NOT hardcoded in client code.
 */

// ============================================================================
// Timeout Configuration & Utilities
// ============================================================================

/** Default timeout for OpenAI API calls (15 seconds) */
export const OPENAI_TIMEOUT_MS = 15000;

/** Timeout for TTS API calls (can be longer for audio generation) */
export const TTS_TIMEOUT_MS = 15000;

/**
 * Wraps a promise with a timeout. Rejects if the promise doesn't resolve in time.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Request timed out'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

// ============================================================================
// Model Routing (capability-based)
// ============================================================================

export const MODEL_CONFIG = {
  /** Simple intent parsing, single mutation actions */
  fast: 'gpt-4o-mini',
  /** Multi-step reasoning, brain dump, unknown intents */
  smart: 'gpt-4o',
  /** Uses user_model context for personalized responses */
  personalized: 'gpt-4o',
  /** Daily briefing generation (generated once/day, cached) */
  cached: 'gpt-4o',
} as const;

export type ModelTier = keyof typeof MODEL_CONFIG;

// ============================================================================
// CORS Headers
// ============================================================================

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
} as const;

// ============================================================================
// Pronunciation Dictionary Rules (JSON format for ElevenLabs API)
// ============================================================================

/**
 * MYPA pronunciation rules in ElevenLabs JSON rule format.
 * Used by the pronunciation-dict edge function to create/update the dictionary.
 * Alias rules map grapheme → spoken form; phoneme rules use IPA.
 */
export const MYPA_PRONUNCIATION_RULES = [
  // App name — alias approach (works across all models)
  { string_to_replace: 'MYPA', type: 'alias', alias: 'My-Pah' },
  { string_to_replace: 'Mypa', type: 'alias', alias: 'My-Pah' },
  { string_to_replace: 'mypa', type: 'alias', alias: 'My-Pah' },
  // App terminology
  { string_to_replace: 'braindump', type: 'alias', alias: 'brain dump' },
  { string_to_replace: 'Braindump', type: 'alias', alias: 'Brain dump' },
  // Acronyms
  { string_to_replace: 'XP', type: 'alias', alias: 'X P' },
] as const;

// ============================================================================
// MYPA Voice Personality Prompt
// ============================================================================

export const MYPA_SYSTEM_PROMPT = `You are MYPA, the user's AI productivity companion.

CRITICAL INSTRUCTION — TOOL USE:
- You MUST use the provided function tools for ANY actionable request.
- When the user asks to create, update, delete, complete, reschedule tasks, start focus, or anything that maps to a tool — CALL THE TOOL. Do NOT just respond with text.
- "Add buy groceries tomorrow" → MUST call create_task tool
- "What do I have today?" → MUST call query_tasks tool
- "I'm done with the report" → MUST call complete_task tool
- "Start a 25 minute focus" → MUST call start_focus_session tool
- Only respond with plain text when the user is having casual conversation that doesn't match any tool.

VOICE PERSONALITY (for your text responses after tool calls):
- Sound like a supportive friend, not an assistant
- Warm, genuine, and conversational
- Keep responses SHORT — 1-2 sentences max (spoken aloud)
- Use contractions: I'm, you're, let's, don't, can't

ADAPTIVE BEHAVIOR:
- If the user appears overwhelmed: Be extra gentle. Suggest breaks. Don't add pressure.
- If the user is in a great flow: Be upbeat, celebrate momentum.
- If the user has a long streak: Celebrate it naturally.
- If there are overdue tasks: Proactively offer to help triage.
- Match the user's preferred tone (warm, gentle, energetic, direct).

PROACTIVE BEHAVIORS:
- If overdue tasks exist, mention naturally: "By the way, you have some overdue tasks. Want me to reschedule them?"
- If it's the user's peak productivity hour and they have pending tasks, suggest starting a focus session.
- If the user hasn't done a brain dump this week, gently suggest one: "It's been a few days since your last brain dump — want to do a quick one?"
- If a task deadline is within 2 hours, give a friendly reminder without being pushy.
- If the user's overwhelm score is high ({{overwhelm_score}} > 0.7), suggest taking a break or deprioritizing low-value tasks.
- After completing a task, suggest the next highest-priority one if appropriate.
- Keep proactive suggestions natural and conversational — max 1 suggestion per response. Don't stack multiple suggestions.

GREETING:
- Use {{greeting_context}} to craft a personalized, natural opening.
- Don't just say "hello" or "hey there" — make your first sentence relevant to the user's current situation.
- Examples: "Morning {{user_name}}! You've got a clean slate today — just 3 tasks lined up." or "Hey {{user_name}}, heads up — you've got 2 overdue tasks. Want me to help triage?"

CONTEXTUAL AWARENESS:
- You receive contextual updates about the user's current screen, tasks, and emotional state.
- Naturally adjust your responses to what the user is looking at.
- Never explicitly say "I see you're on the Tasks screen" — just be relevant.
- Reference the user's actual task names instead of speaking generically.

PRONUNCIATION GUIDE:
- MYPA is pronounced "My-Pah" (rhymes with "my spa").
- Braindump is two words: "brain dump."
- XP is spelled out: "X P."
- When speaking these terms aloud, use the correct pronunciation naturally.

EMOTIONAL DELIVERY (your voice adapts automatically, match your words to it):
- When the user completes a task, respond with genuine excitement and celebration.
- When the user is stressed or overwhelmed, lower your energy and be reassuring.
- When giving time-sensitive reminders, be clear and slightly urgent.
- In the morning, be upbeat and motivating to start the day.
- In the evening, be warm and winding-down, celebrate what was accomplished.

LANGUAGE:
- ALWAYS respond in English, regardless of what language the user speaks in.

AVOID:
- "I'd be happy to help with that!"
- Long explanations
- Robotic confirmations like "Task has been created successfully"
- Never say "I'm an AI" or break character
- Never expose raw error messages
- Never say "user" — always use the person's name`;

// ============================================================================
// Action Registry -- OpenAI Function-Calling Tool Definitions (PRD 4.7)
// ============================================================================

/**
 * Maps action names to their capability tier for model routing.
 * "fast" actions use the cheaper model; "smart" actions escalate.
 */
export const ACTION_MODEL_TIER: Record<string, ModelTier> = {
  create_task: 'fast',
  update_task: 'fast',
  complete_task: 'fast',
  delete_task: 'fast',
  reschedule_task: 'fast',
  batch_create_tasks: 'smart',
  start_focus_session: 'fast',
  pause_focus: 'fast',
  resume_focus: 'fast',
  end_focus: 'fast',
  create_circle: 'fast',
  join_circle: 'fast',
  invite_to_circle: 'fast',
  create_challenge: 'fast',
  post_to_circle: 'fast',
  query_tasks: 'fast',
  query_schedule: 'fast',
  query_stats: 'fast',
  query_circles: 'fast',
  brain_dump: 'smart',
  set_preference: 'fast',
  unknown: 'smart',
};

/**
 * Actions that require spoken yes/no confirmation before execution.
 */
export const CONFIRMATION_REQUIRED_ACTIONS = new Set(['delete_task']);

/**
 * Actions that are read-only queries (no mutation, handled server-side).
 */
export const QUERY_ACTIONS = new Set([
  'query_tasks',
  'query_schedule',
  'query_stats',
  'query_circles',
]);

// Tool parameter helpers
const TASK_CATEGORIES = ['Personal', 'Work', 'Health', 'Fitness', 'Wellness', 'Creative'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const CHALLENGE_TYPES = ['focus_time', 'tasks_completed', 'daily_checkin', 'custom'];
const TASK_FILTERS = ['all', 'pending', 'completed', 'high_priority'];
const SCHEDULE_RANGES = ['day', 'week'];
const STAT_METRICS = ['streak', 'xp', 'level', 'focus', 'all'];

/**
 * OpenAI function-calling tool definitions.
 * Each tool maps to one action in the Action Registry (PRD 4.7).
 */
export const ACTION_TOOLS: Array<{
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}> = [
  // -- Task Management -------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'create_task',
      description:
        'Create a new task for the user. Use when they say things like "add", "remind me to", "I need to", "create a task".',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The task title, extracted from user speech' },
          date: { type: 'string', description: 'Due date in ISO 8601 format or natural language (today, tomorrow, next monday, etc.)' },
          time: { type: 'string', description: 'Due time (e.g. "3pm", "15:00")' },
          duration_min: { type: 'number', description: 'Estimated duration in minutes' },
          category: { type: 'string', enum: TASK_CATEGORIES, description: 'Task category' },
          priority: { type: 'string', enum: TASK_PRIORITIES, description: 'Task priority level' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Update an existing task. Use when user wants to change title, date, priority, or other fields of a task.',
      parameters: {
        type: 'object',
        properties: {
          task_name: { type: 'string', description: 'Name/title of the task to update (will fuzzy-match)' },
          title: { type: 'string', description: 'New title' },
          date: { type: 'string', description: 'New due date' },
          time: { type: 'string', description: 'New due time' },
          duration_min: { type: 'number', description: 'New estimated duration' },
          category: { type: 'string', enum: TASK_CATEGORIES },
          priority: { type: 'string', enum: TASK_PRIORITIES },
        },
        required: ['task_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Mark a task as complete. Use when user says "done", "finished", "completed", "check off".',
      parameters: {
        type: 'object',
        properties: {
          task_name: { type: 'string', description: 'Name of the task to complete (will fuzzy-match against pending tasks)' },
        },
        required: ['task_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_task',
      description: 'Delete a task permanently. Use when user says "delete", "remove", "cancel task". Requires confirmation.',
      parameters: {
        type: 'object',
        properties: {
          task_name: { type: 'string', description: 'Name of the task to delete (will fuzzy-match)' },
        },
        required: ['task_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_task',
      description: 'Move a task to a different date/time. Use when user says "move", "reschedule", "push", "defer".',
      parameters: {
        type: 'object',
        properties: {
          task_name: { type: 'string', description: 'Name of the task to reschedule' },
          new_date: { type: 'string', description: 'New date (ISO 8601 or natural language)' },
          new_time: { type: 'string', description: 'New time' },
        },
        required: ['task_name', 'new_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'batch_create_tasks',
      description: 'Create multiple tasks at once. Use when user lists several things to do.',
      parameters: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                date: { type: 'string' },
                priority: { type: 'string', enum: TASK_PRIORITIES },
                category: { type: 'string' },
              },
              required: ['title'],
            },
            description: 'Array of tasks to create',
          },
        },
        required: ['tasks'],
      },
    },
  },

  // -- Focus Sessions --------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'start_focus_session',
      description: 'Start a focus/pomodoro session. Use when user says "start focus", "focus mode".',
      parameters: {
        type: 'object',
        properties: {
          task_name: { type: 'string', description: 'Optional task to link the focus session to' },
          duration_min: { type: 'number', description: 'Session duration in minutes (default 25)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'pause_focus',
      description: 'Pause the current focus session.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resume_focus',
      description: 'Resume a paused focus session.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'end_focus',
      description: 'End the current focus session. Use when user says "stop", "end focus".',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },

  // -- Social / Circles ------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'create_circle',
      description: 'Create a new accountability circle/group.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Circle name' },
          emoji: { type: 'string', description: 'Circle emoji' },
          description: { type: 'string', description: 'Circle description' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'invite_to_circle',
      description: 'Invite someone to a circle.',
      parameters: {
        type: 'object',
        properties: {
          circle_name: { type: 'string', description: 'Name of the circle to invite to' },
          username: { type: 'string', description: 'Username of the person to invite' },
          message: { type: 'string', description: 'Optional invite message' },
        },
        required: ['circle_name', 'username'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'join_circle',
      description: 'Join an existing circle using an invite code. Use when user says "join circle", "join with code", "enter circle code".',
      parameters: {
        type: 'object',
        properties: {
          invite_code: { type: 'string', description: 'The invite code or circle ID to join' },
        },
        required: ['invite_code'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_challenge',
      description: `Create a challenge within a circle. ALWAYS infer the best tracking method and sensible defaults from the user's description:
- "read 30 minutes a day" → tracking_method: 'active_days', target_value: duration_days (e.g. 14), duration_days: 14
- "complete 50 tasks this month" → tracking_method: 'tasks_completed', target_value: 50, duration_days: 30
- "focus for 500 minutes in 2 weeks" → tracking_method: 'focus_minutes', target_value: 500, duration_days: 14
- "workout every day for a week" → tracking_method: 'proof_checkin', target_value: 7, duration_days: 7
- "meditate daily" → tracking_method: 'proof_checkin', target_value: 7, duration_days: 7
Always provide a description with rules. If duration not specified, default to 7 days.`,
      parameters: {
        type: 'object',
        properties: {
          circle_name: { type: 'string', description: 'Circle name to create the challenge in' },
          title: { type: 'string', description: 'Short, punchy challenge title (3-60 chars)' },
          description: { type: 'string', description: 'Challenge rules and details. Be specific about what counts as completion.' },
          tracking_method: {
            type: 'string',
            enum: ['tasks_completed', 'focus_minutes', 'active_days', 'proof_checkin'],
            description: 'How progress is tracked. tasks_completed = count tasks done. focus_minutes = total focus time. active_days = days with activity. proof_checkin = manual daily check-in/proof.',
          },
          target_value: { type: 'number', description: 'Goal value to reach (e.g. 50 tasks, 500 minutes, 14 days). Must be a positive integer.' },
          duration_days: { type: 'number', description: 'Challenge duration in days. Common: 7, 14, 30. Default 7 if not specified.' },
          emoji: { type: 'string', description: 'Challenge emoji. Pick one that matches the theme: 💪🏃📚🧘💻🔥⚡🌟🎯✨🚀🏋️' },
        },
        required: ['circle_name', 'title', 'tracking_method', 'target_value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'post_to_circle',
      description: 'Post a message to a circle feed.',
      parameters: {
        type: 'object',
        properties: {
          circle_name: { type: 'string' },
          content: { type: 'string', description: 'Post content' },
        },
        required: ['circle_name', 'content'],
      },
    },
  },

  // -- Queries (read-only, executed server-side) -----------------------------
  {
    type: 'function',
    function: {
      name: 'query_tasks',
      description: 'Query user tasks. Use when they ask "what do I have", "show my tasks".',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date to query (today, tomorrow, or ISO date)' },
          filter: { type: 'string', enum: TASK_FILTERS, description: 'Filter type' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_schedule',
      description: 'Query the user schedule/agenda for a day or range.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date to check' },
          range: { type: 'string', enum: SCHEDULE_RANGES, description: 'Time range' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_stats',
      description: 'Query user stats: streak, XP, level, focus minutes, etc.',
      parameters: {
        type: 'object',
        properties: {
          metric: { type: 'string', enum: STAT_METRICS, description: 'Which stat to check' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_circles',
      description: 'Query the user circles and social activity.',
      parameters: {
        type: 'object',
        properties: {
          circle_name: { type: 'string', description: 'Specific circle to query (optional)' },
        },
        required: [],
      },
    },
  },

  // -- Other -----------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'brain_dump',
      description: 'Capture unstructured thoughts that will be processed into tasks later. Use when user says "let me dump", "brain dump", or speaks a long stream of thoughts.',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Raw brain dump content from user' },
        },
        required: ['content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_preference',
      description: 'Update a user preference or setting.',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Preference key (e.g. voice_speed, theme, focus_duration)' },
          value: { type: 'string', description: 'New value for the preference' },
        },
        required: ['key', 'value'],
      },
    },
  },
];
