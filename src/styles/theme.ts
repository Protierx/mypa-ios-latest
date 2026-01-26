import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  text2xl: 28,
  textXl: 20,
  textLg: 17,
  textBase: 15,
  textSm: 13,
  textXs: 11,
};

export const fontWeights = {
  normal: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  } as ViewStyle,
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  } as ViewStyle,
  glowStrong: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 8,
  } as ViewStyle,
};

export const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadows.md,
  },
  interactive: {
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
  },
  glassDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gradient: {
    borderRadius: radius.xl,
    padding: spacing.base,
    overflow: 'hidden',
  },
});

export const textStyles = StyleSheet.create({
  h1: {
    fontSize: typography.text2xl,
    fontWeight: fontWeights.semibold,
    color: colors.foreground,
    lineHeight: typography.text2xl * 1.3,
    letterSpacing: -0.01 * typography.text2xl,
  },
  h2: {
    fontSize: typography.textXl,
    fontWeight: fontWeights.semibold,
    color: colors.foreground,
    lineHeight: typography.textXl * 1.35,
  },
  h3: {
    fontSize: typography.textLg,
    fontWeight: fontWeights.medium,
    color: colors.foreground,
    lineHeight: typography.textLg * 1.4,
  },
  h4: {
    fontSize: typography.textBase,
    fontWeight: fontWeights.medium,
    color: colors.foreground,
    lineHeight: typography.textBase * 1.4,
  },
  body: {
    fontSize: typography.textBase,
    fontWeight: fontWeights.normal,
    color: colors.foreground,
    lineHeight: typography.textBase * 1.5,
  },
  bodySmall: {
    fontSize: typography.textSm,
    fontWeight: fontWeights.normal,
    color: colors.mutedForeground,
    lineHeight: typography.textSm * 1.4,
  },
  label: {
    fontSize: typography.textBase,
    fontWeight: fontWeights.medium,
    color: colors.foreground,
    lineHeight: typography.textBase * 1.5,
  },
  caption: {
    fontSize: typography.textXs,
    fontWeight: fontWeights.normal,
    color: colors.mutedForeground,
    lineHeight: typography.textXs * 1.4,
  },
});

export const theme = {
  colors,
  typography,
  fontWeights,
  spacing,
  radius,
  shadows,
  cardStyles,
  textStyles,
};

export default theme;
