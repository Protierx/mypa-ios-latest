/**
 * MYPA Unified Light-Mode Design Tokens
 *
 * Single source of truth for all colours in the app.
 * Every screen (except Login, which keeps dark branding) uses these tokens.
 * Mirrors the Tailwind config — keep both in sync.
 */

// ── Backgrounds ──────────────────────────────────────────────
export const bg = {
  primary:   '#F8F8FA',  // Main screen background
  secondary: '#F2F2F7',  // Grouped section background
  card:      '#FFFFFF',  // Card surfaces
  elevated:  '#FFFFFF',  // Modals, sheets
  input:     '#F2F2F7',  // Text inputs
  hover:     '#E8E8ED',  // Pressed states
} as const;

// ── Brand ────────────────────────────────────────────────────
export const brand = {
  primary:   '#7C3AED',  // CTAs, active states, accent
  secondary: '#A78BFA',  // Secondary accent
  tertiary:  '#C4B5FD',  // Subtle accent
  muted:     '#F5F0FF',  // Light purple background
  surface:   '#EDE5FF',  // Purple tinted surface
} as const;

// ── Text ─────────────────────────────────────────────────────
export const text = {
  primary:   '#1C1C1E',  // Primary text
  secondary: '#48484A',  // Secondary text
  tertiary:  '#8E8E93',  // Hints, captions
  disabled:  '#C7C7CC',  // Disabled text
  inverse:   '#FFFFFF',  // Text on dark/brand bg
} as const;

// ── Borders & Dividers ───────────────────────────────────────
export const border = {
  primary:   '#E5E5EA',  // Card borders
  secondary: '#F2F2F7',  // Subtle dividers
  focus:     '#7C3AED',  // Focus ring
} as const;

// ── Semantic ─────────────────────────────────────────────────
export const semantic = {
  success:      '#34C759',
  successLight: '#ECFDF5',
  successSoft:  '#D1FAE5',
  warning:      '#FF9F0A',
  warningLight: '#FFFBEB',
  error:        '#FF3B30',
  errorLight:   '#FEF2F2',
  info:         '#007AFF',
} as const;

// ── Category Colours ─────────────────────────────────────────
export const category = {
  work:     '#3B82F6',
  health:   '#10B981',
  fitness:  '#F43F5E',
  wellness: '#8B5CF6',
  creative: '#F59E0B',
  personal: '#EC4899',
} as const;

// ── Status Backgrounds ───────────────────────────────────────
export const status = {
  completedBg: '#dcfce7',
  acceptedBg:  '#fef3c7',
  assignedBg:  '#ede9fe',
  errorBg:     '#fee2e2',
} as const;

// ── Light Living-Background (glassmorphic aurora) ────────────
export const lightAurora = {
  white:    '#FFFFFF',
  lavender: '#F5F0FF',
  blue:     '#EFF6FF',
  peach:    '#FFF7ED',
} as const;

/**
 * specColors — backward-compatible alias used by AIHubScreen & Skia code.
 * Now points to the light-mode palette so existing `specColors.brandSecondary`
 * references keep working while screens are migrated.
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
  /** Light-mode living-background anchors */
  spaceDeep:     lightAurora.white,
  spaceViolet:   lightAurora.lavender,
  spaceMidnight: lightAurora.blue,
  spaceRich:     lightAurora.peach,
} as const;

/**
 * colors — legacy flat map consumed by ErrorBoundary, AnimatedCard, LoadingOverlay, etc.
 * Maps old keys → new tokens so existing `colors.foreground` etc. keep compiling.
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

  gradientPurple:     brand.primary,
  gradientBlue:       semantic.info,

  orbGradientStart:   brand.primary,
  orbGradientMiddle:  brand.secondary,
  orbGradientEnd:     brand.tertiary,

  darkCardStart:      '#1a1a2e',
  darkCardMiddle:     '#16213e',
  darkCardEnd:        '#0f3460',

  successGradientStart:  '#059669',
  successGradientMiddle: '#10b981',
  successGradientEnd:    '#34d399',

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
 * darkColors — kept for the Login screen (dark branded first-impression).
 */
export const darkColors = {
  primary:            brand.primary,
  primaryForeground:  '#FFFFFF',
  secondary:          brand.secondary,
  secondaryForeground: '#FFFFFF',

  success:            semantic.success,
  successForeground:  '#FFFFFF',
  warning:            semantic.warning,
  warningForeground:  '#FFFFFF',
  destructive:        semantic.error,
  destructiveForeground: '#FFFFFF',

  background:         '#0B0F14',
  foreground:         '#F6F7FA',
  card:               '#161B22',
  cardForeground:     '#F6F7FA',
  popover:            '#161B22',
  popoverForeground:  '#F6F7FA',

  muted:              '#1F2937',
  mutedForeground:    '#9CA3AF',
  accent:             '#1F2937',
  accentForeground:   '#F6F7FA',

  border:             'rgba(255, 255, 255, 0.08)',
  input:              'rgba(255, 255, 255, 0.08)',
  inputBackground:    '#1F2937',
  switchBackground:   '#374151',
  ring:               brand.primary,

  iosBg:              '#0B0F14',
  iosBgSecondary:     '#161B22',
  iosRed:             '#FF453A',

  white: '#FFFFFF',
  black: '#000000',
} as const;
