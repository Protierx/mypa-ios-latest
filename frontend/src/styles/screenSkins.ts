/**
 * Screen Skins — unique visual identity per screen.
 *
 * Each skin defines a vibrant accent + hero styling so every screen
 * feels distinct while staying cohesive on dark backgrounds.
 *
 * Consumed by <ScreenContainer> and hero components.
 */
import { ViewStyle } from 'react-native';
import { brand, bg, semantic, category } from './colors';

export interface ScreenSkin {
  /** Dark background tint */
  backgroundTint: string;
  /** Primary accent for CTAs, highlights, active states */
  accent: string;
  /** Muted accent for badges, subtle fills */
  accentMuted: string;
  /** Hero card gradient stops (3 colors, top → bottom) */
  heroGradient: readonly [string, string, ...string[]];
  /** Hero card text color */
  heroText: string;
  /** Optional extra style applied to the root screen View */
  rootStyle?: ViewStyle;
}

/**
 * Hub — electric purple command center.
 */
export const hubSkin: ScreenSkin = {
  backgroundTint: bg.primary,
  accent: brand.primary,
  accentMuted: brand.muted,
  heroGradient: ['#B958FF', '#7C3AED', '#4C1D95'] as const,
  heroText: '#FFFFFF',
} as const;

/**
 * Tasks — electric blue productivity.
 */
export const tasksSkin: ScreenSkin = {
  backgroundTint: bg.primary,
  accent: '#00B4FF',
  accentMuted: 'rgba(0, 180, 255, 0.12)',
  heroGradient: ['#00B4FF', '#0066FF', '#003399'] as const,
  heroText: '#FFFFFF',
} as const;

/**
 * Plan — vivid green momentum.
 */
export const planSkin: ScreenSkin = {
  backgroundTint: bg.primary,
  accent: '#00E676',
  accentMuted: 'rgba(0, 230, 118, 0.12)',
  heroGradient: ['#00E676', '#00C853', '#009624'] as const,
  heroText: '#FFFFFF',
} as const;

/**
 * Circles / Social — fiery orange energy.
 */
export const circlesSkin: ScreenSkin = {
  backgroundTint: bg.primary,
  accent: '#FF6B35',
  accentMuted: 'rgba(255, 107, 53, 0.12)',
  heroGradient: ['#FF6B35', '#FF3D00', '#BF360C'] as const,
  heroText: '#FFFFFF',
} as const;

/**
 * Profile — bold pink celebration.
 */
export const profileSkin: ScreenSkin = {
  backgroundTint: bg.primary,
  accent: '#FF2D87',
  accentMuted: 'rgba(255, 45, 135, 0.12)',
  heroGradient: ['#FF2D87', '#E91E63', '#880E4F'] as const,
  heroText: '#FFFFFF',
} as const;

/** Map of screen keys → skins for programmatic lookup. */
export const screenSkins = {
  hub: hubSkin,
  tasks: tasksSkin,
  plan: planSkin,
  circles: circlesSkin,
  profile: profileSkin,
} as const;

export type ScreenSkinKey = keyof typeof screenSkins;
