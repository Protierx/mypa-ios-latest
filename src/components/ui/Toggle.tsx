import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type ToggleVariant = 'default' | 'outline';
type ToggleSize = 'default' | 'sm' | 'lg';

interface ToggleProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
  variant?: ToggleVariant;
  size?: ToggleSize;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ToggleVariant, { default: ViewStyle; pressed: ViewStyle }> = {
  default: {
    default: { backgroundColor: 'transparent' },
    pressed: { backgroundColor: '#F1F5F9' },
  },
  outline: {
    default: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E2E8F0' },
    pressed: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  },
};

const sizeStyles: Record<ToggleSize, ViewStyle> = {
  default: { height: 36, paddingHorizontal: 12, minWidth: 36 },
  sm: { height: 32, paddingHorizontal: 8, minWidth: 32 },
  lg: { height: 40, paddingHorizontal: 16, minWidth: 40 },
};

export function Toggle({
  pressed,
  onPressedChange,
  children,
  variant = 'default',
  size = 'default',
  disabled = false,
  style,
  textStyle,
}: ToggleProps) {
  const variantStyle = variantStyles[variant];
  const currentVariant = pressed ? variantStyle.pressed : variantStyle.default;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles[size],
        currentVariant,
        disabled && styles.disabled,
        style,
      ]}
      onPress={() => !disabled && onPressedChange(!pressed)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.text, pressed && styles.textPressed, textStyle]}>{children}</Text>
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
    gap: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  textPressed: {
    color: '#0F172A',
  },
  disabled: {
    opacity: 0.5,
  },
});
