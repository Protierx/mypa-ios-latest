/**
 * HubScreen - Premium Redesign
 * Clean, modern, million-dollar app aesthetic
 * Inspired by Linear, Notion, Apple Fitness
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Easing,
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
} from 'lucide-react-native';

// Import MYPAOrb
import { MYPAOrb } from '../../components/MYPAOrb';

// Import extracted components
import {
  BriefingModal,
  BriefingBanner,
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

interface HubScreenProps {
  onVoiceClick?: () => void;
  navigation?: any;
}

export function HubScreen({ onVoiceClick, navigation }: HubScreenProps) {
  const hubData = useHubData();
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [lastXpGain, setLastXpGain] = useState(0);
  
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
  
  const briefing = useBriefing(
    hubData.greeting.text,
    async (amount) => {
      setLastXpGain(amount);
      setShowXpPopup(true);
      await hubData.awardXp(amount);
    }
  );

  const {
    greeting,
    displayTasks,
    completedTasks,
    setCompletedTasks,
    todayStats,
    awardXp,
  } = hubData;

  useEffect(() => {
    if (showXpPopup) {
      animations.startXpPopupAnimation(() => setShowXpPopup(false));
    }
  }, [showXpPopup]);

  const handleNavigate = useCallback((screen: string) => {
    if (navigation) {
      switch (screen) {
        case 'plan':
          navigation.navigate('Plan');
          break;
        case 'circles':
          navigation.navigate('Circles');
          break;
        case 'profile':
          navigation.navigate('Profile');
          break;
        default:
          break;
      }
    }
  }, [navigation]);

  const handleTaskToggle = async (taskId: string | number) => {
    const numericId = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId;
    if (!completedTasks.includes(numericId)) {
      setCompletedTasks(prev => [...prev, numericId]);
      setLastXpGain(5);
      setShowXpPopup(true);
      await awardXp(5);
    }
  };

  const completedCount = displayTasks.filter(
    (t) => t.completed || completedTasks.includes(typeof t.id === 'string' ? parseInt(t.id, 10) : t.id as number)
  ).length;
  
  const progressPercent = displayTasks.length > 0 
    ? Math.round((completedCount / displayTasks.length) * 100) 
    : 0;

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'work': return '#3b82f6';
      case 'health': return '#10b981';
      case 'fitness': return '#f59e0b';
      case 'personal': return '#8b5cf6';
      default: return '#8b5cf6';
    }
  };

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
                    onPress={() => handleNavigate('notifications')}
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

            <View style={styles.content}>
              {/* ============ AI HERO CARD - Main CTA ============ */}
              <Pressable
                onPress={briefing.startBriefing}
                style={({ pressed }) => [styles.heroCard, pressed && styles.cardPressed]}
              >
                <LinearGradient
                  colors={['#7c3aed', '#a855f7', '#ec4899']}
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
                    <Text style={styles.heroTitle}>Your Daily Mission</Text>
                    <Text style={styles.heroSubtitle}>
                      {displayTasks.length} tasks planned • {todayStats.xp || 0} XP to earn
                    </Text>
                    <View style={styles.heroCta}>
                      <Text style={styles.heroCtaText}>Start Briefing</Text>
                      <Play color="#7c3aed" size={16} fill="#7c3aed" />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* ============ TODAY'S TASKS ============ */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.progressRing}>
                    <Text style={styles.progressRingText}>{progressPercent}%</Text>
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Today's Focus</Text>
                    <Text style={styles.sectionSubtitle}>{completedCount} of {displayTasks.length} completed</Text>
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

              {/* Task List */}
              {displayTasks.length > 0 ? (
                <View style={styles.taskList}>
                  {displayTasks.slice(0, 4).map((task, index) => {
                    const numericId = typeof task.id === 'string' ? parseInt(task.id, 10) : task.id as number;
                    const isCompleted = task.completed || completedTasks.includes(numericId);
                    const isNextUp = !isCompleted && index === 0;
                    const categoryColor = getCategoryColor(task.category || 'personal');

                    return (
                      <Pressable
                        key={task.id}
                        onPress={() => handleNavigate('plan')}
                        style={({ pressed }) => [
                          styles.taskCard,
                          isNextUp && styles.taskCardActive,
                          isCompleted && styles.taskCardCompleted,
                          pressed && styles.cardPressed,
                        ]}
                      >
                        <View style={styles.taskRow}>
                          <Pressable
                            onPress={() => !isCompleted && handleTaskToggle(task.id)}
                            style={[
                              styles.taskCheckbox,
                              isNextUp && styles.taskCheckboxActive,
                              isCompleted && styles.taskCheckboxCompleted,
                            ]}
                          >
                            {isCompleted && <Check color="#fff" size={14} strokeWidth={3} />}
                          </Pressable>
                          <View style={styles.taskContent}>
                            <Text style={[
                              styles.taskTitle,
                              isCompleted && styles.taskTitleCompleted,
                            ]}>
                              {task.title}
                            </Text>
                            <View style={styles.taskMeta}>
                              <Text style={styles.taskTime}>
                                {task.duration ? `${task.duration}m` : '30m'}
                              </Text>
                              <View style={styles.taskDot} />
                              <Text style={[styles.taskCategory, { color: categoryColor }]}>
                                {task.category || 'Personal'}
                              </Text>
                            </View>
                          </View>
                          {isNextUp && !isCompleted && (
                            <LinearGradient
                              colors={['#7c3aed', '#a855f7']}
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
                <View style={styles.emptyTasks}>
                  <Text style={styles.emptyTasksText}>No tasks for today. Add your first one!</Text>
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
    </View>
  );
}

export default HubScreen;
