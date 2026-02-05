/**
 * Unlock Celebration Modal
 * 
 * Shows a celebration animation when user earns new AI feature unlocks.
 * Includes confetti animation, feature description, and dismiss action.
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 6, Step 6.3
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 5 "Learning System"
 */

import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useUserModel, AI_FEATURES, type AIFeature } from '@/contexts/UserModelContext';
import { eventLogger } from '@/services/eventLogger';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Feature Descriptions
// ============================================================================

interface FeatureInfo {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const FEATURE_INFO: Record<string, FeatureInfo> = {
  [AI_FEATURES.TASK_INSIGHTS]: {
    icon: 'bulb-outline',
    title: 'Task Insights',
    description: 'MYPA now shows you patterns in your task completion to help you stay productive.',
    color: '#7C3AED',
  },
  [AI_FEATURES.FOCUS_STATS]: {
    icon: 'timer-outline',
    title: 'Focus Statistics',
    description: 'Track your focus sessions and see how your concentration improves over time.',
    color: '#EC4899',
  },
  [AI_FEATURES.AI_TASK_SORTING]: {
    icon: 'swap-vertical-outline',
    title: 'AI Task Sorting',
    description: 'Your tasks are now automatically sorted by when you\'re most likely to complete them.',
    color: '#10B981',
  },
  [AI_FEATURES.DURATION_ESTIMATION]: {
    icon: 'hourglass-outline',
    title: 'Duration Estimation',
    description: 'MYPA learned your pace and now estimates how long tasks will take you.',
    color: '#F59E0B',
  },
  [AI_FEATURES.CHALLENGES]: {
    icon: 'trophy-outline',
    title: 'Challenges Unlocked',
    description: 'Compete with friends and circles in productivity challenges!',
    color: '#EF4444',
  },
  [AI_FEATURES.CIRCLE_INSIGHTS]: {
    icon: 'people-outline',
    title: 'Circle Insights',
    description: 'See detailed analytics about your circles\' productivity and engagement.',
    color: '#6366F1',
  },
  [AI_FEATURES.CUSTOM_AI_VOICE]: {
    icon: 'mic-outline',
    title: 'Custom AI Voice',
    description: 'Choose from different AI voices to personalize your MYPA experience.',
    color: '#8B5CF6',
  },
  [AI_FEATURES.PREDICTIVE_TASKS]: {
    icon: 'sparkles-outline',
    title: 'Predictive Tasks',
    description: 'MYPA now suggests tasks before you even think of them based on your patterns.',
    color: '#14B8A6',
  },
  [AI_FEATURES.OVERWHELM_DETECTION]: {
    icon: 'alert-circle-outline',
    title: 'Overwhelm Detection',
    description: 'MYPA will warn you when you\'re taking on too much and help you prioritize.',
    color: '#F97316',
  },
  [AI_FEATURES.PEAK_HOURS]: {
    icon: 'sunny-outline',
    title: 'Peak Hours',
    description: 'Your most productive hours have been identified. MYPA will schedule tasks accordingly.',
    color: '#FBBF24',
  },
};

// ============================================================================
// Confetti Particle
// ============================================================================

interface ConfettiProps {
  delay: number;
  color: string;
}

const ConfettiParticle: React.FC<ConfettiProps> = ({ delay, color }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const startX = Math.random() * SCREEN_WIDTH;
  const size = 8 + Math.random() * 8;

  useEffect(() => {
    const animateParticle = () => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT + 50,
            duration: 2500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: (Math.random() - 0.5) * 200,
            duration: 2500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(1500),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    };

    animateParticle();
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? size / 2 : 0,
          opacity,
          transform: [
            { translateY },
            { translateX },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    />
  );
};

// ============================================================================
// Main Component
// ============================================================================

interface UnlockCelebrationModalProps {
  visible: boolean;
  feature: string;
  onDismiss: () => void;
}

export function UnlockCelebrationModal({
  visible,
  feature,
  onDismiss,
}: UnlockCelebrationModalProps) {
  const { markUnlockSeen } = useUserModel();
  
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const info = FEATURE_INFO[feature] || {
    icon: 'star-outline' as keyof typeof Ionicons.glyphMap,
    title: 'New Feature Unlocked!',
    description: 'You\'ve unlocked a new AI ability!',
    color: '#7C3AED',
  };

  // Confetti colors
  const confettiColors = ['#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#6366F1', '#EF4444'];

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Log event
      eventLogger.log('unlock_celebration_shown', { feature });

      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [visible, feature]);

  const handleDismiss = useCallback(async () => {
    // Mark as seen in database
    await markUnlockSeen(feature);
    
    // Exit animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [feature, markUnlockSeen, onDismiss]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      {/* Confetti */}
      {Array.from({ length: 30 }).map((_, i) => (
        <ConfettiParticle
          key={i}
          delay={i * 50}
          color={confettiColors[i % confettiColors.length]}
        />
      ))}

      {/* Background overlay */}
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        {/* Modal content */}
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glowContainer,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.6],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={[info.color + '40', 'transparent']}
              style={styles.glow}
            />
          </Animated.View>

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: info.color + '20' }]}>
            <Ionicons name={info.icon} size={48} color={info.color} />
          </View>

          {/* Title */}
          <Text style={styles.title}>🎉 New AI Ability Unlocked!</Text>

          {/* Feature name */}
          <Text style={[styles.featureName, { color: info.color }]}>
            {info.title}
          </Text>

          {/* Description */}
          <Text style={styles.description}>{info.description}</Text>

          {/* Dismiss button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: info.color }]}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ============================================================================
// Unlock Celebration Manager
// ============================================================================

/**
 * Hook to manage unlock celebrations
 * Shows celebration modals for pending unlocks one at a time
 */
export function useUnlockCelebrations() {
  const { getPendingUnlocks, refresh } = useUserModel();
  const [currentUnlock, setCurrentUnlock] = React.useState<string | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);

  // Check for pending unlocks on mount and after refresh
  const checkPendingUnlocks = useCallback(() => {
    const pending = getPendingUnlocks();
    if (pending.length > 0 && !currentUnlock) {
      setCurrentUnlock(pending[0].feature);
      setModalVisible(true);
    }
  }, [getPendingUnlocks, currentUnlock]);

  // Check on mount
  useEffect(() => {
    // Delay to let app settle
    const timer = setTimeout(checkPendingUnlocks, 1000);
    return () => clearTimeout(timer);
  }, [checkPendingUnlocks]);

  // Handle dismiss - show next pending or close
  const handleDismiss = useCallback(() => {
    setModalVisible(false);
    setCurrentUnlock(null);
    
    // Refresh unlocks and check for more
    setTimeout(async () => {
      await refresh();
      checkPendingUnlocks();
    }, 500);
  }, [refresh, checkPendingUnlocks]);

  return {
    currentUnlock,
    modalVisible,
    handleDismiss,
    checkPendingUnlocks,
  };
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  glowContainer: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    height: 300,
  },
  glow: {
    flex: 1,
    borderRadius: 200,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  confetti: {
    position: 'absolute',
    top: -50,
  },
});

export default UnlockCelebrationModal;
