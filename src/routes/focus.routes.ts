import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as focusService from '../services/focus.service.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const startSessionSchema = z.object({
  taskId: z.string().uuid().optional(),
  targetMinutes: z.number().min(1).max(180).optional(),
  category: z.string().max(50).optional(),
});

const updateSessionSchema = z.object({
  notes: z.string().max(1000).optional(),
});

// GET /focus/active - Get current active session
router.get('/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await focusService.getActiveSession(req.user!.id);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

// POST /focus/start - Start a new focus session
router.post(
  '/start',
  validateBody(startSessionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await focusService.startFocusSession(req.user!.id, req.body);

      res.status(201).json({
        success: true,
        data: session,
        message: `Focus session started! Target: ${session.targetMinutes} minutes`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /focus/pause - Pause the active session
router.post('/pause', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await focusService.pauseSession(req.user!.id);

    res.json({
      success: true,
      data: session,
      message: 'Session paused',
    });
  } catch (error) {
    next(error);
  }
});

// POST /focus/resume - Resume a paused session
router.post('/resume', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await focusService.resumeSession(req.user!.id);

    res.json({
      success: true,
      data: session,
      message: 'Session resumed',
    });
  } catch (error) {
    next(error);
  }
});

// POST /focus/complete - Complete the session
router.post('/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await focusService.endSession(req.user!.id, true);

    res.json({
      success: true,
      data: result,
      message: result.xpAwarded > 0 
        ? `Session completed! +${result.xpAwarded} XP` 
        : 'Session completed',
    });
  } catch (error) {
    next(error);
  }
});

// POST /focus/abandon - Abandon the session
router.post('/abandon', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await focusService.endSession(req.user!.id, false);

    res.json({
      success: true,
      data: result,
      message: 'Session abandoned',
    });
  } catch (error) {
    next(error);
  }
});

// GET /focus/history - Get session history
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, startDate, endDate } = req.query;

    const result = await focusService.getSessionHistory(req.user!.id, {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json({
      success: true,
      data: result.sessions,
      meta: { total: result.total },
    });
  } catch (error) {
    next(error);
  }
});

// GET /focus/stats - Get focus statistics
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await focusService.getFocusStats(req.user!.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
