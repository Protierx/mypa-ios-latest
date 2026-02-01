import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { NotificationSettings, TimeField } from '../types';
import { formatTimeForDisplay, getQuietHoursDuration } from '../utils';

interface QuietHoursSectionProps {
  settings: NotificationSettings;
  onToggleQuietHours: (value: boolean) => void;
  onOpenTimePicker: (field: TimeField) => void;
}

export const QuietHoursSection: React.FC<QuietHoursSectionProps> = ({
  settings,
  onToggleQuietHours,
  onOpenTimePicker,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>QUIET HOURS</Text>
      <View style={styles.sectionCard}>
        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: '#5856D615' }]}>
            <Ionicons name="moon" size={20} color="#5856D6" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Do Not Disturb</Text>
            <Text style={styles.settingSubtitle}>
              {settings.quietHoursEnabled
                ? `Silent for ${getQuietHoursDuration(settings.quietHoursStart, settings.quietHoursEnd)}`
                : 'Pause notifications during rest time'
              }
            </Text>
          </View>
          <Switch
            value={settings.quietHoursEnabled}
            onValueChange={onToggleQuietHours}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="white"
            ios_backgroundColor="#E5E5EA"
          />
        </View>

        {settings.quietHoursEnabled && (
          <>
            <View style={styles.separator} />
            <View style={styles.quietTimesContainer}>
              <View style={styles.quietTimeCard}>
                <View style={styles.quietTimeHeader}>
                  <Ionicons name="moon" size={16} color="#5856D6" />
                  <Text style={styles.quietTimeLabel}>Start</Text>
                </View>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => onOpenTimePicker('start')}
                >
                  <Text style={styles.timeButtonText}>
                    {formatTimeForDisplay(settings.quietHoursStart)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              <View style={styles.quietTimeArrow}>
                <Ionicons name="arrow-forward" size={20} color="#C7C7CC" />
              </View>

              <View style={styles.quietTimeCard}>
                <View style={styles.quietTimeHeader}>
                  <Ionicons name="sunny" size={16} color="#FF9500" />
                  <Text style={styles.quietTimeLabel}>End</Text>
                </View>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => onOpenTimePicker('end')}
                >
                  <Text style={styles.timeButtonText}>
                    {formatTimeForDisplay(settings.quietHoursEnd)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.quietHoursInfo}>
              <Ionicons name="information-circle" size={16} color="#8E8E93" />
              <Text style={styles.quietHoursInfoText}>
                Notifications will be silently delivered during quiet hours. You can still check them in the app.
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};
