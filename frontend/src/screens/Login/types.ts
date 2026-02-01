export interface LoginScreenProps {
  navigation?: any;
}

export interface FormState {
  email: string;
  password: string;
  name: string;
  isLogin: boolean;
  isLoading: boolean;
  showPassword: boolean;
}

export interface TestAccount {
  name: string;
  email: string;
}
