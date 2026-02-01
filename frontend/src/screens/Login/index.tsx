/**
 * Login Screen
 * Simple login/register flow for testing
 */
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TEST_ACCOUNTS } from './constants';
import { styles } from './styles';
import { Logo, LoginForm, TestAccounts } from './components';
import { useLoginData } from './hooks';

export function LoginScreen() {
  const {
    isLogin,
    email,
    password,
    name,
    isLoading,
    showPassword,
    setEmail,
    setPassword,
    setName,
    handleSubmit,
    handleQuickLogin,
    toggleMode,
    togglePassword,
  } = useLoginData();

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
          <Logo />

          <LoginForm
            isLogin={isLogin}
            email={email}
            password={password}
            name={name}
            isLoading={isLoading}
            showPassword={showPassword}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onNameChange={setName}
            onTogglePassword={togglePassword}
            onSubmit={handleSubmit}
            onSwitchMode={toggleMode}
          />

          <TestAccounts accounts={TEST_ACCOUNTS} onQuickLogin={handleQuickLogin} />
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

export default LoginScreen;
