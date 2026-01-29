import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Pressable,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { challengesApi, circlesApi, analyticsApi, userApi } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChallengesScreenProps {
  navigation: any;
  route?: any;
}

// API Challenge type
interface APIChallenge {
  id: string;
  title: string;
  description?: string;
  emoji: string;
  type: 'FOCUS_MINUTES' | 'TASKS_COMPLETED' | 'STREAK_DAYS' | 'CUSTOM';
  targetValue: number;
  startsAt: string;
  endsAt: string;
  xpReward: number;
  isActive: boolean;
  circleId?: string;
  circle?: { id: string; name: string; emoji: string };
  isJoined?: boolean;
  myProgress?: number;
  myRank?: number;
  isCompleted?: boolean;
  participantCount?: number;
  participants?: {
    rank: number;
    user: { id: string; name: string; username?: string; avatarUrl?: string; level: number };
    progress: number;
    percentComplete: number;
    isCompleted: boolean;
  }[];
}

// Local display type
interface Challenge {
  id: string;
  name: string;
  iconName: string;
  iconColor: string;
  daysLeft: number;
  totalDays: number;
  members: { id?: string; name: string; initial: string; color: string; streak: number; rank: number }[];
  todayPrompt: string;
  progress: { completed: number; total: number };
  myStatus: 'pending' | 'completed' | 'missed';
  myStreak: number;
  category: 'fitness' | 'wellness' | 'learning' | 'productivity' | 'social';
  xpReward: number;
  stakes?: string;
  apiData?: APIChallenge; // Keep original API data for syncing
}

const categoryColors: { [key: string]: { bg: string } } = {
  fitness: { bg: '#F43F5E' },
  wellness: { bg: '#8B5CF6' },
  learning: { bg: '#3B82F6' },
  productivity: { bg: '#F59E0B' },
  social: { bg: '#10B981' },
};

export function ChallengesScreen({ navigation, route }: ChallengesScreenProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'leaderboard' | 'achievements'>('active');
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Challenge['category']>('fitness');
  const [newTarget, setNewTarget] = useState('10');
  const [newDays, setNewDays] = useState(14);
  const [newXp, setNewXp] = useState(50);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  
  // New state for circles and editing
  const [userCircles, setUserCircles] = useState<{id: string; name: string; emoji: string}[]>([]);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedChallengeForOptions, setSelectedChallengeForOptions] = useState<Challenge | null>(null);

  // Day and XP options for quick selection
  const dayOptions = [7, 14, 21, 30, 60, 90];
  const xpOptions = [25, 50, 75, 100, 150, 200];

  const [achievements, setAchievements] = useState<Array<{
    id: string;
    name: string;
    iconName: string;
    color: string;
    description: string;
    unlocked: boolean;
    xp: number;
    progress?: number;
    total?: number;
  }>>([]);

  // Leaderboard will come from user stats
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'You', initial: 'Y', xp: 0, streak: 0, wins: 0, isYou: true, movement: 'same' as const },
  ]);

  // Available challenges the user can join
  interface AvailableChallenge {
    id: string;
    title: string;
    emoji: string;
    type: string;
    targetValue: number;
    xpReward: number;
    participantCount: number;
    daysLeft?: number;
    creatorName?: string;
  }

  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<AvailableChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({
    totalXP: 0,
    currentStreak: 0,
    rank: 1,
    totalMembers: 1,
    level: 1,
    nextLevelXP: 100,
    challengesWon: 0,
  });
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);
  const [challengeLeaderboards, setChallengeLeaderboards] = useState<Record<string, APIChallenge['participants']>>({});
  const focusChallengeId = route?.params?.focusChallengeId as string | undefined;

  const parseCategoryFromDescription = (description?: string): Challenge['category'] | null => {
    if (!description) return null;
    const match = description.match(/Category:\s*([^|\n]+)/i);
    const raw = match?.[1]?.trim()?.toLowerCase();
    if (!raw) return null;
    if (raw.includes('fitness')) return 'fitness';
    if (raw.includes('wellness')) return 'wellness';
    if (raw.includes('learning')) return 'learning';
    if (raw.includes('productivity')) return 'productivity';
    if (raw.includes('social')) return 'social';
    return null;
  };

  // Convert API challenge to local display format
  const convertToDisplayChallenge = (apiChallenge: APIChallenge): Challenge => {
    const now = new Date();
    const endsAt = new Date(apiChallenge.endsAt);
    const startsAt = new Date(apiChallenge.startsAt);
    const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.ceil((endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));

    // Map type to category
    const typeToCategory: Record<string, Challenge['category']> = {
      'FOCUS_MINUTES': 'wellness',
      'TASKS_COMPLETED': 'productivity',
      'STREAK_DAYS': 'fitness',
      'CUSTOM': 'social',
    };
    const category = parseCategoryFromDescription(apiChallenge.description) || typeToCategory[apiChallenge.type] || 'social';

    // Map category to icon
    const categoryToIcon: Record<string, string> = {
      'fitness': 'dumbbell',
      'wellness': 'cellphone-off',
      'learning': 'book-open',
      'productivity': 'target',
      'social': 'heart',
    };

    // Build members from participants
    const members = (apiChallenge.participants || [])
      .filter((p) => p?.user?.id)
      .slice(0, 5)
      .map((p, idx) => ({
        id: p.user?.id,
        name: p.user?.name || p.user?.username || 'User',
        initial: (p.user?.name || p.user?.username || 'U')[0]?.toUpperCase() || 'U',
        color: idx === 0 ? '#8B5CF6' : idx === 1 ? '#F43F5E' : idx === 2 ? '#3B82F6' : '#10B981',
        streak: p.progress || 0,
        rank: p.rank || idx + 1,
      }));

    return {
      id: apiChallenge.id,
      name: apiChallenge.title,
      iconName: categoryToIcon[category] || 'trophy',
      iconColor: categoryColors[category]?.bg || '#8B5CF6',
      daysLeft,
      totalDays,
      members: members.length > 0 ? members : [{ name: 'You', initial: 'Y', color: '#8B5CF6', streak: 0, rank: 1 }],
      todayPrompt: apiChallenge.description || `Complete ${apiChallenge.targetValue} ${apiChallenge.type.toLowerCase().replace('_', ' ')}`,
      progress: { completed: apiChallenge.myProgress || 0, total: apiChallenge.targetValue },
      myStatus: apiChallenge.isCompleted ? 'completed' : 'pending',
      myStreak: apiChallenge.myProgress || 0,
      category,
      xpReward: apiChallenge.xpReward,
      apiData: apiChallenge,
    };
  };

  // Fetch challenges from API
  const fetchChallenges = useCallback(async () => {
    try {
      // Fetch user's joined challenges, available challenges, circles, and stats in parallel
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
        // Filter to show only challenges user hasn't joined
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
        const mapped = globalLbRes.data.map((entry: any) => ({
          rank: entry.rank,
          name: entry.name,
          initial: (entry.name?.[0] || 'U').toUpperCase(),
          xp: entry.xp || 0,
          streak: entry.streak || 0,
          wins: 0,
          isYou: entry.userId === (profileRes.data?.id || currentUserId),
          movement: 'same' as const,
        }));
        setLeaderboard(mapped);
        setGlobalLeaderboard(mapped);
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
  }, []);

  const fetchChallengeLeaderboard = async (challengeId: string) => {
    try {
      const response = await challengesApi.getLeaderboard(challengeId, 10);
      if (response.success && response.data) {
        setChallengeLeaderboards(prev => ({ ...prev, [challengeId]: response.data }));
      }
    } catch (error) {
      console.error('Failed to fetch challenge leaderboard:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChallenges();
  }, [fetchChallenges]);

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

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Join an available challenge
  const handleJoinChallenge = async (challengeId: string) => {
    if (joiningChallengeId) return; // Prevent double-clicks
    
    setJoiningChallengeId(challengeId);
    // Optimistically remove from available list
    setAvailableChallenges(prev => prev.filter(c => c.id !== challengeId));
    
    try {
      const response = await challengesApi.join(challengeId);
      if (response.success) {
        showToast('Joined challenge!', 'success');
        fetchChallenges(); // Refresh to get updated data
      } else {
        showToast(response.error || 'Failed to join', 'info');
        fetchChallenges(); // Refresh to restore list
      }
    } catch (error) {
      console.error('Failed to join challenge:', error);
      showToast('Failed to join challenge', 'info');
      fetchChallenges(); // Refresh to restore list
    } finally {
      setJoiningChallengeId(null);
    }
  };

  // Leave a challenge
  const handleLeaveChallenge = async (challengeId: string) => {
    try {
      const response = await challengesApi.leave(challengeId);
      if (response.success) {
        showToast('Left challenge', 'info');
        fetchChallenges(); // Refresh the list
      } else {
        showToast(response.error || 'Failed to leave', 'info');
      }
    } catch (error) {
      console.error('Failed to leave challenge:', error);
      showToast('Failed to leave challenge', 'info');
    }
  };

  // Update progress for a challenge
  const handleSubmitProof = async (challengeId: string) => {
    try {
      const response = await challengesApi.updateProgress(challengeId, 1);
      if (response.success) {
        const isCompleted = response.data?.isCompleted;
        const xpAwarded = response.data?.xpAwarded || 0;
        
        if (isCompleted) {
          showToast(`Challenge completed! +${xpAwarded} XP`, 'success');
        } else {
          showToast('Progress updated!', 'success');
        }
        fetchChallenges(); // Refresh to show updated progress
      } else {
        showToast(response.error || 'Failed to update progress', 'info');
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
      showToast('Failed to update progress', 'info');
    }
  };

  const handleAiSuggest = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert('AI Assist', 'Describe the challenge you want.');
      return;
    }

    setAiLoading(true);
    try {
      const response = await aiApi.suggestChallenge(aiPrompt.trim());
      if (response.success && response.data) {
        const suggestion = response.data;
        const mappedCategory = typeof suggestion.category === 'string'
          ? suggestion.category.toLowerCase()
          : null;
        const typeToCategory: Record<string, Challenge['category']> = {
          FOCUS_MINUTES: 'wellness',
          TASKS_COMPLETED: 'productivity',
          STREAK_DAYS: 'fitness',
        };

        setNewName(suggestion.title || newName);
        setNewTarget(String(suggestion.targetValue || newTarget));
        setNewDays(Number(suggestion.days || newDays));
        setNewXp(Number(suggestion.xpReward || newXp));

        if (mappedCategory && ['fitness', 'wellness', 'learning', 'productivity', 'social'].includes(mappedCategory)) {
          setNewCategory(mappedCategory as Challenge['category']);
        } else if (suggestion.type && typeToCategory[suggestion.type]) {
          setNewCategory(typeToCategory[suggestion.type]);
        }
      } else {
        showToast(response.error || 'AI is unavailable right now', 'info');
      }
    } catch (error) {
      console.error('AI suggest failed:', error);
      showToast('AI suggestion failed', 'info');
    } finally {
      setAiLoading(false);
    }
  };

  const formatCategoryLabel = (cat: Challenge['category']) =>
    `${cat.charAt(0).toUpperCase()}${cat.slice(1)}`;

  const handleCreateChallenge = async () => {
    if (!newName.trim()) {
      Alert.alert('Missing Name', 'Please enter a challenge name');
      return;
    }

    const targetValue = parseInt(newTarget, 10);
    if (isNaN(targetValue) || targetValue < 1) {
      Alert.alert('Invalid Target', 'Please enter a valid target number');
      return;
    }
    
    const totalDays = newDays;
    const xpReward = newXp;
    
    // Map category to challenge type
    const typeMap: Record<string, 'FOCUS_MINUTES' | 'TASKS_COMPLETED' | 'STREAK_DAYS' | 'CUSTOM'> = {
      fitness: 'CUSTOM',
      wellness: 'FOCUS_MINUTES',
      learning: 'TASKS_COMPLETED',
      productivity: 'TASKS_COMPLETED',
      social: 'CUSTOM',
    };
    
    try {
      // If editing, update existing challenge
      if (editingChallenge) {
        const endsAt = new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000).toISOString();
        
        const response = await challengesApi.update(editingChallenge.id, {
          title: newName.trim(),
          description: `Category: ${formatCategoryLabel(newCategory)} | A ${newCategory} challenge`,
          emoji: newCategory === 'fitness' ? '💪' : newCategory === 'learning' ? '📚' : newCategory === 'wellness' ? '🧘' : newCategory === 'productivity' ? '🎯' : '❤️',
          targetValue,
          endsAt,
          xpReward,
        });
        
        if (response.success) {
          // Update local state
          setActiveChallenges(prev => prev.map(c => 
            c.id === editingChallenge.id 
              ? { ...c, name: newName.trim(), totalDays, xpReward, category: newCategory }
              : c
          ));
          // Reset modal state
          setShowCreateModal(false);
          setEditingChallenge(null);
          setNewName('');
          setNewCategory('fitness');
          setNewDays(14);
          setNewXp(50);
          setSelectedCircleId(null);
          showToast('Challenge updated! ✅', 'success');
        } else {
          showToast(response.error || 'Failed to update challenge', 'info');
        }
        return;
      }
      
      // Creating new challenge
      const startsAt = new Date().toISOString();
      const endsAt = new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await challengesApi.create({
        title: newName.trim(),
        description: `Category: ${formatCategoryLabel(newCategory)} | A ${newCategory} challenge`,
        emoji: newCategory === 'fitness' ? '💪' : newCategory === 'learning' ? '📚' : newCategory === 'wellness' ? '🧘' : newCategory === 'productivity' ? '🎯' : '❤️',
        type: typeMap[newCategory] || 'CUSTOM',
        targetValue,
        startsAt,
        endsAt,
        xpReward,
        circleId: selectedCircleId || undefined,
      });
      
      if (response.success && response.data) {
        // Convert API response to local Challenge format
        const newChallenge: Challenge = {
          id: response.data.id,
          name: response.data.title,
          iconName: newCategory === 'fitness' ? 'dumbbell' : newCategory === 'learning' ? 'book-open' : newCategory === 'wellness' ? 'cellphone-off' : newCategory === 'productivity' ? 'target' : 'heart',
          iconColor: categoryColors[newCategory].bg,
          daysLeft: totalDays,
          totalDays,
          members: [{ name: 'You', initial: 'A', color: '#8B5CF6', streak: 0, rank: 1 }],
          todayPrompt: 'Start today and log your progress',
          progress: { completed: 0, total: response.data.targetValue || 1 },
          myStatus: 'pending',
          myStreak: 0,
          category: newCategory,
          xpReward: response.data.xpReward || xpReward,
        };
        setActiveChallenges(prev => [newChallenge, ...prev]);
        // Reset modal state
        setShowCreateModal(false);
        setNewName('');
        setNewCategory('fitness');
        setNewTarget('10');
        setNewDays(14);
        setNewXp(50);
        setAiPrompt('');
        setSelectedCircleId(null);
        
        // Show success message with circle info if applicable
        const circleName = userCircles.find(c => c.id === selectedCircleId)?.name;
        if (circleName) {
          showToast(`Challenge created for ${circleName}! 🎉`, 'success');
        } else {
          showToast('Challenge created! 🎉', 'success');
        }
      } else {
        showToast(response.error || 'Failed to create challenge', 'info');
      }
    } catch (error) {
      console.error('Failed to save challenge:', error);
      showToast('Failed to save challenge', 'info');
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    Alert.alert(
      'Delete Challenge',
      'Are you sure you want to delete this challenge? This will remove it for all participants and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await challengesApi.delete(challengeId);
              if (response.success) {
                setActiveChallenges(prev => prev.filter(c => c.id !== challengeId));
                setShowOptionsModal(false);
                showToast('Challenge deleted', 'success');
              } else {
                // If user is not creator, just leave instead
                if (response.error?.includes('creator')) {
                  Alert.alert(
                    'Cannot Delete',
                    'Only the challenge creator can delete it. Would you like to leave instead?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Leave', 
                        onPress: () => handleLeaveChallenge(challengeId) 
                      },
                    ]
                  );
                } else {
                  showToast(response.error || 'Failed to delete', 'info');
                }
              }
            } catch (error) {
              console.error('Failed to delete challenge:', error);
              showToast('Failed to delete challenge', 'info');
            }
          },
        },
      ]
    );
  };

  const handleEditChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setNewName(challenge.name);
    setNewCategory(challenge.category);
    setNewTarget(String(challenge.apiData?.targetValue || challenge.progress.total || 10));
    setNewDays(challenge.totalDays);
    setNewXp(challenge.xpReward);
    setShowOptionsModal(false);
    setShowCreateModal(true);
  };

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
  }, [focusChallengeId, loading, activeChallenges, challengeLeaderboards]);

  const renderIcon = (name: string, size: number, color: string) => {
    switch (name) {
      case 'dumbbell':
        return <MaterialCommunityIcons name="dumbbell" size={size} color={color} />;
      case 'book-open':
        return <Feather name="book-open" size={size} color={color} />;
      case 'cellphone-off':
        return <MaterialCommunityIcons name="cellphone-off" size={size} color={color} />;
      case 'water':
        return <Ionicons name="water" size={size} color={color} />;
      case 'target':
        return <MaterialCommunityIcons name="target" size={size} color={color} />;
      case 'fire':
        return <MaterialCommunityIcons name="fire" size={size} color={color} />;
      case 'crown':
        return <MaterialCommunityIcons name="crown" size={size} color={color} />;
      case 'heart':
        return <Ionicons name="heart" size={size} color={color} />;
      case 'trophy':
        return <Ionicons name="trophy" size={size} color={color} />;
      default:
        return <Ionicons name="help-circle" size={size} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            toast.type === 'success' ? styles.toastSuccess : styles.toastInfo,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#475569" />
          </TouchableOpacity>
        <Text style={styles.headerTitle}>Challenges</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

        {/* Stats Banner */}
        <View style={styles.statsBanner}>
          <View style={styles.statsRow}>
            <View style={styles.statsLeft}>
              <View style={styles.streakIconContainer}>
                <MaterialCommunityIcons name="fire" size={28} color="#FFFFFF" />
              </View>
              <View>
                <View style={styles.streakValueRow}>
                  <Text style={styles.streakValue}>{userStats.currentStreak}</Text>
                  <Text style={styles.streakLabel}>day streak</Text>
                </View>
                <View style={styles.xpRow}>
                  <Ionicons name="flash" size={14} color="#8B5CF6" />
                  <Text style={styles.xpText}>{userStats.totalXP} XP</Text>
                  <Text style={styles.levelText}>• Lvl {userStats.level}</Text>
                </View>
              </View>
            </View>
            <View style={styles.statsRight}>
              <View style={styles.rankInfo}>
                <View style={styles.rankRow}>
                  <MaterialCommunityIcons name="crown" size={16} color="#F59E0B" />
                  <Text style={styles.rankValue}>#{userStats.rank}</Text>
                </View>
                <Text style={styles.rankTotal}>of {userStats.totalMembers}</Text>
              </View>
              <View style={styles.trophyContainer}>
                <Ionicons name="trophy" size={24} color="#D97706" />
              </View>
            </View>
          </View>
          <View style={styles.xpProgressContainer}>
            <View style={styles.xpProgressLabels}>
              <Text style={styles.xpProgressLabel}>Level {userStats.level} → {userStats.level + 1}</Text>
              <Text style={styles.xpProgressValue}>{userStats.nextLevelXP - userStats.totalXP} XP to go</Text>
            </View>
            <View style={styles.xpProgressBar}>
              <View style={[styles.xpProgressFill, { width: `${(userStats.totalXP / userStats.nextLevelXP) * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <View style={styles.tabBar}>
            {[
              { id: 'active', label: 'Active', icon: 'target' },
              { id: 'leaderboard', label: 'Rankings', icon: 'trophy' },
              { id: 'achievements', label: 'Badges', icon: 'medal' },
            ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id as any)}
                >
                {tab.icon === 'target' && <MaterialCommunityIcons name="target" size={16} color={activeTab === tab.id ? '#0F172A' : '#64748B'} />}
                {tab.icon === 'trophy' && <Ionicons name="trophy" size={16} color={activeTab === tab.id ? '#0F172A' : '#64748B'} />}
                {tab.icon === 'medal' && <MaterialCommunityIcons name="medal" size={16} color={activeTab === tab.id ? '#0F172A' : '#64748B'} />}
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          {/* Active Challenges Tab */}
          {activeTab === 'active' && (
            <View style={styles.challengesList}>
              {/* Loading state */}
              {loading && (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text style={{ marginTop: 12, color: '#64748B' }}>Loading challenges...</Text>
                </View>
              )}

              {/* Available challenges to join */}
              {!loading && availableChallenges.length > 0 && (
                <View style={styles.inviteCard}>
                  <View style={styles.inviteHeader}>
                    <Ionicons name="flash" size={16} color="#D97706" />
                    <Text style={styles.inviteHeaderText}>Join a Challenge</Text>
                  </View>
                  {availableChallenges.slice(0, 3).map(challenge => (
                    <View key={challenge.id} style={styles.inviteContent}>
                      <View style={styles.inviteIconContainer}>
                        <Text style={{ fontSize: 24 }}>{challenge.emoji}</Text>
                      </View>
                      <View style={styles.inviteInfo}>
                        <Text style={styles.inviteName}>{challenge.title}</Text>
                        <Text style={styles.inviteDetails}>{challenge.participantCount} participants • +{challenge.xpReward} XP</Text>
                      </View>
                      <View style={styles.inviteActions}>
                        <TouchableOpacity 
                          style={[styles.joinButton, joiningChallengeId === challenge.id && { opacity: 0.5 }]} 
                          onPress={() => handleJoinChallenge(challenge.id)}
                          disabled={joiningChallengeId === challenge.id}
                        >
                          <Text style={styles.joinButtonText}>
                            {joiningChallengeId === challenge.id ? 'Joining...' : 'Join'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Empty state */}
              {!loading && activeChallenges.length === 0 && (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Ionicons name="trophy-outline" size={48} color="#CBD5E1" />
                  <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: '#475569' }}>No active challenges</Text>
                  <Text style={{ marginTop: 4, color: '#94A3B8', textAlign: 'center' }}>Create a challenge or join one above to get started!</Text>
                  <TouchableOpacity 
                    style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#0F172A', borderRadius: 12 }}
                    onPress={() => setShowCreateModal(true)}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Create Challenge</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!loading && activeChallenges.map((challenge) => {
                const catColor = categoryColors[challenge.category];
                const progressPercent = ((challenge.totalDays - challenge.daysLeft) / challenge.totalDays) * 100;
                const leaderboardEntries = challengeLeaderboards[challenge.id] || challenge.apiData?.participants || [];
                const leaderboardMembers = leaderboardEntries.map((p: any, idx: number) => ({
                  id: p.user?.id,
                  name: p.user?.name || p.user?.username || 'User',
                  initial: (p.user?.name || p.user?.username || 'U')[0]?.toUpperCase(),
                  color: idx === 0 ? '#8B5CF6' : idx === 1 ? '#F43F5E' : idx === 2 ? '#3B82F6' : '#10B981',
                  streak: p.progress || 0,
                  rank: p.rank || idx + 1,
                }));
                const renderMembers = leaderboardMembers.length > 0 ? leaderboardMembers : challenge.members;

                return (
                  <TouchableOpacity 
                    key={challenge.id} 
                    style={styles.challengeCard}
                    activeOpacity={0.95}
                    onPress={() => {
                      const next = expandedChallenge === challenge.id ? null : challenge.id;
                      setExpandedChallenge(next);
                      if (next && !challengeLeaderboards[challenge.id]) {
                        fetchChallengeLeaderboard(challenge.id);
                      }
                    }}
                    onLongPress={() => {
                      setSelectedChallengeForOptions(challenge);
                      setShowOptionsModal(true);
                    }}
                    delayLongPress={400}
                  >
                    <View style={[styles.challengeHeader, { backgroundColor: catColor.bg }]}>
                      <View style={styles.challengeHeaderContent}>
                        <View style={styles.challengeIconContainer}>
                          {renderIcon(challenge.iconName, 24, '#FFFFFF')}
                        </View>
                        <View style={styles.challengeHeaderInfo}>
                          <Text style={styles.challengeName}>{challenge.name}</Text>
                          <View style={styles.challengeMeta}>
                            <Text style={styles.challengeMetaText}>{challenge.daysLeft} days left</Text>
                            <Text style={styles.challengeMetaDot}>•</Text>
                            <Text style={styles.challengeMetaText}>+{challenge.xpReward} XP</Text>
                          </View>
                        </View>
                        <View style={styles.challengeHeaderRight}>
                          <TouchableOpacity
                            style={styles.challengeOptionsButton}
                            onPress={(event) => {
                              event?.stopPropagation?.();
                              setSelectedChallengeForOptions(challenge);
                              setShowOptionsModal(true);
                            }}
                          >
                            <Feather name="more-horizontal" size={18} color="#FFFFFF" />
                          </TouchableOpacity>
                          {challenge.myStatus === 'completed' ? (
                            <View style={styles.completedBadge}>
                              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                            </View>
                          ) : (
                            <View style={styles.streakBadge}>
                              <MaterialCommunityIcons name="fire" size={16} color="#FFFFFF" />
                              <Text style={styles.streakBadgeText}>{challenge.myStreak}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.challengeProgress}>
                        <View style={styles.challengeProgressLabels}>
                          <Text style={styles.challengeProgressLabel}>Day {challenge.totalDays - challenge.daysLeft}</Text>
                          <Text style={styles.challengeProgressLabel}>{Math.round(progressPercent)}%</Text>
                        </View>
                        <View style={styles.challengeProgressBar}>
                          <View style={[styles.challengeProgressFill, { width: `${progressPercent}%` }]} />
                        </View>
                      </View>
                    </View>

                    <View style={styles.challengeBody}>
                      <View style={styles.todayStatus}>
                        <Feather name="clock" size={14} color="#94A3B8" />
                        <Text style={styles.todayPrompt}>{challenge.todayPrompt}</Text>
                        <Text style={styles.todayCount}>{challenge.progress.completed}/{challenge.progress.total}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.miniLeaderboard}
                        onPress={() => {
                          const next = expandedChallenge === challenge.id ? null : challenge.id;
                          setExpandedChallenge(next);
                          if (next && !challengeLeaderboards[challenge.id]) {
                            fetchChallengeLeaderboard(challenge.id);
                          }
                        }}
                      >
                        <View style={styles.miniLeaderboardHeader}>
                          <Text style={styles.miniLeaderboardTitle}>Challenge Leaderboard</Text>
                          <View style={styles.miniLeaderboardCta}>
                            <Text style={styles.miniLeaderboardHint}>{expandedChallenge === challenge.id ? 'Hide' : 'View'}</Text>
                            <Ionicons name={expandedChallenge === challenge.id ? "chevron-up" : "chevron-down"} size={16} color="#94A3B8" />
                          </View>
                        </View>
                        <View style={styles.memberAvatars}>
                          {renderMembers.slice(0, 5).map((member, i) => (
                            <View key={i} style={styles.memberAvatarContainer}>
                              <View style={[styles.memberAvatar, { backgroundColor: member.color }, member.name === 'You' && styles.memberAvatarYou]}>
                                <Text style={styles.memberAvatarText}>{member.initial}</Text>
                              </View>
                              {member.rank <= 3 && (
                                <View style={[styles.rankBadge, member.rank === 1 && styles.rankBadge1, member.rank === 2 && styles.rankBadge2, member.rank === 3 && styles.rankBadge3]}>
                                  <Text style={styles.rankBadgeText}>{member.rank}</Text>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      </TouchableOpacity>

                      {expandedChallenge === challenge.id && (
                        <View style={styles.expandedLeaderboard}>
                          {renderMembers.map((member, i) => (
                            <View key={i} style={[styles.leaderboardRow, member.name === 'You' && styles.leaderboardRowYou]}>
                              <View style={styles.leaderboardRowLeft}>
                                <Text style={[styles.leaderboardRank, member.rank <= 3 && styles.leaderboardRankTop]}>#{member.rank}</Text>
                                <View style={[styles.leaderboardAvatar, { backgroundColor: member.color }]}>
                                  <Text style={styles.leaderboardAvatarText}>{member.initial}</Text>
                                </View>
                                <Text style={[styles.leaderboardName, member.name === 'You' && styles.leaderboardNameYou]}>{member.name}</Text>
                              </View>
                              <View style={styles.leaderboardStreak}>
                                <MaterialCommunityIcons name="fire" size={16} color="#F97316" />
                                <Text style={styles.leaderboardStreakText}>{member.streak}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {challenge.stakes && (
                        <View style={styles.stakesBadge}>
                          <Text style={styles.stakesEmoji}>💰</Text>
                          <Text style={styles.stakesText}>{challenge.stakes}</Text>
                        </View>
                      )}

                      {challenge.myStatus === 'pending' ? (
                        <TouchableOpacity style={styles.submitButton} onPress={() => handleSubmitProof(challenge.id)}>
                          <Ionicons name="camera" size={20} color="#FFFFFF" />
                          <Text style={styles.submitButtonText}>Submit Proof</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.completedButton}>
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                          <Text style={styles.completedButtonText}>Completed for today! +{challenge.xpReward} XP</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <View style={styles.leaderboardTab}>
              <View style={styles.timeframeSelector}>
                {['week', 'month', 'all'].map((tf) => (
                  <TouchableOpacity
                    key={tf}
                    style={[styles.timeframeButton, selectedTimeframe === tf && styles.timeframeButtonActive]}
                    onPress={() => setSelectedTimeframe(tf as any)}
                  >
                    <Text style={[styles.timeframeButtonText, selectedTimeframe === tf && styles.timeframeButtonTextActive]}>
                      {tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'All Time'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {leaderboard.length < 3 ? (
                <View style={{ padding: 40, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16 }}>
                  <Ionicons name="trophy-outline" size={48} color="#CBD5E1" />
                  <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: '#475569' }}>
                    Not enough players yet
                  </Text>
                  <Text style={{ marginTop: 4, color: '#94A3B8', textAlign: 'center' }}>
                    Complete challenges to climb the leaderboard!
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.podiumCard}>
                    <View style={styles.podium}>
                      <View style={styles.podiumPosition}>
                        <View style={[styles.podiumAvatar, styles.podiumAvatar2]}>
                          <Text style={styles.podiumAvatarText}>{leaderboard[1].initial}</Text>
                        </View>
                        <MaterialCommunityIcons name="medal" size={24} color="#94A3B8" />
                        <Text style={styles.podiumName}>{leaderboard[1].name}</Text>
                        <Text style={styles.podiumXP}>{leaderboard[1].xp} XP</Text>
                        <View style={[styles.podiumStand, styles.podiumStand2]}>
                          <Text style={styles.podiumNumber}>2</Text>
                        </View>
                      </View>
                      <View style={[styles.podiumPosition, styles.podiumPosition1]}>
                        <View style={[styles.podiumAvatar, styles.podiumAvatar1]}>
                          <Text style={styles.podiumAvatarText1}>{leaderboard[0].initial}</Text>
                        </View>
                        <MaterialCommunityIcons name="crown" size={28} color="#F59E0B" />
                        <Text style={styles.podiumName1}>{leaderboard[0].name}</Text>
                        <Text style={styles.podiumXP1}>{leaderboard[0].xp} XP</Text>
                        <View style={[styles.podiumStand, styles.podiumStand1]}>
                          <Text style={styles.podiumNumber1}>1</Text>
                        </View>
                      </View>
                      <View style={styles.podiumPosition}>
                        <View style={[styles.podiumAvatar, styles.podiumAvatar3, leaderboard[2].isYou && styles.podiumAvatarYou]}>
                          <Text style={styles.podiumAvatarText}>{leaderboard[2].initial}</Text>
                        </View>
                        <MaterialCommunityIcons name="medal" size={24} color="#D97706" />
                        <Text style={[styles.podiumName, leaderboard[2].isYou && styles.podiumNameYou]}>{leaderboard[2].name}</Text>
                        <Text style={styles.podiumXP}>{leaderboard[2].xp} XP</Text>
                        <View style={[styles.podiumStand, styles.podiumStand3, leaderboard[2].isYou && styles.podiumStandYou]}>
                          <Text style={[styles.podiumNumber, leaderboard[2].isYou && styles.podiumNumberYou]}>3</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.fullLeaderboard}>
                    {leaderboard.slice(3).map((player) => (
                      <View key={player.rank} style={[styles.leaderboardItem, player.isYou && styles.leaderboardItemYou]}>
                        <View style={styles.leaderboardItemLeft}>
                          <Text style={styles.leaderboardItemRank}>#{player.rank}</Text>
                          <View style={[styles.leaderboardItemAvatar, player.isYou && styles.leaderboardItemAvatarYou]}>
                            <Text style={styles.leaderboardItemAvatarText}>{player.initial}</Text>
                          </View>
                          <View>
                            <Text style={[styles.leaderboardItemName, player.isYou && styles.leaderboardItemNameYou]}>{player.name}</Text>
                            <View style={styles.leaderboardItemMeta}>
                              <Text style={styles.leaderboardItemXP}>{player.xp} XP</Text>
                              <Text style={styles.leaderboardItemDot}>•</Text>
                              <Text style={styles.leaderboardItemStreak}>{player.streak}🔥</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.leaderboardItemRight}>
                          {player.movement === 'up' && <Ionicons name="trending-up" size={16} color="#10B981" />}
                          {player.movement === 'down' && <Ionicons name="trending-down" size={16} color="#F43F5E" />}
                          <Text style={styles.leaderboardItemWins}>{player.wins} wins</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <View style={styles.achievementsTab}>
              <View style={styles.achievementStats}>
                <View style={styles.achievementStat}>
                  <Text style={[styles.achievementStatValue, { color: '#10B981' }]}>{achievements.filter(a => a.unlocked).length}</Text>
                  <Text style={styles.achievementStatLabel}>Unlocked</Text>
                </View>
                <View style={styles.achievementStat}>
                  <Text style={[styles.achievementStatValue, { color: '#94A3B8' }]}>{achievements.filter(a => !a.unlocked).length}</Text>
                  <Text style={styles.achievementStatLabel}>Locked</Text>
                </View>
                <View style={styles.achievementStat}>
                  <Text style={[styles.achievementStatValue, { color: '#8B5CF6' }]}>{achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0)}</Text>
                  <Text style={styles.achievementStatLabel}>XP Earned</Text>
                </View>
              </View>

              {achievements.map((achievement) => (
                <View key={achievement.id} style={[styles.achievementCard, !achievement.unlocked && styles.achievementCardLocked]}>
                  <View style={[styles.achievementIcon, achievement.unlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked]}>
                    {achievement.unlocked ? renderIcon(achievement.iconName, 28, achievement.color) : <Ionicons name="lock-closed" size={24} color="#94A3B8" />}
                  </View>
                  <View style={styles.achievementInfo}>
                    <View style={styles.achievementTitleRow}>
                      <Text style={[styles.achievementName, !achievement.unlocked && styles.achievementNameLocked]}>{achievement.name}</Text>
                      {achievement.unlocked && <Ionicons name="checkmark-circle" size={16} color="#10B981" />}
                    </View>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <View style={styles.achievementProgress}>
                        <View style={styles.achievementProgressLabels}>
                          <Text style={styles.achievementProgressText}>{achievement.progress}/{achievement.total}</Text>
                          <Text style={styles.achievementProgressText}>{Math.round((achievement.progress / (achievement.total || 1)) * 100)}%</Text>
                        </View>
                        <View style={styles.achievementProgressBar}>
                          <View style={[styles.achievementProgressFill, { width: `${(achievement.progress / (achievement.total || 1)) * 100}%` }]} />
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={[styles.achievementXP, achievement.unlocked ? styles.achievementXPUnlocked : styles.achievementXPLocked]}>
                    <Text style={[styles.achievementXPText, achievement.unlocked ? styles.achievementXPTextUnlocked : styles.achievementXPTextLocked]}>+{achievement.xp} XP</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showCreateModal} animationType="slide" transparent onRequestClose={() => { setShowCreateModal(false); setEditingChallenge(null); }}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => { setShowCreateModal(false); setEditingChallenge(null); }} />
          <ScrollView 
            style={{ width: '100%', maxHeight: '85%' }} 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingChallenge ? 'Edit Challenge' : 'Create Challenge'}</Text>

            {/* AI Assist */}
            <Text style={styles.modalLabel}>AI Assist (optional)</Text>
            <TextInput
              placeholder="Describe the challenge you want..."
              placeholderTextColor="#94A3B8"
              value={aiPrompt}
              onChangeText={setAiPrompt}
              style={styles.modalInput}
            />
            <TouchableOpacity
              style={[styles.modalSave, { marginTop: -6, marginBottom: 12, opacity: aiLoading ? 0.6 : 1 }]}
              onPress={handleAiSuggest}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSaveText}>✨ Generate with AI</Text>
              )}
            </TouchableOpacity>

            {/* Challenge Name */}
            <TextInput
              placeholder="Challenge name"
              placeholderTextColor="#94A3B8"
              value={newName}
              onChangeText={setNewName}
              style={styles.modalInput}
            />

            {/* Category Selection */}
            <Text style={styles.modalLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.choiceRow}>
                {(['fitness', 'wellness', 'learning', 'productivity', 'social'] as const).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.choiceChip, newCategory === cat && styles.choiceChipActive]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text style={styles.categoryEmoji}>
                      {cat === 'fitness' ? '💪' : cat === 'wellness' ? '🧘' : cat === 'learning' ? '📚' : cat === 'productivity' ? '🎯' : '❤️'}
                    </Text>
                    <Text style={[styles.choiceText, newCategory === cat && styles.choiceTextActive]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Target */}
            <Text style={styles.modalLabel}>Target</Text>
            <TextInput
              placeholder="10"
              placeholderTextColor="#94A3B8"
              value={newTarget}
              onChangeText={setNewTarget}
              style={styles.modalInput}
              keyboardType="number-pad"
            />
            
            {/* Duration Selection */}
            <Text style={styles.modalLabel}>Duration</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.choiceRow}>
                {dayOptions.map(days => (
                  <TouchableOpacity
                    key={days}
                    style={[styles.numChip, newDays === days && styles.numChipActive]}
                    onPress={() => setNewDays(days)}
                  >
                    <Text style={[styles.numChipValue, newDays === days && styles.numChipValueActive]}>{days}</Text>
                    <Text style={[styles.numChipLabel, newDays === days && styles.numChipLabelActive]}>days</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            {/* XP Reward Selection */}
            <Text style={styles.modalLabel}>XP Reward</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.choiceRow}>
                {xpOptions.map(xp => (
                  <TouchableOpacity
                    key={xp}
                    style={[styles.numChip, styles.xpChip, newXp === xp && styles.xpChipActive]}
                    onPress={() => setNewXp(xp)}
                  >
                    <Text style={[styles.numChipValue, newXp === xp && styles.xpChipValueActive]}>{xp}</Text>
                    <Text style={[styles.numChipLabel, newXp === xp && styles.xpChipLabelActive]}>XP</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            {/* Circle Selection */}
            <Text style={styles.modalLabel}>Share with Circle (tap to select)</Text>
            {userCircles.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.circleChip, !selectedCircleId && styles.circleChipActive]}
                    onPress={() => {
                      console.log('Selected Just Me');
                      setSelectedCircleId(null);
                    }}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.circleChipText, !selectedCircleId && styles.circleChipTextActive]}>🔒 Just Me</Text>
                  </TouchableOpacity>
                  {userCircles.map(circle => (
                    <TouchableOpacity
                      key={circle.id}
                      style={[styles.circleChip, selectedCircleId === circle.id && styles.circleChipActive]}
                      onPress={() => {
                        console.log('Selected circle:', circle.id, circle.name);
                        setSelectedCircleId(circle.id);
                      }}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.circleEmoji}>{circle.emoji || '👥'}</Text>
                      <Text style={[styles.circleChipText, selectedCircleId === circle.id && styles.circleChipTextActive]}>
                        {circle.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedCircleId && (
                  <Text style={{ fontSize: 12, color: '#10B981', marginTop: 8 }}>
                    ✓ Challenge will be shared with circle members
                  </Text>
                )}
              </View>
            ) : (
              <View style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>
                  🔒 Join or create a circle to share challenges with friends
                </Text>
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowCreateModal(false); setEditingChallenge(null); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleCreateChallenge}>
                <Text style={styles.modalSaveText}>{editingChallenge ? 'Save' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Challenge Options Modal */}
      <Modal visible={showOptionsModal} animationType="fade" transparent onRequestClose={() => setShowOptionsModal(false)}>
        <View style={styles.optionsOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowOptionsModal(false)} />
          <View style={styles.optionsSheet}>
            <View style={styles.optionsHandle} />
            {selectedChallengeForOptions && (
              <>
                <Text style={styles.optionsTitle}>{selectedChallengeForOptions.name}</Text>
                <TouchableOpacity 
                  style={styles.optionItem}
                  onPress={() => handleEditChallenge(selectedChallengeForOptions)}
                >
                  <Feather name="edit-2" size={20} color="#0F172A" />
                  <Text style={styles.optionText}>Edit Challenge</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionItem, styles.optionItemWarning]}
                  onPress={() => {
                    setShowOptionsModal(false);
                    handleLeaveChallenge(selectedChallengeForOptions.id);
                  }}
                >
                  <Feather name="log-out" size={20} color="#F97316" />
                  <Text style={[styles.optionText, { color: '#F97316' }]}>Leave Challenge</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionItem, styles.optionItemDanger]}
                  onPress={() => {
                    setShowOptionsModal(false);
                    handleDeleteChallenge(selectedChallengeForOptions.id);
                  }}
                >
                  <Feather name="trash-2" size={20} color="#EF4444" />
                  <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete Challenge</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  addButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', top: 10, left: 20, right: 20, zIndex: 10, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  toastSuccess: { backgroundColor: '#ECFDF5' },
  toastInfo: { backgroundColor: '#F1F5F9' },
  toastText: { fontSize: 12, color: '#0F172A', fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, width: '100%', maxWidth: 390, alignSelf: 'center' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  modalLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  modalInput: { backgroundColor: '#F1F5F9', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A', marginBottom: 12 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  choiceChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: '#F1F5F9' },
  choiceChipActive: { backgroundColor: '#0F172A' },
  choiceText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  choiceTextActive: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  modalCancelText: { color: '#64748B', fontWeight: '700' },
  modalSave: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0F172A', alignItems: 'center' },
  modalSaveText: { color: '#FFFFFF', fontWeight: '700' },
  statsBanner: { marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakIconContainer: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  streakValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  streakValue: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  streakLabel: { fontSize: 14, color: '#64748B' },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  xpText: { fontSize: 13, fontWeight: '600', color: '#8B5CF6' },
  levelText: { fontSize: 11, color: '#94A3B8' },
  statsRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankInfo: { alignItems: 'flex-end' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rankValue: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  rankTotal: { fontSize: 11, color: '#64748B' },
  trophyContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  xpProgressContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  xpProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpProgressLabel: { fontSize: 11, color: '#64748B' },
  xpProgressValue: { fontSize: 11, fontWeight: '500', color: '#8B5CF6' },
  xpProgressBar: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  xpProgressFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 4 },
  tabContainer: { paddingHorizontal: 20, marginBottom: 16 },
  tabBar: { flexDirection: 'row', gap: 4, padding: 4, backgroundColor: '#F1F5F9', borderRadius: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, minHeight: 44 },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  tabTextActive: { color: '#0F172A' },
  content: { paddingHorizontal: 20 },
  challengesList: { gap: 16 },
  inviteCard: { padding: 16, borderRadius: 16, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  inviteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  inviteHeaderText: { fontSize: 13, fontWeight: '600', color: '#B45309' },
  inviteContent: { flexDirection: 'row', alignItems: 'center' },
  inviteIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  inviteInfo: { flex: 1, marginLeft: 12 },
  inviteName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  inviteDetails: { fontSize: 12, color: '#64748B', marginTop: 2 },
  inviteActions: { flexDirection: 'row', gap: 8 },
  declineButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFFFFF', minHeight: 44, justifyContent: 'center' },
  joinButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#0F172A', minHeight: 44, justifyContent: 'center' },
  joinButtonText: { fontSize: 13, fontWeight: '500', color: '#FFFFFF' },
  challengeCard: { borderRadius: 16, backgroundColor: '#FFFFFF', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  challengeHeader: { padding: 16 },
  challengeHeaderContent: { flexDirection: 'row', alignItems: 'center' },
  challengeIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  challengeHeaderInfo: { flex: 1, marginLeft: 12 },
  challengeHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  challengeOptionsButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  challengeName: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF' },
  challengeMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  challengeMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  challengeMetaDot: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginHorizontal: 4 },
  completedBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  streakBadgeText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  challengeProgress: { marginTop: 16 },
  challengeProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  challengeProgressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  challengeProgressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  challengeProgressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 4 },
  challengeBody: { padding: 16 },
  todayStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  todayPrompt: { flex: 1, fontSize: 13, color: '#64748B', marginLeft: 8 },
  todayCount: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  miniLeaderboard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniLeaderboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  miniLeaderboardTitle: { fontSize: 12, fontWeight: '600', color: '#475569' },
  miniLeaderboardCta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniLeaderboardHint: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  memberAvatars: { flexDirection: 'row', gap: 8 },
  memberAvatarContainer: { position: 'relative' },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  memberAvatarYou: { borderColor: '#8B5CF6' },
  memberAvatarText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  rankBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankBadge1: { backgroundColor: '#FCD34D' },
  rankBadge2: { backgroundColor: '#D1D5DB' },
  rankBadge3: { backgroundColor: '#FDE68A' },
  rankBadgeText: { fontSize: 8, fontWeight: 'bold', color: '#78350F' },
  expandedLeaderboard: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 8 },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 12 },
  leaderboardRowYou: { backgroundColor: '#F5F3FF' },
  leaderboardRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leaderboardRank: { width: 24, fontSize: 13, fontWeight: 'bold', color: '#94A3B8' },
  leaderboardRankTop: { color: '#D97706' },
  leaderboardAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  leaderboardAvatarText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  leaderboardName: { fontSize: 14, fontWeight: '500', color: '#475569' },
  leaderboardNameYou: { color: '#7C3AED' },
  leaderboardStreak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leaderboardStreakText: { fontSize: 14, fontWeight: 'bold', color: '#F97316' },
  stakesBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF1F2', marginBottom: 12 },
  stakesEmoji: { fontSize: 12 },
  stakesText: { fontSize: 12, fontWeight: '500', color: '#BE123C' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0F172A', minHeight: 44 },
  submitButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  completedButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: '#ECFDF5' },
  completedButtonText: { fontSize: 15, fontWeight: '600', color: '#059669' },
  leaderboardTab: { gap: 16 },
  timeframeSelector: { flexDirection: 'row', gap: 8 },
  timeframeButton: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center' },
  timeframeButtonActive: { backgroundColor: '#0F172A' },
  timeframeButtonText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  timeframeButtonTextActive: { color: '#FFFFFF' },
  podiumCard: { padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 12 },
  podiumPosition: { alignItems: 'center' },
  podiumPosition1: { marginTop: -16 },
  podiumAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 4, marginBottom: 8 },
  podiumAvatar1: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F97316', borderColor: '#FDE68A' },
  podiumAvatar2: { backgroundColor: '#94A3B8', borderColor: '#E2E8F0' },
  podiumAvatar3: { backgroundColor: '#FCD34D', borderColor: '#FDE68A' },
  podiumAvatarYou: { backgroundColor: '#8B5CF6', borderColor: '#C4B5FD' },
  podiumAvatarText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  podiumAvatarText1: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  podiumName: { fontSize: 13, fontWeight: '600', color: '#475569' },
  podiumName1: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  podiumNameYou: { color: '#7C3AED' },
  podiumXP: { fontSize: 11, color: '#64748B', marginTop: 2 },
  podiumXP1: { fontSize: 12, color: '#D97706', fontWeight: '500' },
  podiumStand: { marginTop: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center' },
  podiumStand1: { width: 96, height: 96, backgroundColor: '#FDE68A' },
  podiumStand2: { width: 80, height: 64, backgroundColor: '#E2E8F0' },
  podiumStand3: { width: 80, height: 48, backgroundColor: '#FEF3C7' },
  podiumStandYou: { backgroundColor: '#EDE9FE' },
  podiumNumber: { fontSize: 24, fontWeight: '900', color: '#94A3B8' },
  podiumNumber1: { fontSize: 32, color: '#B45309' },
  podiumNumberYou: { color: '#8B5CF6' },
  fullLeaderboard: { borderRadius: 16, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  leaderboardItemYou: { backgroundColor: '#F5F3FF' },
  leaderboardItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leaderboardItemRank: { width: 32, fontSize: 15, fontWeight: 'bold', color: '#94A3B8' },
  leaderboardItemAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#94A3B8', alignItems: 'center', justifyContent: 'center' },
  leaderboardItemAvatarYou: { backgroundColor: '#8B5CF6' },
  leaderboardItemAvatarText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  leaderboardItemName: { fontSize: 15, fontWeight: '600', color: '#334155' },
  leaderboardItemNameYou: { color: '#7C3AED' },
  leaderboardItemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  leaderboardItemXP: { fontSize: 12, color: '#64748B' },
  leaderboardItemDot: { color: '#94A3B8' },
  leaderboardItemStreak: { fontSize: 12, color: '#F97316' },
  leaderboardItemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leaderboardItemWins: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  achievementsTab: { gap: 12 },
  achievementStats: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  achievementStat: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center' },
  achievementStatValue: { fontSize: 20, fontWeight: 'bold' },
  achievementStatLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },
  achievementCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  achievementCardLocked: { opacity: 0.7 },
  achievementIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  achievementIconUnlocked: { backgroundColor: '#FEF3C7' },
  achievementIconLocked: { backgroundColor: '#F1F5F9' },
  achievementInfo: { flex: 1, marginLeft: 16 },
  achievementTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  achievementName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  achievementNameLocked: { color: '#64748B' },
  achievementDescription: { fontSize: 12, color: '#64748B', marginTop: 2 },
  achievementProgress: { marginTop: 8 },
  achievementProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  achievementProgressText: { fontSize: 10, color: '#94A3B8' },
  achievementProgressBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  achievementProgressFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 3 },
  achievementXP: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  achievementXPUnlocked: { backgroundColor: '#ECFDF5' },
  achievementXPLocked: { backgroundColor: '#F1F5F9' },
  achievementXPText: { fontSize: 12, fontWeight: 'bold' },
  achievementXPTextUnlocked: { color: '#059669' },
  achievementXPTextLocked: { color: '#64748B' },
  // New styles for chip selectors
  chipScroll: { marginBottom: 12, marginHorizontal: -4 },
  categoryEmoji: { fontSize: 14, marginRight: 4 },
  numChip: { 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 14, 
    backgroundColor: '#F1F5F9',
    minWidth: 60,
  },
  numChipActive: { backgroundColor: '#0F172A' },
  numChipValue: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  numChipValueActive: { color: '#FFFFFF' },
  numChipLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  numChipLabelActive: { color: 'rgba(255,255,255,0.7)' },
  xpChip: { backgroundColor: '#F5F3FF' },
  xpChipActive: { backgroundColor: '#8B5CF6' },
  xpChipValueActive: { color: '#FFFFFF' },
  xpChipLabelActive: { color: 'rgba(255,255,255,0.7)' },
  circleChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 14, 
    backgroundColor: '#F1F5F9',
    minHeight: 44,
    marginRight: 8,
  },
  circleChipActive: { backgroundColor: '#0F172A' },
  circleEmoji: { fontSize: 14 },
  circleChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  circleChipTextActive: { color: '#FFFFFF' },
  // Options modal styles
  optionsOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  optionsSheet: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 20, 
    width: '85%', 
    maxWidth: 320,
  },
  optionsHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 16 },
  optionsTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 16 },
  optionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingVertical: 14, 
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionItemWarning: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' },
  optionItemDanger: { marginTop: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  optionText: { fontSize: 15, fontWeight: '500', color: '#0F172A' },});