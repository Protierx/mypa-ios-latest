/**
 * TranscriptOverlay — Floating glass transcript/response band.
 *
 * Shows:
 *  - User's live transcript (listening)
 *  - "Thinking…" indicator (processing)
 *  - AI response text (speaking)
 *  - Error/timeout/offline messages
 *
 * Positioned above the bottom action pills. Uses BlurView for
 * a frosted glass effect on the dark background.
 */

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInUp,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

import { useVoice } from '../../contexts/VoiceContext';
import type { VoiceState } from '../../contexts/VoiceContext';

interface TranscriptOverlayProps {
  voiceState: VoiceState;
}

export function TranscriptOverlay({ voiceState }: TranscriptOverlayProps) {
  const voice = useVoice();
  const { width } = useWindowDimensions();

  // Don't render if idle or no relevant content
  const isActive = voiceState !== 'idle';
  
  if (!isActive) return null;

  const renderContent = () => {
    switch (voiceState) {
      case 'listening':
        return (
          <View style={s.row}>
            <View style={s.liveIndicator}>
              <View style={s.liveDot} />
              <Text style={s.liveLabel}>Listening</Text>
            </View>
            {voice.transcript ? (
              <Text style={s.transcriptText} numberOfLines={3}>
                {voice.transcript}
              </Text>
            ) : (
              <Text style={s.hintText}>Speak now…</Text>
            )}
          </View>
        );

      case 'processing':
        return (
          <View style={s.row}>
            <Ionicons name="sparkles" size={18} color="rgba(180, 160, 255, 0.9)" />
            <Text style={s.processingText}>Thinking…</Text>
            {voice.transcript ? (
              <Text style={s.quotedText} numberOfLines={2}>
                "{voice.transcript}"
              </Text>
            ) : null}
          </View>
        );

      case 'speaking':
        return (
          <View style={s.column}>
            <View style={s.speakingHeader}>
              <Ionicons name="volume-high" size={16} color="rgba(160, 140, 255, 0.8)" />
              <Text style={s.speakingLabel}>MYPA</Text>
            </View>
            {voice.aiResponse ? (
              <Text style={s.responseText} numberOfLines={5}>
                {voice.aiResponse}
              </Text>
            ) : null}
          </View>
        );

      case 'timeout':
        return (
          <View style={s.row}>
            <Ionicons name="timer-outline" size={18} color="rgba(255, 180, 100, 0.9)" />
            <Text style={s.warningText}>
              {voice.aiResponse || "Didn't catch that. Tap to retry."}
            </Text>
          </View>
        );

      case 'error':
        return (
          <View style={s.row}>
            <Ionicons name="warning-outline" size={18} color="rgba(255, 120, 120, 0.9)" />
            <Text style={s.errorText}>
              {voice.aiResponse || 'Something went wrong. Tap to retry.'}
            </Text>
          </View>
        );

      case 'offline':
        return (
          <View style={s.row}>
            <Ionicons name="cloud-offline-outline" size={18} color="rgba(255, 255, 255, 0.5)" />
            <Text style={s.hintText}>No connection. Type below.</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Animated.View
      entering={SlideInDown.duration(350).springify().damping(18)}
      exiting={SlideOutDown.duration(250)}
      style={[s.wrapper, { width: width - 32 }]}
    >
      <BlurView intensity={40} tint="dark" style={s.blur}>
        <View style={s.content}>
          {renderContent()}
        </View>
      </BlurView>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  blur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 12, 30, 0.55)',
  },
  row: {
    flexDirection: 'column',
    gap: 8,
  },
  column: {
    flexDirection: 'column',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
  },
  liveLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(160, 140, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  transcriptText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 26,
  },
  hintText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(180, 160, 255, 0.9)',
  },
  quotedText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  speakingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speakingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(160, 140, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  responseText: {
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 25,
  },
  warningText: {
    fontSize: 15,
    color: 'rgba(255, 200, 120, 0.9)',
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(255, 140, 140, 0.9)',
  },
});
