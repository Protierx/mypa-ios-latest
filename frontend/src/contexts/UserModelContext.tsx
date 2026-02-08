/**
 * User Model Context
 * 
 * Provides access to the user's AI learning model data.
 * This powers personalized AI features like:
 * - Peak hours recommendations
 * - Task sorting by completion likelihood
 * - Duration estimation
 * - Overwhelm detection
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 6, Step 6.2
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 5 "Learning System" & Section 9 "User Model"
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, UserModel as UserModelType } from '@/lib/supabase';
import supabaseApi from '@/services/supabaseApi';

// ============================================================================
// Types
// ============================================================================

/**
 * User model data structure from database
 */
export interface UserModelData {
  /** Hours of day when user is most productive (0-23) */
  peakHours: number[];
  
  /** Completion patterns by various dimensions */
  completionPatterns: {
    /** Completion rate by priority */
    byPriority?: {
      low: number;
      medium: number;
      high: number;
      urgent: number;
    };
    /** Completion rate by day of week (0=Sun, 6=Sat) */
    byDayOfWeek?: number[];
    /** Completion rate by hour of day */
    byHour?: number[];
    /** Average time to complete tasks (minutes) */
    avgCompletionTime?: number;
  };
  
  /** User's task preferences */
  taskPreferences: {
    /** Preferred task categories */
    categories?: string[];
    /** Common task keywords */
    commonKeywords?: string[];
    /** Typical task duration */
    typicalDuration?: number;
  };
  
  /** Number of tasks where completion rate drops */
  overwhelmThreshold: number | null;
  
  /** When patterns were last calculated */
  calculatedAt: string | null;
}

/**
 * Unlock status for AI features
 */
export interface UnlockStatus {
  feature: string;
  unlocked: boolean;
  unlockedAt?: string;
  seen: boolean;
  progress?: {
    current: number;
    required: number;
    description: string;
  };
}

/**
 * User stats for unlock calculations
 */
export interface UserStats {
  daysActive: number;
  tasksCompleted: number;
  focusSessions: number;
  inCircle: boolean;
  streakDays: number;
}

/**
 * Context value type
 */
interface UserModelContextType {
  /** The user's learned patterns */
  model: UserModelData | null;
  
  /** All unlock statuses */
  unlocks: UnlockStatus[];
  
  /** User stats for unlock progress */
  stats: UserStats | null;
  
  /** Whether data is loading */
  isLoading: boolean;
  
  /** Any error that occurred */
  error: string | null;
  
  /** Refresh model and unlocks from server */
  refresh: () => Promise<void>;
  
  /** Check if a specific feature is unlocked */
  isUnlocked: (feature: string) => boolean;
  
  /** Get unlock status for a feature */
  getUnlockStatus: (feature: string) => UnlockStatus | undefined;
  
  /** Get pending (unseen) unlocks */
  getPendingUnlocks: () => UnlockStatus[];
  
  /** Mark an unlock as seen */
  markUnlockSeen: (feature: string) => Promise<void>;
  
  /** Check if user is in peak hours right now */
  isInPeakHours: () => boolean;
  
  /** Get suggested focus duration based on patterns */
  getSuggestedFocusDuration: () => number;
  
  /** Check if user might be overwhelmed */
  isOverwhelmed: (taskCount: number) => boolean;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_MODEL: UserModelData = {
  peakHours: [],
  completionPatterns: {},
  taskPreferences: {},
  overwhelmThreshold: null,
  calculatedAt: null,
};

const DEFAULT_STATS: UserStats = {
  daysActive: 0,
  tasksCompleted: 0,
  focusSessions: 0,
  inCircle: false,
  streakDays: 0,
};

// ============================================================================
// Context
// ============================================================================

const UserModelContext = createContext<UserModelContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface UserModelProviderProps {
  children: ReactNode;
}

export function UserModelProvider({ children }: UserModelProviderProps) {
  const [model, setModel] = useState<UserModelData | null>(null);
  const [unlocks, setUnlocks] = useState<UnlockStatus[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------

  /**
   * Fetch user model from Supabase
   */
  const fetchModel = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error: fetchError } = await supabase
        .from('user_models')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (user has no model yet)
        throw fetchError;
      }

      if (data) {
        return {
          peakHours: data.peak_hours || [],
          completionPatterns: data.completion_patterns || {},
          taskPreferences: data.task_preferences || {},
          overwhelmThreshold: data.overwhelm_threshold,
          calculatedAt: data.calculated_at,
        } as UserModelData;
      }

      return DEFAULT_MODEL;
    } catch (err) {
      console.error('[UserModel] Failed to fetch model:', err);
      return null;
    }
  }, []);

  /**
   * Fetch unlocks and stats from Edge Function
   * Includes retry logic for auth timing issues
   */
  const fetchUnlocks = useCallback(async (retryCount = 0): Promise<{ unlocks: UnlockItem[]; stats: UserStats }> => {
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 500; // ms

    try {
      const response = await supabaseApi.checkUnlocks();
      return {
        unlocks: response.allUnlocks.map((u: { feature: string; unlocked: boolean; progress: any }) => ({
          feature: u.feature,
          unlocked: u.unlocked,
          seen: true, // TODO: Track seen status
          progress: u.progress,
        })),
        stats: response.stats,
      };
    } catch (err) {
      // Retry on auth errors (Edge Function may not have received token yet)
      if (retryCount < MAX_RETRIES) {
        console.log(`[UserModel] Retrying fetchUnlocks (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchUnlocks(retryCount + 1);
      }
      console.error('[UserModel] Failed to fetch unlocks after retries:', err);
      return { unlocks: [], stats: DEFAULT_STATS };
    }
  }, []);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    // Check for active session first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // No session yet, skip fetching
      console.log('[UserModel] No session, skipping refresh');
      setIsLoading(false);
      return;
    }
    
    console.log('[UserModel] Refreshing with session for user:', session.user?.id?.substring(0, 8) + '...');

    setIsLoading(true);
    setError(null);

    try {
      // Fetch in parallel
      const [modelData, unlockData] = await Promise.all([
        fetchModel(),
        fetchUnlocks(),
      ]);

      setModel(modelData);
      setUnlocks(unlockData.unlocks);
      setStats(unlockData.stats);
    } catch (err) {
      console.error('[UserModel] Error refreshing:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user model');
    } finally {
      setIsLoading(false);
    }
  }, [fetchModel, fetchUnlocks]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Small delay to ensure token is propagated to Edge Functions
        setTimeout(() => refresh(), 300);
      } else if (event === 'SIGNED_OUT') {
        setModel(null);
        setUnlocks([]);
        setStats(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  /**
   * Check if a specific feature is unlocked
   */
  const isUnlocked = useCallback((feature: string): boolean => {
    return unlocks.some(u => u.feature === feature && u.unlocked);
  }, [unlocks]);

  /**
   * Get unlock status for a feature
   */
  const getUnlockStatus = useCallback((feature: string): UnlockStatus | undefined => {
    return unlocks.find(u => u.feature === feature);
  }, [unlocks]);

  /**
   * Get pending (unseen) unlocks
   */
  const getPendingUnlocks = useCallback((): UnlockStatus[] => {
    return unlocks.filter(u => u.unlocked && !u.seen);
  }, [unlocks]);

  /**
   * Mark an unlock as seen
   */
  const markUnlockSeen = useCallback(async (feature: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('unlocks')
        .update({ seen: true })
        .eq('user_id', user.id)
        .eq('feature', feature);

      // Update local state
      setUnlocks(prev => prev.map(u => 
        u.feature === feature ? { ...u, seen: true } : u
      ));
    } catch (err) {
      console.error('[UserModel] Failed to mark unlock seen:', err);
    }
  }, []);

  /**
   * Check if user is currently in their peak hours
   */
  const isInPeakHours = useCallback((): boolean => {
    if (!model?.peakHours.length) return false;
    const currentHour = new Date().getHours();
    return model.peakHours.includes(currentHour);
  }, [model]);

  /**
   * Get suggested focus duration based on patterns
   */
  const getSuggestedFocusDuration = useCallback((): number => {
    // Default focus duration
    const DEFAULT_DURATION = 25;

    if (!model?.taskPreferences.typicalDuration) {
      return DEFAULT_DURATION;
    }

    // Round to nearest 5 minutes
    const typical = model.taskPreferences.typicalDuration;
    return Math.round(typical / 5) * 5;
  }, [model]);

  /**
   * Check if user might be overwhelmed based on task count
   */
  const isOverwhelmed = useCallback((taskCount: number): boolean => {
    if (!model?.overwhelmThreshold) return false;
    return taskCount > model.overwhelmThreshold;
  }, [model]);

  // --------------------------------------------------------------------------
  // Context Value
  // --------------------------------------------------------------------------

  const contextValue: UserModelContextType = {
    model,
    unlocks,
    stats,
    isLoading,
    error,
    refresh,
    isUnlocked,
    getUnlockStatus,
    getPendingUnlocks,
    markUnlockSeen,
    isInPeakHours,
    getSuggestedFocusDuration,
    isOverwhelmed,
  };

  return (
    <UserModelContext.Provider value={contextValue}>
      {children}
    </UserModelContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access user model context
 */
export function useUserModel(): UserModelContextType {
  const context = useContext(UserModelContext);
  if (!context) {
    throw new Error('useUserModel must be used within a UserModelProvider');
  }
  return context;
}

// ============================================================================
// Feature Constants
// ============================================================================

/**
 * AI feature unlock keys
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 5
 */
export const AI_FEATURES = {
  /** Day 3: Basic insights about tasks */
  TASK_INSIGHTS: 'task_insights',
  
  /** Day 3: Basic focus statistics */
  FOCUS_STATS: 'focus_stats',
  
  /** Day 7: AI sorts tasks by completion likelihood */
  AI_TASK_SORTING: 'ai_task_sorting',
  
  /** Day 7: AI estimates task duration */
  DURATION_ESTIMATION: 'duration_estimation',
  
  /** Day 14: Access to challenges feature */
  CHALLENGES: 'challenges',
  
  /** Day 14: Circle insights and analytics */
  CIRCLE_INSIGHTS: 'circle_insights',
  
  /** Day 30: Custom AI voice selection */
  CUSTOM_AI_VOICE: 'custom_ai_voice',
  
  /** Day 30: Predictive task suggestions */
  PREDICTIVE_TASKS: 'predictive_tasks',
  
  /** Unlocked when patterns detected: Overwhelm warnings */
  OVERWHELM_DETECTION: 'overwhelm_detection',
  
  /** Unlocked with enough data: Peak hours recommendations */
  PEAK_HOURS: 'peak_hours',
} as const;

export type AIFeature = typeof AI_FEATURES[keyof typeof AI_FEATURES];

export default UserModelContext;
