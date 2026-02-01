import React from 'react';
import { View, ScrollView } from 'react-native';
import { EditProfileScreenProps } from './types';
import { styles } from './styles';
import {
  Header,
  SuccessToast,
  AvatarSection,
  BasicInfoSection,
  ContactInfoSection,
  SecuritySection,
  DangerZone,
} from './components';
import { ChangePasswordModal } from './modals';
import { useEditProfileData } from './hooks';

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  navigation,
}) => {
  const {
    displayName,
    username,
    email,
    phone,
    bio,
    usernameAvailable,
    saveSuccess,
    showChangePassword,
    currentPassword,
    newPassword,
    confirmPassword,
    showCurrentPassword,
    showNewPassword,
    setDisplayName,
    handleUsernameChange,
    setEmail,
    setPhone,
    setBio,
    setShowChangePassword,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    setShowCurrentPassword,
    setShowNewPassword,
    handleSave,
  } = useEditProfileData();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header
          onBack={() => navigation?.goBack()}
          onSave={() => handleSave(() => navigation?.goBack())}
        />

        <SuccessToast visible={saveSuccess} />

        <AvatarSection />

        <BasicInfoSection
          displayName={displayName}
          username={username}
          bio={bio}
          usernameAvailable={usernameAvailable}
          onDisplayNameChange={setDisplayName}
          onUsernameChange={handleUsernameChange}
          onBioChange={setBio}
        />

        <ContactInfoSection
          email={email}
          phone={phone}
          onEmailChange={setEmail}
          onPhoneChange={setPhone}
        />

        <SecuritySection onChangePassword={() => setShowChangePassword(true)} />

        <DangerZone />
      </ScrollView>

      <ChangePasswordModal
        visible={showChangePassword}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        showCurrentPassword={showCurrentPassword}
        showNewPassword={showNewPassword}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onToggleCurrentPassword={() =>
          setShowCurrentPassword(!showCurrentPassword)
        }
        onToggleNewPassword={() => setShowNewPassword(!showNewPassword)}
        onClose={() => setShowChangePassword(false)}
        onSubmit={() => setShowChangePassword(false)}
      />
    </View>
  );
};

export default EditProfileScreen;
