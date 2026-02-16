/**
 * Supabase API Service
 * Wrapper for calling Edge Functions
 *
 * All calls rely on the Supabase JS client auto-attaching the current
 * session's JWT in the Authorization header. We do NOT pass explicit
 * headers so the client always sends the freshest token.
 *
 * On 401 errors we attempt one session refresh before giving up.
 */
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface GreetingResponse {
  greeting: string;
  taskCount: number;
  completedToday: number;
  streak: number;
}

interface VoiceCommandResponse {
  success: boolean;
  message: string;
  action?: {
    type: string;
    payload: any;
  };
  shouldSpeak: boolean;
  intent: string;
}

interface UnlocksResponse {
  newUnlocks: string[];
  allUnlocks: Array<{
    feature: string;
    unlocked: boolean;
    progress: any;
  }>;
  stats: {
    daysActive: number;
    tasksCompleted: number;
    focusSessions: number;
    inCircle: boolean;
    streakDays: number;
  };
}

interface DailyBriefResponse {
  greeting: string;
  summary: {
    totalTasks: number;
    highPriorityCount: number;
    completedYesterday: number;
  };
  peakHourSuggestion: string | null;
  challengeUpdate: string | null;
  streakStatus: {
    current: number;
    message: string | null;
  };
  motivationalInsight: string | null;
  briefText: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Shared refresh promise — when multiple calls hit 401 concurrently,
 * only ONE refresh is issued. All waiters share the same promise.
 */
let _refreshPromise: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (_refreshPromise) {
    console.log('[SupabaseApi] Waiting on existing refresh...');
    return _refreshPromise;
  }
  _refreshPromise = (async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.warn('[SupabaseApi] Session refresh failed:', error.message);
        return false;
      }
      console.log('[SupabaseApi] Session refreshed successfully');
      return true;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

/** Invoke an Edge Function with automatic 401-retry (one shared refresh). */
async function invokeWithRetry<T>(
  fnName: string,
  options?: { body?: Record<string, unknown> },
): Promise<T> {
  // Attempt 1
  const { data, error } = await supabase.functions.invoke(fnName, options);

  if (!error) return data as T;

  // If 401, try refreshing the session (shared) and retry once
  if (error instanceof FunctionsHttpError && error.context?.status === 401) {
    console.warn('[SupabaseApi] ' + fnName + ': 401 — refreshing session...');
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      const retry = await supabase.functions.invoke(fnName, options);
      if (!retry.error) return retry.data as T;
      if (retry.error instanceof FunctionsHttpError) {
        logFunctionsError(fnName, retry.error);
      }
      throw retry.error;
    }
  }

  // Log and re-throw
  if (error instanceof FunctionsHttpError) {
    logFunctionsError(fnName, error);
  }
  throw error;
}

function logFunctionsError(fnName: string, error: FunctionsHttpError): void {
  try {
    error.context.json().then((body: Record<string, unknown>) => {
      console.warn('[SupabaseApi] ' + fnName + ' error:', error.context.status, JSON.stringify(body));
    }).catch(() => {
      console.warn('[SupabaseApi] ' + fnName + ' error:', error.context.status, error.message);
    });
  } catch {
    console.warn('[SupabaseApi] ' + fnName + ' error:', error.message);
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class SupabaseApiService {
  /** Get personalized AI greeting for the AI Hub */
  async getGreeting(): Promise<GreetingResponse> {
    return invokeWithRetry<GreetingResponse>('ai-greeting');
  }

  /** Process a voice command */
  async processVoiceCommand(
    transcript: string,
    context?: {
      screen?: string;
      selectedTaskId?: string;
      focusActive?: boolean;
    },
  ): Promise<VoiceCommandResponse> {
    return invokeWithRetry<VoiceCommandResponse>('voice-command', {
      body: { transcript, context },
    });
  }

  /** Check and calculate user unlocks */
  async checkUnlocks(): Promise<UnlocksResponse> {
    return invokeWithRetry<UnlocksResponse>('calculate-unlocks');
  }

  /** Send push notification (admin/system use) */
  async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<{ success: boolean }> {
    return invokeWithRetry<{ success: boolean }>('send-push', {
      body: { userId, title, body, data },
    });
  }

  /** Get personalized daily brief */
  async getDailyBrief(options?: { check_cache?: boolean }): Promise<DailyBriefResponse> {
    return invokeWithRetry<DailyBriefResponse>('daily-brief', {
      body: { check_cache: options?.check_cache ?? false },
    });
  }

  /** Fire task-completed gamification event */
  async taskCompleted(eventId: string, taskId: string): Promise<TaskCompletedResponse> {
    return invokeWithRetry<TaskCompletedResponse>('task-completed', {
      body: { event_id: eventId, task_id: taskId },
    });
  }

  /** Fire focus-completed gamification event */
  async focusCompleted(eventId: string, sessionId: string, actualMinutes: number): Promise<FocusCompletedResponse> {
    return invokeWithRetry<FocusCompletedResponse>('focus-completed', {
      body: { event_id: eventId, session_id: sessionId, actual_minutes: actualMinutes },
    });
  }

  /** Submit a manual challenge check-in */
  async challengeCheckIn(eventId: string, challengeId: string, note?: string, proofUrl?: string): Promise<CheckinResponse> {
    return invokeWithRetry<CheckinResponse>('challenge-checkin', {
      body: { event_id: eventId, challenge_id: challengeId, note, proof_url: proofUrl },
    });
  }

  /** Approve or reject a pending check-in (challenge creator only) */
  async approveCheckIn(checkinId: string, decision: 'accepted' | 'rejected'): Promise<ApproveResponse> {
    return invokeWithRetry<ApproveResponse>('challenge-approve', {
      body: { checkin_id: checkinId, decision },
    });
  }

  /** Create a new challenge via edge function */
  async createChallenge(payload: CreateChallengeRequest): Promise<CreateChallengeResponse> {
    return invokeWithRetry<CreateChallengeResponse>('create-challenge', {
      body: payload as unknown as Record<string, unknown>,
    });
  }

  /** Fetch analytics summary from the edge function. */
  async getAnalyticsSummary(period: string = '7d'): Promise<AnalyticsSummaryResponse> {
    // Use POST with period in the body — method:'GET' on invoke() causes
    // "Failed to send a request to the Edge Function" in some SDK versions.
    const { data, error } = await supabase.functions.invoke('analytics-summary', {
      body: { period },
    });

    if (!error) return data as AnalyticsSummaryResponse;

    // 401 retry
    if (error instanceof FunctionsHttpError && error.context?.status === 401) {
      const refreshed = await tryRefreshSession();
      if (refreshed) {
        const retry = await supabase.functions.invoke('analytics-summary', {
          body: { period },
        });
        if (!retry.error) return retry.data as AnalyticsSummaryResponse;
        throw retry.error;
      }
    }
    throw error;
  }
}

// Import gamification types
import type { TaskCompletedResponse, FocusCompletedResponse, CheckinResponse, ApproveResponse } from '@/types/gamification';
import type { AnalyticsSummaryResponse } from '@/types/analytics';
import type { CreateChallengeRequest, CreateChallengeResponse } from '@/types/challenge';

// Export singleton instance
export const api = new SupabaseApiService();

// Also export individual functions for convenience
export const getGreeting = () => api.getGreeting();
export const processVoiceCommand = (
  transcript: string,
  context?: { screen?: string; selectedTaskId?: string; focusActive?: boolean },
) => api.processVoiceCommand(transcript, context);
export const checkUnlocks = () => api.checkUnlocks();
export const getDailyBrief = (options?: { check_cache?: boolean }) => api.getDailyBrief(options);
export const taskCompleted = (eventId: string, taskId: string) => api.taskCompleted(eventId, taskId);
export const focusCompleted = (eventId: string, sessionId: string, actualMinutes: number) => api.focusCompleted(eventId, sessionId, actualMinutes);
export const challengeCheckIn = (eventId: string, challengeId: string, note?: string, proofUrl?: string) => api.challengeCheckIn(eventId, challengeId, note, proofUrl);
export const approveCheckIn = (checkinId: string, decision: 'accepted' | 'rejected') => api.approveCheckIn(checkinId, decision);
export const createChallenge = (payload: CreateChallengeRequest) => api.createChallenge(payload);
export const getAnalyticsSummary = (period?: string) => api.getAnalyticsSummary(period);

export default api;
