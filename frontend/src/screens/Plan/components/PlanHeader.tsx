import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Greeting } from '../types';
import { styles } from '../styles';

interface PlanHeaderProps {
  greeting: Greeting;
  showCalendar: boolean;
  onToggleCalendar: () => void;
  onAddTask: () => void;
}

export const PlanHeader: React.FC<PlanHeaderProps> = ({
  greeting,
  showCalendar,
  onToggleCalendar,
  onAddTask,
}) => {
  return (
    <View style={styles.header}>
      <View>
        <View style={styles.greetingRow}>
          <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
          <Text style={styles.greetingText}>{greeting.text}</Text>
        </View>
        <Text style={styles.title}>Your Plan</Text>
      </View>
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[styles.headerIconBtn, showCalendar && styles.headerIconBtnActive]}
          onPress={onToggleCalendar}
          accessibilityRole="button"
          accessibilityLabel={showCalendar ? "Hide calendar" : "Show calendar"}
          accessibilityState={{ expanded: showCalendar }}
        >
          <Ionicons name="calendar" size={18} color={showCalendar ? '#FFFFFF' : '#64748B'} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={onAddTask}
          accessibilityRole="button"
          accessibilityLabel="Add new task to plan"
          accessibilityHint="Opens dialog to create a new task"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
