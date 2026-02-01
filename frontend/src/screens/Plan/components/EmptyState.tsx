import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../styles';

interface EmptyStateProps {
  onAddTask: () => void;
  onNavigateSort: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onAddTask,
  onNavigateSort,
}) => {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="checkmark-circle" size={30} color="#8B5CF6" />
      </View>
      <Text style={styles.emptyTitle}>No tasks for today</Text>
      <Text style={styles.emptySubtitle}>Add tasks or use Brain Dump to get organized</Text>
      <View style={styles.emptyButtons}>
        <TouchableOpacity style={styles.emptyPrimary} onPress={onAddTask}>
          <Text style={styles.emptyPrimaryText}>Add Task</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.emptySecondary} onPress={onNavigateSort}>
          <MaterialCommunityIcons name="star-four-points-outline" size={16} color="#7C3AED" />
          <Text style={styles.emptySecondaryText}>Brain Dump</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
