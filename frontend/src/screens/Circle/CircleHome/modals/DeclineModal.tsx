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
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { colors as Colors } from '../../../../styles/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

const QUICK_REASONS = ['Busy right now', 'Not enough time', 'Already have plans', 'Not feeling well'];

interface DeclineModalProps {
  visible: boolean;
  onClose: () => void;
  assignmentTitle: string;
  declineReason: string;
  onDeclineReasonChange: (reason: string) => void;
  onConfirmDecline: (withReason: boolean) => void;
  decliningInProgress: boolean;
}

export const DeclineModal: React.FC<DeclineModalProps> = ({
  visible,
  onClose,
  assignmentTitle,
  declineReason,
  onDeclineReasonChange,
  onConfirmDecline,
  decliningInProgress,
}) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
        />
        
        {/* Modal Content */}
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="x-circle" size={28} color={Colors.danger} />
            </View>
            <Text style={styles.title}>Decline Mission?</Text>
            <Text style={styles.subtitle}>
              Would you like to share why you're declining{'\n'}"{assignmentTitle}"?
            </Text>
          </View>
          
          {/* Reason Input */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., I have a prior commitment, busy with exams..."
              placeholderTextColor={Colors.textMuted}
              value={declineReason}
              onChangeText={onDeclineReasonChange}
              multiline
              maxLength={200}
              autoFocus={false}
            />
            <Text style={styles.charCount}>
              {declineReason.length}/200 (optional)
            </Text>
          </View>
          
          {/* Quick Reason Chips */}
          <View style={styles.chipsSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              {QUICK_REASONS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  onPress={() => onDeclineReasonChange(chip)}
                  style={[
                    styles.chip,
                    declineReason === chip && styles.chipSelected
                  ]}
                >
                  <Text style={[
                    styles.chipText,
                    declineReason === chip && styles.chipTextSelected
                  ]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Decline with Reason */}
            <TouchableOpacity
              onPress={() => onConfirmDecline(true)}
              disabled={decliningInProgress}
              style={[styles.actionButton, styles.declineButton]}
            >
              {decliningInProgress ? (
                <ActivityIndicator color={Colors.danger} />
              ) : (
                <Text style={styles.declineButtonText}>
                  {declineReason.trim() ? 'Decline with Reason' : 'Decline without Reason'}
                </Text>
              )}
            </TouchableOpacity>
            
            {/* Cancel */}
            <TouchableOpacity
              onPress={handleClose}
              disabled={decliningInProgress}
              style={styles.actionButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    marginHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    width: SCREEN_WIDTH - 40,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 6,
  },
  chipsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chipsContainer: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.primary,
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  declineButton: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  declineButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.danger,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default DeclineModal;
