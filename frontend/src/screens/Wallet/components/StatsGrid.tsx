import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Clock, Zap, TrendingUp } from 'lucide-react-native';
import { PeriodStats } from '../types';
import { styles } from '../styles';

interface StatsGridProps {
  stats: PeriodStats;
  onTimeSavedPress: () => void;
  onTasksPress: () => void;
  onEfficiencyPress: () => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  onTimeSavedPress,
  onTasksPress,
  onEfficiencyPress,
}) => {
  return (
    <View style={styles.statsGrid}>
      <Pressable
        onPress={onTimeSavedPress}
        style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.8 }]}
      >
        <BlurView intensity={40} tint="light" style={styles.statCardBlur}>
          <View style={[styles.statIconContainer, { backgroundColor: '#ecfdf5' }]}>
            <Clock color="#059669" size={20} />
          </View>
          <Text style={styles.statValue}>{stats.saved}</Text>
          <Text style={styles.statLabel}>Time Saved</Text>
        </BlurView>
      </Pressable>
      
      <Pressable
        onPress={onTasksPress}
        style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.8 }]}
      >
        <BlurView intensity={40} tint="light" style={styles.statCardBlur}>
          <View style={[styles.statIconContainer, { backgroundColor: '#f5f3ff' }]}>
            <Zap color="#7c3aed" size={20} />
          </View>
          <Text style={styles.statValue}>{stats.tasks}</Text>
          <Text style={styles.statLabel}>Tasks Done</Text>
        </BlurView>
      </Pressable>
      
      <Pressable
        onPress={onEfficiencyPress}
        style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.8 }]}
      >
        <BlurView intensity={40} tint="light" style={styles.statCardBlur}>
          <View style={[styles.statIconContainer, { backgroundColor: '#fffbeb' }]}>
            <TrendingUp color="#d97706" size={20} />
          </View>
          <Text style={styles.statValue}>{stats.efficiency}%</Text>
          <Text style={styles.statLabel}>Efficiency</Text>
        </BlurView>
      </Pressable>
    </View>
  );
};
