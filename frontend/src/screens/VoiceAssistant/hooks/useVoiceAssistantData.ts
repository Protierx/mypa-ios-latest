import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  getVoiceAssistant, 
  VoiceAssistant, 
  VoiceCommand 
} from '../../../services/voiceAssistant';
import { api } from '../../../services/api';
import { Message, VoiceType, AssistantState } from '../types';
import { SCREEN_MAP } from '../constants';
import { getGreeting } from '../utils';

interface UseVoiceAssistantDataProps {
  visible: boolean;
  onClose: () => void;
}

export function useVoiceAssistantData({ visible, onClose }: UseVoiceAssistantDataProps) {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textMessage, setTextMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>('nova');
  const [continuousMode, setContinuousMode] = useState(true);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;
  
  // Voice assistant instance
  const assistantRef = useRef<VoiceAssistant | null>(null);

  const addMessage = useCallback((text: string, isUser: boolean, command?: VoiceCommand) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      isUser,
      time: 'Just now',
      command,
    }]);
    
    // Auto scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Handle voice commands
  const handleCommand = useCallback(async (command: VoiceCommand) => {
    if (command.type === 'navigation' && command.data?.screen) {
      // Navigate after a short delay to let the response play
      setTimeout(() => {
        const screenName = SCREEN_MAP[command.data.screen];
        if (screenName) {
          onClose();
          (navigation as any).navigate(screenName);
        }
      }, 2000);
    }
  }, [navigation, onClose]);

  const initializeAssistant = useCallback(async () => {
    // Add greeting
    const greeting = getGreeting();
    addMessage(greeting, false);
    
    // Initialize voice assistant
    assistantRef.current = getVoiceAssistant({
      voice: selectedVoice,
      continuous: continuousMode,
      onStateChange: (state: AssistantState) => {
        setAssistantState(state);
      },
      onTranscript: (text: string, isFinal: boolean) => {
        if (isFinal) {
          addMessage(text, true);
          setCurrentTranscript('');
        } else {
          setCurrentTranscript(text);
        }
      },
      onResponse: (text: string) => {
        addMessage(text, false);
      },
      onCommand: (command: VoiceCommand) => {
        handleCommand(command);
      },
      onError: (error: string) => {
        console.error('Voice assistant error:', error);
        addMessage("Sorry, I had trouble understanding that. Please try again.", false);
      },
    });

    // Speak greeting with TTS
    await assistantRef.current.speak(greeting);
    
    // Start listening
    if (continuousMode) {
      await assistantRef.current.start();
    }
  }, [selectedVoice, continuousMode, addMessage, handleCommand]);

  const stopAssistant = useCallback(async () => {
    if (assistantRef.current) {
      await assistantRef.current.stop();
    }
  }, []);

  // Initialize voice assistant
  useEffect(() => {
    if (visible) {
      initializeAssistant();
    } else {
      stopAssistant();
    }
    
    return () => {
      stopAssistant();
    };
  }, [visible]);

  // Animations based on state
  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: assistantState === 'listening' ? 1.15 : 1.05,
          duration: assistantState === 'listening' ? 800 : 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: assistantState === 'listening' ? 800 : 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Glow animation
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: assistantState === 'listening' ? 0.8 : 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    glow.start();

    // Wave animations for listening state
    if (assistantState === 'listening' || assistantState === 'speaking') {
      const wave1 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim1, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(waveAnim1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
      const wave2 = Animated.loop(
        Animated.sequence([
          Animated.delay(100),
          Animated.timing(waveAnim2, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(waveAnim2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
      const wave3 = Animated.loop(
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(waveAnim3, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(waveAnim3, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
      wave1.start();
      wave2.start();
      wave3.start();
    }

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [assistantState]);

  // Toggle continuous listening
  const toggleListening = useCallback(async () => {
    if (!assistantRef.current) return;
    
    if (assistantState === 'listening') {
      // If listening, process the current recording (push to talk behavior)
      await assistantRef.current.pushToTalk();
    } else if (assistantState === 'idle') {
      await assistantRef.current.start();
    }
    // Don't do anything if processing or speaking
  }, [assistantState]);

  // Handle text input submission
  const handleSendText = useCallback(async () => {
    if (!textMessage.trim()) return;
    
    const text = textMessage.trim();
    setTextMessage('');
    addMessage(text, true);
    
    // Process through assistant
    if (assistantRef.current) {
      setAssistantState('processing');
      
      try {
        // Process command through API
        const response = await api.post('/ai/process-command', { text });
        
        if (response.success && response.data) {
          const command = response.data as VoiceCommand;
          addMessage(command.response, false, command);
          
          // Speak the response
          await assistantRef.current.speak(command.response);
          
          // Handle command
          handleCommand(command);
        }
      } catch (error) {
        addMessage("Sorry, I couldn't process that request.", false);
      }
      
      setAssistantState(continuousMode ? 'listening' : 'idle');
    }
  }, [textMessage, addMessage, handleCommand, continuousMode]);

  return {
    // State
    assistantState,
    messages,
    currentTranscript,
    showTextInput,
    textMessage,
    showSettings,
    selectedVoice,
    continuousMode,
    
    // Refs
    scrollViewRef,
    
    // Animations
    pulseAnim,
    glowAnim,
    waveAnim1,
    waveAnim2,
    waveAnim3,
    
    // Actions
    setShowTextInput,
    setTextMessage,
    setShowSettings,
    setSelectedVoice,
    setContinuousMode,
    toggleListening,
    handleSendText,
  };
}
