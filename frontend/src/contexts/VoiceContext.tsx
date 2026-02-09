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
import { supabase } from '../lib/supabase';
import { eventLogger } from '../services/eventLogger';
import {
  executeAction,
  type ActionJSON,
  type VoiceCommandResponse,
} from '../services/actionExecutor';

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

      // Read the audio file
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Convert to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // ── Confirmation flow: if awaiting confirmation, treat as yes/no ──
      if (awaitingConfirmation && pendingAction) {
        // We need to transcribe the yes/no first
        const { data: confirmData, error: confirmError } = await supabase.functions.invoke('voice-command', {
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
      const { data, error: transcribeError } = await supabase.functions.invoke('voice-command', {
        body: { 
          audio: base64Audio,
          context: { screen: 'ai_home' }
        }
      });

      if (transcribeError) throw transcribeError;

      const vcResponse = data as VoiceCommandResponse;
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
      console.error('Failed to process recording:', err);
      eventLogger.log('voice_error', {
        errorType: err instanceof Error ? err.message : 'unknown',
      });
      setError('Failed to process voice');
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
      const { data, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
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
        // Fallback to expo-speech if TTS fails
        const Speech = await import('expo-speech');
        await new Promise<void>((resolve) => {
          Speech.speak(text, {
            rate: voiceSpeed,
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

      // Play base64 audio via data URI
      const audioUri = 'data:audio/mpeg;base64,' + data.audio;
      console.log('[TTS] Audio received, length:', data.audio.length, 'chars. Playing...');

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      
      // Wait for playback to complete
      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && (status as any).didJustFinish) {
            console.log('[TTS] Audio playback finished');
            resolve();
          }
        });
        // Timeout fallback
        setTimeout(() => {
          console.log('[TTS] Playback timeout reached');
          resolve();
        }, 30000);
      });

      await stopPlayback();

      
    } catch (err) {
      console.error('[TTS] Error:', err);
      // Last resort fallback to device speech
      try {
        const Speech = await import('expo-speech');
        Speech.speak(text, { rate: voiceSpeed });
      } catch {
        // Give up
      }
    }
    
    setVoiceState('idle');
  }, [isVoiceEnabled, selectedVoice, voiceSpeed]);

  const stopSpeaking = useCallback(() => {
    stopPlayback();
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
    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
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
