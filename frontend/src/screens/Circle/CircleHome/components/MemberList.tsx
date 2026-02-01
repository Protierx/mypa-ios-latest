import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

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

export interface CircleMember {
  id: string;
  name: string;
  initial: string;
  posted: boolean;
  lastPostTime?: string;
  role: 'admin' | 'member';
  avatarUrl?: string;
  xpContributed?: number;
  tasksCompleted?: number;
}

interface MemberListProps {
  currentUserId?: string;
  currentUserName?: string;
  currentUserPosted: boolean;
  isCurrentUserAdmin: boolean;
  members: CircleMember[];
  loading?: boolean;
  onMemberPress?: (member: CircleMember) => void;
  onMemberLongPress?: (member: CircleMember) => void;
  onAssignToMember?: (member: CircleMember) => void;
  onInvitePress?: () => void;
  showActions?: boolean; // Show assign button
}

export function MemberList({
  currentUserId,
  currentUserName = 'You',
  currentUserPosted,
  isCurrentUserAdmin,
  members,
  loading = false,
  onMemberPress,
  onMemberLongPress,
  onAssignToMember,
  onInvitePress,
  showActions = true,
}: MemberListProps) {
  // Get first letter for current user avatar
  const currentUserInitial = currentUserName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View>
      {/* Current User Card */}
      <TouchableOpacity activeOpacity={0.8}>
        <LinearGradient
          colors={[Colors.primaryLight, '#f5f3ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.currentUserCard}
        >
          <View style={styles.memberInfo}>
            <LinearGradient
              colors={['#a78bfa', '#7c3aed']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{currentUserInitial}</Text>
            </LinearGradient>
            <View style={styles.memberDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.memberName}>{currentUserName}</Text>
                {isCurrentUserAdmin && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>
              <Text style={styles.memberStatus}>
                {currentUserPosted ? 'Posted today' : 'Not posted yet'}
              </Text>
            </View>
          </View>
          <View style={styles.memberActions}>
            {isCurrentUserAdmin && (
              <Text style={styles.crownEmoji}>👑</Text>
            )}
            {currentUserPosted && (
              <View style={styles.postedIndicator}>
                <Feather name="check" size={12} color={Colors.success} />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Other Members */}
      {members.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="users" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyStateText}>
            You're the only one here!{'\n'}Invite friends to join your circle.
          </Text>
          {onInvitePress && (
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={onInvitePress}
            >
              <Text style={styles.emptyStateButtonText}>Invite Members</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        members.map((member) => (
          <TouchableOpacity
            key={member.id}
            activeOpacity={0.7}
            onPress={() => onMemberPress?.(member)}
            onLongPress={() => onMemberLongPress?.(member)}
            style={styles.memberCard}
          >
            <View style={styles.memberInfo}>
              <LinearGradient
                colors={['#c4b5fd', '#8b5cf6']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{member.initial}</Text>
              </LinearGradient>
              <View style={styles.memberDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {member.role === 'admin' && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberStatus}>
                  {member.posted
                    ? `Posted ${member.lastPostTime || 'today'}`
                    : 'Not posted yet'}
                </Text>
              </View>
            </View>
            <View style={styles.memberActions}>
              {member.posted && (
                <View style={styles.postedIndicator}>
                  <Feather name="check" size={12} color={Colors.success} />
                </View>
              )}
              {member.role === 'admin' && (
                <Text style={styles.crownEmoji}>👑</Text>
              )}
              {showActions && onAssignToMember && (
                <TouchableOpacity
                  style={styles.assignButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onAssignToMember(member);
                  }}
                >
                  <Feather name="plus" size={18} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Invite Members Button */}
      {members.length > 0 && onInvitePress && (
        <TouchableOpacity
          onPress={onInvitePress}
          style={styles.inviteButton}
        >
          <Feather name="user-plus" size={20} color={Colors.primary} />
          <Text style={styles.inviteButtonText}>Invite Members</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  currentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  memberDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  adminBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
  },
  memberStatus: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEmoji: {
    fontSize: 20,
  },
  assignButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateText: {
    marginTop: 8,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
