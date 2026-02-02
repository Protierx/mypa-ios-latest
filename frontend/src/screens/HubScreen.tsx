import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Calendar,
  Inbox,
  Trophy,
  Wallet,
  Sparkles,
  ChevronRight,
  Target,
  Flame,
  X,
  Star,
  Mic,
  Brain,
  Play,
  Pause,
  Check,
  ArrowRight,
  Plus,
  MessageCircle,
  RotateCcw,
} from 'lucide-react-native';
import { getVoiceAssistant } from '../services/voiceAssistant';
import { useAuth } from '../contexts/AuthContext';
import { tasksApi } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// DESIGN SYSTEM
// Philosophy: Light, premium, fun — solid surfaces, no blur/glass
// ============================================================================
const COLORS = {
  // Backgrounds - Light premium
  background: '#F6F7FB',
  card: '#F0F2FA',
  card2: '#E9ECF8',
  
  // MYPA Brand
  brand: '#5B5AF7',
  brandTint: '#ECECFF',
  
  // Feature Colors
  plan: '#2F6FED',
  planTint: '#EAF1FF',
  
  dump: '#7C4DFF',
  dumpTint: '#F1ECFF',
  
  compete: '#F4A72C',
  competeTint: '#FFF3DF',
  
  rewards: '#22BFA2',
  rewardsTint: '#E7FAF6',
  
  // Text
  text: '#10162A',
  textSecondary: '#5B647A',
  textWhite: '#FFFFFF',
  
  // Status colors
  warmAccent: '#EF4444',
  success: '#22C55E',
  successTint: '#E7FAF0',
  warning: '#FBBF24',
  danger: '#EF4444',
  
  // Structure
  border: '#E2E6F5',
  shadow: 'rgba(16,22,42,0.06)',
};

const SHADOWS = {
  card: {
    shadowColor: '#10162A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  subtle: {
    shadowColor: '#10162A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 56,
};

const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};

// ============================================================================
// TYPES
// ============================================================================
interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  category: string;
  time?: string;
  date: string;
}

interface HubScreenProps {
  navigation: any;
}

// ============================================================================
// HUB SCREEN — Investor-Ready Layout
// 
// Purpose: The daily emotional entry point into the user's life.
// Goal: User decides what to do in under 3 seconds.
// Feel: Clean, modern, high-intention — premium but approachable.
// ============================================================================
const HubScreen: React.FC<HubScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userStats, setUserStats] = useState({ level: 3, xp: 450, streak: 7 });
  const [refreshing, setRefreshing] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingStep, setBriefingStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Press animation for Daily Briefing
  const briefingScale = useRef(new Animated.Value(1)).current;
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;
  
  // Derived state
  const firstName = user?.name?.split(' ')[0] || 'there';
  const todaysTasks = tasks.filter(t => t.date === today);
  const pendingTasks = todaysTasks.filter(t => !t.completed);
  const completedCount = todaysTasks.filter(t => t.completed).length;
  const totalTasks = todaysTasks.length;
  const progress = totalTasks > 0 ? completedCount / totalTasks : 0;
  
  // Time-aware greeting with emotional tone
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };
  
  // Get the ONE thing to focus on
  const getPrimaryFocus = (): Task | null => {
    const sorted = [...pendingTasks].sort((a, b) => {
      if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
      if (b.priority === 'HIGH' && a.priority !== 'HIGH') return 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      return 0;
    });
    return sorted[0] || null;
  };
  
  const primaryFocus = getPrimaryFocus();
  
  // Briefing content - warm, conversational, supportive
  const briefingItems = [
    {
      title: `${getGreeting()}, ${firstName}`,
      body: pendingTasks.length > 0
        ? `You have ${pendingTasks.length} thing${pendingTasks.length !== 1 ? 's' : ''} to move forward today.`
        : "Your day is yours. What would feel meaningful right now?",
    },
    {
      title: 'Your momentum',
      body: completedCount > 0
        ? `You've already completed ${completedCount} task${completedCount !== 1 ? 's' : ''}. ${pendingTasks.length > 0 ? 'You\'re in flow.' : 'Well done.'}`
        : "One small action can shift your entire day.",
    },
    {
      title: 'MYPA suggests',
      body: primaryFocus
        ? `Start with "${primaryFocus.title}". It's what matters most right now.`
        : "Take a breath. Then choose one thing to focus on.",
    },
  ];
  
  // ============================================================================
  // DATA & HANDLERS
  // ============================================================================
  const fetchData = useCallback(async () => {
    try {
      const response = await tasksApi.getAll();
      if (response.success && response.data) {
        setTasks(response.data);
      }
      const statsJson = await AsyncStorage.getItem('userStats');
      if (statsJson) setUserStats(JSON.parse(statsJson));
    } catch (error) {
      console.log('Error fetching data:', error);
    }
  }, []);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);
  
  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await tasksApi.complete(taskId);
      if (response.success) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
      }
    } catch (error) {
      console.log('Error completing task:', error);
    }
  };
  
  const handlePlayBriefing = async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    const item = briefingItems[briefingStep];
    await Speech.speak(`${item.title}. ${item.body}`, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };
  
  const handleNextBriefing = () => {
    Speech.stop();
    setIsSpeaking(false);
    if (briefingStep < briefingItems.length - 1) {
      setBriefingStep(briefingStep + 1);
    } else {
      setShowBriefing(false);
      setBriefingStep(0);
    }
  };
  
  const handleCloseBriefing = () => {
    Speech.stop();
    setIsSpeaking(false);
    setShowBriefing(false);
    setBriefingStep(0);
  };
  
  const handleVoiceAssistant = async () => {
    try {
      const assistant = getVoiceAssistant();
      await assistant.start();
    } catch (error) {
      console.log('Voice assistant error:', error);
    }
  };
  
  const handleBriefingPressIn = () => {
    Animated.spring(briefingScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };
  
  const handleBriefingPressOut = () => {
    Animated.spring(briefingScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };
  
  // ============================================================================
  // ANIMATIONS
  // ============================================================================
  useEffect(() => {
    // Entrance fade
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    // Subtle breathing animation for MYPA presence
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.01,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.brand}
              />
            }
          >
            
            {/* ================================================ */}
            {/* 1. HEADER AREA */}
            {/* Greeting + tiny status badges inline */}
            {/* ================================================ */}
            <View style={styles.headerSection}>
              <View style={styles.headerTop}>
                <Pressable
                  style={styles.identityRow}
                  onPress={() => navigation.navigate('Profile')}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarLetter}>
                      {firstName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.greetingBlock}>
                    <Text style={styles.greetingText}>{getGreeting()},</Text>
                    <Text style={styles.nameText}>{firstName}</Text>
                  </View>
                </Pressable>
                
                {/* Right side: tiny status badges + inbox */}
                <View style={styles.headerRight}>
                  <Pressable
                    style={styles.tinyBadge}
                    onPress={() => navigation.navigate('Streak')}
                  >
                    <Flame size={12} color={COLORS.compete} strokeWidth={2.5} />
                    <Text style={styles.tinyBadgeText}>{userStats.streak}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.tinyBadge}
                    onPress={() => navigation.navigate('Level')}
                  >
                    <Star size={12} color={COLORS.brand} strokeWidth={2.5} />
                    <Text style={styles.tinyBadgeText}>{userStats.level}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.inboxButton}
                    onPress={() => navigation.navigate('Inbox')}
                  >
                    <Inbox size={20} color={COLORS.brand} />
                  </Pressable>
                </View>
              </View>
            </View>
            
            {/* ================================================ */}
            {/* 2. DAILY BRIEFING HERO (PRIMARY CTA) */}
            {/* ================================================ */}
            <Animated.View style={[styles.briefingWrapper, { transform: [{ scale: briefingScale }] }]}>
              <Pressable
                style={styles.briefingCard}
                onPress={() => setShowBriefing(true)}
                onPressIn={handleBriefingPressIn}
                onPressOut={handleBriefingPressOut}
              >
                <LinearGradient
                  colors={['#5B5AF7', '#2F6FED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.briefingGradient}
                >
                  <View style={styles.briefingIconWrap}>
                    <Brain size={22} color={COLORS.textWhite} strokeWidth={2} />
                  </View>
                  <View style={styles.briefingContent}>
                    <Text style={styles.briefingTitle}>Your Daily Briefing</Text>
                    <Text style={styles.briefingMeta}>
                      {pendingTasks.length > 0
                        ? `${pendingTasks.length} pending · ${completedCount} complete`
                        : 'Your day is open'}
                    </Text>
                  </View>
                  <View style={styles.briefingPlayButton}>
                    <Play size={16} color={COLORS.textWhite} strokeWidth={2.5} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
            
            {/* ================================================ */}
            {/* 3. TODAY'S FOCUS + ADD TASK */}
            {/* ================================================ */}
            <View style={styles.focusSection}>
              <View style={styles.focusHeader}>
                <Text style={styles.sectionLabel}>TODAY'S FOCUS</Text>
                <Pressable
                  style={styles.fullPlanLink}
                  onPress={() => navigation.navigate('Plan')}
                >
                  <Text style={styles.fullPlanText}>Full Plan</Text>
                  <ChevronRight size={14} color={COLORS.brand} />
                </Pressable>
              </View>
              
              {/* Progress bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {completedCount}/{totalTasks} tasks
                </Text>
              </View>
              
              {primaryFocus ? (
                <View style={styles.focusCard}>
                  <Pressable
                    style={styles.focusMainTap}
                    onPress={() => navigation.navigate('Plan')}
                  >
                    {primaryFocus.priority === 'HIGH' && (
                      <View style={styles.priorityIndicator} />
                    )}
                    <View style={styles.focusTextBlock}>
                      {primaryFocus.time && (
                        <Text style={styles.focusTime}>{primaryFocus.time}</Text>
                      )}
                      <Text style={styles.focusTitle} numberOfLines={2}>
                        {primaryFocus.title}
                      </Text>
                      <Text style={styles.focusCategory}>{primaryFocus.category}</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    style={styles.completeButton}
                    onPress={() => handleCompleteTask(primaryFocus.id)}
                  >
                    <Check size={22} color={COLORS.success} strokeWidth={2.5} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.noTasksCard}>
                  <Target size={20} color={COLORS.textSecondary} />
                  <Text style={styles.noTasksText}>No tasks yet for today</Text>
                </View>
              )}
              
              {/* Add Task Button - Strong CTA */}
              <Pressable
                style={styles.addTaskButton}
                onPress={() => navigation.navigate('Plan')}
              >
                <Plus size={20} color={COLORS.textWhite} strokeWidth={2.5} />
                <Text style={styles.addTaskText}>Add task</Text>
              </Pressable>
            </View>
            
            {/* ================================================ */}
            {/* 4. QUICK ACTIONS (2x2 GRID) */}
            {/* ================================================ */}
            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
              
              <View style={styles.actionsGrid}>
                {/* PLAN */}
                <Pressable
                  style={[styles.actionTile, styles.actionTilePlan]}
                  onPress={() => navigation.navigate('Plan')}
                >
                  <View style={styles.actionIconWrapPlan}>
                    <Calendar size={32} color={COLORS.plan} strokeWidth={1.75} />
                  </View>
                  <View>
                    <Text style={[styles.actionTileLabel, styles.actionLabelPlan]}>Plan</Text>
                    <Text style={styles.actionTileSubtitle}>Be intentional</Text>
                  </View>
                </Pressable>
                
                {/* DUMP */}
                <Pressable
                  style={[styles.actionTile, styles.actionTileDump]}
                  onPress={() => navigation.navigate('DailyBriefing')}
                >
                  <View style={styles.actionIconWrapDump}>
                    <MessageCircle size={32} color={COLORS.dump} strokeWidth={1.75} />
                  </View>
                  <View>
                    <Text style={[styles.actionTileLabel, styles.actionLabelDump]}>Dump</Text>
                    <Text style={styles.actionTileSubtitle}>Clear your mind</Text>
                  </View>
                </Pressable>
                
                {/* COMPETE */}
                <Pressable
                  style={[styles.actionTile, styles.actionTileCompete]}
                  onPress={() => navigation.navigate('Challenges')}
                >
                  <View style={styles.actionIconWrapCompete}>
                    <Trophy size={32} color={COLORS.compete} strokeWidth={1.75} />
                  </View>
                  <View>
                    <Text style={[styles.actionTileLabel, styles.actionLabelCompete]}>Compete</Text>
                    <Text style={styles.actionTileSubtitle}>Find motivation</Text>
                  </View>
                </Pressable>
                
                {/* WALLET */}
                <Pressable
                  style={[styles.actionTile, styles.actionTileRewards]}
                  onPress={() => navigation.navigate('Wallet')}
                >
                  <View style={styles.actionIconWrapRewards}>
                    <Wallet size={32} color={COLORS.rewards} strokeWidth={1.75} />
                  </View>
                  <View>
                    <Text style={[styles.actionTileLabel, styles.actionLabelRewards]}>Wallet</Text>
                    <Text style={styles.actionTileSubtitle}>See progress</Text>
                  </View>
                </Pressable>
              </View>
            </View>
            
            {/* ================================================ */}
            {/* 5. ASK MYPA ANYTHING */}
            {/* ================================================ */}
            <Pressable
              style={styles.askMYPACard}
              onPress={handleVoiceAssistant}
            >
              <LinearGradient
                colors={['#5B5AF7', '#7C4DFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.askMYPAGradient}
              >
                <View style={styles.askMYPAIconWrap}>
                  <Mic size={22} color={COLORS.textWhite} strokeWidth={2} />
                </View>
                <View style={styles.askMYPAContent}>
                  <Text style={styles.askMYPATitle}>Ask MYPA anything</Text>
                  <Text style={styles.askMYPAHint}>"What should I focus on today?"</Text>
                </View>
                <ArrowRight size={18} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </Pressable>
            
            {/* ================================================ */}
            {/* 6. RESET YOUR DAY */}
            {/* ================================================ */}
            <Pressable
              style={styles.resetLink}
              onPress={() => navigation.navigate('Plan')}
            >
              <RotateCcw size={14} color={COLORS.textSecondary} />
              <Text style={styles.resetText}>Reset your day</Text>
            </Pressable>
            
            {/* Tab bar spacing */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </Animated.View>
        
        {/* ================================================ */}
        {/* BRIEFING MODAL */}
        {/* ================================================ */}
        <Modal
          visible={showBriefing}
          animationType="slide"
          transparent
          onRequestClose={handleCloseBriefing}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalBrainWrap}>
                    <Brain size={18} color={COLORS.brand} strokeWidth={2} />
                  </View>
                  <Text style={styles.modalTitle}>Daily Briefing</Text>
                </View>
                <Pressable
                  style={styles.modalCloseButton}
                  onPress={handleCloseBriefing}
                >
                  <X size={18} color={COLORS.textSecondary} />
                </Pressable>
              </View>
              
              <View style={styles.progressIndicator}>
                {briefingItems.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.progressDot,
                      i === briefingStep && styles.progressDotActive,
                      i < briefingStep && styles.progressDotComplete,
                    ]}
                  />
                ))}
              </View>
              
              <View style={styles.briefingSlide}>
                <Text style={styles.slideTitle}>
                  {briefingItems[briefingStep].title}
                </Text>
                <Text style={styles.slideBody}>
                  {briefingItems[briefingStep].body}
                </Text>
              </View>
              
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.playButton}
                  onPress={handlePlayBriefing}
                >
                  {isSpeaking ? (
                    <Pause size={18} color={COLORS.textSecondary} />
                  ) : (
                    <Play size={18} color={COLORS.textSecondary} />
                  )}
                </Pressable>
                <Pressable
                  style={styles.continueButton}
                  onPress={handleNextBriefing}
                >
                  <Text style={styles.continueButtonText}>
                    {briefingStep < briefingItems.length - 1 ? 'Continue' : 'Done'}
                  </Text>
                  <ChevronRight size={16} color="#FFF" />
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

// ============================================================================
// STYLES — Investor-Ready Layout
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  
  // ==========================================
  // 1. Header Area
  // ==========================================
  headerSection: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    ...SHADOWS.subtle,
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  greetingBlock: {},
  greetingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 1,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tinyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 26,
    paddingHorizontal: 8,
    backgroundColor: COLORS.card,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tinyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  inboxButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brandTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  // ==========================================
  // 2. Daily Briefing Hero
  // ==========================================
  briefingWrapper: {
    marginBottom: 16,
  },
  briefingCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  briefingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 18,
    minHeight: 90,
  },
  briefingIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  briefingContent: {
    flex: 1,
  },
  briefingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  briefingMeta: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  briefingPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // ==========================================
  // 3. Focus Section
  // ==========================================
  focusSection: {
    marginBottom: 18,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  fullPlanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 44,
    paddingHorizontal: 4,
  },
  fullPlanText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.brand,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.brand,
    borderRadius: 999,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  focusCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warmAccent,
    marginBottom: 12,
    ...SHADOWS.subtle,
  },
  focusMainTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: COLORS.warmAccent,
    marginRight: 12,
  },
  focusTextBlock: {
    flex: 1,
  },
  focusTime: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  focusTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
  },
  focusCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  completeButton: {
    width: 56,
    backgroundColor: COLORS.successTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  noTasksCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noTasksText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.md,
    ...SHADOWS.subtle,
  },
  addTaskText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  
  // ==========================================
  // 4. Quick Actions Grid
  // ==========================================
  quickActionsSection: {
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 14,
  },
  actionTile: {
    width: (SCREEN_WIDTH - 48 - 16) / 2,
    height: 160,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  actionTilePlan: {
    backgroundColor: COLORS.planTint,
  },
  actionTileDump: {
    backgroundColor: COLORS.dumpTint,
  },
  actionTileCompete: {
    backgroundColor: COLORS.competeTint,
  },
  actionTileRewards: {
    backgroundColor: COLORS.rewardsTint,
  },
  actionIconWrapPlan: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#D6E6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconWrapDump: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#E3D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconWrapCompete: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFE6B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconWrapRewards: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#C8F5ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTileLabel: {
    fontSize: 19,
    fontWeight: '700',
  },
  actionLabelPlan: {
    color: COLORS.plan,
  },
  actionLabelDump: {
    color: COLORS.dump,
  },
  actionLabelCompete: {
    color: COLORS.compete,
  },
  actionLabelRewards: {
    color: COLORS.rewards,
  },
  actionTileSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  
  // ==========================================
  // 5. Ask MYPA
  // ==========================================
  askMYPACard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 16,
    ...SHADOWS.card,
  },
  askMYPAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 18,
    minHeight: 78,
  },
  askMYPAIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  askMYPAContent: {
    flex: 1,
  },
  askMYPATitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  askMYPAHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginTop: 3,
  },
  
  // ==========================================
  // 6. Reset Link
  // ==========================================
  resetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    marginBottom: 8,
  },
  resetText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  
  // ==========================================
  // Modal
  // ==========================================
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16,22,42,0.5)',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  modalBrainWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.brandTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    width: 28,
    backgroundColor: COLORS.brand,
    borderRadius: 4,
  },
  progressDotComplete: {
    backgroundColor: COLORS.success,
  },
  briefingSlide: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  slideBody: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.card2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.brand,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export { HubScreen };
export default HubScreen;
