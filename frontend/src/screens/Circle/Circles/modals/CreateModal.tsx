import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { styles } from '../styles';

interface CreateModalProps {
  visible: boolean;
  newName: string;
  newMembers: string;
  newPrivacy: 'public' | 'private';
  onClose: () => void;
  onNameChange: (text: string) => void;
  onMembersChange: (text: string) => void;
  onPrivacyChange: (privacy: 'public' | 'private') => void;
  onSubmit: () => void;
}

export function CreateModal({
  visible,
  newName,
  newMembers,
  newPrivacy,
  onClose,
  onNameChange,
  onMembersChange,
  onPrivacyChange,
  onSubmit,
}: CreateModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.createModal}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Create Circle</Text>

          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            value={newName}
            onChangeText={onNameChange}
            placeholder="e.g. Weekend Runners"
            placeholderTextColor="#94a3b8"
            style={styles.modalInput}
          />

          <Text style={styles.inputLabel}>Invite Members</Text>
          <TextInput
            value={newMembers}
            onChangeText={onMembersChange}
            placeholder="Alex, Sam, Priya"
            placeholderTextColor="#94a3b8"
            style={styles.modalInput}
          />

          <Text style={styles.inputLabel}>Privacy</Text>
          <View style={styles.privacyRow}>
            <Pressable
              onPress={() => onPrivacyChange('public')}
              style={[
                styles.privacyButton,
                newPrivacy === 'public' && styles.privacyButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.privacyButtonText,
                  newPrivacy === 'public' && styles.privacyButtonTextActive,
                ]}
              >
                Public
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onPrivacyChange('private')}
              style={[
                styles.privacyButton,
                newPrivacy === 'private' && styles.privacyButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.privacyButtonText,
                  newPrivacy === 'private' && styles.privacyButtonTextActive,
                ]}
              >
                Private
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onSubmit}
            disabled={!newName.trim()}
            style={({ pressed }) => [
              styles.createSubmitButton,
              !newName.trim() && styles.createSubmitButtonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.createSubmitText}>Create Circle</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
