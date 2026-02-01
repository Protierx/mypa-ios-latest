import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToggleSwitch } from '../../../../components/ToggleSwitch';
import { styles } from '../styles';

interface QuietHoursSectionProps {
  enabled: boolean;
  onToggle: () => void;
}

export const QuietHoursSection: React.FC<QuietHoursSectionProps> = ({ enabled, onToggle }) => (
  <View style={styles.sectionWrapper}>
    <Text style={styles.sectionLabel}>QUIET HOURS</Text>
    <View style={styles.card}>
      <View style={styles.toggleRow}>
        <View style={[styles.toggleIcon, { backgroundColor: enabled ? '#6366F1' : '#94A3B8' }]}>
          <Ionicons name="moon" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.toggleContent}>
          <Text style={styles.toggleLabel}>Quiet Hours</Text>
          <Text style={styles.toggleDesc}>Pause notifications</Text>
        </View>
        <ToggleSwitch active={enabled} onToggle={onToggle} />
      </View>
      {enabled && (
        <View style={styles.quietHoursConfig}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>From</Text>
            <Text style={styles.timeValue}>10:00 PM</Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>To</Text>
            <Text style={styles.timeValue}>7:00 AM</Text>
          </View>
          <Text style={styles.quietNote}>
            Notifications will be silently delivered during quiet hours
          </Text>
        </View>
      )}
    </View>
  </View>
);
