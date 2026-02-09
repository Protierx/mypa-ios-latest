/**
 * AI Hub Screen
 * 
 * The heart of MYPA - the Living Background interface.
 * The entire screen IS the AI - you're stepping INTO MYPA's presence.
 * 
 * Tap anywhere to activate voice.
 * Daily briefing auto-plays on first open of the day (PRD R2).
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { LivingBackground, VoiceState } from '../../components/LivingBackground';
import { VoiceFeedback } from '../../components/VoiceFeedback';
import { VoicePermissions, useVoicePermissions } from '../../components/VoicePermissions';
import { useVoice } from '../../contexts/VoiceContext';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useTasks } from '../../hooks/supabase/useTasks';
import { useDailyBriefing } from '../../hooks/useDailyBriefing';
import { eventLogger } from '../../services/eventLogger';
import { darkColors } from '../../styles/colors';
import supabaseApi from '../../services/supabaseApi';

interface AIHubScreenProps {
  voiceState?: VoiceState;
  audioLevel?: number;
}

// Approximate TTS speed: ~150 chars/second
const TTS_CHARS_PER_SEC = 150;

export function AIHubScreen({ voiceState: externalVoiceState, audioLevel: externalAudioLevel }: AIHubScreenProps) {
  const { user } = useSupabaseAuth();
  const { tasks } = useTasks('today');
  
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
  // Track briefing start time for progress estimation
  const briefingStartTimeRef = useRef<number>(0);
  // Estimated duration in ms
  const briefingDurationRef = useRef<number>(0);
  // Progress tracking timeouts
  const progressTimersRef = useRef<NodeJS.Timeout[]>([]);
  // Guard: only auto-play once per mount
  const briefingTriggeredRef = useRef(false);

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
      // TTS finished naturally
      setIsBriefingPlaying(false);

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

  // Tap handler for voice activation + briefing barge-in
  const handleTap = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // ---- Barge-in during briefing (PRD R2.2) ----
    if (isBriefingPlaying && voiceState === 'speaking') {
      voice.stopSpeaking();
      setIsBriefingPlaying(false);

      // Clear progress timers
      progressTimersRef.current.forEach(clearTimeout);
      progressTimersRef.current = [];

      // Log briefing_skipped with progress estimate (PRD R2.5)
      const progress = estimateBriefingProgress();
      eventLogger.logBriefingSkipped(progress);
      markBriefingPlayed();

      // Transition to listening
      try {
        await voice.startListening();
      } catch (error) {
        console.error('Failed to start listening after barge-in:', error);
      }
      return;
    }
    
    if (voiceState === 'idle') {
      // Hide briefing text when user starts a new voice interaction
      setShowBriefingText(false);

      // Check permissions first
      if (permissionStatus !== 'granted') {
        const hasPermission = await requestPermissionIfNeeded();
        if (!hasPermission) return;
      }
      
      // Start voice recording
      try {
        await voice.startListening();
      } catch (error) {
        console.error('Failed to start listening:', error);
        // If permission denied at runtime, show modal
        if (String(error).includes('permission')) {
          setShowPermissionModal(true);
        }
      }
    } else if (voiceState === 'listening') {
      // Stop listening and process
      try {
        await voice.stopListening();
      } catch (error) {
        console.error('Failed to stop listening:', error);
      }
    } else {
      // Cancel any ongoing voice activity
      voice.cancelListening();
      voice.stopSpeaking();
    }
  }, [
    voiceState, voice, isBriefingPlaying, permissionStatus,
    requestPermissionIfNeeded, setShowPermissionModal,
    estimateBriefingProgress, markBriefingPlayed,
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

  // Pulse animation for the tap hint
  const pulseScale = useSharedValue(1);
  
  useEffect(() => {
    if (voiceState === 'idle' && !isBriefingPlaying) {
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [voiceState, isBriefingPlaying]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const displayName = user?.name || user?.profile?.display_name || 'there';
  const displayGreeting = greeting || `${getTimeGreeting()}, ${displayName}!`;

  // ---- Determine center section content ----
  const renderCenterContent = () => {
    // Briefing loading state
    if (isBriefingLoading) {
      return (
        <Animated.View entering={FadeIn.duration(300)} style={styles.briefingStatusContainer}>
          <View style={styles.tapCircle}>
            <Ionicons name="sparkles-outline" size={28} color={darkColors.primary} />
          </View>
          <Text style={styles.briefingStatusText}>Preparing your briefing...</Text>
        </Animated.View>
      );
    }

    // Briefing error state
    if (briefingError) {
      return (
        <Animated.View entering={FadeIn.duration(300)} style={styles.briefingErrorContainer}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{briefingError}</Text>
            <Pressable style={styles.retryButton} onPress={retryBriefing}>
              <Ionicons name="refresh" size={16} color={darkColors.primary} />
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          </View>
        </Animated.View>
      );
    }

    // Briefing playing or text visible after playback
    if (showBriefingText && briefText) {
      return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.briefingContainer}>
          <ScrollView
            style={styles.briefingScroll}
            contentContainerStyle={styles.briefingScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.briefingCard}>
              <View style={styles.briefingHeader}>
                <Ionicons name="sunny-outline" size={18} color={darkColors.primary} />
                <Text style={styles.briefingLabel}>Your Daily Briefing</Text>
              </View>
              <Text style={styles.briefingText}>{briefText}</Text>
            </View>
          </ScrollView>

          {isBriefingPlaying ? (
            <Text style={styles.briefingHint}>Listening to your briefing... tap to skip</Text>
          ) : (
            <Text style={styles.briefingHint}>Tap anywhere to start talking</Text>
          )}
        </Animated.View>
      );
    }

    // Default idle state
    if (voiceState === 'idle') {
      return (
        <Animated.View style={[styles.tapHintContainer, pulseStyle]}>
          <View style={styles.tapCircle}>
            <Ionicons name="mic-outline" size={32} color="rgba(255,255,255,0.8)" />
          </View>
          <Text style={styles.tapHint}>Tap anywhere to talk</Text>
        </Animated.View>
      );
    }

    // Active voice states (listening, processing, speaking)
    return (
      <VoiceFeedback
        voiceState={voiceState}
        audioLevel={audioLevel}
        transcript={voice.transcript}
        aiResponse={voice.aiResponse}
        onCancel={() => {
          voice.cancelListening();
          voice.stopSpeaking();
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Living Background */}
      <LivingBackground voiceState={voiceState} audioLevel={audioLevel} />
      
      {/* Tap Area - entire screen */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap}>
        <SafeAreaView style={styles.content}>
          {/* Top Section - Greeting */}
          <View style={styles.header}>
            <Animated.Text 
              entering={FadeIn.duration(500)} 
              style={styles.greeting}
            >
              {displayGreeting}
            </Animated.Text>
            <Text style={styles.date}>{dateString}</Text>
          </View>

          {/* Center Section - Voice State / Briefing */}
          <View style={styles.center}>
            {renderCenterContent()}
          </View>

          {/* Bottom Section - Context Cards */}
          <View style={styles.contextSection}>
            {/* Tasks Card */}
            <View style={styles.contextCard}>
              <View style={styles.cardRow}>
                <Ionicons name="checkbox-outline" size={18} color={darkColors.primary} />
                <Text style={styles.cardLabel}>Today's Tasks</Text>
              </View>
              <Text style={styles.cardValue}>
                {pendingTasks} pending{completedTasks > 0 ? ` \u00B7 ${completedTasks} done` : ''}
              </Text>
            </View>

            {/* Streak Card */}
            {user?.currentStreak && user.currentStreak > 0 && (
              <View style={styles.contextCard}>
                <View style={styles.cardRow}>
                  <Ionicons name="flame" size={18} color={darkColors.warning} />
                  <Text style={styles.cardLabel}>Streak</Text>
                </View>
                <Text style={styles.cardValue}>{user.currentStreak} days</Text>
              </View>
            )}

            {/* XP Card */}
            <View style={styles.contextCard}>
              <View style={styles.cardRow}>
                <Ionicons name="star" size={18} color={darkColors.warning} />
                <Text style={styles.cardLabel}>Level {user?.level || 1}</Text>
              </View>
              <Text style={styles.cardValue}>{user?.xp || 0} XP</Text>
            </View>
          </View>
        </SafeAreaView>
      </Pressable>
      
      {/* Voice Permissions Modal */}
      <VoicePermissions
        visible={showPermissionModal}
        onClose={hideModal}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
      />
    </View>
  );
}

// ============================================================================
// Styles — uses design system tokens (darkColors for the dark AI Hub screen)
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
  },
  greeting: {
    color: darkColors.foreground,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  date: {
    color: darkColors.mutedForeground,
    fontSize: 15,
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---- Tap hint (idle, no briefing) ----
  tapHintContainer: {
    alignItems: 'center',
  },
  tapCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(181, 140, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(181, 140, 255, 0.25)',
  },
  tapHint: {
    color: darkColors.mutedForeground,
    fontSize: 14,
    marginTop: 16,
  },

  // ---- Briefing loading state ----
  briefingStatusContainer: {
    alignItems: 'center',
  },
  briefingStatusText: {
    color: darkColors.mutedForeground,
    fontSize: 13,
    marginTop: 12,
  },

  // ---- Briefing error state ----
  briefingErrorContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  errorText: {
    color: darkColors.foreground,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(181, 140, 255, 0.15)',
  },
  retryText: {
    color: darkColors.primary,
    fontSize: 14,
    fontWeight: '500',
  },

  // ---- Briefing text display (UI fallback) ----
  briefingContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  briefingScroll: {
    maxHeight: 200,
    width: '100%',
  },
  briefingScrollContent: {
    alignItems: 'center',
  },
  briefingCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  briefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  briefingLabel: {
    color: darkColors.primary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  briefingText: {
    color: darkColors.foreground,
    fontSize: 15,
    lineHeight: 22,
  },
  briefingHint: {
    color: darkColors.mutedForeground,
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },

  // ---- Deprecated but kept for potential use ----
  stateContainer: {
    alignItems: 'center',
  },
  stateText: {
    color: darkColors.mutedForeground,
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },

  // ---- Context cards ----
  contextSection: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  contextCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardLabel: {
    color: darkColors.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
  },
  cardValue: {
    color: darkColors.foreground,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
});
