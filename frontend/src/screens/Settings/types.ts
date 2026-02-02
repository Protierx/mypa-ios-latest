export interface SettingItem {
  id: string;
  iconName: string;
  iconColor: string;
  title: string;
  type: 'toggle' | 'navigation' | 'value';
  value?: string | boolean;
  navigateTo?: string;
  subtitle?: string;
}

export interface SettingsSection {
  title: string;
  items: SettingItem[];
}

export interface SettingsScreenProps {
  navigation?: any;
}
