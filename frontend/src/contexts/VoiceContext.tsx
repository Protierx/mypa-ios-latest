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
  SESSION_INACTIVITY_TIMEOUT_MS,
  type VoiceState as ElevenLabsVoiceState,
  type SessionDynamicVariables,
} from '../services/voice/ElevenLabsVoiceService';
import { useUserModel } from './UserModelContext';
import { wakeWordService } from '../services/voice/WakeWordService';
import {
  buildScreenContext,
  buildTaskContext,
  buildUserStateContext,
  type ScreenContextData,
} from '../services/voice/ScreenContextService';
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

  // Dynamic Contextual Awareness (Step 14)
  /** Send screen context update to active ElevenLabs session */
  updateScreenContext: (screen: Screen, data?: ScreenContextData) => void;
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

/** Simple connectivity check */
async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch('https://api.elevenlabs.io/v1/models', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
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

  // -- Refs for use inside closures ----------------------------------------
  const voiceStateRef = useRef<VoiceState>('idle');
  const isPlayingAudioRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const listenStartTimeRef = useRef<number>(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);

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
    onToolCall: async (toolName: string, params: Record<string, unknown>): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'Not authenticated';
      eventLogger.log('voice_command', { action: toolName, mode: 'elevenlabs' });
      return handleToolCall(toolName, params, user.id);
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
      conversationRef.current?.endSession('user').catch(() => {});
      stopPlayback();
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

    // Offline check
    const isOnline = await checkNetworkConnectivity();
    if (!isOnline) {
      setVoiceState('offline');
      setError('No network connection. Type your request instead.');
      eventLogger.log('voice_error', { errorType: 'offline' });
      return;
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

      // 2. Build dynamic variables from user model
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dynamicVars: SessionDynamicVariables = {
        user_id: user.id,
        user_name: userModelData?.userModel?.display_name || user.user_metadata?.full_name || 'there',
        time_of_day: getTimeOfDay(),
        platform: 'ios',
        greeting_context: 'voice_initiated',
        timezone: getTimezone(),
        overwhelm_score: String(userModelData?.userModel?.overwhelm_score ?? '0'),
        completion_rate: String(userModelData?.userModel?.completion_rate_7d ?? '0'),
        tone_preference: userModelData?.userModel?.tone_preference || 'friendly',
        streak_days: String(userModelData?.userModel?.streak_days ?? '0'),
        tasks_today_count: '0',
        overdue_count: '0',
        current_screen: currentScreenRef.current,
        task_summary: '',
      };

      // 3. Build session config and start
      const sessionConfig = buildSessionConfig(token, dynamicVars, selectedVoice);
      await conversation.startSession(sessionConfig);

      // 4. Inject contextual awareness (Step 14b + 14c)
      //    After the session is live, send task summary + user state
      try {
        // Task context — fetch recent tasks for contextual grounding
        const { data: taskRows } = await supabase
          .from('tasks')
          .select('title, due_date, status, priority, category')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true })
          .limit(20);

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const recentTasks = taskRows || [];
        const todayTasks = recentTasks.filter(t => t.due_date?.startsWith(todayStr));
        const overdueTasks = recentTasks.filter(t =>
          t.status !== 'completed' && t.due_date && t.due_date < todayStr
        );
        // Find most common category
        const catCounts: Record<string, number> = {};
        recentTasks.forEach(t => {
          if (t.category) catCounts[t.category] = (catCounts[t.category] || 0) + 1;
        });
        const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

        const taskCtx = buildTaskContext({
          recentTaskTitles: recentTasks.map(t => t.title),
          overdueCount: overdueTasks.length,
          todayCount: todayTasks.length,
          topCategory,
          peakHours: (userModelData?.model?.peakHours || []).map((h: number) => `${h}:00`),
        });
        conversation.sendContextualUpdate(taskCtx);

        // User state context — emotional/energy awareness (14c)
        const userStateCtx = buildUserStateContext({
          overwhelmScore: Number(userModelData?.userModel?.overwhelm_score ?? 0),
          completionRate7d: Number(userModelData?.userModel?.completion_rate_7d ?? 0.5),
          streakDays: Number(userModelData?.userModel?.streak_days ?? 0),
          tonePreference: userModelData?.userModel?.tone_preference || 'friendly',
        });
        conversation.sendContextualUpdate(userStateCtx);

        console.log('[Voice] Injected task + user-state context');
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

      const { data, error: ttsError } = await invokeWithAuth('text-to-speech', {
        body: { text, voice: selectedVoice, speed: voiceSpeed },
      });

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

    updateScreenContext,
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
