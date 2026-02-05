/**
 * Voice Services
 * 
 * Comprehensive voice service for MYPA using OpenAI's premium voice APIs.
 * - STT: OpenAI Whisper via Supabase Edge Function
 * - TTS: OpenAI TTS via Supabase Edge Function
 * - Default voice: 'nova' (friendly, female, energetic)
 * 
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 6
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 5
 */

// Core Voice Service - Singleton instance
export { 
  VoiceService,
  type VoiceServiceInterface,
  type VoiceState,
  type VoiceError,
  type SpeakOptions,
} from './VoiceService';

// Re-export singleton as default
export { VoiceService as default } from './VoiceService';
