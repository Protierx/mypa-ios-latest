/**
 * Living Background
 * 
 * The heart of MYPA's visual experience.
 * A reactive, breathing interface that responds to voice and state.
 * 
 * Uses Skia for high-performance graphics.
 */

import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  LinearGradient,
  RadialGradient,
  Rect,
  vec,
  Blur,
  Group,
  Paint,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface LivingBackgroundProps {
  voiceState: VoiceState;
  audioLevel: number; // 0-1
}

// Particle system
interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
}

const PARTICLE_COUNT = 60;

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * SCREEN_HEIGHT,
    size: 2 + Math.random() * 4,
    opacity: 0.1 + Math.random() * 0.2,
    velocityX: (Math.random() - 0.5) * 0.3,
    velocityY: (Math.random() - 0.5) * 0.3,
  }));
}

export function LivingBackground({ voiceState, audioLevel }: LivingBackgroundProps) {
  const particles = useMemo(() => generateParticles(), []);
  
  // Animation values
  const breatheScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const glowScale = useSharedValue(1);
  
  // Breathing animation for idle state
  useEffect(() => {
    if (voiceState === 'idle') {
      breatheScale.value = withRepeat(
        withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (voiceState === 'listening') {
      // More active during listening
      glowOpacity.value = withTiming(0.7 + audioLevel * 0.3, { duration: 100 });
      glowScale.value = withSpring(1 + audioLevel * 0.3, { damping: 10, stiffness: 100 });
    } else if (voiceState === 'processing') {
      // Pulsing during processing
      glowOpacity.value = withRepeat(
        withTiming(0.8, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowScale.value = withRepeat(
        withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (voiceState === 'speaking') {
      // Expanding during speech
      glowOpacity.value = withTiming(0.8, { duration: 200 });
      glowScale.value = withSpring(1.2, { damping: 15, stiffness: 150 });
    }
  }, [voiceState, audioLevel]);

  // Dynamic colors based on state
  const getGradientColors = () => {
    switch (voiceState) {
      case 'listening':
        return ['#0a0a1a', '#1a1a3a', '#2a1a4a'];
      case 'processing':
        return ['#0a0a1a', '#1a2a3a', '#2a3a4a'];
      case 'speaking':
        return ['#0a0a1a', '#2a1a3a', '#3a2a4a'];
      default:
        return ['#000000', '#0a0a1a', '#141428'];
    }
  };

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2 - 50;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Background gradient */}
        <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, SCREEN_HEIGHT)}
            colors={getGradientColors()}
          />
        </Rect>

        {/* Particles */}
        {particles.map((particle, index) => (
          <Circle
            key={index}
            cx={particle.x}
            cy={particle.y}
            r={particle.size}
            color={`rgba(180, 160, 220, ${particle.opacity})`}
          />
        ))}

        {/* Outer glow - soft and diffuse */}
        <Group>
          <Circle cx={centerX} cy={centerY} r={180}>
            <RadialGradient
              c={vec(centerX, centerY)}
              r={180}
              colors={[
                'rgba(124, 58, 237, 0.15)',
                'rgba(124, 58, 237, 0.08)',
                'rgba(124, 58, 237, 0.02)',
                'transparent',
              ]}
            />
          </Circle>
        </Group>

        {/* Middle glow */}
        <Group>
          <Circle cx={centerX} cy={centerY} r={100}>
            <RadialGradient
              c={vec(centerX, centerY)}
              r={100}
              colors={[
                'rgba(167, 139, 250, 0.25)',
                'rgba(139, 92, 246, 0.15)',
                'rgba(124, 58, 237, 0.05)',
                'transparent',
              ]}
            />
          </Circle>
        </Group>

        {/* Inner core glow */}
        <Group>
          <Circle cx={centerX} cy={centerY} r={50}>
            <RadialGradient
              c={vec(centerX, centerY)}
              r={50}
              colors={[
                'rgba(255, 255, 255, 0.4)',
                'rgba(200, 180, 255, 0.25)',
                'rgba(167, 139, 250, 0.1)',
                'transparent',
              ]}
            />
          </Circle>
        </Group>
      </Canvas>
    </View>
  );
}

export default LivingBackground;