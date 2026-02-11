/**
 * LockedFeature Component
 * 
 * A reusable wrapper that shows a grey overlay + lock icon on features
 * the user hasn't unlocked yet. Locked features are VISIBLE but DISABLED
 * (greyed out with a lock icon), never hidden.
 * 
 * Reference: PRD Section 4.3 (Progressive Unlocks)
 * Rule: "locked features are VISIBLE but DISABLED (greyed + lock icon), never hidden"
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useUserModel } from '@/contexts/UserModelContext';

// ============================================================================
// Level Definitions
// ============================================================================

const LEVEL_NAMES: Record<number, string> = {
  1: 'Starter',
  2: 'Familiar',
  3: 'Trusted',
  4: 'Personal',
  5: 'Mastery',
};

const LEVEL_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

/**
 * Calculate current level from days active
 */
export function getLevelFromDays(daysActive: number): number {
  if (daysActive >= 30) return 5;
  if (daysActive >= 14) return 4;
  if (daysActive >= 7) return 3;
  if (daysActive >= 3) return 2;
  return 1;
}

/**
 * Get days remaining until a level is reached
 */
function getDaysUntilLevel(daysActive: number, requiredLevel: number): number {
  const requiredDays = LEVEL_DAYS[requiredLevel] || 1;
  return Math.max(0, requiredDays - daysActive);
}

// ============================================================================
// Props
// ============================================================================

interface LockedFeatureProps {
  /** The level required to unlock this feature (1-5) */
  requiredLevel: number;

  /** The name of the feature (for event logging) */
  featureName: string;

  /** The children to render (shown normally when unlocked, greyed when locked) */
  children: React.ReactNode;

  /** Optional: callback when the locked overlay is tapped */
  onLockedPress?: () => void;

  /** Optional: override the lock message */
  lockMessage?: string;
}

// ============================================================================
// Component
// ============================================================================

export function LockedFeature({
  requiredLevel,
  featureName,
  children,
  onLockedPress,
  lockMessage,
}: LockedFeatureProps) {
  const { stats } = useUserModel();

  const daysActive = stats?.daysActive ?? 0;
  const currentLevel = getLevelFromDays(daysActive);
  const isLocked = currentLevel < requiredLevel;

  // If unlocked, render children normally
  if (!isLocked) {
    return <>{children}</>;
  }

  // Calculate days remaining
  const daysRemaining = getDaysUntilLevel(daysActive, requiredLevel);
  const levelName = LEVEL_NAMES[requiredLevel] || `Level ${requiredLevel}`;

  const message =
    lockMessage ||
    `Unlocks at Level ${requiredLevel} — ${levelName} (about ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''})`;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLockedPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessible
      accessibilityLabel={`${featureName} is locked. ${message}`}
      accessibilityRole="button"
    >
      <View style={{ position: 'relative' }}>
        {/* Render children at reduced opacity */}
        <View style={{ opacity: 0.4 }} pointerEvents="none">
          {children}
        </View>

        {/* Lock overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Ionicons name="lock-closed" size={14} color="#A1A1AA" />
            <Text
              style={{
                color: '#A1A1AA',
                fontSize: 12,
                marginLeft: 6,
                fontWeight: '500',
              }}
            >
              {message}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default LockedFeature;
