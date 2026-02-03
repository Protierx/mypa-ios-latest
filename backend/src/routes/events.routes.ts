/**
 * Event Routes for Mylo
 * 
 * Endpoints for logging user events and analytics.
 */

import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import eventService, { EventType, EventMetadata } from '../services/event.service';

const router = express.Router();

// Use userId from request set by auth middleware
type AuthRequest = Request & { userId?: string };

/**
 * POST /api/events
 * Log a single event
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { type, metadata = {} } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, error: 'Event type is required' });
    }

    await eventService.logEvent(userId, type as EventType, metadata as EventMetadata);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('[Events] Error logging event:', error);
    res.status(500).json({ success: false, error: 'Failed to log event' });
  }
});

/**
 * POST /api/events/batch
 * Log multiple events at once
 */
router.post('/batch', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, error: 'Events array is required' });
    }

    if (events.length > 100) {
      return res.status(400).json({ success: false, error: 'Maximum 100 events per batch' });
    }

    await eventService.logEvents(
      userId,
      events.map((e: any) => ({
        type: e.type as EventType,
        metadata: e.metadata as EventMetadata,
      }))
    );

    res.status(201).json({ success: true, logged: events.length });
  } catch (error) {
    console.error('[Events] Error logging batch events:', error);
    res.status(500).json({ success: false, error: 'Failed to log events' });
  }
});

/**
 * GET /api/events/stats
 * Get event statistics for the user
 */
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await eventService.getEventStats(userId, startDate, new Date());

    res.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        stats,
      },
    });
  } catch (error) {
    console.error('[Events] Error getting stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get event stats' });
  }
});

/**
 * GET /api/events/hourly
 * Get hourly distribution of productivity events
 */
router.get('/hourly', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const distribution = await eventService.getHourlyDistribution(
      userId,
      ['task_completed', 'focus_completed'],
      days
    );

    res.json({
      success: true,
      data: {
        hourlyDistribution: distribution,
        peakHours: distribution
          .map((count, hour) => ({ hour, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      },
    });
  } catch (error) {
    console.error('[Events] Error getting hourly distribution:', error);
    res.status(500).json({ success: false, error: 'Failed to get hourly distribution' });
  }
});

/**
 * GET /api/events/daily
 * Get day of week statistics
 */
router.get('/daily', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 90;
    const dayStats = await eventService.getDayOfWeekStats(userId, days);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedStats = dayStats.map(stat => ({
      ...stat,
      dayName: dayNames[stat.day],
    }));

    res.json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    console.error('[Events] Error getting daily stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get daily stats' });
  }
});

/**
 * POST /api/events/session
 * Start a new event session
 */
router.post('/session', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = eventService.startSession();
    res.json({ success: true, sessionId });
  } catch (error) {
    console.error('[Events] Error starting session:', error);
    res.status(500).json({ success: false, error: 'Failed to start session' });
  }
});

export default router;
