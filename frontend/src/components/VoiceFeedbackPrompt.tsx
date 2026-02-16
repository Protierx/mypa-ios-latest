/**
 * Voice Feedback Prompt — "Was that right?"
 *
 * Small bottom toast shown after every 5th voice command.
 * Captures user satisfaction to measure voice quality during beta.
 * Auto-dismisses after 5 seconds.
 *
 * Reference: PRD Section 17 (Beta Quality Signals)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  SlideInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { eventLogger } from '../services/eventLogger';
import { brand, text as textTokens, bg } from '../styles/colors';
import { shadows, radius } from '../styles/theme';

interface VoiceFeedbackPromptProps {
  visible: boolean;
  action: string;
  confidence: number;
  onDismiss: () => void;
}

// Beta feature gate — set to false to disable
const VOICE_FEEDBACK_ENABLED = true;
const AUTO_DISMISS_MS = 5000;

export function VoiceFeedbackPrompt({
  visible,
  action,
  confidence,
  onDismiss,
}: VoiceFeedbackPromptProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(() => {
        onDismiss();
      }, AUTO_DISMISS_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, onDismiss]);

  if (!VOICE_FEEDBACK_ENABLED || !visible) return null;

  const handleThumbsUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    eventLogger.log('voice_feedback', {
      correct: true,
      action,
      confidence,
    });
    onDismiss();
  };

  const handleThumbsDown = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    eventLogger.log('voice_feedback', {
      correct: false,
      action,
      confidence,
    });
    onDismiss();
  };

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={FadeOutDown.duration(200)}
      style={styles.container}
    >
      <Text style={styles.label}>Was that right?</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonUp]}
          onPress={handleThumbsUp}
          activeOpacity={0.7}
          accessibilityLabel="Yes, correct"
          accessibilityRole="button"
        >
          <Ionicons name="thumbs-up" size={18} color="#22C55E" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonDown]}
          onPress={handleThumbsDown}
          activeOpacity={0.7}
          accessibilityLabel="No, incorrect"
          accessibilityRole="button"
        >
          <Ionicons name="thumbs-down" size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: bg.elevated,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: textTokens.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonUp: {
    backgroundColor: '#ECFDF5',
  },
  buttonDown: {
    backgroundColor: '#FEF2F2',
  },
});
