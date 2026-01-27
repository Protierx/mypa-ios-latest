import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';

interface InputOTPProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

export function InputOTP({
  value,
  onChange,
  length = 6,
  disabled = false,
  style,
}: InputOTPProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleChange = (text: string, index: number) => {
    const newValue = value.split('');
    newValue[index] = text.slice(-1);
    const result = newValue.join('').slice(0, length);
    onChange(result);

    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={[
            styles.input,
            focusedIndex === index && styles.inputFocused,
            value[index] && styles.inputFilled,
            disabled && styles.disabled,
          ]}
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(-1)}
          keyboardType="number-pad"
          maxLength={1}
          editable={!disabled}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  input: {
    width: 44,
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  inputFocused: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
  },
  inputFilled: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: '#F1F5F9',
  },
});
