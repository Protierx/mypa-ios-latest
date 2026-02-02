import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useUpcomingEvents } from '../../../hooks/useCalendarEvents';

const UpcomingEventBanner: React.FC = () => {
  const navigation = useNavigation<any>();
  const { nextEvent, hasPermission, loading } = useUpcomingEvents();

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
    
    if (minutes <= 0) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Integrations');
  };

  // Don't show if no permission or no event
  if (!hasPermission || !nextEvent || loading) {
    return null;
  }

  const timeUntil = getTimeUntil(nextEvent.startDate);
  const isImminent = timeUntil === 'Now' || parseInt(timeUntil) <= 15;

  return (
    <TouchableOpacity 
      style={[styles.container, isImminent && styles.containerUrgent]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, isImminent && styles.iconWrapUrgent]}>
        <Ionicons 
          name="calendar" 
          size={16} 
          color={isImminent ? '#DC2626' : '#7C3AED'} 
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{nextEvent.title}</Text>
        <Text style={[styles.time, isImminent && styles.timeUrgent]}>
          {formatTime(nextEvent.startDate)} • {timeUntil}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  containerUrgent: {
    backgroundColor: '#FEE2E2',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUrgent: {
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  time: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
    marginTop: 2,
  },
  timeUrgent: {
    color: '#DC2626',
  },
});

export default UpcomingEventBanner;
