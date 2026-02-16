import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { radius } from '../../styles/theme';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
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
};

export function Badge({ children, variant = 'default', style, textStyle }: BadgeProps) {
  const variantStyle = variantStyles[variant];

  return (
    <View style={[styles.container, variantStyle.container, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, variantStyle.text, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
