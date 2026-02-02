import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useUpcomingEvents } from '../../../hooks/useCalendarEvents';
import * as calendarSync from '../../../services/calendarSync';

interface CalendarEventsCardProps {
  onImportEvent?: (event: calendarSync.TaskFromCalendar) => void;
}

const CalendarEventsCard: React.FC<CalendarEventsCardProps> = ({ onImportEvent }) => {
  const navigation = useNavigation<any>();
  const { upcomingEvents, nextEvent, hasPermission, requestPermission, loading } = useUpcomingEvents();

  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getTimeUntil = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 0) return 'Now';
    if (minutes < 60) return `in ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `in ${hours}h ${minutes % 60}m`;
  };

  const handleConnect = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const granted = await requestPermission();
    
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Please enable calendar access in Settings to see your events.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleImport = (event: calendarSync.CalendarEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const task = calendarSync.convertEventToTask(event);
    onImportEvent?.(task);
    
    Alert.alert(
      '✅ Event Added',
      `"${event.title}" has been added to your tasks.`,
      [{ text: 'OK' }]
    );
  };

  const handleManageIntegrations = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Integrations');
  };

  // Not connected state
  if (!hasPermission && !loading) {
    return (
      <TouchableOpacity 
        style={styles.connectCard}
        onPress={handleConnect}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#F3E8FF', '#E9D5FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.connectGradient}
        >
          <View style={styles.connectIcon}>
            <Ionicons name="calendar" size={24} color="#7C3AED" />
          </View>
          <View style={styles.connectContent}>
            <Text style={styles.connectTitle}>Connect Your Calendar</Text>
            <Text style={styles.connectSubtitle}>See events alongside your tasks</Text>
          </View>
          <View style={styles.connectArrow}>
            <Ionicons name="add-circle" size={28} color="#7C3AED" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // No upcoming events
  if (upcomingEvents.length === 0 && !loading) {
    return null; // Don't show anything if no events
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar" size={18} color="#7C3AED" />
          <Text style={styles.headerTitle}>Upcoming</Text>
        </View>
        <TouchableOpacity 
          style={styles.manageButton}
          onPress={handleManageIntegrations}
        >
          <Text style={styles.manageText}>Manage</Text>
        </TouchableOpacity>
      </View>

      {upcomingEvents.slice(0, 3).map((event, index) => (
        <View 
          key={event.id}
          style={[
            styles.eventRow,
            index < Math.min(upcomingEvents.length, 3) - 1 && styles.eventRowBorder,
          ]}
        >
          <View style={styles.eventTime}>
            <Text style={styles.eventTimeText}>{formatTime(event.startDate)}</Text>
            <Text style={styles.eventUntil}>{getTimeUntil(event.startDate)}</Text>
          </View>
          
          <View style={styles.eventDetails}>
            <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
            {event.location && (
              <View style={styles.eventLocation}>
                <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                <Text style={styles.eventLocationText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.importButton}
            onPress={() => handleImport(event)}
          >
            <Ionicons name="add-circle-outline" size={22} color="#7C3AED" />
          </TouchableOpacity>
        </View>
      ))}

      {upcomingEvents.length > 3 && (
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => calendarSync.openAppleCalendar()}
        >
          <Text style={styles.moreText}>
            +{upcomingEvents.length - 3} more events
          </Text>
          <Ionicons name="open-outline" size={14} color="#7C3AED" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  manageButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  manageText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7C3AED',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eventRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  eventTime: {
    width: 65,
    marginRight: 12,
  },
  eventTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  eventUntil: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '500',
    marginTop: 2,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  eventLocationText: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
  },
  importButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  moreText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7C3AED',
  },
  // Connect card styles
  connectCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  connectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  connectIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectContent: {
    flex: 1,
    marginLeft: 12,
  },
  connectTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  connectSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  connectArrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CalendarEventsCard;
