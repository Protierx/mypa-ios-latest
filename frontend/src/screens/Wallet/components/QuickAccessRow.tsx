import React from 'react';
import { View, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Share2, Calendar, Star } from 'lucide-react-native';
import { styles } from '../styles';

interface QuickAccessRowProps {
  onShare: () => void;
  onCalendar: () => void;
  onFavorites: () => void;
}

export const QuickAccessRow: React.FC<QuickAccessRowProps> = ({
  onShare,
  onCalendar,
  onFavorites,
}) => {
  const actions = [
    { icon: Share2, onPress: onShare, label: 'Share progress' },
    { icon: Calendar, onPress: onCalendar, label: 'View calendar' },
    { icon: Star, onPress: onFavorites, label: 'View favorites' },
  ];

  return (
    <View style={styles.quickAccessRow}>
      {actions.map((action, index) => (
        <BlurView key={index} intensity={40} tint="light" style={styles.quickAccessButton}>
          <Pressable
            onPress={action.onPress}
            style={({ pressed }) => [
              { alignItems: 'center', justifyContent: 'center', padding: 8 },
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <action.icon color="#3B82F6" size={22} />
          </Pressable>
        </BlurView>
      ))}
    </View>
  );
};

export default QuickAccessRow;
