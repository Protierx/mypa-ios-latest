/**
 * Onboarding Screen — 3-step first-run experience
 *
 * Step 1: Welcome — "Hi, I'm MYPA" animation + timezone auto-detect
 * Step 2: Voice intro — AI greeting via TTS
 * Step 3: First command — user taps orb → speaks → task created → confetti
 *
 * Total target: ~45 seconds
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
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useVoice } from '../../contexts/VoiceContext';
import { eventLogger } from '../../services/eventLogger';
import { brand, text as textTokens, bg, semantic, border as borderTokens } from '../../styles/colors';
import { shadows, radius } from '../../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type OnboardingStep = 'welcome' | 'voice_intro' | 'first_command';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { user, updateProfile } = useSupabaseAuth();
  const voice = useVoice();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [timezone, setTimezone] = useState('');
  const [isGreetingPlaying, setIsGreetingPlaying] = useState(false);
  const [greetingText, setGreetingText] = useState('');
  const [firstCommandDone, setFirstCommandDone] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const startTimeRef = useRef(Date.now());

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

  // ── Step handlers ──

  const handleWelcomeContinue = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Save timezone to profile
    if (timezone && user) {
      await updateProfile({ timezone } as any).catch(() => {});
    }
    setStep('voice_intro');
  }, [timezone, user, updateProfile]);

  const handleVoiceIntro = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGreetingPlaying(true);
    const name = user?.name || 'there';
    const greeting = `Hi ${name}! I'm MYPA, your personal AI assistant. I can help you manage tasks, set focus sessions, and keep you on track — all with your voice. Let's try it out!`;
    setGreetingText(greeting);

    try {
      await voice.speak(greeting);
    } catch {
      // TTS failed — that's fine, show text
    }
    setIsGreetingPlaying(false);
    // Auto-advance after greeting
    setTimeout(() => setStep('first_command'), 500);
  }, [user, voice]);

  const handleFirstCommand = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Submit a sample text command
    try {
      await voice.submitText('Add buy groceries tomorrow');
      setFirstCommandDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Even if it fails, let them proceed
      setFirstCommandDone(true);
    }
  }, [voice]);

  const handleComplete = useCallback(async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const durationMs = Date.now() - startTimeRef.current;
    eventLogger.log('onboarding_completed', { duration_ms: durationMs });

    // Mark onboarding complete in profile
    try {
      await updateProfile({ onboarding_completed: true });
    } catch (err) {
      console.warn('[Onboarding] Failed to update profile:', err);
    }

    onComplete();
  }, [isCompleting, updateProfile, onComplete]);

  // ── Render ──

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Progress dots */}
        <View style={styles.progressRow}>
          {(['welcome', 'voice_intro', 'first_command'] as OnboardingStep[]).map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                step === s && styles.progressDotActive,
                (['welcome', 'voice_intro', 'first_command'].indexOf(step) > i) && styles.progressDotDone,
              ]}
            />
          ))}
        </View>

        {/* ── Step 1: Welcome ── */}
        {step === 'welcome' && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.stepContainer}>
            {/* Animated orb */}
            <Animated.View style={[styles.orbContainer, orbAnimatedStyle]}>
              <View style={styles.orb}>
                <Ionicons name="sparkles" size={40} color="#FFFFFF" />
              </View>
            </Animated.View>

            <Animated.Text entering={FadeInDown.duration(600).delay(200)} style={styles.title}>
              Hi, I'm MYPA
            </Animated.Text>
            <Animated.Text entering={FadeInDown.duration(600).delay(400)} style={styles.subtitle}>
              Your voice-first AI productivity assistant.{'\n'}Let's get you set up — it'll take 30 seconds.
            </Animated.Text>

            {/* Timezone detection */}
            <Animated.View entering={FadeInUp.duration(600).delay(600)} style={styles.timezoneCard}>
              <Ionicons name="globe-outline" size={22} color={brand.primary} />
              <View style={styles.timezoneTextContainer}>
                <Text style={styles.timezoneLabel}>Your timezone</Text>
                <Text style={styles.timezoneValue}>{timezone || 'Detecting...'}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color={semantic.success} />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(600).delay(800)}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleWelcomeContinue} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        {/* ── Step 2: Voice Intro ── */}
        {step === 'voice_intro' && (
          <Animated.View entering={SlideInRight.duration(400)} style={styles.stepContainer}>
            <Animated.View style={[styles.orbContainer, orbAnimatedStyle]}>
              <View style={[styles.orb, isGreetingPlaying && styles.orbActive]}>
                <Ionicons name={isGreetingPlaying ? 'volume-high' : 'mic'} size={40} color="#FFFFFF" />
              </View>
            </Animated.View>

            <Text style={styles.title}>Meet Your Assistant</Text>
            <Text style={styles.subtitle}>
              MYPA understands natural language.{'\n'}Tap below to hear your first greeting.
            </Text>

            {greetingText ? (
              <Animated.View entering={FadeIn.duration(400)} style={styles.transcriptCard}>
                <Text style={styles.transcriptText}>{greetingText}</Text>
              </Animated.View>
            ) : null}

            {!isGreetingPlaying && !greetingText && (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleVoiceIntro} activeOpacity={0.8}>
                <Ionicons name="play" size={20} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Play Greeting</Text>
              </TouchableOpacity>
            )}

            {greetingText && !isGreetingPlaying && step === 'voice_intro' && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => setStep('first_command')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryBtnText}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* ── Step 3: First Command ── */}
        {step === 'first_command' && (
          <Animated.View entering={SlideInRight.duration(400)} style={styles.stepContainer}>
            {!firstCommandDone ? (
              <>
                <Animated.View style={[styles.orbContainer, orbAnimatedStyle]}>
                  <TouchableOpacity style={styles.orb} onPress={handleFirstCommand} activeOpacity={0.85}>
                    <Ionicons name="mic" size={40} color="#FFFFFF" />
                  </TouchableOpacity>
                </Animated.View>

                <Text style={styles.title}>Try Your First Command</Text>
                <Text style={styles.subtitle}>
                  Tap the orb above and we'll add a sample task for you.
                </Text>

                <View style={styles.exampleCard}>
                  <Ionicons name="chatbubble-outline" size={18} color={brand.primary} />
                  <Text style={styles.exampleText}>"Add buy groceries tomorrow"</Text>
                </View>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
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
                  <View style={styles.successOrb}>
                    <Ionicons name="checkmark" size={48} color="#FFFFFF" />
                  </View>
                  <Animated.Text entering={FadeInDown.duration(400).delay(200)} style={styles.title}>
                    You're All Set! 🎉
                  </Animated.Text>
                  <Animated.Text entering={FadeInDown.duration(400).delay(400)} style={styles.subtitle}>
                    MYPA is ready to help. Talk, type, or swipe to explore.
                  </Animated.Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.duration(400).delay(600)}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleComplete}
                    activeOpacity={0.8}
                    disabled={isCompleting}
                  >
                    {isCompleting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Get Started</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                      </>
                    )}
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
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: brand.primary,
  },
  progressDotDone: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // Step container
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Orb
  orbContainer: {
    marginBottom: 32,
  },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.purple,
  },
  orbActive: {
    backgroundColor: semantic.success,
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
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },

  // Timezone card
  timezoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timezoneTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  timezoneLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
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
    backgroundColor: brand.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 200,
    ...shadows.purple,
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
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },

  // Transcript card
  transcriptCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  transcriptText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
    textAlign: 'center',
  },

  // Example card
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 16,
  },
  exampleText: {
    fontSize: 15,
    color: brand.tertiary,
    fontStyle: 'italic',
  },

  // Success
  successContainer: {
    alignItems: 'center',
  },
  successOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
});
