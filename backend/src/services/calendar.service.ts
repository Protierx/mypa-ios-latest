/**
 * Calendar Integration Service for Mylo
 * 
 * Provides bidirectional sync with Apple Calendar and Google Calendar.
 * Handles calendar event import, export, and real-time sync.
 * 
 * Updated to match the actual Prisma schema field names.
 */

import { PrismaClient } from '@prisma/client';
import eventService from './event.service';

const prisma = new PrismaClient();

export type CalendarProvider = 'apple' | 'google' | 'outlook';

export interface CalendarConnectionConfig {
  provider: CalendarProvider;
  accessToken: string;
  refreshToken?: string;
  calendarIds?: string[];
  syncEnabled?: boolean;
}

export interface ExternalCalendarEvent {
  externalId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isAllDay?: boolean;
  attendees?: string[];
  recurrence?: string;
  status?: string;
  calendarId: string;
}

export class CalendarService {
  /**
   * Connect a calendar provider
   */
  async connectCalendar(userId: string, config: CalendarConnectionConfig) {
    // Check for existing connection
    const existing = await prisma.calendarConnection.findFirst({
      where: { userId, provider: config.provider },
    });

    const calendarIdsJson = JSON.stringify(config.calendarIds || ['primary']);

    if (existing) {
      // Update existing connection
      const connection = await prisma.calendarConnection.update({
        where: { id: existing.id },
        data: {
          accessToken: config.accessToken,
          refreshToken: config.refreshToken,
          calendarIds: calendarIdsJson,
          syncEnabled: config.syncEnabled ?? true,
          lastSyncedAt: null,
          syncErrors: null,
        },
      });

      await eventService.logEvent(userId, 'calendar_connected', {
        provider: config.provider,
        action: 'reconnected',
      });

      return connection;
    }

    // Create new connection
    const connection = await prisma.calendarConnection.create({
      data: {
        userId,
        provider: config.provider,
        accessToken: config.accessToken,
        refreshToken: config.refreshToken,
        calendarIds: calendarIdsJson,
        syncEnabled: config.syncEnabled ?? true,
      },
    });

    await eventService.logEvent(userId, 'calendar_connected', {
      provider: config.provider,
      action: 'connected',
    });

    return connection;
  }

  /**
   * Disconnect a calendar provider
   */
  async disconnectCalendar(userId: string, provider: CalendarProvider) {
    const connection = await prisma.calendarConnection.findFirst({
      where: { userId, provider },
    });

    if (!connection) {
      throw new Error('Calendar connection not found');
    }

    // Delete synced events from this provider
    await prisma.calendarEvent.deleteMany({
      where: { userId, provider },
    });

    // Delete the connection
    await prisma.calendarConnection.delete({
      where: { id: connection.id },
    });

    await eventService.logEvent(userId, 'calendar_connected', {
      provider,
      action: 'disconnected',
    });

    return { success: true };
  }

  /**
   * Get all calendar connections for a user
   */
  async getCalendarConnections(userId: string) {
    return prisma.calendarConnection.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        calendarIds: true,
        syncEnabled: true,
        lastSyncedAt: true,
        syncErrors: true,
        createdAt: true,
      },
    });
  }

  /**
   * Sync events from external calendar
   * In production, this would call the actual calendar API
   */
  async syncFromCalendar(connectionId: string) {
    const connection = await prisma.calendarConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection || !connection.syncEnabled) {
      throw new Error('Calendar connection not found or sync disabled');
    }

    try {
      // In production, this would fetch from actual calendar API
      const externalEvents = await this.fetchExternalEvents(connection);

      let imported = 0;
      let updated = 0;
      let skipped = 0;

      for (const event of externalEvents) {
        // Check if event already exists
        const existing = await prisma.calendarEvent.findFirst({
          where: {
            userId: connection.userId,
            externalId: event.externalId,
            provider: connection.provider,
          },
        });

        if (existing) {
          // Update if changed
          const hasChanged = 
            existing.title !== event.title ||
            existing.startTime.getTime() !== event.startTime.getTime() ||
            existing.endTime.getTime() !== event.endTime.getTime();

          if (hasChanged) {
            await prisma.calendarEvent.update({
              where: { id: existing.id },
              data: {
                title: event.title,
                description: event.description,
                startTime: event.startTime,
                endTime: event.endTime,
                location: event.location,
                isAllDay: event.isAllDay || false,
                lastSyncedAt: new Date(),
              },
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          // Create new calendar event
          await prisma.calendarEvent.create({
            data: {
              userId: connection.userId,
              externalId: event.externalId,
              provider: connection.provider,
              calendarId: event.calendarId,
              title: event.title,
              description: event.description,
              startTime: event.startTime,
              endTime: event.endTime,
              location: event.location,
              isAllDay: event.isAllDay || false,
              status: event.status || 'confirmed',
            },
          });
          imported++;
        }
      }

      // Update sync status
      await prisma.calendarConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncedAt: new Date(),
          syncErrors: null,
        },
      });

      await eventService.logEvent(connection.userId, 'calendar_synced', {
        provider: connection.provider,
        imported,
        updated,
        skipped,
      });

      return { imported, updated, skipped, total: externalEvents.length };
    } catch (error: any) {
      // Log sync error
      await prisma.calendarConnection.update({
        where: { id: connectionId },
        data: {
          syncErrors: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Fetch events from external calendar provider
   * This is a placeholder - would implement actual API calls
   */
  private async fetchExternalEvents(connection: any): Promise<ExternalCalendarEvent[]> {
    // In production, this would call:
    // - Apple Calendar: EventKit (via native module)
    // - Google Calendar: Google Calendar API
    // - Outlook: Microsoft Graph API

    switch (connection.provider) {
      case 'apple':
        return this.fetchAppleCalendarEvents(connection);
      case 'google':
        return this.fetchGoogleCalendarEvents(connection);
      case 'outlook':
        return this.fetchOutlookCalendarEvents(connection);
      default:
        return [];
    }
  }

  /**
   * Fetch from Apple Calendar (via native module bridge)
   */
  private async fetchAppleCalendarEvents(connection: any): Promise<ExternalCalendarEvent[]> {
    // This would communicate with the iOS native module
    console.log('Apple Calendar sync would happen via native module');
    return [];
  }

  /**
   * Fetch from Google Calendar API
   */
  private async fetchGoogleCalendarEvents(connection: any): Promise<ExternalCalendarEvent[]> {
    console.log('Google Calendar API sync placeholder');
    return [];
  }

  /**
   * Fetch from Microsoft Outlook/Graph API
   */
  private async fetchOutlookCalendarEvents(connection: any): Promise<ExternalCalendarEvent[]> {
    console.log('Outlook Calendar API sync placeholder');
    return [];
  }

  /**
   * Export a Mylo task to external calendar
   */
  async exportTaskToCalendar(taskId: string, connectionId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const connection = await prisma.calendarConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection || !connection.syncEnabled) {
      throw new Error('Calendar connection not found or sync disabled');
    }

    // In production, this would create an event in the external calendar
    await eventService.logEvent(task.userId, 'task_exported', {
      taskId,
      provider: connection.provider,
    });

    return {
      success: true,
      message: `Task exported to ${connection.provider} calendar`,
    };
  }

  /**
   * Get calendar events for a date range
   */
  async getCalendarEvents(userId: string, startDate: Date, endDate: Date) {
    return prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Get merged timeline (tasks + calendar events)
   */
  async getMergedTimeline(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dateStr = date.toISOString().split('T')[0];

    // Get tasks for the day
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        date: dateStr,
      },
      orderBy: { time: 'asc' },
    });

    // Get calendar events for the day
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Merge and sort by time
    const timeline: any[] = [];

    for (const task of tasks) {
      timeline.push({
        type: 'task',
        id: task.id,
        title: task.title,
        time: task.time,
        startTime: task.time ? new Date(`${dateStr}T${task.time}`) : null,
        duration: task.durationMin,
        category: task.category,
        priority: task.priority,
        completed: task.completed,
        data: task,
      });
    }

    for (const event of calendarEvents) {
      timeline.push({
        type: 'calendar',
        id: event.id,
        title: event.title,
        time: event.startTime.toTimeString().slice(0, 5),
        startTime: event.startTime,
        endTime: event.endTime,
        duration: Math.round((event.endTime.getTime() - event.startTime.getTime()) / 60000),
        location: event.location,
        isAllDay: event.isAllDay,
        provider: event.provider,
        data: event,
      });
    }

    // Sort by start time
    timeline.sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.getTime() - b.startTime.getTime();
    });

    return timeline;
  }

  /**
   * Find scheduling conflicts
   */
  async findConflicts(userId: string, startTime: Date, endTime: Date, excludeTaskId?: string) {
    const conflicts: any[] = [];

    // Check against other tasks
    const dateStr = startTime.toISOString().split('T')[0];
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        date: dateStr,
        time: { not: null },
        ...(excludeTaskId ? { id: { not: excludeTaskId } } : {}),
      },
    });

    for (const task of tasks) {
      if (!task.time || !task.durationMin) continue;

      const taskStart = new Date(`${dateStr}T${task.time}`);
      const taskEnd = new Date(taskStart.getTime() + task.durationMin * 60000);

      if (startTime < taskEnd && endTime > taskStart) {
        conflicts.push({
          type: 'task',
          id: task.id,
          title: task.title,
          startTime: taskStart,
          endTime: taskEnd,
        });
      }
    }

    // Check against calendar events
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        userId,
        isAllDay: false,
        OR: [
          {
            startTime: { lte: endTime },
            endTime: { gte: startTime },
          },
        ],
      },
    });

    for (const event of calendarEvents) {
      if (startTime < event.endTime && endTime > event.startTime) {
        conflicts.push({
          type: 'calendar',
          id: event.id,
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
        });
      }
    }

    return conflicts;
  }

  /**
   * Suggest optimal time slots for a task
   */
  async suggestTimeSlots(
    userId: string,
    date: Date,
    durationMin: number,
    preferences?: {
      preferredTimes?: string[];
      avoidMeetings?: boolean;
    }
  ) {
    const suggestions: any[] = [];

    // Define time blocks
    const timeBlocks = {
      morning: { start: 9, end: 12 },
      afternoon: { start: 13, end: 17 },
      evening: { start: 18, end: 21 },
    };

    const preferredBlocks = preferences?.preferredTimes || ['morning', 'afternoon'];

    // Find free slots
    for (const blockName of preferredBlocks) {
      const block = timeBlocks[blockName as keyof typeof timeBlocks];
      if (!block) continue;

      // Check each 30-min slot in the block
      for (let hour = block.start; hour < block.end; hour++) {
        for (const minute of [0, 30]) {
          const slotStart = new Date(date);
          slotStart.setHours(hour, minute, 0, 0);

          const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

          // Skip if end time goes past the block
          if (slotEnd.getHours() > block.end) continue;

          // Check for conflicts
          const conflicts = await this.findConflicts(userId, slotStart, slotEnd);

          if (conflicts.length === 0) {
            suggestions.push({
              startTime: slotStart,
              endTime: slotEnd,
              timeBlock: blockName,
              formattedTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
              score: this.calculateSlotScore(slotStart, blockName, preferredBlocks),
            });
          }
        }
      }
    }

    // Sort by score (best slots first)
    suggestions.sort((a, b) => b.score - a.score);

    // Return top 5 suggestions
    return suggestions.slice(0, 5);
  }

  /**
   * Calculate a score for a time slot based on preferences
   */
  private calculateSlotScore(slotStart: Date, blockName: string, preferredBlocks: string[]): number {
    let score = 100;

    // Higher score for preferred blocks
    const blockIndex = preferredBlocks.indexOf(blockName);
    if (blockIndex >= 0) {
      score += (preferredBlocks.length - blockIndex) * 10;
    }

    // Prefer round hours over half hours
    if (slotStart.getMinutes() === 0) {
      score += 5;
    }

    // Slight preference for earlier times in the day
    score -= slotStart.getHours();

    return score;
  }
}

export const calendarService = new CalendarService();
export default calendarService;
