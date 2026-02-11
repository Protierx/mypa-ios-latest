/**
 * Voice Services
 * 
 * Comprehensive voice service for MYPA using OpenAI's premium voice APIs.
 * - STT: OpenAI Whisper via Supabase Edge Function (REST fallback)
 * - TTS: OpenAI TTS via Supabase Edge Function (REST fallback)
 * - Realtime: OpenAI Realtime API via WebSocket (primary, <800ms latency)
 * - Default voice: 'ash'
 * 
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 6
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 5
 */

// Core Voice Service - Singleton instance (REST fallback)
export { 
  VoiceService,
  type VoiceServiceInterface,
  type VoiceState,
  type VoiceError,
  type SpeakOptions,
} from './VoiceService';

// Realtime Voice Service - WebSocket client for OpenAI Realtime API
export {
  realtimeVoiceService,
  type RealtimeEvent,
  type RealtimeTranscriptEvent,
  type RealtimeAudioEvent,
  type RealtimeFunctionCallEvent,
  type RealtimeErrorEvent,
} from './RealtimeVoiceService';

// PCM Audio Utilities
export {
  stripWavHeader,
  createWavFromPcm,
  concatenatePcmChunks,
} from './pcmUtils';

// Re-export singleton as default
export { VoiceService as default } from './VoiceService';
