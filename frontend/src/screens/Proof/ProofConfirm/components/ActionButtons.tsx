import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../styles';
import { styles } from '../styles';

interface ActionButtonsProps {
  onRetake: () => void;
  onConfirm: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onRetake,
  onConfirm,
}) => (
  <View style={styles.actions}>
    <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
      <Ionicons name="refresh" size={20} color={colors.white} />
      <Text style={styles.retakeText}>Retake</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
      <Ionicons name="checkmark" size={20} color={colors.white} />
      <Text style={styles.confirmText}>Confirm & Submit</Text>
    </TouchableOpacity>
  </View>
);
