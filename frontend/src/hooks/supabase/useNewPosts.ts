/**
 * useNewPosts — "New Posts" filter chip data hook
 *
 * Calls:
 *  • circles_with_new_posts() → circles with unread posts (count + timestamps)
 *  • mark_circle_seen(id)     → upsert last_seen_at for a circle
 *
 * Designed for the SocialViewScreen "New Posts" tab.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

// ════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════

export interface NewPostsCircle {
  circle_id: string;
  circle_name: string;
  circle_emoji: string;
  new_posts_count: number;
  last_post_at: string | null;
  last_seen_at: string | null;
}

export interface UseNewPostsReturn {
  /** Circles that have unread posts, ordered by most recent post */
  circles: NewPostsCircle[];
  /** Total number of circles with new posts */
  totalCount: number;
  /** True while initial load is in progress */
  loading: boolean;
  /** Non-null if the most recent fetch failed */
  error: Error | null;
  /** Refetch new-posts data */
  refresh: () => Promise<void>;
  /** Mark a circle as "seen" — removes it from new-posts on next refresh */
  markSeen: (circleId: string) => Promise<void>;
  /** Check if a given circle has new posts (by ID) */
  hasNewPosts: (circleId: string) => boolean;
  /** Get new-posts count for a given circle (0 if none) */
  newPostsCount: (circleId: string) => number;
}

// ════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════

export function useNewPosts(): UseNewPostsReturn {
  const { user } = useSupabaseAuth();
  const userId = user?.id ?? null;

  const [circles, setCircles] = useState<NewPostsCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const hasLoadedOnce = useRef(false);
  const isFetchingRef = useRef(false);

  // ── Build lookup map for fast per-circle queries ──
  const circleMapRef = useRef<Map<string, NewPostsCircle>>(new Map());

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (!userId) {
      setCircles([]);
      circleMapRef.current = new Map();
      setLoading(false);
      return;
    }

    isFetchingRef.current = true;
    try {
      if (!hasLoadedOnce.current) setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('circles_with_new_posts');
      if (rpcError) throw rpcError;

      const items: NewPostsCircle[] = (data || []).map((row: any) => ({
        circle_id: row.circle_id,
        circle_name: row.circle_name ?? '',
        circle_emoji: row.circle_emoji ?? '👥',
        new_posts_count: Number(row.new_posts_count) || 0,
        last_post_at: row.last_post_at ?? null,
        last_seen_at: row.last_seen_at ?? null,
      }));

      // Build lookup
      const map = new Map<string, NewPostsCircle>();
      items.forEach((item) => map.set(item.circle_id, item));
      circleMapRef.current = map;

      setCircles(items);
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('[useNewPosts] fetch error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch new posts'));
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [userId]);

  // ── Mark a circle as seen ──
  const markSeen = useCallback(async (circleId: string) => {
    if (!userId) return;
    try {
      const { error: rpcError } = await supabase.rpc('mark_circle_seen', { p_circle_id: circleId });
      if (rpcError) {
        console.error('[useNewPosts] markSeen error:', rpcError);
        return;
      }

      // Optimistic: remove from local state immediately
      setCircles((prev) => prev.filter((c) => c.circle_id !== circleId));
      circleMapRef.current.delete(circleId);
    } catch (err) {
      console.error('[useNewPosts] markSeen exception:', err);
    }
  }, [userId]);

  // ── Per-circle helpers ──
  const hasNewPosts = useCallback((circleId: string) => {
    return circleMapRef.current.has(circleId);
  }, []);

  const newPostsCount = useCallback((circleId: string) => {
    return circleMapRef.current.get(circleId)?.new_posts_count ?? 0;
  }, []);

  // ── Initial fetch ──
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Real-time: re-fetch when circle_posts changes ──
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('new-posts-rt')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'circle_posts' },
        () => {
          // Debounce rapid events
          setTimeout(() => fetchData(), 500);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchData]);

  return {
    circles,
    totalCount: circles.length,
    loading,
    error,
    refresh: fetchData,
    markSeen,
    hasNewPosts,
    newPostsCount,
  };
}
