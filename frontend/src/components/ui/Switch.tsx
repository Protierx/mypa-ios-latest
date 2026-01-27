import React from 'react';
import { TouchableOpacity, View, StyleSheet, Animated, ViewStyle } from 'react-native';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Switch({ checked, onCheckedChange, disabled = false, style }: SwitchProps) {
  const animatedValue = React.useRef(new Animated.Value(checked ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: checked ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [checked]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E2E8F0', '#8B5CF6'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
    >
      <Animated.View style={[styles.track, { backgroundColor }, disabled && styles.disabled, style]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
