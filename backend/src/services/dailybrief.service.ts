/**
 * Daily Brief Service for Mylo
 * 
 * Generates personalized daily briefings based on user patterns,
 * upcoming tasks, calendar events, and AI insights.
 */

import { PrismaClient } from '@prisma/client';
import learningService from './learning.service';
import calendarService from './calendar.service';
import recurringTaskService from './recurring.service';
import OpenAI from 'openai';
import { env } from '../config/env';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface DailyBrief {
  greeting: string;
  summary: string;
  todaysTasks: TaskPreview[];
  upcomingEvents: EventPreview[];
  insights: DailyInsight[];
  focusSuggestion: FocusSuggestion | null;
  motivationalMessage: string;
  weatherAffectedTasks?: string[];
  generatedAt: Date;
}

export interface TaskPreview {
  id: string;
  title: string;
  time: string | null;
  priority: string;
  category: string;
  estimatedDuration: number;
  isOverdue?: boolean;
}

export interface EventPreview {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  provider: string;
}

export interface DailyInsight {
  type: 'productivity' | 'pattern' | 'suggestion' | 'streak' | 'achievement';
  title: string;
  description: string;
  actionable?: {
    action: string;
    target?: string;
  };
}

export interface FocusSuggestion {
  suggestedTime: string;
  duration: number;
  reason: string;
  taskToFocusOn?: {
    id: string;
    title: string;
  };
}

class DailyBriefService {
  /**
   * Generate the daily brief for a user
   */
  async generateDailyBrief(userId: string): Promise<DailyBrief> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const hour = today.getHours();

    // Gather all necessary data in parallel
    const [
      todaysTasks,
      overdueTasks,
      timeline,
      userModel,
      suggestions,
      streakInfo,
    ] = await Promise.all([
      this.getTodaysTasks(userId, todayStr),
      this.getOverdueTasks(userId, todayStr),
      calendarService.getMergedTimeline(userId, today),
      prisma.userModel.findUnique({ where: { userId } }),
      learningService.getSuggestions(userId),
      this.getStreakInfo(userId),
    ]);

    // Combine today's and overdue tasks
    const allTasks = [...overdueTasks.map(t => ({ ...t, isOverdue: true })), ...todaysTasks];

    // Format tasks for brief
    const taskPreviews: TaskPreview[] = allTasks.map(task => ({
      id: task.id,
      title: task.title,
      time: task.time,
      priority: task.priority,
      category: task.category,
      estimatedDuration: task.durationMin || 30,
      isOverdue: (task as any).isOverdue || false,
    }));

    // Format calendar events
    const calendarEvents = timeline.filter(item => item.type === 'calendar');
    const eventPreviews: EventPreview[] = calendarEvents.map(event => ({
      id: event.id,
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime || new Date(event.startTime.getTime() + event.duration * 60000),
      location: event.location,
      provider: event.provider || 'calendar',
    }));

    // Generate insights
    const insights: DailyInsight[] = await this.generateInsights(
      userId,
      allTasks,
      userModel,
      suggestions,
      streakInfo
    );

    // Generate focus suggestion
    const focusSuggestion = await this.generateFocusSuggestion(
      userId,
      allTasks,
      userModel,
      timeline
    );

    // Generate greeting and summary
    const { greeting, summary } = await this.generateGreetingAndSummary(
      user.name || 'there',
      hour,
      taskPreviews,
      eventPreviews,
      insights
    );

    // Get motivational message
    const motivationalMessage = await this.getMotivationalMessage(
      streakInfo,
      taskPreviews.length
    );

    return {
      greeting,
      summary,
      todaysTasks: taskPreviews,
      upcomingEvents: eventPreviews,
      insights,
      focusSuggestion,
      motivationalMessage,
      generatedAt: new Date(),
    };
  }

  /**
   * Get today's tasks
   */
  private async getTodaysTasks(userId: string, dateStr: string) {
    return prisma.task.findMany({
      where: {
        userId,
        date: dateStr,
        completed: false,
      },
      orderBy: [
        { time: 'asc' },
        { priority: 'desc' },
      ],
    });
  }

  /**
   * Get overdue tasks
   */
  private async getOverdueTasks(userId: string, todayStr: string) {
    return prisma.task.findMany({
      where: {
        userId,
        date: { lt: todayStr },
        completed: false,
      },
      orderBy: { date: 'asc' },
      take: 5,
    });
  }

  /**
   * Get streak information
   */
  private async getStreakInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        lastActiveDate: true,
        xp: true,
        level: true,
      },
    });

    return {
      currentStreak: user?.currentStreak || 0,
      lastActive: user?.lastActiveDate,
      totalXp: user?.xp || 0,
      level: user?.level || 1,
    };
  }

  /**
   * Generate personalized insights
   */
  private async generateInsights(
    userId: string,
    tasks: any[],
    userModel: any,
    suggestions: any,
    streakInfo: any
  ): Promise<DailyInsight[]> {
    const insights: DailyInsight[] = [];

    // Streak insight
    if (streakInfo.currentStreak > 0) {
      insights.push({
        type: 'streak',
        title: `${streakInfo.currentStreak}-Day Streak! 🔥`,
        description: streakInfo.currentStreak >= 7
          ? 'Amazing consistency! You\'re building great habits.'
          : 'Keep it up to build your momentum!',
      });
    }

    // Productivity pattern insight
    if (userModel?.peakHours) {
      const peakHours = JSON.parse(userModel.peakHours);
      if (peakHours.length > 0) {
        const peakFormatted = peakHours.slice(0, 2).map((h: number) => 
          `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`
        ).join('-');
        
        insights.push({
          type: 'pattern',
          title: 'Your Peak Hours',
          description: `You're most productive around ${peakFormatted}. Schedule important tasks then!`,
        });
      }
    }

    // Task load insight
    const highPriorityTasks = tasks.filter(t => t.priority === 'HIGH');
    if (highPriorityTasks.length >= 3) {
      insights.push({
        type: 'suggestion',
        title: 'Heavy Day Ahead',
        description: `You have ${highPriorityTasks.length} high-priority tasks. Consider batching similar tasks together.`,
        actionable: {
          action: 'view_tasks',
          target: 'high_priority',
        },
      });
    }

    // Overdue tasks insight
    const overdueTasks = tasks.filter(t => (t as any).isOverdue);
    if (overdueTasks.length > 0) {
      insights.push({
        type: 'productivity',
        title: 'Catch Up Time',
        description: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Tackle them first or reschedule.`,
        actionable: {
          action: 'view_overdue',
        },
      });
    }

    // AI suggestions insight
    if (suggestions?.scheduling?.length > 0) {
      const topSuggestion = suggestions.scheduling[0];
      insights.push({
        type: 'suggestion',
        title: 'AI Recommendation',
        description: topSuggestion.message,
      });
    }

    return insights.slice(0, 4); // Limit to 4 insights
  }

  /**
   * Generate focus session suggestion
   */
  private async generateFocusSuggestion(
    userId: string,
    tasks: any[],
    userModel: any,
    timeline: any[]
  ): Promise<FocusSuggestion | null> {
    if (tasks.length === 0) return null;

    // Find the most important task to focus on
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1, NORMAL: 1 };
      return (priorityOrder[b.priority as keyof typeof priorityOrder] || 1) - 
             (priorityOrder[a.priority as keyof typeof priorityOrder] || 1);
    });

    const taskToFocus = sortedTasks[0];

    // Determine suggested time
    let suggestedTime = '09:00';
    let reason = 'Start your day with your most important task';

    if (userModel?.peakHours) {
      const peakHours = JSON.parse(userModel.peakHours);
      const currentHour = new Date().getHours();
      
      // Find the next peak hour
      const nextPeak = peakHours.find((h: number) => h > currentHour) || peakHours[0];
      suggestedTime = `${nextPeak.toString().padStart(2, '0')}:00`;
      reason = 'This is one of your peak productivity hours';
    }

    // Check for calendar conflicts
    const suggestedStart = new Date();
    const [hours, minutes] = suggestedTime.split(':');
    suggestedStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const duration = taskToFocus.durationMin || 45;
    const suggestedEnd = new Date(suggestedStart.getTime() + duration * 60000);

    const conflicts = await calendarService.findConflicts(userId, suggestedStart, suggestedEnd);
    
    if (conflicts.length > 0) {
      // Find a free slot
      const slots = await calendarService.suggestTimeSlots(userId, new Date(), duration);
      if (slots.length > 0) {
        suggestedTime = slots[0].formattedTime;
        reason = 'This slot is free in your calendar';
      }
    }

    return {
      suggestedTime,
      duration,
      reason,
      taskToFocusOn: {
        id: taskToFocus.id,
        title: taskToFocus.title,
      },
    };
  }

  /**
   * Generate greeting and summary using AI
   */
  private async generateGreetingAndSummary(
    name: string,
    hour: number,
    tasks: TaskPreview[],
    events: EventPreview[],
    insights: DailyInsight[]
  ) {
    let greeting: string;
    
    if (hour < 12) {
      greeting = `Good morning, ${name}! ☀️`;
    } else if (hour < 17) {
      greeting = `Good afternoon, ${name}! 🌤️`;
    } else {
      greeting = `Good evening, ${name}! 🌙`;
    }

    // Generate summary
    const taskCount = tasks.length;
    const eventCount = events.length;
    const highPriorityCount = tasks.filter(t => t.priority === 'HIGH').length;
    const overdueCount = tasks.filter(t => t.isOverdue).length;

    let summary = '';

    if (taskCount === 0 && eventCount === 0) {
      summary = 'You have a clear day ahead. Perfect time to get ahead on future tasks or take a well-deserved break!';
    } else {
      const parts: string[] = [];
      
      if (taskCount > 0) {
        parts.push(`${taskCount} task${taskCount > 1 ? 's' : ''}`);
      }
      if (eventCount > 0) {
        parts.push(`${eventCount} event${eventCount > 1 ? 's' : ''}`);
      }
      
      summary = `You have ${parts.join(' and ')} today.`;
      
      if (highPriorityCount > 0) {
        summary += ` ${highPriorityCount} ${highPriorityCount > 1 ? 'are' : 'is'} high priority.`;
      }
      
      if (overdueCount > 0) {
        summary += ` ${overdueCount} ${overdueCount > 1 ? 'tasks are' : 'task is'} overdue.`;
      }
    }

    return { greeting, summary };
  }

  /**
   * Get motivational message
   */
  private async getMotivationalMessage(streakInfo: any, taskCount: number): Promise<string> {
    const messages = {
      newUser: [
        'Every journey begins with a single step. Let\'s make today count! 🚀',
        'Welcome to Mylo! Ready to turn your plans into achievements?',
        'Your potential is unlimited. Let\'s unlock it together! 💪',
      ],
      streakBuilding: [
        'Consistency is the key to mastery. You\'re on the right track! 🎯',
        'Small daily improvements lead to stunning results. Keep going!',
        'You\'re building momentum. Don\'t stop now! 🔥',
      ],
      highStreak: [
        'Your dedication is inspiring! You\'re in the top 10% of Mylo users! 🏆',
        'Champions are made of habits like yours. Keep crushing it!',
        'Your consistency is your superpower! 💫',
      ],
      lightDay: [
        'Light schedule today? Perfect for deep work or personal development!',
        'Sometimes less is more. Make today\'s tasks count! ✨',
      ],
      busyDay: [
        'Big day ahead! Remember: one task at a time, one step at a time. 💪',
        'You\'ve got a lot planned, but you\'ve got this! Focus on progress, not perfection.',
      ],
    };

    let category: keyof typeof messages;

    if (streakInfo.currentStreak === 0) {
      category = 'newUser';
    } else if (streakInfo.currentStreak >= 14) {
      category = 'highStreak';
    } else if (streakInfo.currentStreak > 0) {
      category = 'streakBuilding';
    } else if (taskCount <= 2) {
      category = 'lightDay';
    } else {
      category = 'busyDay';
    }

    const categoryMessages = messages[category];
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  }

  /**
   * Generate evening recap
   */
  async generateEveningRecap(userId: string) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get today's completed and incomplete tasks
    const [completedTasks, incompleteTasks] = await Promise.all([
      prisma.task.findMany({
        where: { userId, date: todayStr, completed: true },
      }),
      prisma.task.findMany({
        where: { userId, date: todayStr, completed: false },
      }),
    ]);

    // Get focus sessions
    const focusSessions = await prisma.focusSession.findMany({
      where: {
        userId,
        startedAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });

    const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.actualMinutes || 0), 0);
    const completionRate = completedTasks.length / (completedTasks.length + incompleteTasks.length) || 0;

    return {
      completedCount: completedTasks.length,
      incompleteCount: incompleteTasks.length,
      completionRate: Math.round(completionRate * 100),
      focusMinutes: totalFocusMinutes,
      topCategories: this.getTopCategories(completedTasks),
      tomorrowPreview: await this.getTomorrowPreview(userId),
    };
  }

  private getTopCategories(tasks: any[]) {
    const categoryCount: Record<string, number> = {};
    tasks.forEach(task => {
      const cat = task.category || 'Personal';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));
  }

  private async getTomorrowPreview(userId: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const tasks = await prisma.task.findMany({
      where: { userId, date: tomorrowStr },
    });

    return {
      taskCount: tasks.length,
      highPriorityCount: tasks.filter(t => t.priority === 'HIGH').length,
    };
  }
}

export const dailyBriefService = new DailyBriefService();
export default dailyBriefService;
