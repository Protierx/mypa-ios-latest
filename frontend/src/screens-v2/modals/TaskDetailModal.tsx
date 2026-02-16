/**
 * Task Detail Modal — Light Theme + AI Context
 *
 * Shows full task details with editing, completion, defer, delete, focus.
 * Now includes an AI insight about the task — making the AI feel present
 * even when viewing individual tasks.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTasks } from '../../hooks/supabase/useTasks';
import { useGamification } from '../../contexts/GamificationContext';
import { analyticsInvalidationBus } from '../../services/analyticsInvalidationBus';
import { Task } from '../../lib/supabase';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius } from '../../styles/theme';

const PRIORITY_COLORS: Record<string, string> = {
  low: '#34C759',
  medium: '#FF9F0A',
  high: '#FF6B35',
  urgent: '#FF3B30',
};

// ============================================================================
// AI Task Insight (local heuristic)
// ============================================================================

function getTaskInsight(task: Task): { message: string; icon: string; color: string } | null {
  const now = new Date();

  if (task.status === 'completed') {
    const completedDate = task.completed_at ? new Date(task.completed_at) : null;
    if (completedDate) {
      const daysAgo = Math.floor((now.getTime() - completedDate.getTime()) / 86400000);
      if (daysAgo === 0) return { message: 'Great work completing this today!', icon: 'trophy', color: '#EAB308' };
      return { message: `Completed ${daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`}. Nice.`, icon: 'checkmark-circle', color: '#34C759' };
    }
    return null;
  }

  if (task.due_date) {
    const due = new Date(task.due_date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);

    if (daysUntil < 0) {
      const overdue = Math.abs(daysUntil);
      return {
        message: overdue === 1 ? 'This was due yesterday. Reschedule or knock it out now.' : `${overdue} days overdue. Consider breaking it into smaller steps.`,
        icon: 'alert-circle',
        color: '#FF3B30',
      };
    }
    if (daysUntil === 0) {
      if (task.priority === 'urgent' || task.priority === 'high') {
        return { message: 'Due today and high priority. I\'d tackle this first.', icon: 'flash', color: '#FF6B35' };
      }
      return { message: 'Due today. You\'ve got this.', icon: 'sunny', color: '#FF9F0A' };
    }
    if (daysUntil === 1) return { message: 'Due tomorrow. Good time to prepare.', icon: 'arrow-forward-circle', color: '#3B82F6' };
    if (daysUntil <= 3) return { message: `Due in ${daysUntil} days. On track.`, icon: 'calendar', color: '#8B5CF6' };
  }

  if (task.priority === 'urgent') return { message: 'Urgent priority. Consider scheduling a focus session.', icon: 'flame', color: '#FF3B30' };
  if (task.priority === 'high' && !task.due_date) return { message: 'High priority but no due date. Adding one helps me plan better.', icon: 'bulb', color: '#FF9F0A' };

  if (!task.estimated_duration) return { message: 'Add a time estimate to help plan your day.', icon: 'time', color: '#8B5CF6' };

  return null;
}

// ============================================================================
// Types
// ============================================================================

interface TaskDetailModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onStartFocus?: (taskId: string) => void;
  // Pass from parent so we share a single useTasks() state
  taskActions?: {
    updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
    deleteTask: (id: string) => Promise<boolean>;
    deferTask: (id: string, toDate?: Date) => Promise<boolean>;
    completeTask: (id: string) => Promise<boolean>;
    uncompleteTask: (id: string) => Promise<boolean>;
  };
}

const PRIORITIES: { value: Task['priority']; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#34C759' },
  { value: 'medium', label: 'Medium', color: '#FF9F0A' },
  { value: 'high', label: 'High', color: '#FF6B35' },
  { value: 'urgent', label: 'Urgent', color: '#FF3B30' },
];

// ============================================================================
// Component
// ============================================================================

export function TaskDetailModal({ visible, task, onClose, onStartFocus, taskActions }: TaskDetailModalProps) {
  const fallback = useTasks();
  const { recordTaskCompletion } = useGamification();
  const updateTask = taskActions?.updateTask ?? fallback.updateTask;
  const deleteTask = taskActions?.deleteTask ?? fallback.deleteTask;
  const deferTask = taskActions?.deferTask ?? fallback.deferTask;
  const completeTask = taskActions?.completeTask ?? fallback.completeTask;
  const uncompleteTask = taskActions?.uncompleteTask ?? fallback.uncompleteTask;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.due_date ? new Date(task.due_date) : null);
      setPriority(task.priority);
      setEstimatedDuration(task.estimated_duration?.toString() || '');
      setHasChanges(false);
      setIsActioning(false);
    }
  }, [task]);

  const aiInsight = useMemo(() => task ? getTaskInsight(task) : null, [task]);

  const handleSave = useCallback(async () => {
    if (!task || !hasChanges) return;
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await updateTask(task.id, {
      title, description: description || null,
      due_date: dueDate?.toISOString() || null,
      priority,
      estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : null,
    });
    setIsSaving(false);
    if (ok) { setHasChanges(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    else { Alert.alert('Save failed', 'Could not save changes. Please try again.'); }
  }, [task, title, description, dueDate, priority, estimatedDuration, hasChanges, updateTask]);

  const handleToggleComplete = useCallback(async () => {
    if (!task || isActioning) return;
    setIsActioning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (task.status === 'completed') {
        const ok = await uncompleteTask(task.id);
        if (ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Invalidate analytics so completed count updates
          setTimeout(() => analyticsInvalidationBus.invalidate(), 600);
        }
      } else {
        const ok = await completeTask(task.id);
        if (ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          recordTaskCompletion(task.id, task.due_date ?? null);
          onClose();
        }
      }
    } finally {
      setIsActioning(false);
    }
  }, [task, isActioning, completeTask, uncompleteTask, onClose]);

  const handleDefer = useCallback(async () => {
    if (!task || isActioning) return;
    setIsActioning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await deferTask(task.id);
    setIsActioning(false);
    if (!ok) {
      Alert.alert('Couldn\u2019t move task', 'Something went wrong. Please try again.');
      return;
    }
    onClose();
  }, [task, isActioning, deferTask, onClose]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Task', 'This can\'t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!task) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const ok = await deleteTask(task.id);
          if (ok) {
            onClose();
          } else {
            Alert.alert('Couldn\u2019t delete task', 'Something went wrong. Please try again.');
          }
        },
      },
    ]);
  }, [task, deleteTask, onClose]);

  const handleStartFocus = useCallback(() => {
    if (!task) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartFocus?.(task.id);
    onClose();
  }, [task, onStartFocus, onClose]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      Alert.alert('Unsaved Changes', 'Save before closing?', [
        { text: 'Discard', style: 'destructive', onPress: onClose },
        { text: 'Save', onPress: async () => { await handleSave(); onClose(); } },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else { onClose(); }
  }, [hasChanges, handleSave, onClose]);

  const mark = () => setHasChanges(true);
  const pColor = task ? (PRIORITY_COLORS[task.priority] || textTokens.tertiary) : textTokens.tertiary;

  if (!task) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: bg.card }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: borderTokens.primary }}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={textTokens.tertiary} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: pColor, marginRight: 6 }} />
              <Text style={{ fontSize: 17, fontWeight: '600', color: textTokens.primary }}>Task Details</Text>
            </View>
            <TouchableOpacity onPress={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color={brand.primary} />
              ) : (
                <Text style={{ fontSize: 17, fontWeight: '600', color: hasChanges ? brand.primary : textTokens.tertiary }}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {/* AI Insight */}
            {aiInsight && (
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                marginTop: 16, paddingHorizontal: 14, paddingVertical: 12,
                borderRadius: 12, backgroundColor: `${aiInsight.color}08`,
                borderWidth: 1, borderColor: `${aiInsight.color}20`,
              }}>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: `${aiInsight.color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Ionicons name={aiInsight.icon as any} size={15} color={aiInsight.color} />
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: textTokens.secondary, lineHeight: 18 }}>{aiInsight.message}</Text>
                <View style={{ backgroundColor: brand.surface, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, marginLeft: 8 }}>
                  <Ionicons name="sparkles" size={9} color={brand.primary} />
                </View>
              </View>
            )}

            {/* Completion Toggle */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderTokens.primary }}
              onPress={handleToggleComplete}
            >
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12,
                borderColor: task.status === 'completed' ? brand.primary : textTokens.tertiary,
                backgroundColor: task.status === 'completed' ? brand.muted : 'transparent',
              }}>
                {task.status === 'completed' && <Ionicons name="checkmark" size={17} color={brand.primary} />}
              </View>
              <Text style={{ fontSize: 16, fontWeight: '500', color: task.status === 'completed' ? textTokens.tertiary : textTokens.primary }}>
                {task.status === 'completed' ? 'Completed' : 'Mark as complete'}
              </Text>
            </TouchableOpacity>

            {/* Title */}
            <View style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderTokens.primary }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 6, letterSpacing: 0.3 }}>TITLE</Text>
              <TextInput
                value={title}
                onChangeText={(t) => { setTitle(t); mark(); }}
                placeholder="Task title"
                placeholderTextColor={textTokens.tertiary}
                style={{ fontSize: 18, fontWeight: '500', color: textTokens.primary }}
              />
            </View>

            {/* Description */}
            <View style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderTokens.primary }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 6, letterSpacing: 0.3 }}>NOTES</Text>
              <TextInput
                value={description}
                onChangeText={(t) => { setDescription(t); mark(); }}
                placeholder="Add notes..."
                placeholderTextColor={textTokens.tertiary}
                multiline numberOfLines={3}
                style={{ fontSize: 15, color: textTokens.secondary, minHeight: 72, lineHeight: 22 }}
              />
            </View>

            {/* Due Date */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderTokens.primary }}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={18} color={textTokens.tertiary} />
                <Text style={{ fontSize: 15, color: textTokens.secondary, marginLeft: 10 }}>Due Date</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '500', color: dueDate ? textTokens.primary : textTokens.tertiary }}>
                {dueDate ? dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Not set'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date" display="spinner"
                themeVariant="light"
                onChange={(_, date) => { setShowDatePicker(false); if (date) { setDueDate(date); mark(); } }}
                textColor={textTokens.primary}
              />
            )}

            {/* Priority */}
            <View style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderTokens.primary }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 10, letterSpacing: 0.3 }}>PRIORITY</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {PRIORITIES.map((p) => {
                  const active = priority === p.value;
                  return (
                    <TouchableOpacity
                      key={p.value}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                        backgroundColor: active ? `${p.color}12` : bg.input,
                        borderWidth: active ? 1.5 : 1,
                        borderColor: active ? p.color : borderTokens.primary,
                      }}
                      onPress={() => { setPriority(p.value); mark(); }}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color, marginBottom: 4 }} />
                      <Text style={{ fontSize: 12, fontWeight: active ? '700' : '500', color: active ? p.color : textTokens.secondary }}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Duration */}
            <View style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderTokens.primary }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 6, letterSpacing: 0.3 }}>DURATION (MINUTES)</Text>
              <TextInput
                value={estimatedDuration}
                onChangeText={(t) => { setEstimatedDuration(t.replace(/[^0-9]/g, '')); mark(); }}
                placeholder="e.g. 30"
                placeholderTextColor={textTokens.tertiary}
                keyboardType="number-pad"
                style={{ fontSize: 15, color: textTokens.primary }}
              />
            </View>

            {/* Actions */}
            <View style={{ paddingTop: 24, paddingBottom: 8, gap: 10 }}>
              {/* Focus */}
              <TouchableOpacity
                style={{
                  paddingVertical: 14, borderRadius: 14, alignItems: 'center',
                  backgroundColor: brand.primary,
                  shadowColor: brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10,
                }}
                onPress={handleStartFocus}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="timer-outline" size={18} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: 8 }}>Start Focus Session</Text>
                </View>
              </TouchableOpacity>

              {/* Defer */}
              {task.status !== 'completed' && (
                <TouchableOpacity
                  style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: bg.input }}
                  onPress={handleDefer}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="arrow-forward-outline" size={18} color={textTokens.secondary} />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: textTokens.secondary, marginLeft: 8 }}>Defer to Tomorrow</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Delete */}
              <TouchableOpacity
                style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: `${semantic.error}30` }}
                onPress={handleDelete}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="trash-outline" size={18} color={semantic.error} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: semantic.error, marginLeft: 8 }}>Delete Task</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Meta */}
            <View style={{ paddingVertical: 16, marginBottom: 24 }}>
              <Text style={{ fontSize: 12, color: textTokens.tertiary, textAlign: 'center' }}>
                Created {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {task.completed_at && ` · Completed ${new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
