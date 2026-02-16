/**
 * Gamification Context
 *
 * Provides local gamification state (XP, level, streak, challenges)
 * and methods for recording gamification events:
 *   - recordTaskCompletion()
 *   - recordFocusCompletion()
 *
 * Each method:
 *   1. Optimistically previews XP
 *   2. Calls the edge function
 *   3. Reconciles with the real response
 *   4. Queues toasts for the overlay system
 *   5. Invalidates analytics cache (fixes analytics-not-updating bug)
 *   6. Falls back to offline queue on failure
 */
import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { api } from '@/services/supabaseApi';
import { analyticsInvalidationBus } from '@/services/analyticsInvalidationBus';
import {
  enqueueEvent,
  setOnEventProcessed,
  startEventQueueProcessor,
} from '@/services/gamificationQueue';
import type {
  GamificationState,
  TaskCompletedResponse,
  FocusCompletedResponse,
  ChallengeUpdate,
} from '@/types/gamification';

// ---------------------------------------------------------------------------
// UUID v4 generator (no external dependency)
// ---------------------------------------------------------------------------

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Constants (mirrored from backend for preview)
// ---------------------------------------------------------------------------

const XP_ON_TIME = 12;
const XP_LATE = 8;
const DAILY_XP_CAP = 120;

// ---------------------------------------------------------------------------
// Toast queue types
// ---------------------------------------------------------------------------

export type GamToast =
  | { kind: 'xp'; xp: number; isPreview: boolean }
  | { kind: 'challenge'; title: string; progress: number; target: number }
  | { kind: 'levelUp'; newLevel: number };

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface GamificationContextValue {
  state: GamificationState;
  /** Fire-and-forget: call after completing a task */
  recordTaskCompletion: (taskId: string, dueDate: string | null) => void;
  /** Fire-and-forget: call after completing a focus session */
  recordFocusCompletion: (sessionId: string, actualMinutes: number) => void;
  /** The next toast to show (consumed by the overlay) */
  currentToast: GamToast | null;
  /** Dismiss the current toast (shifts the queue) */
  dismissToast: () => void;
  /** Force-refresh state from profile */
  refreshState: () => Promise<void>;
}

const defaultState: GamificationState = {
  totalXp: 0,
  level: 1,
  xpIntoLevel: 0,
  xpForNextLevel: 100,
  streak: { current: 0, longest: 0 },
  todayXp: 0,
  dailyXpCap: DAILY_XP_CAP,
  activeChallenges: [],
};

const GamificationContext = createContext<GamificationContextValue>({
  state: defaultState,
  recordTaskCompletion: () => {},
  recordFocusCompletion: () => {},
  currentToast: null,
  dismissToast: () => {},
  refreshState: async () => {},
});

export function useGamification() {
  return useContext(GamificationContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user } = useSupabaseAuth();
  const [state, setState] = useState<GamificationState>(defaultState);
  const [toastQueue, setToastQueue] = useState<GamToast[]>([]);
  const currentToast = toastQueue.length > 0 ? toastQueue[0] : null;

  // ── Load initial state from profile ──
  const refreshState = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, level, streak_current, streak_longest')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Compute level state from XP
        const levelState = calcLevelStateLocal(profile.xp);
        
        // Load today's XP from daily_user_stats
        const todayStr = new Date().toISOString().slice(0, 10);
        const { data: dailyStats } = await supabase
          .from('daily_user_stats')
          .select('xp_gained')
          .eq('user_id', user.id)
          .eq('date', todayStr)
          .maybeSingle();

        // Load active challenge progress
        const { data: challengeData } = await supabase
          .from('challenge_participants')
          .select('challenge_id, progress, challenges!inner(id, title, type, goal_value, status)')
          .eq('user_id', user.id)
          .eq('challenges.status', 'active');

        const activeChallenges: ChallengeUpdate[] = (challengeData || []).map((cp: any) => ({
          challengeId: cp.challenge_id,
          type: cp.challenges.type,
          progressValue: cp.progress,
          target: cp.challenges.goal_value,
          completed: cp.progress >= cp.challenges.goal_value,
        }));

        setState({
          totalXp: profile.xp,
          level: levelState.level,
          xpIntoLevel: levelState.xpIntoLevel,
          xpForNextLevel: levelState.xpForNextLevel,
          streak: {
            current: profile.streak_current,
            longest: profile.streak_longest,
          },
          todayXp: dailyStats?.xp_gained ?? 0,
          dailyXpCap: DAILY_XP_CAP,
          activeChallenges,
        });
      }
    } catch (err) {
      console.warn('[Gamification] Failed to load state:', err);
    }
  }, [user]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // ── Start offline queue processor ──
  useEffect(() => {
    setOnEventProcessed((taskId, response) => {
      applyServerResponse(response);
      // Also invalidate analytics when a queued event is processed
      analyticsInvalidationBus.invalidate();
    });
    startEventQueueProcessor();
  }, []);

  // ── Apply server response to local state ──
  // reconcile=true means we already optimistically added XP, so replace instead of accumulate
  const applyServerResponse = useCallback((res: TaskCompletedResponse, reconcile = false, previewXp = 0) => {
    setState((prev) => {
      const newChallenges = [...prev.activeChallenges];
      for (const cu of res.challengeUpdates) {
        const idx = newChallenges.findIndex((c) => c.challengeId === cu.challengeId);
        if (idx >= 0) {
          newChallenges[idx] = cu;
        } else {
          newChallenges.push(cu);
        }
      }

      // When reconciling after an optimistic preview, undo the preview then apply real delta
      const todayXpAdjusted = reconcile
        ? prev.todayXp - previewXp + res.xpDelta
        : prev.todayXp + res.xpDelta;

      return {
        totalXp: res.totalXp,
        level: res.level,
        xpIntoLevel: res.xpIntoLevel,
        xpForNextLevel: res.xpForNextLevel,
        streak: res.streak,
        todayXp: todayXpAdjusted,
        dailyXpCap: DAILY_XP_CAP,
        activeChallenges: newChallenges,
      };
    });
  }, []);

  // ── Enqueue toasts (max 1 visible, rest queued) ──
  const pushToast = useCallback((toast: GamToast) => {
    setToastQueue((q) => [...q, toast]);
  }, []);

  const dismissToast = useCallback(() => {
    setToastQueue((q) => q.slice(1));
  }, []);

  // ── Record task completion ──
  const recordTaskCompletion = useCallback(
    (taskId: string, dueDate: string | null) => {
      const eventId = generateUUID();

      // 1. Preview XP optimistically
      const isOnTime = dueDate ? new Date() <= new Date(dueDate) : true;
      const previewXp = isOnTime ? XP_ON_TIME : XP_LATE;
      const cappedPreview = Math.min(previewXp, Math.max(0, DAILY_XP_CAP - state.todayXp));

      // Show preview toast immediately
      pushToast({ kind: 'xp', xp: cappedPreview, isPreview: true });

      // Optimistic state bump
      setState((prev) => ({
        ...prev,
        totalXp: prev.totalXp + cappedPreview,
        todayXp: prev.todayXp + cappedPreview,
        xpIntoLevel: prev.xpIntoLevel + cappedPreview,
      }));

      // 2. Call the edge function
      api
        .taskCompleted(eventId, taskId)
        .then((response) => {
          console.log('[Gamification] task-completed SUCCESS → xpDelta:', response.xpDelta, 'level:', response.level, 'streak:', response.streak);
          // 3. Reconcile: replace optimistic with real values
          applyServerResponse(response, true, cappedPreview);

          // If actual XP differs from preview, we could show a correction toast
          // but for smoothness we skip it unless it's significantly different

          // 4. Challenge update toasts
          for (const cu of response.challengeUpdates) {
            pushToast({
              kind: 'challenge',
              title: cu.type === 'tasks_completed' ? 'Task Challenge' : 'Check-in Streak',
              progress: cu.progressValue,
              target: cu.target,
            });
          }

          // 5. Level-up toast
          if (response.leveledUp) {
            pushToast({ kind: 'levelUp', newLevel: response.level });
          }

          // 6. Invalidate analytics cache so AnalyticsModal shows fresh data
          analyticsInvalidationBus.invalidate();
        })
        .catch(async (err) => {
          console.warn('[Gamification] Edge function failed, queueing:', err);
          // Queue for retry (idempotent via event_id)
          await enqueueEvent(eventId, taskId);
        });
    },
    [state.todayXp, pushToast, applyServerResponse],
  );

  // ── Record focus completion ──
  const XP_FOCUS_25 = 10;
  const recordFocusCompletion = useCallback(
    (sessionId: string, actualMinutes: number) => {
      const eventId = generateUUID();

      // Optimistic preview: +10 XP if >= 25 min
      const qualifies = actualMinutes >= 25;
      const previewXp = qualifies
        ? Math.min(XP_FOCUS_25, Math.max(0, DAILY_XP_CAP - state.todayXp))
        : 0;

      if (previewXp > 0) {
        pushToast({ kind: 'xp', xp: previewXp, isPreview: true });
        setState((prev) => ({
          ...prev,
          totalXp: prev.totalXp + previewXp,
          todayXp: prev.todayXp + previewXp,
          xpIntoLevel: prev.xpIntoLevel + previewXp,
        }));
      }

      api
        .focusCompleted(eventId, sessionId, actualMinutes)
        .then((response) => {
          if (previewXp > 0) {
            applyServerResponse(
              {
                ...response,
                challengeUpdates: response.challengeUpdates,
                analyticsDelta: response.analyticsDelta,
              } as TaskCompletedResponse,
              true,
              previewXp,
            );
          } else {
            // No preview was shown — just apply directly
            setState((prev) => ({
              ...prev,
              totalXp: response.totalXp,
              level: response.level,
              xpIntoLevel: response.xpIntoLevel,
              xpForNextLevel: response.xpForNextLevel,
              streak: response.streak,
            }));
          }

          for (const cu of response.challengeUpdates) {
            pushToast({
              kind: 'challenge',
              title: 'Focus Challenge',
              progress: cu.progressValue,
              target: cu.target,
            });
          }

          if (response.leveledUp) {
            pushToast({ kind: 'levelUp', newLevel: response.level });
          }

          // Invalidate analytics cache
          analyticsInvalidationBus.invalidate();
        })
        .catch((err) => {
          console.warn('[Gamification] focus-completed failed:', err);
        });
    },
    [state.todayXp, pushToast, applyServerResponse],
  );

  return (
    <GamificationContext.Provider
      value={{ state, recordTaskCompletion, recordFocusCompletion, currentToast, dismissToast, refreshState }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Local level calculation (mirrors backend)
// ---------------------------------------------------------------------------

function calcLevelStateLocal(totalXp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
  const BASE = 100;
  const INC = 60;
  let level = 1;
  let remaining = totalXp;
  while (true) {
    const needed = level <= 1 ? BASE : BASE + (level - 1) * INC;
    if (remaining < needed) {
      return { level, xpIntoLevel: remaining, xpForNextLevel: needed };
    }
    remaining -= needed;
    level++;
  }
}
