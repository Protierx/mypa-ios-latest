/**
 * useCirclesHome — Circles "All" tab data hook
 *
 * Calls two RPCs:
 *  • circles_home_all()    → per-circle rows (name, role, counts, activity)
 *  • circles_home_counts() → top-level stat card aggregates
 *
 * Designed for the SocialViewScreen "All" tab. Keeps mutations in useCircles.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

// ════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════

export interface CircleHomeItem {
  circle_id: string;
  circle_name: string;
  circle_emoji: string;
  circle_description: string | null;
  role: 'owner' | 'admin' | 'member';
  member_count: number;
  active_challenges_count: number;
  last_activity_at: string | null;
  created_at: string;
}

export interface CircleHomeCounts {
  circles_count: number;
  unique_members_count: number;
  active_challenges_count: number;
}

export interface UseCirclesHomeReturn {
  /** All circles the user belongs to, enriched with aggregates */
  circles: CircleHomeItem[];
  /** Top-level stat card counts (distinct members, total active challenges, etc.) */
  counts: CircleHomeCounts;
  /** True while initial load is in progress */
  loading: boolean;
  /** Non-null if the most recent fetch failed */
  error: Error | null;
  /** Refetch both RPCs */
  refresh: () => Promise<void>;
}

const EMPTY_COUNTS: CircleHomeCounts = {
  circles_count: 0,
  unique_members_count: 0,
  active_challenges_count: 0,
};

// ════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════

export function useCirclesHome(): UseCirclesHomeReturn {
  const { user } = useSupabaseAuth();
  const userId = user?.id ?? null;

  const [circles, setCircles] = useState<CircleHomeItem[]>([]);
  const [counts, setCounts] = useState<CircleHomeCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const hasLoadedOnce = useRef(false);
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (!userId) {
      setCircles([]);
      setCounts(EMPTY_COUNTS);
      setLoading(false);
      return;
    }

    isFetchingRef.current = true;
    try {
      if (!hasLoadedOnce.current) setLoading(true);
      setError(null);

      // Fire both RPCs in parallel
      const [allRes, countsRes] = await Promise.all([
        supabase.rpc('circles_home_all'),
        supabase.rpc('circles_home_counts'),
      ]);

      if (allRes.error) throw allRes.error;
      if (countsRes.error) throw countsRes.error;

      const items: CircleHomeItem[] = (allRes.data || []).map((row: any) => ({
        circle_id: row.circle_id,
        circle_name: row.circle_name ?? '',
        circle_emoji: row.circle_emoji ?? '👥',
        circle_description: row.circle_description ?? null,
        role: row.role as 'owner' | 'admin' | 'member',
        member_count: Number(row.member_count) || 0,
        active_challenges_count: Number(row.active_challenges_count) || 0,
        last_activity_at: row.last_activity_at ?? null,
        created_at: row.created_at,
      }));

      // counts RPC returns a single row
      const countsRow = Array.isArray(countsRes.data) ? countsRes.data[0] : countsRes.data;
      const parsedCounts: CircleHomeCounts = countsRow
        ? {
            circles_count: Number(countsRow.circles_count) || 0,
            unique_members_count: Number(countsRow.unique_members_count) || 0,
            active_challenges_count: Number(countsRow.active_challenges_count) || 0,
          }
        : EMPTY_COUNTS;

      setCircles(items);
      setCounts(parsedCounts);
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('[useCirclesHome] fetch error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch circles'));
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time: re-fetch when circle_members changes for this user
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('circles-home-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'circle_members', filter: `user_id=eq.${userId}` },
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
    counts,
    loading,
    error,
    refresh: fetchData,
  };
}

export default useCirclesHome;
