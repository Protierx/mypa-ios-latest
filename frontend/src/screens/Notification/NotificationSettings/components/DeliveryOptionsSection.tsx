import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';
import { NotificationSettings } from '../types';
import { DELIVERY_OPTIONS } from '../constants';
import { SettingRow } from './SettingRow';

interface DeliveryOptionsSectionProps {
  settings: NotificationSettings;
  onUpdateSetting: (key: keyof NotificationSettings, value: boolean) => void;
}

export const DeliveryOptionsSection: React.FC<DeliveryOptionsSectionProps> = ({
  settings,
  onUpdateSetting,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>DELIVERY OPTIONS</Text>
      <View style={styles.sectionCard}>
        {DELIVERY_OPTIONS.map((option, index) => (
          <SettingRow
            key={option.key}
            icon={option.icon}
            iconColor={option.color}
            title={option.title}
            subtitle={option.subtitle}
            value={settings[option.key as keyof NotificationSettings] as boolean}
            onValueChange={(value) => onUpdateSetting(option.key as keyof NotificationSettings, value)}
            isLast={index === DELIVERY_OPTIONS.length - 1}
          />
        ))}
      </View>
    </View>
  );
};
