import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  white: '#ffffff',
};

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  assignedBy: string;
  assignedById: string;
  assignedTo: string;
  assignedToId: string;
  dueTime: string;
  dueDate: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  proofUrl?: string;
  createdAt: string;
  xpReward: number;
  repeatEnabled: boolean;
  repeatFrequency?: 'daily' | 'weekly' | 'monthly';
  requireProof: boolean;
  declineReason?: string;
}

interface AssignmentCardProps {
  assignment: Assignment;
  userId?: string; // Current user's ID
  onPress?: (assignment: Assignment) => void;
  onAccept?: (assignment: Assignment) => void;
  onDecline?: (assignment: Assignment) => void;
  onComplete?: (assignment: Assignment) => void;
  onEdit?: (assignment: Assignment) => void;
  isSelected?: boolean;
}

export function AssignmentCard({
  assignment,
  userId,
  onPress,
  onAccept,
  onDecline,
  onComplete,
  onEdit,
  isSelected = false,
}: AssignmentCardProps) {
  const isAssignedToMe = userId === assignment.assignedToId;
  const isAssignedByMe = userId === assignment.assignedById;

  // Status styling configuration
  const statusConfig = {
    pending: {
      color: Colors.warning,
      backgroundColor: Colors.warningLight,
      icon: 'clock',
      label: 'Pending',
      gradient: ['#fef3c7', '#fde68a'] as const,
    },
    accepted: {
      color: Colors.primary,
      backgroundColor: Colors.primaryLight,
      icon: 'check-circle',
      label: 'Accepted',
      gradient: ['#ede9fe', '#ddd6fe'] as const,
    },
    declined: {
      color: Colors.danger,
      backgroundColor: Colors.dangerLight,
      icon: 'x-circle',
      label: 'Declined',
      gradient: ['#fee2e2', '#fecaca'] as const,
    },
    completed: {
      color: Colors.success,
      backgroundColor: Colors.successLight,
      icon: 'check-square',
      label: 'Completed',
      gradient: ['#d1fae5', '#a7f3d0'] as const,
    },
  };

  const config = statusConfig[assignment.status];

  // Determine card action text
  const getActionButton = () => {
    if (!isAssignedToMe) {
      return null; // No action for assignments not assigned to current user
    }

    if (assignment.status === 'completed') {
      return (
        <View style={styles.actionCompleted}>
          <Feather name="award" size={16} color={Colors.success} />
          <Text style={styles.actionCompletedText}>+{assignment.xpReward} XP earned</Text>
        </View>
      );
    }

    if (assignment.status === 'accepted') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={() => onComplete?.(assignment)}
          activeOpacity={0.8}
        >
          <Feather name="check" size={16} color={Colors.white} />
          <Text style={styles.actionButtonText}>
            {assignment.requireProof ? 'Submit Proof' : 'Mark Complete'}
          </Text>
        </TouchableOpacity>
      );
    }

    if (assignment.status === 'pending' || assignment.status === 'declined') {
      return (
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSuccess]}
            onPress={() => onAccept?.(assignment)}
            activeOpacity={0.8}
          >
            <Feather name="check" size={16} color={Colors.white} />
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonOutline]}
            onPress={() => onDecline?.(assignment)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonOutlineText}>Decline</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        assignment.status === 'completed' && styles.cardCompleted,
      ]}
      onPress={() => onPress?.(assignment)}
      activeOpacity={0.8}
    >
      {/* Status Indicator Bar */}
      <View style={[styles.statusBar, { backgroundColor: config.color }]} />

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Status Badge */}
            <LinearGradient
              colors={config.gradient}
              style={styles.statusBadge}
            >
              <Feather name={config.icon as any} size={14} color={config.color} />
              <Text style={[styles.statusText, { color: config.color }]}>
                {config.label}
              </Text>
            </LinearGradient>

            {/* Repeat Indicator */}
            {assignment.repeatEnabled && (
              <View style={styles.repeatBadge}>
                <Feather name="repeat" size={12} color={Colors.textSecondary} />
                <Text style={styles.repeatText}>
                  {assignment.repeatFrequency === 'daily' ? 'Daily' :
                   assignment.repeatFrequency === 'weekly' ? 'Weekly' : 'Monthly'}
                </Text>
              </View>
            )}
          </View>

          {/* Edit Button (for sender) */}
          {isAssignedByMe && assignment.status !== 'completed' && onEdit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(assignment)}
            >
              <Feather name="edit-2" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Mission Title */}
        <Text style={styles.title}>{assignment.title}</Text>

        {/* Description (if available) */}
        {assignment.description && (
          <Text style={styles.description} numberOfLines={2}>
            {assignment.description}
          </Text>
        )}

        {/* Info Row */}
        <View style={styles.infoRow}>
          {/* Assigned by/to info */}
          <View style={styles.infoItem}>
            <Feather 
              name={isAssignedToMe ? 'arrow-down-left' : 'arrow-up-right'} 
              size={14} 
              color={Colors.textSecondary} 
            />
            <Text style={styles.infoText}>
              {isAssignedToMe ? `From ${assignment.assignedBy}` : `To ${assignment.assignedTo}`}
            </Text>
          </View>

          {/* Due Time */}
          <View style={styles.infoItem}>
            <Feather name="clock" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{assignment.dueTime}</Text>
          </View>
        </View>

        {/* XP Reward (for active assignments) */}
        {assignment.status !== 'completed' && (
          <View style={styles.xpRow}>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+{assignment.xpReward} XP</Text>
            </View>
            {assignment.requireProof && (
              <View style={styles.proofBadge}>
                <Feather name="camera" size={12} color={Colors.textSecondary} />
                <Text style={styles.proofText}>Proof required</Text>
              </View>
            )}
          </View>
        )}

        {/* Decline Reason (if declined) */}
        {assignment.status === 'declined' && assignment.declineReason && (
          <View style={styles.declineReasonContainer}>
            <Feather name="message-square" size={14} color={Colors.textSecondary} />
            <Text style={styles.declineReasonText} numberOfLines={2}>
              "{assignment.declineReason}"
            </Text>
          </View>
        )}

        {/* Proof Indicator (if completed with proof) */}
        {assignment.status === 'completed' && assignment.proofUrl && (
          <View style={styles.proofCompletedBadge}>
            <Feather name="image" size={14} color={Colors.success} />
            <Text style={styles.proofCompletedText}>Proof submitted</Text>
          </View>
        )}

        {/* Action Buttons */}
        {getActionButton()}
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
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowOpacity: 0.1,
  },
  cardCompleted: {
    opacity: 0.75,
  },
  statusBar: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.surface,
    borderRadius: 10,
  },
  repeatText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  editButton: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  xpBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  xpText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b45309',
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  proofText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  declineReasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    marginBottom: 12,
  },
  declineReasonText: {
    flex: 1,
    fontSize: 13,
    color: Colors.danger,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  proofCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    marginBottom: 12,
  },
  proofCompletedText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  actionButtonSuccess: {
    backgroundColor: Colors.success,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  actionButtonOutlineText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
  },
  actionCompletedText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
});
