import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { bg, brand, text as textTokens, border as borderTokens } from '../../styles/colors';
import { spacing } from '../../styles/theme';

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

interface RadioGroupItemProps {
  value: string;
  children?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

const RadioGroupContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({ value: '', onValueChange: () => {} });

export function RadioGroup({ value, onValueChange, children, style }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <View style={[styles.group, style]}>{children}</View>
    </RadioGroupContext.Provider>
  );
}

export function RadioGroupItem({ value, children, disabled, style }: RadioGroupItemProps) {
  const { value: selectedValue, onValueChange } = React.useContext(RadioGroupContext);
  const isSelected = selectedValue === value;

  return (
    <TouchableOpacity
      style={[styles.itemContainer, style]}
      onPress={() => !disabled && onValueChange(value)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.radio, isSelected && styles.radioSelected, disabled && styles.disabled]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
      {children && (
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.md,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: borderTokens.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bg.card,
  },
  radioSelected: {
    borderColor: brand.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: brand.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    color: textTokens.primary,
  },
  labelDisabled: {
    opacity: 0.5,
  },
});
