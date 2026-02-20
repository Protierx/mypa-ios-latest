/**
 * AIHubScene — Deep space nebula ambient background scene.
 *
 * Uses a layered approach:
 *  1. Deep black-to-purple gradient base
 *  2. Drifting nebula clouds (purple-tinted, useFrameCallback-driven, 60fps)
 *  3. Floating micro-particles (star-like) with slow drift
 *  4. Central breathing purple glow from the avatar area
 *  5. Subtle edge vignette
 *
 * Voice-state drives subtle energy shifts via SceneState SharedValues.
 * Target: 60 fps on iPhone 12+.
 */

import React, { useMemo } from 'react';
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
  useFrameCallback,
  type SharedValue,
} from 'react-native-reanimated';
import type { SceneState } from './useAssistantSceneState';

// ─────────────────────────────────────────────────────────────────────
// Nebula cloud configs (drifting shapes with orbital paths)
// ─────────────────────────────────────────────────────────────────────

interface CloudConfig {
  baseCx: number;
  baseCy: number;
  radius: number;
  orbitX: number;
  orbitY: number;
  speed: number;
  phase: number;
  alpha: number;
}

const CLOUD_CONFIGS: CloudConfig[] = [
  { baseCx: 0.15, baseCy: 0.10, radius: 120, orbitX: 40, orbitY: 25, speed: 0.003, phase: 0, alpha: 0.06 },
  { baseCx: 0.80, baseCy: 0.18, radius: 100, orbitX: 35, orbitY: 20, speed: 0.004, phase: 1.5, alpha: 0.04 },
  { baseCx: 0.45, baseCy: 0.35, radius: 150, orbitX: 50, orbitY: 30, speed: 0.002, phase: 3.0, alpha: 0.07 },
  { baseCx: 0.70, baseCy: 0.55, radius: 110, orbitX: 45, orbitY: 35, speed: 0.003, phase: 4.2, alpha: 0.05 },
  { baseCx: 0.25, baseCy: 0.70, radius: 130, orbitX: 30, orbitY: 40, speed: 0.005, phase: 5.8, alpha: 0.06 },
  { baseCx: 0.60, baseCy: 0.82, radius: 90, orbitX: 35, orbitY: 25, speed: 0.004, phase: 0.8, alpha: 0.04 },
  { baseCx: 0.10, baseCy: 0.45, radius: 140, orbitX: 55, orbitY: 30, speed: 0.002, phase: 2.1, alpha: 0.065 },
  { baseCx: 0.85, baseCy: 0.40, radius: 100, orbitX: 30, orbitY: 45, speed: 0.003, phase: 3.5, alpha: 0.05 },
];

const PARTICLE_COUNT = 32;

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

interface AIHubSceneProps {
  sceneState: SceneState;
  amplitude: SharedValue<number>;
}

export function AIHubScene({ sceneState, amplitude }: AIHubSceneProps) {
  const { width: W, height: H } = useWindowDimensions();

  // Central glow position (where the avatar sits)
  const cx = W / 2;
  const cy = H * 0.42;
  const glowRadius = W * 0.5;

  // ── Generate particle data once (star-like) ──
  const particleData = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: 0.8 + Math.random() * 1.8,
      speed: 0.1 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.12 + Math.random() * 0.18,
    })),
  [W, H]);

  // ── SharedValues for animated cloud positions ──
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cloudXs = CLOUD_CONFIGS.map((cfg) => useSharedValue(cfg.baseCx * W));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cloudYs = CLOUD_CONFIGS.map((cfg) => useSharedValue(cfg.baseCy * H));

  // ── SharedValues for animated particle positions ──
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const particleXs = particleData.map((p) => useSharedValue(p.x));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const particleYs = particleData.map((p) => useSharedValue(p.y));

  // ── Frame-by-frame animation (runs on UI thread at 60fps) ──
  const time = useSharedValue(0);

  useFrameCallback(() => {
    'worklet';
    time.value += 1;
    const t = time.value;

    // Update cloud positions — gentle elliptical drift
    for (let i = 0; i < CLOUD_CONFIGS.length; i++) {
      const cfg = CLOUD_CONFIGS[i];
      const angle = t * cfg.speed + cfg.phase;
      cloudXs[i].value = cfg.baseCx * W + Math.sin(angle) * cfg.orbitX;
      cloudYs[i].value = cfg.baseCy * H + Math.cos(angle * 0.7) * cfg.orbitY;
    }

    // Update particle positions — slow upward drift with horizontal wobble
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particleData[i];
      particleYs[i].value = ((p.y - t * p.speed * 0.1) % H + H) % H;
      particleXs[i].value = p.x + Math.sin(t * 0.01 + p.phase) * 8;
    }
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Layer 1 — Deep space gradient base (black → deep purple tint) */}
        <Rect x={0} y={0} width={W} height={H}>
          <SkLinearGradient
            start={vec(W / 2, 0)}
            end={vec(W / 2, H)}
            colors={['#0A0A0F', '#0E0E18', '#121220', '#0A0A0F']}
          />
        </Rect>

        {/* Layer 2 — Drifting nebula clouds (purple-tinted) */}
        <Group>
          <Blur blur={25} />
          {CLOUD_CONFIGS.map((cfg, i) => (
            <Circle
              key={`cloud-${i}`}
              cx={cloudXs[i]}
              cy={cloudYs[i]}
              r={cfg.radius}
              color={`rgba(185, 88, 255, ${cfg.alpha.toFixed(3)})`}
            />
          ))}
        </Group>

        {/* Layer 3 — Deep nebula accents (large blur, static) */}
        <Group>
          <Blur blur={35} />
          <Circle cx={W * 0.2} cy={H * 0.12} r={W * 0.22}>
            <RadialGradient
              c={vec(W * 0.2, H * 0.12)}
              r={W * 0.22}
              colors={['rgba(124, 58, 237, 0.15)', 'transparent']}
            />
          </Circle>
          <Circle cx={W * 0.82} cy={H * 0.85} r={W * 0.2}>
            <RadialGradient
              c={vec(W * 0.82, H * 0.85)}
              r={W * 0.2}
              colors={['rgba(76, 29, 149, 0.12)', 'transparent']}
            />
          </Circle>
        </Group>

        {/* Layer 4 — Floating micro-particles (star-like) */}
        {particleData.map((p, i) => (
          <Circle
            key={`p-${i}`}
            cx={particleXs[i]}
            cy={particleYs[i]}
            r={p.size}
            color={`rgba(185, 88, 255, ${p.alpha.toFixed(3)})`}
          />
        ))}

        {/* Layer 5 — Central ambient glow (purple breathing) */}
        <Circle cx={cx} cy={cy} r={glowRadius}>
          <RadialGradient
            c={vec(cx, cy)}
            r={glowRadius}
            colors={[
              'rgba(185, 88, 255, 0.10)',
              'rgba(185, 88, 255, 0.04)',
              'transparent',
            ]}
          />
        </Circle>

        {/* Secondary glow — lower, deeper purple */}
        <Circle cx={cx} cy={H * 0.7} r={W * 0.4}>
          <RadialGradient
            c={vec(cx, H * 0.7)}
            r={W * 0.4}
            colors={[
              'rgba(124, 58, 237, 0.06)',
              'rgba(124, 58, 237, 0.02)',
              'transparent',
            ]}
          />
        </Circle>

        {/* Layer 6 — Subtle edge vignette */}
        <Rect x={0} y={0} width={W} height={H}>
          <RadialGradient
            c={vec(cx, cy)}
            r={Math.max(W, H) * 0.7}
            colors={['transparent', 'transparent', 'rgba(0, 0, 0, 0.15)']}
          />
        </Rect>
      </Canvas>
    </View>
  );
}
