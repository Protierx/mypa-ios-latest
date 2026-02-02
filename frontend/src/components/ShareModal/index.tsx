/**
 * MYPA Share Modal - Viral Loop
 * 
 * Appears when users complete milestones:
 * - First task
 * - 5 tasks
 * - Level up
 * - Streak milestones (7, 14, 30 days)
 * - Challenge wins
 * 
 * Makes sharing feel like a celebration, not a chore.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Easing,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Share2,
  Trophy,
  Flame,
  Zap,
  Target,
  Users,
  Gift,
  Sparkles,
  Crown,
  ChevronRight,
  MessageCircle,
  Copy,
} from 'lucide-react-native';
import { MYPAOrb } from '../MYPAOrb';

export type ShareMilestone = 
  | 'first_task'
  | 'five_tasks'
  | 'ten_tasks'
  | 'level_up'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'challenge_win';

interface ShareModalProps {
  visible: boolean;
  milestone: ShareMilestone;
  value?: number; // For level or streak number
  onClose: () => void;
  onShare?: () => void;
  onInvite?: () => void;
}

const MILESTONE_CONFIG: Record<ShareMilestone, {
  icon: any;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: [string, string];
  shareText: (value?: number) => string;
  bonusXp: number;
}> = {
  first_task: {
    icon: Target,
    title: 'First Task Done! 🎯',
    subtitle: 'You just took the first step to an organized life!',
    emoji: '🎯',
    gradient: ['#10b981', '#059669'],
    shareText: () => "Just completed my first task with MYPA! 🎯 This AI assistant is helping me organize my life. Try it free!",
    bonusXp: 25,
  },
  five_tasks: {
    icon: Trophy,
    title: '5 Tasks Complete! 🏆',
    subtitle: "You're building unstoppable momentum!",
    emoji: '🏆',
    gradient: ['#f59e0b', '#d97706'],
    shareText: () => "I've completed 5 tasks with MYPA! 🏆 The AI scheduling is addictive. Join me!",
    bonusXp: 50,
  },
  ten_tasks: {
    icon: Crown,
    title: '10 Task Legend! 👑',
    subtitle: "You're officially a productivity pro!",
    emoji: '👑',
    gradient: ['#8b5cf6', '#6366f1'],
    shareText: () => "10 tasks crushed with MYPA! 👑 I'm becoming a productivity legend. Download it free!",
    bonusXp: 100,
  },
  level_up: {
    icon: Zap,
    title: 'Level Up! ⚡',
    subtitle: 'Your dedication is paying off!',
    emoji: '⚡',
    gradient: ['#3b82f6', '#1d4ed8'],
    shareText: (level) => `Just hit Level ${level} on MYPA! ⚡ Getting my life organized is actually fun now.`,
    bonusXp: 50,
  },
  streak_7: {
    icon: Flame,
    title: '7-Day Streak! 🔥',
    subtitle: "A full week of crushing it!",
    emoji: '🔥',
    gradient: ['#f97316', '#ea580c'],
    shareText: () => "7-day productivity streak with MYPA! 🔥 The habit is forming. Join the movement!",
    bonusXp: 100,
  },
  streak_14: {
    icon: Flame,
    title: '14-Day Streak! 🔥🔥',
    subtitle: 'Two weeks of pure consistency!',
    emoji: '🔥🔥',
    gradient: ['#ef4444', '#dc2626'],
    shareText: () => "14 days straight with MYPA! 🔥🔥 My productivity has doubled. This app is a game-changer!",
    bonusXp: 200,
  },
  streak_30: {
    icon: Flame,
    title: '30-Day Legend! 🔥🔥🔥',
    subtitle: 'A whole month of excellence!',
    emoji: '🔥🔥🔥',
    gradient: ['#dc2626', '#991b1b'],
    shareText: () => "30-day streak on MYPA! 🔥🔥🔥 I've transformed my productivity. Absolutely life-changing!",
    bonusXp: 500,
  },
  challenge_win: {
    icon: Trophy,
    title: 'Challenge Won! 🏆',
    subtitle: 'You defeated your friends!',
    emoji: '🏆',
    gradient: ['#fbbf24', '#f59e0b'],
    shareText: () => "Just won a MYPA challenge! 🏆 Competing with friends makes productivity fun. Join us!",
    bonusXp: 75,
  },
};

export function ShareModal({ 
  visible, 
  milestone, 
  value,
  onClose, 
  onShare,
  onInvite 
}: ShareModalProps) {
  const config = MILESTONE_CONFIG[milestone];
  const IconComponent = config.icon;
  
  // Animations
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // Entry animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(bounceAnim, {
            toValue: 0,
            tension: 40,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      bounceAnim.setValue(0);
      confettiAnim.setValue(0);
    }
  }, [visible]);

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: config.shareText(value) + '\n\n🔗 Try MYPA free: https://getmypa.app',
      });
      
      if (result.action === Share.sharedAction) {
        onShare?.();
        // Could award bonus XP here
      }
    } catch (error) {
      console.error('Share error:', error);
    }
    onClose();
  };

  const handleInvite = () => {
    onInvite?.();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: bounceAnim },
              ],
            },
          ]}
        >
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={24} color="rgba(255,255,255,0.6)" />
          </Pressable>
          
          {/* Celebration header */}
          <LinearGradient
            colors={config.gradient}
            style={styles.header}
          >
            {/* Confetti particles */}
            <Animated.View 
              style={[
                styles.confetti,
                {
                  opacity: confettiAnim,
                  transform: [{
                    translateY: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  }],
                },
              ]}
            >
              {['🎉', '✨', '🎊', '⭐', '🌟'].map((emoji, i) => (
                <Text 
                  key={i}
                  style={[
                    styles.confettiEmoji,
                    { left: `${15 + i * 18}%` },
                  ]}
                >
                  {emoji}
                </Text>
              ))}
            </Animated.View>
            
            {/* Icon */}
            <View style={styles.iconContainer}>
              <IconComponent size={48} color="#fff" />
            </View>
            
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>
            
            {/* Bonus XP badge */}
            <View style={styles.xpBadge}>
              <Zap size={14} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.xpText}>+{config.bonusXp} XP</Text>
            </View>
          </LinearGradient>
          
          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.sharePrompt}>
              Share your win and earn bonus XP!
            </Text>
            
            {/* Share button */}
            <Pressable style={styles.shareButton} onPress={handleShare}>
              <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareButtonGradient}
              >
                <Share2 size={20} color="#fff" />
                <Text style={styles.shareButtonText}>Share Achievement</Text>
              </LinearGradient>
            </Pressable>
            
            {/* Invite friends option */}
            <Pressable style={styles.inviteButton} onPress={handleInvite}>
              <Users size={18} color="#8b5cf6" />
              <Text style={styles.inviteText}>Invite friends to MYPA</Text>
              <View style={styles.inviteBadge}>
                <Gift size={12} color="#fff" />
                <Text style={styles.inviteBadgeText}>+100 XP each</Text>
              </View>
            </Pressable>
            
            {/* Skip option */}
            <Pressable style={styles.skipButton} onPress={onClose}>
              <Text style={styles.skipText}>Maybe later</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1e1b4b',
    borderRadius: 24,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    position: 'relative',
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
  },
  confettiEmoji: {
    position: 'absolute',
    fontSize: 24,
    top: 10,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
  },
  content: {
    padding: 24,
  },
  sharePrompt: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  shareButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.15)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 16,
  },
  inviteText: {
    fontSize: 15,
    color: '#c4b5fd',
    flex: 1,
  },
  inviteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  inviteBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
});

export default ShareModal;
