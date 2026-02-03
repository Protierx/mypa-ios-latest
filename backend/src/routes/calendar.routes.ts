/**
 * Calendar Routes for Mylo
 * 
 * API endpoints for calendar integration and scheduling.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import calendarService from '../services/calendar.service';

const router = Router();

/**
 * POST /api/calendar/connect
 * Connect a calendar provider
 */
router.post('/connect', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { provider, accessToken, refreshToken, calendarIds, syncEnabled } = req.body;

    if (!provider || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Provider and access token are required',
      });
    }

    const validProviders = ['apple', 'google', 'outlook'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider. Must be apple, google, or outlook',
      });
    }

    const connection = await calendarService.connectCalendar(userId, {
      provider,
      accessToken,
      refreshToken,
      calendarIds: calendarIds || ['primary'],
      syncEnabled: syncEnabled ?? true,
    });

    res.status(201).json({
      success: true,
      data: {
        id: connection.id,
        provider: connection.provider,
        calendarIds: connection.calendarIds,
        syncEnabled: connection.syncEnabled,
      },
      message: `${provider} calendar connected successfully`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/calendar/disconnect/:provider
 * Disconnect a calendar provider
 */
router.delete('/disconnect/:provider', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const provider = req.params.provider as any;

    const validProviders = ['apple', 'google', 'outlook'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider',
      });
    }

    await calendarService.disconnectCalendar(userId, provider);

    res.json({
      success: true,
      message: `${provider} calendar disconnected`,
    });
  } catch (error: any) {
    if (error.message === 'Calendar connection not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
});

/**
 * GET /api/calendar/connections
 * Get all calendar connections for the user
 */
router.get('/connections', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    const connections = await calendarService.getCalendarConnections(userId);

    res.json({
      success: true,
      data: connections,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/calendar/sync/:connectionId
 * Trigger sync for a specific calendar connection
 */
router.post('/sync/:connectionId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const connectionId = req.params.connectionId;

    const result = await calendarService.syncFromCalendar(connectionId);

    res.json({
      success: true,
      data: result,
      message: `Synced ${result.total} events (${result.imported} new, ${result.updated} updated)`,
    });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
});

/**
 * GET /api/calendar/events
 * Get calendar events for a date range
 */
router.get('/events', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const events = await calendarService.getCalendarEvents(
      userId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/timeline
 * Get merged timeline (tasks + calendar events) for a date
 */
router.get('/timeline', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { date } = req.query;

    const targetDate = date ? new Date(date as string) : new Date();

    const timeline = await calendarService.getMergedTimeline(userId, targetDate);

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/calendar/export/:taskId
 * Export a task to a connected calendar
 */
router.post('/export/:taskId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.taskId;
    const { connectionId } = req.body;

    if (!connectionId) {
      return res.status(400).json({
        success: false,
        message: 'connectionId is required',
      });
    }

    const result = await calendarService.exportTaskToCalendar(taskId, connectionId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
});

/**
 * GET /api/calendar/conflicts
 * Check for scheduling conflicts
 */
router.get('/conflicts', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { startTime, endTime, excludeTaskId } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'startTime and endTime are required',
      });
    }

    const conflicts = await calendarService.findConflicts(
      userId,
      new Date(startTime as string),
      new Date(endTime as string),
      excludeTaskId as string | undefined
    );

    res.json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/suggest-slots
 * Get suggested time slots for a task
 */
router.get('/suggest-slots', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { date, duration, preferredTimes } = req.query;

    if (!duration) {
      return res.status(400).json({
        success: false,
        message: 'duration is required',
      });
    }

    const targetDate = date ? new Date(date as string) : new Date();
    const durationMin = parseInt(duration as string, 10);

    const preferences = {
      preferredTimes: preferredTimes 
        ? (preferredTimes as string).split(',') 
        : ['morning', 'afternoon'],
    };

    const suggestions = await calendarService.suggestTimeSlots(
      userId,
      targetDate,
      durationMin,
      preferences
    );

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
