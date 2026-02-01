import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Trophy, Zap } from 'lucide-react-native';
import { WalletData } from '../types';
import { styles } from '../styles';

interface XPCardProps {
  wallet: WalletData;
  onPress: () => void;
}

export const XPCard: React.FC<XPCardProps> = ({ wallet, onPress }) => {
  const xpProgress = Math.min(100, 100 - (wallet.xpToNextLevel / (wallet.xp + wallet.xpToNextLevel)) * 100);
  
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.xpCardContainer,
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
      ]}
    >
      <LinearGradient
        colors={['#7c3aed', '#6d28d9', '#5b21b6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.xpCard}
      >
        <View style={styles.xpCardContent}>
          <View style={styles.xpLevelBadge}>
            <Star color="#fbbf24" size={20} fill="#fbbf24" />
            <Text style={styles.xpLevelText}>Level {wallet.level}</Text>
          </View>
          <View style={styles.xpDetails}>
            <Text style={styles.xpValue}>{wallet.xp.toLocaleString()} XP</Text>
            <Text style={styles.xpToNext}>{wallet.xpToNextLevel} XP to next level</Text>
          </View>
        </View>
        <View style={styles.xpProgressContainer}>
          <View style={styles.xpProgressBar}>
            <View 
              style={[
                styles.xpProgressFill, 
                { width: `${xpProgress}%` }
              ]} 
            />
          </View>
        </View>
        <View style={styles.xpStatsRow}>
          <View style={styles.xpStatItem}>
            <Trophy color="#fbbf24" size={14} />
            <Text style={styles.xpStatText}>{wallet.challengesWon} Challenges Won</Text>
          </View>
          <View style={styles.xpStatItem}>
            <Zap color="#fbbf24" size={14} />
            <Text style={styles.xpStatText}>{wallet.streak > 0 ? 'Streak Bonus Active' : 'Start a Streak!'}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};
