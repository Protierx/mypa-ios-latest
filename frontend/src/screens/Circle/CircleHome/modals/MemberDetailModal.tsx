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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
const Colors = {
  primary: '#7c3aed',
  background: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  white: '#ffffff',
};

interface MemberDetailModalProps {
  visible: boolean;
  onClose: () => void;
  member: any | null;
  onAssignMission: (member: any) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  visible,
  onClose,
  member,
  onAssignMission,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Member Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {member && (
            <View style={styles.memberBlock}>
              <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.avatar}>
                <Text style={styles.avatarText}>{member.initial}</Text>
              </LinearGradient>
              <Text style={styles.name}>{member.name}</Text>
              <Text style={styles.subtitle}>
                {member.posted ? `Last check-in: ${member.lastPostTime || 'Today'}` : 'Has not posted today'}
              </Text>

              <TouchableOpacity
                style={styles.assignButton}
                onPress={() => onAssignMission(member)}
              >
                <Feather name="crosshair" size={16} color={Colors.white} />
                <Text style={styles.assignButtonText}>Assign Mission</Text>
              </TouchableOpacity>
            </View>
          )}
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
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  memberBlock: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  assignButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});
