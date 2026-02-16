/**
 * Create Challenge Sheet — Redesigned Layout
 *
 * Flow: Title → Description (optional) → Tracking Method → Duration
 * Clean, linear form that makes challenge creation intuitive.
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

type TrackingMethod = 'tasks_completed' | 'focus_minutes' | 'proof_checkin';

const TRACKING_METHODS: { value: TrackingMethod; label: string; icon: string; description: string; targetUnit: string }[] = [
  { value: 'tasks_completed', label: 'Tasks Completed', icon: 'checkbox-outline', description: 'Track by completing tasks', targetUnit: 'tasks' },
  { value: 'focus_minutes', label: 'Focus Minutes', icon: 'timer-outline', description: 'Track total minutes focused', targetUnit: 'minutes' },
  { value: 'proof_checkin', label: 'Proof Check-in', icon: 'camera-outline', description: 'Submit proof each time', targetUnit: 'check-ins' },
];

/* ────────────── Component ────────────── */

export function CreateChallengeSheet({ visible, onClose, circleId, onChallengeCreated }: CreateChallengeSheetProps) {
  const { createChallenge } = useChallenges();
  const titleInputRef = useRef<TextInput>(null);

  const [emoji, setEmoji] = useState('🏆');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trackingMethod, setTrackingMethod] = useState<TrackingMethod>('proof_checkin');
  const [durationDays, setDurationDays] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const translateY = useSharedValue(600);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      setTimeout(() => titleInputRef.current?.focus(), 100);
    } else {
      translateY.value = withSpring(600);
      setEmoji('🏆'); setTitle(''); setDescription(''); setTrackingMethod('proof_checkin');
      setDurationDays(''); setShowEmojiPicker(false);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const currentMethod = TRACKING_METHODS.find(m => m.value === trackingMethod)!;

  const handleCreate = useCallback(async () => {
    if (!title.trim()) { Alert.alert('Title Required', 'Give your challenge a name.'); return; }
    const days = parseInt(durationDays) || 7;
    if (days < 1 || days > 365) { Alert.alert('Invalid Duration', 'Duration must be between 1 and 365 days.'); return; }

    setIsCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    // Map tracking method to the legacy type field for compatibility
    const legacyType = trackingMethod === 'proof_checkin' ? 'daily_checkin'
      : trackingMethod === 'focus_minutes' ? 'focus_time'
      : 'tasks_completed';

    const challenge = await createChallenge({
      title: title.trim(),
      emoji,
      description: description.trim() || null,
      type: legacyType,
      tracking_method: trackingMethod,
      goal_value: days,
      duration_days: days,
      circle_id: circleId || null,
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
    });

    setIsCreating(false);
    if (challenge) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onChallengeCreated?.(challenge);
      onClose();
    }
  }, [title, emoji, description, trackingMethod, durationDays, circleId, createChallenge, onChallengeCreated, onClose]);

  const handleClose = useCallback(() => {
    if (title.trim() || description.trim()) {
      Alert.alert('Discard Challenge?', 'You have unsaved changes.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ]);
    } else { onClose(); }
  }, [title, description, onClose]);

  if (!visible) return null;

  const days = parseInt(durationDays) || 7;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
        <Animated.View style={[{ backgroundColor: bg.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }, containerStyle]}>
          <SafeAreaView edges={['bottom']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              {/* Handle */}
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: borderTokens.primary }} />
              </View>

              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={{ fontSize: 15, color: textTokens.tertiary }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: '700', color: textTokens.primary }}>New Challenge</Text>
                <TouchableOpacity onPress={handleCreate} disabled={isCreating || !title.trim()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {isCreating ? <ActivityIndicator size="small" color={brand.primary} /> : (
                    <Text style={{ fontSize: 15, fontWeight: '700', color: title.trim() ? brand.primary : textTokens.disabled }}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView style={{ paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* ── 1. Emoji + Title ── */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 20, paddingBottom: 16 }}>
                  <TouchableOpacity
                    style={{
                      width: 52, height: 52, borderRadius: 16, backgroundColor: bg.primary,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 1, borderColor: borderTokens.primary, marginRight: 14,
                    }}
                    onPress={() => { Haptics.selectionAsync(); setShowEmojiPicker(!showEmojiPicker); }}
                  >
                    <Text style={{ fontSize: 26 }}>{emoji}</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      ref={titleInputRef}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Challenge title"
                      placeholderTextColor={textTokens.disabled}
                      style={{ fontSize: 20, color: textTokens.primary, fontWeight: '700' }}
                      maxLength={50}
                    />
                  </View>
                </View>

                {/* Emoji Grid (collapsible) */}
                {showEmojiPicker && (
                  <View style={{
                    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
                    backgroundColor: bg.primary, borderRadius: 14, padding: 10, marginBottom: 12, gap: 4,
                  }}>
                    {EMOJI_OPTIONS.map((e) => (
                      <TouchableOpacity
                        key={e}
                        style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: emoji === e ? brand.muted : 'transparent' }}
                        onPress={() => { Haptics.selectionAsync(); setEmoji(e); setShowEmojiPicker(false); }}
                      >
                        <Text style={{ fontSize: 22 }}>{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* ── 2. Description (optional) ── */}
                <View style={{
                  backgroundColor: bg.primary, borderRadius: 14, padding: 14, marginBottom: 20,
                  borderWidth: 0.5, borderColor: borderTokens.primary,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 6, letterSpacing: 0.3 }}>DESCRIPTION</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="What's this challenge about? (optional)"
                    placeholderTextColor={textTokens.disabled}
                    multiline
                    numberOfLines={3}
                    style={{ fontSize: 15, color: textTokens.primary, lineHeight: 21, minHeight: 60, textAlignVertical: 'top' }}
                    maxLength={200}
                  />
                </View>

                {/* ── 3. Tracking Method ── */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 10, letterSpacing: 0.3, paddingHorizontal: 2 }}>TRACKING METHOD</Text>
                  <View style={{ gap: 8 }}>
                    {TRACKING_METHODS.map((method) => {
                      const selected = trackingMethod === method.value;
                      return (
                        <TouchableOpacity
                          key={method.value}
                          style={{
                            flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
                            backgroundColor: selected ? brand.muted : bg.primary,
                            borderWidth: 1.5, borderColor: selected ? brand.primary : borderTokens.primary,
                          }}
                          onPress={() => { Haptics.selectionAsync(); setTrackingMethod(method.value); }}
                          activeOpacity={0.7}
                        >
                          <View style={{
                            width: 40, height: 40, borderRadius: 20,
                            backgroundColor: selected ? `${brand.primary}18` : `${borderTokens.primary}80`,
                            alignItems: 'center', justifyContent: 'center', marginRight: 12,
                          }}>
                            <Ionicons name={method.icon as any} size={20} color={selected ? brand.primary : textTokens.tertiary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: textTokens.primary }}>{method.label}</Text>
                            <Text style={{ fontSize: 12, color: textTokens.tertiary, marginTop: 1 }}>{method.description}</Text>
                          </View>
                          {selected && (
                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: brand.primary, alignItems: 'center', justifyContent: 'center' }}>
                              <Ionicons name="checkmark" size={14} color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* ── 4. Duration ── */}
                <View style={{
                  backgroundColor: bg.primary, borderRadius: 14, padding: 14, marginBottom: 20,
                  borderWidth: 0.5, borderColor: borderTokens.primary,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 4, letterSpacing: 0.3 }}>DURATION</Text>
                  <Text style={{ fontSize: 11, color: textTokens.disabled, marginBottom: 10 }}>
                    How many days to complete the challenge
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      value={durationDays}
                      onChangeText={(text) => setDurationDays(text.replace(/[^0-9]/g, ''))}
                      placeholder="7"
                      placeholderTextColor={textTokens.disabled}
                      keyboardType="number-pad"
                      style={{ fontSize: 28, color: textTokens.primary, fontWeight: '700', flex: 1 }}
                    />
                    <View style={{ backgroundColor: `${semantic.warning}14`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: semantic.warning }}>days</Text>
                    </View>
                  </View>
                </View>

                {/* ── Preview Summary ── */}
                <View style={{
                  backgroundColor: bg.primary, borderRadius: 16, padding: 16, marginBottom: 10,
                  borderWidth: 0.5, borderColor: borderTokens.primary,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: textTokens.tertiary, letterSpacing: 0.5, marginBottom: 12 }}>SUMMARY</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <Text style={{ fontSize: 32, marginRight: 12 }}>{emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: textTokens.primary }}>{title || 'Challenge Title'}</Text>
                      {description.trim() ? (
                        <Text numberOfLines={1} style={{ fontSize: 13, color: textTokens.tertiary, marginTop: 2 }}>{description}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{
                      flex: 1, backgroundColor: `${brand.primary}08`, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
                      borderWidth: 0.5, borderColor: `${brand.primary}20`,
                    }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: brand.primary }}>{days}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: textTokens.tertiary, marginTop: 2 }}>days</Text>
                    </View>
                    <View style={{
                      flex: 1, backgroundColor: `${semantic.success}08`, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
                      borderWidth: 0.5, borderColor: `${semantic.success}20`,
                    }}>
                      <Ionicons name={currentMethod.icon as any} size={18} color={semantic.success} />
                      <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '600', color: textTokens.tertiary, marginTop: 2 }}>{currentMethod.label}</Text>
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
