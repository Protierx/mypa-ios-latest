import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as userService from '../services/user.service.js';
import { validateBody } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(20).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  timezone: z.string().optional(),
  dailyGoalMinutes: z.number().min(1).max(720).optional(),
});

const updateSettingsSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  remindersBefore: z.number().min(0).max(60).optional(),
  voiceLanguage: z.enum(['en', 'ar']).optional(),
  voiceSpeed: z.enum(['slow', 'normal', 'fast']).optional(),
  voiceName: z.enum(['nova', 'alloy', 'shimmer']).optional(),
  profilePublic: z.boolean().optional(),
  showStreak: z.boolean().optional(),
  showLevel: z.boolean().optional(),
  focusSessionDefault: z.number().min(5).max(120).optional(),
  breakDuration: z.number().min(1).max(30).optional(),
  longBreakDuration: z.number().min(5).max(60).optional(),
  sessionsBeforeLongBreak: z.number().min(1).max(10).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

// GET /users/me - Get current user profile
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(req.user!.id);
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /users/me - Update current user profile
router.patch(
  '/me',
  validateBody(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.updateProfile(req.user!.id, req.body);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /users/me - Delete (deactivate) account
router.delete('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.deleteAccount(req.user!.id);
    
    res.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /users/me/stats - Get user statistics
router.get('/me/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await userService.getUserStats(req.user!.id);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// POST /users/me/onboarding - Complete onboarding
router.post('/me/onboarding', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.completeOnboarding(req.user!.id);
    
    res.json({
      success: true,
      data: user,
      message: 'Onboarding completed! +50 XP',
    });
  } catch (error) {
    next(error);
  }
});

// GET /users/check-username/:username - Check username availability
router.get('/check-username/:username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const available = await userService.checkUsernameAvailable(req.params.username);
    
    res.json({
      success: true,
      data: { available },
    });
  } catch (error) {
    next(error);
  }
});

// GET /users/:username - Get user by username (public profile)
router.get('/:username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserByUsername(req.params.username);
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// GET /users/me/settings - Get user settings
router.get('/me/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await userService.getSettings(req.user!.id);
    
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /users/me/settings - Update user settings
router.patch(
  '/me/settings',
  validateBody(updateSettingsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await userService.updateSettings(req.user!.id, req.body);
      
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
