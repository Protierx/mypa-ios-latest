/**
 * Soft Upsell Sheet
 * 
 * Shown when a free user hits their daily voice command limit.
 * Never hard-blocks — always offers "Use text instead" fallback.
 * 
 * Reference: PRD Section 3 (Soft Upsell Flow)
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { eventLogger } from '@/services/eventLogger';

interface SoftUpsellSheetProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onTextFallback: () => void;
  voiceCount: number;
  limit: number;
}

export function SoftUpsellSheet({
  visible,
  onClose,
  onUpgrade,
  onTextFallback,
  voiceCount,
  limit,
}: SoftUpsellSheetProps) {
  React.useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      eventLogger.log('upsell_shown', { trigger: 'voice_limit', voiceCount, limit });
    }
  }, [visible, voiceCount, limit]);

  const handleUpgrade = () => {
    eventLogger.log('upsell_clicked', { cta: 'upgrade' });
    onUpgrade();
  };

  const handleTextFallback = () => {
    eventLogger.log('upsell_clicked', { cta: 'text_fallback' });
    onTextFallback();
  };

  const handleDismiss = () => {
    eventLogger.log('upsell_clicked', { cta: 'dismiss' });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/60" onPress={handleDismiss}>
        <View className="flex-1 justify-end">
          <Pressable
            className="bg-surface-1 rounded-t-3xl border-t border-surface-4 px-6 pt-4 pb-8"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <View className="items-center mb-4">
              <View className="w-10 h-1 bg-surface-4 rounded-full" />
            </View>

            {/* Icon + Message */}
            <View className="items-center mb-6">
              <View className="w-14 h-14 bg-warning/20 rounded-full items-center justify-center mb-4">
                <Ionicons name="mic-off-outline" size={28} color="#EAB308" />
              </View>
              <Text className="text-title-2 font-bold text-ink-primary text-center">
                Daily Voice Limit Reached
              </Text>
              <Text className="text-body text-ink-secondary text-center mt-2 px-4">
                You've used all {limit} free voice commands today. Upgrade for unlimited voice, or switch to text.
              </Text>
            </View>

            {/* Usage Bar */}
            <View className="bg-surface-2 rounded-xl p-4 mb-6 border border-surface-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-subhead text-ink-tertiary">Today's usage</Text>
                <Text className="text-subhead font-semibold text-ink-primary">
                  {voiceCount}/{limit}
                </Text>
              </View>
              <View className="h-2 bg-surface-4 rounded-full overflow-hidden">
                <View
                  className="h-full bg-warning rounded-full"
                  style={{ width: '100%' }}
                />
              </View>
            </View>

            {/* CTAs */}
            <TouchableOpacity
              className="bg-brand-purple py-4 rounded-2xl items-center mb-3"
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <Ionicons name="diamond" size={18} color="#FFFFFF" />
                <Text className="text-headline font-bold text-white ml-2">
                  Upgrade to Premium
                </Text>
              </View>
              <Text className="text-caption-1 text-white/60 mt-1">
                Unlimited voice commands + more
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-surface-2 py-4 rounded-2xl items-center border border-surface-4"
              onPress={handleTextFallback}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <Ionicons name="chatbubble-outline" size={18} color="#A1A1AA" />
                <Text className="text-headline font-medium text-ink-secondary ml-2">
                  Use Text Instead
                </Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
