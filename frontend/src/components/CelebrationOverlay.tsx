/**
 * CelebrationOverlay - Fun celebration animations for achievements
 * 
 * Features:
 * - Confetti burst animation
 * - Level up glow effect
 * - Streak milestone celebration
 * - Achievement unlock animation
 * - Sound effects (optional)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CelebrationType = 
  | 'task_completed'
  | 'streak_milestone'
  | 'level_up'
  | 'achievement_unlocked'
  | 'challenge_won'
  | 'feature_unlocked';

interface CelebrationConfig {
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  confettiColors: string[];
  icon?: string;
}

const CELEBRATION_CONFIGS: Record<CelebrationType, CelebrationConfig> = {
  task_completed: {
    emoji: '✓',
    title: 'Task Complete!',
    subtitle: '+10 XP',
    color: '#10B981',
    confettiColors: ['#10B981', '#34D399', '#6EE7B7'],
  },
  streak_milestone: {
    emoji: '🔥',
    title: 'Streak Milestone!',
    subtitle: 'Keep it going!',
    color: '#F59E0B',
    confettiColors: ['#F59E0B', '#FBBF24', '#FCD34D', '#EF4444'],
  },
  level_up: {
    emoji: '⬆️',
    title: 'Level Up!',
    subtitle: 'New abilities unlocked',
    color: '#8B5CF6',
    confettiColors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#E879F9'],
  },
  achievement_unlocked: {
    emoji: '🏆',
    title: 'Achievement Unlocked!',
    subtitle: 'You earned a badge',
    color: '#EAB308',
    confettiColors: ['#EAB308', '#FACC15', '#FDE047'],
  },
  challenge_won: {
    emoji: '🎉',
    title: 'Challenge Complete!',
    subtitle: 'You did it!',
    color: '#EC4899',
    confettiColors: ['#EC4899', '#F472B6', '#8B5CF6', '#6366F1'],
  },
  feature_unlocked: {
    emoji: '🔓',
    title: 'Feature Unlocked!',
    subtitle: 'New capability available',
    color: '#06B6D4',
    confettiColors: ['#06B6D4', '#22D3EE', '#67E8F9'],
  },
};

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
  shape: 'circle' | 'square' | 'star';
}

interface CelebrationOverlayProps {
  visible: boolean;
  type: CelebrationType;
  title?: string;
  subtitle?: string;
  xpGained?: number;
  streakCount?: number;
  newLevel?: number;
  achievementName?: string;
  onComplete?: () => void;
  duration?: number;
}

export default function CelebrationOverlay({
  visible,
  type,
  title,
  subtitle,
  xpGained,
  streakCount,
  newLevel,
  achievementName,
  onComplete,
  duration = 3000,
}: CelebrationOverlayProps) {
  const [showModal, setShowModal] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const config = CELEBRATION_CONFIGS[type];

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      triggerCelebration();
    }
  }, [visible]);

  const triggerCelebration = () => {
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Create confetti pieces
    const pieces: ConfettiPiece[] = [];
    const shapes: Array<'circle' | 'square' | 'star'> = ['circle', 'square', 'star'];
    
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        x: new Animated.Value(SCREEN_WIDTH / 2),
        y: new Animated.Value(SCREEN_HEIGHT / 2),
        rotation: new Animated.Value(0),
        scale: new Animated.Value(0),
        color: config.confettiColors[i % config.confettiColors.length],
        shape: shapes[i % shapes.length],
      });
    }
    setConfetti(pieces);

    // Animate confetti explosion
    pieces.forEach((piece, index) => {
      const angle = (index / pieces.length) * Math.PI * 2;
      const velocity = 200 + Math.random() * 300;
      const targetX = SCREEN_WIDTH / 2 + Math.cos(angle) * velocity;
      const targetY = SCREEN_HEIGHT / 2 + Math.sin(angle) * velocity - 100;

      Animated.parallel([
        Animated.timing(piece.x, {
          toValue: targetX,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(piece.y, {
            toValue: targetY - 200,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(piece.y, {
            toValue: SCREEN_HEIGHT + 50,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(piece.rotation, {
          toValue: Math.random() * 10 - 5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(piece.scale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(piece.scale, {
            toValue: 0,
            duration: 1900,
            delay: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // Main content animations
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ),
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
        }),
      ]),
    ]).start();

    // Auto dismiss
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowModal(false);
        setConfetti([]);
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.5);
        onComplete?.();
      });
    }, duration);
  };

  const getDisplayTitle = () => {
    if (title) return title;
    if (type === 'level_up' && newLevel) return `Level ${newLevel}!`;
    if (type === 'streak_milestone' && streakCount) return `${streakCount}-Day Streak!`;
    if (type === 'achievement_unlocked' && achievementName) return achievementName;
    return config.title;
  };

  const getDisplaySubtitle = () => {
    if (subtitle) return subtitle;
    if (xpGained) return `+${xpGained} XP`;
    return config.subtitle;
  };

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Confetti */}
        {confetti.map((piece) => (
          <Animated.View
            key={piece.id}
            style={[
              styles.confetti,
              piece.shape === 'circle' && styles.confettiCircle,
              piece.shape === 'square' && styles.confettiSquare,
              piece.shape === 'star' && styles.confettiStar,
              {
                backgroundColor: piece.color,
                transform: [
                  { translateX: piece.x },
                  { translateY: piece.y },
                  { rotate: piece.rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }) },
                  { scale: piece.scale },
                ],
              },
            ]}
          />
        ))}

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: bounceAnim },
              ],
            },
          ]}
        >
          <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
            {/* Glow effect */}
            <Animated.View
              style={[
                styles.glow,
                {
                  backgroundColor: config.color,
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 0.5],
                  }),
                  transform: [
                    {
                      scale: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />

            {/* Emoji/Icon */}
            <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
              <Text style={styles.emoji}>{config.emoji}</Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: config.color }]}>
              {getDisplayTitle()}
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>{getDisplaySubtitle()}</Text>

            {/* Additional info for level up */}
            {type === 'level_up' && (
              <View style={styles.levelBadge}>
                <Ionicons name="star" size={16} color="#FBBF24" />
                <Text style={styles.levelText}>New abilities unlocked!</Text>
              </View>
            )}

            {/* Streak fire effect */}
            {type === 'streak_milestone' && streakCount && (
              <View style={styles.streakFires}>
                {[...Array(Math.min(streakCount, 5))].map((_, i) => (
                  <Text key={i} style={styles.fireSingle}>🔥</Text>
                ))}
              </View>
            )}
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Hook for easy celebration triggering
export function useCelebration() {
  const [celebrationState, setCelebrationState] = useState<{
    visible: boolean;
    type: CelebrationType;
    props: Partial<CelebrationOverlayProps>;
  }>({
    visible: false,
    type: 'task_completed',
    props: {},
  });

  const celebrate = (type: CelebrationType, props?: Partial<CelebrationOverlayProps>) => {
    setCelebrationState({
      visible: true,
      type,
      props: props || {},
    });
  };

  const onComplete = () => {
    setCelebrationState(prev => ({ ...prev, visible: false }));
  };

  return {
    celebrate,
    CelebrationComponent: () => (
      <CelebrationOverlay
        visible={celebrationState.visible}
        type={celebrationState.type}
        onComplete={onComplete}
        {...celebrationState.props}
      />
    ),
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  confettiCircle: {
    borderRadius: 5,
  },
  confettiSquare: {
    borderRadius: 2,
  },
  confettiStar: {
    borderRadius: 0,
    transform: [{ rotate: '45deg' }],
  },
  content: {
    alignItems: 'center',
  },
  blurContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    overflow: 'hidden',
    minWidth: 280,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -50,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderRadius: 20,
  },
  levelText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FBBF24',
    fontWeight: '600',
  },
  streakFires: {
    flexDirection: 'row',
    marginTop: 16,
  },
  fireSingle: {
    fontSize: 24,
    marginHorizontal: 4,
  },
});
