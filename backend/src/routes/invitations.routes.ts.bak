/**
 * Circle Invitation Routes
 * Handles invitation endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import * as invitationService from '../services/invitation.service.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const circleInviteParamsSchema = z.object({
  circleId: z.string().uuid(),
  userId: z.string().uuid(),
});

const inviteMessageSchema = z.object({
  message: z.string().max(200).optional(),
});

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

const searchQuerySchema = z.object({
  q: z.string().min(2),
});

const searchParamsSchema = z.object({
  circleId: z.string().uuid(),
});

// ==========================================
// GET MY INVITATIONS
// ==========================================

router.get('/mine', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    
    const invitations = await invitationService.getMyInvitations(
      req.user!.id,
      status
    );

    res.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// SEND INVITATION (via circleId)
// ==========================================

router.post(
  '/circle/:circleId/invite/:userId',
  validateParams(circleInviteParamsSchema),
  validateBody(inviteMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { circleId, userId } = req.params;
      const { message } = req.body;

      const invitation = await invitationService.sendInvitation(
        circleId,
        req.user!.id,
        userId,
        message
      );

      res.status(201).json({
        success: true,
        data: invitation,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// ACCEPT INVITATION
// ==========================================

router.post(
  '/:id/accept',
  validateParams(idParamsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await invitationService.acceptInvitation(
        req.params.id,
        req.user!.id
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// DECLINE INVITATION
// ==========================================

router.post(
  '/:id/decline',
  validateParams(idParamsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await invitationService.declineInvitation(
        req.params.id,
        req.user!.id
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// SEARCH USERS TO INVITE
// ==========================================

router.get(
  '/search/:circleId',
  validateParams(searchParamsSchema),
  validateQuery(searchQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await invitationService.searchUsersToInvite(
        req.params.circleId,
        req.query.q as string,
        req.user!.id
      );

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
