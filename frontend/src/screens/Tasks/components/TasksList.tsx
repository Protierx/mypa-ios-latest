import React from 'react';
import { View, Text, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, FilterType } from '../types';
import { TaskCard } from './TaskCard';
import { styles } from '../styles';

interface TasksListProps {
  tasks: Task[];
  filter: FilterType;
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  addPulse: Animated.Value;
  onAdd: () => void;
}

export function TasksList({ tasks, filter, onToggleTask, onEditTask, addPulse, onAdd }: TasksListProps) {
  return (
    <>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyStateText}>No tasks found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'completed' ? 'Complete some tasks to see them here' : 'Add a new task to get started'}
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => onToggleTask(task.id)}
              onEdit={() => onEditTask(task)}
            />
          ))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add Task FAB */}
      <Animated.View style={{ transform: [{ scale: addPulse }] }}>
        <TouchableOpacity style={styles.addFab} onPress={onAdd}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}
