/**
 * Supabase Brain Dump Hook
 * Real-time brain dump item management with Supabase
 * Handles CRUD, conversion to tasks, and real-time sync
 */
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase, BrainDumpItem } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { eventLogger } from '@/services/eventLogger';

// ============================================================================
// Error Normalization
// ============================================================================

function normalizeError(err: any): string {
  const msg = err?.message || err?.toString() || '';
  const code = err?.code || '';

  if (code === '42703' || code === '42P01') return 'Something went wrong. Please try again.';
  if (code === '23505') return 'This item already exists.';
  if (code === 'PGRST301') return 'Session expired. Please reopen the app.';
  if (msg.includes('timed out') || msg.includes('timeout')) return 'Request timed out. Check your connection.';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch'))
    return 'Network error. Please check your connection.';
  if (msg.includes('relation') || msg.includes('column') || msg.includes('record'))
    return 'Something went wrong. Please try again.';
  return msg.length > 100 ? 'Something went wrong. Please try again.' : msg;
}

// ============================================================================
// Types
// ============================================================================

export type BrainDumpStatus = 'active' | 'converted' | 'archived';

export interface UseBrainDumpReturn {
  items: BrainDumpItem[];
  activeItems: BrainDumpItem[];
  convertedItems: BrainDumpItem[];
  archivedItems: BrainDumpItem[];
  loading: boolean;
  error: Error | null;
  createItem: (text: string) => Promise<BrainDumpItem | null>;
  archiveItem: (id: string) => Promise<boolean>;
  restoreItem: (id: string) => Promise<boolean>;
  convertItem: (id: string, taskId: string) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

export function useBrainDump(): UseBrainDumpReturn {
  const { user } = useSupabaseAuth();
  const [items, setItems] = useState<BrainDumpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedOnce = useRef(false);

  // ── Fetch ──
  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      if (!hasLoadedOnce.current) setLoading(true);
      setError(null);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Brain dump fetch timed out')), 8000)
      );

      const { data, error: fetchError } = await Promise.race([
        supabase
          .from('brain_dump_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        timeout,
      ]);

      // Gracefully handle table not existing yet (pre-migration)
      if (fetchError) {
        const msg = fetchError.message || '';
        if (msg.includes('schema cache') || msg.includes('relation') || msg.includes('does not exist')) {
          console.info('[useBrainDump] Table not yet created — running in offline mode');
          setItems([]);
          hasLoadedOnce.current = true;
          return;
        }
        throw fetchError;
      }
      setItems(data || []);
      hasLoadedOnce.current = true;
    } catch (err: any) {
      console.warn('[useBrainDump] Fetch issue:', err?.message || err);
      setError(new Error(normalizeError(err)));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Initial fetch ──
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ── Real-time subscription ──
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('brain-dump-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brain_dump_items',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchItems]);

  // ── Filtered lists ──
  const activeItems = useMemo(
    () => items.filter((i) => i.status === 'active'),
    [items]
  );
  const convertedItems = useMemo(
    () => items.filter((i) => i.status === 'converted'),
    [items]
  );
  const archivedItems = useMemo(
    () => items.filter((i) => i.status === 'archived'),
    [items]
  );

  // ── Create ──
  const createItem = useCallback(
    async (text: string): Promise<BrainDumpItem | null> => {
      if (!user) return null;
      const trimmed = text.trim();
      if (!trimmed) return null;

      try {
        const { error: insertError } = await supabase
          .from('brain_dump_items')
          .insert({
            user_id: user.id,
            text: trimmed,
            status: 'active',
          });

        if (insertError) {
          const msg = insertError.message || '';
          if (msg.includes('schema cache') || msg.includes('relation') || msg.includes('does not exist')) {
            console.info('[useBrainDump] Table not yet created — item not saved');
            throw new Error('Brain Dump is being set up. Please try again later.');
          }
          throw insertError;
        }

        // Fetch the just-created item
        const { data, error: fetchError } = await supabase
          .from('brain_dump_items')
          .select()
          .eq('user_id', user.id)
          .eq('text', trimmed)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError || !data) {
          console.warn('[useBrainDump] Could not fetch created item, refreshing');
          fetchItems();
          return null;
        }

        eventLogger.log('feature_used', {
          feature: 'brain_dump_item_created',
          itemId: data.id,
        });

        return data;
      } catch (err: any) {
        console.error('[useBrainDump] Error creating item:', err?.message || err);
        fetchItems();
        throw new Error(normalizeError(err));
      }
    },
    [user, fetchItems]
  );

  // ── Archive ──
  const archiveItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('brain_dump_items')
          .update({
            status: 'archived',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('status', 'active'); // Only archive active items

        if (error) throw error;

        eventLogger.log('feature_used', {
          feature: 'brain_dump_item_archived',
          itemId: id,
        });

        return true;
      } catch (err: any) {
        console.error('[useBrainDump] Error archiving item:', err?.message || err);
        return false;
      }
    },
    []
  );

  // ── Restore (archived → active) ──
  const restoreItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('brain_dump_items')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('status', 'archived'); // Only restore archived items

        if (error) throw error;

        eventLogger.log('feature_used', {
          feature: 'brain_dump_item_restored',
          itemId: id,
        });

        return true;
      } catch (err: any) {
        console.error('[useBrainDump] Error restoring item:', err?.message || err);
        return false;
      }
    },
    []
  );

  // ── Convert to task (idempotent) ──
  const convertItem = useCallback(
    async (id: string, taskId: string): Promise<boolean> => {
      try {
        // Only convert active items — prevents double conversion
        const { data: existing } = await supabase
          .from('brain_dump_items')
          .select('status')
          .eq('id', id)
          .single();

        if (existing?.status === 'converted') {
          console.warn('[useBrainDump] Item already converted, skipping');
          return true; // Idempotent success
        }

        const { error } = await supabase
          .from('brain_dump_items')
          .update({
            status: 'converted',
            converted_task_id: taskId,
            converted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('status', 'active'); // Guard: only convert if still active

        if (error) throw error;

        eventLogger.log('feature_used', {
          feature: 'brain_dump_item_converted',
          itemId: id,
          taskId,
        });

        return true;
      } catch (err: any) {
        console.error('[useBrainDump] Error converting item:', err?.message || err);
        return false;
      }
    },
    []
  );

  // ── Delete ──
  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('brain_dump_items')
          .delete()
          .eq('id', id);

        if (error) throw error;

        eventLogger.log('feature_used', {
          feature: 'brain_dump_item_deleted',
          itemId: id,
        });

        return true;
      } catch (err: any) {
        console.error('[useBrainDump] Error deleting item:', err?.message || err);
        return false;
      }
    },
    []
  );

  return {
    items,
    activeItems,
    convertedItems,
    archivedItems,
    loading,
    error,
    createItem,
    archiveItem,
    restoreItem,
    convertItem,
    deleteItem,
    refresh: fetchItems,
  };
}

export default useBrainDump;
