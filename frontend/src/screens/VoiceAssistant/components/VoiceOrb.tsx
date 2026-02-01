import React from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { AssistantState } from '../types';
import { getOrbHint } from '../utils';
import { styles } from '../styles';

interface VoiceOrbProps {
  assistantState: AssistantState;
  pulseAnim: Animated.Value;
  glowAnim: Animated.Value;
  waveAnim1: Animated.Value;
  waveAnim2: Animated.Value;
  waveAnim3: Animated.Value;
  onPress: () => void;
}

export function VoiceOrb({
  assistantState,
  pulseAnim,
  glowAnim,
  waveAnim1,
  waveAnim2,
  waveAnim3,
  onPress,
}: VoiceOrbProps) {
  return (
    <View style={styles.orbContainer}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.orbTouchable}
      >
        {/* Glow effect */}
        <Animated.View style={[
          styles.orbGlow,
          {
            opacity: glowAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]} />
        
        {/* Outer ring */}
        <Animated.View style={[
          styles.orbRing,
          { transform: [{ scale: pulseAnim }] },
        ]} />
        
        {/* Main orb */}
        <Animated.View style={[
          styles.orbMain,
          { transform: [{ scale: pulseAnim }] },
        ]}>
          <Image
            source={require('../../../../assets/mypa-orb.png')}
            style={styles.orbImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Sound waves */}
        {(assistantState === 'listening' || assistantState === 'speaking') && (
          <View style={styles.wavesContainer}>
            <Animated.View style={[styles.wave, { opacity: waveAnim1, transform: [{ scaleY: waveAnim1 }] }]} />
            <Animated.View style={[styles.wave, { opacity: waveAnim2, transform: [{ scaleY: waveAnim2 }] }]} />
            <Animated.View style={[styles.wave, { opacity: waveAnim3, transform: [{ scaleY: waveAnim3 }] }]} />
            <Animated.View style={[styles.wave, { opacity: waveAnim2, transform: [{ scaleY: waveAnim2 }] }]} />
            <Animated.View style={[styles.wave, { opacity: waveAnim1, transform: [{ scaleY: waveAnim1 }] }]} />
          </View>
        )}
      </TouchableOpacity>

      {/* Quick action hint */}
      <Text style={styles.orbHint}>
        {getOrbHint(assistantState)}
      </Text>
    </View>
  );
}
