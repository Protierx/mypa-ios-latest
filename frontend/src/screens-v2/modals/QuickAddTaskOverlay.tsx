/**
 * Add Task Modal — Light Theme + AI-Powered
 *
 * The modal that makes users feel like they're talking to an AI planner,
 * not filling out a database form. AI suggests as you type, fills in
 * the boring parts, and gets out of the way.
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
import { useBrainDump } from '../../hooks/supabase/useBrainDump';
import { Task } from '../../lib/supabase';
import {
  suggestFromTitle,
  getAllCategories,
  TaskCategory,
  TaskSuggestion,
} from '../../services/categorySuggestion';
import { eventLogger } from '../../services/eventLogger';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius, spacing } from '../../styles/theme';

// ============================================================================
// Types + Constants
// ============================================================================

interface QuickAddTaskOverlayProps {
  visible: boolean;
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
  onBrainDumpCreated?: () => void;
  initialDate?: Date;
  /** When converting a brain dump item, prefill text and require scheduling */
  brainDumpSource?: { id: string; text: string } | null;
  /** Called after a brain dump item is successfully converted to a task */
  onBrainDumpConverted?: (brainDumpId: string, taskId: string) => void;
}

type PriorityOption = Task['priority'];

const PRIORITIES: { value: PriorityOption; label: string; color: string; dot: string }[] = [
  { value: 'low', label: 'Low', color: semantic.success, dot: semantic.success },
  { value: 'medium', label: 'Med', color: semantic.warning, dot: semantic.warning },
  { value: 'high', label: 'High', color: semantic.error, dot: semantic.error },
  { value: 'urgent', label: 'Urgent', color: semantic.error, dot: semantic.error },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

// ============================================================================
// Component
// ============================================================================

export function QuickAddTaskOverlay({
  visible,
  onClose,
  onTaskCreated,
  onBrainDumpCreated,
  initialDate,
  brainDumpSource,
  onBrainDumpConverted,
}: QuickAddTaskOverlayProps) {
  const { createTask } = useTasks();
  const { createItem: createBrainDumpItem } = useBrainDump();
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Whether we are converting from a brain dump item
  const isConversion = !!brainDumpSource;

  // Form state
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<Date>(initialDate || new Date());
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState<number | null>(30); // default 30 min, AI will refine
  const [priority, setPriority] = useState<PriorityOption>('medium');
  const [creating, setCreating] = useState(false);
  const [dateExplicitlySet, setDateExplicitlySet] = useState(false);

  // AI suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<TaskSuggestion | null>(null);
  const [manualCategory, setManualCategory] = useState<TaskCategory | null>(null);
  const [manualPriority, setManualPriority] = useState(false);
  const [manualDuration, setManualDuration] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      // If converting from brain dump, prefill the title
      if (brainDumpSource) {
        setTitle(brainDumpSource.text);
        handleTitleChange(brainDumpSource.text);
      }
      setTimeout(() => inputRef.current?.focus(), 300);
      eventLogger.log('modal_opened', { modal: 'add_task', isConversion });
    } else {
      if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
      resetForm();
    }
    return () => { if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; } };
  }, [visible]);

  useEffect(() => { if (initialDate) setDueDate(initialDate); }, [initialDate]);

  const resetForm = () => {
    setTitle(''); setNotes('');
    setDueDate(initialDate || new Date());
    setDueTime(null); setDuration(30); setPriority('medium');
    setAiSuggestion(null); setManualCategory(null);
    setManualPriority(false); setManualDuration(false);
    setShowCategories(false); setShowDatePicker(false);
    setShowTimePicker(false); setShowDurationPicker(false);
    setDateExplicitlySet(false);
  };

  // ── AI suggestion (debounced) ──
  const handleTitleChange = useCallback((text: string) => {
    setTitle(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const s = suggestFromTitle(text);
      if (s && s.confidence >= 0.25) {
        setAiSuggestion(s);
        if (!manualPriority) setPriority(s.priority);
        if (!manualDuration) setDuration(s.duration);
        eventLogger.log('feature_used', { feature: 'ai_task_suggestion', category: s.category, priority: s.priority, duration: s.duration });
      } else {
        setAiSuggestion(null);
        if (!manualPriority) setPriority('medium');
        // Always default to 30 min — every task must have a duration
        if (!manualDuration) setDuration(s?.duration ?? 30);
      }
    }, 400);
  }, [manualPriority, manualDuration]);

  const buildDueDate = (): string => {
    const d = new Date(dueDate);
    if (dueTime) { d.setHours(dueTime.getHours(), dueTime.getMinutes(), 0, 0); }
    else { d.setHours(23, 59, 0, 0); }
    return d.toISOString();
  };

  /**
   * Smart routing: determine if user has intentionally set scheduling info.
   * - If user explicitly picked a time OR this is a brain dump conversion → treat as scheduled task.
   * - If user explicitly picked a date (changed from default) → treat as scheduled task.
   * - Otherwise → brain dump item.
   *
   * During conversion mode, always create a task (user must schedule).
   */
  const hasExplicitSchedule = !!dueTime || dateExplicitlySet || isConversion;

  const isValid = title.trim().length >= 1;

  const handleCreate = useCallback(async () => {
    if (!isValid || creating) return;
    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const cat = manualCategory || aiSuggestion?.category;
      let desc = notes.trim();
      if (cat) desc = desc ? `[${cat}] ${desc}` : `[${cat}]`;

      if (hasExplicitSchedule) {
        // ── Route to tasks table ──
        const task = await createTask({
          title: title.trim(), description: desc || null,
          due_date: buildDueDate(), priority, estimated_duration: duration,
        });
        setCreating(false);
        if (task) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          eventLogger.log('task_created', {
            taskId: task.id, priority, category: cat || 'none', duration,
            aiSuggested: !!aiSuggestion,
            fromBrainDump: isConversion,
          });

          // If converting a brain dump item, mark it as converted
          if (isConversion && brainDumpSource) {
            onBrainDumpConverted?.(brainDumpSource.id, task.id);
          }

          onTaskCreated?.(task);
          onClose();
        } else {
          Alert.alert('Hmm', "Task couldn't be saved. Please try again.");
        }
      } else {
        // ── Route to brain dump ──
        const item = await createBrainDumpItem(title.trim());
        setCreating(false);
        if (item) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          eventLogger.log('feature_used', {
            feature: 'brain_dump_auto_routed',
            itemId: item.id,
          });
          onBrainDumpCreated?.();
          onClose();
        } else {
          Alert.alert('Hmm', "Couldn't save right now. Please try again.");
        }
      }
    } catch (err: any) {
      setCreating(false);
      Alert.alert('Something went wrong', 'Please try again later.');
    }
  }, [title, notes, dueDate, dueTime, priority, duration, isValid, creating,
    manualCategory, manualPriority, manualDuration, aiSuggestion,
    createTask, createBrainDumpItem, onTaskCreated, onBrainDumpCreated, onClose,
    hasExplicitSchedule, isConversion, brainDumpSource, onBrainDumpConverted]);

  // ── Helpers ──
  const fmtDate = (d: Date): string => {
    const t = new Date(); const tm = new Date(t); tm.setDate(tm.getDate() + 1);
    if (d.toDateString() === t.toDateString()) return 'Today';
    if (d.toDateString() === tm.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const fmtDuration = (m: number) => { if (m < 60) return `${m}m`; const h = Math.floor(m / 60); const r = m % 60; return r ? `${h}h ${r}m` : `${h}h`; };

  const activeCategory = manualCategory || aiSuggestion?.category || null;
  const activeCategoryMeta = activeCategory ? getAllCategories().find((c) => c.category === activeCategory) : null;
  const isPriorityAI = !!aiSuggestion && !manualPriority;
  const isDurationAI = !!aiSuggestion && !manualDuration && duration !== null;
  const isCategoryAI = !!aiSuggestion && !manualCategory;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.35)' }}>
          {/* Scrim — only this area dismisses */}
          <Pressable style={{ flex: 1 }} onPress={() => { Keyboard.dismiss(); onClose(); }} />

          {/* Sheet */}
          <View
            style={{
              backgroundColor: bg.card,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              ...shadows.lg,
            }}
          >
            <SafeAreaView edges={['bottom']}>
              {/* Handle */}
              <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: borderTokens.secondary }} />
              </View>

              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: textTokens.primary }}>
                    {isConversion ? 'Move to Tasks' : 'New Task'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, backgroundColor: brand.surface, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 }}>
                    <Ionicons name="sparkles" size={11} color={brand.primary} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: brand.primary, marginLeft: 3 }}>AI Assist</Text>
                  </View>
                </View>

                {activeCategory && activeCategoryMeta && (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: `${activeCategoryMeta.color}12` }}
                    onPress={() => setShowCategories(!showCategories)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={activeCategoryMeta.icon as any} size={13} color={activeCategoryMeta.color} />
                    <Text style={{ fontSize: 12.5, fontWeight: '600', color: activeCategoryMeta.color, marginLeft: 4 }}>{activeCategory}</Text>
                    {isCategoryAI && <Ionicons name="sparkles" size={8} color={brand.primary} style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                ref={scrollRef}
                style={{ maxHeight: 520 }}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
                {/* Title Input */}
                <View style={{ paddingHorizontal: 20 }}>
                  <TextInput
                    ref={inputRef}
                    value={title}
                    onChangeText={handleTitleChange}
                    placeholder="What needs to be done?"
                    placeholderTextColor="#C7C7CC"
                    style={{
                      fontSize: 18, lineHeight: 24, fontWeight: '500',
                      color: textTokens.primary, paddingVertical: 8,
                      borderBottomWidth: 1, borderBottomColor: title.length > 0 ? brand.primary : borderTokens.primary,
                    }}
                    returnKeyType="next"
                    autoCapitalize="sentences"
                  />
                  {/* Smart routing hint */}
                  {!isConversion && title.trim().length > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <Ionicons
                        name={hasExplicitSchedule ? 'calendar-outline' : 'bulb-outline'}
                        size={12}
                        color={hasExplicitSchedule ? brand.primary : semantic.warning}
                      />
                      <Text style={{ fontSize: 12, color: textTokens.tertiary, marginLeft: 4 }}>
                        {hasExplicitSchedule
                          ? 'Will be saved as a scheduled task'
                          : 'No date set — will be saved to Brain Dump'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* AI Suggestion Banner */}
                {aiSuggestion && aiSuggestion.confidence >= 0.25 && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowCategories(true)}
                    style={{
                      marginHorizontal: 20, marginTop: 12,
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 14, paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: brand.muted,
                      borderWidth: 1, borderColor: brand.surface,
                    }}
                  >
                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: brand.surface, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Ionicons name="sparkles" size={14} color={brand.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: brand.primary }}>
                        {aiSuggestion.category} — {aiSuggestion.priority} priority — {fmtDuration(aiSuggestion.duration)}
                      </Text>
                      <Text style={{ fontSize: 11, color: brand.primary, marginTop: 1 }}>
                        AI suggestion based on your title
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={brand.primary} />
                  </TouchableOpacity>
                )}

                {/* Notes */}
                <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add notes..."
                    placeholderTextColor={textTokens.disabled}
                    multiline numberOfLines={2}
                    style={{ fontSize: 14.5, color: textTokens.secondary, paddingVertical: 4, minHeight: 36 }}
                  />
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: borderTokens.secondary, marginHorizontal: 20, marginTop: 10, marginBottom: 14 }} />

                {/* Category picker */}
                {showCategories && (
                  <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 8, letterSpacing: 0.3 }}>CATEGORY</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {getAllCategories().map((cat) => {
                        const isActive = activeCategory === cat.category;
                        return (
                          <TouchableOpacity
                            key={cat.category}
                            style={{
                              flexDirection: 'row', alignItems: 'center',
                              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
                              backgroundColor: isActive ? `${cat.color}15` : bg.secondary,
                              borderWidth: isActive ? 1.5 : 1,
                              borderColor: isActive ? cat.color : borderTokens.primary,
                            }}
                            onPress={() => { Haptics.selectionAsync(); setManualCategory(cat.category); setShowCategories(false); }}
                          >
                            <Ionicons name={cat.icon as any} size={13} color={isActive ? cat.color : textTokens.tertiary} />
                            <Text style={{ fontSize: 13, fontWeight: isActive ? '600' : '500', color: isActive ? cat.color : textTokens.secondary, marginLeft: 5 }}>{cat.category}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Schedule label */}
                <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, letterSpacing: 0.3 }}>SCHEDULE</Text>
                </View>

                {/* Date / Time / Duration — full-width row buttons */}
                <View style={{ paddingHorizontal: 20, gap: 10 }}>
                  {/* Date button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
                      backgroundColor: showDatePicker ? brand.muted : bg.secondary,
                      borderWidth: 1.5, borderColor: showDatePicker ? brand.primary : borderTokens.primary,
                    }}
                    onPress={() => {
                      const opening = !showDatePicker;
                      setShowDatePicker(opening); setShowTimePicker(false); setShowDurationPicker(false);
                      if (opening) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: showDatePicker ? brand.surface : bg.hover, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="calendar" size={17} color={showDatePicker ? brand.primary : textTokens.secondary} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ fontSize: 12, color: textTokens.tertiary, fontWeight: '500' }}>Date</Text>
                      <Text style={{ fontSize: 15, color: textTokens.primary, fontWeight: '600', marginTop: 1 }}>{fmtDate(dueDate)}</Text>
                    </View>
                    <Ionicons name={showDatePicker ? 'chevron-up' : 'chevron-down'} size={18} color={textTokens.tertiary} />
                  </TouchableOpacity>

                  {/* Time button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
                      backgroundColor: showTimePicker ? brand.muted : bg.secondary,
                      borderWidth: 1.5, borderColor: showTimePicker ? brand.primary : borderTokens.primary,
                    }}
                    onPress={() => {
                      const opening = !showTimePicker;
                      setShowTimePicker(opening); setShowDatePicker(false); setShowDurationPicker(false);
                      if (opening) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: showTimePicker ? brand.surface : bg.hover, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="time" size={17} color={showTimePicker ? brand.primary : textTokens.secondary} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ fontSize: 12, color: textTokens.tertiary, fontWeight: '500' }}>Time</Text>
                      <Text style={{ fontSize: 15, color: dueTime ? textTokens.primary : textTokens.tertiary, fontWeight: '600', marginTop: 1 }}>
                        {dueTime ? fmtTime(dueTime) : 'Tap to set time'}
                      </Text>
                    </View>
                    <Ionicons name={showTimePicker ? 'chevron-up' : 'chevron-down'} size={18} color={textTokens.tertiary} />
                  </TouchableOpacity>

                  {/* Duration button */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
                      backgroundColor: showDurationPicker ? brand.muted : bg.secondary,
                      borderWidth: 1.5, borderColor: showDurationPicker ? brand.primary : borderTokens.primary,
                    }}
                    onPress={() => {
                      const opening = !showDurationPicker;
                      setShowDurationPicker(opening); setShowDatePicker(false); setShowTimePicker(false);
                      if (opening) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: showDurationPicker ? brand.surface : bg.hover, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="hourglass" size={17} color={showDurationPicker ? brand.primary : textTokens.secondary} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ fontSize: 12, color: textTokens.tertiary, fontWeight: '500' }}>Duration</Text>
                      <Text style={{ fontSize: 15, color: duration ? textTokens.primary : textTokens.tertiary, fontWeight: '600', marginTop: 1 }}>
                        {duration ? fmtDuration(duration) : 'Tap to set duration'}
                      </Text>
                    </View>
                    {isDurationAI && <Ionicons name="sparkles" size={10} color={brand.primary} style={{ marginRight: 4 }} />}
                    <Ionicons name={showDurationPicker ? 'chevron-up' : 'chevron-down'} size={18} color={textTokens.tertiary} />
                  </TouchableOpacity>
                </View>

                {/* Date Picker */}
                {showDatePicker && (
                  <View style={{ paddingHorizontal: 20, marginTop: 10, paddingBottom: 8 }}>
                    <DateTimePicker
                      value={dueDate} mode="date" display="spinner"
                      minimumDate={new Date()}
                      onChange={(_, date) => { if (Platform.OS !== 'ios') setShowDatePicker(false); if (date) { setDueDate(date); setDateExplicitlySet(true); } }}
                      textColor={textTokens.primary}
                      themeVariant="light"
                      style={{ height: 200 }}
                    />
                  </View>
                )}

                {/* Time Picker */}
                {showTimePicker && (
                  <View style={{ paddingHorizontal: 20, marginTop: 10, paddingBottom: 8 }}>
                    <DateTimePicker
                      value={dueTime || new Date()} mode="time" display="spinner"
                      onChange={(_, date) => { if (Platform.OS !== 'ios') setShowTimePicker(false); if (date) setDueTime(date); }}
                      textColor={textTokens.primary}
                      themeVariant="light"
                      style={{ height: 200 }}
                    />
                    {dueTime && (
                      <TouchableOpacity
                        style={{ alignItems: 'center', paddingVertical: 8 }}
                        onPress={() => { setDueTime(null); setShowTimePicker(false); }}
                      >
                        <Text style={{ fontSize: 14, color: brand.primary, fontWeight: '600' }}>Clear time</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Duration chips */}
                {showDurationPicker && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginTop: 12, paddingBottom: 8 }}>
                    {DURATIONS.map((m) => {
                      const isActive = duration === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={{
                            paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
                            backgroundColor: isActive ? brand.primary : bg.secondary,
                            borderWidth: isActive ? 0 : 1, borderColor: borderTokens.primary,
                            minWidth: 64, alignItems: 'center',
                          }}
                          onPress={() => { Haptics.selectionAsync(); setDuration(isActive ? null : m); setManualDuration(true); setShowDurationPicker(false); }}
                        >
                          <Text style={{ fontSize: 15, fontWeight: '600', color: isActive ? textTokens.inverse : textTokens.secondary }}>{fmtDuration(m)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Priority */}
                <View style={{ paddingHorizontal: 20, marginTop: 18, marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, letterSpacing: 0.3 }}>PRIORITY</Text>
                    {isPriorityAI && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: brand.surface, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 }}>
                        <Ionicons name="sparkles" size={9} color={brand.primary} />
                        <Text style={{ fontSize: 10, fontWeight: '600', color: brand.primary, marginLeft: 2 }}>AI</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {PRIORITIES.map((p) => {
                      const isActive = priority === p.value;
                      return (
                        <TouchableOpacity
                          key={p.value}
                          style={{
                            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                            paddingVertical: 10, borderRadius: 10,
                            backgroundColor: isActive ? `${p.color}12` : bg.secondary,
                            borderWidth: isActive ? 1.5 : 1,
                            borderColor: isActive ? p.color : borderTokens.primary,
                          }}
                          onPress={() => { Haptics.selectionAsync(); setPriority(p.value); setManualPriority(true); }}
                        >
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: p.dot, marginRight: 5 }} />
                          <Text style={{ fontSize: 12.5, fontWeight: isActive ? '700' : '500', color: isActive ? p.color : textTokens.secondary }}>{p.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* CTA */}
              <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 }}>
                <TouchableOpacity
                  style={{
                    paddingVertical: 15, borderRadius: 14, alignItems: 'center',
                    backgroundColor: isValid ? brand.primary : bg.secondary,
                    borderWidth: isValid ? 0 : 1, borderColor: borderTokens.primary,
                    shadowColor: isValid ? brand.primary : 'transparent',
                    shadowOffset: { width: 0, height: 4 }, shadowOpacity: isValid ? 0.25 : 0, shadowRadius: 10,
                    opacity: creating ? 0.7 : 1,
                  }}
                  onPress={handleCreate}
                  disabled={!isValid || creating}
                  activeOpacity={0.8}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color={textTokens.inverse} />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {isValid && <Ionicons name={hasExplicitSchedule ? 'sparkles' : 'bulb-outline'} size={15} color={isValid ? textTokens.inverse : textTokens.tertiary} style={{ marginRight: 6 }} />}
                      <Text style={{ fontSize: 16.5, fontWeight: '700', color: isValid ? textTokens.inverse : textTokens.tertiary }}>
                        {isConversion
                          ? 'Schedule Task'
                          : hasExplicitSchedule
                          ? 'Create Task'
                          : 'Save to Brain Dump'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
