import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StreakData } from '../types';
import { styles } from '../styles';

interface MainCardProps {
  streakData: StreakData;
}

export const MainCard: React.FC<MainCardProps> = ({ streakData }) => (
  <View style={styles.mainCard}>
    <View style={styles.xpBadge}>
      <Ionicons name="flash" size={14} color="#FFFFFF" />
      <Text style={styles.xpBadgeText}>{streakData.xpMultiplier}x XP Active</Text>
    </View>
    
    <View style={styles.streakDisplay}>
      <View style={styles.streakIconBox}>
        <MaterialCommunityIcons name="fire" size={40} color="#FFFFFF" />
      </View>
      <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
    </View>
    <Text style={styles.streakLabel}>Day Streak!</Text>
    
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Longest</Text>
        <Text style={styles.statValue}>{streakData.longestStreak}</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Total Days</Text>
        <Text style={styles.statValue}>{streakData.totalDaysActive}</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>To Next</Text>
        <Text style={styles.statValue}>{streakData.daysToMilestone}d</Text>
      </View>
    </View>
  </View>
);
