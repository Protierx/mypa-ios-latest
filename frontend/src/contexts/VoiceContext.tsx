/**
 * Voice Context Provider
 * 
 * Provides voice state and controls throughout the app.
 * Integrates with OpenAI Whisper (STT) and TTS APIs.
 * Wired to ActionExecutor for PRD 4.7 Action System Contract.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { eventLogger } from '../services/eventLogger';
import {
  executeAction,
  type ActionJSON,
  type VoiceCommandResponse,
} from '../services/actionExecutor';
import {
  realtimeVoiceService,
  type RealtimeTranscriptEvent,
  type RealtimeFunctionCallEvent,
  type RealtimeErrorEvent,
} from '../services/voice/RealtimeVoiceService';
import { stripWavHeader } from '../services/voice/pcmUtils';
import { FEATURE_FLAGS } from '../config/featureFlags';

/**
 * Invoke an edge function with automatic 401 retry (refresh session once).
 * VoiceContext calls edge functions directly — this ensures stale JWTs
 * are refreshed instead of failing with "invalid JWT".
 */
async function invokeWithAuth<T = unknown>(
  fnName: string,
  options?: { body?: Record<string, unknown> },
): Promise<{ data: T | null; error: FunctionsHttpError | Error | null }> {
  const first = await supabase.functions.invoke(fnName, options);
  if (!first.error) return first as { data: T; error: null };

  // On 401, refresh session and retry once
  if (first.error instanceof FunctionsHttpError && first.error.context?.status === 401) {
    const { error: refreshErr } = await supabase.auth.refreshSession();
    if (!refreshErr) {
      return await supabase.functions.invoke(fnName, options) as { data: T; error: FunctionsHttpError | null };
    }
  }
  return first as { data: null; error: FunctionsHttpError | Error };
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'timeout' | 'error' | 'offline';

interface VoiceContextType {
  // State
  voiceState: VoiceState;
  isVoiceEnabled: boolean;
  audioLevel: number;
  transcript: string;
  aiResponse: string;
  error: string | null;
  awaitingConfirmation: boolean;
  pendingAction: ActionJSON | null;
  /** Whether continuous conversation mode is active (auto-listen after AI speaks) */
  isConversationActive: boolean;
  
  // Controls
  startListening: () => Promise<void>;
  stopListening: () => Promise<string>;
  cancelListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  /** PRD 4.1 barge-in: stop TTS and transition to LISTENING (not IDLE) */
  bargeIn: () => Promise<void>;
  confirmAction: () => Promise<void>;
  cancelAction: () => void;
  /** End the continuous conversation and go back to IDLE */
  endConversation: () => void;
  
  // Settings
  setVoiceEnabled: (enabled: boolean) => void;
  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;

  // Discreet Mode (PRD 4.1)
  isDiscreetMode: boolean;
  setDiscreetMode: (enabled: boolean) => void;
  /** Submit text directly (discreet mode / offline fallback) */
  submitText: (text: string) => Promise<void>;

  // Realtime API
  isOffline: boolean;
  connectionMode: 'realtime' | 'rest';
  retryConnection: () => Promise<void>;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

interface VoiceProviderProps {
  children: React.ReactNode;
}

/**
 * PCM16 recording options for OpenAI Realtime API.
 * Records WAV (LPCM) at 24kHz mono 16-bit — strip the 44-byte header to get raw PCM16.
 */
const PCM_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.wav',
    outputFormat: 3, // DEFAULT
    audioEncoder: 1, // DEFAULT
    sampleRate: 24000,
    numberOfChannels: 1,
    bitRate: 384000,
  },
  ios: {
    extension: '.wav',
    outputFormat: 'lpcm',
    audioQuality: 127, // MAX
    sampleRate: 24000,
    numberOfChannels: 1,
    bitRate: 384000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};

/** No-speech timeout — if user never speaks at all, transition to TIMEOUT */
const NO_SPEECH_TIMEOUT_MS = 8000;

/** Speech-end detection: consecutive low-metering frames needed to auto-stop (at 100ms interval) */
const SPEECH_END_FRAMES = 15; // 15 frames × 100ms = 1.5s of silence after speech
/** Metering threshold to consider as "speech" (0–1 normalized, ~-45dB) */
const SPEECH_THRESHOLD = 0.25;
/** Minimum recording duration (ms) before auto-stop is allowed */
const MIN_RECORDING_MS = 500;

/** Voice-activated barge-in: metering threshold during AI playback.
 *  Higher than SPEECH_THRESHOLD to avoid false triggers from speaker bleed into mic. */
const BARGE_IN_THRESHOLD = 0.55;
/** Consecutive frames above threshold to trigger voice barge-in (at 100ms intervals) */
const BARGE_IN_FRAMES = 3;
/** Skip initial metering frames when monitor starts (avoids audio-session switch noise) */
const BARGE_IN_SKIP_FRAMES = 5;

/** Simple connectivity check (no extra dependency needed) */
async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch('https://api.openai.com/v1/models', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

/** Yes/confirm patterns for spoken confirmation */
const YES_PATTERNS = /^(yes|yeah|yep|yup|sure|ok|okay|confirm|do it|go ahead|affirmative)/i;
const NO_PATTERNS = /^(no|nah|nope|cancel|never\s?mind|stop|don't|forget it)/i;

export function VoiceProvider({ children }: VoiceProviderProps) {
  // State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isVoiceEnabled, setVoiceEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Action System state (PRD 4.7)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionJSON | null>(null);
  const pendingResponseRef = useRef<VoiceCommandResponse | null>(null);
  
  // Settings
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState('ash');
  
  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const meteringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const listenStartTimeRef = useRef<number>(0);
  const voiceStateRef = useRef<VoiceState>('idle');
  const isPlayingAudioRef = useRef(false);
  const startListeningRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Discreet Mode (PRD 4.1 — text-only, no audio)
  const [isDiscreetMode, setIsDiscreetMode] = useState(false);
  const [discreetInput, setDiscreetInput] = useState('');

  // Error retry tracking (max 2 retries from ERROR before suggesting text)
  const errorRetryCountRef = useRef(0);
  const MAX_ERROR_RETRIES = 2;

  // Continuous conversation: after AI finishes speaking, auto-listen for next user input
  const conversationActiveRef = useRef(false);

  // Speech-end detection for continuous conversation (auto-stop recording when user stops talking)
  const speechDetectedRef = useRef(false);       // true once metering exceeds speech threshold
  const silenceAfterSpeechRef = useRef(0);        // consecutive low-metering frames after speech
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stopListeningRef = useRef<() => Promise<string>>(() => Promise.resolve(''));

  // Voice-activated barge-in: background mic monitor during AI speaking
  const bargeInMonitorRef = useRef<Audio.Recording | null>(null);
  const bargeInActiveRef = useRef(false);
  const bargeInRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Realtime API state
  const [isOffline, setIsOffline] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'realtime' | 'rest'>('rest');
  const realtimeActiveRef = useRef(false); // true when current interaction uses Realtime
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeTranscriptRef = useRef('');  // accumulate streaming transcript
  const realtimeResponseTextRef = useRef(''); // accumulate streaming response text

  // Keep ref in sync with state for use in event handler closures
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Request permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (err) {
        console.error('Failed to request audio permissions:', err);
      }
    };
    requestPermissions();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
      // Stop barge-in monitor if active
      if (bargeInMonitorRef.current) {
        try { bargeInMonitorRef.current.stopAndUnloadAsync(); } catch { /* noop */ }
        bargeInMonitorRef.current = null;
      }
      stopRecording();
      stopPlayback();
      realtimeVoiceService.disconnect();
    };
  }, []);

  // ── Realtime API: connection ────────────────────────────────────
  useEffect(() => {
    if (!FEATURE_FLAGS.USE_REALTIME_VOICE) {
      setConnectionMode('rest');
      return;
    }

    let cancelled = false;

    const connectRealtime = async () => {
      // Wait briefly for auth session to be established
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (cancelled) return;

      console.log('[Voice] Attempting Realtime API connection...');
      realtimeVoiceService.setVoice(selectedVoice);
      const connected = await realtimeVoiceService.connect();

      if (cancelled) return;

      if (connected) {
        console.log('[Voice] Realtime API connected ✓');
        setConnectionMode('realtime');
        eventLogger.log('voice_activated', { mode: 'realtime' });
      } else {
        console.log('[Voice] Realtime API unavailable, using REST fallback');
        setConnectionMode('rest');
        eventLogger.log('voice_activated', { mode: 'rest', reason: 'realtime_connect_failed' });
      }
    };

    connectRealtime();

    return () => {
      cancelled = true;
    };
  }, [selectedVoice]);

  // ── Realtime API: event handlers ────────────────────────────────
  useEffect(() => {
    if (!FEATURE_FLAGS.USE_REALTIME_VOICE) return;

    const handleTranscript = (evt: RealtimeTranscriptEvent) => {
      if (evt.isFinal) {
        realtimeTranscriptRef.current = evt.text;
        setTranscript(evt.text);
      } else {
        realtimeTranscriptRef.current += evt.text;
        setTranscript(realtimeTranscriptRef.current);
      }
    };

    const handleAudioDone = async () => {
      // All audio chunks received — play them
      const wavBase64 = realtimeVoiceService.getAccumulatedAudioAsWav();
      if (!wavBase64) {
        // Only go idle if we're not already speaking (briefing may be playing)
        if (voiceStateRef.current === 'processing') {
          setVoiceState('idle');
        }
        return;
      }

      // Prevent overlapping audio — stop any existing playback first
      if (isPlayingAudioRef.current) {
        await stopPlayback();
      }
      isPlayingAudioRef.current = true;
      setVoiceState('speaking');

      try {
        // Use PlayAndRecord mode so barge-in monitor can record while audio plays
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // Start background mic monitor for voice-activated barge-in
        startBargeInMonitor().catch(e => console.warn('[Voice] Barge-in monitor start failed:', e));

        const tempPath = (FileSystem.cacheDirectory || '') + 'rt_audio_' + Date.now() + '.wav';
        await FileSystem.writeAsStringAsync(tempPath, wavBase64, {
          encoding: FileSystem.EncodingType?.Base64 ?? 'base64',
        });

        const uri = tempPath.startsWith('file://') ? tempPath : 'file://' + tempPath;
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
        );

        soundRef.current = sound;

        await new Promise<void>((resolve) => {
          let resolved = false;
          const done = () => { if (!resolved) { resolved = true; resolve(); } };
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && (status as any).didJustFinish) {
              done();
            }
          });
          setTimeout(done, 30000);
        });

        await stopBargeInMonitor();
        await stopPlayback();
        try { await FileSystem.deleteAsync(tempPath, { idempotent: true }); } catch { /* noop */ }
      } catch (err) {
        console.error('[Voice] Realtime audio playback error:', err);
        await stopBargeInMonitor();
      }

      isPlayingAudioRef.current = false;
      // Continuous conversation: auto-listen after AI finishes speaking
      if (voiceStateRef.current === 'speaking') {
        if (conversationActiveRef.current) {
          console.log('[Voice] Continuous convo — auto-listening after Realtime playback');
          // Brief delay so user hears the end of playback before mic activates
          setTimeout(() => {
            if (conversationActiveRef.current && voiceStateRef.current !== 'idle') {
              startListeningRef.current().catch((err) => {
                console.error('[Voice] Auto-listen after playback failed:', err);
                setVoiceState('idle');
              });
            }
          }, 400);
        } else {
          setVoiceState('idle');
        }
      }
    };

    const handleFunctionCall = async (evt: RealtimeFunctionCallEvent) => {
      setVoiceState('processing');

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const args = JSON.parse(evt.arguments);
        const action: ActionJSON = {
          action: evt.name,
          params: args,
          confirmation_required: evt.name === 'delete_task',
          confidence: 1.0, // Realtime API does not expose confidence; assume high
        };

        const result = await executeAction(action, user.id);

        // Log the function call
        eventLogger.logVoiceCommand(
          realtimeTranscriptRef.current,
          evt.name,
          result.success,
          {
            confidence: 1.0,
            latency_ms: Date.now() - listenStartTimeRef.current,
            ai_model_used: 'gpt-4o-realtime-preview',
          },
        );

        setAiResponse(result.message);

        // Send result back so the AI can generate a spoken response
        realtimeVoiceService.sendFunctionCallResult(
          evt.callId,
          JSON.stringify({ success: result.success, message: result.message }),
        );
      } catch (err) {
        console.error('[Voice] Function call execution error:', err);
        realtimeVoiceService.sendFunctionCallResult(
          evt.callId,
          JSON.stringify({ success: false, message: 'Something went wrong' }),
        );
      }
    };

    const handleSpeechStarted = () => {
      // Barge-in: user started speaking during AI response
      if (voiceStateRef.current === 'speaking') {
        console.log('[Voice] Barge-in detected via VAD');
        realtimeVoiceService.cancelResponse();
        stopPlayback();
        isPlayingAudioRef.current = false;
        realtimeVoiceService.clearAudioChunks();
        setVoiceState('listening');
        realtimeTranscriptRef.current = '';
        realtimeResponseTextRef.current = '';
      }
      // Clear silence timer — speech detected
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    const handleResponseDone = (_response: any) => {
      // Response generation complete. Audio may still be playing via handleAudioDone.
      // Only transition if we're stuck in processing (no audio was generated).
      const currentState = voiceStateRef.current;
      if (realtimeResponseTextRef.current && currentState === 'processing' && !isPlayingAudioRef.current) {
        setAiResponse(realtimeResponseTextRef.current);
        setVoiceState('idle');
      }
      realtimeResponseTextRef.current = '';
    };

    const handleResponseText = (evt: { text: string; isFinal: boolean }) => {
      if (evt.isFinal) {
        realtimeResponseTextRef.current = evt.text;
        setAiResponse(evt.text);
      } else {
        realtimeResponseTextRef.current += evt.text;
      }
    };

    const handleConnected = () => {
      setConnectionMode('realtime');
    };

    const handleDisconnected = () => {
      if (realtimeVoiceService.failedPermanently) {
        console.log('[Voice] Realtime permanently failed, switching to REST');
        setConnectionMode('rest');
        eventLogger.log('voice_error', { errorType: 'realtime_fallback_to_rest' });
      }
    };

    const handleError = (evt: RealtimeErrorEvent) => {
      console.error('[Voice] Realtime error:', evt.code, evt.message);
      eventLogger.log('voice_error', {
        errorType: `realtime_${evt.code}`,
        action: evt.message,
      });
      if (evt.code === 'MAX_RECONNECTS') {
        setConnectionMode('rest');
      }
    };

    // When server VAD doesn't detect speech (silence-only audio), no response
    // is generated. Recover by returning to listening (continuous) or idle.
    const handleNoResponse = () => {
      console.log('[Voice] No VAD response — recovering');
      if (voiceStateRef.current === 'processing') {
        if (conversationActiveRef.current) {
          // Continuous conversation — try listening again
          startListeningRef.current().catch((err) => {
            console.error('[Voice] Auto-retry after no-response failed:', err);
            setVoiceState('idle');
          });
        } else {
          setVoiceState('idle');
        }
      }
    };

    // Wire up event listeners
    realtimeVoiceService.on('transcript', handleTranscript);
    realtimeVoiceService.on('audio_done', handleAudioDone);
    realtimeVoiceService.on('function_call', handleFunctionCall);
    realtimeVoiceService.on('speech_started', handleSpeechStarted);
    realtimeVoiceService.on('response_done', handleResponseDone);
    realtimeVoiceService.on('response_text', handleResponseText);
    realtimeVoiceService.on('connected', handleConnected);
    realtimeVoiceService.on('disconnected', handleDisconnected);
    realtimeVoiceService.on('error', handleError);
    realtimeVoiceService.on('no_response', handleNoResponse);

    return () => {
      realtimeVoiceService.off('transcript', handleTranscript);
      realtimeVoiceService.off('audio_done', handleAudioDone);
      realtimeVoiceService.off('function_call', handleFunctionCall);
      realtimeVoiceService.off('speech_started', handleSpeechStarted);
      realtimeVoiceService.off('response_done', handleResponseDone);
      realtimeVoiceService.off('response_text', handleResponseText);
      realtimeVoiceService.off('connected', handleConnected);
      realtimeVoiceService.off('disconnected', handleDisconnected);
      realtimeVoiceService.off('error', handleError);
      realtimeVoiceService.off('no_response', handleNoResponse);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Mount once — handlers use voiceStateRef for current state

  const stopRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        // Ignore
      }
      recordingRef.current = null;
    }
  };

  const stopPlayback = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        // Ignore
      }
      soundRef.current = null;
    }
  };

  /**
   * Start a background mic monitor to detect user speech for voice-activated barge-in.
   * Must be called while audio session is in PlayAndRecord mode (allowsRecordingIOS: true).
   * The monitor recording is discarded — only metering data is used.
   */
  const startBargeInMonitor = async () => {
    // Don't start if already monitoring, discreet mode, or no conversation
    if (bargeInMonitorRef.current || isDiscreetMode) return;
    bargeInActiveRef.current = false;

    try {
      let consecutiveFrames = 0;
      let framesSkipped = 0;

      const { recording } = await Audio.Recording.createAsync(
        {
          isMeteringEnabled: true,
          android: { extension: '.wav', outputFormat: 3, audioEncoder: 1, sampleRate: 16000, numberOfChannels: 1, bitRate: 64000 },
          ios: { extension: '.wav', outputFormat: 'lpcm', audioQuality: 0, sampleRate: 16000, numberOfChannels: 1, bitRate: 64000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
          web: {},
        },
        (status) => {
          if (!status.isRecording || status.metering === undefined) return;

          // Skip initial frames — audio session switch can produce noise spikes
          if (framesSkipped < BARGE_IN_SKIP_FRAMES) { framesSkipped++; return; }

          const level = Math.max(0, Math.min(1, (status.metering + 60) / 60));

          if (level >= BARGE_IN_THRESHOLD) {
            consecutiveFrames++;
            if (
              consecutiveFrames >= BARGE_IN_FRAMES &&
              !bargeInActiveRef.current &&
              voiceStateRef.current === 'speaking'
            ) {
              bargeInActiveRef.current = true;
              console.log('[Voice] Voice-activated barge-in detected — interrupting AI');
              eventLogger.log('voice_command', { action: 'voice_barge_in' });
              bargeInRef.current().catch(err => {
                console.error('[Voice] Voice barge-in failed:', err);
                bargeInActiveRef.current = false;
              });
            }
          } else {
            consecutiveFrames = 0;
          }
        },
        100, // 100ms metering interval
      );

      bargeInMonitorRef.current = recording;
      console.log('[Voice] Barge-in monitor started');
    } catch (err) {
      console.warn('[Voice] Failed to start barge-in monitor:', err);
    }
  };

  /** Stop the background barge-in mic monitor */
  const stopBargeInMonitor = async () => {
    if (bargeInMonitorRef.current) {
      try {
        await bargeInMonitorRef.current.stopAndUnloadAsync();
      } catch { /* ignore */ }
      bargeInMonitorRef.current = null;
    }
    bargeInActiveRef.current = false;
  };

  const startListening = useCallback(async () => {
    if (!isVoiceEnabled) return;

    // Discreet mode: skip audio, prompt text input instead
    if (isDiscreetMode) {
      setVoiceState('listening');
      setTranscript('');
      setError(null);
      conversationActiveRef.current = false; // discreet mode uses text, not continuous voice
      eventLogger.log('voice_activated', { mode: 'discreet' });
      return;
    }
    
    setError(null);
    setTranscript('');
    realtimeTranscriptRef.current = '';
    realtimeResponseTextRef.current = '';
    
    // ── Offline detection (PRD 4.1 — OFFLINE state) ──────────────
    const isOnline = await checkNetworkConnectivity();
    if (!isOnline) {
      setIsOffline(true);
      conversationActiveRef.current = false;
      setVoiceState('offline');
      setError('No network connection. Type your request instead.');
      eventLogger.log('voice_error', {
        errorType: 'offline',
        screen_context: 'ai_home',
      });
      return;
    }
    setIsOffline(false);

    // ── Max retry guard (PRD Step 8 — 2 retries then suggest text) ────
    if (errorRetryCountRef.current >= MAX_ERROR_RETRIES) {
      conversationActiveRef.current = false;
      setVoiceState('error');
      setError('Voice is having trouble. Try typing your request instead.');
      eventLogger.log('voice_error', {
        errorType: 'max_retries_exceeded',
        screen_context: 'ai_home',
      });
      return;
    }
    
    // Track latency from listen start (PRD 4.8)
    listenStartTimeRef.current = Date.now();
    
    // Determine which path to use for this interaction
    const useRealtime = connectionMode === 'realtime' && realtimeVoiceService.isConnected;
    realtimeActiveRef.current = useRealtime;
    
    try {
      // Check/request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission required');
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Stop barge-in monitor + any existing recording before starting new one
      await stopBargeInMonitor();
      await stopRecording();
      await stopPlayback();
      
      // If Realtime is active, clear any pending audio
      if (useRealtime) {
        realtimeVoiceService.clearAudioChunks();
      }
      
      // Configure audio mode for recording.
      // On iOS, switching from playback → recording can fail if the audio
      // session hasn't fully released. Retry with increasing delays.
      const enableRecordingMode = async (attempt = 1): Promise<void> => {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
          });
        } catch (modeErr) {
          if (attempt < 3) {
            console.log(`[Voice] Audio mode switch attempt ${attempt} failed, retrying...`);
            await new Promise(r => setTimeout(r, 200 * attempt));
            return enableRecordingMode(attempt + 1);
          }
          throw modeErr;
        }
      };
      await enableRecordingMode();

      // Choose recording options based on active path
      const recordingOptions = useRealtime
        ? PCM_RECORDING_OPTIONS
        : Audio.RecordingOptionsPresets.HIGH_QUALITY;

      // Reset speech detection state for this recording session
      speechDetectedRef.current = false;
      silenceAfterSpeechRef.current = 0;
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }

      const recordingStartTime = Date.now();

      // Metering callback — handles audio level + speech-end detection
      const onRecordingStatus = (status: Audio.RecordingStatus) => {
        if (status.isRecording && status.metering !== undefined) {
          const normalizedLevel = Math.max(0, Math.min(1, (status.metering + 60) / 60));
          setAudioLevel(normalizedLevel);

          // ── Speech-end detection for continuous conversation ──────
          if (conversationActiveRef.current && voiceStateRef.current === 'listening') {
            if (normalizedLevel >= SPEECH_THRESHOLD) {
              speechDetectedRef.current = true;
              silenceAfterSpeechRef.current = 0;
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
              }
            } else if (speechDetectedRef.current) {
              silenceAfterSpeechRef.current++;
              if (
                silenceAfterSpeechRef.current >= SPEECH_END_FRAMES &&
                (Date.now() - recordingStartTime) >= MIN_RECORDING_MS
              ) {
                console.log('[Voice] Speech end detected — auto-stopping');
                speechDetectedRef.current = false;
                silenceAfterSpeechRef.current = 0;
                if (!autoStopTimerRef.current) {
                  autoStopTimerRef.current = setTimeout(() => {
                    autoStopTimerRef.current = null;
                    stopListeningRef.current().catch((err) => {
                      console.error('[Voice] Auto-stop failed:', err);
                    });
                  }, 50);
                }
              }
            }
          }
        }
      };

      // Start recording — retry once if iOS audio session isn't ready
      let recording: Audio.Recording;
      try {
        const result = await Audio.Recording.createAsync(recordingOptions, onRecordingStatus, 100);
        recording = result.recording;
      } catch (recErr) {
        console.log('[Voice] Recording start failed, retrying after delay...');
        await new Promise(r => setTimeout(r, 300));
        await enableRecordingMode();
        const retryResult = await Audio.Recording.createAsync(recordingOptions, onRecordingStatus, 100);
        recording = retryResult.recording;
      }

      recordingRef.current = recording;
      setVoiceState('listening');

      // Activate continuous conversation mode
      conversationActiveRef.current = true;

      // Reset error retry count on successful listen start
      errorRetryCountRef.current = 0;
      
      // ── No-speech timeout → TIMEOUT state (PRD 4.1) ──────────────
      // Only fires if user never speaks. Cancelled by speech detection above.
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      silenceTimerRef.current = setTimeout(() => {
        if (recordingRef.current && !speechDetectedRef.current) {
          console.log('[Voice] No-speech timeout reached');
          conversationActiveRef.current = false;
          setVoiceState('timeout');
          setAiResponse("I didn't catch that. Tap to try again.");
          stopRecording();
          setAudioLevel(0);
          eventLogger.log('voice_error', {
            errorType: 'silence_timeout',
            screen_context: 'ai_home',
          });
          // Auto-recover to IDLE after 2.5s (PRD: "IDLE after 2s")
          setTimeout(() => {
            if (voiceStateRef.current === 'timeout') {
              setVoiceState('idle');
              setAiResponse('');
            }
          }, 2500);
        }
      }, NO_SPEECH_TIMEOUT_MS);

      // PRD 4.8: voice_listening_started event
      eventLogger.log('voice_activated', {
        mode: useRealtime ? 'realtime' : 'rest',
        screen_context: 'ai_home',
      });
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      conversationActiveRef.current = false;
      setError('Failed to start recording');
      setVoiceState('error');
      errorRetryCountRef.current++;
      eventLogger.log('voice_error', {
        errorType: 'recording_start_failed',
        action: err instanceof Error ? err.message : 'unknown',
        screen_context: 'ai_home',
      });
      // Auto-recover to idle after 3s
      setTimeout(() => {
        if (voiceStateRef.current === 'error') {
          setVoiceState('idle');
        }
      }, 3000);
    }
  }, [isVoiceEnabled, isDiscreetMode, connectionMode]);

  // Keep startListeningRef in sync for use in mount-once event handlers
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const stopListening = useCallback(async (): Promise<string> => {
    if (!recordingRef.current) return '';
    
    // Clear timers and reset speech detection
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    speechDetectedRef.current = false;
    silenceAfterSpeechRef.current = 0;
    
    setVoiceState('processing');
    setAudioLevel(0);
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      
      if (!uri) {
        throw new Error('No recording URI');
      }

      console.log('[Voice] Recording URI:', uri);

      // ── REALTIME PATH ──────────────────────────────────────────
      if (realtimeActiveRef.current && realtimeVoiceService.isConnected) {
        console.log('[Voice] Using Realtime API path');

        // Read the WAV file as base64 and strip the header to get raw PCM16
        const wavBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });

        // Clean up temp file
        try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch { /* noop */ }

        const pcmBase64 = stripWavHeader(wavBase64);
        if (!pcmBase64 || pcmBase64.length < 200) {
          // Not enough audio data — skip sending to avoid "buffer too small" error
          console.log('[Voice] Audio too short, skipping Realtime send. Length:', pcmBase64?.length ?? 0);
          // If in continuous conversation, go back to listening
          if (conversationActiveRef.current) {
            console.log('[Voice] Short audio — resuming listening');
            setTimeout(() => {
              if (conversationActiveRef.current) {
                startListeningRef.current().catch(() => setVoiceState('idle'));
              } else {
                setVoiceState('idle');
              }
            }, 200);
          } else {
            setVoiceState('idle');
          }
          return '';
        }

        console.log('[Voice] Sending PCM audio to Realtime API, length:', pcmBase64.length);

        // Send audio buffer and commit — response comes via event handlers
        realtimeVoiceService.sendAudioBuffer(pcmBase64);
        realtimeVoiceService.commitAudioBuffer();

        eventLogger.log('voice_command', {
          mode: 'realtime',
          latency_ms: Date.now() - listenStartTimeRef.current,
        });

        // The response will be handled by the Realtime event listeners
        // (handleTranscript, handleAudioDone, handleFunctionCall, etc.)
        // State transitions happen in those handlers.
        return ''; // Transcript arrives asynchronously
      }

      // ── REST FALLBACK PATH (original flow, unchanged) ──────────
      console.log('[Voice] Using REST fallback path');

      // Read the audio file as base64 directly (more reliable on iOS)
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      console.log('[Voice] Audio base64 length:', base64Audio.length);
      
      // Clean up the temp recording file
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }

      // ── Confirmation flow: if awaiting confirmation, treat as yes/no ──
      if (awaitingConfirmation && pendingAction) {
        // We need to transcribe the yes/no first
        const { data: confirmData, error: confirmError } = await invokeWithAuth('voice-command', {
          body: { audio: base64Audio, context: { screen: 'ai_home' } }
        });

        if (confirmError) throw confirmError;
        const confirmTranscript = ((confirmData as any)?.transcript || '').trim();
        setTranscript(confirmTranscript);

        if (YES_PATTERNS.test(confirmTranscript)) {
          // User confirmed -- execute the pending action without confirmation_required
          const confirmedAction: ActionJSON = {
            ...pendingAction,
            confirmation_required: false,
          };
          
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          const result = await executeAction(confirmedAction, user.id, pendingResponseRef.current?.response_text);

          // Log with user_override = false (they confirmed)
          eventLogger.logVoiceCommand(
            pendingResponseRef.current?.transcript || confirmTranscript,
            pendingAction.action,
            result.success,
            {
              confidence: pendingAction.confidence,
              latency_ms: Date.now() - listenStartTimeRef.current,
              ai_model_used: pendingResponseRef.current?.model_used,
              tokens_used: pendingResponseRef.current?.tokens_used,
              user_override: false,
            },
          );

          setAiResponse(result.message);
          setAwaitingConfirmation(false);
          setPendingAction(null);
          pendingResponseRef.current = null;

          if (result.message) {
            await speak(result.message);
          } else {
            setVoiceState('idle');
          }
          return confirmTranscript;

        } else if (NO_PATTERNS.test(confirmTranscript)) {
          // User cancelled
          eventLogger.logVoiceCommand(
            pendingResponseRef.current?.transcript || confirmTranscript,
            pendingAction.action,
            false,
            {
              confidence: pendingAction.confidence,
              latency_ms: Date.now() - listenStartTimeRef.current,
              ai_model_used: pendingResponseRef.current?.model_used,
              tokens_used: pendingResponseRef.current?.tokens_used,
              user_override: true,
            },
          );

          setAwaitingConfirmation(false);
          setPendingAction(null);
          pendingResponseRef.current = null;
          setAiResponse('Okay, cancelled.');
          await speak('Okay, cancelled.');
          return confirmTranscript;

        } else {
          // Didn't understand -- ask again
          setAiResponse("Sorry, I didn't catch that. Yes or no?");
          await speak("Sorry, I didn't catch that. Yes or no?");
          return confirmTranscript;
        }
      }

      // ── Normal flow: send to voice-command Edge Function ──────────
      // Add a 30-second timeout to prevent infinite "thinking" state
      const edgeFnPromise = invokeWithAuth('voice-command', {
        body: {
          audio: base64Audio,
          context: { screen: 'ai_home' }
        }
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Voice processing timed out. Please try again.')), 30000)
      );

      const { data, error: transcribeError } = await Promise.race([edgeFnPromise, timeoutPromise]);

      if (transcribeError) throw transcribeError;

      const vcResponse = data as VoiceCommandResponse;
      console.log('[Voice] Edge function response:', JSON.stringify({
        action: vcResponse?.action,
        transcript: vcResponse?.transcript,
        response_text: vcResponse?.response_text?.substring(0, 100),
        model: vcResponse?.model_used,
      }));
      const transcriptText = vcResponse?.transcript || '';
      const responseText = vcResponse?.response_text || '';
      const action = vcResponse?.action;

      setTranscript(transcriptText);

      // ── If it's a query or unknown, just speak the response ──────
      if (!action || action.action === 'unknown' || 
          ['query_tasks', 'query_schedule', 'query_stats', 'query_circles'].includes(action.action)) {
        // Log the voice command
        eventLogger.logVoiceCommand(transcriptText, action?.action || 'unknown', true, {
          confidence: action?.confidence,
          latency_ms: Date.now() - listenStartTimeRef.current,
          ai_model_used: vcResponse?.model_used,
          tokens_used: vcResponse?.tokens_used,
          user_override: false,
        });

        setAiResponse(responseText);
        if (responseText) {
          await speak(responseText);
        } else {
          setVoiceState('idle');
        }
        return transcriptText;
      }

      // ── Mutation action: pass to ActionExecutor ──────────────────
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const result = await executeAction(action, user.id, responseText);

      if (result.needsConfirmation) {
        // Store pending action and prompt for confirmation
        setAwaitingConfirmation(true);
        setPendingAction(action);
        pendingResponseRef.current = vcResponse;
        
        const prompt = result.confirmationPrompt || 'Are you sure?';
        setAiResponse(prompt);
        await speak(prompt);
        return transcriptText;
      }

      // Action executed successfully (or failed)
      eventLogger.logVoiceCommand(transcriptText, action.action, result.success, {
        confidence: action.confidence,
        latency_ms: Date.now() - listenStartTimeRef.current,
        ai_model_used: vcResponse?.model_used,
        tokens_used: vcResponse?.tokens_used,
        user_override: false,
      });

      const spokenText = result.success ? (responseText || result.message) : result.message;
      setAiResponse(spokenText);
      
      if (spokenText) {
        await speak(spokenText);
      } else {
        setVoiceState('idle');
      }
      
      return transcriptText;
      
    } catch (err) {
      console.error('[Voice] Failed to process recording:', err);

      // ── ERROR state (PRD 4.1): "I'm having trouble" → text fallback → IDLE after 5s ──
      conversationActiveRef.current = false;
      errorRetryCountRef.current++;

      eventLogger.log('voice_error', {
        errorType: err instanceof Error ? err.message : 'unknown',
        mode: realtimeActiveRef.current ? 'realtime' : 'rest',
        screen_context: 'ai_home',
        retryCount: errorRetryCountRef.current,
      });

      // If Realtime failed mid-interaction, switch to REST for next attempt
      if (realtimeActiveRef.current) {
        console.log('[Voice] Realtime processing failed, will use REST next time');
        setConnectionMode('rest');
        realtimeActiveRef.current = false;
      }

      // Surface a user-friendly error based on the failure type
      const errMsg = err instanceof Error ? err.message : '';
      let friendlyError: string;
      if (errMsg.includes('timed out')) {
        friendlyError = "I'm having trouble connecting. Please try again.";
      } else if (errMsg.includes('non-2xx') || errMsg.includes('FunctionsHttpError')) {
        friendlyError = 'Voice service is temporarily unavailable.';
      } else {
        friendlyError = "I'm having trouble right now. Please try again.";
      }

      // After MAX_ERROR_RETRIES, suggest text fallback permanently
      if (errorRetryCountRef.current >= MAX_ERROR_RETRIES) {
        friendlyError += ' Try typing your request instead.';
        eventLogger.log('voice_error', {
          errorType: 'voice_fallback_to_text',
          reason: 'max_retries_exceeded',
          screen_context: 'ai_home',
        });
      }

      setError(friendlyError);
      setAiResponse(friendlyError);
      setVoiceState('error');

      // Auto-recover to IDLE after 5s (PRD: "IDLE after 5s")
      setTimeout(() => {
        if (voiceStateRef.current === 'error') {
          setVoiceState('idle');
          setError(null);
        }
      }, 5000);
      return '';
    }
  }, [awaitingConfirmation, pendingAction, connectionMode]);

  // Keep stopListeningRef in sync for auto-stop from metering callback
  useEffect(() => {
    stopListeningRef.current = stopListening;
  }, [stopListening]);

  const cancelListening = useCallback(() => {
    conversationActiveRef.current = false;
    speechDetectedRef.current = false;
    silenceAfterSpeechRef.current = 0;
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    stopRecording();
    setVoiceState('idle');
    setAudioLevel(0);
    setTranscript('');
  }, []);

  /**
   * Programmatically confirm a pending action (e.g. from a UI button)
   */
  const confirmAction = useCallback(async () => {
    if (!pendingAction) return;

    const confirmedAction: ActionJSON = {
      ...pendingAction,
      confirmation_required: false,
    };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const result = await executeAction(confirmedAction, user.id, pendingResponseRef.current?.response_text);

    eventLogger.logVoiceCommand(
      pendingResponseRef.current?.transcript || '',
      pendingAction.action,
      result.success,
      {
        confidence: pendingAction.confidence,
        latency_ms: Date.now() - listenStartTimeRef.current,
        ai_model_used: pendingResponseRef.current?.model_used,
        tokens_used: pendingResponseRef.current?.tokens_used,
        user_override: false,
      },
    );

    setAwaitingConfirmation(false);
    setPendingAction(null);
    pendingResponseRef.current = null;
    setAiResponse(result.message);

    if (result.message) {
      await speak(result.message);
    }
  }, [pendingAction]);

  /**
   * Programmatically cancel a pending action (e.g. from a UI button)
   */
  const cancelAction = useCallback(() => {
    if (!pendingAction) return;

    eventLogger.logVoiceCommand(
      pendingResponseRef.current?.transcript || '',
      pendingAction.action,
      false,
      {
        confidence: pendingAction.confidence,
        latency_ms: Date.now() - listenStartTimeRef.current,
        ai_model_used: pendingResponseRef.current?.model_used,
        tokens_used: pendingResponseRef.current?.tokens_used,
        user_override: true,
      },
    );

    setAwaitingConfirmation(false);
    setPendingAction(null);
    pendingResponseRef.current = null;
    setAiResponse('Okay, cancelled.');
    speak('Okay, cancelled.');
  }, [pendingAction]);

  const speak = useCallback(async (text: string) => {
    if (!isVoiceEnabled || !text) {
      setVoiceState('idle');
      return;
    }

    // Stop any existing playback to prevent overlapping voices
    if (isPlayingAudioRef.current || soundRef.current) {
      await stopPlayback();
    }
    isPlayingAudioRef.current = true;
    setVoiceState('speaking');
    
    try {
      // Use PlayAndRecord mode so barge-in monitor can record while TTS plays
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Start background mic monitor for voice-activated barge-in
      startBargeInMonitor().catch(e => console.warn('[Voice] Barge-in monitor start failed:', e));

      // Call TTS Edge Function
      console.log('[TTS] Calling text-to-speech, text length:', text.length, 'voice:', selectedVoice);
      const { data, error: ttsError } = await invokeWithAuth('text-to-speech', {
        body: {
          text,
          voice: selectedVoice,
          speed: voiceSpeed,
        }
      });

      if (ttsError) {
        console.warn('[TTS] Edge Function error:', ttsError.message || ttsError);
      }

      if (ttsError || !(data as any)?.audio) {
        console.log('[TTS] Falling back to device speech');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        const Speech = await import('expo-speech');
        await new Promise<void>((resolve) => {
          Speech.speak(text, {
            rate: voiceSpeed,
            language: 'en-US',
            onDone: () => {
              console.log('[TTS] Device speech done');
              resolve();
            },
            onError: (err) => {
              console.warn('[TTS] Device speech error:', err);
              resolve();
            },
          });
        });
        setVoiceState('idle');
        return;
      }

      const ttsAudioData = (data as any)?.audio;
      const tempAudioPath = (FileSystem.cacheDirectory || '') + 'tts_audio_' + Date.now() + '.mp3';
      await FileSystem.writeAsStringAsync(tempAudioPath, ttsAudioData, {
        encoding: FileSystem.EncodingType?.Base64 ?? 'base64',
      });
      const uri = tempAudioPath.startsWith('file://') ? tempAudioPath : 'file://' + tempAudioPath;
      console.log('[TTS] Playing from file, uri length:', uri.length);

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      
      // Wait for playback to complete
      await new Promise<void>((resolve) => {
        let resolved = false;
        const done = () => { if (!resolved) { resolved = true; resolve(); } };
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && (status as any).didJustFinish) {
            console.log('[TTS] Audio playback finished');
            done();
          }
        });
        // Timeout fallback (30s max)
        setTimeout(done, 30000);
      });

      await stopBargeInMonitor();
      await stopPlayback();
      
      // Clean up temp audio file
      try {
        await FileSystem.deleteAsync(tempAudioPath, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }
      
    } catch (err) {
      console.error('[TTS] Error:', err);
      await stopBargeInMonitor();
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        const Speech = await import('expo-speech');
        await new Promise<void>((resolve) => {
          Speech.speak(text, {
            rate: voiceSpeed,
            language: 'en-US',
            onDone: resolve,
            onError: () => resolve(),
          });
        });
      } catch (fallbackErr) {
        console.error('[TTS] Fallback speech failed:', fallbackErr);
      }
    }

    isPlayingAudioRef.current = false;
    // Continuous conversation: auto-listen after TTS finishes speaking
    if (voiceStateRef.current === 'speaking') {
      if (conversationActiveRef.current && !isDiscreetMode) {
        console.log('[Voice] Continuous convo — auto-listening after TTS');
        setTimeout(() => {
          if (conversationActiveRef.current && voiceStateRef.current !== 'idle') {
            startListeningRef.current().catch((err) => {
              console.error('[Voice] Auto-listen after TTS failed:', err);
              setVoiceState('idle');
            });
          }
        }, 400);
      } else {
        setVoiceState('idle');
      }
    }
  }, [isVoiceEnabled, selectedVoice, voiceSpeed, isDiscreetMode]);

  const stopSpeaking = useCallback(() => {
    conversationActiveRef.current = false;
    stopBargeInMonitor();
    stopPlayback();
    isPlayingAudioRef.current = false;
    setVoiceState('idle');
  }, []);

  const bargeIn = useCallback(async () => {
    console.log('[Voice] Barge-in triggered');
    
    // Stop barge-in monitor first (frees the mic for actual recording)
    await stopBargeInMonitor();
    
    // Cancel Realtime API response if active
    if (realtimeVoiceService.isConnected) {
      realtimeVoiceService.cancelResponse();
      realtimeVoiceService.clearAudioChunks();
    }
    
    await stopPlayback();
    isPlayingAudioRef.current = false;
    
    eventLogger.log('voice_command', { action: 'barge_in' });
    
    try {
      await startListening();
    } catch (err) {
      console.error('[Voice] Barge-in startListening failed:', err);
      setVoiceState('idle');
      setError('Failed to start listening');
    }
  }, [startListening]);

  // Keep bargeInRef in sync for barge-in monitor metering callback
  useEffect(() => {
    bargeInRef.current = bargeIn;
  }, [bargeIn]);

  /**
   * End the continuous conversation — stop listening/speaking and go to IDLE.
   * Called when user explicitly wants to stop (e.g. tap orb during auto-listen).
   */
  const endConversation = useCallback(() => {
    console.log('[Voice] Ending continuous conversation');
    stopBargeInMonitor();
    conversationActiveRef.current = false;
    speechDetectedRef.current = false;
    silenceAfterSpeechRef.current = 0;

    // Cancel Realtime response if in progress
    if (realtimeVoiceService.isConnected) {
      realtimeVoiceService.cancelResponse();
      realtimeVoiceService.clearAudioChunks();
    }

    stopRecording();
    stopPlayback();
    isPlayingAudioRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    setVoiceState('idle');
    setAudioLevel(0);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  /**
   * Submit text directly (discreet mode or offline/error fallback).
   * Sends transcript straight to voice-command edge function, skipping audio.
   */
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

      // Log
      eventLogger.logVoiceCommand(text, action?.action || 'unknown', true, {
        confidence: action?.confidence,
        latency_ms: Date.now() - listenStartTimeRef.current,
        ai_model_used: vcResponse?.model_used,
        tokens_used: vcResponse?.tokens_used,
      });

      // Execute action if mutation
      if (action && action.action !== 'unknown' &&
          !['query_tasks', 'query_schedule', 'query_stats', 'query_circles'].includes(action.action)) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const result = await executeAction(action, user.id, responseText);
          const spokenText = result.success ? (responseText || result.message) : result.message;
          setAiResponse(spokenText);

          // In discreet mode, show text only (no TTS)
          if (!isDiscreetMode && spokenText) {
            await speak(spokenText);
            return;
          }
        }
      }

      // In discreet mode, just show response as text (no TTS)
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
  }, [isDiscreetMode]);

  /**
   * Toggle discreet mode (PRD 4.1)
   * When active: skip LISTENING/SPEAKING, use text input + text response.
   */
  const handleSetDiscreetMode = useCallback(async (enabled: boolean) => {
    setIsDiscreetMode(enabled);
    eventLogger.log('feature_used', {
      feature: 'discreet_mode',
      action: 'discreet_mode_toggled',
      success: true,
      enabled,
    });
    // Persist to AsyncStorage
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('mypa_discreet_mode', enabled ? '1' : '0');
    } catch { /* noop */ }
  }, []);

  // Load discreet mode preference on mount
  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const val = await AsyncStorage.getItem('mypa_discreet_mode');
        if (val === '1') setIsDiscreetMode(true);
      } catch { /* noop */ }
    })();
  }, []);

  /**
   * Retry Realtime connection (e.g. after offline recovery or manual retry)
   */
  const retryConnection = useCallback(async () => {
    setError(null);
    setIsOffline(false);
    errorRetryCountRef.current = 0;
    realtimeVoiceService.resetReconnectAttempts();

    if (FEATURE_FLAGS.USE_REALTIME_VOICE) {
      const connected = await realtimeVoiceService.connect();
      setConnectionMode(connected ? 'realtime' : 'rest');
    } else {
      setConnectionMode('rest');
    }

    setVoiceState('idle');
  }, []);

  const value: VoiceContextType = {
    voiceState,
    isVoiceEnabled,
    audioLevel,
    transcript,
    aiResponse,
    error,
    awaitingConfirmation,
    pendingAction,
    isConversationActive: conversationActiveRef.current,
    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
    bargeIn,
    confirmAction,
    cancelAction,
    endConversation,
    setVoiceEnabled,
    voiceSpeed,
    setVoiceSpeed,
    selectedVoice,
    setSelectedVoice,
    isDiscreetMode,
    setDiscreetMode: handleSetDiscreetMode,
    submitText,
    isOffline,
    connectionMode,
    retryConnection,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
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
