/**
 * CheckInSheet — Premium iOS Bottom Sheet
 *
 * Full check-in flow with:
 * - Intention text (required)
 * - Task picker (select from today's tasks)
 * - Focus minutes (quick chips)
 * - Challenge picker (active challenges in this circle)
 *
 * Design: Apple Fitness-grade. Clean spacing, large tap targets, subtle shadows.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTasks } from '../../hooks/supabase/useTasks';
import { useChallenges } from '../../hooks/supabase/useChallenges';
import { CheckinPayload } from '../../hooks/supabase/useCircleAccountability';

/* ────────────── Palette ────────────── */
const L = {
  bg:             '#F5F5F7',
  card:           '#FFFFFF',
  cardBorder:     '#EDEDF0',
  textPrimary:    '#1C1C1E',
  textSecondary:  '#48484A',
  textTertiary:   '#8E8E93',
  textQuaternary: '#C7C7CC',
  divider:        '#EDEDF0',
  purple:         '#7C3AED',
  purpleLight:    '#F5F0FF',
  purpleMid:      '#EDE5FF',
  green:          '#34C759',
  greenLight:     '#ECFDF5',
  amber:          '#F59E0B',
  amberLight:     '#FFFBEB',
};

const { width: SW } = Dimensions.get('window');
const FOCUS_CHIPS = [15, 30, 60, 90, 120];

/* ────────────── Props ────────────── */

interface CheckInSheetProps {
  visible: boolean;
  circleId: string;
  circleName: string;
  onClose: () => void;
  onSubmit: (payload: CheckinPayload) => Promise<{ success: boolean; error?: string }>;
}

/* ════════════════════════════════════════════════════════════════
   ═══ Component ════════════════════════════════════════════════
   ════════════════════════════════════════════════════════════════ */

export function CheckInSheet({ visible, circleId, circleName, onClose, onSubmit }: CheckInSheetProps) {
  // State
  const [intention, setIntention] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [focusMinutes, setFocusMinutes] = useState<number | null>(null);
  const [customFocus, setCustomFocus] = useState('');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const intentionRef = useRef<TextInput>(null);

  // Data
  const { tasks } = useTasks('today');
  const { challenges } = useChallenges();
  const circleChallenges = challenges.filter((c: any) => c.circle_id === circleId && c.status === 'active');
  const pendingTasks = tasks.filter((t: any) => t.status === 'pending');

  // Reset on open
  useEffect(() => {
    if (visible) {
      setIntention('');
      setSelectedTaskIds([]);
      setFocusMinutes(null);
      setCustomFocus('');
      setSelectedChallengeId(null);
      setSubmitting(false);
      setTimeout(() => intentionRef.current?.focus(), 400);
    }
  }, [visible]);

  // Handlers
  const toggleTask = useCallback((taskId: string) => {
    Haptics.selectionAsync();
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  }, []);

  const selectFocus = useCallback((mins: number) => {
    Haptics.selectionAsync();
    setFocusMinutes(prev => prev === mins ? null : mins);
    setCustomFocus('');
  }, []);

  const handleSubmit = useCallback(async () => {
    const text = intention.trim();
    if (!text) {
      Alert.alert('Hold on', "Write what you're committing to today.");
      return;
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();

    const finalFocus = focusMinutes || (customFocus ? parseInt(customFocus, 10) : null);

    const result = await onSubmit({
      intention_text: text,
      committed_task_ids: selectedTaskIds.length > 0 ? selectedTaskIds : undefined,
      committed_focus_minutes: finalFocus || undefined,
      committed_challenge_id: selectedChallengeId || undefined,
    });

    setSubmitting(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } else {
      Alert.alert('Could not check in', result.error || 'Please try again.');
    }
  }, [intention, selectedTaskIds, focusMinutes, customFocus, selectedChallengeId, onSubmit, onClose]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: L.bg }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={10}
        >
          {/* ── Header ── */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
            borderBottomWidth: 0.5, borderBottomColor: L.divider,
          }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ fontSize: 16, color: L.textTertiary, fontWeight: '500' }}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: L.textPrimary }}>Check In</Text>
              <Text style={{ fontSize: 12, color: L.textTertiary, marginTop: 1 }}>{circleName}</Text>
            </View>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Intention (Required) ── */}
            <View style={{ marginBottom: 28 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Ionicons name="flag" size={15} color={L.purple} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: L.textPrimary }}>
                  Your Commitment
                </Text>
                <View style={{ backgroundColor: `${L.purple}15`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: L.purple }}>REQUIRED</Text>
                </View>
              </View>
              <TextInput
                ref={intentionRef}
                value={intention}
                onChangeText={setIntention}
                placeholder="What are you committing to today?"
                placeholderTextColor={L.textQuaternary}
                multiline
                style={{
                  backgroundColor: L.card,
                  borderRadius: 16, padding: 16, paddingTop: 14,
                  fontSize: 16, fontWeight: '500', color: L.textPrimary,
                  lineHeight: 22,
                  minHeight: 80,
                  borderWidth: 1, borderColor: intention.trim() ? `${L.purple}30` : L.cardBorder,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4,
                }}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={{ fontSize: 11, color: L.textQuaternary, marginTop: 6, textAlign: 'right' }}>
                {intention.length}/500
              </Text>
            </View>

            {/* ── Tasks (Optional) ── */}
            <View style={{ marginBottom: 28 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Ionicons name="checkbox-outline" size={15} color={L.green} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: L.textPrimary }}>Tasks to Tackle</Text>
                <Text style={{ fontSize: 11, color: L.textQuaternary, fontWeight: '500' }}>Optional</Text>
              </View>

              {pendingTasks.length > 0 ? (
                <View style={{
                  backgroundColor: L.card, borderRadius: 16, overflow: 'hidden',
                  borderWidth: 1, borderColor: L.cardBorder,
                }}>
                  {pendingTasks.slice(0, 6).map((task: any, idx: number) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    return (
                      <TouchableOpacity
                        key={task.id}
                        style={{
                          flexDirection: 'row', alignItems: 'center', padding: 14,
                          borderBottomWidth: idx < Math.min(pendingTasks.length, 6) - 1 ? 0.5 : 0,
                          borderBottomColor: L.divider,
                          backgroundColor: isSelected ? `${L.purple}06` : 'transparent',
                        }}
                        onPress={() => toggleTask(task.id)}
                        activeOpacity={0.7}
                      >
                        <View style={{
                          width: 24, height: 24, borderRadius: 7,
                          borderWidth: 2, borderColor: isSelected ? L.purple : L.textQuaternary,
                          backgroundColor: isSelected ? L.purple : 'transparent',
                          alignItems: 'center', justifyContent: 'center', marginRight: 12,
                        }}>
                          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1, fontSize: 15, fontWeight: '500',
                            color: isSelected ? L.purple : L.textPrimary,
                          }}
                        >
                          {task.title}
                        </Text>
                        {task.priority === 'high' || task.priority === 'urgent' ? (
                          <View style={{
                            backgroundColor: task.priority === 'urgent' ? '#FEF2F2' : L.amberLight,
                            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                          }}>
                            <Text style={{
                              fontSize: 9, fontWeight: '700',
                              color: task.priority === 'urgent' ? '#DC2626' : L.amber,
                              textTransform: 'uppercase',
                            }}>
                              {task.priority}
                            </Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                  {pendingTasks.length > 6 && (
                    <View style={{ padding: 12, alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, color: L.textTertiary, fontWeight: '500' }}>
                        +{pendingTasks.length - 6} more tasks
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={{
                  backgroundColor: L.card, borderRadius: 16, padding: 20, alignItems: 'center',
                  borderWidth: 1, borderColor: L.cardBorder,
                }}>
                  <Ionicons name="checkbox-outline" size={20} color={L.textQuaternary} />
                  <Text style={{ fontSize: 13, color: L.textTertiary, marginTop: 6 }}>No pending tasks for today</Text>
                </View>
              )}

              {selectedTaskIds.length > 0 && (
                <Text style={{ fontSize: 12, color: L.purple, fontWeight: '600', marginTop: 8 }}>
                  {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? 's' : ''} selected
                </Text>
              )}
            </View>

            {/* ── Focus Minutes (Optional) ── */}
            <View style={{ marginBottom: 28 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Ionicons name="timer-outline" size={15} color={L.amber} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: L.textPrimary }}>Focus Time</Text>
                <Text style={{ fontSize: 11, color: L.textQuaternary, fontWeight: '500' }}>Optional</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {FOCUS_CHIPS.map(mins => {
                  const isSelected = focusMinutes === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      style={{
                        paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12,
                        backgroundColor: isSelected ? L.purple : L.card,
                        borderWidth: 1, borderColor: isSelected ? L.purple : L.cardBorder,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isSelected ? 0 : 0.03, shadowRadius: 3,
                      }}
                      onPress={() => selectFocus(mins)}
                      activeOpacity={0.7}
                    >
                      <Text style={{
                        fontSize: 14, fontWeight: '600',
                        color: isSelected ? '#fff' : L.textPrimary,
                      }}>
                        {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {/* Custom */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 12, borderRadius: 12,
                  backgroundColor: L.card, borderWidth: 1, borderColor: L.cardBorder,
                  minWidth: 80,
                }}>
                  <TextInput
                    value={customFocus}
                    onChangeText={(v) => { setCustomFocus(v.replace(/[^0-9]/g, '')); setFocusMinutes(null); }}
                    placeholder="Custom"
                    placeholderTextColor={L.textQuaternary}
                    keyboardType="number-pad"
                    style={{ fontSize: 14, fontWeight: '600', color: L.textPrimary, paddingVertical: 11, flex: 1 }}
                    maxLength={3}
                  />
                  {customFocus ? <Text style={{ fontSize: 12, color: L.textTertiary, fontWeight: '500' }}>min</Text> : null}
                </View>
              </View>
            </View>

            {/* ── Challenge (Optional) ── */}
            {circleChallenges.length > 0 && (
              <View style={{ marginBottom: 28 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Ionicons name="trophy" size={15} color={L.amber} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: L.textPrimary }}>For a Challenge</Text>
                  <Text style={{ fontSize: 11, color: L.textQuaternary, fontWeight: '500' }}>Optional</Text>
                </View>
                <View style={{
                  backgroundColor: L.card, borderRadius: 16, overflow: 'hidden',
                  borderWidth: 1, borderColor: L.cardBorder,
                }}>
                  {circleChallenges.map((ch: any, idx: number) => {
                    const isSelected = selectedChallengeId === ch.id;
                    return (
                      <TouchableOpacity
                        key={ch.id}
                        style={{
                          flexDirection: 'row', alignItems: 'center', padding: 14,
                          borderBottomWidth: idx < circleChallenges.length - 1 ? 0.5 : 0,
                          borderBottomColor: L.divider,
                          backgroundColor: isSelected ? `${L.amber}08` : 'transparent',
                        }}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedChallengeId(prev => prev === ch.id ? null : ch.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{
                          width: 24, height: 24, borderRadius: 12,
                          borderWidth: 2, borderColor: isSelected ? L.amber : L.textQuaternary,
                          backgroundColor: isSelected ? L.amber : 'transparent',
                          alignItems: 'center', justifyContent: 'center', marginRight: 12,
                        }}>
                          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                        <Text style={{ fontSize: 16, marginRight: 8 }}>{ch.emoji || '🏆'}</Text>
                        <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontWeight: '500', color: L.textPrimary }}>
                          {ch.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* ── Submit Button (fixed bottom) ── */}
          <View style={{
            paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 8 : 20,
            borderTopWidth: 0.5, borderTopColor: L.divider,
            backgroundColor: L.bg,
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: intention.trim() ? L.purple : L.textQuaternary,
                paddingVertical: 17, borderRadius: 16,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 8,
                shadowColor: intention.trim() ? L.purple : 'transparent',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: intention.trim() ? 0.3 : 0,
                shadowRadius: 14,
              }}
              onPress={handleSubmit}
              disabled={!intention.trim() || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="arrow-up-circle" size={20} color="#fff" />
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>Post Check-In</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
