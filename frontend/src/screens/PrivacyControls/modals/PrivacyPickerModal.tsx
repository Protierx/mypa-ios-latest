import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrivacyOption, Circle } from '../types';
import { styles } from '../styles';

interface PrivacyPickerModalProps {
  visible: boolean;
  selectedCircle: Circle | null;
  privacyOptions: PrivacyOption[];
  onSelectPrivacy: (value: string) => void;
  onClose: () => void;
}

export const PrivacyPickerModal: React.FC<PrivacyPickerModalProps> = ({
  visible,
  selectedCircle,
  privacyOptions,
  onSelectPrivacy,
  onClose,
}) => (
  <Modal visible={visible} transparent animationType="slide">
    <TouchableOpacity
      style={styles.pickerOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.pickerSheet}>
        <View style={styles.pickerHandle} />
        <Text style={styles.pickerTitle}>
          {selectedCircle?.name || 'Select privacy'}
        </Text>
        <View style={styles.pickerOptions}>
          {privacyOptions.map((option, idx) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.pickerOption,
                idx > 0 && styles.pickerOptionBorder,
              ]}
              onPress={() => onSelectPrivacy(option.value)}
            >
              <Text style={styles.pickerOptionText}>{option.label}</Text>
              {selectedCircle?.privacy === option.value && (
                <Ionicons name="checkmark" size={22} color="#7C3AED" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
          <Text style={styles.pickerCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);
