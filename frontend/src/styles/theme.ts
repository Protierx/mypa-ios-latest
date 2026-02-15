import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { colors, bg, brand, text as textTokens, border as borderTokens, semantic } from './colors';

export const typography = {
  text2xl: 28,
  textXl: 22,
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
  lg: 16,
  xl: 24,
  full: 9999,
};

// ── Shadows (light mode) ────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
  } as ViewStyle,
  purple: {
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  } as ViewStyle,
  /** @deprecated use `purple` */
  glow: {
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  } as ViewStyle,
  /** @deprecated use `purple` */
  glowStrong: {
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 8,
  } as ViewStyle,
};

// ── Card Styles ──────────────────────────────────────────────
export const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: bg.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.md,
  },
  interactive: {
    backgroundColor: bg.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.md,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  glassDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gradient: {
    borderRadius: radius.lg,
    padding: spacing.base,
    overflow: 'hidden' as const,
  },
});

// ── Text Styles ──────────────────────────────────────────────
export const textStyles = StyleSheet.create({
  h1: {
    fontSize: typography.text2xl,
    fontWeight: fontWeights.semibold,
    color: textTokens.primary,
    lineHeight: typography.text2xl * 1.3,
    letterSpacing: -0.01 * typography.text2xl,
  },
  h2: {
    fontSize: typography.textXl,
    fontWeight: fontWeights.semibold,
    color: textTokens.primary,
    lineHeight: typography.textXl * 1.35,
  },
  h3: {
    fontSize: typography.textLg,
    fontWeight: fontWeights.medium,
    color: textTokens.primary,
    lineHeight: typography.textLg * 1.4,
  },
  h4: {
    fontSize: typography.textBase,
    fontWeight: fontWeights.medium,
    color: textTokens.primary,
    lineHeight: typography.textBase * 1.4,
  },
  body: {
    fontSize: typography.textBase,
    fontWeight: fontWeights.normal,
    color: textTokens.primary,
    lineHeight: typography.textBase * 1.5,
  },
  bodySmall: {
    fontSize: typography.textSm,
    fontWeight: fontWeights.normal,
    color: textTokens.tertiary,
    lineHeight: typography.textSm * 1.4,
  },
  label: {
    fontSize: typography.textBase,
    fontWeight: fontWeights.medium,
    color: textTokens.primary,
    lineHeight: typography.textBase * 1.5,
  },
  caption: {
    fontSize: typography.textXs,
    fontWeight: fontWeights.normal,
    color: textTokens.tertiary,
    lineHeight: typography.textXs * 1.4,
  },
});

// ── Component Token Presets ──────────────────────────────────

/** Pills / Chips — filter pills, tag chips, etc. */
export const pillStyles = StyleSheet.create({
  base: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 9999,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
  },
  active: {
    backgroundColor: brand.primary,
  },
  inactive: {
    backgroundColor: bg.secondary,
    borderWidth: 1,
    borderColor: borderTokens.primary,
  },
  activeText: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    color: textTokens.inverse,
  },
  inactiveText: {
    fontSize: 14,
    fontWeight: fontWeights.semibold,
    color: textTokens.secondary,
  },
});

/** Floating Action Button — bottom-right circle CTA */
export const fabStyles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: brand.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.purple,
  },
});

/** Section Headers — uppercase category labels */
export const sectionHeaderStyles = StyleSheet.create({
  text: {
    fontSize: 13,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: textTokens.tertiary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});

// ── Aggregate Theme Object ───────────────────────────────────
export const theme = {
  colors,
  bg,
  brand,
  text: textTokens,
  border: borderTokens,
  semantic,
  typography,
  fontWeights,
  spacing,
  radius,
  shadows,
  cardStyles,
  textStyles,
  pillStyles,
  fabStyles,
  sectionHeaderStyles,
};

export default theme;
