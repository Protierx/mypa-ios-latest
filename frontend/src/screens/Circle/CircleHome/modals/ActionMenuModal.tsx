import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const Colors = {
  primary: '#7c3aed',
  background: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  danger: '#ef4444',
  white: '#ffffff',
};

interface ActionMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onAssignMission: () => void;
  onInviteMembers: () => void;
  onCircleSettings: () => void;
  onLeaveCircle: () => void;
}

export function ActionMenuModal({
  visible,
  onClose,
  onAssignMission,
  onInviteMembers,
  onCircleSettings,
  onLeaveCircle,
}: ActionMenuModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Options</Text>

          <TouchableOpacity
            onPress={() => {
              onClose();
              setTimeout(onAssignMission, 300);
            }}
            style={styles.sheetOption}
          >
            <Feather name="plus-circle" size={24} color={Colors.primary} />
            <Text style={styles.sheetOptionText}>Assign Mission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onClose();
              setTimeout(onInviteMembers, 300);
            }}
            style={styles.sheetOption}
          >
            <Feather name="share" size={24} color="#3b82f6" />
            <Text style={styles.sheetOptionText}>Invite Members</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onClose();
              setTimeout(onCircleSettings, 300);
            }}
            style={styles.sheetOption}
          >
            <Feather name="more-horizontal" size={24} color={Colors.textSecondary} />
            <Text style={styles.sheetOptionText}>Circle Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onLeaveCircle}
            style={[styles.sheetOption, { borderBottomWidth: 0 }]}
          >
            <Feather name="log-out" size={24} color={Colors.danger} />
            <Text style={[styles.sheetOptionText, { color: Colors.danger }]}>Leave Circle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 16,
  },
  sheetOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
