/**
 * Analytics Routes
 * User productivity metrics, trends, and insights
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import * as analyticsService from '../services/analytics.service.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ==========================================
// DAILY / WEEKLY STATS
// ==========================================

// GET /analytics/daily - Get daily stats for a specific date
router.get('/daily', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const dateStr = typeof date === 'string' ? date : new Date().toISOString().split('T')[0];
    
    const stats = await analyticsService.getDailyStats(req.user!.id, dateStr);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// GET /analytics/weekly - Get weekly stats
router.get('/weekly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { weekStart } = req.query;
    const start = typeof weekStart === 'string' ? new Date(weekStart) : undefined;
    
    const stats = await analyticsService.getWeeklyStats(req.user!.id, start);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// TRENDS & INSIGHTS
// ==========================================

// GET /analytics/trends - Get productivity trends
router.get('/trends', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trends = await analyticsService.getProductivityTrends(req.user!.id);
    
    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    next(error);
  }
});

// GET /analytics/insights - Get user insights and milestones
router.get('/insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const insights = await analyticsService.getUserInsights(req.user!.id);
    
    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// LEADERBOARDS
// ==========================================

// GET /analytics/leaderboard/global - Get global leaderboard
router.get('/leaderboard/global', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = req.query;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 50;
    
    const leaderboard = await analyticsService.getGlobalLeaderboard(Math.min(limitNum, 100));
    
    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
});

// GET /analytics/leaderboard/circle/:circleId - Get circle leaderboard
router.get('/leaderboard/circle/:circleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leaderboard = await analyticsService.getCircleLeaderboard(req.params.circleId);
    
    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CIRCLE ANALYTICS
// ==========================================

// GET /analytics/circle/:circleId - Get detailed circle analytics
router.get('/circle/:circleId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await analyticsService.getCircleAnalytics(req.params.circleId);
    
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// SUMMARY DASHBOARD
// ==========================================

// GET /analytics/dashboard - Get complete dashboard data
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch all dashboard data in parallel
    const [dailyStats, weeklyStats, insights] = await Promise.all([
      analyticsService.getDailyStats(userId, today),
      analyticsService.getWeeklyStats(userId),
      analyticsService.getUserInsights(userId),
    ]);
    
    res.json({
      success: true,
      data: {
        today: dailyStats,
        thisWeek: weeklyStats,
        insights: {
          level: insights.currentLevel,
          xp: insights.totalXp,
          xpToNextLevel: insights.xpToNextLevel,
          lifetimeStats: insights.lifetimeStats,
          milestones: insights.recentMilestones,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
