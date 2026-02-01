import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { Achievement } from '../types';
import { styles } from '../styles';

interface AchievementsButtonProps {
  achievements: Achievement[];
  onPress: () => void;
}

export const AchievementsButton: React.FC<AchievementsButtonProps> = ({
  achievements,
  onPress,
}) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.achievementsButton,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${unlockedCount} achievements unlocked`}
    >
      <View style={styles.achievementAvatars}>
        {unlockedAchievements.map((a, index) => (
          <LinearGradient
            key={a.id}
            colors={['#fbbf24', '#f97316']}
            style={[
              styles.achievementAvatar,
              { marginLeft: index > 0 ? -8 : 0, zIndex: 3 - index },
            ]}
          >
            <Text style={styles.achievementEmoji}>{a.emoji}</Text>
          </LinearGradient>
        ))}
      </View>
      <View style={styles.achievementInfo}>
        <Text style={styles.achievementTitle}>{unlockedCount} Achievements</Text>
        <Text style={styles.achievementSubtitle}>
          {achievements.length - unlockedCount} more to unlock
        </Text>
      </View>
      <ChevronRight color="#94a3b8" size={20} />
    </Pressable>
  );
};
