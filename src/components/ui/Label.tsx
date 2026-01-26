import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

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
    color: '#0F172A',
    marginBottom: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});
