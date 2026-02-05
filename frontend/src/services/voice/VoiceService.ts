/**
 * Voice Service
 * 
 * Unified voice abstraction layer using OpenAI Whisper (STT) and OpenAI TTS.
 * This is a standalone service that can be used outside of React context.
 * 
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 6
 */

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface SpeakOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'ash';
  speed?: number; // 0.25 to 4.0
}

export interface VoiceError {
  code: string;
  message: string;
}

export interface VoiceServiceInterface {
  // STT (OpenAI Whisper via Edge Function)
  startListening(): Promise<void>;
  stopListening(): Promise<string>;
  cancelListening(): void;
  
  // TTS (OpenAI TTS via Edge Function)
  speak(text: string, options?: SpeakOptions): Promise<void>;
  stopSpeaking(): void;
  
  // State
  isListening: boolean;
  isSpeaking: boolean;
  state: VoiceState;
  
  // Events
  onPartialResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (error: VoiceError) => void;
  onStateChange?: (state: VoiceState) => void;
  onAudioLevel?: (level: number) => void;
}

class VoiceServiceClass implements VoiceServiceInterface {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private _state: VoiceState = 'idle';
  private _audioLevel: number = 0;
  private ttsQueue: Array<{ text: string; options?: SpeakOptions }> = [];
  private isProcessingQueue: boolean = false;
  
  // Event handlers
  onPartialResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (error: VoiceError) => void;
  onStateChange?: (state: VoiceState) => void;
  onAudioLevel?: (level: number) => void;
  
  // Settings - Default voice: 'nova' (friendly, female, energetic)
  defaultVoice: SpeakOptions['voice'] = 'nova';
  defaultSpeed: number = 1.0;
  
  get isListening(): boolean {
    return this._state === 'listening';
  }
  
  get isSpeaking(): boolean {
    return this._state === 'speaking';
  }
  
  get state(): VoiceState {
    return this._state;
  }
  
  private setState(newState: VoiceState) {
    this._state = newState;
    this.onStateChange?.(newState);
  }
  
  async requestPermissions(): Promise<boolean> {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (granted) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      }
      return granted;
    } catch (err) {
      console.error('Failed to request audio permissions:', err);
      return false;
    }
  }
  
  async startListening(): Promise<void> {
    // Request permissions if needed
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      this.onError?.({
        code: 'PERMISSION_DENIED',
        message: 'Microphone permission required',
      });
      return;
    }
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Stop any existing recording/playback
      await this.stopRecording();
      await this.stopPlayback();
      
      // Configure for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      // Start recording with metering
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            // Convert dB to 0-1 range
            const normalizedLevel = Math.max(0, Math.min(1, (status.metering + 60) / 60));
            this._audioLevel = normalizedLevel;
            this.onAudioLevel?.(normalizedLevel);
          }
        },
        100
      );
      
      this.recording = recording;
      this.setState('listening');
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      this.onError?.({
        code: 'RECORDING_FAILED',
        message: 'Failed to start recording',
      });
      this.setState('idle');
    }
  }
  
  async stopListening(): Promise<string> {
    if (!this.recording) return '';
    
    this.setState('processing');
    this._audioLevel = 0;
    this.onAudioLevel?.(0);
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Stop recording
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      
      if (!uri) {
        throw new Error('No recording URI');
      }
      
      // Read and convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Send to Edge Function for transcription
      const { data, error } = await supabase.functions.invoke('voice-command', {
        body: { 
          audio: base64Audio,
          context: { screen: 'ai_home' }
        }
      });
      
      if (error) throw error;
      
      const transcript = data?.transcript || '';
      this.onFinalResult?.(transcript);
      
      return transcript;
      
    } catch (err) {
      console.error('Failed to process recording:', err);
      this.onError?.({
        code: 'TRANSCRIPTION_FAILED',
        message: 'Failed to process voice',
      });
      this.setState('idle');
      return '';
    }
  }
  
  cancelListening(): void {
    this.stopRecording();
    this.setState('idle');
    this._audioLevel = 0;
    this.onAudioLevel?.(0);
  }
  
  /**
   * Speak text using OpenAI TTS
   * If already speaking, queues the text for later
   */
  async speak(text: string, options?: SpeakOptions): Promise<void> {
    if (!text) {
      return;
    }
    
    // Cancel any recording when starting TTS
    if (this.isListening) {
      this.cancelListening();
    }
    
    // Queue TTS if already speaking
    if (this.isSpeaking || this.isProcessingQueue) {
      this.ttsQueue.push({ text, options });
      return;
    }
    
    await this.processSpeak(text, options);
    
    // Process queue
    await this.processQueue();
  }
  
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.ttsQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.ttsQueue.length > 0) {
      const item = this.ttsQueue.shift();
      if (item) {
        await this.processSpeak(item.text, item.options);
      }
    }
    
    this.isProcessingQueue = false;
  }
  
  private async processSpeak(text: string, options?: SpeakOptions): Promise<void> {
    this.setState('speaking');
    
    try {
      // Configure for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      // Call TTS Edge Function
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          voice: options?.voice || this.defaultVoice,
          speed: options?.speed || this.defaultSpeed,
        }
      });
      
      if (error || !data?.audio) {
        // Fallback to expo-speech
        const Speech = await import('expo-speech');
        await new Promise<void>((resolve) => {
          Speech.speak(text, {
            rate: options?.speed || this.defaultSpeed,
            onDone: resolve,
            onError: () => resolve(),
          });
        });
        this.setState('idle');
        return;
      }
      
      // Play audio
      const audioUri = `data:audio/mp3;base64,${data.audio}`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, rate: options?.speed || this.defaultSpeed }
      );
      
      this.sound = sound;
      
      // Wait for completion
      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && (status as any).didJustFinish) {
            resolve();
          }
        });
        setTimeout(resolve, 30000); // Timeout fallback
      });
      
      await this.stopPlayback();
      
    } catch (err) {
      console.error('TTS error:', err);
      this.onError?.({
        code: 'TTS_FAILED',
        message: 'Failed to speak',
      });
    }
    
    this.setState('idle');
  }
  
  stopSpeaking(): void {
    // Clear the queue when stopping
    this.ttsQueue = [];
    this.isProcessingQueue = false;
    this.stopPlayback();
    this.setState('idle');
  }
  
  /**
   * Clear the TTS queue
   */
  clearQueue(): void {
    this.ttsQueue = [];
  }
  
  /**
   * Get current queue length
   */
  get queueLength(): number {
    return this.ttsQueue.length;
  }
  
  private async stopRecording(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (e) {
        // Ignore
      }
      this.recording = null;
    }
  }
  
  private async stopPlayback(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (e) {
        // Ignore
      }
      this.sound = null;
    }
  }
  
  // Cleanup
  async dispose(): Promise<void> {
    await this.stopRecording();
    await this.stopPlayback();
    this.setState('idle');
  }
}

// Export singleton instance
export const VoiceService = new VoiceServiceClass();
