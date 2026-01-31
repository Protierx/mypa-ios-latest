import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../styles/colors';

interface Member {
  id: string;
  name: string;
  initial: string;
  role: 'admin' | 'member';
}

interface MemberOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedMember: Member | null;
  onViewProfile: (member: Member) => void;
  onToggleAdmin: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export const MemberOptionsModal: React.FC<MemberOptionsModalProps> = ({
  visible,
  onClose,
  selectedMember,
  onViewProfile,
  onToggleAdmin,
  onRemoveMember,
}) => {
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
        <View style={styles.actionSheetContainer}>
          {selectedMember && (
            <>
              <View style={styles.memberOptionHeader}>
                <LinearGradient
                  colors={['#c4b5fd', '#8b5cf6']}
                  style={styles.memberOptionAvatar}
                >
                  <Text style={styles.memberOptionAvatarText}>{selectedMember.initial}</Text>
                </LinearGradient>
                <Text style={styles.memberOptionName}>{selectedMember.name}</Text>
                <Text style={styles.memberOptionRole}>
                  {selectedMember.role === 'admin' ? 'Admin' : 'Member'}
                </Text>
              </View>

              <View style={styles.actionSheetGroup}>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onViewProfile(selectedMember);
                  }}
                  style={styles.actionSheetButton}
                >
                  <Feather name="user" size={20} color={Colors.primary} />
                  <Text style={styles.actionSheetButtonText}>View Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onToggleAdmin(selectedMember.id)}
                  style={styles.actionSheetButton}
                >
                  <Feather 
                    name={selectedMember.role === 'admin' ? 'user-minus' : 'user-plus'} 
                    size={20} 
                    color={Colors.primary} 
                  />
                  <Text style={styles.actionSheetButtonText}>
                    {selectedMember.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onRemoveMember(selectedMember.id)}
                  style={[styles.actionSheetButton, styles.actionSheetButtonDestructive]}
                >
                  <Feather name="user-x" size={20} color={Colors.danger} />
                  <Text style={[styles.actionSheetButtonText, { color: Colors.danger }]}>
                    Remove from Circle
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          
          <TouchableOpacity
            onPress={onClose}
            style={styles.actionSheetCancel}
          >
            <Text style={styles.actionSheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    paddingHorizontal: 12,
    paddingBottom: 34,
  },
  memberOptionHeader: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  memberOptionAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  memberOptionAvatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
  },
  memberOptionName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  memberOptionRole: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actionSheetGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  actionSheetButtonDestructive: {
    // Styling is handled via text color
  },
  actionSheetButtonText: {
    fontSize: 17,
    color: Colors.textPrimary,
    fontWeight: '400',
  },
  actionSheetCancel: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default MemberOptionsModal;
