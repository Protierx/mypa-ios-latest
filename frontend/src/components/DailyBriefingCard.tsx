/**
 * DailyBriefingCard - Compact briefing card for AI Home
 * 
 * Shows a summary of the day and can expand to full briefing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

import { structuredColors as colors } from '../styles/colors';
import { theme } from '../styles/theme';
import { api, aiApi } from '../services/api';

interface DailyBriefingSummary {
  greeting: string;
  taskCount: number;
  topPriority?: string;
  focusGoal: number;
  focusProgress: number;
  streakDays: number;
  aiTip?: string;
}

interface DailyBriefingCardProps {
  onShowFull?: () => void;
}

export function DailyBriefingCard({ onShowFull }: DailyBriefingCardProps) {
  const [summary, setSummary] = useState<DailyBriefingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpanded, setShowExpanded] = useState(false);
  
  // Fetch briefing summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const [tasksRes, profileRes, briefingRes] = await Promise.all([
          api.get('/tasks?completed=false&limit=5'),
          api.get('/users/profile'),
          aiApi.getBriefing().catch(() => ({ data: null })),
        ]);
        
        const tasks = tasksRes.data?.data?.tasks || [];
        const user = profileRes.data?.user || {};
        const briefing = briefingRes.data?.briefing;
        
        // Get time-based greeting
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        else if (hour >= 17) greeting = 'Good evening';
        
        // Find top priority task
        const highPriorityTask = tasks.find((t: any) => t.priority === 'high');
        
        setSummary({
          greeting,
          taskCount: tasks.length,
          topPriority: highPriorityTask?.title,
          focusGoal: 180, // 3 hours default
          focusProgress: user.focusMinutesToday || 0,
          streakDays: user.streakDays || 0,
          aiTip: briefing?.insights?.[0]?.content || getRandomTip(),
        });
      } catch (error) {
        console.error('Failed to fetch briefing summary:', error);
        setSummary({
          greeting: 'Good day',
          taskCount: 0,
          focusGoal: 180,
          focusProgress: 0,
          streakDays: 0,
          aiTip: getRandomTip(),
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, []);
  
  const handlePress = () => {
    Haptics.selectionAsync();
    if (onShowFull) {
      onShowFull();
    } else {
      setShowExpanded(true);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.brand.primary} />
      </View>
    );
  }
  
  if (!summary) return null;
  
  const focusPercent = Math.min(100, Math.round((summary.focusProgress / summary.focusGoal) * 100));
  
  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="sunny" size={20} color={colors.semantic.warning} />
            <Text style={styles.greeting}>{summary.greeting}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </View>
        
        {/* Summary Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.taskCount}</Text>
            <Text style={styles.summaryLabel}>tasks</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{focusPercent}%</Text>
            <Text style={styles.summaryLabel}>focus goal</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>🔥{summary.streakDays}</Text>
            <Text style={styles.summaryLabel}>streak</Text>
          </View>
        </View>
        
        {/* Top Priority */}
        {summary.topPriority && (
          <View style={styles.priorityRow}>
            <Ionicons name="flag" size={14} color={colors.semantic.error} />
            <Text style={styles.priorityText} numberOfLines={1}>
              Priority: {summary.topPriority}
            </Text>
          </View>
        )}
        
        {/* AI Tip */}
        {summary.aiTip && (
          <View style={styles.tipRow}>
            <Text style={styles.tipText}>💡 {summary.aiTip}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Expanded Modal */}
      <Modal
        visible={showExpanded}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExpanded(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Today's Briefing</Text>
              <TouchableOpacity
                onPress={() => setShowExpanded(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              {/* Detailed briefing content would go here */}
              <View style={styles.briefingSection}>
                <Text style={styles.sectionTitle}>📋 Tasks Overview</Text>
                <Text style={styles.sectionContent}>
                  You have {summary.taskCount} tasks remaining today.
                  {summary.topPriority && ` Your top priority is "${summary.topPriority}".`}
                </Text>
              </View>
              
              <View style={styles.briefingSection}>
                <Text style={styles.sectionTitle}>⏱️ Focus Progress</Text>
                <View style={styles.focusProgress}>
                  <View style={styles.focusBar}>
                    <View style={[styles.focusFill, { width: `${focusPercent}%` }]} />
                  </View>
                  <Text style={styles.focusText}>
                    {summary.focusProgress} / {summary.focusGoal} minutes ({focusPercent}%)
                  </Text>
                </View>
              </View>
              
              <View style={styles.briefingSection}>
                <Text style={styles.sectionTitle}>🔥 Streak</Text>
                <Text style={styles.sectionContent}>
                  {summary.streakDays > 0
                    ? `You're on a ${summary.streakDays} day streak! Keep it going.`
                    : 'Complete a task today to start your streak!'
                  }
                </Text>
              </View>
              
              <View style={styles.briefingSection}>
                <Text style={styles.sectionTitle}>💡 Mylo's Tip</Text>
                <Text style={styles.sectionContent}>
                  {summary.aiTip}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Helper function for fallback tips
function getRandomTip(): string {
  const tips = [
    'Start with your most challenging task while your energy is highest.',
    'Taking short breaks can actually improve your focus and productivity.',
    'Break large tasks into smaller, manageable steps.',
    'Consider batching similar tasks together for efficiency.',
    'A quick 5-minute walk can boost your creativity and energy.',
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.surface2,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.background.surface4,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    marginBottom: 8,
  },
  priorityText: {
    fontSize: 13,
    color: colors.semantic.error,
    flex: 1,
  },
  tipRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.background.surface4,
  },
  tipText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
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
    maxHeight: '80%',
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 5,
    backgroundColor: colors.background.surface4,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  briefingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  focusProgress: {
    gap: 8,
  },
  focusBar: {
    height: 8,
    backgroundColor: colors.background.surface3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  focusFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: 4,
  },
  focusText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

export default DailyBriefingCard;
