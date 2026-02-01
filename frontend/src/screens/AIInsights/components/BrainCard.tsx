import React from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { ProductivityTip } from '../types';

interface BrainCardProps {
  tip: ProductivityTip;
  pulseAnim: Animated.Value;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const BrainCard: React.FC<BrainCardProps> = ({
  tip,
  pulseAnim,
  fadeAnim,
  slideAnim,
}) => {
  return (
    <Animated.View
      style={[
        styles.brainCard,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: pulseAnim },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.brainGradient}
      >
        <View style={styles.brainContent}>
          <View style={styles.brainIcon}>
            <Ionicons name="bulb" size={32} color="white" />
          </View>
          <View style={styles.brainText}>
            <Text style={styles.brainTitle}>{tip.title}</Text>
            <Text style={styles.brainSubtitle}>{tip.message}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};
