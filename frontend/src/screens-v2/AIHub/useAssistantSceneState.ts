/**
 * useAssistantSceneState — Maps VoiceState + expression overrides into
 * animated SharedValues that drive the immersive background scene and avatar.
 *
 * Voice states (from the voice pipeline) are the base layer.
 * Expression states (from system events) overlay on top when active.
 *
 * Each property transitions smoothly via `withTiming` so the scene
 * responds organically to state changes.
 */

import { useEffect, useRef } from 'react';
import {
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

// ── Voice states (from voice pipeline) ──────────────────────
type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'timeout' | 'error' | 'offline';

// ── Expression states (from system events) ──────────────────
export type ExpressionState =
  | 'none'             // No override — use voice state
  | 'waiting_approval' // Confirmation dialog pending
  | 'concerned'        // User overwhelm > 0.7
  | 'confident'        // High-confidence action executed (2s flash)
  | 'celebrating'      // Task completed (3s burst)
  | 'resting';         // Focus session active

export interface SceneState {
  /** 0 idle · 1 listening · 2 processing · 3 speaking · 4 error/timeout */
  stateIndex: SharedValue<number>;
  /** Overall energy  0…1 — drives particle speed, glow radius */
  energy: SharedValue<number>;
  /** Animation speed multiplier */
  speed: SharedValue<number>;
  /** Base hue shift  0…1 (wraps) — teal spectrum: 0.47=teal, 0.55=blue-teal, 0.12=gold */
  hue: SharedValue<number>;
  /** Pulse intensity  0…1 */
  pulse: SharedValue<number>;
  /** Current expression state for avatar to read */
  expression: SharedValue<number>;
}

const TRANSITION = { duration: 600, easing: Easing.out(Easing.cubic) };
const FAST_TRANSITION = { duration: 300, easing: Easing.out(Easing.cubic) };

// Hue values mapped to teal palette (0.47=teal, 0.55=blue, 0.12=warm gold)
const STATE_MAP: Record<VoiceState, { idx: number; energy: number; speed: number; hue: number; pulse: number }> = {
  idle:       { idx: 0, energy: 0.25, speed: 0.4,  hue: 0.47, pulse: 0.0 },
  listening:  { idx: 1, energy: 0.65, speed: 0.7,  hue: 0.50, pulse: 0.3 },
  processing: { idx: 2, energy: 0.85, speed: 1.0,  hue: 0.55, pulse: 0.6 },
  speaking:   { idx: 3, energy: 0.75, speed: 0.8,  hue: 0.48, pulse: 0.5 },
  timeout:    { idx: 4, energy: 0.15, speed: 0.2,  hue: 0.10, pulse: 0.0 },
  error:      { idx: 4, energy: 0.30, speed: 0.3,  hue: 0.06, pulse: 0.2 },
  offline:    { idx: 4, energy: 0.10, speed: 0.15, hue: 0.45, pulse: 0.0 },
};

// Expression indices for avatar to read (SharedValue can't hold strings)
const EXPRESSION_INDEX: Record<ExpressionState, number> = {
  none: 0,
  waiting_approval: 1,
  concerned: 2,
  confident: 3,
  celebrating: 4,
  resting: 5,
};

const EXPRESSION_MAP: Record<Exclude<ExpressionState, 'none'>, { energy: number; speed: number; hue: number; pulse: number }> = {
  waiting_approval: { energy: 0.55, speed: 0.5,  hue: 0.48, pulse: 0.15 },
  concerned:        { energy: 0.40, speed: 0.35, hue: 0.55, pulse: 0.10 },
  confident:        { energy: 0.70, speed: 0.75, hue: 0.47, pulse: 0.40 },
  celebrating:      { energy: 0.95, speed: 1.2,  hue: 0.12, pulse: 0.80 },
  resting:          { energy: 0.15, speed: 0.2,  hue: 0.47, pulse: 0.05 },
};

export function useAssistantSceneState(
  voiceState: VoiceState,
  expressionOverride: ExpressionState = 'none',
): SceneState {
  const stateIndex = useSharedValue(0);
  const energy = useSharedValue(0.25);
  const speed = useSharedValue(0.4);
  const hue = useSharedValue(0.47);
  const pulse = useSharedValue(0.0);
  const expression = useSharedValue(0);

  const decayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Voice state drives the base layer
  useEffect(() => {
    // Don't override expression states with voice state
    if (expressionOverride !== 'none') return;

    const s = STATE_MAP[voiceState] ?? STATE_MAP.idle;
    stateIndex.value = withTiming(s.idx, TRANSITION);
    energy.value = withTiming(s.energy, TRANSITION);
    speed.value = withTiming(s.speed, TRANSITION);
    hue.value = withTiming(s.hue, TRANSITION);
    pulse.value = withTiming(s.pulse, TRANSITION);
    expression.value = withTiming(EXPRESSION_INDEX.none, FAST_TRANSITION);
  }, [voiceState, expressionOverride]);

  // Expression override takes priority
  useEffect(() => {
    if (decayTimer.current) {
      clearTimeout(decayTimer.current);
      decayTimer.current = null;
    }

    if (expressionOverride === 'none') return;

    const e = EXPRESSION_MAP[expressionOverride];
    energy.value = withTiming(e.energy, FAST_TRANSITION);
    speed.value = withTiming(e.speed, FAST_TRANSITION);
    hue.value = withTiming(e.hue, FAST_TRANSITION);
    pulse.value = withTiming(e.pulse, FAST_TRANSITION);
    expression.value = withTiming(EXPRESSION_INDEX[expressionOverride], FAST_TRANSITION);
  }, [expressionOverride]);

  return { stateIndex, energy, speed, hue, pulse, expression };
}
