/**
 * Add Task Modal
 *
 * As the user types a title, AI auto-fills:
 * - Category (e.g. "gym" → Health)
 * - Priority (e.g. "gym" → medium, "deadline" → urgent)
 * - Duration (e.g. "gym" → 60m, "email" → 15m)
 *
 * The user can override any field manually.
 * Date and time are always set by the user.
 * AI suggestions show a sparkle indicator so the user knows they can change them.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Keyboard,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTasks } from '../../hooks/supabase/useTasks';
import { Task } from '../../lib/supabase';
import {
  suggestFromTitle,
  getAllCategories,
  TaskCategory,
  TaskSuggestion,
} from '../../services/categorySuggestion';
import { eventLogger } from '../../services/eventLogger';

// ============================================================================
// Types + Constants
// ============================================================================

interface QuickAddTaskOverlayProps {
  visible: boolean;
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
  initialDate?: Date;
}

type PriorityOption = Task['priority'];

const PRIORITIES: { value: PriorityOption; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

// ============================================================================
// Component
// ============================================================================

export function QuickAddTaskOverlay({
  visible,
  onClose,
  onTaskCreated,
  initialDate,
}: QuickAddTaskOverlayProps) {
  const { createTask } = useTasks();
  const inputRef = useRef<TextInput>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<Date>(initialDate || new Date());
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [priority, setPriority] = useState<PriorityOption>('medium');
  const [creating, setCreating] = useState(false);

  // AI suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<TaskSuggestion | null>(null);
  const [manualCategory, setManualCategory] = useState<TaskCategory | null>(null);
  const [manualPriority, setManualPriority] = useState(false); // user explicitly set priority
  const [manualDuration, setManualDuration] = useState(false); // user explicitly set duration
  const [showCategories, setShowCategories] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // Focus title on open
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 300);
      eventLogger.log('modal_opened', { modal: 'add_task' });
    } else {
      resetForm();
    }
  }, [visible]);

  useEffect(() => {
    if (initialDate) setDueDate(initialDate);
  }, [initialDate]);

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setDueDate(initialDate || new Date());
    setDueTime(null);
    setDuration(null);
    setPriority('medium');
    setAiSuggestion(null);
    setManualCategory(null);
    setManualPriority(false);
    setManualDuration(false);
    setShowCategories(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowDurationPicker(false);
  };

  // ── AI suggestion (debounced 400ms) ──
  const handleTitleChange = useCallback(
    (text: string) => {
      setTitle(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const s = suggestFromTitle(text);
        if (s && s.confidence >= 0.25) {
          setAiSuggestion(s);

          // Auto-fill priority if user hasn't manually changed it
          if (!manualPriority) {
            setPriority(s.priority);
          }
          // Auto-fill duration if user hasn't manually changed it
          if (!manualDuration) {
            setDuration(s.duration);
          }

          eventLogger.log('feature_used', {
            feature: 'ai_task_suggestion',
            category: s.category,
            priority: s.priority,
            duration: s.duration,
          });
        } else {
          setAiSuggestion(null);
          // Reset to defaults if AI can't suggest
          if (!manualPriority) setPriority('medium');
          if (!manualDuration) setDuration(null);
        }
      }, 400);
    },
    [manualPriority, manualDuration],
  );

  // ── Build due date ISO ──
  const buildDueDate = (): string => {
    const d = new Date(dueDate);
    if (dueTime) {
      d.setHours(dueTime.getHours(), dueTime.getMinutes(), 0, 0);
    } else {
      d.setHours(23, 59, 0, 0);
    }
    return d.toISOString();
  };

  // ── Create ──
  const isValid = title.trim().length >= 1;

  const handleCreate = useCallback(async () => {
    if (!isValid || creating) return;
    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const cat = manualCategory || aiSuggestion?.category;
      let desc = notes.trim();
      if (cat) desc = desc ? `[${cat}] ${desc}` : `[${cat}]`;

      const task = await createTask({
        title: title.trim(),
        description: desc || null,
        due_date: buildDueDate(),
        priority,
        estimated_duration: duration,
      });

      setCreating(false);

      if (task) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        eventLogger.log('task_created', {
          taskId: task.id,
          priority,
          category: cat || 'none',
          duration,
          aiSuggested: !!aiSuggestion,
          aiPriorityAccepted: !manualPriority && aiSuggestion?.priority === priority,
          aiDurationAccepted: !manualDuration && aiSuggestion?.duration === duration,
          aiCategoryAccepted: !manualCategory && aiSuggestion?.category === cat,
        });
        onTaskCreated?.(task);
        onClose();
      } else {
        Alert.alert('Hmm', "Task couldn't be saved. Please try again.");
      }
    } catch (err: any) {
      setCreating(false);
      Alert.alert('Something went wrong', err?.message || 'Please try again.');
    }
  }, [title, notes, dueDate, dueTime, priority, duration, isValid, creating, manualCategory, manualPriority, manualDuration, aiSuggestion, createTask, onTaskCreated, onClose]);

  // ── Helpers ──
  const fmtDate = (d: Date): string => {
    const t = new Date();
    const tm = new Date(t); tm.setDate(tm.getDate() + 1);
    if (d.toDateString() === t.toDateString()) return 'Today';
    if (d.toDateString() === tm.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const fmtDuration = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h}h ${r}m` : `${h}h`;
  };

  const activeCategory = manualCategory || aiSuggestion?.category || null;
  const activeCategoryMeta = activeCategory
    ? getAllCategories().find((c) => c.category === activeCategory)
    : null;

  // Is this field AI-filled (not manually overridden)?
  const isPriorityAI = !!aiSuggestion && !manualPriority;
  const isDurationAI = !!aiSuggestion && !manualDuration && duration !== null;
  const isCategoryAI = !!aiSuggestion && !manualCategory;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Pressable className="flex-1 bg-black/50" onPress={() => { Keyboard.dismiss(); onClose(); }}>
          <View className="flex-1" />

          {/* Sheet */}
          <Pressable
            className="bg-surface-1 rounded-t-2xl border-t border-surface-4"
            onPress={Keyboard.dismiss}
          >
            <SafeAreaView edges={['bottom']}>
              {/* ── Handle ── */}
              <View className="items-center pt-3 pb-1">
                <View className="w-9 h-1 bg-surface-4 rounded-full" />
              </View>

              {/* ── Header row ── */}
              <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
                <Text className="text-title-3 font-bold text-ink-primary">New Task</Text>
                {activeCategory && activeCategoryMeta && (
                  <TouchableOpacity
                    className="flex-row items-center px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${activeCategoryMeta.color}18` }}
                    onPress={() => setShowCategories(!showCategories)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={activeCategoryMeta.icon as any} size={13} color={activeCategoryMeta.color} />
                    <Text className="text-caption-1 font-semibold ml-1" style={{ color: activeCategoryMeta.color }}>
                      {activeCategory}
                    </Text>
                    {isCategoryAI && (
                      <View className="flex-row items-center bg-brand-purple/20 px-1.5 rounded ml-1.5">
                        <Ionicons name="sparkles" size={9} color="#A78BFA" />
                        <Text className="text-caption-2 font-semibold text-brand-secondary ml-0.5">AI</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                className="max-h-[440px]"
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {/* ── Title ── */}
                <View className="px-5">
                  <TextInput
                    ref={inputRef}
                    value={title}
                    onChangeText={handleTitleChange}
                    placeholder="What needs to be done?"
                    placeholderTextColor="#3F3F46"
                    className="text-ink-primary text-lg py-2"
                    returnKeyType="next"
                    autoCapitalize="sentences"
                    style={{ fontSize: 18 }}
                  />
                </View>

                {/* ── AI suggestion banner (shows what AI filled) ── */}
                {aiSuggestion && aiSuggestion.confidence >= 0.25 && (
                  <View className="mx-5 mt-2 flex-row items-center bg-brand-purple/10 px-3 py-2 rounded-lg border border-brand-purple/20">
                    <Ionicons name="sparkles" size={14} color="#A78BFA" />
                    <Text className="text-caption-1 text-brand-secondary ml-1.5 flex-1">
                      AI filled: {aiSuggestion.category} · {aiSuggestion.priority} · {fmtDuration(aiSuggestion.duration)}
                    </Text>
                    <Text className="text-caption-2 text-ink-disabled">tap to change</Text>
                  </View>
                )}

                {/* ── Notes ── */}
                <View className="px-5 mt-2">
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Notes (optional)"
                    placeholderTextColor="#27272A"
                    className="text-ink-tertiary text-subhead py-1"
                    multiline
                    numberOfLines={2}
                    style={{ minHeight: 36 }}
                  />
                </View>

                {/* ── Divider ── */}
                <View className="h-px bg-surface-4 mx-5 mt-3 mb-3" />

                {/* ── Category picker (when open) ── */}
                {showCategories && (
                  <View className="px-5 pb-3">
                    <View className="flex-row flex-wrap gap-2">
                      {getAllCategories().map((cat) => {
                        const active = activeCategory === cat.category;
                        return (
                          <TouchableOpacity
                            key={cat.category}
                            className="flex-row items-center px-3 py-1.5 rounded-full"
                            style={{
                              backgroundColor: active ? `${cat.color}25` : '#1C1C1E',
                              borderWidth: active ? 1 : 0,
                              borderColor: cat.color,
                            }}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setManualCategory(cat.category);
                              setShowCategories(false);
                            }}
                          >
                            <Ionicons name={cat.icon as any} size={13} color={cat.color} />
                            <Text className="text-caption-1 font-medium text-ink-primary ml-1.5">
                              {cat.category}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* ── Date / Time / Duration chips ── */}
                <View className="flex-row items-center px-5 gap-2.5 flex-wrap">
                  {/* Date (always manual) */}
                  <TouchableOpacity
                    className="flex-row items-center bg-surface-2 px-3 py-2 rounded-lg"
                    onPress={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); setShowDurationPicker(false); }}
                  >
                    <Ionicons name="calendar-outline" size={15} color="#71717A" />
                    <Text className="text-subhead text-ink-secondary ml-1.5">{fmtDate(dueDate)}</Text>
                  </TouchableOpacity>

                  {/* Time (always manual) */}
                  <TouchableOpacity
                    className="flex-row items-center bg-surface-2 px-3 py-2 rounded-lg"
                    onPress={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); setShowDurationPicker(false); }}
                  >
                    <Ionicons name="time-outline" size={15} color="#71717A" />
                    <Text className={`text-subhead ml-1.5 ${dueTime ? 'text-ink-secondary' : 'text-ink-disabled'}`}>
                      {dueTime ? fmtTime(dueTime) : 'Time'}
                    </Text>
                  </TouchableOpacity>

                  {/* Duration (may be AI-filled) */}
                  <TouchableOpacity
                    className="flex-row items-center bg-surface-2 px-3 py-2 rounded-lg"
                    onPress={() => { setShowDurationPicker(!showDurationPicker); setShowDatePicker(false); setShowTimePicker(false); }}
                  >
                    <Ionicons name="hourglass-outline" size={15} color="#71717A" />
                    <Text className={`text-subhead ml-1.5 ${duration ? 'text-ink-secondary' : 'text-ink-disabled'}`}>
                      {duration ? fmtDuration(duration) : 'Duration'}
                    </Text>
                    {isDurationAI && (
                      <Ionicons name="sparkles" size={10} color="#A78BFA" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* ── Date Picker ── */}
                {showDatePicker && (
                  <View className="px-5 mt-2">
                    <DateTimePicker
                      value={dueDate}
                      mode="date"
                      display="spinner"
                      minimumDate={new Date()}
                      onChange={(_, date) => {
                        if (Platform.OS !== 'ios') setShowDatePicker(false);
                        if (date) setDueDate(date);
                      }}
                      textColor="#fff"
                      style={{ height: 150 }}
                    />
                  </View>
                )}

                {/* ── Time Picker ── */}
                {showTimePicker && (
                  <View className="px-5 mt-2">
                    <DateTimePicker
                      value={dueTime || new Date()}
                      mode="time"
                      display="spinner"
                      onChange={(_, date) => {
                        if (Platform.OS !== 'ios') setShowTimePicker(false);
                        if (date) setDueTime(date);
                      }}
                      textColor="#fff"
                      style={{ height: 150 }}
                    />
                    {dueTime && (
                      <TouchableOpacity className="items-center py-1" onPress={() => { setDueTime(null); setShowTimePicker(false); }}>
                        <Text className="text-caption-1 text-ink-disabled">Clear time</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* ── Duration chips ── */}
                {showDurationPicker && (
                  <View className="flex-row flex-wrap gap-2 px-5 mt-3">
                    {DURATIONS.map((m) => (
                      <TouchableOpacity
                        key={m}
                        className={`px-3.5 py-1.5 rounded-lg ${duration === m ? 'bg-brand-purple' : 'bg-surface-2'}`}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setDuration(duration === m ? null : m);
                          setManualDuration(true); // user chose this manually
                          setShowDurationPicker(false);
                        }}
                      >
                        <Text className={`text-subhead font-medium ${duration === m ? 'text-white' : 'text-ink-secondary'}`}>
                          {fmtDuration(m)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* ── Priority ── */}
                <View className="px-5 mt-4 mb-2">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-caption-1 text-ink-disabled">Priority</Text>
                    {isPriorityAI && (
                      <View className="flex-row items-center ml-2">
                        <Ionicons name="sparkles" size={10} color="#A78BFA" />
                        <Text className="text-caption-2 text-brand-secondary ml-0.5">AI suggested</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row gap-2">
                    {PRIORITIES.map((p) => {
                      const active = priority === p.value;
                      return (
                        <TouchableOpacity
                          key={p.value}
                          className={`flex-1 py-2 rounded-lg items-center ${active ? 'bg-surface-3' : 'bg-surface-2'}`}
                          style={active ? { borderWidth: 1.5, borderColor: p.color } : {}}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setPriority(p.value);
                            setManualPriority(true); // user chose this manually
                          }}
                        >
                          <View className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: p.color }} />
                          <Text className={`text-caption-1 font-medium ${active ? 'text-ink-primary' : 'text-ink-disabled'}`}>
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* ── CTA ── */}
              <View className="px-5 pt-3 pb-2">
                <TouchableOpacity
                  className={`py-3.5 rounded-xl items-center ${isValid ? 'bg-brand-purple' : 'bg-surface-3'}`}
                  onPress={handleCreate}
                  disabled={!isValid || creating}
                  activeOpacity={0.8}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className={`text-headline font-bold ${isValid ? 'text-white' : 'text-ink-disabled'}`}>
                      Create Task
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
