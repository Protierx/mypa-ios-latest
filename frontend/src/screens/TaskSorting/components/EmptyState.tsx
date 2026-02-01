import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants';
import { styles } from '../styles';

interface EmptyStateProps {
  activeFilter: 'all' | 'unsorted' | 'reviewed';
  onAddTask: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  activeFilter,
  onAddTask,
}) => {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name="inbox" size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {activeFilter === 'unsorted' ? 'Nothing to sort!' : 'No tasks here'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'unsorted' ? 'All your tasks have been reviewed' : 'Add tasks to get started'}
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onAddTask}>
        <Text style={styles.emptyButtonText}>Add Task</Text>
      </TouchableOpacity>
    </View>
  );
};
