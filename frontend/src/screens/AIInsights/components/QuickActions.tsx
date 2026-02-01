import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../styles';

interface QuickActionsProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  fadeAnim,
  slideAnim,
}) => {
  const navigation = useNavigation();

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('VoiceAssistant' as never)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#FF950015' }]}>
            <Ionicons name="mic" size={24} color="#FF9500" />
          </View>
          <Text style={styles.actionText}>Ask MYPA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Tasks' as never)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#007AFF15' }]}>
            <Ionicons name="list" size={24} color="#007AFF" />
          </View>
          <Text style={styles.actionText}>View Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Plan' as never)}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#34C75915' }]}>
            <Ionicons name="calendar" size={24} color="#34C759" />
          </View>
          <Text style={styles.actionText}>Plan Day</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};
