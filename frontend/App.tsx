/**
 * Mylo App - AI-Powered Life Organizer
 * 
 * Main entry point with gesture-based navigation
 * AI Home is the center, swipe to navigate:
 * - LEFT → Tasks
 * - RIGHT → Social
 * - DOWN → Profile
 * - UP → Focus Modal
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Image, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { usePushNotifications } from './src/services/pushNotifications';
import { LoginScreen } from './src/screens/Login';
import { GestureNavigator } from './src/navigation/GestureNavigator';
import { VoiceAssistantScreen } from './src/screens/VoiceAssistant';
import CircleHomeScreen from './src/screens/Circle/CircleHome';
import ResetScreen from './src/screens/Reset';
import { ProofCameraScreen } from './src/screens/Proof/ProofCamera';
import { ProofConfirmScreen } from './src/screens/Proof/ProofConfirm';
import DailyBriefingScreen from './src/screens/DailyBriefing';
import { TasksScreen } from './src/screens/Tasks';
import { SettingsScreen } from './src/screens/Settings';
import { EditProfileScreen } from './src/screens/EditProfile';
import { NotificationsScreen } from './src/screens/Notification/Notifications';
import NotificationSettingsScreen from './src/screens/Notification/NotificationSettings';
import IntegrationsScreen from './src/screens/Integrations';
import { colors, structuredColors } from './src/styles/colors';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Use structured colors for new UI
const C = structuredColors;

const RootStack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  
  // Initialize push notifications when user is authenticated
  const { register: registerPush, notification } = usePushNotifications();
  
  useEffect(() => {
    if (user) {
      // Register for push notifications when user logs in
      registerPush().then(success => {
        if (success) {
          console.log('📱 Push notifications registered successfully');
        }
      }).catch(err => {
        console.log('Push notification registration skipped (simulator or permission denied)');
      });
    }
  }, [user]);
  
  // Handle incoming notifications
  useEffect(() => {
    if (notification) {
      console.log('📬 Received notification:', notification.request.content.title);
      // Could show in-app banner or navigate based on notification data
    }
  }, [notification]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require('./assets/mypa-orb.png')}
          style={styles.loadingOrb}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={C.brand.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={C.background.black} />
      <RootStack.Navigator 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: C.background.black },
        }}
      >
        {/* Main Gesture Navigator (AI Home + swipe views) */}
        <RootStack.Screen 
          name="Main" 
          component={GestureNavigator}
        />
        
        {/* Modal Screens (slide from bottom/right) */}
        <RootStack.Screen 
          name="CircleHome" 
          component={CircleHomeScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <RootStack.Screen 
          name="Reset" 
          component={ResetScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <RootStack.Screen 
          name="ProofCamera" 
          component={ProofCameraScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <RootStack.Screen 
          name="ProofConfirm" 
          component={ProofConfirmScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <RootStack.Screen 
          name="DailyBriefing" 
          component={DailyBriefingScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <RootStack.Screen 
          name="TaskDetail" 
          component={TasksScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <RootStack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <RootStack.Screen 
          name="EditProfile" 
          component={EditProfileScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <RootStack.Screen 
          name="Notifications" 
          component={NotificationsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <RootStack.Screen 
          name="NotificationSettings" 
          component={NotificationSettingsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <RootStack.Screen 
          name="Integrations" 
          component={IntegrationsScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </RootStack.Navigator>
      
      {/* Voice Assistant Overlay */}
      <VoiceAssistantScreen
        visible={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
      />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: C.background.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOrb: {
    width: 100,
    height: 100,
  },
});
