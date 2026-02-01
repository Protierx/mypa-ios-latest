import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../styles';
import { TimeColors, BriefingData } from '../types';
import { getGreeting } from '../utils';

interface BriefingHeaderProps {
  colors: TimeColors;
  briefing: BriefingData;
  pendingTasksCount: number;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const BriefingHeader: React.FC<BriefingHeaderProps> = ({
  colors,
  briefing,
  pendingTasksCount,
  fadeAnim,
  slideAnim,
}) => {
  const navigation = useNavigation();

  return (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={colors.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              {briefing.greeting || getGreeting()}
            </Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>
                {pendingTasksCount}
              </Text>
              <Text style={styles.quickStatLabel}>Tasks</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>
                {briefing.stats?.streak || 0}
              </Text>
              <Text style={styles.quickStatLabel}>🔥 Streak</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};
