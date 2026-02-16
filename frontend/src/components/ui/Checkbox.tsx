import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bg, brand, text as textTokens, border as borderTokens } from '../../styles/colors';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: number;
  style?: ViewStyle;
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  size = 20,
  style,
}: CheckboxProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: size, height: size, borderRadius: 4 },
        checked && styles.checked,
        disabled && styles.disabled,
        style,
      ]}
      onPress={() => !disabled && onCheckedChange(!checked)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {checked && (
        <Ionicons name="checkmark" size={size - 4} color={textTokens.inverse} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: borderTokens.primary,
    backgroundColor: bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: brand.primary,
    borderColor: brand.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
