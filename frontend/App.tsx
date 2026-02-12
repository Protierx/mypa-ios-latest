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
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, StatusBar, Image, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// LiveKit WebRTC globals — must be called before any ElevenLabs/LiveKit usage
import { registerGlobals } from '@livekit/react-native';
registerGlobals();

// Contexts
import { SupabaseAuthProvider, useSupabaseAuth } from './src/contexts/SupabaseAuthContext';
import { VoiceProvider } from './src/contexts/VoiceContext';
import { UserModelProvider } from './src/contexts/UserModelContext';
import { ElevenLabsProvider } from '@elevenlabs/react-native';

// Services
import { eventLogger } from './src/services/eventLogger';

// Components
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { UnlockCelebrationModal, useUnlockCelebrations } from './src/components/UnlockCelebrationModal';

// Navigation
import { GestureNavigator } from './src/navigation-v2/GestureNavigator';

// Styles
import { colors } from './src/styles/colors';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SupabaseAuthProvider>
          <UserModelProvider>
            <ElevenLabsProvider>
              <VoiceProvider>
                <AppContent />
              </VoiceProvider>
            </ElevenLabsProvider>
          </UserModelProvider>
        </SupabaseAuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { user, isLoading } = useSupabaseAuth();

  // Track last-open date for "first open today" detection
  const lastOpenDateRef = useRef<string>('');

  // Initialize event logging when user is authenticated
  useEffect(() => {
    if (user) {
      eventLogger.initialize();
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const isFirstOpenToday = lastOpenDateRef.current !== today;
      lastOpenDateRef.current = today;
      eventLogger.logAppOpened();
      if (isFirstOpenToday) {
        eventLogger.log('app_opened', { first_open_today: true });
      }
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
  const { currentUnlock, modalVisible, handleDismiss } = useUnlockCelebrations();
  
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
