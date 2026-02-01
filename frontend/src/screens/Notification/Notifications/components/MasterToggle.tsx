import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToggleSwitch } from '../../../../components/ToggleSwitch';
import { styles } from '../styles';

interface MasterToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export const MasterToggle: React.FC<MasterToggleProps> = ({ enabled, onToggle }) => (
  <View style={styles.masterToggle}>
    <View style={styles.masterToggleLeft}>
      <View style={[styles.masterIcon, !enabled && { backgroundColor: '#94A3B8' }]}>
        <Ionicons name={enabled ? 'notifications' : 'notifications-off'} size={24} color="#FFFFFF" />
      </View>
      <View>
        <Text style={styles.masterLabel}>Allow Notifications</Text>
        <Text style={styles.masterDesc}>
          {enabled ? 'Notifications are on' : 'All notifications are paused'}
        </Text>
      </View>
    </View>
    <ToggleSwitch active={enabled} onToggle={onToggle} />
  </View>
);
