import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors as Colors } from '../../../../styles/colors';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  circleName: string;
  inviteLink: string;
  inviteCode: string;
  copySuccess: 'link' | 'code' | null;
  onShareLink: () => void;
  onCopyInvite: (text: string, type: 'link' | 'code') => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  visible,
  onClose,
  circleName,
  inviteLink,
  inviteCode,
  copySuccess,
  onShareLink,
  onCopyInvite,
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
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.sheetTitle}>Invite to {circleName}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Share Link Section */}
          <View style={styles.inviteLinkSection}>
            <Text style={styles.inviteLabel}>Invite Link</Text>
            <View style={styles.inviteLinkRow}>
              <Text style={styles.inviteLinkText} numberOfLines={1}>{inviteLink}</Text>
            </View>
            <View style={styles.inviteLinkButtons}>
              <TouchableOpacity
                onPress={onShareLink}
                style={styles.inviteShareLinkButton}
              >
                <Feather name="share" size={18} color={Colors.white} />
                <Text style={styles.inviteShareLinkText}>Share link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onCopyInvite(inviteLink, 'link')}
                style={styles.inviteCopyLinkButton}
              >
                <Feather 
                  name={copySuccess === 'link' ? 'check' : 'copy'} 
                  size={18} 
                  color={copySuccess === 'link' ? Colors.success : Colors.primary} 
                />
                <Text style={[
                  styles.inviteCopyLinkText,
                  copySuccess === 'link' && { color: Colors.success }
                ]}>
                  {copySuccess === 'link' ? 'Copied' : 'Copy link'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.inviteDivider} />

          {/* Large Invite Code */}
          <View style={styles.inviteCodeSection}>
            <Text style={styles.inviteCodeLabel}>Or share this code</Text>
            <View style={styles.inviteCodeDisplay}>
              <Text style={styles.inviteCodeBig}>{inviteCode}</Text>
            </View>
            <TouchableOpacity
              onPress={() => onCopyInvite(inviteCode, 'code')}
              style={styles.inviteCopyCodeButton}
            >
              <Feather 
                name={copySuccess === 'code' ? 'check' : 'copy'} 
                size={18} 
                color={copySuccess === 'code' ? Colors.success : Colors.primary} 
              />
              <Text style={[
                styles.inviteCopyCodeText,
                copySuccess === 'code' && { color: Colors.success }
              ]}>
                {copySuccess === 'code' ? 'Copied!' : 'Copy code'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.inviteHelperText}>
              Others can join using this code in the app
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
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  inviteLinkSection: {
    marginBottom: 20,
  },
  inviteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inviteLinkRow: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  inviteLinkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  inviteLinkButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  inviteShareLinkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  inviteShareLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  inviteCopyLinkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  inviteCopyLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  inviteDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  inviteCodeSection: {
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inviteCodeDisplay: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  inviteCodeBig: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 4,
  },
  inviteCopyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  inviteCopyCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  inviteHelperText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
});

export default InviteModal;
