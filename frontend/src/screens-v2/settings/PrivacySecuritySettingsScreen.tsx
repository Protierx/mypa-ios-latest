/**
 * Privacy & Security Settings Subpage
 *
 * Permissions, legal links, and destructive account actions.
 * Pushed from the main Settings hub.
 */

import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../lib/supabase';
import { eventLogger } from '../../services/eventLogger';
import {
  useSettingsPreferences,
  ACCENT_COLORS,
} from '../../state/settingsPreferences';
import { SettingsSectionCard, SettingsRow } from '../../components/settings';
import { bg, text as textTokens } from '../../styles/colors';

interface Props {
  onBack: () => void;
  onClose: () => void;
}

export function PrivacySecuritySettingsScreen({ onBack, onClose }: Props) {
  const { signOut } = useSupabaseAuth();
  const { prefs } = useSettingsPreferences();
  const accent = ACCENT_COLORS[prefs.accentPreset].primary;

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
            Alert.prompt(
              'Confirm Deletion',
              'Type DELETE to permanently remove your account.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async (typed: string | undefined) => {
                    if (typed?.trim().toUpperCase() !== 'DELETE') {
                      Alert.alert('Cancelled', 'You must type DELETE to confirm.');
                      return;
                    }
                    try {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg.primary }} edges={['top', 'bottom']}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Back to settings"
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Ionicons name="chevron-back" size={24} color={accent} />
          <Text style={{ fontSize: 17, color: accent, marginLeft: 2 }}>Settings</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: textTokens.primary,
          paddingHorizontal: 20,
          marginBottom: 20,
        }}
      >
        Privacy & Security
      </Text>

      {/* ── Content ────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSectionCard title="Permissions">
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
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Legal"
          footer="MYPA processes voice on-device when possible. Cloud processing is encrypted end-to-end."
        >
          <SettingsRow
            icon="document-text-outline"
            iconColor={textTokens.tertiary}
            title="Terms of Service"
            onPress={() => Linking.openURL('https://mypa.app/terms')}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            iconColor="#22C55E"
            title="Privacy Policy"
            onPress={() => Linking.openURL('https://mypa.app/privacy')}
          />
        </SettingsSectionCard>

        <SettingsSectionCard title="Account">
          <SettingsRow
            icon="trash-outline"
            title="Delete Account"
            destructive
            onPress={handleDeleteAccount}
          />
        </SettingsSectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
