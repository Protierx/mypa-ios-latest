/**
 * useWidgets - Hook for iOS widget integration
 * 
 * Provides easy-to-use interface for updating iOS widgets
 * from anywhere in the app
 */

import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { widgetService, TaskWidgetData, FocusWidgetData, StatsWidgetData } from '../services/widgetService';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

/**
 * Hook to automatically sync widget data
 */
export function useWidgetSync() {
  const { user } = useAuth();
  
  // Sync widget data when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        syncAllWidgetData();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Initial sync
    syncAllWidgetData();
    
    return () => {
      subscription.remove();
    };
  }, [user]);
  
  // Sync all widget data
  const syncAllWidgetData = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    
    try {
      // Fetch latest data from API
      const [tasksRes, profileRes] = await Promise.all([
        api.get('/tasks?completed=false&limit=10'),
        api.get('/users/profile'),
      ]);
      
      const tasks = tasksRes.data?.data?.tasks || [];
      const userData = profileRes.data?.user || {};
      
      // Update tasks widget
      const taskWidgetData: TaskWidgetData['tasks'] = tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        dueTime: t.dueTime,
        priority: t.priority || 'medium',
      }));
      
      await widgetService.updateTasksWidget(taskWidgetData);
      
      // Update stats widget
      await widgetService.updateStatsWidget({
        streakDays: userData.streakDays || 0,
        totalXP: userData.xp || 0,
        rank: userData.rank || 0,
        level: userData.level || 1,
      });
      
      // Update greeting
      await widgetService.updateGreeting(
        widgetService.generateGreeting(user?.name?.split(' ')[0])
      );
      
    } catch (error) {
      console.error('Failed to sync widget data:', error);
    }
  }, [user]);
  
  return { syncAllWidgetData };
}

/**
 * Hook for managing focus widget data
 */
export function useFocusWidget() {
  const updateFocusWidget = useCallback(async (data: FocusWidgetData) => {
    await widgetService.updateFocusWidget(data);
  }, []);
  
  const startLiveActivity = useCallback(async (taskTitle: string, durationMinutes: number) => {
    return await widgetService.startFocusLiveActivity({
      taskTitle,
      targetSeconds: durationMinutes * 60,
    });
  }, []);
  
  const updateLiveActivity = useCallback(async (
    activityId: string,
    elapsedSeconds: number,
    isPaused: boolean
  ) => {
    await widgetService.updateFocusLiveActivity(activityId, elapsedSeconds, isPaused);
  }, []);
  
  const endLiveActivity = useCallback(async (activityId: string) => {
    await widgetService.endFocusLiveActivity(activityId);
  }, []);
  
  return {
    updateFocusWidget,
    startLiveActivity,
    updateLiveActivity,
    endLiveActivity,
  };
}

/**
 * Hook for managing tasks widget data
 */
export function useTasksWidget() {
  const updateTasksWidget = useCallback(async (tasks: TaskWidgetData['tasks']) => {
    await widgetService.updateTasksWidget(tasks);
    widgetService.reloadWidget('tasks');
  }, []);
  
  return { updateTasksWidget };
}

/**
 * Hook for managing stats widget data
 */
export function useStatsWidget() {
  const updateStatsWidget = useCallback(async (data: StatsWidgetData) => {
    await widgetService.updateStatsWidget(data);
    widgetService.reloadWidget('stats');
  }, []);
  
  return { updateStatsWidget };
}

export default { useWidgetSync, useFocusWidget, useTasksWidget, useStatsWidget };
