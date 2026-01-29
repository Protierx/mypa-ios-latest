/**
 * NotificationSettingsScreen - iOS-styled notification preferences
 * Beautiful settings UI for push notification management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { notificationsApi } from '../services/api';
import { 
  registerForPushNotificationsAsync, 
  registerPushTokenWithBackend 
} from '../services/pushNotifications';

interface NotificationSettings {
  pushEnabled: boolean;
  taskReminders: boolean;
  assignmentAlerts: boolean;
  streakReminders: boolean;
  dailyBriefing: boolean;
  levelUpAlerts: boolean;
  challengeUpdates: boolean;
  circleActivity: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const defaultSettings: NotificationSettings = {
  pushEnabled: true,
  taskReminders: true,
  assignmentAlerts: true,
  streakReminders: true,
  dailyBriefing: true,
  levelUpAlerts: true,
  challengeUpdates: true,
  circleActivity: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [pushRegistered, setPushRegistered] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const response = await notificationsApi.getSettings();
      if (response.success && response.data) {
        setSettings({ ...defaultSettings, ...response.data });
        setPushRegistered(true);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = async (key: keyof NotificationSettings, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      setSaving(true);
      await notificationsApi.updateSettings(newSettings);
    } catch (error) {
      console.error('Failed to save setting:', error);
      // Revert on error
      setSettings(settings);
      Alert.alert('Error', 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      setSaving(true);
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        await registerPushTokenWithBackend(token);
        setPushRegistered(true);
        updateSetting('pushEnabled', true);
        Alert.alert('Success', 'Push notifications enabled!');
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                // In a real app, this would open device settings
                // Linking.openSettings();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to enable push:', error);
      Alert.alert('Error', 'Failed to enable push notifications');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setSaving(true);
      await notificationsApi.sendTest();
      Alert.alert('Sent!', 'Test notification sent. Check your device.');
    } catch (error) {
      console.error('Failed to send test:', error);
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setSaving(false);
    }
  };

  const renderSettingRow = (
    icon: string,
    iconColor: string,
    title: string,
    subtitle: string,
    settingKey: keyof NotificationSettings,
    disabled = false
  ) => (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={settings[settingKey] as boolean}
        onValueChange={(value) => updateSetting(settingKey, value)}
        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
        thumbColor="white"
        ios_backgroundColor="#E5E5EA"
        disabled={disabled || !settings.pushEnabled}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        {saving && <ActivityIndicator size="small" color="#007AFF" />}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Toggle */}
        <View style={styles.section}>
          <View style={styles.mainToggle}>
            <View style={styles.mainToggleLeft}>
              <View style={[styles.mainToggleIcon, { backgroundColor: '#FF3B3015' }]}>
                <Ionicons name="notifications" size={28} color="#FF3B30" />
              </View>
              <View>
                <Text style={styles.mainToggleTitle}>Push Notifications</Text>
                <Text style={styles.mainToggleSubtitle}>
                  {settings.pushEnabled ? 'Notifications are enabled' : 'Tap to enable'}
                </Text>
              </View>
            </View>
            {pushRegistered ? (
              <Switch
                value={settings.pushEnabled}
                onValueChange={(value) => updateSetting('pushEnabled', value)}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="white"
                ios_backgroundColor="#E5E5EA"
              />
            ) : (
              <TouchableOpacity
                style={styles.enableButton}
                onPress={handleEnablePush}
              >
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATION TYPES</Text>
          <View style={styles.sectionCard}>
            {renderSettingRow(
              'checkmark-circle',
              '#007AFF',
              'Task Reminders',
              'Get reminded before tasks are due',
              'taskReminders'
            )}
            <View style={styles.separator} />
            {renderSettingRow(
              'clipboard',
              '#5856D6',
              'Assignment Alerts',
              'When you receive new assignments',
              'assignmentAlerts'
            )}
            <View style={styles.separator} />
            {renderSettingRow(
              'flame',
              '#FF9500',
              'Streak Reminders',
              'Keep your streak alive',
              'streakReminders'
            )}
            <View style={styles.separator} />
            {renderSettingRow(
              'sunny',
              '#FF6B00',
              'Daily Briefing',
              'Morning summary of your day',
              'dailyBriefing'
            )}
          </View>
        </View>

        {/* Social & Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SOCIAL & PROGRESS</Text>
          <View style={styles.sectionCard}>
            {renderSettingRow(
              'trophy',
              '#FFD60A',
              'Level Up Alerts',
              'When you reach a new level',
              'levelUpAlerts'
            )}
            <View style={styles.separator} />
            {renderSettingRow(
              'flag',
              '#FF3B30',
              'Challenge Updates',
              'Challenge progress and completions',
              'challengeUpdates'
            )}
            <View style={styles.separator} />
            {renderSettingRow(
              'people',
              '#34C759',
              'Circle Activity',
              'Posts and activity in your circles',
              'circleActivity'
            )}
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUIET HOURS</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: '#5856D615' }]}>
                <Ionicons name="moon" size={20} color="#5856D6" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Quiet Hours</Text>
                <Text style={styles.settingSubtitle}>
                  Pause notifications during rest time
                </Text>
              </View>
              <Switch
                value={settings.quietHoursEnabled}
                onValueChange={(value) => updateSetting('quietHoursEnabled', value)}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="white"
                ios_backgroundColor="#E5E5EA"
                disabled={!settings.pushEnabled}
              />
            </View>
            
            {settings.quietHoursEnabled && (
              <>
                <View style={styles.separator} />
                <View style={styles.quietTimesRow}>
                  <View style={styles.quietTime}>
                    <Text style={styles.quietTimeLabel}>From</Text>
                    <TouchableOpacity style={styles.timeButton}>
                      <Text style={styles.timeButtonText}>
                        {settings.quietHoursStart}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.quietTimeDivider}>
                    <Ionicons name="arrow-forward" size={20} color="#8E8E93" />
                  </View>
                  <View style={styles.quietTime}>
                    <Text style={styles.quietTimeLabel}>To</Text>
                    <TouchableOpacity style={styles.timeButton}>
                      <Text style={styles.timeButtonText}>
                        {settings.quietHoursEnd}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Test Notification */}
        {pushRegistered && settings.pushEnabled && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestNotification}
              disabled={saving}
            >
              <Ionicons name="paper-plane" size={20} color="#007AFF" />
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={18} color="#8E8E93" />
          <Text style={styles.infoText}>
            Notifications help you stay on track with tasks, maintain streaks, and stay connected with your circles.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E6E73',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mainToggle: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  mainToggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainToggleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  mainToggleSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  enableButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  enableButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 62,
  },
  quietTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  quietTime: {
    alignItems: 'center',
    gap: 8,
  },
  quietTimeLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  timeButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  timeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  quietTimeDivider: {
    paddingTop: 20,
  },
  testButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoSection: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});
