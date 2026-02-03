/**
 * Unlock Routes for Mylo
 * 
 * Endpoints for progressive feature unlocks and celebrations.
 */

import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import unlockService, { FeatureKey, FEATURE_UNLOCKS } from '../services/unlock.service';
import learningService from '../services/learning.service';

const router = express.Router();

// Use userId from request set by auth middleware
type AuthRequest = Request & { userId?: string };

/**
 * GET /api/unlocks
 * Get all unlock statuses for the current user
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const statuses = await unlockService.getUnlockStatuses(userId);

    // Enrich with feature info
    const enrichedStatuses = statuses.map(status => ({
      ...status,
      info: FEATURE_UNLOCKS[status.feature],
    }));

    res.json({
      success: true,
      data: enrichedStatuses,
    });
  } catch (error) {
    console.error('[Unlocks] Error getting statuses:', error);
    res.status(500).json({ success: false, error: 'Failed to get unlock statuses' });
  }
});

/**
 * POST /api/unlocks/check
 * Check and process any new unlocks
 * Returns newly unlocked features for celebration
 */
router.post('/check', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const newUnlocks = await unlockService.checkAndProcessUnlocks(userId);

    if (newUnlocks.length > 0) {
      res.json({
        success: true,
        data: {
          newUnlocks: newUnlocks.map(feature => ({
            feature,
            info: FEATURE_UNLOCKS[feature],
          })),
        },
      });
    } else {
      res.json({
        success: true,
        data: { newUnlocks: [] },
      });
    }
  } catch (error) {
    console.error('[Unlocks] Error checking unlocks:', error);
    res.status(500).json({ success: false, error: 'Failed to check unlocks' });
  }
});

/**
 * GET /api/unlocks/pending
 * Get unlocks that haven't been celebrated yet
 */
router.get('/pending', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const pendingCelebrations = await unlockService.getPendingCelebrations(userId);

    res.json({
      success: true,
      data: pendingCelebrations,
    });
  } catch (error) {
    console.error('[Unlocks] Error getting pending celebrations:', error);
    res.status(500).json({ success: false, error: 'Failed to get pending celebrations' });
  }
});

/**
 * POST /api/unlocks/:feature/seen
 * Mark an unlock as seen (after celebration modal)
 */
router.post('/:feature/seen', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { feature } = req.params;

    if (!FEATURE_UNLOCKS[feature as FeatureKey]) {
      return res.status(400).json({ success: false, error: 'Invalid feature' });
    }

    await unlockService.markUnlockSeen(userId, feature as FeatureKey);

    res.json({ success: true });
  } catch (error) {
    console.error('[Unlocks] Error marking unlock seen:', error);
    res.status(500).json({ success: false, error: 'Failed to mark unlock as seen' });
  }
});

/**
 * GET /api/unlocks/:feature
 * Check if a specific feature is unlocked
 */
router.get('/:feature', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { feature } = req.params;

    if (!FEATURE_UNLOCKS[feature as FeatureKey]) {
      return res.status(400).json({ success: false, error: 'Invalid feature' });
    }

    const isUnlocked = await unlockService.isFeatureUnlocked(userId, feature as FeatureKey);

    res.json({
      success: true,
      data: {
        feature,
        isUnlocked,
        info: FEATURE_UNLOCKS[feature as FeatureKey],
      },
    });
  } catch (error) {
    console.error('[Unlocks] Error checking feature:', error);
    res.status(500).json({ success: false, error: 'Failed to check feature unlock' });
  }
});

/**
 * GET /api/unlocks/features/all
 * Get all available features and their requirements
 */
router.get('/features/all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: FEATURE_UNLOCKS,
    });
  } catch (error) {
    console.error('[Unlocks] Error getting features:', error);
    res.status(500).json({ success: false, error: 'Failed to get features' });
  }
});

/**
 * GET /api/unlocks/insights
 * Get AI-powered insights based on unlocked features
 */
router.get('/insights', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Check which insight-related features are unlocked
    const isPeakHoursUnlocked = await unlockService.isFeatureUnlocked(userId, 'peak_hours');
    const isPatternInsightsUnlocked = await unlockService.isFeatureUnlocked(userId, 'pattern_insights');

    const insights: any = {};

    if (isPeakHoursUnlocked) {
      const isPeakNow = await learningService.isPeakHour(userId);
      insights.isPeakHour = isPeakNow;
    }

    if (isPatternInsightsUnlocked) {
      const suggestions = await learningService.getSuggestions(userId);
      insights.suggestions = suggestions;
    }

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('[Unlocks] Error getting insights:', error);
    res.status(500).json({ success: false, error: 'Failed to get insights' });
  }
});

export default router;
