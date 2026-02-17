/**
 * AI Hub Screen — Immersive Dark "AI Data Core" Design
 *
 * The entire screen IS the AI — a dark, living environment with floating
 * particles, ambient glow, and voice-reactive animations. Clean white text
 * overlaid on the dark scene.
 *
 * Features:
 * - Dark animated Skia background scene (AIHubScene)
 * - Floating glass transcript overlay (TranscriptOverlay)
 * - Breathing mic icon with voice-state transitions
 * - Quick action pill chips + ambient stats bar
 * - Text input fallback for offline / discreet mode
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Keyboard, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

import { AIHubScene } from './AIHubScene';
import { TranscriptOverlay } from './TranscriptOverlay';
import { useVoiceAmplitude } from './useVoiceAmplitude';
import { useAssistantSceneState } from './useAssistantSceneState';
import { VoiceState } from '../../components/LivingBackground';
import { VoicePermissions, useVoicePermissions } from '../../components/VoicePermissions';
import { NotificationsModal } from '../modals/NotificationsModal';
import { useNotifications } from '../../hooks/supabase/useNotifications';
import { SoftUpsellSheet } from '../modals/SoftUpsellSheet';
import { PaywallSheet } from '../modals/PaywallSheet';
import { VoiceFeedbackPrompt } from '../../components/VoiceFeedbackPrompt';
import { useVoice } from '../../contexts/VoiceContext';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useUserModel } from '../../contexts/UserModelContext';
import { useTasks } from '../../hooks/supabase/useTasks';
import { useDailyBriefing } from '../../hooks/useDailyBriefing';
import { eventLogger } from '../../services/eventLogger';
import { brand } from '../../styles/colors';
import supabaseApi from '../../services/supabaseApi';

interface AIHubScreenProps {
  voiceState?: VoiceState;
  audioLevel?: number;
}

// Approximate TTS speed: ~150 chars/second
const TTS_CHARS_PER_SEC = 150;

/** Returns time-of-day greeting */
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Hey there';
}

export function AIHubScreen({ voiceState: externalVoiceState, audioLevel: externalAudioLevel }: AIHubScreenProps) {
  const { user } = useSupabaseAuth();
  const { stats } = useUserModel();
  const { tasks } = useTasks('today');
  useWindowDimensions(); // keep hook registered for layout reactivity

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

  // ── Scene hooks (drive the dark background) ──
  const amplitude = useVoiceAmplitude();
  const sceneState = useAssistantSceneState(voiceState);
  
  const [greeting, setGreeting] = useState('');
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCounts } = useNotifications();
  const [showPaywall, setShowPaywall] = useState(false);
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
    month: 'short',
    day: 'numeric',
  });

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
      // Keep briefing pill visible — only collapse expanded view
      if (showBriefingText && !isBriefingCollapsed) {
        setShowBriefingText(false);
        setIsBriefingCollapsed(true);
      }
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
      <StatusBar barStyle="light-content" />

      {/* ── Immersive dark Skia background scene ── */}
      <AIHubScene sceneState={sceneState} amplitude={amplitude} />

      {/* SafeAreaView wraps all UI content */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
                  <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.6)" />
                  {unreadCounts.all > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadCounts.all > 9 ? '9+' : unreadCounts.all}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </View>

            {/* ──── Smart Briefing Pill (collapsed) ──── */}
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
                  <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.4)" />
                </Pressable>
              </Animated.View>
            )}
          </View>

          {/* ──── Center Section: Voice Interaction Zone ──── */}
          <View style={styles.centerSection}>
            {/* Briefing expanded card */}
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
                        <Ionicons name="chevron-up" size={18} color="rgba(255,255,255,0.4)" />
                      </Pressable>
                    </View>
                    <Text style={styles.briefingText}>{briefText}</Text>
                  </View>
                </ScrollView>
                <Text style={styles.briefingHint}>
                  {isBriefingPlaying ? 'Listening to your briefing… tap to skip' : 'Tap anywhere to start talking'}
                </Text>
              </Animated.View>
            ) : isVoiceActive ? (
              /* Voice-active: icon + waveform (transcript moves to overlay) */
              <Animated.View
                entering={FadeIn.duration(250)}
                exiting={FadeOut.duration(200)}
                style={styles.voiceActiveContainer}
              >
                <Animated.View style={[styles.stateIconContainer, iconAnimStyle]}>
                  <View style={[
                    styles.iconRing,
                    voiceState === 'error' && { borderColor: 'rgba(255,100,100,0.6)' },
                  ]}>
                    <Ionicons
                      name={getStateIcon()}
                      size={32}
                      color={voiceState === 'error' ? '#FF6B6B' : '#A78BFA'}
                    />
                  </View>
                </Animated.View>

                {/* Listening waveform */}
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

                {/* Cancel button */}
                {(voiceState === 'listening' || voiceState === 'processing') && (
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => voice.endConversation()}
                  >
                    <View style={styles.cancelCircle}>
                      <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
                    </View>
                  </Pressable>
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
                      color="#A78BFA"
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

          {/* ──── Bottom Section: Stats ──── */}
          <View style={styles.bottomSection}>
            {/* Stats */}
            <Animated.View 
              entering={FadeInUp.duration(500).delay(600)}
              style={styles.statsContainer}
            >
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

          {/* ──── Text Input (discreet / offline fallback) ──── */}
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
                  placeholderTextColor="rgba(255,255,255,0.3)"
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
                    color={textInputValue.trim() ? '#A78BFA' : 'rgba(255,255,255,0.2)'}
                  />
                </Pressable>
              </View>
            </Animated.View>
          )}
        </Pressable>
      </SafeAreaView>

      {/* ── TranscriptOverlay — floating glass band for voice text ── */}
      <TranscriptOverlay voiceState={voiceState} />
      
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

      {/* Voice feedback prompt (beta quality signal) */}
      <VoiceFeedbackPrompt
        visible={voice.showVoiceFeedback}
        action={voice.lastVoiceAction.action}
        confidence={voice.lastVoiceAction.confidence}
        onDismiss={voice.dismissVoiceFeedback}
      />

      {/* Voice limit soft upsell (Step 11 monetization) */}
      <SoftUpsellSheet
        visible={voice.showVoiceLimitUpsell}
        onClose={voice.dismissVoiceLimitUpsell}
        onUpgrade={() => {
          voice.dismissVoiceLimitUpsell();
          setShowPaywall(true);
        }}
        onTextFallback={() => {
          voice.dismissVoiceLimitUpsell();
          voice.setDiscreetMode(true);
        }}
        voiceCount={voice.voiceLimitInfo?.count ?? 10}
        limit={voice.voiceLimitInfo?.limit ?? 10}
      />

      {/* Paywall sheet (opened from upsell or directly) */}
      <PaywallSheet
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="voice_limit"
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08081A',
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
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF453A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#000',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  briefingPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
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
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  hintText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '400',
    textAlign: 'center',
  },

  // ── Voice-active state ──
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
    backgroundColor: '#A78BFA',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // ── Briefing card (expanded) ──
  briefingContainer: {
    width: '100%',
    maxHeight: '45%',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: 'rgba(255,255,255,0.9)',
  },
  briefingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 24,
  },
  briefingHint: {
    marginTop: 16,
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },

  // ──── Bottom Section ────
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statsContainer: {
    alignItems: 'center',
    paddingBottom: 4,
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
    color: 'rgba(255,255,255,0.4)',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    paddingVertical: 12,
  },
  textSendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.15)',
    marginLeft: 8,
  },
  textSendButtonDisabled: {
    backgroundColor: 'transparent',
  },
});
