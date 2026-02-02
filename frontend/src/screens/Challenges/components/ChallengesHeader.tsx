import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '../styles';

interface ChallengesHeaderProps {
  onBack: () => void;
  onAdd: () => void;
}

export function ChallengesHeader({ onBack, onAdd }: ChallengesHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        accessibilityHint="Return to previous screen"
      >
        <Ionicons name="arrow-back" size={20} color="#475569" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Challenges</Text>
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Create new challenge"
        accessibilityHint="Opens dialog to create a new challenge"
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
