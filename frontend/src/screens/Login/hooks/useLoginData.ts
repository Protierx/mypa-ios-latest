import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { TEST_PASSWORD } from '../constants';
import { 
  validateEmail, 
  validatePassword,
  type ValidationError 
} from '../../../utils/validation';

export const useLoginData = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSubmit = useCallback(async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    setNameError('');

    // Validate email
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation.message);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation.message);
      return;
    }

    // Validate name for registration
    if (!isLogin) {
      if (!name || name.trim().length < 2) {
        setNameError('Name must be at least 2 characters');
        return;
      }
      if (name.trim().length > 50) {
        setNameError('Name is too long');
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = isLogin
        ? await login(email.trim(), password)
        : await register(email.trim(), password, name.trim());

      if (!result.success) {
        Alert.alert('Error', result.error || 'Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, name, isLogin, login, register]);

  const handleQuickLogin = useCallback(async (testEmail: string) => {
    setIsLoading(true);
    try {
      const result = await login(testEmail, TEST_PASSWORD);
      if (!result.success) {
        // Try to register instead
        const registerResult = await register(testEmail, TEST_PASSWORD, testEmail.split('@')[0]);
        if (!registerResult.success) {
          Alert.alert('Error', registerResult.error || 'Failed to create test account');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [login, register]);

  const toggleMode = useCallback(() => {
    setIsLogin((prev) => !prev);
  }, []);

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return {
    isLogin,
    email,
    password,
    name,
    isLoading,
    showPassword,
    emailError,
    passwordError,
    nameError,
    setEmail,
    setPassword,
    setName,
    handleSubmit,
    handleQuickLogin,
    toggleMode,
    togglePassword,
  };
};
