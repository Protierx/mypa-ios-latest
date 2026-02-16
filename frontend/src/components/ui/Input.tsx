import React from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { bg, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { radius } from '../../styles/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  ...props
}: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          inputStyle,
        ]}
        placeholderTextColor={textTokens.disabled}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: textTokens.primary,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: borderTokens.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    fontSize: 15,
    color: textTokens.primary,
    backgroundColor: bg.card,
  },
  inputError: {
    borderColor: semantic.error,
  },
  error: {
    fontSize: 12,
    color: semantic.error,
  },
});
