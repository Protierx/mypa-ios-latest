import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { brand, border as borderTokens } from '../../styles/colors';
import { springs } from '../../styles/motion';

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
  color = brand.primary,
  backgroundColor = borderTokens.primary,
  height = 8,
  style,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withSpring(percentage, springs.gentle);
  }, [percentage]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%` as unknown as number,
    backgroundColor: color,
    height,
  }));

  return (
    <View style={[styles.container, { height, backgroundColor }, style]}>
      <Animated.View style={[styles.fill, fillStyle]} />
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
