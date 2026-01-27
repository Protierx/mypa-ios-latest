import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Alert,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { circlesApi } from '../services/api';
import {
  Users,
  Plus,
  Flame,
  Search,
  X,
  Check,
  ChevronRight,
  Sparkles,
  Zap,
  Bell,
  MoreHorizontal,
  UserPlus,
  Settings,
  Trash2,
  Dumbbell,
  Briefcase,
  BookOpen,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CirclesScreenProps {
  onModalStateChange?: (isOpen: boolean) => void;
  navigation?: any;
}

interface CircleMember {
  initial: string;
  posted: boolean;
}

interface Circle {
  id: number;
  name: string;
  members: CircleMember[];
  challenge: string;
  posted: number;
  total: number;
  streak: number;
  lastActivity: string;
  inviteCode: string;
  inviteLink: string;
  privacy?: 'public' | 'private';
}

// Generate a random invite code (e.g., MYPA-7K2P)
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MYPA-${code}`;
}

export function CirclesScreen({ onModalStateChange, navigation }: CirclesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChip, setFilterChip] = useState<'all' | 'active' | 'your-turn'>('all');
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [longPressedCard, setLongPressedCard] = useState<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const joinHighlightTimer = useRef<NodeJS.Timeout | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCircle, setCreatingCircle] = useState(false);
  const [joiningCircle, setJoiningCircle] = useState(false);

  const [circles, setCircles] = useState<Circle[]>([
    {
      id: 1,
      name: 'Morning Warriors',
      members: [
        { initial: 'A', posted: true },
        { initial: 'B', posted: true },
        { initial: 'C', posted: false },
        { initial: 'D', posted: true },
      ],
      challenge: '30-day fitness streak',
      posted: 3,
      total: 4,
      streak: 12,
      lastActivity: '24m ago',
      inviteCode: 'MYPA-7K2P',
      inviteLink: 'https://mypa.app/invite/MYPA-7K2P',
    },
    {
      id: 2,
      name: 'Product Team',
      members: [
        { initial: 'J', posted: true },
        { initial: 'M', posted: true },
        { initial: 'S', posted: false },
      ],
      challenge: 'Daily standup attendance',
      posted: 2,
      total: 3,
      streak: 8,
      lastActivity: '12m ago',
      inviteCode: 'MYPA-9F4L',
      inviteLink: 'https://mypa.app/invite/MYPA-9F4L',
    },
    {
      id: 3,
      name: 'Book Club',
      members: [
        { initial: 'E', posted: true },
        { initial: 'R', posted: false },
        { initial: 'L', posted: true },
        { initial: 'K', posted: false },
        { initial: 'P', posted: true },
      ],
      challenge: 'Read 15min daily',
      posted: 3,
      total: 5,
      streak: 5,
      lastActivity: '2h ago',
      inviteCode: 'MYPA-2X8Q',
      inviteLink: 'https://mypa.app/invite/MYPA-2X8Q',
    },
  ]);

  // Fetch circles from API on mount
  useEffect(() => {
    fetchCircles();
  }, []);

  const fetchCircles = async () => {
    setLoading(true);
    try {
      const response = await circlesApi.list();
      if (response.success && response.data && response.data.length > 0) {
        // Transform API data to match local Circle interface
        const apiCircles: Circle[] = response.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          members: c.members?.map((m: any) => ({
            initial: (m.user?.name || m.user?.username || 'U').charAt(0).toUpperCase(),
            posted: false, // TODO: Track from daily cards
          })) || [],
          challenge: c.description || '',
          posted: 0,
          total: c._count?.members || c.members?.length || 1,
          streak: c.currentStreak || 0,
          lastActivity: 'Active',
          inviteCode: c.inviteCode || generateInviteCode(),
          inviteLink: `https://mypa.app/invite/${c.inviteCode}`,
          privacy: c.isPublic ? 'public' : 'private',
        }));
        setCircles(apiCircles);
      }
      // If no API circles, keep mock data
    } catch (error) {
      console.error('Failed to fetch circles:', error);
      // Keep mock data on error
    } finally {
      setLoading(false);
    }
  };

  // Also persist to AsyncStorage as backup
  useEffect(() => {
    const persist = async () => {
      try {
        await AsyncStorage.setItem('circlesData', JSON.stringify(circles));
      } catch (e) {
        // noop
      }
    };
    if (!loading) persist();
  }, [circles, loading]);

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

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMembers, setNewMembers] = useState('');
  const [newPrivacy, setNewPrivacy] = useState<'public' | 'private'>('public');
  const [justJoinedCircle, setJustJoinedCircle] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const cardAnimations = useRef<Animated.Value[]>([]).current;

  // Initialize card animations
  useEffect(() => {
    circles.forEach((_, index) => {
      if (!cardAnimations[index]) {
        cardAnimations[index] = new Animated.Value(0);
      }
    });
  }, [circles]);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger card animations
    circles.forEach((_, index) => {
      if (cardAnimations[index]) {
        Animated.timing(cardAnimations[index], {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    });
  }, []);

  // Navigation helper
  const handleNavigate = (screen: string, params?: any) => {
    if (!navigation) return;
    if (screen === 'circle-home') {
      navigation.navigate('CircleHome', params);
    } else if (screen === 'plan') {
      navigation.navigate('Plan');
    } else if (screen === 'hub') {
      navigation.navigate('Home', { screen: 'Hub' });
    } else {
      navigation.navigate(screen, params);
    }
  };

  // Navigate to circle with data
  const openCircle = (circle: Circle) => {
    handleNavigate('circle-home', {
      circleId: circle.id,
      circleName: circle.name,
      inviteCode: circle.inviteCode,
    });
  };

  // Check for pending circle actions from Inbox
  useEffect(() => {
    const checkForPendingAction = async () => {
      try {
        const pendingAction = await AsyncStorage.getItem('pendingCircleAction');
        if (pendingAction) {
          const action = JSON.parse(pendingAction);
          if (action.action === 'join' && action.circleName) {
            const existingCircle = circles.find(c =>
              c.name.toLowerCase().includes(action.circleName.toLowerCase())
            );

            if (existingCircle) {
              setCircles(prev =>
                prev.map(c => {
                  if (c.id === existingCircle.id) {
                    if (!c.members.some(m => m.initial === 'Y')) {
                      return {
                        ...c,
                        members: [...c.members, { initial: 'Y', posted: false }],
                        total: c.total + 1,
                      };
                    }
                  }
                  return c;
                })
              );
              setJustJoinedCircle(existingCircle.name);
            } else {
              const inviteCode = generateInviteCode();
              const newCircle: Circle = {
                id: Math.max(0, ...circles.map(c => c.id)) + 1,
                name: action.circleName,
                members: [{ initial: 'Y', posted: false }],
                challenge: '',
                posted: 0,
                total: 1,
                streak: 0,
                lastActivity: 'just now',
                inviteCode: inviteCode,
                inviteLink: `https://mypa.app/invite/${inviteCode}`,
              };
              setCircles(prev => [newCircle, ...prev]);
              setJustJoinedCircle(action.circleName);
            }

            await AsyncStorage.removeItem('pendingCircleAction');

            if (joinHighlightTimer.current) {
              clearTimeout(joinHighlightTimer.current);
            }
            joinHighlightTimer.current = setTimeout(() => setJustJoinedCircle(null), 3000);
          }
        }
      } catch (e) {
        console.error('Error processing pending circle action', e);
      }
    };

    checkForPendingAction();
  }, []);

  useEffect(() => {
    return () => {
      if (joinHighlightTimer.current) clearTimeout(joinHighlightTimer.current);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  // Update parent about modal state
  useEffect(() => {
    const isAnyModalOpen = joinModalOpen || createOpen || longPressedCard !== null;
    onModalStateChange?.(isAnyModalOpen);
  }, [joinModalOpen, createOpen, longPressedCard, onModalStateChange]);

  // Handle long press for card actions
  const handlePressIn = (circleId: number) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressedCard(circleId);
    }, 500);
  };

  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  async function handleCreateCircle() {
    if (!newName.trim()) return;

    setCreatingCircle(true);
    try {
      const response = await circlesApi.create({
        name: newName.trim(),
        description: '',
        isPublic: newPrivacy === 'public',
      });

      if (response.success && response.data) {
        // Create local circle from API response
        const newCircle: Circle = {
          id: response.data.id,
          name: response.data.name,
          members: [{ initial: 'U', posted: false }], // Creator is first member
          challenge: response.data.description || '',
          posted: 0,
          total: 1,
          streak: 0,
          lastActivity: 'just now',
          privacy: response.data.isPublic ? 'public' : 'private',
          inviteCode: response.data.inviteCode,
          inviteLink: `https://mypa.app/invite/${response.data.inviteCode}`,
        };

        setCircles([newCircle, ...circles]);
        setNewName('');
        setNewMembers('');
        setNewPrivacy('public');
        setCreateOpen(false);
        showToast('Circle created', 'success');
      } else {
        Alert.alert('Error', response.error || 'Failed to create circle');
      }
    } catch (error) {
      console.error('Create circle error:', error);
      Alert.alert('Error', 'Failed to create circle. Please try again.');
    } finally {
      setCreatingCircle(false);
    }
  }

  async function handleJoinCircle() {
    if (!joinCode.trim()) return;

    setJoinError('');
    setJoiningCircle(true);
    
    try {
      const normalizedCode = joinCode.trim().toUpperCase();
      const response = await circlesApi.joinByCode(normalizedCode);

      if (response.success && response.data) {
        // Add the joined circle to local state
        const joinedCircle: Circle = {
          id: response.data.id,
          name: response.data.name,
          members: response.data.members?.map((m: any) => ({
            initial: (m.user?.name || m.user?.username || 'U').charAt(0).toUpperCase(),
            posted: false,
          })) || [{ initial: 'U', posted: false }],
          challenge: response.data.description || '',
          posted: 0,
          total: response.data._count?.members || response.data.members?.length || 1,
          streak: response.data.currentStreak || 0,
          lastActivity: 'just now',
          privacy: response.data.isPublic ? 'public' : 'private',
          inviteCode: response.data.inviteCode,
          inviteLink: `https://mypa.app/invite/${response.data.inviteCode}`,
        };

        // Check if already in list
        const existingIndex = circles.findIndex(c => c.id === joinedCircle.id);
        if (existingIndex >= 0) {
          // Update existing
          const updated = [...circles];
          updated[existingIndex] = joinedCircle;
          setCircles(updated);
        } else {
          // Add new
          setCircles([joinedCircle, ...circles]);
        }

        setJoinSuccess(true);
        setJoinCode('');
        showToast('Joined circle', 'success');

        if (joinHighlightTimer.current) clearTimeout(joinHighlightTimer.current);
        joinHighlightTimer.current = setTimeout(() => {
          setJoinSuccess(false);
          setJoinModalOpen(false);
        }, 1500);
      } else {
        setJoinError(response.error || 'Invalid code. Please check and try again.');
      }
    } catch (error) {
      console.error('Join circle error:', error);
      setJoinError('Failed to join circle. Please try again.');
    } finally {
      setJoiningCircle(false);
    }
  }

  // Calculate filtered circles based on search and filter
  let filteredCircles = [...circles];

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredCircles = filteredCircles.filter(circle =>
      circle.name.toLowerCase().includes(query)
    );
  }

  if (filterChip === 'active') {
    filteredCircles = filteredCircles.filter(c => c.posted > 0);
  } else if (filterChip === 'your-turn') {
    filteredCircles = filteredCircles.filter(c => c.posted < c.total);
  }

  const totalStreaks = circles.reduce((sum, c) => sum + c.streak, 0);
  const totalPosted = circles.reduce((sum, c) => sum + c.posted, 0);
  const totalMembers = Math.max(1, circles.reduce((sum, c) => sum + c.total, 0));
  const activePercentage = Math.round((totalPosted / totalMembers) * 100);

  const getCircleIcon = (index: number) => {
    const icons = [Dumbbell, Briefcase, BookOpen];
    const Icon = icons[index % 3];
    return <Icon color="#fff" size={24} />;
  };

  const getCircleGradient = (index: number): [string, string] => {
    const gradients: [string, string][] = [
      ['#8b5cf6', '#9333ea'],
      ['#f43f5e', '#ec4899'],
      ['#10b981', '#14b8a6'],
    ];
    return gradients[index % 3];
  };

  return (
    <View style={styles.container}>
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
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9', '#f8fafc']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Circles</Text>
              <Text style={styles.headerSubtitle}>
                {circles.length} circles • {totalMembers} members
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <Pressable
                onPress={() => setJoinModalOpen(true)}
                style={({ pressed }) => [
                  styles.joinButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Join a circle"
              >
                <BlurView intensity={40} tint="light" style={styles.joinButtonBlur}>
                  <Text style={styles.joinButtonText}>Join</Text>
                </BlurView>
              </Pressable>
              <Pressable
                onPress={() => setCreateOpen(true)}
                style={({ pressed }) => [
                  styles.createButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Create a new circle"
              >
                <Plus color="#fff" size={20} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          {/* Quick Stats Row */}
          <View style={styles.statsContainer}>
            <BlurView intensity={40} tint="light" style={styles.statsBlur}>
              <View style={styles.statsContent}>
                <View style={styles.statsLeft}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: '#fff7ed' }]}>
                      <Flame color="#f97316" size={16} />
                    </View>
                    <View>
                      <Text style={styles.statValue}>{totalStreaks}</Text>
                      <Text style={styles.statLabel}>Streaks</Text>
                    </View>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: '#ecfdf5' }]}>
                      <Zap color="#10b981" size={16} />
                    </View>
                    <View>
                      <Text style={[styles.statValue, { color: '#059669' }]}>
                        {activePercentage}%
                      </Text>
                      <Text style={styles.statLabel}>Active</Text>
                    </View>
                  </View>
                </View>

                {circles.some(c => c.posted < c.total) && (
                  <Pressable
                    onPress={() => {
                      // TODO: Hook up real nudge delivery once notifications are wired.
                      Alert.alert('Nudge', 'Nudge sent!');
                    }}
                    style={({ pressed }) => [
                      styles.nudgeButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Bell color="#d97706" size={16} />
                    <Text style={styles.nudgeText}>Nudge</Text>
                  </Pressable>
                )}
              </View>
            </BlurView>
          </View>

          {/* Search & Filter Row */}
          <View style={styles.searchFilterRow}>
            <View style={styles.searchContainer}>
              <Search
                color="#94a3b8"
                size={16}
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search"
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <X color="#94a3b8" size={16} />
                </Pressable>
              )}
            </View>

            <View style={styles.filterChips}>
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'your-turn', label: 'Pending' },
              ].map(tab => (
                <Pressable
                  key={tab.id}
                  onPress={() => setFilterChip(tab.id as any)}
                  style={[
                    styles.filterChip,
                    filterChip === tab.id && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterChip === tab.id && styles.filterChipTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Circles List */}
          <View style={styles.circlesList}>
            {filteredCircles.length === 0 ? (
              <View style={styles.emptyState}>
                <BlurView intensity={40} tint="light" style={styles.emptyStateBlur}>
                  <View style={styles.emptyIconContainer}>
                    <Users color="#94a3b8" size={32} />
                  </View>
                  <Text style={styles.emptyTitle}>No circles found</Text>
                  <Text style={styles.emptySubtitle}>
                    Create or join a circle to get started
                  </Text>
                  <Pressable
                    onPress={() => setCreateOpen(true)}
                    style={({ pressed }) => [
                      styles.emptyButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.emptyButtonText}>Create Circle</Text>
                  </Pressable>
                </BlurView>
              </View>
            ) : (
              filteredCircles.map((circle, index) => {
                const isExpanded = expandedCard === circle.id;
                const isJustJoined = justJoinedCircle === circle.name;

                return (
                  <Animated.View
                    key={circle.id}
                    style={[
                      styles.circleCard,
                      isJustJoined && styles.circleCardHighlight,
                      {
                        opacity: cardAnimations[index] || 1,
                        transform: [
                          {
                            translateY: cardAnimations[index]
                              ? cardAnimations[index].interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [20, 0],
                                })
                              : 0,
                          },
                        ],
                      },
                    ]}
                  >
                    <BlurView intensity={60} tint="light" style={styles.circleCardBlur}>
                      {/* Just Joined Banner */}
                      {isJustJoined && (
                        <LinearGradient
                          colors={['#10b981', '#14b8a6']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.joinedBanner}
                        >
                          <Check color="#fff" size={16} />
                          <Text style={styles.joinedBannerText}>
                            Successfully joined!
                          </Text>
                        </LinearGradient>
                      )}

                      {/* Main Card Content */}
                      <Pressable
                        onPress={() => {
                          if (isExpanded) {
                            openCircle(circle);
                          } else {
                            setExpandedCard(isExpanded ? null : circle.id);
                          }
                        }}
                        onPressIn={() => handlePressIn(circle.id)}
                        onPressOut={handlePressOut}
                        style={({ pressed }) => [
                          styles.circleCardContent,
                          pressed && !isExpanded && styles.cardPressed,
                        ]}
                      >
                        <View style={styles.circleRow}>
                          {/* Circle Avatar */}
                          <LinearGradient
                            colors={getCircleGradient(index)}
                            style={styles.circleAvatar}
                          >
                            {getCircleIcon(index)}
                          </LinearGradient>

                          {/* Circle Info */}
                          <View style={styles.circleInfo}>
                            <View style={styles.circleTitleRow}>
                              <Text style={styles.circleName} numberOfLines={1}>
                                {circle.name}
                              </Text>
                              {circle.streak >= 7 && (
                                <View style={styles.streakBadge}>
                                  <Flame color="#f97316" size={12} />
                                  <Text style={styles.streakBadgeText}>
                                    {circle.streak}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.circleSubtitle}>
                              {circle.total} members • {circle.lastActivity}
                            </Text>
                          </View>

                          {/* Status & Arrow */}
                          <View style={styles.circleStatus}>
                            <View
                              style={[
                                styles.statusBadge,
                                circle.posted === circle.total
                                  ? styles.statusBadgeDone
                                  : styles.statusBadgePending,
                              ]}
                            >
                              {circle.posted === circle.total ? (
                                <View style={styles.statusDoneContent}>
                                  <Sparkles color="#059669" size={12} />
                                  <Text style={styles.statusDoneText}>Done</Text>
                                </View>
                              ) : (
                                <Text style={styles.statusPendingText}>
                                  {circle.posted}/{circle.total}
                                </Text>
                              )}
                            </View>
                            <ChevronRight
                              color="#cbd5e1"
                              size={20}
                              style={{
                                transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                              }}
                            />
                          </View>
                        </View>

                        {/* Member Progress Bar */}
                        <View style={styles.progressRow}>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                circle.posted === circle.total
                                  ? styles.progressFillDone
                                  : styles.progressFillPending,
                                {
                                  width: `${(circle.posted / circle.total) * 100}%`,
                                },
                              ]}
                            />
                          </View>
                          <View style={styles.memberAvatars}>
                            {circle.members.slice(0, 4).map((member, i) => (
                              <View
                                key={i}
                                style={[
                                  styles.memberAvatar,
                                  member.posted
                                    ? styles.memberAvatarPosted
                                    : styles.memberAvatarPending,
                                  { marginLeft: i > 0 ? -6 : 0 },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.memberInitial,
                                    member.posted
                                      ? styles.memberInitialPosted
                                      : styles.memberInitialPending,
                                  ]}
                                >
                                  {member.initial}
                                </Text>
                              </View>
                            ))}
                            {circle.members.length > 4 && (
                              <View
                                style={[
                                  styles.memberAvatar,
                                  styles.memberAvatarMore,
                                  { marginLeft: -6 },
                                ]}
                              >
                                <Text style={styles.memberMoreText}>
                                  +{circle.members.length - 4}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </Pressable>

                      {/* Expanded Quick Actions */}
                      {isExpanded && (
                        <Animated.View style={styles.expandedActions}>
                          <View style={styles.expandedButtonsRow}>
                            <Pressable
                              onPress={() => openCircle(circle)}
                              style={({ pressed }) => [
                                styles.openCircleButton,
                                pressed && styles.buttonPressed,
                              ]}
                            >
                              <Text style={styles.openCircleText}>Open Circle</Text>
                            </Pressable>
                            <Pressable
                              onPress={() =>
                                Alert.alert(
                                  'Invite Code',
                                  `Share this code: ${circle.inviteCode}`
                                )
                              }
                              style={({ pressed }) => [
                                styles.actionButton,
                                pressed && styles.buttonPressed,
                              ]}
                            >
                              <UserPlus color="#475569" size={16} />
                            </Pressable>
                            <Pressable
                              onPress={() => setLongPressedCard(circle.id)}
                              style={({ pressed }) => [
                                styles.actionButton,
                                pressed && styles.buttonPressed,
                              ]}
                            >
                              <MoreHorizontal color="#475569" size={16} />
                            </Pressable>
                          </View>
                        </Animated.View>
                      )}
                    </BlurView>
                  </Animated.View>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Long Press Action Sheet Modal */}
      <Modal
        visible={longPressedCard !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLongPressedCard(null)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setLongPressedCard(null)} />
          <Animated.View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />

            <Pressable
              onPress={() => {
                const circle = circles.find(c => c.id === longPressedCard);
                if (circle) openCircle(circle);
                setLongPressedCard(null);
              }}
              style={({ pressed }) => [
                styles.actionSheetItem,
                pressed && styles.actionSheetItemPressed,
              ]}
            >
              <View style={[styles.actionSheetIcon, { backgroundColor: '#f5f3ff' }]}>
                <Users color="#7c3aed" size={20} />
              </View>
              <View style={styles.actionSheetText}>
                <Text style={styles.actionSheetTitle}>Open Circle</Text>
                <Text style={styles.actionSheetSubtitle}>
                  View posts and activity
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                const circle = circles.find(c => c.id === longPressedCard);
                if (circle) {
                  // TODO: Add clipboard copy/share sheet for invite codes.
                  Alert.alert('Invite Code', `Share this code: ${circle.inviteCode}`);
                }
                setLongPressedCard(null);
              }}
              style={({ pressed }) => [
                styles.actionSheetItem,
                pressed && styles.actionSheetItemPressed,
              ]}
            >
              <View style={[styles.actionSheetIcon, { backgroundColor: '#eff6ff' }]}>
                <UserPlus color="#3b82f6" size={20} />
              </View>
              <View style={styles.actionSheetText}>
                <Text style={styles.actionSheetTitle}>Invite Members</Text>
                <Text style={styles.actionSheetSubtitle}>Share invite code</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                // TODO: Open circle-specific settings screen.
                Alert.alert('Settings', 'Circle settings');
                setLongPressedCard(null);
              }}
              style={({ pressed }) => [
                styles.actionSheetItem,
                pressed && styles.actionSheetItemPressed,
              ]}
            >
              <View style={[styles.actionSheetIcon, { backgroundColor: '#f1f5f9' }]}>
                <Settings color="#475569" size={20} />
              </View>
              <View style={styles.actionSheetText}>
                <Text style={styles.actionSheetTitle}>Settings</Text>
                <Text style={styles.actionSheetSubtitle}>
                  Notifications & privacy
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                Alert.alert(
                  'Leave Circle',
                  'Are you sure you want to leave this circle?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Leave',
                      style: 'destructive',
                      onPress: () => {
                        setCircles(circles.filter(c => c.id !== longPressedCard));
                        setLongPressedCard(null);
                      },
                    },
                  ]
                );
              }}
              style={({ pressed }) => [
                styles.actionSheetItem,
                pressed && styles.actionSheetItemPressedDanger,
              ]}
            >
              <View style={[styles.actionSheetIcon, { backgroundColor: '#fef2f2' }]}>
                <Trash2 color="#dc2626" size={20} />
              </View>
              <View style={styles.actionSheetText}>
                <Text style={[styles.actionSheetTitle, { color: '#dc2626' }]}>
                  Leave Circle
                </Text>
                <Text style={styles.actionSheetSubtitle}>
                  Remove yourself from this circle
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* Create Circle Modal */}
      <Modal
        visible={createOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setCreateOpen(false)} />
          <View style={styles.createModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create Circle</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Weekend Runners"
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />

            <Text style={styles.inputLabel}>Invite Members</Text>
            <TextInput
              value={newMembers}
              onChangeText={setNewMembers}
              placeholder="Alex, Sam, Priya"
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
            />

            <Text style={styles.inputLabel}>Privacy</Text>
            <View style={styles.privacyRow}>
              <Pressable
                onPress={() => setNewPrivacy('public')}
                style={[
                  styles.privacyButton,
                  newPrivacy === 'public' && styles.privacyButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.privacyButtonText,
                    newPrivacy === 'public' && styles.privacyButtonTextActive,
                  ]}
                >
                  Public
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setNewPrivacy('private')}
                style={[
                  styles.privacyButton,
                  newPrivacy === 'private' && styles.privacyButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.privacyButtonText,
                    newPrivacy === 'private' && styles.privacyButtonTextActive,
                  ]}
                >
                  Private
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleCreateCircle}
              disabled={!newName.trim()}
              style={({ pressed }) => [
                styles.createSubmitButton,
                !newName.trim() && styles.createSubmitButtonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.createSubmitText}>Create Circle</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Join Circle Modal */}
      <Modal
        visible={joinModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setJoinModalOpen(false);
          setJoinError('');
          setJoinCode('');
        }}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              setJoinModalOpen(false);
              setJoinError('');
              setJoinCode('');
            }}
          />
          <View style={styles.joinModal}>
            <View style={styles.modalHandle} />

            {joinSuccess ? (
              <View style={styles.joinSuccessContainer}>
                <View style={styles.joinSuccessIcon}>
                  <Check color="#059669" size={32} />
                </View>
                <Text style={styles.joinSuccessTitle}>You're in!</Text>
                <Text style={styles.joinSuccessSubtitle}>
                  Successfully joined the circle
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>Join Circle</Text>
                <Text style={styles.modalSubtitle}>
                  Enter the invite code to join
                </Text>

                <TextInput
                  value={joinCode}
                  onChangeText={text => {
                    setJoinCode(text.toUpperCase());
                    setJoinError('');
                  }}
                  placeholder="e.g. MYPA-7K2P"
                  placeholderTextColor="#94a3b8"
                  style={styles.joinCodeInput}
                  autoCapitalize="characters"
                />

                {joinError ? (
                  <Text style={styles.joinError}>{joinError}</Text>
                ) : null}

                <Pressable
                  onPress={handleJoinCircle}
                  disabled={!joinCode.trim()}
                  style={({ pressed }) => [
                    styles.joinSubmitButton,
                    !joinCode.trim() && styles.joinSubmitButtonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.joinSubmitText}>Join Circle</Text>
                </Pressable>
              </>
            )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  joinButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  joinButtonBlur: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  statsLeft: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  nudgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
  },
  nudgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b45309',
  },
  searchFilterRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  clearButton: {
    padding: 4,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  circlesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyState: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyStateBlur: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  circleCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 0,
  },
  circleCardHighlight: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  circleCardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  joinedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  joinedBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  circleCardContent: {
    padding: 16,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  circleAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInfo: {
    flex: 1,
    minWidth: 0,
  },
  circleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flexShrink: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  streakBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ea580c',
  },
  circleSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  circleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeDone: {
    backgroundColor: '#ecfdf5',
  },
  statusBadgePending: {
    backgroundColor: '#fffbeb',
  },
  statusDoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  statusPendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
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
    borderRadius: 3,
  },
  progressFillDone: {
    backgroundColor: '#10b981',
  },
  progressFillPending: {
    backgroundColor: '#8b5cf6',
  },
  memberAvatars: {
    flexDirection: 'row',
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  memberAvatarPosted: {
    backgroundColor: '#10b981',
  },
  memberAvatarPending: {
    backgroundColor: '#e2e8f0',
  },
  memberAvatarMore: {
    backgroundColor: '#475569',
  },
  memberInitial: {
    fontSize: 10,
    fontWeight: '600',
  },
  memberInitialPosted: {
    color: '#fff',
  },
  memberInitialPending: {
    color: '#64748b',
  },
  memberMoreText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  expandedActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  expandedButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  openCircleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
  },
  openCircleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 8,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 8,
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
  },
  actionSheetItemPressed: {
    backgroundColor: '#f8fafc',
  },
  actionSheetItemPressedDanger: {
    backgroundColor: '#fef2f2',
  },
  actionSheetIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetText: {
    flex: 1,
  },
  actionSheetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionSheetSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  createModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
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
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 16,
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  privacyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  privacyButtonActive: {
    backgroundColor: '#0f172a',
  },
  privacyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  privacyButtonTextActive: {
    color: '#fff',
  },
  createSubmitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  createSubmitButtonDisabled: {
    opacity: 0.5,
  },
  createSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  joinModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  toast: { position: 'absolute', top: 10, left: 20, right: 20, zIndex: 10, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  toastSuccess: { backgroundColor: '#ECFDF5' },
  toastInfo: { backgroundColor: '#F1F5F9' },
  toastText: { fontSize: 12, color: '#0F172A', fontWeight: '700' },
  joinCodeInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  joinError: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  joinSubmitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  joinSubmitButtonDisabled: {
    opacity: 0.5,
  },
  joinSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  joinSuccessContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  joinSuccessIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  joinSuccessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  joinSuccessSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
});

export default CirclesScreen;
