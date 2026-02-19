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
import { ConversationHistoryModal } from './ConversationHistoryModal';

import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius } from '../../styles/theme';

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

function SettingRow({ icon, iconColor = textTokens.tertiary, title, subtitle, value, onPress, isDestructive }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', height: 56, paddingVertical: 16, paddingHorizontal: 20 }}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: bg.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Ionicons name={icon as any} size={18} color={isDestructive ? semantic.error : iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: isDestructive ? semantic.error : textTokens.primary }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: 13, color: textTokens.tertiary, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {value && <View>{value}</View>}
      {onPress && !value && (
        <Ionicons name="chevron-forward" size={20} color={textTokens.tertiary} />
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, textTransform: 'uppercase', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
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
  const preferredLanguage = voice.preferredLanguage;
  const setPreferredLanguage = voice.setPreferredLanguage;
  const tonePreference = voice.tonePreference;
  const setTonePreference = voice.setTonePreference;

  // Non-voice settings (would normally be persisted)
  const [pushEnabled, setPushEnabled] = useState(true);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(true);
  const [taskRemindersEnabled, setTaskRemindersEnabled] = useState(true);
  const [defaultFocusDuration, setDefaultFocusDuration] = useState(25);
  const [focusSoundsEnabled, setFocusSoundsEnabled] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'friends' | 'private'>('friends');
  const [showConversationHistory, setShowConversationHistory] = useState(false);

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
      <SafeAreaView style={{ flex: 1, backgroundColor: bg.primary }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderTokens.primary }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, marginLeft: -8 }}>
            <Ionicons name="close" size={24} color={textTokens.primary} />
          </TouchableOpacity>
          <Text style={{ color: textTokens.primary, fontSize: 18, fontWeight: '600' }}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* SUBSCRIPTION */}
          <SectionHeader title="Subscription" />
          <View style={{ backgroundColor: bg.card, marginHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: borderTokens.primary, ...shadows.sm }}>
            <SettingRow
              icon={user?.isPremium ? 'diamond' : 'diamond-outline'}
              iconColor={user?.isPremium ? brand.primary : textTokens.tertiary}
              title={user?.isPremium ? 'Premium' : 'Free Plan'}
              subtitle={user?.isPremium ? 'You have unlimited access' : 'Upgrade for unlimited voice & circles'}
              onPress={user?.isPremium ? undefined : onShowPaywall}
            />
          </View>

          {/* VOICE & AI */}
          <SectionHeader title="Voice & AI" />
          <View style={{ backgroundColor: bg.card, marginHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: borderTokens.primary, ...shadows.sm }}>
            <SettingRow
              icon="volume-high-outline"
              iconColor={brand.primary}
              title="AI Voice"
              subtitle="Enable spoken responses"
              value={
                <Switch
                  value={aiVoiceEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setAiVoiceEnabled(v);
                  }}
                  trackColor={{ false: borderTokens.primary, true: brand.primary }}
                  thumbColor={bg.card}
                />
              }
            />
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: textTokens.primary }}>Voice Speed</Text>
                <Text style={{ color: textTokens.tertiary }}>{voiceSpeed.toFixed(1)}x</Text>
              </View>
              {/* Voice speed slider - using touchable areas for now */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity 
                  style={{ padding: 8 }} 
                  onPress={() => setVoiceSpeed(Math.max(0.5, voiceSpeed - 0.1))}
                >
                  <Ionicons name="remove-circle-outline" size={24} color={brand.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1, height: 8, backgroundColor: bg.secondary, borderRadius: 9999, marginHorizontal: 8 }}>
                  <View 
                    style={{ height: 8, backgroundColor: brand.primary, borderRadius: 9999, width: `${((voiceSpeed - 0.5) / 1.5) * 100}%` }}
                  />
                </View>
                <TouchableOpacity 
                  style={{ padding: 8 }} 
                  onPress={() => setVoiceSpeed(Math.min(2.0, voiceSpeed + 0.1))}
                >
                  <Ionicons name="add-circle-outline" size={24} color={brand.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            {/* Voice Selection - Step 5.12 */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <Text style={{ color: textTokens.primary, marginBottom: 12 }}>Voice</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {voiceOptions.map((voice) => (
                  <TouchableOpacity
                    key={voice.id}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      backgroundColor: selectedVoice === voice.id ? brand.muted : bg.secondary,
                      borderColor: selectedVoice === voice.id ? brand.primary : borderTokens.primary,
                    }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedVoice(voice.id);
                    }}
                  >
                    <Text style={{ color: selectedVoice === voice.id ? brand.primary : textTokens.primary, fontWeight: selectedVoice === voice.id ? '600' : '400' }}>
                      {voice.name}
                    </Text>
                    <Text style={{ color: textTokens.tertiary, fontSize: 12 }}>{voice.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity 
                style={{ marginTop: 16, backgroundColor: bg.secondary, paddingVertical: 12, borderRadius: radius.sm, alignItems: 'center' }}
                onPress={handleTestVoice}
              >
                <Text style={{ color: brand.primary, fontWeight: '500' }}>Test Voice</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            {/* MYPA Tone */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <Text style={{ color: textTokens.primary, marginBottom: 4 }}>MYPA Tone</Text>
              <Text style={{ color: textTokens.tertiary, fontSize: 13, marginBottom: 12 }}>How MYPA speaks to you</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {([
                  { id: 'warm', label: 'Warm', desc: 'Like a reliable friend' },
                  { id: 'gentle', label: 'Gentle', desc: 'Treads lightly' },
                  { id: 'energetic', label: 'Energetic', desc: 'Caffeinated & upbeat' },
                  { id: 'direct', label: 'Direct', desc: 'No wasted words' },
                ] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      backgroundColor: tonePreference === opt.id ? brand.muted : bg.secondary,
                      borderColor: tonePreference === opt.id ? brand.primary : borderTokens.primary,
                    }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTonePreference(opt.id);
                    }}
                  >
                    <Text style={{ color: tonePreference === opt.id ? brand.primary : textTokens.primary, fontWeight: tonePreference === opt.id ? '600' : '400' }}>
                      {opt.label}
                    </Text>
                    <Text style={{ color: textTokens.tertiary, fontSize: 12 }}>{opt.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            {/* Discreet Mode (PRD 4.1) */}
            <SettingRow
              icon="text-outline"
              iconColor={semantic.info}
              title="Discreet Mode"
              subtitle="Text-only, no voice audio"
              value={
                <Switch
                  value={isDiscreetMode}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setDiscreetMode(v);
                  }}
                  trackColor={{ false: borderTokens.primary, true: brand.primary }}
                  thumbColor={bg.card}
                />
              }
            />
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            {/* Live Captions (Step 21f) */}
            <SettingRow
              icon="chatbubble-ellipses-outline"
              iconColor={semantic.success}
              title="Live Captions"
              subtitle="Show what you're saying on screen"
              value={
                <Switch
                  value={isLiveCaptionsEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setLiveCaptionsEnabled(v);
                  }}
                  trackColor={{ false: borderTokens.primary, true: brand.primary }}
                  thumbColor={bg.card}
                />
              }
            />
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            {/* Language Selection (Step 5) */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <Text style={{ color: textTokens.primary, marginBottom: 12 }}>Language</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { code: 'en', name: 'English', flag: '🇺🇸' },
                  { code: 'es', name: 'Español', flag: '🇪🇸' },
                  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
                  { code: 'fr', name: 'Français', flag: '🇫🇷' },
                  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                  { code: 'pt', name: 'Português', flag: '🇧🇷' },
                  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
                  { code: 'zh', name: '中文', flag: '🇨🇳' },
                  { code: 'ja', name: '日本語', flag: '🇯🇵' },
                  { code: 'ko', name: '한국어', flag: '🇰🇷' },
                ].map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      backgroundColor: preferredLanguage === lang.code ? brand.muted : bg.secondary,
                      borderColor: preferredLanguage === lang.code ? brand.primary : borderTokens.primary,
                    }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPreferredLanguage(lang.code);
                    }}
                  >
                    <Text style={{ color: preferredLanguage === lang.code ? brand.primary : textTokens.primary, fontWeight: preferredLanguage === lang.code ? '600' : '400' }}>
                      {lang.flag} {lang.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* NOISY ENVIRONMENT */}
          <SectionHeader title="Noisy Environment" />
          <View style={{ backgroundColor: bg.card, marginHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: borderTokens.primary, ...shadows.sm }}>
            <SettingRow
              icon="headset-outline"
              iconColor={semantic.info}
              title="Voice Isolation"
              subtitle="Clean audio in noisy places"
              value={
                <Switch
                  value={isNoiseIsolationEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setNoiseIsolationEnabled(v);
                  }}
                  trackColor={{ false: borderTokens.primary, true: brand.primary }}
                  thumbColor={bg.card}
                />
              }
            />
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
              <Text style={{ color: textTokens.tertiary, fontSize: 12 }}>
                Uses ElevenLabs Audio Isolation to filter background noise before processing your voice.
                Best for coffee shops, commutes, and gyms. The built-in noise handling works well
                for moderate noise — enable this for extreme environments.
              </Text>
            </View>
          </View>

          {/* HANDS-FREE ACTIVATION */}
          <SectionHeader title="Hands-Free Activation" />
          <View style={{ backgroundColor: bg.card, marginHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: borderTokens.primary, ...shadows.sm }}>
            <SettingRow
              icon="mic-outline"
              iconColor={semantic.warning}
              title='"Hey MYPA" Wake Word'
              subtitle="Activate hands-free, on-device only"
              value={
                <Switch
                  value={isWakeWordEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setWakeWordEnabled(v);
                  }}
                  trackColor={{ false: borderTokens.primary, true: brand.primary }}
                  thumbColor={bg.card}
                />
              }
            />
            {isWakeWordEnabled && (
              <>
                <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
                <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: textTokens.primary }}>Sensitivity</Text>
                    <Text style={{ color: textTokens.tertiary }}>
                      {wakeWordSensitivity <= 0.33 ? 'Low' : wakeWordSensitivity <= 0.66 ? 'Medium' : 'High'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                      style={{ padding: 8 }}
                      onPress={() => setWakeWordSensitivity(Math.max(0, wakeWordSensitivity - 0.1))}
                    >
                      <Ionicons name="remove-circle-outline" size={24} color={semantic.warning} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, height: 8, backgroundColor: bg.secondary, borderRadius: 9999, marginHorizontal: 8 }}>
                      <View
                        style={{ height: 8, backgroundColor: semantic.warning, borderRadius: 9999, width: `${wakeWordSensitivity * 100}%` }}
                      />
                    </View>
                    <TouchableOpacity
                      style={{ padding: 8 }}
                      onPress={() => setWakeWordSensitivity(Math.min(1, wakeWordSensitivity + 0.1))}
                    >
                      <Ionicons name="add-circle-outline" size={24} color={semantic.warning} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
                <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
                  <Text style={{ color: textTokens.tertiary, fontSize: 12 }}>
                    MYPA listens for the wake word on-device. No audio is sent to the cloud until activated.
                    {'\n'}Auto-pauses below 15% battery to save power.
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* NOTIFICATIONS */}
          <SectionHeader title="Notifications" />
          <View style={{ backgroundColor: bg.card, marginHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: borderTokens.primary, ...shadows.sm }}>
            <SettingRow
              icon="notifications-outline"
              iconColor={semantic.info}
              title="Push Notifications"
              value={
                <Switch
                  value={pushEnabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setPushEnabled(v);
                  }}
                  trackColor={{ false: borderTokens.primary, true: brand.primary }}
                  thumbColor={bg.card}
                />
              }
            />
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
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
                  trackColor={{ false: borderTokens.primary, true: brand.primary }}
                  thumbColor={bg.card}
                />
              }
            />
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
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
                  trackColor={{ false: borderTokens.primary, true: brand.primary }}
                  thumbColor={bg.card}
                />
              }
            />
          </View>

          {/* FOCUS */}
          <SectionHeader title="Focus" />
          <View style={{ backgroundColor: bg.card, marginHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: borderTokens.primary, ...shadows.sm }}>
            <SettingRow
              icon="timer-outline"
              iconColor={semantic.success}
              title="Default Duration"
              value={
                <Text style={{ color: textTokens.tertiary }}>{defaultFocusDuration} min</Text>
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
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
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
                  trackColor={{ false: borderTokens.primary, true: brand.primary }}
                  thumbColor={bg.card}
                />
              }
            />
          </View>

          {/* PRIVACY */}
          <SectionHeader title="Privacy" />
          <View style={{ backgroundColor: bg.card, marginHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: borderTokens.primary, ...shadows.sm }}>
            <SettingRow
              icon="eye-outline"
              iconColor={semantic.warning}
              title="Profile Visibility"
              value={
                <Text style={{ color: textTokens.tertiary, textTransform: 'capitalize' }}>{profileVisibility}</Text>
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

          {/* HISTORY */}
          <SectionHeader title="History" />
          <View style={{ backgroundColor: bg.card, marginHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: borderTokens.primary, ...shadows.sm }}>
            <SettingRow
              icon="chatbubbles-outline"
              iconColor={brand.primary}
              title="Conversation History"
              subtitle="Browse past voice conversations"
              onPress={() => setShowConversationHistory(true)}
            />
          </View>

          {/* ACCOUNT */}
          <SectionHeader title="Account" />
          <View style={{ backgroundColor: bg.card, marginHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: borderTokens.primary, ...shadows.sm }}>
            <SettingRow
              icon="person-outline"
              title="Edit Profile"
              onPress={() => {
                // TODO: Open edit profile
              }}
            />
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            <SettingRow
              icon="download-outline"
              title="Export Data"
              onPress={() => {
                Alert.alert('Coming Soon', 'Data export will be available soon.');
              }}
            />
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            <SettingRow
              icon="log-out-outline"
              title="Sign Out"
              onPress={handleSignOut}
            />
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            <SettingRow
              icon="trash-outline"
              title="Delete Account"
              isDestructive
              onPress={handleDeleteAccount}
            />
          </View>

          {/* ABOUT */}
          <SectionHeader title="About" />
          <View style={{ backgroundColor: bg.card, marginHorizontal: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: borderTokens.primary, ...shadows.sm, marginBottom: 32 }}>
            <SettingRow
              icon="information-circle-outline"
              title="App Version"
              value={<Text style={{ color: textTokens.tertiary }}>1.0.0</Text>}
            />
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            <SettingRow
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => handleOpenURL('https://mypa.app/terms')}
            />
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            <SettingRow
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              onPress={() => handleOpenURL('https://mypa.app/privacy')}
            />
            <View style={{ height: 1, backgroundColor: borderTokens.primary, marginHorizontal: 20 }} />
            <SettingRow
              icon="help-circle-outline"
              title="Help & Support"
              onPress={() => handleOpenURL('mailto:support@mypa.app')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Sub-modals */}
      <ConversationHistoryModal
        visible={showConversationHistory}
        onClose={() => setShowConversationHistory(false)}
      />
    </Modal>
  );
}
