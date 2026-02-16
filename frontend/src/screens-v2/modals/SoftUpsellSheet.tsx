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
import { eventLogger } from '../../services/eventLogger';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius } from '../../styles/theme';

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
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={handleDismiss}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            style={{
              backgroundColor: bg.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
              borderTopWidth: 0.5, borderTopColor: borderTokens.primary,
              paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
              ...shadows.lg,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, backgroundColor: borderTokens.primary, borderRadius: 2 }} />
            </View>

            {/* Icon + Message */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 56, height: 56, backgroundColor: `${semantic.warning}20`, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="mic-off-outline" size={28} color={semantic.warning} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: textTokens.primary, textAlign: 'center' }}>
                Daily Voice Limit Reached
              </Text>
              <Text style={{ fontSize: 15, color: textTokens.secondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 16, lineHeight: 21 }}>
                You've used all {limit} free voice commands today. Upgrade for unlimited voice, or switch to text.
              </Text>
            </View>

            {/* Usage Bar */}
            <View style={{ backgroundColor: bg.secondary, borderRadius: radius.lg, padding: 16, marginBottom: 24, borderWidth: 0.5, borderColor: borderTokens.primary }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: textTokens.tertiary }}>Today's usage</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: textTokens.primary }}>
                  {voiceCount}/{limit}
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: borderTokens.primary, borderRadius: 4, overflow: 'hidden' }}>
                <View
                  style={{ height: '100%', backgroundColor: semantic.warning, borderRadius: 4, width: '100%' }}
                />
              </View>
            </View>

            {/* CTAs */}
            <TouchableOpacity
              style={{
                backgroundColor: brand.primary, paddingVertical: 16, borderRadius: radius.lg,
                alignItems: 'center', marginBottom: 12,
                ...shadows.purple,
              }}
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="diamond" size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: 8 }}>
                  Upgrade to Premium
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                Unlimited voice commands + more
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: bg.secondary, paddingVertical: 16, borderRadius: radius.lg,
                alignItems: 'center', borderWidth: 0.5, borderColor: borderTokens.primary,
              }}
              onPress={handleTextFallback}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="chatbubble-outline" size={18} color={textTokens.tertiary} />
                <Text style={{ fontSize: 16, fontWeight: '500', color: textTokens.secondary, marginLeft: 8 }}>
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
