import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { QUICK_PROMPTS } from '../constants';
import { styles } from '../styles';

interface QuickPromptsProps {
  visible: boolean;
  onSelect: (prompt: string) => void;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  visible,
  onSelect,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.quickPromptsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {QUICK_PROMPTS.map((prompt, i) => (
          <TouchableOpacity
            key={i}
            style={styles.quickPrompt}
            onPress={() => onSelect(prompt)}
          >
            <Text style={styles.quickPromptText}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
