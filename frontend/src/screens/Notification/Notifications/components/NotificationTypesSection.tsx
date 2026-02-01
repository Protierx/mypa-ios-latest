import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToggleSwitch } from '../../../../components/ToggleSwitch';
import { NotificationType } from '../types';
import { styles } from '../styles';

interface NotificationTypesSectionProps {
  types: NotificationType[];
}

export const NotificationTypesSection: React.FC<NotificationTypesSectionProps> = ({ types }) => (
  <View style={styles.sectionWrapper}>
    <Text style={styles.sectionLabel}>NOTIFICATION TYPES</Text>
    <View style={styles.card}>
      {types.map((item, i) => (
        <View key={item.key}>
          <View style={styles.toggleRow}>
            <View style={[styles.toggleIcon, { backgroundColor: item.value ? item.color : '#94A3B8' }]}>
              <Ionicons name={item.icon as any} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>{item.label}</Text>
              <Text style={styles.toggleDesc}>{item.desc}</Text>
            </View>
            <ToggleSwitch active={item.value} onToggle={() => item.setter(!item.value)} />
          </View>
          {i < types.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  </View>
);
