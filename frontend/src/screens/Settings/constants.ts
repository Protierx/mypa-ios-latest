import { SettingsSection } from './types';

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: 'Preferences',
    items: [
      { id: '1', iconName: 'notifications', iconColor: '#F59E0B', title: 'Push Notifications', type: 'toggle', value: true },
      { id: '2', iconName: 'moon', iconColor: '#8B5CF6', title: 'Dark Mode', type: 'toggle', value: false },
      { id: '3', iconName: 'volume-high', iconColor: '#3B82F6', title: 'Sound Effects', type: 'toggle', value: true },
      { id: '4', iconName: 'location', iconColor: '#F43F5E', title: 'Location Services', type: 'toggle', value: true },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: '5', iconName: 'person', iconColor: '#3B82F6', title: 'Personal Information', type: 'navigation' },
      { id: '6', iconName: 'lock-closed', iconColor: '#10B981', title: 'Password & Security', type: 'navigation' },
      { id: '7', iconName: 'mail', iconColor: '#8B5CF6', title: 'Email Preferences', type: 'navigation' },
      { id: '8', iconName: 'link', iconColor: '#F59E0B', title: 'Connected Accounts', type: 'value', value: '3 connected' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { id: '9', iconName: 'calendar', iconColor: '#F43F5E', title: 'Calendar Sync', type: 'value', value: 'Google' },
      { id: '10', iconName: 'fitness', iconColor: '#10B981', title: 'Health Apps', type: 'value', value: 'Apple Health' },
      { id: '11', iconName: 'musical-notes', iconColor: '#EC4899', title: 'Music', type: 'value', value: 'Spotify' },
    ],
  },
  {
    title: 'App Settings',
    items: [
      { id: '12', iconName: 'globe', iconColor: '#06B6D4', title: 'Language', type: 'value', value: 'English' },
      { id: '13', iconName: 'resize', iconColor: '#64748B', title: 'Units', type: 'value', value: 'Metric' },
      { id: '14', iconName: 'time', iconColor: '#3B82F6', title: 'Time Format', type: 'value', value: '12-hour' },
      { id: '15', iconName: 'calendar-outline', iconColor: '#F59E0B', title: 'Week Start', type: 'value', value: 'Monday' },
    ],
  },
  {
    title: 'Support',
    items: [
      { id: '16', iconName: 'help-circle', iconColor: '#3B82F6', title: 'Help Center', type: 'navigation' },
      { id: '17', iconName: 'chatbubbles', iconColor: '#10B981', title: 'Contact Support', type: 'navigation' },
      { id: '18', iconName: 'star', iconColor: '#F59E0B', title: 'Rate App', type: 'navigation' },
      { id: '19', iconName: 'document-text', iconColor: '#64748B', title: 'Terms & Privacy', type: 'navigation' },
    ],
  },
];

export const INITIAL_TOGGLES: { [key: string]: boolean } = {
  '1': true,
  '2': false,
  '3': true,
  '4': true,
};
