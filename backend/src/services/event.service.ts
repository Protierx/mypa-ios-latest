/**
 * Event Logging Service for Mylo
 * 
 * Tracks user behavior for AI learning and personalization.
 * Events are logged asynchronously and processed in batches.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Event type definitions
export type EventType =
  | 'app_opened'
  | 'app_backgrounded'
  | 'app_foregrounded'
  | 'screen_viewed'
  | 'task_created'
  | 'task_completed'
  | 'task_deleted'
  | 'task_edited'
  | 'task_deferred'
  | 'focus_started'
  | 'focus_completed'
  | 'focus_abandoned'
  | 'focus_paused'
  | 'focus_resumed'
  | 'voice_command_started'
  | 'voice_command_completed'
  | 'voice_command_failed'
  | 'text_command_sent'
  | 'ai_response_received'
  | 'ai_suggestion_accepted'
  | 'ai_suggestion_rejected'
  | 'streak_continued'
  | 'streak_broken'
  | 'achievement_unlocked'
  | 'feature_unlocked'
  | 'level_up'
  | 'xp_gained'
  | 'challenge_joined'
  | 'challenge_completed'
  | 'challenge_progress'
  | 'circle_joined'
  | 'circle_left'
  | 'assignment_received'
  | 'assignment_completed'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'settings_changed'
  | 'notification_received'
  | 'notification_opened'
  | 'quick_capture_used'
  | 'widget_tapped'
  | 'calendar_synced'
  | 'calendar_connected'
  | 'task_exported'
  | 'recurring_task_created';

export interface EventMetadata {
  // Screen context
  screen?: string;
  previousScreen?: string;
  
  // Task-related
  taskId?: string;
  taskTitle?: string;
  taskCategory?: string;
  taskPriority?: string;
  taskDurationMin?: number;
  
  // Focus-related
  focusSessionId?: string;
  focusDurationMin?: number;
  focusCategory?: string;
  
  // Voice/AI-related
  voiceDurationMs?: number;
  aiResponseTimeMs?: number;
  intent?: string;
  confidence?: number;
  
  // Gamification
  xpAmount?: number;
  newLevel?: number;
  streakDay?: number;
  achievementCode?: string;
  featureUnlocked?: string;
  
  // Challenge
  challengeId?: string;
  challengeProgress?: number;
  
  // Circle
  circleId?: string;
  
  // General
  source?: string;  // 'voice', 'text', 'tap', 'swipe', 'widget'
  isRecurring?: boolean;
  
  // Custom data
  [key: string]: any;
}

export class EventService {
  private sessionId: string | null = null;

  /**
   * Log a single event
   */
  async logEvent(
    userId: string,
    type: EventType,
    metadata: EventMetadata = {}
  ): Promise<void> {
    try {
      await prisma.userEvent.create({
        data: {
          userId,
          type,
          screen: metadata.screen,
          metadata: JSON.stringify(metadata),
          sessionId: this.sessionId,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Log errors but don't throw - events are non-critical
      console.error('[EventService] Failed to log event:', error);
    }
  }

  /**
   * Log multiple events in a batch (more efficient)
   */
  async logEvents(
    userId: string,
    events: Array<{ type: EventType; metadata?: EventMetadata }>
  ): Promise<void> {
    try {
      await prisma.userEvent.createMany({
        data: events.map((event) => ({
          userId,
          type: event.type,
          screen: event.metadata?.screen,
          metadata: JSON.stringify(event.metadata || {}),
          sessionId: this.sessionId,
          timestamp: new Date(),
        })),
      });
    } catch (error) {
      console.error('[EventService] Failed to log batch events:', error);
    }
  }

  /**
   * Start a new session (call on app open)
   */
  startSession(): string {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.sessionId;
  }

  /**
   * Get events for a user within a date range
   */
  async getEvents(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      types?: EventType[];
      limit?: number;
    } = {}
  ) {
    const { startDate, endDate, types, limit = 100 } = options;

    return prisma.userEvent.findMany({
      where: {
        userId,
        ...(startDate && { timestamp: { gte: startDate } }),
        ...(endDate && { timestamp: { lte: endDate } }),
        ...(types && { type: { in: types } }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get event counts by type for analytics
   */
  async getEventStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const events = await prisma.userEvent.groupBy({
      by: ['type'],
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    return events.reduce((acc, event) => {
      acc[event.type] = event._count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get hourly distribution of events (for peak hours detection)
   */
  async getHourlyDistribution(
    userId: string,
    eventTypes: EventType[],
    days: number = 30
  ): Promise<number[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await prisma.userEvent.findMany({
      where: {
        userId,
        type: { in: eventTypes },
        timestamp: { gte: startDate },
      },
      select: { timestamp: true },
    });

    // Initialize 24-hour array
    const hourCounts = new Array(24).fill(0);

    events.forEach((event) => {
      const hour = event.timestamp.getHours();
      hourCounts[hour]++;
    });

    return hourCounts;
  }

  /**
   * Get productivity score by day of week
   */
  async getDayOfWeekStats(
    userId: string,
    days: number = 90
  ): Promise<{ day: number; tasksCompleted: number; focusMinutes: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await prisma.userEvent.findMany({
      where: {
        userId,
        type: { in: ['task_completed', 'focus_completed'] },
        timestamp: { gte: startDate },
      },
      select: {
        type: true,
        timestamp: true,
        metadata: true,
      },
    });

    // Initialize 7-day array (0 = Sunday)
    const dayStats = Array.from({ length: 7 }, (_, i) => ({
      day: i,
      tasksCompleted: 0,
      focusMinutes: 0,
    }));

    events.forEach((event) => {
      const dayOfWeek = event.timestamp.getDay();
      if (event.type === 'task_completed') {
        dayStats[dayOfWeek].tasksCompleted++;
      } else if (event.type === 'focus_completed') {
        try {
          const meta = JSON.parse(event.metadata || '{}');
          dayStats[dayOfWeek].focusMinutes += meta.focusDurationMin || 0;
        } catch {}
      }
    });

    return dayStats;
  }

  /**
   * Mark events as processed (for batch learning job)
   */
  async markEventsProcessed(eventIds: string[]): Promise<void> {
    await prisma.userEvent.updateMany({
      where: { id: { in: eventIds } },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Get unprocessed events for batch learning
   */
  async getUnprocessedEvents(
    userId: string,
    limit: number = 1000
  ) {
    return prisma.userEvent.findMany({
      where: {
        userId,
        processed: false,
      },
      orderBy: { timestamp: 'asc' },
      take: limit,
    });
  }

  /**
   * Clean up old events (retention policy)
   */
  async cleanupOldEvents(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.userEvent.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
        processed: true,
      },
    });

    return result.count;
  }
}

export const eventService = new EventService();
export default eventService;
