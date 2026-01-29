/**
 * Challenge Routes
 * API endpoints for challenges and competitions
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as challengeService from '../services/challenge.service.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createChallengeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  emoji: z.string().max(10).optional(),
  type: z.enum(['FOCUS_MINUTES', 'TASKS_COMPLETED', 'STREAK_DAYS', 'CUSTOM']),
  targetValue: z.number().min(1).max(10000),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  xpReward: z.number().min(10).max(1000).optional(),
  circleId: z.string().uuid().optional(),
});

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

const progressSchema = z.object({
  amount: z.number().min(1),
});

// ==========================================
// GET CHALLENGES
// ==========================================

// GET /challenges - List all available challenges
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const challenges = await challengeService.getAvailableChallenges(req.user!.id);

    res.json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    next(error);
  }
});

// GET /challenges/mine - Get challenges user has joined
router.get('/mine', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const challenges = await challengeService.getChallenges(req.user!.id, {
      joined: true,
    });

    res.json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    next(error);
  }
});

// GET /challenges/active - Get active challenges
router.get('/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const challenges = await challengeService.getChallenges(req.user!.id, {
      active: true,
    });

    res.json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    next(error);
  }
});

// GET /challenges/:id - Get challenge details
router.get(
  '/:id',
  validateParams(idParamsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const challenge = await challengeService.getChallengeById(
        req.params.id,
        req.user!.id
      );

      res.json({
        success: true,
        data: challenge,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /challenges/:id/leaderboard - Get challenge leaderboard
router.get(
  '/:id/leaderboard',
  validateParams(idParamsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const leaderboard = await challengeService.getLeaderboard(req.params.id, limit);

      res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// CREATE CHALLENGE
// ==========================================

router.post(
  '/',
  validateBody(createChallengeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const challenge = await challengeService.createChallenge(req.user!.id, {
        ...req.body,
        startsAt: new Date(req.body.startsAt),
        endsAt: new Date(req.body.endsAt),
      });

      res.status(201).json({
        success: true,
        data: challenge,
        message: 'Challenge created!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// JOIN / LEAVE CHALLENGE
// ==========================================

// POST /challenges/:id/join - Join a challenge
router.post(
  '/:id/join',
  validateParams(idParamsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const participant = await challengeService.joinChallenge(
        req.params.id,
        req.user!.id
      );

      res.status(201).json({
        success: true,
        data: participant,
        message: `Joined challenge: ${participant.challenge.title}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /challenges/:id/leave - Leave a challenge
router.post(
  '/:id/leave',
  validateParams(idParamsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await challengeService.leaveChallenge(
        req.params.id,
        req.user!.id
      );

      res.json({
        success: true,
        data: result,
        message: 'Left challenge',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// UPDATE PROGRESS
// ==========================================

// POST /challenges/:id/progress - Manually update progress
router.post(
  '/:id/progress',
  validateParams(idParamsSchema),
  validateBody(progressSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await challengeService.updateProgress(
        req.params.id,
        req.user!.id,
        req.body.amount
      );

      const isCompleted = 'isCompleted' in result ? result.isCompleted : false;
      const xpAwarded = 'xpAwarded' in result ? result.xpAwarded : 0;
      
      const message = isCompleted
        ? `Challenge completed! +${xpAwarded} XP`
        : `Progress updated: ${result.progress}/${result.challenge.targetValue}`;

      res.json({
        success: true,
        data: result,
        message,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
