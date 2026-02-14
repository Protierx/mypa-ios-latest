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
import { useVoice } from '../../contexts/VoiceContext';

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

export function SettingsModal({ visible, onClose, onShowPaywall }: SettingsModalProps & { onShowPaywall?: () => void }) {
  const { user, signOut } = useSupabaseAuth();
  const voice = useVoice();
  
  // Voice settings wired to VoiceContext
  const aiVoiceEnabled = voice.isVoiceEnabled;
  const setAiVoiceEnabled = voice.setVoiceEnabled;
  const voiceSpeed = voice.voiceSpeed;
  const setVoiceSpeed = voice.setVoiceSpeed;
  const selectedVoice = voice.selectedVoice;
  const setSelectedVoice = voice.setSelectedVoice;
  const isDiscreetMode = voice.isDiscreetMode;
  const setDiscreetMode = voice.setDiscreetMode;
  const isWakeWordEnabled = voice.isWakeWordEnabled;
  const setWakeWordEnabled = voice.setWakeWordEnabled;
  const wakeWordSensitivity = voice.wakeWordSensitivity;
  const setWakeWordSensitivity = voice.setWakeWordSensitivity;
  const isNoiseIsolationEnabled = voice.isNoiseIsolationEnabled;
  const setNoiseIsolationEnabled = voice.setNoiseIsolationEnabled;
  const isLiveCaptionsEnabled = voice.isLiveCaptionsEnabled;
  const setLiveCaptionsEnabled = voice.setLiveCaptionsEnabled;

  // Non-voice settings (would normally be persisted)
  const [pushEnabled, setPushEnabled] = useState(true);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(true);
  const [taskRemindersEnabled, setTaskRemindersEnabled] = useState(true);
  const [defaultFocusDuration, setDefaultFocusDuration] = useState(25);
  const [focusSoundsEnabled, setFocusSoundsEnabled] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'friends' | 'private'>('friends');

  // ElevenLabs voice options
  // 'agent-default' = use whatever voice is configured on the ElevenLabs agent dashboard
  const voiceOptions: Array<{ id: string; name: string; description: string }> = [
    { id: 'agent-default', name: 'Agent Default', description: 'Voice set in ElevenLabs dashboard' },
    { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', description: 'Smooth & trustworthy' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Mature & reassuring' },
    { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', description: 'Playful, bright & warm' },
    { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Deep & confident' },
    { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River', description: 'Relaxed & neutral' },
  ];

  const handleTestVoice = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    voice.speak("Hey! I'm MYPA, ready to help you get things done.");
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
          {/* SUBSCRIPTION */}
          <SectionHeader title="Subscription" />
          <View className="bg-zinc-900/50 mx-4 rounded-xl">
            <SettingRow
              icon={user?.isPremium ? 'diamond' : 'diamond-outline'}
              iconColor={user?.isPremium ? '#7C3AED' : '#A1A1AA'}
              title={user?.isPremium ? 'Premium' : 'Free Plan'}
              subtitle={user?.isPremium ? 'You have unlimited access' : 'Upgrade for unlimited voice & circles'}
              onPress={user?.isPremium ? undefined : onShowPaywall}
            />
          </View>

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
            <View className="h-px bg-zinc-800 mx-5" />
            {/* Discreet Mode (PRD 4.1) */}
            <SettingRow
              icon="text-outline"
              iconColor="#22d3ee"
              title="Discreet Mode"
              subtitle="Text-only, no voice audio"
              value={
                <Switch
                  value={isDiscreetMode}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setDiscreetMode(v);
                  }}
                  trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                  thumbColor="#fff"
                />
              }
            />
            <View className="h-px bg-zinc-800 mx-5" />
            {/* Live Captions (Step 21f) */}
            <SettingRow
              icon="chatbubble-ellipses-outline"
              iconColor="#34d399"
              title="Live Captions"
              subtitle="Show what you're saying on screen"
              value={
                <Switch
                  value={isLiveCaptionsEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setLiveCaptionsEnabled(v);
                  }}
                  trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                  thumbColor="#fff"
                />
              }
            />
          </View>

          {/* NOISY ENVIRONMENT */}
          <SectionHeader title="Noisy Environment" />
          <View className="bg-zinc-900/50 mx-4 rounded-xl">
            <SettingRow
              icon="headset-outline"
              iconColor="#06b6d4"
              title="Voice Isolation"
              subtitle="Clean audio in noisy places"
              value={
                <Switch
                  value={isNoiseIsolationEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setNoiseIsolationEnabled(v);
                  }}
                  trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                  thumbColor="#fff"
                />
              }
            />
            <View className="h-px bg-zinc-800 mx-5" />
            <View className="px-5 py-3">
              <Text className="text-zinc-500 text-xs">
                Uses ElevenLabs Audio Isolation to filter background noise before processing your voice.
                Best for coffee shops, commutes, and gyms. The built-in noise handling works well
                for moderate noise — enable this for extreme environments.
              </Text>
            </View>
          </View>

          {/* HANDS-FREE ACTIVATION */}
          <SectionHeader title="Hands-Free Activation" />
          <View className="bg-zinc-900/50 mx-4 rounded-xl">
            <SettingRow
              icon="mic-outline"
              iconColor="#f59e0b"
              title='"Hey MYPA" Wake Word'
              subtitle="Activate hands-free, on-device only"
              value={
                <Switch
                  value={isWakeWordEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setWakeWordEnabled(v);
                  }}
                  trackColor={{ false: '#3f3f46', true: '#7c3aed' }}
                  thumbColor="#fff"
                />
              }
            />
            {isWakeWordEnabled && (
              <>
                <View className="h-px bg-zinc-800 mx-5" />
                <View className="px-5 py-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-white">Sensitivity</Text>
                    <Text className="text-zinc-400">
                      {wakeWordSensitivity <= 0.33 ? 'Low' : wakeWordSensitivity <= 0.66 ? 'Medium' : 'High'}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                      className="p-2"
                      onPress={() => setWakeWordSensitivity(Math.max(0, wakeWordSensitivity - 0.1))}
                    >
                      <Ionicons name="remove-circle-outline" size={24} color="#f59e0b" />
                    </TouchableOpacity>
                    <View className="flex-1 h-2 bg-zinc-700 rounded-full mx-2">
                      <View
                        className="h-2 bg-amber-500 rounded-full"
                        style={{ width: `${wakeWordSensitivity * 100}%` }}
                      />
                    </View>
                    <TouchableOpacity
                      className="p-2"
                      onPress={() => setWakeWordSensitivity(Math.min(1, wakeWordSensitivity + 0.1))}
                    >
                      <Ionicons name="add-circle-outline" size={24} color="#f59e0b" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="h-px bg-zinc-800 mx-5" />
                <View className="px-5 py-3">
                  <Text className="text-zinc-500 text-xs">
                    MYPA listens for the wake word on-device. No audio is sent to the cloud until activated.
                    {'\n'}Auto-pauses below 15% battery to save power.
                  </Text>
                </View>
              </>
            )}
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
