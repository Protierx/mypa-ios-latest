/**
 * useVoiceAmplitude — Smoothed 0…1 voice level as a Reanimated SharedValue.
 *
 * Reads `audioLevel` from VoiceContext on the JS thread and pushes it
 * into a SharedValue via `withTiming` for a silky UI-thread animation.
 */

import { useEffect } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { useVoice } from '../../contexts/VoiceContext';

export function useVoiceAmplitude() {
  const { audioLevel } = useVoice();
  const amplitude = useSharedValue(0);

  useEffect(() => {
    amplitude.value = withTiming(Math.min(1, Math.max(0, audioLevel)), {
      duration: 120,
    });
  }, [audioLevel]);

  return amplitude;
}
