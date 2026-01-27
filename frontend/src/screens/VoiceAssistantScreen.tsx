/**
 * MYPA Voice Assistant Screen
 * Continuous listening AI assistant with natural voice
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { 
  getVoiceAssistant, 
  VoiceAssistant, 
  AssistantState, 
  VoiceCommand 
} from '../services/voiceAssistant';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

interface VoiceAssistantScreenProps {
  visible: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  time: string;
  command?: VoiceCommand;
}

export function VoiceAssistantScreen({ visible, onClose }: VoiceAssistantScreenProps) {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textMessage, setTextMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<'nova' | 'alloy' | 'shimmer'>('nova');
  const [continuousMode, setContinuousMode] = useState(true);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;
  
  // Voice assistant instance
  const assistantRef = useRef<VoiceAssistant | null>(null);

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
  }, [selectedVoice, continuousMode]);

  const stopAssistant = useCallback(async () => {
    if (assistantRef.current) {
      await assistantRef.current.stop();
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! I'm listening. How can I help you?";
    if (hour < 17) return "Good afternoon! What would you like me to do?";
    return "Good evening! I'm here to help.";
  };

  const addMessage = (text: string, isUser: boolean, command?: VoiceCommand) => {
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
  };

  // Handle voice commands
  const handleCommand = async (command: VoiceCommand) => {
    if (command.type === 'navigation' && command.data?.screen) {
      // Navigate after a short delay to let the response play
      setTimeout(() => {
        const screenMap: Record<string, string> = {
          'Home': 'Home',
          'Hub': 'Home',
          'Plan': 'Plan',
          'Profile': 'Profile',
          'Circles': 'Circles',
          'Tasks': 'Tasks',
          'Challenges': 'Challenges',
          'Settings': 'Settings',
          'Inbox': 'Inbox',
          'Wallet': 'Wallet',
          'Streak': 'Streak',
          'Level': 'Level',
        };
        
        const screenName = screenMap[command.data.screen];
        if (screenName) {
          onClose();
          (navigation as any).navigate(screenName);
        }
      }, 2000);
    }
  };

  // Handle text input submission
  const handleSendText = async () => {
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
  };

  // Toggle continuous listening
  const toggleListening = async () => {
    if (!assistantRef.current) return;
    
    if (assistantState === 'listening') {
      // If listening, process the current recording (push to talk behavior)
      await assistantRef.current.pushToTalk();
    } else if (assistantState === 'idle') {
      await assistantRef.current.start();
    }
    // Don't do anything if processing or speaking
  };

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

  // Get status text
  const getStatusText = () => {
    switch (assistantState) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Tap to talk';
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (assistantState) {
      case 'listening':
        return '#10B981'; // Green
      case 'processing':
        return '#F59E0B'; // Orange
      case 'speaking':
        return '#8B5CF6'; // Purple
      default:
        return '#64748B'; // Gray
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F172A', '#1E1B4B', '#312E81']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>MYPA</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                <Text style={styles.statusText}>{getStatusText()}</Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {!message.isUser && (
                  <View style={styles.assistantAvatar}>
                    <Image
                      source={require('../../assets/mypa-orb.png')}
                      style={styles.avatarImage}
                    />
                  </View>
                )}
                <View style={[
                  styles.messageContent,
                  message.isUser ? styles.userContent : styles.assistantContent,
                ]}>
                  <Text style={[
                    styles.messageText,
                    message.isUser ? styles.userText : styles.assistantText,
                  ]}>
                    {message.text}
                  </Text>
                </View>
              </View>
            ))}
            
            {/* Current transcript (while speaking) */}
            {currentTranscript ? (
              <View style={[styles.messageBubble, styles.userBubble]}>
                <View style={[styles.messageContent, styles.userContent, styles.transcriptContent]}>
                  <Text style={[styles.messageText, styles.userText, styles.transcriptText]}>
                    {currentTranscript}...
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Voice Orb */}
          <View style={styles.orbContainer}>
            <TouchableOpacity
              onPress={toggleListening}
              activeOpacity={0.8}
              style={styles.orbTouchable}
            >
              {/* Glow effect */}
              <Animated.View style={[
                styles.orbGlow,
                {
                  opacity: glowAnim,
                  transform: [{ scale: pulseAnim }],
                },
              ]} />
              
              {/* Outer ring */}
              <Animated.View style={[
                styles.orbRing,
                { transform: [{ scale: pulseAnim }] },
              ]} />
              
              {/* Main orb */}
              <Animated.View style={[
                styles.orbMain,
                { transform: [{ scale: pulseAnim }] },
              ]}>
                <Image
                  source={require('../../assets/mypa-orb.png')}
                  style={styles.orbImage}
                  resizeMode="contain"
                />
              </Animated.View>

              {/* Sound waves */}
              {(assistantState === 'listening' || assistantState === 'speaking') && (
                <View style={styles.wavesContainer}>
                  <Animated.View style={[styles.wave, { opacity: waveAnim1, transform: [{ scaleY: waveAnim1 }] }]} />
                  <Animated.View style={[styles.wave, { opacity: waveAnim2, transform: [{ scaleY: waveAnim2 }] }]} />
                  <Animated.View style={[styles.wave, { opacity: waveAnim3, transform: [{ scaleY: waveAnim3 }] }]} />
                  <Animated.View style={[styles.wave, { opacity: waveAnim2, transform: [{ scaleY: waveAnim2 }] }]} />
                  <Animated.View style={[styles.wave, { opacity: waveAnim1, transform: [{ scaleY: waveAnim1 }] }]} />
                </View>
              )}
            </TouchableOpacity>

            {/* Quick action hint */}
            <Text style={styles.orbHint}>
              {assistantState === 'listening' 
                ? 'Speak now...' 
                : assistantState === 'idle'
                  ? 'Tap to start talking'
                  : ''}
            </Text>
          </View>

          {/* Text Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}
          >
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={styles.inputToggle}
                onPress={() => setShowTextInput(!showTextInput)}
              >
                <Ionicons 
                  name={showTextInput ? 'mic' : 'chatbubble-outline'} 
                  size={24} 
                  color="#8B5CF6" 
                />
              </TouchableOpacity>

              {showTextInput ? (
                <View style={styles.textInputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type a message..."
                    placeholderTextColor="#64748B"
                    value={textMessage}
                    onChangeText={setTextMessage}
                    onSubmitEditing={handleSendText}
                    returnKeyType="send"
                  />
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendText}
                    disabled={!textMessage.trim()}
                  >
                    <Ionicons 
                      name="send" 
                      size={20} 
                      color={textMessage.trim() ? '#8B5CF6' : '#64748B'} 
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.inputHint}>
                  {continuousMode ? 'Always listening' : 'Tap orb to talk'}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.continuousToggle,
                  continuousMode && styles.continuousToggleActive,
                ]}
                onPress={() => setContinuousMode(!continuousMode)}
              >
                <Ionicons 
                  name={continuousMode ? 'radio' : 'radio-outline'} 
                  size={20} 
                  color={continuousMode ? '#10B981' : '#64748B'} 
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

          {/* Settings Modal */}
          <Modal
            visible={showSettings}
            transparent
            animationType="fade"
            onRequestClose={() => setShowSettings(false)}
          >
            <View style={styles.settingsOverlay}>
              <View style={styles.settingsModal}>
                <View style={styles.settingsHeader}>
                  <Text style={styles.settingsTitle}>Voice Settings</Text>
                  <TouchableOpacity onPress={() => setShowSettings(false)}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.settingLabel}>MYPA Voice</Text>
                <View style={styles.voiceOptions}>
                  {(['nova', 'alloy', 'shimmer'] as const).map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[
                        styles.voiceOption,
                        selectedVoice === v && styles.voiceOptionActive,
                      ]}
                      onPress={() => setSelectedVoice(v)}
                    >
                      <Text style={[
                        styles.voiceOptionText,
                        selectedVoice === v && styles.voiceOptionTextActive,
                      ]}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </Text>
                      <Text style={styles.voiceOptionDesc}>
                        {v === 'nova' ? 'Warm & friendly' : 
                         v === 'alloy' ? 'Neutral & clear' : 
                         'Soft & gentle'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Continuous Listening</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleSwitch,
                      continuousMode && styles.toggleSwitchActive,
                    ]}
                    onPress={() => setContinuousMode(!continuousMode)}
                  >
                    <View style={[
                      styles.toggleKnob,
                      continuousMode && styles.toggleKnobActive,
                    ]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingVertical: 20,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarImage: {
    width: 28,
    height: 28,
  },
  messageContent: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userContent: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 4,
  },
  assistantContent: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 4,
  },
  transcriptContent: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: 'rgba(255,255,255,0.9)',
  },
  transcriptText: {
    fontStyle: 'italic',
  },
  orbContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  orbTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#8B5CF6',
  },
  orbRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  orbMain: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.2)',
  },
  orbImage: {
    width: 90,
    height: 90,
  },
  wavesContainer: {
    position: 'absolute',
    bottom: -30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  wave: {
    width: 4,
    height: 30,
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  orbHint: {
    marginTop: 16,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputToggle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingHorizontal: 10,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputHint: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  continuousToggle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  continuousToggleActive: {
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  settingsModal: {
    backgroundColor: '#1E1B4B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  voiceOptions: {
    gap: 12,
    marginBottom: 24,
  },
  voiceOption: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voiceOptionActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  voiceOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  voiceOptionTextActive: {
    color: '#A78BFA',
  },
  voiceOptionDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#10B981',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
});

export default VoiceAssistantScreen;
