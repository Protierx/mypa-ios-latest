import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { TaskSuggestion } from '../types';
import { SuggestionCard } from './SuggestionCard';

interface SuggestionsListProps {
  suggestions: TaskSuggestion[];
  onApply: (suggestion: TaskSuggestion) => void;
  onDismiss: (id: string) => void;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions,
  onApply,
  onDismiss,
  fadeAnim,
  slideAnim,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>SMART SUGGESTIONS</Text>
        <View style={styles.suggestionBadge}>
          <Ionicons name="sparkles" size={12} color="#5856D6" />
          <Text style={styles.suggestionBadgeText}>AI Powered</Text>
        </View>
      </View>
      
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onApply={onApply}
          onDismiss={onDismiss}
        />
      ))}
    </Animated.View>
  );
};
