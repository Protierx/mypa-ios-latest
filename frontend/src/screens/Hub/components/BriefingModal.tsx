/**
 * BriefingModal Component
 * Full-screen AI briefing experience
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { X, SkipForward, Rocket, Sparkles } from 'lucide-react-native';
import type { BriefingItem } from '../hooks';

interface BriefingModalProps {
  visible: boolean;
  briefingStep: number;
  isSpeaking: boolean;
  briefingItems: BriefingItem[];
  orbBreathAnim: Animated.Value;
  waveAnims: Animated.Value[];
  onClose: () => void;
  onSkip: () => void;
}

export function BriefingModal({
  visible,
  briefingStep,
  isSpeaking,
  briefingItems,
  orbBreathAnim,
  waveAnims,
  onClose,
  onSkip,
}: BriefingModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.briefingModal}>
        <LinearGradient
          colors={['#1e1b4b', '#0f0a1e', '#030014']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Close Button */}
        <SafeAreaView style={styles.briefingModalSafe} edges={['top']}>
          <View style={styles.briefingModalHeader}>
            <Pressable
              onPress={onSkip}
              style={({ pressed }) => [
                styles.briefingSkipButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <BlurView intensity={20} tint="dark" style={styles.briefingButtonBlur}>
                <SkipForward color="rgba(255,255,255,0.8)" size={16} />
                <Text style={styles.briefingSkipText}>Skip</Text>
              </BlurView>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.briefingCloseButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <BlurView intensity={20} tint="dark" style={styles.briefingCloseBlur}>
                <X color="rgba(255,255,255,0.8)" size={20} />
              </BlurView>
            </Pressable>
          </View>
        </SafeAreaView>

        <View style={styles.briefingModalContent}>
          {/* Speaking Orb */}
          <View style={styles.speakingOrbContainer}>
            {isSpeaking && (
              <>
                <Animated.View style={[styles.orbPing, { opacity: 0.1 }]} />
                <Animated.View style={[styles.orbPulse, { opacity: 0.2 }]} />
              </>
            )}
            <Animated.View
              style={[
                styles.speakingOrb,
                {
                  transform: [{ scale: isSpeaking ? 1.05 : orbBreathAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['#a78bfa', '#8b5cf6', '#6366f1']}
                style={styles.speakingOrbGradient}
              >
                <View style={styles.speakingOrbShine} />
                {isSpeaking ? (
                  <View style={styles.waveformContainer}>
                    {waveAnims.map((anim, i) => (
                      <Animated.View
                        key={i}
                        style={[
                          styles.waveBar,
                          { height: anim },
                        ]}
                      />
                    ))}
                  </View>
                ) : (
                  <Sparkles color="#fff" size={48} />
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          <Text style={styles.briefingLabel}>AI Life Organizer</Text>

          {/* Briefing Messages */}
          <View style={styles.briefingMessages}>
            {briefingItems.slice(Math.max(0, briefingStep - 1), briefingStep + 1).map((item, index) => {
              const actualIndex = Math.max(0, briefingStep - 1) + index;
              const isCurrent = actualIndex === briefingStep;
              const ItemIcon = item.icon;

              return (
                <Animated.View
                  key={actualIndex}
                  style={[
                    styles.briefingMessage,
                    isCurrent && styles.briefingMessageActive,
                    !isCurrent && styles.briefingMessageInactive,
                  ]}
                >
                  <BlurView intensity={30} tint="dark" style={styles.briefingMessageBlur}>
                    <View style={styles.briefingMessageIcon}>
                      <ItemIcon color="#fff" size={20} />
                    </View>
                    <Text style={styles.briefingMessageText}>{item.text}</Text>
                  </BlurView>
                </Animated.View>
              );
            })}
          </View>

          {/* Progress Dots */}
          <View style={styles.briefingProgress}>
            {briefingItems.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.briefingDot,
                  index <= briefingStep ? styles.briefingDotActive : styles.briefingDotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Bottom Button */}
        <SafeAreaView style={styles.briefingModalBottom} edges={['bottom']}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.briefingDoneButton,
              pressed && styles.buttonPressed,
            ]}
          >
            {briefingStep >= briefingItems.length - 1 ? (
              <View style={styles.briefingDoneContent}>
                <Rocket color="#1e293b" size={20} />
                <Text style={styles.briefingDoneText}>Let's Crush Today!</Text>
              </View>
            ) : (
              <Text style={styles.briefingDoneText}>Close Briefing</Text>
            )}
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  briefingModal: {
    flex: 1,
  },
  briefingModalSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  briefingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  briefingSkipButton: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  briefingButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  briefingSkipText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  briefingCloseButton: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  briefingCloseBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  briefingModalContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  speakingOrbContainer: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbPing: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#8b5cf6',
  },
  orbPulse: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#8b5cf6',
  },
  speakingOrb: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
  },
  speakingOrbGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakingOrbShine: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    width: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  briefingLabel: {
    color: '#c4b5fd',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 24,
  },
  briefingMessages: {
    width: '100%',
    minHeight: 160,
  },
  briefingMessage: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  briefingMessageActive: {
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.5)',
  },
  briefingMessageInactive: {
    opacity: 0.4,
    transform: [{ scale: 0.95 }],
  },
  briefingMessageBlur: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  briefingMessageIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingMessageText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  briefingProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  briefingDot: {
    height: 4,
    borderRadius: 2,
  },
  briefingDotActive: {
    width: 16,
    backgroundColor: '#a78bfa',
  },
  briefingDotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  briefingModalBottom: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  briefingDoneButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingDoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  briefingDoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
