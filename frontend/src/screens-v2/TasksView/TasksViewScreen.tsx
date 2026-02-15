/**
 * Tasks View Screen — Light Theme + AI-Powered
 *
 * This isn't a todo list. It's an AI planner that knows your tasks.
 * The AI Task Assistant strip provides contextual task management help.
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

// ============================================================================
// Light Theme Palette
// ============================================================================

const L = {
  // Surfaces
  bg: '#F5F5F7',
  card: '#FFFFFF',
  cardBorder: '#EDEDF0',
  // Typography
  textPrimary: '#1C1C1E',
  textSecondary: '#48484A',
  textTertiary: '#8E8E93',
  textQuaternary: '#C7C7CC',
  // Dividers
  divider: '#EDEDF0',
  // Accent
  purple: '#7C3AED',
  purpleLight: '#F5F0FF',
  purpleMid: '#EDE5FF',
  // Semantic
  overdueBg: '#FEF2F2',
  overdueAccent: '#DC2626',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#34C759',
  medium: '#FF9F0A',
  high: '#FF6B35',
  urgent: '#FF3B30',
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
    return [{ title: 'Today', key: 'today', data: sortSectionChronologically(items), accent: L.purple, icon: 'today-outline' }];
  }
  if (filter === 'tomorrow') {
    const items = active.filter((t) => t.due_date && isSameDay(new Date(t.due_date), tomorrow));
    return [{ title: 'Tomorrow', key: 'tomorrow', data: sortSectionChronologically(items), accent: '#3B82F6', icon: 'arrow-forward-circle-outline' }];
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
  if (overdue.length)     sections.push({ title: 'Overdue', key: 'overdue', data: sortSectionChronologically(overdue), accent: '#DC2626', icon: 'alert-circle' });
  if (todayArr.length)    sections.push({ title: 'Today', key: 'today', data: sortSectionChronologically(todayArr), accent: L.purple, icon: 'today-outline' });
  if (tomorrowArr.length) sections.push({ title: 'Tomorrow', key: 'tomorrow', data: sortSectionChronologically(tomorrowArr), accent: '#3B82F6', icon: 'arrow-forward-circle-outline' });
  if (later.length)       sections.push({ title: 'Upcoming', key: 'later', data: sortSectionChronologically(later), accent: '#8E8E93', icon: 'calendar-outline' });
  if (noDate.length)      sections.push({ title: 'No Date', key: 'anytime', data: sortSectionChronologically(noDate), accent: '#AEAEB2', icon: 'infinite-outline' });
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

interface TimeStats {
  totalMinutes: number;
  taskCount: number;
  withEstimate: number;
  missingEstimate: number;
  label: string;
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

  // Time stats — derived from the currently viewed day's tasks
  const timeStats = useMemo(() => {
    let relevantTasks: (Task | SortedTask)[] = [];
    let label = 'Today';

    if (dateFilter === 'today') {
      const s = sections.find((sec) => sec.key === 'today');
      relevantTasks = s ? s.data : [];
      label = 'Today';
    } else if (dateFilter === 'tomorrow') {
      const s = sections.find((sec) => sec.key === 'tomorrow');
      relevantTasks = s ? s.data : [];
      label = 'Tomorrow';
    } else if (dateFilter === 'custom' && customDate) {
      const s = sections.find((sec) => sec.key === 'custom');
      relevantTasks = s ? s.data : [];
      label = customDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // "All" filter — show stats for today's section
      const s = sections.find((sec) => sec.key === 'today');
      relevantTasks = s ? s.data : [];
      label = 'Today';
    }

    let total = 0;
    let withEst = 0;
    let missing = 0;
    for (const t of relevantTasks) {
      if (t.estimated_duration && t.estimated_duration > 0) {
        total += t.estimated_duration;
        withEst++;
      } else {
        missing++;
      }
    }
    return { totalMinutes: total, taskCount: relevantTasks.length, withEstimate: withEst, missingEstimate: missing, label };
  }, [sections, dateFilter, customDate]);



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
    } else {
      // Complete — with undo option
      const ok = await completeTask(task.id);
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Task completed', () => {
          // Undo: revert to pending
          uncompleteTask(task.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          showToast('Task restored');
        });
      } else {
        showToast('Couldn\'t complete task. Try again.');
      }
    }
  }, [uncompleteTask, completeTask, showToast]);

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
    <View style={{ paddingTop: 4, paddingBottom: 4 }}>
      {/* Action Pills */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6, gap: 10 }}>
        <TouchableOpacity
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: L.purple, paddingVertical: 13, borderRadius: 14, gap: 8, minHeight: 48,
            shadowColor: L.purple, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
          }}
          onPress={handlePrioritize}
          activeOpacity={0.8}
          disabled={isPrioritizing}
          accessibilityRole="button"
          accessibilityLabel="Prioritize tasks"
        >
          {isPrioritizing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="flash" size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.1 }}>Prioritize</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: L.purpleLight, paddingVertical: 13, borderRadius: 14,
            borderWidth: 1, borderColor: 'rgba(124,58,237,0.15)', gap: 8, minHeight: 48,
          }}
          onPress={handleOpenBrainDump}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Brain Dump"
        >
          <Ionicons name="bulb-outline" size={16} color={L.purple} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: L.purple, letterSpacing: 0.1 }}>Brain Dump</Text>
        </TouchableOpacity>
      </View>

      {/* Time Needed Card */}
      {timeStats.taskCount > 0 && (
        <View style={{
          marginHorizontal: 16, marginTop: 6, marginBottom: 2,
          backgroundColor: L.card,
          borderRadius: 14,
          paddingHorizontal: 16, paddingVertical: 14,
          flexDirection: 'row', alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        }}>
          <View style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: L.purpleLight,
            alignItems: 'center', justifyContent: 'center',
            marginRight: 14,
          }}>
            <Ionicons name="timer-outline" size={18} color={L.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: L.textPrimary, letterSpacing: -0.3 }}>
                {timeStats.withEstimate > 0 ? formatDurationReadable(timeStats.totalMinutes) : '—'}
              </Text>
              {timeStats.withEstimate > 0 && (
                <Text style={{ fontSize: 12, fontWeight: '500', color: L.textTertiary, marginLeft: 6 }}>estimated</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
              <Text style={{ fontSize: 12.5, color: L.textTertiary, fontWeight: '500' }}>
                {timeStats.label} · {timeStats.taskCount} task{timeStats.taskCount !== 1 ? 's' : ''}
              </Text>
              {timeStats.missingEstimate > 0 && (
                <>
                  <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: L.textQuaternary, marginHorizontal: 8 }} />
                  <Text style={{ fontSize: 12.5, color: '#E5A100', fontWeight: '500' }}>
                    {timeStats.missingEstimate} unestimated
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // ── Swipe Action Panels ──
  const renderRightActions = useCallback((task: Task | SortedTask) => (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0.5], extrapolate: 'clamp' });
    return (
      <RectButton
        style={{
          backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center',
          width: 80, borderTopRightRadius: 14, borderBottomRightRadius: 14,
          marginBottom: 10, marginRight: 16,
        }}
        onPress={() => handleDelete(task)}
      >
        <RNAnimated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff', marginTop: 3 }}>Delete</Text>
        </RNAnimated.View>
      </RectButton>
    );
  }, [handleDelete]);

  const renderLeftActions = useCallback((task: Task | SortedTask) => (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>,
  ) => {
    if (task.status === 'completed') return null;
    const scale = dragX.interpolate({ inputRange: [0, 80], outputRange: [0.5, 1], extrapolate: 'clamp' });
    return (
      <RectButton
        style={{
          backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center',
          width: 80, borderTopLeftRadius: 14, borderBottomLeftRadius: 14,
          marginBottom: 10, marginLeft: 16,
        }}
        onPress={() => handleSwipeDefer(task)}
      >
        <RNAnimated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff', marginTop: 3 }}>Tomorrow</Text>
        </RNAnimated.View>
      </RectButton>
    );
  }, [handleSwipeDefer]);

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
          if (direction === 'right') handleDelete(task);
          else if (direction === 'left') handleSwipeDefer(task);
          // Close after action
          setTimeout(() => swipeableRefs.current.get(task.id)?.close(), 300);
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { setSelectedTask(task); setShowTaskDetail(true); }}
          style={{
            marginHorizontal: 16, marginBottom: 10,
            backgroundColor: isOverdue ? L.overdueBg : L.card,
            borderRadius: 14,
            flexDirection: 'row',
            overflow: 'hidden',
            borderWidth: 0.5,
            borderColor: isOverdue ? 'rgba(220,38,38,0.12)' : L.cardBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Priority accent */}
          <View style={{ width: 3, backgroundColor: pColor, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }} />

          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 14 }}>
            {/* Checkbox */}
            <TouchableOpacity
              onPress={() => handleComplete(task)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ marginTop: 1, marginRight: 12 }}
              accessibilityRole="button"
              accessibilityLabel={task.status === 'completed' ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
            >
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                borderWidth: task.status === 'completed' ? 0 : 2,
                borderColor: task.status === 'completed' ? 'transparent' : pColor,
                backgroundColor: task.status === 'completed' ? L.purple : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {task.status === 'completed' && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 15.5, lineHeight: 21, fontWeight: '500',
                  color: task.status === 'completed' ? L.textTertiary : L.textPrimary,
                  textDecorationLine: task.status === 'completed' ? 'line-through' : 'none',
                }}
              >
                {task.title}
              </Text>

              {/* Metadata pills — iOS rounded pill design */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 6, gap: 6 }}>
                {isOverdue && task.due_date && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: 'rgba(220,38,38,0.10)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                  }}>
                    <Ionicons name="alert-circle" size={12} color={L.overdueAccent} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: L.overdueAccent, marginLeft: 4 }}>
                      {formatOverdueLabel(task.due_date)}
                    </Text>
                  </View>
                )}
                {dateLabel ? (
                  <View style={{
                    backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: L.textSecondary }}>{dateLabel}</Text>
                  </View>
                ) : null}
                {time && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                  }}>
                    <Ionicons name="time-outline" size={12} color={L.textSecondary} />
                    <Text style={{ fontSize: 12, fontWeight: '500', color: L.textSecondary, marginLeft: 4 }}>{time}</Text>
                  </View>
                )}
                {dur && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                  }}>
                    <Ionicons name="hourglass-outline" size={12} color={L.textSecondary} />
                    <Text style={{ fontSize: 12, fontWeight: '500', color: L.textSecondary, marginLeft: 4 }}>{dur}</Text>
                  </View>
                )}
                {hasNotes && (
                  <View style={{
                    backgroundColor: '#F2F2F7', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8,
                  }}>
                    <Ionicons name="document-text-outline" size={12} color={L.textTertiary} />
                  </View>
                )}
                {aiReason && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: L.purpleLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                  }}>
                    <Ionicons name="sparkles" size={10} color={L.purple} />
                    <Text style={{ fontSize: 11, color: L.purple, fontWeight: '600', marginLeft: 3 }}>{aiReason}</Text>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 10 }}>
      {section.icon && <Ionicons name={section.icon as any} size={14} color={section.accent || L.textTertiary} style={{ marginRight: 7 }} />}
      <Text style={{ fontSize: 13, fontWeight: '700', color: section.accent || L.textSecondary, letterSpacing: 0.6 }}>
        {section.title.toUpperCase()}
      </Text>
      <View style={{
        marginLeft: 8, backgroundColor: `${section.accent || L.textTertiary}12`,
        paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7,
        minWidth: 22, alignItems: 'center',
      }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: section.accent || L.textSecondary }}>
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
      'You\'re all clear';
    const subtitle = isFiltered
      ? 'Switch to \"All\" to see everything, or tap + to add one'
      : 'Tap + to capture your first task';

    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 72, paddingHorizontal: 40 }}>
        <View style={{
          width: 64, height: 64, borderRadius: 20, marginBottom: 20,
          backgroundColor: L.purpleLight,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: L.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
        }}>
          <Ionicons name={isFiltered ? 'calendar-outline' : 'checkmark-done'} size={30} color={L.purple} />
        </View>
        <Text style={{ fontSize: 19, fontWeight: '700', color: L.textPrimary, textAlign: 'center', letterSpacing: -0.2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: L.textTertiary, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
          {subtitle}
        </Text>
      </View>
    );
  };

  // ── Completed Footer ──
  const renderCompletedFooter = () => {
    if (completedTasks.length === 0 || dateFilter !== 'all') return null;
    return (
      <View style={{ marginTop: 16, marginBottom: 24 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 12,
            marginHorizontal: 16, borderRadius: 12,
            backgroundColor: showCompleted ? L.purpleLight : 'transparent',
          }}
          onPress={() => { Haptics.selectionAsync(); setShowCompleted((v) => !v); }}
          activeOpacity={0.7}
        >
          <View style={{
            width: 28, height: 28, borderRadius: 8,
            backgroundColor: showCompleted ? L.purpleMid : L.divider,
            alignItems: 'center', justifyContent: 'center', marginRight: 10,
          }}>
            <Ionicons name={showCompleted ? 'chevron-down' : 'chevron-forward'} size={14} color={showCompleted ? L.purple : L.textTertiary} />
          </View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: showCompleted ? L.purple : L.textTertiary, flex: 1 }}>
            Completed
          </Text>
          <View style={{
            backgroundColor: showCompleted ? L.purpleMid : L.divider,
            paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, minWidth: 26, alignItems: 'center',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: showCompleted ? L.purple : L.textTertiary }}>
              {completedTasks.length}
            </Text>
          </View>
        </TouchableOpacity>

        {showCompleted && completedTasks.length > 0 && (
          <TouchableOpacity
            onPress={handleClearCompleted}
            style={{ alignSelf: 'flex-end', marginRight: 20, marginTop: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Clear all completed tasks"
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF3B30' }}>Clear All</Text>
          </TouchableOpacity>
        )}

        {showCompleted && (
          <View style={{ marginTop: 8 }}>
            {completedTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 11, paddingHorizontal: 14,
                  marginHorizontal: 16, marginBottom: 4,
                  borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.02)',
                }}
                onPress={() => { setSelectedTask(task); setShowTaskDetail(true); }}
                activeOpacity={0.7}
              >
                <TouchableOpacity
                  onPress={() => handleComplete(task)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ marginRight: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${task.title} incomplete`}
                >
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: L.purple,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, color: L.textTertiary, textDecorationLine: 'line-through' }}>
                  {task.title}
                </Text>
                {task.completed_at && (
                  <Text style={{ fontSize: 11, color: L.textQuaternary, marginLeft: 8 }}>
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
      <View style={{ flex: 1, backgroundColor: L.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <StatusBar barStyle="dark-content" />
        <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#FFF1F0', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Ionicons name="cloud-offline-outline" size={28} color="#FF3B30" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '600', color: L.textPrimary, textAlign: 'center' }}>Couldn't load tasks</Text>
        <Text style={{ fontSize: 14, color: L.textSecondary, marginTop: 4, textAlign: 'center' }}>Check your connection and try again.</Text>
        <TouchableOpacity style={{ marginTop: 20, backgroundColor: L.purple, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }} onPress={refresh}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main ──
  return (
    <View style={{ flex: 1, backgroundColor: L.bg }}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 34, fontWeight: '800', color: L.textPrimary, letterSpacing: -0.5 }}>Tasks</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {isAISortingActive && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: L.purpleLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                  <Ionicons name="sparkles" size={13} color={L.purple} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: L.purple, marginLeft: 4 }}>Smart Sort</Text>
                </View>
              )}
              <MiniVoiceButton position="top-right" screenContext="tasks" size={52} style={{ position: 'relative', top: 0, right: 0 }} />
            </View>
          </View>
          <Text style={{ fontSize: 13, color: L.textTertiary, marginTop: 2, fontWeight: '500' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Filters */}
        <DateFilterBar activeFilter={dateFilter} customDate={customDate} onFilterChange={handleFilterChange} />

        {/* Content */}
        {loading && !refreshing ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={L.purple} size="large" />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={L.purple} />}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderCompletedFooter}
            stickySectionHeadersEnabled={false}
          />
        )}

        {/* FAB */}
        <View style={{ position: 'absolute', bottom: 36, right: 20 }}>
          <TouchableOpacity
            style={{
              width: 58, height: 58, borderRadius: 29,
              backgroundColor: L.purple,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: L.purple,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 14,
              elevation: 10,
            }}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowQuickAdd(true); }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Add new task"
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
        <View
          style={{
            position: 'absolute',
            bottom: 100,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 999,
          }}
          pointerEvents="box-none"
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(28,28,30,0.92)',
              paddingLeft: 18,
              paddingRight: toast.undoAction ? 6 : 18,
              paddingVertical: 11,
              borderRadius: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 12,
              maxWidth: 320,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14.5, fontWeight: '600', flex: 1 }}>{toast.message}</Text>
            {toast.undoAction && (
              <TouchableOpacity
                onPress={() => {
                  if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                  toast.undoAction?.();
                }}
                style={{ marginLeft: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' }}
                accessibilityRole="button"
                accessibilityLabel="Undo task completion"
              >
                <Text style={{ color: '#A78BFA', fontSize: 13.5, fontWeight: '700' }}>Undo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
