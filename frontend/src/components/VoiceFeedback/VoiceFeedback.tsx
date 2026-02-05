/**
 * Voice Feedback Component
 * 
 * Visual feedback during voice interactions.
 * Shows transcript, AI response, and state indicators.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { VoiceState } from '../LivingBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VoiceFeedbackProps {
  voiceState: VoiceState;
  transcript: string;
  aiResponse: string;
  audioLevel: number;
  onCancel?: () => void;
}

// Waveform bar component
function WaveformBar({ index, audioLevel, isActive }: { index: number; audioLevel: number; isActive: boolean }) {
  const height = useSharedValue(4);
  
  useEffect(() => {
    if (isActive) {
      // Animate based on audio level with some variation per bar
      const baseHeight = 4 + (audioLevel * 30);
      const variation = Math.sin(index * 0.8) * 8;
      height.value = withSpring(baseHeight + variation, { damping: 15, stiffness: 300 });
    } else {
      height.value = withTiming(4, { duration: 300 });
    }
  }, [audioLevel, isActive]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));
  
  return (
    <Animated.View
      style={[
        styles.waveformBar,
        animatedStyle,
      ]}
    />
  );
}

// Processing dots animation
function ProcessingDots() {
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.3);
  const opacity3 = useSharedValue(0.3);
  
  useEffect(() => {
    opacity1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      ),
      -1
    );
    setTimeout(() => {
      opacity2.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1
      );
    }, 150);
    setTimeout(() => {
      opacity3.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1
      );
    }, 300);
  }, []);
  
  const dot1Style = useAnimatedStyle(() => ({ opacity: opacity1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: opacity2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: opacity3.value }));
  
  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, dot1Style]} />
      <Animated.View style={[styles.dot, dot2Style]} />
      <Animated.View style={[styles.dot, dot3Style]} />
    </View>
  );
}

export function VoiceFeedback({ 
  voiceState, 
  transcript, 
  aiResponse, 
  audioLevel,
  onCancel 
}: VoiceFeedbackProps) {
  if (voiceState === 'idle') return null;
  
  const isListening = voiceState === 'listening';
  const isProcessing = voiceState === 'processing';
  const isSpeaking = voiceState === 'speaking';
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
    >
      <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
        {/* State indicator */}
        <View style={styles.stateContainer}>
          {isListening && (
            <View style={styles.waveformContainer}>
              {Array.from({ length: 12 }).map((_, i) => (
                <WaveformBar key={i} index={i} audioLevel={audioLevel} isActive={isListening} />
              ))}
            </View>
          )}
          
          {isProcessing && (
            <View style={styles.processingContainer}>
              <ProcessingDots />
              <Text style={styles.processingText}>Thinking...</Text>
            </View>
          )}
          
          {isSpeaking && (
            <View style={styles.speakingContainer}>
              <Ionicons name="volume-high" size={20} color="#a855f7" />
              <Text style={styles.speakingText}>MYPA</Text>
            </View>
          )}
        </View>
        
        {/* Transcript/Response */}
        <View style={styles.textContainer}>
          {isListening && transcript && (
            <Text style={styles.transcript}>{transcript}</Text>
          )}
          
          {isListening && !transcript && (
            <Text style={styles.hintText}>Listening...</Text>
          )}
          
          {isProcessing && transcript && (
            <Text style={styles.transcript}>"{transcript}"</Text>
          )}
          
          {isSpeaking && aiResponse && (
            <Text style={styles.response}>{aiResponse}</Text>
          )}
        </View>
        
        {/* Cancel button */}
        {(isListening || isProcessing) && onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Ionicons name="close-circle" size={28} color="#6b7280" />
          </TouchableOpacity>
        )}
        
        {/* Hint text */}
        <Text style={styles.footerHint}>
          {isListening ? 'Tap anywhere to send' : isSpeaking ? 'Tap to stop' : ''}
        </Text>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  blurContainer: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
  },
  stateContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 3,
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#a855f7',
    borderRadius: 2,
    minHeight: 4,
  },
  processingContainer: {
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a855f7',
  },
  processingText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  speakingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speakingText: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '600',
  },
  textContainer: {
    alignItems: 'center',
    minHeight: 40,
  },
  transcript: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  hintText: {
    color: '#6b7280',
    fontSize: 16,
    fontStyle: 'italic',
  },
  response: {
    color: '#e5e7eb',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  cancelButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
  },
  footerHint: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default VoiceFeedback;
