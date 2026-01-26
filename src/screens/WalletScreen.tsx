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
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  ChevronRight,
  Flame,
  Share2,
  Trophy,
  Zap,
  Calendar,
  CheckCircle2,
  History,
  X,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WalletScreenProps {
  navigation?: any;
}

export function WalletScreen({ navigation }: WalletScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [showShareModal, setShowShareModal] = useState(false);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnims = useRef<Animated.Value[]>([]).current;
  const chartBarAnims = useRef<Animated.Value[]>([]).current;
  const modalSlideAnim = useRef(new Animated.Value(300)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;

  // Initialize animations for recent savings
  useEffect(() => {
    for (let i = 0; i < 5; i++) {
      if (!slideAnims[i]) {
        slideAnims[i] = new Animated.Value(0);
      }
    }
    // Stagger animation
    slideAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // Initialize chart bar animations
  useEffect(() => {
    for (let i = 0; i < 7; i++) {
      if (!chartBarAnims[i]) {
        chartBarAnims[i] = new Animated.Value(0);
      }
    }
    // Animate bars when week is selected
    if (selectedPeriod === 'week') {
      chartBarAnims.forEach((anim, index) => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 50,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
      });
    }
  }, [selectedPeriod]);

  // Pulse glow animation
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  // Modal animation
  useEffect(() => {
    if (showShareModal) {
      Animated.parallel([
        Animated.timing(modalSlideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalSlideAnim, {
          toValue: 300,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showShareModal]);

  // Navigation helper
  const handleNavigate = (screen: string) => {
    if (!navigation) return;
    const homeStackRoutes: { [key: string]: string } = {
      hub: 'Hub',
      streak: 'Streak',
      challenges: 'Challenges',
      'daily-life-card': 'DailyLifeCard',
    };

    if (homeStackRoutes[screen]) {
      navigation.navigate('Home', { screen: homeStackRoutes[screen] });
    } else if (screen === 'plan') {
      navigation.navigate('Plan');
    } else if (screen === 'circles') {
      navigation.navigate('Circles', { screen: 'CirclesList' });
    } else {
      navigation.navigate(screen);
    }
  };

  // Time stats per period
  const stats = {
    today: { saved: '42m', tasks: 8, streak: 6, efficiency: 87 },
    week: { saved: '2h 40m', tasks: 34, streak: 6, efficiency: 92 },
    month: { saved: '12h 20m', tasks: 142, streak: 6, efficiency: 89 },
  };

  // User wallet data
  const wallet = {
    totalTimeSaved: '48h 32m',
    streak: 6,
    bestStreak: 21,
    tasksCompleted: 342,
    avgDaily: '1h 12m',
  };

  // Recent time savings
  const recentSavings = [
    { id: 1, action: 'Completed Morning Workout early', time: '+15m', when: '2h ago', icon: '🏃' },
    { id: 2, action: 'Batched 3 errands together', time: '+12m', when: '4h ago', icon: '📦' },
    { id: 3, action: 'Auto-rescheduled conflicts', time: '+8m', when: 'Yesterday', icon: '🔄' },
    { id: 4, action: 'Quick meal prep routine', time: '+20m', when: 'Yesterday', icon: '🍳' },
    { id: 5, action: 'Optimized commute route', time: '+10m', when: '2 days ago', icon: '🚗' },
  ];

  // Milestones
  const milestones = [
    { id: 1, title: '1 Hour', reached: true, reward: '🎉' },
    { id: 2, title: '5 Hours', reached: true, reward: '⭐' },
    { id: 3, title: '10 Hours', reached: true, reward: '🏆' },
    { id: 4, title: '24 Hours', reached: false, reward: '👑', progress: 51 },
    { id: 5, title: '50 Hours', reached: false, reward: '💎', progress: 24 },
    { id: 6, title: '100 Hours', reached: false, reward: '🌟', progress: 12 },
  ];

  // Weekly breakdown
  const weeklyBreakdown = [
    { day: 'Mon', time: 45, label: '45m' },
    { day: 'Tue', time: 32, label: '32m' },
    { day: 'Wed', time: 55, label: '55m' },
    { day: 'Thu', time: 28, label: '28m' },
    { day: 'Fri', time: 0, label: '—' },
    { day: 'Sat', time: 0, label: '—' },
    { day: 'Sun', time: 0, label: '—' },
  ];

  const maxTime = Math.max(...weeklyBreakdown.map(d => d.time), 60);
  const currentStats = stats[selectedPeriod];

  const howItWorks = [
    { icon: '⚡', action: 'Complete tasks faster than estimated', example: 'Avg +5-15m' },
    { icon: '📦', action: 'Batch similar tasks together', example: 'Avg +10-20m' },
    { icon: '🔄', action: 'Auto-optimized scheduling', example: 'Avg +5-10m' },
    { icon: '🚗', action: 'Reduced travel/transitions', example: 'Avg +10-30m' },
  ];

  const shareOptions = [
    { icon: '📝', label: 'Daily Card', action: () => handleNavigate('daily-life-card') },
    { icon: '👥', label: 'Circles', action: () => handleNavigate('circles') },
    { icon: '📋', label: 'Copy', action: () => setShowShareModal(false) },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9', '#f8fafc']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => handleNavigate('hub')}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back to hub"
          >
            <ArrowLeft color="#475569" size={20} />
          </Pressable>
          <Text style={styles.headerTitle}>Time Saved</Text>
          <Pressable
            onPress={() => setInfoModal({ title: 'History', message: 'Time-saved history views are coming next.' })}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="View history"
          >
            <History color="#475569" size={20} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Time Card */}
          <View style={styles.mainCardContainer}>
            <LinearGradient
              colors={['#10b981', '#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainCard}
            >
              {/* Total Time */}
              <View style={styles.mainCardHeader}>
                <View>
                  <Text style={styles.totalLabel}>Total Time Saved</Text>
                  <Text style={styles.totalTime}>{wallet.totalTimeSaved}</Text>
                  <Text style={styles.avgLabel}>Avg {wallet.avgDaily}/day</Text>
                </View>
                <Animated.View
                  style={[
                    styles.clockIconContainer,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Clock color="#fff" size={32} />
                </Animated.View>
              </View>

              {/* Quick Stats */}
              <View style={styles.quickStatsRow}>
                <Pressable
                  onPress={() => handleNavigate('streak')}
                  style={({ pressed }) => [
                    styles.quickStatCard,
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="View your streak details"
                >
                  <View style={styles.quickStatHeader}>
                    <Flame color="#fb923c" size={16} />
                    <Text style={styles.quickStatLabel}>Streak</Text>
                  </View>
                  <Text style={styles.quickStatValue}>{wallet.streak} days</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleNavigate('plan')}
                  style={({ pressed }) => [
                    styles.quickStatCard,
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="View your completed tasks"
                >
                  <View style={styles.quickStatHeader}>
                    <CheckCircle2 color="#6ee7b7" size={16} />
                    <Text style={styles.quickStatLabel}>Tasks</Text>
                  </View>
                  <Text style={styles.quickStatValue}>{wallet.tasksCompleted}</Text>
                </Pressable>
              </View>

              {/* Share Button */}
              <Pressable
                onPress={() => setShowShareModal(true)}
                style={({ pressed }) => [
                  styles.shareButton,
                  pressed && styles.shareButtonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Share your progress"
              >
                <Share2 color="#fff" size={16} />
                <Text style={styles.shareButtonText}>Share Progress</Text>
              </Pressable>
            </LinearGradient>
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['today', 'week', 'month'] as const).map(period => (
              <Pressable
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'Month'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Context-Aware Quick Access */}
          <View style={styles.quickAccessRow}>
            <Pressable
              onPress={() => handleNavigate('plan')}
              style={({ pressed }) => [
                styles.quickAccessButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <BlurView intensity={40} tint="light" style={styles.quickAccessBlur}>
                <Calendar color="#2563eb" size={16} />
                <Text style={styles.quickAccessText}>Plan</Text>
              </BlurView>
            </Pressable>
            <Pressable
              onPress={() => handleNavigate('challenges')}
              style={({ pressed }) => [
                styles.quickAccessButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <BlurView intensity={40} tint="light" style={styles.quickAccessBlur}>
                <Trophy color="#ea580c" size={16} />
                <Text style={styles.quickAccessText}>Challenges</Text>
              </BlurView>
            </Pressable>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <Pressable
              onPress={() =>
                setInfoModal({
                  title: 'Time Saved',
                  message: `You've saved ${currentStats.saved} ${selectedPeriod === 'today' ? 'today' : selectedPeriod === 'week' ? 'this week' : 'this month'}!`,
                })
              }
              style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.8 }]}
            >
              <BlurView intensity={40} tint="light" style={styles.statCardBlur}>
                <View style={[styles.statIconContainer, { backgroundColor: '#ecfdf5' }]}>
                  <Clock color="#059669" size={20} />
                </View>
                <Text style={styles.statValue}>{currentStats.saved}</Text>
                <Text style={styles.statLabel}>Time Saved</Text>
              </BlurView>
            </Pressable>
            <Pressable
              onPress={() => handleNavigate('plan')}
              style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.8 }]}
            >
              <BlurView intensity={40} tint="light" style={styles.statCardBlur}>
                <View style={[styles.statIconContainer, { backgroundColor: '#f5f3ff' }]}>
                  <Zap color="#7c3aed" size={20} />
                </View>
                <Text style={styles.statValue}>{currentStats.tasks}</Text>
                <Text style={styles.statLabel}>Tasks Done</Text>
              </BlurView>
            </Pressable>
            <Pressable
              onPress={() =>
                setInfoModal({
                  title: 'Efficiency',
                  message: `Your efficiency is ${currentStats.efficiency}% - ${currentStats.efficiency >= 90 ? 'Excellent!' : currentStats.efficiency >= 80 ? 'Great job!' : 'Keep improving!'}`,
                })
              }
              style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.8 }]}
            >
              <BlurView intensity={40} tint="light" style={styles.statCardBlur}>
                <View style={[styles.statIconContainer, { backgroundColor: '#fffbeb' }]}>
                  <TrendingUp color="#d97706" size={20} />
                </View>
                <Text style={styles.statValue}>{currentStats.efficiency}%</Text>
                <Text style={styles.statLabel}>Efficiency</Text>
              </BlurView>
            </Pressable>
          </View>

          {/* Weekly Chart */}
          {selectedPeriod === 'week' && (
            <View style={styles.chartCard}>
              <BlurView intensity={40} tint="light" style={styles.chartBlur}>
                <Text style={styles.chartTitle}>This Week</Text>
                <View style={styles.chartContainer}>
                  {weeklyBreakdown.map((day, index) => {
                    const isToday = index === 3;
                    const heightPercent = day.time > 0 ? (day.time / maxTime) * 100 : 8;
                    const animatedHeight = chartBarAnims[index]
                      ? chartBarAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, heightPercent],
                        })
                      : heightPercent;

                    return (
                      <View key={day.day} style={styles.chartBarContainer}>
                        <Text
                          style={[
                            styles.chartBarLabel,
                            day.time > 0 ? styles.chartBarLabelActive : styles.chartBarLabelInactive,
                          ]}
                        >
                          {day.label}
                        </Text>
                        <View style={styles.chartBarWrapper}>
                          <Animated.View
                            style={[
                              styles.chartBar,
                              day.time > 0
                                ? isToday
                                  ? styles.chartBarToday
                                  : styles.chartBarActive
                                : styles.chartBarInactive,
                              {
                                height: chartBarAnims[index]
                                  ? (animatedHeight as Animated.AnimatedInterpolation<number>).interpolate({
                                      inputRange: [0, 100],
                                      outputRange: ['0%', '100%'],
                                    })
                                  : `${heightPercent}%`,
                                minHeight: 8,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.chartDayLabel,
                            isToday && styles.chartDayLabelToday,
                          ]}
                        >
                          {day.day}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </BlurView>
            </View>
          )}

          {/* Milestones */}
          <View style={styles.milestonesCard}>
            <BlurView intensity={40} tint="light" style={styles.milestonesBlur}>
              <View style={styles.milestonesHeader}>
                <Text style={styles.milestonesTitle}>Time Milestones</Text>
                <View style={styles.milestonesBadge}>
                  <Text style={styles.milestonesBadgeText}>
                    {milestones.filter(m => m.reached).length}/{milestones.length} Unlocked
                  </Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.milestonesScroll}
                snapToInterval={76}
                decelerationRate="fast"
              >
                {milestones.map(milestone => (
                  <Pressable
                    key={milestone.id}
                    onPress={() => {
                      if (milestone.reached) {
                        setInfoModal({
                          title: `${milestone.reward} ${milestone.title} Milestone`,
                          message: 'Congratulations! You unlocked this milestone!',
                        });
                      } else {
                        setInfoModal({
                          title: `${milestone.title} Milestone`,
                          message: `${milestone.progress || 0}% complete. Keep saving time to unlock this milestone!`,
                        });
                      }
                    }}
                    style={[
                      styles.milestoneItem,
                      !milestone.reached && styles.milestoneItemLocked,
                    ]}
                  >
                    <View
                      style={[
                        styles.milestoneIcon,
                        milestone.reached
                          ? styles.milestoneIconReached
                          : styles.milestoneIconLocked,
                      ]}
                    >
                      {milestone.reached ? (
                        <Text style={styles.milestoneEmoji}>{milestone.reward}</Text>
                      ) : (
                        <>
                          <Text style={styles.milestoneLockEmoji}>🔒</Text>
                          {milestone.progress && (
                            <View
                              style={[
                                styles.milestoneProgress,
                                { height: `${milestone.progress}%` },
                              ]}
                            />
                          )}
                        </>
                      )}
                    </View>
                    <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </BlurView>
          </View>

          {/* Recent Savings */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Savings</Text>
            {recentSavings.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  setInfoModal({
                    title: `${item.icon} Time Saved`,
                    message: `${item.action}\n\nTime saved: ${item.time}\n${item.when}`,
                  })
                }
              >
                <Animated.View
                  style={[
                    styles.recentCard,
                    {
                      opacity: slideAnims[index] || 1,
                      transform: [
                        {
                          translateY: slideAnims[index]
                            ? slideAnims[index].interpolate({
                                inputRange: [0, 1],
                                outputRange: [8, 0],
                              })
                            : 0,
                        },
                      ],
                    },
                  ]}
                >
                  <BlurView intensity={40} tint="light" style={styles.recentCardBlur}>
                    <View style={styles.recentIconContainer}>
                      <Text style={styles.recentEmoji}>{item.icon}</Text>
                    </View>
                    <View style={styles.recentContent}>
                      <Text style={styles.recentAction} numberOfLines={1} ellipsizeMode="tail">
                        {item.action}
                      </Text>
                      <Text style={styles.recentWhen} numberOfLines={1}>{item.when}</Text>
                    </View>
                    <View style={styles.recentTimeBadge}>
                      <Clock color="#059669" size={14} />
                      <Text style={styles.recentTimeText}>{item.time}</Text>
                    </View>
                  </BlurView>
                </Animated.View>
              </Pressable>
            ))}
          </View>

          {/* How It Works */}
          <View style={styles.howItWorksCard}>
            <BlurView intensity={40} tint="light" style={styles.howItWorksBlur}>
              <Text style={styles.howItWorksTitle}>How Time is Calculated</Text>
              {howItWorks.map((item, i) => (
                <View
                  key={i}
                  style={[
                    styles.howItWorksItem,
                    i < howItWorks.length - 1 && styles.howItWorksItemBorder,
                  ]}
                >
                  <View style={styles.howItWorksLeft}>
                    <Text style={styles.howItWorksEmoji}>{item.icon}</Text>
                    <Text style={styles.howItWorksAction}>{item.action}</Text>
                  </View>
                  <Text style={styles.howItWorksExample}>{item.example}</Text>
                </View>
              ))}
            </BlurView>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalBackdrop, { opacity: modalOpacityAnim }]} />
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowShareModal(false)}
          />

          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: modalSlideAnim }] },
            ]}
          >
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Share Progress</Text>
            <Text style={styles.modalSubtitle}>Show off your time savings!</Text>

            {/* Preview Card */}
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewCard}
            >
              <Text style={styles.previewLabel}>I saved</Text>
              <Text style={styles.previewTime}>{currentStats.saved}</Text>
              <Text style={styles.previewPeriod}>
                this {selectedPeriod} with MYPA! 🎉
              </Text>
              <View style={styles.previewStats}>
                <View style={styles.previewStatItem}>
                  <Text style={styles.previewStatValue}>{currentStats.tasks}</Text>
                  <Text style={styles.previewStatLabel}>Tasks</Text>
                </View>
                <View style={styles.previewDivider} />
                <View style={styles.previewStatItem}>
                  <Text style={styles.previewStatValue}>🔥 {wallet.streak}</Text>
                  <Text style={styles.previewStatLabel}>Streak</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Share Options */}
            <View style={styles.shareOptionsGrid}>
              {shareOptions.map((opt, i) => (
                <Pressable
                  key={i}
                  onPress={opt.action}
                  style={({ pressed }) => [
                    styles.shareOption,
                    pressed && styles.shareOptionPressed,
                  ]}
                >
                  <Text style={styles.shareOptionEmoji}>{opt.icon}</Text>
                  <Text style={styles.shareOptionLabel}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setShowShareModal(false)}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={!!infoModal}
        animationType="fade"
        transparent
        onRequestClose={() => setInfoModal(null)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setInfoModal(null)} />
          <View style={styles.infoModalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{infoModal?.title}</Text>
            <Text style={styles.modalSubtitle}>{infoModal?.message}</Text>
            <Pressable style={styles.infoModalButton} onPress={() => setInfoModal(null)}>
              <Text style={styles.infoModalButtonText}>Got it</Text>
            </Pressable>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },

  // Main Time Card
  mainCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  mainCard: {
    borderRadius: 16,
    padding: 20,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalTime: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
  },
  avgLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  clockIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  quickStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  shareButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  periodButtonActive: {
    backgroundColor: '#0f172a',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  periodButtonTextActive: {
    color: '#fff',
  },

  // Quick Access
  quickAccessRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  quickAccessButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickAccessBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  quickAccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statCardBlur: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
  },

  // Weekly Chart
  chartCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  chartBlur: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 96,
    gap: 8,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  chartBarLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  chartBarLabelActive: {
    color: '#059669',
  },
  chartBarLabelInactive: {
    color: '#cbd5e1',
  },
  chartBarWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 6,
  },
  chartBarActive: {
    backgroundColor: '#6ee7b7',
  },
  chartBarToday: {
    backgroundColor: '#10b981',
  },
  chartBarInactive: {
    backgroundColor: '#f1f5f9',
  },
  chartDayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  chartDayLabelToday: {
    color: '#059669',
  },

  // Milestones
  milestonesCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  milestonesBlur: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  milestonesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  milestonesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  milestonesBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  milestonesBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#059669',
  },
  milestonesScroll: {
    paddingRight: 16,
    gap: 8,
  },
  milestoneItem: {
    width: 68,
    alignItems: 'center',
  },
  milestoneItemLocked: {
    opacity: 0.6,
  },
  milestoneIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  milestoneIconReached: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  milestoneIconLocked: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
  },
  milestoneEmoji: {
    fontSize: 24,
  },
  milestoneLockEmoji: {
    fontSize: 20,
    zIndex: 10,
  },
  milestoneProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  milestoneTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  // Recent Savings
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  recentCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  recentCardBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  recentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentEmoji: {
    fontSize: 20,
  },
  recentContent: {
    flex: 1,
    minWidth: 0,
  },
  recentAction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  recentWhen: {
    fontSize: 12,
    color: '#94a3b8',
  },
  recentTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recentTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },

  // How It Works
  howItWorksCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  howItWorksBlur: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  howItWorksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  howItWorksItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  howItWorksLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  howItWorksEmoji: {
    fontSize: 18,
  },
  howItWorksAction: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  howItWorksExample: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  infoModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 390,
    alignSelf: 'center',
  },
  infoModalButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  infoModalButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  previewTime: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  previewPeriod: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  previewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 24,
  },
  previewStatItem: {
    alignItems: 'center',
  },
  previewStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  previewStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  previewDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  shareOptionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  shareOption: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  shareOptionPressed: {
    backgroundColor: '#e2e8f0',
  },
  shareOptionEmoji: {
    fontSize: 24,
  },
  shareOptionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButtonPressed: {
    backgroundColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
});

export default WalletScreen;
