import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { UserStats } from '../types';
import { styles } from '../styles';

interface StatsBannerProps {
  userStats: UserStats;
}

export function StatsBanner({ userStats }: StatsBannerProps) {
  return (
    <View style={styles.statsBanner}>
      <View style={styles.statsRow}>
        <View style={styles.statsLeft}>
          <View style={styles.streakIconContainer}>
            <MaterialCommunityIcons name="fire" size={28} color="#FFFFFF" />
          </View>
          <View>
            <View style={styles.streakValueRow}>
              <Text style={styles.streakValue}>{userStats.currentStreak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
            <View style={styles.xpRow}>
              <Ionicons name="flash" size={14} color="#8B5CF6" />
              <Text style={styles.xpText}>{userStats.totalXP} XP</Text>
              <Text style={styles.levelText}>• Lvl {userStats.level}</Text>
            </View>
          </View>
        </View>
        <View style={styles.statsRight}>
          <View style={styles.rankInfo}>
            <View style={styles.rankRow}>
              <MaterialCommunityIcons name="crown" size={16} color="#F59E0B" />
              <Text style={styles.rankValue}>#{userStats.rank}</Text>
            </View>
            <Text style={styles.rankTotal}>of {userStats.totalMembers}</Text>
          </View>
          <View style={styles.trophyContainer}>
            <Ionicons name="trophy" size={24} color="#D97706" />
          </View>
        </View>
      </View>
      <View style={styles.xpProgressContainer}>
        <View style={styles.xpProgressLabels}>
          <Text style={styles.xpProgressLabel}>Level {userStats.level} → {userStats.level + 1}</Text>
          <Text style={styles.xpProgressValue}>{userStats.nextLevelXP - userStats.totalXP} XP to go</Text>
        </View>
        <View style={styles.xpProgressBar}>
          <View style={[styles.xpProgressFill, { width: `${(userStats.totalXP / userStats.nextLevelXP) * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}
