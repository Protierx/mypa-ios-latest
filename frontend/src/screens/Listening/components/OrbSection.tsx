import React from 'react';
import { View, Image, Animated } from 'react-native';
import { styles } from '../styles';

interface OrbSectionProps {
  pulseAnim1: Animated.Value;
  pulseAnim2: Animated.Value;
  pulseAnim3: Animated.Value;
  floatAnim: Animated.Value;
}

export function OrbSection({ pulseAnim1, pulseAnim2, pulseAnim3, floatAnim }: OrbSectionProps) {
  return (
    <View style={styles.orbSection}>
      <Animated.View style={[styles.pulseRing, styles.pulseRing1, { transform: [{ scale: pulseAnim1 }] }]} />
      <Animated.View style={[styles.pulseRing, styles.pulseRing2, { transform: [{ scale: pulseAnim2 }] }]} />
      <Animated.View style={[styles.pulseRing, styles.pulseRing3, { transform: [{ scale: pulseAnim3 }] }]} />
      <Animated.View style={[styles.orbContainer, { transform: [{ translateY: floatAnim }] }]}>
        <Image
          source={require('../../../../assets/mypa-orb.png')}
          style={styles.orbImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
