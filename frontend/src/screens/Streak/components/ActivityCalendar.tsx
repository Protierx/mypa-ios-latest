import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CalendarDay } from '../types';
import { styles } from '../styles';

interface ActivityCalendarProps {
  calendarDays: CalendarDay[];
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  calendarDays,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name="calendar" size={20} color="#F97316" />
      <Text style={styles.sectionTitle}>Activity This Month</Text>
    </View>
    <View style={styles.calendarGrid}>
      {DAY_LABELS.map((day, i) => (
        <Text key={i} style={styles.calendarDayLabel}>{day}</Text>
      ))}
      {calendarDays.map((day, i) => (
        <View
          key={i}
          style={[
            styles.calendarDay,
            day.isToday && styles.calendarDayToday,
            day.isActive && !day.isToday && styles.calendarDayActive,
          ]}
        >
          {day.isActive ? (
            <MaterialCommunityIcons
              name="fire"
              size={14}
              color={day.isToday ? '#FFFFFF' : '#F97316'}
            />
          ) : (
            <Text style={styles.calendarDayText}>{day.date.getDate()}</Text>
          )}
        </View>
      ))}
    </View>
  </View>
);
