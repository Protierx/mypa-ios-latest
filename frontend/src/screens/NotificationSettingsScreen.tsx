/**
 * NotificationSettingsScreen - iOS-styled notification preferences
 * Beautiful settings UI for push notification management
 * 
 * Features:
 * - iOS-styled settings page with smooth animations
 * - Toggle each notification type on/off
 * - Set "quiet hours" when you don't want to be disturbed
 * - Test button to make sure notifications work
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
  Modal,
  Pressable,
  Vibration,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { notificationsApi } from '../services/api';
import { 
  registerForPushNotificationsAsync, 
  registerPushTokenWithBackend,
  scheduleLocalNotification,
} from '../services/pushNotifications';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

interface NotificationSettings {
  pushEnabled: boolean;
  taskReminders: boolean;
  assignmentAlerts: boolean;
  streakReminders: boolean;
  dailyBriefing: boolean;
  levelUpAlerts: boolean;
  challengeUpdates: boolean;
  circleActivity: boolean;
  aiInsights: boolean;
  weeklyDigest: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
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
  aiInsights: true,
  weeklyDigest: true,
  soundEnabled: true,
  vibrationEnabled: true,
  badgeEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

// Notification category configurations
const NOTIFICATION_CATEGORIES = {
  tasks: {
    title: 'Tasks & Productivity',
    icon: 'checkmark-circle',
    color: '#007AFF',
    items: [
      { key: 'taskReminders', icon: 'alarm', color: '#FF9500', title: 'Task Reminders', subtitle: 'Get reminded before tasks are due' },
      { key: 'dailyBriefing', icon: 'sunny', color: '#FF6B00', title: 'Daily Briefing', subtitle: 'Morning summary of your day' },
      { key: 'aiInsights', icon: 'sparkles', color: '#AF52DE', title: 'AI Insights', subtitle: 'Smart suggestions and tips' },
    ],
  },
  social: {
    title: 'Social & Circles',
    icon: 'people',
    color: '#34C759',
    items: [
      { key: 'assignmentAlerts', icon: 'paper-plane', color: '#5856D6', title: 'Mission Alerts', subtitle: 'When someone assigns you a task' },
      { key: 'circleActivity', icon: 'chatbubbles', color: '#34C759', title: 'Circle Activity', subtitle: 'Posts and updates from your circles' },
    ],
  },
  progress: {
    title: 'Progress & Achievements',
    icon: 'trophy',
    color: '#FFD60A',
    items: [
      { key: 'streakReminders', icon: 'flame', color: '#FF3B30', title: 'Streak Reminders', subtitle: 'Keep your streak alive' },
      { key: 'levelUpAlerts', icon: 'arrow-up-circle', color: '#FFD60A', title: 'Level Up Alerts', subtitle: 'When you reach a new level' },
      { key: 'challengeUpdates', icon: 'flag', color: '#FF2D55', title: 'Challenge Updates', subtitle: 'Challenge progress and completions' },
      { key: 'weeklyDigest', icon: 'stats-chart', color: '#5AC8FA', title: 'Weekly Digest', subtitle: 'Your productivity summary' },
    ],
  },
};

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [pushRegistered, setPushRegistered] = useState(false);
  
  // Time picker modal state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeField, setEditingTimeField] = useState<'start' | 'end'>('start');
  const [tempHour, setTempHour] = useState(22);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>('PM');
  
  // Test notification state
  const [testSending, setTestSending] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('tasks');
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Pulse animation for enabled status
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
      setTestSending(true);
      setTestSuccess(false);
      
      // Send a local test notification
      await scheduleLocalNotification(
        '🔔 Test Notification',
        'Great! Your notifications are working perfectly.',
        { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
        { type: 'TEST', screen: 'NotificationSettings' }
      );
      
      // Also try to send via backend
      try {
        await notificationsApi.sendTest();
      } catch (e) {
        // Backend test is optional
        console.log('Backend test notification not available');
      }
      
      // Success animation
      setTestSuccess(true);
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setTestSuccess(false));
      
      // Vibrate for feedback
      if (settings.vibrationEnabled) {
        Vibration.vibrate(100);
      }
    } catch (error) {
      console.error('Failed to send test:', error);
      Alert.alert('Error', 'Failed to send test notification. Please check your permissions.');
    } finally {
      setTestSending(false);
    }
  };

  // Time picker helpers - convert 24h to 12h format
  const parseTimeString = (timeStr: string): { hour: number; minute: number; period: 'AM' | 'PM' } => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return { hour: hour12, minute: minutes, period };
  };

  // Convert 12h to 24h format string
  const formatTo24Hour = (hour: number, minute: number, period: 'AM' | 'PM'): string => {
    let hour24 = hour;
    if (period === 'PM' && hour !== 12) hour24 = hour + 12;
    if (period === 'AM' && hour === 12) hour24 = 0;
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const openTimePicker = (field: 'start' | 'end') => {
    const currentTime = field === 'start' ? settings.quietHoursStart : settings.quietHoursEnd;
    const parsed = parseTimeString(currentTime);
    setTempHour(parsed.hour);
    setTempMinute(parsed.minute);
    setTempPeriod(parsed.period);
    setEditingTimeField(field);
    setShowTimePicker(true);
  };

  const confirmTimeSelection = () => {
    const timeString = formatTo24Hour(tempHour, tempMinute, tempPeriod);
    if (editingTimeField === 'start') {
      updateSetting('quietHoursStart', timeString);
    } else {
      updateSetting('quietHoursEnd', timeString);
    }
    setShowTimePicker(false);
  };

  // Format time for display
  const formatTimeForDisplay = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Calculate quiet hours duration  
  const getQuietHoursDuration = (): string => {
    const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
    const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) endMinutes += 24 * 60; // Handle overnight
    const diffMinutes = endMinutes - startMinutes;
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} hours`;
  };

  // Count enabled notification types
  const countEnabledNotifications = (): number => {
    const keys = ['taskReminders', 'assignmentAlerts', 'streakReminders', 'dailyBriefing', 
                  'levelUpAlerts', 'challengeUpdates', 'circleActivity', 'aiInsights', 'weeklyDigest'];
    return keys.filter(key => settings[key as keyof NotificationSettings]).length;
  };

  const renderSettingRow = (
    icon: string,
    iconColor: string,
    title: string,
    subtitle: string,
    settingKey: keyof NotificationSettings,
    disabled = false,
    isLast = false
  ) => (
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
          value={settings[settingKey] as boolean}
          onValueChange={(value) => updateSetting(settingKey, value)}
          trackColor={{ false: '#E5E5EA', true: '#34C759' }}
          thumbColor="white"
          ios_backgroundColor="#E5E5EA"
          disabled={disabled || !settings.pushEnabled}
        />
      </View>
      {!isLast && <View style={styles.separator} />}
    </View>
  );

  // Render a notification category section
  const renderCategorySection = (categoryKey: string, category: typeof NOTIFICATION_CATEGORIES.tasks) => {
    const isExpanded = expandedCategory === categoryKey;
    
    return (
      <View style={styles.categoryContainer} key={categoryKey}>
        <TouchableOpacity 
          style={styles.categoryHeader}
          onPress={() => setExpandedCategory(isExpanded ? null : categoryKey)}
          activeOpacity={0.7}
        >
          <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
            <Ionicons name={category.icon as any} size={18} color={category.color} />
          </View>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <View style={styles.categoryRight}>
            <Text style={styles.categoryCount}>
              {category.items.filter(item => settings[item.key as keyof NotificationSettings]).length}/{category.items.length}
            </Text>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#8E8E93" 
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.categoryItems}>
            {category.items.map((item, index) => 
              renderSettingRow(
                item.icon,
                item.color,
                item.title,
                item.subtitle,
                item.key as keyof NotificationSettings,
                false,
                index === category.items.length - 1
              )
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading settings...</Text>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        {saving && <ActivityIndicator size="small" color="#007AFF" />}
      </View>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={settings.pushEnabled ? ['#34C759', '#30D158'] : ['#8E8E93', '#636366']}
            style={styles.statusGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statusContent}>
              <View style={styles.statusLeft}>
                <Animated.View style={[styles.statusIconWrap, settings.pushEnabled && { transform: [{ scale: pulseAnim }] }]}>
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
                      ? `${countEnabledNotifications()} types enabled`
                      : 'Enable to stay updated'
                    }
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.pushEnabled}
                onValueChange={(value) => {
                  if (!pushRegistered && value) {
                    handleEnablePush();
                  } else {
                    updateSetting('pushEnabled', value);
                  }
                }}
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

        {/* Notification Categories */}
        {settings.pushEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTIFICATION TYPES</Text>
            <View style={styles.sectionCard}>
              {renderCategorySection('tasks', NOTIFICATION_CATEGORIES.tasks)}
              <View style={styles.categorySeparator} />
              {renderCategorySection('social', NOTIFICATION_CATEGORIES.social)}
              <View style={styles.categorySeparator} />
              {renderCategorySection('progress', NOTIFICATION_CATEGORIES.progress)}
            </View>
          </View>
        )}

        {/* Delivery Options */}
        {settings.pushEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DELIVERY OPTIONS</Text>
            <View style={styles.sectionCard}>
              <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: '#FF375F15' }]}>
                  <Ionicons name="volume-high" size={20} color="#FF375F" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Sound</Text>
                  <Text style={styles.settingSubtitle}>Play sound for notifications</Text>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(value) => updateSetting('soundEnabled', value)}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="white"
                  ios_backgroundColor="#E5E5EA"
                />
              </View>
              <View style={styles.separator} />
              <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: '#AF52DE15' }]}>
                  <Ionicons name="phone-portrait" size={20} color="#AF52DE" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Vibration</Text>
                  <Text style={styles.settingSubtitle}>Vibrate on notifications</Text>
                </View>
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={(value) => updateSetting('vibrationEnabled', value)}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="white"
                  ios_backgroundColor="#E5E5EA"
                />
              </View>
              <View style={styles.separator} />
              <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: '#FF950015' }]}>
                  <Ionicons name="ellipse" size={20} color="#FF9500" />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Badge Count</Text>
                  <Text style={styles.settingSubtitle}>Show number on app icon</Text>
                </View>
                <Switch
                  value={settings.badgeEnabled}
                  onValueChange={(value) => updateSetting('badgeEnabled', value)}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="white"
                  ios_backgroundColor="#E5E5EA"
                />
              </View>
            </View>
          </View>
        )}

        {/* Quiet Hours */}
        {settings.pushEnabled && (
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
                      ? `Silent for ${getQuietHoursDuration()}`
                      : 'Pause notifications during rest time'
                    }
                  </Text>
                </View>
                <Switch
                  value={settings.quietHoursEnabled}
                  onValueChange={(value) => updateSetting('quietHoursEnabled', value)}
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
                        onPress={() => openTimePicker('start')}
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
                        onPress={() => openTimePicker('end')}
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
        )}

        {/* Test Notification */}
        {settings.pushEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TEST NOTIFICATIONS</Text>
            <View style={styles.testCard}>
              <View style={styles.testCardHeader}>
                <Ionicons name="flask" size={24} color="#007AFF" />
                <View style={styles.testCardText}>
                  <Text style={styles.testCardTitle}>Test Your Setup</Text>
                  <Text style={styles.testCardSubtitle}>
                    Send a test notification to make sure everything works
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.testButton, testSending && styles.testButtonDisabled]}
                onPress={handleTestNotification}
                disabled={testSending}
                activeOpacity={0.8}
              >
                {testSending ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.testButtonText}>Sending...</Text>
                  </>
                ) : testSuccess ? (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.testButtonText}>Sent!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={20} color="white" />
                    <Text style={styles.testButtonText}>Send Test Notification</Text>
                  </>
                )}
              </TouchableOpacity>
              
              {testSuccess && (
                <Animated.View style={[styles.testSuccessBanner, { opacity: successAnim }]}>
                  <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  <Text style={styles.testSuccessText}>
                    Notification sent! Check your device.
                  </Text>
                </Animated.View>
              )}
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={18} color="#8E8E93" />
          <Text style={styles.infoText}>
            Notifications help you stay on track with tasks, maintain streaks, and stay connected with your circles. You can change these settings at any time.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* Time Picker Modal - Simple Button-Based Picker */}
      <Modal
        visible={showTimePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Tap outside to close */}
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => setShowTimePicker(false)} 
          />
          
          {/* Time Picker Card */}
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerHeader}>
              <TouchableOpacity 
                onPress={() => setShowTimePicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.timePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>
                {editingTimeField === 'start' ? 'Quiet Hours Start' : 'Quiet Hours End'}
              </Text>
              <TouchableOpacity 
                onPress={confirmTimeSelection}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.timePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            
            {/* Custom Time Picker with Buttons */}
            <View style={styles.customTimePicker}>
              {/* Hour */}
              <View style={styles.timeColumn}>
                <TouchableOpacity 
                  style={styles.timeArrowButton}
                  onPress={() => setTempHour(h => h === 12 ? 1 : h + 1)}
                >
                  <Ionicons name="chevron-up" size={28} color="#007AFF" />
                </TouchableOpacity>
                <View style={styles.timeValueBox}>
                  <Text style={styles.timeValue}>{tempHour}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.timeArrowButton}
                  onPress={() => setTempHour(h => h === 1 ? 12 : h - 1)}
                >
                  <Ionicons name="chevron-down" size={28} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.timeLabel}>Hour</Text>
              </View>
              
              <Text style={styles.timeSeparator}>:</Text>
              
              {/* Minute */}
              <View style={styles.timeColumn}>
                <TouchableOpacity 
                  style={styles.timeArrowButton}
                  onPress={() => setTempMinute(m => m === 55 ? 0 : m + 5)}
                >
                  <Ionicons name="chevron-up" size={28} color="#007AFF" />
                </TouchableOpacity>
                <View style={styles.timeValueBox}>
                  <Text style={styles.timeValue}>{tempMinute.toString().padStart(2, '0')}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.timeArrowButton}
                  onPress={() => setTempMinute(m => m === 0 ? 55 : m - 5)}
                >
                  <Ionicons name="chevron-down" size={28} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.timeLabel}>Minute</Text>
              </View>
              
              {/* AM/PM */}
              <View style={styles.timeColumn}>
                <TouchableOpacity 
                  style={styles.timeArrowButton}
                  onPress={() => setTempPeriod(p => p === 'AM' ? 'PM' : 'AM')}
                >
                  <Ionicons name="chevron-up" size={28} color="#007AFF" />
                </TouchableOpacity>
                <View style={[styles.timeValueBox, styles.periodBox]}>
                  <Text style={styles.timeValue}>{tempPeriod}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.timeArrowButton}
                  onPress={() => setTempPeriod(p => p === 'AM' ? 'PM' : 'AM')}
                >
                  <Ionicons name="chevron-down" size={28} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.timeLabel}>Period</Text>
              </View>
            </View>
            
            {/* Quick Select Buttons */}
            <View style={styles.quickSelectRow}>
              <TouchableOpacity 
                style={styles.quickSelectButton}
                onPress={() => { setTempHour(10); setTempMinute(0); setTempPeriod('PM'); }}
              >
                <Text style={styles.quickSelectText}>10:00 PM</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickSelectButton}
                onPress={() => { setTempHour(11); setTempMinute(0); setTempPeriod('PM'); }}
              >
                <Text style={styles.quickSelectText}>11:00 PM</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickSelectButton}
                onPress={() => { setTempHour(7); setTempMinute(0); setTempPeriod('AM'); }}
              >
                <Text style={styles.quickSelectText}>7:00 AM</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickSelectButton}
                onPress={() => { setTempHour(8); setTempMinute(0); setTempPeriod('AM'); }}
              >
                <Text style={styles.quickSelectText}>8:00 AM</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
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
    paddingBottom: 40,
  },
  
  // Status Card
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statusGradient: {
    padding: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  statusIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  quietActiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quietActiveText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  
  // Sections
  section: {
    marginBottom: 24,
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
  
  // Category Sections
  categoryContainer: {
    borderBottomWidth: 0,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  categoryItems: {
    backgroundColor: '#F9F9FB',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  categorySeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 58,
  },
  
  // Settings Row
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
  
  // Quiet Hours
  quietTimesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  quietTimeCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
  },
  quietTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  quietTimeLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  quietTimeArrow: {
    paddingHorizontal: 4,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  timeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  quietHoursInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quietHoursInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  
  // Test Notification
  testCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  testCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testCardText: {
    flex: 1,
  },
  testCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  testCardSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  testButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  testButtonDisabled: {
    backgroundColor: '#B4D5FF',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  testSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  testSuccessText: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '500',
  },
  
  // Info Section
  infoSection: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 8,
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
  
  // Time Picker Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBackdrop: {
    flex: 1,
  },
  timePickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  timePickerCancel: {
    fontSize: 17,
    color: '#007AFF',
  },
  timePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  timePickerDone: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  
  // Custom Time Picker
  customTimePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 8,
  },
  timeColumn: {
    alignItems: 'center',
    width: 80,
  },
  timeArrowButton: {
    padding: 8,
  },
  timeValueBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  periodBox: {
    paddingHorizontal: 12,
    minWidth: 60,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1C1C1E',
    marginHorizontal: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  quickSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quickSelectButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  quickSelectText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
