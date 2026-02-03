/**
 * SwipeHints - Visual indicators for swipe directions
 * 
 * Shows on first 3 sessions, then fades away
 * From design spec:
 * - "← Tasks" on left edge
 * - "→ Social" on right edge  
 * - "↑ Focus" on top center
 * - "↓ Profile" on bottom center
 * - All hints: 13px regular #52525B, auto-hide after 3s
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { structuredColors as colors } from '../styles/colors';
import { theme } from '../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Storage key for tracking session count
const SESSION_COUNT_KEY = '@mylo_gesture_sessions';
const MAX_SESSIONS_WITH_HINTS = 3;

// Animation timing from design spec
const FADE_IN_DURATION = 200;
const HOLD_DURATION = 2500;
const FADE_OUT_DURATION = 200;
const TOTAL_VISIBLE_DURATION = FADE_IN_DURATION + HOLD_DURATION + FADE_OUT_DURATION;

interface SwipeHintsProps {
  visible?: boolean;
  onHintsComplete?: () => void;
}

export function SwipeHints({ visible = true, onHintsComplete }: SwipeHintsProps) {
  const [shouldShow, setShouldShow] = useState(false);
  
  // Animation values for each hint
  const leftOpacity = useSharedValue(0);
  const rightOpacity = useSharedValue(0);
  const topOpacity = useSharedValue(0);
  const bottomOpacity = useSharedValue(0);
  
  // Check if we should show hints based on session count
  useEffect(() => {
    const checkSessionCount = async () => {
      try {
        const sessionCount = await AsyncStorage.getItem(SESSION_COUNT_KEY);
        const count = sessionCount ? parseInt(sessionCount, 10) : 0;
        
        if (count < MAX_SESSIONS_WITH_HINTS) {
          setShouldShow(true);
          // Increment session count
          await AsyncStorage.setItem(SESSION_COUNT_KEY, (count + 1).toString());
        }
      } catch (error) {
        console.log('Error checking gesture session count:', error);
        // On error, show hints anyway for better UX
        setShouldShow(true);
      }
    };
    
    checkSessionCount();
  }, []);
  
  // Animate hints in and out
  useEffect(() => {
    if (!shouldShow || !visible) return;
    
    // Fade in all hints
    const fadeInConfig = {
      duration: FADE_IN_DURATION,
      easing: Easing.out(Easing.ease),
    };
    
    leftOpacity.value = withTiming(1, fadeInConfig);
    rightOpacity.value = withTiming(1, fadeInConfig);
    topOpacity.value = withTiming(1, fadeInConfig);
    bottomOpacity.value = withTiming(1, fadeInConfig);
    
    // Schedule fade out
    const fadeOutConfig = {
      duration: FADE_OUT_DURATION,
      easing: Easing.out(Easing.ease),
    };
    
    const fadeOutDelay = HOLD_DURATION;
    
    leftOpacity.value = withDelay(fadeOutDelay, withTiming(0, fadeOutConfig));
    rightOpacity.value = withDelay(fadeOutDelay, withTiming(0, fadeOutConfig));
    topOpacity.value = withDelay(fadeOutDelay, withTiming(0, fadeOutConfig));
    bottomOpacity.value = withDelay(fadeOutDelay, withTiming(0, fadeOutConfig));
    
    // Notify when complete
    if (onHintsComplete) {
      const timer = setTimeout(onHintsComplete, TOTAL_VISIBLE_DURATION);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, visible]);
  
  // Animated styles
  const leftAnimatedStyle = useAnimatedStyle(() => ({
    opacity: leftOpacity.value,
  }));
  
  const rightAnimatedStyle = useAnimatedStyle(() => ({
    opacity: rightOpacity.value,
  }));
  
  const topAnimatedStyle = useAnimatedStyle(() => ({
    opacity: topOpacity.value,
  }));
  
  const bottomAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bottomOpacity.value,
  }));
  
  if (!shouldShow || !visible) return null;
  
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Left hint - Tasks */}
      <Animated.View style={[styles.hint, styles.leftHint, leftAnimatedStyle]}>
        <Ionicons name="chevron-back" size={16} color={colors.text.tertiary} />
        <Text style={styles.hintText}>Tasks</Text>
      </Animated.View>
      
      {/* Right hint - Social */}
      <Animated.View style={[styles.hint, styles.rightHint, rightAnimatedStyle]}>
        <Text style={styles.hintText}>Social</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
      </Animated.View>
      
      {/* Top hint - Focus */}
      <Animated.View style={[styles.hint, styles.topHint, topAnimatedStyle]}>
        <Ionicons name="chevron-up" size={16} color={colors.text.tertiary} />
        <Text style={styles.hintText}>Focus</Text>
      </Animated.View>
      
      {/* Bottom hint - Profile */}
      <Animated.View style={[styles.hint, styles.bottomHint, bottomAnimatedStyle]}>
        <Text style={styles.hintText}>Profile</Text>
        <Ionicons name="chevron-down" size={16} color={colors.text.tertiary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  hint: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  hintText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.tertiary, // #52525B from spec
  },
  leftHint: {
    left: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  rightHint: {
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  topHint: {
    top: 100,
    left: '50%',
    transform: [{ translateX: -30 }],
    flexDirection: 'column',
  },
  bottomHint: {
    bottom: 50,
    left: '50%',
    transform: [{ translateX: -30 }],
    flexDirection: 'column',
  },
});

export default SwipeHints;
