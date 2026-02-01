import React from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { WeeklyStats, TimeColors } from '../types';

interface WeeklyProgressProps {
  weeklyStats: WeeklyStats | null;
  colors: TimeColors;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

export const WeeklyProgress: React.FC<WeeklyProgressProps> = ({
  weeklyStats,
  colors,
  fadeAnim,
  scaleAnim,
}) => {
  if (!weeklyStats) return null;

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons name="trending-up" size={20} color="#34C759" />
        <Text style={[styles.sectionTitle, { color: '#34C759' }]}>
          This Week
        </Text>
      </View>
      <View style={styles.weeklyCard}>
        <View style={styles.weeklyStats}>
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyStatNumber}>
              {weeklyStats.tasksCompleted || 0}
            </Text>
            <Text style={styles.weeklyStatLabel}>Completed</Text>
          </View>
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyStatNumber}>
              {weeklyStats.focusMins || 0}
            </Text>
            <Text style={styles.weeklyStatLabel}>Focus mins</Text>
          </View>
          <View style={styles.weeklyStat}>
            <Text style={styles.weeklyStatNumber}>
              {weeklyStats.xpEarned || 0}
            </Text>
            <Text style={styles.weeklyStatLabel}>XP earned</Text>
          </View>
        </View>

        <View style={styles.weekDays}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
            const isToday = i === (new Date().getDay() + 6) % 7;
            const hasActivity = weeklyStats.dailyData?.[i]?.completed > 0;

            return (
              <View key={i} style={styles.weekDay}>
                <View
                  style={[
                    styles.weekDayDot,
                    hasActivity && styles.weekDayDotActive,
                    isToday && [styles.weekDayDotToday, { borderColor: colors.accent }],
                  ]}
                />
                <Text
                  style={[
                    styles.weekDayLabel,
                    isToday && { color: colors.accent, fontWeight: '600' },
                  ]}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};
