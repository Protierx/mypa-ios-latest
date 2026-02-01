import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types';
import { priorityConfig, categoryColors } from '../constants';
import { styles } from '../styles';

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
}

export function TaskCard({ task, onToggle, onEdit }: TaskCardProps) {
  const prioConfig = priorityConfig[task.priority];
  const catColor = categoryColors[task.category] || '#64748B';

  return (
    <TouchableOpacity
      style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
      onPress={onToggle}
    >
      <TouchableOpacity
        style={[
          styles.checkbox,
          task.completed && styles.checkboxCompleted,
          !task.completed && { borderColor: catColor },
        ]}
        onPress={onToggle}
      >
        {task.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={[styles.priorityBadge, { backgroundColor: prioConfig.bg }]}>
            <Ionicons name={prioConfig.icon as any} size={12} color={prioConfig.color} />
            <Text style={[styles.priorityText, { color: prioConfig.color }]}>
              {task.priority}
            </Text>
          </View>
        </View>
        
        <Text style={styles.taskDescription} numberOfLines={1}>{task.description}</Text>
        
        <View style={styles.taskMeta}>
          <View style={[styles.categoryBadge, { backgroundColor: catColor + '15' }]}>
            <Ionicons name={task.categoryIcon as any} size={12} color={catColor} />
            <Text style={[styles.categoryText, { color: catColor }]}>{task.category}</Text>
          </View>
          <View style={styles.dueBadge}>
            <Ionicons name="calendar-outline" size={12} color="#64748B" />
            <Text style={styles.taskDue}>{task.dueDate}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.taskMenuButton} onPress={onEdit}>
        <Ionicons name="ellipsis-vertical" size={16} color="#94A3B8" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
