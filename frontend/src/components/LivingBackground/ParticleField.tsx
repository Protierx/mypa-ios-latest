/**
 * Particle Field Component
 * 
 * Hundreds of tiny, soft particles floating across the screen.
 * They respond to voice input and state changes.
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Step 5.5
 */

import React, { useMemo, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { Circle, Group } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useFrameCallback,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface Particle {
  x: SharedValue<number>;
  y: SharedValue<number>;
  size: number;
  opacity: number;
  baseVelocityX: number;
  baseVelocityY: number;
}

interface ParticleFieldProps {
  voiceState: VoiceState;
  energy: number; // 0-1, voice volume or user energy
  particleCount?: number;
}

const DEFAULT_PARTICLE_COUNT = 80;

export function ParticleField({ 
  voiceState, 
  energy, 
  particleCount = DEFAULT_PARTICLE_COUNT 
}: ParticleFieldProps) {
  const energyValue = useSharedValue(energy);
  const stateRef = useSharedValue(voiceState);
  
  // Update energy smoothly
  useEffect(() => {
    energyValue.value = energy;
  }, [energy]);
  
  // Update state ref
  useEffect(() => {
    stateRef.value = voiceState;
  }, [voiceState]);

  // Generate particles with shared values
  const particles = useMemo<Particle[]>(() => 
    Array.from({ length: particleCount }, () => ({
      x: useSharedValue(Math.random() * SCREEN_WIDTH),
      y: useSharedValue(Math.random() * SCREEN_HEIGHT),
      size: 2 + Math.random() * 4,
      opacity: 0.1 + Math.random() * 0.2,
      baseVelocityX: (Math.random() - 0.5) * 0.5,
      baseVelocityY: (Math.random() - 0.5) * 0.5,
    }))
  , [particleCount]);

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;

  // Frame-by-frame particle animation
  useFrameCallback(() => {
    const currentState = stateRef.value;
    const currentEnergy = energyValue.value;
    
    particles.forEach((particle) => {
      const px = particle.x.value;
      const py = particle.y.value;
      
      // Calculate distance and direction to center
      const dx = centerX - px;
      const dy = centerY - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normalizedDx = dist > 0 ? dx / dist : 0;
      const normalizedDy = dist > 0 ? dy / dist : 0;
      
      let vx = particle.baseVelocityX;
      let vy = particle.baseVelocityY;
      
      // IDLE: Slow, random drift
      if (currentState === 'idle') {
        // Just use base velocity
        vx *= 0.8;
        vy *= 0.8;
      }
      
      // LISTENING: Drift toward center, speed based on energy
      else if (currentState === 'listening') {
        const pull = currentEnergy * 2;
        vx += normalizedDx * pull;
        vy += normalizedDy * pull;
      }
      
      // PROCESSING: Gentle spiral toward center
      else if (currentState === 'processing') {
        // Add spiral motion
        const spiral = 0.5;
        vx += normalizedDx * 0.8 + normalizedDy * spiral;
        vy += normalizedDy * 0.8 - normalizedDx * spiral;
      }
      
      // SPEAKING: Radiate outward from center
      else if (currentState === 'speaking') {
        vx -= normalizedDx * 1.5;
        vy -= normalizedDy * 1.5;
      }
      
      // Update position with wrapping
      let newX = px + vx;
      let newY = py + vy;
      
      // Wrap around screen edges
      if (newX < -10) newX = SCREEN_WIDTH + 10;
      if (newX > SCREEN_WIDTH + 10) newX = -10;
      if (newY < -10) newY = SCREEN_HEIGHT + 10;
      if (newY > SCREEN_HEIGHT + 10) newY = -10;
      
      particle.x.value = newX;
      particle.y.value = newY;
    });
  });

  // Derive opacity based on state
  const particleOpacityMultiplier = useDerivedValue(() => {
    switch (stateRef.value) {
      case 'listening': return 1.2 + energyValue.value * 0.5;
      case 'processing': return 0.8;
      case 'speaking': return 1.0;
      default: return 1.0;
    }
  });

  return (
    <Group>
      {particles.map((particle, index) => (
        <Circle
          key={index}
          cx={particle.x}
          cy={particle.y}
          r={particle.size}
          color={`rgba(200, 200, 255, ${particle.opacity})`}
        />
      ))}
    </Group>
  );
}

export default ParticleField;
