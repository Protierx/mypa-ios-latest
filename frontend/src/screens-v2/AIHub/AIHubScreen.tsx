/**
 * AI Hub Screen — Premium Light Glassmorphic Design
 *
 * Clean, minimal AI interface inspired by Apple Weather, Notion Calendar,
 * and Arc browser. Light gradient background with frosted glass cards.
 * Voice interaction zone floats in the center with smooth state transitions.
 *
 * Features:
 * - Soft animated gradient background (white → lavender → blue, time-of-day tint)
 * - Frosted glass briefing card (collapsible)
 * - Clean mic icon with breathing animation (idle) / waveform (listening)
 * - Quick action pill chips + ambient stats bar
 * - Text input fallback for offline / discreet mode
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, TextInput, Keyboard, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { VoiceState } from '../../components/LivingBackground';
import { VoicePermissions, useVoicePermissions } from '../../components/VoicePermissions';
import { NotificationsModal } from '../modals/NotificationsModal';
import { useVoice } from '../../contexts/VoiceContext';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useUserModel } from '../../contexts/UserModelContext';
import { useTasks } from '../../hooks/supabase/useTasks';
import { useDailyBriefing } from '../../hooks/useDailyBriefing';
import { eventLogger } from '../../services/eventLogger';
import { getLevelFromDays } from '../../components/LockedFeature';
import { bg, brand, text as textTokens, border as borderTokens, semantic, lightAurora } from '../../styles/colors';
import { shadows, spacing, radius } from '../../styles/theme';
import supabaseApi from '../../services/supabaseApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AIHubScreenProps {
  voiceState?: VoiceState;
  audioLevel?: number;
}

// Approximate TTS speed: ~150 chars/second
const TTS_CHARS_PER_SEC = 150;

/** Returns time-of-day gradient colours for the background */
function getTimeOfDayGradient(): [string, string, string] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    // Morning: warm peach tint
    return [lightAurora.white, lightAurora.peach, lightAurora.lavender];
  } else if (hour >= 12 && hour < 17) {
    // Afternoon: neutral white
    return [lightAurora.white, '#F8F8FA', lightAurora.blue];
  } else {
    // Evening / Night: soft lavender
    return [lightAurora.white, lightAurora.lavender, lightAurora.blue];
  }
}

export function AIHubScreen({ voiceState: externalVoiceState, audioLevel: externalAudioLevel }: AIHubScreenProps) {
  const { user } = useSupabaseAuth();
  const { stats } = useUserModel();
  const { tasks } = useTasks('today');

  // Compute current unlock level from days active
  const currentLevel = getLevelFromDays(stats?.daysActive ?? 0);
  
  // Voice integration
  const voice = useVoice();
  const { 
    permissionStatus, 
    showPermissionModal, 
    requestPermissionIfNeeded, 
    hideModal,
    setShowPermissionModal 
  } = useVoicePermissions();
  
  // Use voice context state if available, otherwise fallback to props/local state
  const voiceState = voice.voiceState || externalVoiceState || 'idle';
  const audioLevel = voice.audioLevel || externalAudioLevel || 0;
  
  const [greeting, setGreeting] = useState('');
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const textInputRef = useRef<TextInput>(null);

  // ---- Daily Briefing (PRD R2) ----
  const {
    shouldBrief,
    briefText,
    isLoading: isBriefingLoading,
    error: briefingError,
    retry: retryBriefing,
    markBriefingPlayed,
  } = useDailyBriefing(user?.id);

  // Track whether we're currently in briefing playback
  const [isBriefingPlaying, setIsBriefingPlaying] = useState(false);
  // Keep briefing text visible after playback until user starts a new interaction
  const [showBriefingText, setShowBriefingText] = useState(false);
  // When true, briefing card collapses into a pill button
  const [isBriefingCollapsed, setIsBriefingCollapsed] = useState(false);
  // Track briefing start time for progress estimation
  const briefingStartTimeRef = useRef<number>(0);
  // Estimated duration in ms
  const briefingDurationRef = useRef<number>(0);
  // Progress tracking timeouts
  const progressTimersRef = useRef<NodeJS.Timeout[]>([]);
  // Guard: only auto-play once per mount
  const briefingTriggeredRef = useRef(false);

  // ---- State Icon Pulse Animation ----
  const iconScale = useSharedValue(1);
  const iconOpacity = useSharedValue(0.7);

  // Background gradient colours (time-of-day)
  const gradientColors = getTimeOfDayGradient();

  // Get today's date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Get time-based greeting
  const getTimeGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Hey there';
  };

  // Fetch AI greeting on mount
  useEffect(() => {
    const fetchGreeting = async () => {
      if (!user) return;
      
      setIsLoadingGreeting(true);
      try {
        const result = await supabaseApi.getGreeting();
        if (result?.greeting) {
          setGreeting(result.greeting);
        }
      } catch (error) {
        console.log('Using default greeting');
      } finally {
        setIsLoadingGreeting(false);
      }
    };

    fetchGreeting();
  }, [user]);

  // ---- State Icon Breathing Animation ----
  useEffect(() => {
    if (voiceState === 'idle' && !isBriefingPlaying) {
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        ), -1,
      );
      iconOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        ), -1,
      );
    } else if (voiceState === 'listening') {
      iconScale.value = withSpring(1.15 + audioLevel * 0.2, { damping: 12, stiffness: 100 });
      iconOpacity.value = withTiming(1, { duration: 150 });
    } else if (voiceState === 'processing') {
      iconScale.value = withRepeat(
        withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true,
      );
      iconOpacity.value = withTiming(0.9, { duration: 300 });
    } else if (voiceState === 'speaking') {
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 350, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.02, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        ), -1,
      );
      iconOpacity.value = withTiming(1, { duration: 200 });
    } else if (voiceState === 'error') {
      iconScale.value = withRepeat(
        withTiming(1.08, { duration: 350, easing: Easing.inOut(Easing.ease) }), 6, true,
      );
      iconOpacity.value = withTiming(0.9, { duration: 200 });
    } else {
      // timeout / offline — subdued
      iconScale.value = withTiming(1, { duration: 400 });
      iconOpacity.value = withTiming(0.5, { duration: 400 });
    }
  }, [voiceState, audioLevel, isBriefingPlaying]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));

  // ---- Auto-play briefing when ready (PRD R2.1) ----
  useEffect(() => {
    if (
      shouldBrief &&
      briefText &&
      voiceState === 'idle' &&
      !briefingTriggeredRef.current
    ) {
      briefingTriggeredRef.current = true;

      const estimatedDurationMs = (briefText.length / TTS_CHARS_PER_SEC) * 1000;
      briefingDurationRef.current = estimatedDurationMs;
      briefingStartTimeRef.current = Date.now();

      // Show text on screen (UI fallback)
      setShowBriefingText(true);
      setIsBriefingPlaying(true);

      // Log briefing_started (PRD R2.5)
      eventLogger.logBriefingStarted(briefText.length);

      // Start TTS
      voice.speak(briefText);

      // Set up progress tracking timeouts (25%, 50%)
      const timers: NodeJS.Timeout[] = [];
      timers.push(
        setTimeout(() => {
          eventLogger.logBriefingProgress(25);
        }, estimatedDurationMs * 0.25),
      );
      timers.push(
        setTimeout(() => {
          eventLogger.logBriefingProgress(50);
        }, estimatedDurationMs * 0.5),
      );
      progressTimersRef.current = timers;
    }
  }, [shouldBrief, briefText, voiceState, voice]);

  // ---- Detect TTS completion → log 100% and mark played ----
  useEffect(() => {
    if (isBriefingPlaying && voiceState === 'idle') {
      // Guard: only consider TTS done if at least 2 seconds have elapsed
      const elapsed = Date.now() - briefingStartTimeRef.current;
      if (elapsed < 2000) return;

      // TTS finished naturally — collapse briefing into pill
      setIsBriefingPlaying(false);
      setIsBriefingCollapsed(true);

      // Clear progress timers
      progressTimersRef.current.forEach(clearTimeout);
      progressTimersRef.current = [];

      // Log 100% completion (PRD R2.5)
      eventLogger.logBriefingProgress(100);
      markBriefingPlayed();
    }
  }, [isBriefingPlaying, voiceState, markBriefingPlayed]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      progressTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // ---- Helper: estimate current briefing progress % ----
  const estimateBriefingProgress = useCallback((): number => {
    if (briefingStartTimeRef.current === 0 || briefingDurationRef.current === 0) return 0;
    const elapsed = Date.now() - briefingStartTimeRef.current;
    return Math.min(Math.round((elapsed / briefingDurationRef.current) * 100), 100);
  }, []);

  // Handle tap in discreet mode: focus text input instead of starting voice
  const handleTapForDiscreetMode = useCallback(() => {
    textInputRef.current?.focus();
  }, []);

  // Tap handler for voice activation + briefing barge-in
  const handleTap = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Discreet mode: focus text input
    if (voice.isDiscreetMode && voiceState === 'idle') {
      handleTapForDiscreetMode();
      return;
    }

    // ── Barge-in: tap during SPEAKING → stop TTS, go to LISTENING (PRD 4.1) ────
    if (voiceState === 'speaking') {
      if (isBriefingPlaying) {
        setIsBriefingPlaying(false);
        setIsBriefingCollapsed(true);
        progressTimersRef.current.forEach(clearTimeout);
        progressTimersRef.current = [];
        const progress = estimateBriefingProgress();
        eventLogger.logBriefingSkipped(progress);
        markBriefingPlayed();
      }
      await voice.bargeIn();
      return;
    }

    // Tap during TIMEOUT or ERROR → retry listening
    if (voiceState === 'timeout' || voiceState === 'error') {
      try {
        await voice.startListening();
      } catch (error) {
        console.error('Failed to retry listening:', error);
      }
      return;
    }

    // Tap during OFFLINE → focus text input
    if (voiceState === 'offline') {
      textInputRef.current?.focus();
      return;
    }

    if (voiceState === 'idle') {
      setShowBriefingText(false);
      setIsBriefingCollapsed(false);
      if (permissionStatus !== 'granted') {
        const hasPermission = await requestPermissionIfNeeded();
        if (!hasPermission) return;
      }
      try {
        await voice.startListening();
      } catch (error) {
        console.error('Failed to start listening:', error);
        if (String(error).includes('permission')) {
          setShowPermissionModal(true);
        }
      }
    } else if (voiceState === 'listening') {
      try {
        await voice.stopListening();
      } catch (error) {
        console.error('Failed to stop listening:', error);
      }
    } else if (voiceState === 'processing') {
      voice.endConversation();
    }
  }, [
    voiceState, voice, isBriefingPlaying, permissionStatus,
    requestPermissionIfNeeded, setShowPermissionModal,
    estimateBriefingProgress, markBriefingPlayed, handleTapForDiscreetMode,
  ]);

  // Handle permission granted callback
  const handlePermissionGranted = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await voice.startListening();
    } catch (error) {
      console.error('Failed to start listening after permission:', error);
    }
  }, [voice]);

  // Handle permission denied callback
  const handlePermissionDenied = useCallback(() => {
    console.log('Voice permission denied by user');
  }, []);

  // Calculate task stats
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  const displayName = user?.name || user?.profile?.display_name || 'there';
  const displayGreeting = greeting || `${getTimeGreeting()}, ${displayName}`;

  // Get state-specific hint text
  const getHintText = () => {
    if (isBriefingPlaying) return 'Tap to skip briefing';
    if (voice.isDiscreetMode) return 'Type your request below';
    if (voiceState === 'listening') return 'Listening... tap to send';
    if (voiceState === 'processing') return 'Thinking...';
    if (voiceState === 'speaking') return 'Speak or tap to interrupt';
    if (voiceState === 'timeout') return "Didn't catch that. Tap to retry.";
    if (voiceState === 'error') return 'Something went wrong. Tap to retry.';
    if (voiceState === 'offline') return 'No connection. Type below.';
    if (isBriefingLoading) return 'Preparing briefing... tap to talk';
    return 'Tap to talk to MYPA';
  };

  // Get icon based on state
  const getStateIcon = (): keyof typeof Ionicons.glyphMap => {
    if (voice.isDiscreetMode) return 'text-outline';
    if (voiceState === 'listening') return 'mic';
    if (voiceState === 'processing') return 'sparkles';
    if (voiceState === 'speaking') return 'volume-high';
    if (voiceState === 'timeout') return 'timer-outline';
    if (voiceState === 'error') return 'warning-outline';
    if (voiceState === 'offline') return 'cloud-offline-outline';
    return 'mic-outline';
  };

  // Whether to show the text input bar
  const showTextInput = voice.isDiscreetMode || voiceState === 'offline' || voiceState === 'error';

  // Handle text submission
  const handleTextSubmit = useCallback(async () => {
    const text = textInputValue.trim();
    if (!text) return;
    setTextInputValue('');
    Keyboard.dismiss();
    await voice.submitText(text);
  }, [textInputValue, voice]);

  // Determine if we should show voice active state
  const isVoiceActive = voiceState !== 'idle' && !voice.isDiscreetMode;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Soft gradient background — time-of-day tinted */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* SafeAreaView wraps everything for proper insets */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Tap Area - entire screen */}
        <Pressable style={styles.tapArea} onPress={handleTap}>

          {/* ──── Top Section: Greeting & Date ──── */}
          <View style={styles.topSection}>
            <View style={styles.headerRow}>
              <View style={styles.greetingContainer}>
                <Animated.Text
                  entering={FadeInDown.duration(600).delay(100)}
                  style={styles.greetingText}
                >
                  {displayGreeting}
                </Animated.Text>
                <Animated.Text
                  entering={FadeInDown.duration(600).delay(200)}
                  style={styles.dateText}
                >
                  {dateString}
                </Animated.Text>
              </View>
              
              {/* Notification Bell */}
              <Pressable
                style={styles.notificationButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowNotifications(true);
                }}
              >
                <View style={styles.notificationCircle}>
                  <Ionicons name="notifications-outline" size={20} color={textTokens.secondary} />
                </View>
              </Pressable>
            </View>

            {/* ──── Smart Briefing Card (collapsed pill) ──── */}
            {isBriefingCollapsed && briefText && !isVoiceActive && (
              <Animated.View
                entering={SlideInDown.duration(400).springify().damping(18)}
                exiting={SlideOutUp.duration(250)}
              >
                <Pressable
                  style={styles.briefingPill}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsBriefingCollapsed(false);
                    setShowBriefingText(true);
                  }}
                >
                  <Text style={styles.briefingPillText} numberOfLines={1}>
                    {pendingTasks} task{pendingTasks !== 1 ? 's' : ''} today
                    {(user?.currentStreak ?? 0) > 0 ? ` • ${user?.currentStreak}-day streak 🔥` : ''}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={textTokens.tertiary} />
                </Pressable>
              </Animated.View>
            )}
          </View>

          {/* ──── Center Section: Voice Interaction Zone ──── */}
          <View style={styles.centerSection}>
            {/* Briefing content — frosted glass card (expanded state) */}
            {(showBriefingText && !isBriefingCollapsed && briefText && !isVoiceActive) ? (
              <Animated.View 
                entering={FadeIn.duration(400)}
                exiting={FadeOut.duration(300)}
                style={styles.briefingContainer}
              >
                <ScrollView 
                  style={styles.briefingScroll}
                  contentContainerStyle={styles.briefingScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <BlurView intensity={20} tint="light" style={styles.briefingCard}>
                    <View style={styles.briefingHeader}>
                      <Text style={styles.briefingEmoji}>📋</Text>
                      <Text style={styles.briefingTitle}>Daily Briefing</Text>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation?.();
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setIsBriefingCollapsed(true);
                        }}
                        hitSlop={12}
                      >
                        <Ionicons name="chevron-up" size={18} color={textTokens.tertiary} />
                      </Pressable>
                    </View>
                    <Text style={styles.briefingText}>{briefText}</Text>
                  </BlurView>
                </ScrollView>
                <Text style={styles.briefingHint}>
                  {isBriefingPlaying ? 'Listening to your briefing… tap to skip' : 'Tap anywhere to start talking'}
                </Text>
              </Animated.View>
            ) : isVoiceActive ? (
              /* ── Voice-active: inline transcript + AI response ── */
              <Animated.View
                entering={FadeIn.duration(250)}
                exiting={FadeOut.duration(200)}
                style={styles.voiceActiveContainer}
              >
                {/* State icon */}
                <Animated.View style={[styles.stateIconContainer, iconAnimStyle]}>
                  <View style={[
                    styles.iconRing,
                    voiceState === 'error' && { borderColor: semantic.error },
                  ]}>
                    <Ionicons
                      name={getStateIcon()}
                      size={32}
                      color={voiceState === 'error' ? semantic.error : brand.primary}
                    />
                  </View>
                </Animated.View>

                {/* Listening waveform bars */}
                {voiceState === 'listening' && (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.waveformRow}>
                    {Array.from({ length: 16 }).map((_, i) => {
                      const baseH = 4 + audioLevel * 28;
                      const variation = Math.sin(i * 0.7 + Date.now() * 0.003) * 6;
                      return (
                        <View
                          key={i}
                          style={[
                            styles.waveBar,
                            { height: Math.max(3, baseH + variation) },
                          ]}
                        />
                      );
                    })}
                  </Animated.View>
                )}

                {/* Processing indicator */}
                {voiceState === 'processing' && (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.processingRow}>
                    <Text style={styles.processingText}>Thinking…</Text>
                  </Animated.View>
                )}

                {/* Transcript / AI response text */}
                <View style={styles.voiceTextContainer}>
                  {voiceState === 'listening' && voice.transcript ? (
                    <Text style={styles.transcriptText}>{voice.transcript}</Text>
                  ) : voiceState === 'listening' ? (
                    <Text style={styles.listeningHint}>Listening…</Text>
                  ) : null}

                  {voiceState === 'processing' && voice.transcript ? (
                    <Text style={styles.transcriptText}>"{voice.transcript}"</Text>
                  ) : null}

                  {voiceState === 'speaking' && voice.aiResponse ? (
                    <BlurView intensity={15} tint="light" style={styles.aiResponseCard}>
                      <Ionicons name="sparkles" size={16} color={brand.primary} style={{ marginBottom: 6 }} />
                      <Text style={styles.aiResponseText}>{voice.aiResponse}</Text>
                    </BlurView>
                  ) : null}

                  {voiceState === 'timeout' && (
                    <Text style={styles.aiResponseTextPlain}>
                      {voice.aiResponse || "I didn't catch that. Tap to try again."}
                    </Text>
                  )}

                  {voiceState === 'error' && (
                    <Text style={styles.aiResponseTextPlain}>
                      {voice.aiResponse || "I'm having trouble. Please try again."}
                    </Text>
                  )}

                  {voiceState === 'offline' && (
                    <Text style={styles.aiResponseTextPlain}>
                      No network connection. Type your request instead.
                    </Text>
                  )}
                </View>

                {/* Footer hint */}
                <Text style={styles.voiceFooterHint}>
                  {voiceState === 'listening'
                    ? voice.isConversationActive ? 'Speak naturally • tap to end' : 'Tap anywhere to send'
                    : voiceState === 'speaking'
                    ? voice.isConversationActive ? 'Speak to interrupt • tap to end' : 'Speak or tap to stop'
                    : voiceState === 'timeout' ? 'Tap to try again'
                    : voiceState === 'error' ? 'Tap to retry'
                    : ''}
                </Text>

                {/* Cancel button */}
                {(voiceState === 'listening' || voiceState === 'processing') && (
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => voice.endConversation()}
                  >
                    <View style={styles.cancelCircle}>
                      <Ionicons name="close" size={18} color={textTokens.tertiary} />
                    </View>
                  </Pressable>
                )}
              </Animated.View>
            ) : voice.isDiscreetMode && (voice.aiResponse || voiceState === 'processing') ? (
              // Discreet mode: show AI response as text card
              <Animated.View entering={FadeIn.duration(300)} style={styles.discreetResponseContainer}>
                {voiceState === 'processing' ? (
                  <View style={styles.discreetThinking}>
                    <Ionicons name="sparkles" size={20} color={brand.primary} />
                    <Text style={styles.discreetThinkingText}>Thinking…</Text>
                  </View>
                ) : (
                  <BlurView intensity={15} tint="light" style={styles.discreetCard}>
                    <Text style={styles.discreetResponseText}>{voice.aiResponse}</Text>
                  </BlurView>
                )}
              </Animated.View>
            ) : (
              /* ── Idle: mic icon with breathing animation ── */
              <Animated.View
                entering={FadeIn.duration(800).delay(300)}
                style={styles.idleCenterContainer}
              >
                <Animated.View style={[styles.stateIconContainer, iconAnimStyle]}>
                  <View style={styles.idleMicRing}>
                    <Ionicons
                      name={isBriefingLoading ? 'sparkles-outline' : getStateIcon()}
                      size={48}
                      color={brand.primary}
                    />
                  </View>
                </Animated.View>

                <Animated.Text
                  entering={FadeInUp.duration(600).delay(500)}
                  style={styles.hintText}
                >
                  {getHintText()}
                </Animated.Text>
              </Animated.View>
            )}
          </View>

          {/* ──── Bottom Section: Quick Actions & Stats ──── */}
          <View style={styles.bottomSection}>
            {/* Quick Action Pills */}
            {voiceState === 'idle' && (!showBriefingText || isBriefingCollapsed) && (
              <Animated.View 
                entering={FadeInUp.duration(500).delay(400)}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickActionsContent}
                  style={styles.quickActionsScroll}
                >
                  <Pressable style={styles.quickActionPill}>
                    <Ionicons name="timer-outline" size={16} color={brand.primary} />
                    <Text style={styles.pillText}>🎯 Focus</Text>
                  </Pressable>
                  
                  <Pressable style={styles.quickActionPill}>
                    <Ionicons name="add-circle-outline" size={16} color={brand.primary} />
                    <Text style={styles.pillText}>➕ Add Task</Text>
                  </Pressable>

                  {/* Locked: Smart Sort — Level 2 */}
                  <Pressable
                    style={[styles.quickActionPill, currentLevel < 2 && styles.pillLocked]}
                    onPress={() => {
                      if (currentLevel < 2) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                  >
                    <Ionicons
                      name={currentLevel >= 2 ? 'sparkles-outline' : 'lock-closed'}
                      size={14}
                      color={currentLevel >= 2 ? brand.primary : textTokens.disabled}
                    />
                    <Text style={[styles.pillText, currentLevel < 2 && styles.pillTextLocked]}>
                      🧠 Smart Sort
                    </Text>
                  </Pressable>

                  {/* Locked: Reminders — Level 4 */}
                  <Pressable
                    style={[styles.quickActionPill, currentLevel < 4 && styles.pillLocked]}
                    onPress={() => {
                      if (currentLevel < 4) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                  >
                    <Ionicons
                      name={currentLevel >= 4 ? 'notifications-outline' : 'lock-closed'}
                      size={14}
                      color={currentLevel >= 4 ? brand.primary : textTokens.disabled}
                    />
                    <Text style={[styles.pillText, currentLevel < 4 && styles.pillTextLocked]}>
                      ⏰ Reminders
                    </Text>
                  </Pressable>
                </ScrollView>
              </Animated.View>
            )}
            
            {/* Ambient Stats Bar */}
            <Animated.View 
              entering={FadeInUp.duration(500).delay(600)}
              style={styles.statsContainer}
            >
              <View style={styles.statsDivider} />
              <View style={styles.statsRow}>
                {pendingTasks > 0 && (
                  <View style={styles.statItem}>
                    <Text style={styles.statsText}>📋 {pendingTasks} task{pendingTasks !== 1 ? 's' : ''}</Text>
                  </View>
                )}
                {(user?.currentStreak ?? 0) > 0 && (
                  <View style={styles.statItem}>
                    <Text style={styles.statsText}>🔥 {user?.currentStreak}-day streak</Text>
                  </View>
                )}
                <View style={styles.statItem}>
                  <Text style={styles.statsText}>⭐ Level {user?.level || 1}</Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* ──── Text Input Bar (discreet mode / offline / error fallback) ──── */}
          {showTextInput && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={styles.textInputContainer}
            >
              <View style={styles.textInputRow}>
                <TextInput
                  ref={textInputRef}
                  style={styles.textInput}
                  placeholder={voice.isDiscreetMode ? 'Type your request…' : 'Type here instead…'}
                  placeholderTextColor={textTokens.disabled}
                  value={textInputValue}
                  onChangeText={setTextInputValue}
                  onSubmitEditing={handleTextSubmit}
                  returnKeyType="send"
                  autoCapitalize="sentences"
                  autoCorrect
                  blurOnSubmit={false}
                  editable={voiceState !== 'processing'}
                />
                <Pressable
                  style={[styles.textSendButton, !textInputValue.trim() && styles.textSendButtonDisabled]}
                  onPress={handleTextSubmit}
                  disabled={!textInputValue.trim() || voiceState === 'processing'}
                >
                  <Ionicons
                    name="send"
                    size={18}
                    color={textInputValue.trim() ? brand.primary : textTokens.disabled}
                  />
                </Pressable>
              </View>
            </Animated.View>
          )}
        </Pressable>
      </SafeAreaView>
      
      {/* Voice Permissions Modal */}
      <VoicePermissions
        visible={showPermissionModal}
        onClose={hideModal}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
      />

      <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bg.primary,
  },
  safeArea: {
    ...StyleSheet.absoluteFillObject,
  },
  tapArea: {
    flex: 1,
  },

  // ──── Top Section ────
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flex: 1,
    paddingRight: 16,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '700',
    color: textTokens.primary,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 15,
    color: textTokens.tertiary,
    fontWeight: '400',
  },
  notificationButton: {
    marginTop: 4,
  },
  notificationCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bg.secondary,
  },

  // ── Briefing Pill (collapsed state) ──
  briefingPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: borderTokens.primary,
    ...shadows.sm,
  },
  briefingPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: textTokens.secondary,
  },

  // ──── Center Section ────
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // ── Idle state — floating mic icon + hint ──
  idleCenterContainer: {
    alignItems: 'center',
  },
  stateIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  idleMicRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.muted,
    borderWidth: 2,
    borderColor: brand.tertiary,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.muted,
    borderWidth: 2,
    borderColor: brand.tertiary,
  },
  hintText: {
    fontSize: 15,
    color: textTokens.tertiary,
    fontWeight: '400',
    textAlign: 'center',
  },

  // ── Voice-active state — transcript + response ──
  voiceActiveContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 40,
    marginBottom: 20,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: brand.secondary,
  },
  processingRow: {
    marginBottom: 16,
  },
  processingText: {
    fontSize: 15,
    color: brand.primary,
    fontWeight: '500',
  },
  voiceTextContainer: {
    width: '100%',
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  transcriptText: {
    fontSize: 20,
    fontWeight: '500',
    color: textTokens.primary,
    textAlign: 'center',
    lineHeight: 28,
  },
  listeningHint: {
    fontSize: 17,
    color: textTokens.tertiary,
    textAlign: 'center',
  },
  aiResponseCard: {
    borderRadius: 16,
    padding: 16,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  aiResponseText: {
    fontSize: 18,
    color: textTokens.primary,
    textAlign: 'center',
    lineHeight: 26,
  },
  aiResponseTextPlain: {
    fontSize: 18,
    color: textTokens.secondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  voiceFooterHint: {
    marginTop: 20,
    fontSize: 13,
    color: textTokens.tertiary,
    textAlign: 'center',
  },
  cancelButton: {
    position: 'absolute',
    top: -8,
    right: 0,
  },
  cancelCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bg.secondary,
  },

  // ── Briefing card (expanded) ──
  briefingContainer: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.45,
    alignItems: 'center',
  },
  briefingScroll: {
    width: '100%',
  },
  briefingScrollContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  briefingCard: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  briefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  briefingEmoji: {
    fontSize: 16,
  },
  briefingTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: textTokens.primary,
  },
  briefingText: {
    fontSize: 16,
    color: textTokens.secondary,
    lineHeight: 24,
  },
  briefingHint: {
    marginTop: 16,
    fontSize: 14,
    color: textTokens.tertiary,
    textAlign: 'center',
  },

  // ──── Bottom Section ────
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  quickActionsScroll: {
    marginBottom: 16,
  },
  quickActionsContent: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 8,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: bg.card,
    borderWidth: 1,
    borderColor: borderTokens.primary,
    ...shadows.sm,
  },
  pillLocked: {
    opacity: 0.5,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: textTokens.secondary,
  },
  pillTextLocked: {
    color: textTokens.disabled,
  },
  statsContainer: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  statsDivider: {
    width: 60,
    height: 1,
    backgroundColor: borderTokens.secondary,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: 13,
    color: textTokens.tertiary,
  },

  // ──── Text Input Bar ────
  textInputContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: bg.card,
    borderWidth: 1,
    borderColor: borderTokens.primary,
    ...shadows.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: textTokens.primary,
    paddingVertical: 12,
  },
  textSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.muted,
    marginLeft: 8,
  },
  textSendButtonDisabled: {
    backgroundColor: 'transparent',
  },

  // ──── Discreet Mode Response Card ────
  discreetResponseContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  discreetThinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  discreetThinkingText: {
    color: textTokens.secondary,
    fontSize: 15,
  },
  discreetCard: {
    borderRadius: 16,
    padding: 16,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  discreetResponseText: {
    color: textTokens.primary,
    fontSize: 16,
    lineHeight: 24,
  },
});
