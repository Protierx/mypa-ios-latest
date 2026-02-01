import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar, Users, Zap } from 'lucide-react-native';
import { styles } from '../styles';

interface EmptyStateProps {
  onViewPlan: () => void;
  onViewCircles: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onViewPlan,
  onViewCircles,
}) => {
  return (
    <BlurView intensity={50} tint="light" style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Zap size={20} color="#10B981" />
      </View>
      <Text style={styles.emptyTitle}>All caught up!</Text>
      <Text style={styles.emptySubtitle}>New messages and updates will appear here.</Text>
      <View style={styles.emptyBadge}>
        <Zap size={14} color="#10B981" />
        <Text style={styles.emptyBadgeText}>+10 XP for staying organized</Text>
      </View>
      <View style={styles.emptyActions}>
        <Pressable style={styles.emptyActionPrimary} onPress={onViewPlan}>
          <Calendar size={16} color="#2563EB" />
          <Text style={styles.emptyActionText}>View Plan</Text>
        </Pressable>
        <Pressable style={styles.emptyActionSecondary} onPress={onViewCircles}>
          <Users size={16} color="#7C3AED" />
          <Text style={[styles.emptyActionText, { color: '#7C3AED' }]}>Circles</Text>
        </Pressable>
      </View>
    </BlurView>
  );
};
