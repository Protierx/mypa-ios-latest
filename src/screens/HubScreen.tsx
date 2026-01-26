import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Calendar,
  Inbox,
  Trophy,
  Clock,
  Wallet,
  Sparkles,
  ChevronRight,
  Zap,
  Sun,
  Moon,
  CloudSun,
  Target,
  Flame,
  X,
  Star,
  Mic,
  ArrowUpRight,
  SkipForward,
  Brain,
  Rocket,
  BarChart3,
  Dumbbell,
  Phone,
  Sunrise,
  Hand,
  Plus,
  Play,
  Check,
  TrendingUp,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HubScreenProps {
  onNavigate?: (screen: string) => void;
  onVoiceClick?: () => void;
  navigation?: any;
}

interface BriefingItem {
  icon: React.ComponentType<any>;
  text: string;
  delay: number;
}

export function HubScreen({ onNavigate, onVoiceClick, navigation }: HubScreenProps) {
  const [greeting, setGreeting] = useState({ text: '', icon: Sun, period: 'day', timeOfDay: 'morning' });
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingStep, setBriefingStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [lastXpGain, setLastXpGain] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);

  const briefingTimer = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const xpPopupAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const orbBreathAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([...Array(5)].map(() => new Animated.Value(8))).current;
  const insightFadeAnim = useRef(new Animated.Value(1)).current;
  const briefingSlideAnim = useRef(new Animated.Value(0)).current;
  const gradientShiftAnim = useRef(new Animated.Value(0)).current;

  // Navigation helper
  const handleNavigate = (screen: string) => {
    if (onNavigate) {
      onNavigate(screen);
    } else if (navigation) {
      // Map screen names to navigation routes
      const routeMap: { [key: string]: string } = {
        'inbox': 'Inbox',
        'profile': 'Profile',
        'streak': 'Streak',
        'level': 'Level',
        'plan': 'Plan',
        'sort': 'Sort',
        'challenges': 'Challenges',
        'wallet': 'Wallet',
        'reset': 'Reset',
      };
      const route = routeMap[screen] || screen;
      navigation.navigate(route);
    }
  };

  // Briefing items - needs to be created after greeting is set
  const getBriefingItems = (): BriefingItem[] => [
    { icon: Hand, text: greeting.text + "! I'm MYPA, your AI life organizer. Let me brief you.", delay: 2500 },
    { icon: BarChart3, text: 'You have 3 tasks remaining today, with 2 marked priority. Very achievable!', delay: 3000 },
    { icon: Clock, text: "Your peak focus window is 9-11am. I've scheduled your hardest tasks then.", delay: 2800 },
    { icon: Target, text: 'Next up: "Review Q1 metrics" at 5PM. You usually finish these in 15 mins.', delay: 2800 },
    { icon: TrendingUp, text: "Exciting! You're 67% above last week. Your consistency is remarkable!", delay: 2500 },
    { icon: Flame, text: 'Your 7-day streak gives you 1.5x XP multiplier. Push to 14 days!', delay: 2300 },
    { icon: Rocket, text: "With your pace, you'll hit 85% completion. Ready to make it 100%?", delay: 2500 },
  ];

  // Rotating insights
  const insights = [
    { icon: Target, text: "Peak focus hours: 9-11am", color: 'blue' },
    { icon: Zap, text: "You're 67% more productive today", color: 'emerald' },
    { icon: Flame, text: '7-day streak active!', color: 'orange' },
  ];

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load AsyncStorage data
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem('hubData');
        if (stored) {
          const data = JSON.parse(stored);
          setXpEarned(data.xpEarned || 0);
        }
      } catch (e) {
        console.error('Error loading hub data:', e);
      }
    };
    loadData();
  }, []);

  // Dynamic greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ text: 'Good morning', icon: Sun, period: 'morning', timeOfDay: 'morning' });
    } else if (hour < 17) {
      setGreeting({ text: 'Good afternoon', icon: CloudSun, period: 'afternoon', timeOfDay: 'afternoon' });
    } else if (hour < 21) {
      setGreeting({ text: 'Good evening', icon: Sunrise, period: 'evening', timeOfDay: 'evening' });
    } else {
      setGreeting({ text: 'Good night', icon: Moon, period: 'night', timeOfDay: 'night' });
    }
  }, []);

  // Rotating insights animation
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(insightFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(insightFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setActiveInsightIndex(prev => (prev + 1) % insights.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Float animation
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    floatAnimation.start();
    return () => floatAnimation.stop();
  }, []);

  // Pulse glow animation
  useEffect(() => {
    const pulseAnimation = Animated.loop(
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
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  // Orb breathe animation
  useEffect(() => {
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(orbBreathAnim, {
          toValue: 1.03,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbBreathAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    breatheAnimation.start();
    return () => breatheAnimation.stop();
  }, []);

  // Shimmer animation
  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, []);

  // Waveform animation for speaking
  useEffect(() => {
    if (isSpeaking) {
      const animations = waveAnims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 24,
              duration: 250,
              delay: i * 100,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 8,
              duration: 250,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        )
      );
      animations.forEach(a => a.start());
      return () => animations.forEach(a => a.stop());
    } else {
      waveAnims.forEach(anim => anim.setValue(8));
    }
  }, [isSpeaking]);

  // XP popup animation
  useEffect(() => {
    if (showXpPopup) {
      xpPopupAnim.setValue(0);
      Animated.sequence([
        Animated.timing(xpPopupAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(xpPopupAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => setShowXpPopup(false));
    }
  }, [showXpPopup]);

  const startBriefing = () => {
    const briefingItems = getBriefingItems();
    setShowBriefing(true);
    setBriefingStep(0);
    setIsSpeaking(true);
    playBriefingSequence(0, briefingItems);

    // Use expo-speech
    Speech.speak(briefingItems[0].text, {
      rate: 0.95,
      pitch: 1,
      onDone: () => {},
      onError: (e) => console.log('Speech error:', e),
    });
  };

  const playBriefingSequence = (step: number, briefingItems: BriefingItem[]) => {
    if (step >= briefingItems.length) {
      setIsSpeaking(false);
      const bonusXp = 10;
      awardXp(bonusXp);
      return;
    }
    setBriefingStep(step);
    setIsSpeaking(true);

    Animated.spring(briefingSlideAnim, {
      toValue: step,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();

    briefingTimer.current = setTimeout(() => {
      if (step + 1 < briefingItems.length) {
        Speech.speak(briefingItems[step + 1].text, {
          rate: 0.95,
          pitch: 1,
        });
      }
      playBriefingSequence(step + 1, briefingItems);
    }, briefingItems[step].delay);
  };

  const closeBriefing = () => {
    setShowBriefing(false);
    setBriefingStep(0);
    setIsSpeaking(false);
    if (briefingTimer.current) clearTimeout(briefingTimer.current);
    Speech.stop();
  };

  const awardXp = async (amount: number) => {
    setLastXpGain(amount);
    setShowXpPopup(true);
    const newXp = xpEarned + amount;
    setXpEarned(newXp);
    try {
      await AsyncStorage.setItem('hubData', JSON.stringify({ xpEarned: newXp }));
    } catch (e) {
      console.error('Error saving XP:', e);
    }
  };

  // Today's data
  const today = {
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    userName: 'Alex',
    streak: 7,
    level: 12,
    xp: 2460 + xpEarned,
    xpToNext: 340 - xpEarned,
    tasksCompleted: 4 + completedTasks.length,
    totalTasks: 7,
    timeSaved: 42,
    focusMinutes: 180,
  };

  // Priority tasks
  const tasks = [
    { id: 1, title: 'Review Q1 metrics', time: '5:00 PM', icon: BarChart3, category: 'Work', duration: '15m', priority: true },
    { id: 2, title: 'Gym Session', time: '6:00 PM', icon: Dumbbell, category: 'Health', duration: '1h', priority: true },
    { id: 3, title: 'Call Mom', time: 'Evening', icon: Phone, category: 'Personal', duration: '15m', priority: false },
  ];

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'Work':
        return { bg: '#3b82f6', light: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'Health':
        return { bg: '#10b981', light: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      default:
        return { bg: '#8b5cf6', light: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' };
    }
  };

  const quickActions = [
    { icon: Calendar, label: 'Plan', color: ['#3b82f6', '#06b6d4'] as [string, string], screen: 'plan' },
    { icon: Brain, label: 'Dump', color: ['#374151', '#111827'] as [string, string], screen: 'sort' },
    { icon: Trophy, label: 'Compete', color: ['#f97316', '#f59e0b'] as [string, string], screen: 'challenges' },
    { icon: Wallet, label: 'Wallet', color: ['#10b981', '#14b8a6'] as [string, string], screen: 'wallet' },
  ];

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const briefingItems = getBriefingItems();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8fafc', '#ffffff', '#f8fafc']}
        style={StyleSheet.absoluteFillObject}
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
              opacity: xpPopupAnim,
              transform: [
                {
                  translateY: xpPopupAnim.interpolate({
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

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingText}>{greeting.text}</Text>
              <Text style={styles.userName}>{today.userName}</Text>
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
                  <Text style={styles.profileInitial}>{today.userName[0]}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          <View style={styles.content}>
            {/* MYPA AI Briefing Card */}
            <Pressable
              onPress={startBriefing}
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
                  <Animated.View style={[styles.orbContainer, { transform: [{ scale: pulseAnim }] }]}>
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
              {/* Streak Card */}
              <Pressable
                onPress={() => handleNavigate('streak')}
                style={({ pressed }) => [
                  styles.statCard,
                  styles.streakCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <LinearGradient
                  colors={['#f97316', '#f59e0b']}
                  style={styles.statIcon}
                >
                  <Flame color="#fff" size={20} />
                </LinearGradient>
                <View>
                  <Text style={styles.statValue}>{today.streak} days</Text>
                  <Text style={styles.streakBoost}>1.5x XP boost</Text>
                </View>
              </Pressable>

              {/* Level Card */}
              <Pressable
                onPress={() => handleNavigate('level')}
                style={({ pressed }) => [
                  styles.statCard,
                  styles.levelCard,
                  pressed && styles.cardPressed,
                ]}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#9333ea']}
                  style={styles.statIcon}
                >
                  <Star color="#fff" size={20} />
                </LinearGradient>
                <View>
                  <Text style={styles.statValue}>Level {today.level}</Text>
                  <Text style={styles.levelXp}>{today.xpToNext > 0 ? today.xpToNext : 0} XP to next</Text>
                </View>
              </Pressable>
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
                    <Text style={styles.sectionSubtitle}>{completedTasks.length}/{tasks.length} completed</Text>
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
                      { width: `${(completedTasks.length / tasks.length) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round((completedTasks.length / tasks.length) * 100)}%
                </Text>
              </View>

              {/* Task List */}
              <View style={styles.taskList}>
                {tasks.map((task, index) => {
                  const isCompleted = completedTasks.includes(task.id);
                  const isNextUp = !isCompleted && !tasks.slice(0, index).some(t => !completedTasks.includes(t.id));
                  const catStyle = getCategoryStyle(task.category);
                  const TaskIcon = task.icon;

                  return (
                    <Pressable
                      key={task.id}
                      onPress={() => !isCompleted && handleNavigate('plan')}
                      style={({ pressed }) => [
                        styles.taskCard,
                        isCompleted && styles.taskCompleted,
                        isNextUp && { backgroundColor: catStyle.light, borderColor: catStyle.border, borderWidth: 1 },
                        !isCompleted && !isNextUp && styles.taskDefault,
                        pressed && !isCompleted && styles.cardPressed,
                      ]}
                    >
                      {/* Category Accent Bar */}
                      <View
                        style={[
                          styles.taskAccent,
                          { backgroundColor: isCompleted ? '#cbd5e1' : catStyle.bg },
                        ]}
                      />

                      {/* Next Up Badge */}
                      {isNextUp && (
                        <View style={[styles.nextBadge, { backgroundColor: catStyle.bg }]}>
                          <Text style={styles.nextBadgeText}>Next</Text>
                        </View>
                      )}

                      <View style={styles.taskContent}>
                        {/* Time */}
                        <View style={styles.taskTimeContainer}>
                          <Text
                            style={[
                              styles.taskTime,
                              isCompleted && styles.taskTimeCompleted,
                              isNextUp && { color: catStyle.text },
                            ]}
                          >
                            {task.time.replace(':00', '').replace(' ', '')}
                          </Text>
                        </View>

                        {/* Checkbox */}
                        <Pressable
                          onPress={() => {
                            if (isCompleted) {
                              setCompletedTasks(prev => prev.filter(id => id !== task.id));
                            } else {
                              setCompletedTasks(prev => [...prev, task.id]);
                              awardXp(5);
                            }
                          }}
                          style={[
                            styles.checkbox,
                            isCompleted && styles.checkboxCompleted,
                            !isCompleted && isNextUp && { borderColor: catStyle.text },
                          ]}
                        >
                          {isCompleted && <Check color="#fff" size={14} strokeWidth={3} />}
                        </Pressable>

                        {/* Task Info */}
                        <View style={styles.taskInfo}>
                          <View style={styles.taskTitleRow}>
                            <Text
                              style={[
                                styles.taskTitle,
                                isCompleted && styles.taskTitleCompleted,
                              ]}
                              numberOfLines={1}
                            >
                              {task.title}
                            </Text>
                            {task.priority && !isCompleted && (
                              <View style={styles.priorityBadge}>
                                <Text style={styles.priorityText}>!</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.taskMeta}>
                            <Clock color="#94a3b8" size={12} />
                            <Text style={styles.taskDuration}>{task.duration}</Text>
                            <Text style={styles.taskDot}>·</Text>
                            <Text style={[styles.taskCategory, { color: catStyle.text }]}>
                              {task.category}
                            </Text>
                          </View>
                        </View>

                        {/* Action Button */}
                        {!isCompleted && (
                          isNextUp ? (
                            <View style={[styles.taskPlayButton, { backgroundColor: catStyle.bg }]}>
                              <Play color="#fff" size={14} style={{ marginLeft: 2 }} fill="#fff" />
                            </View>
                          ) : (
                            <ChevronRight color="#cbd5e1" size={20} />
                          )
                        )}
                      </View>
                    </Pressable>
                  );
                })}
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
            <View style={styles.section}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                {quickActions.map((action, idx) => {
                  const ActionIcon = action.icon;
                  return (
                    <Pressable
                      key={action.label}
                      onPress={() => handleNavigate(action.screen)}
                      style={({ pressed }) => [
                        styles.quickActionCard,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <BlurView intensity={40} tint="light" style={styles.quickActionBlur}>
                        <LinearGradient
                          colors={action.color}
                          style={styles.quickActionIcon}
                        >
                          <ActionIcon color="#fff" size={20} />
                        </LinearGradient>
                        <Text style={styles.quickActionLabel}>{action.label}</Text>
                      </BlurView>
                    </Pressable>
                  );
                })}
              </View>
            </View>

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
                    { transform: [{ translateX: shimmerTranslate }] },
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
      <Modal
        visible={showBriefing}
        animationType="fade"
        transparent={false}
        onRequestClose={closeBriefing}
      >
        <View style={styles.briefingModal}>
          <LinearGradient
            colors={['#1e1b4b', '#0f0a1e', '#030014']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Close Button */}
          <SafeAreaView style={styles.briefingModalSafe} edges={['top']}>
            <View style={styles.briefingModalHeader}>
              <Pressable
                onPress={() => {
                  if (briefingTimer.current) clearTimeout(briefingTimer.current);
                  if (briefingStep < briefingItems.length - 1) {
                    Speech.stop();
                    playBriefingSequence(briefingItems.length - 1, briefingItems);
                  }
                }}
                style={({ pressed }) => [
                  styles.briefingSkipButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <BlurView intensity={20} tint="dark" style={styles.briefingButtonBlur}>
                  <SkipForward color="rgba(255,255,255,0.8)" size={16} />
                  <Text style={styles.briefingSkipText}>Skip</Text>
                </BlurView>
              </Pressable>

              <Pressable
                onPress={closeBriefing}
                style={({ pressed }) => [
                  styles.briefingCloseButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <BlurView intensity={20} tint="dark" style={styles.briefingCloseBlur}>
                  <X color="rgba(255,255,255,0.8)" size={20} />
                </BlurView>
              </Pressable>
            </View>
          </SafeAreaView>

          <View style={styles.briefingModalContent}>
            {/* Speaking Orb */}
            <View style={styles.speakingOrbContainer}>
              {isSpeaking && (
                <>
                  <Animated.View style={[styles.orbPing, { opacity: 0.1 }]} />
                  <Animated.View style={[styles.orbPulse, { opacity: 0.2 }]} />
                </>
              )}
              <Animated.View
                style={[
                  styles.speakingOrb,
                  {
                    transform: [{ scale: isSpeaking ? 1.05 : orbBreathAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#a78bfa', '#8b5cf6', '#6366f1']}
                  style={styles.speakingOrbGradient}
                >
                  <View style={styles.speakingOrbShine} />
                  {isSpeaking ? (
                    <View style={styles.waveformContainer}>
                      {waveAnims.map((anim, i) => (
                        <Animated.View
                          key={i}
                          style={[
                            styles.waveBar,
                            { height: anim },
                          ]}
                        />
                      ))}
                    </View>
                  ) : (
                    <Sparkles color="#fff" size={48} />
                  )}
                </LinearGradient>
              </Animated.View>
            </View>

            <Text style={styles.briefingLabel}>AI Life Organizer</Text>

            {/* Briefing Messages */}
            <View style={styles.briefingMessages}>
              {briefingItems.slice(Math.max(0, briefingStep - 1), briefingStep + 1).map((item, index) => {
                const actualIndex = Math.max(0, briefingStep - 1) + index;
                const isCurrent = actualIndex === briefingStep;
                const ItemIcon = item.icon;

                return (
                  <Animated.View
                    key={actualIndex}
                    style={[
                      styles.briefingMessage,
                      isCurrent && styles.briefingMessageActive,
                      !isCurrent && styles.briefingMessageInactive,
                    ]}
                  >
                    <BlurView intensity={30} tint="dark" style={styles.briefingMessageBlur}>
                      <View style={styles.briefingMessageIcon}>
                        <ItemIcon color="#fff" size={20} />
                      </View>
                      <Text style={styles.briefingMessageText}>{item.text}</Text>
                    </BlurView>
                  </Animated.View>
                );
              })}
            </View>

            {/* Progress Dots */}
            <View style={styles.briefingProgress}>
              {briefingItems.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.briefingDot,
                    index <= briefingStep ? styles.briefingDotActive : styles.briefingDotInactive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Bottom Button */}
          <SafeAreaView style={styles.briefingModalBottom} edges={['bottom']}>
            <Pressable
              onPress={closeBriefing}
              style={({ pressed }) => [
                styles.briefingDoneButton,
                pressed && styles.buttonPressed,
              ]}
            >
              {briefingStep >= briefingItems.length - 1 ? (
                <View style={styles.briefingDoneContent}>
                  <Rocket color="#1e293b" size={20} />
                  <Text style={styles.briefingDoneText}>Let's Crush Today!</Text>
                </View>
              ) : (
                <Text style={styles.briefingDoneText}>Close Briefing</Text>
              )}
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  ambientContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  ambientBlob1: {
    top: 80,
    right: -80,
    width: 256,
    height: 256,
    backgroundColor: 'rgba(221, 214, 254, 0.3)',
  },
  ambientBlob2: {
    top: 240,
    left: -80,
    width: 192,
    height: 192,
    backgroundColor: 'rgba(191, 219, 254, 0.3)',
  },
  ambientBlob3: {
    bottom: 160,
    right: 40,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(253, 230, 138, 0.3)',
  },
  xpPopup: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    zIndex: 50,
  },
  xpPopupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  xpPopupText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  greetingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  briefingCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  briefingOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  briefingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  orbContainer: {
    position: 'relative',
  },
  orbRipple: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
  },
  orb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingTextContainer: {
    flex: 1,
  },
  briefingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  briefingTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
  },
  aiBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ddd6fe',
  },
  briefingSubtitle: {
    color: 'rgba(221, 214, 254, 0.8)',
    fontSize: 12,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
  },
  streakCard: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.3)',
  },
  levelCard: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  streakBoost: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ea580c',
  },
  levelXp: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7c3aed',
  },
  section: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7c3aed',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  taskList: {
    gap: 10,
  },
  taskCard: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  taskCompleted: {
    backgroundColor: '#f8fafc',
    opacity: 0.6,
  },
  taskDefault: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  taskAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  nextBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  nextBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 16,
    gap: 12,
  },
  taskTimeContainer: {
    width: 48,
    alignItems: 'center',
  },
  taskTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  taskTimeCompleted: {
    color: '#94a3b8',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  taskInfo: {
    flex: 1,
    minWidth: 0,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  priorityBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  taskDuration: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  taskDot: {
    color: '#cbd5e1',
  },
  taskCategory: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addTaskIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  quickActionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionBlur: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  askMypaCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  askMypaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  askMypaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  askMypaTextContainer: {
    flex: 1,
  },
  askMypaTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  askMypaSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  resetButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  resetLink: {
    color: '#8b5cf6',
    fontWeight: '500',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },

  // Briefing Modal Styles
  briefingModal: {
    flex: 1,
  },
  briefingModalSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  briefingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  briefingSkipButton: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  briefingButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  briefingSkipText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  briefingCloseButton: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  briefingCloseBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  briefingModalContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  speakingOrbContainer: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbPing: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#8b5cf6',
  },
  orbPulse: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#8b5cf6',
  },
  speakingOrb: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
  },
  speakingOrbGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakingOrbShine: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    width: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  briefingLabel: {
    color: '#c4b5fd',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 24,
  },
  briefingMessages: {
    width: '100%',
    minHeight: 160,
  },
  briefingMessage: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  briefingMessageActive: {
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.5)',
  },
  briefingMessageInactive: {
    opacity: 0.4,
    transform: [{ scale: 0.95 }],
  },
  briefingMessageBlur: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  briefingMessageIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingMessageText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  briefingProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  briefingDot: {
    height: 4,
    borderRadius: 2,
  },
  briefingDotActive: {
    width: 16,
    backgroundColor: '#a78bfa',
  },
  briefingDotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  briefingModalBottom: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  briefingDoneButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingDoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  briefingDoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
});

export default HubScreen;
