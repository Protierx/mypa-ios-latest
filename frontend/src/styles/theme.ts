import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { colors, bg, brand, text as textTokens, border as borderTokens, semantic } from './colors';

export const typography = {
  text4xl: 48,
  text3xl: 38,
  text2xl: 32,
  textXl: 24,
  textLg: 17,
  textBase: 16,
  textSm: 13,
  textXs: 11,
};

export const fontWeights = {
  normal: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
  black: '900' as TextStyle['fontWeight'],
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

// ── Shadows (dark mode — higher opacity for visibility) ─────
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 24,
    elevation: 5,
  } as ViewStyle,
  accent: {
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  } as ViewStyle,
  /** @deprecated use `accent` */
  purple: {
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  } as ViewStyle,
  glow: {
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 6,
  } as ViewStyle,
  glowStrong: {
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 8,
  } as ViewStyle,
  glowSuccess: {
    shadowColor: semantic.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 6,
  } as ViewStyle,
  neon: {
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
    elevation: 10,
  } as ViewStyle,
};

// ── Card Styles (border-based depth for dark bg) ────────────
export const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: bg.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  interactive: {
    backgroundColor: bg.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  glassDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  gradient: {
    borderRadius: radius.lg,
    padding: spacing.base,
    overflow: 'hidden' as const,
  },
});

// ── Text Styles (bolder, tighter) ───────────────────────────
export const textStyles = StyleSheet.create({
  h1: {
    fontSize: typography.text2xl,
    fontWeight: fontWeights.bold,
    color: textTokens.primary,
    lineHeight: typography.text2xl * 1.2,
    letterSpacing: -0.04 * typography.text2xl,
  },
  h2: {
    fontSize: typography.textXl,
    fontWeight: fontWeights.bold,
    color: textTokens.primary,
    lineHeight: typography.textXl * 1.25,
    letterSpacing: -0.04 * typography.textXl,
  },
  h3: {
    fontSize: typography.textLg,
    fontWeight: fontWeights.semibold,
    color: textTokens.primary,
    lineHeight: typography.textLg * 1.35,
    letterSpacing: -0.02 * typography.textLg,
  },
  h4: {
    fontSize: typography.textBase,
    fontWeight: fontWeights.semibold,
    color: textTokens.primary,
    lineHeight: typography.textBase * 1.35,
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
    fontWeight: fontWeights.semibold,
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
    height: 40,
    paddingHorizontal: 18,
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
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: brand.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.accent,
  },
});

/** Section Headers — uppercase category labels */
export const sectionHeaderStyles = StyleSheet.create({
  text: {
    fontSize: 13,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
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
