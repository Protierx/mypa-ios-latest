export interface NotificationsScreenProps {
  navigation?: any;
}

export interface NotificationType {
  key: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
  value: boolean;
  setter: (value: boolean) => void;
}

export interface DeliveryOption {
  key: string;
  label: string;
  desc?: string;
  icon: string;
  color: string;
  value: boolean;
  setter: (value: boolean) => void;
}
