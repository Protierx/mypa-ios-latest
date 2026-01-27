import OpenAI from 'openai';
import { env } from '../config/env.js';

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
