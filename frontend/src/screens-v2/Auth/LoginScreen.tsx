/**
 * Login Screen v2
 * NativeWind styling + Supabase Auth
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
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

export function LoginScreenV2() {
  const { signIn, signUp, signInWithApple, isLoading: authLoading } = useSupabaseAuth();
  
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
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, name, isLogin, signIn, signUp]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await signInWithApple();
      if (!result.success && result.error && result.error !== 'Sign in was cancelled') {
        Alert.alert('Error', result.error);
      }
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        Alert.alert('Error', error.message || 'Apple Sign-In failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, [signInWithApple]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
  };

  const loading = isLoading || authLoading;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#111111']}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Brand */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 rounded-full bg-purple-600/20 items-center justify-center mb-4">
              <Text className="text-4xl">✨</Text>
            </View>
            <Text className="text-white text-3xl font-bold">MYPA</Text>
            <Text className="text-zinc-400 text-base mt-1">Your AI Productivity Partner</Text>
          </View>

          {/* Form Card */}
          <View className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800">
            <Text className="text-white text-2xl font-semibold text-center mb-6">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>

            {/* Name Input (Sign Up only) */}
            {!isLogin && (
              <View className="mb-4">
                <View className={`flex-row items-center bg-zinc-800 rounded-xl px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-zinc-700'}`}>
                  <Ionicons name="person-outline" size={20} color="#a855f7" />
                  <TextInput
                    className="flex-1 text-white text-base ml-3"
                    placeholder="Your Name"
                    placeholderTextColor="#71717a"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
                {errors.name && (
                  <Text className="text-red-500 text-sm mt-1 ml-1">{errors.name}</Text>
                )}
              </View>
            )}

            {/* Email Input */}
            <View className="mb-4">
              <View className={`flex-row items-center bg-zinc-800 rounded-xl px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-zinc-700'}`}>
                <Ionicons name="mail-outline" size={20} color="#a855f7" />
                <TextInput
                  className="flex-1 text-white text-base ml-3"
                  placeholder="Email"
                  placeholderTextColor="#71717a"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
              {errors.email && (
                <Text className="text-red-500 text-sm mt-1 ml-1">{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <View className={`flex-row items-center bg-zinc-800 rounded-xl px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-zinc-700'}`}>
                <Ionicons name="lock-closed-outline" size={20} color="#a855f7" />
                <TextInput
                  className="flex-1 text-white text-base ml-3"
                  placeholder="Password"
                  placeholderTextColor="#71717a"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#71717a"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="text-red-500 text-sm mt-1 ml-1">{errors.password}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`bg-purple-600 rounded-xl py-4 items-center ${loading ? 'opacity-60' : ''}`}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-lg font-semibold">
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-zinc-700" />
              <Text className="text-zinc-500 mx-4">or</Text>
              <View className="flex-1 h-px bg-zinc-700" />
            </View>

            {/* Apple Sign In */}
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={12}
              style={{ width: '100%', height: 50 }}
              onPress={handleAppleSignIn}
            />

            {/* Toggle Mode */}
            <TouchableOpacity className="mt-6" onPress={toggleMode}>
              <Text className="text-zinc-400 text-center">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text className="text-purple-400 font-semibold">
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text className="text-zinc-600 text-center text-xs mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

export default LoginScreenV2;
