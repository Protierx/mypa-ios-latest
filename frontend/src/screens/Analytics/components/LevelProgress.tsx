import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserInsights } from '../types';
import { Colors } from '../constants';
import { styles } from '../styles';

interface LevelProgressProps {
  insights: UserInsights | null;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ insights }) => {
  if (!insights) {
    return null;
  }

  const progress =
    (insights.totalXp / (insights.totalXp + insights.xpToNextLevel)) * 100;

  return (
    <View style={styles.card}>
      <View style={styles.levelHeader}>
        <Text style={styles.cardTitle}>Level {insights.currentLevel}</Text>
        <Text style={styles.xpText}>
          {insights.totalXp.toLocaleString()} XP
        </Text>
      </View>
      <View style={styles.progressBarBackground}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBar, { width: `${progress}%` }]}
        />
      </View>
      <Text style={styles.progressText}>
        {insights.xpToNextLevel.toLocaleString()} XP to Level{' '}
        {insights.currentLevel + 1}
      </Text>
    </View>
  );
};
