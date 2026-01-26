import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type ToggleGroupType = 'single' | 'multiple';
type ToggleGroupVariant = 'default' | 'outline';
type ToggleGroupSize = 'default' | 'sm' | 'lg';

interface ToggleGroupProps {
  type: ToggleGroupType;
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  children: React.ReactNode;
  variant?: ToggleGroupVariant;
  size?: ToggleGroupSize;
  style?: ViewStyle;
}

interface ToggleGroupItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const ToggleGroupContext = React.createContext<{
  type: ToggleGroupType;
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  variant: ToggleGroupVariant;
  size: ToggleGroupSize;
}>({
  type: 'single',
  value: '',
  onValueChange: () => {},
  variant: 'default',
  size: 'default',
});

const sizeStyles: Record<ToggleGroupSize, ViewStyle> = {
  default: { height: 36, paddingHorizontal: 12, minWidth: 36 },
  sm: { height: 32, paddingHorizontal: 8, minWidth: 32 },
  lg: { height: 40, paddingHorizontal: 16, minWidth: 40 },
};

export function ToggleGroup({
  type,
  value,
  onValueChange,
  children,
  variant = 'default',
  size = 'default',
  style,
}: ToggleGroupProps) {
  return (
    <ToggleGroupContext.Provider value={{ type, value, onValueChange, variant, size }}>
      <View
        style={[
          styles.group,
          variant === 'outline' && styles.groupOutline,
          style,
        ]}
      >
        {children}
      </View>
    </ToggleGroupContext.Provider>
  );
}

export function ToggleGroupItem({
  value,
  children,
  disabled = false,
  style,
  textStyle,
}: ToggleGroupItemProps) {
  const { type, value: selectedValue, onValueChange, variant, size } = React.useContext(ToggleGroupContext);

  const isPressed = type === 'single'
    ? selectedValue === value
    : (selectedValue as string[]).includes(value);

  const handlePress = () => {
    if (disabled) return;

    if (type === 'single') {
      onValueChange(value);
    } else {
      const currentValues = selectedValue as string[];
      if (currentValues.includes(value)) {
        onValueChange(currentValues.filter(v => v !== value));
      } else {
        onValueChange([...currentValues, value]);
      }
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.item,
        sizeStyles[size],
        variant === 'outline' && styles.itemOutline,
        isPressed && styles.itemPressed,
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.text, isPressed && styles.textPressed, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
  },
  groupOutline: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 6,
  },
  itemOutline: {
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  itemPressed: {
    backgroundColor: '#F1F5F9',
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
