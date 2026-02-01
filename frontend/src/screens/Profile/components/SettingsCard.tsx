import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { SettingsItem } from '../types';
import { styles } from '../styles';

interface SettingsCardProps {
  items: SettingsItem[];
  onItemPress: (id: string) => void;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  items,
  onItemPress,
}) => {
  return (
    <View style={styles.settingsCard}>
      {items.map((item, index) => {
        const ItemIcon = item.icon;
        return (
          <Pressable
            key={item.id}
            onPress={() => onItemPress(item.id)}
            style={({ pressed }) => [
              styles.settingsItem,
              index < items.length - 1 && styles.settingsItemBorder,
              pressed && styles.settingsItemPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <View style={styles.settingsItemLeft}>
              <LinearGradient
                colors={item.colors}
                style={styles.settingsIcon}
              >
                <ItemIcon color="#fff" size={18} />
              </LinearGradient>
              <Text style={styles.settingsLabel}>{item.label}</Text>
            </View>
            <ChevronRight color="#94a3b8" size={20} />
          </Pressable>
        );
      })}
    </View>
  );
};
