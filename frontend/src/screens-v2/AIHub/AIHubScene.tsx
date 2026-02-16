/**
 * AIHubScene — Immersive dark "AI Data Core" background scene.
 *
 * Uses a layered approach that is robust on all iOS devices:
 *  1. Deep dark gradient base (LinearGradient — no shaders)
 *  2. Animated floating orb particles (Skia Circles)
 *  3. Central glow pulse (radial gradient)
 *  4. Subtle vignette overlay
 *
 * Voice-state drives energy, hue shifts, and particle behaviour
 * via Reanimated SharedValues from useAssistantSceneState.
 *
 * Target: 60 fps on iPhone 12+.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Fill,
  Circle,
  RadialGradient,
  vec,
  LinearGradient as SkLinearGradient,
  Rect,
  Group,
  Blur,
  Paint,
  BlendMode,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useFrameCallback,
  type SharedValue,
} from 'react-native-reanimated';
import type { SceneState } from './useAssistantSceneState';

// ─────────────────────────────────────────────────────────────────────
// Particle system (JS-thread, drawn as Skia circles)
// ─────────────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 50;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  alpha: number;
  hueOffset: number;
}

function spawnParticle(W: number, H: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const spd = 0.2 + Math.random() * 0.8;
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd,
    r: 1.5 + Math.random() * 3,
    life: 0.3 + Math.random() * 0.7,
    alpha: 0.1 + Math.random() * 0.3,
    hueOffset: Math.random() * 0.15,
  };
}

// Hue → RGBA helper (HSL with S=0.6, L=0.65)
function hueToRGBA(h: number, a: number): string {
  const s = 0.6, l = 0.65;
  const k = (n: number) => (n + h * 12) % 12;
  const f = (n: number) => l - s * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1) * 0.5;
  const r = Math.round(f(0) * 255);
  const g = Math.round(f(8) * 255);
  const b = Math.round(f(4) * 255);
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
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

  // ── Time accumulator ──────────────────────────────────────────
  const time = useSharedValue(0);

  useFrameCallback((info) => {
    'worklet';
    time.value += (info.timeSincePreviousFrame ?? 16) / 1000;
  });

  // ── Particle state (JS thread) ────────────────────────────────
  const [particles, setParticles] = useState<Particle[]>(() =>
    Array.from({ length: PARTICLE_COUNT }, () => spawnParticle(W, H)),
  );

  const rafRef = useRef<number>(0);
  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      setParticles((prev) => {
        const next = [...prev];
        for (let i = 0; i < next.length; i++) {
          const p = { ...next[i] };
          p.x += p.vx * 1.0;
          p.y += p.vy * 1.0;
          p.life -= 0.002;
          // Recycle particles that go offscreen or expire
          if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20 || p.life <= 0) {
            next[i] = spawnParticle(W, H);
          } else {
            next[i] = p;
          }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [W, H]);

  // ── Central glow parameters ───────────────────────────────────
  const cx = W / 2;
  const cy = H * 0.42;
  const glowRadius = W * 0.55;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Layer 1 — Deep dark gradient base */}
        <Rect x={0} y={0} width={W} height={H}>
          <SkLinearGradient
            start={vec(0, 0)}
            end={vec(W, H)}
            colors={['#08081A', '#0E0A1E', '#0A0C22', '#060812']}
          />
        </Rect>

        {/* Layer 2 — Central ambient glow */}
        <Circle cx={cx} cy={cy} r={glowRadius}>
          <RadialGradient
            c={vec(cx, cy)}
            r={glowRadius}
            colors={[
              'rgba(124, 58, 237, 0.18)',
              'rgba(99, 50, 200, 0.08)',
              'rgba(60, 30, 140, 0.03)',
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
              'rgba(100, 60, 220, 0.10)',
              'rgba(80, 40, 180, 0.04)',
              'transparent',
            ]}
          />
        </Circle>

        {/* Layer 3 — Floating particles */}
        <Group blendMode="screen">
          {particles.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.r}
              color={`rgba(160, 140, 255, ${(p.alpha * p.life).toFixed(2)})`}
            />
          ))}
        </Group>

        {/* Layer 4 — Edge vignette */}
        <Rect x={0} y={0} width={W} height={H}>
          <RadialGradient
            c={vec(cx, cy)}
            r={Math.max(W, H) * 0.7}
            colors={['transparent', 'transparent', 'rgba(0, 0, 0, 0.5)']}
          />
        </Rect>
      </Canvas>
    </View>
  );
}
