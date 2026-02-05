/**
 * Tasks View Screen
 * 
 * Swipe LEFT from AI Hub to access.
 * Shows all tasks grouped by date.
 * Includes AI sorting and duration estimation when unlocked.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTasks } from '../../hooks/supabase/useTasks';
import { useUserModel, AI_FEATURES } from '../../contexts/UserModelContext';
import { estimateTaskDuration, DurationEstimate } from '../../services/durationEstimation';
import { Task } from '../../lib/supabase';
import { SortedTask } from '../../services/aiTaskSorting';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';

type FilterType = 'today' | 'tomorrow' | 'all';

const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  urgent: '#ef4444',
};

export function TasksViewScreen() {
  const [filter, setFilter] = useState<FilterType>('today');
  const { tasks, sortedTasks, loading, error, refresh, updateTask, isAISortingActive } = useTasks(filter);
  const { isUnlocked, model } = useUserModel();
  const [refreshing, setRefreshing] = useState(false);

  // Check if duration estimation is unlocked
  const isDurationUnlocked = isUnlocked(AI_FEATURES.DURATION_ESTIMATION);

  // Get duration estimate for a task
  const getTaskDuration = useCallback((task: Task | SortedTask): string | null => {
    // If task has estimated_duration from database, use that
    if (task.estimated_duration) {
      return `${task.estimated_duration}m`;
    }
    
    // If duration estimation is unlocked, use AI estimation
    if (isDurationUnlocked) {
      const estimate = estimateTaskDuration(task, {
        userModel: model,
        isDurationUnlocked: true,
      });
      return `~${estimate.minutes}m`;
    }
    
    return null;
  }, [isDurationUnlocked, model]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleToggleComplete = useCallback(async (task: Task) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask(task.id, { 
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    });
  }, [updateTask]);

  const renderTask = useCallback(({ item: task }: { item: Task | SortedTask }) => {
    const duration = getTaskDuration(task);
    const sortedTask = task as SortedTask;
    
    return (
      <TouchableOpacity
        className="flex-row items-center bg-zinc-900 rounded-2xl p-4 mb-3 border border-zinc-800"
        onPress={() => handleToggleComplete(task)}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
            task.status === 'completed'
              ? 'bg-purple-600 border-purple-600'
              : 'border-zinc-600'
          }`}
        >
          {task.status === 'completed' && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </View>

        {/* Task Content */}
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text
              className={`text-base font-medium flex-1 ${
                task.status === 'completed' ? 'text-zinc-500 line-through' : 'text-white'
              }`}
            >
              {task.title}
            </Text>
            
            {/* AI Optimal Time Indicator */}
            {sortedTask.isOptimalTime && (
              <View className="bg-purple-900/50 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-purple-400 text-xs">⚡ Now</Text>
              </View>
            )}
          </View>
          
          {/* Meta info */}
          <View className="flex-row items-center mt-1 gap-3">
            {duration && (
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={12} color="#71717a" />
                <Text className="text-zinc-500 text-xs ml-1">
                  {duration}
                </Text>
              </View>
            )}
            
            {task.due_date && (
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={12} color="#71717a" />
                <Text className="text-zinc-500 text-xs ml-1">
                  {formatDueDate(task.due_date)}
                </Text>
              </View>
            )}
            
            {/* AI Sort Reason (subtle indicator) */}
            {sortedTask.sortReason && isAISortingActive && (
              <View className="flex-row items-center">
                <Ionicons name="sparkles-outline" size={12} color="#a855f7" />
              </View>
            )}
          </View>
        </View>

        {/* Priority Indicator */}
        <View
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        />
      </TouchableOpacity>
    );
  }, [handleToggleComplete, getTaskDuration, isAISortingActive]);

  // Group tasks - use sortedTasks for AI sorting
  const pendingTasks = sortedTasks.filter(t => t.status !== 'completed');
  const completedTasks = sortedTasks.filter(t => t.status === 'completed');

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-4 pb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-3xl font-bold">Tasks</Text>
            {isAISortingActive && (
              <View className="bg-purple-900/30 px-3 py-1 rounded-full flex-row items-center">
                <Ionicons name="sparkles" size={14} color="#a855f7" />
                <Text className="text-purple-400 text-xs ml-1">AI Sorted</Text>
              </View>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row px-5 mb-4">
          {(['today', 'tomorrow', 'all'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              className={`py-2 px-4 rounded-full mr-2 ${
                filter === f ? 'bg-purple-600' : 'bg-zinc-800'
              }`}
              onPress={() => setFilter(f)}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  filter === f ? 'text-white' : 'text-zinc-400'
                }`}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Task List */}
        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#a855f7" size="large" />
          </View>
        ) : (
          <FlatList
            data={pendingTasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#a855f7"
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Ionicons name="checkbox-outline" size={48} color="#3f3f46" />
                <Text className="text-zinc-500 text-lg mt-4">No tasks</Text>
                <Text className="text-zinc-600 text-sm mt-1">
                  {filter === 'today' ? "You're all caught up!" : 'No tasks scheduled'}
                </Text>
              </View>
            }
            ListFooterComponent={
              completedTasks.length > 0 ? (
                <View className="mt-6">
                  <Text className="text-zinc-500 text-sm font-medium mb-3">
                    Completed ({completedTasks.length})
                  </Text>
                  {completedTasks.map((task) => (
                    <TouchableOpacity
                      key={task.id}
                      className="flex-row items-center bg-zinc-900/50 rounded-2xl p-4 mb-2 border border-zinc-800/50"
                      onPress={() => handleToggleComplete(task)}
                    >
                      <View className="w-6 h-6 rounded-full bg-purple-600/50 border-2 border-purple-600/50 items-center justify-center mr-3">
                        <Ionicons name="checkmark" size={14} color="#a855f7" />
                      </View>
                      <Text className="text-zinc-500 line-through flex-1">
                        {task.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null
            }
          />
        )}

        {/* Add Task Button */}
        <TouchableOpacity
          className="absolute bottom-8 right-5 w-14 h-14 bg-purple-600 rounded-full items-center justify-center shadow-lg"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // TODO: Open quick add modal
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Mini Voice Button */}
        <MiniVoiceButton position="top-right" screenContext="tasks" />
      </SafeAreaView>
    </View>
  );
}

// Helper function
function formatDueDate(date: string): string {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
