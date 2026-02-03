/**
 * UnlockTimeline - Shows progression of feature unlocks over time
 * 
 * From design spec:
 * - Timeline view showing unlock sequence
 * - Day indicators
 * - Current day highlight
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { structuredColors as colors } from '../../styles/colors';
import { theme } from '../../styles/theme';
import type { UnlockableFeature } from './UnlockProgressCard';

interface UnlockTimelineProps {
  features: UnlockableFeature[];
  currentDay: number;
}

export function UnlockTimeline({ features, currentDay }: UnlockTimelineProps) {
  // Sort by unlock day (for unlocked items) and by progress (for locked items)
  const sortedFeatures = [...features].sort((a, b) => {
    if (a.unlocked && b.unlocked) {
      return parseInt(a.unlockedAt || '0') - parseInt(b.unlockedAt || '0');
    }
    if (a.unlocked) return -1;
    if (b.unlocked) return 1;
    
    // Sort locked items by progress
    const progressA = a.requirements.reduce((sum, r) => sum + r.current / r.target, 0) / a.requirements.length;
    const progressB = b.requirements.reduce((sum, r) => sum + r.current / r.target, 0) / b.requirements.length;
    return progressB - progressA;
  });
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Unlock Timeline</Text>
        <View style={styles.dayBadge}>
          <Ionicons name="calendar" size={14} color={colors.brand.secondary} />
          <Text style={styles.dayText}>Day {currentDay}</Text>
        </View>
      </View>
      
      {/* Timeline */}
      <ScrollView 
        style={styles.timeline}
        showsVerticalScrollIndicator={false}
      >
        {sortedFeatures.map((feature, index) => (
          <TimelineItem
            key={feature.id}
            feature={feature}
            isFirst={index === 0}
            isLast={index === sortedFeatures.length - 1}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface TimelineItemProps {
  feature: UnlockableFeature;
  isFirst: boolean;
  isLast: boolean;
}

function TimelineItem({ feature, isFirst, isLast }: TimelineItemProps) {
  const progress = feature.requirements.reduce((sum, r) => sum + r.current / r.target, 0) / feature.requirements.length;
  const progressPercent = Math.round(progress * 100);
  
  return (
    <View style={styles.timelineItem}>
      {/* Line connector */}
      <View style={styles.lineContainer}>
        {!isFirst && (
          <View style={[
            styles.lineTop,
            feature.unlocked && styles.lineUnlocked,
          ]} />
        )}
        
        {/* Node */}
        <View style={[
          styles.node,
          feature.unlocked && styles.nodeUnlocked,
        ]}>
          <Ionicons
            name={feature.unlocked ? 'checkmark' : 'lock-closed'}
            size={12}
            color={feature.unlocked ? colors.text.primary : colors.text.tertiary}
          />
        </View>
        
        {!isLast && (
          <View style={[
            styles.lineBottom,
            feature.unlocked && styles.lineUnlocked,
          ]} />
        )}
      </View>
      
      {/* Content */}
      <View style={[
        styles.itemContent,
        !feature.unlocked && styles.itemContentLocked,
      ]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemIconContainer}>
            <Ionicons
              name={feature.icon as any}
              size={20}
              color={feature.unlocked ? colors.text.primary : colors.text.tertiary}
            />
          </View>
          <View style={styles.itemInfo}>
            <Text style={[
              styles.itemName,
              !feature.unlocked && styles.itemNameLocked,
            ]}>
              {feature.name}
            </Text>
            {feature.unlocked ? (
              <Text style={styles.unlockedDay}>Day {feature.unlockedAt}</Text>
            ) : (
              <Text style={styles.itemProgress}>{progressPercent}% complete</Text>
            )}
          </View>
        </View>
        
        {/* Progress bar for locked items */}
        {!feature.unlocked && (
          <View style={styles.itemProgressBar}>
            <View style={[styles.itemProgressFill, { width: `${progressPercent}%` }]} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.sm,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand.secondary,
  },
  timeline: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 80,
  },
  lineContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  lineTop: {
    width: 2,
    height: 10,
    backgroundColor: colors.background.surface4,
  },
  lineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: colors.background.surface4,
  },
  lineUnlocked: {
    backgroundColor: colors.brand.primary,
  },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.surface3,
    borderWidth: 2,
    borderColor: colors.background.surface4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeUnlocked: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  itemContent: {
    flex: 1,
    backgroundColor: colors.background.surface2,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 12,
  },
  itemContentLocked: {
    opacity: 0.7,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.text.tertiary,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  itemNameLocked: {
    color: colors.text.secondary,
  },
  unlockedDay: {
    fontSize: 13,
    color: colors.semantic.success,
  },
  itemProgress: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  itemProgressBar: {
    height: 3,
    backgroundColor: colors.background.surface3,
    borderRadius: 1.5,
    marginTop: 10,
    overflow: 'hidden',
  },
  itemProgressFill: {
    height: '100%',
    backgroundColor: colors.brand.secondary,
    borderRadius: 1.5,
  },
});

export default UnlockTimeline;
