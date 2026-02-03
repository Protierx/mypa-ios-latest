/**
 * UnlockCelebration - Full-screen unlock celebration overlay
 * 
 * From design spec:
 * - Confetti 50-80 particles
 * - Colors: #7C3AED, #A78BFA, #EAB308, #FFFFFF
 * - 320px wide modal, 24px radius
 * - Animation sequence: backdrop -> modal -> icon -> confetti
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';

import { structuredColors as colors } from '../../styles/colors';
import { theme } from '../../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COLORS = ['#7C3AED', '#A78BFA', '#EAB308', '#FFFFFF'];
const CONFETTI_COUNT = 65; // Middle ground between 50-80

interface UnlockCelebrationProps {
  visible: boolean;
  featureName: string;
  featureDescription: string;
  icon: string;
  onDismiss: () => void;
}

export function UnlockCelebration({
  visible,
  featureName,
  featureDescription,
  icon,
  onDismiss,
}: UnlockCelebrationProps) {
  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const confettiProgress = useRef(new Animated.Value(0)).current;
  
  // Confetti particles
  const confettiParticles = useRef(
    Array.from({ length: CONFETTI_COUNT }).map(() => ({
      x: Math.random() * SCREEN_WIDTH,
      delay: Math.random() * 500,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
      fallSpeed: 0.3 + Math.random() * 0.4,
    }))
  ).current;
  
  useEffect(() => {
    if (visible) {
      // Trigger haptics
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Animation sequence
      Animated.sequence([
        // Backdrop fade in
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Modal scale in
        Animated.spring(modalScale, {
          toValue: 1,
          damping: 12,
          stiffness: 200,
          useNativeDriver: true,
        }),
        // Icon bounce
        Animated.spring(iconScale, {
          toValue: 1,
          damping: 8,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Start confetti after a slight delay
      Animated.timing(confettiProgress, {
        toValue: 1,
        duration: 2500,
        delay: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animations
      backdropOpacity.setValue(0);
      modalScale.setValue(0);
      iconScale.setValue(0);
      confettiProgress.setValue(0);
    }
  }, [visible]);
  
  const handleDismiss = () => {
    Haptics.selectionAsync();
    
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };
  
  if (!visible) return null;
  
  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: backdropOpacity }
        ]}
      />
      
      {/* Confetti Layer */}
      {confettiParticles.map((particle, index) => (
        <ConfettiPiece
          key={index}
          x={particle.x}
          color={particle.color}
          size={particle.size}
          delay={particle.delay}
          rotation={particle.rotation}
          fallSpeed={particle.fallSpeed}
          progress={confettiProgress}
        />
      ))}
      
      {/* Modal */}
      <Animated.View
        style={[
          styles.modal,
          {
            transform: [{ scale: modalScale }],
          },
        ]}
      >
        {/* Icon with glow */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          <View style={styles.iconGlow} />
          <View style={styles.iconInner}>
            <Ionicons name={icon as any} size={48} color={colors.text.primary} />
          </View>
        </Animated.View>
        
        {/* Unlocked label */}
        <View style={styles.unlockedLabel}>
          <Ionicons name="lock-open" size={16} color={colors.semantic.success} />
          <Text style={styles.unlockedText}>UNLOCKED</Text>
        </View>
        
        {/* Feature name */}
        <Text style={styles.featureName}>{featureName}</Text>
        
        {/* Description */}
        <Text style={styles.featureDescription}>{featureDescription}</Text>
        
        {/* Continue button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleDismiss}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

interface ConfettiPieceProps {
  x: number;
  color: string;
  size: number;
  delay: number;
  rotation: number;
  fallSpeed: number;
  progress: Animated.Value;
}

function ConfettiPiece({ x, color, size, delay, rotation, fallSpeed, progress }: ConfettiPieceProps) {
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, SCREEN_HEIGHT * (0.8 + fallSpeed)],
  });
  
  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [x, x + (Math.random() - 0.5) * 100, x + (Math.random() - 0.5) * 50],
  });
  
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [`${rotation}deg`, `${rotation + 720}deg`],
  });
  
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });
  
  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: 0,
          width: size,
          height: size * 1.5,
          backgroundColor: color,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { rotate },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
  modal: {
    width: 320,
    backgroundColor: colors.background.surface2,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    marginBottom: 20,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 48,
    backgroundColor: colors.brand.primary,
    opacity: 0.3,
  },
  iconInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  unlockedText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.semantic.success,
    letterSpacing: 1.5,
  },
  featureName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  continueButton: {
    width: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default UnlockCelebration;
