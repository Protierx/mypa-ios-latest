/**
 * Date Filter Bar — Light Theme
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatCustomDate(d: Date): string {
  const today = new Date();
  const diff = Math.floor(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000,
  );
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function DateFilterBar({ activeFilter, customDate, onFilterChange }: DateFilterBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const handleChipPress = (filter: DateFilter) => { Haptics.selectionAsync(); onFilterChange(filter); };
  const handleCalendarPress = () => { Haptics.selectionAsync(); setTempDate(customDate || new Date()); setShowPicker(true); };

  const handleDateConfirm = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    if (isSameDay(tempDate, today)) onFilterChange('today');
    else if (isSameDay(tempDate, tomorrow)) onFilterChange('tomorrow');
    else onFilterChange('custom', tempDate);
    setShowPicker(false);
  };

  const chips: { filter: DateFilter; label: string }[] = [
    { filter: 'all', label: 'All' },
    { filter: 'today', label: 'Today' },
    { filter: 'tomorrow', label: 'Tomorrow' },
  ];

  return (
    <View style={{ borderBottomWidth: 0.5, borderBottomColor: 'rgba(229,229,234,0.8)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}>
        {chips.map((chip) => {
          const active = activeFilter === chip.filter;
          return (
            <TouchableOpacity
              key={chip.filter}
              style={{
                paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, minHeight: 44,
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: active ? '#7C3AED' : '#FFFFFF',
                borderWidth: active ? 0 : 1,
                borderColor: '#EDEDF0',
                ...(active ? {
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 2,
                } : {}),
              }}
              onPress={() => handleChipPress(chip.filter)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14, fontWeight: active ? '600' : '500', color: active ? '#FFFFFF' : '#48484A' }}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {activeFilter === 'custom' && customDate && (
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#7C3AED' }}
            onPress={handleCalendarPress}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar" size={12} color="#fff" />
            <Text style={{ fontSize: 13.5, fontWeight: '600', color: '#FFFFFF', marginLeft: 5 }}>{formatCustomDate(customDate)}</Text>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); Haptics.selectionAsync(); onFilterChange('all'); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 6 }}
            >
              <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }} />

        {activeFilter !== 'custom' && (
          <TouchableOpacity
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', alignItems: 'center', justifyContent: 'center' }}
            onPress={handleCalendarPress}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={18} color="#636366" />
          </TouchableOpacity>
        )}
      </View>

      {/* iOS Date Picker */}
      {showPicker && Platform.OS === 'ios' && (
        <Modal visible transparent animationType="fade">
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }} onPress={() => setShowPicker(false)}>
            <Pressable
              style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
              onPress={(e) => e.stopPropagation()}
            >
              <SafeAreaView edges={['bottom']}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={{ fontSize: 16, color: '#8E8E93' }}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1C1C1E' }}>Pick a Date</Text>
                  <TouchableOpacity onPress={handleDateConfirm}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#7C3AED' }}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="inline"
                  onChange={(_, date) => { if (date) setTempDate(date); }}
                  themeVariant="light"
                  accentColor="#7C3AED"
                  style={{ height: 340 }}
                />
              </SafeAreaView>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="calendar"
          onChange={(event, date) => {
            setShowPicker(false);
            if (event.type === 'set' && date) {
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
              if (isSameDay(date, today)) onFilterChange('today');
              else if (isSameDay(date, tomorrow)) onFilterChange('tomorrow');
              else onFilterChange('custom', date);
            }
          }}
        />
      )}
    </View>
  );
}
