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
import { colors as Colors } from '../../../../styles/colors';

interface Member {
  id: string;
  name: string;
  initial: string;
  posted: boolean;
  lastPostTime?: string;
}

interface TodayModalProps {
  visible: boolean;
  onClose: () => void;
  circleName: string;
  postedCount: number;
  totalCount: number;
  userPosted: boolean;
  members: Member[];
  onMemberPress: (member: Member) => void;
  onShareToday: () => void;
  onAssignMission: () => void;
}

export const TodayModal: React.FC<TodayModalProps> = ({
  visible,
  onClose,
  circleName,
  postedCount,
  totalCount,
  userPosted,
  members,
  onMemberPress,
  onShareToday,
  onAssignMission,
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
            <Text style={styles.sheetTitle}>Today in {circleName}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.checkinStats}>
            Checked in today: {postedCount} of {totalCount}
          </Text>

          <ScrollView style={styles.memberListScroll}>
            {/* Your row */}
            <TouchableOpacity style={styles.todayMemberRow}>
              <LinearGradient
                colors={['#a78bfa', '#7c3aed']}
                style={styles.todayMemberAvatar}
              >
                <Text style={styles.todayMemberAvatarText}>Y</Text>
              </LinearGradient>
              <View style={styles.todayMemberInfo}>
                <Text style={styles.todayMemberName}>You</Text>
                <Text style={styles.todayMemberStatus}>
                  {userPosted ? 'Posted today' : 'Not posted yet'}
                </Text>
              </View>
              {userPosted && (
                <View style={styles.postedCheckmark}>
                  <Feather name="check" size={16} color={Colors.success} />
                </View>
              )}
            </TouchableOpacity>

            {/* Other members */}
            {members.map(member => (
              <TouchableOpacity 
                key={member.id}
                style={styles.todayMemberRow}
                onPress={() => onMemberPress(member)}
              >
                <LinearGradient
                  colors={['#c4b5fd', '#8b5cf6']}
                  style={styles.todayMemberAvatar}
                >
                  <Text style={styles.todayMemberAvatarText}>{member.initial}</Text>
                </LinearGradient>
                <View style={styles.todayMemberInfo}>
                  <Text style={styles.todayMemberName}>{member.name}</Text>
                  <Text style={styles.todayMemberStatus}>
                    {member.posted ? `Posted ${member.lastPostTime}` : 'Not posted yet'}
                  </Text>
                </View>
                {member.posted && (
                  <View style={styles.postedCheckmark}>
                    <Feather name="check" size={16} color={Colors.success} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.todayModalActions}>
            <TouchableOpacity 
              style={styles.todayShareButton}
              onPress={() => {
                onClose();
                onShareToday();
              }}
            >
              <LinearGradient
                colors={['#8b5cf6', '#ec4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.todayShareButtonGradient}
              >
                <Text style={styles.todayShareButtonText}>Share Today</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.todayAssignButton}
              onPress={() => {
                onClose();
                onAssignMission();
              }}
            >
              <Text style={styles.todayAssignButtonText}>Assign Mission</Text>
            </TouchableOpacity>
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
    maxHeight: '80%',
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
  checkinStats: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  memberListScroll: {
    maxHeight: 300,
  },
  todayMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  todayMemberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayMemberAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  todayMemberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  todayMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  todayMemberStatus: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  postedCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayModalActions: {
    marginTop: 20,
    gap: 12,
  },
  todayShareButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  todayShareButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  todayShareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  todayAssignButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  todayAssignButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

export default TodayModal;
