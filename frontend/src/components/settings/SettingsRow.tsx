/**
 * Settings Row
 *
 * Unified row component for all settings list items.
 * Variants:
 *   - toggle (Switch)
 *   - navigation (chevron)
 *   - value (right-side text/chip)
 *   - destructive (red tint)
 */

import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { bg, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  /** Render a Switch on the right */
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  /** Static value text on the right */
  value?: string;
  /** Custom right-side node (overrides value/toggle) */
  rightElement?: ReactNode;
  /** Show chevron and make tappable */
  onPress?: () => void;
  /** Red destructive style */
  destructive?: boolean;
  /** Accessibility label override */
  accessLabel?: string;
  /** Accent color for Switch track */
  accentColor?: string;
}

export function SettingsRow({
  icon,
  iconColor = textTokens.tertiary,
  title,
  subtitle,
  toggle,
  toggleValue,
  onToggle,
  value,
  rightElement,
  onPress,
  destructive,
  accessLabel,
  accentColor = '#B958FF',
}: Props) {
  const textColor = destructive ? semantic.error : textTokens.primary;

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const handleToggle = (val: boolean) => {
    Haptics.selectionAsync();
    onToggle?.(val);
  };

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        paddingVertical: 10,
        paddingHorizontal: 16,
      }}
    >
      {/* Icon */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: destructive ? semantic.errorLight : bg.input,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? semantic.error : iconColor}
        />
      </View>

      {/* Label */}
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text
          style={{ fontSize: 16, color: textColor, fontWeight: '400' }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{ fontSize: 13, color: textTokens.tertiary, marginTop: 2 }}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right side */}
      {rightElement ? (
        rightElement
      ) : toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={handleToggle}
          trackColor={{ false: textTokens.disabled, true: accentColor }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={textTokens.disabled}
          accessibilityLabel={accessLabel || title}
        />
      ) : value ? (
        <Text style={{ fontSize: 15, color: textTokens.tertiary, marginRight: 4 }}>
          {value}
        </Text>
      ) : null}

      {/* Chevron for navigation rows */}
      {onPress && !toggle && (
        <Ionicons name="chevron-forward" size={18} color={textTokens.disabled} />
      )}
    </View>
  );

  if (onPress && !toggle) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.6}
        accessibilityLabel={accessLabel || title}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View accessibilityLabel={accessLabel || title}>
      {content}
    </View>
  );
}
