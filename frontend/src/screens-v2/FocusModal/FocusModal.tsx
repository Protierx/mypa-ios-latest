/**
 * Focus Modal — Opal-inspired immersive focus session
 *
 * Dark, ambient full-screen experience with:
 * - Large circular SVG progress ring
 * - Breathing ambient glow animations
 * - Minimal controls with glass-morphic styling
 * - Haptic feedback throughout
 *
 * Swipe UP from AI Hub to access.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  interpolateColor,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { useFocusSessions } from '../../hooks/supabase/useFocusSessions';
import { useGestureNavigation } from '../../navigation-v2/useGestureNavigation';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';

// ── Opal-inspired dark palette ──────────────────────────────
const OPAL = {
  // Backgrounds
  bgDeep:       '#0A0A0F',
  bgSurface:    '#12121A',
  bgCard:       'rgba(255, 255, 255, 0.06)',
  bgCardHover:  'rgba(255, 255, 255, 0.10)',

  // Gradient stops (ambient aurora)
  gradientA:    '#0A0A0F',
  gradientB:    '#1A0B2E',
  gradientC:    '#0F1B3D',
  gradientD:    '#0A0A0F',

  // Accent ring
  ringStart:    '#A78BFA',   // violet-400
  ringMid:      '#7C3AED',   // violet-600
  ringEnd:      '#4F46E5',   // indigo-600

  // Glow
  glowViolet:   'rgba(124, 58, 237, 0.35)',
  glowIndigo:   'rgba(79, 70, 229, 0.25)',
  glowSoft:     'rgba(167, 139, 250, 0.12)',

  // Text
  textPrimary:  '#F8F8FF',
  textSecondary:'#A0A0B8',
  textMuted:    '#6B6B80',
  textAccent:   '#C4B5FD',

  // Controls
  ctrlBg:       'rgba(255, 255, 255, 0.08)',
  ctrlBorder:   'rgba(255, 255, 255, 0.12)',
  ctrlActive:   'rgba(124, 58, 237, 0.4)',

  // Semantic
  success:      '#34D399',
  successGlow:  'rgba(52, 211, 153, 0.25)',
  error:        '#F87171',
  warning:      '#FBBF24',
} as const;

type FocusState = 'selecting' | 'active' | 'paused' | 'completed';

const DURATION_OPTIONS = [15, 25, 45, 60];
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Ring geometry
const RING_SIZE = Math.min(SCREEN_W * 0.72, 300);
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface FocusModalProps {
  onDismiss?: () => void;
}

// ── Progress Ring Component ─────────────────────────────────
function ProgressRing({
  progress,
  isPaused,
}: {
  progress: SharedValue<number>;
  isPaused: boolean;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <Svg
      width={RING_SIZE}
      height={RING_SIZE}
      style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
    >
      <Defs>
        <SvgLinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={OPAL.ringStart} />
          <Stop offset="50%" stopColor={OPAL.ringMid} />
          <Stop offset="100%" stopColor={OPAL.ringEnd} />
        </SvgLinearGradient>
      </Defs>

      {/* Track */}
      <Circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={RING_STROKE}
        fill="none"
      />

      {/* Progress */}
      <AnimatedCircle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        stroke="url(#ringGrad)"
        strokeWidth={RING_STROKE}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        animatedProps={animatedProps}
        opacity={isPaused ? 0.5 : 1}
      />
    </Svg>
  );
}

// ── Main Component ──────────────────────────────────────────
export function FocusModal({ onDismiss }: FocusModalProps = {}) {
  const { startSession, pauseSession, resumeSession, endSession, getTodayStats } =
    useFocusSessions();
  const { goToAIHub } = useGestureNavigation();

  const [state, setState] = useState<FocusState>('selecting');
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Animated values
  const progress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.35);
  const ambientRotate = useSharedValue(0);

  // Today's stats for the completion screen
  const todayStats = useMemo(() => getTodayStats(), [state]);

  // ── Ambient background rotation ────────────────────────
  useEffect(() => {
    ambientRotate.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // ── Timer tick ─────────────────────────────────────────
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  // ── Progress sync ──────────────────────────────────────
  useEffect(() => {
    if (state === 'active' || state === 'paused') {
      const total = selectedDuration * 60;
      const elapsed = total - timeRemaining;
      progress.value = withTiming(elapsed / total, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [timeRemaining, state]);

  // ── Breathing glow (ambient when active, pulsing when paused) ──
  useEffect(() => {
    if (state === 'paused') {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else if (state === 'active') {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.25, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      pulseScale.value = withTiming(1.0, { duration: 300 });
    } else {
      glowOpacity.value = withTiming(0.35, { duration: 500 });
      pulseScale.value = withTiming(1.0, { duration: 300 });
    }
  }, [state]);

  // ── Handlers ───────────────────────────────────────────
  const handleStart = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const session = await startSession(selectedDuration);
    if (session) setSessionId(session.id);

    setTimeRemaining(selectedDuration * 60);
    setState('active');
    progress.value = 0;
  }, [selectedDuration, startSession]);

  const handlePause = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (state === 'paused') {
      if (sessionId) await resumeSession(sessionId);
      setState('active');
    } else {
      if (sessionId) await pauseSession(sessionId);
      setState('paused');
    }
  }, [state, sessionId, pauseSession, resumeSession]);

  const handleComplete = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (sessionId) await endSession(sessionId);
    setState('completed');
  }, [sessionId, endSession]);

  const handleEnd = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionId) await endSession(sessionId);
    setState('selecting');
    setTimeRemaining(selectedDuration * 60);
    setSessionId(null);
    progress.value = 0;
    onDismiss ? onDismiss() : goToAIHub();
  }, [sessionId, selectedDuration, endSession, goToAIHub, onDismiss]);

  const handleReset = useCallback(() => {
    setState('selecting');
    setTimeRemaining(selectedDuration * 60);
    setSessionId(null);
    progress.value = 0;
  }, [selectedDuration]);

  // ── Format helpers ─────────────────────────────────────
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
  };

  // ── Animated styles ────────────────────────────────────
  const timerContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const ambientStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ambientRotate.value}deg` }],
  }));

  // Percentage for the completion celebration
  const completionPercent = useMemo(() => {
    if (state !== 'active' && state !== 'paused') return 0;
    const total = selectedDuration * 60;
    return Math.round(((total - timeRemaining) / total) * 100);
  }, [timeRemaining, selectedDuration, state]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Ambient gradient background ────────────────── */}
      <LinearGradient
        colors={[OPAL.gradientA, OPAL.gradientB, OPAL.gradientC, OPAL.gradientD]}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Rotating ambient glow orbs ─────────────────── */}
      <Animated.View style={[styles.ambientOrbs, ambientStyle]} pointerEvents="none">
        <Animated.View style={[styles.glowOrb, styles.glowOrbA, glowStyle]} />
        <Animated.View style={[styles.glowOrb, styles.glowOrbB, glowStyle]} />
      </Animated.View>

      <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
        {/* ── Header ──────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEnd}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-down" size={24} color={OPAL.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {state === 'selecting' ? 'Focus' : state === 'paused' ? 'Paused' : 'Focusing'}
          </Text>

          {/* Today's total in header */}
          <View style={styles.headerStatPill}>
            <Ionicons name="flame" size={13} color={OPAL.warning} />
            <Text style={styles.headerStatText}>
              {formatMinutes(todayStats.totalMinutes)} today
            </Text>
          </View>
        </View>

        {/* ── Main Content ────────────────────────────── */}
        <View style={styles.main}>

          {/* ─── SELECTING ─────────────────────────────── */}
          {state === 'selecting' && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.selectingContainer}>
              {/* Hero */}
              <Text style={styles.heroTitle}>Deep Work</Text>
              <Text style={styles.heroSubtitle}>
                Choose your session length and{'\n'}enter the zone
              </Text>

              {/* Duration pills */}
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map((mins, idx) => {
                  const isSelected = selectedDuration === mins;
                  return (
                    <Animated.View
                      key={mins}
                      entering={FadeInUp.delay(idx * 60).duration(350)}
                    >
                      <TouchableOpacity
                        style={[
                          styles.durationPill,
                          isSelected && styles.durationPillSelected,
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedDuration(mins);
                          setTimeRemaining(mins * 60);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.durationNumber,
                            isSelected && styles.durationNumberSelected,
                          ]}
                        >
                          {mins}
                        </Text>
                        <Text
                          style={[
                            styles.durationLabel,
                            isSelected && styles.durationLabelSelected,
                          ]}
                        >
                          min
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Start CTA */}
              <Animated.View entering={FadeInUp.delay(280).duration(400)}>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStart}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[OPAL.ringStart, OPAL.ringMid, OPAL.ringEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.startButtonGradient}
                  >
                    <Ionicons name="play" size={22} color="#fff" />
                    <Text style={styles.startButtonText}>Begin Session</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}

          {/* ─── ACTIVE / PAUSED ───────────────────────── */}
          {(state === 'active' || state === 'paused') && (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.timerSection}
            >
              {/* Ring + timer */}
              <Animated.View style={[styles.ringWrapper, timerContainerStyle]}>
                {/* Inner ambient glow */}
                <Animated.View style={[styles.ringGlow, glowStyle]} />

                {/* SVG Ring */}
                <ProgressRing progress={progress} isPaused={state === 'paused'} />

                {/* Center text */}
                <View style={styles.ringCenter}>
                  <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                  <Text style={styles.timerSubtext}>
                    {state === 'paused' ? 'paused' : `${completionPercent}% complete`}
                  </Text>
                </View>
              </Animated.View>

              {/* Controls */}
              <Animated.View
                entering={FadeInUp.delay(200).duration(350)}
                style={styles.controls}
              >
                {/* Pause / Resume */}
                <TouchableOpacity
                  style={[
                    styles.controlBtn,
                    styles.controlBtnPrimary,
                  ]}
                  onPress={handlePause}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={state === 'paused' ? 'play' : 'pause'}
                    size={28}
                    color="#fff"
                  />
                </TouchableOpacity>

                {/* End */}
                <TouchableOpacity
                  style={[styles.controlBtn, styles.controlBtnSecondary]}
                  onPress={handleEnd}
                  activeOpacity={0.8}
                >
                  <Ionicons name="stop" size={22} color={OPAL.error} />
                </TouchableOpacity>
              </Animated.View>

              {/* Subtle duration label */}
              <Text style={styles.sessionLabel}>
                {selectedDuration} minute session
              </Text>
            </Animated.View>
          )}

          {/* ─── COMPLETED ─────────────────────────────── */}
          {state === 'completed' && (
            <Animated.View
              entering={FadeIn.duration(500)}
              style={styles.completedContainer}
            >
              {/* Success glow */}
              <Animated.View
                entering={FadeIn.delay(200).duration(600)}
                style={styles.successGlow}
              />

              {/* Check icon */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(500).springify()}
                style={styles.successIcon}
              >
                <Ionicons name="checkmark" size={48} color={OPAL.success} />
              </Animated.View>

              <Animated.Text
                entering={FadeInUp.delay(250).duration(400)}
                style={styles.completedTitle}
              >
                Session Complete
              </Animated.Text>
              <Animated.Text
                entering={FadeInUp.delay(350).duration(400)}
                style={styles.completedSubtitle}
              >
                {selectedDuration} minutes of deep focus
              </Animated.Text>

              {/* Stats row */}
              <Animated.View
                entering={FadeInUp.delay(450).duration(400)}
                style={styles.statsRow}
              >
                <View style={styles.statCard}>
                  <Ionicons name="star" size={18} color={OPAL.warning} />
                  <Text style={styles.statValue}>+{selectedDuration}</Text>
                  <Text style={styles.statLabel}>XP earned</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <Ionicons name="today" size={18} color={OPAL.textAccent} />
                  <Text style={styles.statValue}>
                    {formatMinutes(todayStats.totalMinutes + selectedDuration)}
                  </Text>
                  <Text style={styles.statLabel}>today total</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <Ionicons name="layers" size={18} color={OPAL.ringStart} />
                  <Text style={styles.statValue}>{todayStats.sessionCount + 1}</Text>
                  <Text style={styles.statLabel}>sessions</Text>
                </View>
              </Animated.View>

              {/* Actions */}
              <Animated.View
                entering={FadeInUp.delay(550).duration(400)}
                style={styles.completedActions}
              >
                <TouchableOpacity
                  style={styles.againButton}
                  onPress={handleReset}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[OPAL.ringStart, OPAL.ringMid]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.againButtonGradient}
                  >
                    <Ionicons name="refresh" size={18} color="#fff" />
                    <Text style={styles.againButtonText}>Go Again</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => (onDismiss ? onDismiss() : goToAIHub())}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}
        </View>

        {/* Mini Voice Button — focus-specific context */}
        {(state === 'active' || state === 'paused') && (
          <MiniVoiceButton
            position="bottom-center"
            screenContext="focus"
            style={{ bottom: 24 }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OPAL.bgDeep,
  },
  content: {
    flex: 1,
  },

  // ── Ambient background ──────────────────────────
  ambientOrbs: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowOrbA: {
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    backgroundColor: OPAL.glowViolet,
    top: SCREEN_H * 0.12,
    left: -SCREEN_W * 0.2,
  },
  glowOrbB: {
    width: SCREEN_W * 0.7,
    height: SCREEN_W * 0.7,
    backgroundColor: OPAL.glowIndigo,
    bottom: SCREEN_H * 0.08,
    right: -SCREEN_W * 0.15,
  },

  // ── Header ──────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OPAL.ctrlBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: OPAL.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  headerStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: OPAL.ctrlBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  headerStatText: {
    color: OPAL.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Main layout ─────────────────────────────────
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // ── Selecting ───────────────────────────────────
  selectingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  heroTitle: {
    color: OPAL.textPrimary,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: OPAL.textMuted,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 44,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 44,
  },
  durationPill: {
    width: 72,
    height: 88,
    borderRadius: 20,
    backgroundColor: OPAL.bgCard,
    borderWidth: 1.5,
    borderColor: OPAL.ctrlBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationPillSelected: {
    backgroundColor: OPAL.ctrlActive,
    borderColor: OPAL.ringMid,
    shadowColor: OPAL.ringMid,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  durationNumber: {
    color: OPAL.textSecondary,
    fontSize: 26,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  durationNumberSelected: {
    color: OPAL.textPrimary,
  },
  durationLabel: {
    color: OPAL.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  durationLabelSelected: {
    color: OPAL.textAccent,
  },
  startButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: OPAL.ringMid,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 36,
    paddingVertical: 16,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Timer (active / paused) ─────────────────────
  timerSection: {
    alignItems: 'center',
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringGlow: {
    position: 'absolute',
    width: RING_SIZE * 0.85,
    height: RING_SIZE * 0.85,
    borderRadius: RING_SIZE,
    backgroundColor: OPAL.glowViolet,
  },
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: OPAL.textPrimary,
    fontSize: 56,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timerSubtext: {
    color: OPAL.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  controls: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 48,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnPrimary: {
    backgroundColor: OPAL.ctrlActive,
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    shadowColor: OPAL.ringMid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  controlBtnSecondary: {
    backgroundColor: OPAL.ctrlBg,
    borderWidth: 1,
    borderColor: OPAL.ctrlBorder,
  },
  sessionLabel: {
    color: OPAL.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 32,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Completed ───────────────────────────────────
  completedContainer: {
    alignItems: 'center',
    width: '100%',
  },
  successGlow: {
    position: 'absolute',
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: OPAL.successGlow,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completedTitle: {
    color: OPAL.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  completedSubtitle: {
    color: OPAL.textMuted,
    fontSize: 16,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OPAL.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: OPAL.ctrlBorder,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 36,
    width: '100%',
    maxWidth: 340,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: OPAL.ctrlBorder,
  },
  statValue: {
    color: OPAL.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: OPAL.textMuted,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  completedActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  againButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: OPAL.ringMid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  againButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  againButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  doneButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: OPAL.ctrlBg,
    borderWidth: 1,
    borderColor: OPAL.ctrlBorder,
  },
  doneButtonText: {
    color: OPAL.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
