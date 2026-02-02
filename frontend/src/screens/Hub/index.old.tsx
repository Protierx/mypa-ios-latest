/**
 * HubScreen - Refactored
 * Main dashboard screen with AI briefing and task overview
 * 
 * This component has been refactored from a 1,841-line file into a modular architecture:
 * - Components: BriefingModal, TaskCard, StatCards, QuickActions
 * - Hooks: useHubAnimations, useHubData, useBriefing
 * - Styles: Centralized in styles.ts
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Inbox,
  ChevronRight,
  Target,
  Sparkles,
  Star,
  Mic,
  ArrowUpRight,
  Plus,
  Play,
} from 'lucide-react-native';

// Import extracted components
import {
  BriefingModal,
  BriefingBanner,
  TaskCard,
  StreakCard,
  LevelCard,
  QuickActions,
  FloatingActionButton,
  HubLoadingState,
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
import { colors } from '../../styles';

interface HubScreenProps {
  onVoiceClick?: () => void;
  navigation?: any;
}

export function HubScreen({ onVoiceClick, navigation }: HubScreenProps) {
  // Use extracted hooks
  const hubData = useHubData();
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [lastXpGain, setLastXpGain] = useState(0);
  
  const animations = useHubAnimations(
    false, // isSpeaking handled by briefing
    showXpPopup
  );
  
  const briefing = useBriefing(
    hubData.greeting.text,
    async (amount) => {
      setLastXpGain(amount);
      setShowXpPopup(true);
      await hubData.awardXp(amount);
    }
  );

  // Destructure for easier access
  const {
    greeting,
    displayTasks,
    completedTasks,
    setCompletedTasks,
    todayStats,
    awardXp,
  } = hubData;

  // XP popup animation effect
  useEffect(() => {
    if (showXpPopup) {
      animations.startXpPopupAnimation(() => setShowXpPopup(false));
    }
  }, [showXpPopup]);

  // Navigation helper
  const handleNavigate = (screen: string) => {
    if (!navigation) return;
    const homeStackRoutes: { [key: string]: string } = {
      inbox: 'Inbox',
      streak: 'Streak',
      level: 'Level',
      sort: 'TaskSorting',
      challenges: 'Challenges',
      wallet: 'Wallet',
      reset: 'Reset',
      Analytics: 'Analytics',
      DailyBriefing: 'DailyBriefing',
      AIInsights: 'AIInsights',
    };

    if (homeStackRoutes[screen]) {
      navigation.navigate(homeStackRoutes[screen]);
    } else if (screen === 'profile') {
      navigation.navigate('Profile', { screen: 'ProfileMain' });
    } else if (screen === 'plan') {
      navigation.navigate('Plan');
    } else if (screen === 'circles') {
      navigation.navigate('Circles', { screen: 'CirclesList' });
    } else {
      navigation.navigate(screen);
    }
  };

  // Handle task completion toggle
  const handleToggleTask = async (taskId: string | number) => {
    const numericId = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId;
    const isCompleted = completedTasks.includes(numericId);
    
    if (isCompleted) {
      setCompletedTasks(prev => prev.filter(id => id !== numericId));
    } else {
      setCompletedTasks(prev => [...prev, numericId]);
      setLastXpGain(5);
      setShowXpPopup(true);
      await awardXp(5);
    }
  };

  // Calculate completed count
  const completedCount = displayTasks.filter(
    (t) => t.completed || completedTasks.includes(typeof t.id === 'string' ? parseInt(t.id, 10) : t.id as number)
  ).length;
  const progressPercent = displayTasks.length > 0 
    ? Math.round((completedCount / displayTasks.length) * 100) 
    : 0;

  // Memoized task renderer for FlatList performance
  const renderTask = useCallback(({ item: task, index }: { item: DisplayTask; index: number }) => {
    const numericId = typeof task.id === 'string' ? parseInt(task.id, 10) : task.id as number;
    const isCompleted = task.completed || completedTasks.includes(numericId);
    const isNextUp = !isCompleted && !displayTasks.slice(0, index).some((t) => {
      const tId = typeof t.id === 'string' ? parseInt(t.id, 10) : t.id as number;
      return !(t.completed || completedTasks.includes(tId));
    });

    return (
      <TaskCard
        task={task}
        isCompleted={isCompleted}
        isNextUp={isNextUp}
        onPress={() => !isCompleted && handleNavigate('plan')}
        onToggleComplete={() => handleToggleTask(task.id)}
      />
    );
  }, [completedTasks, displayTasks, handleNavigate, handleToggleTask]);

  const keyExtractor = useCallback((item: DisplayTask) => item.id.toString(), []);

  return (
    <View style={styles.container}>
      {/* Subtle gradient background with accent colors */}
      <LinearGradient
        colors={['#f8fafc', '#ffffff', '#faf8ff']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* XP Popup */}
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
                    outputRange: [0, -40],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#8b5cf6', '#9333ea']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.xpPopupGradient}
          >
            <Star color="#fff" size={16} />
            <Text style={styles.xpPopupText}>+{lastXpGain} XP</Text>
          </LinearGradient>
        </Animated.View>
      )}

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Show loading state on initial load */}
        {hubData.isLoading && displayTasks.length === 0 ? (
          <HubLoadingState />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          {/* Header with Streak Highlight */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingText}>{greeting.text}</Text>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{todayStats.userName}</Text>
                {todayStats.streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <Text style={styles.streakText}>{todayStats.streak} day</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.headerButtons}>
              <Pressable
                onPress={() => handleNavigate('inbox')}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Go to inbox"
                accessibilityHint="Opens your assignment inbox with 3 new items"
              >
                <Inbox color="#475569" size={16} />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>3</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => handleNavigate('profile')}
                style={({ pressed }) => [pressed && styles.buttonPressed]}
                accessibilityRole="button"
                accessibilityLabel="Go to profile"
                accessibilityHint="Opens your profile settings and stats"
              >
                <LinearGradient
                  colors={['#8b5cf6', '#9333ea']}
                  style={styles.profileButton}
                >
                  <Text style={styles.profileInitial}>{todayStats.userName[0]}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          <View style={styles.content}>
            {/* Compact AI Briefing Banner - simplified from large card for clarity */}
            <BriefingBanner onPress={briefing.startBriefing} />

            {/* AI Productivity Insight Card - Premium Design */}
            <Pressable 
              onPress={() => handleNavigate('AIInsights')}
              style={({ pressed }) => [styles.insightCard, pressed && styles.cardPressed]}
              accessibilityRole="button"
              accessibilityLabel="View personalized AI insights"
            >
              <LinearGradient
                colors={['#06b6d4', '#0891b2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.insightGradient}
              >
                <View style={styles.insightHeader}>
                  <View style={styles.insightIconContainer}>
                    <Text style={styles.insightMainIcon}>⚡</Text>
                  </View>
                  <View style={styles.insightTitleArea}>
                    <Text style={styles.insightBadge}>PEAK HOURS</Text>
                    <Text style={styles.insightHeading}>Most Productive at <Text style={styles.insightTime}>{todayStats.userName === 'alice' ? '2 PM' : '10 AM'}</Text></Text>
                  </View>
                  <View style={styles.insightArrow}>
                    <ChevronRight color="#ffffff" size={20} />
                  </View>
                </View>
                <View style={styles.insightFooter}>
                  <View style={styles.insightStat}>
                    <Text style={styles.insightStatLabel}>Avg Focus</Text>
                    <Text style={styles.insightStatValue}>45 min</Text>
                  </View>
                  <View style={styles.insightDivider} />
                  <View style={styles.insightStat}>
                    <Text style={styles.insightStatLabel}>This Week</Text>
                    <Text style={styles.insightStatValue}>+22%</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Today's Focus Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionIconContainer}>
                    <Target color="#fff" size={16} />
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Today's Focus</Text>
                    <Text style={styles.sectionSubtitle}>{completedCount}/{displayTasks.length} completed</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleNavigate('plan')}
                  style={({ pressed }) => [
                    styles.seeAllButton,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="View full plan"
                  accessibilityHint="Opens your weekly task planner"
                >
                  <Text style={styles.seeAllText}>Full Plan</Text>
                  <ChevronRight color="#7c3aed" size={16} />
                </Pressable>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  {progressPercent > 0 && (
                    <LinearGradient
                      colors={['#ec4899', '#8b5cf6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressFill,
                        { width: `${progressPercent}%` },
                      ]}
                    />
                  )}
                </View>
                <Text style={styles.progressText}>{progressPercent}%</Text>
              </View>

              {/* Task List - FlatList for better performance with large lists */}
              {displayTasks.length > 0 ? (
                <FlatList
                  data={displayTasks}
                  renderItem={renderTask}
                  keyExtractor={keyExtractor}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                  style={styles.taskList}
                />
              ) : (
                <View style={styles.emptyTasks}>
                  <Text style={styles.emptyTasksText}>No tasks yet. Add your first task!</Text>
                </View>
              )}

              {/* Quick Add Button */}
              <Pressable
                onPress={() => handleNavigate('plan')}
                style={({ pressed }) => [
                  styles.addTaskButton,
                  pressed && styles.cardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add new task"
                accessibilityHint="Opens task creation form"
              >
                <View style={styles.addTaskIcon}>
                  <Plus color="#64748b" size={14} />
                </View>
                <Text style={styles.addTaskText}>Add task</Text>
              </Pressable>
              {/* Social Accountability Card - Premium Design */}
              <Pressable 
                onPress={() => handleNavigate('circles')}
                style={({ pressed }) => [styles.socialCard, pressed && styles.cardPressed]}
                accessibilityRole="button"
                accessibilityLabel="View friend activity and circles"
              >
                <LinearGradient
                  colors={['#a855f7', '#d946ef']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.socialGradient}
                >
                  <View style={styles.socialContent}>
                    <View style={styles.socialLeft}>
                      <View style={styles.socialIconBg}>
                        <Text style={styles.socialIcon}>👥</Text>
                      </View>
                      <View style={styles.socialTextArea}>
                        <Text style={styles.socialLabel}>FRIEND STREAK</Text>
                        <Text style={styles.socialHeading}>3 Friends Completed</Text>
                        <Text style={styles.socialSubtext}>Keep the momentum going</Text>
                      </View>
                    </View>
                    <View style={styles.socialRight}>
                      <ChevronRight color="#ffffff" size={24} />
                    </View>
                  </View>
                  <View style={styles.socialFriends}>
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendInitial}>A</Text>
                    </View>
                    <View style={[styles.friendAvatar, styles.friendAvatarOffset]}>
                      <Text style={styles.friendInitial}>J</Text>
                    </View>
                    <View style={[styles.friendAvatar, styles.friendAvatarOffset2]}>
                      <Text style={styles.friendInitial}>M</Text>
                    </View>
                    <View style={[styles.friendAvatar, styles.friendAvatarOffset3, styles.friendAvatarPlus]}>
                      <Text style={styles.friendInitial}>+1</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>            </View>
          </View>
          </ScrollView>
        )}

        {/* Floating Action Button - consolidated voice assistant */}
        {onVoiceClick && <FloatingActionButton onPress={onVoiceClick} />}
      </SafeAreaView>

      {/* AI Briefing Modal */}
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
    </View>
  );
}

export default HubScreen;
