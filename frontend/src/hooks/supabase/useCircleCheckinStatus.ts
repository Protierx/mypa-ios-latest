/**
 * useCircleCheckinStatus — Lightweight batch check-in status for all user circles
 *
 * Returns a Set of circle IDs the user has checked into today.
 * Used by the Circles Home "Needs Check-in" filter chip.
 * Does NOT duplicate the per-circle useCircleAccountability hook.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

export interface UseCircleCheckinStatusReturn {
  /** Set of circle IDs the user has checked into today */
  checkedInCircleIds: Set<string>;
  /** Whether the query is in progress */
  loading: boolean;
  /** Refetch today's check-in status */
  refresh: () => Promise<void>;
  /** Returns true if the user still needs to check in to this circle today */
  needsCheckIn: (circleId: string) => boolean;
}

export function useCircleCheckinStatus(circleIds: string[]): UseCircleCheckinStatusReturn {
  const { user } = useSupabaseAuth();
  const [checkedInCircleIds, setCheckedInCircleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (!user || circleIds.length === 0) {
      setCheckedInCircleIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const today = getTodayDate();
      const { data, error } = await supabase
        .from('circle_checkins')
        .select('circle_id')
        .eq('user_id', user.id)
        .eq('date', today)
        .in('circle_id', circleIds);

      if (error) {
        console.error('[useCircleCheckinStatus] fetch error:', error);
        setCheckedInCircleIds(new Set());
      } else {
        setCheckedInCircleIds(new Set((data || []).map((r: any) => r.circle_id)));
      }
    } catch (err) {
      console.error('[useCircleCheckinStatus] unexpected error:', err);
      setCheckedInCircleIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [user, circleIds.join(',')]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const needsCheckIn = useCallback(
    (circleId: string) => !checkedInCircleIds.has(circleId),
    [checkedInCircleIds],
  );

  return { checkedInCircleIds, loading, refresh: fetchStatus, needsCheckIn };
}
