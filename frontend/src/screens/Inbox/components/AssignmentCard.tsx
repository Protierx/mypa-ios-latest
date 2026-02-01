import React from 'react';
import { Pressable, Text, View, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Bell,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Eye,
  Repeat,
  StickyNote,
  X,
  Zap,
} from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';

import { Assignment, Feedback } from '../types';
import { statusTone, statusLabel } from '../utils';
import { styles, selectionStyles } from '../styles';
import { SlideInCard } from './AnimatedComponents';

interface AssignmentCardProps {
  item: Assignment;
  index: number;
  isSelected: boolean;
  selectionMode: boolean;
  actionFeedback: Feedback;
  onPress: () => void;
  onLongPress: () => void;
  onToggleSelection: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onComplete: () => void;
  onViewInPlan: () => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  item,
  index,
  isSelected,
  selectionMode,
  actionFeedback,
  onPress,
  onLongPress,
  onToggleSelection,
  onAccept,
  onDecline,
  onComplete,
  onViewInPlan,
}) => {
  const tone = statusTone(item.status);

  return (
    <SlideInCard index={index}>
      <Pressable 
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        style={({ pressed }) => [
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
        ]}
      >
        <BlurView intensity={50} tint="light" style={[
          styles.card, 
          item.isEdited && styles.editedCard,
          isSelected && selectionStyles.selectedCard
        ]}>
          {/* Selection Checkbox (WhatsApp style) */}
          {selectionMode && (
            <TouchableOpacity 
              style={selectionStyles.checkboxRow}
              onPress={onToggleSelection}
              activeOpacity={0.7}
            >
              <View style={[
                selectionStyles.checkbox,
                isSelected && selectionStyles.checkboxSelected
              ]}>
                {isSelected && (
                  <Feather name="check" size={14} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          )}
          
          {/* Edited Banner */}
          {item.isEdited && (
            <View style={styles.editedBanner}>
              <Feather name="edit-2" size={12} color="#F59E0B" />
              <Text style={styles.editedBannerText}>Mission Updated</Text>
              <Text style={styles.editedBannerSubtext}>Tap to see changes</Text>
            </View>
          )}
          
          {/* Header Row */}
          <View style={styles.assignmentHeader}>
            <View style={[styles.assignmentIcon, item.isEdited && { backgroundColor: '#F59E0B' }]}>
              {item.isEdited ? (
                <Feather name="refresh-cw" size={20} color="#FFFFFF" />
              ) : (
                <Clock size={20} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.assignmentInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.assignmentTitle}>{item.title}</Text>
              </View>
              <View style={styles.assignmentFromRow}>
                <Text style={styles.assignmentSubtitle}>From {item.assignedByName}</Text>
                {item.circleName && (
                  <View style={styles.circleChip}>
                    <Text style={styles.circleChipEmoji}>{item.circleEmoji || '👥'}</Text>
                    <Text style={styles.circleChipText}>{item.circleName}</Text>
                  </View>
                )}
              </View>
            </View>
            <Eye size={18} color="#94A3B8" style={{ marginLeft: 8 }} />
          </View>

          {/* Changes Summary for Edited Missions */}
          {item.isEdited && item.editedChanges && item.editedChanges.length > 0 && (
            <View style={styles.changesPreview}>
              <Text style={styles.changesPreviewLabel}>What changed:</Text>
              <Text style={styles.changesPreviewText} numberOfLines={2}>
                {item.editedChanges.slice(0, 2).join(' • ')}
                {item.editedChanges.length > 2 ? ` +${item.editedChanges.length - 2} more` : ''}
              </Text>
            </View>
          )}

          {/* Note/Description */}
          {item.description && (
            <View style={styles.missionNote}>
              <StickyNote size={14} color="#64748B" />
              <Text style={styles.missionNoteText} numberOfLines={2}>{item.description}</Text>
            </View>
          )}

          {/* Details Row */}
          <View style={styles.missionDetails}>
            {/* Due Date & Time */}
            {item.dueDate && (
              <View style={styles.detailChip}>
                <Calendar size={12} color="#7C3AED" />
                <Text style={styles.detailChipText}>{item.dueDate} at {item.dueTime}</Text>
              </View>
            )}

            {/* XP Reward */}
            <View style={[styles.detailChip, styles.xpChip]}>
              <Zap size={12} color="#F59E0B" />
              <Text style={[styles.detailChipText, { color: '#F59E0B' }]}>{item.xpReward || 50} XP</Text>
            </View>
          </View>

          {/* Tags Row - Repeat, Proof, Nudged */}
          <View style={styles.missionTags}>
            {item.repeatEnabled && (
              <View style={[styles.tagChip, styles.repeatTag]}>
                <Repeat size={12} color="#2563EB" />
                <Text style={styles.repeatTagText}>
                  {item.repeatFrequency === 'daily' ? 'Daily' : 
                   item.repeatFrequency === 'weekly' ? 'Weekly' : 'Monthly'}
                </Text>
              </View>
            )}

            {item.requireProof && (
              <View style={[styles.tagChip, styles.proofTag]}>
                <Camera size={12} color="#7C3AED" />
                <Text style={styles.proofTagText}>Proof Required</Text>
              </View>
            )}

            <View style={[styles.tagChip, styles.nudgeTag]}>
              <Bell size={12} color="#10B981" />
              <Text style={styles.nudgeTagText}>Nudged</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.assignmentMeta}>
            <View style={[styles.statusBadge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
              <Text style={[styles.statusText, { color: tone.text }]}>{statusLabel(item.status)}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.cardActions}>
            {actionFeedback?.id === item.id ? (
              <View style={[styles.feedbackChip, actionFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackInfo]}>
                <CheckCircle size={14} color={actionFeedback.type === 'success' ? '#10B981' : '#64748B'} />
                <Text style={styles.feedbackText}>{actionFeedback.message}</Text>
              </View>
            ) : (
              <>
                {item.status === 'pending' && (
                  <>
                    <Pressable style={styles.primaryAction} onPress={onAccept}>
                      <CheckCircle size={14} color="#10B981" />
                      <Text style={styles.primaryActionText}>Add to Plan</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryAction} onPress={onDecline}>
                      <X size={14} color="#94A3B8" />
                      <Text style={styles.secondaryActionText}>Decline</Text>
                    </Pressable>
                  </>
                )}
                {item.status === 'accepted' && (
                  <>
                    <Pressable style={styles.primaryAction} onPress={onComplete}>
                      <CheckCircle size={14} color="#10B981" />
                      <Text style={styles.primaryActionText}>Mark Complete</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryAction} onPress={onViewInPlan}>
                      <Calendar size={14} color="#2563EB" />
                      <Text style={[styles.secondaryActionText, { color: '#2563EB' }]}>View in Plan</Text>
                    </Pressable>
                  </>
                )}
              </>
            )}
          </View>
        </BlurView>
      </Pressable>
    </SlideInCard>
  );
};
