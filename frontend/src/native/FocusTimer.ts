import { NativeModules, Platform } from 'react-native';

const { FocusTimerModule } = NativeModules;

export interface FocusTimerNative {
  startLiveActivity: (taskTitle: string, targetMinutes: number) => Promise<string>;
  updateLiveActivity: (elapsedSeconds: number, isPaused: boolean) => Promise<boolean>;
  endLiveActivity: () => Promise<boolean>;
  isLiveActivitySupported: () => Promise<boolean>;
}

// Check if the native module exists (only on iOS with proper build)
const isModuleAvailable = Platform.OS === 'ios' && FocusTimerModule != null;

export const FocusTimer: FocusTimerNative = {
  startLiveActivity: async (taskTitle: string, targetMinutes: number): Promise<string> => {
    if (!isModuleAvailable) {
      console.log('Live Activity not available - native module not loaded');
      return '';
    }
    try {
      return await FocusTimerModule.startLiveActivity(taskTitle, targetMinutes);
    } catch (error) {
      console.log('Failed to start Live Activity:', error);
      return '';
    }
  },
  
  updateLiveActivity: async (elapsedSeconds: number, isPaused: boolean): Promise<boolean> => {
    if (!isModuleAvailable) return false;
    try {
      return await FocusTimerModule.updateLiveActivity(elapsedSeconds, isPaused);
    } catch (error) {
      console.log('Failed to update Live Activity:', error);
      return false;
    }
  },
  
  endLiveActivity: async (): Promise<boolean> => {
    if (!isModuleAvailable) return false;
    try {
      return await FocusTimerModule.endLiveActivity();
    } catch (error) {
      console.log('Failed to end Live Activity:', error);
      return false;
    }
  },
  
  isLiveActivitySupported: async (): Promise<boolean> => {
    if (!isModuleAvailable) return false;
    try {
      return await FocusTimerModule.isLiveActivitySupported();
    } catch (error) {
      return false;
    }
  },
};
