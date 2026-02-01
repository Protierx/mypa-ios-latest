import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { getVoiceAssistant } from '../../../services/voiceAssistant';
import { Transcript, LanguageType, SpeedType, VoiceType } from '../types';
import { getGreeting } from '../utils';

interface UseListeningDataProps {
  visible: boolean;
  onClose: () => void;
}

export function useListeningData({ visible, onClose }: UseListeningDataProps) {
  const navigation = useNavigation();
  
  // State
  const [isListening, setIsListening] = useState(true);
  const [dots, setDots] = useState('.');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textMessage, setTextMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState<LanguageType>('English');
  const [speed, setSpeed] = useState<SpeedType>('Normal');
  const [voice, setVoice] = useState<VoiceType>('Nova');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Animations
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // Voice assistant instance
  const voiceAssistant = useRef(getVoiceAssistant()).current;

  // Greet user when screen opens with AI greeting
  useEffect(() => {
    if (visible && transcripts.length === 0) {
      const greet = async () => {
        try {
          // Use AI chat for a personalized greeting
          const response = await voiceAssistant.chat("Hello! What can you help me with?");
          const greeting = response.message || getGreeting();
          
          setTranscripts([{
            id: 1,
            text: greeting,
            isUser: false,
            time: "Just now"
          }]);
          
          // Use OpenAI TTS for human-like voice
          await voiceAssistant.speak(greeting);
        } catch {
          const greeting = getGreeting();
          setTranscripts([{
            id: 1,
            text: greeting,
            isUser: false,
            time: "Just now"
          }]);
          Speech.speak(greeting, {
            language: 'en-US',
            rate: 1.0,
          });
        }
      };
      greet();
    }
  }, [visible]);

  // Dots animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Pulse and float animations
  useEffect(() => {
    const createPulseAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulse1 = createPulseAnimation(pulseAnim1, 0);
    const pulse2 = createPulseAnimation(pulseAnim2, 300);
    const pulse3 = createPulseAnimation(pulseAnim3, 600);

    pulse1.start();
    pulse2.start();
    pulse3.start();

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    float.start();

    return () => {
      pulse1.stop();
      pulse2.stop();
      pulse3.stop();
      float.stop();
    };
  }, []);

  // Process AI command using conversational chat
  const handleAICommand = useCallback(async (text: string) => {
    setIsProcessing(true);
    
    try {
      // Use the new conversational AI chat
      const response = await voiceAssistant.chat(text);
      
      // Add AI response to transcripts
      setTranscripts(prev => [...prev, {
        id: prev.length + 1,
        text: response.message,
        isUser: false,
        time: "Just now"
      }]);
      
      // Use OpenAI TTS for human-like voice
      await voiceAssistant.speak(response.message);
      
      // Handle any actions the AI wants to take
      if (response.action && response.action.type !== 'none') {
        switch (response.action.type) {
          case 'navigation':
            if (response.action.target || response.action.data?.screen) {
              const screen = response.action.target || response.action.data?.screen;
              setTimeout(() => {
                onClose();
                navigation.navigate(screen as never);
              }, 500);
            }
            break;
          case 'task':
            // Task was already created by the backend AI
            break;
          case 'focus':
            // Focus was already started by the backend AI
            break;
        }
      }
      
    } catch (error) {
      console.error('AI command error:', error);
      const errorMsg = "Sorry, I couldn't process that request. Please try again.";
      setTranscripts(prev => [...prev, {
        id: prev.length + 1,
        text: errorMsg,
        isUser: false,
        time: "Just now"
      }]);
      // Use fallback speech
      Speech.speak(errorMsg, { language: 'en-US', rate: 1.0 });
    } finally {
      setIsProcessing(false);
    }
  }, [navigation, onClose, voiceAssistant]);

  const handleSendText = useCallback(() => {
    if (!textMessage.trim()) return;
    
    const userText = textMessage.trim();
    setTranscripts(prev => [...prev, {
      id: prev.length + 1,
      text: userText,
      isUser: true,
      time: "Just now"
    }]);
    setTextMessage('');
    
    // Process through AI
    handleAICommand(userText);
  }, [textMessage, handleAICommand]);

  return {
    // State
    isListening,
    dots,
    showTextInput,
    textMessage,
    showSettings,
    language,
    speed,
    voice,
    transcripts,
    isProcessing,
    
    // Animations
    pulseAnim1,
    pulseAnim2,
    pulseAnim3,
    floatAnim,
    
    // Actions
    setIsListening,
    setShowTextInput,
    setTextMessage,
    setShowSettings,
    setLanguage,
    setSpeed,
    setVoice,
    handleSendText,
  };
}
