import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableWithoutFeedback } from 'react-native';
import Animated from 'react-native-reanimated';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { radius } from '../../styles/theme';
import { usePressFeedback } from '../../styles/motion';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

const variantStyles: Record<BadgeVariant, { container: ViewStyle; text: TextStyle }> = {
  default: {
    container: { backgroundColor: brand.primary },
    text: { color: textTokens.inverse },
  },
  secondary: {
    container: { backgroundColor: bg.secondary },
    text: { color: textTokens.primary },
  },
  destructive: {
    container: { backgroundColor: semantic.errorLight },
    text: { color: semantic.error },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: borderTokens.primary },
    text: { color: textTokens.primary },
  },
  success: {
    container: { backgroundColor: semantic.successLight },
    text: { color: semantic.success },
  },
};

export function Badge({ children, variant = 'default', style, textStyle, onPress }: BadgeProps) {
  const variantStyle = variantStyles[variant];
  const { animatedStyle, pressHandlers } = usePressFeedback(0.95, 0.85);

  const content = typeof children === 'string' ? (
    <Text style={[styles.text, variantStyle.text, textStyle]}>{children}</Text>
  ) : (
    children
  );

  if (onPress) {
    return (
      <TouchableWithoutFeedback
        onPress={onPress}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
      >
        <Animated.View style={[styles.container, variantStyle.container, animatedStyle, style]}>
          {content}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <View style={[styles.container, variantStyle.container, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
