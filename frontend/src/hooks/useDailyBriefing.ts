/**
 * useDailyBriefing Hook
 *
 * Checks whether the user needs a daily briefing today, fetches it
 * (with server-side caching via the daily-brief Edge Function), and
 * exposes state for the AIHubScreen to drive TTS + UI display.
 *
 * PRD R2 acceptance criteria:
 *  - Once/day guard via profiles.briefing_date
 *  - On-demand fallback if cache miss
 *  - Timezone-aware "today" via profiles.timezone
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getDailyBrief } from '@/services/supabaseApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** AsyncStorage key for the last briefing date played locally */
const BRIEFING_PLAYED_KEY = 'mypa_last_briefing_date';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BriefingState {
  /** True when the user hasn't heard their briefing yet today */
  shouldBrief: boolean;
  /** The generated brief text for TTS + on-screen display */
  briefText: string;
  /** True while we're checking date or fetching the brief */
  isLoading: boolean;
  /** User-friendly error message (null when OK) */
  error: string | null;
}

export interface UseDailyBriefingReturn extends BriefingState {
  /** Re-attempt fetching after an error */
  retry: () => void;
  /** Mark the briefing as played so it won't re-trigger */
  markBriefingPlayed: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get today's date string (YYYY-MM-DD) in the given IANA timezone */
function getTodayInTimezone(timezone: string): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  } catch {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDailyBriefing(userId: string | undefined): UseDailyBriefingReturn {
  const [state, setState] = useState<BriefingState>({
    shouldBrief: false,
    briefText: '',
    isLoading: false,
    error: null,
  });

  // Stable ref for userId so fetchBriefing doesn't recreate on every render
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  // Guard against re-triggering after the briefing has been marked as played
  const briefingPlayedRef = useRef(false);
  // Track whether the initial check has run (prevents infinite loop)
  const hasCheckedRef = useRef(false);
  // Track if a fetch is in-flight
  const isFetchingRef = useRef(false);

  const fetchBriefing = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid || briefingPlayedRef.current || isFetchingRef.current || hasCheckedRef.current) return;

    // Mark as checked immediately to prevent double-invocation (React StrictMode)
    hasCheckedRef.current = true;
    isFetchingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // If the Edge Function hangs (e.g. 401/refresh), stop showing "Preparing..." after 20s
    const timeoutMs = 20000;
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      isFetchingRef.current = false;
      setState({
        shouldBrief: false,
        briefText: '',
        isLoading: false,
        error: 'Briefing is taking too long. Tap to retry.',
      });
    }, timeoutMs);

    try {
      // 1. Check profiles.briefing_date to see if we already briefed today
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('briefing_date, timezone')
        .eq('id', uid)
        .single();

      if (profileError) throw profileError;

      const timezone = profile?.timezone || 'America/New_York';
      const today = getTodayInTimezone(timezone);
      const lastBriefingDate = profile?.briefing_date != null
        ? (typeof profile.briefing_date === 'string'
            ? profile.briefing_date
            : (profile.briefing_date as Date).toISOString().slice(0, 10))
        : null;

      // Also check local AsyncStorage for a fast "already played" guard
      const localPlayed = await AsyncStorage.getItem(BRIEFING_PLAYED_KEY).catch(() => null);

      if (lastBriefingDate === today || localPlayed === today) {
        // Already briefed today — don't play again
        clearTimeout(timeoutId);
        hasCheckedRef.current = true;
        briefingPlayedRef.current = true;
        isFetchingRef.current = false;
        console.log('[useDailyBriefing] Already briefed today, skipping');
        setState({ shouldBrief: false, briefText: '', isLoading: false, error: null });
        return;
      }

      // 2. Fetch the daily brief (Edge Function handles cache internally)
      const brief = await getDailyBrief();
      if (timedOut) return;

      if (!brief?.briefText) {
        throw new Error('Empty briefing received');
      }

      setState({
        shouldBrief: true,
        briefText: brief.briefText,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      if (timedOut) return;
      console.error('[useDailyBriefing] Failed to fetch briefing:', err);
      let message = "Couldn't load your briefing";
      const httpErr = err as { context?: { status: number; json?: () => Promise<{ error?: string }> } } | null;
      if (httpErr?.context) {
        if (httpErr.context.status === 401) {
          message = 'Session expired. Please sign in again.';
        } else if (typeof httpErr.context.json === 'function') {
          try {
            const body = await httpErr.context.json();
            if (body?.error) message = body.error;
          } catch {
            // ignore
          }
        }
      }
      setState({
        shouldBrief: false,
        briefText: '',
        isLoading: false,
        error: message,
      });
    } finally {
      clearTimeout(timeoutId);
      isFetchingRef.current = false;
    }
  }, []); // No deps -- uses refs for userId

  // Run once when user is authenticated
  useEffect(() => {
    console.log('[useDailyBriefing] useEffect:', 'userId:', userId ? userId.substring(0, 8) + '...' : 'none',
      'hasChecked:', hasCheckedRef.current, 'played:', briefingPlayedRef.current);
    if (userId && !hasCheckedRef.current && !briefingPlayedRef.current) {
      fetchBriefing();
    }
  }, [userId, fetchBriefing]);

  const retry = useCallback(() => {
    hasCheckedRef.current = false;
    briefingPlayedRef.current = false;
    isFetchingRef.current = false;
    fetchBriefing();
  }, [fetchBriefing]);

  const markBriefingPlayed = useCallback(() => {
    briefingPlayedRef.current = true;
    setState(prev => ({ ...prev, shouldBrief: false }));

    // Persist so the briefing won't replay today — even after app restart
    const uid = userIdRef.current;
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    // 1. Fast local guard (survives hot-reload + app restart)
    AsyncStorage.setItem(BRIEFING_PLAYED_KEY, today).catch(() => {});

    // 2. Server-side guard (survives reinstall + multi-device)
    if (uid) {
      supabase
        .from('profiles')
        .update({ briefing_date: today })
        .eq('id', uid)
        .then(({ error }) => {
          if (error) console.warn('[useDailyBriefing] Failed to update briefing_date:', error.message);
          else console.log('[useDailyBriefing] briefing_date set to', today);
        });
    }
  }, []);

  return {
    ...state,
    retry,
    markBriefingPlayed,
  };
}
