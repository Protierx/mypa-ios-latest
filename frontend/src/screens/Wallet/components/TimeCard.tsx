import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Flame, CheckCircle2, Share2 } from 'lucide-react-native';
import { WalletData } from '../types';
import { styles } from '../styles';

interface TimeCardProps {
  wallet: WalletData;
  pulseAnim: Animated.Value;
  onStreakPress: () => void;
  onTasksPress: () => void;
  onSharePress: () => void;
}

export const TimeCard: React.FC<TimeCardProps> = ({
  wallet,
  pulseAnim,
  onStreakPress,
  onTasksPress,
  onSharePress,
}) => {
  return (
    <View style={styles.mainCardContainer}>
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mainCard}
      >
        {/* Total Time */}
        <View style={styles.mainCardHeader}>
          <View>
            <Text style={styles.totalLabel}>Total Time Saved</Text>
            <Text style={styles.totalTime}>{wallet.totalTimeSaved}</Text>
            <Text style={styles.avgLabel}>Avg {wallet.avgDaily}/day</Text>
          </View>
          <Animated.View
            style={[
              styles.clockIconContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Clock color="#fff" size={32} />
          </Animated.View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <Pressable
            onPress={onStreakPress}
            style={({ pressed }) => [
              styles.quickStatCard,
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="View your streak details"
          >
            <View style={styles.quickStatHeader}>
              <Flame color="#fb923c" size={16} />
              <Text style={styles.quickStatLabel}>Streak</Text>
            </View>
            <Text style={styles.quickStatValue}>{wallet.streak} days</Text>
          </Pressable>
          <Pressable
            onPress={onTasksPress}
            style={({ pressed }) => [
              styles.quickStatCard,
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="View your completed tasks"
          >
            <View style={styles.quickStatHeader}>
              <CheckCircle2 color="#6ee7b7" size={16} />
              <Text style={styles.quickStatLabel}>Tasks</Text>
            </View>
            <Text style={styles.quickStatValue}>{wallet.tasksCompleted}</Text>
          </Pressable>
        </View>

        {/* Share Button */}
        <Pressable
          onPress={onSharePress}
          style={({ pressed }) => [
            styles.shareButton,
            pressed && styles.shareButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Share your progress"
        >
          <Share2 color="#fff" size={16} />
          <Text style={styles.shareButtonText}>Share Progress</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
};
