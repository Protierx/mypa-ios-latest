/**
 * Notification Quiet Hours Modal (75% sheet)
 *
 * Lets user enable quiet hours and set start/end times.
 * Persists via settingsPreferences.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { QuietHours } from '../../state/settingsPreferences';

interface Props {
  visible: boolean;
  onClose: () => void;
  quietHours: QuietHours;
  onChange: (qh: QuietHours) => void;
  accentColor?: string;
}

function timeStringToDate(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatTime12(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function NotificationQuietHoursModal({
  visible,
  onClose,
  quietHours,
  onChange,
  accentColor = '#7C3AED',
}: Props) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            style={{
              backgroundColor: '#F8F8FA',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '75%',
              borderTopWidth: 1,
              borderColor: '#E5E5EA',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#C7C7CC' }} />
            </View>

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 16,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#1C1C1E' }}>
                Quiet Hours
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close quiet hours"
                accessibilityRole="button"
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: '#E5E5EA',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={18} color="#8E8E93" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
              <Text style={{ fontSize: 14, color: '#8E8E93', marginBottom: 20, lineHeight: 20 }}>
                Notifications will be silenced during quiet hours. You won't receive planning
                reminders, nudges, or circle alerts in this window.
              </Text>

              {/* Enable toggle */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E5E5EA',
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="moon-outline" size={20} color={accentColor} />
                  <Text style={{ fontSize: 16, color: '#1C1C1E', marginLeft: 10, fontWeight: '500' }}>
                    Enable Quiet Hours
                  </Text>
                </View>
                <Switch
                  value={quietHours.enabled}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    onChange({ ...quietHours, enabled: v });
                  }}
                  trackColor={{ false: '#E5E5EA', true: accentColor }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E5EA"
                  accessibilityLabel="Enable quiet hours"
                />
              </View>

              {quietHours.enabled && (
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E5E5EA',
                    overflow: 'hidden',
                  }}
                >
                  {/* Start time */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 16,
                    }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowStartPicker(!showStartPicker);
                      setShowEndPicker(false);
                    }}
                    accessibilityLabel="Set quiet hours start time"
                    accessibilityRole="button"
                  >
                    <Text style={{ fontSize: 16, color: '#1C1C1E' }}>Start</Text>
                    <Text style={{ fontSize: 16, color: accentColor, fontWeight: '500' }}>
                      {formatTime12(quietHours.start)}
                    </Text>
                  </TouchableOpacity>

                  {showStartPicker && (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                      <DateTimePicker
                        value={timeStringToDate(quietHours.start)}
                        mode="time"
                        display="spinner"
                        onChange={(_, d) => {
                          if (d) onChange({ ...quietHours, start: dateToTimeString(d) });
                        }}
                        style={{ height: 120 }}
                      />
                    </View>
                  )}

                  <View style={{ height: 1, backgroundColor: '#E5E5EA', marginLeft: 16 }} />

                  {/* End time */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 16,
                    }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowEndPicker(!showEndPicker);
                      setShowStartPicker(false);
                    }}
                    accessibilityLabel="Set quiet hours end time"
                    accessibilityRole="button"
                  >
                    <Text style={{ fontSize: 16, color: '#1C1C1E' }}>End</Text>
                    <Text style={{ fontSize: 16, color: accentColor, fontWeight: '500' }}>
                      {formatTime12(quietHours.end)}
                    </Text>
                  </TouchableOpacity>

                  {showEndPicker && (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                      <DateTimePicker
                        value={timeStringToDate(quietHours.end)}
                        mode="time"
                        display="spinner"
                        onChange={(_, d) => {
                          if (d) onChange({ ...quietHours, end: dateToTimeString(d) });
                        }}
                        style={{ height: 120 }}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            <SafeAreaView edges={['bottom']} />
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
