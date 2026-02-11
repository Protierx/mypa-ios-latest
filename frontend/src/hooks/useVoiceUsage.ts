/**
 * Voice Usage Hook
 * 
 * Counts today's voice commands from event_log (COMPUTED, not stored).
 * Per project rules: usage counters are always derived from event_log.
 * 
 * Re-queries on app foreground so the count stays fresh.
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const FREE_TIER_VOICE_LIMIT = 10;

export function useVoiceUsage() {
  const { user } = useSupabaseAuth();
  const [voiceCountToday, setVoiceCountToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!user) return;

    try {
      // Get today's start in local timezone
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('event_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('event_type', 'voice_command')
        .gte('created_at', todayStart.toISOString());

      if (!error && count !== null) {
        setVoiceCountToday(count);
      }
    } catch (err) {
      console.log('[useVoiceUsage] Error fetching count:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Re-fetch on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        fetchCount();
      }
    });
    return () => subscription.remove();
  }, [fetchCount]);

  // Increment locally after a voice command (avoids re-query lag)
  const incrementLocal = useCallback(() => {
    setVoiceCountToday((prev) => prev + 1);
  }, []);

  const isPremium = user?.isPremium ?? false;
  const isAtLimit = !isPremium && voiceCountToday >= FREE_TIER_VOICE_LIMIT;
  const remaining = isPremium ? Infinity : Math.max(0, FREE_TIER_VOICE_LIMIT - voiceCountToday);

  return {
    voiceCountToday,
    remaining,
    isAtLimit,
    isPremium,
    limit: FREE_TIER_VOICE_LIMIT,
    refresh: fetchCount,
    incrementLocal,
    loading,
  };
}
