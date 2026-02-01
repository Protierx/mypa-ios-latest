import React from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Task } from '../types';
import { getCategoryEmoji } from '../utils';

interface PriorityFocusProps {
  highPriorityTasks: Task[];
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

export const PriorityFocus: React.FC<PriorityFocusProps> = ({
  highPriorityTasks,
  fadeAnim,
  scaleAnim,
}) => {
  if (highPriorityTasks.length === 0) return null;

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
      <View style={styles.sectionHeader}>
        <Ionicons name="alert-circle" size={20} color="#FF3B30" />
        <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>
          Priority Focus
        </Text>
      </View>
      <View style={[styles.priorityCard, { borderLeftColor: '#FF3B30' }]}>
        {highPriorityTasks.map((task) => (
          <View key={task.id} style={styles.priorityTask}>
            <Text style={styles.priorityEmoji}>
              {getCategoryEmoji(task.category)}
            </Text>
            <View style={styles.priorityTaskContent}>
              <Text style={styles.priorityTaskTitle}>{task.title}</Text>
              {task.time && (
                <Text style={styles.priorityTaskTime}>
                  <Ionicons name="time-outline" size={12} color="#8E8E93" />
                  {' '}{task.time}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};
