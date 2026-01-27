import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    container: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
    icon: 'information-circle',
    iconColor: '#64748B',
  },
  destructive: {
    container: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    icon: 'alert-circle',
    iconColor: '#DC2626',
  },
  success: {
    container: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
    icon: 'checkmark-circle',
    iconColor: '#16A34A',
  },
  warning: {
    container: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
    icon: 'warning',
    iconColor: '#D97706',
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
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
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
    color: '#0F172A',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});
