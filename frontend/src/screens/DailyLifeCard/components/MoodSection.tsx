import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MOOD_EMOJIS, DEFAULT_SELECTED_MOOD } from '../constants';
import { styles } from '../styles';

interface MoodSectionProps {
  selectedMood?: number;
  onSelectMood?: (index: number) => void;
}

export const MoodSection: React.FC<MoodSectionProps> = ({
  selectedMood = DEFAULT_SELECTED_MOOD,
  onSelectMood,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Mood Check</Text>
    <View style={styles.moodRow}>
      {MOOD_EMOJIS.map((emoji, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.moodButton, index === selectedMood && styles.moodButtonActive]}
          onPress={() => onSelectMood?.(index)}
        >
          <Text style={styles.moodEmoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
