import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { radius } from '../../styles/theme';

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
    button: { backgroundColor: brand.primary },
    text: { color: textTokens.inverse },
  },
  destructive: {
    button: { backgroundColor: semantic.error },
    text: { color: textTokens.inverse },
  },
  outline: {
    button: { backgroundColor: 'transparent', borderWidth: 1, borderColor: borderTokens.primary },
    text: { color: textTokens.primary },
  },
  secondary: {
    button: { backgroundColor: bg.secondary },
    text: { color: textTokens.primary },
  },
  ghost: {
    button: { backgroundColor: 'transparent' },
    text: { color: textTokens.primary },
  },
  link: {
    button: { backgroundColor: 'transparent' },
    text: { color: brand.primary, textDecorationLine: 'underline' },
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
    borderRadius: radius.sm,
    gap: 8,
  },
  text: {
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});
