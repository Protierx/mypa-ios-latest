import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Plus } from 'lucide-react-native';
import { styles } from '../styles';

interface CirclesHeaderProps {
  circleCount: number;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onJoinPress: () => void;
  onCreatePress: () => void;
}

export function CirclesHeader({
  circleCount,
  fadeAnim,
  slideAnim,
  onJoinPress,
  onCreatePress,
}: CirclesHeaderProps) {
  return (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View>
        <Text style={styles.headerTitle}>Circles</Text>
        <Text style={styles.headerSubtitle}>
          {circleCount} {circleCount === 1 ? 'circle' : 'circles'} • Stay connected
        </Text>
      </View>
      <View style={styles.headerButtons}>
        <Pressable onPress={onJoinPress} style={styles.joinButton}>
          <BlurView intensity={80} tint="light" style={styles.joinButtonBlur}>
            <Text style={styles.joinButtonText}>Join</Text>
          </BlurView>
        </Pressable>
        <Pressable onPress={onCreatePress} style={styles.createButton}>
          <Plus color="#fff" size={24} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
