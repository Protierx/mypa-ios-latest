/**
 * Theme & Accent Picker
 *
 * Segmented control for Light/Dark/System + accent colour dots.
 * Changes apply immediately and persist via settingsPreferences.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  ThemeMode,
  AccentPreset,
  ACCENT_COLORS,
} from '../../state/settingsPreferences';

interface Props {
  themeMode: ThemeMode;
  accentPreset: AccentPreset;
  onThemeChange: (mode: ThemeMode) => void;
  onAccentChange: (preset: AccentPreset) => void;
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export function ThemeAccentPicker({ themeMode, accentPreset, onThemeChange, onAccentChange }: Props) {
  const accent = ACCENT_COLORS[accentPreset];

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
      {/* Theme segmented control */}
      <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 10, fontWeight: '500' }}>
        Theme
      </Text>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#F2F2F7',
          borderRadius: 10,
          padding: 3,
          marginBottom: 20,
        }}
      >
        {THEME_OPTIONS.map((opt) => {
          const selected = themeMode === opt.mode;
          return (
            <TouchableOpacity
              key={opt.mode}
              onPress={() => {
                Haptics.selectionAsync();
                onThemeChange(opt.mode);
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
                  ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }
                  : {}),
              }}
            >
              <Ionicons
                name={opt.icon}
                size={15}
                color={selected ? accent.primary : '#8E8E93'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: selected ? '600' : '400',
                  color: selected ? '#1C1C1E' : '#8E8E93',
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Accent colour dots */}
      <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 10, fontWeight: '500' }}>
        Accent colour
      </Text>
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        {(Object.keys(ACCENT_COLORS) as AccentPreset[]).map((key) => {
          const c = ACCENT_COLORS[key];
          const selected = accentPreset === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => {
                Haptics.selectionAsync();
                onAccentChange(key);
              }}
              accessibilityLabel={`${c.label} accent`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={{
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c.primary,
                  borderWidth: selected ? 3 : 0,
                  borderColor: '#1C1C1E',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selected && (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                )}
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: selected ? '#1C1C1E' : '#8E8E93',
                  marginTop: 4,
                  fontWeight: selected ? '600' : '400',
                }}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Preview */}
      <View
        style={{
          marginTop: 16,
          borderRadius: 10,
          backgroundColor: accent.light,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: accent.primary,
            marginRight: 10,
          }}
        />
        <Text style={{ fontSize: 14, color: accent.primary, fontWeight: '600' }}>
          {accent.label} accent active
        </Text>
      </View>
    </View>
  );
}
