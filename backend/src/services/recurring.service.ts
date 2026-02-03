/**
 * Recurring Task Service for Mylo
 * 
 * Manages recurring task templates and generates instances.
 */

import { PrismaClient } from '@prisma/client';
import eventService from './event.service';

const prisma = new PrismaClient();

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  daysOfWeek?: number[];  // 0-6 (Sun-Sat) for weekly
  dayOfMonth?: number;    // 1-31 for monthly
  endDate?: Date;
  endAfterOccurrences?: number;
}

export interface CreateRecurringTaskInput {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  durationMin?: number;
  defaultTime?: string;  // "09:00"
  recurrence: RecurrenceRule;
}

export class RecurringTaskService {
  /**
   * Create a recurring task template
   */
  async createRecurringTask(userId: string, input: CreateRecurringTaskInput) {
    const {
      title,
      description,
      category = 'Personal',
      priority = 'NORMAL',
      durationMin = 30,
      defaultTime,
      recurrence,
    } = input;

    // Build recurrence rule string (simplified RRULE)
    let recurrenceRule = `FREQ=${recurrence.frequency}`;
    if (recurrence.interval > 1) {
      recurrenceRule += `;INTERVAL=${recurrence.interval}`;
    }
    if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
      const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      recurrenceRule += `;BYDAY=${recurrence.daysOfWeek.map(d => dayMap[d]).join(',')}`;
    }
    if (recurrence.dayOfMonth) {
      recurrenceRule += `;BYMONTHDAY=${recurrence.dayOfMonth}`;
    }

    // Calculate next due date
    const nextDueDate = this.calculateNextDueDate(recurrence, new Date());

    const template = await prisma.recurringTaskTemplate.create({
      data: {
        userId,
        title,
        description,
        category,
        priority,
        durationMin,
        defaultTime,
        recurrenceRule,
        frequency: recurrence.frequency,
        interval: recurrence.interval,
        daysOfWeek: recurrence.daysOfWeek ? JSON.stringify(recurrence.daysOfWeek) : null,
        dayOfMonth: recurrence.dayOfMonth,
        endDate: recurrence.endDate,
        endAfterOccurrences: recurrence.endAfterOccurrences,
        nextDueDate,
      },
    });

    // Log event
    await eventService.logEvent(userId, 'recurring_task_created', {
      taskTitle: title,
      frequency: recurrence.frequency,
      isRecurring: true,
    });

    // Generate the first instance
    await this.generateNextInstance(template.id);

    return template;
  }

  /**
   * Calculate the next due date based on recurrence rule
   */
  calculateNextDueDate(recurrence: RecurrenceRule, fromDate: Date): Date {
    const next = new Date(fromDate);
    next.setHours(0, 0, 0, 0);

    switch (recurrence.frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + recurrence.interval);
        break;

      case 'WEEKLY':
        if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
          // Find the next matching day of week
          const currentDay = next.getDay();
          const sortedDays = [...recurrence.daysOfWeek].sort((a, b) => a - b);
          
          let found = false;
          for (const day of sortedDays) {
            if (day > currentDay) {
              next.setDate(next.getDate() + (day - currentDay));
              found = true;
              break;
            }
          }
          
          if (!found) {
            // Go to next week's first matching day
            const daysUntilNextWeek = 7 - currentDay + sortedDays[0];
            next.setDate(next.getDate() + daysUntilNextWeek);
          }
        } else {
          next.setDate(next.getDate() + 7 * recurrence.interval);
        }
        break;

      case 'MONTHLY':
        if (recurrence.dayOfMonth) {
          next.setMonth(next.getMonth() + recurrence.interval);
          next.setDate(Math.min(recurrence.dayOfMonth, this.getDaysInMonth(next)));
        } else {
          next.setMonth(next.getMonth() + recurrence.interval);
        }
        break;

      case 'YEARLY':
        next.setFullYear(next.getFullYear() + recurrence.interval);
        break;
    }

    return next;
  }

  /**
   * Get days in a month
   */
  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * Generate the next task instance from a template
   */
  async generateNextInstance(templateId: string) {
    const template = await prisma.recurringTaskTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive || !template.nextDueDate) {
      return null;
    }

    // Check if we've reached the end conditions
    if (template.endDate && template.nextDueDate > template.endDate) {
      await prisma.recurringTaskTemplate.update({
        where: { id: templateId },
        data: { isActive: false },
      });
      return null;
    }

    if (
      template.endAfterOccurrences &&
      template.occurrencesGenerated >= template.endAfterOccurrences
    ) {
      await prisma.recurringTaskTemplate.update({
        where: { id: templateId },
        data: { isActive: false },
      });
      return null;
    }

    // Create the task instance
    const dateStr = template.nextDueDate.toISOString().split('T')[0];
    
    const task = await prisma.task.create({
      data: {
        userId: template.userId,
        title: template.title,
        description: template.description,
        category: template.category,
        priority: template.priority,
        durationMin: template.durationMin,
        date: dateStr,
        time: template.defaultTime,
        isRecurring: true,
        recurringTemplateId: template.id,
        recurrenceInstanceDate: template.nextDueDate,
      },
    });

    // Calculate the next due date
    const recurrence: RecurrenceRule = {
      frequency: template.frequency as any,
      interval: template.interval,
      daysOfWeek: template.daysOfWeek ? JSON.parse(template.daysOfWeek) : undefined,
      dayOfMonth: template.dayOfMonth || undefined,
      endDate: template.endDate || undefined,
      endAfterOccurrences: template.endAfterOccurrences || undefined,
    };

    const nextDueDate = this.calculateNextDueDate(recurrence, template.nextDueDate);

    // Update the template
    await prisma.recurringTaskTemplate.update({
      where: { id: templateId },
      data: {
        nextDueDate,
        lastGeneratedDate: template.nextDueDate,
        occurrencesGenerated: template.occurrencesGenerated + 1,
      },
    });

    return task;
  }

  /**
   * Get all recurring task templates for a user
   */
  async getRecurringTasks(userId: string, includeInactive = false) {
    return prisma.recurringTaskTemplate.findMany({
      where: {
        userId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update a recurring task template
   */
  async updateRecurringTask(
    templateId: string,
    userId: string,
    updates: Partial<CreateRecurringTaskInput>
  ) {
    const template = await prisma.recurringTaskTemplate.findFirst({
      where: { id: templateId, userId },
    });

    if (!template) {
      throw new Error('Recurring task not found');
    }

    const updateData: any = {};

    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category) updateData.category = updates.category;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.durationMin) updateData.durationMin = updates.durationMin;
    if (updates.defaultTime !== undefined) updateData.defaultTime = updates.defaultTime;

    if (updates.recurrence) {
      const recurrence = updates.recurrence;
      updateData.frequency = recurrence.frequency;
      updateData.interval = recurrence.interval;
      updateData.daysOfWeek = recurrence.daysOfWeek ? JSON.stringify(recurrence.daysOfWeek) : null;
      updateData.dayOfMonth = recurrence.dayOfMonth;
      updateData.endDate = recurrence.endDate;
      updateData.endAfterOccurrences = recurrence.endAfterOccurrences;

      // Recalculate next due date
      updateData.nextDueDate = this.calculateNextDueDate(recurrence, new Date());
    }

    return prisma.recurringTaskTemplate.update({
      where: { id: templateId },
      data: updateData,
    });
  }

  /**
   * Pause a recurring task
   */
  async pauseRecurringTask(templateId: string, userId: string) {
    return prisma.recurringTaskTemplate.updateMany({
      where: { id: templateId, userId },
      data: {
        isActive: false,
        pausedAt: new Date(),
      },
    });
  }

  /**
   * Resume a recurring task
   */
  async resumeRecurringTask(templateId: string, userId: string) {
    const template = await prisma.recurringTaskTemplate.findFirst({
      where: { id: templateId, userId },
    });

    if (!template) {
      throw new Error('Recurring task not found');
    }

    const recurrence: RecurrenceRule = {
      frequency: template.frequency as any,
      interval: template.interval,
      daysOfWeek: template.daysOfWeek ? JSON.parse(template.daysOfWeek) : undefined,
      dayOfMonth: template.dayOfMonth || undefined,
    };

    const nextDueDate = this.calculateNextDueDate(recurrence, new Date());

    return prisma.recurringTaskTemplate.update({
      where: { id: templateId },
      data: {
        isActive: true,
        pausedAt: null,
        nextDueDate,
      },
    });
  }

  /**
   * Delete a recurring task and optionally its instances
   */
  async deleteRecurringTask(templateId: string, userId: string, deleteInstances = false) {
    const template = await prisma.recurringTaskTemplate.findFirst({
      where: { id: templateId, userId },
    });

    if (!template) {
      throw new Error('Recurring task not found');
    }

    if (deleteInstances) {
      // Delete all task instances
      await prisma.task.deleteMany({
        where: { recurringTemplateId: templateId },
      });
    } else {
      // Just unlink the instances
      await prisma.task.updateMany({
        where: { recurringTemplateId: templateId },
        data: {
          recurringTemplateId: null,
          isRecurring: false,
        },
      });
    }

    // Delete the template
    return prisma.recurringTaskTemplate.delete({
      where: { id: templateId },
    });
  }

  /**
   * Generate instances for all due recurring tasks (run daily via scheduler)
   */
  async generateDueInstances() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueTemplates = await prisma.recurringTaskTemplate.findMany({
      where: {
        isActive: true,
        nextDueDate: {
          lte: tomorrow,
        },
      },
    });

    const generated: any[] = [];

    for (const template of dueTemplates) {
      const task = await this.generateNextInstance(template.id);
      if (task) {
        generated.push(task);
      }
    }

    return generated;
  }

  /**
   * Handle task completion for recurring tasks
   * Optionally generate the next instance immediately
   */
  async onRecurringTaskCompleted(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { recurringTemplate: true },
    });

    if (!task || !task.isRecurring || !task.recurringTemplate) {
      return;
    }

    // The next instance will be generated by the scheduler
    // But we can optionally generate it immediately if the user prefers
    // For now, we just log the completion
    await eventService.logEvent(task.userId, 'task_completed', {
      taskId: task.id,
      taskTitle: task.title,
      isRecurring: true,
      recurringTemplateId: task.recurringTemplateId,
    });
  }
}

export const recurringTaskService = new RecurringTaskService();
export default recurringTaskService;
