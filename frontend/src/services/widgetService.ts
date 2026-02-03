/**
 * WidgetService - iOS Widget integration for Mylo
 * 
 * From design spec Section 15:
 * - Small widget: Tasks + progress
 * - Medium widget: Tasks + Focus
 * - Large widget: Daily overview
 * - Lock screen widgets
 */

import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Widget data types
export interface TaskWidgetData {
  tasks: {
    id: string;
    title: string;
    completed: boolean;
    dueTime?: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  totalTasks: number;
  completedTasks: number;
}

export interface FocusWidgetData {
  focusMinutesToday: number;
  focusGoalMinutes: number;
  isCurrentlyFocusing: boolean;
  currentFocusTitle?: string;
  currentFocusEndTime?: string;
}

export interface StatsWidgetData {
  streakDays: number;
  totalXP: number;
  rank: number;
  level: number;
}

export interface WidgetData {
  tasks: TaskWidgetData;
  focus: FocusWidgetData;
  stats: StatsWidgetData;
  greeting: string;
  lastUpdated: string;
}

// Storage key for widget data
const WIDGET_DATA_KEY = 'widget_data';

// App Group identifier for sharing data with widgets
const APP_GROUP = 'group.com.mypa.app';

class WidgetService {
  /**
   * Update widget data (stored in App Group for widget access)
   */
  async updateWidgetData(data: Partial<WidgetData>): Promise<void> {
    if (Platform.OS !== 'ios') return;
    
    try {
      // Get existing data
      const existingData = await this.getWidgetData();
      
      // Merge with new data
      const updatedData: WidgetData = {
        ...existingData,
        ...data,
        lastUpdated: new Date().toISOString(),
      };
      
      // Store in AsyncStorage (for RN access)
      await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(updatedData));
      
      // Store in App Group (for widget access)
      if (NativeModules.SharedStorage) {
        await NativeModules.SharedStorage.setItem(
          WIDGET_DATA_KEY,
          JSON.stringify(updatedData),
          APP_GROUP
        );
      }
      
      // Trigger widget refresh
      this.reloadWidgets();
    } catch (error) {
      console.error('Failed to update widget data:', error);
    }
  }
  
  /**
   * Get current widget data
   */
  async getWidgetData(): Promise<WidgetData> {
    try {
      const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to get widget data:', error);
    }
    
    // Return default data
    return this.getDefaultWidgetData();
  }
  
  /**
   * Update tasks for widget
   */
  async updateTasksWidget(tasks: TaskWidgetData['tasks']): Promise<void> {
    const completed = tasks.filter(t => t.completed).length;
    
    await this.updateWidgetData({
      tasks: {
        tasks: tasks.slice(0, 5), // Max 5 tasks for widget
        totalTasks: tasks.length,
        completedTasks: completed,
      },
    });
  }
  
  /**
   * Update focus data for widget
   */
  async updateFocusWidget(data: FocusWidgetData): Promise<void> {
    await this.updateWidgetData({ focus: data });
  }
  
  /**
   * Update stats for widget
   */
  async updateStatsWidget(data: StatsWidgetData): Promise<void> {
    await this.updateWidgetData({ stats: data });
  }
  
  /**
   * Update greeting message
   */
  async updateGreeting(greeting: string): Promise<void> {
    await this.updateWidgetData({ greeting });
  }
  
  /**
   * Reload all widgets
   */
  reloadWidgets(): void {
    if (Platform.OS !== 'ios') return;
    
    try {
      // Try react-native-widgetkit
      const WidgetKit = require('react-native-widgetkit');
      if (WidgetKit?.reloadAllTimelines) {
        WidgetKit.reloadAllTimelines();
      }
    } catch (error) {
      console.log('WidgetKit not available');
    }
  }
  
  /**
   * Reload specific widget kind
   */
  reloadWidget(kind: 'tasks' | 'focus' | 'stats' | 'overview'): void {
    if (Platform.OS !== 'ios') return;
    
    const widgetKindMap = {
      tasks: 'TasksWidget',
      focus: 'FocusWidget',
      stats: 'StatsWidget',
      overview: 'OverviewWidget',
    };
    
    try {
      const WidgetKit = require('react-native-widgetkit');
      if (WidgetKit?.reloadTimelines) {
        WidgetKit.reloadTimelines(widgetKindMap[kind]);
      }
    } catch (error) {
      console.log('WidgetKit not available');
    }
  }
  
  /**
   * Generate contextual greeting based on time
   */
  generateGreeting(userName?: string): string {
    const hour = new Date().getHours();
    const name = userName || 'there';
    
    if (hour < 12) {
      return `Good morning, ${name}!`;
    } else if (hour < 17) {
      return `Good afternoon, ${name}!`;
    } else {
      return `Good evening, ${name}!`;
    }
  }
  
  /**
   * Get default widget data
   */
  private getDefaultWidgetData(): WidgetData {
    return {
      tasks: {
        tasks: [],
        totalTasks: 0,
        completedTasks: 0,
      },
      focus: {
        focusMinutesToday: 0,
        focusGoalMinutes: 180, // 3 hours default
        isCurrentlyFocusing: false,
      },
      stats: {
        streakDays: 0,
        totalXP: 0,
        rank: 0,
        level: 1,
      },
      greeting: this.generateGreeting(),
      lastUpdated: new Date().toISOString(),
    };
  }
  
  /**
   * Start a live activity for focus timer (iOS 16.1+)
   */
  async startFocusLiveActivity(params: {
    taskTitle: string;
    targetSeconds: number;
  }): Promise<string | null> {
    if (Platform.OS !== 'ios') return null;
    
    try {
      const { default: FocusTimerModule } = await import('../native/FocusTimerModule');
      const activityId = await FocusTimerModule.startLiveActivity(
        params.taskTitle,
        params.targetSeconds
      );
      return activityId;
    } catch (error) {
      console.error('Failed to start live activity:', error);
      return null;
    }
  }
  
  /**
   * Update live activity state
   */
  async updateFocusLiveActivity(
    activityId: string,
    elapsedSeconds: number,
    isPaused: boolean
  ): Promise<void> {
    if (Platform.OS !== 'ios') return;
    
    try {
      const { default: FocusTimerModule } = await import('../native/FocusTimerModule');
      await FocusTimerModule.updateLiveActivity(activityId, elapsedSeconds, isPaused);
    } catch (error) {
      console.error('Failed to update live activity:', error);
    }
  }
  
  /**
   * End live activity
   */
  async endFocusLiveActivity(activityId: string): Promise<void> {
    if (Platform.OS !== 'ios') return;
    
    try {
      const { default: FocusTimerModule } = await import('../native/FocusTimerModule');
      await FocusTimerModule.endLiveActivity(activityId);
    } catch (error) {
      console.error('Failed to end live activity:', error);
    }
  }
}

export const widgetService = new WidgetService();
export default widgetService;
