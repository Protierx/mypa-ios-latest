/**
 * AI Hub Screen
 * 
 * The heart of MYPA - the Living Background interface.
 * The entire screen IS the AI - you're stepping INTO MYPA's presence.
 * 
 * Features:
 * - Beautiful animated orb/focal glow center
 * - Living breathing background
 * - Ambient stats (subtle, not cards)
 * - Quick action floating pills
 * - Daily briefing auto-plays on first open
 * 
 * Tap anywhere to activate voice.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { LivingBackground, VoiceState } from '../../components/LivingBackground';
import { VoiceFeedback } from '../../components/VoiceFeedback';
import { VoicePermissions, useVoicePermissions } from '../../components/VoicePermissions';
import { NotificationsModal } from '../modals/NotificationsModal';
import { useVoice } from '../../contexts/VoiceContext';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useTasks } from '../../hooks/supabase/useTasks';
import { useDailyBriefing } from '../../hooks/useDailyBriefing';
import { eventLogger } from '../../services/eventLogger';
import { specColors } from '../../styles/colors';
import supabaseApi from '../../services/supabaseApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AIHubScreenProps {
  voiceState?: VoiceState;
  audioLevel?: number;
}

// Approximate TTS speed: ~150 chars/second
const TTS_CHARS_PER_SEC = 150;

// Orb configuration
const ORB_SIZE = 160;
const ORB_GLOW_SIZE = 260;

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
  const [showNotifications, setShowNotifications] = useState(false);

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

  // ---- Orb Animation Values ----
  const orbScale = useSharedValue(1);
  const orbGlowOpacity = useSharedValue(0.4);
  const orbPulse = useSharedValue(0);
  const orbRotation = useSharedValue(0);
  const orbInnerGlow = useSharedValue(0.6);

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

  // ---- Orb State-Based Animations ----
  useEffect(() => {
    if (voiceState === 'idle' && !isBriefingPlaying) {
      // Gentle breathing animation
      orbScale.value = withRepeat(
        withTiming(1.08, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      orbGlowOpacity.value = withRepeat(
        withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      orbPulse.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      orbInnerGlow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      orbRotation.value = withTiming(0, { duration: 300 });
    } else if (voiceState === 'listening') {
      // Responsive to audio level
      orbScale.value = withSpring(1.15 + audioLevel * 0.25, { damping: 12, stiffness: 100 });
      orbGlowOpacity.value = withTiming(0.8, { duration: 150 });
      orbInnerGlow.value = withSpring(0.9 + audioLevel * 0.1, { damping: 10 });
    } else if (voiceState === 'processing') {
      // Gentle rotation/pulse for thinking
      orbScale.value = withRepeat(
        withTiming(1.12, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      orbGlowOpacity.value = withTiming(0.7, { duration: 300 });
      orbRotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1
      );
    } else if (voiceState === 'speaking') {
      // Larger, brighter, pulsing with speech
      orbScale.value = withSpring(1.2, { damping: 15, stiffness: 150 });
      orbGlowOpacity.value = withTiming(0.9, { duration: 200 });
      orbInnerGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.7, { duration: 300 })
        ),
        -1
      );
    }
  }, [voiceState, audioLevel, isBriefingPlaying]);

  // Orb animated styles
  const orbContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: orbScale.value },
      { rotate: `${orbRotation.value}deg` },
    ],
  }));

  const orbGlowStyle = useAnimatedStyle(() => ({
    opacity: orbGlowOpacity.value,
    transform: [{ scale: 1 + orbPulse.value * 0.1 }],
  }));

  const orbInnerStyle = useAnimatedStyle(() => ({
    opacity: orbInnerGlow.value,
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

    // ---- Barge-in: tap during SPEAKING → stop TTS, go to LISTENING (PRD 4.1) ----
    if (voiceState === 'speaking') {
      if (isBriefingPlaying) {
        setIsBriefingPlaying(false);
        progressTimersRef.current.forEach(clearTimeout);
        progressTimersRef.current = [];
        const progress = estimateBriefingProgress();
        eventLogger.logBriefingSkipped(progress);
        markBriefingPlayed();
      }
      await voice.bargeIn();
      return;
    }

    if (voiceState === 'idle') {
      setShowBriefingText(false);
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

  const displayName = user?.name || user?.profile?.display_name || 'there';
  const displayGreeting = greeting || `${getTimeGreeting()}, ${displayName}`;

  // Get state-specific hint text
  const getHintText = () => {
    if (isBriefingPlaying) return 'Tap to skip briefing';
    if (voiceState === 'listening') return 'Listening... tap to send';
    if (voiceState === 'processing') return 'Thinking...';
    if (voiceState === 'speaking') return 'Tap to interrupt';
    if (isBriefingLoading) return 'Preparing briefing... tap to talk';
    return 'Tap anywhere to talk';
  };

  // Get orb icon based on state
  const getOrbIcon = (): 'mic' | 'mic-outline' | 'sparkles' | 'volume-high' => {
    if (voiceState === 'listening') return 'mic';
    if (voiceState === 'processing') return 'sparkles';
    if (voiceState === 'speaking') return 'volume-high';
    return 'mic-outline';
  };

  // Determine if we should show voice active state
  const isVoiceActive = voiceState !== 'idle';

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
          </View>

          {/* ---- Center Section: The Orb ---- */}
          <View style={styles.centerSection}>
            {/* Briefing content overlay */}
            {(showBriefingText && briefText && !isVoiceActive) ? (
              <Animated.View 
                entering={FadeIn.duration(400)} 
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
              // Voice feedback when active
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
            ) : (
              // The beautiful orb - center of the experience
              <Animated.View 
                entering={FadeIn.duration(800).delay(300)}
                style={styles.orbWrapper}
              >
                <Animated.View style={[styles.orbContainer, orbContainerStyle]}>
                  {/* Outer glow rings */}
                  <Animated.View style={[styles.orbGlow, styles.orbGlow3, orbGlowStyle]} />
                  <Animated.View style={[styles.orbGlow, styles.orbGlow2, orbGlowStyle]} />
                  <Animated.View style={[styles.orbGlow, styles.orbGlow1, orbGlowStyle]} />
                  
                  {/* Core orb with gradient */}
                  <View style={styles.orbCore}>
                    <LinearGradient
                      colors={['rgba(167, 139, 250, 0.95)', 'rgba(124, 58, 237, 0.85)', 'rgba(100, 199, 255, 0.7)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.orbGradient}
                    />
                    <Animated.View style={[styles.orbInnerGlow, orbInnerStyle]} />
                    
                    {/* Icon in center */}
                    <View style={styles.orbIconContainer}>
                      <Ionicons 
                        name={isBriefingLoading ? 'sparkles-outline' : getOrbIcon()} 
                        size={44} 
                        color="rgba(255,255,255,0.95)" 
                      />
                    </View>
                  </View>
                </Animated.View>
                
                {/* Hint text below orb */}
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
            {voiceState === 'idle' && !showBriefingText && (
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
  
  // ---- Center Section ----
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  
  // Orb styles
  orbWrapper: {
    alignItems: 'center',
  },
  orbContainer: {
    width: ORB_GLOW_SIZE,
    height: ORB_GLOW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlow: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbGlow1: {
    width: ORB_SIZE + 30,
    height: ORB_SIZE + 30,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  orbGlow2: {
    width: ORB_SIZE + 60,
    height: ORB_SIZE + 60,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  orbGlow3: {
    width: ORB_SIZE + 100,
    height: ORB_SIZE + 100,
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
  },
  orbCore: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  orbGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  orbInnerGlow: {
    position: 'absolute',
    width: ORB_SIZE * 0.5,
    height: ORB_SIZE * 0.5,
    borderRadius: ORB_SIZE * 0.25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  orbIconContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  hintText: {
    marginTop: 28,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '400',
    textAlign: 'center',
  },
  
  // Briefing styles
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
  
  // Loading & Error states
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: 16,
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
    color: specColors.brandSecondary,
  },
  
  // ---- Bottom Section ----
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
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
});
