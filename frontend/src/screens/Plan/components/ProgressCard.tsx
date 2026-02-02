import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Coffee, Rocket, PartyPopper } from 'lucide-react-native';
import { formatDuration } from '../utils';
import { Task } from '../types';
import { styles } from '../styles';

interface ProgressCardProps {
  todayTasks: Task[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  totalMinutes: number;
  completedMinutes: number;
  onNavigateSort: () => void;
}

const getMotivation = (completed: number, total: number, hour: number) => {
  if (total === 0) return { emoji: '✨', text: "Your day is wide open" };
  if (completed === total) return { emoji: '🎉', text: "You crushed it today!" };
  
  const progress = completed / total;
  const remaining = total - completed;
  
  if (progress === 0) {
    if (hour < 12) return { emoji: '☀️', text: "Fresh start, let's go!" };
    if (hour < 17) return { emoji: '💪', text: "Ready when you are" };
    return { emoji: '🌙', text: "Still time to make moves" };
  }
  if (progress < 0.5) return { emoji: '🔥', text: `${remaining} more and you're golden` };
  if (progress < 0.75) return { emoji: '⚡', text: "You're on fire!" };
  return { emoji: '🚀', text: "Almost there, finish strong!" };
};

export const ProgressCard: React.FC<ProgressCardProps> = ({
  todayTasks,
  completedCount,
  totalCount,
  progressPercent,
  totalMinutes,
  completedMinutes,
  onNavigateSort,
}) => {
  const remainingMinutes = totalMinutes - completedMinutes;
  const allDone = completedCount === totalCount && totalCount > 0;
  const hour = new Date().getHours();
  const motivation = getMotivation(completedCount, totalCount, hour);
  
  return (
    <View style={styles.progressCardWrapper}>
      <LinearGradient
        colors={allDone ? ['#059669', '#10b981', '#34d399'] : ['#1e1b4b', '#312e81', '#4338ca']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.progressCard}
      >
        {/* Motivation Message */}
        <View style={styles.motivationRow}>
          <Text style={styles.motivationEmoji}>{motivation.emoji}</Text>
          <Text style={styles.motivationText}>{motivation.text}</Text>
        </View>
        
        {/* Big Number Focus */}
        <View style={styles.bigNumberRow}>
          <Text style={styles.bigNumber}>{completedCount}</Text>
          <Text style={styles.bigNumberSlash}>/</Text>
          <Text style={styles.bigNumberTotal}>{totalCount}</Text>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        
        {/* Time remaining */}
        {!allDone && remainingMinutes > 0 && (
          <Text style={styles.timeRemainingText}>
            {formatDuration(remainingMinutes)} of focus time left
          </Text>
        )}
      </LinearGradient>
    </View>
  );
};
