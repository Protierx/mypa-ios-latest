/**
 * Supabase Tasks Hook
 * Real-time task management with Supabase
 * Includes AI-powered task sorting when unlocked
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
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
      setLoading(true);
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

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
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
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: task.title || 'New Task',
          description: task.description || null,
          due_date: task.due_date || new Date().toISOString(),
          priority: task.priority || 'medium',
          status: 'pending',
          estimated_duration: task.estimated_duration || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating task:', err);
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
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      return false;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      return false;
    }
  };

  const completeTask = async (id: string): Promise<boolean> => {
    try {
      // Log task completion for AI learning
      const task = tasks.find(t => t.id === id);
      if (task) {
        // Note: priority is a string in Task type, eventLogger expects it
        eventLogger.log('task_completed', {
          taskId: id,
          taskTitle: task.title,
          taskPriority: task.priority,
        });
      }
      
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
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
