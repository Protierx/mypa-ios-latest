/**
 * usePredictiveSuggestions Hook
 * 
 * Provides predictive task suggestions and context-aware recommendations
 * based on user's historical patterns.
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 6, Step 6.9
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserModel } from '@/contexts/UserModelContext';
import {
  PredictedTask,
  Suggestion,
  getPredictiveSuggestions,
  acceptPredictedTask,
  dismissSuggestion,
} from '@/services/predictiveSuggestions';
import { supabase } from '@/lib/supabase';

interface UsePredictiveSuggestionsReturn {
  // Data
  predictedTasks: PredictedTask[];
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  acceptTask: (prediction: PredictedTask) => Promise<boolean>;
  dismissTask: (title: string) => void;
  dismissSuggestion: (suggestionId: string) => void;
  
  // Helpers
  hasSuggestions: boolean;
  topSuggestion: Suggestion | null;
}

export function usePredictiveSuggestions(): UsePredictiveSuggestionsReturn {
  const { user } = useAuth();
  const { model, isUnlocked } = useUserModel();
  
  const [predictedTasks, setPredictedTasks] = useState<PredictedTask[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const dismissedTasksRef = useRef<Set<string>>(new Set());
  const lastFetchRef = useRef<number>(0);
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch current tasks for context
   */
  const fetchCurrentTasks = useCallback(async () => {
    if (!user?.id) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('due_date', today.toISOString())
      .lt('due_date', tomorrow.toISOString());

    return data || [];
  }, [user?.id]);

  /**
   * Refresh suggestions
   */
  const refresh = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Rate limit refreshes
    const now = Date.now();
    if (now - lastFetchRef.current < REFRESH_INTERVAL && predictedTasks.length > 0) {
      return;
    }
    lastFetchRef.current = now;

    setIsLoading(true);
    setError(null);

    try {
      const currentTasks = await fetchCurrentTasks();
      
      const result = await getPredictiveSuggestions(
        user.id,
        model,
        currentTasks,
        isUnlocked
      );

      // Filter out dismissed tasks
      const filteredTasks = result.predictedTasks.filter(
        t => !dismissedTasksRef.current.has(normalizeTitle(t.title))
      );

      setPredictedTasks(filteredTasks);
      setSuggestions(result.suggestions.filter(s => !s.dismissed));
    } catch (err: any) {
      console.error('Error fetching predictions:', err);
      setError(err.message || 'Failed to get suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, model, isUnlocked, fetchCurrentTasks]);

  /**
   * Accept a predicted task
   */
  const acceptTask = useCallback(async (prediction: PredictedTask): Promise<boolean> => {
    if (!user?.id) return false;

    const result = await acceptPredictedTask(user.id, prediction);
    
    if (result.success) {
      // Remove from list
      setPredictedTasks(prev => 
        prev.filter(t => normalizeTitle(t.title) !== normalizeTitle(prediction.title))
      );
    }

    return result.success;
  }, [user?.id]);

  /**
   * Dismiss a predicted task
   */
  const dismissTask = useCallback((title: string) => {
    const normalized = normalizeTitle(title);
    dismissedTasksRef.current.add(normalized);
    setPredictedTasks(prev => 
      prev.filter(t => normalizeTitle(t.title) !== normalized)
    );
  }, []);

  /**
   * Dismiss a suggestion
   */
  const handleDismissSuggestion = useCallback((suggestionId: string) => {
    if (user?.id) {
      dismissSuggestion(user.id, suggestionId);
    }
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    predictedTasks,
    suggestions,
    isLoading,
    error,
    refresh,
    acceptTask,
    dismissTask,
    dismissSuggestion: handleDismissSuggestion,
    hasSuggestions: predictedTasks.length > 0 || suggestions.length > 0,
    topSuggestion: suggestions[0] || null,
  };
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/\s+/g, ' ');
}

export default usePredictiveSuggestions;
