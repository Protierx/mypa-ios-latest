/**
 * Feature Flags
 * 
 * MYPA v2 Architecture - All new features enabled
 */

export const FEATURE_FLAGS = {
  // Voice System
  USE_VOICE_SYSTEM: true,
  USE_REALTIME_VOICE: true,     // OpenAI Realtime API (WebSocket) — falls back to REST if unavailable
  
  // AI Features
  USE_AI_LEARNING: true,
  USE_LIVING_BACKGROUND: true,
  
  // UI
  USE_NATIVEWIND: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
