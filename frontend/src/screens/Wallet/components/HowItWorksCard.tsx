import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { HowItWorksItem } from '../types';
import { styles } from '../styles';

interface HowItWorksCardProps {
  items: HowItWorksItem[];
  onItemPress?: (item: HowItWorksItem) => void;
}

export const HowItWorksCard: React.FC<HowItWorksCardProps> = ({
  items,
  onItemPress,
}) => {
  return (
    <BlurView intensity={40} tint="light" style={styles.card}>
      <Text style={styles.sectionTitle}>How It Works</Text>
      <View style={styles.howItWorksGrid}>
        {items.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => onItemPress?.(item)}
            style={({ pressed }) => [
              styles.howItWorksItem,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${item.action}: ${item.example}`}
          >
            <View style={styles.howItWorksIconContainer}>
              <Text style={styles.howItWorksEmoji}>{item.icon}</Text>
            </View>
            <Text style={styles.howItWorksTitle}>{item.action}</Text>
            <Text style={styles.howItWorksDescription}>{item.example}</Text>
          </Pressable>
        ))}
      </View>
    </BlurView>
  );
};

export default HowItWorksCard;
