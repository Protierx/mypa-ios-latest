/**
 * App Tour — First-login walkthrough overlay
 *
 * Shown once after onboarding completes. Teaches the user:
 *  1. Swipe Left → Tasks
 *  2. Swipe Right → Social
 *  3. Swipe Up → Focus Session
 *  4. Swipe Down → Profile
 *  5. The Voice Orb (center button)
 *  6. Quick Actions bar
 *
 * Persisted via AsyncStorage so it only shows once.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TOUR_COMPLETED_KEY = '@mypa_app_tour_completed';

interface TourStep {
  id: string;
  icon: string;
  title: string;
  description: string;
  gesture?: {
    type: 'swipe' | 'tap' | 'info';
    direction?: 'left' | 'right' | 'up' | 'down';
  };
  color: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome_tour',
    icon: 'hand-right',
    title: 'Welcome to MYPA',
    description: 'Let me show you around.\nNavigate with simple swipe gestures.',
    gesture: { type: 'info' },
    color: '#4AADA1',
  },
  {
    id: 'swipe_left',
    icon: 'arrow-back',
    title: 'Swipe Left → Tasks',
    description: 'View and manage all your tasks,\nschedules, and to-do lists.',
    gesture: { type: 'swipe', direction: 'left' },
    color: '#6366F1',
  },
  {
    id: 'swipe_right',
    icon: 'arrow-forward',
    title: 'Swipe Right → Social',
    description: 'Join circles, share goals,\nand challenge your friends.',
    gesture: { type: 'swipe', direction: 'right' },
    color: '#8EAAD8',
  },
  {
    id: 'swipe_up',
    icon: 'arrow-up',
    title: 'Swipe Up → Focus',
    description: 'Start a deep focus session.\nBlock distractions, track time.',
    gesture: { type: 'swipe', direction: 'up' },
    color: '#10B981',
  },
  {
    id: 'swipe_down',
    icon: 'arrow-down',
    title: 'Swipe Down → Profile',
    description: 'Your stats, streaks, settings\nand account info.',
    gesture: { type: 'swipe', direction: 'down' },
    color: '#F59E0B',
  },
  {
    id: 'voice_orb',
    icon: 'mic',
    title: 'The Voice Orb',
    description: 'Tap the center orb to talk to MYPA.\nCreate tasks, ask questions, anything.',
    gesture: { type: 'tap' },
    color: '#4AADA1',
  },
  {
    id: 'quick_actions',
    icon: 'flash',
    title: 'Quick Actions',
    description: 'Use the bottom pills for one-tap\nactions like focus, tasks & more.',
    gesture: { type: 'info' },
    color: '#6366F1',
  },
];

interface AppTourProps {
  onComplete: () => void;
}

export function AppTour({ onComplete }: AppTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  // Gesture animation
  const gestureAnim = useSharedValue(0);

  useEffect(() => {
    if (step.gesture?.type === 'swipe') {
      gestureAnim.value = 0;
      gestureAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else if (step.gesture?.type === 'tap') {
      gestureAnim.value = 0;
      gestureAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }
  }, [currentStep]);

  const gestureAnimStyle = useAnimatedStyle(() => {
    if (step.gesture?.type === 'swipe') {
      const dist = 40;
      switch (step.gesture.direction) {
        case 'left':
          return { transform: [{ translateX: -gestureAnim.value * dist }] };
        case 'right':
          return { transform: [{ translateX: gestureAnim.value * dist }] };
        case 'up':
          return { transform: [{ translateY: -gestureAnim.value * dist }] };
        case 'down':
          return { transform: [{ translateY: gestureAnim.value * dist }] };
      }
    }
    if (step.gesture?.type === 'tap') {
      return { transform: [{ scale: 1 - gestureAnim.value * 0.15 }] };
    }
    return {};
  });

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      AsyncStorage.setItem(TOUR_COMPLETED_KEY, 'true').catch(() => {});
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLast, onComplete]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    AsyncStorage.setItem(TOUR_COMPLETED_KEY, 'true').catch(() => {});
    onComplete();
  }, [onComplete]);

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" />

      {/* Background with subtle gradient */}
      <LinearGradient
        colors={['rgba(8,8,26,0.97)', 'rgba(8,8,26,0.99)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient glow */}
      <Animated.View
        entering={FadeIn.duration(1500)}
        style={[
          styles.ambientGlow,
          { backgroundColor: step.color, opacity: 0.06 },
        ]}
      />

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipBtnText}>Skip Tour</Text>
        </TouchableOpacity>
      )}

      {/* Progress */}
      <View style={styles.progressRow}>
        {TOUR_STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i === currentStep && [styles.progressDotActive, { backgroundColor: step.color }],
              i < currentStep && styles.progressDotDone,
            ]}
          />
        ))}
      </View>

      {/* Tour content */}
      <Animated.View
        key={step.id}
        entering={SlideInRight.duration(350)}
        style={styles.contentContainer}
      >
        {/* Gesture demo area */}
        <View style={styles.demoArea}>
          {/* The animated gesture indicator */}
          <Animated.View style={[styles.gestureCircle, gestureAnimStyle]}>
            <LinearGradient
              colors={[step.color, adjustColor(step.color, -20)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gestureCircleInner}
            >
              <Ionicons name={step.icon as any} size={36} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          {/* Direction arrows for swipe gestures */}
          {step.gesture?.type === 'swipe' && (
            <View style={styles.swipeTrail}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  entering={FadeIn.duration(300).delay(i * 150)}
                  style={[
                    styles.trailDot,
                    { backgroundColor: step.color, opacity: 0.3 - i * 0.08 },
                    getTrailPosition(step.gesture!.direction!, i),
                  ]}
                />
              ))}
            </View>
          )}

          {/* Tap ring for voice orb */}
          {step.gesture?.type === 'tap' && (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={[styles.tapRing, { borderColor: step.color }]}
            />
          )}
        </View>

        {/* Text content */}
        <Animated.Text entering={FadeInDown.duration(400).delay(150)} style={styles.title}>
          {step.title}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(400).delay(300)} style={styles.description}>
          {step.description}
        </Animated.Text>

        {/* Step counter */}
        <Animated.Text entering={FadeIn.duration(300).delay(400)} style={styles.stepCounter}>
          {currentStep + 1} of {TOUR_STEPS.length}
        </Animated.Text>
      </Animated.View>

      {/* Bottom action */}
      <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.bottomAction}>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={[step.color, adjustColor(step.color, -15)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>{isLast ? "Let's Go!" : 'Next'}</Text>
            <Ionicons
              name={isLast ? 'rocket' : 'arrow-forward'}
              size={20}
              color="#FFFFFF"
              style={{ marginLeft: 8 }}
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// Check if tour should show
export async function shouldShowAppTour(): Promise<boolean> {
  try {
    const completed = await AsyncStorage.getItem(TOUR_COMPLETED_KEY);
    return completed !== 'true';
  } catch {
    return true;
  }
}

// ── Helpers ──

function adjustColor(hex: string, amount: number): string {
  // Simple hex color adjustment
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function getTrailPosition(direction: string, index: number): object {
  const spacing = 20 + index * 14;
  switch (direction) {
    case 'left':
      return { position: 'absolute' as const, right: -spacing - 30, top: '50%' as unknown as number, marginTop: -4 };
    case 'right':
      return { position: 'absolute' as const, left: -spacing - 30, top: '50%' as unknown as number, marginTop: -4 };
    case 'up':
      return { position: 'absolute' as const, bottom: -spacing - 30, left: '50%' as unknown as number, marginLeft: -4 };
    case 'down':
      return { position: 'absolute' as const, top: -spacing - 30, left: '50%' as unknown as number, marginLeft: -4 };
    default:
      return {};
  }
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ambientGlow: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    top: SCREEN_HEIGHT * 0.15,
    alignSelf: 'center',
  },

  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
  },

  progressRow: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressDotActive: {
    width: 22,
    borderRadius: 3,
  },
  progressDotDone: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  // Gesture demo
  demoArea: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  gestureCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gestureCircleInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4AADA1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  swipeTrail: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tapRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    opacity: 0.25,
  },

  // Text
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  stepCounter: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '500',
  },

  // Bottom
  bottomAction: {
    position: 'absolute',
    bottom: 60,
    left: 40,
    right: 40,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
