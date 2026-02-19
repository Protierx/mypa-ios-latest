/**
 * Center Focal Glow Component
 * 
 * Soft glowing center that indicates where to tap and shows AI presence.
 * It breathes and pulses, feeling alive.
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Step 5.6
 */

import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { Circle, Group, RadialGradient, vec } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  withSpring,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface CenterGlowProps {
  voiceState: VoiceState;
  energy?: number; // 0-1, voice volume
}

const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = SCREEN_HEIGHT / 2 - 50; // Slightly above center

export function CenterGlow({ voiceState, energy = 0 }: CenterGlowProps) {
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);
  const innerGlowOpacity = useSharedValue(0.4);
  
  // Energy tracking for listening state
  const energyValue = useSharedValue(energy);
  
  useEffect(() => {
    energyValue.value = energy;
  }, [energy]);

  // State-based animations
  useEffect(() => {
    switch (voiceState) {
      case 'idle':
        // Soft pulse (scale 0.95 → 1.05), 40% opacity, 3-second breathing cycle
        opacity.value = withTiming(0.4, { duration: 500 });
        innerGlowOpacity.value = withTiming(0.4, { duration: 500 });
        scale.value = withRepeat(
          withTiming(1.05, { 
            duration: 1500, 
            easing: Easing.inOut(Easing.ease) 
          }),
          -1,
          true
        );
        break;
        
      case 'listening':
        // Brighter (70% opacity), pulse synced to voice volume
        opacity.value = withTiming(0.7, { duration: 200 });
        innerGlowOpacity.value = withTiming(0.6, { duration: 200 });
        // Scale driven by energy - handled in frame callback
        break;
        
      case 'processing':
        // Gentle rotation effect, pulsing at "thinking" rhythm, 50% opacity
        opacity.value = withTiming(0.5, { duration: 300 });
        innerGlowOpacity.value = withTiming(0.5, { duration: 300 });
        scale.value = withRepeat(
          withTiming(1.1, { 
            duration: 800, 
            easing: Easing.inOut(Easing.ease) 
          }),
          -1,
          true
        );
        break;
        
      case 'speaking':
        // Brightest (80% opacity), size pulses with speech cadence, warm golden tint
        opacity.value = withTiming(0.8, { duration: 200 });
        innerGlowOpacity.value = withTiming(0.7, { duration: 200 });
        scale.value = withSpring(1.2, { damping: 15, stiffness: 150 });
        break;
    }
  }, [voiceState]);

  // Listening state energy-reactive scale
  useEffect(() => {
    if (voiceState === 'listening') {
      scale.value = withSpring(1 + energy * 0.3, { damping: 10, stiffness: 100 });
    }
  }, [voiceState, energy]);

  // Color configuration based on state
  const getOuterGlowColors = () => {
    switch (voiceState) {
      case 'listening':
        return [
          'rgba(91, 196, 183, 0.3)',
          'rgba(139, 92, 246, 0.15)',
          'rgba(74, 173, 161, 0.05)',
          'transparent',
        ];
      case 'processing':
        return [
          'rgba(99, 102, 241, 0.25)',
          'rgba(45, 138, 126, 0.12)',
          'rgba(67, 56, 202, 0.04)',
          'transparent',
        ];
      case 'speaking':
        // Warmer golden tint
        return [
          'rgba(251, 191, 36, 0.2)',
          'rgba(217, 119, 6, 0.1)',
          'rgba(180, 83, 9, 0.04)',
          'transparent',
        ];
      default:
        return [
          'rgba(74, 173, 161, 0.15)',
          'rgba(74, 173, 161, 0.08)',
          'rgba(74, 173, 161, 0.02)',
          'transparent',
        ];
    }
  };

  const getInnerGlowColors = () => {
    switch (voiceState) {
      case 'speaking':
        // Warm golden for speaking
        return [
          'rgba(255, 255, 255, 0.5)',
          'rgba(251, 191, 36, 0.3)',
          'rgba(217, 119, 6, 0.1)',
          'transparent',
        ];
      default:
        return [
          'rgba(255, 255, 255, 0.4)',
          'rgba(200, 180, 255, 0.25)',
          'rgba(91, 196, 183, 0.1)',
          'transparent',
        ];
    }
  };

  return (
    <Group transform={[{ scale: scale.value }]}>
      {/* Outer soft glow - 180px radius */}
      <Circle cx={CENTER_X} cy={CENTER_Y} r={180}>
        <RadialGradient
          c={vec(CENTER_X, CENTER_Y)}
          r={180}
          colors={getOuterGlowColors()}
        />
      </Circle>

      {/* Middle glow - 100px radius */}
      <Circle cx={CENTER_X} cy={CENTER_Y} r={100}>
        <RadialGradient
          c={vec(CENTER_X, CENTER_Y)}
          r={100}
          colors={[
            'rgba(91, 196, 183, 0.25)',
            'rgba(139, 92, 246, 0.15)',
            'rgba(74, 173, 161, 0.05)',
            'transparent',
          ]}
        />
      </Circle>

      {/* Inner bright core - 50px radius */}
      <Circle cx={CENTER_X} cy={CENTER_Y} r={50}>
        <RadialGradient
          c={vec(CENTER_X, CENTER_Y)}
          r={50}
          colors={getInnerGlowColors()}
        />
      </Circle>

      {/* Bright center point - 15px radius */}
      <Circle cx={CENTER_X} cy={CENTER_Y} r={15}>
        <RadialGradient
          c={vec(CENTER_X, CENTER_Y)}
          r={15}
          colors={[
            'rgba(255, 255, 255, 0.6)',
            'rgba(255, 255, 255, 0.3)',
            'transparent',
          ]}
        />
      </Circle>
    </Group>
  );
}

export default CenterGlow;
