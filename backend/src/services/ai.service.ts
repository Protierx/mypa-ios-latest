import OpenAI from 'openai';
import { env } from '../config/env.js';
import prisma from '../config/database.js';

let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openai) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openai;
}

// MYPA's personality and context
const MYPA_SYSTEM_PROMPT = `You are MYPA (My Personal Assistant), a warm, friendly, and highly capable AI assistant designed to help users organize their lives. You speak naturally like a supportive friend who genuinely cares about helping them succeed.

PERSONALITY:
- Warm and encouraging, but not overly enthusiastic
- Concise and efficient - respect the user's time
- Proactive - offer suggestions when appropriate
- Empathetic - acknowledge feelings and challenges
- Professional when needed, casual when appropriate

CAPABILITIES:
- Create, manage, and schedule tasks
- Start focus sessions for deep work
- Manage brain dumps and organize thoughts
- Navigate anywhere in the app
- Give daily briefings and updates
- Track streaks, XP, and progress
- Manage challenges and circles (social groups)
- Answer questions about productivity

RESPONSE STYLE:
- Keep responses under 2-3 sentences unless asked for details
- Use natural language, avoid robotic responses
- Acknowledge the user's request before acting
- Offer relevant follow-up suggestions occasionally

Remember: You ARE the app. When users ask you to do something, you do it - you don't tell them to do it themselves.`;

export interface CategorizedItem {
  category: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  suggestedTitle: string;
  suggestedDuration: number; // minutes
  isActionable: boolean;
  reasoning?: string;
}

/**
 * Use AI to categorize and extract actionable tasks from brain dump content
 */
export async function categorizeBrainDump(content: string): Promise<CategorizedItem> {
  const client = getClient();

  const systemPrompt = `You are a productivity assistant that helps categorize and organize tasks.
Given a brain dump item (a quick note someone jotted down), analyze it and return:
1. The best category from: Work, Personal, Health, Finance, Learning, Social
2. Priority: LOW (nice to have), NORMAL (should do), HIGH (urgent/important)
3. A clean, actionable task title (imperative form, e.g., "Buy groceries" not "Need to buy groceries")
4. Estimated duration in minutes (5, 10, 15, 30, 45, 60, 90, 120)
5. Whether this is actually actionable (some things are just notes/ideas)

Respond ONLY with valid JSON in this exact format:
{
  "category": "Work",
  "priority": "NORMAL", 
  "suggestedTitle": "Clean task title",
  "suggestedDuration": 30,
  "isActionable": true,
  "reasoning": "Brief explanation"
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Categorize this brain dump item:\n\n"${content}"` },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const text = response.choices[0]?.message?.content?.trim() || '';
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]) as CategorizedItem;

    // Validate and normalize
    const validCategories = ['Work', 'Personal', 'Health', 'Finance', 'Learning', 'Social'];
    const validPriorities = ['LOW', 'NORMAL', 'HIGH'];

    return {
      category: validCategories.includes(result.category) ? result.category : 'Personal',
      priority: validPriorities.includes(result.priority) ? result.priority : 'NORMAL',
      suggestedTitle: result.suggestedTitle || content.slice(0, 100),
      suggestedDuration: [5, 10, 15, 30, 45, 60, 90, 120].includes(result.suggestedDuration) 
        ? result.suggestedDuration 
        : 30,
      isActionable: typeof result.isActionable === 'boolean' ? result.isActionable : true,
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('AI categorization failed:', error);
    // Return sensible defaults if AI fails
    return {
      category: 'Personal',
      priority: 'NORMAL',
      suggestedTitle: content.slice(0, 100),
      suggestedDuration: 30,
      isActionable: true,
    };
  }
}

/**
 * Batch categorize multiple brain dump items
 */
export async function categorizeBrainDumpBatch(items: string[]): Promise<CategorizedItem[]> {
  // Process in parallel but limit concurrency
  const results: CategorizedItem[] = [];
  const batchSize = 5;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(categorizeBrainDump));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Generate a daily briefing for the user
 */
export async function generateDailyBriefing(context: {
  userName: string;
  tasksToday: { title: string; priority: string; category: string }[];
  completedYesterday: number;
  currentStreak: number;
  focusMinutesToday: number;
}): Promise<string> {
  const client = getClient();

  const systemPrompt = `You are MYPA, a friendly and motivating personal assistant. 
Generate a brief, personalized morning briefing (2-3 sentences max).
Be encouraging but not cheesy. Reference their streak if it's notable (3+ days).
Mention their top priority task if they have one.`;

  const userPrompt = `Generate a morning briefing for ${context.userName}:
- Tasks today: ${context.tasksToday.length} (${context.tasksToday.filter(t => t.priority === 'HIGH').length} high priority)
- Completed yesterday: ${context.completedYesterday}
- Current streak: ${context.currentStreak} days
- Focus time today: ${context.focusMinutesToday} minutes
${context.tasksToday.length > 0 ? `- Top task: "${context.tasksToday[0]?.title}"` : ''}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return response.choices[0]?.message?.content?.trim() || 'Good morning! Ready to tackle your tasks today?';
  } catch (error) {
    console.error('Failed to generate briefing:', error);
    return `Good morning${context.userName ? `, ${context.userName}` : ''}! You have ${context.tasksToday.length} tasks today. Let's make it a productive day!`;
  }
}

/**
 * Check if OpenAI is configured
 */
export function isAIConfigured(): boolean {
  return !!env.OPENAI_API_KEY;
}

/**
 * Full context conversation with MYPA
 * This is the main AI interaction point - handles all user requests
 */
export interface ConversationContext {
  userId: string;
  userName: string;
  message: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

export interface MYPAResponse {
  message: string;
  action?: {
    type: 'task' | 'navigation' | 'focus' | 'braindump' | 'challenge' | 'query' | 'reminder' | 'none';
    operation: string;
    data: any;
  };
  followUp?: string;
  emotion?: 'neutral' | 'encouraging' | 'celebrating' | 'sympathetic' | 'focused';
}

export async function conversationWithMYPA(
  context: ConversationContext,
  userContext: {
    tasks: { id: string; title: string; date?: string; priority: string; completed: boolean }[];
    streak: number;
    level: number;
    xp: number;
    pendingBrainDumps: number;
  }
): Promise<MYPAResponse> {
  const client = getClient();
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const hour = today.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  
  const todaysTasks = userContext.tasks.filter(t => t.date === todayStr);
  const completedToday = todaysTasks.filter(t => t.completed).length;
  const pendingToday = todaysTasks.filter(t => !t.completed).length;
  const highPriorityPending = userContext.tasks.filter(t => !t.completed && t.priority === 'HIGH');

  const systemPrompt = `${MYPA_SYSTEM_PROMPT}

CURRENT CONTEXT:
- User: ${context.userName || 'User'}
- Time: ${timeOfDay} (${today.toLocaleTimeString()})
- Date: ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
- Level: ${userContext.level} (${userContext.xp} XP)
- Streak: ${userContext.streak} days
- Today's tasks: ${pendingToday} pending, ${completedToday} completed
- High priority tasks: ${highPriorityPending.length} pending
- Brain dumps to review: ${userContext.pendingBrainDumps}

USER'S TASKS:
${userContext.tasks.slice(0, 10).map(t => `- [${t.completed ? '✓' : ' '}] ${t.title} (${t.priority}${t.date ? ', ' + t.date : ''})`).join('\n') || 'No tasks yet'}

RESPONSE FORMAT (JSON):
{
  "message": "Your natural response to the user",
  "action": {
    "type": "task|navigation|focus|braindump|challenge|query|reminder|none",
    "operation": "create|complete|delete|start|stop|navigate|list|update",
    "data": { relevant data for the action }
  },
  "followUp": "Optional suggestion or question",
  "emotion": "neutral|encouraging|celebrating|sympathetic|focused"
}

ACTION TYPES:
- task: { title, priority, category, date, time, durationMin }
- navigation: { screen: "Home|Plan|Profile|Tasks|Circles|Settings|Inbox|Streak|Wallet|Level|Challenges" }
- focus: { targetMinutes, taskId? }
- braindump: { content } or { action: "process" }
- challenge: { title, description }
- reminder: { message, time }
- query: { topic } - for questions you're answering

When user asks to do something, ALWAYS include an action. Don't just describe what to do.`;

  try {
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      messages.push(...context.conversationHistory.slice(-6)); // Last 6 messages for context
    }

    messages.push({ role: 'user', content: context.message });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      message: result.message || "I'm here to help! What would you like to do?",
      action: result.action,
      followUp: result.followUp,
      emotion: result.emotion || 'neutral',
    };
  } catch (error) {
    console.error('MYPA conversation error:', error);
    return {
      message: "I'm having a moment - could you try that again?",
      emotion: 'sympathetic',
    };
  }
}

/**
 * Generate contextual suggestions based on time and user activity
 */
export async function generateProactiveSuggestion(
  userId: string,
  context: {
    userName: string;
    tasks: { title: string; priority: string; date?: string; completed: boolean }[];
    streak: number;
    lastFocusSession?: Date;
    pendingBrainDumps: number;
  }
): Promise<{ suggestion: string; action?: any } | null> {
  const client = getClient();
  
  const hour = new Date().getHours();
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingToday = context.tasks.filter(t => !t.completed && t.date === todayStr);
  const highPriority = context.tasks.filter(t => !t.completed && t.priority === 'HIGH');

  // Don't suggest too often - return null sometimes
  const shouldSuggest = Math.random() > 0.3;
  if (!shouldSuggest) return null;

  const systemPrompt = `You are MYPA. Generate ONE brief, contextual suggestion (max 1 sentence) based on the user's current situation. 
Return JSON: { "suggestion": "...", "action": { "type": "...", "data": {...} } }
Or return null if no suggestion is appropriate right now.

Time: ${hour}:00
User: ${context.userName}
Streak: ${context.streak} days
Tasks today: ${pendingToday.length} pending
High priority: ${highPriority.length}
Brain dumps: ${context.pendingBrainDumps} unprocessed
Last focus: ${context.lastFocusSession ? 'Recent' : 'Not today'}

Be helpful but not annoying. Only suggest if genuinely useful.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate a contextual suggestion or return null' },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 150,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || 'null');
    return result;
  } catch (error) {
    console.error('Proactive suggestion error:', error);
    return null;
  }
}

/**
 * Generate evening summary/wrap-up
 */
export async function generateEveningSummary(context: {
  userName: string;
  tasksCompletedToday: number;
  tasksCreatedToday: number;
  focusMinutesToday: number;
  streak: number;
  xpEarnedToday: number;
}): Promise<string> {
  const client = getClient();

  const systemPrompt = `You are MYPA giving an evening wrap-up. Be warm and encouraging. 2-3 sentences max.
Celebrate wins, acknowledge effort, and set a positive tone for tomorrow.
Don't be cheesy - be genuine.`;

  const userPrompt = `Evening summary for ${context.userName}:
- Completed: ${context.tasksCompletedToday} tasks
- Created: ${context.tasksCreatedToday} new tasks
- Focus time: ${context.focusMinutesToday} minutes
- XP earned: ${context.xpEarnedToday}
- Streak: ${context.streak} days`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return response.choices[0]?.message?.content?.trim() || "Great work today! Rest up and we'll tackle tomorrow together.";
  } catch (error) {
    console.error('Evening summary error:', error);
    return "You did great today! See you tomorrow.";
  }
}

/**
 * Smart task suggestions based on incomplete tasks and patterns
 */
export async function suggestTaskOptimization(
  tasks: { title: string; priority: string; category: string; date?: string; completed: boolean }[]
): Promise<{ suggestions: string[]; reorganize?: any[] }> {
  const client = getClient();
  
  const incompleteTasks = tasks.filter(t => !t.completed);
  if (incompleteTasks.length === 0) {
    return { suggestions: ["You're all caught up! Time to add new goals or take a well-deserved break."] };
  }

  const systemPrompt = `Analyze these tasks and provide 1-2 brief optimization suggestions.
Focus on: priority conflicts, overdue items, batching opportunities, or workload balance.
Return JSON: { "suggestions": ["..."], "reorganize": null }
Keep suggestions under 15 words each.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Tasks: ${JSON.stringify(incompleteTasks.slice(0, 15))}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 200,
    });

    return JSON.parse(response.choices[0]?.message?.content || '{"suggestions":[]}');
  } catch (error) {
    console.error('Task optimization error:', error);
    return { suggestions: [] };
  }
}

export interface ScheduledTask {
  originalId: string;
  title: string;
  category: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  suggestedDate: string; // YYYY-MM-DD
  suggestedTime: string; // HH:MM (24hr)
  durationMinutes: number;
  reasoning: string;
}

export interface SmartScheduleResult {
  scheduledTasks: ScheduledTask[];
  summary: string;
}

/**
 * Use AI to intelligently schedule brain dump items based on existing tasks and availability
 */
export async function smartScheduleBrainDump(
  items: { id: string; content: string }[],
  existingTasks: { date: string; time?: string; durationMin: number; title: string; category: string }[],
  userPreferences?: {
    workingHoursStart?: string; // HH:MM
    workingHoursEnd?: string;
    preferMorningForWork?: boolean;
    preferEveningForPersonal?: boolean;
  }
): Promise<SmartScheduleResult> {
  const client = getClient();

  const today = new Date();
  const nextWeek: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    nextWeek.push(d.toISOString().split('T')[0]);
  }

  const defaults = {
    workingHoursStart: userPreferences?.workingHoursStart || '09:00',
    workingHoursEnd: userPreferences?.workingHoursEnd || '18:00',
  };

  const systemPrompt = `You are an intelligent scheduling assistant. Your job is to analyze brain dump items and schedule them optimally across the next 7 days.

Consider these factors when scheduling:
1. URGENCY: Words like "urgent", "asap", "today", "deadline" indicate high priority
2. CONTEXT: "call", "email" are quick tasks (10-15min); "project", "report" are longer (60-120min)
3. TIME OF DAY: Schedule focused work in the morning, calls/meetings midday, exercise/personal in evening
4. EXISTING SCHEDULE: Avoid conflicts with existing tasks. Spread tasks evenly across days.
5. ENERGY LEVELS: Don't overload any single day. Max ~4-5 hours of scheduled tasks per day.
6. TASK BATCHING: Group similar tasks (e.g., multiple calls together)

Working hours: ${defaults.workingHoursStart} - ${defaults.workingHoursEnd}
Today's date: ${today.toISOString().split('T')[0]}
Available dates: ${nextWeek.join(', ')}

Existing tasks (already scheduled):
${existingTasks.length > 0 
  ? existingTasks.map(t => `- ${t.date} ${t.time || 'anytime'}: "${t.title}" (${t.durationMin}min, ${t.category})`).join('\n')
  : 'No existing tasks scheduled.'}

Respond ONLY with valid JSON in this exact format:
{
  "scheduledTasks": [
    {
      "originalId": "id from input",
      "title": "Clean, actionable task title",
      "category": "Work|Personal|Health|Finance|Learning|Social",
      "priority": "LOW|NORMAL|HIGH",
      "suggestedDate": "YYYY-MM-DD",
      "suggestedTime": "HH:MM",
      "durationMinutes": 30,
      "reasoning": "Brief explanation of why this time"
    }
  ],
  "summary": "Brief summary of the scheduling decisions"
}`;

  const userPrompt = `Schedule these brain dump items intelligently:

${items.map((item, i) => `${i + 1}. [ID: ${item.id}] "${item.content}"`).join('\n')}

Consider task dependencies, optimal times of day, and don't overload any single day.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 1500,
    });

    const text = response.choices[0]?.message?.content?.trim() || '';
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]) as SmartScheduleResult;

    // Validate and normalize each scheduled task
    const validCategories = ['Work', 'Personal', 'Health', 'Finance', 'Learning', 'Social'];
    const validPriorities = ['LOW', 'NORMAL', 'HIGH'];

    result.scheduledTasks = result.scheduledTasks.map(task => ({
      ...task,
      category: validCategories.includes(task.category) ? task.category : 'Personal',
      priority: validPriorities.includes(task.priority) ? task.priority : 'NORMAL',
      durationMinutes: task.durationMinutes || 30,
      suggestedDate: nextWeek.includes(task.suggestedDate) ? task.suggestedDate : nextWeek[0],
    }));

    return result;
  } catch (error) {
    console.error('AI smart scheduling failed:', error);
    
    // Fallback: Simple scheduling without AI
    const fallbackTasks: ScheduledTask[] = items.map((item, index) => {
      const dayOffset = Math.floor(index / 3); // Max 3 tasks per day
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      
      const timeSlots = ['09:00', '11:00', '14:00', '16:00'];
      const timeIndex = index % timeSlots.length;
      
      return {
        originalId: item.id,
        title: item.content.slice(0, 100),
        category: 'Personal',
        priority: 'NORMAL' as const,
        suggestedDate: date.toISOString().split('T')[0],
        suggestedTime: timeSlots[timeIndex],
        durationMinutes: 30,
        reasoning: 'Scheduled based on availability',
      };
    });

    return {
      scheduledTasks: fallbackTasks,
      summary: 'Tasks scheduled evenly across the week.',
    };
  }
}
