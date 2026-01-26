/**
 * MYPA Voice Assistant Service
 * Voice processing with OpenAI GPT + TTS
 */
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import * as Speech from 'expo-speech';
import { api } from './api';

// Voice assistant configuration
export interface VoiceAssistantConfig {
  onListeningStart?: () => void;
  onListeningStop?: () => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onCommand?: (command: VoiceCommand) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: AssistantState) => void;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  language?: string;
  continuous?: boolean;
}

export type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface VoiceCommand {
  type: 'task' | 'challenge' | 'navigation' | 'focus' | 'braindump' | 'query' | 'unknown';
  action: string;
  data: any;
  response: string;
  confidence: number;
}

interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

class VoiceAssistant {
  private config: VoiceAssistantConfig;
  private sound: Audio.Sound | null = null;
  private state: AssistantState = 'idle';
  private isActive: boolean = false;

  constructor(config: VoiceAssistantConfig = {}) {
    this.config = {
      voice: 'nova',
      language: 'en',
      continuous: true,
      ...config,
    };
  }

  updateConfig(config: Partial<VoiceAssistantConfig>) {
    this.config = { ...this.config, ...config };
  }

  private setState(newState: AssistantState) {
    this.state = newState;
    this.config.onStateChange?.(newState);
  }

  getState(): AssistantState {
    return this.state;
  }

  isListening(): boolean {
    return this.state === 'listening';
  }

  /**
   * Start the voice assistant
   */
  async start(): Promise<void> {
    if (this.isActive) return;
    
    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      this.isActive = true;
      this.setState('idle');
      this.config.onListeningStart?.();
    } catch (error) {
      console.error('Failed to start voice assistant:', error);
      this.config.onError?.('Failed to start voice assistant');
    }
  }

  /**
   * Stop the voice assistant
   */
  async stop(): Promise<void> {
    this.isActive = false;
    await this.stopPlayback();
    this.setState('idle');
    this.config.onListeningStop?.();
  }

  /**
   * Process text command
   */
  async processText(text: string): Promise<VoiceCommand> {
    this.setState('processing');
    
    try {
      const response = await api.post('/ai/process-command', { text });
      
      if (response.success && response.data) {
        const command = response.data as VoiceCommand;
        this.config.onCommand?.(command);
        
        // Speak the response
        if (command.response) {
          this.config.onResponse?.(command.response);
          await this.speak(command.response);
        }
        
        // Execute the command
        await this.executeCommand(command);
        
        this.setState('idle');
        return command;
      }

      this.setState('idle');
      return {
        type: 'unknown',
        action: 'unknown',
        data: {},
        response: "I'm not sure how to help with that.",
        confidence: 0.5,
      };
    } catch (error) {
      console.error('Command processing error:', error);
      this.setState('idle');
      return {
        type: 'unknown',
        action: 'unknown',
        data: {},
        response: "Sorry, I couldn't process that request.",
        confidence: 0,
      };
    }
  }

  /**
   * Play TTS response
   * Uses OpenAI TTS when available, falls back to device TTS
   */
  async speak(text: string): Promise<void> {
    this.setState('speaking');

    try {
      // Try OpenAI TTS first
      const response = await api.post('/tts/speak', {
        text,
        voice: this.config.voice,
        speed: 1.0,
      });

      if (response.success && response.data?.audio) {
        // Create data URI for the audio
        const audioDataUri = `data:audio/mp3;base64,${response.data.audio}`;
        
        await this.stopPlayback();
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioDataUri },
          { shouldPlay: true }
        );
        
        this.sound = sound;

        // Wait for playback to complete
        await new Promise<void>((resolve) => {
          sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
            const loadedStatus = status as AVPlaybackStatusSuccess;
            if (status.isLoaded && loadedStatus.didJustFinish) {
              resolve();
            }
          });
          
          // Timeout fallback
          setTimeout(resolve, 30000);
        });

        await this.stopPlayback();
        this.setState('idle');
        return;
      }
    } catch (error) {
      console.log('OpenAI TTS failed, using device TTS:', error);
    }

    // Fallback to device TTS
    await new Promise<void>((resolve) => {
      Speech.speak(text, {
        language: this.config.language === 'en' ? 'en-US' : this.config.language,
        onDone: () => resolve(),
        onError: () => resolve(),
      });
    });

    this.setState('idle');
  }

  /**
   * Stop audio playback
   */
  private async stopPlayback(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        // Ignore
      }
      this.sound = null;
    }
  }

  /**
   * Execute the parsed command
   */
  private async executeCommand(command: VoiceCommand): Promise<CommandResult> {
    try {
      switch (command.type) {
        case 'task':
          if (command.action === 'create') {
            const taskResponse = await api.post('/tasks', {
              title: command.data.title,
              priority: command.data.priority || 'NORMAL',
              category: command.data.category || 'Personal',
              durationMinutes: command.data.durationMin || 30,
            });
            return {
              success: taskResponse.success,
              message: taskResponse.success ? 'Task created!' : 'Failed to create task',
              data: taskResponse.data,
            };
          }
          break;

        case 'focus':
          if (command.action === 'start') {
            const focusResponse = await api.post('/focus/start', {
              targetMinutes: command.data.targetMinutes || 25,
              taskId: command.data.taskId,
            });
            return {
              success: focusResponse.success,
              message: focusResponse.success ? 'Focus session started!' : 'Failed to start focus',
              data: focusResponse.data,
            };
          }
          break;

        case 'braindump':
          if (command.action === 'create') {
            const dumpResponse = await api.post('/brain-dump', {
              content: command.data.content,
            });
            return {
              success: dumpResponse.success,
              message: dumpResponse.success ? 'Added to brain dump!' : 'Failed to save',
              data: dumpResponse.data,
            };
          }
          break;

        case 'navigation':
          // Navigation is handled by the screen component
          return {
            success: true,
            message: `Navigating to ${command.data.screen}`,
            data: command.data,
          };

        case 'query':
          // Queries are answered by the response itself
          return {
            success: true,
            message: command.response,
            data: command.data,
          };

        default:
          return {
            success: true,
            message: command.response,
          };
      }

      return { success: true, message: 'Command processed' };
    } catch (error) {
      console.error('Command execution error:', error);
      return { success: false, message: 'Failed to execute command' };
    }
  }

  /**
   * Manually trigger processing (placeholder for future voice input)
   */
  async pushToTalk(): Promise<void> {
    // For now, this is a no-op
    // Voice input will be added in future with native Whisper integration
  }
}

// Singleton instance
let voiceAssistant: VoiceAssistant | null = null;

export function getVoiceAssistant(config?: VoiceAssistantConfig): VoiceAssistant {
  if (!voiceAssistant) {
    voiceAssistant = new VoiceAssistant(config);
  } else if (config) {
    voiceAssistant.updateConfig(config);
  }
  return voiceAssistant;
}

export { VoiceAssistant };
