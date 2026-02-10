/**
 * Settings Modal
 * 
 * All app settings organized in sections.
 * Access from Profile View.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: React.ReactNode;
  onPress?: () => void;
  isDestructive?: boolean;
}

function SettingRow({ icon, iconColor = '#A1A1AA', title, subtitle, value, onPress, isDestructive }: SettingRowProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center h-14 py-4 px-5"
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View className="w-8 h-8 rounded-lg bg-surface-3 items-center justify-center mr-3">
        <Ionicons name={icon as any} size={18} color={isDestructive ? '#EF4444' : iconColor} />
      </View>
      <View className="flex-1">
        <Text className={`text-body ${isDestructive ? 'text-error' : 'text-ink-primary'}`}>{title}</Text>
        {subtitle && <Text className="text-subhead text-ink-tertiary mt-0.5">{subtitle}</Text>}
      </View>
      {value && <View>{value}</View>}
      {onPress && !value && (
        <Ionicons name="chevron-forward" size={20} color="#52525B" />
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-caption-1 font-semibold text-ink-tertiary uppercase px-5 pt-6 pb-2">
      {title}
    </Text>
  );
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { signOut } = useSupabaseAuth();
  
  // Settings state (would normally be persisted)
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<'alloy' | 'ash' | 'coral' | 'nova' | 'shimmer'>('ash');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(true);
  const [taskRemindersEnabled, setTaskRemindersEnabled] = useState(true);
  const [defaultFocusDuration, setDefaultFocusDuration] = useState(25);
  const [focusSoundsEnabled, setFocusSoundsEnabled] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'friends' | 'private'>('friends');

  // Voice options per Step 5.12
  const voiceOptions: Array<{ id: 'alloy' | 'ash' | 'coral' | 'nova' | 'shimmer'; name: string; description: string }> = [
    { id: 'ash', name: 'Ash', description: 'Warm & friendly (default)' },
    { id: 'nova', name: 'Nova', description: 'Bright & energetic' },
    { id: 'alloy', name: 'Alloy', description: 'Balanced & clear' },
    { id: 'coral', name: 'Coral', description: 'Upbeat & motivating' },
    { id: 'shimmer', name: 'Shimmer', description: 'Soft & gentle' },
  ];

  const handleTestVoice = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Would trigger TTS with sample: "Hey! I'm MYPA, ready to help you get things done."
    Alert.alert('Test Voice', `Testing ${selectedVoice} voice...`);
  };

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOut();
            onClose();
          },
        },
      ]
    );
  }, [signOut, onClose]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Coming Soon', 'Account deletion will be available soon.');
          },
        },
      ]
    );
  }, []);

  const handleOpenURL = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-800">
          <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Settings</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1">
          {/* VOICE & AI */}
          <SectionHeader title="Voice & AI" />
          <View className="bg-zinc-900/50 mx-4 rounded-xl">
            <SettingRow
              icon="volume-high-outline"
              iconColor="#a855f7"
              title="AI Voice"
              subtitle="Enable spoken responses"
              value={
                <Switch
                  value={aiVoiceEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setAiVoiceEnabled(v);
                  }}
                  trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                  thumbColor="#fff"
                />
              }
            />
            <View className="h-px bg-zinc-800 mx-5" />
            <View className="px-5 py-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-white">Voice Speed</Text>
                <Text className="text-zinc-400">{voiceSpeed.toFixed(1)}x</Text>
              </View>
              {/* Voice speed slider - using touchable areas for now */}
              <View className="flex-row items-center justify-between">
                <TouchableOpacity 
                  className="p-2" 
                  onPress={() => setVoiceSpeed(Math.max(0.5, voiceSpeed - 0.1))}
                >
                  <Ionicons name="remove-circle-outline" size={24} color="#a855f7" />
                </TouchableOpacity>
                <View className="flex-1 h-2 bg-zinc-700 rounded-full mx-2">
                  <View 
                    className="h-2 bg-purple-500 rounded-full"
                    style={{ width: `${((voiceSpeed - 0.5) / 1.5) * 100}%` }}
                  />
                </View>
                <TouchableOpacity 
                  className="p-2" 
                  onPress={() => setVoiceSpeed(Math.min(2.0, voiceSpeed + 0.1))}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#a855f7" />
                </TouchableOpacity>
              </View>
            </View>
            <View className="h-px bg-zinc-800 mx-5" />
            {/* Voice Selection - Step 5.12 */}
            <View className="px-5 py-4">
              <Text className="text-white mb-3">Voice</Text>
              <View className="flex-row flex-wrap gap-2">
                {voiceOptions.map((voice) => (
                  <TouchableOpacity
                    key={voice.id}
                    className={`px-4 py-2 rounded-lg border ${
                      selectedVoice === voice.id 
                        ? 'bg-purple-500/20 border-purple-500' 
                        : 'bg-zinc-800 border-zinc-700'
                    }`}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedVoice(voice.id);
                    }}
                  >
                    <Text className={selectedVoice === voice.id ? 'text-purple-400 font-semibold' : 'text-white'}>
                      {voice.name}
                    </Text>
                    <Text className="text-zinc-500 text-xs">{voice.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity 
                className="mt-4 bg-zinc-800 py-3 rounded-lg items-center"
                onPress={handleTestVoice}
              >
                <Text className="text-purple-400 font-medium">Test Voice</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* NOTIFICATIONS */}
          <SectionHeader title="Notifications" />
          <View className="bg-zinc-900/50 mx-4 rounded-xl">
            <SettingRow
              icon="notifications-outline"
              iconColor="#3b82f6"
              title="Push Notifications"
              value={
                <Switch
                  value={pushEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setPushEnabled(v);
                  }}
                  trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                  thumbColor="#fff"
                />
              }
            />
            <View className="h-px bg-zinc-800 mx-5" />
            <SettingRow
              icon="sunny-outline"
              title="Daily Summary"
              subtitle="Morning briefing"
              value={
                <Switch
                  value={dailySummaryEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setDailySummaryEnabled(v);
                  }}
                  trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                  thumbColor="#fff"
                />
              }
            />
            <View className="h-px bg-zinc-800 mx-5" />
            <SettingRow
              icon="alarm-outline"
              title="Task Reminders"
              value={
                <Switch
                  value={taskRemindersEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setTaskRemindersEnabled(v);
                  }}
                  trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                  thumbColor="#fff"
                />
              }
            />
          </View>

          {/* FOCUS */}
          <SectionHeader title="Focus" />
          <View className="bg-zinc-900/50 mx-4 rounded-xl">
            <SettingRow
              icon="timer-outline"
              iconColor="#22c55e"
              title="Default Duration"
              value={
                <Text className="text-zinc-400">{defaultFocusDuration} min</Text>
              }
              onPress={() => {
                Alert.alert(
                  'Default Focus Duration',
                  'Choose your default session length',
                  [
                    { text: '15 min', onPress: () => setDefaultFocusDuration(15) },
                    { text: '25 min', onPress: () => setDefaultFocusDuration(25) },
                    { text: '45 min', onPress: () => setDefaultFocusDuration(45) },
                    { text: '60 min', onPress: () => setDefaultFocusDuration(60) },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            />
            <View className="h-px bg-zinc-800 mx-5" />
            <SettingRow
              icon="musical-notes-outline"
              title="Focus Sounds"
              subtitle="Ambient background audio"
              value={
                <Switch
                  value={focusSoundsEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setFocusSoundsEnabled(v);
                  }}
                  trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                  thumbColor="#fff"
                />
              }
            />
          </View>

          {/* PRIVACY */}
          <SectionHeader title="Privacy" />
          <View className="bg-zinc-900/50 mx-4 rounded-xl">
            <SettingRow
              icon="eye-outline"
              iconColor="#f97316"
              title="Profile Visibility"
              value={
                <Text className="text-zinc-400 capitalize">{profileVisibility}</Text>
              }
              onPress={() => {
                Alert.alert(
                  'Profile Visibility',
                  'Who can see your profile?',
                  [
                    { text: 'Public', onPress: () => setProfileVisibility('public') },
                    { text: 'Friends Only', onPress: () => setProfileVisibility('friends') },
                    { text: 'Private', onPress: () => setProfileVisibility('private') },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            />
          </View>

          {/* ACCOUNT */}
          <SectionHeader title="Account" />
          <View className="bg-zinc-900/50 mx-4 rounded-xl">
            <SettingRow
              icon="person-outline"
              title="Edit Profile"
              onPress={() => {
                // TODO: Open edit profile
              }}
            />
            <View className="h-px bg-zinc-800 mx-5" />
            <SettingRow
              icon="download-outline"
              title="Export Data"
              onPress={() => {
                Alert.alert('Coming Soon', 'Data export will be available soon.');
              }}
            />
            <View className="h-px bg-zinc-800 mx-5" />
            <SettingRow
              icon="log-out-outline"
              title="Sign Out"
              onPress={handleSignOut}
            />
            <View className="h-px bg-zinc-800 mx-5" />
            <SettingRow
              icon="trash-outline"
              title="Delete Account"
              isDestructive
              onPress={handleDeleteAccount}
            />
          </View>

          {/* ABOUT */}
          <SectionHeader title="About" />
          <View className="bg-zinc-900/50 mx-4 rounded-xl mb-8">
            <SettingRow
              icon="information-circle-outline"
              title="App Version"
              value={<Text className="text-zinc-500">1.0.0</Text>}
            />
            <View className="h-px bg-zinc-800 mx-5" />
            <SettingRow
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => handleOpenURL('https://mypa.app/terms')}
            />
            <View className="h-px bg-zinc-800 mx-5" />
            <SettingRow
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              onPress={() => handleOpenURL('https://mypa.app/privacy')}
            />
            <View className="h-px bg-zinc-800 mx-5" />
            <SettingRow
              icon="help-circle-outline"
              title="Help & Support"
              onPress={() => handleOpenURL('mailto:support@mypa.app')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
