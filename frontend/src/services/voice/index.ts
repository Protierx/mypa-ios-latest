/**
 * Voice Services — ElevenLabs Conversational AI
 *
 * All voice functionality goes through the ElevenLabs agent.
 * - Conversational: @elevenlabs/react-native SDK (LiveKit WebRTC)
 * - TTS fallback: ElevenLabs REST via Supabase edge function
 *
 * Reference: docs/planning/ELEVENLABS_VOICE_MIGRATION_PLAN.md
 */

// ElevenLabs Voice Service — callback builders, session config, tool handler
export {
  buildConversationOptions,
  buildSessionConfig,
  handleToolCall,
  fetchConversationToken,
  getTimeOfDay,
  getTimezone,
  DEFAULT_ELEVENLABS_VOICE_ID,
  SESSION_INACTIVITY_TIMEOUT_MS,
  type VoiceState,
  type VoiceStateCallbacks,
  type SessionDynamicVariables,
} from './ElevenLabsVoiceService';
