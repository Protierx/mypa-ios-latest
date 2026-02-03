/**
 * UnlockProgressCard - Shows locked feature with progress indicator
 * 
 * From design spec:
 * - Lock badge on locked elements
 * - Opacity 0.6, dashed border
 * - Progress bar showing % to unlock
 * - Tap to show unlock details modal
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { structuredColors as colors } from '../../styles/colors';
import { theme } from '../../styles/theme';

export interface UnlockRequirement {
  id: string;
  type: 'time' | 'milestone';
  description: string;
  current: number;
  target: number;
  met: boolean;
}

export interface UnlockableFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  requirements: UnlockRequirement[];
}

interface UnlockProgressCardProps {
  feature: UnlockableFeature;
  onPress?: () => void;
}

export function UnlockProgressCard({ feature, onPress }: UnlockProgressCardProps) {
  const [showModal, setShowModal] = useState(false);
  
  // Calculate overall progress
  const totalProgress = feature.requirements.reduce((sum, req) => {
    return sum + (req.current / req.target);
  }, 0) / feature.requirements.length;
  
  const progressPercent = Math.round(totalProgress * 100);
  
  const handlePress = () => {
    Haptics.selectionAsync();
    if (feature.unlocked) {
      onPress?.();
    } else {
      setShowModal(true);
    }
  };
  
  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          !feature.unlocked && styles.cardLocked,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Lock Badge */}
        {!feature.unlocked && (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={14} color={colors.brand.secondary} />
          </View>
        )}
        
        {/* Icon */}
        <View style={[
          styles.iconContainer,
          feature.unlocked && styles.iconContainerUnlocked,
        ]}>
          <Ionicons
            name={feature.icon as any}
            size={24}
            color={feature.unlocked ? colors.text.primary : colors.text.tertiary}
          />
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          <Text style={[
            styles.name,
            !feature.unlocked && styles.nameLocked,
          ]}>
            {feature.name}
          </Text>
          
          {feature.unlocked ? (
            <View style={styles.unlockedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.semantic.success} />
              <Text style={styles.unlockedText}>
                Unlocked {feature.unlockedAt ? `Day ${feature.unlockedAt}` : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>{progressPercent}%</Text>
            </View>
          )}
        </View>
        
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.text.tertiary}
        />
      </TouchableOpacity>
      
      {/* Unlock Details Modal */}
      <UnlockDetailsModal
        visible={showModal}
        feature={feature}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

interface UnlockDetailsModalProps {
  visible: boolean;
  feature: UnlockableFeature;
  onClose: () => void;
}

function UnlockDetailsModal({ visible, feature, onClose }: UnlockDetailsModalProps) {
  // Calculate overall progress
  const totalProgress = feature.requirements.reduce((sum, req) => {
    return sum + (req.current / req.target);
  }, 0) / feature.requirements.length;
  
  const progressPercent = Math.round(totalProgress * 100);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Handle */}
          <View style={styles.modalHandle} />
          
          {/* Icon */}
          <View style={styles.modalIconContainer}>
            <Ionicons name="lock-closed" size={48} color={colors.brand.primary} />
          </View>
          
          {/* Title */}
          <Text style={styles.modalTitle}>{feature.name}</Text>
          
          {/* Description */}
          <Text style={styles.modalDescription}>{feature.description}</Text>
          
          {/* Requirements List */}
          <View style={styles.requirementsList}>
            {feature.requirements.map(req => (
              <View key={req.id} style={styles.requirementItem}>
                <Ionicons
                  name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={req.met ? colors.semantic.success : colors.semantic.warning}
                />
                <View style={styles.requirementContent}>
                  <Text style={[
                    styles.requirementText,
                    req.met && styles.requirementTextMet,
                  ]}>
                    {req.description}
                  </Text>
                  {!req.met && (
                    <Text style={styles.requirementProgress}>
                      {req.current}/{req.target} ({Math.round((req.current / req.target) * 100)}%)
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
          
          {/* Overall Progress */}
          <View style={styles.overallProgress}>
            <View style={styles.overallProgressBar}>
              <Animated.View 
                style={[
                  styles.overallProgressFill, 
                  { width: `${progressPercent}%` }
                ]} 
              />
            </View>
            <Text style={styles.overallProgressText}>{progressPercent}% complete</Text>
          </View>
          
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface2,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  cardLocked: {
    opacity: 0.6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.text.tertiary,
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainerUnlocked: {
    backgroundColor: colors.brand.primary,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  nameLocked: {
    color: colors.text.tertiary,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unlockedText: {
    fontSize: 13,
    color: colors.semantic.success,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.background.surface3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand.secondary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    width: 32,
    textAlign: 'right',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.surface2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 5,
    backgroundColor: colors.background.surface4,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.brand.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  requirementsList: {
    marginBottom: 24,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  requirementContent: {
    flex: 1,
  },
  requirementText: {
    fontSize: 15,
    color: colors.text.primary,
  },
  requirementTextMet: {
    color: colors.semantic.success,
  },
  requirementProgress: {
    fontSize: 13,
    color: colors.semantic.warning,
    marginTop: 2,
  },
  overallProgress: {
    marginBottom: 24,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: colors.background.surface3,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: 4,
  },
  overallProgressText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.background.surface4,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});

export default UnlockProgressCard;
