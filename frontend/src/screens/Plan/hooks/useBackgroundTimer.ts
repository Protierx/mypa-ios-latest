import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FocusTimer } from '../../../native/FocusTimer';

const FOCUS_SESSION_KEY = '@mypa_focus_session';

interface BackgroundTimerState {
  taskId: number;
  taskTitle: string;
  startTime: number;
  targetSeconds: number;
  isPaused: boolean;
  pausedAt?: number;
  accumulatedSeconds: number;
}

// Configure notification handler - only show when app is in background
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface UseBackgroundTimerProps {
  activeTimerId: number | null;
  isRecording: boolean;
  elapsedSeconds: number;
  setElapsedSeconds: React.Dispatch<React.SetStateAction<number>>;
  tasks: Array<{ id: number; title: string; durationMin: number }>;
}

export const useBackgroundTimer = ({
  activeTimerId,
  isRecording,
  elapsedSeconds,
  setElapsedSeconds,
  tasks,
}: UseBackgroundTimerProps) => {
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  const completionNotificationId = useRef<string | null>(null);
  const hasScheduledCompletion = useRef(false);
  const liveActivityId = useRef<string | null>(null);
  const lastUpdateTime = useRef<number>(0);

  // Request notification permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    };
    requestPermissions();
  }, []);

  // Start Live Activity when timer starts
  useEffect(() => {
    const manageLiveActivity = async () => {
      if (activeTimerId !== null && Platform.OS === 'ios') {
        const task = tasks.find(t => t.id === activeTimerId);
        if (task && !liveActivityId.current) {
          // Start Live Activity
          const id = await FocusTimer.startLiveActivity(task.title, task.durationMin);
          if (id) {
            liveActivityId.current = id;
          }
        }
      } else if (activeTimerId === null && liveActivityId.current) {
        // End Live Activity
        await FocusTimer.endLiveActivity();
        liveActivityId.current = null;
      }
    };
    
    manageLiveActivity();
  }, [activeTimerId, tasks]);

  // Update Live Activity periodically (every second when in foreground, slower in background)
  useEffect(() => {
    if (!liveActivityId.current || activeTimerId === null) return;
    
    // Throttle updates to every 1 second
    const now = Date.now();
    if (now - lastUpdateTime.current < 1000) return;
    lastUpdateTime.current = now;
    
    FocusTimer.updateLiveActivity(elapsedSeconds, !isRecording);
  }, [elapsedSeconds, isRecording, activeTimerId]);

  // Save session state for background recovery
  const saveSessionState = useCallback(async () => {
    if (activeTimerId === null) {
      await AsyncStorage.removeItem(FOCUS_SESSION_KEY);
      return;
    }

    const task = tasks.find(t => t.id === activeTimerId);
    if (!task) return;

    const state: BackgroundTimerState = {
      taskId: activeTimerId,
      taskTitle: task.title,
      startTime: Date.now() - (elapsedSeconds * 1000),
      targetSeconds: task.durationMin * 60,
      isPaused: !isRecording,
      accumulatedSeconds: elapsedSeconds,
    };

    await AsyncStorage.setItem(FOCUS_SESSION_KEY, JSON.stringify(state));
  }, [activeTimerId, isRecording, elapsedSeconds, tasks]);

  // Schedule ONLY the completion notification (when timer ends)
  const scheduleCompletionNotification = useCallback(async (taskTitle: string, remainingSeconds: number) => {
    // Don't schedule if already scheduled or no time remaining
    if (hasScheduledCompletion.current || remainingSeconds <= 0) return;

    // Cancel any existing completion notification first
    if (completionNotificationId.current) {
      await Notifications.cancelScheduledNotificationAsync(completionNotificationId.current);
    }

    // Schedule the completion notification
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Focus Session Complete!',
        body: `Great work on "${taskTitle}"! You've completed your focus time.`,
        sound: 'default',
        data: { type: 'focus_complete', taskTitle },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: remainingSeconds,
      },
    });
    
    completionNotificationId.current = id;
    hasScheduledCompletion.current = true;
  }, []);

  // Cancel all timer notifications
  const cancelTimerNotifications = useCallback(async () => {
    if (completionNotificationId.current) {
      await Notifications.cancelScheduledNotificationAsync(completionNotificationId.current);
      completionNotificationId.current = null;
    }
    hasScheduledCompletion.current = false;
    
    // Cancel any other scheduled focus notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'focus_complete') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (activeTimerId === null) {
        appState.current = nextAppState;
        return;
      }

      const task = tasks.find(t => t.id === activeTimerId);
      
      // App going to background
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
        
        // Save state
        await saveSessionState();
        
        // Schedule completion notification if recording (as backup to Live Activity)
        if (isRecording && task) {
          const remainingSeconds = Math.max(0, (task.durationMin * 60) - elapsedSeconds);
          if (remainingSeconds > 0) {
            await scheduleCompletionNotification(task.title, remainingSeconds);
          }
        }
      }
      
      // App coming to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Cancel the completion notification since user is back
        await cancelTimerNotifications();
        
        // Calculate time spent in background
        if (backgroundTime.current && isRecording) {
          const bgDuration = Math.floor((Date.now() - backgroundTime.current) / 1000);
          setElapsedSeconds(prev => prev + bgDuration);
        }
        
        backgroundTime.current = null;
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [activeTimerId, isRecording, elapsedSeconds, tasks, saveSessionState, scheduleCompletionNotification, cancelTimerNotifications, setElapsedSeconds]);

  // Cleanup when timer stops
  useEffect(() => {
    if (activeTimerId === null) {
      cancelTimerNotifications();
      hasScheduledCompletion.current = false;
      AsyncStorage.removeItem(FOCUS_SESSION_KEY);
      
      // End Live Activity
      if (liveActivityId.current) {
        FocusTimer.endLiveActivity();
        liveActivityId.current = null;
      }
    }
  }, [activeTimerId, cancelTimerNotifications]);

  return {
    saveSessionState,
    cancelTimerNotifications,
  };
};
