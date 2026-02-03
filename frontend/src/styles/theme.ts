/**
 * Mylo Design System - Complete Theme
 * 
 * Exact specifications from MYPA_DESIGN_SPECIFICATION.md
 * iOS-themed, dark mode, premium aesthetic
 */

import { TextStyle, ViewStyle } from 'react-native';

// ============================================
// SECTION 1: COLORS
// ============================================

export const colors = {
  // Background Colors
  background: {
    black: '#000000',        // Main app background
    surface1: '#0D0D0D',     // Slightly elevated areas, headers
    surface2: '#161616',     // Cards, list items, modals
    surface3: '#1C1C1E',     // Interactive elements, inputs, pressed states
    surface4: '#2C2C2E',     // Hover states, selected items
  },

  // Brand Colors
  brand: {
    primary: '#7C3AED',      // Primary buttons, orb core, key accents
    secondary: '#A78BFA',    // Secondary accents, links, highlights
    tertiary: '#C4B5FD',     // Subtle accents, icon tints
    muted: '#4C1D95',        // Dark purple for backgrounds, borders
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',      // Headings, important text, titles
    secondary: '#A1A1AA',    // Body text, descriptions
    tertiary: '#71717A',     // Hints, placeholders, timestamps
    disabled: '#52525B',     // Disabled text
    inverse: '#000000',      // Text on light backgrounds
  },

  // Semantic Colors
  semantic: {
    success: '#22C55E',
    successLight: 'rgba(34, 197, 94, 0.1)',
    warning: '#EAB308',
    warningLight: 'rgba(234, 179, 8, 0.1)',
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.1)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.1)',
  },

  // Category Colors
  category: {
    work: '#3B82F6',
    health: '#22C55E',
    fitness: '#F59E0B',
    personal: '#8B5CF6',
    errands: '#EC4899',
    learning: '#06B6D4',
    social: '#F97316',
    finance: '#10B981',
  },

  // Gradient definitions (as arrays for LinearGradient)
  gradients: {
    orb: ['#7C3AED', '#A78BFA', '#C4B5FD', '#A78BFA', '#7C3AED'],
    button: ['#7C3AED', '#9333EA'],
    cardHighlight: ['rgba(124, 58, 237, 0.08)', 'rgba(124, 58, 237, 0)'],
    xp: ['#7C3AED', '#A855F7'],
    success: ['#22C55E', '#16A34A'],
  },

  // Transparency
  overlay: {
    light: 'rgba(0, 0, 0, 0.4)',
    medium: 'rgba(0, 0, 0, 0.6)',
    heavy: 'rgba(0, 0, 0, 0.8)',
  },

  // Border colors
  border: {
    default: '#3F3F46',
    subtle: '#27272A',
    focused: '#7C3AED',
  },
};

// ============================================
// SECTION 2: TYPOGRAPHY
// ============================================

export const typography = {
  // Type Scale (exact from spec)
  displayLarge: {
    fontSize: 48,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 56,
    letterSpacing: -1.5,
  },
  display: {
    fontSize: 34,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  bodyMedium: {
    fontSize: 17,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 21,
    letterSpacing: -0.3,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 13,
    letterSpacing: 0.1,
  },

  // Legacy compatibility
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

// ============================================
// SECTION 3: SPACING
// ============================================

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,

  // Legacy compatibility
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

// Screen layout constants
export const layout = {
  screenHorizontalPadding: 20,
  screenTopPadding: 16,
  screenBottomPadding: 24,
  cardMargin: 12,
  cardPadding: 16,
  cardInnerGap: 12,
  listItemHeight: 56,
  listItemHeightTwoLine: 72,
  safeAreaTop: 59,    // iPhone 15 Pro
  safeAreaBottom: 34, // Home indicator
};

// ============================================
// SECTION 4: BORDER RADIUS
// ============================================

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

// ============================================
// SECTION 5: SHADOWS
// ============================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 8,
  } as ViewStyle,
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 12,
  } as ViewStyle,
  // Glow shadows for brand elements
  glowButton: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  } as ViewStyle,
  glowOrbIdle: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 10,
  } as ViewStyle,
  glowOrbActive: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    elevation: 15,
  } as ViewStyle,
  glowSuccess: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  } as ViewStyle,
  glow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,
};

// ============================================
// SECTION 6: COMPONENT SIZES
// ============================================

export const componentSizes = {
  // Orb sizes
  orb: {
    xl: 160,   // AI Home large orb
    lg: 128,
    md: 80,
    sm: 44,    // Mini orb in corners
  },

  // Button sizes
  button: {
    large: { height: 56, paddingHorizontal: 32, paddingVertical: 16 },
    medium: { height: 48, paddingHorizontal: 24, paddingVertical: 12 },
    small: { height: 32, paddingHorizontal: 16, paddingVertical: 8 },
  },

  // Icon sizes
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },

  // Input sizes
  input: {
    height: 56,
    searchHeight: 48,
  },

  // Touch targets (iOS minimum 44pt)
  touchTarget: 44,

  // Card sizes
  card: {
    minHeight: 72,
    statsCard: 80,
  },

  // Checkbox
  checkbox: 24,
};

// ============================================
// SECTION 7: ANIMATIONS
// ============================================

export const animations = {
  // Durations (ms)
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    pulse: 1500,
    breathe: 4000,
  },

  // Spring configs for react-native-reanimated
  spring: {
    default: { damping: 15, stiffness: 150 },
    gentle: { damping: 20, stiffness: 100 },
    bouncy: { damping: 10, stiffness: 200 },
    snappy: { damping: 15, stiffness: 300 },
  },

  // Gesture thresholds
  gesture: {
    swipeThreshold: 50,        // Minimum swipe distance
    swipeVelocity: 0.3,        // Minimum velocity
    longPressDelay: 500,       // Long press duration
  },
};

// ============================================
// SECTION 8: HAPTIC FEEDBACK TYPES
// ============================================

export const haptics = {
  light: 'impactLight' as const,
  medium: 'impactMedium' as const,
  heavy: 'impactHeavy' as const,
  success: 'notificationSuccess' as const,
  warning: 'notificationWarning' as const,
  error: 'notificationError' as const,
  selection: 'selection' as const,
};

// ============================================
// COMBINED THEME EXPORT
// ============================================

export const theme = {
  colors,
  typography,
  fontWeights,
  spacing,
  layout,
  radius,
  shadows,
  componentSizes,
  animations,
  haptics,
};

export default theme;
