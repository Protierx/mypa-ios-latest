/**
 * MYPA Cloud Design Tokens
 *
 * Single source of truth for all colours in the app.
 * "Cloud" palette: calming, structured, professional.
 * Soft teal accent. Adaptive day/night modes.
 *
 * Day mode is the primary identity. Night mode is the same palette, dimmed.
 */

// ── Backgrounds (Day) ──────────────────────────────────────────
export const bg = {
  primary:   '#F5F5F0',  // Warm off-white — main screen background
  secondary: '#EEEEE8',  // Grouped section background
  card:      '#FFFFFF',  // Card surfaces
  elevated:  '#FFFFFF',  // Modals, sheets
  input:     '#EEEEE8',  // Text inputs
  hover:     '#E5E4DF',  // Pressed states
} as const;

// ── Brand / Accent ─────────────────────────────────────────────
export const brand = {
  primary:   '#4AADA1',  // Soft teal — CTAs, active states, accent
  secondary: '#5BC4B7',  // Lighter teal
  tertiary:  '#8ED8CE',  // Subtle teal
  muted:     '#E0F4F1',  // Light teal background
  surface:   '#D0EDE9',  // Teal tinted surface
} as const;

// ── Text ─────────────────────────────────────────────────────
export const text = {
  primary:   '#1A1A1A',  // Primary text
  secondary: '#5A5A5A',  // Secondary text
  tertiary:  '#9A9A9A',  // Hints, captions, timestamps
  disabled:  '#C7C7CC',  // Disabled text
  inverse:   '#FFFFFF',  // Text on dark/brand bg
} as const;

// ── Borders & Dividers ───────────────────────────────────────
export const border = {
  primary:   '#E5E4DF',  // Card borders
  secondary: '#EEEEE8',  // Subtle dividers
  focus:     '#4AADA1',  // Focus ring — teal
} as const;

// ── Semantic ─────────────────────────────────────────────────
export const semantic = {
  success:      '#4AAD7A',
  successLight: '#ECFDF5',
  successSoft:  '#D1FAE5',
  warning:      '#D4A24E',  // Warm amber — not alarming
  warningLight: '#FDF8EE',
  error:        '#D46A5E',  // Soft red
  errorLight:   '#FEF2F0',
  info:         '#5A9ECF',  // Muted blue
} as const;

// ── Category Colours ─────────────────────────────────────────
export const category = {
  work:     '#5A9ECF',
  health:   '#4AAD7A',
  fitness:  '#E06B7A',
  wellness: '#8EAAD8',
  creative: '#D4A24E',
  personal: '#C08BBF',
} as const;

// ── Status Backgrounds ───────────────────────────────────────
export const status = {
  completedBg: '#dcfce7',
  acceptedBg:  '#fef3c7',
  assignedBg:  '#E0F4F1',  // Teal tinted (was purple)
  errorBg:     '#fee2e2',
} as const;

// ── Cloud Living-Background ──────────────────────────────────
export const lightAurora = {
  white:    '#FFFFFF',
  mist:     '#F0F5F4',  // Very subtle teal-tinted white
  cloud:    '#EDF2F1',  // Soft cloud
  warmth:   '#F5F3EE',  // Warm off-white
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
  /** Cloud living-background anchors */
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
  primaryForeground:  text.inverse,
  secondary:          brand.secondary,
  secondaryForeground: text.inverse,

  success:            semantic.success,
  successForeground:  text.inverse,
  warning:            semantic.warning,
  warningForeground:  text.inverse,
  destructive:        semantic.error,
  destructiveForeground: text.inverse,

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
  switchBackground:   '#C7C7CC',
  ring:               brand.primary,

  gradientTeal:       brand.primary,
  gradientBlue:       semantic.info,
  /** @deprecated Use gradientTeal */
  gradientPurple:     brand.primary,

  orbGradientStart:   brand.primary,
  orbGradientMiddle:  brand.secondary,
  orbGradientEnd:     brand.tertiary,

  darkCardStart:      '#1A1B1E',
  darkCardMiddle:     '#242528',
  darkCardEnd:        '#2A2B2F',

  successGradientStart:  '#3A9468',
  successGradientMiddle: '#4AAD7A',
  successGradientEnd:    '#6EC49A',

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
 * darkColors — Night mode (Cloud palette, dimmed).
 * Same personality as day mode, lower brightness.
 * Used by adaptive theme system and Login screen.
 */
export const darkColors = {
  primary:            '#5BC4B7',   // Teal brightens for dark bg visibility
  primaryForeground:  '#FFFFFF',
  secondary:          '#4AADA1',
  secondaryForeground: '#FFFFFF',

  success:            '#4AAD7A',
  successForeground:  '#FFFFFF',
  warning:            '#D4A24E',
  warningForeground:  '#FFFFFF',
  destructive:        '#D46A5E',
  destructiveForeground: '#FFFFFF',

  background:         '#1A1B1E',   // Deep warm dark — not pure black
  foreground:         '#ECECEC',
  card:               '#242528',
  cardForeground:     '#ECECEC',
  popover:            '#242528',
  popoverForeground:  '#ECECEC',

  muted:              '#2A2B2F',
  mutedForeground:    '#666666',
  accent:             'rgba(91, 196, 183, 0.12)',
  accentForeground:   '#ECECEC',

  border:             'rgba(255, 255, 255, 0.08)',
  input:              'rgba(255, 255, 255, 0.08)',
  inputBackground:    '#2A2B2F',
  switchBackground:   '#374151',
  ring:               '#5BC4B7',

  iosBg:              '#1A1B1E',
  iosBgSecondary:     '#242528',
  iosRed:             '#D46A5E',

  white: '#FFFFFF',
  black: '#000000',
} as const;

// ── Night mode base tokens (for adaptive theme context) ──────
export const bgNight = {
  primary:   '#1A1B1E',
  secondary: '#242528',
  card:      '#242528',
  elevated:  '#2A2B2F',
  input:     '#2A2B2F',
  hover:     '#333438',
} as const;

export const brandNight = {
  primary:   '#5BC4B7',
  secondary: '#4AADA1',
  tertiary:  '#3A8E83',
  muted:     'rgba(91, 196, 183, 0.12)',
  surface:   'rgba(91, 196, 183, 0.08)',
} as const;

export const textNight = {
  primary:   '#ECECEC',
  secondary: '#9A9A9A',
  tertiary:  '#666666',
  disabled:  '#444444',
  inverse:   '#1A1A1A',
} as const;

export const borderNight = {
  primary:   'rgba(255, 255, 255, 0.08)',
  secondary: 'rgba(255, 255, 255, 0.05)',
  focus:     '#5BC4B7',
} as const;
