/**
 * Settings Screen (Full-screen, iOS-themed)
 *
 * Purpose: "App controls & configuration"
 * Opened from Profile View gear icon.
 *
 * Sections (per spec):
 *   1. Account (display name, username, timezone, location, avatar)
 *   2. Integrations (Apple, Google, Email, Calendar)
 *   3. AI & Voice (tap/hold to talk, spoken replies, sensitivity)
 *   4. Preferences (theme, accent, task defaults, notifications)
 *   5. Privacy & Security (permissions, data, legal)
 *   6. Session (sign out)
 *
 * Does NOT contain:
 *   - KPI cards or analytics charts (those are in Profile/AnalyticsModal)
 *   - Analytics segmented control (removed — Analytics accessed from Profile)
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
  Linking,
  Image,
  Switch,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Contexts
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useVoice } from '../../contexts/VoiceContext';
import { supabase } from '../../lib/supabase';
import { eventLogger } from '../../services/eventLogger';

// State
import {
  useSettingsPreferences,
  ACCENT_COLORS,
  type Priority,
} from '../../state/settingsPreferences';

// Components
import {
  SettingsSectionCard,
  SettingsRow,
  NotificationQuietHoursModal,
  IntegrationStatusModal,
} from '../../components/settings';

// ── Props ────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  onShowPaywall?: () => void;
}

// ── Pill Picker ──────────────────────────────────────────────

function PillPicker<T extends string>({
  options,
  value,
  onChange,
  accentColor,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accentColor: string;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(opt.key);
            }}
            accessibilityLabel={opt.label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: active ? accentColor : '#F2F2F7',
              borderWidth: active ? 0 : 1,
              borderColor: '#E5E5EA',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: active ? '600' : '400',
                color: active ? '#FFFFFF' : '#48484A',
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main Component ───────────────────────────────────────────

export function SettingsScreen({ visible, onClose, onShowPaywall }: Props) {
  const { user, signOut } = useSupabaseAuth();
  const voice = useVoice();
  const { prefs, update } = useSettingsPreferences();

  // Sub-modal states
  const [showQuietHours, setShowQuietHours] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);

  const accent = ACCENT_COLORS[prefs.accentPreset].primary;

  // ── Integrations data ───────────────────────────────────────

  const integrations = useMemo(() => [
    { id: 'apple', label: 'Apple', icon: 'logo-apple' as const, iconColor: '#1C1C1E', connected: prefs.appleConnected },
    { id: 'email', label: 'Email', icon: 'mail-outline' as const, iconColor: '#3B82F6', connected: prefs.emailConnected },
    { id: 'google', label: 'Google', icon: 'logo-google' as const, iconColor: '#EA4335', connected: prefs.googleConnected },
    { id: 'calendar', label: 'Calendar', icon: 'calendar-outline' as const, iconColor: '#FF9F0A', connected: prefs.calendarLinked },
  ], [prefs.appleConnected, prefs.emailConnected, prefs.googleConnected, prefs.calendarLinked]);

  const handleIntegrationToggle = useCallback((id: string) => {
    switch (id) {
      case 'apple': update({ appleConnected: !prefs.appleConnected }); break;
      case 'email': update({ emailConnected: !prefs.emailConnected }); break;
      case 'google': update({ googleConnected: !prefs.googleConnected }); break;
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
          onClose();
        },
      },
    ]);
  }, [signOut, onClose]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation: type DELETE
            Alert.prompt(
              'Confirm Deletion',
              'Type DELETE to permanently remove your account.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async (typed) => {
                    if (typed?.trim().toUpperCase() !== 'DELETE') {
                      Alert.alert('Cancelled', 'You must type DELETE to confirm.');
                      return;
                    }
                    try {
                      // Log before deletion
                      eventLogger.log('account_deleted', {});
                      await eventLogger.forceFlush();

                      const { error } = await supabase.functions.invoke('delete-account');
                      if (error) throw error;

                      await signOut();
                      onClose();
                    } catch (err) {
                      console.error('[Settings] Delete account error:', err);
                      Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
                    }
                  },
                },
              ],
              'plain-text',
            );
          },
        },
      ],
    );
  }, [signOut, onClose]);

  const handleDeleteVoiceHistory = useCallback(() => {
    Alert.alert(
      'Delete Voice History',
      'This will permanently delete all your voice command logs. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user: u } } = await supabase.auth.getUser();
              if (!u) return;

              const { error } = await supabase
                .from('event_log')
                .delete()
                .eq('user_id', u.id)
                .eq('event_type', 'voice_command');

              if (error) throw error;

              eventLogger.log('voice_history_deleted', {});
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Done', 'Voice history has been deleted.');
            } catch (err) {
              console.error('[Settings] Delete voice history error:', err);
              Alert.alert('Error', 'Failed to delete voice history.');
            }
          },
        },
      ],
    );
  }, []);

  const handleDurationChange = useCallback(() => {
    Alert.alert('Default Duration', 'Choose default task duration', [
      { text: '15 min', onPress: () => update({ defaultDuration: 15 }) },
      { text: '30 min', onPress: () => update({ defaultDuration: 30 }) },
      { text: '45 min', onPress: () => update({ defaultDuration: 45 }) },
      { text: '60 min', onPress: () => update({ defaultDuration: 60 }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [update]);

  // ── Render ──────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
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
            onPress={onClose}
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
              3. AI & VOICE
          ═══════════════════════════════════════════════════ */}
          <SettingsSectionCard
            title="AI & Voice"
            footer="Controls how MYPA listens and responds. Voice processing happens securely — no audio stored unless transcript saving is on."
          >
            <SettingsRow
              icon="hand-left-outline"
              iconColor={accent}
              title="Tap to Talk"
              subtitle="Tap the orb to start speaking"
              toggle
              toggleValue={prefs.interactionMode === 'tap'}
              onToggle={() => update({ interactionMode: 'tap' })}
              accentColor={accent}
            />
            <SettingsRow
              icon="finger-print-outline"
              iconColor="#F59E0B"
              title="Hold to Talk"
              subtitle="Hold the orb while speaking"
              toggle
              toggleValue={prefs.interactionMode === 'hold'}
              onToggle={() => update({ interactionMode: 'hold' })}
              accentColor={accent}
            />
          </SettingsSectionCard>

          {/* ═══════════════════════════════════════════════════
              4. PREFERENCES
          ═══════════════════════════════════════════════════ */}
          <SettingsSectionCard title="Preferences">
            {/* Theme */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 10, fontWeight: '500' }}>
                Theme
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: '#F2F2F7',
                  borderRadius: 10,
                  padding: 3,
                }}
              >
                {([{ mode: 'light' as const, label: 'Light', icon: 'sunny-outline' as const },
                  { mode: 'dark' as const, label: 'Dark', icon: 'moon-outline' as const },
                  { mode: 'system' as const, label: 'System', icon: 'phone-portrait-outline' as const }]).map((opt) => {
                  const selected = prefs.themeMode === opt.mode;
                  return (
                    <TouchableOpacity
                      key={opt.mode}
                      onPress={() => {
                        Haptics.selectionAsync();
                        update({ themeMode: opt.mode });
                      }}
                      activeOpacity={0.7}
                      accessibilityLabel={`${opt.label} theme`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: selected ? '#FFFFFF' : 'transparent',
                        ...(selected
                          ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }
                          : {}),
                      }}
                    >
                      <Ionicons name={opt.icon} size={15} color={selected ? accent : '#8E8E93'} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, fontWeight: selected ? '600' : '400', color: selected ? '#1C1C1E' : '#8E8E93' }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </SettingsSectionCard>

          <SettingsSectionCard
            title="Task & Planning Defaults"
            footer="These defaults apply when creating tasks by voice or quick-add."
          >
            <SettingsRow
              icon="timer-outline"
              iconColor="#22C55E"
              title="Default Duration"
              value={`${prefs.defaultDuration} min`}
              onPress={handleDurationChange}
            />

            <View>
              <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: '#F2F2F7',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name="flag-outline" size={18} color="#F59E0B" />
                  </View>
                  <Text style={{ fontSize: 16, color: '#1C1C1E' }}>Default Priority</Text>
                </View>
              </View>
              <PillPicker<Priority>
                options={[
                  { key: 'low', label: 'Low' },
                  { key: 'medium', label: 'Medium' },
                  { key: 'high', label: 'High' },
                  { key: 'urgent', label: 'Urgent' },
                ]}
                value={prefs.defaultPriority}
                onChange={(v) => update({ defaultPriority: v })}
                accentColor={accent}
              />
            </View>

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

          <SettingsSectionCard title="Notifications">
            <SettingsRow
              icon="sunny-outline"
              iconColor="#F59E0B"
              title="Daily Planning Reminder"
              subtitle="Morning nudge to plan your day"
              toggle
              toggleValue={prefs.dailyPlanningReminder}
              onToggle={(v) => update({ dailyPlanningReminder: v })}
              accentColor={accent}
            />
            <SettingsRow
              icon="alert-circle-outline"
              iconColor="#FF3B30"
              title="Overdue Nudges"
              toggle
              toggleValue={prefs.overdueNudges}
              onToggle={(v) => update({ overdueNudges: v })}
              accentColor={accent}
            />
            <SettingsRow
              icon="trophy-outline"
              iconColor="#EAB308"
              title="Challenge Deadline Alerts"
              toggle
              toggleValue={prefs.challengeDeadlineAlerts}
              onToggle={(v) => update({ challengeDeadlineAlerts: v })}
              accentColor={accent}
            />
            <SettingsRow
              icon="moon-outline"
              iconColor="#6366F1"
              title="Quiet Hours"
              value={prefs.quietHours.enabled ? `${prefs.quietHours.start} – ${prefs.quietHours.end}` : 'Off'}
              onPress={() => setShowQuietHours(true)}
            />
          </SettingsSectionCard>

          {/* ═══════════════════════════════════════════════════
              5. PRIVACY & SECURITY
          ═══════════════════════════════════════════════════ */}
          <SettingsSectionCard
            title="Privacy & Security"
            footer="MYPA processes voice on-device when possible. Cloud processing is encrypted end-to-end."
          >
            <SettingsRow
              icon="mic-outline"
              iconColor="#22C55E"
              title="Microphone Access"
              value={prefs.micPermission === 'granted' ? 'Granted' : prefs.micPermission === 'denied' ? 'Denied' : 'Not Set'}
              onPress={() => Linking.openSettings()}
            />
            <SettingsRow
              icon="calendar-outline"
              iconColor="#3B82F6"
              title="Calendar Access"
              value={prefs.calendarPermission === 'granted' ? 'Granted' : prefs.calendarPermission === 'denied' ? 'Denied' : 'Not Set'}
              onPress={() => Linking.openSettings()}
            />
            <SettingsRow
              icon="document-text-outline"
              iconColor="#8E8E93"
              title="Terms of Service"
              onPress={() => Linking.openURL('https://mypa.app/terms')}
            />
            <SettingsRow
              icon="shield-checkmark-outline"
              iconColor="#22C55E"
              title="Privacy Policy"
              onPress={() => Linking.openURL('https://mypa.app/privacy')}
            />
            <SettingsRow
              icon="mic-off-outline"
              iconColor="#FF9F0A"
              title="Delete Voice History"
              onPress={handleDeleteVoiceHistory}
            />
            <SettingsRow
              icon="trash-outline"
              title="Delete Account"
              destructive
              onPress={handleDeleteAccount}
            />
          </SettingsSectionCard>

          {/* ═══════════════════════════════════════════════════
              5b. CIRCLE PRIVACY (PRD 4.4)
          ═══════════════════════════════════════════════════ */}
          <SettingsSectionCard
            title="Circle Privacy"
            footer="Task titles are never shared with circle members — only aggregate counts."
          >
            <SettingsRow
              icon="checkbox-outline"
              iconColor="#22C55E"
              title="Share Task Count"
              subtitle="Show how many tasks you complete"
              toggle
              toggleValue={prefs.shareTaskCount ?? true}
              onToggle={(v) => update({ shareTaskCount: v } as any)}
              accentColor={accent}
            />
            <SettingsRow
              icon="timer-outline"
              iconColor="#8EAAD8"
              title="Share Focus Minutes"
              subtitle="Show your focus session time"
              toggle
              toggleValue={prefs.shareFocusMinutes ?? true}
              onToggle={(v) => update({ shareFocusMinutes: v } as any)}
              accentColor={accent}
            />
            <SettingsRow
              icon="flame-outline"
              iconColor="#F97316"
              title="Share Streak"
              subtitle="Show your current streak"
              toggle
              toggleValue={prefs.shareStreak ?? true}
              onToggle={(v) => update({ shareStreak: v } as any)}
              accentColor={accent}
            />
          </SettingsSectionCard>

          {/* ═══════════════════════════════════════════════════
              6. SESSION
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

      {/* ── Sub-Modals ─────────────────────────────────────── */}
      <NotificationQuietHoursModal
        visible={showQuietHours}
        onClose={() => setShowQuietHours(false)}
        quietHours={prefs.quietHours}
        onChange={(qh) => update({ quietHours: qh })}
        accentColor={accent}
      />

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
