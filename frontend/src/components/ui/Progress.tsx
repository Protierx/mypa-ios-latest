import React from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';

interface ProgressProps {
  value: number;
  max?: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
}

export function Progress({
  value,
  max = 100,
  color = '#8B5CF6',
  backgroundColor = '#E2E8F0',
  height = 8,
  style,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <View style={[styles.container, { height, backgroundColor }, style]}>
      <View
        style={[
          styles.fill,
          { width: `${percentage}%`, backgroundColor: color, height },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 100,
  },
});
