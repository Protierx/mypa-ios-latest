/**
 * Tasks View Screen
 *
 * Production-ready task management:
 * - Date filter bar: All / Today / Tomorrow / Pick any date
 * - Smart grouping: Overdue / Today / Tomorrow / Later / Anytime
 * - Clean card design with inline actions
 * - AI sorting badge when unlocked
 * - Full empty/loading/error states
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTasks } from '../../hooks/supabase/useTasks';
import { useUserModel, AI_FEATURES } from '../../contexts/UserModelContext';
import { Task } from '../../lib/supabase';
import { SortedTask } from '../../services/aiTaskSorting';
import { DateFilterBar, DateFilter } from '../../components/DateFilterBar';
import { TaskDetailModal } from '../modals/TaskDetailModal';
import { QuickAddTaskOverlay } from '../modals/QuickAddTaskOverlay';
import { useFocusModal } from '../../navigation-v2/FocusModalContext';
import { eventLogger } from '../../services/eventLogger';

// ============================================================================
// Constants
// ============================================================================

const PRIORITY_DOT: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  urgent: '#ef4444',
};

// ============================================================================
// Helpers
// ============================================================================

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface TaskSection {
  title: string;
  key: string;
  data: (Task | SortedTask)[];
  accent?: string;
}

/**
 * Groups tasks based on the active date filter.
 * - "all" → Overdue / Today / Tomorrow / Later / Anytime
 * - "today" → only today's tasks
 * - "tomorrow" → only tomorrow's tasks
 * - "custom" → only the selected date's tasks
 */
function buildSections(
  tasks: (Task | SortedTask)[],
  filter: DateFilter,
  customDate: Date | null,
): TaskSection[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const active = tasks.filter((t) => t.status !== 'completed');

  // Single-date filters
  if (filter === 'today') {
    const items = active.filter((t) => t.due_date && isSameDay(new Date(t.due_date), today));
    return [{ title: 'Today', key: 'today', data: items, accent: '#7C3AED' }];
  }
  if (filter === 'tomorrow') {
    const items = active.filter((t) => t.due_date && isSameDay(new Date(t.due_date), tomorrow));
    return [{ title: 'Tomorrow', key: 'tomorrow', data: items }];
  }
  if (filter === 'custom' && customDate) {
    const items = active.filter((t) => t.due_date && isSameDay(new Date(t.due_date), customDate));
    const label = customDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    return [{ title: label, key: 'custom', data: items }];
  }

  // "all" — full grouped view
  const overdue: (Task | SortedTask)[] = [];
  const todayArr: (Task | SortedTask)[] = [];
  const tomorrowArr: (Task | SortedTask)[] = [];
  const later: (Task | SortedTask)[] = [];
  const noDate: (Task | SortedTask)[] = [];

  for (const task of active) {
    if (!task.due_date) { noDate.push(task); continue; }
    const d = new Date(task.due_date);
    const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (dDate < today) overdue.push(task);
    else if (isSameDay(dDate, today)) todayArr.push(task);
    else if (isSameDay(dDate, tomorrow)) tomorrowArr.push(task);
    else later.push(task);
  }

  const sections: TaskSection[] = [];
  if (overdue.length)     sections.push({ title: 'Overdue', key: 'overdue', data: overdue, accent: '#EF4444' });
  if (todayArr.length)    sections.push({ title: 'Today', key: 'today', data: todayArr, accent: '#7C3AED' });
  if (tomorrowArr.length) sections.push({ title: 'Tomorrow', key: 'tomorrow', data: tomorrowArr });
  if (later.length)       sections.push({ title: 'Later', key: 'later', data: later });
  if (noDate.length)      sections.push({ title: 'Anytime', key: 'anytime', data: noDate });
  return sections;
}

function formatTaskTime(dateStr: string): string | null {
  const d = new Date(dateStr);
  const h = d.getHours();
  if (h === 0 || h === 23) return null;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatOverdueLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.floor((today.getTime() - taskDate.getTime()) / 86400000);
  if (days === 1) return 'Yesterday';
  return `${days}d overdue`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (isSameDay(dateOnly, today)) return '';
  if (isSameDay(dateOnly, tomorrow)) return '';
  if (dateOnly < today) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// Main Component
// ============================================================================

export function TasksViewScreen() {
  const {
    tasks, sortedTasks, loading, error, refresh,
    updateTask, deleteTask, deferTask, completeTask, isAISortingActive,
  } = useTasks('all');
  const { isUnlocked } = useUserModel();
  const [refreshing, setRefreshing] = useState(false);
  const { openFocusModal } = useFocusModal();

  // Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDate, setCustomDate] = useState<Date | null>(null);

  // Modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Computed
  const activeTasks = useMemo(() => sortedTasks.filter((t) => t.status !== 'completed'), [sortedTasks]);
  const completedTasks = useMemo(() => sortedTasks.filter((t) => t.status === 'completed'), [sortedTasks]);
  const sections = useMemo(
    () => buildSections(sortedTasks, dateFilter, customDate),
    [sortedTasks, dateFilter, customDate],
  );

  // Handlers
  const handleFilterChange = useCallback((filter: DateFilter, date?: Date) => {
    setDateFilter(filter);
    setCustomDate(filter === 'custom' && date ? date : null);
    eventLogger.log('feature_used', { feature: 'date_filter_changed', filter, date: date?.toISOString() });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleComplete = useCallback(async (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (task.status === 'completed') {
      await updateTask(task.id, { status: 'pending', completed_at: null });
    } else {
      const ok = await completeTask(task.id);
      if (!ok) refresh();
    }
  }, [updateTask, completeTask, refresh]);

  const handleDefer = useCallback(async (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deferTask(task.id);
  }, [deferTask]);

  const handleDelete = useCallback((task: Task) => {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await deleteTask(task.id);
        },
      },
    ]);
  }, [deleteTask]);

  // Determine initial date for add-task modal
  const addTaskDate = useMemo(() => {
    if (dateFilter === 'today') return new Date();
    if (dateFilter === 'tomorrow') {
      const d = new Date(); d.setDate(d.getDate() + 1); return d;
    }
    if (dateFilter === 'custom' && customDate) return customDate;
    return new Date();
  }, [dateFilter, customDate]);

  // ── Task Card ──
  const renderTask = useCallback(({ item: task }: { item: Task | SortedTask }) => {
    const isOverdue = task.due_date
      ? new Date(task.due_date) < new Date() && task.status !== 'completed'
      : false;
    const time = task.due_date ? formatTaskTime(task.due_date) : null;
    const duration = task.estimated_duration ? `${task.estimated_duration}m` : null;
    const dateLabel = task.due_date ? formatDateLabel(task.due_date) : null;

    return (
      <TouchableOpacity
        className="flex-row items-start py-3.5 px-4 mx-5 mb-2 bg-surface-2 rounded-xl border border-surface-4"
        style={isOverdue ? { borderLeftWidth: 3, borderLeftColor: '#EF4444' } : undefined}
        onPress={() => { setSelectedTask(task); setShowTaskDetail(true); }}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); handleComplete(task); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="mt-0.5 mr-3"
        >
          <View
            className="w-[22px] h-[22px] rounded-full border-[1.5px] items-center justify-center"
            style={{ borderColor: PRIORITY_DOT[task.priority] || '#52525B' }}
          >
            {task.status === 'completed' && (
              <Ionicons name="checkmark" size={13} color={PRIORITY_DOT[task.priority]} />
            )}
          </View>
        </TouchableOpacity>

        {/* Content */}
        <View className="flex-1 mr-2">
          <Text
            className={`text-body leading-snug ${
              task.status === 'completed' ? 'text-ink-disabled line-through' : 'text-ink-primary'
            }`}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {(time || duration || isOverdue || dateLabel) && (
            <View className="flex-row items-center mt-1.5 gap-3">
              {dateLabel ? (
                <Text className="text-caption-1 text-ink-disabled">{dateLabel}</Text>
              ) : null}
              {time && <Text className="text-caption-1 text-ink-disabled">{time}</Text>}
              {duration && (
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={11} color="#52525B" />
                  <Text className="text-caption-1 text-ink-disabled ml-0.5">{duration}</Text>
                </View>
              )}
              {isOverdue && task.due_date && (
                <Text className="text-caption-1 text-error">{formatOverdueLabel(task.due_date)}</Text>
              )}
            </View>
          )}
        </View>

        {/* Defer */}
        {task.status !== 'completed' && (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); handleDefer(task); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="mt-0.5 w-7 h-7 items-center justify-center rounded-md"
          >
            <Ionicons name="arrow-forward-outline" size={15} color="#3F3F46" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }, [handleComplete, handleDefer]);

  // ── Section Header ──
  const renderSectionHeader = useCallback(({ section }: { section: TaskSection }) => (
    <View className="flex-row items-center px-5 pt-5 pb-2">
      <Text className="text-subhead font-semibold" style={{ color: section.accent || '#71717A' }}>
        {section.title}
      </Text>
      <View className="bg-surface-3 px-1.5 py-0.5 rounded ml-2">
        <Text className="text-caption-2 font-semibold text-ink-disabled">{section.data.length}</Text>
      </View>
    </View>
  ), []);

  // ── Empty State ──
  const renderEmpty = () => {
    const label =
      dateFilter === 'today' ? 'Nothing due today' :
      dateFilter === 'tomorrow' ? 'Nothing due tomorrow' :
      dateFilter === 'custom' ? 'No tasks on this date' :
      'Nothing on your plate';

    return (
      <View className="items-center justify-center py-20 px-8">
        <View className="w-14 h-14 bg-surface-2 rounded-2xl items-center justify-center mb-4">
          <Ionicons name="checkbox-outline" size={28} color="#3F3F46" />
        </View>
        <Text className="text-headline font-semibold text-ink-secondary text-center">{label}</Text>
        <Text className="text-subhead text-ink-disabled mt-1 text-center">
          Tap + to add a task
        </Text>
      </View>
    );
  };

  // ── Error State ──
  if (error && !loading) {
    return (
      <View className="flex-1 bg-surface-1 items-center justify-center px-8">
        <View className="w-14 h-14 bg-error/10 rounded-2xl items-center justify-center mb-4">
          <Ionicons name="cloud-offline-outline" size={28} color="#EF4444" />
        </View>
        <Text className="text-headline font-semibold text-ink-primary text-center">Couldn't load tasks</Text>
        <Text className="text-subhead text-ink-tertiary mt-1 text-center">{error.message}</Text>
        <TouchableOpacity className="mt-6 bg-brand-purple px-6 py-3 rounded-full" onPress={refresh}>
          <Text className="text-subhead font-semibold text-white">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main ──
  return (
    <View className="flex-1 bg-surface-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
          <View className="flex-row items-baseline">
            <Text className="text-title-1 font-bold text-ink-primary">Tasks</Text>
            {activeTasks.length > 0 && (
              <Text className="text-subhead text-ink-disabled ml-2">{activeTasks.length}</Text>
            )}
          </View>
          {isAISortingActive && (
            <View className="flex-row items-center bg-brand-purple/15 px-2.5 py-1 rounded-full">
              <Ionicons name="sparkles" size={12} color="#A78BFA" />
              <Text className="text-caption-2 font-medium text-brand-secondary ml-1">Smart Sort</Text>
            </View>
          )}
        </View>

        {/* Date Filter Bar */}
        <DateFilterBar
          activeFilter={dateFilter}
          customDate={customDate}
          onFilterChange={handleFilterChange}
        />

        {/* Task List */}
        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#7C3AED" size="large" />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7C3AED" />
            }
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={
              completedTasks.length > 0 && dateFilter === 'all' ? (
                <View className="mt-4 px-5">
                  <View className="flex-row items-center py-3">
                    <Ionicons name="checkmark-done-outline" size={16} color="#3F3F46" />
                    <Text className="text-subhead text-ink-disabled ml-2">
                      {completedTasks.length} completed
                    </Text>
                  </View>
                </View>
              ) : null
            }
            stickySectionHeadersEnabled={false}
          />
        )}

        {/* FAB */}
        <View className="absolute bottom-8 right-5">
          <TouchableOpacity
            className="w-14 h-14 bg-brand-purple rounded-full items-center justify-center"
            style={{
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowQuickAdd(true);
            }}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Modals */}
      <TaskDetailModal
        visible={showTaskDetail}
        task={selectedTask}
        onClose={() => { setShowTaskDetail(false); setSelectedTask(null); }}
        onStartFocus={(taskId) => {
          setShowTaskDetail(false);
          setSelectedTask(null);
          openFocusModal(taskId);
        }}
      />

      <QuickAddTaskOverlay
        visible={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onTaskCreated={() => { setShowQuickAdd(false); refresh(); }}
        initialDate={addTaskDate}
      />
    </View>
  );
}
