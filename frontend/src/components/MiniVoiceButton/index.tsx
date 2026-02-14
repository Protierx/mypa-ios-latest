/**
 * Mini Voice Button Component — Light Theme Compatible
 *
 * Floating voice button for screens other than AI Hub.
 * Per Architecture Plan: "Mini orb in corner (tap to talk)"
 * Works on both light and dark backgrounds.
 */

import React, { useCallback } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useVoice } from '../../contexts/VoiceContext';

const PURPLE = '#7C3AED';
const PURPLE_LIGHT = '#F5F0FF';

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

  // Animation values
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  // Pulse animation when active
  React.useEffect(() => {
    if (isActive) {
      pulseOpacity.value = withRepeat(
        withTiming(0.5, { duration: 1000 }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(0);
    }
  }, [isActive]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate button press
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1);
    });

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
      // Cancel any ongoing activity
      voice.cancelListening();
      voice.stopSpeaking();
    }
  }, [voice, scale]);

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
        return { ...base, bottom: 100, left: '50%', marginLeft: -28 };
      default:
        return { ...base, top: 60, right: 16 };
    }
  };

  // Get icon based on state
  const getIcon = () => {
    switch (voice.voiceState) {
      case 'listening':
        return 'radio';
      case 'processing':
        return 'ellipsis-horizontal';
      case 'speaking':
        return 'volume-high';
      default:
        return 'mic';
    }
  };

  return (
    <Animated.View style={[getPositionStyle(), buttonAnimatedStyle, style]}>
      {/* Pulse ring when active */}
      {isActive && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: size + 8,
              height: size + 8,
              borderRadius: (size + 8) / 2,
              backgroundColor: PURPLE,
              top: -4,
              left: -4,
            },
            pulseAnimatedStyle,
          ]}
        />
      )}

      {/* Button — solid white card with purple accent */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <View style={[styles.solidContainer, { borderRadius: size / 2 }, isActive && styles.activeContainer]}>
          <Ionicons
            name={getIcon()}
            size={Math.round(size * 0.46)}
            color={isActive ? '#FFFFFF' : PURPLE}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  solidContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.15)',
  },
  activeContainer: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
});

export default MiniVoiceButton;
