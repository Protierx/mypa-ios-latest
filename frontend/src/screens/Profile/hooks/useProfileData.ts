import { useState, useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { Achievement, UserStats, SettingsItem, StatConfig } from '../types';
import { SCREEN_HEIGHT } from '../constants';
import {
  Users,
  Settings,
  Bell,
  Lock,
  HelpCircle,
  TrendingUp,
  Award,
  Flame,
} from 'lucide-react-native';

interface UseProfileDataReturn {
  // User data
  user: any;
  userStats: UserStats;
  xpProgress: number;
  
  // Achievements
  achievements: Achievement[];
  
  // Settings
  settingsItems: SettingsItem[];
  statsConfig: StatConfig[];
  
  // Modal state
  showAchievements: boolean;
  setShowAchievements: (show: boolean) => void;
  showLogoutConfirm: boolean;
  setShowLogoutConfirm: (show: boolean) => void;
  
  // Animations
  achievementsSlideAnim: Animated.Value;
  achievementsOpacityAnim: Animated.Value;
  logoutOpacityAnim: Animated.Value;
  logoutScaleAnim: Animated.Value;
  
  // Actions
  logout: () => Promise<void>;
}

export const useProfileData = (): UseProfileDataReturn => {
  const { user, logout } = useAuth();
  
  // Modal state
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Animation values
  const achievementsSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const achievementsOpacityAnim = useRef(new Animated.Value(0)).current;
  const logoutOpacityAnim = useRef(new Animated.Value(0)).current;
  const logoutScaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Calculate XP needed for next level
  const xpForNextLevel = (user?.level || 1) * 100;
  const currentLevelXp = user?.xp ? user.xp % xpForNextLevel : 0;
  
  // User stats from auth context
  const userStats: UserStats = {
    level: user?.level || 1,
    xp: user?.xp || 0,
    xpToNext: xpForNextLevel - currentLevelXp,
    streak: user?.currentStreak || 0,
    timeSaved: user?.totalTimeSaved ? `${Math.round(user.totalTimeSaved / 60)}h` : '0h',
    challengesWon: user?.challengesWon || 0,
    circlesJoined: 0,
  };
  
  const xpProgress = ((userStats.xp % 500) / 500) * 100;
  
  // Achievements data
  const achievements: Achievement[] = [
    { id: 1, name: 'Early Bird', emoji: '🌅', description: 'Complete 7 tasks before 9 AM', unlocked: true },
    { id: 2, name: 'Streak Master', emoji: '🔥', description: 'Maintain a 14-day streak', unlocked: true },
    { id: 3, name: 'Time Lord', emoji: '⏰', description: 'Save 10+ hours', unlocked: true },
    { id: 4, name: 'Social Butterfly', emoji: '🦋', description: 'Join 5 circles', unlocked: false, progress: 60 },
    { id: 5, name: 'Challenge Champion', emoji: '🏆', description: 'Win 10 challenges', unlocked: false, progress: 80 },
    { id: 6, name: 'Zen Master', emoji: '🧘', description: 'Complete all daily goals for a month', unlocked: false, progress: 40 },
  ];
  
  // Settings items configuration
  const settingsItems: SettingsItem[] = [
    { id: 'privacy-controls', label: 'Privacy Controls', icon: Lock, colors: ['#a855f7', '#9333ea'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, colors: ['#fb923c', '#f97316'] },
    { id: 'settings', label: 'App Settings', icon: Settings, colors: ['#64748b', '#475569'] },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, colors: ['#10b981', '#059669'] },
  ];
  
  // Stats configuration
  const statsConfig: StatConfig[] = [
    { key: 'streak', value: userStats.streak, label: 'Streak', icon: Flame, color: '#f97316', screen: 'streak' },
    { key: 'circles', value: userStats.circlesJoined, label: 'Circles', icon: Users, color: '#8b5cf6', screen: 'circles' },
    { key: 'saved', value: userStats.timeSaved, label: 'Saved', icon: TrendingUp, color: '#10b981', screen: 'wallet' },
    { key: 'wins', value: userStats.challengesWon, label: 'Wins', icon: Award, color: '#f59e0b', screen: 'challenges' },
  ];
  
  // Achievements modal animation
  useEffect(() => {
    if (showAchievements) {
      Animated.parallel([
        Animated.timing(achievementsSlideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(achievementsOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(achievementsSlideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(achievementsOpacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showAchievements]);
  
  // Logout modal animation
  useEffect(() => {
    if (showLogoutConfirm) {
      Animated.parallel([
        Animated.timing(logoutOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(logoutScaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(logoutOpacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(logoutScaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showLogoutConfirm]);
  
  return {
    user,
    userStats,
    xpProgress,
    achievements,
    settingsItems,
    statsConfig,
    showAchievements,
    setShowAchievements,
    showLogoutConfirm,
    setShowLogoutConfirm,
    achievementsSlideAnim,
    achievementsOpacityAnim,
    logoutOpacityAnim,
    logoutScaleAnim,
    logout,
  };
};
