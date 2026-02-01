import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Task, FocusStats } from '../types';
import { formatTimer } from '../utils';
import { RING_SIZE, RING_STROKE } from '../constants';
import { styles } from '../styles';

interface FocusCardProps {
  activeTask: Task;
  elapsedSeconds: number;
  isRecording: boolean;
  focusStats: FocusStats;
  focusCardAnim: Animated.Value;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
}

export const FocusCard: React.FC<FocusCardProps> = ({
  activeTask,
  elapsedSeconds,
  isRecording,
  focusStats,
  focusCardAnim,
  onStop,
  onPause,
  onResume,
  onComplete,
}) => {
  const taskDurationSec = (activeTask.durationMin || 30) * 60;
  const progressPct = Math.min((elapsedSeconds / taskDurationSec) * 100, 100);
  const remainingSec = Math.max(taskDurationSec - elapsedSeconds, 0);
  const isOvertime = elapsedSeconds > taskDurationSec;

  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <Animated.View
      style={[
        styles.focusCardWrap,
        {
          opacity: focusCardAnim,
          transform: [
            {
              translateY: focusCardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
            {
              scale: focusCardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.98, 1],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={isOvertime ? ['#F97316', '#EF4444'] : ['#10B981', '#06B6D4']}
        style={styles.focusCard}
      >
        <View style={styles.focusHeader}>
          <View style={styles.focusStatus}>
            <View style={[styles.liveDot, isRecording ? styles.liveDotActive : styles.liveDotPaused]} />
            <Text style={styles.focusStatusText}>{isRecording ? 'Focus Session' : 'Paused'}</Text>
          </View>
          <View style={styles.focusStreak}>
            {focusStats.currentStreak > 0 && (
              <Text style={styles.focusStreakText}>🔥 {focusStats.currentStreak}</Text>
            )}
          </View>
        </View>

        <Text style={styles.focusTaskTitle} numberOfLines={1}>
          {activeTask.title}
        </Text>

        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={radius}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={radius}
              stroke="#FFFFFF"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              fill="none"
              rotation={-90}
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.ringLabel}>{isOvertime ? 'OVERTIME' : 'REMAINING'}</Text>
            <Text style={styles.ringTime}>
              {isOvertime ? '+' : ''}
              {formatTimer(isOvertime ? elapsedSeconds - taskDurationSec : remainingSec)}
            </Text>
          </View>
        </View>

        <View style={styles.timerStats}>
          <View style={styles.timerStatItem}>
            <Text style={styles.timerStatLabel}>Elapsed</Text>
            <Text style={styles.timerStatValue}>{formatTimer(elapsedSeconds)}</Text>
          </View>
          <View style={styles.timerDivider} />
          <View style={styles.timerStatItem}>
            <Text style={styles.timerStatLabel}>Target</Text>
            <Text style={styles.timerStatValue}>{activeTask.duration}</Text>
          </View>
          <View style={styles.timerDivider} />
          <View style={styles.timerStatItem}>
            <Text style={styles.timerStatLabel}>Progress</Text>
            <Text style={styles.timerStatValue}>{Math.round(progressPct)}%</Text>
          </View>
        </View>

        <View style={styles.timerControls}>
          <TouchableOpacity style={styles.timerControlBtn} onPress={onStop}>
            <Ionicons name="stop" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.timerMainBtn} onPress={isRecording ? onPause : onResume}>
            <Ionicons name={isRecording ? 'pause' : 'play'} size={26} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.timerControlBtn} onPress={onComplete}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};
