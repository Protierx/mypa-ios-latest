/**
 * Calendar Strip Component
 *
 * Minimal horizontal date navigator — Apple Calendar inspired.
 * Compact single-row design: day letter + date number + task dot.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

interface CalendarStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  taskCountByDate?: Record<string, number>;
  daysToShow?: number;
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const CELL_WIDTH = 44;
const CELL_GAP = 6;

export function CalendarStrip({
  selectedDate,
  onDateSelect,
  taskCountByDate = {},
  daysToShow = 14,
}: CalendarStripProps) {
  const scrollRef = useRef<ScrollView>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }

  // Auto-scroll to selected date on mount
  useEffect(() => {
    const idx = dates.findIndex((d) => isSameDay(d, selectedDate));
    if (idx > 2 && scrollRef.current) {
      const offset = Math.max(0, idx * (CELL_WIDTH + CELL_GAP) - 60);
      setTimeout(() => scrollRef.current?.scrollTo({ x: offset, animated: false }), 50);
    }
  }, []);

  const handleSelect = useCallback(
    (date: Date) => {
      Haptics.selectionAsync();
      onDateSelect(date);
    },
    [onDateSelect],
  );

  return (
    <View className="border-b border-surface-4">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 6,
          paddingBottom: 10,
          gap: CELL_GAP,
        }}
      >
        {dates.map((date) => {
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const dateKey = toDateKey(date);
          const hasTask = (taskCountByDate[dateKey] || 0) > 0;

          return (
            <TouchableOpacity
              key={dateKey}
              onPress={() => handleSelect(date)}
              activeOpacity={0.6}
              style={{ width: CELL_WIDTH, alignItems: 'center' }}
            >
              {/* Day letter */}
              <Text
                className={`text-caption-2 font-medium mb-1 ${
                  isSelected ? 'text-brand-purple' : isToday ? 'text-ink-secondary' : 'text-ink-disabled'
                }`}
              >
                {isToday && isSelected ? 'Today' : DAY_LETTERS[date.getDay()]}
              </Text>

              {/* Date number */}
              <View
                className={`w-9 h-9 rounded-full items-center justify-center ${
                  isSelected
                    ? 'bg-brand-purple'
                    : isToday
                    ? 'bg-surface-3'
                    : ''
                }`}
              >
                <Text
                  className={`text-callout font-semibold ${
                    isSelected ? 'text-white' : isToday ? 'text-ink-primary' : 'text-ink-secondary'
                  }`}
                >
                  {date.getDate()}
                </Text>
              </View>

              {/* Task dot */}
              <View className="h-1.5 mt-1 items-center justify-center">
                {hasTask && (
                  <View
                    className={`w-1 h-1 rounded-full ${
                      isSelected ? 'bg-brand-purple' : 'bg-ink-disabled'
                    }`}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export { isSameDay, toDateKey };
