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

interface UnlockRequirement {
  id: string;
  description: string;
  current: number;
  required: number;
  completed: boolean;
}

interface FeatureUnlock {
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
      <View className="flex-1 bg-black/80 items-center justify-center px-6">
        <Animated.View 
          className="bg-zinc-900 rounded-3xl w-full max-w-sm overflow-hidden"
          style={containerStyle}
        >
          {/* Header with Icon */}
          <View className="p-6 items-center border-b border-zinc-800">
            <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
              feature.isUnlocked ? 'bg-purple-900/50' : 'bg-zinc-800'
            }`}>
              {feature.isUnlocked ? (
                <Ionicons name="checkmark-circle" size={48} color="#a855f7" />
              ) : (
                <Ionicons name="lock-closed" size={40} color="#71717a" />
              )}
            </View>
            
            <Text className="text-white text-xl font-bold text-center">{feature.name}</Text>
            <Text className="text-zinc-500 text-center mt-2">{feature.description}</Text>
          </View>

          {/* Status */}
          <View className="px-6 py-4 border-b border-zinc-800">
            {feature.isUnlocked ? (
              <View className="flex-row items-center justify-center">
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text className="text-green-500 ml-2">
                  Unlocked {feature.unlockedAt ? `on ${new Date(feature.unlockedAt).toLocaleDateString()}` : ''}
                </Text>
              </View>
            ) : (
              <>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-zinc-400">Progress</Text>
                  <Text className="text-white">{Math.round(progressPercent)}%</Text>
                </View>
                <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </View>
              </>
            )}
          </View>

          {/* Requirements */}
          <ScrollView className="max-h-64">
            <View className="px-6 py-4">
              <Text className="text-zinc-500 text-sm mb-3">
                {feature.isUnlocked ? 'Requirements Completed' : 'Requirements'}
              </Text>
              
              {feature.requirements.map((req) => (
                <View key={req.id} className="flex-row items-center py-2">
                  <View className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${
                    req.completed ? 'bg-green-600' : 'bg-zinc-700'
                  }`}>
                    {req.completed ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                      <Text className="text-zinc-400 text-xs">{Math.min(req.current, req.required)}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`${req.completed ? 'text-zinc-500' : 'text-white'}`}>
                      {req.description}
                    </Text>
                    {!req.completed && (
                      <Text className="text-zinc-600 text-xs mt-0.5">
                        {req.current}/{req.required}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Close Button */}
          <View className="p-6">
            <TouchableOpacity
              className="bg-zinc-800 py-4 rounded-xl items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
            >
              <Text className="text-white font-semibold">Got it</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
