import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DailyStats } from '../types';
import { Colors } from '../constants';
import { formatMinutes } from '../utils';
import { styles } from '../styles';

interface SummaryCardsProps {
  dailyStats: DailyStats | null;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ dailyStats }) => {
  return (
    <>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            style={styles.gradientCard}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.summaryValue}>
              {dailyStats?.tasksCompleted ?? 0}
            </Text>
            <Text style={styles.summaryLabel}>Tasks Completed</Text>
          </LinearGradient>
        </View>
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={[Colors.secondary, '#818CF8']}
            style={styles.gradientCard}
          >
            <Ionicons name="time" size={24} color="#FFFFFF" />
            <Text style={styles.summaryValue}>
              {formatMinutes(dailyStats?.focusMinutes ?? 0)}
            </Text>
            <Text style={styles.summaryLabel}>Focus Time</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={[Colors.success, '#34D399']}
            style={styles.gradientCard}
          >
            <Ionicons name="star" size={24} color="#FFFFFF" />
            <Text style={styles.summaryValue}>
              {dailyStats?.xpEarned ?? 0}
            </Text>
            <Text style={styles.summaryLabel}>XP Earned</Text>
          </LinearGradient>
        </View>
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={[Colors.warning, '#FBBF24']}
            style={styles.gradientCard}
          >
            <Ionicons name="flame" size={24} color="#FFFFFF" />
            <Text style={styles.summaryValue}>{dailyStats?.streak ?? 0}</Text>
            <Text style={styles.summaryLabel}>Day Streak</Text>
          </LinearGradient>
        </View>
      </View>
    </>
  );
};
