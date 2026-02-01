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
  background: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  white: '#ffffff',
};

interface ViewProofModalProps {
  visible: boolean;
  onClose: () => void;
  proofUrl?: string;
  onCopy: () => void;
  onOpen: () => void;
}

export const ViewProofModal: React.FC<ViewProofModalProps> = ({
  visible,
  onClose,
  proofUrl,
  onCopy,
  onOpen,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Proof</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Proof link</Text>
          <View style={styles.urlBox}>
            <Text style={styles.urlText} numberOfLines={2}>{proofUrl || 'No proof link available.'}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onCopy}>
              <Text style={styles.secondaryButtonText}>Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={onOpen}>
              <Text style={styles.primaryButtonText}>Open</Text>
            </TouchableOpacity>
          </View>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  urlBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.surface,
  },
  urlText: {
    color: Colors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});
