/**
 * Tasks View Screen — Polished Light Theme + AI-Powered
 *
 * This isn't a todo list. It's an AI planner that knows your tasks.
 * Uses unified design tokens for consistent light-mode styling.
 * Focus functionality lives on the dedicated Focus surface (swipe-up).
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler';

import { useTasks } from '../../hooks/supabase/useTasks';
import { useBrainDump } from '../../hooks/supabase/useBrainDump';
import { Task, BrainDumpItem } from '../../lib/supabase';
import { SortedTask } from '../../services/aiTaskSorting';
import { DateFilterBar, DateFilter } from '../../components/DateFilterBar';
import { TaskDetailModal } from '../modals/TaskDetailModal';
import { QuickAddTaskOverlay } from '../modals/QuickAddTaskOverlay';
import { BrainDumpModal } from '../modals/BrainDumpModal';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';
import { useFocusModal } from '../../navigation-v2/FocusModalContext';
import { eventLogger } from '../../services/eventLogger';
import { useGamification } from '../../contexts/GamificationContext';
import { analyticsInvalidationBus } from '../../services/analyticsInvalidationBus';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius, spacing } from '../../styles/theme';

// ============================================================================
// Priority Colors
// ============================================================================

const PRIORITY_COLORS: Record<string, string> = {
  low: semantic.success,
  medium: semantic.warning,
  high: '#FF6B35',
  urgent: semantic.error,
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
  icon?: string;
}

/**
 * Sort tasks chronologically within a section:
 * 1. Tasks with a specific time (not midnight/11pm) first, ascending
 * 2. Tasks without a specific time after timed tasks
 * 3. Stable tiebreaker: created_at ascending
 */
function sortSectionChronologically(tasks: (Task | SortedTask)[]): (Task | SortedTask)[] {
  return [...tasks].sort((a, b) => {
    const aTime = a.due_date ? new Date(a.due_date) : null;
    const bTime = b.due_date ? new Date(b.due_date) : null;
    const aHasTime = aTime ? (aTime.getHours() !== 0 && aTime.getHours() !== 23) : false;
    const bHasTime = bTime ? (bTime.getHours() !== 0 && bTime.getHours() !== 23) : false;

    // Timed tasks before untimed
    if (aHasTime && !bHasTime) return -1;
    if (!aHasTime && bHasTime) return 1;

    // Both timed → earlier first
    if (aHasTime && bHasTime && aTime && bTime) {
      const diff = aTime.getTime() - bTime.getTime();
      if (diff !== 0) return diff;
    }

    // Stable tiebreaker: created_at ascending
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

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

  if (filter === 'today') {
    const items = active.filter((t) => t.due_date && isSameDay(new Date(t.due_date), today));
    return [{ title: 'Today', key: 'today', data: sortSectionChronologically(items), accent: brand.primary, icon: 'today-outline' }];
  }
  if (filter === 'tomorrow') {
    const items = active.filter((t) => t.due_date && isSameDay(new Date(t.due_date), tomorrow));
    return [{ title: 'Tomorrow', key: 'tomorrow', data: sortSectionChronologically(items), accent: semantic.info, icon: 'arrow-forward-circle-outline' }];
  }
  if (filter === 'custom' && customDate) {
    const items = active.filter((t) => t.due_date && isSameDay(new Date(t.due_date), customDate));
    const label = customDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    return [{ title: label, key: 'custom', data: sortSectionChronologically(items) }];
  }

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
  if (overdue.length)     sections.push({ title: 'Overdue', key: 'overdue', data: sortSectionChronologically(overdue), accent: semantic.error, icon: 'alert-circle' });
  if (todayArr.length)    sections.push({ title: 'Today', key: 'today', data: sortSectionChronologically(todayArr), accent: brand.primary, icon: 'today-outline' });
  if (tomorrowArr.length) sections.push({ title: 'Tomorrow', key: 'tomorrow', data: sortSectionChronologically(tomorrowArr), accent: semantic.info, icon: 'arrow-forward-circle-outline' });
  if (later.length)       sections.push({ title: 'Upcoming', key: 'later', data: sortSectionChronologically(later), accent: textTokens.tertiary, icon: 'calendar-outline' });
  if (noDate.length)      sections.push({ title: 'No Date', key: 'anytime', data: sortSectionChronologically(noDate), accent: textTokens.disabled, icon: 'infinite-outline' });
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

function formatDurationReadable(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

// ============================================================================
// Main Component
// ============================================================================

export function TasksViewScreen() {
  const {
    tasks, sortedTasks, loading, error, refresh,
    updateTask, deleteTask, deferTask, completeTask, uncompleteTask, isAISortingActive,
  } = useTasks('all');
  const { convertItem: convertBrainDumpItem } = useBrainDump();
  const { recordTaskCompletion } = useGamification();
  const [refreshing, setRefreshing] = useState(false);
  const { openFocusModal } = useFocusModal();

  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDate, setCustomDate] = useState<Date | null>(null);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Brain Dump state
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [brainDumpSource, setBrainDumpSource] = useState<{ id: string; text: string } | null>(null);
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  // Toast state with optional undo
  const [toast, setToast] = useState<{ message: string; visible: boolean; undoAction?: () => void }>({ message: '', visible: false });
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, undoAction?: () => void) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true, undoAction });
    toastTimerRef.current = setTimeout(() => {
      setToast({ message: '', visible: false });
      toastTimerRef.current = null;
    }, undoAction ? 5000 : 2200);
  }, []);

  useEffect(() => {
    if (selectedTask && showTaskDetail) {
      const updated = sortedTasks.find((t) => t.id === selectedTask.id);
      if (!updated) { setShowTaskDetail(false); setSelectedTask(null); }
      else if (updated !== selectedTask) setSelectedTask(updated as Task);
    }
  }, [sortedTasks]);

  const activeTasks = useMemo(() => sortedTasks.filter((t) => t.status !== 'completed'), [sortedTasks]);
  const completedTasks = useMemo(() => sortedTasks.filter((t) => t.status === 'completed'), [sortedTasks]);
  const sections = useMemo(() => buildSections(sortedTasks, dateFilter, customDate), [sortedTasks, dateFilter, customDate]);

  // Handlers
  const handleFilterChange = useCallback((filter: DateFilter, date?: Date) => {
    setDateFilter(filter);
    setCustomDate(filter === 'custom' && date ? date : null);
    eventLogger.log('feature_used', { feature: 'date_filter_changed', filter });
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleComplete = useCallback(async (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (task.status === 'completed') {
      // Uncomplete — instant, no undo needed
      await uncompleteTask(task.id);
      showToast('Task restored');
      // Invalidate analytics so completed count updates
      setTimeout(() => analyticsInvalidationBus.invalidate(), 600);
    } else {
      // Complete — with undo option
      const ok = await completeTask(task.id);
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Fire gamification event (optimistic XP toast + edge function call)
        recordTaskCompletion(task.id, task.due_date);
        showToast('Task completed', () => {
          // Undo: revert to pending
          uncompleteTask(task.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          showToast('Task restored');
          // Invalidate analytics so completed count updates after undo
          setTimeout(() => analyticsInvalidationBus.invalidate(), 600);
        });
      } else {
        showToast('Couldn\'t complete task. Try again.');
      }
    }
  }, [uncompleteTask, completeTask, showToast, recordTaskCompletion]);

  const handleDefer = useCallback(async (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await deferTask(task.id);
    if (ok) {
      showToast('Moved to tomorrow');
    } else {
      showToast("Couldn't move task. Try again.");
    }
  }, [deferTask, showToast]);

  const handleDelete = useCallback((task: Task) => {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const ok = await deleteTask(task.id);
          if (ok) {
            showToast('Task deleted');
          } else {
            showToast("Couldn't delete task. Try again.");
          }
        },
      },
    ]);
  }, [deleteTask, showToast]);

  // Swipe delete without confirmation (iOS-native pattern) — with undo
  const handleSwipeDelete = useCallback(async (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const ok = await deleteTask(task.id);
    if (ok) {
      showToast('Task deleted');
    } else {
      showToast("Couldn't delete task. Try again.");
    }
  }, [deleteTask, showToast]);

  // Swipe-right quick-defer: bump task to tomorrow
  const handleSwipeDefer = useCallback(async (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await deferTask(task.id);
    if (ok) {
      showToast('Moved to tomorrow');
    } else {
      showToast("Couldn't move task. Try again.");
    }
  }, [deferTask, showToast]);

  // ── Prioritize: explicit user-triggered reorder by scoring formula ──
  // Snapshot of pre-prioritize due_dates for undo
  const prePrioritizeSnapshot = useRef<Map<string, string | null>>(new Map());

  const handlePrioritize = useCallback(async () => {
    if (isPrioritizing) return;
    try {
      setIsPrioritizing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      eventLogger.log('feature_used', { feature: 'ai_prioritize_tasks' });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Gather today's active tasks + any overdue (rescue them into today)
      const todayAndOverdue = activeTasks.filter((t) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return dDate <= today; // overdue + today
      });

      if (todayAndOverdue.length === 0) {
        showToast('No tasks for today to prioritize');
        return;
      }

      // Save snapshot for undo
      const snapshot = new Map<string, string | null>();
      todayAndOverdue.forEach(t => snapshot.set(t.id, t.due_date));
      prePrioritizeSnapshot.current = snapshot;

      // Scoring formula:
      //   urgency_weight: overdue days * 10 (capped at 50)
      //   priority_weight: urgent=40, high=30, medium=20, low=10
      //   due_proximity_weight: tasks with specific time get +5, earlier time gets small bonus
      const PWEIGHT: Record<string, number> = { urgent: 40, high: 30, medium: 20, low: 10 };

      const scored = todayAndOverdue.map(t => {
        const dueDate = t.due_date ? new Date(t.due_date) : now;
        const dDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const overdueDays = Math.max(0, Math.floor((today.getTime() - dDate.getTime()) / 86400000));
        const urgencyWeight = Math.min(overdueDays * 10, 50);
        const priorityWeight = PWEIGHT[t.priority] ?? 20;
        const h = dueDate.getHours();
        const hasTime = h !== 0 && h !== 23;
        const dueProximityWeight = hasTime ? 5 + Math.max(0, (24 - h) * 0.2) : 0;
        const score = urgencyWeight + priorityWeight + dueProximityWeight;
        return { task: t, score };
      });

      // Sort highest score first
      scored.sort((a, b) => b.score - a.score);

      // Stagger due_date times: 9am start, spaced by estimated_duration (or 30m default)
      let cursor = new Date(today);
      cursor.setHours(9, 0, 0, 0);
      let updated = 0;
      for (const { task: t } of scored) {
        const newDue = new Date(cursor);
        const ok = await updateTask(t.id, { due_date: newDue.toISOString() });
        if (ok) updated++;
        cursor.setMinutes(cursor.getMinutes() + (t.estimated_duration || 30));
      }

      handleFilterChange('today');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show toast with Undo (5 sec)
      showToast(`Prioritized ${updated} tasks for today`, () => {
        // Undo: restore original due_dates from snapshot
        const snap = prePrioritizeSnapshot.current;
        snap.forEach(async (originalDue, taskId) => {
          await updateTask(taskId, { due_date: originalDue });
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        showToast('Restored original order');
      });
    } catch (err) {
      console.warn('[Prioritize] Failed:', err);
      showToast("Couldn't prioritize right now. Try again.");
    } finally {
      setIsPrioritizing(false);
    }
  }, [isPrioritizing, activeTasks, updateTask, handleFilterChange, showToast]);

  const handleOpenBrainDump = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    eventLogger.log('feature_used', { feature: 'brain_dump_opened' });
    setShowBrainDump(true);
  }, []);

  // Brain Dump → Move to Tasks: opens Add Task modal prefilled
  const handleMoveToTasks = useCallback((item: BrainDumpItem) => {
    setShowBrainDump(false);
    setBrainDumpSource({ id: item.id, text: item.text });
    // Small delay for modal transition
    setTimeout(() => setShowQuickAdd(true), 350);
  }, []);

  // After conversion: mark brain dump item as converted
  const handleBrainDumpConverted = useCallback(async (brainDumpId: string, taskId: string) => {
    const ok = await convertBrainDumpItem(brainDumpId, taskId);
    if (ok) {
      showToast('Moved to Tasks');
    }
  }, [convertBrainDumpItem, showToast]);

  // Open a task from Brain Dump converted tab
  const handleOpenTaskFromBrainDump = useCallback((taskId: string) => {
    const task = sortedTasks.find((t) => t.id === taskId);
    if (task) {
      setShowBrainDump(false);
      setTimeout(() => {
        setSelectedTask(task as Task);
        setShowTaskDetail(true);
      }, 350);
    }
  }, [sortedTasks]);

  const addTaskDate = useMemo(() => {
    if (dateFilter === 'today') return new Date();
    if (dateFilter === 'tomorrow') { const d = new Date(); d.setDate(d.getDate() + 1); return d; }
    if (dateFilter === 'custom' && customDate) return customDate;
    return new Date();
  }, [dateFilter, customDate]);

  // Clear completed tasks (with confirmation)
  const handleClearCompleted = useCallback(() => {
    if (completedTasks.length === 0) return;
    Alert.alert(
      'Clear Completed',
      `Delete ${completedTasks.length} completed task${completedTasks.length !== 1 ? 's' : ''}? This can\u2019t be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All', style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            let cleared = 0;
            await Promise.all(completedTasks.map(async (t) => {
              const ok = await deleteTask(t.id);
              if (ok) cleared++;
            }));
            setShowCompleted(false);
            showToast(`Cleared ${cleared} completed task${cleared !== 1 ? 's' : ''}`);
          },
        },
      ],
    );
  }, [completedTasks, deleteTask, showToast]);

  // ── List Header: Action Pills + Time Summary ──
  const filterLabel = dateFilter === 'today' ? 'Today' : dateFilter === 'tomorrow' ? 'Tomorrow' : dateFilter === 'custom' ? 'Selected date' : 'All active';
  const renderListHeader = () => (
    <View style={{ paddingVertical: spacing.xs }}>
      {/* Action Pills */}
      <View style={s.listHeaderPills}>
        <TouchableOpacity
          style={s.prioritizeBtn}
          onPress={handlePrioritize}
          activeOpacity={0.8}
          disabled={isPrioritizing}
          accessibilityRole="button"
          accessibilityLabel="Prioritize tasks"
        >
          {isPrioritizing ? (
            <ActivityIndicator size="small" color={textTokens.inverse} />
          ) : (
            <>
              <Ionicons name="flash" size={16} color={textTokens.inverse} />
              <Text style={[s.pillBtnText, { color: textTokens.inverse }]}>Prioritize</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={s.brainDumpBtn}
          onPress={handleOpenBrainDump}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Brain Dump"
        >
          <Ionicons name="bulb-outline" size={16} color={brand.primary} />
          <Text style={[s.pillBtnText, { color: brand.primary }]}>Brain Dump</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Swipe Action Panels ──
  // Swipe LEFT → Delete (red)
  const renderRightActions = useCallback((task: Task | SortedTask) => (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>,
  ) => {
    if (task.status === 'completed') return null;
    const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0.5], extrapolate: 'clamp' });
    return (
      <RectButton
        style={[s.swipeAction, { backgroundColor: semantic.info, borderTopRightRadius: radius.lg, borderBottomRightRadius: radius.lg, marginRight: 16 }]}
        onPress={() => handleSwipeDefer(task)}
      >
        <RNAnimated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={20} color={textTokens.inverse} />
          <Text style={s.swipeActionText}>Defer</Text>
        </RNAnimated.View>
      </RectButton>
    );
  }, [handleSwipeDefer]);

  // Swipe RIGHT → Complete (green)
  const renderLeftActions = useCallback((task: Task | SortedTask) => (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>,
  ) => {
    if (task.status === 'completed') return null;
    const scale = dragX.interpolate({ inputRange: [0, 80], outputRange: [0.5, 1], extrapolate: 'clamp' });
    return (
      <RectButton
        style={[s.swipeAction, { backgroundColor: semantic.success, borderTopLeftRadius: radius.lg, borderBottomLeftRadius: radius.lg, marginLeft: 16 }]}
        onPress={() => handleComplete(task)}
      >
        <RNAnimated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <Ionicons name="checkmark" size={20} color={textTokens.inverse} />
          <Text style={s.swipeActionText}>Done</Text>
        </RNAnimated.View>
      </RectButton>
    );
  }, [handleComplete]);

  // ── Task Card ──
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const renderTask = useCallback(({ item: task }: { item: Task | SortedTask }) => {
    const isOverdue = task.due_date
      ? new Date(task.due_date) < new Date() && task.status !== 'completed'
      : false;
    const time = task.due_date ? formatTaskTime(task.due_date) : null;
    const dur = task.estimated_duration ? formatDurationReadable(task.estimated_duration) : null;
    const dateLabel = task.due_date ? formatDateLabel(task.due_date) : null;
    const pColor = PRIORITY_COLORS[task.priority] || '#AEAEB2';
    const sortedTask = task as SortedTask;
    const aiReason = sortedTask.sortReason && sortedTask.isOptimalTime ? sortedTask.sortReason : null;
    const hasNotes = !!(task.description && task.description.trim().length > 0 && !task.description.startsWith('['));

    return (
      <Swipeable
        ref={(ref: Swipeable | null) => { if (ref) swipeableRefs.current.set(task.id, ref); }}
        renderRightActions={renderRightActions(task)}
        renderLeftActions={renderLeftActions(task)}
        overshootRight={false}
        overshootLeft={false}
        friction={2}
        rightThreshold={40}
        leftThreshold={40}
        onSwipeableOpen={(direction) => {
          if (direction === 'right') handleSwipeDefer(task);
          else if (direction === 'left') handleComplete(task);
          // Close after action
          setTimeout(() => swipeableRefs.current.get(task.id)?.close(), 300);
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { setSelectedTask(task); setShowTaskDetail(true); }}
          style={[s.taskCard, isOverdue && s.taskCardOverdue]}
        >
          {/* Priority accent — 4px left border */}
          <View style={[s.taskAccent, { backgroundColor: pColor }]} />

          <View style={s.taskContent}>
            {/* Checkbox */}
            <TouchableOpacity
              onPress={() => handleComplete(task)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={s.checkbox}
              accessibilityRole="button"
              accessibilityLabel={task.status === 'completed' ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
            >
              <View style={[
                s.checkboxCircle,
                task.status === 'completed'
                  ? { borderWidth: 0, backgroundColor: brand.primary }
                  : { borderWidth: 2, borderColor: borderTokens.primary, backgroundColor: 'transparent' },
              ]}>
                {task.status === 'completed' && (
                  <Ionicons name="checkmark" size={14} color={textTokens.inverse} />
                )}
              </View>
            </TouchableOpacity>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={2}
                style={[
                  s.taskTitle,
                  task.status === 'completed' && { color: textTokens.tertiary, textDecorationLine: 'line-through' },
                ]}
              >
                {task.title}
              </Text>

              {/* Metadata pills — iOS rounded pill design */}
              <View style={s.metadataPills}>
                {isOverdue && task.due_date && (
                  <View style={s.overduePill}>
                    <Ionicons name="alert-circle" size={12} color={semantic.error} />
                    <Text style={[s.pillText, { fontWeight: '600', color: semantic.error, marginLeft: 4 }]}>
                      {formatOverdueLabel(task.due_date)}
                    </Text>
                  </View>
                )}
                {dateLabel ? (
                  <View style={s.pill}>
                    <Text style={s.pillText}>{dateLabel}</Text>
                  </View>
                ) : null}
                {time && (
                  <View style={s.pillRow}>
                    <Ionicons name="time-outline" size={12} color={textTokens.secondary} />
                    <Text style={[s.pillText, { marginLeft: 4 }]}>{time}</Text>
                  </View>
                )}
                {dur && (
                  <View style={s.pillRow}>
                    <Ionicons name="hourglass-outline" size={12} color={textTokens.secondary} />
                    <Text style={[s.pillText, { marginLeft: 4 }]}>{dur}</Text>
                  </View>
                )}
                {hasNotes && (
                  <View style={s.pill}>
                    <Ionicons name="document-text-outline" size={12} color={textTokens.tertiary} />
                  </View>
                )}
                {aiReason && (
                  <View style={s.aiPill}>
                    <Ionicons name="sparkles" size={10} color={brand.primary} />
                    <Text style={{ fontSize: 11, color: brand.primary, fontWeight: '600', marginLeft: 3 }}>{aiReason}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  }, [handleComplete, handleDelete, handleSwipeDefer, renderRightActions, renderLeftActions]);

  // ── Section Header ──
  const renderSectionHeader = useCallback(({ section }: { section: TaskSection }) => (
    <View style={s.sectionHeaderWrap}>
      {section.icon && <Ionicons name={section.icon as any} size={14} color={section.accent || textTokens.tertiary} style={{ marginRight: 7 }} />}
      <Text style={[s.sectionHeaderText, { color: section.accent || textTokens.secondary }]}>
        {section.title}
      </Text>
      <View style={[s.sectionCountBadge, { backgroundColor: `${section.accent || textTokens.tertiary}12` }]}>
        <Text style={[s.sectionCountText, { color: section.accent || textTokens.secondary }]}>
          {section.data.length}
        </Text>
      </View>
    </View>
  ), []);

  // ── Empty State ──
  const renderEmpty = () => {
    const isFiltered = dateFilter !== 'all';
    const label =
      dateFilter === 'today' ? 'Nothing due today' :
      dateFilter === 'tomorrow' ? 'Nothing due tomorrow' :
      dateFilter === 'custom' ? 'No tasks on this date' :
      'All clear! 🎉';
    const subtitle = isFiltered
      ? 'Switch to \"All\" to see everything, or tap + to add one'
      : 'Tap + to capture your first task';

    return (
      <View style={s.emptyWrap}>
        <View style={s.emptyIcon}>
          <Ionicons name={isFiltered ? 'calendar-outline' : 'checkmark-done'} size={30} color={brand.primary} />
        </View>
        <Text style={s.emptyTitle}>{label}</Text>
        <Text style={s.emptySubtitle}>
          {subtitle}
        </Text>
      </View>
    );
  };

  // ── Completed Footer ──
  const renderCompletedFooter = () => {
    if (completedTasks.length === 0 || dateFilter !== 'all') return null;
    return (
      <View style={s.completedWrap}>
        <TouchableOpacity
          style={[s.completedToggle, showCompleted && { backgroundColor: brand.muted }]}
          onPress={() => { Haptics.selectionAsync(); setShowCompleted((v) => !v); }}
          activeOpacity={0.7}
        >
          <View style={[s.completedChevronBox, { backgroundColor: showCompleted ? brand.surface : borderTokens.secondary }]}>
            <Ionicons name={showCompleted ? 'chevron-down' : 'chevron-forward'} size={14} color={showCompleted ? brand.primary : textTokens.tertiary} />
          </View>
          <Text style={[s.completedLabel, { color: showCompleted ? brand.primary : textTokens.tertiary }]}>
            Completed
          </Text>
          <View style={[s.completedCountBadge, { backgroundColor: showCompleted ? brand.surface : borderTokens.secondary }]}>
            <Text style={[s.completedCountText, { color: showCompleted ? brand.primary : textTokens.tertiary }]}>
              {completedTasks.length}
            </Text>
          </View>
        </TouchableOpacity>

        {showCompleted && completedTasks.length > 0 && (
          <TouchableOpacity
            onPress={handleClearCompleted}
            style={s.clearAllBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Clear all completed tasks"
          >
            <Text style={s.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}

        {showCompleted && (
          <View style={s.completedList}>
            {completedTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={s.completedItem}
                onPress={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                activeOpacity={0.7}
              >
                <TouchableOpacity
                  onPress={() => handleComplete(task)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${task.title} incomplete`}
                >
                  <View style={s.completedCheckbox}>
                    <Ionicons name="checkmark" size={13} color={textTokens.inverse} />
                  </View>
                </TouchableOpacity>
                <Text numberOfLines={1} style={s.completedItemTitle}>
                  {task.title}
                </Text>
                {task.completed_at && (
                  <Text style={s.completedItemDate}>
                    {new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  // ── Error State ──
  if (error && !loading) {
    return (
      <View style={s.errorWrap}>
        <StatusBar barStyle="dark-content" />
        <View style={s.errorIcon}>
          <Ionicons name="cloud-offline-outline" size={28} color={semantic.error} />
        </View>
        <Text style={s.errorTitle}>Couldn't load tasks</Text>
        <Text style={s.errorSubtitle}>Check your connection and try again.</Text>
        <TouchableOpacity style={s.errorButton} onPress={refresh}>
          <Text style={s.errorButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main ──
  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={s.headerWrap}>
          <View style={s.headerRow}>
            <Text style={s.headerTitle}>Tasks</Text>
            <View style={s.headerRight}>
              {isAISortingActive && (
                <View style={s.smartSortBadge}>
                  <Ionicons name="sparkles" size={13} color={brand.primary} />
                  <Text style={s.smartSortText}>Smart Sort</Text>
                </View>
              )}
              <MiniVoiceButton position="top-right" screenContext="tasks" size={52} style={{ position: 'relative', top: 0, right: 0 }} />
            </View>
          </View>
          <Text style={s.dateSubtitle}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Filters */}
        <DateFilterBar activeFilter={dateFilter} customDate={customDate} onFilterChange={handleFilterChange} />

        {/* Content */}
        {loading && !refreshing ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={brand.primary} size="large" />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={brand.primary} />}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderCompletedFooter}
            stickySectionHeadersEnabled={false}
          />
        )}

        {/* FAB */}
        <View style={s.fabWrap}>
          <TouchableOpacity
            style={s.fab}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowQuickAdd(true); }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Add new task"
          >
            <Ionicons name="add" size={28} color={textTokens.inverse} />
          </TouchableOpacity>
        </View>


      </SafeAreaView>

      {/* Modals */}
      <TaskDetailModal
        visible={showTaskDetail}
        task={selectedTask}
        onClose={() => { setShowTaskDetail(false); setSelectedTask(null); }}
        onStartFocus={(taskId) => { setShowTaskDetail(false); setSelectedTask(null); openFocusModal(taskId); }}
        taskActions={{ updateTask, deleteTask, deferTask, completeTask, uncompleteTask }}
      />
      <QuickAddTaskOverlay
        visible={showQuickAdd}
        onClose={() => { setShowQuickAdd(false); setBrainDumpSource(null); }}
        onTaskCreated={() => { setShowQuickAdd(false); setBrainDumpSource(null); showToast('Task created'); refresh(); }}
        onBrainDumpCreated={() => { setShowQuickAdd(false); setBrainDumpSource(null); showToast('Saved to Brain Dump'); }}
        initialDate={addTaskDate}
        brainDumpSource={brainDumpSource}
        onBrainDumpConverted={handleBrainDumpConverted}
      />
      <BrainDumpModal
        visible={showBrainDump}
        onClose={() => setShowBrainDump(false)}
        onMoveToTasks={handleMoveToTasks}
        onOpenTask={handleOpenTaskFromBrainDump}
        tasks={sortedTasks}
      />

      {/* Toast / Undo Snackbar */}
      {toast.visible && (
        <View style={s.toastWrapper} pointerEvents="box-none">
          <View style={[s.toastContainer, shadows.lg]}>
            <Text style={s.toastText}>{toast.message}</Text>
            {toast.undoAction && (
              <TouchableOpacity
                onPress={() => {
                  if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                  toast.undoAction?.();
                }}
                style={s.toastUndoButton}
                accessibilityRole="button"
                accessibilityLabel="Undo task completion"
              >
                <Text style={s.toastUndoText}>Undo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: bg.primary,
  },
  headerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: textTokens.primary,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  smartSortBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.muted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  smartSortText: {
    fontSize: 12,
    fontWeight: '600',
    color: brand.primary,
    marginLeft: 4,
  },
  dateSubtitle: {
    fontSize: 13,
    color: textTokens.tertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  // ── Section Header ──
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 22,
    paddingBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionCountBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    minWidth: 22,
    alignItems: 'center',
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // ── Task Card ──
  taskCard: {
    marginHorizontal: spacing.base,
    marginBottom: 10,
    backgroundColor: bg.card,
    borderRadius: radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.sm,
  },
  taskCardOverdue: {
    backgroundColor: semantic.errorLight,
    borderWidth: 0.5,
    borderColor: 'rgba(220,38,38,0.12)',
  },
  taskAccent: {
    width: 4,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  checkbox: {
    marginTop: 1,
    marginRight: 12,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '500',
  },
  metadataPills: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: bg.secondary,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: bg.secondary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: textTokens.secondary,
  },
  overduePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.10)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.muted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  // ── FAB ──
  fabWrap: {
    position: 'absolute',
    bottom: 36,
    right: spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.purple,
    elevation: 10,
  },
  // ── Toast ──
  toastWrapper: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: textTokens.primary,
    paddingLeft: 18,
    paddingVertical: 11,
    borderRadius: 14,
    maxWidth: 320,
  },
  toastText: {
    color: textTokens.inverse,
    fontSize: 14.5,
    fontWeight: '600',
    flex: 1,
  },
  toastUndoButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  toastUndoText: {
    color: brand.secondary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  // ── Swipe Actions ──
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 10,
  },
  swipeActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: textTokens.inverse,
    marginTop: 3,
  },
  // ── Empty State ──
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: brand.muted,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.purple,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: textTokens.primary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 14,
    color: textTokens.tertiary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  // ── Error ──
  errorWrap: {
    flex: 1,
    backgroundColor: bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(220,38,38,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: textTokens.primary,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: textTokens.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 20,
    backgroundColor: brand.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: textTokens.inverse,
  },
  // ── List Header ──
  listHeaderPills: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingTop: 6,
    paddingBottom: 6,
    gap: 10,
  },
  prioritizeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.primary,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
    minHeight: 48,
    ...shadows.purple,
  },
  brainDumpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.muted,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.15)',
    gap: 8,
    minHeight: 48,
  },
  pillBtnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  // ── Completed Footer ──
  completedWrap: {
    marginTop: spacing.base,
    marginBottom: spacing.xl,
  },
  completedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.base,
    borderRadius: radius.sm,
  },
  completedChevronBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  completedLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  completedCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 26,
    alignItems: 'center',
  },
  completedCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clearAllBtn: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: semantic.error,
  },
  completedList: {
    marginTop: spacing.xs,
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginHorizontal: spacing.base,
    marginBottom: 4,
    borderRadius: radius.sm,
    backgroundColor: bg.hover,
  },
  completedCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  completedItemTitle: {
    flex: 1,
    fontSize: 14,
    color: textTokens.tertiary,
    textDecorationLine: 'line-through',
  },
  completedItemDate: {
    fontSize: 11,
    color: textTokens.disabled,
    marginLeft: 8,
  },
});
