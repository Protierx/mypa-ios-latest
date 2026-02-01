import { useState, useRef, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { circlesApi } from '../../../../services/api';
import { Circle, CardAnimation } from '../types';
import { generateInviteCode } from '../utils';

export function useCirclesData() {
  // Circle data state
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChip, setFilterChip] = useState<'all' | 'streak' | 'pending'>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [longPressedCard, setLongPressedCard] = useState<Circle | null>(null);

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMembers, setNewMembers] = useState('');
  const [newPrivacy, setNewPrivacy] = useState<'public' | 'private'>('public');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef<CardAnimation[]>([]).current;

  // Show toast helper
  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  }, [toastAnim]);

  // Initialize card animations
  const initializeCardAnimations = useCallback((count: number) => {
    while (cardAnimations.length < count) {
      cardAnimations.push({
        scale: new Animated.Value(0.9),
        opacity: new Animated.Value(0),
      });
    }
  }, [cardAnimations]);

  // Run entry animations
  const runEntryAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate cards with stagger
    circles.forEach((_, index) => {
      if (cardAnimations[index]) {
        Animated.parallel([
          Animated.spring(cardAnimations[index].scale, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
            delay: index * 80,
          }),
          Animated.timing(cardAnimations[index].opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
            delay: index * 80,
          }),
        ]).start();
      }
    });
  }, [fadeAnim, slideAnim, circles, cardAnimations]);

  // Fetch circles from API
  const fetchCircles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await circlesApi.getAll();
      const data = response.data?.data ?? response.data ?? [];
      const circlesData: Circle[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        members: (c.members || []).map((m: any) => ({
          id: m.id || m.userId,
          initial: (m.name || m.username || 'U').charAt(0).toUpperCase(),
          posted: m.postedToday ?? false,
        })),
        challenge: c.challengeDescription || c.challenge,
        streak: c.streak || 0,
        inviteCode: c.inviteCode || generateInviteCode(),
      }));
      setCircles(circlesData);
      initializeCardAnimations(circlesData.length);
    } catch (error) {
      console.error('Error fetching circles:', error);
    } finally {
      setLoading(false);
    }
  }, [initializeCardAnimations]);

  // Initial fetch & entry animations
  useFocusEffect(
    useCallback(() => {
      fetchCircles();
      runEntryAnimations();
    }, [fetchCircles, runEntryAnimations])
  );

  return {
    // Data
    circles,
    setCircles,
    loading,

    // UI state
    searchQuery,
    setSearchQuery,
    filterChip,
    setFilterChip,
    expandedCard,
    setExpandedCard,
    longPressedCard,
    setLongPressedCard,

    // Modal state
    createOpen,
    setCreateOpen,
    joinModalOpen,
    setJoinModalOpen,
    newName,
    setNewName,
    newMembers,
    setNewMembers,
    newPrivacy,
    setNewPrivacy,
    joinCode,
    setJoinCode,
    joinError,
    setJoinError,
    joinSuccess,
    setJoinSuccess,

    // Toast
    toastVisible,
    toastMessage,
    toastType,
    showToast,
    toastAnim,

    // Animations
    fadeAnim,
    slideAnim,
    scaleAnim,
    cardAnimations,
    initializeCardAnimations,

    // Methods
    fetchCircles,
  };
}
