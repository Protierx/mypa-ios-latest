import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Image, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { usePushNotifications } from './src/services/pushNotifications';
import { LoginScreen } from './src/screens/Login';
import { HubScreen } from './src/screens/Hub';
import PlanScreen from './src/screens/Plan';
import { InboxScreen } from './src/screens/Inbox';
import { ProfileScreen } from './src/screens/Profile';
import WalletScreen from './src/screens/Wallet';
import ChallengesScreen from './src/screens/Challenges';
import CirclesScreen from './src/screens/Circle/Circles';
import { SettingsScreen } from './src/screens/Settings';
import { TasksScreen } from './src/screens/Tasks';
import { VoiceAssistantScreen } from './src/screens/VoiceAssistant';
import { StreakScreen } from './src/screens/Streak';
import { LevelScreen } from './src/screens/Level';
import { EditProfileScreen } from './src/screens/EditProfile';
import { NotificationsScreen } from './src/screens/Notification/Notifications';
import { PrivacyControlsScreen } from './src/screens/PrivacyControls';
import { HelpSupportScreen } from './src/screens/HelpSupport';
import CircleHomeScreen from './src/screens/Circle/CircleHome';
import ResetScreen from './src/screens/Reset';
import { TaskSortingScreen } from './src/screens/TaskSorting';
import { ProofCameraScreen } from './src/screens/Proof/ProofCamera';
import { ProofConfirmScreen } from './src/screens/Proof/ProofConfirm';
import { DailyLifeCardScreen } from './src/screens/DailyLifeCard';
import { SavedPlacesScreen } from './src/screens/SavedPlaces';
import { AnalyticsScreen } from './src/screens/Analytics';
import DailyBriefingScreen from './src/screens/DailyBriefing';
import AIInsightsScreen from './src/screens/AIInsights';
import NotificationSettingsScreen from './src/screens/Notification/NotificationSettings';
import IntegrationsScreen from './src/screens/Integrations';
import { colors } from './src/styles/colors';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Hub" component={HubScreen} />
      <Stack.Screen name="Plan" component={PlanScreen} />
      <Stack.Screen name="Inbox" component={InboxScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
      <Stack.Screen name="Streak" component={StreakScreen} />
      <Stack.Screen name="Level" component={LevelScreen} />
      <Stack.Screen name="TaskSorting" component={TaskSortingScreen} />
      <Stack.Screen name="DailyLifeCard" component={DailyLifeCardScreen} />
      <Stack.Screen name="SavedPlaces" component={SavedPlacesScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="AIInsights" component={AIInsightsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Integrations" component={IntegrationsScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="PrivacyControls" component={PrivacyControlsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="SettingsFromProfile" component={SettingsScreen} />
      <Stack.Screen name="Integrations" component={IntegrationsScreen} />
      <Stack.Screen name="SavedPlaces" component={SavedPlacesScreen} />
    </Stack.Navigator>
  );
}

function CirclesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CirclesList" component={CirclesScreen} />
    </Stack.Navigator>
  );
}

function VoicePlaceholder() {
  return <View style={{ flex: 1 }} />;
}

const tabConfig = [
  { name: 'Today', icon: 'today', iconOutline: 'today-outline', color: '#8B5CF6', label: 'Today' },
  { name: 'Capture', icon: 'add-circle', iconOutline: 'add-circle-outline', color: '#3B82F6', label: 'Capture' },
  { name: 'Voice', icon: 'mic', iconOutline: 'mic-outline', color: '#8B5CF6', label: 'Talk' },
  { name: 'Circles', icon: 'people', iconOutline: 'people-outline', color: '#EC4899', label: 'Circles' },
  { name: 'You', icon: 'person', iconOutline: 'person-outline', color: '#10B981', label: 'You' },
];

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  onVoicePress: () => void;
}

function CustomTabBar({ state, descriptors, navigation, onVoicePress }: CustomTabBarProps) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBarBackground} />
      <View style={styles.tabBarContent}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tab = tabConfig[index];

          const onPress = () => {
            if (route.name === 'Voice') {
              onVoicePress();
              return;
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (route.name === 'Voice') {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.voiceButton}
                activeOpacity={0.8}
              >
                <View style={styles.voiceGlow} />
                <View style={styles.voiceOrbContainer}>
                  <Image
                    source={require('./assets/mypa-orb.png')}
                    style={styles.voiceOrb}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.voiceLabel}>Talk</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconContainer, isFocused && { backgroundColor: tab.color }]}>
                <Ionicons
                  name={(isFocused ? tab.icon : tab.iconOutline) as any}
                  size={22}
                  color={isFocused ? '#FFFFFF' : '#64748B'}
                />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

function MainTabs({ onVoicePress }: { onVoicePress: () => void }) {
  return (
    <>
      <Tab.Navigator
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            onVoicePress={onVoicePress}
          />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Today" component={HomeStack} />
        <Tab.Screen name="Capture" component={TaskSortingScreen} />
        <Tab.Screen name="Voice" component={VoicePlaceholder} />
        <Tab.Screen name="Circles" component={CirclesStack} />
        <Tab.Screen name="You" component={ProfileStack} />
      </Tab.Navigator>
    </>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [showListening, setShowListening] = useState(false);
  
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
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs">
          {() => (
            <MainTabs onVoicePress={() => setShowListening(true)} />
          )}
        </RootStack.Screen>
        <RootStack.Screen name="CircleHome" component={CircleHomeScreen} />
        <RootStack.Screen name="Reset" component={ResetScreen} options={{ animation: 'slide_from_bottom' }} />
        <RootStack.Screen name="ProofCamera" component={ProofCameraScreen} options={{ animation: 'slide_from_bottom' }} />
        <RootStack.Screen name="ProofConfirm" component={ProofConfirmScreen} options={{ animation: 'slide_from_right' }} />
        <RootStack.Screen name="DailyBriefing" component={DailyBriefingScreen} options={{ animation: 'slide_from_bottom' }} />
      </RootStack.Navigator>
      <VoiceAssistantScreen
        visible={showListening}
        onClose={() => setShowListening(false)}
      />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },
  tabBarBackground: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    height: 70,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: 'rgba(181, 140, 255, 0.15)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  tabBarContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
    height: 90,
  },
  tabButton: {
    alignItems: 'center',
    gap: 2,
    width: 60,
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#0F172A',
  },
  voiceButton: {
    alignItems: 'center',
    marginTop: -28,
  },
  voiceGlow: {
    position: 'absolute',
    top: 0,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(181, 140, 255, 0.25)',
  },
  voiceOrbContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceOrb: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  voiceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B5CF6',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOrb: {
    width: 100,
    height: 100,
  },
});
