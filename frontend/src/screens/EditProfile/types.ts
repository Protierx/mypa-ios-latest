export interface EditProfileScreenProps {
  navigation?: any;
}

export interface ProfileFormData {
  displayName: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
