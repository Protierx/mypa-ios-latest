/**
 * Mylo Color System
 * 
 * Exact specifications from MYPA_DESIGN_SPECIFICATION.md
 * Dark mode first, iOS-themed
 */

// ============================================
// DARK THEME (Primary - Default)
// ============================================

export const colors = {
  // Background Colors (per spec Section 1.1)
  primary: '#7C3AED',        // Brand primary
  primaryForeground: '#FFFFFF',
  secondary: '#A78BFA',      // Brand secondary
  secondaryForeground: '#FFFFFF',
  
  // Semantic
  success: '#22C55E',
  successForeground: '#FFFFFF',
  warning: '#EAB308',
  warningForeground: '#000000',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  info: '#3B82F6',
  infoForeground: '#FFFFFF',
  
  // Backgrounds
  background: '#000000',           // bg-black - Main app background
  backgroundSurface1: '#0D0D0D',   // bg-surface-1 - Elevated areas
  backgroundSurface2: '#161616',   // bg-surface-2 - Cards, modals
  backgroundSurface3: '#1C1C1E',   // bg-surface-3 - Interactive elements
  backgroundSurface4: '#2C2C2E',   // bg-surface-4 - Hover states
  
  // Foreground / Text (per spec Section 1.3)
  foreground: '#FFFFFF',           // text-primary
  foregroundSecondary: '#A1A1AA',  // text-secondary
  foregroundTertiary: '#71717A',   // text-tertiary
  foregroundDisabled: '#52525B',   // text-disabled
  foregroundInverse: '#000000',    // text-inverse
  
  // Card colors
  card: '#161616',
  cardForeground: '#FFFFFF',
  cardBorder: '#27272A',
  
  // Popover/Modal
  popover: '#161616',
  popoverForeground: '#FFFFFF',
  
  // Muted elements
  muted: '#1C1C1E',
  mutedForeground: '#71717A',
  
  // Accent
  accent: '#7C3AED',
  accentForeground: '#FFFFFF',
  
  // Borders
  border: '#3F3F46',
  borderSubtle: '#27272A',
  borderFocused: '#7C3AED',
  
  // Input
  input: '#161616',
  inputBackground: '#161616',
  inputBorder: '#3F3F46',
  inputFocused: '#7C3AED',
  inputPlaceholder: '#52525B',
  
  // Switch
  switchBackground: '#3F3F46',
  switchActive: '#7C3AED',
  
  // Ring (focus indicator)
  ring: '#7C3AED',
  
  // Brand gradients
  gradientPurple: '#7C3AED',
  gradientBlue: '#A78BFA',
  
  orbGradientStart: '#7C3AED',
  orbGradientMiddle: '#A78BFA',
  orbGradientEnd: '#C4B5FD',
  
  // Dark card gradients
  darkCardStart: '#0D0D0D',
  darkCardMiddle: '#161616',
  darkCardEnd: '#1C1C1E',
  
  // Status backgrounds (with alpha)
  statusCompletedBg: 'rgba(34, 197, 94, 0.1)',
  statusWarningBg: 'rgba(234, 179, 8, 0.1)',
  statusAccentBg: 'rgba(124, 58, 237, 0.1)',
  statusErrorBg: 'rgba(239, 68, 68, 0.1)',
  
  // iOS-specific
  iosBg: '#000000',
  iosBgSecondary: '#0D0D0D',
  iosRed: '#FF453A',
  iosBlue: '#0A84FF',
  iosGreen: '#30D158',
  iosYellow: '#FFD60A',
  iosOrange: '#FF9F0A',
  
  // Base colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Category colors (per spec)
  work: '#3B82F6',
  health: '#22C55E',
  fitness: '#F59E0B',
  personal: '#8B5CF6',
  errands: '#EC4899',
  learning: '#06B6D4',
  social: '#F97316',
  finance: '#10B981',
  wellness: '#A78BFA',
  creative: '#F43F5E',

  // Overlay colors
  overlayLight: 'rgba(0, 0, 0, 0.4)',
  overlayMedium: 'rgba(0, 0, 0, 0.6)',
  overlayHeavy: 'rgba(0, 0, 0, 0.8)',

  // Glow colors
  glowPurple: 'rgba(124, 58, 237, 0.3)',
  glowPurpleActive: 'rgba(124, 58, 237, 0.5)',
  glowSuccess: 'rgba(34, 197, 94, 0.4)',
  
  // Backward compatibility aliases
  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textTertiary: '#71717A',
  surface: '#161616',
  danger: '#EF4444',
  orange: '#FF9500',
  primaryLight: 'rgba(124, 58, 237, 0.2)',
  
  // Light variants for backgrounds
  successLight: 'rgba(34, 197, 94, 0.15)',
  warningLight: 'rgba(234, 179, 8, 0.15)',
  infoLight: 'rgba(59, 130, 246, 0.15)',
  destructiveLight: 'rgba(239, 68, 68, 0.15)',
  
  // Text variants for semantic colors
  successText: '#22C55E',
  warningText: '#EAB308',
  infoText: '#3B82F6',
  destructiveText: '#EF4444',
};

// ============================================
// DARK THEME ALIAS (for backwards compatibility)
// ============================================

export const darkColors = {
  ...colors,
};

// ============================================
// STRUCTURED COLORS (for new components)
// ============================================

/**
 * Structured color access matching design spec
 * Usage: import { structuredColors as colors } from '../styles/colors'
 */
export const structuredColors = {
  background: {
    black: colors.background,
    surface1: colors.backgroundSurface1,
    surface2: colors.backgroundSurface2,
    surface3: colors.backgroundSurface3,
    surface4: colors.backgroundSurface4,
  },
  text: {
    primary: colors.foreground,
    secondary: colors.foregroundSecondary,
    tertiary: colors.foregroundTertiary,
    disabled: colors.foregroundDisabled,
    inverse: colors.foregroundInverse,
  },
  brand: {
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.orbGradientEnd,
  },
  semantic: {
    success: colors.success,
    warning: colors.warning,
    error: colors.destructive,
    info: colors.info,
  },
  category: {
    work: colors.work,
    health: colors.health,
    fitness: colors.fitness,
    personal: colors.personal,
    errands: colors.errands,
    learning: colors.learning,
    social: colors.social,
    finance: colors.finance,
    wellness: colors.wellness,
    creative: colors.creative,
  },
  ios: {
    bg: colors.iosBg,
    bgSecondary: colors.iosBgSecondary,
    red: colors.iosRed,
    blue: colors.iosBlue,
    green: colors.iosGreen,
    yellow: colors.iosYellow,
    orange: colors.iosOrange,
  },
  overlay: {
    light: colors.overlayLight,
    medium: colors.overlayMedium,
    heavy: colors.overlayHeavy,
  },
  glow: {
    purple: colors.glowPurple,
    purpleActive: colors.glowPurpleActive,
    success: colors.glowSuccess,
  },
};

// ============================================
// LIGHT THEME (Secondary - Future use)
// ============================================

export const lightColors = {
  primary: '#7C3AED',
  primaryForeground: '#FFFFFF',
  secondary: '#A78BFA',
  secondaryForeground: '#FFFFFF',
  
  success: '#22C55E',
  successForeground: '#FFFFFF',
  warning: '#EAB308',
  warningForeground: '#000000',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  
  background: '#F6F7FA',
  backgroundSurface1: '#FFFFFF',
  backgroundSurface2: '#F3F4F6',
  backgroundSurface3: '#E5E7EB',
  backgroundSurface4: '#D1D5DB',
  
  foreground: '#1A1D25',
  foregroundSecondary: '#4B5563',
  foregroundTertiary: '#6B7280',
  foregroundDisabled: '#9CA3AF',
  foregroundInverse: '#FFFFFF',
  
  card: '#FFFFFF',
  cardForeground: '#1A1D25',
  cardBorder: '#E5E7EB',
  
  popover: '#FFFFFF',
  popoverForeground: '#1A1D25',
  
  muted: '#F3F4F6',
  mutedForeground: '#6B7280',
  
  accent: '#7C3AED',
  accentForeground: '#FFFFFF',
  
  border: '#E5E7EB',
  borderSubtle: '#F3F4F6',
  borderFocused: '#7C3AED',
  
  input: '#FFFFFF',
  inputBackground: '#F3F4F6',
  inputBorder: '#E5E7EB',
  inputFocused: '#7C3AED',
  inputPlaceholder: '#9CA3AF',
  
  switchBackground: '#D1D5DB',
  switchActive: '#7C3AED',
  
  ring: '#7C3AED',
  
  gradientPurple: '#7C3AED',
  gradientBlue: '#A78BFA',
  
  orbGradientStart: '#7C3AED',
  orbGradientMiddle: '#A78BFA',
  orbGradientEnd: '#C4B5FD',
  
  statusCompletedBg: '#DCFCE7',
  statusWarningBg: '#FEF3C7',
  statusAccentBg: '#EDE9FE',
  statusErrorBg: '#FEE2E2',
  
  iosBg: '#F2F2F7',
  iosBgSecondary: '#FFFFFF',
  iosRed: '#FF3B30',
  iosBlue: '#007AFF',
  iosGreen: '#34C759',
  iosYellow: '#FFCC00',
  iosOrange: '#FF9500',
  
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  work: '#3B82F6',
  health: '#22C55E',
  fitness: '#F59E0B',
  personal: '#8B5CF6',
  errands: '#EC4899',
  learning: '#06B6D4',
  social: '#F97316',
  finance: '#10B981',
  wellness: '#A78BFA',
  creative: '#F43F5E',
};

export default colors;
