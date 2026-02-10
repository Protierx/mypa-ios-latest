/**
 * Supabase Tasks Hook
 * Real-time task management with Supabase
 * Includes AI-powered task sorting when unlocked
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, Task } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserModel, AI_FEATURES } from '@/contexts/UserModelContext';
import { sortTasksWithAI, SortedTask } from '@/services/aiTaskSorting';
import { eventLogger } from '@/services/eventLogger';

type TaskFilter = 'today' | 'tomorrow' | 'all' | 'completed';

interface UseTasksReturn {
  tasks: Task[];
  sortedTasks: SortedTask[];
  loading: boolean;
  error: Error | null;
  isAISortingActive: boolean;
  createTask: (task: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  completeTask: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useTasks(filter: TaskFilter = 'all'): UseTasksReturn {
  const { user } = useSupabaseAuth();
  const { isUnlocked, model } = useUserModel();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedOnce = React.useRef(false);

  // Check if AI sorting is unlocked
  const isAISortingActive = isUnlocked(AI_FEATURES.AI_TASK_SORTING);

  // Apply AI sorting to tasks
  const sortedTasks = useMemo(() => {
    return sortTasksWithAI(tasks, {
      userModel: model,
      isAISortingUnlocked: isAISortingActive,
      currentHour: new Date().getHours(),
    });
  }, [tasks, model, isAISortingActive]);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      // Only show loading spinner on first fetch, not on refetches
      if (!hasLoadedOnce.current) setLoading(true);
      setError(null);

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      // Apply filters
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      switch (filter) {
        case 'today':
          query = query
            .gte('due_date', today.toISOString())
            .lt('due_date', tomorrow.toISOString())
            .neq('status', 'completed');
          break;
        case 'tomorrow':
          query = query
            .gte('due_date', tomorrow.toISOString())
            .lt('due_date', dayAfterTomorrow.toISOString())
            .neq('status', 'completed');
          break;
        case 'completed':
          query = query.eq('status', 'completed');
          break;
        case 'all':
        default:
          query = query.neq('status', 'completed');
          break;
      }

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Tasks fetch timed out')), 8000)
      );
      const { data, error: fetchError } = await Promise.race([query, timeout]);

      if (fetchError) throw fetchError;
      setTasks(data || []);
      hasLoadedOnce.current = true;
    } catch (err: any) {
      console.warn('[useTasks] Fetch issue:', err?.message || err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Task change:', payload);
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTasks]);

  const createTask = async (task: Partial<Task>): Promise<Task | null> => {
    if (!user) {
      console.warn('[useTasks] createTask: No user, aborting');
      return null;
    }

    console.log('[useTasks] createTask called:', { title: task.title, priority: task.priority });

    try {
      const insertPayload = {
        user_id: user.id,
        title: task.title || 'New Task',
        description: task.description || null,
        due_date: task.due_date || new Date().toISOString(),
        priority: task.priority || 'medium',
        status: 'pending',
        estimated_duration: task.estimated_duration || null,
      };

      // Check auth state first
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[useTasks] Auth session valid:', !!session?.access_token);

      console.log('[useTasks] Inserting task...');

      // Step 1: Insert without .select() to avoid PostgREST + RLS hang
      const { error: insertError } = await supabase
        .from('tasks')
        .insert(insertPayload);

      console.log('[useTasks] Insert done, error:', insertError?.message || 'none');

      if (insertError) throw insertError;

      // Step 2: Fetch the just-created task separately
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select()
        .eq('user_id', user.id)
        .eq('title', insertPayload.title)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('[useTasks] Fetched created task:', data?.id || 'null', fetchError?.message || '');

      if (fetchError || !data) {
        // Insert succeeded but fetch failed — still refresh the list
        console.warn('[useTasks] Could not fetch created task, refreshing list');
        fetchTasks();
        return null;
      }

      eventLogger.logTaskCreated(data.id, data.title, data.priority);
      return data;
    } catch (err: any) {
      console.error('[useTasks] Error creating task:', err?.message || err);
      
      // If it timed out, the insert may have actually succeeded on the server
      // Refresh the task list to pick up any server-side changes
      fetchTasks();
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      const task = tasks.find(t => t.id === id);
      eventLogger.logTaskEdited(id, task?.title);
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      return false;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      const task = tasks.find(t => t.id === id);
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      eventLogger.logTaskDeleted(id, task?.title);
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      return false;
    }
  };

  const completeTask = async (id: string): Promise<boolean> => {
    try {
      const task = tasks.find(t => t.id === id);
      
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      if (task) {
        eventLogger.logTaskCompleted(id, task.title);
      }
      return true;
    } catch (err) {
      console.error('Error completing task:', err);
      return false;
    }
  };

  return {
    tasks,
    sortedTasks,
    loading,
    error,
    isAISortingActive,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    refresh: fetchTasks,
  };
}

export default useTasks;
