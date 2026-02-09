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

/** Try to refresh the session once. Returns true if refresh succeeded. */
async function tryRefreshSession(): Promise<boolean> {
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
  }
}

/** Invoke an Edge Function with automatic 401-retry (one refresh attempt). */
async function invokeWithRetry<T>(
  fnName: string,
  options?: { body?: Record<string, unknown> },
): Promise<T> {
  // Attempt 1
  const { data, error } = await supabase.functions.invoke(fnName, options);

  if (!error) return data as T;

  // If 401, try refreshing the session and retry once
  if (error instanceof FunctionsHttpError && error.context?.status === 401) {
    console.warn('[SupabaseApi] ' + fnName + ': 401 - attempting session refresh...');
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
}

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

export default api;
