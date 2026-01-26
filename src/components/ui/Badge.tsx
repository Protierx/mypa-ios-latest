import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<BadgeVariant, { container: ViewStyle; text: TextStyle }> = {
  default: {
    container: { backgroundColor: '#8B5CF6' },
    text: { color: '#FFFFFF' },
  },
  secondary: {
    container: { backgroundColor: '#F1F5F9' },
    text: { color: '#0F172A' },
  },
  destructive: {
    container: { backgroundColor: '#FEE2E2' },
    text: { color: '#DC2626' },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E2E8F0' },
    text: { color: '#0F172A' },
  },
};

export function Badge({ children, variant = 'default', style, textStyle }: BadgeProps) {
  const variantStyle = variantStyles[variant];

  return (
    <View style={[styles.container, variantStyle.container, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, variantStyle.text, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
