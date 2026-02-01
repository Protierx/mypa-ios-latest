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

const Colors = {
  primary: '#7c3aed',
  primaryLight: '#ede9fe',
  background: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  white: '#ffffff',
};

interface Member {
  id: string;
  name: string;
  initial: string;
}

interface MemberPickerModalProps {
  visible: boolean;
  onClose: () => void;
  members: Member[];
  onSelectMember: (member: Member) => void;
  selectedMemberId?: string;
}

export const MemberPickerModal: React.FC<MemberPickerModalProps> = ({
  visible,
  onClose,
  members,
  onSelectMember,
  selectedMemberId,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Select Member</Text>

          <ScrollView style={styles.memberList} showsVerticalScrollIndicator={false}>
            {members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberRow,
                  selectedMemberId === member.id && styles.memberRowSelected,
                ]}
                onPress={() => {
                  onSelectMember(member);
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#ec4899']}
                  style={styles.memberAvatar}
                >
                  <Text style={styles.memberAvatarText}>{member.initial}</Text>
                </LinearGradient>
                <Text style={styles.memberName}>{member.name}</Text>
                {selectedMemberId === member.id && (
                  <Feather name="check" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            
            {members.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No members to select</Text>
              </View>
            )}
          </ScrollView>
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
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
  },
  memberList: {
    maxHeight: 400,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  memberRowSelected: {
    backgroundColor: Colors.primaryLight,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
