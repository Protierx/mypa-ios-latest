import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bg, text as textTokens, semantic, border as borderTokens } from '../../styles/colors';
import { radius, spacing } from '../../styles/theme';

type AlertVariant = 'default' | 'destructive' | 'success' | 'warning';

interface AlertProps {
  children: React.ReactNode;
  variant?: AlertVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

interface AlertTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

const variantStyles: Record<AlertVariant, { container: ViewStyle; icon: string; iconColor: string }> = {
  default: {
    container: { backgroundColor: bg.primary, borderColor: borderTokens.primary },
    icon: 'information-circle',
    iconColor: textTokens.secondary,
  },
  destructive: {
    container: { backgroundColor: semantic.errorLight, borderColor: semantic.errorLight },
    icon: 'alert-circle',
    iconColor: semantic.error,
  },
  success: {
    container: { backgroundColor: semantic.successLight, borderColor: semantic.successSoft },
    icon: 'checkmark-circle',
    iconColor: semantic.success,
  },
  warning: {
    container: { backgroundColor: semantic.warningLight, borderColor: semantic.warningLight },
    icon: 'warning',
    iconColor: semantic.warning,
  },
};

export function Alert({ children, variant = 'default', icon, style }: AlertProps) {
  const variantStyle = variantStyles[variant];
  const iconName = icon || variantStyle.icon;

  return (
    <View style={[styles.container, variantStyle.container, style]}>
      <Ionicons name={iconName as any} size={20} color={variantStyle.iconColor} style={styles.icon} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

export function AlertTitle({ children, style }: AlertTitleProps) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function AlertDescription({ children, style }: AlertDescriptionProps) {
  return <Text style={[styles.description, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.base,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.md,
  },
  icon: {
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: textTokens.primary,
  },
  description: {
    fontSize: 14,
    color: textTokens.secondary,
    lineHeight: 20,
  },
});
