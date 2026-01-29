/**
 * Notification Scheduler Service
 * Handles scheduled notifications: daily briefings, streak reminders, task reminders
 */

import prisma from '../config/database.js';
import {
  sendDailyBriefing,
  sendStreakReminder,
  sendTaskReminder,
} from './push.service.js';

// Store scheduled timeouts (in production, use Redis/Bull queue)
const scheduledJobs = new Map<string, ReturnType<typeof setTimeout>>();

// ==========================================
// DAILY BRIEFING SCHEDULER
// ==========================================

/**
 * Send daily briefings to all users with push tokens
 */
export async function sendMorningBriefings() {
  console.log('📬 Sending morning briefings...');
  
  try {
    const pushTokens = await prisma.pushToken.findMany({
      select: { userId: true },
    });
    
    const userIds = [...new Set(pushTokens.map(t => t.userId))];
    const todayStr = new Date().toISOString().split('T')[0];

    let sentCount = 0;

    for (const userId of userIds) {
      const settings = await prisma.userSettings.findUnique({
        where: { userId },
      });
      
      if (settings?.pushEnabled === false) continue;

      const taskCount = await prisma.task.count({
        where: { userId, date: todayStr, completed: false },
      });

      const highPriorityTasks = await prisma.task.findMany({
        where: { userId, date: todayStr, completed: false, priority: 'HIGH' },
        take: 3,
      });

      const summary = highPriorityTasks.length > 0
        ? `Top priority: ${highPriorityTasks[0].title}`
        : 'Ready to tackle the day!';

      try {
        await sendDailyBriefing(userId, { taskCount, summary });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send briefing to user ${userId}:`, err);
      }
    }

    console.log(`✅ Sent ${sentCount} morning briefings`);
    return { sent: sentCount };
  } catch (error) {
    console.error('Failed to send morning briefings:', error);
    throw error;
  }
}

// ==========================================
// STREAK REMINDER SCHEDULER
// ==========================================

export async function sendStreakReminders() {
  console.log('🔥 Checking streak reminders...');
  
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const usersWithStreaks = await prisma.user.findMany({
      where: { currentStreak: { gt: 0 } },
      select: { id: true, currentStreak: true },
    });

    let sentCount = 0;

    for (const user of usersWithStreaks) {
      const hasToken = await prisma.pushToken.findFirst({
        where: { userId: user.id },
      });
      if (!hasToken) continue;
      
      const completedToday = await prisma.task.findFirst({
        where: {
          userId: user.id,
          completedAt: { gte: new Date(todayStr) },
        },
      });
      
      if (completedToday) continue;
      
      const settings = await prisma.userSettings.findUnique({
        where: { userId: user.id },
      });
      if (settings?.pushEnabled === false) continue;

      try {
        await sendStreakReminder(user.id, user.currentStreak);
        sentCount++;
      } catch (err) {
        console.error(`Failed to send streak reminder to user ${user.id}:`, err);
      }
    }

    console.log(`✅ Sent ${sentCount} streak reminders`);
    return { sent: sentCount };
  } catch (error) {
    console.error('Failed to send streak reminders:', error);
    throw error;
  }
}

// ==========================================
// TASK REMINDER SCHEDULER
// ==========================================

export function scheduleTaskReminder(
  taskId: string,
  userId: string,
  title: string,
  reminderTime: Date
): string {
  const jobId = `task_${taskId}`;
  
  cancelTaskReminder(taskId);
  
  const delay = reminderTime.getTime() - Date.now();
  
  if (delay <= 0) {
    console.log(`Task reminder time has passed for task ${taskId}`);
    return jobId;
  }
  
  const timeout = setTimeout(async () => {
    try {
      await sendTaskReminder(userId, { id: taskId, title });
      console.log(`✅ Sent task reminder for: ${title}`);
    } catch (error) {
      console.error(`Failed to send task reminder for ${taskId}:`, error);
    } finally {
      scheduledJobs.delete(jobId);
    }
  }, delay);
  
  scheduledJobs.set(jobId, timeout);
  console.log(`⏰ Task reminder scheduled for "${title}" in ${Math.round(delay / 60000)}m`);
  
  return jobId;
}

export function cancelTaskReminder(taskId: string): boolean {
  const jobId = `task_${taskId}`;
  const timeout = scheduledJobs.get(jobId);
  
  if (timeout) {
    clearTimeout(timeout);
    scheduledJobs.delete(jobId);
    return true;
  }
  
  return false;
}

export async function scheduleUpcomingTaskReminders() {
  console.log('📅 Scheduling upcoming task reminders...');
  
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    const tasks = await prisma.task.findMany({
      where: {
        completed: false,
        time: { not: null },
        date: { in: [todayStr, tomorrowStr] },
      },
    });

    let scheduledCount = 0;

    for (const task of tasks) {
      if (!task.date || !task.time) continue;
      
      const settings = await prisma.userSettings.findUnique({
        where: { userId: task.userId },
      });
      if (settings?.pushEnabled === false) continue;
      
      const [hours, minutes] = task.time.split(':').map(Number);
      const taskDate = new Date(task.date);
      taskDate.setHours(hours, minutes, 0, 0);
      
      const reminderTime = new Date(taskDate.getTime() - 15 * 60 * 1000);
      
      if (reminderTime > now) {
        scheduleTaskReminder(task.id, task.userId, task.title, reminderTime);
        scheduledCount++;
      }
    }

    console.log(`✅ Scheduled ${scheduledCount} task reminders`);
    return { scheduled: scheduledCount };
  } catch (error) {
    console.error('Failed to schedule task reminders:', error);
    throw error;
  }
}

// ==========================================
// INTERVAL JOBS
// ==========================================

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduler() {
  console.log('🚀 Starting notification scheduler...');
  
  scheduleUpcomingTaskReminders().catch(console.error);
  
  const checkScheduledNotifications = async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (hour === 8 && minute < 5) {
      await sendMorningBriefings().catch(console.error);
    }
    
    if (hour === 20 && minute < 5) {
      await sendStreakReminders().catch(console.error);
    }
  };
  
  schedulerInterval = setInterval(checkScheduledNotifications, 5 * 60 * 1000);
  
  checkScheduledNotifications().catch(console.error);
  
  setInterval(() => {
    scheduleUpcomingTaskReminders().catch(console.error);
  }, 60 * 60 * 1000);
  
  console.log('✅ Notification scheduler started');
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  
  scheduledJobs.forEach((timeout) => clearTimeout(timeout));
  scheduledJobs.clear();
  
  console.log('🛑 Notification scheduler stopped');
}

export default {
  sendMorningBriefings,
  sendStreakReminders,
  scheduleTaskReminder,
  cancelTaskReminder,
  scheduleUpcomingTaskReminders,
  startScheduler,
  stopScheduler,
};
