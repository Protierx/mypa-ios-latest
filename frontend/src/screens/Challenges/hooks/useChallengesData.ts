import { useState, useRef, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import { challengesApi, circlesApi, analyticsApi, userApi } from '../../../services/api';
import {
  Challenge,
  AvailableChallenge,
  Achievement,
  LeaderboardEntry,
  UserStats,
  UserCircle,
  TabType,
  TimeframeType,
  APIChallenge,
  ChallengeCategory,
  ChallengeParticipant,
} from '../types';
import { convertToDisplayChallenge } from '../utils';

export function useChallengesData(focusChallengeId?: string) {
  // Tab & timeframe state
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeType>('week');
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);

  // Data state
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<AvailableChallenge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([
    { rank: 1, name: 'You', initial: 'Y', xp: 0, streak: 0, wins: 0, isYou: true, movement: 'same' },
  ]);
  const [userCircles, setUserCircles] = useState<UserCircle[]>([]);
  const [challengeLeaderboards, setChallengeLeaderboards] = useState<Record<string, ChallengeParticipant[]>>({});

  // User state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalXP: 0,
    currentStreak: 0,
    rank: 1,
    totalMembers: 1,
    level: 1,
    nextLevelXP: 100,
    challengesWon: 0,
  });

  // Loading state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [selectedChallengeForOptions, setSelectedChallengeForOptions] = useState<Challenge | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ChallengeCategory>('fitness');
  const [newTarget, setNewTarget] = useState('10');
  const [newDays, setNewDays] = useState(14);
  const [newXp, setNewXp] = useState(50);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  // Toast handling
  useEffect(() => {
    if (!toast) return;
    Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setToast(null);
      });
    }, 1800);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [toast, toastAnim]);

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  // Fetch challenge leaderboard
  const fetchChallengeLeaderboard = useCallback(async (challengeId: string) => {
    try {
      const response = await challengesApi.getLeaderboard(challengeId, 10);
      if (response.success && response.data) {
        setChallengeLeaderboards(prev => ({ ...prev, [challengeId]: response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch challenge leaderboard:', error);
    }
  }, []);

  // Fetch all challenges data
  const fetchChallenges = useCallback(async () => {
    try {
      const [mineRes, allRes, statsRes, circlesRes, insightsRes, globalLbRes, profileRes] = await Promise.all([
        challengesApi.getMine(),
        challengesApi.getAll(),
        userApi.getStats(),
        circlesApi.getAll(),
        analyticsApi.getInsights(),
        analyticsApi.getGlobalLeaderboard(50),
        userApi.getProfile(),
      ]);

      if (mineRes.success && mineRes.data) {
        const converted = mineRes.data.map(convertToDisplayChallenge);
        setActiveChallenges(converted);
      }

      if (allRes.success && allRes.data) {
        const notJoined = allRes.data.filter((c: APIChallenge) => c && !c.isJoined);
        setAvailableChallenges(notJoined.map((c: APIChallenge) => {
          const now = new Date();
          const endsAt = new Date(c.endsAt);
          const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          return {
            id: c.id,
            title: c.title,
            emoji: c.emoji,
            type: c.type,
            targetValue: c.targetValue,
            xpReward: c.xpReward,
            participantCount: c.participantCount || 0,
            daysLeft,
          };
        }));
      }

      if (profileRes.success && profileRes.data?.id) {
        setCurrentUserId(profileRes.data.id);
      }

      if (statsRes.success && statsRes.data) {
        const stats = statsRes.data;
        setUserStats({
          totalXP: stats.xp || 0,
          currentStreak: stats.currentStreak || 0,
          rank: 1,
          totalMembers: 1,
          level: stats.level || 1,
          nextLevelXP: (stats.level || 1) * 100,
          challengesWon: stats.challengesWon || 0,
        });
      }

      if (globalLbRes.success && globalLbRes.data) {
        const userId = profileRes.data?.id || currentUserId;
        const mapped = globalLbRes.data.map((entry: any) => ({
          rank: entry.rank,
          name: entry.name,
          initial: (entry.name?.[0] || 'U').toUpperCase(),
          xp: entry.xp || 0,
          streak: entry.streak || 0,
          wins: 0,
          isYou: entry.userId === userId,
          movement: 'same' as const,
        }));
        setLeaderboard(mapped);
      }

      if (insightsRes.success && insightsRes.data) {
        const milestones: string[] = insightsRes.data.recentMilestones || [];
        const badgeData = milestones.map((m: string, idx: number) => ({
          id: `milestone-${idx}`,
          name: m.replace(/^\p{Emoji_Presentation}\s*/u, '').trim() || 'Milestone',
          iconName: 'medal',
          color: '#8B5CF6',
          description: m,
          unlocked: true,
          xp: 0,
        }));
        setAchievements(badgeData);
      }

      if (circlesRes.success && circlesRes.data) {
        setUserCircles(circlesRes.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          emoji: c.emoji || '👥',
        })));
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  // Initial load
  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Handle focus on specific challenge
  useEffect(() => {
    if (!focusChallengeId) return;
    if (!loading) {
      setActiveTab('active');
      const exists = activeChallenges.some((c) => c.id === focusChallengeId);
      if (exists) {
        setExpandedChallenge(focusChallengeId);
        if (!challengeLeaderboards[focusChallengeId]) {
          fetchChallengeLeaderboard(focusChallengeId);
        }
      }
    }
  }, [focusChallengeId, loading, activeChallenges, challengeLeaderboards, fetchChallengeLeaderboard]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChallenges();
  }, [fetchChallenges]);

  // Reset create form
  const resetCreateForm = useCallback(() => {
    setNewName('');
    setNewCategory('fitness');
    setNewTarget('10');
    setNewDays(14);
    setNewXp(50);
    setAiPrompt('');
    setSelectedCircleId(null);
    setEditingChallenge(null);
  }, []);

  return {
    // Tab & view state
    activeTab,
    setActiveTab,
    selectedTimeframe,
    setSelectedTimeframe,
    expandedChallenge,
    setExpandedChallenge,

    // Data
    activeChallenges,
    setActiveChallenges,
    availableChallenges,
    setAvailableChallenges,
    achievements,
    leaderboard,
    userCircles,
    challengeLeaderboards,
    setChallengeLeaderboards,

    // User
    currentUserId,
    userStats,

    // Loading
    loading,
    refreshing,
    joiningChallengeId,
    setJoiningChallengeId,

    // Modals
    showCreateModal,
    setShowCreateModal,
    showOptionsModal,
    setShowOptionsModal,
    editingChallenge,
    setEditingChallenge,
    selectedChallengeForOptions,
    setSelectedChallengeForOptions,

    // Create form
    newName,
    setNewName,
    newCategory,
    setNewCategory,
    newTarget,
    setNewTarget,
    newDays,
    setNewDays,
    newXp,
    setNewXp,
    selectedCircleId,
    setSelectedCircleId,
    aiPrompt,
    setAiPrompt,
    aiLoading,
    setAiLoading,

    // Toast
    toast,
    toastAnim,
    showToast,

    // Methods
    fetchChallenges,
    fetchChallengeLeaderboard,
    onRefresh,
    resetCreateForm,
  };
}
