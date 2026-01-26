import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { button: ViewStyle; text: TextStyle }> = {
  default: {
    button: { backgroundColor: '#8B5CF6' },
    text: { color: '#FFFFFF' },
  },
  destructive: {
    button: { backgroundColor: '#EF4444' },
    text: { color: '#FFFFFF' },
  },
  outline: {
    button: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E2E8F0' },
    text: { color: '#0F172A' },
  },
  secondary: {
    button: { backgroundColor: '#F1F5F9' },
    text: { color: '#0F172A' },
  },
  ghost: {
    button: { backgroundColor: 'transparent' },
    text: { color: '#0F172A' },
  },
  link: {
    button: { backgroundColor: 'transparent' },
    text: { color: '#8B5CF6', textDecorationLine: 'underline' },
  },
};

const sizeStyles: Record<ButtonSize, { button: ViewStyle; text: TextStyle }> = {
  default: {
    button: { height: 40, paddingHorizontal: 16 },
    text: { fontSize: 14 },
  },
  sm: {
    button: { height: 32, paddingHorizontal: 12 },
    text: { fontSize: 12 },
  },
  lg: {
    button: { height: 48, paddingHorizontal: 24 },
    text: { fontSize: 16 },
  },
  icon: {
    button: { height: 40, width: 40, paddingHorizontal: 0 },
    text: { fontSize: 14 },
  },
};

export function Button({
  children,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  onPress,
  style,
  textStyle,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyle.button,
        sizeStyle.button,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color} size="small" />
      ) : typeof children === 'string' ? (
        <Text style={[styles.text, variantStyle.text, sizeStyle.text, textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 8,
  },
  text: {
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});
