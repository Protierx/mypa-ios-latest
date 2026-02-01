import React from 'react';
import { View, Text } from 'react-native';
import { UserInsights } from '../types';
import { formatMinutes } from '../utils';
import { styles } from '../styles';

interface LifetimeStatsProps {
  insights: UserInsights | null;
}

export const LifetimeStats: React.FC<LifetimeStatsProps> = ({ insights }) => {
  if (!insights?.lifetimeStats) {
    return null;
  }

  const { lifetimeStats } = insights;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Lifetime Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{lifetimeStats.tasksCompleted}</Text>
          <Text style={styles.statLabel}>Tasks Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatMinutes(lifetimeStats.focusMinutes)}
          </Text>
          <Text style={styles.statLabel}>Focus Time</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{lifetimeStats.challengesWon}</Text>
          <Text style={styles.statLabel}>Challenges Won</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{lifetimeStats.longestStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
        </View>
      </View>
    </View>
  );
};
