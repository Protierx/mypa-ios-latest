/**
 * MYPA Voice Assistant Service
 * Voice processing with OpenAI GPT + TTS
 */
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import * as Speech from 'expo-speech';
import { api, aiApi, ttsApi, tasksApi, focusApi, brainDumpApi } from './api';

// Voice assistant configuration
export interface VoiceAssistantConfig {
  onListeningStart?: () => void;
  onListeningStop?: () => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onCommand?: (command: VoiceCommand) => void;
  onAction?: (action: MYPAAction) => void;
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

// MYPA Action from conversation API
export interface MYPAAction {
  type: 'task' | 'navigation' | 'focus' | 'braindump' | 'challenge' | 'query' | 'reminder' | 'none';
  operation: string;
  data: any;
  target?: string; // For navigation targets
}

// Full MYPA response
export interface MYPAResponse {
  message: string;
  action?: MYPAAction;
  followUp?: string;
  emotion?: 'neutral' | 'encouraging' | 'celebrating' | 'sympathetic' | 'focused';
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

  // Conversation history for context
  private conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

  /**
   * Process text with full MYPA conversation (recommended)
   */
  async chat(text: string): Promise<MYPAResponse> {
    this.setState('processing');
    
    try {
      // Add user message to history
      this.conversationHistory.push({ role: 'user', content: text });
      
      // Call the conversation API
      const response = await aiApi.conversation(text, this.conversationHistory.slice(-6));
      
      if (response.success && response.data) {
        const mypaResponse = response.data as MYPAResponse;
        
        // Add assistant response to history
        this.conversationHistory.push({ role: 'assistant', content: mypaResponse.message });
        
        // Keep history manageable
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-10);
        }
        
        // Speak the response
        if (mypaResponse.message) {
          this.config.onResponse?.(mypaResponse.message);
          await this.speak(mypaResponse.message);
        }
        
        // Notify about action if present
        if (mypaResponse.action && mypaResponse.action.type !== 'none') {
          this.config.onAction?.(mypaResponse.action);
        }
        
        this.setState('idle');
        return mypaResponse;
      }

      this.setState('idle');
      return {
        message: "I'm not sure how to help with that. Could you rephrase?",
        emotion: 'sympathetic',
      };
    } catch (error) {
      console.error('MYPA conversation error:', error);
      this.setState('idle');
      return {
        message: "Sorry, I'm having trouble connecting. Let me try again.",
        emotion: 'sympathetic',
      };
    }
  }

  /**
   * Clear conversation history (for new session)
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Process text command (legacy - converts to VoiceCommand format)
   */
  async processText(text: string): Promise<VoiceCommand> {
    this.setState('processing');
    
    try {
      const response = await aiApi.processCommand(text);
      
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
      const response = await ttsApi.speak(text, this.config.voice, 1.0);

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
   * Execute the parsed command using API services
   */
  private async executeCommand(command: VoiceCommand): Promise<CommandResult> {
    try {
      switch (command.type) {
        case 'task':
          if (command.action === 'create') {
            const taskResponse = await tasksApi.create({
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
          } else if (command.action === 'list') {
            const tasksResponse = await tasksApi.getAll();
            return {
              success: tasksResponse.success,
              message: command.response,
              data: tasksResponse.data,
            };
          } else if (command.action === 'complete') {
            // Find task by title and complete it
            const allTasks = await tasksApi.getAll();
            const task = allTasks.data?.tasks?.find(
              (t: any) => t.title.toLowerCase().includes(command.data.title?.toLowerCase() || '')
            );
            if (task) {
              const completeResponse = await tasksApi.complete(task.id);
              return {
                success: completeResponse.success,
                message: completeResponse.success ? 'Task completed!' : 'Failed to complete task',
                data: completeResponse.data,
              };
            }
          }
          break;

        case 'focus':
          if (command.action === 'start') {
            const focusResponse = await focusApi.start({
              targetMinutes: command.data.targetMinutes || 25,
              taskId: command.data.taskId,
            });
            return {
              success: focusResponse.success,
              message: focusResponse.success ? 'Focus session started!' : 'Failed to start focus',
              data: focusResponse.data,
            };
          } else if (command.action === 'end' || command.action === 'complete') {
            const endResponse = await focusApi.complete();
            return {
              success: endResponse.success,
              message: endResponse.success ? 'Focus session ended!' : 'Failed to end focus',
              data: endResponse.data,
            };
          } else if (command.action === 'status') {
            const statusResponse = await focusApi.getActive();
            return {
              success: statusResponse.success,
              message: command.response,
              data: statusResponse.data,
            };
          }
          break;

        case 'braindump':
          if (command.action === 'create') {
            const dumpResponse = await brainDumpApi.create(command.data.content);
            return {
              success: dumpResponse.success,
              message: dumpResponse.success ? 'Added to brain dump!' : 'Failed to save',
              data: dumpResponse.data,
            };
          } else if (command.action === 'list') {
            const itemsResponse = await brainDumpApi.getAll();
            return {
              success: itemsResponse.success,
              message: command.response,
              data: itemsResponse.data,
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
   * Get morning briefing from MYPA
   */
  async getMorningBriefing(): Promise<string> {
    try {
      // Get today's tasks and focus stats
      const [tasksRes, focusRes] = await Promise.all([
        tasksApi.getAll(),
        focusApi.getStats(),
      ]);

      const tasks = tasksRes.data?.tasks || [];
      const focusStats = focusRes.data || {};

      // Use AI to generate briefing
      const response = await aiApi.conversation(
        `Generate a friendly morning briefing. Today's tasks: ${JSON.stringify(tasks.slice(0, 5))}. Focus stats: ${JSON.stringify(focusStats)}. Include motivation and a suggested first task.`,
        this.conversationHistory.slice(-4)
      );

      if (response.success && response.data?.message) {
        this.conversationHistory.push(
          { role: 'user', content: 'Give me my morning briefing' },
          { role: 'assistant', content: response.data.message }
        );
        return response.data.message;
      }

      return "Good morning! Ready to tackle the day? Let's check what's on your plate.";
    } catch (error) {
      console.error('Morning briefing error:', error);
      return "Good morning! I'm having a bit of trouble fetching your schedule, but I'm here to help when you're ready.";
    }
  }

  /**
   * Get evening summary from MYPA
   */
  async getEveningSummary(): Promise<string> {
    try {
      const response = await aiApi.getEveningSummary();

      if (response.success && response.data?.summary) {
        return response.data.summary;
      }

      return "Great work today! Take some time to rest and recharge.";
    } catch (error) {
      console.error('Evening summary error:', error);
      return "Nice work today! Remember to get some good rest.";
    }
  }

  /**
   * Get proactive suggestion from MYPA
   */
  async getProactiveSuggestion(): Promise<string> {
    try {
      const response = await aiApi.getSuggestion();

      if (response.success && response.data?.suggestion) {
        return response.data.suggestion;
      }

      return '';
    } catch (error) {
      console.error('Proactive suggestion error:', error);
      return '';
    }
  }

  /**
   * Get task optimization suggestions
   */
  async getTaskSuggestions(): Promise<{ task: string; suggestion: string }[]> {
    try {
      const response = await aiApi.getTaskSuggestions();

      if (response.success && response.data?.suggestions) {
        return response.data.suggestions;
      }

      return [];
    } catch (error) {
      console.error('Task suggestions error:', error);
      return [];
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

/**
 * Process a voice command text and return structured command
 */
export async function processVoiceCommand(text: string): Promise<VoiceCommand> {
  const assistant = getVoiceAssistant();
  return assistant.processText(text);
}

/**
 * Execute a voice command with navigation support
 */
export async function executeVoiceCommand(
  command: VoiceCommand,
  navigation: any
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    switch (command.type) {
      case 'navigation':
        if (command.data?.screen) {
          navigation.navigate(command.data.screen, command.data.params || {});
          return {
            success: true,
            message: command.response || `Navigating to ${command.data.screen}`,
          };
        }
        break;

      case 'task':
        if (command.action === 'create') {
          const response = await tasksApi.create({
            title: command.data.title,
            priority: command.data.priority || 'NORMAL',
            category: command.data.category || 'Personal',
            durationMinutes: command.data.durationMin || 30,
          });
          return {
            success: response.success,
            message: response.success 
              ? command.response || 'Task created successfully!'
              : 'Failed to create task',
            data: response.data,
          };
        } else if (command.action === 'complete') {
          const allTasks = await tasksApi.getAll();
          const task = allTasks.data?.tasks?.find(
            (t: any) => t.title.toLowerCase().includes(command.data.title?.toLowerCase() || '')
          );
          if (task) {
            const completeResponse = await tasksApi.complete(task.id);
            return {
              success: completeResponse.success,
              message: completeResponse.success
                ? command.response || 'Task completed!'
                : 'Failed to complete task',
              data: completeResponse.data,
            };
          }
        }
        break;

      case 'focus':
        if (command.action === 'start') {
          const response = await focusApi.start({
            targetMinutes: command.data.targetMinutes || 25,
            taskId: command.data.taskId,
          });
          return {
            success: response.success,
            message: response.success
              ? command.response || 'Focus session started!'
              : 'Failed to start focus session',
            data: response.data,
          };
        } else if (command.action === 'end' || command.action === 'complete') {
          const response = await focusApi.complete();
          return {
            success: response.success,
            message: response.success
              ? command.response || 'Focus session ended!'
              : 'Failed to end focus session',
            data: response.data,
          };
        }
        break;

      case 'braindump':
        if (command.action === 'create') {
          const response = await brainDumpApi.create(command.data.content);
          return {
            success: response.success,
            message: response.success
              ? command.response || 'Added to brain dump!'
              : 'Failed to save brain dump',
            data: response.data,
          };
        }
        break;

      case 'query':
        return {
          success: true,
          message: command.response,
          data: command.data,
        };

      default:
        return {
          success: true,
          message: command.response || 'Command processed',
        };
    }

    return { success: true, message: command.response || 'Done!' };
  } catch (error) {
    console.error('Execute voice command error:', error);
    return {
      success: false,
      message: 'Sorry, something went wrong while processing your request.',
    };
  }
}

export { VoiceAssistant };
