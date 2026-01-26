import React, { useState, useEffect, useRef } from 'react';
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
import { colors } from '../styles/colors';

const { width, height } = Dimensions.get('window');

interface ListeningScreenProps {
  visible: boolean;
  onClose: () => void;
}

interface Transcript {
  id: number;
  text: string;
  isUser: boolean;
  time: string;
}

export function ListeningScreen({ visible, onClose }: ListeningScreenProps) {
  const [isListening, setIsListening] = useState(true);
  const [dots, setDots] = useState('.');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textMessage, setTextMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState('English');
  const [speed, setSpeed] = useState('Normal');
  const [voice, setVoice] = useState('Nova');
  
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  const [transcripts, setTranscripts] = useState<Transcript[]>([
    { id: 1, text: "Hey MYPA! What's on my schedule today?", isUser: true, time: "Just now" },
    { id: 2, text: "Good morning! You have 4 tasks today. Your first meeting is at 10 AM - Team standup.", isUser: false, time: "Just now" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

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

  const handleSendText = () => {
    if (!textMessage.trim()) return;
    
    setTranscripts(prev => [...prev, {
      id: prev.length + 1,
      text: textMessage,
      isUser: true,
      time: "Just now"
    }]);
    setTextMessage('');
    
    setTimeout(() => {
      setTranscripts(prev => [...prev, {
        id: prev.length + 1,
        text: "Got it! I'll help you with that. Is there anything else?",
        isUser: false,
        time: "Just now"
      }]);
    }, 1500);
  };

  const SettingsModal = () => (
    <Modal
      visible={showSettings}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSettings(false)}
    >
      <View style={styles.settingsOverlay}>
        <TouchableOpacity 
          style={styles.settingsBackdrop} 
          activeOpacity={1}
          onPress={() => setShowSettings(false)} 
        />
        <View style={styles.settingsModal}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Voice Settings</Text>
            <TouchableOpacity 
              style={styles.settingsCloseBtn}
              onPress={() => setShowSettings(false)}
            >
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.settingsContent}>
            <View style={styles.settingSection}>
              <View style={styles.settingSectionHeader}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(59,130,246,0.2)' }]}>
                  <Ionicons name="globe-outline" size={20} color="#60A5FA" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Language</Text>
                  <Text style={styles.settingDesc}>Choose your language</Text>
                </View>
              </View>
              <View style={styles.settingOptions}>
                {['English', 'Spanish', 'French', 'Arabic'].map(lang => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.settingOption,
                      language === lang && styles.settingOptionActive
                    ]}
                    onPress={() => setLanguage(lang)}
                  >
                    <Text style={[
                      styles.settingOptionText,
                      language === lang && styles.settingOptionTextActive
                    ]}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingSection}>
              <View style={styles.settingSectionHeader}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(245,158,11,0.2)' }]}>
                  <Ionicons name="speedometer-outline" size={20} color="#FBBF24" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Speed</Text>
                  <Text style={styles.settingDesc}>How fast MYPA speaks</Text>
                </View>
              </View>
              <View style={styles.settingOptions}>
                {['Slow', 'Normal', 'Fast'].map(spd => (
                  <TouchableOpacity
                    key={spd}
                    style={[
                      styles.settingOption,
                      styles.settingOptionFlex,
                      speed === spd && { backgroundColor: '#F59E0B' }
                    ]}
                    onPress={() => setSpeed(spd)}
                  >
                    <Text style={[
                      styles.settingOptionText,
                      speed === spd && styles.settingOptionTextActive
                    ]}>{spd}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingSection}>
              <View style={styles.settingSectionHeader}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(139,92,246,0.2)' }]}>
                  <Ionicons name="volume-high-outline" size={20} color="#A78BFA" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Voice</Text>
                  <Text style={styles.settingDesc}>MYPA's voice style</Text>
                </View>
              </View>
              <View style={styles.voiceOptions}>
                {[
                  { id: 'Nova', desc: 'Warm & friendly' },
                  { id: 'Aria', desc: 'Calm & professional' },
                  { id: 'Echo', desc: 'Energetic & upbeat' },
                ].map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.voiceOption,
                      voice === v.id && styles.voiceOptionActive
                    ]}
                    onPress={() => setVoice(v.id)}
                  >
                    <View>
                      <Text style={[
                        styles.voiceName,
                        voice === v.id && { color: '#C4B5FD' }
                      ]}>{v.id}</Text>
                      <Text style={styles.voiceDesc}>{v.desc}</Text>
                    </View>
                    {voice === v.id && (
                      <Ionicons name="checkmark" size={20} color="#A78BFA" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.settingsDoneBtn}
            onPress={() => setShowSettings(false)}
          >
            <Text style={styles.settingsDoneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.backgroundGlow} />
        
        <View style={styles.header}>
          <View>
            <View style={styles.activeIndicator}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
            <Text style={styles.title}>I'm{'\n'}Listening{dots}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => setShowSettings(true)}
            >
              <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.orbSection}>
          <Animated.View style={[styles.pulseRing, styles.pulseRing1, { transform: [{ scale: pulseAnim1 }] }]} />
          <Animated.View style={[styles.pulseRing, styles.pulseRing2, { transform: [{ scale: pulseAnim2 }] }]} />
          <Animated.View style={[styles.pulseRing, styles.pulseRing3, { transform: [{ scale: pulseAnim3 }] }]} />
          <Animated.View style={[styles.orbContainer, { transform: [{ translateY: floatAnim }] }]}>
            <Image
              source={require('../../assets/mypa-orb.png')}
              style={styles.orbImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <ScrollView style={styles.transcriptsContainer} showsVerticalScrollIndicator={false}>
          {transcripts.map((t, i) => (
            <View 
              key={t.id}
              style={[
                styles.transcript,
                t.isUser ? styles.transcriptUser : styles.transcriptAI,
                { opacity: 0.85 - (transcripts.length - 1 - i) * 0.15 }
              ]}
            >
              <Text style={styles.transcriptText}>{t.text}</Text>
              <Text style={styles.transcriptTime}>{t.time}</Text>
            </View>
          ))}
          
          <View style={styles.thinkingIndicator}>
            <MaterialCommunityIcons name="shimmer" size={12} color={colors.primary} />
            <Text style={styles.thinkingText}>MYPA is thinking...</Text>
          </View>
        </ScrollView>

        {showTextInput && (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.textInputContainer}
          >
            <View style={styles.textInputWrapper}>
              <TextInput
                style={styles.textInput}
                value={textMessage}
                onChangeText={setTextMessage}
                placeholder="Type your message..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                onSubmitEditing={handleSendText}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendBtn, !textMessage.trim() && styles.sendBtnDisabled]}
                onPress={handleSendText}
                disabled={!textMessage.trim()}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlBtn, !isListening && styles.controlBtnMuted]}
            onPress={() => setIsListening(!isListening)}
          >
            <Ionicons 
              name={isListening ? "mic" : "mic-off"} 
              size={20} 
              color={isListening ? "rgba(255,255,255,0.8)" : "#F87171"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.endCallBtn} onPress={onClose}>
            <Ionicons name="call" size={28} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlBtn, showTextInput && styles.controlBtnActive]}
            onPress={() => setShowTextInput(!showTextInput)}
          >
            {showTextInput ? (
              <Ionicons name="close" size={20} color={colors.primary} />
            ) : (
              <Ionicons name="keypad-outline" size={20} color="rgba(255,255,255,0.8)" />
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.tipText}>
          {showTextInput 
            ? "Type your message or tap × to go back to voice"
            : "Speak naturally — or tap keyboard to type instead"
          }
        </Text>
        
        <SettingsModal />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  backgroundGlow: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(139,92,246,0.15)',
    transform: [{ translateX: -150 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  activeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 38,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  orbSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    marginVertical: 16,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 1,
  },
  pulseRing1: {
    width: 180,
    height: 180,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pulseRing2: {
    width: 150,
    height: 150,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pulseRing3: {
    width: 120,
    height: 120,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  orbContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  transcriptsContainer: {
    flex: 1,
    marginBottom: 16,
  },
  transcript: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '85%',
  },
  transcriptUser: {
    backgroundColor: 'rgba(139,92,246,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    alignSelf: 'flex-end',
  },
  transcriptAI: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
  },
  transcriptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  transcriptTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 4,
  },
  thinkingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  thinkingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  textInputContainer: {
    marginBottom: 12,
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  controlBtnMuted: {
    backgroundColor: 'rgba(248,113,113,0.2)',
    borderColor: 'rgba(248,113,113,0.3)',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderColor: 'rgba(139,92,246,0.3)',
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tipText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 24,
  },
  settingsOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  settingsModal: {
    width: width - 32,
    maxHeight: height * 0.7,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsContent: {
    padding: 16,
  },
  settingSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  settingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  settingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  settingOptionFlex: {
    flex: 1,
    alignItems: 'center',
  },
  settingOptionActive: {
    backgroundColor: '#3B82F6',
  },
  settingOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  settingOptionTextActive: {
    color: '#FFFFFF',
  },
  voiceOptions: {
    gap: 8,
  },
  voiceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  voiceOptionActive: {
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderColor: 'rgba(139,92,246,0.3)',
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  voiceDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  settingsDoneBtn: {
    margin: 16,
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  settingsDoneBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
