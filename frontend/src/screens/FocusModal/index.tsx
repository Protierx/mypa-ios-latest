/**
 * FocusModal - Full-screen focus session modal (swipe UP from AI Home)
 * 
 * From design spec:
 * - Slides up from bottom
 * - Contains timer, task selection, controls
 * - Can be dismissed by swiping down or completing
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import AIOrb from '../../components/AIOrb';
import { structuredColors as colors } from '../../styles/colors';
import { theme } from '../../styles/theme';
import { api } from '../../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.2;

interface FocusModalProps {
  visible: boolean;
  onClose: () => void;
  initialTaskId?: string;
  initialDuration?: number; // minutes
}

type FocusState = 'idle' | 'running' | 'paused' | 'completed';

const PRESET_DURATIONS = [15, 25, 45, 60]; // minutes

export function FocusModal({
  visible,
  onClose,
  initialTaskId,
  initialDuration = 25,
}: FocusModalProps) {
  const insets = useSafeAreaInsets();
  
  // State
  const [focusState, setFocusState] = useState<FocusState>('idle');
  const [selectedDuration, setSelectedDuration] = useState(initialDuration);
  const [remainingSeconds, setRemainingSeconds] = useState(initialDuration * 60);
  const [selectedTask, setSelectedTask] = useState<string | null>(initialTaskId || null);
  const [earnedXP, setEarnedXP] = useState(0);
  
  // Animation for slide in/out
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  
  // Timer interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => focusState === 'idle',
      onMoveShouldSetPanResponder: (_, gestureState) =>
        focusState === 'idle' && gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD) {
          handleClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;
  
  // Animate in when visible
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [visible]);
  
  // Timer logic
  useEffect(() => {
    if (focusState === 'running' && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [focusState]);
  
  // Reset on close
  useEffect(() => {
    if (!visible) {
      setFocusState('idle');
      setRemainingSeconds(selectedDuration * 60);
      setEarnedXP(0);
    }
  }, [visible, selectedDuration]);
  
  // Handlers
  const handleClose = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [onClose, slideAnim]);
  
  const handleStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setFocusState('running');
    
    // Start focus session API call
    api.post('/focus/start', {
      taskId: selectedTask,
      durationMinutes: selectedDuration,
    }).catch(console.log);
  }, [selectedTask, selectedDuration]);
  
  const handlePause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFocusState('paused');
  }, []);
  
  const handleResume = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFocusState('running');
  }, []);
  
  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFocusState('completed');
    
    // Calculate XP based on time completed
    const completedMinutes = selectedDuration - Math.floor(remainingSeconds / 60);
    const xp = completedMinutes * 2; // 2 XP per minute
    setEarnedXP(xp);
    
    // End focus session API call
    api.post('/focus/end', {
      taskId: selectedTask,
      completedMinutes,
      xpEarned: xp,
    }).catch(console.log);
  }, [selectedDuration, remainingSeconds, selectedTask]);
  
  const handleStop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    handleComplete();
  }, [handleComplete]);
  
  const handleDurationSelect = useCallback((duration: number) => {
    Haptics.selectionAsync();
    setSelectedDuration(duration);
    setRemainingSeconds(duration * 60);
  }, []);
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress
  const progress = 1 - remainingSeconds / (selectedDuration * 60);
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={[colors.background.surface1, colors.background.black]}
          style={styles.gradient}
        >
          {/* Pull indicator */}
          {focusState === 'idle' && (
            <View style={styles.pullIndicator}>
              <View style={styles.pullBar} />
            </View>
          )}
          
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            {focusState === 'idle' && (
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>
              {focusState === 'completed' ? 'Well Done!' : 'Focus Session'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          
          {/* Content */}
          <View style={styles.content}>
            {/* Orb or Completion State */}
            <View style={styles.orbContainer}>
              {focusState === 'completed' ? (
                <View style={styles.completionBadge}>
                  <Ionicons name="checkmark" size={64} color={colors.semantic.success} />
                </View>
              ) : (
                <AIOrb
                  state={focusState === 'running' ? 'processing' : 'idle'}
                  size="large"
                />
              )}
            </View>
            
            {/* Timer Display */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
              
              {/* Progress Ring (visual only for now) */}
              {focusState !== 'idle' && focusState !== 'completed' && (
                <View style={styles.progressInfo}>
                  <Text style={styles.progressText}>
                    {Math.round(progress * 100)}% complete
                  </Text>
                </View>
              )}
              
              {/* Earned XP */}
              {focusState === 'completed' && earnedXP > 0 && (
                <View style={styles.xpBadge}>
                  <Ionicons name="star" size={20} color={colors.brand.primary} />
                  <Text style={styles.xpText}>+{earnedXP} XP</Text>
                </View>
              )}
            </View>
            
            {/* Duration Selector (idle state only) */}
            {focusState === 'idle' && (
              <View style={styles.durationSelector}>
                <Text style={styles.durationLabel}>Duration</Text>
                <View style={styles.durationOptions}>
                  {PRESET_DURATIONS.map(duration => (
                    <TouchableOpacity
                      key={duration}
                      style={[
                        styles.durationOption,
                        selectedDuration === duration && styles.durationOptionActive,
                      ]}
                      onPress={() => handleDurationSelect(duration)}
                    >
                      <Text style={[
                        styles.durationOptionText,
                        selectedDuration === duration && styles.durationOptionTextActive,
                      ]}>
                        {duration}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={[styles.actions, { paddingBottom: insets.bottom + 32 }]}>
              {focusState === 'idle' && (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStart}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play" size={24} color={colors.text.primary} />
                  <Text style={styles.startButtonText}>Start Focus</Text>
                </TouchableOpacity>
              )}
              
              {focusState === 'running' && (
                <View style={styles.runningActions}>
                  <TouchableOpacity
                    style={styles.pauseButton}
                    onPress={handlePause}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pause" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={handleStop}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="stop" size={24} color={colors.semantic.error} />
                  </TouchableOpacity>
                </View>
              )}
              
              {focusState === 'paused' && (
                <View style={styles.runningActions}>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={handleResume}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play" size={24} color={colors.text.primary} />
                    <Text style={styles.startButtonText}>Resume</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={handleStop}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="stop" size={24} color={colors.semantic.error} />
                  </TouchableOpacity>
                </View>
              )}
              
              {focusState === 'completed' && (
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.black,
  },
  gradient: {
    flex: 1,
  },
  pullIndicator: {
    alignItems: 'center',
    paddingTop: 12,
  },
  pullBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.background.surface3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.title2.fontSize,
    fontWeight: theme.typography.title2.fontWeight as any,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  orbContainer: {
    marginTop: 32,
    marginBottom: 32,
  },
  completionBadge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.semantic.success,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerText: {
    fontSize: 72,
    fontWeight: '200',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  progressInfo: {
    marginTop: 12,
  },
  progressText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: colors.background.surface2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  xpText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  durationSelector: {
    alignItems: 'center',
    marginBottom: 48,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginBottom: 12,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  durationOption: {
    width: 64,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: colors.background.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationOptionActive: {
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  durationOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  durationOptionTextActive: {
    color: colors.brand.primary,
  },
  actions: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.brand.primary,
    paddingVertical: 18,
    borderRadius: theme.radius.lg,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  runningActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  pauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.semantic.success,
    paddingVertical: 18,
    borderRadius: theme.radius.lg,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default FocusModal;
