import React from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { DayStats } from '../types';

interface StatsSnapshotProps {
  stats: DayStats;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  progressAnim: Animated.Value;
}

export const StatsSnapshot: React.FC<StatsSnapshotProps> = ({
  stats,
  fadeAnim,
  slideAnim,
  progressAnim,
}) => {
  const getProductivityColor = (percent: number): string => {
    if (percent >= 80) return '#34C759';
    if (percent >= 60) return '#007AFF';
    if (percent >= 40) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>TODAY'S SNAPSHOT</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#007AFF' }]}>
            {stats.pending}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#34C759' }]}>
            {stats.completed}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
            {stats.highPriority}
          </Text>
          <Text style={styles.statLabel}>High Priority</Text>
        </View>
      </View>

      {/* Productivity Card */}
      <View style={[styles.productivityCard, { marginTop: 12 }]}>
        <View style={styles.productivityLeft}>
          <View style={styles.progressRing}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: getProductivityColor(stats.productivity),
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', `${stats.productivity}%`],
                  }),
                },
              ]}
            />
          </View>
          <View style={styles.productivityInfo}>
            <Text style={styles.productivityPercent}>{stats.productivity}%</Text>
            <Text style={styles.productivityLabel}>Productivity Score</Text>
          </View>
        </View>
        <View style={styles.productivityRight}>
          <Text style={styles.productivityStat}>🔥 {stats.streak}</Text>
          <Text style={styles.productivityStatLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Secondary Stats */}
      <View style={styles.secondaryStats}>
        <View style={styles.secondaryStat}>
          <Ionicons name="checkmark-circle" size={16} color="#34C759" />
          <Text style={styles.secondaryStatText}>
            {stats.weeklyCompleted} this week
          </Text>
        </View>
        <View style={styles.secondaryStat}>
          <Ionicons name="time" size={16} color="#007AFF" />
          <Text style={styles.secondaryStatText}>
            {stats.focusMinutes}min focused
          </Text>
        </View>
        {stats.overdue > 0 && (
          <View style={[styles.secondaryStat, styles.alertStat]}>
            <Ionicons name="alert-circle" size={16} color="#FF3B30" />
            <Text style={[styles.secondaryStatText, { color: '#FF3B30' }]}>
              {stats.overdue} overdue
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};
