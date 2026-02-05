/**
 * AI Unlocks Section Component
 * 
 * Shows progress toward AI feature unlocks in the Profile screen.
 * Displays both locked and unlocked features with progress indicators.
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 6, Step 6.4
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 5 "Learning System"
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserModel, AI_FEATURES, type UnlockStatus } from '@/contexts/UserModelContext';

// ============================================================================
// Types
// ============================================================================

interface AIUnlocksSectionProps {
  onUnlockPress?: (feature: string) => void;
}

interface FeatureDisplay {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  shortTitle: string;
  color: string;
  requiredDay: number;
  requirements: string[];
}

// ============================================================================
// Feature Configuration
// ============================================================================

const FEATURES: FeatureDisplay[] = [
  {
    key: AI_FEATURES.TASK_INSIGHTS,
    icon: 'bulb-outline',
    title: 'Task Insights',
    shortTitle: 'Insights',
    color: '#7C3AED',
    requiredDay: 3,
    requirements: ['Complete 5 tasks'],
  },
  {
    key: AI_FEATURES.FOCUS_STATS,
    icon: 'timer-outline',
    title: 'Focus Statistics',
    shortTitle: 'Focus Stats',
    color: '#EC4899',
    requiredDay: 3,
    requirements: ['Complete 3 focus sessions'],
  },
  {
    key: AI_FEATURES.AI_TASK_SORTING,
    icon: 'swap-vertical-outline',
    title: 'AI Task Sorting',
    shortTitle: 'AI Sorting',
    color: '#10B981',
    requiredDay: 7,
    requirements: ['Use app for 7 days'],
  },
  {
    key: AI_FEATURES.DURATION_ESTIMATION,
    icon: 'hourglass-outline',
    title: 'Duration Estimation',
    shortTitle: 'Durations',
    color: '#F59E0B',
    requiredDay: 7,
    requirements: ['Complete 10 focus sessions'],
  },
  {
    key: AI_FEATURES.CHALLENGES,
    icon: 'trophy-outline',
    title: 'Challenges',
    shortTitle: 'Challenges',
    color: '#EF4444',
    requiredDay: 14,
    requirements: ['Join or create a circle'],
  },
  {
    key: AI_FEATURES.CIRCLE_INSIGHTS,
    icon: 'people-outline',
    title: 'Circle Insights',
    shortTitle: 'Circle Stats',
    color: '#6366F1',
    requiredDay: 14,
    requirements: ['Be in a circle for 7 days'],
  },
  {
    key: AI_FEATURES.CUSTOM_AI_VOICE,
    icon: 'mic-outline',
    title: 'Custom AI Voice',
    shortTitle: 'Custom Voice',
    color: '#8B5CF6',
    requiredDay: 30,
    requirements: ['Maintain 30-day streak'],
  },
  {
    key: AI_FEATURES.PREDICTIVE_TASKS,
    icon: 'sparkles-outline',
    title: 'Predictive Tasks',
    shortTitle: 'Predictive',
    color: '#14B8A6',
    requiredDay: 30,
    requirements: ['Complete 100 tasks'],
  },
];

// ============================================================================
// Sub-Components
// ============================================================================

interface UnlockCardProps {
  feature: FeatureDisplay;
  status: UnlockStatus | undefined;
  onPress?: () => void;
}

function UnlockCard({ feature, status, onPress }: UnlockCardProps) {
  const isUnlocked = status?.unlocked ?? false;
  const progress = status?.progress;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isUnlocked && styles.cardUnlocked,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isUnlocked ? feature.color + '20' : '#27272A' },
        ]}
      >
        {isUnlocked ? (
          <Ionicons
            name={feature.icon}
            size={24}
            color={feature.color}
          />
        ) : (
          <Ionicons
            name="lock-closed"
            size={20}
            color="#52525B"
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text
          style={[
            styles.cardTitle,
            !isUnlocked && styles.cardTitleLocked,
          ]}
          numberOfLines={1}
        >
          {feature.shortTitle}
        </Text>

        {isUnlocked ? (
          <View style={styles.unlockedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#10B981" />
            <Text style={styles.unlockedText}>Unlocked</Text>
          </View>
        ) : progress ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, (progress.current / progress.required) * 100)}%`,
                    backgroundColor: feature.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.current}/{progress.required}
            </Text>
          </View>
        ) : (
          <Text style={styles.dayLabel}>Day {feature.requiredDay}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AIUnlocksSection({ onUnlockPress }: AIUnlocksSectionProps) {
  const { unlocks, stats, isLoading } = useUserModel();

  // Separate unlocked and locked features
  const { unlockedFeatures, lockedFeatures } = useMemo(() => {
    const unlocked: FeatureDisplay[] = [];
    const locked: FeatureDisplay[] = [];

    FEATURES.forEach(feature => {
      const status = unlocks.find(u => u.feature === feature.key);
      if (status?.unlocked) {
        unlocked.push(feature);
      } else {
        locked.push(feature);
      }
    });

    return { unlockedFeatures: unlocked, lockedFeatures: locked };
  }, [unlocks]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const total = FEATURES.length;
    const completed = unlockedFeatures.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  }, [unlockedFeatures]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeleton} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={20} color="#7C3AED" />
          <Text style={styles.headerTitle}>AI Features</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.progressLabel}>
            {overallProgress.completed}/{overallProgress.total}
          </Text>
        </View>
      </View>

      {/* Overall Progress Bar */}
      <View style={styles.overallProgressContainer}>
        <View style={styles.overallProgressBar}>
          <LinearGradient
            colors={['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.overallProgressFill,
              { width: `${overallProgress.percentage}%` },
            ]}
          />
        </View>
      </View>

      {/* Unlocked Features */}
      {unlockedFeatures.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unlocked</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
          >
            {unlockedFeatures.map(feature => (
              <UnlockCard
                key={feature.key}
                feature={feature}
                status={unlocks.find(u => u.feature === feature.key)}
                onPress={() => onUnlockPress?.(feature.key)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Locked Features */}
      {lockedFeatures.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
          >
            {lockedFeatures.map(feature => (
              <UnlockCard
                key={feature.key}
                feature={feature}
                status={unlocks.find(u => u.feature === feature.key)}
                onPress={() => onUnlockPress?.(feature.key)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Stats hint */}
      {stats && (
        <View style={styles.statsHint}>
          <Ionicons name="information-circle-outline" size={14} color="#71717A" />
          <Text style={styles.statsHintText}>
            Day {stats.daysActive} • {stats.tasksCompleted} tasks • {stats.focusSessions} focus sessions
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  skeleton: {
    height: 200,
    backgroundColor: '#27272A',
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  overallProgressContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  overallProgressBar: {
    height: 6,
    backgroundColor: '#27272A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  cardsContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 16,
    width: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  cardUnlocked: {
    borderColor: '#3F3F46',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    alignItems: 'center',
    width: '100%',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardTitleLocked: {
    color: '#71717A',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unlockedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#27272A',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#71717A',
  },
  dayLabel: {
    fontSize: 12,
    color: '#52525B',
  },
  statsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  statsHintText: {
    fontSize: 12,
    color: '#71717A',
  },
});

export default AIUnlocksSection;
