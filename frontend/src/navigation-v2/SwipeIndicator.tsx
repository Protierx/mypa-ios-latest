/**
 * Swipe Indicator
 * 
 * Visual hints at screen edges showing users they can swipe.
 * Subtle animated arrows with labels.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface SwipeIndicatorProps {
  direction: 'left' | 'right' | 'up' | 'down';
  label?: string;
  visible?: boolean;
}

const ICON_MAP = {
  left: 'chevron-back',
  right: 'chevron-forward',
  up: 'chevron-up',
  down: 'chevron-down',
} as const;

export function SwipeIndicator({ direction, label, visible = true }: SwipeIndicatorProps) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const opacity = useSharedValue(0);
  const translateOffset = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Fade in
      opacity.value = withTiming(0.4, { duration: 300 });
      
      // Bounce animation
      const bounceDistance = direction === 'left' || direction === 'right' ? 5 : 3;
      translateOffset.value = withRepeat(
        withSequence(
          withTiming(bounceDistance, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite
        true
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    const transform = [];
    
    if (direction === 'left') {
      transform.push({ translateX: -translateOffset.value });
    } else if (direction === 'right') {
      transform.push({ translateX: translateOffset.value });
    } else if (direction === 'up') {
      transform.push({ translateY: -translateOffset.value });
    } else if (direction === 'down') {
      transform.push({ translateY: translateOffset.value });
    }
    
    return {
      opacity: opacity.value,
      transform,
    };
  });

  if (!visible) return null;

  const positionStyle = getPositionStyle(direction, SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <Animated.View style={[styles.container, positionStyle, animatedStyle]}>
      <Ionicons 
        name={ICON_MAP[direction]} 
        size={20} 
        color="rgba(255,255,255,0.8)" 
      />
      {label && <Text style={styles.label}>{label}</Text>}
    </Animated.View>
  );
}

function getPositionStyle(direction: SwipeIndicatorProps['direction'], SCREEN_WIDTH: number, SCREEN_HEIGHT: number) {
  switch (direction) {
    case 'left':
      return {
        left: 8,
        top: SCREEN_HEIGHT / 2 - 30,
      };
    case 'right':
      return {
        right: 8,
        top: SCREEN_HEIGHT / 2 - 30,
      };
    case 'up':
      return {
        bottom: 40,
        left: SCREEN_WIDTH / 2 - 25,
      };
    case 'down':
      return {
        top: 60,
        left: SCREEN_WIDTH / 2 - 25,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 60,
    zIndex: 100,
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    marginTop: 2,
    fontWeight: '500',
  },
});
