import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableWithoutFeedback } from 'react-native';
import Animated from 'react-native-reanimated';
import { bg, text as textTokens, border as borderTokens } from '../../styles/colors';
import { radius, spacing, shadows } from '../../styles/theme';
import { usePressFeedback } from '../../styles/motion';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Makes the card pressable with spring feedback */
  onPress?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style, onPress }: CardProps) {
  const { animatedStyle, pressHandlers } = usePressFeedback(0.98, 0.9);

  if (onPress) {
    return (
      <TouchableWithoutFeedback
        onPress={onPress}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
      >
        <Animated.View style={[styles.card, animatedStyle, style]}>
          {children}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function CardTitle({ children, style }: CardTitleProps) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function CardDescription({ children, style }: CardDescriptionProps) {
  return <Text style={[styles.description, style]}>{children}</Text>;
}

export function CardContent({ children, style }: CardContentProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

export function CardFooter({ children, style }: CardFooterProps) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: borderTokens.primary,
    overflow: 'hidden',
    ...shadows.sm,
  },
  header: {
    padding: spacing.base,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: textTokens.primary,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: textTokens.secondary,
    lineHeight: 20,
  },
  content: {
    padding: spacing.base,
    paddingTop: 0,
  },
  footer: {
    padding: spacing.base,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
