import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface Message {
  id: number;
  type: 'ai' | 'user';
  text: string;
}

export default function ResetScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      type: 'ai', 
      text: "Hey. I noticed you came here. That's okay — everyone needs a moment sometimes.",
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [breatheMode, setBreatheMode] = useState(false);
  const [breathePhase, setBreathePhase] = useState<'in' | 'hold' | 'out'>('in');
  const scrollViewRef = useRef<ScrollView>(null);
  const breatheScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;

  const quickPrompts = [
    "I'm overwhelmed",
    "Just need to vent",
    "Help me think",
  ];

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (!breatheMode) return;
    
    const animateBreathing = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breatheScale, { toValue: 1.15, duration: 4000, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.8, duration: 4000, useNativeDriver: true }),
        ]),
        Animated.delay(4000),
        Animated.parallel([
          Animated.timing(breatheScale, { toValue: 1, duration: 4000, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.5, duration: 4000, useNativeDriver: true }),
        ]),
      ]).start(() => {
        if (breatheMode) animateBreathing();
      });
    };

    const phases: Array<'in' | 'hold' | 'out'> = ['in', 'hold', 'out'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % 3;
      setBreathePhase(phases[i]);
    }, 4000);

    animateBreathing();
    return () => clearInterval(interval);
  }, [breatheMode]);

  const getAIResponse = (text: string): string => {
    const t = text.toLowerCase();
    if (t.includes('overwhelm') || t.includes('too much')) {
      return "I hear you. When everything feels like too much, the bravest thing is to pause. What's weighing on you most?";
    }
    if (t.includes('vent') || t.includes('frustrated') || t.includes('angry')) {
      return "I'm here. No advice, no judgment — just listening. Let it out.";
    }
    if (t.includes('help') || t.includes('think') || t.includes('figure')) {
      return "Let's untangle this together. Is it one thing, or does everything feel heavy right now?";
    }
    return "I'm listening. Take your time.";
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: text.trim() }]);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: getAIResponse(text) }]);
      setIsTyping(false);
    }, 1200);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: `Voice note (${recordSeconds}s)` }]);
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: "I heard you. Let it all out — I'm here." }]);
        setIsTyping(false);
      }, 1000);
    } else {
      setIsRecording(true);
    }
  };

  if (breatheMode) {
    return (
      <View style={styles.breatheContainer}>
        <SafeAreaView style={styles.breatheSafeArea}>
          <View style={styles.breatheHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setBreatheMode(false);
                setMessages(prev => [...prev, { id: Date.now(), type: 'ai', text: "Feel a little lighter? I'm here whenever you need." }]);
              }}
            >
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <View style={styles.breatheContent}>
            <Animated.View style={[styles.breatheOrbOuter, { opacity: glowOpacity, transform: [{ scale: breatheScale }] }]} />
            <Animated.View style={[styles.breatheOrb, { transform: [{ scale: breatheScale }] }]}>
              <MaterialCommunityIcons name="weather-windy" size={48} color="rgba(255,255,255,0.6)" />
            </Animated.View>

            <Text style={styles.breatheText}>
              {breathePhase === 'in' ? 'Breathe in...' : breathePhase === 'hold' ? 'Hold...' : 'Breathe out...'}
            </Text>
            <Text style={styles.breatheSubtext}>Let everything else fade</Text>
          </View>

          <View style={styles.breatheFooter}>
            <Text style={styles.breatheHint}>Tap X when you're ready</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.ambientBg}>
        <View style={[styles.ambientBlob, styles.blob1]} />
        <View style={[styles.ambientBlob, styles.blob2]} />
        <View style={[styles.ambientBlob, styles.blob3]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Safe space</Text>
          </View>
        </View>

        <View style={styles.titleCard}>
          <View style={styles.titleCardContent}>
            <View>
              <Text style={styles.titleLabel}>RESET MODE</Text>
              <Text style={styles.titleText}>No rush. Just be.</Text>
            </View>
            <TouchableOpacity
              style={styles.breatheButton}
              onPress={() => setBreatheMode(true)}
            >
              <Ionicons name="moon" size={20} color="#A78BFA" />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(message => (
              <View 
                key={message.id} 
                style={[styles.messageRow, message.type === 'user' && styles.messageRowUser]}
              >
                <View style={[
                  styles.messageBubble,
                  message.type === 'user' ? styles.userBubble : styles.aiBubble
                ]}>
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              </View>
            ))}
            
            {isTyping && (
              <View style={styles.messageRow}>
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <View style={styles.typingDots}>
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {messages.length <= 2 && (
            <View style={styles.quickPromptsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {quickPrompts.map((prompt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.quickPrompt}
                    onPress={() => sendMessage(prompt)}
                  >
                    <Text style={styles.quickPromptText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording... {recordSeconds}s</Text>
              <Text style={styles.recordingHint}>Tap mic to stop</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonRecording]}
              onPress={toggleRecording}
            >
              {isRecording ? (
                <Ionicons name="stop" size={20} color="#FCA5A5" />
              ) : (
                <Ionicons name="mic" size={20} color="rgba(255,255,255,0.6)" />
              )}
            </TouchableOpacity>

            <View style={styles.textInputWrapper}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Say anything..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                onSubmitEditing={() => sendMessage(inputText)}
                returnKeyType="send"
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, inputText.trim() && styles.sendButtonActive]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
            >
              <Feather name="send" size={20} color={inputText.trim() ? '#FFF' : 'rgba(255,255,255,0.3)'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080810',
  },
  safeArea: {
    flex: 1,
  },
  ambientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  ambientBlob: {
    position: 'absolute',
    borderRadius: 200,
  },
  blob1: {
    top: -80,
    left: -80,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  blob2: {
    top: '33%',
    right: -80,
    width: 240,
    height: 240,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  blob3: {
    bottom: -80,
    left: '25%',
    width: 288,
    height: 288,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  titleCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  titleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '500',
  },
  breatheButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  messageRow: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  quickPromptsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  quickPrompt: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  quickPromptText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F87171',
    marginRight: 12,
  },
  recordingText: {
    fontSize: 14,
    color: '#FECACA',
    flex: 1,
  },
  recordingHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
    gap: 8,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonRecording: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.5)',
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 15,
    color: '#FFF',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  breatheContainer: {
    flex: 1,
    backgroundColor: '#080810',
  },
  breatheSafeArea: {
    flex: 1,
  },
  breatheHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breatheContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breatheOrbOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  breatheOrb: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  breatheText: {
    marginTop: 48,
    fontSize: 24,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  breatheSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  breatheFooter: {
    paddingBottom: 48,
    alignItems: 'center',
  },
  breatheHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
  },
});
