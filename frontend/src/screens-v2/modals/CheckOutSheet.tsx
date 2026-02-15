/**
 * CheckOutSheet — Premium iOS Bottom Sheet
 *
 * Check-out flow with:
 * - Result status: Done / Partial / Missed (segmented)
 * - Completed tasks checklist (pre-filled from check-in)
 * - Quick reflection: Win + Blocker
 *
 * Design: Apple Fitness-grade. Feels like completing a workout.
 */

import React, { useState, useCallback, useEffect } from 'react';
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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTasks } from '../../hooks/supabase/useTasks';
import { CheckoutPayload, TodayCheckin } from '../../hooks/supabase/useCircleAccountability';

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
  green:          '#34C759',
  greenLight:     '#ECFDF5',
  amber:          '#F59E0B',
  amberLight:     '#FFFBEB',
  danger:         '#DC2626',
  dangerLight:    '#FEF2F2',
};

type ResultStatus = 'done' | 'partial' | 'missed';

const RESULT_OPTIONS: { key: ResultStatus; label: string; emoji: string; color: string; bgColor: string }[] = [
  { key: 'done', label: 'Done', emoji: '✅', color: L.green, bgColor: L.greenLight },
  { key: 'partial', label: 'Partial', emoji: '🟡', color: L.amber, bgColor: L.amberLight },
  { key: 'missed', label: 'Missed', emoji: '❌', color: L.danger, bgColor: L.dangerLight },
];

/* ────────────── Props ────────────── */

interface CheckOutSheetProps {
  visible: boolean;
  circleId: string;
  circleName: string;
  todayCheckin: TodayCheckin | null;
  onClose: () => void;
  onSubmit: (payload: CheckoutPayload) => Promise<{ success: boolean; error?: string }>;
}

/* ════════════════════════════════════════════════════════════════
   ═══ Component ════════════════════════════════════════════════
   ════════════════════════════════════════════════════════════════ */

export function CheckOutSheet({ visible, circleId, circleName, todayCheckin, onClose, onSubmit }: CheckOutSheetProps) {
  const [resultStatus, setResultStatus] = useState<ResultStatus>('done');
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [win, setWin] = useState('');
  const [blocker, setBlocker] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { tasks } = useTasks('today');

  // Pre-fill from check-in commitment
  const committedTasks = (todayCheckin?.committed_task_ids || []).length > 0
    ? tasks.filter((t: any) => todayCheckin?.committed_task_ids?.includes(t.id))
    : [];

  // Reset on open
  useEffect(() => {
    if (visible) {
      setResultStatus('done');
      // Pre-check all tasks as completed by default
      setCompletedTaskIds(todayCheckin?.committed_task_ids || []);
      setWin('');
      setBlocker('');
      setSubmitting(false);
    }
  }, [visible, todayCheckin]);

  const toggleTask = useCallback((taskId: string) => {
    Haptics.selectionAsync();
    setCompletedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();

    const result = await onSubmit({
      result_status: resultStatus,
      completed_task_ids: completedTaskIds.length > 0 ? completedTaskIds : undefined,
      reflection_win: win.trim() || undefined,
      reflection_blocker: blocker.trim() || undefined,
    });

    setSubmitting(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } else {
      Alert.alert('Could not check out', result.error || 'Please try again.');
    }
  }, [resultStatus, completedTaskIds, win, blocker, onSubmit, onClose]);

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
              <Text style={{ fontSize: 17, fontWeight: '700', color: L.textPrimary }}>Check Out</Text>
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
            {/* ── What you committed to (context) ── */}
            {todayCheckin && (
              <View style={{
                backgroundColor: L.purpleLight, borderRadius: 16, padding: 16, marginBottom: 24,
                borderWidth: 1, borderColor: `${L.purple}15`,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="flag" size={13} color={L.purple} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: L.purple, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Your Commitment
                  </Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '600', color: L.textPrimary, lineHeight: 22 }}>
                  "{todayCheckin.intention_text}"
                </Text>
                {todayCheckin.committed_focus_minutes && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <Ionicons name="timer" size={12} color={L.purple} />
                    <Text style={{ fontSize: 12, color: L.purple, fontWeight: '600' }}>
                      {todayCheckin.committed_focus_minutes} min focus
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* ── Result Status (Required) ── */}
            <View style={{ marginBottom: 28 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Ionicons name="analytics" size={15} color={L.purple} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: L.textPrimary }}>How did it go?</Text>
              </View>
              <View style={{
                flexDirection: 'row', gap: 8,
              }}>
                {RESULT_OPTIONS.map(opt => {
                  const isSelected = resultStatus === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={{
                        flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
                        backgroundColor: isSelected ? opt.bgColor : L.card,
                        borderWidth: 2, borderColor: isSelected ? opt.color : L.cardBorder,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isSelected ? 0.06 : 0.02, shadowRadius: 4,
                      }}
                      onPress={() => { Haptics.selectionAsync(); setResultStatus(opt.key); }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 28, marginBottom: 6 }}>{opt.emoji}</Text>
                      <Text style={{
                        fontSize: 14, fontWeight: '700',
                        color: isSelected ? opt.color : L.textTertiary,
                      }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Completed Tasks (if committed) ── */}
            {committedTasks.length > 0 && (
              <View style={{ marginBottom: 28 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Ionicons name="checkbox" size={15} color={L.green} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: L.textPrimary }}>Tasks Completed</Text>
                </View>
                <View style={{
                  backgroundColor: L.card, borderRadius: 16, overflow: 'hidden',
                  borderWidth: 1, borderColor: L.cardBorder,
                }}>
                  {committedTasks.map((task: any, idx: number) => {
                    const isCompleted = completedTaskIds.includes(task.id);
                    return (
                      <TouchableOpacity
                        key={task.id}
                        style={{
                          flexDirection: 'row', alignItems: 'center', padding: 14,
                          borderBottomWidth: idx < committedTasks.length - 1 ? 0.5 : 0,
                          borderBottomColor: L.divider,
                          backgroundColor: isCompleted ? `${L.green}06` : 'transparent',
                        }}
                        onPress={() => toggleTask(task.id)}
                        activeOpacity={0.7}
                      >
                        <View style={{
                          width: 24, height: 24, borderRadius: 7,
                          borderWidth: 2, borderColor: isCompleted ? L.green : L.textQuaternary,
                          backgroundColor: isCompleted ? L.green : 'transparent',
                          alignItems: 'center', justifyContent: 'center', marginRight: 12,
                        }}>
                          {isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1, fontSize: 15, fontWeight: '500',
                            color: isCompleted ? L.green : L.textPrimary,
                            textDecorationLine: isCompleted ? 'line-through' : 'none',
                          }}
                        >
                          {task.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={{ fontSize: 12, color: L.textTertiary, fontWeight: '500', marginTop: 6 }}>
                  {completedTaskIds.length}/{committedTasks.length} completed
                </Text>
              </View>
            )}

            {/* ── Reflection: Win ── */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Ionicons name="sparkles" size={15} color={L.amber} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: L.textPrimary }}>Today's Win</Text>
                <Text style={{ fontSize: 11, color: L.textQuaternary, fontWeight: '500' }}>Optional</Text>
              </View>
              <TextInput
                value={win}
                onChangeText={setWin}
                placeholder="What went well today?"
                placeholderTextColor={L.textQuaternary}
                style={{
                  backgroundColor: L.card, borderRadius: 14, padding: 14,
                  fontSize: 15, fontWeight: '500', color: L.textPrimary,
                  borderWidth: 1, borderColor: L.cardBorder, minHeight: 50,
                }}
                multiline
                maxLength={300}
              />
            </View>

            {/* ── Reflection: Blocker ── */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Ionicons name="warning" size={15} color={L.danger} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: L.textPrimary }}>Any Blockers?</Text>
                <Text style={{ fontSize: 11, color: L.textQuaternary, fontWeight: '500' }}>Optional</Text>
              </View>
              <TextInput
                value={blocker}
                onChangeText={setBlocker}
                placeholder="What got in the way?"
                placeholderTextColor={L.textQuaternary}
                style={{
                  backgroundColor: L.card, borderRadius: 14, padding: 14,
                  fontSize: 15, fontWeight: '500', color: L.textPrimary,
                  borderWidth: 1, borderColor: L.cardBorder, minHeight: 50,
                }}
                multiline
                maxLength={300}
              />
            </View>
          </ScrollView>

          {/* ── Submit Button ── */}
          <View style={{
            paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 8 : 20,
            borderTopWidth: 0.5, borderTopColor: L.divider,
            backgroundColor: L.bg,
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: RESULT_OPTIONS.find(o => o.key === resultStatus)?.color || L.purple,
                paddingVertical: 17, borderRadius: 16,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 8,
                shadowColor: RESULT_OPTIONS.find(o => o.key === resultStatus)?.color || L.purple,
                shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14,
              }}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>Post Check-Out</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
