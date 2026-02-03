/**
 * FocusTimerModule - Native module wrapper for iOS Live Activities
 * 
 * This module bridges to the native iOS FocusTimerModule for Live Activities.
 * Falls back gracefully when native module is not available.
 */

import { NativeModules, Platform } from 'react-native';

const { FocusTimerModule: NativeFocusTimerModule } = NativeModules;

// Check if the native module exists (only on iOS with proper build)
const isModuleAvailable = Platform.OS === 'ios' && NativeFocusTimerModule != null;

const FocusTimerModule = {
  /**
   * Start a live activity for focus session
   */
  startLiveActivity: async (taskTitle: string, targetSeconds: number): Promise<string> => {
    if (!isModuleAvailable) {
      console.log('Live Activity not available - native module not loaded');
      return '';
    }
    try {
      const activityId = await NativeFocusTimerModule.startLiveActivity(taskTitle, targetSeconds);
      return activityId || '';
    } catch (error) {
      console.log('Failed to start Live Activity:', error);
      return '';
    }
  },

  /**
   * Update a live activity with current state
   */
  updateLiveActivity: async (activityId: string, elapsedSeconds: number, isPaused: boolean): Promise<void> => {
    if (!isModuleAvailable) return;
    try {
      await NativeFocusTimerModule.updateLiveActivity(activityId, elapsedSeconds, isPaused);
    } catch (error) {
      console.log('Failed to update Live Activity:', error);
    }
  },

  /**
   * End a live activity
   */
  endLiveActivity: async (activityId: string): Promise<void> => {
    if (!isModuleAvailable) return;
    try {
      await NativeFocusTimerModule.endLiveActivity(activityId);
    } catch (error) {
      console.log('Failed to end Live Activity:', error);
    }
  },

  /**
   * Check if live activities are supported
   */
  isLiveActivitySupported: async (): Promise<boolean> => {
    if (!isModuleAvailable) return false;
    try {
      return await NativeFocusTimerModule.isLiveActivitySupported();
    } catch (error) {
      return false;
    }
  },
};

export default FocusTimerModule;
