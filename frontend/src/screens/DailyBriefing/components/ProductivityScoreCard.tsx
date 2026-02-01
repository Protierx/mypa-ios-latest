import React from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { ScoreInfo, BriefingData, Task } from '../types';

interface ProductivityScoreCardProps {
  productivityScore: number;
  scoreInfo: ScoreInfo;
  completedTasks: Task[];
  todaysTasks: Task[];
  briefing: BriefingData;
  fadeAnim: Animated.Value;
  pulseAnim: Animated.Value;
}

export const ProductivityScoreCard: React.FC<ProductivityScoreCardProps> = ({
  productivityScore,
  scoreInfo,
  completedTasks,
  todaysTasks,
  briefing,
  fadeAnim,
  pulseAnim,
}) => {
  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <View style={styles.productivityCard}>
        <View style={styles.productivityHeader}>
          <Text style={styles.productivityTitle}>Today's Energy</Text>
          <Text style={styles.productivityEmoji}>{scoreInfo.emoji}</Text>
        </View>
        <View style={styles.productivityContent}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreNumber, { color: scoreInfo.color }]}>
              {productivityScore}
            </Text>
            <Text style={styles.scoreLabel}>{scoreInfo.label}</Text>
          </View>
          <View style={styles.scoreBreakdown}>
            <View style={styles.scoreItem}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.scoreItemText}>
                {completedTasks.length}/{todaysTasks.length} tasks done
              </Text>
            </View>
            <View style={styles.scoreItem}>
              <Ionicons name="flame" size={16} color="#FF9500" />
              <Text style={styles.scoreItemText}>
                {briefing.stats?.streak || 0} day streak
              </Text>
            </View>
            <View style={styles.scoreItem}>
              <Ionicons name="trending-up" size={16} color="#007AFF" />
              <Text style={styles.scoreItemText}>
                {briefing.stats?.weeklyCompleted || 0} this week
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};
