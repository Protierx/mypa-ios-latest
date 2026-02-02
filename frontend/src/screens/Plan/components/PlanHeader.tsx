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
  onReset?: () => void;
}

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const PlanHeader: React.FC<PlanHeaderProps> = ({
  greeting,
  showCalendar,
  onToggleCalendar,
  onAddTask,
  onReset,
}) => {
  const timeGreeting = getTimeGreeting();
  
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greetingText}>{timeGreeting}</Text>
        <Text style={styles.title}>Here's your day</Text>
      </View>
      <View style={styles.headerButtons}>
        {onReset && (
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={onReset}
            accessibilityRole="button"
            accessibilityLabel="Reset and breathe"
            accessibilityHint="Feeling overwhelmed? Take a moment to reset"
          >
            <Ionicons name="leaf" size={18} color="#10b981" />
          </TouchableOpacity>
        )}
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
