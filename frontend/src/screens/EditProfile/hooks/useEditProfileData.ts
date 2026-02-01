import { useState, useCallback } from 'react';
import {
  INITIAL_PROFILE,
  USERNAME_CHECK_DELAY,
  SUCCESS_TOAST_DURATION,
} from '../constants';

interface UseEditProfileDataReturn {
  // Profile data
  displayName: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  usernameAvailable: boolean | null;
  saveSuccess: boolean;

  // Password data
  showChangePassword: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;

  // Actions
  setDisplayName: (value: string) => void;
  handleUsernameChange: (value: string) => void;
  setEmail: (value: string) => void;
  setPhone: (value: string) => void;
  setBio: (value: string) => void;
  setShowChangePassword: (value: boolean) => void;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setShowCurrentPassword: (value: boolean) => void;
  setShowNewPassword: (value: boolean) => void;
  handleSave: (onSuccess?: () => void) => void;
}

export const useEditProfileData = (): UseEditProfileDataReturn => {
  // Profile state
  const [displayName, setDisplayName] = useState(INITIAL_PROFILE.displayName);
  const [username, setUsername] = useState(INITIAL_PROFILE.username);
  const [email, setEmail] = useState(INITIAL_PROFILE.email);
  const [phone, setPhone] = useState(INITIAL_PROFILE.phone);
  const [bio, setBio] = useState(INITIAL_PROFILE.bio);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleUsernameChange = useCallback((value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);
    if (cleaned.length >= 3) {
      setTimeout(
        () => setUsernameAvailable(cleaned !== 'taken_username'),
        USERNAME_CHECK_DELAY
      );
    } else {
      setUsernameAvailable(null);
    }
  }, []);

  const handleSave = useCallback((onSuccess?: () => void) => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onSuccess?.();
    }, SUCCESS_TOAST_DURATION);
  }, []);

  return {
    // Profile data
    displayName,
    username,
    email,
    phone,
    bio,
    usernameAvailable,
    saveSuccess,

    // Password data
    showChangePassword,
    currentPassword,
    newPassword,
    confirmPassword,
    showCurrentPassword,
    showNewPassword,

    // Actions
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
  };
};
