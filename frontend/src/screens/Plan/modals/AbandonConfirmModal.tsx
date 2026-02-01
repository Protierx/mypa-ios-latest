import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { styles } from '../styles';

interface AbandonConfirmModalProps {
  visible: boolean;
  onKeepGoing: () => void;
  onEndSession: () => void;
}

export const AbandonConfirmModal: React.FC<AbandonConfirmModalProps> = ({
  visible,
  onKeepGoing,
  onEndSession,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onKeepGoing} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>End Session Early?</Text>
          <Text style={styles.modalBody}>You're partway through. Want to keep going?</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalSubmit} onPress={onKeepGoing}>
              <Text style={styles.modalSubmitText}>Keep Going</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={onEndSession}>
              <Text style={styles.modalCancelText}>End Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
