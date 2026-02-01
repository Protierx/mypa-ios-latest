import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../styles';

interface User {
  name?: string;
  email?: string;
  level?: number;
}

interface UserCardProps {
  user: User | null;
  userStats: {
    level: number;
    xp: number;
    xpToNext: number;
  };
  xpProgress: number;
  onEditPress: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  userStats,
  xpProgress,
  onEditPress,
}) => {
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.userCard}>
      <View style={styles.userCardTop}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#8b5cf6', '#9333ea']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </LinearGradient>
          {/* Level Badge */}
          <LinearGradient
            colors={['#8b5cf6', '#9333ea']}
            style={styles.levelBadge}
          >
            <Text style={styles.levelBadgeText}>{userStats.level}</Text>
          </LinearGradient>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Edit Button */}
        <Pressable
          onPress={onEditPress}
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </Pressable>
      </View>

      {/* XP Progress */}
      <View style={styles.xpContainer}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpLevel}>Level {userStats.level}</Text>
          <Text style={styles.xpToNext}>{userStats.xpToNext} XP to next</Text>
        </View>
        <View style={styles.xpBarBg}>
          <LinearGradient
            colors={['#8b5cf6', '#9333ea']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.xpBarFill, { width: `${xpProgress}%` }]}
          />
        </View>
      </View>
    </View>
  );
};
