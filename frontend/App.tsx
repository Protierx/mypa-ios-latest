/**
 * MYPA App - Voice-First AI Productivity Assistant
 * 
 * New Gesture-Based Architecture (v2)
 * - AI Hub at center
 * - Swipe left → Tasks
 * - Swipe right → Social
 * - Swipe down → Profile
 * - Swipe up → Focus
 */

import './src/global.css';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, StatusBar, Image, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// LiveKit WebRTC globals — must be called before any ElevenLabs/LiveKit usage
import { registerGlobals } from '@livekit/react-native';
registerGlobals();

// Safe Area
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Contexts
import { SupabaseAuthProvider, useSupabaseAuth } from './src/contexts/SupabaseAuthContext';
import { VoiceProvider } from './src/contexts/VoiceContext';
import { UserModelProvider } from './src/contexts/UserModelContext';
import { PurchaseProvider } from './src/contexts/PurchaseContext';
import { ElevenLabsProvider } from '@elevenlabs/react-native';
import { ThemeProvider } from './src/contexts/ThemeContext';

// Crash Reporting
import * as Sentry from '@sentry/react-native';

// Services
import { eventLogger } from './src/services/eventLogger';

// ── Sentry Init ─────────────────────────────────────────────────────────────
Sentry.init({
  dsn: 'https://REPLACE_WITH_YOUR_DSN@sentry.io/REPLACE_PROJECT_ID',
  tracesSampleRate: 0.2,
  enableAutoSessionTracking: true,
  enabled: !__DEV__, // Only report in production builds
});

// Components
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { UnlockCelebrationModal, useUnlockCelebrations } from './src/components/UnlockCelebrationModal';

// Navigation
import { GestureNavigator } from './src/navigation-v2/GestureNavigator';
import { OnboardingScreen } from './src/screens-v2/Onboarding';

// Styles
import { colors } from './src/styles/colors';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <SupabaseAuthProvider>
              <UserModelProvider>
                <PurchaseProvider>
                  <ElevenLabsProvider>
                    <VoiceProvider>
                      <AppContent />
                    </VoiceProvider>
                  </ElevenLabsProvider>
                </PurchaseProvider>
              </UserModelProvider>
            </SupabaseAuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { user, isLoading } = useSupabaseAuth();

  // Track last-open date for "first open today" detection
  const lastOpenDateRef = useRef<string>('');

  // Initialize event logging & Sentry user context when authenticated
  useEffect(() => {
    if (user) {
      eventLogger.initialize();

      // Set Sentry user context for crash reports
      Sentry.setUser({ id: user.id, email: user.email });

      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const isFirstOpenToday = lastOpenDateRef.current !== today;
      lastOpenDateRef.current = today;
      eventLogger.logAppOpened();
      if (isFirstOpenToday) {
        eventLogger.log('app_opened', { first_open_today: true });
      }
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  // AppState listener: detect foreground returns (PRD V-4 / Step 5)
  useEffect(() => {
    if (!user) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const today = new Date().toLocaleDateString('en-CA');
        const isFirstOpenToday = lastOpenDateRef.current !== today;
        lastOpenDateRef.current = today;

        eventLogger.logAppOpened();
        if (isFirstOpenToday) {
          eventLogger.log('app_opened', { first_open_today: true });
        }
      } else if (nextState === 'background') {
        eventLogger.logAppBackgrounded();
        eventLogger.forceFlush();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [user]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require('./assets/mypa-orb.png')}
          style={styles.loadingOrb}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    const { LoginScreenV2 } = require('./src/screens-v2/Auth');
    return <LoginScreenV2 />;
  }

  // Authenticated user - show main app
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { user, refreshProfile } = useSupabaseAuth();
  const { currentUnlock, modalVisible, handleDismiss } = useUnlockCelebrations();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(user?.isOnboarded ?? false);

  // If user finishes onboarding in this session, update local state + refresh profile
  const handleOnboardingComplete = useCallback(async () => {
    setHasCompletedOnboarding(true);
    await refreshProfile().catch(() => {});
  }, [refreshProfile]);

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }
  
  return (
    <>
      <StatusBar barStyle="light-content" />
      <GestureNavigator />
      
      {/* Unlock Celebration Modal */}
      <UnlockCelebrationModal
        visible={modalVisible}
        feature={currentUnlock || ''}
        onDismiss={handleDismiss}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOrb: {
    width: 100,
    height: 100,
  },
});
