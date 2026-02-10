/**
 * Task Detail Modal
 * 
 * Full task view with editing, completion, and actions.
 * Opens when tapping a task from Tasks View.
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

const PRIORITY_OPTIONS: { value: Task['priority']; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

export function TaskDetailModal({ visible, task, onClose, onStartFocus }: TaskDetailModalProps) {
  const { updateTask, deleteTask } = useTasks();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when task changes
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const success = await updateTask(task.id, {
      title,
      description: description || null,
      due_date: dueDate?.toISOString() || null,
      priority,
      estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : null,
    });
    
    setIsSaving(false);
    
    if (success) {
      setHasChanges(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [task, title, description, dueDate, priority, estimatedDuration, hasChanges, updateTask]);

  const handleToggleComplete = useCallback(async () => {
    if (!task) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask(task.id, {
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    });
    
    if (newStatus === 'completed') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    }
  }, [task, updateTask, onClose]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!task) return;
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await deleteTask(task.id);
            onClose();
          },
        },
      ]
    );
  }, [task, deleteTask, onClose]);

  const handleStartFocus = useCallback(() => {
    if (!task) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartFocus?.(task.id);
    onClose();
  }, [task, onStartFocus, onClose]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Save before closing?',
        [
          { text: 'Discard', style: 'destructive', onPress: onClose },
          { text: 'Save', onPress: async () => { await handleSave(); onClose(); } },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      onClose();
    }
  }, [hasChanges, handleSave, onClose]);

  const markChanged = () => setHasChanges(true);

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-800">
            <TouchableOpacity onPress={handleClose} className="p-2 -ml-2">
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text className="text-white text-lg font-semibold">Task Details</Text>
            
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={!hasChanges || isSaving}
              className="p-2 -mr-2"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#a855f7" />
              ) : (
                <Text className={`text-base font-medium ${hasChanges ? 'text-purple-500' : 'text-zinc-600'}`}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5">
            {/* Completion Toggle */}
            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-zinc-800"
              onPress={handleToggleComplete}
            >
              <View
                className={`w-7 h-7 rounded-full border-2 items-center justify-center mr-3 ${
                  task.status === 'completed'
                    ? 'bg-purple-600 border-purple-600'
                    : 'border-zinc-600'
                }`}
              >
                {task.status === 'completed' && (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
              </View>
              <Text className={`text-base ${task.status === 'completed' ? 'text-zinc-500' : 'text-white'}`}>
                {task.status === 'completed' ? 'Completed' : 'Mark as complete'}
              </Text>
            </TouchableOpacity>

            {/* Title */}
            <View className="py-4 border-b border-zinc-800">
              <Text className="text-zinc-500 text-sm mb-2">Title</Text>
              <TextInput
                value={title}
                onChangeText={(text) => { setTitle(text); markChanged(); }}
                placeholder="Task title"
                placeholderTextColor="#52525b"
                className="text-white text-lg"
              />
            </View>

            {/* Description */}
            <View className="py-4 border-b border-zinc-800">
              <Text className="text-zinc-500 text-sm mb-2">Description</Text>
              <TextInput
                value={description}
                onChangeText={(text) => { setDescription(text); markChanged(); }}
                placeholder="Add description..."
                placeholderTextColor="#52525b"
                multiline
                numberOfLines={3}
                className="text-white text-base"
                style={{ minHeight: 80 }}
              />
            </View>

            {/* Due Date */}
            <TouchableOpacity 
              className="flex-row items-center justify-between py-4 border-b border-zinc-800"
              onPress={() => setShowDatePicker(true)}
            >
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="#71717a" />
                <Text className="text-zinc-500 text-sm ml-3">Due Date</Text>
              </View>
              <Text className="text-white">
                {dueDate ? dueDate.toLocaleDateString() : 'Not set'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setDueDate(date);
                    markChanged();
                  }
                }}
                textColor="#fff"
              />
            )}

            {/* Priority */}
            <View className="py-4 border-b border-zinc-800">
              <Text className="text-zinc-500 text-sm mb-3">Priority</Text>
              <View className="flex-row">
                {PRIORITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    className={`flex-1 py-2 mx-1 rounded-lg items-center ${
                      priority === option.value ? 'bg-zinc-800' : ''
                    }`}
                    style={priority === option.value ? { borderColor: option.color, borderWidth: 1 } : {}}
                    onPress={() => { setPriority(option.value); markChanged(); }}
                  >
                    <View 
                      className="w-3 h-3 rounded-full mb-1"
                      style={{ backgroundColor: option.color }}
                    />
                    <Text className={`text-xs ${priority === option.value ? 'text-white' : 'text-zinc-500'}`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Estimated Duration */}
            <View className="py-4 border-b border-zinc-800">
              <Text className="text-zinc-500 text-sm mb-2">Estimated Duration (minutes)</Text>
              <TextInput
                value={estimatedDuration}
                onChangeText={(text) => { setEstimatedDuration(text.replace(/[^0-9]/g, '')); markChanged(); }}
                placeholder="e.g., 30"
                placeholderTextColor="#52525b"
                keyboardType="number-pad"
                className="text-white text-base"
              />
            </View>

            {/* Action Buttons */}
            <View className="py-6 space-y-3">
              <TouchableOpacity
                className="bg-purple-600 py-4 rounded-xl items-center"
                onPress={handleStartFocus}
              >
                <View className="flex-row items-center">
                  <Ionicons name="timer-outline" size={20} color="#fff" />
                  <Text className="text-white font-semibold text-base ml-2">Start Focus Session</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-4 rounded-xl items-center border border-red-500"
                onPress={handleDelete}
              >
                <View className="flex-row items-center">
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text className="text-red-500 font-medium text-base ml-2">Delete Task</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Meta Info */}
            <View className="py-4 mb-8">
              <Text className="text-zinc-600 text-xs text-center">
                Created {new Date(task.created_at).toLocaleDateString()}
                {task.completed_at && ` • Completed ${new Date(task.completed_at).toLocaleDateString()}`}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
