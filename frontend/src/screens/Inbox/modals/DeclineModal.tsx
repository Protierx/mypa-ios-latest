import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';

import { declineModalStyles } from '../styles';

const QUICK_REASONS = ['Busy right now', 'Not enough time', 'Already have plans', 'Not feeling well'];

interface DeclineModalProps {
  visible: boolean;
  assignmentTitle: string;
  reason: string;
  isProcessing: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeclineModal: React.FC<DeclineModalProps> = ({
  visible,
  assignmentTitle,
  reason,
  isProcessing,
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={declineModalStyles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onCancel}
        />
        
        {/* Modal Content */}
        <View style={declineModalStyles.content}>
          {/* Header */}
          <View style={declineModalStyles.header}>
            <View style={declineModalStyles.iconContainer}>
              <X size={28} color="#EF4444" />
            </View>
            <Text style={declineModalStyles.title}>Decline Mission?</Text>
            <Text style={declineModalStyles.subtitle}>
              Would you like to share why you're declining{'\n'}"{assignmentTitle}"?
            </Text>
          </View>
          
          {/* Reason Input */}
          <View style={declineModalStyles.inputContainer}>
            <TextInput
              style={declineModalStyles.input}
              placeholder="e.g., I have a prior commitment, busy with exams..."
              placeholderTextColor="#9CA3AF"
              value={reason}
              onChangeText={onReasonChange}
              multiline
              maxLength={200}
            />
            <Text style={declineModalStyles.charCount}>
              {reason.length}/200 (optional)
            </Text>
          </View>
          
          {/* Quick Reason Chips */}
          <View style={declineModalStyles.chipsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {QUICK_REASONS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  onPress={() => onReasonChange(chip)}
                  style={[
                    declineModalStyles.chip,
                    reason === chip && declineModalStyles.chipSelected
                  ]}
                >
                  <Text style={[
                    declineModalStyles.chipText,
                    reason === chip && declineModalStyles.chipTextSelected
                  ]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Action Buttons */}
          <View style={declineModalStyles.actions}>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={isProcessing}
              style={[declineModalStyles.declineButton, isProcessing && { opacity: 0.5 }]}
            >
              {isProcessing ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <Text style={declineModalStyles.declineButtonText}>
                  {reason.trim() ? 'Decline with Reason' : 'Decline without Reason'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onCancel}
              disabled={isProcessing}
              style={declineModalStyles.cancelButton}
            >
              <Text style={declineModalStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
