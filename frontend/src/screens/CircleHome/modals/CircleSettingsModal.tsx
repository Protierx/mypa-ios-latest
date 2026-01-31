import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../../styles/colors';

interface CircleSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  circleName: string;
  circleEmoji: string;
  onCircleNameChange: (text: string) => void;
  onCircleEmojiChange: (text: string) => void;
  onSaveSettings: () => void;
  onDeleteCircle: () => void;
}

export const CircleSettingsModal: React.FC<CircleSettingsModalProps> = ({
  visible,
  onClose,
  circleName,
  circleEmoji,
  onCircleNameChange,
  onCircleEmojiChange,
  onSaveSettings,
  onDeleteCircle,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.settingsSheet} onStartShouldSetResponder={() => true}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Circle Settings</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Circle Info Section */}
            <Text style={styles.settingsSectionTitle}>CIRCLE INFO</Text>
            
            <Text style={styles.inputLabel}>Circle Name</Text>
            <TextInput
              value={circleName}
              onChangeText={onCircleNameChange}
              style={styles.textInput}
              placeholder="Circle name"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>Circle Emoji</Text>
            <TextInput
              value={circleEmoji}
              onChangeText={onCircleEmojiChange}
              style={styles.textInput}
              placeholder="Choose an emoji"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Permissions Section */}
            <Text style={styles.settingsSectionTitle}>PERMISSIONS</Text>
            
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowInfo}>
                <Text style={styles.settingsRowTitle}>Anyone can post challenges</Text>
                <Text style={styles.settingsRowSubtitle}>Allow all members to create challenges</Text>
              </View>
              <TouchableOpacity style={[styles.toggle, styles.toggleOn]}>
                <View style={[styles.toggleThumb, styles.toggleThumbOn]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsRow}>
              <View style={styles.settingsRowInfo}>
                <Text style={styles.settingsRowTitle}>Anyone can invite</Text>
                <Text style={styles.settingsRowSubtitle}>Allow all members to invite others</Text>
              </View>
              <TouchableOpacity style={[styles.toggle, styles.toggleOn]}>
                <View style={[styles.toggleThumb, styles.toggleThumbOn]} />
              </TouchableOpacity>
            </View>

            {/* Notifications Section */}
            <Text style={styles.settingsSectionTitle}>NOTIFICATIONS</Text>
            
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowInfo}>
                <Text style={styles.settingsRowTitle}>Daily reminder</Text>
                <Text style={styles.settingsRowSubtitle}>Remind members who haven't posted</Text>
              </View>
              <TouchableOpacity style={[styles.toggle, styles.toggleOn]}>
                <View style={[styles.toggleThumb, styles.toggleThumbOn]} />
              </TouchableOpacity>
            </View>

            {/* Danger Zone */}
            <Text style={[styles.settingsSectionTitle, { color: Colors.danger }]}>DANGER ZONE</Text>
            
            <TouchableOpacity
              onPress={onDeleteCircle}
              style={styles.dangerButton}
            >
              <Feather name="trash-2" size={20} color={Colors.danger} />
              <Text style={styles.dangerButtonText}>Delete Circle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSaveSettings}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Save Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  settingsSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
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
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
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
    marginBottom: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsRowInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingsRowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  settingsRowSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    padding: 2,
  },
  toggleOn: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: Colors.white,
  },
  toggleThumbOn: {
    marginLeft: 'auto',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
    marginTop: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.danger,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

export default CircleSettingsModal;
