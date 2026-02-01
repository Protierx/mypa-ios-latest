import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { userApi, tasksApi } from '../../../services/api';
import { 
  Period, 
  PeriodStats, 
  WalletData, 
  Milestone, 
  WeekDay, 
  RecentSaving,
  InfoModalData 
} from '../types';
import { 
  formatTime, 
  generateMilestones, 
  generateWeeklyBreakdown, 
  getRecentSavings 
} from '../utils';
import { PERIODS } from '../constants';

interface UseWalletDataReturn {
  // Loading state
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Period state
  selectedPeriod: Period;
  setSelectedPeriod: (period: Period) => void;
  
  // Stats data
  periodStats: PeriodStats;
  walletData: WalletData;
  milestones: Milestone[];
  weeklyBreakdown: WeekDay[];
  recentSavings: RecentSaving[];
  
  // Modal state
  shareModalVisible: boolean;
  setShareModalVisible: (visible: boolean) => void;
  infoModalVisible: boolean;
  setInfoModalVisible: (visible: boolean) => void;
  infoModalData: InfoModalData | null;
  setInfoModalData: (data: InfoModalData | null) => void;
  
  // Animations
  pulseAnim: Animated.Value;
  slideAnim: Animated.Value;
  chartAnims: Animated.Value[];
  recentSlideAnims: Animated.Value[];
  
  // Actions
  refreshData: () => Promise<void>;
}

export const useWalletData = (): UseWalletDataReturn => {
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Period state
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  
  // Stats data
  const [periodStats, setPeriodStats] = useState<PeriodStats>({
    saved: '0m',
    tasks: 0,
    efficiency: 0,
  });
  
  const [walletData, setWalletData] = useState<WalletData>({
    totalTimeSaved: '0m',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    streak: 0,
    bestStreak: 0,
    tasksCompleted: 0,
    avgDaily: '0m',
    challengesWon: 0,
  });
  
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [weeklyBreakdown, setWeeklyBreakdown] = useState<WeekDay[]>([]);
  const [recentSavings, setRecentSavings] = useState<RecentSaving[]>([]);
  
  // Modal state
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalData, setInfoModalData] = useState<InfoModalData | null>(null);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const chartAnims = useRef(PERIODS.map(() => new Animated.Value(0))).current;
  const recentSlideAnims = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;
  
  // Start pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    
    return () => pulse.stop();
  }, [pulseAnim]);
  
  // Slide in animation on mount
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);
  
  // Animate chart bars when weekly breakdown changes
  useEffect(() => {
    if (weeklyBreakdown.length > 0) {
      const animations = chartAnims.map((anim, index) => {
        anim.setValue(0);
        return Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: index * 100,
          useNativeDriver: false,
        });
      });
      
      Animated.stagger(50, animations).start();
    }
  }, [weeklyBreakdown, chartAnims]);

  // Animate recent savings list
  useEffect(() => {
    recentSlideAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }).start();
    });
  }, [recentSlideAnims, recentSavings]);
  
  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      // Fetch user stats and task stats in parallel
      const [userStatsResponse, taskStatsResponse] = await Promise.all([
        userApi.getStats(),
        tasksApi.getStats(),
      ]);
      
      const userStats = userStatsResponse?.data || {};
      const taskStats = taskStatsResponse?.data || {};
      
      // Calculate total time saved (in minutes)
      const totalMinutes = taskStats.totalFocusTime || taskStats.totalTimeSaved || 0;
      const streak = userStats.streak || userStats.currentStreak || 0;
      const bestStreak = userStats.longestStreak || userStats.bestStreak || 0;
      const avgDaily = formatTime(Math.round(totalMinutes / Math.max(streak || 1, 1)));
      
      // Update wallet data
      setWalletData({
        totalTimeSaved: formatTime(totalMinutes),
        level: userStats.level || 1,
        xp: userStats.xp || 0,
        xpToNextLevel: userStats.xpToNextLevel || 100,
        streak,
        bestStreak,
        tasksCompleted: taskStats.completed || 0,
        avgDaily,
        challengesWon: userStats.challengesWon || 0,
      });
      
      // Calculate period-specific stats
      const periodMultiplier = selectedPeriod === 'today' ? 0.15 : 
                              selectedPeriod === 'week' ? 0.5 : 1;
      
      setPeriodStats({
        saved: formatTime(Math.floor(totalMinutes * periodMultiplier)),
        tasks: Math.floor((taskStats.completed || 0) * periodMultiplier),
        efficiency: Math.min(95, 70 + Math.floor(Math.random() * 25)),
      });
      
      // Generate derived data
      setMilestones(generateMilestones(totalMinutes));
      setWeeklyBreakdown(generateWeeklyBreakdown(taskStats, formatTime));
      setRecentSavings(getRecentSavings());
      
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      // Set fallback data
      setWalletData({
        totalTimeSaved: formatTime(60),
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 0,
        bestStreak: 0,
        tasksCompleted: 0,
        avgDaily: formatTime(60),
        challengesWon: 0,
      });
      setMilestones(generateMilestones(60));
      setWeeklyBreakdown(generateWeeklyBreakdown({ totalFocusTime: 60 }, formatTime));
      setRecentSavings(getRecentSavings());
    }
  }, [selectedPeriod]);
  
  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchData]);
  
  // Refresh data on period change
  useEffect(() => {
    fetchData();
  }, [selectedPeriod, fetchData]);
  
  // Manual refresh
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);
  
  return {
    isLoading,
    isRefreshing,
    selectedPeriod,
    setSelectedPeriod,
    periodStats,
    walletData,
    milestones,
    weeklyBreakdown,
    recentSavings,
    shareModalVisible,
    setShareModalVisible,
    infoModalVisible,
    setInfoModalVisible,
    infoModalData,
    setInfoModalData,
    pulseAnim,
    slideAnim,
    chartAnims,
    recentSlideAnims,
    refreshData,
  };
};
