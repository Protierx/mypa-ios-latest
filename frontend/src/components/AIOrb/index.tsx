/**
 * AIOrb Component - The visual representation of Mylo AI
 * 
 * From design spec:
 * 
 * States:
 * - IDLE: Gentle pulsing glow, scale 1.0 ↔ 1.03 every 4s
 * - LISTENING: Rapid pulse 1.0 ↔ 1.08 every 800ms, concentric rings
 * - PROCESSING: Rotating gradient, sparkle particles
 * - SPEAKING: Rhythmic pulse matching audio
 * 
 * Sizes:
 * - large: 160×160px (AI Home)
 * - mini: 44×44px (corners)
 * 
 * Visual:
 * - Conic gradient: #7C3AED → #A78BFA → #C4B5FD → #A78BFA → #7C3AED
 * - Outer glow: 60px blur, #7C3AED at 30%
 * - Inner highlight: 24px white dot top-left at 40%
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { structuredColors as colors } from '../../styles/colors';
import { theme } from '../../styles/theme';

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
export type OrbSize = 'large' | 'mini';

interface AIorbProps {
  state?: OrbState;
  size?: OrbSize;
  onPress?: () => void;
  disabled?: boolean;
}

// Size configurations from design spec
const sizeConfig = {
  large: {
    container: 160,
    glow: 60,
    highlight: 24,
  },
  mini: {
    container: 44,
    glow: 16,
    highlight: 8,
  },
};

// Animation timings from design spec
const animationConfig = {
  idle: {
    duration: 4000,
    scaleMin: 1.0,
    scaleMax: 1.03,
    glowOpacity: 0.3,
  },
  listening: {
    duration: 800,
    scaleMin: 1.0,
    scaleMax: 1.08,
    glowOpacity: 0.6,
  },
  processing: {
    duration: 1500,
    glowOpacity: 0.5,
  },
  speaking: {
    duration: 300,
    scaleMin: 1.0,
    scaleMax: 1.15,
    glowOpacity: 0.8,
  },
  error: {
    duration: 200,
    glowOpacity: 0.4,
  },
};

export function AIOrb({
  state = 'idle',
  size = 'large',
  onPress,
  disabled = false,
}: AIorbProps) {
  const config = sizeConfig[size];
  
  // Animation shared values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(animationConfig.idle.glowOpacity);
  const rotation = useSharedValue(0);
  const ringScale1 = useSharedValue(1);
  const ringScale2 = useSharedValue(1);
  const ringScale3 = useSharedValue(1);
  const ringOpacity1 = useSharedValue(0);
  const ringOpacity2 = useSharedValue(0);
  const ringOpacity3 = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const errorFlash = useSharedValue(0);
  
  // Update animations based on state
  useEffect(() => {
    // Cancel previous animations
    cancelAnimation(scale);
    cancelAnimation(rotation);
    cancelAnimation(ringScale1);
    cancelAnimation(ringScale2);
    cancelAnimation(ringScale3);
    
    switch (state) {
      case 'idle':
        // Gentle pulsing
        scale.value = withRepeat(
          withSequence(
            withTiming(animationConfig.idle.scaleMax, {
              duration: animationConfig.idle.duration / 2,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(animationConfig.idle.scaleMin, {
              duration: animationConfig.idle.duration / 2,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          true
        );
        glowOpacity.value = withTiming(animationConfig.idle.glowOpacity, { duration: 300 });
        rotation.value = withTiming(0, { duration: 300 });
        break;
        
      case 'listening':
        // Rapid pulsing with concentric rings
        scale.value = withRepeat(
          withSequence(
            withTiming(animationConfig.listening.scaleMax, {
              duration: animationConfig.listening.duration / 2,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(animationConfig.listening.scaleMin, {
              duration: animationConfig.listening.duration / 2,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          true
        );
        glowOpacity.value = withTiming(animationConfig.listening.glowOpacity, { duration: 200 });
        
        // Concentric rings animation
        const ringAnimation = () => {
          ringScale1.value = 1;
          ringOpacity1.value = 0.4;
          ringScale1.value = withTiming(1.5, { duration: 1000, easing: Easing.out(Easing.ease) });
          ringOpacity1.value = withTiming(0, { duration: 1000 });
          
          setTimeout(() => {
            ringScale2.value = 1;
            ringOpacity2.value = 0.4;
            ringScale2.value = withTiming(1.5, { duration: 1000, easing: Easing.out(Easing.ease) });
            ringOpacity2.value = withTiming(0, { duration: 1000 });
          }, 200);
          
          setTimeout(() => {
            ringScale3.value = 1;
            ringOpacity3.value = 0.4;
            ringScale3.value = withTiming(1.5, { duration: 1000, easing: Easing.out(Easing.ease) });
            ringOpacity3.value = withTiming(0, { duration: 1000 });
          }, 400);
        };
        
        ringAnimation();
        const ringInterval = setInterval(ringAnimation, 1000);
        
        // Cleanup interval when state changes
        return () => clearInterval(ringInterval);
        
      case 'processing':
        // Continuous rotation
        scale.value = withTiming(1.02, { duration: 200 });
        glowOpacity.value = withTiming(animationConfig.processing.glowOpacity, { duration: 200 });
        rotation.value = withRepeat(
          withTiming(360, {
            duration: animationConfig.processing.duration,
            easing: Easing.linear,
          }),
          -1,
          false
        );
        break;
        
      case 'speaking':
        // Rhythmic pulsing (would sync with audio in real implementation)
        scale.value = withRepeat(
          withSequence(
            withTiming(animationConfig.speaking.scaleMax, {
              duration: animationConfig.speaking.duration,
              easing: Easing.out(Easing.ease),
            }),
            withTiming(animationConfig.speaking.scaleMin, {
              duration: animationConfig.speaking.duration,
              easing: Easing.in(Easing.ease),
            })
          ),
          -1,
          true
        );
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(animationConfig.speaking.glowOpacity, { duration: animationConfig.speaking.duration }),
            withTiming(0.4, { duration: animationConfig.speaking.duration })
          ),
          -1,
          true
        );
        break;
        
      case 'error':
        // Shake animation with red flash
        shakeX.value = withSequence(
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
        errorFlash.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
        
        // Return to idle after error
        setTimeout(() => {
          scale.value = withSpring(1);
          glowOpacity.value = withTiming(animationConfig.idle.glowOpacity, { duration: 300 });
        }, 1000);
        break;
    }
  }, [state]);
  
  // Handle press
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress?.();
  };
  
  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: shakeX.value },
    ],
  }));
  
  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  const ring1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale1.value }],
    opacity: ringOpacity1.value,
  }));
  
  const ring2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale2.value }],
    opacity: ringOpacity2.value,
  }));
  
  const ring3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale3.value }],
    opacity: ringOpacity3.value,
  }));
  
  const errorOverlayStyle = useAnimatedStyle(() => ({
    opacity: errorFlash.value * 0.4,
  }));
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.9}
    >
      <Animated.View 
        style={[
          styles.container, 
          { width: config.container, height: config.container },
          containerAnimatedStyle
        ]}
      >
        {/* Outer glow */}
        <Animated.View
          style={[
            styles.glow,
            {
              width: config.container + config.glow,
              height: config.container + config.glow,
              borderRadius: (config.container + config.glow) / 2,
            },
            glowAnimatedStyle,
          ]}
        />
        
        {/* Concentric rings (for listening state) */}
        {state === 'listening' && (
          <>
            <Animated.View
              style={[
                styles.ring,
                { width: config.container, height: config.container, borderRadius: config.container / 2 },
                ring1AnimatedStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                { width: config.container, height: config.container, borderRadius: config.container / 2 },
                ring2AnimatedStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                { width: config.container, height: config.container, borderRadius: config.container / 2 },
                ring3AnimatedStyle,
              ]}
            />
          </>
        )}
        
        {/* Main orb with gradient */}
        <Animated.View style={[styles.orbWrapper, orbAnimatedStyle]}>
          <LinearGradient
            colors={[
              colors.brand.primary,    // #7C3AED
              colors.brand.secondary,  // #A78BFA
              colors.brand.tertiary,   // #C4B5FD
              colors.brand.secondary,  // #A78BFA
              colors.brand.primary,    // #7C3AED
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.orb,
              {
                width: config.container,
                height: config.container,
                borderRadius: config.container / 2,
              },
            ]}
          >
            {/* Inner highlight */}
            <View
              style={[
                styles.highlight,
                {
                  width: config.highlight,
                  height: config.highlight,
                  borderRadius: config.highlight / 2,
                  top: config.container * 0.15,
                  left: config.container * 0.15,
                },
              ]}
            />
          </LinearGradient>
        </Animated.View>
        
        {/* Error overlay */}
        {state === 'error' && (
          <Animated.View
            style={[
              styles.errorOverlay,
              {
                width: config.container,
                height: config.container,
                borderRadius: config.container / 2,
              },
              errorOverlayStyle,
            ]}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: colors.brand.primary,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.brand.secondary,
    backgroundColor: 'transparent',
  },
  orbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  highlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  errorOverlay: {
    position: 'absolute',
    backgroundColor: colors.semantic.error,
  },
});

export default AIOrb;
