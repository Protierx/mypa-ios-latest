/**
 * Assignments Routes
 * API endpoints for circle assignments
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as assignmentService from '../services/assignment.service.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createAssignmentSchema = z.object({
  assigneeId: z.string().uuid('Invalid assignee ID'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime().optional(),
  xpReward: z.number().min(10).max(500).optional(),
});

const completeAssignmentSchema = z.object({
  proofUrl: z.string().url().optional(),
  proofNote: z.string().max(500).optional(),
});

// ==========================================
// MY ASSIGNMENTS
// ==========================================

// GET /assignments/mine - Get all my assignments (across all circles)
router.get('/mine', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, status, limit, offset } = req.query;

    const result = await assignmentService.getMyAssignments(req.user!.id, {
      role: role as 'assignee' | 'creator' | undefined,
      status: status as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.assignments,
      meta: { total: result.total },
    });
  } catch (error) {
    next(error);
  }
});

// GET /assignments/:id - Get assignment details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await assignmentService.getAssignmentById(
      req.user!.id,
      req.params.id
    );

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
});

// POST /assignments/:id/accept - Accept an assignment
router.post('/:id/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await assignmentService.acceptAssignment(
      req.user!.id,
      req.params.id
    );

    res.json({
      success: true,
      data: assignment,
      message: 'Assignment accepted! A task has been created.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /assignments/:id/decline - Decline an assignment
router.post('/:id/decline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await assignmentService.declineAssignment(
      req.user!.id,
      req.params.id
    );

    res.json({
      success: true,
      data: assignment,
      message: 'Assignment declined',
    });
  } catch (error) {
    next(error);
  }
});

// POST /assignments/:id/complete - Complete an assignment
router.post(
  '/:id/complete',
  validateBody(completeAssignmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await assignmentService.completeAssignment(
        req.user!.id,
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        data: result,
        message: `Assignment completed! +${result.xpAwarded} XP`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /assignments/:id - Delete an assignment (creator only, pending only)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assignmentService.deleteAssignment(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Assignment deleted',
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CIRCLE ASSIGNMENTS (nested under circles)
// These are mounted at /circles/:circleId/assignments
// ==========================================

export const circleAssignmentsRouter = Router({ mergeParams: true });

circleAssignmentsRouter.use(authenticateToken);

// GET /circles/:circleId/assignments - List assignments in circle
circleAssignmentsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, limit, offset } = req.query;

      const result = await assignmentService.getCircleAssignments(
        req.user!.id,
        req.params.circleId,
        {
          status: status as any,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          offset: offset ? parseInt(offset as string, 10) : undefined,
        }
      );

      res.json({
        success: true,
        data: result.assignments,
        meta: { total: result.total },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /circles/:circleId/assignments - Create assignment in circle
circleAssignmentsRouter.post(
  '/',
  validateBody(createAssignmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assignment = await assignmentService.createAssignment(
        req.user!.id,
        req.params.circleId,
        req.body
      );

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Assignment created!',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
