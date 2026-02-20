/**
 * Voice Waveform Visualization Component
 * 
 * When user is speaking, shows a flowing waveform around the center glow.
 * Not a typical audio meter - more like a living sound ring.
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Step 5.7
 */

import React, { useEffect, useMemo } from 'react';
import { Dimensions } from 'react-native';
import { Path, Group, Skia } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VoiceWaveformProps {
  visible: boolean;
  audioLevel: number; // 0-1
}

const CENTER_X = SCREEN_WIDTH / 2;
const CENTER_Y = SCREEN_HEIGHT / 2 - 50;
const WAVEFORM_RADIUS = 120; // Distance from center
const WAVEFORM_SEGMENTS = 64;

export function VoiceWaveform({ visible, audioLevel }: VoiceWaveformProps) {
  const opacity = useSharedValue(0);
  const waveAmplitude = useSharedValue(0);
  
  // Track audio levels for waveform
  const audioHistory = useMemo(() => Array(WAVEFORM_SEGMENTS).fill(0), []);
  
  // Fade in/out based on visibility
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 300 });
  }, [visible]);
  
  // Update wave amplitude based on audio level
  useEffect(() => {
    if (visible) {
      waveAmplitude.value = audioLevel * 30;
      
      // Shift history and add new value
      audioHistory.shift();
      audioHistory.push(audioLevel * 30);
    }
  }, [audioLevel, visible]);

  // Generate circular waveform path
  const createWaveformPath = () => {
    const path = Skia.Path.Make();
    
    for (let i = 0; i <= WAVEFORM_SEGMENTS; i++) {
      const angle = (i / WAVEFORM_SEGMENTS) * Math.PI * 2 - Math.PI / 2;
      const waveOffset = audioHistory[i % WAVEFORM_SEGMENTS] || 0;
      const radius = WAVEFORM_RADIUS + waveOffset;
      
      const x = CENTER_X + Math.cos(angle) * radius;
      const y = CENTER_Y + Math.sin(angle) * radius;
      
      if (i === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    
    path.close();
    return path;
  };

  if (!visible && opacity.value === 0) {
    return null;
  }

  return (
    <Group opacity={opacity}>
      {/* Outer waveform glow */}
      <Path
        path={createWaveformPath()}
        color="rgba(199, 125, 255, 0.3)"
        style="stroke"
        strokeWidth={8}
        strokeCap="round"
        strokeJoin="round"
      />
      
      {/* Inner waveform line */}
      <Path
        path={createWaveformPath()}
        color="rgba(255, 255, 255, 0.5)"
        style="stroke"
        strokeWidth={2}
        strokeCap="round"
        strokeJoin="round"
      />
    </Group>
  );
}

/**
 * Simple Audio Bars Waveform
 * 
 * An alternative simpler visualization using vertical bars.
 */
interface AudioBarsProps {
  visible: boolean;
  audioLevel: number;
  barCount?: number;
}

export function AudioBars({ visible, audioLevel, barCount = 12 }: AudioBarsProps) {
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible]);
  
  if (!visible && opacity.value === 0) {
    return null;
  }
  
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Create varied heights based on audio level and position
    const positionMultiplier = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
    const height = 10 + audioLevel * 40 * positionMultiplier * (0.5 + Math.random() * 0.5);
    const x = CENTER_X - (barCount * 6) / 2 + i * 6;
    const y = CENTER_Y + 100 - height / 2;
    
    return {
      x,
      y,
      width: 4,
      height,
    };
  });

  return (
    <Group opacity={opacity}>
      {bars.map((bar, index) => (
        <Path
          key={index}
          path={Skia.Path.Make().addRRect(
            Skia.RRectXY(
              Skia.XYWHRect(bar.x, bar.y, bar.width, bar.height),
              2,
              2
            )
          )}
          color="rgba(199, 125, 255, 0.6)"
        />
      ))}
    </Group>
  );
}

export default VoiceWaveform;
