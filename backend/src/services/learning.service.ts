/**
 * AI Learning Service for Mylo
 * 
 * Processes user events to build personalized models.
 * Runs as both real-time updates and batch processing.
 */

import { PrismaClient } from '@prisma/client';
import eventService from './event.service';

const prisma = new PrismaClient();

export interface PeakHour {
  hour: number;
  score: number;
}

export interface ProductivityPattern {
  type: string;
  description: string;
  confidence: number;
  data: any;
}

export interface DurationEstimate {
  category: string;
  avgMinutes: number;
  count: number;
  stdDev: number;
}

export class LearningService {
  /**
   * Initialize or get user model
   */
  async getOrCreateUserModel(userId: string) {
    let model = await prisma.userModel.findUnique({
      where: { userId },
    });

    if (!model) {
      model = await prisma.userModel.create({
        data: { userId },
      });
    }

    return model;
  }

  /**
   * Analyze peak productivity hours from events
   */
  async analyzePeakHours(userId: string, days: number = 30): Promise<PeakHour[]> {
    const hourlyDistribution = await eventService.getHourlyDistribution(
      userId,
      ['task_completed', 'focus_completed'],
      days
    );

    const total = hourlyDistribution.reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    // Calculate scores (0-1) for each hour
    const maxCount = Math.max(...hourlyDistribution);
    const peakHours: PeakHour[] = hourlyDistribution.map((count, hour) => ({
      hour,
      score: maxCount > 0 ? count / maxCount : 0,
    }));

    // Sort by score descending
    return peakHours.sort((a, b) => b.score - a.score);
  }

  /**
   * Detect productivity patterns
   */
  async detectPatterns(userId: string): Promise<ProductivityPattern[]> {
    const patterns: ProductivityPattern[] = [];
    const dayStats = await eventService.getDayOfWeekStats(userId, 90);

    // Find best day for tasks
    const bestTaskDay = dayStats.reduce((best, current) =>
      current.tasksCompleted > best.tasksCompleted ? current : best
    );

    if (bestTaskDay.tasksCompleted > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      patterns.push({
        type: 'best_task_day',
        description: `You complete the most tasks on ${dayNames[bestTaskDay.day]}`,
        confidence: 0.7,
        data: { day: bestTaskDay.day, count: bestTaskDay.tasksCompleted },
      });
    }

    // Find best day for focus
    const bestFocusDay = dayStats.reduce((best, current) =>
      current.focusMinutes > best.focusMinutes ? current : best
    );

    if (bestFocusDay.focusMinutes > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      patterns.push({
        type: 'best_focus_day',
        description: `You focus best on ${dayNames[bestFocusDay.day]}`,
        confidence: 0.7,
        data: { day: bestFocusDay.day, minutes: bestFocusDay.focusMinutes },
      });
    }

    // Analyze task completion patterns
    const completionEvents = await prisma.userEvent.findMany({
      where: {
        userId,
        type: 'task_completed',
        timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { timestamp: true },
    });

    if (completionEvents.length >= 10) {
      // Check for morning person pattern
      const morningCompletions = completionEvents.filter(e => {
        const hour = e.timestamp.getHours();
        return hour >= 6 && hour < 12;
      }).length;

      if (morningCompletions / completionEvents.length > 0.5) {
        patterns.push({
          type: 'morning_person',
          description: 'You\'re most productive in the morning',
          confidence: morningCompletions / completionEvents.length,
          data: { morningRatio: morningCompletions / completionEvents.length },
        });
      }

      // Check for evening person pattern
      const eveningCompletions = completionEvents.filter(e => {
        const hour = e.timestamp.getHours();
        return hour >= 18 && hour < 24;
      }).length;

      if (eveningCompletions / completionEvents.length > 0.4) {
        patterns.push({
          type: 'evening_person',
          description: 'You\'re often productive in the evening',
          confidence: eveningCompletions / completionEvents.length,
          data: { eveningRatio: eveningCompletions / completionEvents.length },
        });
      }
    }

    return patterns;
  }

  /**
   * Calculate task duration estimates by category
   */
  async calculateDurationEstimates(userId: string): Promise<DurationEstimate[]> {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        completed: true,
        completedAt: { not: null },
      },
      select: {
        category: true,
        durationMin: true,
        createdAt: true,
        completedAt: true,
      },
    });

    // Group by category
    const categoryStats: Record<string, number[]> = {};
    
    tasks.forEach(task => {
      if (!categoryStats[task.category]) {
        categoryStats[task.category] = [];
      }
      
      // Use actual duration if available, otherwise use planned duration
      if (task.completedAt) {
        const actualMinutes = Math.round(
          (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60)
        );
        // Only use reasonable durations (1 min to 8 hours)
        if (actualMinutes > 0 && actualMinutes < 480) {
          categoryStats[task.category].push(actualMinutes);
        } else {
          categoryStats[task.category].push(task.durationMin);
        }
      }
    });

    const estimates: DurationEstimate[] = [];

    for (const [category, durations] of Object.entries(categoryStats)) {
      if (durations.length >= 3) {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length;
        const stdDev = Math.sqrt(variance);

        estimates.push({
          category,
          avgMinutes: Math.round(avg),
          count: durations.length,
          stdDev: Math.round(stdDev * 10) / 10,
        });
      }
    }

    return estimates;
  }

  /**
   * Full model update (run daily or on significant events)
   */
  async updateUserModel(userId: string): Promise<void> {
    const model = await this.getOrCreateUserModel(userId);

    // Analyze peak hours
    const peakHours = await this.analyzePeakHours(userId);
    const topPeakHours = peakHours
      .filter(ph => ph.score > 0.5)
      .map(ph => ph.hour)
      .slice(0, 5);

    // Detect patterns
    const patterns = await this.detectPatterns(userId);

    // Calculate duration estimates
    const durationEstimates = await this.calculateDurationEstimates(userId);

    // Get day of week stats
    const dayStats = await eventService.getDayOfWeekStats(userId);
    const bestTaskDay = dayStats.reduce((best, current) =>
      current.tasksCompleted > best.tasksCompleted ? current : best
    );
    const bestFocusDay = dayStats.reduce((best, current) =>
      current.focusMinutes > best.focusMinutes ? current : best
    );

    // Calculate confidence scores
    const unprocessedEvents = await eventService.getUnprocessedEvents(userId, 1000);
    const totalEvents = model.totalEventsAnalyzed + unprocessedEvents.length;
    const peakHoursConfidence = Math.min(1, totalEvents / 100);
    const patternConfidence = Math.min(1, totalEvents / 200);

    // Update the model
    await prisma.userModel.update({
      where: { userId },
      data: {
        peakHours: JSON.stringify(topPeakHours),
        bestDayForTasks: bestTaskDay.tasksCompleted > 0 ? bestTaskDay.day : null,
        bestDayForFocus: bestFocusDay.focusMinutes > 0 ? bestFocusDay.day : null,
        patterns: JSON.stringify(patterns),
        durationEstimates: JSON.stringify(
          durationEstimates.reduce((acc, est) => {
            acc[est.category] = est.avgMinutes;
            return acc;
          }, {} as Record<string, number>)
        ),
        peakHoursConfidence,
        patternConfidence,
        totalEventsAnalyzed: totalEvents,
        lastAnalyzedAt: new Date(),
      },
    });

    // Mark events as processed
    if (unprocessedEvents.length > 0) {
      await eventService.markEventsProcessed(unprocessedEvents.map(e => e.id));
    }
  }

  /**
   * Get personalized suggestions based on user model
   */
  async getSuggestions(userId: string): Promise<string[]> {
    const model = await this.getOrCreateUserModel(userId);
    const suggestions: string[] = [];

    try {
      const peakHours = JSON.parse(model.peakHours || '[]');
      const patterns = JSON.parse(model.patterns || '[]');

      // Peak hours suggestion
      if (peakHours.length > 0 && model.peakHoursConfidence > 0.3) {
        const peakHour = peakHours[0];
        const period = peakHour < 12 ? 'morning' : peakHour < 17 ? 'afternoon' : 'evening';
        suggestions.push(`Your peak productivity is in the ${period}. Schedule important tasks around ${peakHour}:00.`);
      }

      // Pattern-based suggestions
      patterns.forEach((pattern: ProductivityPattern) => {
        if (pattern.confidence > 0.5) {
          switch (pattern.type) {
            case 'morning_person':
              suggestions.push('You\'re a morning person! Try tackling your hardest tasks before noon.');
              break;
            case 'evening_person':
              suggestions.push('You get a second wind in the evening. Save complex tasks for later.');
              break;
            case 'best_task_day':
              suggestions.push(pattern.description);
              break;
          }
        }
      });

      // Best day suggestions
      if (model.bestDayForFocus !== null) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        suggestions.push(`${dayNames[model.bestDayForFocus]} is great for deep focus work.`);
      }

    } catch (error) {
      console.error('[LearningService] Error generating suggestions:', error);
    }

    return suggestions;
  }

  /**
   * Get estimated duration for a task based on learned patterns
   */
  async estimateTaskDuration(userId: string, category: string, title: string): Promise<number | null> {
    const model = await this.getOrCreateUserModel(userId);

    try {
      const estimates = JSON.parse(model.durationEstimates || '{}');
      
      if (estimates[category]) {
        return estimates[category];
      }

      // Default estimates by category
      const defaults: Record<string, number> = {
        'Personal': 30,
        'Work': 45,
        'Health': 30,
        'Learning': 45,
        'Errands': 20,
        'Social': 60,
      };

      return defaults[category] || 30;
    } catch {
      return 30;
    }
  }

  /**
   * Check if current time is a peak hour for the user
   */
  async isPeakHour(userId: string): Promise<boolean> {
    const model = await this.getOrCreateUserModel(userId);
    const currentHour = new Date().getHours();

    try {
      const peakHours = JSON.parse(model.peakHours || '[]');
      return peakHours.includes(currentHour);
    } catch {
      return false;
    }
  }
}

export const learningService = new LearningService();
export default learningService;
