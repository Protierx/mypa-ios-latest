/**
 * Real-time Subscription Hooks
 * Subscribe to live updates from Supabase
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeSubscriptionOptions<T extends Record<string, any>> {
  table: string;
  event?: ChangeEvent;
  filter?: string;
  onInsert?: (record: T) => void;
  onUpdate?: (record: T) => void;
  onDelete?: (record: T) => void;
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void;
}

/**
 * Generic hook for real-time subscriptions
 */
export function useRealtimeSubscription<T extends Record<string, any>>({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseRealtimeSubscriptionOptions<T>) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channelName = `${table}-${filter || 'all'}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          console.log(`[Realtime] ${table}:`, payload.eventType);
          
          onChange?.(payload as RealtimePostgresChangesPayload<T>);

          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload.new as T);
              break;
            case 'UPDATE':
              onUpdate?.(payload.new as T);
              break;
            case 'DELETE':
              onDelete?.(payload.old as T);
              break;
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter, onInsert, onUpdate, onDelete, onChange]);

  return { isConnected };
}

/**
 * Subscribe to circle activity feed
 */
export function useCircleActivity(circleId: string) {
  const [activities, setActivities] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!circleId) return;

    // Fetch initial activities
    const fetchActivities = async () => {
      const { data } = await supabase
        .from('user_events')
        .select('*')
        .contains('metadata', { circle_id: circleId })
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setActivities(data);
    };

    fetchActivities();

    // Subscribe to new activities
    const channel = supabase
      .channel(`circle-activity-${circleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_events',
        },
        (payload) => {
          const event = payload.new as any;
          if (event.metadata?.circle_id === circleId) {
            setActivities((prev) => [event, ...prev].slice(0, 20));
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId]);

  return { activities, isConnected };
}

/**
 * Subscribe to challenge leaderboard updates
 */
export function useChallengeLeaderboard(challengeId: string) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    if (!challengeId) return;

    const { data } = await supabase
      .from('challenge_participants')
      .select(`
        user_id,
        progress,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .eq('challenge_id', challengeId)
      .order('progress', { ascending: false });

    if (data) setLeaderboard(data);
  }, [challengeId]);

  useEffect(() => {
    if (!challengeId) return;

    fetchLeaderboard();

    // Subscribe to progress updates
    const channel = supabase
      .channel(`challenge-leaderboard-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_participants',
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [challengeId, fetchLeaderboard]);

  return { leaderboard, isConnected, refresh: fetchLeaderboard };
}

/**
 * Subscribe to notifications
 */
export function useNotifications() {
  const { user } = useSupabaseAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          // Recalculate unread count
          setNotifications((current) => {
            setUnreadCount(current.filter((n) => !n.read).length);
            return current;
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
  };
}

export default useRealtimeSubscription;
