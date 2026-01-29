/**
 * Push Notification Service
 * Expo Push Notifications for task reminders, assignments, and social activity
 */

import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import prisma from '../config/database.js';

// Create Expo SDK client
const expo = new Expo();

// ==========================================
// TYPES
// ==========================================

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  categoryId?: string;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number; // Time to live in seconds
}

export interface NotificationResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

// ==========================================
// TOKEN MANAGEMENT
// ==========================================

/**
 * Store or update a user's push token
 */
export async function savePushToken(userId: string, pushToken: string): Promise<boolean> {
  try {
    // Validate the token
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn('Invalid Expo push token:', pushToken);
      return false;
    }

    // Update user's push token
    await prisma.user.update({
      where: { id: userId },
      data: { 
        // We'll need to add this field to the schema
        // For now, store in UserSettings or a separate table
      },
    });

    // Store in push_tokens table (we'll create this)
    await prisma.pushToken.upsert({
      where: { token: pushToken },
      create: { userId, token: pushToken, platform: 'expo' },
      update: { userId, updatedAt: new Date() },
    });

    console.log(`Push token saved for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to save push token:', error);
    return false;
  }
}

/**
 * Remove a user's push token
 */
export async function removePushToken(userId: string): Promise<boolean> {
  try {
    await prisma.pushToken.deleteMany({
      where: { userId },
    });
    return true;
  } catch (error) {
    console.error('Failed to remove push token:', error);
    return false;
  }
}

/**
 * Get push tokens for user(s)
 */
export async function getPushTokens(userIds: string[]): Promise<Map<string, string>> {
  try {
    const tokens = await prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, token: true },
    });

    const tokenMap = new Map<string, string>();
    tokens.forEach(t => tokenMap.set(t.userId, t.token));
    return tokenMap;
  } catch (error) {
    console.error('Failed to get push tokens:', error);
    return new Map();
  }
}

// ==========================================
// SEND NOTIFICATIONS
// ==========================================

/**
 * Send push notification to a single user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<NotificationResult> {
  try {
    const tokenMap = await getPushTokens([userId]);
    const token = tokenMap.get(userId);

    if (!token) {
      return { success: false, error: 'No push token found for user' };
    }

    const message: ExpoPushMessage = {
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: payload.sound ?? 'default',
      badge: payload.badge,
      categoryId: payload.categoryId,
      channelId: payload.channelId ?? 'default',
      priority: payload.priority ?? 'high',
      ttl: payload.ttl,
    };

    const tickets = await expo.sendPushNotificationsAsync([message]);
    const ticket = tickets[0];

    if (ticket.status === 'ok') {
      // Store notification in database
      await storeNotification(userId, payload, ticket.id);
      return { success: true, ticketId: ticket.id };
    } else {
      return { success: false, error: ticket.message };
    }
  } catch (error: any) {
    console.error('Failed to send push notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notifications to multiple users
 */
export async function sendBulkPushNotifications(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<Map<string, NotificationResult>> {
  const results = new Map<string, NotificationResult>();
  
  try {
    const tokenMap = await getPushTokens(userIds);
    
    const messages: ExpoPushMessage[] = [];
    const userTokenPairs: { userId: string; token: string }[] = [];

    userIds.forEach(userId => {
      const token = tokenMap.get(userId);
      if (token && Expo.isExpoPushToken(token)) {
        messages.push({
          to: token,
          title: payload.title,
          body: payload.body,
          data: { ...payload.data, userId },
          sound: payload.sound ?? 'default',
          badge: payload.badge,
          channelId: payload.channelId ?? 'default',
          priority: payload.priority ?? 'high',
        });
        userTokenPairs.push({ userId, token });
      } else {
        results.set(userId, { success: false, error: 'Invalid or missing push token' });
      }
    });

    if (messages.length === 0) {
      return results;
    }

    // Send in chunks (Expo recommends max 100 per request)
    const chunks = expo.chunkPushNotifications(messages);
    const ticketChunks = await Promise.all(
      chunks.map(chunk => expo.sendPushNotificationsAsync(chunk))
    );

    const tickets = ticketChunks.flat();
    
    tickets.forEach((ticket, index) => {
      const userId = userTokenPairs[index]?.userId;
      if (userId) {
        if (ticket.status === 'ok') {
          results.set(userId, { success: true, ticketId: ticket.id });
          storeNotification(userId, payload, ticket.id);
        } else {
          results.set(userId, { success: false, error: ticket.message });
        }
      }
    });

    return results;
  } catch (error: any) {
    console.error('Failed to send bulk push notifications:', error);
    userIds.forEach(id => {
      if (!results.has(id)) {
        results.set(id, { success: false, error: error.message });
      }
    });
    return results;
  }
}

// ==========================================
// NOTIFICATION TYPES
// ==========================================

/**
 * Send task reminder notification
 */
export async function sendTaskReminder(
  userId: string,
  task: { id: string; title: string; time?: string }
): Promise<NotificationResult> {
  return sendPushNotification(userId, {
    title: '⏰ Task Reminder',
    body: task.title,
    data: {
      type: 'TASK_REMINDER',
      taskId: task.id,
      screen: 'Tasks',
    },
    categoryId: 'task_reminder',
    channelId: 'reminders',
    priority: 'high',
  });
}

/**
 * Send assignment notification
 */
export async function sendAssignmentNotification(
  userId: string,
  assignment: { id: string; title: string; creatorName: string; circleName: string }
): Promise<NotificationResult> {
  return sendPushNotification(userId, {
    title: `📋 New Mission from ${assignment.creatorName}`,
    body: `${assignment.title} in ${assignment.circleName}`,
    data: {
      type: 'NEW_ASSIGNMENT',
      assignmentId: assignment.id,
      screen: 'Inbox',
    },
    categoryId: 'assignment',
    channelId: 'circles',
    priority: 'high',
  });
}

/**
 * Send assignment completed notification (to creator)
 */
export async function sendAssignmentCompletedNotification(
  creatorId: string,
  assignment: { id: string; title: string; assigneeName: string; circleName: string }
): Promise<NotificationResult> {
  return sendPushNotification(creatorId, {
    title: `✅ Mission Completed!`,
    body: `${assignment.assigneeName} completed "${assignment.title}"`,
    data: {
      type: 'ASSIGNMENT_COMPLETED',
      assignmentId: assignment.id,
      screen: 'CircleHome',
    },
    categoryId: 'assignment',
    channelId: 'circles',
  });
}

/**
 * Send circle activity notification
 */
export async function sendCircleActivityNotification(
  userIds: string[],
  activity: { circleId: string; circleName: string; actorName: string; action: string }
): Promise<Map<string, NotificationResult>> {
  return sendBulkPushNotifications(userIds, {
    title: `${activity.circleName}`,
    body: `${activity.actorName} ${activity.action}`,
    data: {
      type: 'CIRCLE_ACTIVITY',
      circleId: activity.circleId,
      screen: 'CircleHome',
    },
    categoryId: 'circle',
    channelId: 'circles',
    priority: 'normal',
  });
}

/**
 * Send streak reminder notification
 */
export async function sendStreakReminder(
  userId: string,
  streak: number
): Promise<NotificationResult> {
  return sendPushNotification(userId, {
    title: '🔥 Keep Your Streak Alive!',
    body: `You're on a ${streak}-day streak! Complete a task today to keep it going.`,
    data: {
      type: 'STREAK_REMINDER',
      screen: 'Tasks',
    },
    categoryId: 'streak',
    channelId: 'reminders',
    priority: 'high',
  });
}

/**
 * Send daily briefing notification
 */
export async function sendDailyBriefing(
  userId: string,
  briefing: { taskCount: number; summary: string }
): Promise<NotificationResult> {
  return sendPushNotification(userId, {
    title: '☀️ Good Morning!',
    body: briefing.taskCount > 0 
      ? `You have ${briefing.taskCount} tasks today. ${briefing.summary}`
      : 'Your day is clear! Time to plan ahead.',
    data: {
      type: 'DAILY_BRIEFING',
      screen: 'Plan',
    },
    categoryId: 'briefing',
    channelId: 'briefings',
    priority: 'normal',
  });
}

/**
 * Send focus session completion notification
 */
export async function sendFocusCompleteNotification(
  userId: string,
  session: { minutes: number; xpEarned: number }
): Promise<NotificationResult> {
  return sendPushNotification(userId, {
    title: '🎉 Focus Session Complete!',
    body: `Great work! You focused for ${session.minutes} minutes and earned ${session.xpEarned} XP.`,
    data: {
      type: 'FOCUS_COMPLETE',
      screen: 'Hub',
    },
    categoryId: 'focus',
    channelId: 'default',
  });
}

/**
 * Send level up notification
 */
export async function sendLevelUpNotification(
  userId: string,
  level: number
): Promise<NotificationResult> {
  return sendPushNotification(userId, {
    title: '🎊 Level Up!',
    body: `Congratulations! You've reached Level ${level}!`,
    data: {
      type: 'LEVEL_UP',
      level,
      screen: 'Level',
    },
    categoryId: 'achievement',
    channelId: 'achievements',
    priority: 'high',
  });
}

/**
 * Send challenge notification
 */
export async function sendChallengeNotification(
  userId: string,
  challenge: { id: string; title: string; type: 'started' | 'ending' | 'completed' }
): Promise<NotificationResult> {
  const titles = {
    started: '🏆 Challenge Started!',
    ending: '⏰ Challenge Ending Soon!',
    completed: '🎉 Challenge Completed!',
  };

  const bodies = {
    started: `"${challenge.title}" has begun. Good luck!`,
    ending: `"${challenge.title}" ends in 1 hour. Finish strong!`,
    completed: `You completed "${challenge.title}"!`,
  };

  return sendPushNotification(userId, {
    title: titles[challenge.type],
    body: bodies[challenge.type],
    data: {
      type: 'CHALLENGE',
      challengeId: challenge.id,
      screen: 'Challenges',
    },
    categoryId: 'challenge',
    channelId: 'challenges',
    priority: challenge.type === 'ending' ? 'high' : 'normal',
  });
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Store notification in database for history
 */
async function storeNotification(
  userId: string,
  payload: PushNotificationPayload,
  ticketId?: string
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: payload.data?.type || 'GENERAL',
        title: payload.title,
        body: payload.body,
        data: payload.data ? JSON.stringify(payload.data) : null,
        read: false,
      },
    });
  } catch (error) {
    console.error('Failed to store notification:', error);
  }
}

/**
 * Schedule a notification (simplified - would need a job queue in production)
 * For now, uses in-memory setTimeout - not persistent across restarts
 */
export async function scheduleNotification(
  userId: string,
  payload: PushNotificationPayload,
  sendAt: Date
): Promise<{ scheduled: boolean; jobId?: string }> {
  // In production, use a job queue like Bull or BullMQ
  // For now, we'll use setTimeout for demo purposes
  const delay = sendAt.getTime() - Date.now();
  
  if (delay <= 0) {
    // Send immediately if time has passed
    await sendPushNotification(userId, payload);
    return { scheduled: false };
  }

  // Generate a simple job ID
  const jobId = `notif_${userId}_${Date.now()}`;

  // Schedule in-memory (not persistent)
  setTimeout(async () => {
    try {
      await sendPushNotification(userId, payload);
      console.log(`Scheduled notification ${jobId} sent to user ${userId}`);
    } catch (error) {
      console.error(`Failed to send scheduled notification ${jobId}:`, error);
    }
  }, Math.min(delay, 2147483647)); // setTimeout max is ~24 days

  console.log(`Notification scheduled for user ${userId} in ${Math.round(delay / 1000)}s`);
  return { scheduled: true, jobId };
}

export default {
  savePushToken,
  removePushToken,
  sendPushNotification,
  sendBulkPushNotifications,
  sendTaskReminder,
  sendAssignmentNotification,
  sendAssignmentCompletedNotification,
  sendCircleActivityNotification,
  sendStreakReminder,
  sendDailyBriefing,
  sendFocusCompleteNotification,
  sendLevelUpNotification,
  sendChallengeNotification,
  scheduleNotification,
};
