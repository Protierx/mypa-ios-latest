export interface PrivacyControlsScreenProps {
  navigation?: any;
}

export type PrivacyModeType = 'private' | 'metrics' | 'proof';

export interface Circle {
  id: number;
  name: string;
  privacy: string;
}

export interface PrivacyMode {
  id: PrivacyModeType;
  label: string;
  desc: string;
  icon: string;
}

export interface PrivacyOption {
  value: string;
  label: string;
}

export interface DataPermission {
  key: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
  value: boolean;
  setter: (value: boolean) => void;
}
