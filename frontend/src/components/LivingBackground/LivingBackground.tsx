/**
 * Living Background — Immersive Full-Screen AI Presence
 *
 * The entire screen IS the AI. No orb — just a living, breathing aurora
 * made of layered gradient blobs that react to voice state, audio level,
 * and mood. Think of stepping into MYPA's consciousness.
 *
 * Layers (back → front):
 *  1. Deep gradient base (shifts hue per state)
 *  2. 5 large aurora blobs — animated position, scale, opacity
 *  3. Particle field
 *  4. Soft center focal glow (breathing)
 *
 * All animation is Reanimated-driven for 60 fps on the UI thread.
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
  Group,
  Blur,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  useFrameCallback,
  SharedValue,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'timeout'
  | 'error'
  | 'offline';

interface LivingBackgroundProps {
  voiceState: VoiceState;
  audioLevel: number; // 0-1
}

// ─── Colour palettes keyed by state ─────────────────────────────────
const STATE_PALETTES: Record<
  VoiceState,
  { gradient: string[]; blobs: string[] }
> = {
  idle: {
    gradient: ['#06060F', '#0D0A1F', '#0A0F1A', '#100820'],
    blobs: [
      'rgba(124, 58, 237, 0.18)',
      'rgba(79, 70, 229, 0.14)',
      'rgba(59, 130, 246, 0.10)',
      'rgba(147, 51, 234, 0.12)',
      'rgba(99, 102, 241, 0.08)',
    ],
  },
  listening: {
    gradient: ['#06060F', '#0F0A2A', '#0A1530', '#18103A'],
    blobs: [
      'rgba(139, 92, 246, 0.30)',
      'rgba(99, 102, 241, 0.25)',
      'rgba(59, 130, 246, 0.20)',
      'rgba(168, 85, 247, 0.22)',
      'rgba(129, 140, 248, 0.18)',
    ],
  },
  processing: {
    gradient: ['#06060F', '#0A1225', '#0D1830', '#101A38'],
    blobs: [
      'rgba(59, 130, 246, 0.25)',
      'rgba(99, 102, 241, 0.22)',
      'rgba(14, 165, 233, 0.18)',
      'rgba(124, 58, 237, 0.15)',
      'rgba(56, 189, 248, 0.12)',
    ],
  },
  speaking: {
    gradient: ['#06060F', '#180A28', '#1A0F30', '#22104A'],
    blobs: [
      'rgba(168, 85, 247, 0.35)',
      'rgba(147, 51, 234, 0.30)',
      'rgba(124, 58, 237, 0.25)',
      'rgba(192, 132, 252, 0.20)',
      'rgba(139, 92, 246, 0.15)',
    ],
  },
  timeout: {
    gradient: ['#06060F', '#0D0A15', '#0A0D14', '#0F0A18'],
    blobs: [
      'rgba(124, 58, 237, 0.10)',
      'rgba(79, 70, 229, 0.08)',
      'rgba(59, 130, 246, 0.06)',
      'rgba(147, 51, 234, 0.07)',
      'rgba(99, 102, 241, 0.05)',
    ],
  },
  error: {
    gradient: ['#0F0606', '#1A0A0A', '#200D0D', '#1A0808'],
    blobs: [
      'rgba(239, 68, 68, 0.25)',
      'rgba(220, 38, 38, 0.20)',
      'rgba(248, 113, 113, 0.15)',
      'rgba(185, 28, 28, 0.12)',
      'rgba(252, 165, 165, 0.10)',
    ],
  },
  offline: {
    gradient: ['#08080A', '#0E0E10', '#101014', '#0C0C0E'],
    blobs: [
      'rgba(113, 113, 122, 0.12)',
      'rgba(82, 82, 91, 0.10)',
      'rgba(63, 63, 70, 0.08)',
      'rgba(113, 113, 122, 0.06)',
      'rgba(82, 82, 91, 0.05)',
    ],
  },
};

// ─── Voice-state → numeric index (worklet-safe) ────────────────────
const STATE_INDEX: Record<VoiceState, number> = {
  idle: 0,
  listening: 1,
  processing: 2,
  speaking: 3,
  timeout: 4,
  error: 5,
  offline: 6,
};

// ─── Blob configuration ─────────────────────────────────────────────
interface BlobConfig {
  cx: number; cy: number; r: number;
  orbitX: number; orbitY: number;
  speed: number; phase: number;
}

const BLOB_CONFIGS: BlobConfig[] = [
  { cx: 0.25, cy: 0.20, r: 180, orbitX: 60, orbitY: 40, speed: 0.008, phase: 0 },
  { cx: 0.75, cy: 0.30, r: 200, orbitX: 50, orbitY: 55, speed: 0.006, phase: 1.2 },
  { cx: 0.50, cy: 0.50, r: 220, orbitX: 45, orbitY: 45, speed: 0.010, phase: 2.4 },
  { cx: 0.30, cy: 0.72, r: 170, orbitX: 55, orbitY: 35, speed: 0.007, phase: 3.6 },
  { cx: 0.70, cy: 0.80, r: 190, orbitX: 40, orbitY: 50, speed: 0.009, phase: 4.8 },
];

// ─── Particle generation ────────────────────────────────────────────
const PARTICLE_COUNT = 80;
const PARTICLE_COLORS = [
  'rgba(255, 255, 255, 0.35)',
  'rgba(196, 181, 253, 0.30)',
  'rgba(167, 139, 250, 0.25)',
  'rgba(165, 243, 252, 0.20)',
  'rgba(129, 140, 248, 0.22)',
];

interface Particle {
  x: number; y: number; size: number; color: string;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    size: 1.5 + Math.random() * 3,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
  }));
}

// ═════════════════════════════════════════════════════════════════════
export function LivingBackground({ voiceState, audioLevel }: LivingBackgroundProps) {
  const particles = useMemo(() => generateParticles(), []);
  const palette = STATE_PALETTES[voiceState] ?? STATE_PALETTES.idle;

  // ── Shared values synced from JS props (worklet-safe) ──
  const audioLevelSV = useSharedValue(audioLevel);
  const stateIndexSV = useSharedValue(STATE_INDEX[voiceState] ?? 0);

  // Keep shared values in sync with prop changes
  useEffect(() => {
    audioLevelSV.value = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    stateIndexSV.value = STATE_INDEX[voiceState] ?? 0;
  }, [voiceState]);

  // Shared animation values
  const globalTime = useSharedValue(0);
  const energyLevel = useSharedValue(0);
  const breathe = useSharedValue(1);
  const focusGlowOpacity = useSharedValue(0.25);
  const focusGlowScale = useSharedValue(1);

  // Blob animated positions & scales
  const blobCx: SharedValue<number>[] = [];
  const blobCy: SharedValue<number>[] = [];
  const blobScaleVals: SharedValue<number>[] = [];
  for (let i = 0; i < BLOB_CONFIGS.length; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    blobCx.push(useSharedValue(BLOB_CONFIGS[i].cx * W));
    // eslint-disable-next-line react-hooks/rules-of-hooks
    blobCy.push(useSharedValue(BLOB_CONFIGS[i].cy * H));
    // eslint-disable-next-line react-hooks/rules-of-hooks
    blobScaleVals.push(useSharedValue(1));
  }

  // Frame-by-frame blob orbits — runs on UI thread
  // IMPORTANT: only access shared values inside this worklet, never JS props
  useFrameCallback(() => {
    'worklet';
    globalTime.value += 1;
    // Smooth energy follow — read from shared value, not JS prop
    energyLevel.value += (audioLevelSV.value - energyLevel.value) * 0.15;

    const t = globalTime.value;
    const e = energyLevel.value;
    const si = stateIndexSV.value; // 0=idle,1=listening,2=processing,3=speaking,4=timeout,5=error,6=offline

    for (let i = 0; i < BLOB_CONFIGS.length; i++) {
      const cfg = BLOB_CONFIGS[i];
      const speedMult =
        si === 1 ? 1.8 + e * 2.0   // listening
        : si === 2 ? 1.4           // processing
        : si === 3 ? 1.6 + e * 1.5 // speaking
        : si === 5 ? 2.0           // error
        : 1.0;

      const scaleMult =
        si === 1 ? 1.0 + e * 0.4            // listening
        : si === 3 ? 1.15 + e * 0.3         // speaking
        : si === 2 ? 1.05                   // processing
        : si === 5 ? 0.9 + Math.sin(t * 0.05) * 0.15 // error
        : si === 4 || si === 6 ? 0.85       // timeout | offline
        : 1.0;

      const angle = t * cfg.speed * speedMult + cfg.phase;
      blobCx[i].value = cfg.cx * W + Math.sin(angle) * cfg.orbitX * speedMult;
      blobCy[i].value = cfg.cy * H + Math.cos(angle * 0.7) * cfg.orbitY * speedMult;
      blobScaleVals[i].value = scaleMult;
    }
  });

  // State-driven focus glow
  useEffect(() => {
    if (voiceState === 'idle') {
      focusGlowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.30, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ), -1,
      );
      focusGlowScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        ), -1,
      );
    } else if (voiceState === 'listening') {
      focusGlowOpacity.value = withSpring(0.5 + audioLevel * 0.3, { damping: 12 });
      focusGlowScale.value = withSpring(1.1 + audioLevel * 0.35, { damping: 10, stiffness: 100 });
    } else if (voiceState === 'processing') {
      focusGlowOpacity.value = withRepeat(
        withTiming(0.55, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true,
      );
      focusGlowScale.value = withRepeat(
        withTiming(1.2, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true,
      );
    } else if (voiceState === 'speaking') {
      focusGlowOpacity.value = withSpring(0.65, { damping: 15 });
      focusGlowScale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        ), -1,
      );
    } else if (voiceState === 'error') {
      focusGlowOpacity.value = withRepeat(withTiming(0.6, { duration: 350 }), -1, true);
      focusGlowScale.value = withRepeat(withTiming(1.1, { duration: 350 }), -1, true);
    } else {
      focusGlowOpacity.value = withTiming(0.15, { duration: 600 });
      focusGlowScale.value = withTiming(0.9, { duration: 600 });
    }
  }, [voiceState, audioLevel]);

  // Continuous breathing scale on the whole canvas
  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.97, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ), -1,
    );
  }, []);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  // Focus glow animated style — wired to Reanimated View wrapping center glow
  const focusGlowStyle = useAnimatedStyle(() => ({
    opacity: focusGlowOpacity.value,
    transform: [{ scale: focusGlowScale.value }],
  }));

  // Center glow colours per state
  const getCenterGlowColors = (): string[] => {
    switch (voiceState) {
      case 'error':
        return ['rgba(239,68,68,0.40)', 'rgba(220,38,38,0.20)', 'rgba(185,28,28,0.05)', 'transparent'];
      case 'offline':
        return ['rgba(113,113,122,0.20)', 'rgba(82,82,91,0.10)', 'rgba(63,63,70,0.03)', 'transparent'];
      case 'speaking':
        return ['rgba(192,132,252,0.45)', 'rgba(147,51,234,0.25)', 'rgba(124,58,237,0.08)', 'transparent'];
      case 'listening':
        return ['rgba(139,92,246,0.50)', 'rgba(99,102,241,0.30)', 'rgba(59,130,246,0.10)', 'transparent'];
      case 'processing':
        return ['rgba(59,130,246,0.35)', 'rgba(99,102,241,0.20)', 'rgba(14,165,233,0.08)', 'transparent'];
      default:
        return ['rgba(124,58,237,0.30)', 'rgba(99,102,241,0.15)', 'rgba(79,70,229,0.05)', 'transparent'];
    }
  };

  const centerX = W / 2;
  const centerY = H * 0.42;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, breatheStyle]}>
        <Canvas style={StyleSheet.absoluteFill}>
          {/* Layer 1: Deep gradient base */}
          <Rect x={0} y={0} width={W} height={H}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(W * 0.3, H)}
              colors={palette.gradient}
            />
          </Rect>

          {/* Layer 2: Aurora blobs — large, blurred, drifting */}
          {BLOB_CONFIGS.map((cfg, i) => (
            <Group key={`blob-${i}`}>
              <Circle
                cx={blobCx[i]}
                cy={blobCy[i]}
                r={cfg.r}
                color={palette.blobs[i]}
              >
                <Blur blur={60} />
              </Circle>
            </Group>
          ))}

          {/* Layer 3: Particles */}
          {particles.map((p, i) => (
            <Circle key={`p-${i}`} cx={p.x} cy={p.y} r={p.size} color={p.color} />
          ))}

        </Canvas>
      </Animated.View>

      {/* Layer 4: Center focal glow — the AI presence hotspot
          Wrapped in Animated.View so focusGlowOpacity + focusGlowScale actually drive it */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: centerX - 160,
            top: centerY - 160,
            width: 320,
            height: 320,
          },
          focusGlowStyle,
        ]}
        pointerEvents="none"
      >
        <Canvas style={{ width: 320, height: 320 }}>
          <Circle cx={160} cy={160} r={160}>
            <RadialGradient
              c={vec(160, 160)}
              r={160}
              colors={getCenterGlowColors()}
            />
          </Circle>
          <Circle cx={160} cy={160} r={80}>
            <RadialGradient
              c={vec(160, 160)}
              r={80}
              colors={[
                'rgba(255,255,255,0.18)',
                'rgba(200,180,255,0.10)',
                'rgba(167,139,250,0.03)',
                'transparent',
              ]}
            />
          </Circle>
        </Canvas>
      </Animated.View>
    </View>
  );
}

export default LivingBackground;