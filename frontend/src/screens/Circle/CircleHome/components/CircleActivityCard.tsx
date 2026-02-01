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
  white: '#ffffff',
};

interface Member {
  id: string;
  name: string;
  initial: string;
  posted: boolean;
}

interface CircleActivityCardProps {
  currentUserPosted: boolean;
  currentUserInitial: string;
  members: Member[];
  postedCount: number;
  totalCount: number;
  streakDays?: number;
  onViewAll?: () => void;
  onMemberPress?: (memberId: string) => void;
  onShareDay?: () => void;
  onAssignMission?: () => void;
  onInvite?: () => void;
  onViewAllActivity?: () => void;
}

export function CircleActivityCard({
  currentUserPosted,
  currentUserInitial,
  members,
  postedCount,
  totalCount,
  streakDays = 7,
  onViewAll,
  onMemberPress,
  onShareDay,
  onAssignMission,
  onInvite,
  onViewAllActivity,
}: CircleActivityCardProps) {
  const allPosted = postedCount === totalCount;
  const progressPercentage = (postedCount / totalCount) * 100;

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Today's Activity</Text>
          <LinearGradient
            colors={['#fffbeb', '#fff7ed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.streakBadge}
          >
            <MaterialCommunityIcons name="fire" size={14} color="#f59e0b" />
            <Text style={styles.streakText}>{streakDays} day streak</Text>
          </LinearGradient>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllLink}>View all →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Member Avatars Row */}
      <View style={styles.avatarsRow}>
        {/* Current User Avatar */}
        <TouchableOpacity
          style={[
            styles.avatarWrapper,
            currentUserPosted && styles.avatarPosted,
          ]}
          onPress={() => onMemberPress?.('current')}
        >
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{currentUserInitial}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Other Members (up to 4) */}
        {members.slice(0, 4).map((member, index) => (
          <TouchableOpacity
            key={member.id}
            style={[
              styles.avatarWrapper,
              styles.avatarOverlap,
              member.posted && styles.avatarPosted,
            ]}
            onPress={() => onMemberPress?.(member.id)}
          >
            <LinearGradient
              colors={['#8b5cf6', '#ec4899']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{member.initial}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* More Members Indicator */}
        {members.length > 4 && (
          <TouchableOpacity
            style={[styles.avatarWrapper, styles.avatarOverlap]}
            onPress={() => onMemberPress?.('all')}
          >
            <View style={styles.avatarMore}>
              <Text style={styles.avatarMoreText}>+{members.length - 4}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Text */}
      <Text style={styles.statusText}>
        {allPosted
          ? "Everyone's checked in! 🎉"
          : `${postedCount} of ${totalCount} members posted`}
      </Text>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={['#8b5cf6', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${progressPercentage}%` }]}
        />
      </View>

      {/* Primary Action Button */}
      {currentUserPosted ? (
        <View style={styles.postedButton}>
          <Feather name="check" size={18} color={Colors.success} />
          <Text style={styles.postedButtonText}>Posted</Text>
        </View>
      ) : (
        onShareDay && (
          <TouchableOpacity activeOpacity={0.8} onPress={onShareDay}>
            <LinearGradient
              colors={['#8b5cf6', '#ec4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Share Your Day</Text>
            </LinearGradient>
          </TouchableOpacity>
        )
      )}

      {/* Secondary Action Buttons */}
      <View style={styles.secondaryRow}>
        {/* Assign Mission Button */}
        {onAssignMission && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onAssignMission}
            style={styles.assignButton}
          >
            <View style={styles.assignIconWrapper}>
              <Feather name="crosshair" size={18} color="#7c3aed" />
            </View>
            <Text style={styles.assignButtonText}>Assign Mission</Text>
          </TouchableOpacity>
        )}

        {/* Invite Button */}
        {onInvite && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.inviteButton}
            onPress={onInvite}
          >
            <View style={styles.inviteIconWrapper}>
              <Feather name="user-plus" size={16} color="#7c3aed" />
            </View>
            <Text style={styles.inviteButtonText}>Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* View All Link */}
      {onViewAllActivity && (
        <TouchableOpacity style={styles.viewAllActivityLink} onPress={onViewAllActivity}>
          <Text style={styles.viewAllActivityText}>View all activity</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  avatarsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    borderWidth: 3,
    borderColor: Colors.white,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarOverlap: {
    marginLeft: -12,
  },
  avatarPosted: {
    borderColor: '#10b981',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  avatarMore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  postedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#d1fae5',
    borderRadius: 14,
    marginBottom: 12,
  },
  postedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  assignButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
  },
  assignIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  inviteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inviteIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  viewAllActivityLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewAllActivityText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
