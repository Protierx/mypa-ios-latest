import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LevelData } from '../types';
import { styles } from '../styles';

interface MainCardProps {
  levelData: LevelData;
  xpProgress: number;
  xpToNext: number;
}

export const MainCard: React.FC<MainCardProps> = ({
  levelData,
  xpProgress,
  xpToNext,
}) => {
  return (
    <View style={styles.mainCard}>
      <View style={styles.rankBadge}>
        <Ionicons name="star" size={14} color="#FFFFFF" />
        <Text style={styles.rankBadgeText}>{levelData.rank}</Text>
      </View>

      <View style={styles.levelDisplay}>
        <View style={styles.levelIconBox}>
          <Ionicons name="star" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.levelNumber}>{levelData.currentLevel}</Text>
      </View>
      <Text style={styles.levelLabel}>Level {levelData.currentLevel}</Text>

      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabelText}>
            {levelData.currentXP.toLocaleString()} XP
          </Text>
          <Text style={styles.progressLabelText}>
            {levelData.xpForNextLevel.toLocaleString()} XP
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${xpProgress}%` }]} />
        </View>
        <Text style={styles.xpToNext}>
          {xpToNext} XP to Level {levelData.currentLevel + 1}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total XP</Text>
          <Text style={styles.statValue}>
            {(levelData.totalXPEarned / 1000).toFixed(1)}K
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>This Week</Text>
          <Text style={styles.statValue}>+625</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Multiplier</Text>
          <Text style={styles.statValue}>1.5x</Text>
        </View>
      </View>
    </View>
  );
};
