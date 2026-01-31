import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const Colors = {
  primary: '#7c3aed',
  primaryLight: '#ede9fe',
  background: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#ef4444',
  white: '#ffffff',
  orange: '#ff6b35',
};

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  emoji?: string;
  type: 'FOCUS_MINUTES' | 'TASKS_COMPLETED' | 'STREAK_DAYS';
  targetValue: number;
  daysRemaining: number;
  totalDays: number;
  xpReward: number;
  category?: string;
  circleId?: string;
  creatorId?: string;
  creatorName?: string;
  participants?: number;
  userProgress?: number;
  isJoined?: boolean;
  completedDate?: string;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onPress?: (challenge: Challenge) => void;
  onJoin?: (challenge: Challenge) => void;
  onViewDetails?: (challenge: Challenge) => void;
  compact?: boolean; // Compact mode for smaller display
}

export function ChallengeCard({
  challenge,
  onPress,
  onJoin,
  onViewDetails,
  compact = false,
}: ChallengeCardProps) {
  // Type configuration
  const typeConfig = {
    FOCUS_MINUTES: {
      icon: 'brain' as const,
      label: 'Focus Challenge',
      unit: 'minutes',
      color: '#8b5cf6',
      gradient: ['#8b5cf6', '#7c3aed'],
      emoji: '🧠',
    },
    TASKS_COMPLETED: {
      icon: 'check-square' as const,
      label: 'Task Challenge',
      unit: 'tasks',
      color: '#10b981',
      gradient: ['#10b981', '#059669'],
      emoji: '✅',
    },
    STREAK_DAYS: {
      icon: 'zap' as const,
      label: 'Streak Challenge',
      unit: 'days',
      color: '#f59e0b',
      gradient: ['#f59e0b', '#d97706'],
      emoji: '🔥',
    },
  };

  const config = typeConfig[challenge.type];
  const displayEmoji = challenge.emoji || config.emoji;
  
  // Calculate progress percentage
  const progressPercentage = challenge.userProgress
    ? Math.min((challenge.userProgress / challenge.targetValue) * 100, 100)
    : 0;
  
  // Check if completed
  const isCompleted = !!challenge.completedDate;
  
  // Days progress
  const daysProgress = challenge.totalDays - challenge.daysRemaining;
  const daysPercentage = (daysProgress / challenge.totalDays) * 100;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={() => onPress?.(challenge)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactGradient}
        >
          {/* Emoji */}
          <Text style={styles.compactEmoji}>{displayEmoji}</Text>
          
          {/* Title */}
          <Text style={styles.compactTitle} numberOfLines={1}>
            {challenge.title}
          </Text>
          
          {/* Target */}
          <View style={styles.compactTarget}>
            <Text style={styles.compactTargetText}>
              {challenge.targetValue} {config.unit}
            </Text>
          </View>
          
          {/* XP Reward */}
          <View style={styles.compactXP}>
            <Feather name="award" size={12} color={Colors.white} />
            <Text style={styles.compactXPText}>+{challenge.xpReward}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, isCompleted && styles.cardCompleted]}
      onPress={() => onPress?.(challenge)}
      activeOpacity={0.8}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={config.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Left side: Emoji + Info */}
          <View style={styles.headerLeft}>
            <Text style={styles.emoji}>{displayEmoji}</Text>
            <View>
              <Text style={styles.typeLabel}>{config.label}</Text>
              {challenge.category && (
                <Text style={styles.category}>{challenge.category}</Text>
              )}
            </View>
          </View>
          
          {/* Right side: XP Badge */}
          <View style={styles.xpBadge}>
            <Feather name="award" size={16} color={Colors.white} />
            <Text style={styles.xpText}>+{challenge.xpReward}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Card Content */}
      <View style={styles.content}>
        {/* Challenge Title */}
        <Text style={styles.title}>{challenge.title}</Text>

        {/* Description */}
        {challenge.description && (
          <Text style={styles.description} numberOfLines={2}>
            {challenge.description}
          </Text>
        )}

        {/* Target Info */}
        <View style={styles.targetRow}>
          <View style={styles.targetItem}>
            <MaterialCommunityIcons 
              name={challenge.type === 'FOCUS_MINUTES' ? 'brain' : 
                   challenge.type === 'TASKS_COMPLETED' ? 'checkbox-marked-circle-outline' : 'fire'}
              size={20}
              color={config.color}
            />
            <Text style={styles.targetLabel}>Target</Text>
            <Text style={[styles.targetValue, { color: config.color }]}>
              {challenge.targetValue} {config.unit}
            </Text>
          </View>

          <View style={styles.targetDivider} />

          <View style={styles.targetItem}>
            <Feather name="calendar" size={18} color={Colors.textSecondary} />
            <Text style={styles.targetLabel}>Duration</Text>
            <Text style={styles.targetValue}>
              {challenge.totalDays} {challenge.totalDays === 1 ? 'day' : 'days'}
            </Text>
          </View>
        </View>

        {/* Progress Section (only if joined) */}
        {challenge.isJoined && !isCompleted && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressPercent}>{Math.round(progressPercentage)}%</Text>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={[config.color, `${config.color}aa`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progressPercentage}%` }]}
              />
            </View>
            
            {/* Progress Stats */}
            <View style={styles.progressStats}>
              <Text style={styles.progressStat}>
                {challenge.userProgress || 0} / {challenge.targetValue} {config.unit}
              </Text>
              <Text style={styles.progressStat}>
                {challenge.daysRemaining} {challenge.daysRemaining === 1 ? 'day' : 'days'} left
              </Text>
            </View>
          </View>
        )}

        {/* Days Progress (for joined challenges) */}
        {challenge.isJoined && !isCompleted && (
          <View style={styles.daysProgressBar}>
            <View style={styles.daysProgressTrack}>
              <View 
                style={[
                  styles.daysProgressFill, 
                  { width: `${daysPercentage}%`, backgroundColor: config.color }
                ]} 
              />
            </View>
            <Text style={styles.daysProgressText}>
              Day {daysProgress} of {challenge.totalDays}
            </Text>
          </View>
        )}

        {/* Completed Badge */}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <Feather name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.completedText}>Challenge Completed! 🎉</Text>
          </View>
        )}

        {/* Participants Info */}
        {challenge.participants !== undefined && challenge.participants > 0 && (
          <View style={styles.participantsRow}>
            <View style={styles.participantsAvatars}>
              <View style={styles.participantAvatar}>
                <Feather name="users" size={12} color={Colors.textSecondary} />
              </View>
            </View>
            <Text style={styles.participantsText}>
              {challenge.participants} {challenge.participants === 1 ? 'participant' : 'participants'}
            </Text>
          </View>
        )}

        {/* Creator Info */}
        {challenge.creatorName && (
          <View style={styles.creatorRow}>
            <Feather name="user" size={14} color={Colors.textMuted} />
            <Text style={styles.creatorText}>Created by {challenge.creatorName}</Text>
          </View>
        )}

        {/* Action Button */}
        {!isCompleted && (
          <View style={styles.actionRow}>
            {challenge.isJoined ? (
              <View style={styles.joinedBadge}>
                <Feather name="check-circle" size={16} color={Colors.success} />
                <Text style={styles.joinedText}>Joined</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => onJoin?.(challenge)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={config.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.joinButtonGradient}
                >
                  <Feather name="plus-circle" size={16} color={Colors.white} />
                  <Text style={styles.joinButtonText}>Join Challenge</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {onViewDetails && (
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => onViewDetails(challenge)}
              >
                <Text style={styles.detailsButtonText}>View Details</Text>
                <Feather name="chevron-right" size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardCompleted: {
    opacity: 0.85,
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emoji: {
    fontSize: 32,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  category: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  targetItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  targetDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  targetLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  targetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStat: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  daysProgressBar: {
    marginBottom: 16,
  },
  daysProgressTrack: {
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  daysProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  daysProgressText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    marginBottom: 16,
  },
  completedText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.success,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  participantsAvatars: {
    flexDirection: 'row',
  },
  participantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  participantsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  creatorText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    padding: 14,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    justifyContent: 'center',
  },
  joinedText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.success,
  },
  joinButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  
  // Compact card styles
  compactCard: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 160,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  compactGradient: {
    padding: 16,
    alignItems: 'center',
  },
  compactEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  compactTarget: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  compactTargetText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  compactXP: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  compactXPText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
});
