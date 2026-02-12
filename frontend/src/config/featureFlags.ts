/**
 * Feature Flags
 * 
 * MYPA v2 Architecture - All new features enabled
 */

export const FEATURE_FLAGS = {
  // Voice System
  USE_VOICE_SYSTEM: true,
  USE_ELEVENLABS_VOICE: true,   // ElevenLabs Conversational AI (WebRTC) — falls back to REST if unavailable
  USE_WAKE_WORD: false,          // "Hey MYPA" on-device wake word (requires Picovoice access key)
  
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
