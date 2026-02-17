import React, { useCallback } from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import Animated from 'react-native-reanimated';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { radius } from '../../styles/theme';
import { usePressFeedback } from '../../styles/motion';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { button: ViewStyle; text: TextStyle }> = {
  default: {
    button: { backgroundColor: brand.primary },
    text: { color: textTokens.inverse },
  },
  destructive: {
    button: { backgroundColor: semantic.error },
    text: { color: textTokens.inverse },
  },
  outline: {
    button: { backgroundColor: 'transparent', borderWidth: 1, borderColor: borderTokens.primary },
    text: { color: textTokens.primary },
  },
  secondary: {
    button: { backgroundColor: bg.secondary },
    text: { color: textTokens.primary },
  },
  ghost: {
    button: { backgroundColor: 'transparent' },
    text: { color: textTokens.primary },
  },
  link: {
    button: { backgroundColor: 'transparent' },
    text: { color: brand.primary, textDecorationLine: 'underline' },
  },
};

const sizeStyles: Record<ButtonSize, { button: ViewStyle; text: TextStyle }> = {
  default: {
    button: { height: 44, paddingHorizontal: 16 },
    text: { fontSize: 15 },
  },
  sm: {
    button: { height: 34, paddingHorizontal: 12 },
    text: { fontSize: 13 },
  },
  lg: {
    button: { height: 50, paddingHorizontal: 24 },
    text: { fontSize: 17 },
  },
  icon: {
    button: { height: 44, width: 44, paddingHorizontal: 0 },
    text: { fontSize: 15 },
  },
};

export function Button({
  children,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  onPress,
  style,
  textStyle,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const { animatedStyle, pressHandlers } = usePressFeedback(0.97, 0.8);

  const handlePress = useCallback(() => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  }, [disabled, loading, onPress]);

  return (
    <TouchableWithoutFeedback
      onPress={handlePress}
      onPressIn={pressHandlers.onPressIn}
      onPressOut={pressHandlers.onPressOut}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.base,
          variantStyle.button,
          sizeStyle.button,
          disabled && styles.disabled,
          animatedStyle,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variantStyle.text.color} size="small" />
        ) : typeof children === 'string' ? (
          <Text style={[styles.text, variantStyle.text, sizeStyle.text, textStyle]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    gap: 8,
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  disabled: {
    opacity: 0.45,
  },
});
