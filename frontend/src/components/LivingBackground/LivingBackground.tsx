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

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
  color?: string;
}

// Spec: 60–80 particles, size 2–6px, opacity 20–60%; colors: white/pale, pale purple, pale cyan
const PARTICLE_COUNT = 70;
const PARTICLE_COLORS = [
  'rgba(255, 255, 255, 0.4)',
  'rgba(224, 224, 224, 0.35)',
  'rgba(196, 181, 253, 0.4)',
  'rgba(167, 139, 250, 0.35)',
  'rgba(165, 243, 252, 0.3)',
  'rgba(103, 232, 249, 0.35)',
];

function generateParticles(): (Particle & { color: string })[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * SCREEN_HEIGHT,
    size: 2 + Math.random() * 4,
    opacity: 0.2 + Math.random() * 0.4,
    velocityX: (Math.random() - 0.5) * 0.3,
    velocityY: (Math.random() - 0.5) * 0.3,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
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

  // Spec Section 6.1: gradient mesh colors
  const getGradientColors = () => {
    const base = ['#0A0A1A', '#1A1030', '#0D1B2A', '#12082A'];
    switch (voiceState) {
      case 'listening':
        return ['#0A0A1A', '#1A1A3A', '#1A1030', '#2A1A4A'];
      case 'processing':
        return ['#0A0A1A', '#1A2A3A', '#0D1B2A', '#2A3A4A'];
      case 'speaking':
        return ['#0A0A1A', '#2A1A3A', '#1A1030', '#3A2A4A'];
      default:
        return base;
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

        {/* Particles — spec: 60–80, 2–6px, white/pale purple/pale cyan */}
        {particles.map((particle, index) => (
          <Circle
            key={index}
            cx={particle.x}
            cy={particle.y}
            r={particle.size}
            color={particle.color ?? `rgba(255,255,255,${particle.opacity})`}
          />
        ))}

        {/* Center focal glow — spec: idle 120px (scale), listening 200px; opacity idle 25–35%, listening 35–55% */}
        <Group>
          <Circle cx={centerX} cy={centerY} r={100}>
            <RadialGradient
              c={vec(centerX, centerY)}
              r={100}
              colors={[
                'rgba(167, 139, 250, 0.35)',
                'rgba(124, 58, 237, 0.2)',
                'rgba(124, 58, 237, 0.05)',
                'transparent',
              ]}
            />
          </Circle>
        </Group>
        <Group>
          <Circle cx={centerX} cy={centerY} r={60}>
            <RadialGradient
              c={vec(centerX, centerY)}
              r={60}
              colors={[
                'rgba(255, 255, 255, 0.3)',
                'rgba(200, 180, 255, 0.2)',
                'rgba(167, 139, 250, 0.08)',
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