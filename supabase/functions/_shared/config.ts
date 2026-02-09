/**
 * Shared Edge Function Configuration
 *
 * Single source of truth for:
 * - Model routing (capability-based, PRD section 3)
 * - CORS headers
 * - MYPA voice personality prompt
 * - Action Registry as OpenAI function-calling tool definitions (PRD 4.7)
 *
 * Rule 12: Model IDs live here, NOT hardcoded in client code.
 */

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

AVOID:
- "I'd be happy to help with that!"
- Long explanations
- Robotic confirmations like "Task has been created successfully"
- Never say "I'm an AI" or break character
- Never expose raw error messages`;

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
      name: 'create_challenge',
      description: 'Create a challenge within a circle.',
      parameters: {
        type: 'object',
        properties: {
          circle_name: { type: 'string', description: 'Circle name' },
          title: { type: 'string', description: 'Challenge title' },
          type: { type: 'string', enum: CHALLENGE_TYPES },
          target_value: { type: 'number', description: 'Goal value to reach' },
          duration_days: { type: 'number', description: 'Challenge duration in days' },
        },
        required: ['circle_name', 'title', 'type', 'target_value'],
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
