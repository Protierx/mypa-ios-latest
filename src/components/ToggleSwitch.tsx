import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface ToggleSwitchProps {
  active: boolean;
  onToggle: () => void;
}

export function ToggleSwitch({ active, onToggle }: ToggleSwitchProps) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.track, active ? styles.trackActive : styles.trackInactive]}
      activeOpacity={0.8}
    >
      <View style={[styles.thumb, active ? styles.thumbActive : styles.thumbInactive]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 51,
    height: 31,
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  trackActive: {
    backgroundColor: '#8B5CF6',
  },
  trackInactive: {
    backgroundColor: '#CBD5E1',
  },
  thumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbActive: {
    transform: [{ translateX: 20 }],
  },
  thumbInactive: {
    transform: [{ translateX: 0 }],
  },
});
