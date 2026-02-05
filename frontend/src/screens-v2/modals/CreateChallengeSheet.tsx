/**
 * Create Challenge Sheet
 * 
 * Bottom sheet for creating a new challenge.
 * Opens from Social View or Circle Home.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useChallenges } from '../../hooks/supabase/useChallenges';
import { Challenge } from '../../lib/supabase';

interface CreateChallengeSheetProps {
  visible: boolean;
  onClose: () => void;
  circleId?: string; // Optional: pre-select a circle
  onChallengeCreated?: (challenge: Challenge) => void;
}

const EMOJI_OPTIONS = ['🏆', '💪', '🎯', '⚡', '🔥', '🌟', '📚', '🏃', '🧘', '💻', '✨', '🚀'];

type ChallengeType = 'focus_time' | 'tasks_completed' | 'daily_checkin' | 'custom';
type DurationDays = 7 | 14 | 30;

const CHALLENGE_TYPES: { value: ChallengeType; label: string; icon: string; description: string; unit: string }[] = [
  { value: 'focus_time', label: 'Focus Time', icon: 'timer-outline', description: 'Total minutes focused', unit: 'minutes' },
  { value: 'tasks_completed', label: 'Tasks Completed', icon: 'checkbox-outline', description: 'Number of tasks completed', unit: 'tasks' },
  { value: 'daily_checkin', label: 'Daily Check-in', icon: 'calendar-outline', description: 'Streak of daily check-ins', unit: 'days' },
  { value: 'custom', label: 'Custom Goal', icon: 'create-outline', description: 'Define your own goal', unit: 'points' },
];

const DURATION_OPTIONS: { value: DurationDays; label: string }[] = [
  { value: 7, label: '7 Days' },
  { value: 14, label: '14 Days' },
  { value: 30, label: '30 Days' },
];

export function CreateChallengeSheet({ visible, onClose, circleId, onChallengeCreated }: CreateChallengeSheetProps) {
  const { createChallenge } = useChallenges();
  const titleInputRef = useRef<TextInput>(null);
  
  const [emoji, setEmoji] = useState('🏆');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChallengeType>('focus_time');
  const [duration, setDuration] = useState<DurationDays>(7);
  const [goalValue, setGoalValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Animation
  const translateY = useSharedValue(600);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      setTimeout(() => titleInputRef.current?.focus(), 100);
    } else {
      translateY.value = withSpring(600);
      // Reset form
      setEmoji('🏆');
      setTitle('');
      setDescription('');
      setType('focus_time');
      setDuration(7);
      setGoalValue('');
      setShowEmojiPicker(false);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const getDefaultGoal = (challengeType: ChallengeType): string => {
    switch (challengeType) {
      case 'focus_time': return '300'; // 5 hours
      case 'tasks_completed': return '20';
      case 'daily_checkin': return duration.toString();
      case 'custom': return '100';
    }
  };

  const getCurrentUnit = (): string => {
    return CHALLENGE_TYPES.find(t => t.value === type)?.unit || 'points';
  };

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your challenge.');
      return;
    }

    const goal = parseInt(goalValue) || parseInt(getDefaultGoal(type));
    if (goal < 1) {
      Alert.alert('Invalid Goal', 'Please enter a valid goal value.');
      return;
    }

    setIsCreating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    const challenge = await createChallenge({
      title: title.trim(),
      emoji,
      description: description.trim() || null,
      type,
      goal_value: goal,
      duration_days: duration,
      circle_id: circleId || null,
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
    });

    setIsCreating(false);

    if (challenge) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onChallengeCreated?.(challenge);
      onClose();
    }
  }, [title, emoji, description, type, duration, goalValue, circleId, createChallenge, onChallengeCreated, onClose]);

  const handleClose = useCallback(() => {
    if (title.trim() || description.trim()) {
      Alert.alert(
        'Discard Challenge?',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  }, [title, description, onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <Animated.View 
          className="bg-zinc-900 rounded-t-3xl max-h-[90%]"
          style={containerStyle}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-zinc-700 rounded-full" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-4 border-b border-zinc-800">
              <TouchableOpacity onPress={handleClose}>
                <Text className="text-zinc-400">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-white text-lg font-semibold">Create Challenge</Text>
              <TouchableOpacity onPress={handleCreate} disabled={isCreating || !title.trim()}>
                {isCreating ? (
                  <ActivityIndicator size="small" color="#a855f7" />
                ) : (
                  <Text className={`font-semibold ${title.trim() ? 'text-purple-500' : 'text-zinc-600'}`}>
                    Start
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
              {/* Emoji Picker */}
              <View className="py-4 items-center">
                <TouchableOpacity
                  className="w-16 h-16 rounded-full bg-zinc-800 items-center justify-center"
                  onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Text className="text-3xl">{emoji}</Text>
                </TouchableOpacity>
                
                {showEmojiPicker && (
                  <View className="flex-row flex-wrap justify-center mt-3 bg-zinc-800 rounded-xl p-3">
                    {EMOJI_OPTIONS.map((e) => (
                      <TouchableOpacity
                        key={e}
                        className={`w-10 h-10 items-center justify-center rounded-lg ${
                          emoji === e ? 'bg-purple-600' : ''
                        }`}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setEmoji(e);
                          setShowEmojiPicker(false);
                        }}
                      >
                        <Text className="text-xl">{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Title Input */}
              <View className="py-3 border-b border-zinc-800">
                <Text className="text-zinc-500 text-sm mb-2">Challenge Title *</Text>
                <TextInput
                  ref={titleInputRef}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Productivity Week, Focus Marathon"
                  placeholderTextColor="#52525b"
                  className="text-white text-lg"
                  maxLength={50}
                />
              </View>

              {/* Challenge Type */}
              <View className="py-3 border-b border-zinc-800">
                <Text className="text-zinc-500 text-sm mb-3">Challenge Type</Text>
                {CHALLENGE_TYPES.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    className={`flex-row items-center p-3 rounded-xl mb-2 ${
                      type === option.value ? 'bg-purple-900/50 border border-purple-500' : 'bg-zinc-800'
                    }`}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setType(option.value);
                      setGoalValue(getDefaultGoal(option.value));
                    }}
                  >
                    <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-3">
                      <Ionicons name={option.icon as any} size={20} color="#fff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium">{option.label}</Text>
                      <Text className="text-zinc-500 text-xs">{option.description}</Text>
                    </View>
                    {type === option.value && (
                      <Ionicons name="checkmark-circle" size={22} color="#a855f7" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Duration */}
              <View className="py-3 border-b border-zinc-800">
                <Text className="text-zinc-500 text-sm mb-3">Duration</Text>
                <View className="flex-row">
                  {DURATION_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`flex-1 py-3 mx-1 rounded-xl items-center ${
                        duration === option.value ? 'bg-purple-600' : 'bg-zinc-800'
                      }`}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setDuration(option.value);
                        if (type === 'daily_checkin') {
                          setGoalValue(option.value.toString());
                        }
                      }}
                    >
                      <Text className={`font-medium ${
                        duration === option.value ? 'text-white' : 'text-zinc-400'
                      }`}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Goal Value */}
              <View className="py-3 border-b border-zinc-800">
                <Text className="text-zinc-500 text-sm mb-2">Goal ({getCurrentUnit()})</Text>
                <TextInput
                  value={goalValue}
                  onChangeText={(text) => setGoalValue(text.replace(/[^0-9]/g, ''))}
                  placeholder={getDefaultGoal(type)}
                  placeholderTextColor="#52525b"
                  keyboardType="number-pad"
                  className="text-white text-lg"
                />
              </View>

              {/* Description */}
              <View className="py-3">
                <Text className="text-zinc-500 text-sm mb-2">Description (optional)</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add details or rules..."
                  placeholderTextColor="#52525b"
                  multiline
                  numberOfLines={2}
                  className="text-white text-base"
                  maxLength={200}
                />
              </View>

              {/* Preview */}
              <View className="py-4 mb-8">
                <View className="bg-zinc-800/50 p-4 rounded-xl">
                  <Text className="text-zinc-400 text-xs mb-2">PREVIEW</Text>
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-2">{emoji}</Text>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">{title || 'Challenge Title'}</Text>
                      <Text className="text-zinc-500 text-sm">
                        {goalValue || getDefaultGoal(type)} {getCurrentUnit()} in {duration} days
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}
