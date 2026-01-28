/**
 * Posts Routes
 * API endpoints for circle posts and reactions!
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as postService from '../services/post.service.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createPostSchema = z.object({
  type: z.enum(['DAILY_CARD', 'ACHIEVEMENT', 'MILESTONE', 'SYSTEM', 'TEXT']).optional(),
  content: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  tasksCompleted: z.number().optional(),
  focusMinutes: z.number().optional(),
  streakDay: z.number().optional(),
});

const reactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

// ==========================================
// POST ROUTES
// ==========================================

// GET /posts/:id - Get a specific post
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await postService.getPostById(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /posts/:id - Delete a post
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await postService.deletePost(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Post deleted',
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// REACTIONS
// ==========================================

// GET /posts/:id/reactions - Get all reactions on a post
router.get('/:id/reactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await postService.getPostReactions(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /posts/:id/react - Add reaction to a post
router.post(
  '/:id/react',
  validateBody(reactionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reaction = await postService.addReaction(
        req.user!.id,
        req.params.id,
        req.body.emoji
      );

      res.json({
        success: true,
        data: reaction,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /posts/:id/react - Remove reaction from a post
router.delete('/:id/react', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await postService.removeReaction(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Reaction removed',
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CIRCLE FEED (nested under circles)
// These are mounted at /circles/:circleId/feed and /circles/:circleId/posts
// ==========================================

export const circleFeedRouter = Router({ mergeParams: true });

circleFeedRouter.use(authenticateToken);

// GET /circles/:circleId/feed - Get circle feed
circleFeedRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, limit, offset, before } = req.query;

    const result = await postService.getCircleFeed(
      req.user!.id,
      req.params.circleId,
      {
        type: type as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
        before: before as string | undefined,
      }
    );

    res.json({
      success: true,
      data: result.posts,
      meta: {
        total: result.total,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
});

export const circlePostsRouter = Router({ mergeParams: true });

circlePostsRouter.use(authenticateToken);

// POST /circles/:circleId/posts - Create a post in circle
circlePostsRouter.post(
  '/',
  validateBody(createPostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await postService.createPost(
        req.user!.id,
        req.params.circleId,
        req.body
      );

      const xpMessage = req.body.type === 'DAILY_CARD' ? ' +10 XP' : '';

      res.status(201).json({
        success: true,
        data: post,
        message: `Post created!${xpMessage}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /circles/:circleId/posts/daily-card - Create daily card with auto-stats
circlePostsRouter.post(
  '/daily-card',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if already posted today
      const hasPosted = await postService.hasDailyCardToday(
        req.user!.id,
        req.params.circleId
      );

      if (hasPosted) {
        return res.status(400).json({
          success: false,
          error: 'You already posted a daily card today',
          code: 'DAILY_CARD_EXISTS',
        });
      }

      const post = await postService.createDailyCard(
        req.user!.id,
        req.params.circleId
      );

      res.status(201).json({
        success: true,
        data: post,
        message: 'Daily card posted! +10 XP',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
