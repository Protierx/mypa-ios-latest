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

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

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
  
  // Settings
  setVoiceEnabled: (enabled: boolean) => void;
  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

interface VoiceProviderProps {
  children: React.ReactNode;
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
      stopRecording();
      stopPlayback();
    };
  }, []);

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

  const startListening = useCallback(async () => {
    if (!isVoiceEnabled) return;
    
    setError(null);
    setTranscript('');
    
    // Track latency from listen start (PRD 4.8)
    listenStartTimeRef.current = Date.now();
    
    try {
      // Check/request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission required');
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Stop any existing recording
      await stopRecording();
      await stopPlayback();
      
      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          // Update audio level from metering
          if (status.isRecording && status.metering !== undefined) {
            // Convert dB to 0-1 range (typical range is -160 to 0)
            const normalizedLevel = Math.max(0, Math.min(1, (status.metering + 60) / 60));
            setAudioLevel(normalizedLevel);
          }
        },
        100 // Update interval in ms
      );

      recordingRef.current = recording;
      setVoiceState('listening');
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording');
      setVoiceState('idle');
    }
  }, [isVoiceEnabled]);

  const stopListening = useCallback(async (): Promise<string> => {
    if (!recordingRef.current) return '';
    
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
        const confirmTranscript = (confirmData?.transcript || '').trim();
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
      eventLogger.log('voice_error', {
        errorType: err instanceof Error ? err.message : 'unknown',
      });

      // Surface a user-friendly error based on the failure type
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg.includes('timed out')) {
        setError('Voice processing timed out. Please try again.');
      } else if (errMsg.includes('non-2xx') || errMsg.includes('FunctionsHttpError')) {
        setError('Voice service is unavailable. Please check your connection.');
      } else {
        setError('Failed to process voice. Please try again.');
      }
      setVoiceState('idle');
      return '';
    }
  }, [awaitingConfirmation, pendingAction]);

  const cancelListening = useCallback(() => {
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
    
    setVoiceState('speaking');
    
    try {
      // Configure for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

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

      if (ttsError || !data?.audio) {
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

      const tempAudioPath = (FileSystem.cacheDirectory || '') + 'tts_audio_' + Date.now() + '.mp3';
      await FileSystem.writeAsStringAsync(tempAudioPath, data.audio, {
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

      await stopPlayback();
      
      // Clean up temp audio file
      try {
        await FileSystem.deleteAsync(tempAudioPath, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }
      
    } catch (err) {
      console.error('[TTS] Error:', err);
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

    setVoiceState('idle');
  }, [isVoiceEnabled, selectedVoice, voiceSpeed]);

  const stopSpeaking = useCallback(() => {
    stopPlayback();
    setVoiceState('idle');
  }, []);

  const bargeIn = useCallback(async () => {
    await stopPlayback();
    try {
      await startListening();
    } catch (err) {
      console.error('[Voice] Barge-in startListening failed:', err);
      setVoiceState('idle');
      setError('Failed to start listening');
    }
  }, [startListening]);

  const value: VoiceContextType = {
    voiceState,
    isVoiceEnabled,
    audioLevel,
    transcript,
    aiResponse,
    error,
    awaitingConfirmation,
    pendingAction,
    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
    bargeIn,
    confirmAction,
    cancelAction,
    setVoiceEnabled,
    voiceSpeed,
    setVoiceSpeed,
    selectedVoice,
    setSelectedVoice,
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
