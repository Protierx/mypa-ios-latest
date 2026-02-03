import { useCallback } from 'react';
import { Animated } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { circlesApi } from '../../../../services/api';
import { Circle, CardAnimation } from '../types';
import { generateInviteCode } from '../utils';
import { SetStateAction, Dispatch } from 'react';

interface UseCirclesActionsParams {
  circles: Circle[];
  setCircles: Dispatch<SetStateAction<Circle[]>>;
  newName: string;
  newMembers: string;
  newPrivacy: 'public' | 'private';
  joinCode: string;
  setCreateOpen: (open: boolean) => void;
  setJoinModalOpen: (open: boolean) => void;
  setNewName: (name: string) => void;
  setNewMembers: (members: string) => void;
  setNewPrivacy: (privacy: 'public' | 'private') => void;
  setJoinCode: (code: string) => void;
  setJoinError: (error: string) => void;
  setJoinSuccess: (success: boolean) => void;
  setExpandedCard: Dispatch<SetStateAction<string | null>>;
  setLongPressedCard: (circle: Circle | null) => void;
  longPressedCard: Circle | null;
  showToast: (message: string, type?: 'success' | 'info') => void;
  cardAnimations: CardAnimation[];
  initializeCardAnimations: (count: number) => void;
  navigation: any;
}

export function useCirclesActions({
  circles,
  setCircles,
  newName,
  newMembers,
  newPrivacy,
  joinCode,
  setCreateOpen,
  setJoinModalOpen,
  setNewName,
  setNewMembers,
  setNewPrivacy,
  setJoinCode,
  setJoinError,
  setJoinSuccess,
  setExpandedCard,
  setLongPressedCard,
  longPressedCard,
  showToast,
  cardAnimations,
  initializeCardAnimations,
  navigation,
}: UseCirclesActionsParams) {
  // Create a new circle
  const handleCreateCircle = useCallback(async () => {
    try {
      const memberNames = newMembers
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n);

      const response = await circlesApi.create({
        name: newName,
        isPrivate: newPrivacy === 'private',
      });

      const created = response.data?.data ?? response.data;
      const newCircle: Circle = {
        id: created.id,
        name: created.name,
        members: (created.members || []).map((m: any) => ({
          id: m.id || m.userId,
          initial: (m.name || m.username || 'U').charAt(0).toUpperCase(),
          posted: false,
        })),
        challenge: created.challengeDescription,
        streak: 0,
        inviteCode: created.inviteCode || generateInviteCode(),
      };

      // Initialize animation for new card
      initializeCardAnimations(circles.length + 1);
      setCircles([newCircle, ...circles]);

      // Animate the new card
      const newIndex = 0;
      if (cardAnimations[newIndex]) {
        Animated.parallel([
          Animated.spring(cardAnimations[newIndex].scale, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(cardAnimations[newIndex].opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Reset form and close modal
      setCreateOpen(false);
      setNewName('');
      setNewMembers('');
      setNewPrivacy('public');
      showToast('Circle created!', 'success');
    } catch (error) {
      console.error('Error creating circle:', error);
      showToast('Failed to create circle', 'info');
    }
  }, [
    newName,
    newMembers,
    newPrivacy,
    circles,
    setCircles,
    setCreateOpen,
    setNewName,
    setNewMembers,
    setNewPrivacy,
    showToast,
    cardAnimations,
    initializeCardAnimations,
  ]);

  // Join an existing circle
  const handleJoinCircle = useCallback(async () => {
    try {
      const response = await circlesApi.joinByCode(joinCode.trim());
      const joined = response.data?.data ?? response.data;

      const joinedCircle: Circle = {
        id: joined.id,
        name: joined.name,
        members: (joined.members || []).map((m: any) => ({
          id: m.id || m.userId,
          initial: (m.name || m.username || 'U').charAt(0).toUpperCase(),
          posted: m.postedToday ?? false,
        })),
        challenge: joined.challengeDescription,
        streak: joined.streak || 0,
        inviteCode: joined.inviteCode || joinCode,
        isNew: true,
      };

      setJoinSuccess(true);
      initializeCardAnimations(circles.length + 1);

      setTimeout(() => {
        setCircles([joinedCircle, ...circles]);
        setJoinModalOpen(false);
        setJoinCode('');
        setJoinError('');
        setJoinSuccess(false);

        // Animate the new card
        if (cardAnimations[0]) {
          Animated.parallel([
            Animated.spring(cardAnimations[0].scale, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.timing(cardAnimations[0].opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }

        // Clear isNew flag after 3 seconds
        setTimeout(() => {
          setCircles((prev) =>
            prev.map((c) =>
              c.id === joinedCircle.id ? { ...c, isNew: false } : c
            )
          );
        }, 3000);
      }, 1500);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Invalid invite code. Please try again.';
      setJoinError(message);
    }
  }, [
    joinCode,
    circles,
    setCircles,
    setJoinModalOpen,
    setJoinCode,
    setJoinError,
    setJoinSuccess,
    cardAnimations,
    initializeCardAnimations,
  ]);

  // Toggle card expansion
  const handleCardPress = useCallback((circleId: string) => {
    setExpandedCard((prev) => (prev === circleId ? null : circleId));
  }, [setExpandedCard]);

  // Long press to show action sheet
  const handleCardLongPress = useCallback((circle: Circle) => {
    setLongPressedCard(circle);
  }, [setLongPressedCard]);

  // Open circle detail screen
  const openCircle = useCallback((circle: Circle) => {
    setExpandedCard(null);
    const parentNav = navigation.getParent?.();
    const rootNav = parentNav?.getParent?.() || parentNav || navigation;
    rootNav.navigate('CircleHome', {
      circleId: circle.id,
      circleName: circle.name,
    });
  }, [navigation, setExpandedCard]);

  // Copy invite code to clipboard
  const handleCopyCode = useCallback(async () => {
    if (longPressedCard) {
      await Clipboard.setStringAsync(longPressedCard.inviteCode);
      setLongPressedCard(null);
      showToast('Invite code copied!', 'info');
    }
  }, [longPressedCard, setLongPressedCard, showToast]);

  // Mute notifications (placeholder)
  const handleMuteNotifications = useCallback(() => {
    setLongPressedCard(null);
    showToast('Notifications muted', 'info');
  }, [setLongPressedCard, showToast]);

  // Leave circle
  const handleLeaveCircle = useCallback(async () => {
    if (longPressedCard) {
      try {
        await circlesApi.leave(longPressedCard.id);
        setCircles(circles.filter((c) => c.id !== longPressedCard.id));
        setLongPressedCard(null);
        showToast('Left circle', 'info');
      } catch (error) {
        console.error('Error leaving circle:', error);
        setLongPressedCard(null);
        showToast('Failed to leave circle', 'info');
      }
    }
  }, [longPressedCard, circles, setCircles, setLongPressedCard, showToast]);

  // Close action sheet
  const closeActionSheet = useCallback(() => {
    setLongPressedCard(null);
  }, [setLongPressedCard]);

  // Close join modal and reset state
  const closeJoinModal = useCallback(() => {
    setJoinModalOpen(false);
    setJoinCode('');
    setJoinError('');
  }, [setJoinModalOpen, setJoinCode, setJoinError]);

  return {
    handleCreateCircle,
    handleJoinCircle,
    handleCardPress,
    handleCardLongPress,
    openCircle,
    handleCopyCode,
    handleMuteNotifications,
    handleLeaveCircle,
    closeActionSheet,
    closeJoinModal,
  };
}
