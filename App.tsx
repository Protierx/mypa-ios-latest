import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { HubScreen } from './src/screens/HubScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { InboxScreen } from './src/screens/InboxScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { ChallengesScreen } from './src/screens/ChallengesScreen';
import { CirclesScreen } from './src/screens/CirclesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { ListeningScreen } from './src/screens/ListeningScreen';
import { StreakScreen } from './src/screens/StreakScreen';
import { LevelScreen } from './src/screens/LevelScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { PrivacyControlsScreen } from './src/screens/PrivacyControlsScreen';
import { HelpSupportScreen } from './src/screens/HelpSupportScreen';
import { CircleHomeScreen } from './src/screens/CircleHomeScreen';
import ResetScreen from './src/screens/ResetScreen';
import { TaskSortingScreen } from './src/screens/TaskSortingScreen';
import { ProofCameraScreen } from './src/screens/ProofCameraScreen';
import { ProofConfirmScreen } from './src/screens/ProofConfirmScreen';
import { DailyLifeCardScreen } from './src/screens/DailyLifeCardScreen';
import { SavedPlacesScreen } from './src/screens/SavedPlacesScreen';
import { colors } from './src/styles/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Hub" component={HubScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
      <Stack.Screen name="Streak" component={StreakScreen} />
      <Stack.Screen name="Level" component={LevelScreen} />
      <Stack.Screen name="Reset" component={ResetScreen} />
      <Stack.Screen name="TaskSorting" component={TaskSortingScreen} />
      <Stack.Screen name="ProofCamera" component={ProofCameraScreen} />
      <Stack.Screen name="ProofConfirm" component={ProofConfirmScreen} />
      <Stack.Screen name="DailyLifeCard" component={DailyLifeCardScreen} />
      <Stack.Screen name="SavedPlaces" component={SavedPlacesScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="PrivacyControls" component={PrivacyControlsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="SettingsFromProfile" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function CirclesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CirclesList" component={CirclesScreen} />
      <Stack.Screen name="CircleHome" component={CircleHomeScreen} />
    </Stack.Navigator>
  );
}

function VoicePlaceholder() {
  return <View style={{ flex: 1 }} />;
}

const tabConfig = [
  { name: 'Home', icon: 'home', iconOutline: 'home-outline', color: '#8B5CF6' },
  { name: 'Plan', icon: 'calendar', iconOutline: 'calendar-outline', color: '#3B82F6' },
  { name: 'Voice', icon: 'mic', iconOutline: 'mic-outline', color: '#8B5CF6' },
  { name: 'Circles', icon: 'people', iconOutline: 'people-outline', color: '#EC4899' },
  { name: 'Profile', icon: 'person', iconOutline: 'person-outline', color: '#10B981' },
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
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  const [showListening, setShowListening] = useState(false);

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Tab.Navigator
        tabBar={(props) => (
          <CustomTabBar 
            {...props} 
            onVoicePress={() => setShowListening(true)} 
          />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Plan" component={PlanScreen} />
        <Tab.Screen name="Voice" component={VoicePlaceholder} />
        <Tab.Screen name="Circles" component={CirclesStack} />
        <Tab.Screen name="Profile" component={ProfileStack} />
      </Tab.Navigator>
      
      <ListeningScreen 
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
});
