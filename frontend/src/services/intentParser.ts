/**
 * IntentParser - Frontend intent detection for quick commands
 * 
 * From implementation guide Step 4.5:
 * Quick local parsing for common patterns to speed up operations
 * before waiting for API response.
 */

export type IntentType = 
  | 'add_task'
  | 'complete_task'
  | 'query_tasks'
  | 'start_focus'
  | 'status'
  | 'navigate'
  | 'braindump'
  | 'unknown';

export type TaskFilter = 'today' | 'tomorrow' | 'this_week' | 'all' | 'priority';
export type NavigationTarget = 'tasks' | 'social' | 'profile' | 'focus' | 'home';

export interface ParsedIntent {
  intent: IntentType;
  task?: string;
  filter?: TaskFilter;
  priority?: 'high' | 'medium' | 'low';
  duration?: number; // minutes for focus
  target?: NavigationTarget;
  rawText: string;
  confidence: number; // 0-1
}

// Pattern definitions
const INTENT_PATTERNS: {
  intent: IntentType;
  patterns: RegExp[];
  extractor?: (match: RegExpMatchArray, text: string) => Partial<ParsedIntent>;
}[] = [
  // Add Task patterns
  {
    intent: 'add_task',
    patterns: [
      /^add(?:\s+(?:a\s+)?task)?\s+(.+)$/i,
      /^create(?:\s+(?:a\s+)?task)?\s+(.+)$/i,
      /^new\s+task[:\s]+(.+)$/i,
      /^remind\s+me\s+to\s+(.+)$/i,
      /^(?:i\s+)?(?:need|have|gotta|got)\s+to\s+(.+)$/i,
      /^don'?t\s+forget\s+to?\s+(.+)$/i,
    ],
    extractor: (match, text) => {
      const taskText = match[1]?.trim() || text;
      return {
        task: taskText,
        priority: detectPriority(taskText),
      };
    },
  },
  
  // Complete Task patterns
  {
    intent: 'complete_task',
    patterns: [
      /^(?:mark\s+)?(?:done|complete|finish)(?:ed)?\s+(.+)$/i,
      /^i\s+(?:did|finished|completed)\s+(.+)$/i,
      /^check\s+off\s+(.+)$/i,
    ],
    extractor: (match) => ({
      task: match[1]?.trim(),
    }),
  },
  
  // Query Tasks patterns
  {
    intent: 'query_tasks',
    patterns: [
      /^what(?:'s|\s+do\s+i\s+have)(?:\s+(?:on|for))?\s+(today|tomorrow|this\s+week)$/i,
      /^(?:show|list|get)(?:\s+me)?\s+(?:my\s+)?(today|tomorrow|all|priority)\s+tasks?$/i,
      /^what(?:'s|\s+are)\s+(?:my\s+)?tasks?\s+(?:for\s+)?(today|tomorrow|this\s+week)$/i,
      /^(?:any\s+)?tasks?\s+(today|tomorrow)$/i,
    ],
    extractor: (match) => ({
      filter: normalizeFilter(match[1]),
    }),
  },
  
  // Start Focus patterns
  {
    intent: 'start_focus',
    patterns: [
      /^(?:start|begin)(?:\s+(?:a|my))?\s+(?:focus|deep\s+work|pomodoro)(?:\s+session)?$/i,
      /^(?:let'?s|i\s+want\s+to)\s+focus$/i,
      /^focus(?:\s+mode)?$/i,
      /^(?:start|begin)\s+(?:focus(?:ing)?|working)$/i,
      /^(?:focus|deep\s+work)\s+for\s+(\d+)\s+(?:min(?:ute)?s?)$/i,
    ],
    extractor: (match) => ({
      duration: match[1] ? parseInt(match[1], 10) : undefined,
    }),
  },
  
  // Status patterns
  {
    intent: 'status',
    patterns: [
      /^how\s+(?:am\s+i|'?m\s+i)\s+doing$/i,
      /^(?:my\s+)?(?:status|progress|stats)$/i,
      /^how(?:'?s|\s+is)\s+(?:my\s+)?(?:day|productivity)$/i,
      /^what(?:'?s|\s+is)\s+my\s+(?:streak|level|xp)$/i,
    ],
  },
  
  // Navigation patterns
  {
    intent: 'navigate',
    patterns: [
      /^(?:go|take\s+me)\s+to\s+(?:my\s+)?(tasks?|social|profile|focus|home)$/i,
      /^(?:show|open)\s+(?:my\s+)?(tasks?|social|profile|focus|home)$/i,
      /^(tasks?|social|profile|focus|home)\s+(?:screen|page|view)$/i,
    ],
    extractor: (match) => ({
      target: normalizeTarget(match[1]),
    }),
  },
  
  // Brain dump patterns
  {
    intent: 'braindump',
    patterns: [
      /^brain\s*dump$/i,
      /^dump(?:\s+my)?\s+(?:thoughts?|brain)$/i,
      /^i\s+(?:have|got)\s+(?:a\s+lot|many|some)\s+(?:on\s+my\s+mind|thoughts?)$/i,
      /^let\s+me\s+(?:vent|dump)$/i,
    ],
  },
];

// Helper to detect priority from text
function detectPriority(text: string): 'high' | 'medium' | 'low' | undefined {
  const lowered = text.toLowerCase();
  
  // High priority indicators
  if (
    lowered.includes('urgent') ||
    lowered.includes('asap') ||
    lowered.includes('important') ||
    lowered.includes('critical') ||
    lowered.includes('must') ||
    lowered.includes('deadline') ||
    lowered.includes('immediately')
  ) {
    return 'high';
  }
  
  // Low priority indicators
  if (
    lowered.includes('when i can') ||
    lowered.includes('eventually') ||
    lowered.includes('sometime') ||
    lowered.includes('no rush') ||
    lowered.includes('if possible')
  ) {
    return 'low';
  }
  
  return undefined;
}

// Helper to normalize task filter
function normalizeFilter(text: string): TaskFilter {
  const lowered = text?.toLowerCase()?.trim();
  
  if (lowered === 'today') return 'today';
  if (lowered === 'tomorrow') return 'tomorrow';
  if (lowered?.includes('week')) return 'this_week';
  if (lowered === 'priority' || lowered === 'important') return 'priority';
  return 'all';
}

// Helper to normalize navigation target
function normalizeTarget(text: string): NavigationTarget {
  const lowered = text?.toLowerCase()?.trim();
  
  if (lowered?.includes('task')) return 'tasks';
  if (lowered === 'social' || lowered === 'circles') return 'social';
  if (lowered === 'profile' || lowered === 'me') return 'profile';
  if (lowered === 'focus') return 'focus';
  return 'home';
}

/**
 * Parse user input to detect intent locally
 */
export function parseIntent(text: string): ParsedIntent {
  const trimmed = text.trim();
  
  // Try each pattern set
  for (const patternSet of INTENT_PATTERNS) {
    for (const pattern of patternSet.patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const extracted = patternSet.extractor?.(match, trimmed) || {};
        return {
          intent: patternSet.intent,
          rawText: trimmed,
          confidence: 0.9, // High confidence for exact pattern match
          ...extracted,
        };
      }
    }
  }
  
  // No pattern matched - check for task-like input
  // If it looks actionable, treat as potential task
  if (isLikelyTask(trimmed)) {
    return {
      intent: 'add_task',
      task: trimmed,
      priority: detectPriority(trimmed),
      rawText: trimmed,
      confidence: 0.6, // Lower confidence, might need API confirmation
    };
  }
  
  // Unknown - defer to API
  return {
    intent: 'unknown',
    rawText: trimmed,
    confidence: 0,
  };
}

/**
 * Check if text looks like a task (actionable)
 */
function isLikelyTask(text: string): boolean {
  const lowered = text.toLowerCase();
  
  // Starts with verb
  const actionVerbs = [
    'buy', 'get', 'call', 'email', 'send', 'write', 'read', 'check',
    'clean', 'organize', 'fix', 'update', 'review', 'prepare', 'schedule',
    'book', 'pay', 'submit', 'complete', 'finish', 'make', 'do', 'pick',
  ];
  
  for (const verb of actionVerbs) {
    if (lowered.startsWith(verb + ' ')) {
      return true;
    }
  }
  
  // Contains time indicators
  if (
    lowered.includes('by ') ||
    lowered.includes('before ') ||
    lowered.includes('at ') ||
    lowered.includes('tomorrow') ||
    lowered.includes('today') ||
    lowered.includes('tonight') ||
    lowered.includes('this week')
  ) {
    return true;
  }
  
  return false;
}

/**
 * Extract date/time from task text
 */
export function extractDateTime(text: string): {
  dueDate?: string;
  dueTime?: string;
  cleanedText: string;
} {
  let cleanedText = text;
  let dueDate: string | undefined;
  let dueTime: string | undefined;
  
  // Today
  if (/\b(today)\b/i.test(text)) {
    const today = new Date();
    dueDate = today.toISOString().split('T')[0];
    cleanedText = cleanedText.replace(/\b(by\s+)?today\b/gi, '').trim();
  }
  
  // Tomorrow
  if (/\b(tomorrow)\b/i.test(text)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate = tomorrow.toISOString().split('T')[0];
    cleanedText = cleanedText.replace(/\b(by\s+)?tomorrow\b/gi, '').trim();
  }
  
  // Time patterns (e.g., "at 3pm", "by 5:30")
  const timeMatch = text.match(/(?:at|by)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3]?.toLowerCase();
    
    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
    
    dueTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    cleanedText = cleanedText.replace(timeMatch[0], '').trim();
  }
  
  // Clean up extra spaces
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  
  return { dueDate, dueTime, cleanedText };
}

export default { parseIntent, extractDateTime, isLikelyTask };
