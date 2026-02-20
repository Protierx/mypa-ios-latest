/**
 * AI & Voice Settings Subpage
 *
 * Controls how MYPA listens and responds.
 * Pushed from the main Settings hub.
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  useSettingsPreferences,
  ACCENT_COLORS,
} from '../../state/settingsPreferences';
import { SettingsSectionCard, SettingsRow } from '../../components/settings';
import { bg, text as textTokens } from '../../styles/colors';

interface Props {
  onBack: () => void;
}

export function AIVoiceSettingsScreen({ onBack }: Props) {
  const { prefs, update } = useSettingsPreferences();
  const accent = ACCENT_COLORS[prefs.accentPreset].primary;

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
        AI & Voice
      </Text>

      {/* ── Content ────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSectionCard
          title="Interaction Mode"
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
      </ScrollView>
    </SafeAreaView>
  );
}
