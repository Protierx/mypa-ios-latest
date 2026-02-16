/**
 * useAssistantSceneState — Maps VoiceState string into animated
 * SharedValues that drive the immersive background scene.
 *
 * Each property transitions smoothly via `withTiming` so the scene
 * responds organically to voice-state changes.
 */

import { useEffect } from 'react';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

// Re-use the canonical VoiceState type
type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'timeout' | 'error' | 'offline';

export interface SceneState {
  /** 0 idle · 1 listening · 2 processing · 3 speaking · 4 error/timeout */
  stateIndex: SharedValue<number>;
  /** Overall energy  0…1 — drives particle speed, glow radius */
  energy: SharedValue<number>;
  /** Animation speed multiplier */
  speed: SharedValue<number>;
  /** Base hue shift  0…1 (wraps) */
  hue: SharedValue<number>;
  /** Pulse intensity  0…1 */
  pulse: SharedValue<number>;
}

const TRANSITION = { duration: 600, easing: Easing.out(Easing.cubic) };

const STATE_MAP: Record<VoiceState, { idx: number; energy: number; speed: number; hue: number; pulse: number }> = {
  idle:       { idx: 0, energy: 0.25, speed: 0.4, hue: 0.72, pulse: 0.0 },
  listening:  { idx: 1, energy: 0.65, speed: 0.7, hue: 0.68, pulse: 0.3 },
  processing: { idx: 2, energy: 0.85, speed: 1.0, hue: 0.60, pulse: 0.6 },
  speaking:   { idx: 3, energy: 0.75, speed: 0.8, hue: 0.75, pulse: 0.5 },
  timeout:    { idx: 4, energy: 0.15, speed: 0.2, hue: 0.10, pulse: 0.0 },
  error:      { idx: 4, energy: 0.30, speed: 0.3, hue: 0.02, pulse: 0.2 },
  offline:    { idx: 4, energy: 0.10, speed: 0.15, hue: 0.55, pulse: 0.0 },
};

export function useAssistantSceneState(voiceState: VoiceState): SceneState {
  const stateIndex = useSharedValue(0);
  const energy = useSharedValue(0.25);
  const speed = useSharedValue(0.4);
  const hue = useSharedValue(0.72);
  const pulse = useSharedValue(0.0);

  useEffect(() => {
    const s = STATE_MAP[voiceState] ?? STATE_MAP.idle;
    stateIndex.value = withTiming(s.idx, TRANSITION);
    energy.value = withTiming(s.energy, TRANSITION);
    speed.value = withTiming(s.speed, TRANSITION);
    hue.value = withTiming(s.hue, TRANSITION);
    pulse.value = withTiming(s.pulse, TRANSITION);
  }, [voiceState]);

  return { stateIndex, energy, speed, hue, pulse };
}
