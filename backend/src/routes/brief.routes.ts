/**
 * Daily Brief Routes for Mylo
 * 
 * API endpoints for personalized daily briefings and insights.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import dailyBriefService from '../services/dailybrief.service';

const router = Router();

/**
 * GET /api/brief/daily
 * Get the daily brief for the authenticated user
 */
router.get('/daily', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    const brief = await dailyBriefService.generateDailyBrief(userId);

    res.json({
      success: true,
      data: brief,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/brief/evening
 * Get the evening recap for the authenticated user
 */
router.get('/evening', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    const recap = await dailyBriefService.generateEveningRecap(userId);

    res.json({
      success: true,
      data: recap,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/brief/quick
 * Get a quick status update (for widget or notification)
 */
router.get('/quick', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    
    // This is a lightweight version for widgets/notifications
    const brief = await dailyBriefService.generateDailyBrief(userId);

    res.json({
      success: true,
      data: {
        taskCount: brief.todaysTasks.length,
        overdueCount: brief.todaysTasks.filter(t => t.isOverdue).length,
        nextTask: brief.todaysTasks[0] || null,
        greeting: brief.greeting,
        motivationalMessage: brief.motivationalMessage,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
