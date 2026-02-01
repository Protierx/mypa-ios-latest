import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { CheckCircle, Eye, Users, X, Zap } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';

import { Assignment } from '../types';
import { formatTimeAgo } from '../utils';
import { detailModalStyles } from '../styles';

interface DetailModalProps {
  visible: boolean;
  assignment: Assignment | null;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onComplete: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  visible,
  assignment,
  onClose,
  onAccept,
  onDecline,
  onComplete,
}) => {
  if (!assignment) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={detailModalStyles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />
        <View style={detailModalStyles.container}>
          <View style={detailModalStyles.handle} />
          
          {/* Edited Banner - Prominent at top */}
          {assignment.isEdited && (
            <View style={detailModalStyles.editedSection}>
              <View style={detailModalStyles.editedHeader}>
                <Feather name="edit-2" size={16} color="#F59E0B" />
                <Text style={detailModalStyles.editedTitle}>Mission Updated</Text>
              </View>
              <Text style={detailModalStyles.editedSubtitle}>
                {assignment.assignedByName} has modified this mission
              </Text>
              {assignment.editedChanges && assignment.editedChanges.length > 0 && (
                <View style={detailModalStyles.changesList}>
                  <Text style={detailModalStyles.changesLabel}>What changed:</Text>
                  {assignment.editedChanges.map((change, idx) => (
                    <View key={idx} style={detailModalStyles.changeItem}>
                      <View style={detailModalStyles.changeBullet} />
                      <Text style={detailModalStyles.changeText}>{change}</Text>
                    </View>
                  ))}
                </View>
              )}
              {assignment.editedAt && (
                <Text style={detailModalStyles.editedTime}>
                  Updated {formatTimeAgo(assignment.editedAt)}
                </Text>
              )}
            </View>
          )}

          {/* Header */}
          <View style={detailModalStyles.header}>
            <View style={[detailModalStyles.headerIcon, assignment.isEdited && { backgroundColor: '#FEF3C7' }]}>
              <Text style={detailModalStyles.headerEmoji}>
                {assignment.isEdited ? '🔄' : assignment.circleEmoji || '📋'}
              </Text>
            </View>
            <TouchableOpacity 
              style={detailModalStyles.closeButton}
              onPress={onClose}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={detailModalStyles.title}>{assignment.title}</Text>
          
          {/* Circle Info */}
          {assignment.circleName && (
            <View style={detailModalStyles.circleTag}>
              <Users size={14} color="#7C3AED" />
              <Text style={detailModalStyles.circleTagText}>{assignment.circleName}</Text>
            </View>
          )}

          {/* Description */}
          {assignment.description && (
            <View style={detailModalStyles.section}>
              <Text style={detailModalStyles.sectionLabel}>Description</Text>
              <Text style={detailModalStyles.description}>{assignment.description}</Text>
            </View>
          )}

          {/* Info Grid */}
          <View style={detailModalStyles.infoGrid}>
            {/* From */}
            <View style={detailModalStyles.infoItem}>
              <Text style={detailModalStyles.infoLabel}>Assigned by</Text>
              <Text style={detailModalStyles.infoValue}>{assignment.assignedByName}</Text>
            </View>

            {/* Due Date */}
            {assignment.dueDate && (
              <View style={detailModalStyles.infoItem}>
                <Text style={detailModalStyles.infoLabel}>Due</Text>
                <Text style={detailModalStyles.infoValue}>{assignment.dueDate} at {assignment.dueTime}</Text>
              </View>
            )}

            {/* XP Reward */}
            <View style={detailModalStyles.infoItem}>
              <Text style={detailModalStyles.infoLabel}>XP Reward</Text>
              <View style={detailModalStyles.xpBadge}>
                <Zap size={14} color="#F59E0B" />
                <Text style={detailModalStyles.xpText}>{assignment.xpReward || 50} XP</Text>
              </View>
            </View>

            {/* Proof Required */}
            {assignment.requireProof && (
              <View style={detailModalStyles.infoItem}>
                <Text style={detailModalStyles.infoLabel}>Proof Required</Text>
                <View style={detailModalStyles.proofBadge}>
                  <Eye size={14} color="#7C3AED" />
                  <Text style={detailModalStyles.proofText}>Yes</Text>
                </View>
              </View>
            )}

            {/* Repeat */}
            {assignment.repeatEnabled && (
              <View style={detailModalStyles.infoItem}>
                <Text style={detailModalStyles.infoLabel}>Repeats</Text>
                <Text style={detailModalStyles.infoValue}>
                  {assignment.repeatFrequency === 'daily' ? 'Daily' : 
                   assignment.repeatFrequency === 'weekly' ? 'Weekly' : 'Monthly'}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={detailModalStyles.actions}>
            {assignment.status === 'pending' && (
              <>
                <TouchableOpacity 
                  style={detailModalStyles.acceptButton}
                  onPress={onAccept}
                >
                  <CheckCircle size={18} color="#FFFFFF" />
                  <Text style={detailModalStyles.acceptButtonText}>Accept Mission</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={detailModalStyles.declineButton}
                  onPress={onDecline}
                >
                  <X size={18} color="#EF4444" />
                  <Text style={detailModalStyles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
              </>
            )}
            {assignment.status === 'accepted' && (
              <TouchableOpacity 
                style={detailModalStyles.acceptButton}
                onPress={onComplete}
              >
                <CheckCircle size={18} color="#FFFFFF" />
                <Text style={detailModalStyles.acceptButtonText}>Mark Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
