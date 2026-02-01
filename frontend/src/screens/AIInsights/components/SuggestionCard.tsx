import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { TaskSuggestion } from '../types';
import { getSuggestionIcon, getSuggestionColor, getImpactBadge } from '../utils';

interface SuggestionCardProps {
  suggestion: TaskSuggestion;
  onApply: (suggestion: TaskSuggestion) => void;
  onDismiss: (id: string) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onApply,
  onDismiss,
}) => {
  const color = getSuggestionColor(suggestion.type);
  const icon = getSuggestionIcon(suggestion.type);
  const impact = suggestion.impact ? getImpactBadge(suggestion.impact) : null;

  return (
    <View style={styles.suggestionCard}>
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={() => onDismiss(suggestion.id)}
      >
        <Ionicons name="close" size={14} color="#8E8E93" />
      </TouchableOpacity>
      
      <View style={[styles.suggestionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      
      <View style={styles.suggestionContent}>
        {suggestion.taskTitle && (
          <Text style={styles.suggestionTaskTitle} numberOfLines={1}>
            {suggestion.taskTitle}
          </Text>
        )}
        <Text style={styles.suggestionMessage}>{suggestion.message}</Text>
        {impact && (
          <View style={[styles.impactBadge, { backgroundColor: impact.bg }]}>
            <Ionicons name="trending-up" size={12} color={impact.color} />
            <Text style={[styles.impactBadgeText, { color: impact.color }]}>
              {impact.label}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={[styles.applyButton, { backgroundColor: color }]}
        onPress={() => onApply(suggestion)}
      >
        <Text style={styles.applyButtonText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
};
