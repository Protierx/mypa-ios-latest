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
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as calendarSync from '../../services/calendarSync';
import api from '../../services/api';

interface Integration {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  description: string;
  connected: boolean;
  type: 'calendar' | 'productivity' | 'health';
}

const IntegrationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hasCalendarPermission, setHasCalendarPermission] = useState(false);
  const [calendars, setCalendars] = useState<calendarSync.CalendarSource[]>([]);
  const [syncSettings, setSyncSettings] = useState<calendarSync.SyncSettings | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);

  // Check if Google Calendar is in device calendars
  const hasGoogleCalendar = calendars.some(c => c.type === 'google');

  const integrations: Integration[] = [
    {
      id: 'apple-calendar',
      name: 'Apple Calendar',
      icon: 'calendar',
      iconColor: '#FF3B30',
      description: 'Sync events from your Apple Calendar',
      connected: hasCalendarPermission,
      type: 'calendar',
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      icon: 'logo-google',
      iconColor: '#4285F4',
      description: hasGoogleCalendar ? 'Synced via iPhone' : 'Add via iPhone Settings',
      connected: hasGoogleCalendar,
      type: 'calendar',
    },
    {
      id: 'reminders',
      name: 'Apple Reminders',
      icon: 'checkbox-outline',
      iconColor: '#FF9500',
      description: 'Import from Apple Reminders',
      connected: false,
      type: 'productivity',
    },
    {
      id: 'notion',
      name: 'Notion',
      icon: 'document-text',
      iconColor: '#000000',
      description: 'Open Notion for notes',
      connected: false,
      type: 'productivity',
    },
    {
      id: 'todoist',
      name: 'Todoist',
      icon: 'checkmark-circle',
      iconColor: '#E44332',
      description: 'Open Todoist',
      connected: false,
      type: 'productivity',
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [permission, cals, settings, sync, google] = await Promise.all([
        calendarSync.checkCalendarPermissions(),
        calendarSync.getDeviceCalendars(),
        calendarSync.getSyncSettings(),
        calendarSync.getLastSyncTime(),
        calendarSync.isGoogleConnected(),
      ]);
      
      setHasCalendarPermission(permission);
      setCalendars(cals);
      setSyncSettings(settings);
      setLastSync(sync);
      setGoogleConnected(google);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Disconnect Calendar',
      'This will remove your calendar sync settings. You can reconnect anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await calendarSync.disconnectCalendar();
            setHasCalendarPermission(false);
            setCalendars([]);
            setSyncSettings(null);
            setLastSync(null);
            Alert.alert('Disconnected', 'Calendar sync has been turned off.');
          },
        },
      ]
    );
  };

  const handleConnectCalendar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const granted = await calendarSync.requestCalendarPermissions();
    
    if (granted) {
      setHasCalendarPermission(true);
      const cals = await calendarSync.getDeviceCalendars();
      setCalendars(cals);
      
      // Save all calendars as selected by default when connecting
      const allCalendarIds = cals.map(c => c.id);
      await calendarSync.saveSelectedCalendars(allCalendarIds);
      
      // Update isSelected state
      const updatedCals = cals.map(c => ({ ...c, isSelected: true }));
      setCalendars(updatedCals);
      
      Alert.alert(
        '✅ Calendar Connected',
        `Found ${cals.length} calendars. Your events will now appear in MYPA.`,
        [{ text: 'Great!' }]
      );
    } else {
      Alert.alert(
        'Permission Required',
        'Please enable calendar access in Settings to sync your events.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleConnectGoogle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Check if Google Calendar is in device calendars
    const hasGoogleCalendar = calendars.some(c => c.type === 'google');
    
    if (hasGoogleCalendar) {
      Alert.alert(
        '✅ Google Calendar Connected',
        'Your Google Calendar is synced through your iPhone. Events will appear automatically in MYPA.',
        [
          { text: 'OK' },
          { text: 'Open Google Calendar', onPress: () => calendarSync.openGoogleCalendar() },
        ]
      );
    } else {
      Alert.alert(
        'Connect Google Calendar',
        'To sync Google Calendar events:\n\n1. Open iPhone Settings\n2. Go to Calendar → Accounts\n3. Tap "Add Account" → Google\n4. Sign in and enable Calendars\n\nOnce added, events will sync automatically!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleIntegrationPress = async (integration: Integration) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (integration.id) {
      case 'apple-calendar':
        if (!integration.connected) {
          await handleConnectCalendar();
        } else {
          calendarSync.openAppleCalendar();
        }
        break;
      case 'google-calendar':
        await handleConnectGoogle();
        break;
      case 'reminders':
        calendarSync.openReminders();
        break;
      case 'notion':
        calendarSync.openNotion();
        break;
      case 'todoist':
        calendarSync.openTodoist();
        break;
    }
  };

  const handleCalendarToggle = async (calendarId: string, selected: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const updated = calendars.map(cal => 
      cal.id === calendarId ? { ...cal, isSelected: selected } : cal
    );
    setCalendars(updated);
    
    const selectedIds = updated.filter(c => c.isSelected).map(c => c.id);
    await calendarSync.saveSelectedCalendars(selectedIds);
  };

  const handleSyncSettingChange = async (key: keyof calendarSync.SyncSettings, value: boolean | number) => {
    if (!syncSettings) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const updated = { ...syncSettings, [key]: value };
    setSyncSettings(updated);
    await calendarSync.saveSyncSettings({ [key]: value });
  };

  const handleSyncNow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSyncing(true);
    
    try {
      // Fetch today's events FROM calendar
      const events = await calendarSync.getTodayEvents();
      
      // Also export MYPA tasks TO calendar if enabled
      let exported = { success: 0, failed: 0 };
      if (syncSettings?.exportCompletedTasks || syncSettings?.twoWaySync) {
        try {
          // Fetch today's tasks from API
          const today = new Date().toISOString().split('T')[0];
          const response = await api.get(`/tasks?date=${today}`);
          const tasks = response.data?.tasks || response.data || [];
          
          if (tasks.length > 0) {
            // Filter tasks to export (completed if exportCompletedTasks, all if twoWaySync)
            const tasksToExport = syncSettings?.twoWaySync 
              ? tasks 
              : tasks.filter((t: any) => t.completed);
            
            exported = await calendarSync.exportMultipleTasksToCalendar(tasksToExport);
          }
        } catch (apiError) {
          console.log('Could not fetch tasks for export:', apiError);
        }
      }
      
      await calendarSync.setLastSyncTime();
      setLastSync(new Date());
      
      let message = `Found ${events.length} calendar events for today.`;
      if (exported.success > 0) {
        message += `\n\nExported ${exported.success} tasks to Apple Calendar.`;
      }
      
      Alert.alert('✅ Sync Complete', message, [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Sync Failed', 'Please try again later.');
    } finally {
      setSyncing(false);
    }
  };

  const handleTestExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Create a test event 1 hour from now
    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 1, 0, 0, 0);
    
    const testTask: calendarSync.MYPATask = {
      id: 'test-' + Date.now(),
      title: '🧪 MYPA Test Event',
      durationMin: 30,
      category: 'Personal',
    };
    
    const result = await calendarSync.exportTaskToCalendar({
      ...testTask,
      date: startDate.toISOString().split('T')[0],
      time: startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    });
    
    if (result) {
      Alert.alert(
        '✅ Test Event Created!',
        'Check your Apple Calendar app - you should see "🧪 MYPA Test Event" in the MYPA Tasks calendar.',
        [
          { text: 'OK' },
          { text: 'Open Calendar', onPress: () => calendarSync.openAppleCalendar() },
        ]
      );
    } else {
      Alert.alert('Failed', 'Could not create test event. Make sure calendar permissions are granted.');
    }
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getCalendarIcon = (type: string) => {
    switch (type) {
      case 'google': return 'logo-google';
      case 'icloud': return 'cloud';
      case 'outlook': return 'mail';
      default: return 'calendar';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Integrations</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connected Apps Section */}
        <Text style={styles.sectionTitle}>Connected Apps</Text>
        <View style={styles.card}>
          {integrations.map((integration, index) => (
            <TouchableOpacity
              key={integration.id}
              style={[
                styles.integrationRow,
                index < integrations.length - 1 && styles.integrationRowBorder,
              ]}
              onPress={() => handleIntegrationPress(integration)}
            >
              <View style={[styles.integrationIcon, { backgroundColor: `${integration.iconColor}15` }]}>
                <Ionicons
                  name={integration.icon as any}
                  size={22}
                  color={integration.iconColor}
                />
              </View>
              <View style={styles.integrationInfo}>
                <Text style={styles.integrationName}>{integration.name}</Text>
                <Text style={styles.integrationDescription}>{integration.description}</Text>
              </View>
              {integration.id === 'apple-calendar' ? (
                integration.connected ? (
                  <TouchableOpacity
                    style={styles.disconnectButton}
                    onPress={handleDisconnectCalendar}
                  >
                    <Text style={styles.disconnectButtonText}>Disconnect</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => handleIntegrationPress(integration)}
                  >
                    <Text style={styles.connectButtonText}>Connect</Text>
                  </TouchableOpacity>
                )
              ) : integration.id === 'google-calendar' ? (
                integration.connected ? (
                  <View style={styles.connectedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => handleIntegrationPress(integration)}
                  >
                    <Text style={styles.connectButtonText}>Setup</Text>
                  </TouchableOpacity>
                )
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Your Calendars Section */}
        {hasCalendarPermission && calendars.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Calendars</Text>
            <View style={styles.card}>
              {calendars.map((calendar, index) => (
                <View
                  key={calendar.id}
                  style={[
                    styles.calendarRow,
                    index < calendars.length - 1 && styles.calendarRowBorder,
                  ]}
                >
                  <View style={styles.calendarInfo}>
                    <View style={[styles.calendarDot, { backgroundColor: calendar.color }]} />
                    <View>
                      <Text style={styles.calendarName}>{calendar.name}</Text>
                      {calendar.accountName && (
                        <Text style={styles.calendarAccount}>{calendar.accountName}</Text>
                      )}
                    </View>
                  </View>
                  <Switch
                    value={calendar.isSelected}
                    onValueChange={(value) => handleCalendarToggle(calendar.id, value)}
                    trackColor={{ false: '#E5E7EB', true: '#A78BFA' }}
                    thumbColor={calendar.isSelected ? '#7C3AED' : '#F9FAFB'}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {/* Sync Settings Section */}
        {hasCalendarPermission && syncSettings && (
          <>
            <Text style={styles.sectionTitle}>Sync Settings</Text>
            <View style={styles.card}>
              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>Auto Sync</Text>
                  <Text style={styles.settingDescription}>
                    Automatically sync calendar events
                  </Text>
                </View>
                <Switch
                  value={syncSettings.autoSync}
                  onValueChange={(value) => handleSyncSettingChange('autoSync', value)}
                  trackColor={{ false: '#E5E7EB', true: '#A78BFA' }}
                  thumbColor={syncSettings.autoSync ? '#7C3AED' : '#F9FAFB'}
                />
              </View>

              <View style={[styles.settingRow, styles.settingRowBorder]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>Import as Time Blocks</Text>
                  <Text style={styles.settingDescription}>
                    Show calendar events as focus blocks
                  </Text>
                </View>
                <Switch
                  value={syncSettings.importAsBlocks}
                  onValueChange={(value) => handleSyncSettingChange('importAsBlocks', value)}
                  trackColor={{ false: '#E5E7EB', true: '#A78BFA' }}
                  thumbColor={syncSettings.importAsBlocks ? '#7C3AED' : '#F9FAFB'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>Export Completed Tasks</Text>
                  <Text style={styles.settingDescription}>
                    Add completed tasks to MYPA calendar
                  </Text>
                </View>
                <Switch
                  value={syncSettings.exportCompletedTasks}
                  onValueChange={(value) => handleSyncSettingChange('exportCompletedTasks', value)}
                  trackColor={{ false: '#E5E7EB', true: '#A78BFA' }}
                  thumbColor={syncSettings.exportCompletedTasks ? '#7C3AED' : '#F9FAFB'}
                />
              </View>
            </View>
          </>
        )}

        {/* Sync Now Button */}
        {hasCalendarPermission && (
          <View style={styles.syncSection}>
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSyncNow}
              disabled={syncing}
            >
              <LinearGradient
                colors={['#7C3AED', '#5B21B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.syncButtonGradient}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sync" size={20} color="#FFFFFF" />
                    <Text style={styles.syncButtonText}>Sync Now</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestExport}
            >
              <Ionicons name="add-circle-outline" size={18} color="#7C3AED" />
              <Text style={styles.testButtonText}>Create Test Event in Calendar</Text>
            </TouchableOpacity>
            
            <Text style={styles.lastSyncText}>
              Last synced: {formatLastSync(lastSync)}
            </Text>
          </View>
        )}

        {/* Coming Soon Section */}
        <Text style={styles.sectionTitle}>Coming Soon</Text>
        <View style={styles.card}>
          <View style={styles.comingSoonRow}>
            <View style={[styles.integrationIcon, { backgroundColor: '#2563EB15' }]}>
              <Ionicons name="logo-microsoft" size={22} color="#2563EB" />
            </View>
            <View style={styles.integrationInfo}>
              <Text style={styles.integrationName}>Outlook Calendar</Text>
              <Text style={styles.integrationDescription}>Coming in a future update</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </View>
          <View style={[styles.comingSoonRow, { borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
            <View style={[styles.integrationIcon, { backgroundColor: '#EC489915' }]}>
              <Ionicons name="heart" size={22} color="#EC4899" />
            </View>
            <View style={styles.integrationInfo}>
              <Text style={styles.integrationName}>Apple Health</Text>
              <Text style={styles.integrationDescription}>Track focus time & wellness</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  integrationRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  integrationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  integrationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  integrationDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  connectedBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disconnectButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  calendarRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  calendarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  calendarName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  calendarAccount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  syncSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  syncButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  syncButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
  },
  lastSyncText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 12,
  },
  comingSoonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    opacity: 0.7,
  },
  comingSoonBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 40,
  },
});

export default IntegrationsScreen;
