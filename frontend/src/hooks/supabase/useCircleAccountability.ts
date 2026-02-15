/**
 * useCircleAccountability — Core hook for check-in/check-out/feed
 *
 * Powers the entire accountability loop inside a circle:
 * - Today's check-in status per user
 * - Check-in + check-out mutations
 * - Feed (circle_posts) queries
 * - Real-time subscriptions
 * - "Who checked in today" for member badges
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, CircleCheckin, CircleCheckout, CirclePost } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

// ════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════

export type AccountabilityStatus = 'idle' | 'checked-in' | 'checked-out';

export interface TodayCheckin {
  id: string;
  intention_text: string;
  committed_task_ids: string[];
  committed_focus_minutes: number | null;
  committed_challenge_id: string | null;
  created_at: string;
}

export interface TodayCheckout {
  id: string;
  result_status: 'done' | 'partial' | 'missed';
  completed_task_ids: string[];
  reflection_win: string | null;
  reflection_blocker: string | null;
  created_at: string;
}

export interface FeedPost {
  id: string;
  circle_id: string;
  user_id: string;
  type: CirclePost['type'];
  payload: Record<string, any>;
  created_at: string;
  // Joined from profiles
  user_name: string;
  user_avatar: string | null;
}

export interface CheckinPayload {
  intention_text: string;
  committed_task_ids?: string[];
  committed_focus_minutes?: number;
  committed_challenge_id?: string;
}

export interface CheckoutPayload {
  result_status: 'done' | 'partial' | 'missed';
  completed_task_ids?: string[];
  reflection_win?: string;
  reflection_blocker?: string;
}

export interface MemberCheckinStatus {
  user_id: string;
  checked_in: boolean;
  checked_out: boolean;
  intention?: string;
  result_status?: 'done' | 'partial' | 'missed';
}

export interface UseCircleAccountabilityReturn {
  // Today's status
  status: AccountabilityStatus;
  todayCheckin: TodayCheckin | null;
  todayCheckout: TodayCheckout | null;
  todayCheckinCount: number;
  totalMemberCount: number;
  membersCheckedIn: MemberCheckinStatus[];

  // Feed
  feed: FeedPost[];
  feedLoading: boolean;

  // Mutations
  checkIn: (payload: CheckinPayload) => Promise<{ success: boolean; error?: string }>;
  checkOut: (payload: CheckoutPayload) => Promise<{ success: boolean; error?: string }>;

  // Loading
  loading: boolean;
  refresh: () => Promise<void>;
}

// ════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

// ════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════

export function useCircleAccountability(circleId: string | null): UseCircleAccountabilityReturn {
  const { user } = useSupabaseAuth();

  const [status, setStatus] = useState<AccountabilityStatus>('idle');
  const [todayCheckin, setTodayCheckin] = useState<TodayCheckin | null>(null);
  const [todayCheckout, setTodayCheckout] = useState<TodayCheckout | null>(null);
  const [todayCheckinCount, setTodayCheckinCount] = useState(0);
  const [totalMemberCount, setTotalMemberCount] = useState(0);
  const [membersCheckedIn, setMembersCheckedIn] = useState<MemberCheckinStatus[]>([]);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);

  // ── Fetch today's status for current user ──
  const fetchTodayStatus = useCallback(async () => {
    if (!user || !circleId) return;
    const today = getTodayDate();

    try {
      // Get current user's checkin for today
      const { data: checkin } = await supabase
        .from('circle_checkins')
        .select('id, intention_text, committed_task_ids, committed_focus_minutes, committed_challenge_id, created_at')
        .eq('circle_id', circleId)
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      // Get current user's checkout for today
      const { data: checkout } = await supabase
        .from('circle_checkouts')
        .select('id, result_status, completed_task_ids, reflection_win, reflection_blocker, created_at')
        .eq('circle_id', circleId)
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      setTodayCheckin(checkin || null);
      setTodayCheckout(checkout || null);

      if (checkout) {
        setStatus('checked-out');
      } else if (checkin) {
        setStatus('checked-in');
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.error('[useCircleAccountability] fetchTodayStatus error:', err);
    }
  }, [user, circleId]);

  // ── Fetch all members' checkin status for today ──
  const fetchMembersStatus = useCallback(async () => {
    if (!circleId) return;
    const today = getTodayDate();

    try {
      // Get all members
      const { data: members } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', circleId);

      const memberIds = (members || []).map((m: any) => m.user_id);
      setTotalMemberCount(memberIds.length);

      if (memberIds.length === 0) {
        setMembersCheckedIn([]);
        setTodayCheckinCount(0);
        return;
      }

      // Get today's checkins for this circle
      const { data: checkins } = await supabase
        .from('circle_checkins')
        .select('user_id, intention_text')
        .eq('circle_id', circleId)
        .eq('date', today);

      // Get today's checkouts for this circle
      const { data: checkouts } = await supabase
        .from('circle_checkouts')
        .select('user_id, result_status')
        .eq('circle_id', circleId)
        .eq('date', today);

      const checkinMap = new Map((checkins || []).map((c: any) => [c.user_id, c]));
      const checkoutMap = new Map((checkouts || []).map((c: any) => [c.user_id, c]));

      const statuses: MemberCheckinStatus[] = memberIds.map((uid: string) => ({
        user_id: uid,
        checked_in: checkinMap.has(uid),
        checked_out: checkoutMap.has(uid),
        intention: checkinMap.get(uid)?.intention_text,
        result_status: checkoutMap.get(uid)?.result_status,
      }));

      setMembersCheckedIn(statuses);
      setTodayCheckinCount(statuses.filter(s => s.checked_in).length);
    } catch (err) {
      console.error('[useCircleAccountability] fetchMembersStatus error:', err);
    }
  }, [circleId]);

  // ── Fetch feed ──
  const fetchFeed = useCallback(async () => {
    if (!circleId) return;

    try {
      setFeedLoading(true);
      const { data, error } = await supabase
        .from('circle_posts')
        .select(`
          id, circle_id, user_id, type, payload, created_at,
          profiles:user_id (display_name, avatar_url)
        `)
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const posts: FeedPost[] = (data || []).map((p: any) => ({
        id: p.id,
        circle_id: p.circle_id,
        user_id: p.user_id,
        type: p.type,
        payload: p.payload || {},
        created_at: p.created_at,
        user_name: p.profiles?.display_name || 'User',
        user_avatar: p.profiles?.avatar_url || null,
      }));

      setFeed(posts);
    } catch (err) {
      console.error('[useCircleAccountability] fetchFeed error:', err);
    } finally {
      setFeedLoading(false);
    }
  }, [circleId]);

  // ── Master refresh ──
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchTodayStatus(),
      fetchMembersStatus(),
      fetchFeed(),
    ]);
  }, [fetchTodayStatus, fetchMembersStatus, fetchFeed]);

  // ── Initial load + real-time subscription ──
  useEffect(() => {
    if (!circleId || !user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      if (!loadedOnce.current) setLoading(true);
      await refresh();
      setLoading(false);
      loadedOnce.current = true;
    };
    load();

    // Real-time: listen for new posts + checkins
    const channel = supabase
      .channel(`accountability-${circleId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'circle_posts',
        filter: `circle_id=eq.${circleId}`,
      }, () => { fetchFeed(); fetchMembersStatus(); })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'circle_checkins',
        filter: `circle_id=eq.${circleId}`,
      }, () => { fetchTodayStatus(); fetchMembersStatus(); })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'circle_checkouts',
        filter: `circle_id=eq.${circleId}`,
      }, () => { fetchTodayStatus(); fetchMembersStatus(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [circleId, user]);

  // ── Check In ──
  const checkIn = useCallback(async (payload: CheckinPayload): Promise<{ success: boolean; error?: string }> => {
    if (!user || !circleId) return { success: false, error: 'Not authenticated' };
    if (status !== 'idle') return { success: false, error: 'Already checked in today' };

    const today = getTodayDate();

    try {
      // Insert check-in
      const { error: insertErr } = await supabase
        .from('circle_checkins')
        .insert({
          circle_id: circleId,
          user_id: user.id,
          date: today,
          intention_text: payload.intention_text,
          committed_task_ids: payload.committed_task_ids || [],
          committed_focus_minutes: payload.committed_focus_minutes || null,
          committed_challenge_id: payload.committed_challenge_id || null,
        });

      if (insertErr) {
        // Unique constraint violation = already checked in
        if (insertErr.code === '23505') {
          return { success: false, error: 'Already checked in today' };
        }
        throw insertErr;
      }

      // Create feed post
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      await supabase.from('circle_posts').insert({
        circle_id: circleId,
        user_id: user.id,
        type: 'checkin',
        payload: {
          intention: payload.intention_text,
          task_count: (payload.committed_task_ids || []).length,
          focus_minutes: payload.committed_focus_minutes || null,
          user_name: profile?.display_name || 'Someone',
        },
      });

      // Optimistic update
      setStatus('checked-in');
      setTodayCheckin({
        id: 'temp',
        intention_text: payload.intention_text,
        committed_task_ids: payload.committed_task_ids || [],
        committed_focus_minutes: payload.committed_focus_minutes || null,
        committed_challenge_id: payload.committed_challenge_id || null,
        created_at: new Date().toISOString(),
      });

      // Refresh in background
      refresh();

      return { success: true };
    } catch (err: any) {
      console.error('[useCircleAccountability] checkIn error:', err);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  }, [user, circleId, status, refresh]);

  // ── Check Out ──
  const checkOut = useCallback(async (payload: CheckoutPayload): Promise<{ success: boolean; error?: string }> => {
    if (!user || !circleId) return { success: false, error: 'Not authenticated' };
    if (status !== 'checked-in') return { success: false, error: 'You need to check in first' };

    const today = getTodayDate();

    try {
      // Insert check-out
      const { error: insertErr } = await supabase
        .from('circle_checkouts')
        .insert({
          circle_id: circleId,
          user_id: user.id,
          date: today,
          result_status: payload.result_status,
          completed_task_ids: payload.completed_task_ids || [],
          reflection_win: payload.reflection_win || null,
          reflection_blocker: payload.reflection_blocker || null,
        });

      if (insertErr) {
        if (insertErr.code === '23505') {
          return { success: false, error: 'Already checked out today' };
        }
        throw insertErr;
      }

      // Create feed post
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const statusEmoji = payload.result_status === 'done' ? '✅'
        : payload.result_status === 'partial' ? '🟡' : '❌';

      await supabase.from('circle_posts').insert({
        circle_id: circleId,
        user_id: user.id,
        type: 'checkout',
        payload: {
          result_status: payload.result_status,
          status_emoji: statusEmoji,
          completed_count: (payload.completed_task_ids || []).length,
          reflection_win: payload.reflection_win || null,
          reflection_blocker: payload.reflection_blocker || null,
          intention: todayCheckin?.intention_text || '',
          user_name: profile?.display_name || 'Someone',
        },
      });

      // Optimistic update
      setStatus('checked-out');
      setTodayCheckout({
        id: 'temp',
        result_status: payload.result_status,
        completed_task_ids: payload.completed_task_ids || [],
        reflection_win: payload.reflection_win || null,
        reflection_blocker: payload.reflection_blocker || null,
        created_at: new Date().toISOString(),
      });

      // Refresh in background
      refresh();

      return { success: true };
    } catch (err: any) {
      console.error('[useCircleAccountability] checkOut error:', err);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  }, [user, circleId, status, todayCheckin, refresh]);

  return {
    status,
    todayCheckin,
    todayCheckout,
    todayCheckinCount,
    totalMemberCount,
    membersCheckedIn,
    feed,
    feedLoading,
    checkIn,
    checkOut,
    loading,
    refresh,
  };
}

export default useCircleAccountability;
