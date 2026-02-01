import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Clock } from 'lucide-react-native';
import { RecentSaving } from '../types';
import { styles } from '../styles';

interface RecentSavingsSectionProps {
  savings: RecentSaving[];
  slideAnims: Animated.Value[];
  onItemPress: (item: RecentSaving) => void;
}

export const RecentSavingsSection: React.FC<RecentSavingsSectionProps> = ({
  savings,
  slideAnims,
  onItemPress,
}) => {
  return (
    <View style={styles.recentSection}>
      <Text style={styles.sectionTitle}>Recent Savings</Text>
      {savings.map((item, index) => (
        <Pressable key={item.id} onPress={() => onItemPress(item)}>
          <Animated.View
            style={[
              styles.recentCard,
              {
                opacity: slideAnims[index] || 1,
                transform: [
                  {
                    translateY: slideAnims[index]
                      ? slideAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0],
                        })
                      : 0,
                  },
                ],
              },
            ]}
          >
            <BlurView intensity={40} tint="light" style={styles.recentCardBlur}>
              <View style={styles.recentIconContainer}>
                <Text style={styles.recentEmoji}>{item.icon}</Text>
              </View>
              <View style={styles.recentContent}>
                <Text style={styles.recentAction} numberOfLines={1} ellipsizeMode="tail">
                  {item.action}
                </Text>
                <Text style={styles.recentWhen} numberOfLines={1}>{item.when}</Text>
              </View>
              <View style={styles.recentTimeBadge}>
                <Clock color="#059669" size={14} />
                <Text style={styles.recentTimeText}>{item.time}</Text>
              </View>
            </BlurView>
          </Animated.View>
        </Pressable>
      ))}
    </View>
  );
};
