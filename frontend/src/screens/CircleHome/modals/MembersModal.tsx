import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
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
  posted: boolean;
}

interface MembersModalProps {
  visible: boolean;
  onClose: () => void;
  userPosted: boolean;
  members: Member[];
}

export const MembersModal: React.FC<MembersModalProps> = ({
  visible,
  onClose,
  userPosted,
  members,
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
        <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.sheetTitle}>Members</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.memberListScroll}>
            {/* You */}
            <View style={styles.membersModalRow}>
              <LinearGradient
                colors={['#a78bfa', '#7c3aed']}
                style={styles.membersModalAvatar}
              >
                <Text style={styles.membersModalAvatarText}>Y</Text>
              </LinearGradient>
              <View style={styles.membersModalInfo}>
                <Text style={styles.membersModalName}>You (Admin)</Text>
              </View>
              {userPosted && (
                <Text style={styles.membersModalPosted}>✓ Posted</Text>
              )}
            </View>

            {/* Other members */}
            {members.map(member => (
              <View key={member.id} style={styles.membersModalRow}>
                <LinearGradient
                  colors={['#c4b5fd', '#8b5cf6']}
                  style={styles.membersModalAvatar}
                >
                  <Text style={styles.membersModalAvatarText}>{member.initial}</Text>
                </LinearGradient>
                <View style={styles.membersModalInfo}>
                  <Text style={styles.membersModalName}>
                    {member.name}{member.role === 'admin' ? ' (Admin)' : ''}
                  </Text>
                </View>
                {member.posted && (
                  <Text style={styles.membersModalPosted}>✓ Posted</Text>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.circlePrivacyInfo}>
            <Feather name="lock" size={16} color={Colors.textMuted} />
            <Text style={styles.circlePrivacyText}>
              This is a private circle. Only members can see posts.
            </Text>
          </View>
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
  bottomSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  memberListScroll: {
    maxHeight: 350,
  },
  membersModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  membersModalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membersModalAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  membersModalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  membersModalName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  membersModalPosted: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
  },
  circlePrivacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 16,
  },
  circlePrivacyText: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },
});

export default MembersModal;
