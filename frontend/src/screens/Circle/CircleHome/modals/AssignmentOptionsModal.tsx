import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
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
  danger: '#ef4444',
  white: '#ffffff',
};

interface AssignmentOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  assignment: any | null;
  isSender: boolean;
  isRecipient: boolean;
  onEdit: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onComplete: () => void;
  onSubmitProof: () => void;
  onViewProof: () => void;
  onHide: () => void;
}

export const AssignmentOptionsModal: React.FC<AssignmentOptionsModalProps> = ({
  visible,
  onClose,
  assignment,
  isSender,
  isRecipient,
  onEdit,
  onAccept,
  onDecline,
  onComplete,
  onSubmitProof,
  onViewProof,
  onHide,
}) => {
  const statusLabel = assignment?.status === 'accepted'
    ? '✅ Accepted'
    : assignment?.status === 'declined'
      ? '❌ Declined'
      : assignment?.status === 'completed'
        ? '🎉 Completed'
        : '⏳ Pending';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.sheetGroup}>
            {assignment && (
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>{assignment.title}</Text>
                  <Text style={styles.subtitle}>
                    {statusLabel}
                    {isSender && ' • You sent this'}
                    {isRecipient && ' • Assigned to you'}
                  </Text>
                </View>

                {isSender && assignment.status !== 'completed' && (
                  <TouchableOpacity onPress={onEdit} style={styles.sheetButton}>
                    <Feather name="edit-2" size={18} color={Colors.primary} />
                    <Text style={styles.sheetButtonText}>Edit Mission</Text>
                  </TouchableOpacity>
                )}

                {isRecipient && (assignment.status === 'pending' || assignment.status === 'declined') && (
                  <TouchableOpacity onPress={onAccept} style={styles.sheetButton}>
                    <Feather name="check-circle" size={18} color={Colors.success} />
                    <Text style={[styles.sheetButtonText, { color: Colors.success }]}>Accept Mission</Text>
                  </TouchableOpacity>
                )}

                {isRecipient && (assignment.status === 'pending' || assignment.status === 'accepted') && (
                  <TouchableOpacity onPress={onDecline} style={[styles.sheetButton, styles.destructiveButton]}>
                    <Feather name="x-circle" size={18} color={Colors.danger} />
                    <Text style={[styles.sheetButtonText, { color: Colors.danger }]}>Decline Mission</Text>
                  </TouchableOpacity>
                )}

                {isRecipient && assignment.status === 'accepted' && (
                  <TouchableOpacity
                    onPress={assignment.requireProof ? onSubmitProof : onComplete}
                    style={styles.sheetButton}
                  >
                    <Feather name="check" size={18} color={Colors.success} />
                    <Text style={[styles.sheetButtonText, { color: Colors.success }]}> 
                      {assignment.requireProof ? 'Submit Proof & Complete' : 'Complete Mission'}
                    </Text>
                  </TouchableOpacity>
                )}

                {assignment.status === 'completed' && assignment.proofUrl && (
                  <TouchableOpacity onPress={onViewProof} style={styles.sheetButton}>
                    <Feather name="image" size={18} color={Colors.primary} />
                    <Text style={styles.sheetButtonText}>View Proof</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={onHide} style={styles.sheetButton}>
                  <Feather name="eye-off" size={18} color={Colors.textMuted} />
                  <Text style={styles.sheetButtonText}>Hide from Feed</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: 16,
  },
  sheetGroup: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sheetButtonText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  destructiveButton: {
    backgroundColor: '#fff5f5',
  },
  cancelButton: {
    marginTop: 12,
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
