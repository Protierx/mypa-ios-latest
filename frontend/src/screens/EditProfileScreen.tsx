import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface EditProfileScreenProps {
  navigation?: any;
}

export function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const [displayName, setDisplayName] = useState('Khalid Ahmed');
  const [username, setUsername] = useState('khalid_m');
  const [email, setEmail] = useState('khalid@email.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [bio, setBio] = useState('Productivity enthusiast');
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);
    if (cleaned.length >= 3) {
      setTimeout(() => setUsernameAvailable(cleaned !== 'taken_username'), 300);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      navigation?.goBack();
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#475569" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {saveSuccess && (
          <View style={styles.successToast}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.successToastText}>Profile Updated!</Text>
          </View>
        )}

        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/mypa-orb.png')}
              style={styles.avatar}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>BASIC INFORMATION</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                />
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="at" size={20} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="username"
                  autoCapitalize="none"
                />
                {usernameAvailable === true && <Ionicons name="checkmark" size={20} color="#10B981" />}
                {usernameAvailable === false && <Ionicons name="close" size={20} color="#EF4444" />}
              </View>
              {usernameAvailable === false && (
                <Text style={styles.errorText}>Username is taken</Text>
              )}
              {usernameAvailable === true && (
                <Text style={styles.successText}>Username is available!</Text>
              )}
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={styles.bioInput}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                multiline
                maxLength={100}
              />
              <Text style={styles.charCount}>{bio.length}/100</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>CONTACT INFORMATION</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.helperText}>Used for account recovery & notifications</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 (555) 000-0000"
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={styles.helperText}>Optional - For 2FA & SMS alerts</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>SECURITY</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowChangePassword(true)}>
              <View style={[styles.menuIcon, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Change Password</Text>
                <Text style={styles.menuSubtitle}>Last changed 30 days ago</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Two-Factor Authentication</Text>
                <Text style={[styles.menuSubtitle, { color: '#10B981' }]}>Enabled</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.sectionWrapper, { marginBottom: 120 }]}>
          <Text style={[styles.sectionLabel, { color: '#EF4444' }]}>DANGER ZONE</Text>
          <View style={[styles.card, { borderColor: '#FEE2E2', borderWidth: 1 }]}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Delete Account</Text>
                <Text style={styles.menuSubtitle}>Permanently delete your account & data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FECACA" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showChangePassword} transparent animationType="slide">
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
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Ionicons name={showCurrentPassword ? 'eye-off' : 'eye'} size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.passwordInput}>
              <Text style={styles.passwordLabel}>New Password</Text>
              <View style={styles.passwordField}>
                <TextInput
                  style={styles.passwordTextInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              {newPassword.length > 0 && newPassword.length < 8 && (
                <Text style={styles.errorText}>Password must be at least 8 characters</Text>
              )}
            </View>
            
            <View style={styles.passwordInput}>
              <Text style={styles.passwordLabel}>Confirm New Password</Text>
              <TextInput
                style={[styles.passwordField, styles.passwordTextInput]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
              />
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowChangePassword(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.updateButton, (!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword) && { opacity: 0.5 }]}
                disabled={!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              >
                <Text style={styles.updateButtonText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successToast: {
    position: 'absolute',
    top: 120,
    left: '50%',
    transform: [{ translateX: -80 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#10B981',
    zIndex: 100,
  },
  successToastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputRow: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  bioInput: {
    fontSize: 16,
    color: '#0F172A',
    height: 64,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    paddingLeft: 32,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    paddingLeft: 32,
  },
  successText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
    paddingLeft: 32,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },
  passwordInput: {
    marginBottom: 16,
  },
  passwordLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  passwordField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  passwordTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  updateButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
