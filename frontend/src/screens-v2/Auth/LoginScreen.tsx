/**
 * Login Screen v2
 * MYPA design spec: dark theme, brand purple, surface/ink tokens.
 * Welcome: MYPA + "My Personal AI" → Continue with Apple → "I have an account" (email/password).
 */
import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Haptics from 'expo-haptics';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

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

  const toggleEmailForm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowEmailForm(!showEmailForm);
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
      className="flex-1 bg-black"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0A0A1A', '#1A1030', '#0D1B2A', '#000000']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo & Brand */}
            <View className="items-center mb-10">
              <View className="w-24 h-24 rounded-full bg-brand-purple/20 border-2 border-brand-purple/40 items-center justify-center mb-5">
                <Text className="text-5xl font-bold text-brand-purple">M</Text>
              </View>
              <Text className="text-title-1 font-bold text-ink-primary">MYPA</Text>
              <Text className="text-body text-ink-secondary mt-1">My Personal AI</Text>
            </View>

            {!showEmailForm ? (
              <>
                {/* Continue with Apple */}
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={12}
                  style={{ width: '100%', height: 52, marginBottom: 12 }}
                  onPress={handleAppleSignIn}
                  disabled={loading}
                />

                {/* Secondary: I have an account */}
                <TouchableOpacity
                  className="py-4 items-center"
                  onPress={toggleEmailForm}
                  activeOpacity={0.7}
                >
                  <Text className="text-footnote text-ink-tertiary">
                    I have an account
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Email / Password form */
              <View className="bg-surface-2 rounded-xl p-6 border border-surface-4">
                <Text className="text-title-2 font-bold text-ink-primary text-center mb-6">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </Text>

                {!isLogin && (
                  <View className="mb-4">
                    <View className={`flex-row items-center bg-surface-3 rounded-lg px-4 py-3 border ${errors.name ? 'border-error' : 'border-surface-4'}`}>
                      <Ionicons name="person-outline" size={20} color="#7C3AED" />
                      <TextInput
                        className="flex-1 text-body text-ink-primary ml-3"
                        placeholder="Your Name"
                        placeholderTextColor="#71717A"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                    </View>
                    {errors.name && (
                      <Text className="text-error text-footnote mt-1 ml-1">{errors.name}</Text>
                    )}
                  </View>
                )}

                <View className="mb-4">
                  <View className={`flex-row items-center bg-surface-3 rounded-lg px-4 py-3 border ${errors.email ? 'border-error' : 'border-surface-4'}`}>
                    <Ionicons name="mail-outline" size={20} color="#7C3AED" />
                    <TextInput
                      className="flex-1 text-body text-ink-primary ml-3"
                      placeholder="Email"
                      placeholderTextColor="#71717A"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>
                  {errors.email && (
                    <Text className="text-error text-footnote mt-1 ml-1">{errors.email}</Text>
                  )}
                </View>

                <View className="mb-6">
                  <View className={`flex-row items-center bg-surface-3 rounded-lg px-4 py-3 border ${errors.password ? 'border-error' : 'border-surface-4'}`}>
                    <Ionicons name="lock-closed-outline" size={20} color="#7C3AED" />
                    <TextInput
                      className="flex-1 text-body text-ink-primary ml-3"
                      placeholder="Password"
                      placeholderTextColor="#71717A"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#71717A"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Text className="text-error text-footnote mt-1 ml-1">{errors.password}</Text>
                  )}
                </View>

                <TouchableOpacity
                  className={`bg-brand-purple rounded-lg py-4 items-center ${loading ? 'opacity-60' : ''}`}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-headline font-semibold text-ink-primary">
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </Text>
                  )}
                </TouchableOpacity>

                <View className="flex-row items-center my-5">
                  <View className="flex-1 h-px bg-surface-4" />
                  <Text className="text-footnote text-ink-tertiary mx-4">or</Text>
                  <View className="flex-1 h-px bg-surface-4" />
                </View>

                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={12}
                  style={{ width: '100%', height: 50 }}
                  onPress={handleAppleSignIn}
                  disabled={loading}
                />

                <TouchableOpacity className="mt-5" onPress={toggleMode}>
                  <Text className="text-body text-ink-secondary text-center">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <Text className="text-brand-secondary font-semibold">
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity className="mt-4 py-2 items-center" onPress={toggleEmailForm}>
                  <Text className="text-footnote text-ink-tertiary">Back</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text className="text-caption-2 text-ink-disabled text-center mt-8 px-4">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

export default LoginScreenV2;
