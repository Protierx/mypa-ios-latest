/**
 * useMilestones Hook
 * 
 * Tracks user progress and triggers share modals at key moments:
 * - First task
 * - 5 tasks
 * - Level ups
 * - Streak milestones
 * - Challenge wins
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

export type ShareMilestone = 
  | 'first_task'
  | 'five_tasks'
  | 'ten_tasks'
  | 'level_up'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'challenge_win';

interface MilestoneState {
  firstTaskShown: boolean;
  fiveTasksShown: boolean;
  tenTasksShown: boolean;
  lastLevelShown: number;
  streak7Shown: boolean;
  streak14Shown: boolean;
  streak30Shown: boolean;
}

const STORAGE_KEY = 'mypa_milestones';

const DEFAULT_STATE: MilestoneState = {
  firstTaskShown: false,
  fiveTasksShown: false,
  tenTasksShown: false,
  lastLevelShown: 1,
  streak7Shown: false,
  streak14Shown: false,
  streak30Shown: false,
};

interface UseMilestonesReturn {
  currentMilestone: ShareMilestone | null;
  milestoneValue: number | undefined;
  showMilestone: boolean;
  dismissMilestone: () => void;
  checkTaskMilestone: (tasksCompleted: number) => void;
  checkStreakMilestone: (streak: number) => void;
  checkLevelMilestone: (level: number) => void;
  triggerChallengeMilestone: () => void;
}

export function useMilestones(): UseMilestonesReturn {
  const { user } = useAuth();
  const [milestoneState, setMilestoneState] = useState<MilestoneState>(DEFAULT_STATE);
  const [currentMilestone, setCurrentMilestone] = useState<ShareMilestone | null>(null);
  const [milestoneValue, setMilestoneValue] = useState<number | undefined>(undefined);
  const [showMilestone, setShowMilestone] = useState(false);

  // Load saved milestone state
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setMilestoneState(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load milestone state:', error);
      }
    };
    loadState();
  }, []);

  // Save milestone state
  const saveState = useCallback(async (newState: MilestoneState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setMilestoneState(newState);
    } catch (error) {
      console.error('Failed to save milestone state:', error);
    }
  }, []);

  // Trigger a milestone
  const triggerMilestone = useCallback((milestone: ShareMilestone, value?: number) => {
    setCurrentMilestone(milestone);
    setMilestoneValue(value);
    setShowMilestone(true);
  }, []);

  // Dismiss milestone
  const dismissMilestone = useCallback(() => {
    setShowMilestone(false);
    setCurrentMilestone(null);
    setMilestoneValue(undefined);
  }, []);

  // Check task-based milestones
  const checkTaskMilestone = useCallback((tasksCompleted: number) => {
    if (tasksCompleted === 1 && !milestoneState.firstTaskShown) {
      triggerMilestone('first_task');
      saveState({ ...milestoneState, firstTaskShown: true });
    } else if (tasksCompleted === 5 && !milestoneState.fiveTasksShown) {
      triggerMilestone('five_tasks');
      saveState({ ...milestoneState, fiveTasksShown: true });
    } else if (tasksCompleted === 10 && !milestoneState.tenTasksShown) {
      triggerMilestone('ten_tasks');
      saveState({ ...milestoneState, tenTasksShown: true });
    }
  }, [milestoneState, triggerMilestone, saveState]);

  // Check streak milestones
  const checkStreakMilestone = useCallback((streak: number) => {
    if (streak === 7 && !milestoneState.streak7Shown) {
      triggerMilestone('streak_7');
      saveState({ ...milestoneState, streak7Shown: true });
    } else if (streak === 14 && !milestoneState.streak14Shown) {
      triggerMilestone('streak_14');
      saveState({ ...milestoneState, streak14Shown: true });
    } else if (streak === 30 && !milestoneState.streak30Shown) {
      triggerMilestone('streak_30');
      saveState({ ...milestoneState, streak30Shown: true });
    }
  }, [milestoneState, triggerMilestone, saveState]);

  // Check level milestones
  const checkLevelMilestone = useCallback((level: number) => {
    if (level > milestoneState.lastLevelShown) {
      triggerMilestone('level_up', level);
      saveState({ ...milestoneState, lastLevelShown: level });
    }
  }, [milestoneState, triggerMilestone, saveState]);

  // Trigger challenge win milestone
  const triggerChallengeMilestone = useCallback(() => {
    triggerMilestone('challenge_win');
  }, [triggerMilestone]);

  // Auto-check milestones when user data changes
  useEffect(() => {
    if (user) {
      // Check current stats against milestones
      if (user.tasksCompleted >= 1 && !milestoneState.firstTaskShown) {
        // Don't auto-trigger, let the app trigger on task completion
      }
      if (user.level > milestoneState.lastLevelShown) {
        checkLevelMilestone(user.level);
      }
      if (user.currentStreak >= 7) {
        checkStreakMilestone(user.currentStreak);
      }
    }
  }, [user, milestoneState, checkLevelMilestone, checkStreakMilestone]);

  return {
    currentMilestone,
    milestoneValue,
    showMilestone,
    dismissMilestone,
    checkTaskMilestone,
    checkStreakMilestone,
    checkLevelMilestone,
    triggerChallengeMilestone,
  };
}

export default useMilestones;
