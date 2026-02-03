/**
 * DualInputBar - Combined voice + text input for Mylo
 * 
 * Features:
 * - Single-tap for text mode
 * - Long-press for voice recording
 * - Real-time transcription display
 * - Voice activity indicator
 * - Seamless mode switching
 * - AI-powered command processing
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Vibration,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { aiApi, eventsApi } from '../services/api';

type InputMode = 'idle' | 'text' | 'recording' | 'processing';

interface DualInputBarProps {
  onSubmit: (text: string, isVoice: boolean) => void;
  onTranscription?: (text: string) => void;
  placeholder?: string;
  style?: any;
  autoFocus?: boolean;
}

export default function DualInputBar({
  onSubmit,
  onTranscription,
  placeholder = "Type or hold to speak...",
  style,
  autoFocus = false,
}: DualInputBarProps) {
  const [mode, setMode] = useState<InputMode>('idle');
  const [inputText, setInputText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  
  const inputRef = useRef<TextInput>(null);
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // Request audio permissions
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  // Pulse animation for recording
  useEffect(() => {
    if (mode === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [mode]);

  const handleTextFocus = () => {
    if (mode !== 'recording') {
      setMode('text');
      eventsApi.log('input_mode_text');
    }
  };

  const handleTextBlur = () => {
    if (mode === 'text' && !inputText.trim()) {
      setMode('idle');
    }
  };

  const handleTextSubmit = () => {
    if (inputText.trim()) {
      onSubmit(inputText.trim(), false);
      setInputText('');
      setMode('idle');
      Keyboard.dismiss();
    }
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      // Dismiss keyboard if open
      Keyboard.dismiss();
      
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Visual feedback
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setMode('recording');
      setTranscription('');

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);

      eventsApi.log('voice_recording_started');

    } catch (error) {
      console.error('Failed to start recording:', error);
      setMode('idle');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setMode('processing');
      
      // Visual feedback
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // Read the audio file and convert to base64
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          // Send to Whisper for transcription
          const transcriptionResult = await aiApi.transcribe(base64Audio);
          
          if (transcriptionResult.success && transcriptionResult.data?.text) {
            const text = transcriptionResult.data.text;
            setTranscription(text);
            onTranscription?.(text);
            
            // Auto-submit after transcription
            setTimeout(() => {
              onSubmit(text, true);
              setTranscription('');
              setMode('idle');
            }, 500);

            eventsApi.log('voice_transcribed', {
              textLength: text.length,
            });
          } else {
            setMode('idle');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        };
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setMode('idle');
    }
  };

  const handlePressIn = () => {
    isLongPress.current = false;
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      startRecording();
    }, 300);
  };

  const handlePressOut = () => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // If was recording, stop
    if (mode === 'recording') {
      stopRecording();
    }
    // If was a tap (not long press), focus text input
    else if (!isLongPress.current && mode === 'idle') {
      inputRef.current?.focus();
    }
  };

  const getMicButtonContent = () => {
    switch (mode) {
      case 'recording':
        return (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
            </View>
          </Animated.View>
        );
      case 'processing':
        return <ActivityIndicator size="small" color="#8B5CF6" />;
      default:
        return <Ionicons name="mic" size={24} color="#8B5CF6" />;
    }
  };

  const getPlaceholderText = () => {
    switch (mode) {
      case 'recording':
        return transcription || "Listening...";
      case 'processing':
        return "Processing...";
      default:
        return placeholder;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        {/* Glow effect when recording */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowAnim,
            },
          ]}
        />

        <View style={styles.inputRow}>
          {/* Text Input */}
          <Animated.View style={[styles.inputWrapper, { opacity: textOpacity }]}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder={getPlaceholderText()}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={mode === 'recording' || mode === 'processing' ? transcription : inputText}
              onChangeText={setInputText}
              onFocus={handleTextFocus}
              onBlur={handleTextBlur}
              onSubmitEditing={handleTextSubmit}
              returnKeyType="send"
              autoCapitalize="sentences"
              editable={mode !== 'recording' && mode !== 'processing'}
              autoFocus={autoFocus}
            />
          </Animated.View>

          {/* Voice/Send Button */}
          {inputText.trim() && mode === 'text' ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleTextSubmit}
            >
              <Ionicons name="arrow-up-circle" size={32} color="#8B5CF6" />
            </TouchableOpacity>
          ) : (
            <TouchableWithoutFeedback
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View
                style={[
                  styles.micButton,
                  mode === 'recording' && styles.micButtonActive,
                ]}
              >
                {getMicButtonContent()}
              </Animated.View>
            </TouchableWithoutFeedback>
          )}
        </View>

        {/* Mode indicator */}
        {mode === 'recording' && (
          <View style={styles.modeIndicator}>
            <Text style={styles.modeText}>Release to send • Slide left to cancel</Text>
          </View>
        )}
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  textInput: {
    fontSize: 16,
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  sendButton: {
    padding: 8,
  },
  recordingIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  modeIndicator: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
});
