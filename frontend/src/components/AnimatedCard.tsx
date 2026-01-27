import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, radius, spacing, colors } from '../styles';
import { createPressAnimation, staggerDelay } from '../styles/animations';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'glass' | 'glassDark' | 'gradient';
  gradientColors?: string[];
  staggerIndex?: number;
  style?: ViewStyle;
  disabled?: boolean;
}

export function AnimatedCard({
  children,
  onPress,
  variant = 'default',
  gradientColors = [colors.gradientPurple, colors.gradientBlue],
  staggerIndex = 0,
  style,
  disabled = false,
}: AnimatedCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = staggerDelay(staggerIndex);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [staggerIndex]);

  const pressHandlers = createPressAnimation(scaleAnim);

  const getCardStyle = () => {
    switch (variant) {
      case 'glass':
        return styles.glass;
      case 'glassDark':
        return styles.glassDark;
      case 'gradient':
        return styles.gradientBase;
      default:
        return styles.default;
    }
  };

  const cardContent = (
    <Animated.View
      style={[
        getCardStyle(),
        {
          opacity: fadeAnim,
          transform: [
            { translateY },
            { scale: scaleAnim },
          ],
        },
        style,
      ]}
    >
      {variant === 'gradient' ? (
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientInner}
        >
          {children}
        </LinearGradient>
      ) : (
        children
      )}
    </Animated.View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        {...pressHandlers}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  default: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadows.md,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...shadows.md,
  },
  glassDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.md,
  },
  gradientBase: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  gradientInner: {
    padding: spacing.base,
    borderRadius: radius.xl,
  },
});

export default AnimatedCard;
