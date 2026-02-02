/**
 * BriefingModal Component
 * Interactive, immersive AI briefing experience with auto-play voice
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Rocket,
  Volume2,
  VolumeX,
  Pause,
  Play,
} from 'lucide-react-native';
import type { BriefingItem } from '../hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BriefingModalProps {
  visible: boolean;
  briefingStep: number;
  isSpeaking: boolean;
  briefingItems: BriefingItem[];
  orbBreathAnim: Animated.Value;
  waveAnims: Animated.Value[];
  onClose: () => void;
  onSkip: () => void;
  onStepChange?: (step: number) => void;
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
  onStepChange,
}: BriefingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setIsPaused(false);
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
      cardScale.setValue(1);
      progressAnim.setValue(0);
    }
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, [visible]);

  // Auto-advance with voice timing
  useEffect(() => {
    if (visible && !isPaused && currentStep < briefingItems.length - 1) {
      const currentDelay = briefingItems[currentStep]?.delay || 3000;
      
      autoAdvanceTimer.current = setTimeout(() => {
        goNext();
      }, currentDelay);

      return () => {
        if (autoAdvanceTimer.current) {
          clearTimeout(autoAdvanceTimer.current);
        }
      };
    }
  }, [currentStep, isPaused, visible]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / briefingItems.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, briefingItems.length]);

  const animateToStep = (newStep: number, direction: 'left' | 'right') => {
    // Clear any pending auto-advance
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }

    const startX = direction === 'left' ? SCREEN_WIDTH * 0.3 : -SCREEN_WIDTH * 0.3;
    
    // Fade out current
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.92,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(newStep);
      slideAnim.setValue(startX);
      
      // Slide in new
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    });
    
    onStepChange?.(newStep);
  };

  const goNext = () => {
    if (currentStep < briefingItems.length - 1) {
      animateToStep(currentStep + 1, 'left');
    } else {
      // Last step - close
      onClose();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      animateToStep(currentStep - 1, 'right');
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
  };

  // Swipe gesture handler with live tracking
  const swipeX = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15;
      },
      onPanResponderGrant: () => {
        // Pause auto-advance when user starts swiping
        if (autoAdvanceTimer.current) {
          clearTimeout(autoAdvanceTimer.current);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        // Live swipe feedback
        swipeX.setValue(gestureState.dx * 0.3);
      },
      onPanResponderRelease: (_, gestureState) => {
        swipeX.setValue(0);
        
        if (gestureState.dx < -60) {
          // Swipe left - go next
          goNext();
        } else if (gestureState.dx > 60) {
          // Swipe right - go back
          goPrev();
        }
      },
    })
  ).current;

  const currentItem = briefingItems[currentStep];
  const ItemIcon = currentItem?.icon;
  const isLastStep = currentStep === briefingItems.length - 1;
  const isFirstStep = currentStep === 0;

  // Get motivational colors based on step
  const getStepColors = (step: number): [string, string] => {
    const colors: [string, string][] = [
      ['#7c3aed', '#a855f7'], // Purple - Welcome
      ['#3b82f6', '#60a5fa'], // Blue - Tasks
      ['#f59e0b', '#fbbf24'], // Amber - Focus time
      ['#10b981', '#34d399'], // Green - Next task
      ['#ec4899', '#f472b6'], // Pink - Progress
      ['#f97316', '#fb923c'], // Orange - Streak
      ['#8b5cf6', '#a78bfa'], // Violet - Final
    ];
    return colors[step % colors.length];
  };

  const [gradientStart, gradientEnd] = getStepColors(currentStep);

  if (!currentItem) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Background gradient that changes with step */}
        <LinearGradient
          colors={[gradientStart + '15', '#f8fafc', '#ffffff']}
          locations={[0, 0.3, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Header */}
        <SafeAreaView edges={['top']} style={styles.header}>
          <View style={styles.headerContent}>
            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  { 
                    backgroundColor: gradientStart,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]} 
              />
            </View>

            <View style={styles.headerRow}>
              {/* Pause/Play button */}
              <Pressable
                onPress={togglePause}
                style={({ pressed }) => [
                  styles.pauseButton,
                  { borderColor: gradientStart + '40' },
                  pressed && styles.buttonPressed,
                ]}
              >
                {isPaused ? (
                  <Play color={gradientStart} size={16} fill={gradientStart} />
                ) : (
                  <Pause color={gradientStart} size={16} />
                )}
                <Text style={[styles.pauseButtonText, { color: gradientStart }]}>
                  {isPaused ? 'Resume' : 'Pause'}
                </Text>
              </Pressable>

              {/* Controls */}
              <View style={styles.headerControls}>
                <Pressable
                  onPress={() => setIsMuted(!isMuted)}
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  {isMuted ? (
                    <VolumeX color="#64748b" size={20} />
                  ) : (
                    <Volume2 color="#64748b" size={20} />
                  )}
                </Pressable>
                
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <X color="#64748b" size={22} />
                </Pressable>
              </View>
            </View>
          </View>
        </SafeAreaView>

        {/* Main Content - Tappable to advance */}
        <Pressable 
          style={styles.content} 
          onPress={goNext}
          {...panResponder.panHandlers}
        >
          {/* MYPA Orb */}
          <View style={styles.orbSection}>
            <Animated.View 
              style={[
                styles.orbGlow,
                { 
                  backgroundColor: gradientStart,
                  opacity: isSpeaking ? 0.25 : 0.12,
                  transform: [{ scale: isSpeaking ? 1.2 : 1 }],
                }
              ]} 
            />
            <Animated.View
              style={[
                styles.orbContainer,
                {
                  transform: [
                    { scale: orbBreathAnim },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../../../assets/mypa-orb.png')}
                style={styles.orbImage}
                resizeMode="contain"
              />
              
              {/* Speaking indicator */}
              {isSpeaking && !isPaused && (
                <View style={styles.speakingIndicator}>
                  <View style={styles.waveformContainer}>
                    {waveAnims.map((anim, i) => (
                      <Animated.View
                        key={i}
                        style={[
                          styles.waveBar,
                          { 
                            height: anim,
                            backgroundColor: gradientStart,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              )}
            </Animated.View>
          </View>

          {/* Message Card */}
          <Animated.View 
            style={[
              styles.messageCard,
              {
                opacity: fadeAnim,
                transform: [
                  { translateX: Animated.add(slideAnim, swipeX) },
                  { scale: cardScale },
                ],
              }
            ]}
          >
            <LinearGradient
              colors={[gradientStart, gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.messageIconContainer}
            >
              {ItemIcon && <ItemIcon color="#fff" size={28} />}
            </LinearGradient>
            
            <Text style={styles.messageText}>{currentItem.text}</Text>
            
            {/* Subtle swipe indicators */}
            <View style={styles.swipeIndicators}>
              <ChevronLeft 
                color={isFirstStep ? '#e2e8f0' : '#cbd5e1'} 
                size={20} 
              />
              <Text style={styles.tapHint}>Tap or swipe</Text>
              <ChevronRight 
                color={isLastStep ? '#e2e8f0' : '#cbd5e1'} 
                size={20} 
              />
            </View>
          </Animated.View>
        </Pressable>

        {/* Bottom - Clean dots and CTA on last step */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          {/* Dot indicators - tappable */}
          <View style={styles.dotsContainer}>
            {briefingItems.map((_, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  if (index !== currentStep) {
                    animateToStep(index, index > currentStep ? 'left' : 'right');
                  }
                }}
                hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                style={({ pressed }) => [
                  styles.dot,
                  index === currentStep && [styles.dotActive, { backgroundColor: gradientStart }],
                  index < currentStep && [styles.dotCompleted, { backgroundColor: gradientStart + '60' }],
                  pressed && styles.dotPressed,
                ]}
              />
            ))}
          </View>

          {/* Final CTA only on last step */}
          {isLastStep && (
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <LinearGradient
                colors={[gradientStart, gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Rocket color="#fff" size={20} />
                <Text style={styles.ctaText}>Let's Crush Today!</Text>
              </LinearGradient>
            </Pressable>
          )}

          {/* Skip link - always visible except last step */}
          {!isLastStep && (
            <Pressable
              onPress={onSkip}
              style={({ pressed }) => [
                styles.skipLink,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.skipLinkText}>Skip briefing</Text>
            </Pressable>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
  },
  headerContent: {
    paddingTop: 8,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pauseButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  orbSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  orbGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  orbContainer: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbImage: {
    width: 150,
    height: 150,
  },
  speakingIndicator: {
    position: 'absolute',
    bottom: -24,
    alignItems: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 28,
  },
  waveBar: {
    width: 5,
    borderRadius: 3,
    minHeight: 10,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 10,
  },
  messageIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  messageText: {
    fontSize: 19,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 16,
  },
  swipeIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  tapHint: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
  dotCompleted: {
    // Color set dynamically
  },
  dotPressed: {
    opacity: 0.7,
  },
  ctaButton: {
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 40,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  skipLink: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
