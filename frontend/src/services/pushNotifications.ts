/**
 * Push Notifications Service
 * Handles Expo push notifications registration and management
 */

import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useEffect, useRef, useState, useCallback } from 'react';
import { notificationsApi } from './api';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ==========================================
// TYPES
// ==========================================

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  taskReminders: boolean;
  circleActivity: boolean;
  streakReminders: boolean;
  dailyBriefing: boolean;
  dailyBriefingTime: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

// ==========================================
// REGISTRATION
// ==========================================

/**
 * Register for push notifications and get the token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Must use physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token: permission not granted');
    return null;
  }

  // Get the token
  try {
    // Try to get projectId from app.json via Constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.warn('No Expo project ID found in app.json. Push notifications may not work correctly.');
      console.warn('Add "extra.eas.projectId" to your app.json or set up EAS project with: npx eas init');
    }
    
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    token = tokenData.data;
    console.log('Push token:', token);
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }

  // Android-specific channel setup
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8EAAD8',
    });

    Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
    });

    Notifications.setNotificationChannelAsync('circles', {
      name: 'Circle Activity',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100, 100, 100],
      lightColor: '#8EAAD8',
    });

    Notifications.setNotificationChannelAsync('achievements', {
      name: 'Achievements',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });

    Notifications.setNotificationChannelAsync('briefings', {
      name: 'Daily Briefings',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#6366F1',
    });
  }

  return token;
}

/**
 * Register push token with backend
 */
export async function registerPushTokenWithBackend(token: string): Promise<boolean> {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const response = await notificationsApi.registerToken(token, platform);
    return response.success;
  } catch (error) {
    console.error('Failed to register token with backend:', error);
    return false;
  }
}

// ==========================================
// LOCAL NOTIFICATIONS
// ==========================================

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
  data?: Record<string, any>
): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger,
  });
  return identifier;
}

/**
 * Schedule a task reminder
 */
export async function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  reminderTime: Date
): Promise<string> {
  // Calculate seconds from now
  const seconds = Math.max(1, Math.floor((reminderTime.getTime() - Date.now()) / 1000));
  
  return scheduleLocalNotification(
    '⏰ Task Reminder',
    taskTitle,
    { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
    { type: 'TASK_REMINDER', taskId, screen: 'Tasks' }
  );
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

// ==========================================
// BADGE MANAGEMENT
// ==========================================

/**
 * Set app badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Clear badge
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

// ==========================================
// REACT HOOK
// ==========================================

interface UsePushNotificationsResult {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  register: () => Promise<boolean>;
  unregister: () => Promise<boolean>;
}

/**
 * Hook for managing push notifications in React components
 */
export function usePushNotifications(): UsePushNotificationsResult {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const register = useCallback(async (): Promise<boolean> => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        const success = await registerPushTokenWithBackend(token);
        setIsRegistered(success);
        return success;
      }
      return false;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return false;
    }
  }, []);

  const unregister = useCallback(async (): Promise<boolean> => {
    try {
      const response = await notificationsApi.removeToken();
      if (response.success) {
        setIsRegistered(false);
        setExpoPushToken(null);
      }
      return response.success;
    } catch (error) {
      console.error('Failed to unregister push token:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📬 Notification received:', notification);
      setNotification(notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('📬 Notification response:', response);
      const data = response.notification.request.content.data;
      
      // Handle navigation based on notification data
      if (data?.screen) {
        // Navigation would be handled by the component using this hook
        console.log('Navigate to:', data.screen, data);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    isRegistered,
    register,
    unregister,
  };
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export default {
  registerForPushNotificationsAsync,
  registerPushTokenWithBackend,
  scheduleLocalNotification,
  scheduleTaskReminder,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
  getScheduledNotifications,
  setBadgeCount,
  getBadgeCount,
  clearBadge,
  areNotificationsEnabled,
  requestNotificationPermissions,
  usePushNotifications,
};
