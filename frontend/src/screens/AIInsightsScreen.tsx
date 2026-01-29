/**
 * AIInsightsScreen - iOS-styled AI-powered task insights and suggestions
 * Smart recommendations and productivity analysis
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { aiApi, tasksApi } from '../services/api';

interface TaskSuggestion {
  type: 'reschedule' | 'break_down' | 'delegate' | 'prioritize' | 'combine';
  taskId?: string;
  taskTitle?: string;
  message: string;
  action?: string;
}

interface Insight {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  icon: string;
}

export default function AIInsightsScreen() {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dailyInsights, setDailyInsights] = useState<any>(null);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchInsights = useCallback(async () => {
    try {
      const [suggestionsRes, dailyRes] = await Promise.all([
        aiApi.getTaskSuggestions().catch(() => ({ data: { suggestions: [] } })),
        aiApi.getDailyInsights().catch(() => ({ data: null })),
      ]);

      if (suggestionsRes.data?.suggestions) {
        setSuggestions(suggestionsRes.data.suggestions);
      }

      if (dailyRes.data) {
        setDailyInsights(dailyRes.data);
        
        // Generate insights from data
        const generatedInsights: Insight[] = [];
        
        if (dailyRes.data.stats?.streak >= 7) {
          generatedInsights.push({
            title: 'Amazing Streak!',
            message: `You're on a ${dailyRes.data.stats.streak}-day streak. That's incredible dedication!`,
            type: 'success',
            icon: 'flame',
          });
        }
        
        if (dailyRes.data.stats?.highPriority > 3) {
          generatedInsights.push({
            title: 'High Priority Overload',
            message: 'You have many high-priority tasks. Consider delegating or rescheduling some.',
            type: 'warning',
            icon: 'alert-circle',
          });
        }
        
        if (dailyRes.data.stats?.pending === 0) {
          generatedInsights.push({
            title: 'All Clear!',
            message: 'No pending tasks today. Great time to plan ahead or take a break.',
            type: 'success',
            icon: 'checkmark-circle',
          });
        }
        
        if (dailyRes.data.stats?.weeklyCompleted >= 20) {
          generatedInsights.push({
            title: 'Productivity Star',
            message: `${dailyRes.data.stats.weeklyCompleted} tasks completed this week. You're crushing it!`,
            type: 'success',
            icon: 'star',
          });
        }

        generatedInsights.push({
          title: 'Pro Tip',
          message: 'Breaking down large tasks into smaller steps increases completion rate by 25%.',
          type: 'tip',
          icon: 'bulb',
        });

        setInsights(generatedInsights);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights().then(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  }, [fetchInsights]);

  const applySuggestion = async (suggestion: TaskSuggestion) => {
    setIsApplying(suggestion.taskId || 'general');
    
    try {
      // Simulate applying suggestion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Suggestion Applied',
        suggestion.action || 'The suggestion has been applied to your task.',
        [{ text: 'OK' }]
      );
      
      // Remove applied suggestion
      setSuggestions(prev => prev.filter(s => s !== suggestion));
    } catch (error) {
      Alert.alert('Error', 'Failed to apply suggestion');
    } finally {
      setIsApplying(null);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'reschedule': return 'calendar';
      case 'break_down': return 'git-branch';
      case 'delegate': return 'people';
      case 'prioritize': return 'flag';
      case 'combine': return 'git-merge';
      default: return 'bulb';
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'reschedule': return '#007AFF';
      case 'break_down': return '#5856D6';
      case 'delegate': return '#34C759';
      case 'prioritize': return '#FF3B30';
      case 'combine': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return '#34C759';
      case 'warning': return '#FF9500';
      case 'tip': return '#5856D6';
      default: return '#007AFF';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Analyzing your tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Insights</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="refresh" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* AI Brain Card */}
        <Animated.View
          style={[
            styles.brainCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#007AFF', '#5856D6', '#AF52DE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brainGradient}
          >
            <View style={styles.brainContent}>
              <View style={styles.brainIcon}>
                <Ionicons name="sparkles" size={32} color="white" />
              </View>
              <View style={styles.brainText}>
                <Text style={styles.brainTitle}>MYPA Intelligence</Text>
                <Text style={styles.brainSubtitle}>
                  Personalized suggestions based on your productivity patterns
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Daily Stats Summary */}
        {dailyInsights?.stats && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>TODAY'S SNAPSHOT</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#007AFF' }]}>
                  {dailyInsights.stats.pending}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#34C759' }]}>
                  {dailyInsights.stats.completed}
                </Text>
                <Text style={styles.statLabel}>Done</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
                  {dailyInsights.stats.highPriority}
                </Text>
                <Text style={styles.statLabel}>Priority</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#FF9500' }]}>
                  {dailyInsights.stats.streak}
                </Text>
                <Text style={styles.statLabel}>Streak 🔥</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>SMART SUGGESTIONS</Text>
            {suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionCard}>
                <View
                  style={[
                    styles.suggestionIcon,
                    { backgroundColor: `${getSuggestionColor(suggestion.type)}15` },
                  ]}
                >
                  <Ionicons
                    name={getSuggestionIcon(suggestion.type) as any}
                    size={20}
                    color={getSuggestionColor(suggestion.type)}
                  />
                </View>
                <View style={styles.suggestionContent}>
                  {suggestion.taskTitle && (
                    <Text style={styles.suggestionTaskTitle}>
                      {suggestion.taskTitle}
                    </Text>
                  )}
                  <Text style={styles.suggestionMessage}>
                    {suggestion.message}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    { backgroundColor: getSuggestionColor(suggestion.type) },
                  ]}
                  onPress={() => applySuggestion(suggestion)}
                  disabled={isApplying === (suggestion.taskId || 'general')}
                >
                  {isApplying === (suggestion.taskId || 'general') ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.applyButtonText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>INSIGHTS</Text>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightCard}>
                <View
                  style={[
                    styles.insightIcon,
                    { backgroundColor: `${getInsightColor(insight.type)}15` },
                  ]}
                >
                  <Ionicons
                    name={insight.icon as any}
                    size={24}
                    color={getInsightColor(insight.type)}
                  />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightMessage}>{insight.message}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Empty State */}
        {suggestions.length === 0 && insights.length === 0 && (
          <Animated.View
            style={[
              styles.emptyContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles" size={48} color="#8E8E93" />
            </View>
            <Text style={styles.emptyTitle}>All Good!</Text>
            <Text style={styles.emptyText}>
              Your tasks are well organized. Check back later for new insights.
            </Text>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('VoiceAssistant' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FF950015' }]}>
                <Ionicons name="mic" size={24} color="#FF9500" />
              </View>
              <Text style={styles.actionText}>Ask MYPA</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Tasks' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#007AFF15' }]}>
                <Ionicons name="list" size={24} color="#007AFF" />
              </View>
              <Text style={styles.actionText}>View Tasks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Plan' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#34C75915' }]}>
                <Ionicons name="calendar" size={24} color="#34C759" />
              </View>
              <Text style={styles.actionText}>Plan Day</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
  },
  brainCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  brainGradient: {
    padding: 20,
  },
  brainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  brainIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainText: {
    flex: 1,
  },
  brainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  brainSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E6E73',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    fontWeight: '500',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTaskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  suggestionMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  insightMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 280,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  bottomSpacer: {
    height: 40,
  },
});
