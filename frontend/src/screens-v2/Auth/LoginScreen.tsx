/**
 * Login Screen — Opal-inspired dark immersive welcome
 *
 * Two-section layout: hero with breathing orb + rotating value props,
 * CTA section with Apple Sign In + email text link.
 * Email form enters as a bottom sheet with SlideInDown animation.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeOut,
  SlideInDown,
  runOnJS,
} from 'react-native-reanimated';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

// ── Opal-inspired palette (shared with FocusModal) ──────────
const O = {
  bgDeep:      '#0A0A0F',
  gradientA:   '#0A0A0F',
  gradientB:   '#1A0B2E',
  gradientC:   '#0F1B3D',
  gradientD:   '#0A0A0F',

  glowViolet:  'rgba(74, 173, 161, 0.30)',
  glowIndigo:  'rgba(45, 138, 126, 0.22)',

  cardBg:      'rgba(255, 255, 255, 0.05)',
  cardBorder:  'rgba(255, 255, 255, 0.10)',
  inputBg:     'rgba(255, 255, 255, 0.07)',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
  inputFocus:  'rgba(74, 173, 161, 0.40)',

  ringStart:   '#8ED8CE',
  ringMid:     '#4AADA1',
  ringEnd:     '#2D8A7E',

  textPrimary:   '#F8F8FF',
  textSecondary: '#A0A0B8',
  textMuted:     '#6B6B80',
  textAccent:    '#8ED8CE',
  textPlaceholder: '#55556A',

  error:       '#F87171',
  errorBg:     'rgba(248, 113, 113, 0.12)',

  divider:     'rgba(255, 255, 255, 0.08)',
} as const;

const { width: SW, height: SH } = Dimensions.get('window');

const VALUE_PROPS = [
  'Your voice-first AI assistant',
  'Manage tasks by just speaking',
  'Stay focused, stay productive',
];

export function LoginScreenV2() {
  const { signIn, signUp, signInWithApple, isLoading: authLoading } = useSupabaseAuth();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  // ── Rotating value props ────────────────────────────────
  const [valuePropIndex, setValuePropIndex] = useState(0);
  const valuePropOpacity = useSharedValue(1);
  const valuePropTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (showEmailForm) {
      if (valuePropTimer.current) clearInterval(valuePropTimer.current);
      return;
    }

    valuePropTimer.current = setInterval(() => {
      // Fade out
      valuePropOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(setValuePropIndex)((prev: number) => (prev + 1) % VALUE_PROPS.length);
          // Fade in after swap
          valuePropOpacity.value = withTiming(1, { duration: 300 });
        }
      });
    }, 3000);

    return () => {
      if (valuePropTimer.current) clearInterval(valuePropTimer.current);
    };
  }, [showEmailForm]);

  const valuePropAnimStyle = useAnimatedStyle(() => ({
    opacity: valuePropOpacity.value,
  }));

  // ── Breathing orb animation ─────────────────────────────
  const orbScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const ambientRotate = useSharedValue(0);

  useEffect(() => {
    // Orb breathing pulse
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    ambientRotate.value = withRepeat(
      withTiming(360, { duration: 40000, easing: Easing.linear }),
      -1,
      false
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.25, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const orbBreathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const ambientStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ambientRotate.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // ── Validation ────────────────────────────────────────────
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!isLogin && !name.trim()) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Handlers ──────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const result = isLogin
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, name.trim());
      if (!result.success && result.error) {
        Alert.alert('Error', result.error);
      }
    } catch (error: unknown) {
      Alert.alert('Error', (error as Error).message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, name, isLogin, signIn, signUp]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsLoading(true);
      const result = await signInWithApple();
      if (!result.success && result.error && result.error !== 'Sign in was cancelled') {
        Alert.alert('Error', result.error);
      }
    } catch (error: unknown) {
      if ((error as { code?: string })?.code !== 'ERR_CANCELED') {
        Alert.alert('Error', (error as Error).message || 'Apple Sign-In failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, [signInWithApple]);

  const openEmailForm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowEmailForm(true);
    setErrors({});
  };

  const closeEmailForm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowEmailForm(false);
    setErrors({});
  };

  const toggleMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLogin(!isLogin);
    setErrors({});
  };

  const loading = isLoading || authLoading;

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Gradient background ──────────────────────── */}
      <LinearGradient
        colors={[O.gradientA, O.gradientB, O.gradientC, O.gradientD]}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Ambient glow orbs ────────────────────────── */}
      <Animated.View style={[s.ambientOrbs, ambientStyle]} pointerEvents="none">
        <Animated.View style={[s.glowOrb, s.glowOrbA, glowStyle]} />
        <Animated.View style={[s.glowOrb, s.glowOrbB, glowStyle]} />
      </Animated.View>

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {!showEmailForm ? (
          /* ── Hero + CTA welcome view ─────────────────── */
          <View style={s.welcomeContainer}>
            {/* Hero section (top 60%) */}
            <Animated.View entering={FadeIn.duration(800)} style={s.heroSection}>
              {/* Breathing orb */}
              <Animated.View style={[s.orbContainer, orbBreathStyle]}>
                <View style={s.logoOuter}>
                  <LinearGradient
                    colors={[O.ringStart, O.ringMid, O.ringEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.logoGradientRing}
                  >
                    <View style={s.logoInner}>
                      <Text style={s.logoLetter}>M</Text>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>

              {/* Brand name */}
              <Animated.Text
                entering={FadeInDown.delay(200).duration(500)}
                style={s.brandName}
              >
                MYPA
              </Animated.Text>

              {/* Rotating value prop */}
              <Animated.Text style={[s.valueProp, valuePropAnimStyle]}>
                {VALUE_PROPS[valuePropIndex]}
              </Animated.Text>
            </Animated.View>

            {/* CTA section (bottom 40%) */}
            <Animated.View entering={FadeInUp.delay(400).duration(600)} style={s.ctaSection}>
              {/* Continue with Apple — primary CTA */}
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={16}
                style={s.appleButton}
                onPress={handleAppleSignIn}
                disabled={loading}
              />

              {/* Divider */}
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>or</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Email text link */}
              <TouchableOpacity
                onPress={openEmailForm}
                activeOpacity={0.6}
                hitSlop={12}
              >
                <Text style={s.emailTextLink}>Continue with Email</Text>
              </TouchableOpacity>

              {/* Legal */}
              <Text style={s.legal}>
                By continuing, you agree to our{' '}
                <Text style={s.legalLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={s.legalLink}>Privacy Policy</Text>
              </Text>
            </Animated.View>
          </View>
        ) : (
          /* ── Email form bottom sheet ─────────────────── */
          <ScrollView
            contentContainerStyle={s.formScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              entering={SlideInDown.springify().damping(18).stiffness(140)}
              style={s.formSheet}
            >
              {/* Back / dismiss chevron */}
              <TouchableOpacity style={s.backBtn} onPress={closeEmailForm}>
                <Ionicons name="chevron-down" size={24} color={O.textMuted} />
              </TouchableOpacity>

              <Text style={s.formTitle}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text style={s.formSubtitle}>
                {isLogin
                  ? 'Sign in to pick up where you left off'
                  : 'Set up your account in seconds'}
              </Text>

              {/* Name (sign-up only) */}
              {!isLogin && (
                <Animated.View entering={FadeInUp.duration(300)} style={s.fieldWrap}>
                  <View style={[s.inputRow, errors.name ? s.inputRowError : null]}>
                    <Ionicons name="person-outline" size={18} color={O.textAccent} />
                    <TextInput
                      style={s.input}
                      placeholder="Your Name"
                      placeholderTextColor={O.textPlaceholder}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.name && <Text style={s.errorText}>{errors.name}</Text>}
                </Animated.View>
              )}

              {/* Email */}
              <View style={s.fieldWrap}>
                <View style={[s.inputRow, errors.email ? s.inputRowError : null]}>
                  <Ionicons name="mail-outline" size={18} color={O.textAccent} />
                  <TextInput
                    style={s.input}
                    placeholder="Email"
                    placeholderTextColor={O.textPlaceholder}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>
                {errors.email && <Text style={s.errorText}>{errors.email}</Text>}
              </View>

              {/* Password */}
              <View style={s.fieldWrap}>
                <View style={[s.inputRow, errors.password ? s.inputRowError : null]}>
                  <Ionicons name="lock-closed-outline" size={18} color={O.textAccent} />
                  <TextInput
                    style={s.input}
                    placeholder="Password"
                    placeholderTextColor={O.textPlaceholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={O.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={s.errorText}>{errors.password}</Text>}
              </View>

              {/* Submit CTA */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
                style={[s.submitWrap, loading && { opacity: 0.6 }]}
              >
                <LinearGradient
                  colors={[O.ringStart, O.ringMid, O.ringEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.submitGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={s.submitText}>
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>or</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Apple in form */}
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={14}
                style={s.appleButtonSmall}
                onPress={handleAppleSignIn}
                disabled={loading}
              />

              {/* Toggle login / signup */}
              <TouchableOpacity style={s.toggleRow} onPress={toggleMode}>
                <Text style={s.toggleText}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <Text style={s.toggleAccent}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: O.bgDeep,
  },
  safe: {
    flex: 1,
  },

  // ── Ambient glow ────────────────────────────────
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
    width: SW * 0.85,
    height: SW * 0.85,
    backgroundColor: O.glowViolet,
    top: SH * 0.06,
    left: -SW * 0.25,
  },
  glowOrbB: {
    width: SW * 0.65,
    height: SW * 0.65,
    backgroundColor: O.glowIndigo,
    bottom: SH * 0.05,
    right: -SW * 0.15,
  },

  // ── Welcome two-section layout ──────────────────
  welcomeContainer: {
    flex: 1,
    paddingHorizontal: 28,
  },
  heroSection: {
    flex: 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSection: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },

  // ── Breathing orb ───────────────────────────────
  orbContainer: {
    marginBottom: 24,
  },
  logoOuter: {
    shadowColor: O.ringMid,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  logoGradientRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  logoInner: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: O.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 56,
    fontWeight: '700',
    color: O.textAccent,
    marginTop: -2,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '800',
    color: O.textPrimary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  valueProp: {
    fontSize: 16,
    color: O.textSecondary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // ── CTA section ─────────────────────────────────
  appleButton: {
    width: '100%',
    height: 54,
    marginBottom: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: O.divider,
  },
  dividerText: {
    color: O.textMuted,
    fontSize: 13,
    marginHorizontal: 14,
    fontWeight: '500',
  },
  emailTextLink: {
    color: O.textAccent,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Form bottom sheet ───────────────────────────
  formScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  formSheet: {
    backgroundColor: O.cardBg,
    borderWidth: 1,
    borderColor: O.cardBorder,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  backBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: O.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: 14,
    color: O.textMuted,
    textAlign: 'center',
    marginBottom: 28,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: O.inputBg,
    borderWidth: 1,
    borderColor: O.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  inputRowError: {
    borderColor: O.error,
    backgroundColor: O.errorBg,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: O.textPrimary,
    fontWeight: '500',
    padding: 0,
  },
  errorText: {
    color: O.error,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
  },

  // ── Submit ──────────────────────────────────────
  submitWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
    shadowColor: O.ringMid,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  submitGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  appleButtonSmall: {
    width: '100%',
    height: 50,
    marginBottom: 4,
  },

  // ── Toggle ──────────────────────────────────────
  toggleRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: O.textSecondary,
    textAlign: 'center',
  },
  toggleAccent: {
    color: O.textAccent,
    fontWeight: '700',
  },

  // ── Legal ───────────────────────────────────────
  legal: {
    fontSize: 11,
    color: O.textMuted,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 15,
    paddingHorizontal: 8,
  },
  legalLink: {
    color: O.textAccent,
    fontWeight: '600',
  },
});

export default LoginScreenV2;
