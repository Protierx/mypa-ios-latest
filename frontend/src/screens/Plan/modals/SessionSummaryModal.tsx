import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { FocusSession } from '../types';
import { formatTimer } from '../utils';
import { styles } from '../styles';

interface SessionSummaryModalProps {
  session: FocusSession | null;
  onClose: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  session,
  onClose,
}) => {
  if (!session) return null;
  
  return (
    <Modal visible={!!session} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {session.wasCompleted ? 'Great Work!' : 'Session Ended'}
          </Text>
          <Text style={styles.summarySubtitle}>{session.taskTitle}</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>{formatTimer(session.elapsedSeconds)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Progress</Text>
              <Text style={styles.summaryValue}>{session.percentComplete}%</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.summaryValue}>{session.wasCompleted ? '✅' : '⏸️'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.summaryButton} onPress={onClose}>
            <Text style={styles.summaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
