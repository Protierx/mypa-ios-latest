/**
 * HubScreen - Premium Redesign
 * Clean, modern, million-dollar app aesthetic
 * 
 * Inspired by successful apps:
 * - Things 3: Clean task organization, contextual awareness
 * - Todoist: Smart scheduling, productivity insights  
 * - Apple Fitness: Gamification, progress celebration
 * - Notion: Modern aesthetic, smooth interactions
 * - Forest: Focus encouragement, streak motivation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  ChevronRight,
  Check,
  Plus,
  Play,
  Zap,
  Target,
  Flame,
  Sparkles,
  Clock,
  AlertCircle,
} from 'lucide-react-native';

// Import MYPAOrb
import { MYPAOrb } from '../../components/MYPAOrb';

// Import auth context
import { useAuth } from '../../contexts/AuthContext';

// Import API
import { tasksApi } from '../../services/api';

// Import onboarding
import { OnboardingScreen } from '../Onboarding';

// Import extracted components
import {
  BriefingModal,
  BriefingBanner,
  DaySummaryModal,
  FloatingActionButton,
  HubLoadingState,
  QuickActions,
} from './components';

// Import extracted hooks
import {
  useHubAnimations,
  useHubData,
  useBriefing,
} from './hooks';

// Import types
import type { DisplayTask } from './hooks/useHubData';

// Import styles
import { styles } from './styles';

interface HubScreenProps {
  onVoiceClick?: () => void;
  navigation?: any;
}

export function HubScreen({ onVoiceClick, navigation }: HubScreenProps) {
  const { user, refreshUser } = useAuth();
  const hubData = useHubData();
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Check if user needs onboarding
  useEffect(() => {
    if (user && !user.isOnboarded) {
      setShowOnboarding(true);
    }
  }, [user]);
  
  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(async () => {
    setShowOnboarding(false);
    await refreshUser();
    // Refresh hub data to show new tasks
    hubData.refreshData();
  }, [refreshUser, hubData]);
  const [lastXpGain, setLastXpGain] = useState(0);
  
  // Animated progress value
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Pulse animation for hero card
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  
  useEffect(() => {
    // Breathing pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    
    // Glow intensity animation
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    
    pulse.start();
    glow.start();
    
    return () => {
      pulse.stop();
      glow.stop();
    };
  }, []);
  
  const animations = useHubAnimations(false, showXpPopup);
  
  // Calculate real briefing data from actual tasks
  const priorityTasks = hubData.displayTasks.filter(t => t.priority && !t.completed);
  const completedToday = hubData.displayTasks.filter(t => t.completed);
  
  const briefing = useBriefing(
    hubData.greeting.text,
    async (amount) => {
      setLastXpGain(amount);
      setShowXpPopup(true);
      await hubData.awardXp(amount);
    },
    {
      tasksCount: hubData.displayTasks.filter(t => !t.completed).length,
      priorityCount: priorityTasks.length,
      completedCount: completedToday.length,
    }
  );

  const {
    greeting,
    displayTasks,
    completedTasks,
    setCompletedTasks,
    todayStats,
    awardXp,
    nextTask,
    overdueCount,
    remainingMinutes,
  } = hubData;

  useEffect(() => {
    if (showXpPopup) {
      animations.startXpPopupAnimation(() => setShowXpPopup(false));
    }
  }, [showXpPopup]);

  const handleNavigate = useCallback((screen: string, params?: any) => {
    if (navigation) {
      switch (screen) {
        case 'plan':
          navigation.navigate('Plan', params);
          break;
        case 'circles':
          navigation.navigate('Circles');
          break;
        case 'profile':
          navigation.navigate('You');
          break;
        case 'inbox':
          navigation.navigate('Inbox');
          break;
        case 'wallet':
          navigation.navigate('Wallet');
          break;
        case 'challenges':
          navigation.navigate('Challenges');
          break;
        case 'analytics':
          navigation.navigate('Analytics');
          break;
        case 'streak':
          navigation.navigate('Streak');
          break;
        case 'level':
          navigation.navigate('Level');
          break;
        case 'settings':
          navigation.navigate('Settings');
          break;
        case 'aiinsights':
          navigation.navigate('AIInsights');
          break;
        case 'dailybriefing':
          navigation.navigate('DailyBriefing');
          break;
        case 'reset':
          navigation.navigate('Reset');
          break;
        default:
          break;
      }
    }
  }, [navigation]);

  const handleTaskToggle = useCallback(async (taskId: string | number) => {
    // Always convert to string for consistency
    const stringId = String(taskId);
    
    console.log('🔘 Task toggle called for ID:', taskId, '-> string:', stringId);
    console.log('🔘 Current completedTasks:', completedTasks);
    
    // Check if already completed
    if (completedTasks.includes(stringId)) {
      console.log('🔘 Task already completed, skipping');
      return;
    }
    
    // Update local state immediately for responsive UI
    setCompletedTasks(prev => [...prev, stringId]);
    setLastXpGain(5);
    setShowXpPopup(true);
    awardXp(5);
    
    // Persist to server
    try {
      await tasksApi.complete(stringId);
      console.log('✅ Task completion saved to server:', stringId);
    } catch (error) {
      console.error('❌ Failed to save task completion:', error);
      // Revert local state on error
      setCompletedTasks(prev => prev.filter(id => id !== stringId));
    }
  }, [completedTasks, awardXp]);

  const completedCount = displayTasks.filter(
    (t) => t.completed || completedTasks.includes(String(t.id))
  ).length;
  
  const progressPercent = displayTasks.length > 0 
    ? Math.round((completedCount / displayTasks.length) * 100) 
    : 0;

  // Animate progress bar when task completion changes
  useEffect(() => {
    const target = displayTasks.length > 0 
      ? completedCount / displayTasks.length 
      : 0;
    Animated.spring(progressAnim, {
      toValue: target,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [displayTasks.length, completedCount, progressAnim]);

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'work': return '#3b82f6';
      case 'health': return '#10b981';
      case 'fitness': return '#f59e0b';
      case 'personal': return '#8b5cf6';
      case 'errands': return '#ec4899';
      case 'learning': return '#06b6d4';
      default: return '#8b5cf6';
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await hubData.refreshData();
    setRefreshing(false);
  }, [hubData]);

  // Show onboarding for new users
  if (showOnboarding) {
    return (
      <OnboardingScreen 
        onComplete={handleOnboardingComplete}
        navigation={navigation}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* XP Popup Animation */}
      {showXpPopup && (
        <Animated.View
          style={[
            styles.xpPopup,
            {
              opacity: animations.xpPopupAnim,
              transform: [
                {
                  translateY: animations.xpPopupAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#7c3aed', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.xpPopupGradient}
          >
            <Zap color="#fff" size={16} fill="#fff" />
            <Text style={styles.xpPopupText}>+{lastXpGain} XP</Text>
          </LinearGradient>
        </Animated.View>
      )}

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {hubData.isLoading && displayTasks.length === 0 ? (
          <HubLoadingState />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor="#7c3aed"
              />
            }
          >
            {/* ============ HEADER ============ */}
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <View style={styles.greetingRow}>
                    <Text style={styles.greeting}>{greeting.text}</Text>
                    {(todayStats.level || 1) > 0 && (
                      <View style={styles.levelBadge}>
                        <Zap color="#7c3aed" size={10} />
                        <Text style={styles.levelText}>Lv {todayStats.level || 1}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{todayStats.userName}</Text>
                    {(todayStats.streak || 0) > 0 && (
                      <View style={styles.streakBadge}>
                        <Flame color="#f59e0b" size={14} />
                        <Text style={styles.streakText}>{todayStats.streak}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.headerRight}>
                  <Pressable 
                    style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
                    onPress={() => handleNavigate('inbox')}
                  >
                    <Bell color="#64748b" size={20} />
                    <View style={styles.notificationDot} />
                  </Pressable>
                  <Pressable 
                    style={({ pressed }) => [pressed && styles.buttonPressed]}
                    onPress={() => handleNavigate('profile')}
                  >
                    <LinearGradient
                      colors={['#7c3aed', '#a855f7']}
                      style={styles.avatar}
                    >
                      <Text style={styles.avatarText}>
                        {todayStats.userName?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* ============ STATS ROW ============ */}
            <View style={styles.statsRow}>
              <Pressable 
                style={({ pressed }) => [styles.statCard, { backgroundColor: '#faf5ff' }, pressed && styles.buttonPressed]}
                onPress={() => handleNavigate('level')}
              >
                <Zap color="#7c3aed" size={16} fill="#7c3aed" />
                <Text style={[styles.statValue, { color: '#7c3aed' }]}>{todayStats.xp || 0}</Text>
                <Text style={styles.statLabel}>XP</Text>
              </Pressable>
              <Pressable 
                style={({ pressed }) => [styles.statCard, { backgroundColor: '#f0fdf4' }, pressed && styles.buttonPressed]}
                onPress={() => handleNavigate('plan')}
              >
                <Target color="#10b981" size={16} />
                <Text style={[styles.statValue, { color: '#10b981' }]}>{completedCount}/{displayTasks.length}</Text>
                <Text style={styles.statLabel}>Tasks</Text>
              </Pressable>
              <Pressable 
                style={({ pressed }) => [styles.statCard, { backgroundColor: '#fffbeb' }, pressed && styles.buttonPressed]}
                onPress={() => handleNavigate('streak')}
              >
                <Flame color="#f59e0b" size={16} fill="#f59e0b" />
                <Text style={[styles.statValue, { color: '#f59e0b' }]}>{todayStats.streak || 0}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </Pressable>
            </View>

            <View style={styles.content}>
              {/* ============ AI HERO CARD - Contextually Aware ============ */}
              <Pressable
                onPress={() => {
                  // If all tasks are complete, show summary; otherwise show briefing
                  if (completedCount === displayTasks.length && displayTasks.length > 0) {
                    setShowSummary(true);
                  } else {
                    briefing.startBriefing();
                  }
                }}
                style={({ pressed }) => [styles.heroCard, pressed && styles.cardPressed]}
              >
                <LinearGradient
                  colors={overdueCount > 0 
                    ? ['#dc2626', '#f97316', '#fbbf24'] // Urgent red-orange
                    : completedCount === displayTasks.length && displayTasks.length > 0
                    ? ['#10b981', '#14b8a6', '#06b6d4'] // Success green-teal
                    : ['#7c3aed', '#a855f7', '#ec4899'] // Default purple-pink
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroContent}>
                    <Animated.View style={[
                      styles.heroIconWrap,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: glowAnim.interpolate({
                          inputRange: [0.3, 0.6],
                          outputRange: [0.9, 1],
                        }),
                      }
                    ]}>
                      <MYPAOrb size="sm" showGlow />
                    </Animated.View>
                    <Text style={styles.heroTitle}>
                      {completedCount === displayTasks.length && displayTasks.length > 0
                        ? "All Tasks Complete! 🎉"
                        : overdueCount > 0
                        ? `${overdueCount} Task${overdueCount > 1 ? 's' : ''} Overdue`
                        : "Your Daily Mission"
                      }
                    </Text>
                    <Text style={styles.heroSubtitle}>
                      {completedCount === displayTasks.length && displayTasks.length > 0
                        ? `Amazing work! You earned ${todayStats.xp} XP today`
                        : remainingMinutes > 0
                        ? `${displayTasks.length - completedCount} tasks • ~${Math.round(remainingMinutes / 60)}h ${remainingMinutes % 60}m left`
                        : `${displayTasks.length} tasks planned • ${todayStats.xp || 0} XP to earn`
                      }
                    </Text>
                    <View style={styles.heroCta}>
                      <Text style={styles.heroCtaText}>
                        {completedCount === displayTasks.length && displayTasks.length > 0
                          ? "View Summary"
                          : "Start Briefing"
                        }
                      </Text>
                      <Play color="#7c3aed" size={16} fill="#7c3aed" />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* ============ QUICK ACTIONS ============ */}
              <QuickActions onNavigate={handleNavigate} />

              {/* ============ TODAY'S TASKS ============ */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Today's Focus</Text>
                    <Text style={styles.sectionSubtitle}>
                      {overdueCount > 0 
                        ? `⚠️ ${overdueCount} overdue - let's catch up!`
                        : completedCount === 0 && displayTasks.length > 0 
                        ? greeting.motivationalMessage || "Ready to start your day?"
                        : completedCount === displayTasks.length && displayTasks.length > 0
                        ? "🎉 All done for today!"
                        : `${completedCount} of ${displayTasks.length} completed`
                      }
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleNavigate('plan')}
                  style={({ pressed }) => [styles.seeAllButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.seeAllText}>See all</Text>
                  <ChevronRight color="#7c3aed" size={16} />
                </Pressable>
              </View>

              {/* Animated Progress Bar with Time Estimate */}
              {displayTasks.length > 0 && (
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarTrack}>
                    <Animated.View 
                      style={[
                        styles.progressBarFill,
                        overdueCount > 0 && styles.progressBarFillOverdue,
                        completedCount === displayTasks.length && styles.progressBarFillComplete,
                        { 
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          })
                        }
                      ]} 
                    />
                  </View>
                  <View style={styles.progressStats}>
                    <Text style={[
                      styles.progressBarText,
                      overdueCount > 0 && styles.progressTextOverdue,
                      completedCount === displayTasks.length && styles.progressTextComplete,
                    ]}>
                      {progressPercent}%
                    </Text>
                    {remainingMinutes > 0 && completedCount < displayTasks.length && (
                      <Text style={styles.timeEstimate}>
                        ~{remainingMinutes >= 60 
                          ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m` 
                          : `${remainingMinutes}m`
                        }
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Task List */}
              {displayTasks.length > 0 ? (
                <View style={styles.taskList}>
                  {displayTasks.slice(0, 4).map((task, index) => {
                    const isCompleted = task.completed || completedTasks.includes(String(task.id));
                    const isNextUp = task.isNextUp && !isCompleted;
                    const categoryColor = getCategoryColor(task.category || 'personal');
                    // Create a unique key using both id and index to avoid duplicates
                    const uniqueKey = `task-${task.id}-${index}`;
                    // Tasks with duration > 5 mins require focus session
                    const requiresFocusSession = task.durationMin > 5;

                    return (
                      <Pressable
                        key={uniqueKey}
                        onPress={() => handleNavigate('plan', { taskId: task.id })}
                        style={({ pressed }) => [
                          styles.taskCard,
                          isNextUp && styles.taskCardActive,
                          isCompleted && styles.taskCardCompleted,
                          task.isOverdue && !isCompleted && styles.taskCardOverdue,
                          task.isUrgent && !isCompleted && styles.taskCardUrgent,
                          pressed && styles.cardPressed,
                        ]}
                      >
                        {/* Category accent bar */}
                        <View style={[
                          styles.taskAccent, 
                          { backgroundColor: isCompleted 
                            ? '#cbd5e1' 
                            : task.isOverdue 
                            ? '#ef4444'
                            : task.isUrgent 
                            ? '#f59e0b'
                            : categoryColor 
                          }
                        ]} />
                        
                        <View style={styles.taskRow}>
                          <Pressable
                            onPress={() => {
                              if (isCompleted) return;
                              if (requiresFocusSession) {
                                // Navigate to Plan to start focus session
                                handleNavigate('plan', { taskId: task.id });
                              } else {
                                // Quick task - can be completed directly
                                handleTaskToggle(task.id);
                              }
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={[
                              styles.taskCheckbox,
                              isNextUp && styles.taskCheckboxActive,
                              isCompleted && styles.taskCheckboxCompleted,
                              requiresFocusSession && !isCompleted && styles.taskCheckboxFocus,
                            ]}
                          >
                            {isCompleted ? (
                              <Check color="#fff" size={14} strokeWidth={3} />
                            ) : requiresFocusSession ? (
                              <Play color="#7c3aed" size={12} fill="#7c3aed" />
                            ) : null}
                          </Pressable>
                          <View style={styles.taskContent}>
                            <View style={styles.taskTitleRow}>
                              <Text style={[
                                styles.taskTitle,
                                isCompleted && styles.taskTitleCompleted,
                              ]} numberOfLines={1}>
                                {task.title}
                              </Text>
                              {task.isOverdue && !isCompleted && (
                                <View style={styles.overdueIndicator}>
                                  <AlertCircle color="#ef4444" size={14} />
                                </View>
                              )}
                              {task.priority && !isCompleted && !task.isOverdue && (
                                <View style={styles.priorityIndicator}>
                                  <Text style={styles.priorityText}>!</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.taskMeta}>
                              {task.time ? (
                                <>
                                  <Clock color={task.isOverdue ? '#ef4444' : task.isUrgent ? '#f59e0b' : '#64748b'} size={12} />
                                  <Text style={[
                                    styles.taskTime,
                                    task.isOverdue && styles.taskTimeOverdue,
                                    task.isUrgent && styles.taskTimeUrgent,
                                  ]}>
                                    {task.time}
                                  </Text>
                                  {task.timeUntil && !isCompleted && (
                                    <Text style={[
                                      styles.taskTimeUntil,
                                      task.isOverdue && styles.taskTimeOverdue,
                                      task.isUrgent && styles.taskTimeUrgent,
                                    ]}>
                                      ({task.timeUntil})
                                    </Text>
                                  )}
                                  <View style={styles.taskDot} />
                                </>
                              ) : null}
                              <Text style={styles.taskDuration}>
                                {task.duration}
                              </Text>
                              <View style={styles.taskDot} />
                              <Text style={[styles.taskCategory, { color: categoryColor }]}>
                                {task.category}
                              </Text>
                            </View>
                          </View>
                          {isNextUp && !isCompleted && (
                            <LinearGradient
                              colors={task.isOverdue ? ['#ef4444', '#f97316'] : ['#7c3aed', '#a855f7']}
                              style={styles.taskAction}
                            >
                              <Play color="#fff" size={16} fill="#fff" />
                            </LinearGradient>
                          )}
                          {!isNextUp && !isCompleted && (
                            <View style={styles.taskAction}>
                              <ChevronRight color="#94a3b8" size={18} />
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyStateIcon}>
                    <Sparkles color="#cbd5e1" size={32} />
                  </View>
                  <Text style={styles.emptyStateTitle}>Your day is wide open!</Text>
                  <Text style={styles.emptyStateSubtitle}>What do you want to accomplish today?</Text>
                  <Pressable 
                    style={({ pressed }) => [styles.emptyStateCta, pressed && styles.buttonPressed]}
                    onPress={() => handleNavigate('plan')}
                  >
                    <Plus color="#7c3aed" size={18} />
                    <Text style={styles.emptyStateCtaText}>Add your first task</Text>
                  </Pressable>
                </View>
              )}

              {/* Add Task Button */}
              <Pressable
                onPress={() => handleNavigate('plan')}
                style={({ pressed }) => [styles.addTaskButton, pressed && styles.buttonPressed]}
              >
                <Plus color="#64748b" size={18} />
                <Text style={styles.addTaskText}>Add task</Text>
              </Pressable>

              {/* ============ SOCIAL TEASER - Compact ============ */}
              <Pressable
                onPress={() => handleNavigate('circles')}
                style={({ pressed }) => [styles.socialTeaser, pressed && styles.cardPressed]}
              >
                <View style={styles.socialTeaserLeft}>
                  <View style={styles.socialAvatarsCompact}>
                    {['A', 'J', 'M'].map((initial, idx) => (
                      <View key={idx} style={[styles.socialAvatarSmall, idx > 0 && styles.socialAvatarOverlap]}>
                        <Text style={styles.socialAvatarSmallText}>{initial}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.socialTeaserText}>
                    <Text style={styles.socialTeaserBold}>3 friends</Text> completed tasks today
                  </Text>
                </View>
                <ChevronRight color="#94a3b8" size={18} />
              </Pressable>
            </View>
          </ScrollView>
        )}

        {onVoiceClick && <FloatingActionButton onPress={onVoiceClick} />}
      </SafeAreaView>

      <BriefingModal
        visible={briefing.showBriefing}
        briefingStep={briefing.briefingStep}
        isSpeaking={briefing.isSpeaking}
        briefingItems={briefing.briefingItems}
        orbBreathAnim={animations.orbBreathAnim}
        waveAnims={animations.waveAnims}
        onClose={briefing.closeBriefing}
        onSkip={briefing.skipToEnd}
      />

      <DaySummaryModal
        visible={showSummary}
        onClose={() => setShowSummary(false)}
        stats={{
          tasksCompleted: completedCount,
          totalTasks: displayTasks.length,
          xpEarned: todayStats.xp || 0,
          focusMinutes: user?.focusMinutes || 0,
          streak: user?.currentStreak || 0,
          level: user?.level || 1,
        }}
        completedTasks={displayTasks
          .filter(t => t.completed || completedTasks.includes(String(t.id)))
          .map(t => ({
            id: t.id,
            title: t.title,
            category: t.category,
            xp: 5,
          }))}
      />
    </View>
  );
}

export default HubScreen;
