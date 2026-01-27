import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { ToggleSwitch } from '../components/ToggleSwitch';

interface NotificationsScreenProps {
  navigation?: any;
}

export function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [calendarAlerts, setCalendarAlerts] = useState(true);
  const [circleUpdates, setCircleUpdates] = useState(true);
  const [challengeAlerts, setChallengeAlerts] = useState(true);
  const [nudges, setNudges] = useState(true);
  const [achievements, setAchievements] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [badgeEnabled, setBadgeEnabled] = useState(true);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const notificationTypes = [
    { key: 'taskReminders', label: 'Task Reminders', desc: 'Upcoming tasks & deadlines', icon: 'time', color: '#3B82F6', value: taskReminders, setter: setTaskReminders },
    { key: 'dailyBriefing', label: 'Daily Briefing', desc: 'Morning summary at 7:00 AM', icon: 'flash', color: '#8B5CF6', value: dailyBriefing, setter: setDailyBriefing },
    { key: 'calendarAlerts', label: 'Calendar Alerts', desc: 'Event reminders', icon: 'calendar', color: '#EF4444', value: calendarAlerts, setter: setCalendarAlerts },
    { key: 'circleUpdates', label: 'Circle Updates', desc: 'Posts, reactions & assignments', icon: 'people', color: '#EC4899', value: circleUpdates, setter: setCircleUpdates },
    { key: 'challengeAlerts', label: 'Challenges', desc: 'Progress & completions', icon: 'trophy', color: '#F97316', value: challengeAlerts, setter: setChallengeAlerts },
    { key: 'nudges', label: 'Nudges', desc: 'Motivational reminders', icon: 'chatbubble-ellipses', color: '#10B981', value: nudges, setter: setNudges },
    { key: 'achievements', label: 'Achievements', desc: 'Unlocks & milestones', icon: 'ribbon', color: '#F59E0B', value: achievements, setter: setAchievements },
    { key: 'weeklyReport', label: 'Weekly Report', desc: 'Sunday summary email', icon: 'bar-chart', color: '#6366F1', value: weeklyReport, setter: setWeeklyReport },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#475569" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <View style={styles.masterToggle}>
        <View style={styles.masterToggleLeft}>
          <View style={[styles.masterIcon, !notificationsEnabled && { backgroundColor: '#94A3B8' }]}>
            <Ionicons name={notificationsEnabled ? 'notifications' : 'notifications-off'} size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.masterLabel}>Allow Notifications</Text>
            <Text style={styles.masterDesc}>
              {notificationsEnabled ? 'Notifications are on' : 'All notifications are paused'}
            </Text>
          </View>
        </View>
        <ToggleSwitch active={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} />
      </View>

      {notificationsEnabled && (
        <>
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionLabel}>NOTIFICATION TYPES</Text>
            <View style={styles.card}>
              {notificationTypes.map((item, i) => (
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
                  {i < notificationTypes.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionLabel}>QUIET HOURS</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={[styles.toggleIcon, { backgroundColor: quietHoursEnabled ? '#6366F1' : '#94A3B8' }]}>
                  <Ionicons name="moon" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.toggleContent}>
                  <Text style={styles.toggleLabel}>Quiet Hours</Text>
                  <Text style={styles.toggleDesc}>Pause notifications</Text>
                </View>
                <ToggleSwitch active={quietHoursEnabled} onToggle={() => setQuietHoursEnabled(!quietHoursEnabled)} />
              </View>
              {quietHoursEnabled && (
                <View style={styles.quietHoursConfig}>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>From</Text>
                    <Text style={styles.timeValue}>10:00 PM</Text>
                  </View>
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>To</Text>
                    <Text style={styles.timeValue}>7:00 AM</Text>
                  </View>
                  <Text style={styles.quietNote}>Notifications will be silently delivered during quiet hours</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.sectionWrapper, { marginBottom: 120 }]}>
            <Text style={styles.sectionLabel}>DELIVERY</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={[styles.toggleIcon, { backgroundColor: soundEnabled ? '#8B5CF6' : '#94A3B8' }]}>
                  <Ionicons name="volume-high" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.toggleLabel}>Sound</Text>
                <ToggleSwitch active={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />
              </View>
              <View style={styles.divider} />
              <View style={styles.toggleRow}>
                <View style={[styles.toggleIcon, { backgroundColor: vibrationEnabled ? '#F97316' : '#94A3B8' }]}>
                  <Ionicons name="phone-portrait" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.toggleLabel}>Vibration</Text>
                <ToggleSwitch active={vibrationEnabled} onToggle={() => setVibrationEnabled(!vibrationEnabled)} />
              </View>
              <View style={styles.divider} />
              <View style={styles.toggleRow}>
                <View style={[styles.toggleIcon, { backgroundColor: badgeEnabled ? '#EF4444' : '#94A3B8' }]}>
                  <Ionicons name="ellipse" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.toggleLabel}>Badge Count</Text>
                <ToggleSwitch active={badgeEnabled} onToggle={() => setBadgeEnabled(!badgeEnabled)} />
              </View>
              <View style={styles.divider} />
              <View style={styles.toggleRow}>
                <View style={[styles.toggleIcon, { backgroundColor: previewEnabled ? '#64748B' : '#94A3B8' }]}>
                  <Ionicons name="eye" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.toggleContent}>
                  <Text style={styles.toggleLabel}>Show Previews</Text>
                  <Text style={styles.toggleDesc}>Show content on lock screen</Text>
                </View>
                <ToggleSwitch active={previewEnabled} onToggle={() => setPreviewEnabled(!previewEnabled)} />
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  masterToggle: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  masterToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  masterIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  masterDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  sectionWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  toggleDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  quietHoursConfig: {
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quietNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
});
