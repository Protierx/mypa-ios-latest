/**
 * useNotifications — Supabase Notifications Hook (v2)
 *
 * Features:
 *  • Tab-filtered fetching (all / social / tasks / system)
 *  • Cursor-based pagination
 *  • Optimistic local state updates
 *  • Mark read (single + all for current tab)
 *  • Soft-delete with long-press
 *  • Unread counts per tab
 *  • Real-time Postgres subscription
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, Notification } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import type { NotificationTab } from '@/types/notifications';

// ── Types ───────────────────────────────────────────────────────────

export interface UnreadCounts {
  all: number;
  social: number;
  tasks: number;
  system: number;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCounts: UnreadCounts;
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  activeTab: NotificationTab;
  setActiveTab: (tab: NotificationTab) => void;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  /** @deprecated — use unreadCounts.all instead */
  unreadCount: number;
}
const EMPTY_COUNTS: UnreadCounts = { all: 0, social: 0, tasks: 0, system: 0 };
const PAGE_SIZE = 30;

export function useNotifications(): UseNotificationsReturn {
  const { user } = useSupabaseAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTabState] = useState<NotificationTab>('all');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const isSilentRefresh = useRef(false);

  // ── Unread counts ─────────────────────────────────────────────────

  const refreshUnreadCounts = useCallback(async () => {
    if (!user) return;
    try {
      const countForTab = async (category?: string) => {
        let q = supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .is('read_at', null);
        if (category) q = q.eq('category', category);
        const { count } = await q;
        return count ?? 0;
      };
      const [all, social, tasks, system] = await Promise.all([
        countForTab(), countForTab('social'), countForTab('tasks'), countForTab('system'),
      ]);
      setUnreadCounts({ all, social, tasks, system });
    } catch (err) {
      console.error('[useNotifications] count error:', err);
    }
  }, [user]);

  // ── Fetch ─────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async (tab?: NotificationTab, showLoading = true) => {
    if (!user) {
      setNotifications([]);
      setUnreadCounts(EMPTY_COUNTS);
      setLoading(false);
      return;
    }

    const tabToUse = tab ?? activeTab;
    try {
      if (showLoading && !isSilentRefresh.current) setLoading(true);
      setError(null);

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (tabToUse !== 'all') query = query.eq('category', tabToUse);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setNotifications(data ?? []);
      setCursor(data && data.length === PAGE_SIZE ? data[data.length - 1].created_at : null);
      setHasMore(data ? data.length === PAGE_SIZE : false);
      await refreshUnreadCounts();
    } catch (err) {
      console.error('[useNotifications] fetch error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setLoading(false);
      isSilentRefresh.current = false;
    }
  }, [user, activeTab, refreshUnreadCounts]);

  // ── Load more (pagination) ────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (!user || !cursor || loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .lt('created_at', cursor)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (activeTab !== 'all') query = query.eq('category', activeTab);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setNotifications(prev => [...prev, ...data]);
        setCursor(data.length === PAGE_SIZE ? data[data.length - 1].created_at : null);
        setHasMore(data.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('[useNotifications] loadMore error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [user, cursor, loadingMore, hasMore, activeTab]);

  // ── Tab change ────────────────────────────────────────────────────

  const setActiveTab = useCallback((tab: NotificationTab) => {
    setActiveTabState(tab);
    setCursor(null);
    setHasMore(true);
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const target = notifications.find(n => n.id === id);
      // Optimistic
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, read_at: now } : n));
      if (target && !target.read_at) {
        setUnreadCounts(prev => {
          const cat = target.category as keyof UnreadCounts;
          return { ...prev, all: Math.max(0, prev.all - 1), ...(cat in prev ? { [cat]: Math.max(0, prev[cat] - 1) } : {}) };
        });
      }

      const { error } = await supabase.from('notifications').update({ read_at: now }).eq('id', id).eq('user_id', user!.id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[useNotifications] markAsRead error:', err);
      isSilentRefresh.current = true;
      await fetchNotifications(activeTab, false);
      return false;
    }
  }, [user, notifications, activeTab, fetchNotifications]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const now = new Date().toISOString();
      // Optimistic
      setNotifications(prev =>
        prev.map(n => {
          if (n.read_at) return n;
          if (activeTab !== 'all' && n.category !== activeTab) return n;
          return { ...n, read: true, read_at: now };
        })
      );
      if (activeTab === 'all') {
        setUnreadCounts({ all: 0, social: 0, tasks: 0, system: 0 });
      } else {
        setUnreadCounts(prev => ({ ...prev, [activeTab]: 0, all: Math.max(0, prev.all - prev[activeTab]) }));
      }

      let query = supabase.from('notifications').update({ read_at: now }).eq('user_id', user.id).is('read_at', null).is('deleted_at', null);
      if (activeTab !== 'all') query = query.eq('category', activeTab);
      const { error } = await query;
      if (error) throw error;

      await refreshUnreadCounts();
      return true;
    } catch (err) {
      console.error('[useNotifications] markAllAsRead error:', err);
      isSilentRefresh.current = true;
      await fetchNotifications(activeTab, false);
      return false;
    }
  }, [user, activeTab, fetchNotifications, refreshUnreadCounts]);

  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      const target = notifications.find(n => n.id === id);
      // Optimistic
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (target && !target.read_at) {
        setUnreadCounts(prev => {
          const cat = target.category as keyof UnreadCounts;
          return { ...prev, all: Math.max(0, prev.all - 1), ...(cat in prev ? { [cat]: Math.max(0, prev[cat] - 1) } : {}) };
        });
      }

      const { error } = await supabase.from('notifications').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', user!.id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[useNotifications] delete error:', err);
      isSilentRefresh.current = true;
      await fetchNotifications(activeTab, false);
      return false;
    }
  }, [user, notifications, activeTab, fetchNotifications]);

  // ── Refresh ───────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    setCursor(null);
    setHasMore(true);
    await fetchNotifications(activeTab, true);
  }, [fetchNotifications, activeTab]);

  // ── Effects ───────────────────────────────────────────────────────

  // Fetch on mount + tab change
  useEffect(() => {
    fetchNotifications(activeTab);
  }, [activeTab, user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        isSilentRefresh.current = true;
        fetchNotifications(activeTab, false);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, activeTab]);

  return {
    notifications,
    unreadCounts,
    unreadCount: unreadCounts.all,
    loading,
    loadingMore,
    error,
    hasMore,
    activeTab,
    setActiveTab,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refresh,
  };
}

export default useNotifications;
