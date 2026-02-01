/**
 * HubScreen - Refactored
 * Main dashboard screen with AI briefing and task overview
 * 
 * This component has been refactored from a 1,841-line file into a modular architecture:
 * - Components: BriefingModal, TaskCard, StatCards, QuickActions
 * - Hooks: useHubAnimations, useHubData, useBriefing
 * - Styles: Centralized in styles.ts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
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
  TaskCard,
  StreakCard,
  LevelCard,
  QuickActions,
} from './components';

// Import extracted hooks
import {
  useHubAnimations,
  useHubData,
  useBriefing,
} from './hooks';

// Import styles
import { styles } from './styles';

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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8fafc', '#ffffff', '#f8fafc']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Ambient Background Elements */}
      <View style={styles.ambientContainer} pointerEvents="none">
        <View style={[styles.ambientBlob, styles.ambientBlob1]} />
        <View style={[styles.ambientBlob, styles.ambientBlob2]} />
        <View style={[styles.ambientBlob, styles.ambientBlob3]} />
      </View>

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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingText}>{greeting.text}</Text>
              <Text style={styles.userName}>{todayStats.userName}</Text>
            </View>
            <View style={styles.headerButtons}>
              <Pressable
                onPress={() => handleNavigate('inbox')}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Inbox color="#475569" size={16} />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>3</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => handleNavigate('profile')}
                style={({ pressed }) => [pressed && styles.buttonPressed]}
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
            {/* MYPA AI Briefing Card */}
            <Pressable
              onPress={briefing.startBriefing}
              style={({ pressed }) => [pressed && styles.cardPressed]}
            >
              <LinearGradient
                colors={['#1e1b4b', '#312e81', '#1e1b4b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.briefingCard}
              >
                <View style={styles.briefingOverlay} />
                <View style={styles.briefingContent}>
                  {/* Orb */}
                  <Animated.View style={[styles.orbContainer, { transform: [{ scale: animations.pulseAnim }] }]}>
                    <View style={styles.orbRipple} />
                    <LinearGradient
                      colors={['#a78bfa', '#8b5cf6', '#6366f1']}
                      style={styles.orb}
                    >
                      <Sparkles color="#fff" size={20} />
                    </LinearGradient>
                  </Animated.View>

                  {/* Content */}
                  <View style={styles.briefingTextContainer}>
                    <View style={styles.briefingTitleRow}>
                      <Text style={styles.briefingTitle}>MYPA</Text>
                      <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>AI</Text>
                      </View>
                    </View>
                    <Text style={styles.briefingSubtitle}>Tap for your daily briefing</Text>
                  </View>

                  {/* Play Button */}
                  <View style={styles.playButton}>
                    <Play color="#7c3aed" size={16} style={{ marginLeft: 2 }} />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Streak & Level Row */}
            <View style={styles.statsRow}>
              <StreakCard
                streak={todayStats.streak}
                onPress={() => handleNavigate('streak')}
              />
              <LevelCard
                level={todayStats.level}
                xpToNext={todayStats.xpToNext}
                onPress={() => handleNavigate('level')}
              />
            </View>

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
                >
                  <Text style={styles.seeAllText}>Full Plan</Text>
                  <ChevronRight color="#7c3aed" size={16} />
                </Pressable>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{progressPercent}%</Text>
              </View>

              {/* Task List */}
              <View style={styles.taskList}>
                {displayTasks.length > 0 ? displayTasks.map((task, index) => {
                  const numericId = typeof task.id === 'string' ? parseInt(task.id, 10) : task.id as number;
                  const isCompleted = task.completed || completedTasks.includes(numericId);
                  const isNextUp = !isCompleted && !displayTasks.slice(0, index).some((t) => {
                    const tId = typeof t.id === 'string' ? parseInt(t.id, 10) : t.id as number;
                    return !(t.completed || completedTasks.includes(tId));
                  });

                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isCompleted={isCompleted}
                      isNextUp={isNextUp}
                      onPress={() => !isCompleted && handleNavigate('plan')}
                      onToggleComplete={() => handleToggleTask(task.id)}
                    />
                  );
                }) : (
                  <View style={styles.emptyTasks}>
                    <Text style={styles.emptyTasksText}>No tasks yet. Add your first task!</Text>
                  </View>
                )}
              </View>

              {/* Quick Add Button */}
              <Pressable
                onPress={() => handleNavigate('plan')}
                style={({ pressed }) => [
                  styles.addTaskButton,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.addTaskIcon}>
                  <Plus color="#64748b" size={14} />
                </View>
                <Text style={styles.addTaskText}>Add task</Text>
              </Pressable>
            </View>

            {/* Quick Actions */}
            <QuickActions onNavigate={handleNavigate} />

            {/* Ask MYPA CTA */}
            <Pressable
              onPress={() => onVoiceClick?.()}
              style={({ pressed }) => [pressed && styles.cardPressed]}
            >
              <LinearGradient
                colors={['#7c3aed', '#9333ea', '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.askMypaCard}
              >
                <Animated.View
                  style={[
                    styles.shimmerOverlay,
                    { transform: [{ translateX: animations.shimmerTranslate }] },
                  ]}
                />
                <View style={styles.askMypaContent}>
                  <View style={styles.askMypaIcon}>
                    <Mic color="#fff" size={20} />
                  </View>
                  <View style={styles.askMypaTextContainer}>
                    <Text style={styles.askMypaTitle}>Ask MYPA Anything</Text>
                    <Text style={styles.askMypaSubtitle}>"What should I focus on next?"</Text>
                  </View>
                  <ArrowUpRight color="rgba(255,255,255,0.7)" size={20} />
                </View>
              </LinearGradient>
            </Pressable>

            {/* Reset Day Link */}
            <Pressable
              onPress={() => handleNavigate('reset')}
              style={styles.resetButton}
            >
              <Text style={styles.resetText}>
                Overwhelmed? <Text style={styles.resetLink}>Reset your day</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
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
