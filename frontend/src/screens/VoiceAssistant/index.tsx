/**
 * MYPA Voice Assistant Screen
 * Immersive AI voice-first experience
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StatusBar,
  TouchableOpacity,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VoiceAssistantScreenProps } from './types';
import { useVoiceAssistantData } from './hooks';
import { SettingsModal } from './modals';
import { styles } from './styles';

export function VoiceAssistantScreen({ visible, onClose }: VoiceAssistantScreenProps) {
  const {
    assistantState,
    messages,
    currentTranscript,
    showTextInput,
    textMessage,
    showSettings,
    selectedVoice,
    continuousMode,
    scrollViewRef,
    pulseAnim,
    glowAnim,
    waveAnim1,
    waveAnim2,
    waveAnim3,
    setShowTextInput,
    setTextMessage,
    setShowSettings,
    setSelectedVoice,
    setContinuousMode,
    toggleListening,
    handleSendText,
  } = useVoiceAssistantData({ visible, onClose });

  // Additional animations for immersive feel
  const floatAnim = useRef(new Animated.Value(0)).current;
  const ringScale1 = useRef(new Animated.Value(1)).current;
  const ringScale2 = useRef(new Animated.Value(1)).current;
  const ringScale3 = useRef(new Animated.Value(1)).current;
  const ringOpacity1 = useRef(new Animated.Value(0.15)).current;
  const ringOpacity2 = useRef(new Animated.Value(0.1)).current;
  const ringOpacity3 = useRef(new Animated.Value(0.05)).current;
  const transcriptOpacity = useRef(new Animated.Value(0)).current;

  // Floating animation
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 8,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    float.start();
    return () => float.stop();
  }, []);

  // Ripple rings animation
  useEffect(() => {
    if (assistantState === 'listening' || assistantState === 'speaking') {
      const createRipple = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(scale, {
                toValue: 2.5,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(scale, {
                toValue: 1,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: assistantState === 'listening' ? 0.4 : 0.3,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
      };

      const ripple1 = createRipple(ringScale1, ringOpacity1, 0);
      const ripple2 = createRipple(ringScale2, ringOpacity2, 666);
      const ripple3 = createRipple(ringScale3, ringOpacity3, 1333);

      ripple1.start();
      ripple2.start();
      ripple3.start();

      return () => {
        ripple1.stop();
        ripple2.stop();
        ripple3.stop();
      };
    } else {
      // Reset rings
      ringScale1.setValue(1);
      ringScale2.setValue(1);
      ringScale3.setValue(1);
      ringOpacity1.setValue(0.15);
      ringOpacity2.setValue(0.1);
      ringOpacity3.setValue(0.05);
    }
  }, [assistantState]);

  // Transcript fade animation
  useEffect(() => {
    Animated.timing(transcriptOpacity, {
      toValue: currentTranscript ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [currentTranscript]);

  // Haptic feedback on state change
  useEffect(() => {
    if (assistantState === 'listening') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (assistantState === 'speaking') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [assistantState]);

  const handleOrbPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    toggleListening();
  };

  const getStateColors = (): [string, string, string] => {
    switch (assistantState) {
      case 'listening':
        return ['#0F172A', '#1E3A5F', '#0EA5E9'];
      case 'speaking':
        return ['#0F172A', '#1E1B4B', '#8B5CF6'];
      case 'processing':
        return ['#0F172A', '#1B2E1B', '#10B981'];
      default:
        return ['#0F172A', '#1E1B4B', '#312E81'];
    }
  };

  const getOrbGlowColor = () => {
    switch (assistantState) {
      case 'listening':
        return '#0EA5E9';
      case 'speaking':
        return '#8B5CF6';
      case 'processing':
        return '#10B981';
      default:
        return '#6366F1';
    }
  };

  const getStatusText = () => {
    switch (assistantState) {
      case 'listening':
        return "I'm listening...";
      case 'speaking':
        return 'Speaking...';
      case 'processing':
        return 'Thinking...';
      default:
        return 'Tap to talk';
    }
  };

  // Get last assistant message
  const lastAssistantMessage = [...messages].reverse().find(m => !m.isUser);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.gradientContainer}>
          <LinearGradient
            colors={getStateColors()}
            style={styles.gradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Minimal Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.closeButtonInner}>
                <Ionicons name="chevron-down" size={24} color="rgba(255,255,255,0.8)" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowSettings(true)}
              style={styles.settingsButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          {/* Main Content Area */}
          <View style={styles.mainContent}>
            {/* Last Response - subtle at top */}
            {lastAssistantMessage && !currentTranscript && assistantState === 'idle' && (
              <View style={styles.responseContainer}>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.responseScroll}
                >
                  <Text style={styles.responseText}>{lastAssistantMessage.text}</Text>
                </ScrollView>
              </View>
            )}

            {/* Central Orb Area */}
            <View style={styles.orbSection}>
              {/* Ripple Rings */}
              <Animated.View
                style={[
                  styles.rippleRing,
                  {
                    transform: [{ scale: ringScale1 }],
                    opacity: ringOpacity1,
                    borderColor: getOrbGlowColor(),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.rippleRing,
                  {
                    transform: [{ scale: ringScale2 }],
                    opacity: ringOpacity2,
                    borderColor: getOrbGlowColor(),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.rippleRing,
                  {
                    transform: [{ scale: ringScale3 }],
                    opacity: ringOpacity3,
                    borderColor: getOrbGlowColor(),
                  },
                ]}
              />

              {/* Main Orb */}
              <TouchableOpacity
                onPress={handleOrbPress}
                activeOpacity={0.9}
                style={styles.orbTouchable}
              >
                <Animated.View
                  style={[
                    styles.orbGlow,
                    {
                      backgroundColor: getOrbGlowColor(),
                      opacity: glowAnim,
                      transform: [
                        { scale: pulseAnim },
                        { translateY: floatAnim },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.orbMain,
                    {
                      transform: [
                        { scale: pulseAnim },
                        { translateY: floatAnim },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                    style={styles.orbGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {/* Voice Waves inside orb */}
                    {(assistantState === 'listening' || assistantState === 'speaking') && (
                      <View style={styles.orbWaves}>
                        <Animated.View style={[styles.orbWave, { transform: [{ scaleY: waveAnim1 }] }]} />
                        <Animated.View style={[styles.orbWave, styles.orbWaveTall, { transform: [{ scaleY: waveAnim2 }] }]} />
                        <Animated.View style={[styles.orbWave, styles.orbWaveTallest, { transform: [{ scaleY: waveAnim3 }] }]} />
                        <Animated.View style={[styles.orbWave, styles.orbWaveTall, { transform: [{ scaleY: waveAnim2 }] }]} />
                        <Animated.View style={[styles.orbWave, { transform: [{ scaleY: waveAnim1 }] }]} />
                      </View>
                    )}
                    {assistantState === 'processing' && (
                      <View style={styles.processingDots}>
                        <Animated.View style={[styles.dot, { opacity: waveAnim1 }]} />
                        <Animated.View style={[styles.dot, { opacity: waveAnim2 }]} />
                        <Animated.View style={[styles.dot, { opacity: waveAnim3 }]} />
                      </View>
                    )}
                    {assistantState === 'idle' && (
                      <Ionicons name="mic" size={40} color="rgba(255,255,255,0.6)" />
                    )}
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>

              {/* Status Text */}
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>

            {/* Live Transcript */}
            <Animated.View style={[styles.transcriptContainer, { opacity: transcriptOpacity }]}>
              <Text style={styles.transcriptText}>{currentTranscript}</Text>
            </Animated.View>
          </View>

          {/* Bottom Input Area */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.bottomArea}
          >
            {showTextInput ? (
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type a message..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={textMessage}
                  onChangeText={setTextMessage}
                  onSubmitEditing={handleSendText}
                  returnKeyType="send"
                  autoFocus
                />
                <TouchableOpacity
                  onPress={handleSendText}
                  style={[styles.sendButton, !textMessage.trim() && styles.sendButtonDisabled]}
                  disabled={!textMessage.trim()}
                >
                  <Ionicons name="arrow-up" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.quickActions}>
                <TouchableOpacity
                  onPress={() => setShowTextInput(true)}
                  style={styles.quickAction}
                >
                  <Ionicons name="chatbubble-outline" size={22} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.quickActionText}>Type</Text>
                </TouchableOpacity>
                
                <View style={styles.quickActionDivider} />
                
                <TouchableOpacity
                  onPress={() => setContinuousMode(!continuousMode)}
                  style={styles.quickAction}
                >
                  <Ionicons 
                    name={continuousMode ? 'radio' : 'radio-outline'} 
                    size={22} 
                    color={continuousMode ? '#10B981' : 'rgba(255,255,255,0.7)'} 
                  />
                  <Text style={[styles.quickActionText, continuousMode && styles.quickActionTextActive]}>
                    {continuousMode ? 'Always on' : 'Push to talk'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Settings Modal */}
        <SettingsModal
          visible={showSettings}
          selectedVoice={selectedVoice}
          continuousMode={continuousMode}
          onClose={() => setShowSettings(false)}
          onSelectVoice={setSelectedVoice}
          onToggleContinuous={() => setContinuousMode(!continuousMode)}
        />
      </View>
    </Modal>
  );
}

export default VoiceAssistantScreen;
