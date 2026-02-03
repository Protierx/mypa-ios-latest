/**
 * RecurringTasksScreen - Manage recurring task templates
 * 
 * Features:
 * - List all recurring tasks with next occurrence
 * - Create new recurring tasks
 * - Pause/Resume templates
 * - Edit recurrence patterns
 * - Visual frequency indicators
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { recurringApi, eventsApi } from '../../services/api';

interface RecurringTemplate {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  durationMin: number;
  frequency: string;
  interval: number;
  daysOfWeek?: string;
  dayOfMonth?: number;
  nextDueDate: string;
  isActive: boolean;
  occurrencesGenerated: number;
  createdAt: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#3B82F6',
  Personal: '#8B5CF6',
  Health: '#10B981',
  Finance: '#F59E0B',
  Learning: '#EC4899',
  default: '#6B7280',
};

export default function RecurringTasksScreen({ navigation }: any) {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const response = await recurringApi.getAll(true);
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Failed to load recurring tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    eventsApi.log('recurring_screen_viewed');
  }, [loadTemplates]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTemplates();
  };

  const handleToggleActive = async (template: RecurringTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      if (template.isActive) {
        await recurringApi.pause(template.id);
      } else {
        await recurringApi.resume(template.id);
      }
      
      // Update local state
      setTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, isActive: !t.isActive } : t
      ));

      eventsApi.log('recurring_task_toggled', {
        templateId: template.id,
        isActive: !template.isActive,
      });
    } catch (error) {
      console.error('Failed to toggle recurring task:', error);
      Alert.alert('Error', 'Failed to update recurring task');
    }
  };

  const handleDelete = (template: RecurringTemplate) => {
    Alert.alert(
      'Delete Recurring Task',
      `Are you sure you want to delete "${template.title}"? This will not delete existing task instances.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await recurringApi.delete(template.id);
              setTemplates(prev => prev.filter(t => t.id !== template.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              eventsApi.log('recurring_task_deleted', {
                templateId: template.id,
              });
            } catch (error) {
              console.error('Failed to delete recurring task:', error);
              Alert.alert('Error', 'Failed to delete recurring task');
            }
          },
        },
      ]
    );
  };

  const getFrequencyText = (template: RecurringTemplate): string => {
    const freq = FREQUENCY_LABELS[template.frequency] || template.frequency;
    
    if (template.interval > 1) {
      return `Every ${template.interval} ${freq.toLowerCase().replace('ly', 's')}`;
    }
    
    if (template.frequency === 'WEEKLY' && template.daysOfWeek) {
      const days = JSON.parse(template.daysOfWeek);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayLabels = days.map((d: number) => dayNames[d]).join(', ');
      return `Weekly on ${dayLabels}`;
    }
    
    if (template.frequency === 'MONTHLY' && template.dayOfMonth) {
      return `Monthly on the ${template.dayOfMonth}${getOrdinalSuffix(template.dayOfMonth)}`;
    }
    
    return freq;
  };

  const getOrdinalSuffix = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const getNextDueText = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCategoryColor = (category: string): string => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="repeat" size={64} color="rgba(255,255,255,0.3)" />
      <Text style={styles.emptyTitle}>No Recurring Tasks</Text>
      <Text style={styles.emptySubtitle}>
        Set up tasks that repeat automatically
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateRecurringTask')}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create Recurring Task</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTemplate = (template: RecurringTemplate) => {
    const categoryColor = getCategoryColor(template.category);
    
    return (
      <TouchableOpacity
        key={template.id}
        style={[
          styles.templateCard,
          !template.isActive && styles.templateCardInactive,
        ]}
        onPress={() => navigation.navigate('EditRecurringTask', { templateId: template.id })}
        activeOpacity={0.7}
      >
        <BlurView intensity={30} tint="dark" style={styles.cardBlur}>
          <View style={styles.cardContent}>
            {/* Left side - Info */}
            <View style={styles.cardInfo}>
              {/* Category indicator */}
              <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
              
              {/* Title and frequency */}
              <View style={styles.titleContainer}>
                <Text style={[
                  styles.templateTitle,
                  !template.isActive && styles.templateTitleInactive,
                ]}>
                  {template.title}
                </Text>
                <View style={styles.frequencyBadge}>
                  <Ionicons 
                    name="repeat" 
                    size={12} 
                    color={template.isActive ? '#8B5CF6' : 'rgba(255,255,255,0.4)'} 
                  />
                  <Text style={[
                    styles.frequencyText,
                    !template.isActive && styles.frequencyTextInactive,
                  ]}>
                    {getFrequencyText(template)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Right side - Status */}
            <View style={styles.cardStatus}>
              {template.isActive ? (
                <>
                  <Text style={styles.nextDueLabel}>Next:</Text>
                  <Text style={styles.nextDueText}>
                    {getNextDueText(template.nextDueDate)}
                  </Text>
                </>
              ) : (
                <View style={styles.pausedBadge}>
                  <Text style={styles.pausedText}>Paused</Text>
                </View>
              )}
            </View>
          </View>

          {/* Actions row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleToggleActive(template)}
            >
              <Ionicons 
                name={template.isActive ? 'pause-circle' : 'play-circle'} 
                size={24} 
                color={template.isActive ? '#F59E0B' : '#10B981'} 
              />
            </TouchableOpacity>
            
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {template.occurrencesGenerated} generated
              </Text>
              {template.durationMin && (
                <>
                  <Text style={styles.statsDot}>•</Text>
                  <Text style={styles.statsText}>
                    {template.durationMin}min
                  </Text>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(template)}
            >
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const activeTemplates = templates.filter(t => t.isActive);
  const pausedTemplates = templates.filter(t => !t.isActive);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recurring Tasks</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateRecurringTask')}
          >
            <Ionicons name="add" size={28} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8B5CF6"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {templates.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {/* Active Templates */}
              {activeTemplates.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Active ({activeTemplates.length})
                  </Text>
                  {activeTemplates.map(renderTemplate)}
                </View>
              )}

              {/* Paused Templates */}
              {pausedTemplates.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Paused ({pausedTemplates.length})
                  </Text>
                  {pausedTemplates.map(renderTemplate)}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0c29',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  templateCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  templateCardInactive: {
    opacity: 0.6,
  },
  cardBlur: {
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 6,
  },
  titleContainer: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  templateTitleInactive: {
    color: 'rgba(255,255,255,0.5)',
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: 13,
    color: '#8B5CF6',
    marginLeft: 4,
  },
  frequencyTextInactive: {
    color: 'rgba(255,255,255,0.4)',
  },
  cardStatus: {
    alignItems: 'flex-end',
  },
  nextDueLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 2,
  },
  nextDueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  pausedBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pausedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    padding: 4,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  statsDot: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});
