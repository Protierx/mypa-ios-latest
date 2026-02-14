/**
 * AI Hub Screen — Immersive Full-Screen AI
 *
 * The entire screen IS MYPA. No orb — the living background of aurora blobs
 * reacts to voice state and audio level. You're stepping into the AI's
 * consciousness. Tap anywhere to talk.
 *
 * Features:
 * - Full-screen reactive aurora background
 * - Floating state icon + hint text (no orb)
 * - Inline voice feedback (transcript / AI response)
 * - Daily briefing auto-play
 * - Quick action pills + ambient stats
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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

import { LivingBackground, VoiceState } from '../../components/LivingBackground';
import { VoicePermissions, useVoicePermissions } from '../../components/VoicePermissions';
import { NotificationsModal } from '../modals/NotificationsModal';
import { useVoice } from '../../contexts/VoiceContext';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useUserModel } from '../../contexts/UserModelContext';
import { useTasks } from '../../hooks/supabase/useTasks';
import { useDailyBriefing } from '../../hooks/useDailyBriefing';
import { eventLogger } from '../../services/eventLogger';
import { getLevelFromDays } from '../../components/LockedFeature';
import { specColors } from '../../styles/colors';
import supabaseApi from '../../services/supabaseApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AIHubScreenProps {
  voiceState?: VoiceState;
  audioLevel?: number;
}

// Approximate TTS speed: ~150 chars/second
const TTS_CHARS_PER_SEC = 150;

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

  // Get today's date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
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
          withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ), -1,
      );
      iconOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ), -1,
      );
    } else if (voiceState === 'listening') {
      iconScale.value = withSpring(1.15 + audioLevel * 0.2, { damping: 12, stiffness: 100 });
      iconOpacity.value = withTiming(0.9, { duration: 150 });
    } else if (voiceState === 'processing') {
      iconScale.value = withRepeat(
        withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true,
      );
      iconOpacity.value = withTiming(0.85, { duration: 300 });
    } else if (voiceState === 'speaking') {
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 350, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.05, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        ), -1,
      );
      iconOpacity.value = withTiming(0.95, { duration: 200 });
    } else if (voiceState === 'error') {
      iconScale.value = withRepeat(
        withTiming(1.08, { duration: 350, easing: Easing.inOut(Easing.ease) }), 6, true,
      );
      iconOpacity.value = withTiming(0.9, { duration: 200 });
    } else {
      // timeout / offline — subdued
      iconScale.value = withTiming(1, { duration: 400 });
      iconOpacity.value = withTiming(0.4, { duration: 400 });
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
      // (prevents false-positive idle transitions during state machine changes)
      const elapsed = Date.now() - briefingStartTimeRef.current;
      if (elapsed < 2000) return;

      // TTS finished naturally — collapse briefing into pill
      setIsBriefingPlaying(false);
      setIsBriefingCollapsed(true);

      // Clear progress timers (they may have already fired)
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
    // Start listening after permission granted
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await voice.startListening();
    } catch (error) {
      console.error('Failed to start listening after permission:', error);
    }
  }, [voice]);

  // Handle permission denied callback
  const handlePermissionDenied = useCallback(() => {
    // User chose not to enable voice - that's okay
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
    return 'Tap anywhere to talk';
  };

  // Get orb icon based on state
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

  // Whether to show the text input bar (offline, error after max retries, or discreet mode)
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
      {/* Living Background */}
      <LivingBackground voiceState={voiceState} audioLevel={audioLevel} />
      
      {/* SafeAreaView wraps everything for proper insets */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Tap Area - entire screen */}
        <Pressable style={styles.tapArea} onPress={handleTap}>
          {/* ---- Top Section: Greeting & Date ---- */}
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
                <BlurView intensity={40} tint="dark" style={styles.notificationBlur}>
                  <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)" />
                </BlurView>
              </Pressable>
            </View>

            {/* Briefing Pill — collapsed briefing card */}
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
                  <BlurView intensity={30} tint="dark" style={styles.briefingPillBlur}>
                    <Ionicons name="sunny" size={16} color={specColors.brandSecondary} />
                    <Text style={styles.briefingPillText} numberOfLines={1}>
                      Daily Briefing
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.4)" />
                  </BlurView>
                </Pressable>
              </Animated.View>
            )}
          </View>

          {/* ---- Center Section: Immersive AI Presence ---- */}
          <View style={styles.centerSection}>
            {/* Briefing content overlay — only when not collapsed into pill */}
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
                  <View style={styles.briefingCard}>
                    <View style={styles.briefingHeader}>
                      <Ionicons name="sunny" size={18} color={specColors.brandSecondary} />
                      <Text style={styles.briefingTitle}>Your Daily Briefing</Text>
                    </View>
                    <Text style={styles.briefingText}>{briefText}</Text>
                  </View>
                </ScrollView>
                <Text style={styles.briefingHint}>
                  {isBriefingPlaying ? 'Listening to your briefing... tap to skip' : 'Tap anywhere to start talking'}
                </Text>
              </Animated.View>
            ) : isVoiceActive ? (
              /* ── Voice-active: inline transcript + response ── */
              <Animated.View
                entering={FadeIn.duration(250)}
                exiting={FadeOut.duration(200)}
                style={styles.voiceActiveContainer}
              >
                {/* State icon — floats above text */}
                <Animated.View style={[styles.stateIconContainer, iconAnimStyle]}>
                  <Ionicons
                    name={getStateIcon()}
                    size={40}
                    color={voiceState === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.85)'}
                  />
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

                {/* Processing dots */}
                {voiceState === 'processing' && (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.processingRow}>
                    <Text style={styles.processingText}>Thinking...</Text>
                  </Animated.View>
                )}

                {/* Transcript / AI response text */}
                <View style={styles.voiceTextContainer}>
                  {voiceState === 'listening' && voice.transcript ? (
                    <Text style={styles.transcriptText}>{voice.transcript}</Text>
                  ) : voiceState === 'listening' ? (
                    <Text style={styles.listeningHint}>Listening...</Text>
                  ) : null}

                  {voiceState === 'processing' && voice.transcript ? (
                    <Text style={styles.transcriptText}>"{voice.transcript}"</Text>
                  ) : null}

                  {voiceState === 'speaking' && voice.aiResponse ? (
                    <Text style={styles.aiResponseText}>{voice.aiResponse}</Text>
                  ) : null}

                  {voiceState === 'timeout' && (
                    <Text style={styles.aiResponseText}>
                      {voice.aiResponse || "I didn't catch that. Tap to try again."}
                    </Text>
                  )}

                  {voiceState === 'error' && (
                    <Text style={styles.aiResponseText}>
                      {voice.aiResponse || "I'm having trouble. Please try again."}
                    </Text>
                  )}

                  {voiceState === 'offline' && (
                    <Text style={styles.aiResponseText}>
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
                    <BlurView intensity={25} tint="dark" style={styles.cancelBlur}>
                      <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
                    </BlurView>
                  </Pressable>
                )}
              </Animated.View>
            ) : voice.isDiscreetMode && (voice.aiResponse || voiceState === 'processing') ? (
              // Discreet mode: show AI response as text card
              <Animated.View entering={FadeIn.duration(300)} style={styles.discreetResponseContainer}>
                {voiceState === 'processing' ? (
                  <View style={styles.discreetThinking}>
                    <Ionicons name="sparkles" size={20} color="#a855f7" />
                    <Text style={styles.discreetThinkingText}>Thinking...</Text>
                  </View>
                ) : (
                  <View style={styles.discreetCard}>
                    <Text style={styles.discreetResponseText}>{voice.aiResponse}</Text>
                  </View>
                )}
              </Animated.View>
            ) : (
              /* ── Idle: floating state icon + hint — the screen itself is the AI ── */
              <Animated.View
                entering={FadeIn.duration(800).delay(300)}
                style={styles.idleCenterContainer}
              >
                <Animated.View style={[styles.stateIconContainer, iconAnimStyle]}>
                  <Ionicons
                    name={isBriefingLoading ? 'sparkles-outline' : getStateIcon()}
                    size={48}
                    color="rgba(255,255,255,0.85)"
                  />
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

          {/* ---- Bottom Section: Stats & Quick Actions ---- */}
          <View style={styles.bottomSection}>
            {/* Quick Action Pills */}
            {voiceState === 'idle' && (!showBriefingText || isBriefingCollapsed) && (
              <Animated.View 
                entering={FadeInUp.duration(500).delay(400)}
                style={styles.quickActionsRow}
              >
                <Pressable style={styles.quickActionPill}>
                  <BlurView intensity={25} tint="dark" style={styles.pillBlur}>
                    <Ionicons name="timer-outline" size={18} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.pillText}>Focus</Text>
                  </BlurView>
                </Pressable>
                
                <Pressable style={styles.quickActionPill}>
                  <BlurView intensity={25} tint="dark" style={styles.pillBlur}>
                    <Ionicons name="add-circle-outline" size={18} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.pillText}>Add Task</Text>
                  </BlurView>
                </Pressable>

                {/* Locked: Smart Sort — Level 2 */}
                <Pressable
                  style={[styles.quickActionPill, currentLevel < 2 && { opacity: 0.45 }]}
                  onPress={() => {
                    if (currentLevel < 2) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <BlurView intensity={25} tint="dark" style={styles.pillBlur}>
                    <Ionicons
                      name={currentLevel >= 2 ? 'sparkles-outline' : 'lock-closed'}
                      size={16}
                      color={currentLevel >= 2 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)'}
                    />
                    <Text style={[styles.pillText, currentLevel < 2 && { color: 'rgba(255,255,255,0.4)' }]}>
                      Smart Sort
                    </Text>
                  </BlurView>
                </Pressable>

                {/* Locked: Reminders — Level 4 */}
                <Pressable
                  style={[styles.quickActionPill, currentLevel < 4 && { opacity: 0.45 }]}
                  onPress={() => {
                    if (currentLevel < 4) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <BlurView intensity={25} tint="dark" style={styles.pillBlur}>
                    <Ionicons
                      name={currentLevel >= 4 ? 'notifications-outline' : 'lock-closed'}
                      size={16}
                      color={currentLevel >= 4 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)'}
                    />
                    <Text style={[styles.pillText, currentLevel < 4 && { color: 'rgba(255,255,255,0.4)' }]}>
                      Reminders
                    </Text>
                  </BlurView>
                </Pressable>
              </Animated.View>
            )}
            
            {/* Ambient Stats Line */}
            <Animated.View 
              entering={FadeInUp.duration(500).delay(600)}
              style={styles.statsContainer}
            >
              <View style={styles.statsRow}>
                {pendingTasks > 0 && (
                  <View style={styles.statItem}>
                    <Ionicons name="checkbox-outline" size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.statsText}>{pendingTasks} tasks</Text>
                  </View>
                )}
                {(user?.currentStreak ?? 0) > 0 && (
                  <View style={styles.statItem}>
                    <Ionicons name="flame" size={14} color={specColors.warning} />
                    <Text style={styles.statsText}>{user?.currentStreak} day streak</Text>
                  </View>
                )}
                <View style={styles.statItem}>
                  <Ionicons name="star" size={14} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.statsText}>Level {user?.level || 1}</Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* ---- Text Input Bar (discreet mode / offline / error fallback) ---- */}
          {showTextInput && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={styles.textInputContainer}
            >
              <BlurView intensity={30} tint="dark" style={styles.textInputBlur}>
                <TextInput
                  ref={textInputRef}
                  style={styles.textInput}
                  placeholder={voice.isDiscreetMode ? 'Type your request...' : 'Type here instead...'}
                  placeholderTextColor="rgba(255,255,255,0.35)"
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
                  <Ionicons name="send" size={18} color={textInputValue.trim() ? '#a855f7' : 'rgba(255,255,255,0.2)'} />
                </Pressable>
              </BlurView>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    ...StyleSheet.absoluteFillObject,
  },
  tapArea: {
    flex: 1,
  },

  // ---- Top Section ----
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
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '400',
  },
  notificationButton: {
    marginTop: 4,
  },
  notificationBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // ── Briefing Pill (collapsed state) ──
  briefingPill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 14,
  },
  briefingPillBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  briefingPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // ---- Center Section ----
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // ── Idle state — floating icon + hint ──
  idleCenterContainer: {
    alignItems: 'center',
  },
  stateIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  hintText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.45)',
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
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
  },
  processingRow: {
    marginBottom: 16,
  },
  processingText: {
    fontSize: 15,
    color: 'rgba(168, 85, 247, 0.85)',
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
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
  },
  listeningHint: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
  aiResponseText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 26,
  },
  voiceFooterHint: {
    marginTop: 20,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
  },
  cancelButton: {
    position: 'absolute',
    top: -8,
    right: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cancelBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // ── Briefing styles ──
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
    backgroundColor: 'rgba(30, 30, 40, 0.85)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  briefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  briefingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: specColors.brandSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  briefingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  briefingHint: {
    marginTop: 16,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },

  // ---- Bottom Section ----
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  quickActionPill: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  pillBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pillText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statsText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
  },

  // ---- Text Input Bar ----
  textInputContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  textInputBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 12,
  },
  textSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    marginLeft: 8,
  },
  textSendButtonDisabled: {
    backgroundColor: 'transparent',
  },

  // ---- Discreet Mode Response Card ----
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
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
  },
  discreetCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.85)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  discreetResponseText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    lineHeight: 24,
  },
});
