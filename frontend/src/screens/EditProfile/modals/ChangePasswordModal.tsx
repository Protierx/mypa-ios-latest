import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MIN_PASSWORD_LENGTH } from '../constants';
import { styles } from '../styles';

interface ChangePasswordModalProps {
  visible: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  currentPassword,
  newPassword,
  confirmPassword,
  showCurrentPassword,
  showNewPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onClose,
  onSubmit,
}) => {
  const isValid =
    currentPassword &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    newPassword === confirmPassword;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Change Password</Text>

          <View style={styles.passwordInput}>
            <Text style={styles.passwordLabel}>Current Password</Text>
            <View style={styles.passwordField}>
              <TextInput
                style={styles.passwordTextInput}
                value={currentPassword}
                onChangeText={onCurrentPasswordChange}
                placeholder="Enter current password"
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity onPress={onToggleCurrentPassword}>
                <Ionicons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.passwordInput}>
            <Text style={styles.passwordLabel}>New Password</Text>
            <View style={styles.passwordField}>
              <TextInput
                style={styles.passwordTextInput}
                value={newPassword}
                onChangeText={onNewPasswordChange}
                placeholder="At least 8 characters"
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity onPress={onToggleNewPassword}>
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
            {newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH && (
              <Text style={styles.errorText}>
                Password must be at least {MIN_PASSWORD_LENGTH} characters
              </Text>
            )}
          </View>

          <View style={styles.passwordInput}>
            <Text style={styles.passwordLabel}>Confirm New Password</Text>
            <TextInput
              style={[styles.passwordField, styles.passwordTextInput]}
              value={confirmPassword}
              onChangeText={onConfirmPasswordChange}
              placeholder="Confirm new password"
              secureTextEntry
            />
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.updateButton, !isValid && { opacity: 0.5 }]}
              disabled={!isValid}
              onPress={onSubmit}
            >
              <Text style={styles.updateButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
