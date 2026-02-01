import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors as Colors } from '../../../../styles/colors';

interface SubmitProofModalProps {
  visible: boolean;
  onClose: () => void;
  proofUrl: string;
  proofNote: string;
  onProofUrlChange: (text: string) => void;
  onProofNoteChange: (text: string) => void;
  onSubmit: () => void;
  submittingProof: boolean;
}

export const SubmitProofModal: React.FC<SubmitProofModalProps> = ({
  visible,
  onClose,
  proofUrl,
  proofNote,
  onProofUrlChange,
  onProofNoteChange,
  onSubmit,
  submittingProof,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />
        <View style={styles.bottomSheet} pointerEvents="auto">
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>📸 Submit Proof</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Proof Link (photo or file)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://..."
              value={proofUrl}
              onChangeText={onProofUrlChange}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.inputLabel, { marginTop: 8 }]}>Note (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Add a short note..."
              value={proofNote}
              onChangeText={onProofNoteChange}
              multiline
            />
            <View style={{ height: 12 }} />
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalButton, styles.cancelButton]}
              disabled={submittingProof}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSubmit}
              style={[styles.modalButton, styles.submitButton]}
              disabled={submittingProof}
            >
              {submittingProof ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit & Complete</Text>
              )}
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
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  submitButton: {
    flex: 2,
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default SubmitProofModal;
