/**
 * Mini Voice Button — MYPA Avatar Presence
 *
 * Floating mini avatar (36px) for screens other than AI Hub.
 * The avatar breathes, blinks, and reacts to voice state.
 * Tapping starts a voice session.
 */

import React, { useCallback } from 'react';
import { StyleSheet, ViewStyle, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { MYPAAvatar } from '../MYPAAvatar';
import { useVoice } from '../../contexts/VoiceContext';
import { brand } from '../../styles/colors';

interface MiniVoiceButtonProps {
  /** Position on screen */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  /** Screen context for voice commands */
  screenContext?: string;
  /** Button size in px (default 48) */
  size?: number;
  /** Custom style overrides */
  style?: ViewStyle;
}

export function MiniVoiceButton({
  position = 'top-right',
  screenContext,
  size = 48,
  style,
}: MiniVoiceButtonProps) {
  const voice = useVoice();
  const isActive = voice.voiceState !== 'idle';

  // Pulse ring animation when active
  const pulseOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isActive) {
      pulseOpacity.value = withRepeat(
        withTiming(0.4, { duration: 1000 }),
        -1,
        true,
      );
    } else {
      pulseOpacity.value = withTiming(0);
    }
  }, [isActive]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (voice.voiceState === 'idle') {
      try {
        await voice.startListening();
      } catch (error) {
        console.error('Failed to start listening:', error);
      }
    } else if (voice.voiceState === 'listening') {
      try {
        await voice.stopListening();
      } catch (error) {
        console.error('Failed to stop listening:', error);
      }
    } else {
      voice.cancelListening();
      voice.stopSpeaking();
    }
  }, [voice]);

  // Get position styles
  const getPositionStyle = (): ViewStyle => {
    const base = { position: 'absolute' as const };
    switch (position) {
      case 'top-left':
        return { ...base, top: 60, left: 16 };
      case 'top-right':
        return { ...base, top: 60, right: 16 };
      case 'bottom-left':
        return { ...base, bottom: 100, left: 16 };
      case 'bottom-right':
        return { ...base, bottom: 100, right: 16 };
      case 'bottom-center':
        return { ...base, bottom: 100, left: '50%', marginLeft: -24 };
      default:
        return { ...base, top: 60, right: 16 };
    }
  };

  // Derive expression from voice state
  const expressionIndex = voice.voiceState === 'speaking' ? 3
    : voice.voiceState === 'processing' ? 0
    : voice.voiceState === 'error' ? 0
    : 0;

  return (
    <View style={[getPositionStyle(), style]}>
      {/* Pulse ring when active */}
      {isActive && (
        <Animated.View
          style={[
            styles.pulseRing,
            { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 },
            pulseAnimatedStyle,
          ]}
        />
      )}

      {/* Avatar */}
      <MYPAAvatar
        size="mini"
        expressionIndex={expressionIndex}
        energy={voice.audioLevel || 0}
        isActive={isActive}
        onPress={handlePress}
        voiceState={voice.voiceState === 'listening' || voice.voiceState === 'processing' || voice.voiceState === 'speaking' ? voice.voiceState : 'idle'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pulseRing: {
    position: 'absolute',
    backgroundColor: brand.primary,
    top: -4,
    left: -4,
  },
});

export default MiniVoiceButton;
