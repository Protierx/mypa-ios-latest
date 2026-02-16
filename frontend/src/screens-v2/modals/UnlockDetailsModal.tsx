/**
 * Unlock Details Modal
 * 
 * Shows feature unlock progress and requirements.
 * Opens when tapping a locked/unlocked feature in Profile.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius } from '../../styles/theme';

interface UnlockRequirement {
  id: string;
  description: string;
  current: number;
  required: number;
  completed: boolean;
}

export interface FeatureUnlock {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  requirements: UnlockRequirement[];
}

interface UnlockDetailsModalProps {
  visible: boolean;
  feature: FeatureUnlock | null;
  onClose: () => void;
}

// Feature definitions
export const FEATURE_UNLOCKS: Record<string, Omit<FeatureUnlock, 'isUnlocked' | 'unlockedAt' | 'requirements'>> = {
  personalized_greeting: {
    id: 'personalized_greeting',
    name: 'Personalized Greetings',
    description: 'MYPA greets you by name and remembers your preferences.',
    icon: 'hand-right-outline',
  },
  peak_hours: {
    id: 'peak_hours',
    name: 'Peak Hours',
    description: 'See when you\'re most productive based on your task completion patterns.',
    icon: 'trending-up-outline',
  },
  ai_task_sorting: {
    id: 'ai_task_sorting',
    name: 'AI Task Sorting',
    description: 'MYPA automatically prioritizes your tasks based on your habits.',
    icon: 'list-outline',
  },
  duration_estimation: {
    id: 'duration_estimation',
    name: 'Duration Estimation',
    description: 'Get AI-powered estimates for how long tasks will take you.',
    icon: 'time-outline',
  },
  completion_patterns: {
    id: 'completion_patterns',
    name: 'Completion Patterns',
    description: 'Insights into your task completion trends and habits.',
    icon: 'analytics-outline',
  },
  predictive_mode: {
    id: 'predictive_mode',
    name: 'Predictive Mode',
    description: 'MYPA suggests tasks before you even think of them.',
    icon: 'bulb-outline',
  },
  overwhelm_detection: {
    id: 'overwhelm_detection',
    name: 'Overwhelm Detection',
    description: 'MYPA alerts you when you have too much on your plate.',
    icon: 'alert-circle-outline',
  },
  task_insights: {
    id: 'task_insights',
    name: 'Task Insights',
    description: 'See AI-powered insights about your task completion patterns and productivity trends.',
    icon: 'bulb-outline',
  },
  focus_stats: {
    id: 'focus_stats',
    name: 'Focus Statistics',
    description: 'Track your focus sessions and see how your concentration improves over time.',
    icon: 'timer-outline',
  },
  challenges: {
    id: 'challenges',
    name: 'Challenges',
    description: 'Compete with friends and circles in productivity challenges!',
    icon: 'trophy-outline',
  },
  custom_ai_voice: {
    id: 'custom_ai_voice',
    name: 'Custom AI Voice',
    description: 'Choose from different AI voices to personalize your MYPA experience.',
    icon: 'mic-outline',
  },
  circle_insights: {
    id: 'circle_insights',
    name: 'Circle Insights',
    description: 'See detailed analytics about how your circles are performing together.',
    icon: 'people-outline',
  },
  predictive_tasks: {
    id: 'predictive_tasks',
    name: 'Predictive Tasks',
    description: 'MYPA suggests tasks before you even think of them based on your patterns.',
    icon: 'sparkles-outline',
  },
};

export function UnlockDetailsModal({ visible, feature, onClose }: UnlockDetailsModalProps) {
  const scale = useSharedValue(0.9);
  
  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    } else {
      scale.value = 0.9;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible || !feature) return null;

  const totalProgress = feature.requirements.reduce((sum, r) => sum + Math.min(r.current, r.required), 0);
  const totalRequired = feature.requirements.reduce((sum, r) => sum + r.required, 0);
  const progressPercent = totalRequired > 0 ? (totalProgress / totalRequired) * 100 : 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Animated.View 
          style={[{ backgroundColor: bg.card, borderRadius: 24, width: '100%', maxWidth: 360, overflow: 'hidden', ...shadows.lg }, containerStyle]}
        >
          {/* Header with Icon */}
          <View style={{ padding: 24, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              backgroundColor: feature.isUnlocked ? brand.muted : bg.secondary,
            }}>
              {feature.isUnlocked ? (
                <Ionicons name="checkmark-circle" size={48} color={brand.primary} />
              ) : (
                <Ionicons name="lock-closed" size={40} color={textTokens.disabled} />
              )}
            </View>
            
            <Text style={{ color: textTokens.primary, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>{feature.name}</Text>
            <Text style={{ color: textTokens.tertiary, textAlign: 'center', marginTop: 8, fontSize: 14, lineHeight: 20 }}>{feature.description}</Text>
          </View>

          {/* Status */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
            {feature.isUnlocked ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-circle" size={20} color={semantic.success} />
                <Text style={{ color: semantic.success, marginLeft: 8, fontSize: 14 }}>
                  Unlocked {feature.unlockedAt ? `on ${new Date(feature.unlockedAt).toLocaleDateString()}` : ''}
                </Text>
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: textTokens.secondary, fontSize: 13 }}>Progress</Text>
                  <Text style={{ color: textTokens.primary, fontSize: 13, fontWeight: '600' }}>{Math.round(progressPercent)}%</Text>
                </View>
                <View style={{ height: 8, backgroundColor: bg.secondary, borderRadius: 4, overflow: 'hidden' }}>
                  <View 
                    style={{ height: '100%', backgroundColor: brand.primary, borderRadius: 4, width: `${progressPercent}%` }}
                  />
                </View>
              </>
            )}
          </View>

          {/* Requirements */}
          <ScrollView style={{ maxHeight: 256 }}>
            <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
              <Text style={{ color: textTokens.tertiary, fontSize: 13, marginBottom: 12 }}>
                {feature.isUnlocked ? 'Requirements Completed' : 'Requirements'}
              </Text>
              
              {feature.requirements.map((req) => (
                <View key={req.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                  <View style={{
                    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    backgroundColor: req.completed ? semantic.success : bg.secondary,
                  }}>
                    {req.completed ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                      <Text style={{ color: textTokens.tertiary, fontSize: 11 }}>{Math.min(req.current, req.required)}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: req.completed ? textTokens.tertiary : textTokens.primary, fontSize: 14 }}>
                      {req.description}
                    </Text>
                    {!req.completed && (
                      <Text style={{ color: textTokens.disabled, fontSize: 11, marginTop: 2 }}>
                        {req.current}/{req.required}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Close Button */}
          <View style={{ padding: 24 }}>
            <TouchableOpacity
              style={{ backgroundColor: bg.secondary, paddingVertical: 16, borderRadius: radius.lg, alignItems: 'center' }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
            >
              <Text style={{ color: textTokens.primary, fontWeight: '600', fontSize: 15 }}>Got it</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
