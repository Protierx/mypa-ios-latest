import { useState, useEffect, useCallback, useRef } from 'react';
import { Animated, Alert, Vibration } from 'react-native';
import { notificationsApi } from '../../../../services/api';
import {
  registerForPushNotificationsAsync,
  registerPushTokenWithBackend,
  scheduleLocalNotification,
} from '../../../../services/pushNotifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { NotificationSettings, TimeField, TimePeriod } from '../types';
import { defaultSettings } from '../constants';
import { parseTimeString, formatTo24Hour } from '../utils';

export const useNotificationSettingsData = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [pushRegistered, setPushRegistered] = useState(false);

  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeField, setEditingTimeField] = useState<TimeField>('start');
  const [tempHour, setTempHour] = useState(22);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempPeriod, setTempPeriod] = useState<TimePeriod>('PM');

  // Test notification state
  const [testSending, setTestSending] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('tasks');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start animations
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
            { text: 'Open Settings', onPress: () => {} },
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

      await scheduleLocalNotification(
        '🔔 Test Notification',
        'Great! Your notifications are working perfectly.',
        { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, repeats: false },
        { type: 'TEST', screen: 'NotificationSettings' }
      );

      try {
        await notificationsApi.sendTest();
      } catch (e) {
        console.log('Backend test notification not available');
      }

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

  const openTimePicker = (field: TimeField) => {
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

  const handleChangeHour = (delta: number) => {
    setTempHour((h) => {
      if (delta > 0) return h === 12 ? 1 : h + 1;
      return h === 1 ? 12 : h - 1;
    });
  };

  const handleChangeMinute = (delta: number) => {
    setTempMinute((m) => {
      if (delta > 0) return m === 55 ? 0 : m + 5;
      return m === 0 ? 55 : m - 5;
    });
  };

  const handleChangePeriod = () => {
    setTempPeriod((p) => (p === 'AM' ? 'PM' : 'AM'));
  };

  const handleQuickSelect = (hour: number, minute: number, period: TimePeriod) => {
    setTempHour(hour);
    setTempMinute(minute);
    setTempPeriod(period);
  };

  return {
    // State
    loading,
    saving,
    settings,
    pushRegistered,
    showTimePicker,
    editingTimeField,
    tempHour,
    tempMinute,
    tempPeriod,
    testSending,
    testSuccess,
    expandedCategory,
    
    // Animations
    fadeAnim,
    scaleAnim,
    successAnim,
    pulseAnim,
    
    // Actions
    updateSetting,
    handleEnablePush,
    handleTestNotification,
    openTimePicker,
    confirmTimeSelection,
    setShowTimePicker,
    setExpandedCategory,
    handleChangeHour,
    handleChangeMinute,
    handleChangePeriod,
    handleQuickSelect,
  };
};
