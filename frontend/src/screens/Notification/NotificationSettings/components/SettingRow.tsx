import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { NotificationSettings } from '../types';

interface SettingRowProps {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  isLast?: boolean;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
  isLast = false,
}) => {
  return (
    <View>
      <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
        <View style={[styles.settingIcon, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#E5E5EA', true: '#34C759' }}
          thumbColor="white"
          ios_backgroundColor="#E5E5EA"
          disabled={disabled}
        />
      </View>
      {!isLast && <View style={styles.separator} />}
    </View>
  );
};
