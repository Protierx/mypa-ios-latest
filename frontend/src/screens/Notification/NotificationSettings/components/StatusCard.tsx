import React from 'react';
import { View, Text, Switch, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../styles';
import { NotificationSettings } from '../types';
import { countEnabledNotifications, formatTimeForDisplay } from '../utils';

interface StatusCardProps {
  settings: NotificationSettings;
  pushRegistered: boolean;
  pulseAnim: Animated.Value;
  onTogglePush: (value: boolean) => void;
  onEnablePush: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  settings,
  pushRegistered,
  pulseAnim,
  onTogglePush,
  onEnablePush,
}) => {
  const handleToggle = (value: boolean) => {
    if (!pushRegistered && value) {
      onEnablePush();
    } else {
      onTogglePush(value);
    }
  };

  return (
    <View style={styles.statusCard}>
      <LinearGradient
        colors={settings.pushEnabled ? ['#34C759', '#30D158'] : ['#8E8E93', '#636366']}
        style={styles.statusGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statusContent}>
          <View style={styles.statusLeft}>
            <Animated.View 
              style={[
                styles.statusIconWrap, 
                settings.pushEnabled && { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <Ionicons
                name={settings.pushEnabled ? 'notifications' : 'notifications-off'}
                size={32}
                color="#FFFFFF"
              />
            </Animated.View>
            <View>
              <Text style={styles.statusTitle}>
                {settings.pushEnabled ? 'Notifications Active' : 'Notifications Off'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {settings.pushEnabled
                  ? `${countEnabledNotifications(settings)} types enabled`
                  : 'Enable to stay updated'
                }
              </Text>
            </View>
          </View>
          <Switch
            value={settings.pushEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.4)' }}
            thumbColor="white"
          />
        </View>

        {/* Quiet Hours Active Indicator */}
        {settings.pushEnabled && settings.quietHoursEnabled && (
          <View style={styles.quietActiveIndicator}>
            <Ionicons name="moon" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.quietActiveText}>
              Quiet hours: {formatTimeForDisplay(settings.quietHoursStart)} - {formatTimeForDisplay(settings.quietHoursEnd)}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};
