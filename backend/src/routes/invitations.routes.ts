/**
 * Circle Invitation Routes
 * Handles invitation endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import * as invitationService from '../services/invitation.service.js';

// Type for authenticated request
interface AuthRequest extends Request {
  user: { id: string; email: string };
}

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ==========================================
// GET MY INVITATIONS
// ==========================================

router.get('/mine', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const status = req.query.status as string | undefined;
    
    const invitations = await invitationService.getMyInvitations(
      authReq.user.id,
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
  validate([
    param('circleId').isString().notEmpty(),
    param('userId').isString().notEmpty(),
    body('message').optional().isString().isLength({ max: 200 }),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const { circleId, userId } = req.params;
      const { message } = req.body;

      const invitation = await invitationService.sendInvitation(
        circleId,
        authReq.user.id,
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
  validate([param('id').isString().notEmpty()]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const result = await invitationService.acceptInvitation(
        req.params.id,
        authReq.user.id
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
  validate([param('id').isString().notEmpty()]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const result = await invitationService.declineInvitation(
        req.params.id,
        authReq.user.id
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
  validate([
    param('circleId').isString().notEmpty(),
    query('q').isString().isLength({ min: 2 }),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const users = await invitationService.searchUsersToInvite(
        req.params.circleId,
        req.query.q as string,
        authReq.user.id
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
