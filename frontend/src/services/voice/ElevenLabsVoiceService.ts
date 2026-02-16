/**
 * ElevenLabs Voice Service
 *
 * Thin bridge between the ElevenLabs `useConversation` hook (React world)
 * and VoiceContext.tsx (imperative world). This file does NOT call the hook
 * itself — it defines:
 *
 * 1. The callback wiring that maps ElevenLabs events → VoiceState machine
 * 2. The `clientTools` map (all 20 action tools registered on the agent)
 * 3. Dynamic variable builders for session start
 * 4. Type exports consumed by VoiceContext
 *
 * VoiceContext instantiates `useConversation(options)` with the options
 * built here, then calls `conversation.startSession(config)`.
 */

import {
  executeAction,
  type ActionJSON,
  type ActionResult,
} from '../actionExecutor';
import { supabase } from '@/lib/supabase';
import type {
  Callbacks,
  ConversationConfig,
  ConversationOptions,
  Mode,
  ConversationStatus,
} from '@elevenlabs/react-native';

/**
 * Voice state machine states.
 * Defined here (not imported from VoiceContext) to avoid circular deps.
 * VoiceContext re-exports this type so consumers still import from there.
 */
export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'timeout'
  | 'error'
  | 'offline';

/** Message payload shape from ElevenLabs onMessage callback */
interface MessagePayload {
  message: string;
  source: 'user' | 'ai';
  role: 'user' | 'agent';
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Sentinel value meaning "use whatever voice is configured on the ElevenLabs agent."
 * When this is the selected voice, NO voiceId override is sent to startSession.
 */
export const DEFAULT_ELEVENLABS_VOICE_ID = 'agent-default';

/** Fallback voice ID for REST TTS calls (which have no agent config) */
export const FALLBACK_TTS_VOICE_ID = 'cjVigY5qzO86Huf0OWal';

/** Inactivity timeout — auto-end session after sustained silence */
export const SESSION_INACTIVITY_TIMEOUT_MS = 90_000;

// ============================================================================
// Types
// ============================================================================

/** Callbacks that VoiceContext provides so we can update its state */
export interface VoiceStateCallbacks {
  setVoiceState: (state: VoiceState) => void;
  setTranscript: (text: string) => void;
  setAiResponse: (text: string) => void;
  setError: (error: string | null) => void;
  setIsConversationActive: (active: boolean) => void;
  /** Called when the agent invokes a tool — VoiceContext handles confirmation flow */
  onToolCall: (toolName: string, params: Record<string, unknown>) => Promise<string>;
  /** Called when mode changes between speaking/listening */
  onModeChange: (mode: Mode) => void;
  /** Called with VAD score (0-1) for audio level visualization */
  setAudioLevel: (level: number) => void;
}

/** Dynamic variables passed to the agent at session start */
export interface SessionDynamicVariables {
  user_id: string;
  user_name: string;
  time_of_day: string;
  platform: string;
  greeting_context: string;
  timezone: string;
  overwhelm_score: string;
  completion_rate: string;
  tone_preference: string;
  streak_days: string;
  tasks_today_count: string;
  overdue_count: string;
  current_screen: string;
  task_summary: string;
  language: string;
  voice_speed: string;
}

// ============================================================================
// Dynamic Variable Helpers
// ============================================================================

/** Get time-of-day bucket for personalized greeting */
export function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/** Get the user's IANA timezone string */
export function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

// ============================================================================
// Callback Builders
// ============================================================================

/**
 * Build the `useConversation` options object with all callbacks wired to
 * VoiceContext state setters. Call this inside VoiceProvider and pass the
 * returned object to `useConversation(options)`.
 */
export function buildConversationOptions(
  stateCallbacks: VoiceStateCallbacks,
): ConversationOptions {
  const {
    setVoiceState,
    setTranscript,
    setAiResponse,
    setError,
    setIsConversationActive,
    onToolCall,
    onModeChange: externalModeChange,
    setAudioLevel,
  } = stateCallbacks;

  // ── clientTools: 20 tools registered on the ElevenLabs agent ──────
  // Each tool receives parsed params from the agent and must return a
  // result string. The agent uses this to formulate a spoken response.
  const clientTools: Record<string, (parameters: unknown) => Promise<string>> = {};

  const TOOL_NAMES = [
    'create_task',
    'update_task',
    'complete_task',
    'delete_task',
    'reschedule_task',
    'batch_create_tasks',
    'start_focus_session',
    'pause_focus',
    'resume_focus',
    'end_focus',
    'create_circle',
    'invite_to_circle',
    'create_challenge',
    'post_to_circle',
    'brain_dump',
    'set_preference',
    'query_tasks',
    'query_schedule',
    'query_stats',
    'query_circles',
    'navigate_to_screen',
  ];

  for (const toolName of TOOL_NAMES) {
    clientTools[toolName] = async (parameters: unknown): Promise<string> => {
      try {
        console.log(`[ElevenLabsVoice] Tool call: ${toolName}`, parameters);
        const result = await onToolCall(toolName, (parameters as Record<string, unknown>) || {});
        return result;
      } catch (err) {
        console.error(`[ElevenLabsVoice] Tool ${toolName} error:`, err);
        return `Error executing ${toolName}: ${err instanceof Error ? err.message : 'Unknown error'}`;
      }
    };
  }

  // ── Callback wiring ───────────────────────────────────────────────
  const callbacks: Partial<Callbacks> = {
    onConnect: ({ conversationId }) => {
      console.log(`[ElevenLabsVoice] Connected: ${conversationId}`);
      setIsConversationActive(true);
      setError(null);
      // Set to listening so the user knows the session is live.
      // onModeChange will override this when the agent starts speaking.
      setVoiceState('listening');
    },

    onDisconnect: (details) => {
      console.log('[ElevenLabsVoice] Disconnected:', details.reason);
      setIsConversationActive(false);
      setVoiceState('idle');

      if (details.reason === 'error') {
        const errorDetails = details as { reason: 'error'; message: string };
        setError(errorDetails.message || 'Voice connection lost');
        console.error('[ElevenLabsVoice] Disconnect error:', errorDetails.message);
      }
    },

    onMessage: (payload: MessagePayload) => {
      // Update transcript (user) or AI response (agent)
      if (payload.role === 'user') {
        setTranscript(payload.message);
      } else {
        setAiResponse(payload.message);
      }
    },

    onModeChange: ({ mode }: { mode: Mode }) => {
      // Map ElevenLabs mode → VoiceState
      // 'speaking' = agent is talking, 'listening' = user's turn
      if (mode === 'speaking') {
        setVoiceState('speaking');
      } else if (mode === 'listening') {
        setVoiceState('listening');
      }
      externalModeChange(mode);
    },

    onStatusChange: ({ status }: { status: ConversationStatus }) => {
      console.log(`[ElevenLabsVoice] Status: ${status}`);
      if (status === 'connecting') {
        setVoiceState('processing'); // Show loading state while connecting
      } else if (status === 'disconnected') {
        setVoiceState('idle');
        setIsConversationActive(false);
      }
      // 'connected' is handled by onConnect
    },

    onError: (message: string, context?: unknown) => {
      console.error('[ElevenLabsVoice] Error:', message, context);
      setError(message);
      setVoiceState('error');
    },

    onVadScore: ({ vadScore }) => {
      setAudioLevel(vadScore);
    },

    onInterruption: () => {
      // User interrupted the agent — ElevenLabs handles this natively
      // (stops current speech, opens mic). We just log it.
      console.log('[ElevenLabsVoice] User interrupted agent');
    },
  };

  return {
    ...callbacks,
    clientTools,
  };
}

// ============================================================================
// Session Config Builder
// ============================================================================

/**
 * Build the session config object for `conversation.startSession()`.
 *
 * @param conversationToken - JWT from the elevenlabs-signed-url edge function
 *   (which calls ElevenLabs `/v1/convai/conversation/token`). The SDK parses
 *   this JWT internally to extract the LiveKit room name.
 * @param dynamicVars - User-specific variables for the agent
 * @param voiceId - Optional voice override from settings
 * @param voiceSettings - Adaptive voice settings (Step 17) for TTS overrides
 */
export function buildSessionConfig(
  conversationToken: string,
  dynamicVars: SessionDynamicVariables,
  voiceId?: string,
  _voiceSettings?: { stability: number; similarity_boost: number; style: number },
): ConversationConfig {
  const config: ConversationConfig = {
    conversationToken,
    dynamicVariables: dynamicVars as unknown as Record<string, string | number | boolean>,
    userId: dynamicVars.user_id,
  };

  // Build TTS overrides from voice selection only
  // NOTE: stability/similarityBoost/style overrides are NOT allowed by the
  // ElevenLabs agent config — sending them causes "Override for field
  // 'stability' is not allowed by config" and the agent disconnects instantly.
  // Voice personality is configured on the agent dashboard instead.
  const ttsOverrides: Record<string, unknown> = {};

  // Only override the agent's voice when the user explicitly selected a specific voice
  // 'agent-default' means "use whatever is configured on the ElevenLabs agent dashboard"
  if (voiceId && voiceId !== DEFAULT_ELEVENLABS_VOICE_ID) {
    ttsOverrides.voiceId = voiceId;
  }

  if (Object.keys(ttsOverrides).length > 0) {
    config.overrides = { tts: ttsOverrides };
  }

  return config;
}

// ============================================================================
// Tool Call Handler (used by VoiceContext)
// ============================================================================

/**
 * Execute a tool call from the ElevenLabs agent.
 * Returns a result string that the agent uses to formulate a spoken response.
 *
 * This is the bridge between ElevenLabs clientTools and the existing
 * ActionExecutor. For mutations, we execute via Supabase client (RLS enforced).
 * For queries, the agent handles them server-side but we still need to
 * return the result string.
 */
export async function handleToolCall(
  toolName: string,
  params: Record<string, unknown>,
  userId: string,
): Promise<string> {
  // Build an ActionJSON from the tool call
  const actionJson: ActionJSON = {
    action: toolName,
    params,
    // ElevenLabs agent only calls tools when confident, so we set high confidence
    confidence: 0.95,
    // Confirmation is handled by the agent's conversational flow, not client-side
    confirmation_required: false,
  };

  const result: ActionResult = await executeAction(actionJson, userId);

  if (result.success) {
    // Return the result message — agent will speak it
    return result.message || 'Done.';
  } else if (result.needsConfirmation) {
    // For confirmation-required actions (e.g. delete_task),
    // return a prompt — the agent will ask the user verbally
    return result.confirmationPrompt || 'Are you sure you want to do that?';
  } else {
    return result.message || 'Something went wrong.';
  }
}

// ============================================================================
// Conversation Token Fetcher
// ============================================================================

/**
 * Fetch a conversation token (JWT) from the elevenlabs-signed-url edge function.
 * The token is short-lived and scoped to one LiveKit session.
 *
 * Why "signed-url" edge function name but returning a token?
 *   We kept the function name for deploy continuity. The function now calls
 *   ElevenLabs `/v1/convai/conversation/token` (not `/get-signed-url`).
 */
export async function fetchConversationToken(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('elevenlabs-signed-url');

  if (error) {
    console.error('[ElevenLabsVoice] Token fetch error:', error);
    throw new Error(`Failed to get voice session token: ${error.message}`);
  }

  const token = (data as { token?: string })?.token;
  if (!token) {
    throw new Error('No conversation token returned from server');
  }

  return token;
}
