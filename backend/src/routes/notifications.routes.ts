/**
 * Notifications Routes
 * Push notification management and in-app notifications
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import pushService from '../services/push.service.js';
import prisma from '../config/database.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ==========================================
// PUSH TOKEN MANAGEMENT
// ==========================================

const registerTokenSchema = z.object({
  pushToken: z.string().min(1),
  platform: z.enum(['ios', 'android', 'expo']).optional().default('expo'),
});

// POST /notifications/register-token - Register push token
router.post(
  '/register-token',
  validateBody(registerTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pushToken } = req.body;
      const success = await pushService.savePushToken(req.user!.id, pushToken);
      
      res.json({
        success,
        message: success ? 'Push token registered' : 'Failed to register push token',
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /notifications/token - Remove push token (logout/disable notifications)
router.delete('/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await pushService.removePushToken(req.user!.id);
    
    res.json({
      success,
      message: success ? 'Push token removed' : 'Failed to remove push token',
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// NOTIFICATION HISTORY
// ==========================================

// GET /notifications - Get user's notification history
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, unreadOnly } = req.query;
    
    const where: any = { userId: req.user!.id };
    if (unreadOnly === 'true') {
      where.read = false;
    }
    
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit as string, 10) : 50,
        skip: offset ? parseInt(offset as string, 10) : 0,
      }),
      prisma.notification.count({ where }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, read: false },
    });
    
    res.json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          data: n.data ? JSON.parse(n.data) : null,
          read: n.read,
          createdAt: n.createdAt.toISOString(),
        })),
        unreadCount,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /notifications/unread-count - Get unread notification count
router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.id, read: false },
    });
    
    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        id: req.params.id,
        userId: req.user!.id,
      },
      data: { read: true },
    });
    
    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// PUT /notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /notifications/:id - Delete a notification
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.deleteMany({
      where: { 
        id: req.params.id,
        userId: req.user!.id,
      },
    });
    
    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /notifications - Clear all notifications
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user!.id },
    });
    
    res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// NOTIFICATION SETTINGS
// ==========================================

const updateSettingsSchema = z.object({
  pushEnabled: z.boolean().optional(),
  taskReminders: z.boolean().optional(),
  assignmentAlerts: z.boolean().optional(),
  streakReminders: z.boolean().optional(),
  dailyBriefing: z.boolean().optional(),
  levelUpAlerts: z.boolean().optional(),
  challengeUpdates: z.boolean().optional(),
  circleActivity: z.boolean().optional(),
  aiInsights: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  vibrationEnabled: z.boolean().optional(),
  badgeEnabled: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// GET /notifications/settings - Get notification settings
router.get('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user!.id },
      select: {
        pushEnabled: true,
        emailNotifications: true,
        remindersBefore: true,
        taskReminders: true,
        assignmentAlerts: true,
        streakReminders: true,
        dailyBriefing: true,
        levelUpAlerts: true,
        challengeUpdates: true,
        circleActivity: true,
        aiInsights: true,
        weeklyDigest: true,
        soundEnabled: true,
        vibrationEnabled: true,
        badgeEnabled: true,
        quietHoursEnabled: true,
        quietHoursStart: true,
        quietHoursEnd: true,
      },
    });
    
    res.json({
      success: true,
      data: settings || {
        pushEnabled: true,
        emailNotifications: true,
        remindersBefore: 15,
        taskReminders: true,
        assignmentAlerts: true,
        streakReminders: true,
        dailyBriefing: true,
        levelUpAlerts: true,
        challengeUpdates: true,
        circleActivity: true,
        aiInsights: true,
        weeklyDigest: true,
        soundEnabled: true,
        vibrationEnabled: true,
        badgeEnabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /notifications/settings - Update notification settings
router.put(
  '/settings',
  validateBody(updateSettingsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Build update object with only provided fields
      const updateData: any = {};
      const allowedFields = [
        'pushEnabled', 'taskReminders', 'assignmentAlerts', 'streakReminders',
        'dailyBriefing', 'levelUpAlerts', 'challengeUpdates', 'circleActivity',
        'aiInsights', 'weeklyDigest', 'soundEnabled', 'vibrationEnabled',
        'badgeEnabled', 'quietHoursEnabled', 'quietHoursStart', 'quietHoursEnd'
      ];
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      const settings = await prisma.userSettings.upsert({
        where: { userId: req.user!.id },
        create: {
          userId: req.user!.id,
          ...updateData,
        },
        update: updateData,
      });
      
      res.json({
        success: true,
        data: settings,
        message: 'Notification settings updated',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// TEST NOTIFICATIONS (DEV ONLY)
// ==========================================

// POST /notifications/test - Send test notification (for development)
router.post('/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pushService.sendPushNotification(req.user!.id, {
      title: '🧪 Test Notification',
      body: 'If you see this, push notifications are working!',
      data: { type: 'TEST', timestamp: Date.now() },
    });
    
    res.json({
      success: result.success,
      message: result.success 
        ? 'Test notification sent' 
        : `Failed: ${result.error}`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
