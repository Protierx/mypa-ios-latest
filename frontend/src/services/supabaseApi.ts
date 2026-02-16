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

  // ==========================================================================
  // Integration APIs
  // ==========================================================================

  /** Sync subscription status with RevenueCat */
  async syncSubscription(action: 'verify' | 'status' | 'restore' = 'verify'): Promise<SubscriptionSyncResponse> {
    return invokeWithRetry<SubscriptionSyncResponse>('revenucat-sync', {
      body: { action },
    });
  }

  /** Request a data export */
  async requestDataExport(options?: {
    format?: 'json' | 'csv';
    sections?: string[];
  }): Promise<DataExportResponse> {
    return invokeWithRetry<DataExportResponse>('data-export', {
      body: { action: 'request', ...options },
    });
  }

  /** Get data export status */
  async getDataExportStatus(exportId: string): Promise<DataExportStatusResponse> {
    return invokeWithRetry<DataExportStatusResponse>('data-export', {
      body: { action: 'status', export_id: exportId },
    });
  }

  /** Download a completed data export */
  async downloadDataExport(exportId: string): Promise<DataExportDownloadResponse> {
    return invokeWithRetry<DataExportDownloadResponse>('data-export', {
      body: { action: 'download', export_id: exportId },
    });
  }

  /** List all data exports */
  async listDataExports(): Promise<DataExportListResponse> {
    return invokeWithRetry<DataExportListResponse>('data-export', {
      body: { action: 'list' },
    });
  }

  /** Connect a calendar provider */
  async connectCalendar(params: {
    provider: 'apple_calendar' | 'google_calendar' | 'outlook_calendar';
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: string;
    scopes?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<CalendarConnectResponse> {
    return invokeWithRetry<CalendarConnectResponse>('calendar-sync', {
      body: { action: 'connect', ...params },
    });
  }

  /** Disconnect a calendar provider */
  async disconnectCalendar(provider: string): Promise<{ disconnected: boolean; provider: string }> {
    return invokeWithRetry<{ disconnected: boolean; provider: string }>('calendar-sync', {
      body: { action: 'disconnect', provider },
    });
  }

  /** Trigger calendar sync */
  async syncCalendar(provider?: string): Promise<CalendarSyncResponse> {
    return invokeWithRetry<CalendarSyncResponse>('calendar-sync', {
      body: { action: 'sync', provider },
    });
  }

  /** Import calendar events as tasks */
  async importCalendarEvents(events: CalendarEventImport[]): Promise<CalendarImportResponse> {
    return invokeWithRetry<CalendarImportResponse>('calendar-sync', {
      body: { action: 'import_events', events },
    });
  }

  /** Get calendar connection status */
  async getCalendarStatus(): Promise<CalendarStatusResponse> {
    return invokeWithRetry<CalendarStatusResponse>('calendar-sync', {
      body: { action: 'status' },
    });
  }

  /** Get system health check */
  async getHealthCheck(): Promise<HealthCheckResponse> {
    return invokeWithRetry<HealthCheckResponse>('health-check');
  }

  /** Quick health ping (no auth required) */
  async healthPing(): Promise<{ status: string; timestamp: string }> {
    const { data, error } = await supabase.functions.invoke('health-check', {
      body: {},
    });
    if (error) throw error;
    return data;
  }

  /** Get full integration dashboard */
  async getIntegrationDashboard(): Promise<IntegrationDashboardResponse> {
    return invokeWithRetry<IntegrationDashboardResponse>('integration-status', {
      body: { action: 'dashboard' },
    });
  }

  /** Get rate limit status for all resources */
  async getRateLimits(): Promise<RateLimitsResponse> {
    return invokeWithRetry<RateLimitsResponse>('integration-status', {
      body: { action: 'rate_limits' },
    });
  }

  /** Get connected integrations */
  async getConnections(): Promise<ConnectionsResponse> {
    return invokeWithRetry<ConnectionsResponse>('integration-status', {
      body: { action: 'connections' },
    });
  }

  /** Manage an integration connection */
  async manageIntegration(
    provider: string,
    operation: 'toggle_sync' | 'clear_error' | 'update_metadata',
    metadata?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return invokeWithRetry<Record<string, unknown>>('integration-status', {
      body: { action: 'manage', provider, operation, metadata },
    });
  }
}

// ---------------------------------------------------------------------------
// Integration API Types
// ---------------------------------------------------------------------------

interface SubscriptionSyncResponse {
  is_premium: boolean;
  expires_at: string | null;
  product_id: string | null;
  source: 'cache' | 'revenucat' | 'cache_fallback';
  entitlements?: string[];
  active_subscriptions?: string[];
  warning?: string;
}

interface DataExportResponse {
  export_id: string;
  status: string;
  file_size_bytes: number;
  sections: string[];
  message: string;
}

interface DataExportStatusResponse {
  export: {
    id: string;
    status: string;
    format: string;
    file_size_bytes: number | null;
    sections: string[];
    requested_at: string;
    completed_at: string | null;
    expires_at: string;
  };
}

interface DataExportDownloadResponse {
  download_url: string;
  expires_in_seconds: number;
  file_size_bytes: number;
}

interface DataExportListResponse {
  exports: Array<{
    id: string;
    status: string;
    format: string;
    file_size_bytes: number | null;
    sections: string[];
    requested_at: string;
    completed_at: string | null;
    expires_at: string;
    download_count: number;
  }>;
}

interface CalendarConnectResponse {
  connected: boolean;
  provider: string;
  connection_id: string;
}

interface CalendarSyncResponse {
  synced: boolean;
  results?: Array<{
    provider: string;
    success: boolean;
    events_found?: number;
    synced_at?: string;
    error?: string;
    message?: string;
  }>;
  message?: string;
}

interface CalendarEventImport {
  title: string;
  start_date: string;
  end_date?: string;
  all_day?: boolean;
  location?: string;
  notes?: string;
  source_provider?: string;
  source_event_id?: string;
}

interface CalendarImportResponse {
  imported: number;
  total_received: number;
  tasks: Array<{ id: string; title: string }>;
}

interface CalendarStatusResponse {
  connections: Array<{
    provider: string;
    status: string;
    last_sync_at: string | null;
    sync_error: string | null;
    metadata: Record<string, unknown>;
    connected_at: string;
  }>;
  supported_providers: string[];
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  environment: string;
  services: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'down' | 'unknown';
    latency_ms: number | null;
    message?: string;
    checked_at: string;
  }>;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
}

interface RateLimitInfo {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resets_at: string;
  resource: string;
}

interface RateLimitsResponse {
  is_premium: boolean;
  rate_limits: RateLimitInfo[];
}

interface ConnectionsResponse {
  connections: Array<{
    id: string;
    provider: string;
    status: string;
    last_sync_at: string | null;
    sync_error: string | null;
    metadata: Record<string, unknown>;
    scopes: string[];
    connected_at: string;
    updated_at: string;
  }>;
  available_providers: Array<{
    id: string;
    name: string;
    icon: string;
    premium_only: boolean;
  }>;
}

interface IntegrationDashboardResponse {
  user_id: string;
  is_premium: boolean;
  subscription: {
    is_premium: boolean;
    expires_at: string | null;
    product_id: string | null;
  };
  connections: Array<{
    id: string;
    provider: string;
    status: string;
    last_sync_at: string | null;
    sync_error: string | null;
    connected_at: string;
  }>;
  rate_limits: RateLimitInfo[];
  recent_exports: Array<{
    id: string;
    status: string;
    format: string;
    file_size_bytes: number | null;
    requested_at: string;
    completed_at: string | null;
    expires_at: string;
  }>;
  capabilities: Record<string, boolean>;
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

// Integration API convenience exports
export const syncSubscription = (action?: 'verify' | 'status' | 'restore') => api.syncSubscription(action);
export const requestDataExport = (options?: { format?: 'json' | 'csv'; sections?: string[] }) => api.requestDataExport(options);
export const getDataExportStatus = (exportId: string) => api.getDataExportStatus(exportId);
export const downloadDataExport = (exportId: string) => api.downloadDataExport(exportId);
export const listDataExports = () => api.listDataExports();
export const connectCalendar = (params: Parameters<typeof api.connectCalendar>[0]) => api.connectCalendar(params);
export const disconnectCalendar = (provider: string) => api.disconnectCalendar(provider);
export const syncCalendar = (provider?: string) => api.syncCalendar(provider);
export const importCalendarEvents = (events: CalendarEventImport[]) => api.importCalendarEvents(events);
export const getCalendarStatus = () => api.getCalendarStatus();
export const getHealthCheck = () => api.getHealthCheck();
export const getIntegrationDashboard = () => api.getIntegrationDashboard();
export const getRateLimits = () => api.getRateLimits();
export const getConnections = () => api.getConnections();

export default api;
