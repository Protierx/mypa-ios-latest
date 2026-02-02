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

  const LARGE_RING = 180;
  const LARGE_STROKE = 10;
  const radius = (LARGE_RING - LARGE_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  const getMessage = () => {
    if (isOvertime) return "Going strong! 💪";
    if (!isRecording) return "Take a breath...";
    if (progressPct < 25) return "You've got this";
    if (progressPct < 50) return "Great momentum";
    if (progressPct < 75) return "Crushing it!";
    return "Almost there!";
  };

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
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={isOvertime ? ['#7c2d12', '#c2410c', '#ea580c'] : isRecording ? ['#064e3b', '#047857', '#059669'] : ['#1e293b', '#334155', '#475569']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.focusCard}
      >
        {/* Status indicator */}
        <View style={styles.focusHeader}>
          <View style={styles.focusStatusPill}>
            <View style={[styles.liveDot, isRecording ? styles.liveDotActive : styles.liveDotPaused]} />
            <Text style={styles.focusStatusText}>{isRecording ? 'Focusing' : 'Paused'}</Text>
          </View>
          {focusStats.currentStreak > 0 && (
            <View style={styles.focusStreakPill}>
              <Text style={styles.focusStreakText}>🔥 {focusStats.currentStreak}</Text>
            </View>
          )}
        </View>

        {/* Main timer ring */}
        <View style={styles.ringWrap}>
          <Svg width={LARGE_RING} height={LARGE_RING}>
            <Circle
              cx={LARGE_RING / 2}
              cy={LARGE_RING / 2}
              r={radius}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={LARGE_STROKE}
              fill="none"
            />
            <Circle
              cx={LARGE_RING / 2}
              cy={LARGE_RING / 2}
              r={radius}
              stroke={isOvertime ? '#FBBF24' : '#FFFFFF'}
              strokeWidth={LARGE_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              fill="none"
              rotation={-90}
              origin={`${LARGE_RING / 2}, ${LARGE_RING / 2}`}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.ringTimeMain}>
              {formatTimer(isOvertime ? elapsedSeconds - taskDurationSec : remainingSec)}
            </Text>
            <Text style={styles.ringLabel}>{isOvertime ? 'overtime' : 'remaining'}</Text>
          </View>
        </View>

        {/* Task name & message */}
        <Text style={styles.focusTaskTitle} numberOfLines={1}>
          {activeTask.title}
        </Text>
        <Text style={styles.focusMessage}>{getMessage()}</Text>

        {/* Controls */}
        <View style={styles.timerControls}>
          <TouchableOpacity 
            style={styles.timerControlBtn} 
            onPress={onStop}
            accessibilityLabel="Stop session"
          >
            <Ionicons name="stop" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.timerMainBtn} 
            onPress={isRecording ? onPause : onResume}
            accessibilityLabel={isRecording ? 'Pause' : 'Resume'}
          >
            <Ionicons 
              name={isRecording ? 'pause' : 'play'} 
              size={32} 
              color="#0F172A" 
              style={!isRecording && { marginLeft: 4 }}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.timerControlBtn} 
            onPress={onComplete}
            accessibilityLabel="Complete task"
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Progress stats row */}
        <View style={styles.focusStatsRow}>
          <View style={styles.focusStatItem}>
            <Text style={styles.focusStatValue}>{formatTimer(elapsedSeconds)}</Text>
            <Text style={styles.focusStatLabel}>elapsed</Text>
          </View>
          <View style={styles.focusStatDivider} />
          <View style={styles.focusStatItem}>
            <Text style={styles.focusStatValue}>{activeTask.duration}</Text>
            <Text style={styles.focusStatLabel}>target</Text>
          </View>
          <View style={styles.focusStatDivider} />
          <View style={styles.focusStatItem}>
            <Text style={styles.focusStatValue}>{Math.round(progressPct)}%</Text>
            <Text style={styles.focusStatLabel}>done</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};
