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
    <TouchableOpacity activeOpacity={0.9} onPress={onStart}>
      <LinearGradient 
        colors={['#1e1b4b', '#312e81']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.nextFocusCard}
      >
        <View style={styles.nextFocusPlayWrap}>
          <View style={styles.nextFocusPlay}>
            <Ionicons name="play" size={24} color="#312e81" style={{ marginLeft: 3 }} />
          </View>
        </View>
        <View style={styles.nextFocusInfo}>
          <Text style={styles.nextFocusLabel}>Up Next</Text>
          <Text style={styles.nextFocusTitle} numberOfLines={1}>{task.title}</Text>
          <Text style={styles.nextFocusMeta}>
            {task.duration} • Tap to start focusing
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.nextFocusCheck} 
          onPress={onComplete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="checkmark-circle-outline" size={28} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};
