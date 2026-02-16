/**
 * Onboarding Screen — 4-step first-run experience
 *
 * Step 1: Welcome — "Hi, I'm MYPA" animation + timezone auto-detect
 * Step 2: Permissions — Request microphone, notifications, tracking transparency
 * Step 3: Voice intro — AI greeting (text + optional TTS)
 * Step 4: First command — tap → task created directly via Supabase → confetti
 *
 * NOTE: Steps 3 & 4 do NOT depend on edge functions. We create the
 * sample task directly via Supabase insert so onboarding never fails
 * due to undeployed / erroring cloud functions.
 *
 * Total target: ~60 seconds
 *
 * Reference: PRD Section 2 (First-Run Experience)
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

// Safe imports for native modules that may not be available in Expo Go
let requestRecordingPermissionsAsync: (() => Promise<{ granted: boolean }>) | null = null;
try {
  requestRecordingPermissionsAsync = require('expo-audio').requestRecordingPermissionsAsync;
} catch {
  console.warn('[Onboarding] expo-audio not available (Expo Go?)');
}

let requestTrackingPermissionsAsync: (() => Promise<{ status: string }>) | null = null;
try {
  requestTrackingPermissionsAsync = require('expo-tracking-transparency').requestTrackingPermissionsAsync;
} catch {
  console.warn('[Onboarding] expo-tracking-transparency not available (Expo Go?)');
}
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useVoice } from '../../contexts/VoiceContext';
import { supabase } from '../../lib/supabase';
import { eventLogger } from '../../services/eventLogger';
import { brand, text as textTokens, bg, semantic, border as borderTokens } from '../../styles/colors';
import { shadows, radius } from '../../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type OnboardingStep = 'welcome' | 'language' | 'permissions' | 'voice_intro' | 'first_command';

const ALL_STEPS: OnboardingStep[] = ['welcome', 'language', 'permissions', 'voice_intro', 'first_command'];

// Supported languages
interface LanguageOption {
  code: string;
  ttsCode: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', ttsCode: 'en-US', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ar', ttsCode: 'ar-SA', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'es', ttsCode: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', ttsCode: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', ttsCode: 'de-DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', ttsCode: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', ttsCode: 'zh-CN', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', ttsCode: 'ja-JP', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'pt', ttsCode: 'pt-BR', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'tr', ttsCode: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ur', ttsCode: 'ur-PK', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

// Permission item type
interface PermissionItem {
  key: 'microphone' | 'notifications' | 'tracking';
  icon: string;
  title: string;
  description: string;
  granted: boolean | null; // null = not yet requested
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { user, updateProfile } = useSupabaseAuth();
  const {
    speak: voiceSpeak,
    voiceState,
    startListening,
    endConversation,
    isConversationActive,
    aiResponse,
    transcript,
    audioLevel,
    setPreferredLanguage,
  } = useVoice();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [timezone, setTimezone] = useState('');
  const [isGreetingPlaying, setIsGreetingPlaying] = useState(false);
  const [greetingText, setGreetingText] = useState('');
  const [firstCommandDone, setFirstCommandDone] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(LANGUAGES[0]);
  const startTimeRef = useRef(Date.now());

  // Permissions state
  const [permissions, setPermissions] = useState<PermissionItem[]>([
    {
      key: 'microphone',
      icon: 'mic',
      title: 'Microphone',
      description: 'Talk to MYPA with your voice — hands free',
      granted: null,
    },
    {
      key: 'notifications',
      icon: 'notifications',
      title: 'Notifications',
      description: 'Get reminders for tasks, focus sessions & goals',
      granted: null,
    },
    {
      key: 'tracking',
      icon: 'shield-checkmark',
      title: 'App Tracking',
      description: 'Helps personalize your MYPA experience',
      granted: null,
    },
  ]);

  // Detect timezone on mount
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    setTimezone(tz);
  }, []);

  // Breathing animation for orb
  const orbScale = useSharedValue(1);
  useEffect(() => {
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  // ── Permission handlers ──

  const requestMicrophonePermission = useCallback(async () => {
    try {
      if (!requestRecordingPermissionsAsync) {
        // Native module not available — mark as granted (dev/Expo Go)
        setPermissions(prev =>
          prev.map(p => (p.key === 'microphone' ? { ...p, granted: true } : p)),
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return true;
      }
      const { granted } = await requestRecordingPermissionsAsync();
      setPermissions(prev =>
        prev.map(p => (p.key === 'microphone' ? { ...p, granted } : p)),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return granted;
    } catch {
      setPermissions(prev =>
        prev.map(p => (p.key === 'microphone' ? { ...p, granted: false } : p)),
      );
      return false;
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setPermissions(prev =>
        prev.map(p => (p.key === 'notifications' ? { ...p, granted } : p)),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return granted;
    } catch {
      setPermissions(prev =>
        prev.map(p => (p.key === 'notifications' ? { ...p, granted: false } : p)),
      );
      return false;
    }
  }, []);

  const requestTrackingPermission = useCallback(async () => {
    try {
      if (!requestTrackingPermissionsAsync) {
        // Native module not available — mark as granted (dev/Expo Go)
        setPermissions(prev =>
          prev.map(p => (p.key === 'tracking' ? { ...p, granted: true } : p)),
        );
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return true;
      }
      const { status } = await requestTrackingPermissionsAsync();
      const granted = status === 'granted';
      setPermissions(prev =>
        prev.map(p => (p.key === 'tracking' ? { ...p, granted } : p)),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return granted;
    } catch {
      setPermissions(prev =>
        prev.map(p => (p.key === 'tracking' ? { ...p, granted: false } : p)),
      );
      return false;
    }
  }, []);

  const handleRequestPermission = useCallback(
    async (key: PermissionItem['key']) => {
      switch (key) {
        case 'microphone':
          return requestMicrophonePermission();
        case 'notifications':
          return requestNotificationPermission();
        case 'tracking':
          return requestTrackingPermission();
      }
    },
    [requestMicrophonePermission, requestNotificationPermission, requestTrackingPermission],
  );

  const handleAllowAll = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await requestMicrophonePermission();
    await requestNotificationPermission();
    await requestTrackingPermission();
  }, [requestMicrophonePermission, requestNotificationPermission, requestTrackingPermission]);

  // ── Step handlers ──

  const handleWelcomeContinue = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (timezone && user) {
      await updateProfile({ timezone } as any).catch(() => {});
    }
    setStep('language');
  }, [timezone, user, updateProfile]);

  const handleLanguageContinue = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Save language preference to profile
    if (user) {
      await updateProfile({ language: selectedLanguage.code } as any).catch(() => {});
    }
    setStep('permissions');
  }, [user, selectedLanguage, updateProfile]);

  const handlePermissionsContinue = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('voice_intro');
  }, []);

  const handleVoiceIntro = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGreetingPlaying(true);

    // Sync language preference with VoiceContext before speaking
    setPreferredLanguage(selectedLanguage.code);

    const name = user?.name || 'there';
    const greeting = `Hi ${name}! I'm MYPA, your personal AI assistant. I can help you manage tasks, set focus sessions, and keep you on track — all with your voice. Let's try it out!`;
    setGreetingText(greeting);

    try {
      // Use ElevenLabs TTS via VoiceContext (falls back to device speech if edge function unavailable)
      await voiceSpeak(greeting);
    } catch {
      // TTS failed — fine, text is shown
    }
    setIsGreetingPlaying(false);
    setTimeout(() => setStep('first_command'), 500);
  }, [user, selectedLanguage, voiceSpeak, setPreferredLanguage]);

  const handleFirstCommand = useCallback(async () => {
    if (isCreatingTask || isConversationActive) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCreatingTask(true);

    try {
      // Start a real ElevenLabs conversational session —
      // the user can speak naturally (e.g. "Add buy groceries tomorrow")
      // and the agent will process it.
      await startListening();
    } catch (err) {
      console.warn('[Onboarding] Voice session failed, creating sample task:', err);
      // Fallback: create task directly via Supabase if voice session fails
      try {
        if (user) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0);

          await supabase.from('tasks').insert({
            user_id: user.id,
            title: 'Buy groceries',
            due_date: tomorrow.toISOString(),
            priority: 'medium',
            status: 'pending',
            estimated_duration: 30,
          });
        }
        setFirstCommandDone(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        setFirstCommandDone(true);
      }
    } finally {
      setIsCreatingTask(false);
    }
  }, [user, isCreatingTask, isConversationActive, startListening]);

  // Watch for the agent completing a voice command (task created by AI)
  const prevAiResponseRef = useRef('');
  useEffect(() => {
    if (step !== 'first_command') return;
    if (!aiResponse || aiResponse === prevAiResponseRef.current) return;
    prevAiResponseRef.current = aiResponse;
    // The agent responded — mark command as done
    setFirstCommandDone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // End the conversation session after a short delay
    setTimeout(() => {
      endConversation();
    }, 2000);
  }, [aiResponse, step, endConversation]);

  // End conversation when leaving onboarding
  useEffect(() => {
    return () => {
      if (isConversationActive) {
        endConversation();
      }
    };
  }, [isConversationActive, endConversation]);

  const handleComplete = useCallback(async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const durationMs = Date.now() - startTimeRef.current;
    eventLogger.log('onboarding_completed', { duration_ms: durationMs });

    try {
      await updateProfile({ onboarding_completed: true });
    } catch (err) {
      console.warn('[Onboarding] Failed to update profile:', err);
    }

    onComplete();
  }, [isCompleting, updateProfile, onComplete]);

  // ── Helpers ──

  const currentStepIndex = ALL_STEPS.indexOf(step);
  const allPermissionsHandled = permissions.every(p => p.granted !== null);

  // ── Render ──

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Ambient glow orbs */}
      <Animated.View
        entering={FadeIn.duration(2000)}
        style={[styles.ambientOrb, styles.ambientOrb1]}
      />
      <Animated.View
        entering={FadeIn.duration(2000).delay(500)}
        style={[styles.ambientOrb, styles.ambientOrb2]}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Progress dots */}
        <View style={styles.progressRow}>
          {ALL_STEPS.map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                step === s && styles.progressDotActive,
                currentStepIndex > i && styles.progressDotDone,
              ]}
            />
          ))}
        </View>

        {/* ── Step 1: Welcome ── */}
        {step === 'welcome' && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.stepContainer}>
            <Animated.View style={[styles.orbContainer, orbAnimatedStyle]}>
              <LinearGradient
                colors={['#7C3AED', '#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.orb}
              >
                <Ionicons name="sparkles" size={40} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>

            <Animated.Text entering={FadeInDown.duration(600).delay(200)} style={styles.title}>
              Hi, I'm MYPA
            </Animated.Text>
            <Animated.Text entering={FadeInDown.duration(600).delay(400)} style={styles.subtitle}>
              Your voice-first AI productivity assistant.{'\n'}Let's get you set up — it'll take a minute.
            </Animated.Text>

            <Animated.View entering={FadeInUp.duration(600).delay(600)} style={styles.timezoneCard}>
              <View style={styles.timezoneIconWrap}>
                <Ionicons name="globe-outline" size={20} color="#A78BFA" />
              </View>
              <View style={styles.timezoneTextContainer}>
                <Text style={styles.timezoneLabel}>Your timezone</Text>
                <Text style={styles.timezoneValue}>{timezone || 'Detecting...'}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color="#34D399" />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(600).delay(800)} style={{ width: '100%' }}>
              <TouchableOpacity onPress={handleWelcomeContinue} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#7C3AED', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        {/* ── Step 2: Language ── */}
        {step === 'language' && (
          <Animated.View entering={SlideInRight.duration(400)} style={styles.stepContainer}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.permIconWrap}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.permIconCircle}
              >
                <Ionicons name="language" size={32} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>

            <Animated.Text entering={FadeInDown.duration(400).delay(100)} style={styles.title}>
              Choose Your Language
            </Animated.Text>
            <Animated.Text entering={FadeInDown.duration(400).delay(200)} style={styles.subtitle}>
              MYPA will speak and understand{"\n"}in your preferred language.
            </Animated.Text>

            <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.langListWrap}>
              <ScrollView
                style={styles.langScroll}
                contentContainerStyle={styles.langScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage.code === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.langCard,
                        isSelected && styles.langCardSelected,
                      ]}
                      onPress={() => {
                        setSelectedLanguage(lang);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.langFlag}>{lang.flag}</Text>
                      <View style={styles.langTextWrap}>
                        <Text style={[
                          styles.langName,
                          isSelected && styles.langNameSelected,
                        ]}>{lang.name}</Text>
                        <Text style={styles.langNative}>{lang.nativeName}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color="#34D399" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400).delay(500)} style={{ width: '100%' }}>
              <TouchableOpacity onPress={handleLanguageContinue} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#7C3AED', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        {/* ── Step 3: Permissions ── */}
        {step === 'permissions' && (
          <Animated.View entering={SlideInRight.duration(400)} style={styles.stepContainer}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.permIconWrap}>
              <LinearGradient
                colors={['#7C3AED', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.permIconCircle}
              >
                <Ionicons name="lock-open" size={32} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>

            <Animated.Text entering={FadeInDown.duration(400).delay(100)} style={styles.title}>
              Enable Superpowers
            </Animated.Text>
            <Animated.Text entering={FadeInDown.duration(400).delay(200)} style={styles.subtitle}>
              MYPA works best with these permissions.{'\n'}You can change them anytime in Settings.
            </Animated.Text>

            {/* Permission cards */}
            <View style={styles.permList}>
              {permissions.map((perm, idx) => (
                <Animated.View
                  key={perm.key}
                  entering={FadeInUp.duration(400).delay(300 + idx * 120)}
                >
                  <View style={[
                    styles.permCard,
                    perm.granted === true && styles.permCardGranted,
                    perm.granted === false && styles.permCardDenied,
                  ]}>
                    <View style={styles.permCardLeft}>
                      <View style={[
                        styles.permIconSmall,
                        perm.granted === true && styles.permIconSmallGranted,
                      ]}>
                        <Ionicons
                          name={perm.granted === true ? 'checkmark' : (perm.icon as any)}
                          size={18}
                          color={perm.granted === true ? '#34D399' : '#A78BFA'}
                        />
                      </View>
                      <View style={styles.permCardTextWrap}>
                        <Text style={styles.permCardTitle}>{perm.title}</Text>
                        <Text style={styles.permCardDesc}>{perm.description}</Text>
                      </View>
                    </View>

                    {perm.granted === null && (
                      <TouchableOpacity
                        style={styles.permAllowBtn}
                        onPress={() => handleRequestPermission(perm.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.permAllowBtnText}>Allow</Text>
                      </TouchableOpacity>
                    )}
                    {perm.granted === true && (
                      <Ionicons name="checkmark-circle" size={22} color="#34D399" />
                    )}
                    {perm.granted === false && (
                      <Text style={styles.permDeniedText}>Skipped</Text>
                    )}
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Action buttons */}
            <View style={styles.permActions}>
              {!allPermissionsHandled && (
                <Animated.View entering={FadeInUp.duration(400).delay(700)} style={{ width: '100%' }}>
                  <TouchableOpacity onPress={handleAllowAll} activeOpacity={0.85}>
                    <LinearGradient
                      colors={['#7C3AED', '#6366F1']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryBtn}
                    >
                      <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                      <Text style={[styles.primaryBtnText, { marginLeft: 8 }]}>Allow All</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}

              <TouchableOpacity
                style={styles.permContinueBtn}
                onPress={handlePermissionsContinue}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.primaryBtnText,
                  { color: allPermissionsHandled ? '#FFFFFF' : 'rgba(255,255,255,0.5)' },
                ]}>
                  {allPermissionsHandled ? 'Continue' : 'Skip for now'}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={allPermissionsHandled ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── Step 3: Voice Intro ── */}
        {step === 'voice_intro' && (
          <Animated.View entering={SlideInRight.duration(400)} style={styles.stepContainer}>
            <Animated.View style={[styles.orbContainer, orbAnimatedStyle]}>
              <LinearGradient
                colors={isGreetingPlaying || voiceState === 'speaking'
                  ? ['#34D399', '#10B981']
                  : ['#7C3AED', '#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.orb, isGreetingPlaying && { transform: [{ scale: 1 + audioLevel * 0.3 }] }]}
              >
                <Ionicons
                  name={isGreetingPlaying || voiceState === 'speaking' ? 'volume-high' : 'mic'}
                  size={40}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.title}>Meet Your Assistant</Text>
            <Text style={styles.subtitle}>
              MYPA uses AI to understand you naturally.{'\n'}Tap below to hear your first greeting.
            </Text>

            {greetingText ? (
              <Animated.View entering={FadeIn.duration(400)} style={styles.transcriptCard}>
                <Text style={styles.transcriptText}>{greetingText}</Text>
              </Animated.View>
            ) : null}

            {!isGreetingPlaying && !greetingText && (
              <TouchableOpacity onPress={handleVoiceIntro} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#7C3AED', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Ionicons name="play" size={20} color="#FFFFFF" />
                  <Text style={[styles.primaryBtnText, { marginLeft: 8 }]}>Play Greeting</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {greetingText && !isGreetingPlaying && step === 'voice_intro' && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <TouchableOpacity onPress={() => setStep('first_command')} activeOpacity={0.85}>
                  <LinearGradient
                    colors={['#7C3AED', '#6366F1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryBtnText}>Next</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* ── Step 4: First Command ── */}
        {step === 'first_command' && (
          <Animated.View entering={SlideInRight.duration(400)} style={styles.stepContainer}>
            {!firstCommandDone ? (
              <>
                <Animated.View style={[styles.orbContainer, orbAnimatedStyle]}>
                  <TouchableOpacity
                    onPress={isConversationActive ? endConversation : handleFirstCommand}
                    activeOpacity={0.85}
                    disabled={isCreatingTask}
                  >
                    <LinearGradient
                      colors={
                        isConversationActive
                          ? voiceState === 'listening'
                            ? ['#34D399', '#10B981']
                            : voiceState === 'speaking'
                            ? ['#6366F1', '#818CF8']
                            : ['#F59E0B', '#D97706']
                          : isCreatingTask
                          ? ['#F59E0B', '#D97706']
                          : ['#7C3AED', '#6366F1', '#8B5CF6']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.orb,
                        isConversationActive && {
                          transform: [{ scale: 1 + audioLevel * 0.3 }],
                        },
                      ]}
                    >
                      {isCreatingTask && !isConversationActive ? (
                        <ActivityIndicator color="#FFFFFF" size="large" />
                      ) : isConversationActive ? (
                        <Ionicons
                          name={voiceState === 'listening' ? 'mic' : voiceState === 'speaking' ? 'volume-high' : 'radio'}
                          size={40}
                          color="#FFFFFF"
                        />
                      ) : (
                        <Ionicons name="mic" size={40} color="#FFFFFF" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <Text style={styles.title}>
                  {isConversationActive ? 'Listening...' : 'Try Your First Command'}
                </Text>
                <Text style={styles.subtitle}>
                  {isConversationActive
                    ? 'Say something like "Add buy groceries tomorrow"'
                    : 'Tap the orb to start talking to MYPA.'}
                </Text>

                {/* Live transcript */}
                {isConversationActive && transcript ? (
                  <Animated.View entering={FadeIn.duration(300)} style={styles.transcriptCard}>
                    <Text style={styles.transcriptLabel}>You said:</Text>
                    <Text style={styles.transcriptText}>{transcript}</Text>
                  </Animated.View>
                ) : null}

                {/* AI response */}
                {isConversationActive && aiResponse ? (
                  <Animated.View entering={FadeIn.duration(300)} style={styles.transcriptCard}>
                    <Text style={[styles.transcriptLabel, { color: '#34D399' }]}>MYPA:</Text>
                    <Text style={styles.transcriptText}>{aiResponse}</Text>
                  </Animated.View>
                ) : null}

                {!isConversationActive && (
                  <View style={styles.exampleCard}>
                    <Ionicons name="chatbubble-outline" size={18} color="#A78BFA" />
                    <Text style={styles.exampleText}>"Add buy groceries tomorrow"</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    if (isConversationActive) endConversation();
                    setFirstCommandDone(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryBtnText}>Skip for now</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Animated.View entering={FadeIn.duration(400)} style={styles.successContainer}>
                  <LinearGradient
                    colors={['#34D399', '#10B981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.successOrb}
                  >
                    <Ionicons name="checkmark" size={48} color="#FFFFFF" />
                  </LinearGradient>
                  <Animated.Text entering={FadeInDown.duration(400).delay(200)} style={styles.title}>
                    You're All Set! 🎉
                  </Animated.Text>
                  <Animated.Text entering={FadeInDown.duration(400).delay(400)} style={styles.subtitle}>
                    MYPA is ready to help you stay productive.{'\n'}Swipe around to explore.
                  </Animated.Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.duration(400).delay(600)} style={{ width: '100%' }}>
                  <TouchableOpacity
                    onPress={handleComplete}
                    activeOpacity={0.85}
                    disabled={isCompleting}
                  >
                    <LinearGradient
                      colors={['#7C3AED', '#6366F1']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryBtn}
                    >
                      {isCompleting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryBtnText}>Get Started</Text>
                          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08081A',
  },
  safeArea: {
    flex: 1,
  },

  // Ambient glow orbs
  ambientOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  ambientOrb1: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    top: -60,
    right: -80,
  },
  ambientOrb2: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    bottom: 40,
    left: -60,
  },

  // Progress dots
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressDotActive: {
    width: 28,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
  },
  progressDotDone: {
    backgroundColor: '#A78BFA',
  },

  // Step container
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  // Orb
  orbContainer: {
    marginBottom: 32,
  },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },

  // Typography
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },

  // Timezone card
  timezoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  timezoneIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timezoneTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  timezoneLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timezoneValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 200,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    paddingVertical: 12,
    marginTop: 16,
  },
  secondaryBtnText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },

  // Permission step
  permIconWrap: {
    marginBottom: 24,
  },
  permIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  permList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  permCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  permCardGranted: {
    borderColor: 'rgba(52, 211, 153, 0.3)',
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
  },
  permCardDenied: {
    borderColor: 'rgba(255,255,255,0.06)',
    opacity: 0.7,
  },
  permCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permIconSmallGranted: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  permCardTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  permCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  permCardDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
    lineHeight: 16,
  },
  permAllowBtn: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  permAllowBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A78BFA',
  },
  permDeniedText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
  },
  permActions: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  permContinueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },

  // Transcript card
  transcriptCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  transcriptText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 24,
    textAlign: 'center',
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A78BFA',
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Example card
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
  },
  exampleText: {
    fontSize: 15,
    color: '#C4B5FD',
    fontStyle: 'italic',
  },

  // Language selection
  langListWrap: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.35,
    marginBottom: 20,
  },
  langScroll: {
    flex: 1,
  },
  langScrollContent: {
    gap: 8,
    paddingBottom: 4,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  langCardSelected: {
    borderColor: 'rgba(124, 58, 237, 0.5)',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  langFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  langTextWrap: {
    flex: 1,
  },
  langName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  langNameSelected: {
    color: '#C4B5FD',
  },
  langNative: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },

  // Success
  successContainer: {
    alignItems: 'center',
  },
  successOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
});
