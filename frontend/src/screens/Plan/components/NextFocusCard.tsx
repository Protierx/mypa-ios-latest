import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Task } from '../types';
import { styles } from '../styles';

interface NextFocusCardProps {
  task: Task;
  onStart: () => void;
  onComplete: () => void;
}

export const NextFocusCard: React.FC<NextFocusCardProps> = ({
  task,
  onStart,
  onComplete,
}) => {
  return (
    <LinearGradient colors={['#0F172A', '#1F2937']} style={styles.nextFocusCard}>
      <TouchableOpacity style={styles.nextFocusPlay} onPress={onStart}>
        <Ionicons name="play" size={20} color="#0F172A" />
      </TouchableOpacity>
      <View style={styles.nextFocusInfo}>
        <Text style={styles.nextFocusLabel}>Ready to Focus</Text>
        <Text style={styles.nextFocusTitle} numberOfLines={1}>{task.title}</Text>
        <Text style={styles.nextFocusMeta}>{task.time} • {task.duration} estimated</Text>
      </View>
      <TouchableOpacity style={styles.nextFocusDone} onPress={onComplete}>
        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </LinearGradient>
  );
};
