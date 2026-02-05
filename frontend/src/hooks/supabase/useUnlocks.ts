/**
 * Supabase Unlocks Hook
 * Progressive feature unlock system
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase, Unlock } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface UnlockWithDetails extends Unlock {
  name?: string;
  description?: string;
  progress?: Record<string, { current: number; required: number }>;
}

interface UseUnlocksReturn {
  unlocks: UnlockWithDetails[];
  pendingUnlocks: UnlockWithDetails[];
  loading: boolean;
  error: Error | null;
  hasUnlock: (feature: string) => boolean;
  markSeen: (feature: string) => Promise<boolean>;
  checkUnlocks: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Unlock metadata
const UNLOCK_INFO: Record<string, { name: string; description: string }> = {
  'task_insights': {
    name: 'Task Insights',
    description: 'See AI-powered insights about your task completion patterns',
  },
  'focus_stats': {
    name: 'Focus Statistics',
    description: 'View detailed stats about your focus sessions',
  },
  'ai_sorting': {
    name: 'AI Task Sorting',
    description: 'Let MYPA automatically prioritize your tasks',
  },
  'duration_estimates': {
    name: 'Duration Estimates',
    description: 'AI estimates how long tasks will take',
  },
  'challenges': {
    name: 'Challenges',
    description: 'Create and join productivity challenges',
  },
  'circle_insights': {
    name: 'Circle Insights',
    description: 'See how your circle is performing',
  },
  'custom_ai_voice': {
    name: 'Custom AI Voice',
    description: 'Choose from different AI voice personalities',
  },
  'predictive_tasks': {
    name: 'Predictive Tasks',
    description: 'MYPA suggests tasks before you create them',
  },
};

export function useUnlocks(): UseUnlocksReturn {
  const { user, session } = useSupabaseAuth();
  const [unlocks, setUnlocks] = useState<UnlockWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUnlocks = useCallback(async () => {
    if (!user) {
      setUnlocks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('unlocks')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Add metadata to unlocks
      const enrichedUnlocks = (data || []).map(unlock => ({
        ...unlock,
        ...UNLOCK_INFO[unlock.feature],
      }));

      setUnlocks(enrichedUnlocks);
    } catch (err) {
      console.error('Error fetching unlocks:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch unlocks'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchUnlocks();
  }, [fetchUnlocks]);

  // Get pending (unseen) unlocks
  const pendingUnlocks = unlocks.filter(u => !u.seen);

  const hasUnlock = (feature: string): boolean => {
    return unlocks.some(u => u.feature === feature);
  };

  const markSeen = async (feature: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('unlocks')
        .update({ seen: true })
        .eq('user_id', user.id)
        .eq('feature', feature);

      if (error) throw error;
      
      // Update local state
      setUnlocks(prev => 
        prev.map(u => 
          u.feature === feature ? { ...u, seen: true } : u
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error marking unlock seen:', err);
      return false;
    }
  };

  const checkUnlocks = async (): Promise<void> => {
    if (!session) return;

    try {
      const { data, error } = await supabase.functions.invoke('calculate-unlocks', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // If new unlocks, refresh
      if (data?.newUnlocks?.length > 0) {
        fetchUnlocks();
      }
    } catch (err) {
      console.error('Error checking unlocks:', err);
    }
  };

  return {
    unlocks,
    pendingUnlocks,
    loading,
    error,
    hasUnlock,
    markSeen,
    checkUnlocks,
    refresh: fetchUnlocks,
  };
}

export default useUnlocks;
