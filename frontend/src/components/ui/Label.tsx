import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { text as textTokens } from '../../styles/colors';

interface LabelProps {
  children: React.ReactNode;
  style?: TextStyle;
  disabled?: boolean;
}

export function Label({ children, style, disabled }: LabelProps) {
  return (
    <Text style={[styles.label, disabled && styles.disabled, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: textTokens.primary,
    marginBottom: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});
