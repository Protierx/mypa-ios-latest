import { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollView, Animated } from 'react-native';
import { Message, BreathePhase } from '../types';
import {
  INITIAL_MESSAGES,
  BREATHE_PHASES,
  BREATHE_PHASE_DURATION,
  AI_RESPONSE_DELAY,
  VOICE_RESPONSE_DELAY,
} from '../constants';
import { getAIResponse } from '../utils';

interface UseResetDataReturn {
  messages: Message[];
  inputText: string;
  isTyping: boolean;
  isRecording: boolean;
  recordSeconds: number;
  breatheMode: boolean;
  breathePhase: BreathePhase;
  breatheScale: Animated.Value;
  glowOpacity: Animated.Value;
  scrollViewRef: React.RefObject<ScrollView>;
  setInputText: (text: string) => void;
  sendMessage: (text: string) => void;
  toggleRecording: () => void;
  setBreatheMode: (mode: boolean) => void;
  exitBreatheMode: () => void;
}

export const useResetData = (): UseResetDataReturn => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [breatheMode, setBreatheMode] = useState(false);
  const [breathePhase, setBreathePhase] = useState<BreathePhase>('in');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const breatheScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;

  // Scroll to end when messages change
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Breathing animation
  useEffect(() => {
    if (!breatheMode) return;

    const animateBreathing = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breatheScale, {
            toValue: 1.15,
            duration: BREATHE_PHASE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.8,
            duration: BREATHE_PHASE_DURATION,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(BREATHE_PHASE_DURATION),
        Animated.parallel([
          Animated.timing(breatheScale, {
            toValue: 1,
            duration: BREATHE_PHASE_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.5,
            duration: BREATHE_PHASE_DURATION,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (breatheMode) animateBreathing();
      });
    };

    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % 3;
      setBreathePhase(BREATHE_PHASES[i]);
    }, BREATHE_PHASE_DURATION);

    animateBreathing();
    return () => clearInterval(interval);
  }, [breatheMode, breatheScale, glowOpacity]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), type: 'user', text: text.trim() },
    ]);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, type: 'ai', text: getAIResponse(text) },
      ]);
      setIsTyping(false);
    }, AI_RESPONSE_DELAY);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), type: 'user', text: `Voice note (${recordSeconds}s)` },
      ]);
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'ai',
            text: "I heard you. Let it all out — I'm here.",
          },
        ]);
        setIsTyping(false);
      }, VOICE_RESPONSE_DELAY);
    } else {
      setIsRecording(true);
    }
  }, [isRecording, recordSeconds]);

  const exitBreatheMode = useCallback(() => {
    setBreatheMode(false);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: 'ai',
        text: "Feel a little lighter? I'm here whenever you need.",
      },
    ]);
  }, []);

  return {
    messages,
    inputText,
    isTyping,
    isRecording,
    recordSeconds,
    breatheMode,
    breathePhase,
    breatheScale,
    glowOpacity,
    scrollViewRef,
    setInputText,
    sendMessage,
    toggleRecording,
    setBreatheMode,
    exitBreatheMode,
  };
};
