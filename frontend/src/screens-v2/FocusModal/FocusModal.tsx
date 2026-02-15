/**
 * Focus Modal
 * 
 * Immersive focus session with timer.
 * Swipe UP from AI Hub to access.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useFocusSessions } from '../../hooks/supabase/useFocusSessions';
import { useGestureNavigation } from '../../navigation-v2/useGestureNavigation';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';
import { useVoice } from '../../contexts/VoiceContext';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius, spacing } from '../../styles/theme';

type FocusState = 'selecting' | 'active' | 'paused' | 'completed';

const DURATION_OPTIONS = [15, 25, 45, 60];

interface FocusModalProps {
  onDismiss?: () => void;
}

export function FocusModal({ onDismiss }: FocusModalProps = {}) {
  const { startSession, endSession } = useFocusSessions();
  const { goToAIHub } = useGestureNavigation();
  
  const [state, setState] = useState<FocusState>('selecting');
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // seconds
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Progress ring animation
  const progress = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Timer logic
  useEffect(() => {
    if (state === 'active' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state]);

  // Update progress animation
  useEffect(() => {
    if (state === 'active') {
      const totalSeconds = selectedDuration * 60;
      const elapsed = totalSeconds - timeRemaining;
      progress.value = withTiming(elapsed / totalSeconds, { duration: 500 });
    }
  }, [timeRemaining, state]);

  // Pulse animation when paused
  useEffect(() => {
    if (state === 'paused') {
      pulseScale.value = withRepeat(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [state]);

  const handleStart = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Start session in backend
    const session = await startSession(selectedDuration);
    if (session) {
      setSessionId(session.id);
    }
    
    setTimeRemaining(selectedDuration * 60);
    setState('active');
    progress.value = 0;
  }, [selectedDuration, startSession]);

  const handlePause = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(state === 'paused' ? 'active' : 'paused');
  }, [state]);

  const handleComplete = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // End session in backend
    if (sessionId) {
      await endSession(sessionId);
    }
    
    setState('completed');
  }, [sessionId, endSession]);

  const handleEnd = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (sessionId) {
      await endSession(sessionId);
    }
    
    // Reset and go back
    setState('selecting');
    setTimeRemaining(selectedDuration * 60);
    setSessionId(null);
    if (onDismiss) {
      onDismiss();
    } else {
      goToAIHub();
    }
  }, [sessionId, selectedDuration, endSession, goToAIHub, onDismiss]);

  const handleReset = useCallback(() => {
    setState('selecting');
    setTimeRemaining(selectedDuration * 60);
    setSessionId(null);
  }, [selectedDuration]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleEnd}
          >
            <Ionicons name="chevron-down" size={28} color={textTokens.tertiary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {state === 'selecting' ? 'Start Focus' : 'Focus Session'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          {state === 'selecting' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.selectingContainer}>
              <Text style={styles.selectLabel}>Choose duration</Text>
              <View style={styles.durationOptions}>
                {DURATION_OPTIONS.map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.durationOption,
                      selectedDuration === mins && styles.durationOptionSelected,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedDuration(mins);
                      setTimeRemaining(mins * 60);
                    }}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        selectedDuration === mins && styles.durationTextSelected,
                      ]}
                    >
                      {mins}
                    </Text>
                    <Text style={styles.durationUnit}>min</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStart}
              >
                <Ionicons name="play" size={24} color={textTokens.inverse} />
                <Text style={styles.startButtonText}>Start Focus</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {(state === 'active' || state === 'paused') && (
            <Animated.View style={[styles.timerContainer, progressStyle]}>
              {/* Timer Display */}
              <View style={styles.timerRing}>
                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                <Text style={styles.timerLabel}>
                  {state === 'paused' ? 'Paused' : 'remaining'}
                </Text>
              </View>

              {/* Controls */}
              <View style={styles.controls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handlePause}
                >
                  <Ionicons
                    name={state === 'paused' ? 'play' : 'pause'}
                    size={32}
                    color={textTokens.inverse}
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.controlButton, styles.endButton]}
                  onPress={handleEnd}
                >
                  <Ionicons name="stop" size={28} color={semantic.error} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {state === 'completed' && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.completedContainer}>
              <View style={styles.celebrationIcon}>
                <Ionicons name="checkmark-circle" size={80} color={semantic.success} />
              </View>
              <Text style={styles.completedTitle}>Great work!</Text>
              <Text style={styles.completedSubtitle}>
                You completed {selectedDuration} minutes of focused work
              </Text>
              
              <View style={styles.xpEarned}>
                <Ionicons name="star" size={20} color={semantic.warning} />
                <Text style={styles.xpText}>+{selectedDuration} XP earned</Text>
              </View>
              
              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleReset}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Mini Voice Button - Focus-specific context */}
        {(state === 'active' || state === 'paused') && (
          <MiniVoiceButton 
            position="bottom-center" 
            screenContext="focus"
            style={{ bottom: 40 }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bg.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: textTokens.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  selectingContainer: {
    alignItems: 'center',
  },
  selectLabel: {
    color: textTokens.tertiary,
    fontSize: 16,
    marginBottom: spacing.xl,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 48,
  },
  durationOption: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: bg.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: borderTokens.primary,
    ...shadows.sm,
  },
  durationOptionSelected: {
    borderColor: brand.primary,
    backgroundColor: brand.primary,
  },
  durationText: {
    color: textTokens.secondary,
    fontSize: 24,
    fontWeight: '600',
  },
  durationTextSelected: {
    color: textTokens.inverse,
  },
  durationUnit: {
    color: textTokens.tertiary,
    fontSize: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: radius.full,
    gap: 8,
    ...shadows.purple,
  },
  startButtonText: {
    color: textTokens.inverse,
    fontSize: 18,
    fontWeight: '600',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    borderColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.muted,
  },
  timerText: {
    color: textTokens.primary,
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    color: textTokens.tertiary,
    fontSize: 16,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 48,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.purple,
  },
  endButton: {
    backgroundColor: bg.card,
    borderWidth: 1,
    borderColor: borderTokens.primary,
    ...shadows.sm,
  },
  completedContainer: {
    alignItems: 'center',
  },
  celebrationIcon: {
    marginBottom: spacing.xl,
  },
  completedTitle: {
    color: textTokens.primary,
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 8,
  },
  completedSubtitle: {
    color: textTokens.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  xpEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.muted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: 8,
    marginBottom: 48,
    ...shadows.sm,
  },
  xpText: {
    color: brand.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: brand.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: radius.full,
    ...shadows.purple,
  },
  doneButtonText: {
    color: textTokens.inverse,
    fontSize: 18,
    fontWeight: '600',
  },
});
