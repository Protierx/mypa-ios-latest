import React from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface EmptyStateProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  fadeAnim,
  slideAnim,
}) => {
  return (
    <Animated.View
      style={[
        styles.emptyContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.emptyIcon}>
        <Ionicons name="sparkles" size={48} color="#8E8E93" />
      </View>
      <Text style={styles.emptyTitle}>All Good!</Text>
      <Text style={styles.emptyText}>
        Your tasks are well organized. Check back later for new insights.
      </Text>
    </Animated.View>
  );
};
