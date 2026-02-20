/**
 * MYPA Bold Design Tokens
 *
 * Single source of truth for all colours in the app.
 * "Bold" palette: dark-first, vibrant, high-contrast.
 * Electric purple accent. Dark day mode, deeper night mode.
 *
 * Day mode is dark-first. Night mode is even deeper.
 */

// ── Backgrounds (Day — dark-first) ──────────────────────────────
export const bg = {
  primary:   '#0A0A0F',  // Near-black — main screen background
  secondary: '#12121A',  // Grouped section background
  card:      '#1A1A24',  // Card surfaces
  elevated:  '#222230',  // Modals, sheets
  input:     '#1A1A24',  // Text inputs
  hover:     '#2A2A38',  // Pressed states
} as const;

// ── Brand / Accent ─────────────────────────────────────────────
export const brand = {
  primary:   '#B958FF',  // Electric purple — CTAs, active states, accent
  secondary: '#A040EF',  // Deeper purple
  tertiary:  '#7C3AED',  // Rich purple
  muted:     'rgba(185, 88, 255, 0.12)',  // Subtle purple background
  surface:   'rgba(185, 88, 255, 0.08)',  // Purple tinted surface
} as const;

// ── Text ─────────────────────────────────────────────────────
export const text = {
  primary:   '#FFFFFF',  // Primary text — white on dark
  secondary: '#A0A0B0',  // Secondary text
  tertiary:  '#6B6B80',  // Hints, captions, timestamps
  disabled:  '#3A3A4A',  // Disabled text
  inverse:   '#0A0A0F',  // Text on light/brand bg
} as const;

// ── Borders & Dividers ───────────────────────────────────────
export const border = {
  primary:   'rgba(255, 255, 255, 0.08)',  // Card borders
  secondary: 'rgba(255, 255, 255, 0.05)',  // Subtle dividers
  focus:     '#B958FF',  // Focus ring — purple
} as const;

// ── Semantic ─────────────────────────────────────────────────
export const semantic = {
  success:      '#00E676',
  successLight: 'rgba(0, 230, 118, 0.12)',
  successSoft:  'rgba(0, 230, 118, 0.08)',
  warning:      '#FFB800',  // Electric amber
  warningLight: 'rgba(255, 184, 0, 0.12)',
  error:        '#FF3B5C',  // Vivid red
  errorLight:   'rgba(255, 59, 92, 0.12)',
  info:         '#64C7FF',  // Bright blue
} as const;

// ── Category Colours ─────────────────────────────────────────
export const category = {
  work:     '#00B4FF',
  health:   '#00E676',
  fitness:  '#FF2D87',
  wellness: '#64C7FF',
  creative: '#FFB800',
  personal: '#C77DFF',
} as const;

// ── Status Backgrounds ───────────────────────────────────────
export const status = {
  completedBg: 'rgba(0, 230, 118, 0.12)',
  acceptedBg:  'rgba(255, 184, 0, 0.12)',
  assignedBg:  'rgba(185, 88, 255, 0.12)',
  errorBg:     'rgba(255, 59, 92, 0.12)',
} as const;

// ── Deep Space Living-Background ────────────────────────────
export const lightAurora = {
  white:    '#0A0A0F',   // Deep space black
  mist:     '#0E0E18',   // Purple-tinted deep
  cloud:    '#121220',   // Subtle purple tint
  warmth:   '#0C0C14',   // Deep warm black
} as const;

/**
 * specColors — backward-compatible alias used by AIHubScreen & Skia code.
 */
export const specColors = {
  background:    bg.primary,
  surface1:      bg.secondary,
  surface2:      bg.input,
  surface3:      bg.hover,
  surface4:      border.primary,
  brandPrimary:  brand.primary,
  brandSecondary: brand.secondary,
  brandTertiary: brand.tertiary,
  brandMuted:    brand.muted,
  textPrimary:   text.primary,
  textSecondary: text.secondary,
  textTertiary:  text.tertiary,
  textDisabled:  text.disabled,
  success:       semantic.success,
  warning:       semantic.warning,
  error:         semantic.error,
  info:          semantic.info,
  /** Deep space living-background anchors */
  spaceDeep:     lightAurora.white,
  spaceViolet:   lightAurora.mist,
  spaceMidnight: lightAurora.cloud,
  spaceRich:     lightAurora.warmth,
} as const;

/**
 * colors — legacy flat map consumed by ErrorBoundary, AnimatedCard, LoadingOverlay, etc.
 */
export const colors = {
  primary:            brand.primary,
  primaryForeground:  '#FFFFFF',
  secondary:          brand.secondary,
  secondaryForeground: '#FFFFFF',

  success:            semantic.success,
  successForeground:  '#FFFFFF',
  warning:            semantic.warning,
  warningForeground:  '#0A0A0F',
  destructive:        semantic.error,
  destructiveForeground: '#FFFFFF',

  background:         bg.primary,
  foreground:         text.primary,
  card:               bg.card,
  cardForeground:     text.primary,
  popover:            bg.elevated,
  popoverForeground:  text.primary,

  muted:              bg.secondary,
  mutedForeground:    text.tertiary,
  accent:             brand.muted,
  accentForeground:   text.primary,

  border:             border.primary,
  input:              'transparent',
  inputBackground:    bg.input,
  switchBackground:   '#3A3A4A',
  ring:               brand.primary,

  gradientTeal:       brand.primary,
  gradientBlue:       semantic.info,
  /** @deprecated Use gradientTeal */
  gradientPurple:     brand.primary,

  orbGradientStart:   '#E8C8FF',
  orbGradientMiddle:  '#B958FF',
  orbGradientEnd:     '#4C1D95',

  darkCardStart:      '#1A1A24',
  darkCardMiddle:     '#222230',
  darkCardEnd:        '#2A2A38',

  successGradientStart:  '#00C853',
  successGradientMiddle: '#00E676',
  successGradientEnd:    '#69F0AE',

  statusCompletedBg: status.completedBg,
  statusAcceptedBg:  status.acceptedBg,
  statusAssignedBg:  status.assignedBg,
  statusErrorBg:     status.errorBg,

  iosBg:           bg.primary,
  iosBgSecondary:  bg.secondary,
  iosRed:          semantic.error,

  white: '#FFFFFF',
  black: '#000000',

  ...category,
} as const;

/**
 * darkColors — Night mode (even deeper blacks, slightly brighter purple).
 * Used by adaptive theme system and Login screen.
 */
export const darkColors = {
  primary:            '#C77DFF',   // Brighter purple for deepest darks
  primaryForeground:  '#FFFFFF',
  secondary:          '#B958FF',
  secondaryForeground: '#FFFFFF',

  success:            '#00E676',
  successForeground:  '#FFFFFF',
  warning:            '#FFB800',
  warningForeground:  '#0A0A0F',
  destructive:        '#FF3B5C',
  destructiveForeground: '#FFFFFF',

  background:         '#050508',   // Deepest black
  foreground:         '#F0F0F5',
  card:               '#0E0E16',
  cardForeground:     '#F0F0F5',
  popover:            '#0E0E16',
  popoverForeground:  '#F0F0F5',

  muted:              '#14141C',
  mutedForeground:    '#5A5A6E',
  accent:             'rgba(199, 125, 255, 0.12)',
  accentForeground:   '#F0F0F5',

  border:             'rgba(255, 255, 255, 0.06)',
  input:              'rgba(255, 255, 255, 0.06)',
  inputBackground:    '#14141C',
  switchBackground:   '#2A2A38',
  ring:               '#C77DFF',

  iosBg:              '#050508',
  iosBgSecondary:     '#0E0E16',
  iosRed:             '#FF3B5C',

  white: '#FFFFFF',
  black: '#000000',
} as const;

// ── Night mode base tokens (for adaptive theme context) ──────
export const bgNight = {
  primary:   '#050508',
  secondary: '#0E0E16',
  card:      '#0E0E16',
  elevated:  '#14141C',
  input:     '#14141C',
  hover:     '#1E1E28',
} as const;

export const brandNight = {
  primary:   '#C77DFF',
  secondary: '#B958FF',
  tertiary:  '#9333EA',
  muted:     'rgba(199, 125, 255, 0.12)',
  surface:   'rgba(199, 125, 255, 0.08)',
} as const;

export const textNight = {
  primary:   '#F0F0F5',
  secondary: '#8888A0',
  tertiary:  '#5A5A6E',
  disabled:  '#2A2A38',
  inverse:   '#050508',
} as const;

export const borderNight = {
  primary:   'rgba(255, 255, 255, 0.06)',
  secondary: 'rgba(255, 255, 255, 0.03)',
  focus:     '#C77DFF',
} as const;
