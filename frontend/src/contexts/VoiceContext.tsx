/**
 * Voice Context Provider
 * 
 * Provides voice state and controls throughout the app.
 * Integrates with OpenAI Whisper (STT) and TTS APIs.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { eventLogger } from '../services/eventLogger';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceContextType {
  // State
  voiceState: VoiceState;
  isVoiceEnabled: boolean;
  audioLevel: number;
  transcript: string;
  aiResponse: string;
  error: string | null;
  
  // Controls
  startListening: () => Promise<void>;
  stopListening: () => Promise<string>;
  cancelListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  
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

export function VoiceProvider({ children }: VoiceProviderProps) {
  // State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isVoiceEnabled, setVoiceEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Settings
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState('ash');
  
  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const meteringIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

      // Send to Supabase Edge Function for transcription
      const { data, error: transcribeError } = await supabase.functions.invoke('voice-command', {
        body: { 
          audio: base64Audio,
          context: {
            screen: 'ai_home',
          }
        }
      });

      if (transcribeError) throw transcribeError;

      const transcriptText = data?.transcript || '';
      const responseText = data?.message || '';
      const intent = data?.intent || 'unknown';
      
      // Log voice command event for AI learning
      eventLogger.logVoiceCommand(transcriptText, intent, true);
      
      setTranscript(transcriptText);
      setAiResponse(responseText);
      
      // Speak the response
      if (responseText && data?.shouldSpeak !== false) {
        await speak(responseText);
      } else {
        setVoiceState('idle');
      }
      
      return transcriptText;
      
    } catch (err) {
      console.error('Failed to process recording:', err);
      // Log voice error
      eventLogger.log('voice_error', {
        errorType: err instanceof Error ? err.message : 'unknown',
      });
      setError('Failed to process voice');
      setVoiceState('idle');
      return '';
    }
  }, []);

  const cancelListening = useCallback(() => {
    stopRecording();
    setVoiceState('idle');
    setAudioLevel(0);
    setTranscript('');
  }, []);

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
      const { data, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text,
          voice: selectedVoice,
          speed: voiceSpeed,
        }
      });

      if (ttsError || !data?.audio) {
        // Fallback to expo-speech if TTS fails
        const Speech = await import('expo-speech');
        await new Promise<void>((resolve) => {
          Speech.speak(text, {
            rate: voiceSpeed,
            onDone: resolve,
            onError: () => resolve(),
          });
        });
        setVoiceState('idle');
        return;
      }

      // Play audio
      const audioUri = `data:audio/mp3;base64,${data.audio}`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, rate: voiceSpeed }
      );
      
      soundRef.current = sound;
      
      // Wait for playback to complete
      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && (status as any).didJustFinish) {
            resolve();
          }
        });
        // Timeout fallback
        setTimeout(resolve, 30000);
      });

      await stopPlayback();
      
    } catch (err) {
      console.error('TTS error:', err);
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
    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
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
