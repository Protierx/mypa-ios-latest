/**
 * AIHubScene — Cloud-like ambient background scene.
 *
 * Uses a layered approach:
 *  1. Soft warm-white to light-teal gradient base
 *  2. Floating cloud/mist shapes (Skia circles with blur)
 *  3. Central ambient glow from the avatar area
 *  4. Subtle edge vignette
 *
 * Voice-state drives subtle energy shifts via SceneState SharedValues.
 * Target: 60 fps on iPhone 12+.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  RadialGradient,
  vec,
  LinearGradient as SkLinearGradient,
  Rect,
  Group,
  Blur,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import type { SceneState } from './useAssistantSceneState';

// ─────────────────────────────────────────────────────────────────────
// Cloud shapes (static positions, gentle drift simulated via opacity)
// ─────────────────────────────────────────────────────────────────────

interface CloudShape {
  x: number;
  y: number;
  rx: number;
  ry: number;
  alpha: number;
}

function generateClouds(W: number, H: number, count: number): CloudShape[] {
  const clouds: CloudShape[] = [];
  for (let i = 0; i < count; i++) {
    clouds.push({
      x: Math.random() * W,
      y: Math.random() * H,
      rx: 60 + Math.random() * 100,
      ry: 30 + Math.random() * 50,
      alpha: 0.03 + Math.random() * 0.06,
    });
  }
  return clouds;
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

interface AIHubSceneProps {
  sceneState: SceneState;
  amplitude: SharedValue<number>;
}

export function AIHubScene({ sceneState, amplitude }: AIHubSceneProps) {
  const { width: W, height: H } = useWindowDimensions();

  // Generate cloud positions once per layout
  const clouds = useMemo(() => generateClouds(W, H, 12), [W, H]);

  // Central glow position (where the avatar sits)
  const cx = W / 2;
  const cy = H * 0.42;
  const glowRadius = W * 0.5;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Layer 1 — Soft gradient base (warm white → light teal edges) */}
        <Rect x={0} y={0} width={W} height={H}>
          <SkLinearGradient
            start={vec(W / 2, 0)}
            end={vec(W / 2, H)}
            colors={['#F5F5F0', '#F0F5F4', '#EDF2F1', '#F5F5F0']}
          />
        </Rect>

        {/* Layer 2 — Central ambient glow (soft teal from avatar area) */}
        <Circle cx={cx} cy={cy} r={glowRadius}>
          <RadialGradient
            c={vec(cx, cy)}
            r={glowRadius}
            colors={[
              'rgba(74, 173, 161, 0.08)',
              'rgba(74, 173, 161, 0.03)',
              'transparent',
            ]}
          />
        </Circle>

        {/* Secondary glow — lower, warmer */}
        <Circle cx={cx} cy={H * 0.7} r={W * 0.4}>
          <RadialGradient
            c={vec(cx, H * 0.7)}
            r={W * 0.4}
            colors={[
              'rgba(91, 196, 183, 0.05)',
              'rgba(91, 196, 183, 0.02)',
              'transparent',
            ]}
          />
        </Circle>

        {/* Layer 3 — Floating cloud/mist shapes */}
        <Group>
          <Blur blur={20} />
          {clouds.map((c, i) => (
            <Circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={(c.rx + c.ry) / 2}
              color={`rgba(74, 173, 161, ${c.alpha.toFixed(3)})`}
            />
          ))}
        </Group>

        {/* Warm mist accents */}
        <Group>
          <Blur blur={30} />
          <Circle cx={W * 0.2} cy={H * 0.15} r={W * 0.2}>
            <RadialGradient
              c={vec(W * 0.2, H * 0.15)}
              r={W * 0.2}
              colors={['rgba(245, 243, 238, 0.5)', 'transparent']}
            />
          </Circle>
          <Circle cx={W * 0.8} cy={H * 0.85} r={W * 0.25}>
            <RadialGradient
              c={vec(W * 0.8, H * 0.85)}
              r={W * 0.25}
              colors={['rgba(237, 242, 241, 0.4)', 'transparent']}
            />
          </Circle>
        </Group>

        {/* Layer 4 — Subtle edge vignette (very light) */}
        <Rect x={0} y={0} width={W} height={H}>
          <RadialGradient
            c={vec(cx, cy)}
            r={Math.max(W, H) * 0.7}
            colors={['transparent', 'transparent', 'rgba(0, 0, 0, 0.03)']}
          />
        </Rect>
      </Canvas>
    </View>
  );
}
