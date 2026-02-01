import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowLeft, History } from 'lucide-react-native';
import { styles } from '../styles';

interface WalletHeaderProps {
  onBack: () => void;
  onHistory: () => void;
}

export const WalletHeader: React.FC<WalletHeaderProps> = ({
  onBack,
  onHistory,
}) => {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.headerButton,
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back to hub"
      >
        <ArrowLeft color="#475569" size={20} />
      </Pressable>
      <Text style={styles.headerTitle}>Time Saved</Text>
      <Pressable
        onPress={onHistory}
        style={({ pressed }) => [
          styles.headerButton,
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="View history"
      >
        <History color="#475569" size={20} />
      </Pressable>
    </View>
  );
};
