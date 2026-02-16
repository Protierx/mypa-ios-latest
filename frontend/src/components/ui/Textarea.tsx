import React from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { bg, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { radius } from '../../styles/theme';

interface TextareaProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  rows?: number;
}

export function Textarea({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  rows = 4,
  ...props
}: TextareaProps) {
  const minHeight = rows * 24;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          { minHeight },
          error && styles.inputError,
          inputStyle,
        ]}
        placeholderTextColor={textTokens.disabled}
        multiline
        textAlignVertical="top"
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
    borderWidth: 1,
    borderColor: borderTokens.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
