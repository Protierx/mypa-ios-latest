import React from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../styles';

interface QuickActionsProps {
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  fadeAnim,
  scaleAnim,
}) => {
  const navigation = useNavigation();

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: '#007AFF15' }]}
          onPress={() => navigation.navigate('Tasks' as never)}
        >
          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          <Text style={[styles.quickActionText, { color: '#007AFF' }]}>Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: '#FF950015' }]}
          onPress={() => navigation.navigate('VoiceAssistant' as never)}
        >
          <Ionicons name="mic" size={24} color="#FF9500" />
          <Text style={[styles.quickActionText, { color: '#FF9500' }]}>MYPA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: '#34C75915' }]}
          onPress={() => navigation.navigate('Analytics' as never)}
        >
          <Ionicons name="stats-chart" size={24} color="#34C759" />
          <Text style={[styles.quickActionText, { color: '#34C759' }]}>Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: '#AF52DE15' }]}
          onPress={() => navigation.navigate('Plan' as never)}
        >
          <Ionicons name="calendar" size={24} color="#AF52DE" />
          <Text style={[styles.quickActionText, { color: '#AF52DE' }]}>Plan</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};
