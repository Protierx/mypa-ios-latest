/**
 * Login Screen
 * Simple login/register flow for testing
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../styles/colors';

export function LoginScreen() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const result = isLogin 
        ? await login(email.trim(), password)
        : await register(email.trim(), password, name.trim());

      if (!result.success) {
        Alert.alert('Error', result.error || 'Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (testEmail: string) => {
    setIsLoading(true);
    try {
      const result = await login(testEmail, 'Test123!');
      if (!result.success) {
        // Try to register instead
        const registerResult = await register(testEmail, 'Test123!', testEmail.split('@')[0]);
        if (!registerResult.success) {
          Alert.alert('Error', registerResult.error || 'Failed to create test account');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#F8F7FF', '#F0EBFF', '#E8E0FF']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Orb */}
          <View style={styles.logoContainer}>
            <View style={styles.orbGlow} />
            <Image
              source={require('../../assets/mypa-orb.png')}
              style={styles.orb}
              resizeMode="contain"
            />
            <Text style={styles.title}>MYPA</Text>
            <Text style={styles.subtitle}>Your AI Life Assistant</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your Name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color="#94A3B8" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchButtonText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchButtonHighlight}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Test Accounts */}
          <View style={styles.testAccounts}>
            <Text style={styles.testTitle}>Quick Test Accounts</Text>
            <View style={styles.testButtons}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleQuickLogin('alice@mypa.app')}
              >
                <Text style={styles.testButtonText}>Alice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleQuickLogin('bob@mypa.app')}
              >
                <Text style={styles.testButtonText}>Bob</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleQuickLogin('charlie@mypa.app')}
              >
                <Text style={styles.testButtonText}>Charlie</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.testHint}>Tap to login or create test account</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  orbGlow: {
    position: 'absolute',
    top: 10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  orb: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E1B4B',
    marginTop: 16,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1E1B4B',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchButtonHighlight: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  testAccounts: {
    marginTop: 32,
    alignItems: 'center',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  testButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  testButtonText: {
    color: '#8B5CF6',
    fontWeight: '600',
    fontSize: 14,
  },
  testHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
});
