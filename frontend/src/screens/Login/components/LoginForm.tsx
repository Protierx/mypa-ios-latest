import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface LoginFormProps {
  isLogin: boolean;
  email: string;
  password: string;
  name: string;
  isLoading: boolean;
  showPassword: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: () => void;
  onSwitchMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  isLogin,
  email,
  password,
  name,
  isLoading,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onNameChange,
  onTogglePassword,
  onSubmit,
  onSwitchMode,
}) => (
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
          onChangeText={onNameChange}
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
        onChangeText={onEmailChange}
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
        onChangeText={onPasswordChange}
        secureTextEntry={!showPassword}
      />
      <TouchableOpacity onPress={onTogglePassword}>
        <Ionicons
          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color="#94A3B8"
        />
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
      onPress={onSubmit}
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

    <TouchableOpacity style={styles.switchButton} onPress={onSwitchMode}>
      <Text style={styles.switchButtonText}>
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <Text style={styles.switchButtonHighlight}>
          {isLogin ? 'Sign Up' : 'Sign In'}
        </Text>
      </Text>
    </TouchableOpacity>
  </View>
);
