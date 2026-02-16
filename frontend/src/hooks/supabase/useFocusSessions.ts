/**
 * Supabase Focus Sessions Hook
 * Focus session management for deep work tracking
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase, FocusSession } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { eventLogger } from '@/services/eventLogger';

interface UseFocusSessionsReturn {
  sessions: FocusSession[];
  activeSession: FocusSession | null;
  loading: boolean;
  error: Error | null;
  startSession: (durationMinutes: number, taskId?: string) => Promise<FocusSession | null>;
  pauseSession: (sessionId: string) => Promise<boolean>;
  resumeSession: (sessionId: string) => Promise<boolean>;
  endSession: (sessionId: string, xpEarned?: number) => Promise<boolean>;
  getTodayStats: () => { totalMinutes: number; sessionCount: number };
  refresh: () => Promise<void>;
}

export function useFocusSessions(): UseFocusSessionsReturn {
  const { user } = useSupabaseAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get sessions from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error: fetchError } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', thirtyDaysAgo.toISOString())
        .order('started_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching focus sessions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch sessions'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Get active session (started but not ended)
  const activeSession = sessions.find(s => s.started_at && !s.ended_at) || null;

  const startSession = async (durationMinutes: number, taskId?: string): Promise<FocusSession | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          task_id: taskId || null,
          duration_planned: durationMinutes,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      
      // Log event for AI learning
      eventLogger.logFocusStarted(data.id, durationMinutes, taskId);
      
      // Refresh to include new session
      fetchSessions();
      return data;
    } catch (err) {
      console.error('Error starting focus session:', err);
      return null;
    }
  };

  const pauseSession = async (sessionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('focus_sessions')
        .update({ paused_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Log focus_paused event
      eventLogger.log({
        eventType: 'focus_paused',
        action: 'pause_focus',
        params: { session_id: sessionId },
        success: true,
        screenContext: 'focus',
      });

      fetchSessions();
      return true;
    } catch (err) {
      console.error('Error pausing focus session:', err);
      return false;
    }
  };

  const resumeSession = async (sessionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get current session to compute pause duration
      const session = sessions.find(s => s.id === sessionId);
      if (!session || !session.paused_at) return false;

      const pausedAt = new Date(session.paused_at).getTime();
      const now = Date.now();
      const pauseDurationMs = now - pausedAt;
      const currentPausedMs = (session as any).total_paused_ms || 0;

      const { error } = await supabase
        .from('focus_sessions')
        .update({
          paused_at: null,
          total_paused_ms: currentPausedMs + pauseDurationMs,
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Log focus_resumed event
      eventLogger.log({
        eventType: 'focus_resumed',
        action: 'resume_focus',
        params: { session_id: sessionId, pause_duration_ms: pauseDurationMs },
        success: true,
        screenContext: 'focus',
      });

      fetchSessions();
      return true;
    } catch (err) {
      console.error('Error resuming focus session:', err);
      return false;
    }
  };

  const endSession = async (sessionId: string, xpEarned: number = 0): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get session to calculate actual duration
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return false;

      const startTime = new Date(session.started_at!);
      const endTime = new Date();
      const totalElapsedMs = endTime.getTime() - startTime.getTime();

      // Account for paused time: subtract total_paused_ms + any current pause
      let totalPausedMs = (session as any).total_paused_ms || 0;
      if (session.paused_at) {
        // Session is currently paused — add the current pause duration
        totalPausedMs += endTime.getTime() - new Date(session.paused_at).getTime();
      }

      const actualMinutes = Math.max(0, Math.round((totalElapsedMs - totalPausedMs) / (1000 * 60)));

      const { error } = await supabase
        .from('focus_sessions')
        .update({
          ended_at: endTime.toISOString(),
          duration_actual: actualMinutes,
          xp_earned: xpEarned,
          paused_at: null,
          total_paused_ms: totalPausedMs,
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      // Log event for AI learning (actual, then planned)
      eventLogger.logFocusCompleted(sessionId, actualMinutes, session.duration_planned!);
      
      // Refresh sessions
      fetchSessions();
      return true;
    } catch (err) {
      console.error('Error ending focus session:', err);
      return false;
    }
  };

  const getTodayStats = (): { totalMinutes: number; sessionCount: number } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = sessions.filter(s => {
      const sessionDate = new Date(s.started_at!);
      return sessionDate >= today && s.ended_at;
    });

    const totalMinutes = todaySessions.reduce(
      (sum, s) => sum + (s.duration_actual || 0), 
      0
    );

    return {
      totalMinutes,
      sessionCount: todaySessions.length,
    };
  };

  return {
    sessions,
    activeSession,
    loading,
    error,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    getTodayStats,
    refresh: fetchSessions,
  };
}

export default useFocusSessions;
