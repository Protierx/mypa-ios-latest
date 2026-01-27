/**
 * Text-to-Speech Routes
 * Uses OpenAI TTS for natural voice responses
 */
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Initialize OpenAI client
const openai = env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

// Validation schema
const ttsSchema = z.object({
  text: z.string().min(1).max(4096),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional().default('nova'),
  speed: z.number().min(0.25).max(4.0).optional().default(1.0),
});

// POST /tts/speak - Convert text to speech
router.post(
  '/speak',
  authenticateToken,
  validateBody(ttsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!openai) {
        return res.status(503).json({
          success: false,
          error: 'TTS is not configured',
          code: 'TTS_NOT_CONFIGURED',
        });
      }

      const { text, voice, speed } = req.body;

      // Generate speech using OpenAI TTS
      const mp3Response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
        speed: speed,
      });

      // Get the audio buffer
      const buffer = Buffer.from(await mp3Response.arrayBuffer());

      // Return as base64 for easy mobile playback
      res.json({
        success: true,
        data: {
          audio: buffer.toString('base64'),
          format: 'mp3',
          text: text,
        },
      });
    } catch (error) {
      console.error('TTS error:', error);
      next(error);
    }
  }
);

// POST /tts/stream - Stream audio response (for faster playback)
router.post(
  '/stream',
  authenticateToken,
  validateBody(ttsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!openai) {
        return res.status(503).json({
          success: false,
          error: 'TTS is not configured',
        });
      }

      const { text, voice, speed } = req.body;

      const mp3Response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
        speed: speed,
      });

      // Stream the audio directly
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Transfer-Encoding', 'chunked');
      
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      console.error('TTS stream error:', error);
      next(error);
    }
  }
);

export default router;
