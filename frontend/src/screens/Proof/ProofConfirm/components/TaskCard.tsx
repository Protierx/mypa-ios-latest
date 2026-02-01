import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../styles';
import { TaskInfo } from '../types';
import { styles } from '../styles';

interface TaskCardProps {
  task: TaskInfo;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => (
  <View style={styles.taskInfo}>
    <View style={styles.taskCard}>
      <View style={styles.taskIcon}>
        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
      </View>
      <View style={styles.taskDetails}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskCategory}>{task.category}</Text>
      </View>
      <View style={styles.xpBadge}>
        <Text style={styles.xpText}>+{task.xp} XP</Text>
      </View>
    </View>
  </View>
);
