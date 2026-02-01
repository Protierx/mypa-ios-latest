import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContactType } from '../types';
import { CONTACT_TYPES } from '../constants';
import { styles } from '../styles';

interface ContactModalProps {
  visible: boolean;
  contactType: ContactType;
  message: string;
  messageSent: boolean;
  onContactTypeChange: (type: ContactType) => void;
  onMessageChange: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  visible,
  contactType,
  message,
  messageSent,
  onContactTypeChange,
  onMessageChange,
  onClose,
  onSubmit,
}) => {
  const getPlaceholder = () => {
    switch (contactType) {
      case 'bug':
        return 'What happened? What did you expect to happen?';
      case 'feature':
        return "Describe the feature you'd like to see...";
      default:
        return 'How can we help?';
    }
  };

  const getTitle = () => {
    switch (contactType) {
      case 'bug':
        return 'Report a Bug';
      case 'feature':
        return 'Suggest a Feature';
      default:
        return 'Contact Us';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />

          {messageSent ? (
            <View style={styles.successView}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={32} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Message Sent!</Text>
              <Text style={styles.successDesc}>
                We'll get back to you within 24 hours
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{getTitle()}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.typePills}>
                {CONTACT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typePill,
                      contactType === type.id && styles.typePillActive,
                    ]}
                    onPress={() => onContactTypeChange(type.id)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={16}
                      color={contactType === type.id ? '#FFFFFF' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.typePillText,
                        contactType === type.id && { color: '#FFFFFF' },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={onMessageChange}
                placeholder={getPlaceholder()}
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !message.trim() && { opacity: 0.5 },
                ]}
                onPress={onSubmit}
                disabled={!message.trim()}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>Send Message</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};
