import React from 'react';
import { View, Animated, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { styles } from '../styles';

interface ToggleProps {
  value: boolean;
  onToggle: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Toggle: React.FC<ToggleProps> = ({ value, onToggle, style }) => (
  <TouchableOpacity
    onPress={onToggle}
    style={[styles.toggle, value && styles.toggleActive, style]}
  >
    <Animated.View
      style={[styles.toggleKnob, value && styles.toggleKnobActive]}
    />
  </TouchableOpacity>
);
