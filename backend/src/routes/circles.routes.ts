/**
 * Circles Routes
 * API endpoints for circle management and membership
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as circleService from '../services/circle.service.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createCircleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(500).optional(),
  emoji: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  isPrivate: z.boolean().optional(),
  maxMembers: z.number().min(2).max(100).optional(),
});

const updateCircleSchema = createCircleSchema.partial();

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

const joinByCodeSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

// ==========================================
// CIRCLE CRUD
// ==========================================

// GET /circles - List user's circles
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const circles = await circleService.getUserCircles(req.user!.id);

    res.json({
      success: true,
      data: circles,
    });
  } catch (error) {
    next(error);
  }
});

// POST /circles - Create a new circle
router.post(
  '/',
  validateBody(createCircleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const circle = await circleService.createCircle(req.user!.id, req.body);

      res.status(201).json({
        success: true,
        data: circle,
        message: 'Circle created successfully!',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /circles/preview/:code - Preview circle by invite code (before joining)
router.get('/preview/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const circle = await circleService.getCircleByInviteCode(req.params.code);

    res.json({
      success: true,
      data: circle,
    });
  } catch (error) {
    next(error);
  }
});

// POST /circles/join/:code - Join circle by invite code
router.post('/join/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await circleService.joinCircleByCode(
      req.user!.id,
      req.params.code
    );

    res.json({
      success: true,
      data: result,
      message: `Joined ${result.name}! +25 XP`,
    });
  } catch (error) {
    next(error);
  }
});

// GET /circles/:id - Get circle details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const circle = await circleService.getCircleById(
      req.params.id,
      req.user!.id
    );

    res.json({
      success: true,
      data: circle,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /circles/:id - Update circle
router.patch(
  '/:id',
  validateBody(updateCircleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const circle = await circleService.updateCircle(
        req.user!.id,
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        data: circle,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /circles/:id - Delete circle
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await circleService.deleteCircle(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Circle deleted',
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// MEMBERSHIP
// ==========================================

// POST /circles/:id/join - Join circle (public circles or with access)
router.post('/:id/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await circleService.joinCircle(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: result,
      message: `Joined ${result.name}! +25 XP`,
    });
  } catch (error) {
    next(error);
  }
});

// POST /circles/:id/leave - Leave circle
router.post('/:id/leave', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await circleService.leaveCircle(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Left the circle',
    });
  } catch (error) {
    next(error);
  }
});

// GET /circles/:id/members - List circle members
router.get('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await circleService.getCircleMembers(
      req.params.id,
      req.user!.id
    );

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /circles/:id/members/:userId - Update member role
router.patch(
  '/:id/members/:userId',
  validateBody(updateRoleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await circleService.updateMemberRole(
        req.user!.id,
        req.params.id,
        req.params.userId,
        req.body.role
      );

      res.json({
        success: true,
        data: result,
        message: `Updated role to ${req.body.role}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /circles/:id/members/:userId - Kick member
router.delete(
  '/:id/members/:userId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await circleService.kickMember(
        req.user!.id,
        req.params.id,
        req.params.userId
      );

      res.json({
        success: true,
        message: 'Member removed from circle',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// INVITE CODE
// ==========================================

// POST /circles/:id/invite-code - Regenerate invite code
router.post(
  '/:id/invite-code',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await circleService.regenerateInviteCode(
        req.user!.id,
        req.params.id
      );

      res.json({
        success: true,
        data: result,
        message: 'Invite code regenerated',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
