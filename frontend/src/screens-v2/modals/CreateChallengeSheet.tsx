/**
 * Create Challenge Sheet — Premium Light Theme
 *
 * Bottom sheet for creating a new challenge.
 * Opens from Circles Home or Circle Detail.
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useChallenges } from '../../hooks/supabase/useChallenges';
import { Challenge } from '../../lib/supabase';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius } from '../../styles/theme';

/* ────────────── Types ────────────── */

interface CreateChallengeSheetProps {
  visible: boolean;
  onClose: () => void;
  circleId?: string;
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

/* ────────────── Component ────────────── */

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

  const translateY = useSharedValue(600);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      setTimeout(() => titleInputRef.current?.focus(), 100);
    } else {
      translateY.value = withSpring(600);
      setEmoji('🏆'); setTitle(''); setDescription(''); setType('focus_time');
      setDuration(7); setGoalValue(''); setShowEmojiPicker(false);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const getDefaultGoal = (challengeType: ChallengeType): string => {
    switch (challengeType) {
      case 'focus_time': return '300';
      case 'tasks_completed': return '20';
      case 'daily_checkin': return duration.toString();
      case 'custom': return '100';
    }
  };

  const getCurrentUnit = (): string => CHALLENGE_TYPES.find(t => t.value === type)?.unit || 'points';

  const handleCreate = useCallback(async () => {
    if (!title.trim()) { Alert.alert('Title Required', 'Please enter a title for your challenge.'); return; }
    const goal = parseInt(goalValue) || parseInt(getDefaultGoal(type));
    if (goal < 1) { Alert.alert('Invalid Goal', 'Please enter a valid goal value.'); return; }

    setIsCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    const challenge = await createChallenge({
      title: title.trim(), emoji, description: description.trim() || null, type,
      goal_value: goal, duration_days: duration, circle_id: circleId || null,
      starts_at: startDate.toISOString(), ends_at: endDate.toISOString(),
    });

    setIsCreating(false);
    if (challenge) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onChallengeCreated?.(challenge);
      onClose();
    }
  }, [title, emoji, description, type, duration, goalValue, circleId, createChallenge, onChallengeCreated, onClose]);

  const handleClose = useCallback(() => {
    if (title.trim() || description.trim()) {
      Alert.alert('Discard Challenge?', 'You have unsaved changes.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ]);
    } else { onClose(); }
  }, [title, description, onClose]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
        <Animated.View style={[{ backgroundColor: bg.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }, containerStyle]}>
          <SafeAreaView edges={['bottom']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              {/* Handle */}
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: borderTokens.primary }} />
              </View>

              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
                <TouchableOpacity onPress={handleClose}><Text style={{ fontSize: 15, color: textTokens.tertiary }}>Cancel</Text></TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: '700', color: textTokens.primary }}>Create Challenge</Text>
                <TouchableOpacity onPress={handleCreate} disabled={isCreating || !title.trim()}>
                  {isCreating ? <ActivityIndicator size="small" color={brand.primary} /> : (
                    <Text style={{ fontSize: 15, fontWeight: '700', color: title.trim() ? brand.primary : textTokens.disabled }}>Start</Text>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
                {/* Emoji Picker */}
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <TouchableOpacity
                    style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: bg.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: borderTokens.primary }}
                    onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Text style={{ fontSize: 30 }}>{emoji}</Text>
                  </TouchableOpacity>
                  {showEmojiPicker && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10, backgroundColor: bg.primary, borderRadius: 14, padding: 10, gap: 4 }}>
                      {EMOJI_OPTIONS.map((e) => (
                        <TouchableOpacity
                          key={e}
                          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: emoji === e ? brand.muted : 'transparent' }}
                          onPress={() => { Haptics.selectionAsync(); setEmoji(e); setShowEmojiPicker(false); }}
                        >
                          <Text style={{ fontSize: 20 }}>{e}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Title Input */}
                <View style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 6 }}>Challenge Title *</Text>
                  <TextInput
                    ref={titleInputRef}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g., Productivity Week, Focus Marathon"
                    placeholderTextColor={textTokens.disabled}
                    style={{ fontSize: 17, color: textTokens.primary, fontWeight: '500' }}
                    maxLength={50}
                  />
                </View>

                {/* Challenge Type */}
                <View style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 10 }}>Challenge Type</Text>
                  {CHALLENGE_TYPES.map((option) => {
                    const selected = type === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={{
                          flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 8,
                          backgroundColor: selected ? brand.muted : bg.primary,
                          borderWidth: 1, borderColor: selected ? `${brand.primary}30` : borderTokens.primary,
                        }}
                        onPress={() => { Haptics.selectionAsync(); setType(option.value); setGoalValue(getDefaultGoal(option.value)); }}
                      >
                        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: selected ? brand.surface : borderTokens.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                          <Ionicons name={option.icon as any} size={18} color={selected ? brand.primary : textTokens.tertiary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: textTokens.primary }}>{option.label}</Text>
                          <Text style={{ fontSize: 11, color: textTokens.tertiary }}>{option.description}</Text>
                        </View>
                        {selected && <Ionicons name="checkmark-circle" size={20} color={brand.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Duration */}
                <View style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 10 }}>Duration</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {DURATION_OPTIONS.map((option) => {
                      const selected = duration === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={{
                            flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                            backgroundColor: selected ? brand.primary : bg.primary,
                            borderWidth: selected ? 0 : 1, borderColor: borderTokens.primary,
                          }}
                          onPress={() => { Haptics.selectionAsync(); setDuration(option.value); if (type === 'daily_checkin') setGoalValue(option.value.toString()); }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '600', color: selected ? '#fff' : textTokens.secondary }}>{option.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Goal Value */}
                <View style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 6 }}>Goal ({getCurrentUnit()})</Text>
                  <TextInput
                    value={goalValue}
                    onChangeText={(text) => setGoalValue(text.replace(/[^0-9]/g, ''))}
                    placeholder={getDefaultGoal(type)}
                    placeholderTextColor={textTokens.disabled}
                    keyboardType="number-pad"
                    style={{ fontSize: 17, color: textTokens.primary, fontWeight: '500' }}
                  />
                </View>

                {/* Description */}
                <View style={{ paddingVertical: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 6 }}>Description (optional)</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add details or rules..."
                    placeholderTextColor={textTokens.disabled}
                    multiline numberOfLines={2}
                    style={{ fontSize: 15, color: textTokens.primary }}
                    maxLength={200}
                  />
                </View>

                {/* Preview */}
                <View style={{ paddingVertical: 14, marginBottom: 20 }}>
                  <View style={{ backgroundColor: bg.primary, padding: 16, borderRadius: 14, borderWidth: 0.5, borderColor: borderTokens.primary }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: textTokens.tertiary, letterSpacing: 0.5, marginBottom: 8 }}>PREVIEW</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 28, marginRight: 10 }}>{emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: textTokens.primary }}>{title || 'Challenge Title'}</Text>
                        <Text style={{ fontSize: 12.5, color: textTokens.tertiary, marginTop: 2 }}>
                          {goalValue || getDefaultGoal(type)} {getCurrentUnit()} in {duration} days
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
