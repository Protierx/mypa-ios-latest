/**
 * Voice Context Provider — ElevenLabs Conversational AI
 *
 * Single voice context for the entire app. Uses the ElevenLabs
 * `useConversation` hook (LiveKit WebRTC) for full-duplex voice.
 * Barge-in, VAD, STT, LLM, TTS are all handled by the SDK.
 *
 * Discreet mode (text-only) still uses the voice-command + text-to-speech
 * edge functions as a REST fallback.
 *
 * Reference: docs/planning/ELEVENLABS_VOICE_MIGRATION_PLAN.md
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { Alert, Linking } from 'react-native';
import {
  createAudioPlayer,
  setAudioModeAsync,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  type AudioPlayer,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useConversation, type Mode } from '@elevenlabs/react-native';
import { eventLogger } from '../services/eventLogger';
import {
  executeAction,
  type ActionJSON,
  type VoiceCommandResponse,
} from '../services/actionExecutor';
import {
  buildConversationOptions,
  buildSessionConfig,
  fetchConversationToken,
  handleToolCall,
  getTimeOfDay,
  getTimezone,
  DEFAULT_ELEVENLABS_VOICE_ID,
  FALLBACK_TTS_VOICE_ID,
  SESSION_INACTIVITY_TIMEOUT_MS,
  type VoiceState as ElevenLabsVoiceState,
  type SessionDynamicVariables,
} from '../services/voice/ElevenLabsVoiceService';
import { useUserModel } from './UserModelContext';
import { wakeWordService } from '../services/voice/WakeWordService';
import {
  buildScreenContext,
  buildUserStateContext,
  buildKnowledgeContext,
  type ScreenContextData,
} from '../services/voice/ScreenContextService';
import {
  getAdaptiveVoiceSettings,
  getVoiceMoodLabel,
  type AdaptiveVoiceContext,
} from '../services/voice/AdaptiveVoiceService';
import {
  OfflineQueueService,
  type ConnectionQuality,
} from '../services/voice/OfflineQueueService';
import {
  scribeService,
  type ScribeState,
  type ScribeError,
  type ScribeCommitStrategy,
} from '../services/voice/ScribeService';
import { audioSessionService } from '../services/voice/AudioSessionService';
import type { Screen } from '../navigation-v2/GestureContext';

// ============================================================================
// Constants
// ============================================================================

/** Map 2-letter language codes to BCP-47 locale tags for expo-speech */
const LANGUAGE_TO_LOCALE: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  ar: 'ar-SA',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
  hi: 'hi-IN',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
};

// ============================================================================
// Types
// ============================================================================

/**
 * Re-export VoiceState from the service layer (canonical definition lives
 * in ElevenLabsVoiceService to avoid circular deps).
 */
export type VoiceState = ElevenLabsVoiceState;

interface VoiceContextType {
  // State
  voiceState: VoiceState;
  isVoiceEnabled: boolean;
  audioLevel: number;
  transcript: string;
  aiResponse: string;
  error: string | null;
  /** Whether a voice session is currently connected */
  isConversationActive: boolean;

  // Controls
  startListening: () => Promise<void>;
  stopListening: () => Promise<string>;
  cancelListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  /** Barge-in — ElevenLabs handles this natively; this is a no-op for compat */
  bargeIn: () => Promise<void>;
  /** End the ElevenLabs session and go back to IDLE */
  endConversation: () => void;

  // Settings
  setVoiceEnabled: (enabled: boolean) => void;
  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;

  // Language
  preferredLanguage: string;
  setPreferredLanguage: (lang: string) => void;

  // Discreet Mode (text-only fallback)
  isDiscreetMode: boolean;
  setDiscreetMode: (enabled: boolean) => void;
  /** Submit text directly (discreet mode / offline fallback) */
  submitText: (text: string) => Promise<void>;

  // Wake Word ("Hey MYPA" hands-free activation)
  isWakeWordEnabled: boolean;
  setWakeWordEnabled: (enabled: boolean) => void;
  wakeWordSensitivity: number;
  setWakeWordSensitivity: (sensitivity: number) => void;

  // Noise Isolation (for noisy environments)
  isNoiseIsolationEnabled: boolean;
  setNoiseIsolationEnabled: (enabled: boolean) => void;

  // Offline Resilience (Step 20)
  /** True when device has no network */
  isOffline: boolean;
  /** Current connection quality tier */
  connectionQuality: ConnectionQuality | null;
  /** Number of actions queued for offline sync */
  queuedActionCount: number;
  /** Manually retry connection after being offline */
  retryConnection: () => Promise<void>;

  // Dynamic Contextual Awareness (Step 14)
  /** Send screen context update to active ElevenLabs session */
  updateScreenContext: (screen: Screen, data?: ScreenContextData) => void;

  // Contextual Auto-Navigation (Step 7b)
  /** Request the gesture navigator to animate to a screen (set by AI tool call) */
  requestedNavigation: { screen: Screen; ts: number } | null;
  /** Acknowledge / clear the navigation request after it's been handled */
  clearNavigationRequest: () => void;

  // Live Captions (Step 21f)
  /** Whether live captions are shown during voice sessions */
  isLiveCaptionsEnabled: boolean;
  setLiveCaptionsEnabled: (enabled: boolean) => void;

  // Scribe v2 Realtime STT (Step 21)
  /** Current Scribe connection state */
  scribeState: ScribeState;
  /** Live partial transcript from Scribe */
  scribePartialTranscript: string;
  /** Full committed transcript from Scribe */
  scribeFullTranscript: string;
  /** Start Scribe transcription session */
  startScribe: (options?: { commitStrategy?: ScribeCommitStrategy; languageCode?: string; previousText?: string }) => Promise<void>;
  /** Stop Scribe transcription session */
  stopScribe: () => Promise<void>;
  /** Manually commit current speech segment (manual mode) */
  commitScribe: () => void;
  /** Start brain dump via Scribe — dictate freely, save when done */
  startBrainDumpScribe: () => Promise<void>;
  /** Finish brain dump and return the full transcript */
  finishBrainDumpScribe: () => Promise<string>;

  // Voice Limit Upsell (Step 11 — monetization)
  /** Whether the voice limit upsell sheet should be shown */
  showVoiceLimitUpsell: boolean;
  /** Dismiss the voice limit upsell sheet */
  dismissVoiceLimitUpsell: () => void;
  /** Voice usage info for upsell display */
  voiceLimitInfo: { count: number; limit: number } | null;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

// ============================================================================
// Helpers
// ============================================================================

/**
 * Invoke an edge function with automatic 401 retry (refresh session once).
 */
async function invokeWithAuth<T = unknown>(
  fnName: string,
  options?: { body?: Record<string, unknown> },
): Promise<{ data: T | null; error: FunctionsHttpError | Error | null }> {
  const first = await supabase.functions.invoke(fnName, options);
  if (!first.error) return first as { data: T; error: null };

  if (first.error instanceof FunctionsHttpError && first.error.context?.status === 401) {
    const { error: refreshErr } = await supabase.auth.refreshSession();
    if (!refreshErr) {
      return (await supabase.functions.invoke(fnName, options)) as {
        data: T;
        error: FunctionsHttpError | null;
      };
    }
  }
  return first as { data: null; error: FunctionsHttpError | Error };
}

// ============================================================================
// Provider
// ============================================================================

interface VoiceProviderProps {
  children: React.ReactNode;
}

export function VoiceProvider({ children }: VoiceProviderProps) {
  // -- Core State ----------------------------------------------------------
  const [requestedNavigation, setRequestedNavigation] = useState<{ screen: Screen; ts: number } | null>(null);
  const clearNavigationRequest = useCallback(() => setRequestedNavigation(null), []);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isVoiceEnabled, setVoiceEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConversationActive, setIsConversationActive] = useState(false);

  // -- Voice Limit Upsell --------------------------------------------------
  const [showVoiceLimitUpsell, setShowVoiceLimitUpsell] = useState(false);
  const [voiceLimitInfo, setVoiceLimitInfo] = useState<{ count: number; limit: number } | null>(null);
  const dismissVoiceLimitUpsell = useCallback(() => {
    setShowVoiceLimitUpsell(false);
    setVoiceLimitInfo(null);
  }, []);

  // -- Settings ------------------------------------------------------------
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_ELEVENLABS_VOICE_ID);
  const [isDiscreetMode, setIsDiscreetMode] = useState(false);

  // -- Wake Word state ----------------------------------------------------
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(false);
  const [wakeWordSensitivity, setWakeWordSensitivityState] = useState(0.5);

  // -- Language preference state -------------------------------------------
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  // -- Noise Isolation state -----------------------------------------------
  const [isNoiseIsolationEnabled, setIsNoiseIsolationEnabled] = useState(false);

  // -- Live Captions state (Step 21f) --------------------------------------
  const [isLiveCaptionsEnabled, setIsLiveCaptionsEnabled] = useState(false);

  // -- Offline Resilience state (Step 20) ----------------------------------
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | null>(null);
  const [queuedActionCount, setQueuedActionCount] = useState(0);
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastQualityCheckRef = useRef<{ quality: ConnectionQuality; ts: number } | null>(null);

  // -- Scribe v2 state (Step 21) ------------------------------------------
  const [scribeState, setScribeState] = useState<ScribeState>('idle');
  const [scribePartialTranscript, setScribePartialTranscript] = useState('');
  const [scribeFullTranscript, setScribeFullTranscript] = useState('');
  const isBrainDumpScribeRef = useRef(false);

  // -- Refs for use inside closures ----------------------------------------
  const voiceStateRef = useRef<VoiceState>('idle');
  const isPlayingAudioRef = useRef(false);
  const soundRef = useRef<AudioPlayer | null>(null);
  const listenStartTimeRef = useRef<number>(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);
  const sessionStartInFlightRef = useRef(false);
  const wakeWordCooldownUntilRef = useRef(0);
  /** Tracks recent task completion for celebration voice boost (Step 17b) */
  const celebrationBoostRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // -- User model for dynamic variables ------------------------------------
  let userModelData: any = null;
  try {
    userModelData = useUserModel();
  } catch {
    // UserModelContext not available — use defaults
  }

  // -- ElevenLabs useConversation hook -------------------------------------
  // Build options with callbacks that wire into our state machine.
  // We use useRef pattern to avoid re-creating the conversation
  // options on every render (which would break the hook).
  const stateCallbacksRef = useRef({
    setVoiceState: (state: VoiceState) => {
      // Haptic feedback on key state transitions
      if (state === 'listening' && voiceStateRef.current !== 'listening') {
        // Session connected or returned to listening — subtle success pulse
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else if (state === 'error') {
        // Error state — error haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      setVoiceState(state);
      voiceStateRef.current = state;
    },
    setTranscript,
    setAiResponse,
    setError,
    setIsConversationActive,
    setAudioLevel,
    onToolCall: async (toolName: string, params: Record<string, unknown>): Promise<string> => {
      // Step 7b: Contextual auto-navigation — intercept before action system
      if (toolName === 'navigate_to_screen') {
        const screenMap: Record<string, Screen> = {
          tasks: 'tasks',
          challenges: 'social',
          circles: 'social',
          social: 'social',
          focus: 'focus',
          profile: 'profile',
          ai_hub: 'ai_hub',
          home: 'ai_hub',
        };
        const target = screenMap[String(params.screen || '').toLowerCase()] || null;
        if (target) {
          setRequestedNavigation({ screen: target, ts: Date.now() });
          console.log(`[Voice] Navigate → ${target} (reason: ${params.reason || 'user request'})`);
          return `Navigated to ${target}`;
        }
        return 'Unknown screen';
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'Not authenticated';
      eventLogger.log('voice_command', { action: toolName, mode: 'elevenlabs' });
      let result: string;
      try {
        result = await handleToolCall(toolName, params, user.id);
      } catch (toolErr) {
        // If the action fails due to network, queue it for later (Step 20c)
        if (OfflineQueueService.canQueue(toolName)) {
          await OfflineQueueService.enqueue(toolName, params, user.id);
          const qLen = await OfflineQueueService.getQueueLength();
          setQueuedActionCount(qLen);
          result = `Got it — I've saved that for when you're back online. ${qLen} action${qLen > 1 ? 's' : ''} queued.`;
        } else {
          result = 'That didn\'t work — check your connection and try again.';
        }
      }

      // Celebration boost (Step 17b): after completing a task, temporarily
      // flag for more enthusiastic voice on the next speak() call.
      if (toolName === 'complete_task') {
        celebrationBoostRef.current = true;
        // Auto-clear after 10 seconds so it doesn't persist
        setTimeout(() => { celebrationBoostRef.current = false; }, 10_000);
      }

      return result;
    },
    onModeChange: (_mode: Mode) => {
      // Light haptic when MYPA starts speaking — user feels the AI respond
      if (_mode === 'speaking') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      // Reset inactivity timer on every mode change
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        if (voiceStateRef.current === 'listening') {
          console.log('[Voice] Inactivity timeout — ending session');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          conversationRef.current?.endSession('user');
        }
      }, SESSION_INACTIVITY_TIMEOUT_MS);
    },
  });

  // Stable options object — only created once
  const [conversationOptions] = useState(() =>
    buildConversationOptions(stateCallbacksRef.current),
  );

  const conversation = useConversation(conversationOptions);
  const conversationRef = useRef(conversation);
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);

  // -- Audio permissions on mount ------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        await requestRecordingPermissionsAsync();
        await audioSessionService.configure();
      } catch (err) {
        console.error('[Voice] Failed to request audio permissions:', err);
      }
    })();
  }, []);

  // -- Connection quality monitoring (Step 20a) ----------------------------
  useEffect(() => {
    let cancelled = false;

    const checkQuality = async () => {
      const quality = await OfflineQueueService.checkConnectionQuality();
      if (cancelled) return;

      lastQualityCheckRef.current = { quality, ts: Date.now() };
      setConnectionQuality((prev) => {
        if (prev !== null && prev !== quality) {
          console.log(`[Voice] Connection quality: ${prev} → ${quality}`);
        }
        return quality;
      });

      // Auto-flush queued actions when coming back online
      if (quality !== 'offline') {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && !cancelled) {
            const queueLen = await OfflineQueueService.getQueueLength();
            setQueuedActionCount(queueLen);
            if (queueLen > 0) {
              console.log(`[Voice] Online — flushing ${queueLen} queued actions`);
              const result = await OfflineQueueService.flush(user.id);
              if (!cancelled) {
                setQueuedActionCount(result.remaining);
                if (result.succeeded > 0) {
                  console.log(`[Voice] Flushed ${result.succeeded} queued actions`);
                }
              }
            }
          }
        } catch { /* non-fatal */ }
      }
    };

    // Delay first check by 3s to let DNS/TLS warm up (avoids false-poor on cold launch)
    const warmupTimer = setTimeout(() => {
      checkQuality();
      // Then check every 30s
      connectionCheckIntervalRef.current = setInterval(checkQuality, 30_000);
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(warmupTimer);
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current);
        connectionCheckIntervalRef.current = null;
      }
    };
  }, []);

  // -- Load discreet mode + wake word settings from AsyncStorage -----------
  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const val = await AsyncStorage.getItem('mypa_discreet_mode');
        if (val === '1') setIsDiscreetMode(true);

        // Load wake word preference
        const wakeWordVal = await AsyncStorage.getItem('mypa_wake_word_enabled');
        if (wakeWordVal === '1') setIsWakeWordEnabled(true);
        const sensitivityVal = await AsyncStorage.getItem('mypa_wake_word_sensitivity');
        if (sensitivityVal) setWakeWordSensitivityState(parseFloat(sensitivityVal));

        // Load noise isolation preference
        const noiseIsoVal = await AsyncStorage.getItem('mypa_noise_isolation');
        if (noiseIsoVal === '1') setIsNoiseIsolationEnabled(true);

        // Load live captions preference (Step 21f)
        const captionsVal = await AsyncStorage.getItem('mypa_live_captions');
        if (captionsVal === '1') setIsLiveCaptionsEnabled(true);

        // Load preferred language
        const langVal = await AsyncStorage.getItem('mypa_preferred_language');
        if (langVal) setPreferredLanguage(langVal);
      } catch { /* noop */ }
    })();
  }, []);

  // -- Wake word: init/start/stop based on isWakeWordEnabled ----------------
  // Split from sensitivity to avoid full destroy→init cycle on slider changes.
  const wakeWordInitializingRef = useRef(false);

  useEffect(() => {
    if (!isWakeWordEnabled) {
      // User disabled wake word — tear down fully
      wakeWordService.stop().then(() => wakeWordService.destroy()).catch(() => {});
      return;
    }

    // Initialize and start Porcupine (guarded against double-init)
    let cancelled = false;
    (async () => {
      if (wakeWordInitializingRef.current) return; // already in flight
      if (wakeWordService.isInitialized) {
        // Already initialized (e.g. re-mount) — just ensure it's running
        if (!cancelled) await wakeWordService.start().catch(() => {});
        return;
      }

      wakeWordInitializingRef.current = true;
      try {
        await wakeWordService.initialize({
          sensitivity: wakeWordSensitivity,
          onDetected: () => {
            const now = Date.now();
            const status = conversationRef.current?.status;
            if (now < wakeWordCooldownUntilRef.current) return;
            if (sessionStartInFlightRef.current) return;
            if (status === 'connected' || status === 'connecting') return;

            wakeWordCooldownUntilRef.current = now + 1500;
            // Wake word heard → pause wake word to release mic, then start session
            console.log('[WakeWord] Triggering startListening()');
            wakeWordService.pause().then(() => {
              startListeningRef.current?.();
            }).catch(() => {
              startListeningRef.current?.();
            });
          },
          onError: (err) => {
            console.warn('[WakeWord] Error:', err.message);
          },
        });
        if (!cancelled && wakeWordService.isInitialized) {
          await wakeWordService.start();
        }
      } finally {
        wakeWordInitializingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
      // On unmount/re-render: just pause, don't destroy.
      // Destroy only happens when user explicitly disables wake word (above).
      wakeWordService.pause().catch(() => {});
    };
  }, [isWakeWordEnabled]); // sensitivity NOT a dep — handled by setSensitivity()

  // -- Wake word: pause/resume when ElevenLabs session toggles --------------
  // Mic can't be shared between Porcupine and WebRTC simultaneously.
  useEffect(() => {
    if (!isWakeWordEnabled) return;

    if (isConversationActive) {
      // ElevenLabs session started → pause wake word
      wakeWordService.pause().catch(() => {});
    } else {
      // Session ended → resume wake word
      wakeWordService.resume().catch(() => {});
    }
  }, [isConversationActive, isWakeWordEnabled]);

  // -- Cleanup on unmount --------------------------------------------------
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (connectionCheckIntervalRef.current) clearInterval(connectionCheckIntervalRef.current);
      conversationRef.current?.endSession('user').catch(() => {});
      stopPlayback();
      // Clean up Scribe on unmount
      scribeService.disconnect().catch(() => {});
      // Clean up wake word on unmount
      wakeWordService.stop().then(() => wakeWordService.destroy()).catch(() => {});
      // Clean up audio session
      audioSessionService.teardown();
    };
  }, []);

  // -----------------------------------------------------------------------
  // Helper: stop audio playback (for discreet-mode TTS)
  // -----------------------------------------------------------------------
  const stopPlayback = async () => {
    if (soundRef.current) {
      try {
        soundRef.current.pause();
        soundRef.current.remove();
      } catch { /* ignore */ }
      soundRef.current = null;
    }
  };

  // -----------------------------------------------------------------------
  // startListening — fetch token -> start ElevenLabs session
  // -----------------------------------------------------------------------
  const startListening = useCallback(async () => {
    if (!isVoiceEnabled) return;
    if (sessionStartInFlightRef.current) {
      console.log('[Voice] startListening ignored — session start already in flight');
      return;
    }

    // DND / Phone Call — don't start voice if audio session is interrupted
    if (audioSessionService.isInterrupted) {
      console.log('[Voice] Audio session interrupted (call/DND) — skipping');
      setError('Voice unavailable — phone call or Focus mode active');
      return;
    }

    // Mic permission self-check (guard for wake word / programmatic triggers)
    const { status: micStatus } = await getRecordingPermissionsAsync();
    if (micStatus === 'denied') {
      setError('Microphone access denied. Go to Settings → MYPA to enable.');
      return;
    }
    if (micStatus !== 'granted') {
      const { status: newMicStatus } = await requestRecordingPermissionsAsync();
      if (newMicStatus !== 'granted') {
        setError('Microphone permission is required for voice.');
        return;
      }
    }

    // Discreet mode: just set state, UI shows text input
    if (isDiscreetMode) {
      setVoiceState('listening');
      setTranscript('');
      setError(null);
      eventLogger.log('voice_activated', { mode: 'discreet' });
      return;
    }

    sessionStartInFlightRef.current = true;

    // Connection quality check (Step 20a) — use cached result if <10s old
    const cached = lastQualityCheckRef.current;
    let quality: ConnectionQuality;
    if (cached && Date.now() - cached.ts < 10_000) {
      quality = cached.quality;
    } else {
      quality = await OfflineQueueService.checkConnectionQuality();
      lastQualityCheckRef.current = { quality, ts: Date.now() };
      setConnectionQuality(quality);
    }
    if (quality === 'offline') {
      setVoiceState('offline');
      setError('No network connection. Type your request instead.');
      eventLogger.log('voice_error', { errorType: 'offline' });
      sessionStartInFlightRef.current = false;
      return;
    }
    if (quality === 'poor') {
      // Poor connection — warn but let them try; they can switch to text
      console.warn('[Voice] Poor connection — voice may be choppy');
    }

    setError(null);
    setTranscript('');
    setAiResponse('');
    listenStartTimeRef.current = Date.now();
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // If already connected, the session is live — just log
      if (conversation.status === 'connected') {
        console.log('[Voice] Session already active');
        sessionStartInFlightRef.current = false;
        return;
      }

      // If the SDK is still connecting/disconnecting, don't force-end it.
      // Overlapping teardown/startup is what causes immediate session drops.
      if (conversation.status !== 'disconnected') {
        console.log(`[Voice] Session busy (${conversation.status}) — skipping new start`);
        sessionStartInFlightRef.current = false;
        return;
      }

      setVoiceState('processing'); // Show loading while connecting

      // Reset iOS audio session to allow recording — the briefing TTS
      // sets allowsRecording:false which blocks the WebRTC mic.
      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: 'doNotMix',
        });
      } catch (audioErr) {
        console.warn('[Voice] Failed to reset audio mode:', audioErr);
      }

      // 1. Fetch a conversation token (JWT) from our edge function
      const token = await fetchConversationToken();

      // 2. Build dynamic variables from user profile + model
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch profile (display_name, streak) and raw user_model row in parallel
      const [{ data: profile }, { data: rawModel }] = await Promise.all([
        supabase.from('profiles').select('display_name, streak_current').eq('id', user.id).single(),
        supabase.from('user_model').select('overwhelm_score, completion_rate_7d, tone_preference, peak_hours, preferred_focus_duration').eq('user_id', user.id).single(),
      ]);

      const userName = profile?.display_name || user.user_metadata?.full_name || 'there';

      // Compute adaptive voice settings (Step 17) from time-of-day + mood
      const adaptiveCtx: AdaptiveVoiceContext = {
        overwhelmScore: rawModel?.overwhelm_score ?? undefined,
        completionRate: rawModel?.completion_rate_7d ?? undefined,
      };
      const adaptiveSettings = getAdaptiveVoiceSettings(adaptiveCtx);
      console.log(`[Voice] Adaptive voice mood: ${getVoiceMoodLabel(adaptiveCtx)}`, adaptiveSettings);

      // Fetch today's task counts for smart greeting context
      const todayStr = new Date().toISOString().slice(0, 10);
      const [{ count: todayCount }, { count: overdueCount }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .gte('due_date', todayStr)
          .lt('due_date', todayStr + 'T23:59:59'),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .lt('due_date', todayStr),
      ]);

      const tasksToday = todayCount ?? 0;
      const overdueTasks = overdueCount ?? 0;
      const streakDays = profile?.streak_current ?? 0;
      const overwhelm = rawModel?.overwhelm_score ?? 0;

      // Build smart greeting context (Step 19b)
      let greetingContext: string;
      if (overdueTasks > 0) {
        greetingContext = `User has ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''} and ${tasksToday} task${tasksToday !== 1 ? 's' : ''} due today`;
      } else if (overwhelm > 0.7) {
        greetingContext = `User seems overwhelmed (score: ${overwhelm.toFixed(1)}). ${tasksToday} tasks today. Be gentle.`;
      } else if (streakDays > 5) {
        greetingContext = `User is on a ${streakDays}-day streak! ${tasksToday} tasks planned today. Celebrate!`;
      } else if (tasksToday === 0) {
        greetingContext = 'User has no tasks due today — a clear day! Suggest brain dump or planning.';
      } else {
        greetingContext = `Normal day, ${tasksToday} task${tasksToday !== 1 ? 's' : ''} planned today`;
      }

      const dynamicVars: SessionDynamicVariables = {
        user_id: user.id,
        user_name: userName,
        time_of_day: getTimeOfDay(),
        platform: 'ios',
        greeting_context: greetingContext,
        timezone: getTimezone(),
        overwhelm_score: String(overwhelm),
        completion_rate: String(rawModel?.completion_rate_7d ?? 0),
        tone_preference: rawModel?.tone_preference || 'friendly',
        streak_days: String(streakDays),
        tasks_today_count: String(tasksToday),
        overdue_count: String(overdueTasks),
        current_screen: currentScreenRef.current,
        task_summary: '',
        language: preferredLanguage,
        voice_speed: String(voiceSpeed),
      };

      // 3. Build session config and start (with adaptive voice settings)
      const sessionConfig = buildSessionConfig(token, dynamicVars, selectedVoice, adaptiveSettings);
      await conversation.startSession(sessionConfig);

      // 4. Inject per-session knowledge context (Steps 14b, 14c, 15b, 15c)
      //    After the session is live, send rich context so the agent is grounded
      //    in the user's actual data — tasks, focus history, preferences, and
      //    previous conversation summaries.
      try {
        // Fetch tasks, focus sessions, and conversation history in parallel
        const [{ data: taskRows }, { data: focusRows }, { data: historyRows }] = await Promise.all([
          supabase
            .from('tasks')
            .select('title, due_date, status, priority, category')
            .eq('user_id', user.id)
            .order('due_date', { ascending: true })
            .limit(20),
          supabase
            .from('focus_sessions')
            .select('task_id, duration_planned, duration_actual, started_at, tasks(title)')
            .eq('user_id', user.id)
            .order('started_at', { ascending: false })
            .limit(10),
          supabase
            .from('conversation_history')
            .select('summary, mood, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        // Build unified knowledge context
        const knowledgeCtx = buildKnowledgeContext({
          tasks: (taskRows || []).map(t => ({
            title: t.title,
            status: t.status,
            due_date: t.due_date,
            priority: t.priority,
            category: t.category,
          })),
          focusSessions: (focusRows || []).map((s: any) => ({
            taskTitle: s.tasks?.title,
            durationPlanned: s.duration_planned,
            durationActual: s.duration_actual,
            startedAt: s.started_at,
          })),
          preferences: {
            tonePreference: rawModel?.tone_preference || 'friendly',
            peakHours: rawModel?.peak_hours || userModelData?.model?.peakHours || [],
            overwhelmScore: Number(rawModel?.overwhelm_score ?? 0),
            preferredFocusDuration: Number(rawModel?.preferred_focus_duration ?? 25),
          },
          conversationHistory: (historyRows || []).map((h: any) => ({
            summary: h.summary,
            mood: h.mood,
            created_at: h.created_at,
          })),
        });
        conversation.sendContextualUpdate(knowledgeCtx);

        // User state context — emotional/energy awareness (14c)
        const userStateCtx = buildUserStateContext({
          overwhelmScore: Number(rawModel?.overwhelm_score ?? 0),
          completionRate7d: Number(rawModel?.completion_rate_7d ?? 0.5),
          streakDays: Number(profile?.streak_current ?? 0),
          tonePreference: rawModel?.tone_preference || 'friendly',
        });
        conversation.sendContextualUpdate(userStateCtx);

        console.log('[Voice] Injected knowledge + user-state context');
      } catch (ctxErr) {
        // Non-fatal — agent works fine without context injection
        console.warn('[Voice] Context injection failed:', ctxErr);
      }

      eventLogger.log('voice_activated', {
        mode: 'elevenlabs',
        latency_ms: Date.now() - listenStartTimeRef.current,
      });
    } catch (err) {
      console.error('[Voice] Failed to start ElevenLabs session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start voice session');
      setVoiceState('error');
      eventLogger.log('voice_error', {
        errorType: err instanceof Error ? err.message : 'session_start_failed',
        mode: 'elevenlabs',
      });

      // Auto-recover to idle after 5s
      setTimeout(() => {
        if (voiceStateRef.current === 'error') {
          setVoiceState('idle');
          setError(null);
        }
      }, 5000);
    } finally {
      sessionStartInFlightRef.current = false;
    }
  }, [isVoiceEnabled, isDiscreetMode, selectedVoice, conversation, userModelData]);

  // Keep ref in sync so wake word callback always has the latest
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // -----------------------------------------------------------------------
  // stopListening — end the ElevenLabs session
  // -----------------------------------------------------------------------
  const stopListening = useCallback(async (): Promise<string> => {
    if (conversation.status === 'connected') {
      await conversation.endSession('user');
    }
    setAudioLevel(0);
    return transcript;
  }, [conversation, transcript]);

  // -----------------------------------------------------------------------
  // cancelListening — immediately kill session, go to idle
  // -----------------------------------------------------------------------
  const cancelListening = useCallback(() => {
    conversation.endSession('user').catch(() => {});
    setVoiceState('idle');
    setAudioLevel(0);
    setTranscript('');
  }, [conversation]);

  // -----------------------------------------------------------------------
  // speak — TTS via REST edge function (discreet mode / programmatic)
  // In normal mode, ElevenLabs SDK handles TTS. This is for text-only.
  // -----------------------------------------------------------------------
  const speak = useCallback(async (text: string) => {
    if (!isVoiceEnabled || !text) {
      setVoiceState('idle');
      return;
    }

    // DND / Phone Call — skip TTS playback if audio session is interrupted
    if (audioSessionService.isInterrupted) {
      console.log('[Voice] Audio session interrupted — skipping TTS');
      return;
    }

    // If ElevenLabs session is active, send as contextual update instead
    if (conversation.status === 'connected') {
      conversation.sendContextualUpdate(text);
      return;
    }

    // REST TTS fallback (discreet mode or no active session)
    if (isPlayingAudioRef.current || soundRef.current) {
      await stopPlayback();
    }
    isPlayingAudioRef.current = true;
    setVoiceState('speaking');

    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      });

      // For REST TTS, resolve 'agent-default' to the actual fallback voice ID
      const ttsVoiceId = selectedVoice === DEFAULT_ELEVENLABS_VOICE_ID
        ? FALLBACK_TTS_VOICE_ID
        : selectedVoice;

      const { data, error: ttsError } = await invokeWithAuth('text-to-speech', {
        body: {
          text,
          voice: ttsVoiceId,
          speed: voiceSpeed,
          voice_settings: getAdaptiveVoiceSettings({
            celebrationBoost: celebrationBoostRef.current,
          }),
        },
      });
      // Clear celebration boost after it's been used
      celebrationBoostRef.current = false;

      if (ttsError || !(data as any)?.audio) {
        console.warn('[TTS] Edge function error, using device speech');
        const Speech = await import('expo-speech');
        await new Promise<void>((resolve) => {
          Speech.speak(text, {
            rate: voiceSpeed,
            language: LANGUAGE_TO_LOCALE[preferredLanguage] || preferredLanguage,
            onDone: resolve,
            onError: () => resolve(),
          });
        });
        setVoiceState('idle');
        isPlayingAudioRef.current = false;
        return;
      }

      const audioBase64 = (data as any).audio;
      const tempPath = (FileSystem.cacheDirectory || '') + 'tts_audio_' + Date.now() + '.mp3';
      await FileSystem.writeAsStringAsync(tempPath, audioBase64, {
        encoding: FileSystem.EncodingType?.Base64 ?? 'base64',
      });
      const uri = tempPath.startsWith('file://') ? tempPath : 'file://' + tempPath;

      const player = createAudioPlayer({ uri });
      soundRef.current = player;

      await new Promise<void>((resolve) => {
        let resolved = false;
        const done = () => { if (!resolved) { resolved = true; resolve(); } };
        const subscription = player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) {
            subscription.remove();
            done();
          }
        });
        // Wait for the player to load, then play
        const checkLoaded = setInterval(() => {
          if (player.isLoaded) {
            clearInterval(checkLoaded);
            player.play();
          }
        }, 50);
        setTimeout(() => { clearInterval(checkLoaded); done(); }, 30000);
      });

      await stopPlayback();
      try { await FileSystem.deleteAsync(tempPath, { idempotent: true }); } catch { /* noop */ }
    } catch (err) {
      console.error('[TTS] Error:', err);
      try {
        const Speech = await import('expo-speech');
        await new Promise<void>((resolve) => {
          Speech.speak(text, {
            rate: voiceSpeed,
            language: LANGUAGE_TO_LOCALE[preferredLanguage] || preferredLanguage,
            onDone: resolve,
            onError: () => resolve(),
          });
        });
      } catch { /* give up */ }
    }

    isPlayingAudioRef.current = false;
    if (voiceStateRef.current === 'speaking') {
      setVoiceState('idle');
    }
  }, [isVoiceEnabled, selectedVoice, voiceSpeed, preferredLanguage, conversation]);

  // -----------------------------------------------------------------------
  // stopSpeaking — end session or stop REST TTS
  // -----------------------------------------------------------------------
  const stopSpeaking = useCallback(() => {
    if (conversation.status === 'connected') {
      conversation.endSession('user').catch(() => {});
    }
    stopPlayback();
    isPlayingAudioRef.current = false;
    setVoiceState('idle');
  }, [conversation]);

  // -----------------------------------------------------------------------
  // bargeIn — ElevenLabs handles barge-in natively via VAD.
  // This exists for API compat; it starts a session if none active.
  // -----------------------------------------------------------------------
  const bargeIn = useCallback(async () => {
    console.log('[Voice] Barge-in — ElevenLabs handles natively');
    eventLogger.log('voice_command', { action: 'barge_in' });

    // Stop any active TTS playback first (e.g. briefing) and release audio session
    await stopPlayback();
    isPlayingAudioRef.current = false;

    if (conversation.status !== 'connected') {
      await startListening();
    }
  }, [conversation, startListening]);

  // -----------------------------------------------------------------------
  // endConversation — explicitly end the ElevenLabs session
  // -----------------------------------------------------------------------
  const endConversation = useCallback(() => {
    console.log('[Voice] Ending conversation');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    conversation.endSession('user').catch(() => {});
    stopPlayback();
    isPlayingAudioRef.current = false;
    setVoiceState('idle');
    setAudioLevel(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    audioSessionService.setInterrupted(false);
  }, [conversation]);

  // -----------------------------------------------------------------------
  // submitText — text-only path for discreet mode / offline fallback
  // -----------------------------------------------------------------------
  const submitText = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setTranscript(text);
    setVoiceState('processing');
    setError(null);
    listenStartTimeRef.current = Date.now();

    try {
      const edgeFnPromise = invokeWithAuth('voice-command', {
        body: {
          transcript: text.trim(),
          context: { screen: 'ai_home', mode: 'text' },
          noise_isolation: isNoiseIsolationEnabled,
        },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Voice processing timed out.')), 30000),
      );

      const { data, error: fnError } = await Promise.race([edgeFnPromise, timeoutPromise]);

      // Handle rate limit (429) responses
      if (fnError) {
        if (fnError instanceof FunctionsHttpError) {
          try {
            const errBody = await fnError.context.json();
            if (errBody?.code === 'VOICE_LIMIT') {
              setVoiceLimitInfo({ count: errBody.daily_count || 10, limit: errBody.limit || 10 });
              setShowVoiceLimitUpsell(true);
              setVoiceState('idle');
              return;
            }
            if (errBody?.code === 'RATE_LIMIT') {
              setError('Too many requests. Please wait a moment.');
              setVoiceState('error');
              setTimeout(() => {
                if (voiceStateRef.current === 'error') {
                  setVoiceState('idle');
                  setError(null);
                }
              }, 3000);
              return;
            }
          } catch { /* body not JSON, fall through */ }
        }
        throw fnError;
      }

      const vcResponse = data as VoiceCommandResponse;
      const responseText = vcResponse?.response_text || '';
      const action = vcResponse?.action;

      setAiResponse(responseText);

      eventLogger.logVoiceCommand(text, action?.action || 'unknown', true, {
        confidence: action?.confidence,
        latency_ms: Date.now() - listenStartTimeRef.current,
        ai_model_used: vcResponse?.model_used,
        tokens_used: vcResponse?.tokens_used,
      });

      // Execute action if mutation
      if (
        action &&
        action.action !== 'unknown' &&
        !['query_tasks', 'query_schedule', 'query_stats', 'query_circles'].includes(action.action)
      ) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const result = await executeAction(action, user.id, responseText);
          const spokenText = result.success ? (responseText || result.message) : result.message;
          setAiResponse(spokenText);

          if (!isDiscreetMode && spokenText) {
            await speak(spokenText);
            return;
          }
        }
      }

      if (!isDiscreetMode && responseText) {
        await speak(responseText);
      } else {
        setVoiceState('idle');
      }
    } catch (err) {
      console.error('[Voice] Text submit error:', err);
      setError('Failed to process request. Please try again.');
      setVoiceState('error');
      setTimeout(() => {
        if (voiceStateRef.current === 'error') {
          setVoiceState('idle');
          setError(null);
        }
      }, 5000);
    }
  }, [isDiscreetMode, isNoiseIsolationEnabled, speak]);

  // -----------------------------------------------------------------------
  // Wake word toggle + sensitivity (persist to AsyncStorage)
  // -----------------------------------------------------------------------
  const handleSetWakeWordEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      // Request microphone permission before enabling wake word
      const { status } = await requestRecordingPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Microphone Required',
          'MYPA needs microphone access to listen for the wake word. Please grant permission in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return; // Don't enable without permission
      }
    }

    setIsWakeWordEnabled(enabled);
    eventLogger.log('feature_used', {
      feature: 'wake_word',
      action: 'wake_word_toggled',
      success: true,
      enabled,
    });
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('mypa_wake_word_enabled', enabled ? '1' : '0');
    } catch { /* noop */ }
  }, []);

  const handleSetWakeWordSensitivity = useCallback(async (sensitivity: number) => {
    const clamped = Math.max(0, Math.min(1, sensitivity));
    setWakeWordSensitivityState(clamped);
    await wakeWordService.setSensitivity(clamped);
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('mypa_wake_word_sensitivity', String(clamped));
    } catch { /* noop */ }
  }, []);

  // -----------------------------------------------------------------------
  // Discreet mode toggle + persist
  // -----------------------------------------------------------------------
  const handleSetDiscreetMode = useCallback(async (enabled: boolean) => {
    setIsDiscreetMode(enabled);
    eventLogger.log('feature_used', {
      feature: 'discreet_mode',
      action: 'discreet_mode_toggled',
      success: true,
      enabled,
    });
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('mypa_discreet_mode', enabled ? '1' : '0');
    } catch { /* noop */ }
  }, []);

  // -----------------------------------------------------------------------
  // Noise isolation toggle + persist
  // -----------------------------------------------------------------------
  const handleSetNoiseIsolationEnabled = useCallback(async (enabled: boolean) => {
    setIsNoiseIsolationEnabled(enabled);
    eventLogger.log('feature_used', {
      feature: 'noise_isolation',
      action: 'noise_isolation_toggled',
      success: true,
      enabled,
    });
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('mypa_noise_isolation', enabled ? '1' : '0');
    } catch { /* noop */ }
  }, []);

  // -----------------------------------------------------------------------
  // Live captions toggle + persist (Step 21f)
  // -----------------------------------------------------------------------
  const handleSetLiveCaptionsEnabled = useCallback(async (enabled: boolean) => {
    setIsLiveCaptionsEnabled(enabled);
    eventLogger.log('feature_used', {
      feature: 'live_captions',
      action: 'live_captions_toggled',
      success: true,
      enabled,
    });
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('mypa_live_captions', enabled ? '1' : '0');
    } catch { /* noop */ }
  }, []);

  // -----------------------------------------------------------------------
  // Preferred language toggle + persist (Step 5)
  // -----------------------------------------------------------------------
  const handleSetPreferredLanguage = useCallback(async (lang: string) => {
    setPreferredLanguage(lang);
    eventLogger.log('feature_used', {
      feature: 'language',
      action: 'language_changed',
      success: true,
      language: lang,
    });
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('mypa_preferred_language', lang);
    } catch { /* noop */ }
  }, []);

  // -----------------------------------------------------------------------
  // retryConnection — manually re-check and flush queue (Step 20)
  // -----------------------------------------------------------------------
  const retryConnection = useCallback(async () => {
    console.log('[Voice] Manual retry connection');
    const quality = await OfflineQueueService.checkConnectionQuality();
    setConnectionQuality(quality);

    if (quality === 'offline') {
      setError('Still offline. Please check your connection.');
      return;
    }

    // Clear any offline error
    if (voiceState === 'offline') {
      setVoiceState('idle');
      setError(null);
    }

    // Flush queued actions
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const result = await OfflineQueueService.flush(user.id);
        setQueuedActionCount(result.remaining);
        if (result.succeeded > 0) {
          console.log(`[Voice] Retry flushed ${result.succeeded} queued actions`);
        }
      }
    } catch (err) {
      console.warn('[Voice] Retry flush failed:', err);
    }
  }, [voiceState]);

  // -----------------------------------------------------------------------
  // Scribe v2 Realtime STT (Step 21)
  // -----------------------------------------------------------------------

  /**
   * Start a Scribe transcription session.
   * Uses VoiceProcessor for audio capture → WebSocket → Scribe v2 Realtime.
   * Wake word is paused while Scribe is active (mic can't be shared).
   */
  const startScribe = useCallback(async (options?: {
    commitStrategy?: ScribeCommitStrategy;
    languageCode?: string;
    /** Previous text context (≤50 chars) for improved accuracy */
    previousText?: string;
  }) => {
    // Mic permission self-check (guard for programmatic Scribe triggers)
    const { status: micStatus } = await getRecordingPermissionsAsync();
    if (micStatus !== 'granted') {
      const { status: newMicStatus } = await requestRecordingPermissionsAsync();
      if (newMicStatus !== 'granted') {
        setError('Microphone permission is required for transcription.');
        return;
      }
    }

    if (scribeService.isConnected) {
      console.log('[Voice] Scribe already active');
      return;
    }

    // Can't run Scribe while ConvAI session is active (mic conflict)
    if (conversation.status === 'connected') {
      console.warn('[Voice] Cannot start Scribe while ConvAI session is active');
      return;
    }

    setScribePartialTranscript('');
    setScribeFullTranscript('');

    // Use the last AI response as previous_text context for accuracy (21e)
    const prevText = options?.previousText || aiResponse?.slice(-50) || undefined;

    try {
      await scribeService.connect({
        commitStrategy: options?.commitStrategy || 'vad',
        languageCode: options?.languageCode || preferredLanguage,
        includeTimestamps: false,
        vadSilenceThreshold: 1.5,
        vadThreshold: 0.4,
        minSpeechDurationMs: 100,
        minSilenceDurationMs: 100,
        previousText: prevText,
        onPartialTranscript: (text) => {
          setScribePartialTranscript(text);
        },
        onCommittedTranscript: (text) => {
          // Subtle pulse on each committed speech segment
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setScribeFullTranscript(scribeService.fullTranscript);
          setScribePartialTranscript('');

          // In discreet mode (non-brain-dump), auto-submit committed segments
          if (isDiscreetMode && !isBrainDumpScribeRef.current && text.trim()) {
            submitText(text.trim());
            // Stop Scribe after submitting in discreet mode
            scribeService.disconnect().catch(() => {});
          }
        },
        onSessionStarted: (sessionId) => {
          console.log(`[Voice] Scribe session started: ${sessionId}`);
          eventLogger.log('feature_used', {
            feature: 'scribe',
            action: 'scribe_started',
            success: true,
            mode: isBrainDumpScribeRef.current ? 'brain_dump' : 'discreet',
          });
        },
        onError: (err) => {
          console.error(`[Voice] Scribe error (${err.type}):`, err.message);
          setError(`Transcription error: ${err.message}`);
          setScribeState('error');
          setTimeout(() => {
            if (scribeService.state !== 'connected') {
              setScribeState('idle');
              setError(null);
            }
          }, 5000);
        },
        onStateChange: (state) => {
          setScribeState(state);
        },
      });
    } catch (err) {
      console.error('[Voice] Failed to start Scribe:', err);
      setError(err instanceof Error ? err.message : 'Failed to start transcription');
    }
  }, [conversation, isDiscreetMode, submitText]);

  /** Stop Scribe transcription session */
  const stopScribe = useCallback(async () => {
    isBrainDumpScribeRef.current = false;
    await scribeService.disconnect();
    setScribeState('idle');
  }, []);

  /** Manually commit current speech segment (manual mode only) */
  const commitScribe = useCallback(() => {
    scribeService.commit();
  }, []);

  /**
   * Start brain dump via Scribe — dictate freely in VAD mode,
   * committed segments accumulate. Call finishBrainDumpScribe() when done.
   */
  const startBrainDumpScribe = useCallback(async () => {
    isBrainDumpScribeRef.current = true;
    await startScribe({ commitStrategy: 'vad' });
  }, [startScribe]);

  /**
   * Finish brain dump — stop Scribe and return the full accumulated transcript.
   * The caller can then save this as a brain dump entry.
   */
  const finishBrainDumpScribe = useCallback(async (): Promise<string> => {
    const fullText = scribeService.fullTranscript;
    isBrainDumpScribeRef.current = false;
    await scribeService.disconnect();
    setScribeState('idle');
    return fullText;
  }, []);

  // -- Scribe: pause wake word while Scribe is active (mic can't be shared)
  useEffect(() => {
    if (!isWakeWordEnabled) return;

    if (scribeState === 'connected') {
      wakeWordService.pause().catch(() => {});
    } else if (scribeState === 'idle') {
      // Only resume if ConvAI session isn't also active
      if (!isConversationActive) {
        wakeWordService.resume().catch(() => {});
      }
    }
  }, [scribeState, isWakeWordEnabled, isConversationActive]);

  // -----------------------------------------------------------------------
  // Dynamic contextual awareness — screen changes (Step 14a)
  // -----------------------------------------------------------------------
  const currentScreenRef = useRef<Screen>('ai_hub');

  const updateScreenContext = useCallback((screen: Screen, data?: ScreenContextData) => {
    currentScreenRef.current = screen;

    // Only send context update if a voice session is active
    if (conversation.status !== 'connected') return;

    try {
      const contextString = buildScreenContext(screen, data);
      conversation.sendContextualUpdate(contextString);
      console.log(`[Voice] Screen context → ${screen}`);
    } catch (err) {
      // Non-fatal — agent works fine without screen context
      console.warn('[Voice] Failed to send screen context:', err);
    }
  }, [conversation]);

  // -----------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------
  const value: VoiceContextType = {
    voiceState,
    isVoiceEnabled,
    audioLevel,
    transcript,
    aiResponse,
    error,
    isConversationActive,

    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
    bargeIn,
    endConversation,

    setVoiceEnabled,
    voiceSpeed,
    setVoiceSpeed,
    selectedVoice,
    setSelectedVoice,

    preferredLanguage,
    setPreferredLanguage: handleSetPreferredLanguage,

    isDiscreetMode,
    setDiscreetMode: handleSetDiscreetMode,
    submitText,

    isWakeWordEnabled,
    setWakeWordEnabled: handleSetWakeWordEnabled,
    wakeWordSensitivity,
    setWakeWordSensitivity: handleSetWakeWordSensitivity,

    isNoiseIsolationEnabled,
    setNoiseIsolationEnabled: handleSetNoiseIsolationEnabled,

    isOffline: connectionQuality === 'offline',
    connectionQuality,
    queuedActionCount,
    retryConnection,

    updateScreenContext,

    requestedNavigation,
    clearNavigationRequest,

    isLiveCaptionsEnabled,
    setLiveCaptionsEnabled: handleSetLiveCaptionsEnabled,

    scribeState,
    scribePartialTranscript,
    scribeFullTranscript,
    startScribe,
    stopScribe,
    commitScribe,
    startBrainDumpScribe,
    finishBrainDumpScribe,

    showVoiceLimitUpsell,
    dismissVoiceLimitUpsell,
    voiceLimitInfo,
  };

  return (
    <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}

export default VoiceContext;
