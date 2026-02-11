/**
 * Date Filter Bar
 *
 * Quick date navigation for the Tasks page:
 * - "All" chip (default — shows grouped overdue/today/tomorrow/later)
 * - "Today" chip
 * - "Tomorrow" chip
 * - Calendar button → opens full month picker for any date
 * - When a specific date is picked, shows it as an active chip with ✕ to clear
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

export type DateFilter = 'all' | 'today' | 'tomorrow' | 'custom';

interface DateFilterBarProps {
  activeFilter: DateFilter;
  customDate: Date | null;
  onFilterChange: (filter: DateFilter, customDate?: Date) => void;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatCustomDate(d: Date): string {
  const today = new Date();
  const diff = Math.floor(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      86400000,
  );
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function DateFilterBar({ activeFilter, customDate, onFilterChange }: DateFilterBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const handleChipPress = (filter: DateFilter) => {
    Haptics.selectionAsync();
    onFilterChange(filter);
  };

  const handleCalendarPress = () => {
    Haptics.selectionAsync();
    setTempDate(customDate || new Date());
    setShowPicker(true);
  };

  const handleDateConfirm = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // If they picked today or tomorrow, use those filters instead
    if (isSameDay(tempDate, today)) {
      onFilterChange('today');
    } else if (isSameDay(tempDate, tomorrow)) {
      onFilterChange('tomorrow');
    } else {
      onFilterChange('custom', tempDate);
    }
    setShowPicker(false);
  };

  const chips: { filter: DateFilter; label: string }[] = [
    { filter: 'all', label: 'All' },
    { filter: 'today', label: 'Today' },
    { filter: 'tomorrow', label: 'Tomorrow' },
  ];

  return (
    <View className="border-b border-surface-4">
      <View className="flex-row items-center px-5 py-2.5 gap-2">
        {/* Quick filter chips */}
        {chips.map((chip) => {
          const active = activeFilter === chip.filter;
          return (
            <TouchableOpacity
              key={chip.filter}
              className={`px-3.5 py-1.5 rounded-full ${
                active ? 'bg-brand-purple' : 'bg-surface-2'
              }`}
              onPress={() => handleChipPress(chip.filter)}
              activeOpacity={0.7}
            >
              <Text
                className={`text-subhead font-medium ${
                  active ? 'text-white' : 'text-ink-tertiary'
                }`}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Custom date chip (shown when a custom date is selected) */}
        {activeFilter === 'custom' && customDate && (
          <TouchableOpacity
            className="flex-row items-center bg-brand-purple px-3 py-1.5 rounded-full"
            onPress={handleCalendarPress}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar" size={13} color="#fff" />
            <Text className="text-subhead font-medium text-white ml-1.5">
              {formatCustomDate(customDate)}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                Haptics.selectionAsync();
                onFilterChange('all');
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="ml-1.5"
            >
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Spacer */}
        <View className="flex-1" />

        {/* Calendar button */}
        {activeFilter !== 'custom' && (
          <TouchableOpacity
            className="w-9 h-9 bg-surface-2 rounded-full items-center justify-center"
            onPress={handleCalendarPress}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={18} color="#71717A" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Date Picker Modal ── */}
      {showPicker && Platform.OS === 'ios' && (
        <Modal visible transparent animationType="fade">
          <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowPicker(false)}>
            <Pressable className="bg-surface-1 rounded-t-2xl border-t border-surface-4" onPress={(e) => e.stopPropagation()}>
              {/* Header */}
              <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text className="text-headline text-ink-tertiary">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-headline font-semibold text-ink-primary">Pick a Date</Text>
                <TouchableOpacity onPress={handleDateConfirm}>
                  <Text className="text-headline font-semibold text-brand-purple">Done</Text>
                </TouchableOpacity>
              </View>

              {/* Calendar */}
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                onChange={(_, date) => {
                  if (date) setTempDate(date);
                }}
                textColor="#fff"
                themeVariant="dark"
                style={{ height: 340 }}
              />

              {/* Bottom safe area padding */}
              <View className="h-8" />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Android — inline picker (no modal needed, auto-dismisses) */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="calendar"
          onChange={(event, date) => {
            setShowPicker(false);
            if (event.type === 'set' && date) {
              setTempDate(date);
              // Auto-confirm on Android
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              if (isSameDay(date, today)) {
                onFilterChange('today');
              } else if (isSameDay(date, tomorrow)) {
                onFilterChange('tomorrow');
              } else {
                onFilterChange('custom', date);
              }
            }
          }}
        />
      )}
    </View>
  );
}
