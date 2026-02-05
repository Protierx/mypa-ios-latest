/**
 * Quick Add Task Overlay
 * 
 * Minimal UI for fast task creation from anywhere.
 * Appears as a semi-transparent overlay from the bottom.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTasks } from '../../hooks/supabase/useTasks';
import { Task } from '../../lib/supabase';

interface QuickAddTaskOverlayProps {
  visible: boolean;
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
}

type DueDateOption = 'today' | 'tomorrow' | 'none';
type PriorityOption = Task['priority'];

export function QuickAddTaskOverlay({ visible, onClose, onTaskCreated }: QuickAddTaskOverlayProps) {
  const { createTask } = useTasks();
  const inputRef = useRef<TextInput>(null);
  
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<DueDateOption>('today');
  const [priority, setPriority] = useState<PriorityOption>('medium');
  const [isCreating, setIsCreating] = useState(false);

  // Animation values
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      translateY.value = withSpring(300);
      opacity.value = withTiming(0, { duration: 150 });
      // Reset form
      setTitle('');
      setDueDate('today');
      setPriority('medium');
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getDueDateValue = (): string | null => {
    const now = new Date();
    switch (dueDate) {
      case 'today':
        return now.toISOString();
      case 'tomorrow':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString();
      case 'none':
      default:
        return null;
    }
  };

  const handleCreate = useCallback(async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const task = await createTask({
      title: title.trim(),
      due_date: getDueDateValue(),
      priority,
    });

    setIsCreating(false);

    if (task) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onTaskCreated?.(task);
      onClose();
    }
  }, [title, dueDate, priority, createTask, onTaskCreated, onClose]);

  const handleBackdropPress = () => {
    Keyboard.dismiss();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View 
          className="flex-1 justify-end"
          style={backdropStyle}
        >
          <BlurView intensity={30} tint="dark" className="absolute inset-0" />
          
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View 
              className="bg-zinc-900 rounded-t-3xl border-t border-zinc-800"
              style={containerStyle}
            >
              {/* Handle */}
              <View className="items-center py-3">
                <View className="w-10 h-1 bg-zinc-700 rounded-full" />
              </View>

              {/* Input */}
              <View className="px-5 pb-4">
                <TextInput
                  ref={inputRef}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="What needs to be done?"
                  placeholderTextColor="#71717a"
                  className="text-white text-lg py-3"
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                  autoCapitalize="sentences"
                />
              </View>

              {/* Quick Options */}
              <View className="px-5 pb-4">
                {/* Due Date Options */}
                <View className="flex-row mb-4">
                  {(['today', 'tomorrow', 'none'] as DueDateOption[]).map((option) => (
                    <TouchableOpacity
                      key={option}
                      className={`flex-row items-center px-3 py-2 rounded-full mr-2 ${
                        dueDate === option ? 'bg-purple-600' : 'bg-zinc-800'
                      }`}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setDueDate(option);
                      }}
                    >
                      <Ionicons 
                        name={option === 'none' ? 'remove-circle-outline' : 'calendar-outline'} 
                        size={16} 
                        color={dueDate === option ? '#fff' : '#a1a1aa'} 
                      />
                      <Text className={`ml-1 text-sm capitalize ${
                        dueDate === option ? 'text-white' : 'text-zinc-400'
                      }`}>
                        {option === 'none' ? 'No Date' : option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Priority Options */}
                <View className="flex-row">
                  {([
                    { value: 'low' as PriorityOption, icon: 'flag-outline', color: '#22c55e' },
                    { value: 'medium' as PriorityOption, icon: 'flag-outline', color: '#eab308' },
                    { value: 'high' as PriorityOption, icon: 'flag', color: '#f97316' },
                    { value: 'urgent' as PriorityOption, icon: 'flag', color: '#ef4444' },
                  ]).map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                        priority === option.value ? 'bg-zinc-800' : ''
                      }`}
                      style={priority === option.value ? { borderColor: option.color, borderWidth: 2 } : {}}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setPriority(option.value);
                      }}
                    >
                      <Ionicons name={option.icon as any} size={20} color={option.color} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Add Button */}
              <View className="px-5 pb-8">
                <TouchableOpacity
                  className={`py-4 rounded-xl items-center ${
                    title.trim() ? 'bg-purple-600' : 'bg-zinc-800'
                  }`}
                  onPress={handleCreate}
                  disabled={!title.trim() || isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className={`font-semibold text-base ${
                      title.trim() ? 'text-white' : 'text-zinc-500'
                    }`}>
                      Add Task
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
