/**
 * StatCard Component
 * Displays streak and level statistics
 */
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Star } from 'lucide-react-native';

interface StreakCardProps {
  streak: number;
  onPress: () => void;
}

interface LevelCardProps {
  level: number;
  xpToNext: number;
  onPress: () => void;
}

export function StreakCard({ streak, onPress }: StreakCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        styles.streakCard,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${streak} day streak, 1.5x XP boost active`}
      accessibilityHint="View your streak details and history"
    >
      <LinearGradient
        colors={['#f97316', '#f59e0b']}
        style={styles.statIcon}
      >
        <Flame color="#fff" size={20} />
      </LinearGradient>
      <View>
        <Text style={styles.statValue}>{streak} days</Text>
        <Text style={styles.streakBoost}>1.5x XP boost</Text>
      </View>
    </Pressable>
  );
}

export function LevelCard({ level, xpToNext, onPress }: LevelCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        styles.levelCard,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Level ${level}, ${xpToNext > 0 ? xpToNext : 0} XP to next level`}
      accessibilityHint="View your level progression and rewards"
    >
      <LinearGradient
        colors={['#8b5cf6', '#9333ea']}
        style={styles.statIcon}
      >
        <Star color="#fff" size={20} />
      </LinearGradient>
      <View>
        <Text style={styles.statValue}>Level {level}</Text>
        <Text style={styles.levelXp}>{xpToNext > 0 ? xpToNext : 0} XP to next</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
  },
  streakCard: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.3)',
  },
  levelCard: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  streakBoost: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ea580c',
  },
  levelXp: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7c3aed',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
});
