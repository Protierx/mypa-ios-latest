/**
 * Task Detail Modal
 *
 * Full task view with editing, completion, defer, delete, focus.
 * Opens when tapping a task from the list.
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import { Task } from '../../lib/supabase';

interface TaskDetailModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onStartFocus?: (taskId: string) => void;
}

const PRIORITIES: { value: Task['priority']; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

export function TaskDetailModal({ visible, task, onClose, onStartFocus }: TaskDetailModalProps) {
  const { updateTask, deleteTask, deferTask } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.due_date ? new Date(task.due_date) : null);
      setPriority(task.priority);
      setEstimatedDuration(task.estimated_duration?.toString() || '');
      setHasChanges(false);
    }
  }, [task]);

  const handleSave = useCallback(async () => {
    if (!task || !hasChanges) return;
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const ok = await updateTask(task.id, {
      title,
      description: description || null,
      due_date: dueDate?.toISOString() || null,
      priority,
      estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : null,
    });

    setIsSaving(false);
    if (ok) {
      setHasChanges(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Save failed', 'Could not save changes. Please try again.');
    }
  }, [task, title, description, dueDate, priority, estimatedDuration, hasChanges, updateTask]);

  const handleToggleComplete = useCallback(async () => {
    if (!task) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask(task.id, {
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    });
    if (newStatus === 'completed') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    }
  }, [task, updateTask, onClose]);

  const handleDefer = useCallback(async () => {
    if (!task) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deferTask(task.id);
    onClose();
  }, [task, deferTask, onClose]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Task', 'This can\'t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!task) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await deleteTask(task.id);
          onClose();
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
    } else {
      onClose();
    }
  }, [hasChanges, handleSave, onClose]);

  const mark = () => setHasChanges(true);

  if (!task) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView className="flex-1 bg-surface-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-surface-4">
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#A1A1AA" />
            </TouchableOpacity>
            <Text className="text-headline font-semibold text-ink-primary">Task Details</Text>
            <TouchableOpacity onPress={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <Text className={`text-headline font-semibold ${hasChanges ? 'text-brand-purple' : 'text-ink-disabled'}`}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5">
            {/* Completion Toggle */}
            <TouchableOpacity className="flex-row items-center py-4 border-b border-surface-4" onPress={handleToggleComplete}>
              <View
                className={`w-7 h-7 rounded-full border-2 items-center justify-center mr-3 ${
                  task.status === 'completed' ? 'bg-brand-purple border-brand-purple' : 'border-ink-disabled'
                }`}
              >
                {task.status === 'completed' && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text className={`text-body ${task.status === 'completed' ? 'text-ink-disabled' : 'text-ink-primary'}`}>
                {task.status === 'completed' ? 'Completed' : 'Mark as complete'}
              </Text>
            </TouchableOpacity>

            {/* Title */}
            <View className="py-4 border-b border-surface-4">
              <Text className="text-caption-1 text-ink-disabled mb-2">Title</Text>
              <TextInput
                value={title}
                onChangeText={(t) => { setTitle(t); mark(); }}
                placeholder="Task title"
                placeholderTextColor="#3F3F46"
                className="text-ink-primary text-lg"
                style={{ fontSize: 18 }}
              />
            </View>

            {/* Description */}
            <View className="py-4 border-b border-surface-4">
              <Text className="text-caption-1 text-ink-disabled mb-2">Notes</Text>
              <TextInput
                value={description}
                onChangeText={(t) => { setDescription(t); mark(); }}
                placeholder="Add notes..."
                placeholderTextColor="#3F3F46"
                multiline
                numberOfLines={3}
                className="text-ink-secondary text-body"
                style={{ minHeight: 72 }}
              />
            </View>

            {/* Due Date */}
            <TouchableOpacity
              className="flex-row items-center justify-between py-4 border-b border-surface-4"
              onPress={() => setShowDatePicker(true)}
            >
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={18} color="#71717A" />
                <Text className="text-body text-ink-tertiary ml-3">Due Date</Text>
              </View>
              <Text className="text-body text-ink-primary">
                {dueDate ? dueDate.toLocaleDateString() : 'Not set'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) { setDueDate(date); mark(); }
                }}
                textColor="#fff"
              />
            )}

            {/* Priority */}
            <View className="py-4 border-b border-surface-4">
              <Text className="text-caption-1 text-ink-disabled mb-3">Priority</Text>
              <View className="flex-row gap-2">
                {PRIORITIES.map((p) => {
                  const active = priority === p.value;
                  return (
                    <TouchableOpacity
                      key={p.value}
                      className={`flex-1 py-2 rounded-lg items-center ${active ? 'bg-surface-3' : 'bg-surface-2'}`}
                      style={active ? { borderColor: p.color, borderWidth: 1.5 } : {}}
                      onPress={() => { setPriority(p.value); mark(); }}
                    >
                      <View className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: p.color }} />
                      <Text className={`text-caption-1 font-medium ${active ? 'text-ink-primary' : 'text-ink-disabled'}`}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Duration */}
            <View className="py-4 border-b border-surface-4">
              <Text className="text-caption-1 text-ink-disabled mb-2">Estimated Duration (min)</Text>
              <TextInput
                value={estimatedDuration}
                onChangeText={(t) => { setEstimatedDuration(t.replace(/[^0-9]/g, '')); mark(); }}
                placeholder="e.g. 30"
                placeholderTextColor="#3F3F46"
                keyboardType="number-pad"
                className="text-ink-primary text-body"
              />
            </View>

            {/* Actions */}
            <View className="pt-6 pb-2 gap-3">
              {/* Focus */}
              <TouchableOpacity className="bg-brand-purple py-3.5 rounded-xl items-center" onPress={handleStartFocus}>
                <View className="flex-row items-center">
                  <Ionicons name="timer-outline" size={18} color="#fff" />
                  <Text className="text-headline font-bold text-white ml-2">Start Focus Session</Text>
                </View>
              </TouchableOpacity>

              {/* Defer */}
              {task.status !== 'completed' && (
                <TouchableOpacity className="py-3.5 rounded-xl items-center border border-surface-4" onPress={handleDefer}>
                  <View className="flex-row items-center">
                    <Ionicons name="arrow-forward-outline" size={18} color="#71717A" />
                    <Text className="text-headline font-medium text-ink-tertiary ml-2">Defer to Tomorrow</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Delete */}
              <TouchableOpacity className="py-3.5 rounded-xl items-center border border-error/30" onPress={handleDelete}>
                <View className="flex-row items-center">
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text className="text-headline font-medium text-error ml-2">Delete Task</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Meta */}
            <View className="py-4 mb-6">
              <Text className="text-caption-1 text-ink-disabled text-center">
                Created {new Date(task.created_at).toLocaleDateString()}
                {task.completed_at && ` · Completed ${new Date(task.completed_at).toLocaleDateString()}`}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
