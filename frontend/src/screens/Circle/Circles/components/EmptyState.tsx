import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Users } from 'lucide-react-native';
import { styles } from '../styles';

interface EmptyStateProps {
  searchQuery: string;
  filterChip: string;
  onCreatePress: () => void;
}

export function EmptyState({ searchQuery, filterChip, onCreatePress }: EmptyStateProps) {
  const hasFilters = searchQuery || filterChip !== 'all';

  return (
    <View style={styles.emptyState}>
      <BlurView intensity={40} tint="light" style={styles.emptyStateBlur}>
        <View style={styles.emptyIconContainer}>
          <Users color="#64748b" size={28} />
        </View>
        <Text style={styles.emptyTitle}>
          {hasFilters ? 'No Matching Circles' : 'No Circles Yet'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {hasFilters
            ? 'Try adjusting your filters'
            : 'Create your first circle to get started'}
        </Text>
        {!hasFilters && (
          <Pressable onPress={onCreatePress} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Create Circle</Text>
          </Pressable>
        )}
      </BlurView>
    </View>
  );
}
