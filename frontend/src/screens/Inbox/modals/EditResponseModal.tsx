import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { CheckCircle } from 'lucide-react-native';

import { editModalStyles } from '../styles';

interface EditResponseModalProps {
  visible: boolean;
  reason: string;
  isProcessing: boolean;
  onReasonChange: (reason: string) => void;
  onUpdateReason: () => void;
  onAcceptInstead: () => void;
  onClose: () => void;
}

export const EditResponseModal: React.FC<EditResponseModalProps> = ({
  visible,
  reason,
  isProcessing,
  onReasonChange,
  onUpdateReason,
  onAcceptInstead,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={editModalStyles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={editModalStyles.sheet}>
          <View style={editModalStyles.handle} />
          
          {/* Header */}
          <View style={editModalStyles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={editModalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={editModalStyles.title}>Edit Your Response</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={editModalStyles.content} showsVerticalScrollIndicator={false}>
            <Text style={editModalStyles.label}>Your Decline Reason</Text>
            <TextInput
              value={reason}
              onChangeText={onReasonChange}
              style={[editModalStyles.input, { height: 120 }]}
              placeholder="Explain why you can't complete this mission..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={editModalStyles.primaryButton}
              onPress={onUpdateReason}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={editModalStyles.primaryButtonText}>Update Reason</Text>
              )}
            </TouchableOpacity>

            <View style={editModalStyles.divider}>
              <View style={editModalStyles.dividerLine} />
              <Text style={editModalStyles.dividerText}>or</Text>
              <View style={editModalStyles.dividerLine} />
            </View>

            <TouchableOpacity
              style={editModalStyles.acceptButton}
              onPress={onAcceptInstead}
              disabled={isProcessing}
            >
              <CheckCircle size={18} color="#10B981" />
              <Text style={editModalStyles.acceptButtonText}>Accept Mission Instead</Text>
            </TouchableOpacity>

            <Text style={editModalStyles.acceptHint}>
              Changed your mind? Accept the mission and it will be added to your tasks.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
