import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAIConfigured, generateDailyBriefing } from '../services/ai.service.js';
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

const transcribeSchema = z.object({
  audio: z.string(), // Base64 encoded audio
  language: z.string().optional(),
});

// POST /ai/process-command - Process voice command with AI
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

export default router;
