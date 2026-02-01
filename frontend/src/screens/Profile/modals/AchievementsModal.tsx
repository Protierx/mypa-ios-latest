import React from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Star } from 'lucide-react-native';
import { Achievement } from '../types';
import { styles } from '../styles';

interface AchievementsModalProps {
  visible: boolean;
  onClose: () => void;
  achievements: Achievement[];
  slideAnim: Animated.Value;
  opacityAnim: Animated.Value;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  visible,
  onClose,
  achievements,
  slideAnim,
  opacityAnim,
}) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalBackdrop,
            { opacity: opacityAnim },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.achievementsModal,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.modalHandle} />

          {/* Modal Header */}
          <View style={styles.achievementsHeader}>
            <LinearGradient
              colors={['#fbbf24', '#f97316']}
              style={styles.achievementsHeaderIcon}
            >
              <Crown color="#fff" size={24} />
            </LinearGradient>
            <View>
              <Text style={styles.achievementsHeaderTitle}>Achievements</Text>
              <Text style={styles.achievementsHeaderSubtitle}>
                {unlockedCount}/{achievements.length} unlocked
              </Text>
            </View>
          </View>

          {/* Achievements List */}
          <ScrollView
            style={styles.achievementsList}
            contentContainerStyle={styles.achievementsListContent}
            showsVerticalScrollIndicator={false}
          >
            {achievements.map(achievement => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  achievement.unlocked
                    ? styles.achievementCardUnlocked
                    : styles.achievementCardLocked,
                ]}
              >
                {achievement.unlocked ? (
                  <LinearGradient
                    colors={['#fbbf24', '#f97316']}
                    style={styles.achievementCardIcon}
                  >
                    <Text style={styles.achievementCardEmoji}>{achievement.emoji}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.achievementCardIconLocked}>
                    <Text style={styles.achievementCardEmoji}>🔒</Text>
                  </View>
                )}
                <View style={styles.achievementCardContent}>
                  <Text
                    style={[
                      styles.achievementCardName,
                      !achievement.unlocked && styles.achievementCardNameLocked,
                    ]}
                  >
                    {achievement.name}
                  </Text>
                  <Text style={styles.achievementCardDescription}>
                    {achievement.description}
                  </Text>
                  {!achievement.unlocked && achievement.progress && (
                    <View style={styles.achievementProgress}>
                      <View style={styles.achievementProgressBar}>
                        <LinearGradient
                          colors={['#8b5cf6', '#9333ea']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[
                            styles.achievementProgressFill,
                            { width: `${achievement.progress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.achievementProgressText}>
                        {achievement.progress}% complete
                      </Text>
                    </View>
                  )}
                </View>
                {achievement.unlocked && (
                  <Star color="#fbbf24" size={20} fill="#fbbf24" />
                )}
              </View>
            ))}
          </ScrollView>

          {/* Close Button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [pressed && styles.buttonPressed]}
          >
            <LinearGradient
              colors={['#8b5cf6', '#9333ea']}
              style={styles.achievementsCloseButton}
            >
              <Text style={styles.achievementsCloseText}>Close</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};
