/**
 * Gradient Mesh Component
 * 
 * Creates the living, breathing gradient background using Skia shaders.
 * The gradient responds to voice state and energy levels.
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Step 5.4
 */

import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import {
  Canvas,
  Rect,
  Shader,
  Skia,
  Fill,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface GradientMeshProps {
  voiceState: VoiceState;
  energy: number; // 0-1, voice volume
}

// GLSL-like shader for Skia Runtime Effect
const gradientShaderSource = `
uniform float time;
uniform float energy;
uniform float2 resolution;
uniform float stateMultiplier;

// Color palette function
vec3 palette(float t) {
  vec3 a = vec3(0.1, 0.1, 0.2);    // Deep blue base
  vec3 b = vec3(0.3, 0.2, 0.4);    // Purple accent
  vec3 c = vec3(0.5, 0.4, 0.6);    // Lavender
  vec3 d = vec3(0.263, 0.416, 0.557);
  return a + b * cos(6.28318 * (c * t + d));
}

half4 main(float2 coord) {
  float2 uv = coord / resolution;
  
  // Create flowing waves
  float wave = sin(uv.x * 3.0 + time * 0.5) * 0.1;
  wave += sin(uv.y * 2.0 + time * 0.3) * 0.1;
  wave += sin((uv.x + uv.y) * 2.5 + time * 0.4) * 0.05;
  
  // Energy amplifies the waves
  wave *= (1.0 + energy * 2.0 * stateMultiplier);
  
  // Apply color palette
  vec3 color = palette(uv.y + wave);
  
  // Darken overall for MYPA's dark theme
  color *= 0.5;
  
  // Add slight vignette effect
  float vignette = 1.0 - length(uv - 0.5) * 0.5;
  color *= vignette;
  
  return half4(color, 1.0);
}
`;

export function GradientMesh({ voiceState, energy }: GradientMeshProps) {
  const time = useSharedValue(0);
  const energyValue = useSharedValue(energy);
  const stateMultiplier = useSharedValue(1);
  
  // Continuous time animation
  useEffect(() => {
    time.value = withRepeat(
      withTiming(100, { 
        duration: 100000, 
        easing: Easing.linear 
      }),
      -1,
      false
    );
  }, []);
  
  // Update energy smoothly
  useEffect(() => {
    energyValue.value = withTiming(energy, { duration: 100 });
  }, [energy]);
  
  // State-based multiplier
  useEffect(() => {
    switch (voiceState) {
      case 'idle':
        stateMultiplier.value = withTiming(0.5, { duration: 500 });
        break;
      case 'listening':
        stateMultiplier.value = withTiming(1.5, { duration: 200 });
        break;
      case 'processing':
        stateMultiplier.value = withTiming(1.2, { duration: 300 });
        break;
      case 'speaking':
        stateMultiplier.value = withTiming(1.8, { duration: 200 });
        break;
    }
  }, [voiceState]);

  // Try to create shader - fallback to simple gradient if shader fails
  let shader: ReturnType<typeof Skia.RuntimeEffect.Make> | null = null;
  try {
    shader = Skia.RuntimeEffect.Make(gradientShaderSource);
  } catch (e) {
    console.warn('Shader compilation failed, using fallback');
  }

  // Simple fallback gradient colors based on state
  const getFallbackColors = () => {
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

  if (!shader) {
    // Fallback to simple gradient
    return (
      <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        {/* Simple linear gradient fallback */}
      </Rect>
    );
  }

  return (
    <Fill>
      <Shader
        source={shader}
        uniforms={{
          time: time.value,
          energy: energyValue.value,
          resolution: vec(SCREEN_WIDTH, SCREEN_HEIGHT),
          stateMultiplier: stateMultiplier.value,
        }}
      />
    </Fill>
  );
}

export default GradientMesh;
