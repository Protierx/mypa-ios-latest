import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BreathePhase } from '../types';
import { styles } from '../styles';

interface BreatheViewProps {
  breathePhase: BreathePhase;
  breatheScale: Animated.Value;
  glowOpacity: Animated.Value;
  onClose: () => void;
}

export const BreatheView: React.FC<BreatheViewProps> = ({
  breathePhase,
  breatheScale,
  glowOpacity,
  onClose,
}) => {
  const getPhaseText = () => {
    switch (breathePhase) {
      case 'in':
        return 'Breathe in...';
      case 'hold':
        return 'Hold...';
      case 'out':
        return 'Breathe out...';
    }
  };

  return (
    <View style={styles.breatheContainer}>
      <SafeAreaView style={styles.breatheSafeArea}>
        <View style={styles.breatheHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        <View style={styles.breatheContent}>
          <Animated.View
            style={[
              styles.breatheOrbOuter,
              { opacity: glowOpacity, transform: [{ scale: breatheScale }] },
            ]}
          />
          <Animated.View
            style={[styles.breatheOrb, { transform: [{ scale: breatheScale }] }]}
          >
            <MaterialCommunityIcons
              name="weather-windy"
              size={48}
              color="rgba(255,255,255,0.6)"
            />
          </Animated.View>

          <Text style={styles.breatheText}>{getPhaseText()}</Text>
          <Text style={styles.breatheSubtext}>Let everything else fade</Text>
        </View>

        <View style={styles.breatheFooter}>
          <Text style={styles.breatheHint}>Tap X when you're ready</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};
