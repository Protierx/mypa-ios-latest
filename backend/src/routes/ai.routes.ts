import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  isAIConfigured, 
  generateDailyBriefing,
  conversationWithMYPA,
  generateProactiveSuggestion,
  generateEveningSummary,
  suggestTaskOptimization,
} from '../services/ai.service.js';
import prisma from '../config/database.js';

const router = Router();

// Initialize OpenAI client
const openai = env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const processCommandSchema = z.object({
  text: z.string().min(1).max(1000),
});

const conversationSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

const transcribeSchema = z.object({
  audio: z.string(), // Base64 encoded audio
  language: z.string().optional(),
});

const challengeSuggestSchema = z.object({
  prompt: z.string().min(1).max(500),
});

// POST /ai/conversation - Full conversation with MYPA (main entry point)
router.post(
  '/conversation',
  validateBody(conversationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!openai) {
        return res.status(503).json({
          success: false,
          error: 'AI is not configured',
          code: 'AI_NOT_CONFIGURED',
        });
      }

      const { message, conversationHistory } = req.body;
      const userId = req.user!.id;

      // Get user context
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          name: true, 
          xp: true, 
          level: true, 
          currentStreak: true,
        },
      });

      // Get user's tasks
      const tasks = await prisma.task.findMany({
        where: { userId },
        orderBy: [{ date: 'asc' }, { priority: 'desc' }],
        take: 20,
        select: {
          id: true,
          title: true,
          date: true,
          priority: true,
          completed: true,
        },
      });

      // Get pending brain dumps
      const pendingBrainDumps = await prisma.brainDumpItem.count({
        where: { userId, processed: false },
      });

      // Have conversation with MYPA
      const response = await conversationWithMYPA(
        {
          userId,
          userName: user?.name || 'there',
          message,
          conversationHistory,
        },
        {
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            date: t.date || undefined,
            priority: t.priority,
            completed: t.completed,
          })),
          streak: user?.currentStreak || 0,
          level: user?.level || 1,
          xp: user?.xp || 0,
          pendingBrainDumps,
        }
      );

      // If there's an action, we could execute it here or let frontend handle it
      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('MYPA conversation error:', error);
      next(error);
    }
  }
);

// POST /ai/process-command - Process voice command with AI (legacy, redirects to conversation)
router.post(
  '/process-command',
  validateBody(processCommandSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!openai) {
        return res.status(503).json({
          success: false,
          error: 'AI is not configured',
          code: 'AI_NOT_CONFIGURED',
        });
      }

      const { text } = req.body;
      const userId = req.user!.id;

      // Use GPT to understand the command
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are MYPA, an AI productivity assistant. Parse the user's voice command and extract the intent.

Return a JSON object with:
- type: 'task' | 'challenge' | 'navigation' | 'focus' | 'braindump' | 'query' | 'unknown'
- action: string (e.g., 'create', 'start', 'navigate', 'query')
- data: object with relevant extracted data
- response: friendly response to say back to user
- confidence: 0-1 score

For tasks, extract: title, priority (LOW/NORMAL/HIGH), category (Work/Personal/Health/Learning), durationMin, date/time if mentioned.
For navigation: screen name (Home, Plan, Circles, Profile, Tasks, Challenges, Settings, Inbox, Streak, Wallet, Level).
For focus: targetMinutes (default 25).
For braindump: content.
For challenges: title, description.

Examples:
"Add task buy groceries" → {"type":"task","action":"create","data":{"title":"Buy groceries","priority":"NORMAL","category":"Personal"},"response":"I'll add 'Buy groceries' to your tasks!","confidence":0.95}
"Go to my profile" → {"type":"navigation","action":"navigate","data":{"screen":"Profile"},"response":"Opening your profile","confidence":0.99}
"Start a 30 minute focus session" → {"type":"focus","action":"start","data":{"targetMinutes":30},"response":"Starting a 30-minute focus session. Let's be productive!","confidence":0.98}`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      res.json({
        success: true,
        data: {
          type: result.type || 'unknown',
          action: result.action || 'unknown',
          data: result.data || {},
          response: result.response || "I'm not sure how to help with that.",
          confidence: result.confidence || 0.5,
        },
      });
    } catch (error) {
      console.error('AI command processing error:', error);
      next(error);
    }
  }
);

// POST /ai/transcribe-base64 - Transcribe audio with Whisper (base64 input)
const transcribeBase64Schema = z.object({
  audio: z.string(), // Base64 encoded audio
  language: z.string().optional().default('en'),
});

router.post(
  '/transcribe-base64',
  authenticateToken,
  validateBody(transcribeBase64Schema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!openai) {
        return res.status(503).json({
          success: false,
          error: 'AI is not configured',
          code: 'AI_NOT_CONFIGURED',
        });
      }

      const { audio, language } = req.body;

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audio, 'base64');
      
      // Create a File-like object for OpenAI
      const audioFile = new File([audioBuffer], 'audio.m4a', { type: 'audio/m4a' });

      // Transcribe with Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: language,
        response_format: 'text',
      });

      res.json({
        success: true,
        data: {
          text: transcription,
          language: language,
        },
      });
    } catch (error: any) {
      console.error('Whisper transcription error:', error);
      
      // Check for specific OpenAI errors
      if (error?.code === 'audio_too_short') {
        return res.json({
          success: true,
          data: { text: '', language: req.body.language },
        });
      }
      
      next(error);
    }
  }
);

// POST /ai/transcribe - Transcribe audio with Whisper (not implemented for web)
router.post(
  '/transcribe',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Note: For React Native, you'd typically use expo-av for recording
      // and send the audio file to Whisper API
      // For now, return a placeholder
      res.json({
        success: false,
        error: 'Audio transcription requires native audio recording. Use text input instead.',
        code: 'NOT_IMPLEMENTED',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /ai/briefing - Get daily briefing
router.get('/briefing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isAIConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'AI is not configured',
        code: 'AI_NOT_CONFIGURED',
      });
    }

    const userId = req.user!.id;
    const today = new Date().toISOString().split('T')[0];

    // Get user's tasks for today
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        completed: false,
        OR: [
          { date: today },
          { date: null },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: 10,
    });

    // Get user stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        xp: true,
        level: true,
        currentStreak: true,
        tasksCompleted: true,
      },
    });

    // Generate briefing
    const briefing = await generateDailyBriefing({
      userName: user?.name || 'there',
      tasksToday: tasks.map(t => ({ title: t.title, priority: t.priority, category: t.category })),
      completedYesterday: 0, // TODO: calculate from yesterday's tasks
      currentStreak: user?.currentStreak || 0,
      focusMinutesToday: 0, // TODO: calculate from today's focus sessions
    });

    res.json({
      success: true,
      data: {
        briefing,
        stats: {
          tasksToday: tasks.length,
          streak: user?.currentStreak || 0,
          level: user?.level || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /ai/chat - General chat with MYPA
router.post(
  '/chat',
  validateBody(z.object({ message: z.string().min(1).max(2000) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!openai) {
        return res.status(503).json({
          success: false,
          error: 'AI is not configured',
          code: 'AI_NOT_CONFIGURED',
        });
      }

      const { message } = req.body;
      const userId = req.user!.id;

      // Get user context
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, xp: true, level: true, currentStreak: true },
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are MYPA, a friendly and motivating AI productivity assistant. 
The user's name is ${user?.name || 'there'}. 
They are level ${user?.level || 1} with ${user?.xp || 0} XP and a ${user?.currentStreak || 0}-day streak.
Be encouraging, concise, and helpful. Keep responses under 150 words.
If they ask about features, mention: tasks, focus sessions, brain dump, challenges, circles, and streaks.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      res.json({
        success: true,
        data: {
          response: completion.choices[0].message.content,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /ai/challenge-suggest - Suggest a challenge setup from a prompt
router.post(
  '/challenge-suggest',
  validateBody(challengeSuggestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!openai) {
        return res.status(503).json({
          success: false,
          error: 'AI is not configured',
          code: 'AI_NOT_CONFIGURED',
        });
      }

      const { prompt } = req.body;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You create simple social challenges for a productivity app.
  Return ONLY valid JSON with this schema:
  {
    "title": string,
    "type": "FOCUS_MINUTES" | "TASKS_COMPLETED" | "STREAK_DAYS",
    "targetValue": number,
    "days": number,
    "xpReward": number,
    "emoji": string,
    "category": "Productivity" | "Fitness" | "Wellness" | "Learning" | "Social",
    "description": string
  }
Rules:
- title <= 80 chars
- targetValue 1-10000
- days 1-60
- xpReward 10-500
- emoji is a single emoji
- Choose type that best matches the prompt.
- Choose category that best fits the prompt.
- Keep description short (<= 140 chars).`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 200,
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      let parsed: any = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }

      const allowedTypes = ['FOCUS_MINUTES', 'TASKS_COMPLETED', 'STREAK_DAYS'];
      const allowedCategories = ['Productivity', 'Fitness', 'Wellness', 'Learning', 'Social'];
      const safeType = allowedTypes.includes(parsed.type) ? parsed.type : 'TASKS_COMPLETED';
      const safeCategory = allowedCategories.includes(parsed.category) ? parsed.category : 'Productivity';
      const safeTarget = Math.min(10000, Math.max(1, Number(parsed.targetValue) || 1));
      const safeDays = Math.min(60, Math.max(1, Number(parsed.days) || 7));
      const safeXp = Math.min(500, Math.max(10, Number(parsed.xpReward) || 100));
      const safeEmoji = typeof parsed.emoji === 'string' && parsed.emoji.trim() ? parsed.emoji.trim() : '🏆';

      res.json({
        success: true,
        data: {
          title: String(parsed.title || 'New Challenge').slice(0, 80),
          type: safeType,
          targetValue: safeTarget,
          days: safeDays,
          xpReward: safeXp,
          emoji: safeEmoji,
          category: safeCategory,
          description: String(parsed.description || '').slice(0, 140),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /ai/suggestion - Get proactive suggestion based on context
router.get('/suggestion', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isAIConfigured()) {
      return res.json({ success: true, data: null });
    }

    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, currentStreak: true },
    });

    const tasks = await prisma.task.findMany({
      where: { userId, completed: false },
      take: 10,
    });

    const pendingBrainDumps = await prisma.brainDumpItem.count({
      where: { userId, processed: false },
    });

    const suggestion = await generateProactiveSuggestion(userId, {
      userName: user?.name || 'there',
      tasks: tasks.map(t => ({
        title: t.title,
        priority: t.priority,
        date: t.date || undefined,
        completed: t.completed,
      })),
      streak: user?.currentStreak || 0,
      pendingBrainDumps,
    });

    res.json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    next(error);
  }
});

// GET /ai/evening-summary - Get evening wrap-up
router.get('/evening-summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isAIConfigured()) {
      return res.json({
        success: true,
        data: { summary: "Great work today! Rest up for tomorrow." },
      });
    }

    const userId = req.user!.id;
    const today = new Date().toISOString().split('T')[0];

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, currentStreak: true },
    });

    // Count tasks completed today
    const completedToday = await prisma.task.count({
      where: {
        userId,
        completed: true,
        completedAt: { gte: new Date(today) },
      },
    });

    // Count tasks created today
    const createdToday = await prisma.task.count({
      where: {
        userId,
        createdAt: { gte: new Date(today) },
      },
    });

    // Calculate focus time (placeholder - would need focus session tracking)
    const focusMinutes = 0;

    // Calculate XP earned today (placeholder)
    const xpToday = completedToday * 25;

    const summary = await generateEveningSummary({
      userName: user?.name || 'there',
      tasksCompletedToday: completedToday,
      tasksCreatedToday: createdToday,
      focusMinutesToday: focusMinutes,
      streak: user?.currentStreak || 0,
      xpEarnedToday: xpToday,
    });

    res.json({
      success: true,
      data: {
        summary,
        stats: {
          completed: completedToday,
          created: createdToday,
          focusMinutes,
          xpEarned: xpToday,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /ai/task-suggestions - Get task optimization suggestions
router.get('/task-suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isAIConfigured()) {
      return res.json({
        success: true,
        data: { suggestions: [] },
      });
    }

    const userId = req.user!.id;

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      take: 20,
    });

    const suggestions = await suggestTaskOptimization(
      tasks.map(t => ({
        title: t.title,
        priority: t.priority,
        category: t.category,
        date: t.date || undefined,
        completed: t.completed,
      }))
    );

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

// POST /ai/categorize-task - AI categorization for a task title
const categorizeTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(1000).optional(),
});

router.post(
  '/categorize-task',
  validateBody(categorizeTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!openai) {
        // Fallback without AI
        return res.json({
          success: true,
          data: {
            category: 'Personal',
            priority: 'NORMAL',
            suggestedDuration: 30,
            confidence: 0.5,
          },
        });
      }

      const { title, description } = req.body;
      const content = description ? `${title} - ${description}` : title;

      const systemPrompt = `Analyze this task and suggest categorization. Return JSON only:
{
  "category": "Work|Personal|Health|Finance|Learning|Social",
  "priority": "LOW|NORMAL|HIGH",
  "suggestedDuration": 15|30|45|60|90|120,
  "confidence": 0.0-1.0,
  "tags": ["tag1", "tag2"]
}

Consider:
- Work: Job tasks, meetings, projects, deadlines
- Personal: Home, errands, family, admin
- Health: Exercise, medical, wellness, sleep
- Finance: Bills, banking, investments, budget
- Learning: Study, courses, reading, skills
- Social: Events, friends, networking

Priority based on urgency words, deadlines, importance.
Duration based on task complexity.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 150,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      res.json({
        success: true,
        data: {
          category: result.category || 'Personal',
          priority: result.priority || 'NORMAL',
          suggestedDuration: result.suggestedDuration || 30,
          confidence: result.confidence || 0.7,
          tags: result.tags || [],
        },
      });
    } catch (error) {
      console.error('Task categorization error:', error);
      next(error);
    }
  }
);

// POST /ai/smart-schedule - AI-powered task scheduling
const smartScheduleSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    priority: z.string().optional(),
    durationMin: z.number().optional(),
  })),
  preferences: z.object({
    workingHoursStart: z.string().optional(),
    workingHoursEnd: z.string().optional(),
    preferMorningForWork: z.boolean().optional(),
  }).optional(),
});

router.post(
  '/smart-schedule',
  validateBody(smartScheduleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!openai) {
        // Simple fallback scheduling
        const today = new Date();
        const scheduled = req.body.tasks.map((task: any, index: number) => {
          const date = new Date(today);
          date.setDate(date.getDate() + Math.floor(index / 3));
          return {
            ...task,
            suggestedDate: date.toISOString().split('T')[0],
            suggestedTime: ['09:00', '11:00', '14:00', '16:00'][index % 4],
          };
        });

        return res.json({
          success: true,
          data: { scheduled, summary: 'Tasks scheduled evenly.' },
        });
      }

      const userId = req.user!.id;
      const { tasks, preferences } = req.body;

      // Get user's existing scheduled tasks
      const existingTasks = await prisma.task.findMany({
        where: {
          userId,
          date: { not: null },
          completed: false,
        },
        select: {
          date: true,
          time: true,
          durationMin: true,
          title: true,
          category: true,
        },
      });

      // Import smart schedule function
      const { smartScheduleBrainDump } = await import('../services/ai.service.js');

      const result = await smartScheduleBrainDump(
        tasks.map((t: any) => ({ id: t.id, content: t.title })),
        existingTasks.map(t => ({
          date: t.date!,
          time: t.time || undefined,
          durationMin: t.durationMin,
          title: t.title,
          category: t.category,
        })),
        preferences
      );

      res.json({
        success: true,
        data: {
          scheduled: result.scheduledTasks,
          summary: result.summary,
        },
      });
    } catch (error) {
      console.error('Smart scheduling error:', error);
      next(error);
    }
  }
);

// GET /ai/daily-insights - Get AI-generated daily insights
router.get('/daily-insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();

    // Get user data
    const [user, todaysTasks, recentCompleted] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, currentStreak: true, level: true, xp: true },
      }),
      prisma.task.findMany({
        where: { userId, date: today },
        select: { title: true, priority: true, completed: true, category: true },
      }),
      prisma.task.count({
        where: {
          userId,
          completed: true,
          completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const completedToday = todaysTasks.filter(t => t.completed).length;
    const pendingToday = todaysTasks.filter(t => !t.completed);
    const highPriority = pendingToday.filter(t => t.priority === 'HIGH');

    // Generate insights without AI if not configured
    if (!openai) {
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      const insights = [
        `${greeting}, ${user?.name || 'there'}!`,
        pendingToday.length > 0
          ? `You have ${pendingToday.length} task${pendingToday.length > 1 ? 's' : ''} to tackle today.`
          : 'Your schedule is clear today!',
        highPriority.length > 0
          ? `${highPriority.length} high-priority task${highPriority.length > 1 ? 's' : ''} need${highPriority.length === 1 ? 's' : ''} attention.`
          : null,
        user?.currentStreak && user.currentStreak >= 3
          ? `🔥 ${user.currentStreak}-day streak! Keep it going!`
          : null,
      ].filter(Boolean);

      return res.json({
        success: true,
        data: {
          greeting: `${greeting}, ${user?.name || 'there'}!`,
          insights,
          stats: {
            pending: pendingToday.length,
            completed: completedToday,
            highPriority: highPriority.length,
            streak: user?.currentStreak || 0,
            weeklyCompleted: recentCompleted,
          },
        },
      });
    }

    // AI-generated insights
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Generate 2-3 brief, personalized insights for this user. Be warm but concise.
Return JSON: { "greeting": "...", "insights": ["...", "..."], "tip": "..." }`,
        },
        {
          role: 'user',
          content: `Time: ${hour}:00
User: ${user?.name || 'User'}
Streak: ${user?.currentStreak || 0} days
Level: ${user?.level || 1}
Today: ${pendingToday.length} pending, ${completedToday} done
High priority: ${highPriority.length}
Week: ${recentCompleted} completed`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 200,
    });

    const aiResult = JSON.parse(completion.choices[0].message.content || '{}');

    res.json({
      success: true,
      data: {
        greeting: aiResult.greeting || `Good ${hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}!`,
        insights: aiResult.insights || [],
        tip: aiResult.tip,
        stats: {
          pending: pendingToday.length,
          completed: completedToday,
          highPriority: highPriority.length,
          streak: user?.currentStreak || 0,
          weeklyCompleted: recentCompleted,
        },
      },
    });
  } catch (error) {
    console.error('Daily insights error:', error);
    next(error);
  }
});

export default router;
