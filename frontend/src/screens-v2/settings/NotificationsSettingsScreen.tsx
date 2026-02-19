/**
 * Notifications Settings Subpage
 *
 * All notification preferences: daily reminders, overdue nudges,
 * challenge alerts, and quiet hours.
 * Pushed from the main Settings hub.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  useSettingsPreferences,
  ACCENT_COLORS,
} from '../../state/settingsPreferences';
import {
  SettingsSectionCard,
  SettingsRow,
  NotificationQuietHoursModal,
} from '../../components/settings';

interface Props {
  onBack: () => void;
}

export function NotificationsSettingsScreen({ onBack }: Props) {
  const { prefs, update } = useSettingsPreferences();
  const accent = ACCENT_COLORS[prefs.accentPreset].primary;
  const [showQuietHours, setShowQuietHours] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F8FA' }} edges={['top', 'bottom']}>
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
          color: '#1C1C1E',
          paddingHorizontal: 20,
          marginBottom: 20,
        }}
      >
        Notifications
      </Text>

      {/* ── Content ────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSectionCard title="Reminders">
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
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Schedule"
          footer="During quiet hours, MYPA will silence all non-critical notifications."
        >
          <SettingsRow
            icon="moon-outline"
            iconColor="#6366F1"
            title="Quiet Hours"
            value={prefs.quietHours.enabled ? `${prefs.quietHours.start} – ${prefs.quietHours.end}` : 'Off'}
            onPress={() => setShowQuietHours(true)}
          />
        </SettingsSectionCard>
      </ScrollView>

      {/* ── Quiet Hours Modal ──────────────────────────────── */}
      <NotificationQuietHoursModal
        visible={showQuietHours}
        onClose={() => setShowQuietHours(false)}
        quietHours={prefs.quietHours}
        onChange={(qh) => update({ quietHours: qh })}
        accentColor={accent}
      />
    </SafeAreaView>
  );
}
