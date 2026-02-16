/**
 * Gamification Toast Overlay
 *
 * Renders one toast at a time from the gamification queue:
 *   - XP toast: "+12 XP" with sparkle
 *   - Challenge toast: "Task Challenge 12/20" with progress bar
 *   - Level-up modal: "Level 5!" celebration
 *
 * Non-invasive — absolutely positioned overlay, no layout shift.
 * Auto-dismisses after a delay, then pops the next toast from the queue.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGamification, GamToast } from '@/contexts/GamificationContext';
import { bg, brand, text as textTokens, semantic } from '@/styles/colors';
import { radius, spacing, shadows } from '@/styles/theme';

// ---------------------------------------------------------------------------
// Auto-dismiss durations
// ---------------------------------------------------------------------------

const XP_TOAST_DURATION = 2000;
const CHALLENGE_TOAST_DURATION = 2800;
const LEVEL_UP_DURATION = 4000;

// ---------------------------------------------------------------------------
// Main overlay component — mount once near root
// ---------------------------------------------------------------------------

export function GamificationToastOverlay() {
  const { currentToast, dismissToast } = useGamification();

  if (!currentToast) return null;

  switch (currentToast.kind) {
    case 'xp':
      return (
        <XpToast
          xp={currentToast.xp}
          isPreview={currentToast.isPreview}
          onDone={dismissToast}
        />
      );
    case 'challenge':
      return (
        <ChallengeToast
          title={currentToast.title}
          progress={currentToast.progress}
          target={currentToast.target}
          onDone={dismissToast}
        />
      );
    case 'levelUp':
      return (
        <LevelUpModal
          newLevel={currentToast.newLevel}
          onDone={dismissToast}
        />
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// XP Toast — compact pill at top
// ---------------------------------------------------------------------------

function XpToast({ xp, isPreview, onDone }: { xp: number; isPreview: boolean; onDone: () => void }) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onDone());
    }, XP_TOAST_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.xpToast,
        { transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <View style={styles.xpToastInner}>
        <Ionicons name="sparkles" size={16} color={brand.primary} />
        <Text style={styles.xpToastText}>
          +{xp} XP
        </Text>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Challenge Toast — compact with mini progress bar
// ---------------------------------------------------------------------------

function ChallengeToast({
  title,
  progress,
  target,
  onDone,
}: {
  title: string;
  progress: number;
  target: number;
  onDone: () => void;
}) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onDone());
    }, CHALLENGE_TOAST_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const pct = Math.min(progress / target, 1);
  const isComplete = progress >= target;

  return (
    <Animated.View
      style={[
        styles.challengeToast,
        { transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <View style={styles.challengeToastInner}>
        <Ionicons
          name={isComplete ? 'trophy' : 'flag'}
          size={16}
          color={isComplete ? semantic.warning : brand.primary}
        />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.challengeTitle}>
            {title} {progress}/{target}
          </Text>
          <View style={styles.challengeBarBg}>
            <View
              style={[
                styles.challengeBarFill,
                {
                  width: `${pct * 100}%`,
                  backgroundColor: isComplete ? semantic.success : brand.primary,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Level-up Modal — brief celebration
// ---------------------------------------------------------------------------

function LevelUpModal({ newLevel, onDone }: { newLevel: number; onDone: () => void }) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.8, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onDone());
    }, LEVEL_UP_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[styles.levelUpOverlay, { opacity }]}>
        <Animated.View style={[styles.levelUpCard, { transform: [{ scale }] }]}>
          <View style={styles.levelUpIconWrap}>
            <Ionicons name="arrow-up-circle" size={48} color={brand.primary} />
          </View>
          <Text style={styles.levelUpTitle}>Level Up!</Text>
          <Text style={styles.levelUpNumber}>Level {newLevel}</Text>
          <Text style={styles.levelUpSubtext}>Keep crushing it 🔥</Text>
          <TouchableOpacity style={styles.levelUpBtn} onPress={onDone} activeOpacity={0.8}>
            <Text style={styles.levelUpBtnText}>Nice!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // XP toast
  xpToast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 1000,
  },
  xpToastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.muted,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.15)',
  },
  xpToastText: {
    fontSize: 15,
    fontWeight: '700',
    color: brand.primary,
    letterSpacing: 0.3,
  },

  // Challenge toast
  challengeToast: {
    position: 'absolute',
    top: 60,
    left: spacing.base,
    right: spacing.base,
    zIndex: 1000,
  },
  challengeToastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: bg.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.10)',
  },
  challengeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: textTokens.primary,
  },
  challengeBarBg: {
    height: 4,
    backgroundColor: bg.secondary,
    borderRadius: 2,
    marginTop: 5,
    overflow: 'hidden',
  },
  challengeBarFill: {
    height: 4,
    borderRadius: 2,
  },

  // Level-up modal
  levelUpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelUpCard: {
    backgroundColor: bg.elevated,
    borderRadius: radius.xl,
    padding: 32,
    alignItems: 'center',
    width: 280,
    ...shadows.lg,
  },
  levelUpIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: brand.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  levelUpTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: textTokens.primary,
    letterSpacing: -0.5,
  },
  levelUpNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: brand.primary,
    marginTop: 4,
    letterSpacing: -1,
  },
  levelUpSubtext: {
    fontSize: 15,
    color: textTokens.secondary,
    marginTop: 8,
  },
  levelUpBtn: {
    marginTop: 24,
    backgroundColor: brand.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  levelUpBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: textTokens.inverse,
  },
});
