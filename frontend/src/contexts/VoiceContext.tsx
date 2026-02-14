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
import { Audio } from 'expo-av';
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
import type { Screen } from '../navigation-v2/GestureContext';

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
  connectionQuality: ConnectionQuality;
  /** Number of actions queued for offline sync */
  queuedActionCount: number;
  /** Manually retry connection after being offline */
  retryConnection: () => Promise<void>;

  // Dynamic Contextual Awareness (Step 14)
  /** Send screen context update to active ElevenLabs session */
  updateScreenContext: (screen: Screen, data?: ScreenContextData) => void;

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
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isVoiceEnabled, setVoiceEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConversationActive, setIsConversationActive] = useState(false);

  // -- Settings ------------------------------------------------------------
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_ELEVENLABS_VOICE_ID);
  const [isDiscreetMode, setIsDiscreetMode] = useState(false);

  // -- Wake Word state ----------------------------------------------------
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(false);
  const [wakeWordSensitivity, setWakeWordSensitivityState] = useState(0.5);
  const wakeWordDisabledByBatteryRef = useRef(false);

  // -- Noise Isolation state -----------------------------------------------
  const [isNoiseIsolationEnabled, setIsNoiseIsolationEnabled] = useState(false);

  // -- Live Captions state (Step 21f) --------------------------------------
  const [isLiveCaptionsEnabled, setIsLiveCaptionsEnabled] = useState(false);

  // -- Offline Resilience state (Step 20) ----------------------------------
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('excellent');
  const [queuedActionCount, setQueuedActionCount] = useState(0);
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // -- Scribe v2 state (Step 21) ------------------------------------------
  const [scribeState, setScribeState] = useState<ScribeState>('idle');
  const [scribePartialTranscript, setScribePartialTranscript] = useState('');
  const [scribeFullTranscript, setScribeFullTranscript] = useState('');
  const isBrainDumpScribeRef = useRef(false);

  // -- Refs for use inside closures ----------------------------------------
  const voiceStateRef = useRef<VoiceState>('idle');
  const isPlayingAudioRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const listenStartTimeRef = useRef<number>(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);
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
      setVoiceState(state);
      voiceStateRef.current = state;
    },
    setTranscript,
    setAiResponse,
    setError,
    setIsConversationActive,
    setAudioLevel,
    onToolCall: async (toolName: string, params: Record<string, unknown>): Promise<string> => {
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
      // Reset inactivity timer on every mode change
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        if (voiceStateRef.current === 'listening') {
          console.log('[Voice] Inactivity timeout — ending session');
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
        await Audio.requestPermissionsAsync();
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

      setConnectionQuality((prev) => {
        if (prev !== quality) {
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

    // Check immediately on mount
    checkQuality();

    // Then check every 30s
    connectionCheckIntervalRef.current = setInterval(checkQuality, 30_000);

    return () => {
      cancelled = true;
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
      } catch { /* noop */ }
    })();
  }, []);

  // -- Wake word: init/start/stop based on isWakeWordEnabled ----------------
  useEffect(() => {
    if (!isWakeWordEnabled) {
      // User disabled wake word — tear down
      wakeWordService.stop().then(() => wakeWordService.destroy()).catch(() => {});
      return;
    }

    // Initialize and start Porcupine
    let cancelled = false;
    (async () => {
      if (!wakeWordService.isInitialized) {
        await wakeWordService.initialize({
          sensitivity: wakeWordSensitivity,
          onDetected: () => {
            // Wake word heard → auto-start ElevenLabs voice session
            console.log('[WakeWord] Triggering startListening()');
            startListeningRef.current?.();
          },
          onError: (err) => {
            console.warn('[WakeWord] Error:', err.message);
          },
        });
      }
      if (!cancelled && wakeWordService.isInitialized) {
        await wakeWordService.start();
      }
    })();

    return () => {
      cancelled = true;
      wakeWordService.stop().catch(() => {});
    };
  }, [isWakeWordEnabled, wakeWordSensitivity]);

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

  // -- Wake word: auto-disable on low battery (<15%) -----------------------
  // expo-battery needs a native rebuild; use dynamic import() so the entire
  // module load is async and any native-module-missing error is safely caught.
  useEffect(() => {
    if (!isWakeWordEnabled) return;

    const LOW_BATTERY_THRESHOLD = 0.15;
    const RESUME_BATTERY_THRESHOLD = 0.20;
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      let Battery: any;
      try {
        Battery = await import('expo-battery');
        // Verify native module is actually linked
        await Battery.getBatteryLevelAsync();
      } catch {
        console.log('[WakeWord] Battery monitoring unavailable — skipping');
        return;
      }
      if (cancelled) return;

      const checkBattery = async () => {
        try {
          const level = await Battery.getBatteryLevelAsync();
          if (level >= 0 && level < LOW_BATTERY_THRESHOLD && !wakeWordDisabledByBatteryRef.current) {
            wakeWordDisabledByBatteryRef.current = true;
            await wakeWordService.stop();
            console.log(`[WakeWord] Auto-paused — battery at ${Math.round(level * 100)}%`);
          } else if (level >= RESUME_BATTERY_THRESHOLD && wakeWordDisabledByBatteryRef.current) {
            wakeWordDisabledByBatteryRef.current = false;
            if (wakeWordService.isInitialized) {
              await wakeWordService.start();
              console.log(`[WakeWord] Auto-resumed — battery at ${Math.round(level * 100)}%`);
            }
          }
        } catch { /* ignore */ }
      };

      checkBattery();

      try {
        subscription = Battery.addBatteryLevelListener(({ batteryLevel }: { batteryLevel: number }) => {
          if (batteryLevel >= 0 && batteryLevel < LOW_BATTERY_THRESHOLD && !wakeWordDisabledByBatteryRef.current) {
            wakeWordDisabledByBatteryRef.current = true;
            wakeWordService.stop().catch(() => {});
            console.log(`[WakeWord] Auto-paused — battery at ${Math.round(batteryLevel * 100)}%`);
          } else if (batteryLevel >= RESUME_BATTERY_THRESHOLD && wakeWordDisabledByBatteryRef.current) {
            wakeWordDisabledByBatteryRef.current = false;
            if (wakeWordService.isInitialized) {
              wakeWordService.start().catch(() => {});
              console.log(`[WakeWord] Auto-resumed — battery at ${Math.round(batteryLevel * 100)}%`);
            }
          }
        });
      } catch { /* listener not supported */ }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
      wakeWordDisabledByBatteryRef.current = false;
    };
  }, [isWakeWordEnabled]);

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
    };
  }, []);

  // -----------------------------------------------------------------------
  // Helper: stop audio playback (for discreet-mode TTS)
  // -----------------------------------------------------------------------
  const stopPlayback = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch { /* ignore */ }
      soundRef.current = null;
    }
  };

  // -----------------------------------------------------------------------
  // startListening — fetch token -> start ElevenLabs session
  // -----------------------------------------------------------------------
  const startListening = useCallback(async () => {
    if (!isVoiceEnabled) return;

    // Discreet mode: just set state, UI shows text input
    if (isDiscreetMode) {
      setVoiceState('listening');
      setTranscript('');
      setError(null);
      eventLogger.log('voice_activated', { mode: 'discreet' });
      return;
    }

    // Connection quality check (Step 20a)
    const quality = await OfflineQueueService.checkConnectionQuality();
    setConnectionQuality(quality);
    if (quality === 'offline') {
      setVoiceState('offline');
      setError('No network connection. Type your request instead.');
      eventLogger.log('voice_error', { errorType: 'offline' });
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

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // If already connected, the session is live — just log
      if (conversation.status === 'connected') {
        console.log('[Voice] Session already active');
        return;
      }

      // End any stale/zombie session before starting a new one
      if (conversation.status !== 'disconnected') {
        try {
          await conversation.endSession('user');
        } catch { /* ignore — might already be disconnected */ }
      }

      setVoiceState('processing'); // Show loading while connecting

      // Reset iOS audio session to allow recording — the briefing TTS
      // sets allowsRecordingIOS:false which blocks the WebRTC mic.
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
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
            language: 'en-US',
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

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;

      await new Promise<void>((resolve) => {
        let resolved = false;
        const done = () => { if (!resolved) { resolved = true; resolve(); } };
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && (status as any).didJustFinish) done();
        });
        setTimeout(done, 30000);
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
            language: 'en-US',
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
  }, [isVoiceEnabled, selectedVoice, voiceSpeed, conversation]);

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
      if (fnError) throw fnError;

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
      const { status } = await Audio.requestPermissionsAsync();
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

      // Check battery level — warn if low
      try {
        const BatteryMod = await import('expo-battery');
        const level = await BatteryMod.getBatteryLevelAsync();
        if (level >= 0 && level < 0.15) {
          Alert.alert(
            'Low Battery',
            `Battery is at ${Math.round(level * 100)}%. Wake word detection will be paused to save power and will resume when battery is above 20%.`,
            [{ text: 'OK' }],
          );
        }
      } catch { /* expo-battery not available in simulator */ }
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
        languageCode: options?.languageCode || 'en',
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
