/**
 * Paywall Sheet
 * 
 * Shows free vs premium comparison with pricing options.
 * Never hard-blocks — always provides a dismiss path.
 * 
 * Reference: PRD Section 3 (Business Model, Pricing)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { eventLogger } from '@/services/eventLogger';
import { usePurchases } from '@/contexts/PurchaseContext';

type PlanType = 'monthly' | 'annual';

interface PaywallSheetProps {
  visible: boolean;
  onClose: () => void;
  trigger?: string; // What triggered the paywall (e.g. 'voice_limit', 'circle_limit', 'settings')
}

const FREE_FEATURES = [
  { text: '10 voice commands per day', included: true },
  { text: '1 circle', included: true },
  { text: 'Basic task management', included: true },
  { text: 'Focus timer', included: true },
  { text: 'Daily briefing', included: true },
  { text: 'Unlimited voice commands', included: false },
  { text: 'Unlimited circles', included: false },
  { text: 'AI task sorting', included: false },
  { text: 'Priority support', included: false },
];

const PREMIUM_FEATURES = [
  { text: 'Unlimited voice commands', included: true },
  { text: 'Unlimited circles', included: true },
  { text: 'AI task sorting', included: true },
  { text: 'Duration estimation', included: true },
  { text: 'Priority support', included: true },
  { text: 'All future features', included: true },
];

export function PaywallSheet({ visible, onClose, trigger }: PaywallSheetProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const { currentOffering, purchasePackage, restorePurchases, isProcessing } = usePurchases();

  React.useEffect(() => {
    if (visible) {
      eventLogger.log('paywall_shown', { trigger: trigger || 'unknown' });
    }
  }, [visible, trigger]);

  const handlePurchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    eventLogger.log('paywall_purchase_tapped', { plan: selectedPlan, trigger });

    // Get the right package from RevenueCat offering
    const pkg = selectedPlan === 'annual'
      ? currentOffering?.annual
      : currentOffering?.monthly;

    if (!pkg) {
      Alert.alert('Unavailable', 'This plan is not available right now. Please try again later.');
      return;
    }

    const { success, error } = await purchasePackage(pkg);
    if (success) {
      eventLogger.log('purchase_completed', { plan: selectedPlan });
      onClose();
    } else if (error && error !== 'cancelled') {
      Alert.alert('Purchase Failed', error);
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    eventLogger.log('paywall_restore_tapped', { trigger });

    const { success, isPremium, error } = await restorePurchases();
    if (success && isPremium) {
      Alert.alert('Restored!', 'Your premium subscription has been restored.');
      onClose();
    } else if (success && !isPremium) {
      Alert.alert('No Subscription Found', 'We couldn\'t find an active subscription for this account.');
    } else if (error) {
      Alert.alert('Restore Failed', error);
    }
  };

  const handleDismiss = () => {
    eventLogger.log('paywall_dismissed', { trigger });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/70" onPress={handleDismiss}>
        <View className="flex-1 justify-end">
          <Pressable
            className="bg-surface-1 rounded-t-3xl border-t border-surface-4 max-h-[90%]"
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView bounces={false}>
              {/* Handle bar */}
              <View className="items-center pt-3 pb-2">
                <View className="w-10 h-1 bg-surface-4 rounded-full" />
              </View>

              {/* Header */}
              <View className="items-center px-6 pt-4 pb-6">
                <View className="w-16 h-16 bg-brand-purple/20 rounded-full items-center justify-center mb-4">
                  <Ionicons name="diamond" size={32} color="#7C3AED" />
                </View>
                <Text className="text-title-1 font-bold text-ink-primary text-center">
                  Upgrade to Premium
                </Text>
                <Text className="text-body text-ink-secondary text-center mt-2">
                  Unlock the full power of MYPA
                </Text>
              </View>

              {/* Plan Selection */}
              <View className="px-6 mb-6">
                <TouchableOpacity
                  className={`flex-row items-center p-4 rounded-xl border mb-3 ${
                    selectedPlan === 'annual'
                      ? 'bg-brand-purple/10 border-brand-purple'
                      : 'bg-surface-2 border-surface-4'
                  }`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPlan('annual');
                  }}
                  activeOpacity={0.7}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-headline font-semibold text-ink-primary">Annual</Text>
                      <View className="bg-success/20 px-2 py-0.5 rounded-full ml-2">
                        <Text className="text-caption-2 font-semibold text-success">Save 33%</Text>
                      </View>
                    </View>
                    <Text className="text-subhead text-ink-tertiary mt-1">
                      £39.99/year (£3.33/month)
                    </Text>
                  </View>
                  <Ionicons
                    name={selectedPlan === 'annual' ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={selectedPlan === 'annual' ? '#7C3AED' : '#52525B'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-row items-center p-4 rounded-xl border ${
                    selectedPlan === 'monthly'
                      ? 'bg-brand-purple/10 border-brand-purple'
                      : 'bg-surface-2 border-surface-4'
                  }`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPlan('monthly');
                  }}
                  activeOpacity={0.7}
                >
                  <View className="flex-1">
                    <Text className="text-headline font-semibold text-ink-primary">Monthly</Text>
                    <Text className="text-subhead text-ink-tertiary mt-1">£4.99/month</Text>
                  </View>
                  <Ionicons
                    name={selectedPlan === 'monthly' ? 'radio-button-on' : 'radio-button-off'}
                    size={24}
                    color={selectedPlan === 'monthly' ? '#7C3AED' : '#52525B'}
                  />
                </TouchableOpacity>
              </View>

              {/* Features List */}
              <View className="px-6 mb-6">
                <Text className="text-caption-1 font-semibold text-ink-tertiary mb-3 uppercase tracking-wide">
                  What you get
                </Text>
                {PREMIUM_FEATURES.map((feature, index) => (
                  <View key={index} className="flex-row items-center py-2.5">
                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                    <Text className="text-body text-ink-primary ml-3">{feature.text}</Text>
                  </View>
                ))}
              </View>

              {/* Purchase Button */}
              <View className="px-6 pb-4">
                <TouchableOpacity
                  className="bg-brand-purple py-4 rounded-2xl items-center"
                  onPress={handlePurchase}
                  activeOpacity={0.8}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-headline font-bold text-white">
                      {selectedPlan === 'annual' ? 'Start Annual Plan — £39.99/yr' : 'Start Monthly Plan — £4.99/mo'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="py-3 items-center mt-2"
                  onPress={handleRestore}
                  disabled={isProcessing}
                >
                  <Text className="text-subhead text-ink-tertiary">Restore Purchases</Text>
                </TouchableOpacity>

                {/* Legal links */}
                <View className="flex-row justify-center mt-2 pb-4">
                  <TouchableOpacity>
                    <Text className="text-caption-2 text-ink-disabled">Terms of Service</Text>
                  </TouchableOpacity>
                  <Text className="text-caption-2 text-ink-disabled mx-2">·</Text>
                  <TouchableOpacity>
                    <Text className="text-caption-2 text-ink-disabled">Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
