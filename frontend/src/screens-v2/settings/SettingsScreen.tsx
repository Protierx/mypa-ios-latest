/**
 * Settings Screen (Full-screen, iOS-themed Hub)
 *
 * Purpose: "App controls & configuration"
 * Opened from Profile View gear icon.
 *
 * Hub sections:
 *   1. Account (display name, username, timezone, avatar)
 *   2. Integrations (Apple, Email, Calendar)
 *   3. AI & Voice → subpage
 *   4. Task & Planning Defaults (inline)
 *   5. Notifications → subpage
 *   6. Privacy & Security → subpage
 *   7. Session (sign out)
 *
 * All state is frontend-only — persisted via AsyncStorage.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Contexts
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../lib/supabase';

// State
import {
  useSettingsPreferences,
  ACCENT_COLORS,
} from '../../state/settingsPreferences';

// Components
import {
  SettingsSectionCard,
  SettingsRow,
  IntegrationStatusModal,
} from '../../components/settings';

// Subpages
import { AIVoiceSettingsScreen } from './AIVoiceSettingsScreen';
import { NotificationsSettingsScreen } from './NotificationsSettingsScreen';
import { PrivacySecuritySettingsScreen } from './PrivacySecuritySettingsScreen';

// ── Props ────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  onShowPaywall?: () => void;
}

// ── Subpage type ─────────────────────────────────────────────

type SettingsSubpage = 'hub' | 'ai-voice' | 'notifications' | 'privacy';

// ── Main Component ───────────────────────────────────────────

export function SettingsScreen({ visible, onClose, onShowPaywall }: Props) {
  const { user, signOut } = useSupabaseAuth();
  const { prefs, update } = useSettingsPreferences();

  // Navigation state — which subpage is showing
  const [activeSubpage, setActiveSubpage] = useState<SettingsSubpage>('hub');

  // Sub-modal states
  const [showIntegrations, setShowIntegrations] = useState(false);

  const accent = ACCENT_COLORS[prefs.accentPreset].primary;

  // Reset to hub when modal closes
  const handleClose = useCallback(() => {
    setActiveSubpage('hub');
    onClose();
  }, [onClose]);

  // ── Integrations data ───────────────────────────────────────

  const integrations = useMemo(() => [
    { id: 'apple', label: 'Apple', icon: 'logo-apple' as const, iconColor: '#1C1C1E', connected: prefs.appleConnected },
    { id: 'email', label: 'Email', icon: 'mail-outline' as const, iconColor: '#3B82F6', connected: prefs.emailConnected },
    { id: 'calendar', label: 'Calendar', icon: 'calendar-outline' as const, iconColor: '#FF9F0A', connected: prefs.calendarLinked },
  ], [prefs.appleConnected, prefs.emailConnected, prefs.calendarLinked]);

  const handleIntegrationToggle = useCallback((id: string) => {
    switch (id) {
      case 'apple': update({ appleConnected: !prefs.appleConnected }); break;
      case 'email': update({ emailConnected: !prefs.emailConnected }); break;
      case 'calendar': update({ calendarLinked: !prefs.calendarLinked }); break;
    }
  }, [prefs, update]);

  // ── Action handlers ─────────────────────────────────────────

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await signOut();
          handleClose();
        },
      },
    ]);
  }, [signOut, handleClose]);

  // ── Render ──────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      {/* ── Subpage: AI & Voice ─────────────────────────────── */}
      {activeSubpage === 'ai-voice' && (
        <AIVoiceSettingsScreen onBack={() => setActiveSubpage('hub')} />
      )}

      {/* ── Subpage: Notifications ─────────────────────────── */}
      {activeSubpage === 'notifications' && (
        <NotificationsSettingsScreen onBack={() => setActiveSubpage('hub')} />
      )}

      {/* ── Subpage: Privacy & Security ────────────────────── */}
      {activeSubpage === 'privacy' && (
        <PrivacySecuritySettingsScreen
          onBack={() => setActiveSubpage('hub')}
          onClose={handleClose}
        />
      )}

      {/* ── Hub ────────────────────────────────────────────── */}
      {activeSubpage === 'hub' && (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F8FA' }} edges={['top', 'bottom']}>
          {/* ── Header ───────────────────────────────────────── */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 16,
            }}
          >
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close settings"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={26} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1C1C1E' }}>
              Settings
            </Text>
            <View style={{ width: 26 }} />
          </View>

          {/* ── Settings Content ─────────────────────────────── */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ═══════════════════════════════════════════════════
                1. ACCOUNT
            ═══════════════════════════════════════════════════ */}
            <SettingsSectionCard title="Account">
              {/* Avatar */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert('Change Photo', 'Photo upload will be available in a future update.');
                }}
                accessibilityLabel="Change profile photo"
                accessibilityRole="button"
                activeOpacity={0.6}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#F2F2F7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                    borderWidth: 2,
                    borderColor: accent,
                  }}
                >
                  {user?.avatarUrl ? (
                    <Image
                      source={{ uri: user.avatarUrl }}
                      style={{ width: 52, height: 52, borderRadius: 26 }}
                    />
                  ) : (
                    <Text style={{ fontSize: 22, fontWeight: '600', color: '#1C1C1E' }}>
                      {(user?.name || user?.username || 'U')[0].toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#1C1C1E' }}>
                    {user?.name || 'Your Name'}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>
                    Tap to change photo
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
              </TouchableOpacity>

              <SettingsRow
                icon="person-outline"
                iconColor={accent}
                title="Display Name"
                value={prefs.displayName || user?.name || 'Not set'}
                onPress={() => {
                  Alert.prompt(
                    'Display Name',
                    'Enter your display name',
                    (val) => { if (val?.trim()) update({ displayName: val.trim() }); },
                    'plain-text',
                    prefs.displayName || user?.name || '',
                  );
                }}
              />

              <SettingsRow
                icon="at-outline"
                iconColor="#3B82F6"
                title="Username"
                value={prefs.username || user?.username || 'Not set'}
                onPress={() => {
                  Alert.prompt(
                    'Username',
                    'Choose a unique username',
                    (val) => { if (val?.trim()) update({ username: val.trim().toLowerCase() }); },
                    'plain-text',
                    prefs.username || user?.username || '',
                  );
                }}
              />

              <SettingsRow
                icon="globe-outline"
                iconColor="#0D9488"
                title="Timezone"
                value={prefs.timezone.split('/').pop()?.replace(/_/g, ' ') || prefs.timezone}
                onPress={() => {
                  Alert.alert('Timezone', `Current timezone: ${prefs.timezone}\n\nTimezone is detected automatically from your device.`);
                }}
              />
            </SettingsSectionCard>

            {/* ═══════════════════════════════════════════════════
                2. INTEGRATIONS
            ═══════════════════════════════════════════════════ */}
            <SettingsSectionCard title="Integrations">
              {integrations.map((integ) => (
                <SettingsRow
                  key={integ.id}
                  icon={integ.icon}
                  iconColor={integ.iconColor}
                  title={integ.label}
                  rightElement={
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: integ.connected ? '#DCFCE7' : '#F2F2F7',
                        marginRight: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: integ.connected ? '#16A34A' : '#8E8E93',
                        }}
                      >
                        {integ.connected ? 'Connected' : 'Not Connected'}
                      </Text>
                    </View>
                  }
                  onPress={() => setShowIntegrations(true)}
                />
              ))}
            </SettingsSectionCard>

            {/* ═══════════════════════════════════════════════════
                3. GENERAL — Navigation to subpages
            ═══════════════════════════════════════════════════ */}
            <SettingsSectionCard title="General">
              <SettingsRow
                icon="mic-outline"
                iconColor={accent}
                title="AI & Voice"
                value={prefs.interactionMode === 'tap' ? 'Tap to Talk' : 'Hold to Talk'}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveSubpage('ai-voice');
                }}
              />
              <SettingsRow
                icon="notifications-outline"
                iconColor="#F59E0B"
                title="Notifications"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveSubpage('notifications');
                }}
              />
              <SettingsRow
                icon="shield-checkmark-outline"
                iconColor="#22C55E"
                title="Privacy & Security"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveSubpage('privacy');
                }}
              />
            </SettingsSectionCard>

            {/* ═══════════════════════════════════════════════════
                4. TASK & PLANNING DEFAULTS (stays inline)
            ═══════════════════════════════════════════════════ */}
            <SettingsSectionCard
              title="Task & Planning Defaults"
              footer="These defaults apply when creating tasks by voice or quick-add."
            >
              <SettingsRow
                icon="calendar-outline"
                iconColor="#3B82F6"
                title="Start of Week"
                value={prefs.startOfWeek === 'monday' ? 'Monday' : 'Sunday'}
                onPress={() => {
                  update({ startOfWeek: prefs.startOfWeek === 'monday' ? 'sunday' : 'monday' });
                  Haptics.selectionAsync();
                }}
              />
              <SettingsRow
                icon="time-outline"
                iconColor="#8EAAD8"
                title="Time Format"
                value={prefs.timeFormat === '12h' ? '12-hour' : '24-hour'}
                onPress={() => {
                  update({ timeFormat: prefs.timeFormat === '12h' ? '24h' : '12h' });
                  Haptics.selectionAsync();
                }}
              />
            </SettingsSectionCard>

            {/* ═══════════════════════════════════════════════════
                5. SESSION
            ═══════════════════════════════════════════════════ */}
            <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 24 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E5E5EA',
                  padding: 16,
                  alignItems: 'center',
                }}
                onPress={handleSignOut}
                activeOpacity={0.6}
                accessibilityLabel="Sign out"
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#FF3B30' }}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>

            {/* App version */}
            <Text
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: '#C7C7CC',
                marginBottom: 20,
              }}
            >
              MYPA v1.0.0
            </Text>
          </ScrollView>
        </SafeAreaView>
      )}

      {/* ── Sub-Modals ─────────────────────────────────────── */}
      <IntegrationStatusModal
        visible={showIntegrations}
        onClose={() => setShowIntegrations(false)}
        integrations={integrations}
        onToggle={handleIntegrationToggle}
        accentColor={accent}
      />
    </Modal>
  );
}
