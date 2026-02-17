/**
 * Screen Skins — unique visual identity per screen.
 *
 * Each skin defines a subtle accent + hero styling so every screen
 * feels distinct while staying cohesive.
 * 
 * Consumed by <ScreenContainer> and hero components.
 */
import { ViewStyle } from 'react-native';
import { brand, bg, semantic, category } from './colors';

export interface ScreenSkin {
  /** Subtle tinted background (used as a wash behind the scroll) */
  backgroundTint: string;
  /** Primary accent for CTAs, highlights, active states */
  accent: string;
  /** Lighter accent for badges, subtle fills */
  accentMuted: string;
  /** Hero card gradient stops (2–3 colors, top → bottom) */
  heroGradient: readonly [string, string, ...string[]];
  /** Hero card text color */
  heroText: string;
  /** Optional extra style applied to the root screen View */
  rootStyle?: ViewStyle;
}

/**
 * Hub — "command center" feel.
 * Purple-toned accent with brand gradient hero.
 */
export const hubSkin: ScreenSkin = {
  backgroundTint: bg.primary,
  accent: brand.primary,
  accentMuted: brand.muted,
  heroGradient: [brand.primary, '#6D28D9'] as const,
  heroText: '#FFFFFF',
} as const;

/**
 * Tasks — productive & energetic.
 * Blue accent keeps it focused.
 */
export const tasksSkin: ScreenSkin = {
  backgroundTint: bg.primary,
  accent: category.work,
  accentMuted: '#EFF6FF',
  heroGradient: [category.work, '#2563EB'] as const,
  heroText: '#FFFFFF',
} as const;

/**
 * Plan — calm & temporal.
 * Teal/green accent signals "time well spent."
 */
export const planSkin: ScreenSkin = {
  backgroundTint: bg.primary,
  accent: semantic.success,
  accentMuted: semantic.successLight,
  heroGradient: [semantic.success, '#059669'] as const,
  heroText: '#FFFFFF',
} as const;

/**
 * Circles / Social — warm & social.
 * Orange/amber accent for community energy.
 */
export const circlesSkin: ScreenSkin = {
  backgroundTint: bg.primary,
  accent: semantic.warning,
  accentMuted: semantic.warningLight,
  heroGradient: [semantic.warning, '#F59E0B'] as const,
  heroText: '#FFFFFF',
} as const;

/**
 * Profile — proud & personal.
 * Pink accent for celebration / progression.
 */
export const profileSkin: ScreenSkin = {
  backgroundTint: bg.primary,
  accent: category.personal,
  accentMuted: '#FDF2F8',
  heroGradient: [category.personal, '#DB2777'] as const,
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
