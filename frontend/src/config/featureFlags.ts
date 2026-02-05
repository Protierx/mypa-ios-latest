/**
 * Feature Flags
 * 
 * Controls gradual rollout of new architecture.
 * Set flags to true to enable new features, false to use legacy code.
 * 
 * Usage:
 *   import { FEATURE_FLAGS } from '@/config/featureFlags';
 *   if (FEATURE_FLAGS.USE_SUPABASE_AUTH) { ... }
 */

export const FEATURE_FLAGS = {
  // Backend Migration
  USE_SUPABASE_AUTH: false,        // Use Supabase Auth instead of Express JWT
  USE_SUPABASE_DATABASE: false,    // Use Supabase for data instead of Express API
  
  // Navigation
  USE_GESTURE_NAV: true,           // Use gesture-based navigation instead of tabs
  
  // Voice System
  USE_VOICE_SYSTEM: false,         // Enable voice commands
  USE_REALTIME_VOICE: false,       // Use OpenAI Realtime API (vs Whisper+TTS)
  
  // AI Features
  USE_AI_LEARNING: false,          // Enable AI learning system
  USE_LIVING_BACKGROUND: false,    // Enable Living Background on AI Hub
  
  // UI
  USE_NEW_AI_HOME: false,          // Use new AI Hub design
  USE_NATIVEWIND: false,           // Use NativeWind/Tailwind styling
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Helper to conditionally render based on feature flag
 */
export function withFeatureFlag<T>(
  flag: FeatureFlag,
  enabledValue: T,
  disabledValue: T
): T {
  return FEATURE_FLAGS[flag] ? enabledValue : disabledValue;
}
