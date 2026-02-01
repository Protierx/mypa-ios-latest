import { useCallback } from 'react';
import { Alert } from 'react-native';
import { challengesApi } from '../../../services/api';
import { Challenge, ChallengeCategory } from '../types';
import { categoryToEmoji, formatCategoryLabel, convertToDisplayChallenge } from '../utils';
import { categoryColors } from '../constants';

interface UseChallengesActionsParams {
  activeChallenges: Challenge[];
  setActiveChallenges: (challenges: Challenge[]) => void;
  availableChallenges: any[];
  setAvailableChallenges: (challenges: any[]) => void;
  joiningChallengeId: string | null;
  setJoiningChallengeId: (id: string | null) => void;
  fetchChallenges: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'info') => void;
  newName: string;
  newCategory: ChallengeCategory;
  newTarget: string;
  newDays: number;
  newXp: number;
  selectedCircleId: string | null;
  userCircles: { id: string; name: string; emoji: string }[];
  editingChallenge: Challenge | null;
  setEditingChallenge: (challenge: Challenge | null) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowOptionsModal: (show: boolean) => void;
  resetCreateForm: () => void;
  setNewName: (name: string) => void;
  setNewCategory: (category: ChallengeCategory) => void;
  setNewTarget: (target: string) => void;
  setNewDays: (days: number) => void;
  setNewXp: (xp: number) => void;
}

export function useChallengesActions({
  activeChallenges,
  setActiveChallenges,
  availableChallenges,
  setAvailableChallenges,
  joiningChallengeId,
  setJoiningChallengeId,
  fetchChallenges,
  showToast,
  newName,
  newCategory,
  newTarget,
  newDays,
  newXp,
  selectedCircleId,
  userCircles,
  editingChallenge,
  setEditingChallenge,
  setShowCreateModal,
  setShowOptionsModal,
  resetCreateForm,
  setNewName,
  setNewCategory,
  setNewTarget,
  setNewDays,
  setNewXp,
}: UseChallengesActionsParams) {
  // Join an available challenge
  const handleJoinChallenge = useCallback(async (challengeId: string) => {
    if (joiningChallengeId) return;
    
    setJoiningChallengeId(challengeId);
    setAvailableChallenges(availableChallenges.filter(c => c.id !== challengeId));
    
    try {
      const response = await challengesApi.join(challengeId);
      if (response.success) {
        showToast('Joined challenge!', 'success');
        fetchChallenges();
      } else {
        showToast(response.error || 'Failed to join', 'info');
        fetchChallenges();
      }
    } catch (error) {
      console.error('Failed to join challenge:', error);
      showToast('Failed to join challenge', 'info');
      fetchChallenges();
    } finally {
      setJoiningChallengeId(null);
    }
  }, [joiningChallengeId, availableChallenges, setAvailableChallenges, setJoiningChallengeId, fetchChallenges, showToast]);

  // Leave a challenge
  const handleLeaveChallenge = useCallback(async (challengeId: string) => {
    try {
      const response = await challengesApi.leave(challengeId);
      if (response.success) {
        showToast('Left challenge', 'info');
        fetchChallenges();
      } else {
        showToast(response.error || 'Failed to leave', 'info');
      }
    } catch (error) {
      console.error('Failed to leave challenge:', error);
      showToast('Failed to leave challenge', 'info');
    }
  }, [fetchChallenges, showToast]);

  // Update progress for a challenge
  const handleSubmitProof = useCallback(async (challengeId: string) => {
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
        fetchChallenges();
      } else {
        showToast(response.error || 'Failed to update progress', 'info');
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
      showToast('Failed to update progress', 'info');
    }
  }, [fetchChallenges, showToast]);

  // Create or update a challenge
  const handleCreateChallenge = useCallback(async () => {
    if (!newName.trim()) {
      Alert.alert('Missing Name', 'Please enter a challenge name');
      return;
    }

    const targetValue = parseInt(newTarget, 10);
    if (isNaN(targetValue) || targetValue < 1) {
      Alert.alert('Invalid Target', 'Please enter a valid target number');
      return;
    }

    const typeMap: Record<ChallengeCategory, 'FOCUS_MINUTES' | 'TASKS_COMPLETED' | 'STREAK_DAYS' | 'CUSTOM'> = {
      fitness: 'CUSTOM',
      wellness: 'FOCUS_MINUTES',
      learning: 'TASKS_COMPLETED',
      productivity: 'TASKS_COMPLETED',
      social: 'CUSTOM',
    };

    try {
      if (editingChallenge) {
        const endsAt = new Date(Date.now() + newDays * 24 * 60 * 60 * 1000).toISOString();
        
        const response = await challengesApi.update(editingChallenge.id, {
          title: newName.trim(),
          description: `Category: ${formatCategoryLabel(newCategory)} | A ${newCategory} challenge`,
          emoji: categoryToEmoji(newCategory),
          targetValue,
          endsAt,
          xpReward: newXp,
        });
        
        if (response.success) {
          setActiveChallenges(activeChallenges.map(c => 
            c.id === editingChallenge.id 
              ? { ...c, name: newName.trim(), totalDays: newDays, xpReward: newXp, category: newCategory }
              : c
          ));
          setShowCreateModal(false);
          resetCreateForm();
          showToast('Challenge updated! ✅', 'success');
        } else {
          showToast(response.error || 'Failed to update challenge', 'info');
        }
        return;
      }

      // Creating new challenge
      const startsAt = new Date().toISOString();
      const endsAt = new Date(Date.now() + newDays * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await challengesApi.create({
        title: newName.trim(),
        description: `Category: ${formatCategoryLabel(newCategory)} | A ${newCategory} challenge`,
        emoji: categoryToEmoji(newCategory),
        type: typeMap[newCategory] || 'CUSTOM',
        targetValue,
        startsAt,
        endsAt,
        xpReward: newXp,
        circleId: selectedCircleId || undefined,
      });
      
      if (response.success && response.data) {
        const newChallenge: Challenge = {
          id: response.data.id,
          name: response.data.title,
          iconName: newCategory === 'fitness' ? 'dumbbell' : newCategory === 'learning' ? 'book-open' : newCategory === 'wellness' ? 'cellphone-off' : newCategory === 'productivity' ? 'target' : 'heart',
          iconColor: categoryColors[newCategory].bg,
          daysLeft: newDays,
          totalDays: newDays,
          members: [{ name: 'You', initial: 'A', color: '#8B5CF6', streak: 0, rank: 1 }],
          todayPrompt: 'Start today and log your progress',
          progress: { completed: 0, total: response.data.targetValue || 1 },
          myStatus: 'pending',
          myStreak: 0,
          category: newCategory,
          xpReward: response.data.xpReward || newXp,
        };
        setActiveChallenges([newChallenge, ...activeChallenges]);
        setShowCreateModal(false);
        resetCreateForm();
        
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
  }, [
    newName, newCategory, newTarget, newDays, newXp, selectedCircleId,
    editingChallenge, activeChallenges, userCircles,
    setActiveChallenges, setShowCreateModal, resetCreateForm, showToast,
  ]);

  // Delete a challenge
  const handleDeleteChallenge = useCallback(async (challengeId: string) => {
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
                setActiveChallenges(activeChallenges.filter(c => c.id !== challengeId));
                setShowOptionsModal(false);
                showToast('Challenge deleted', 'success');
              } else {
                if (response.error?.includes('creator')) {
                  Alert.alert(
                    'Cannot Delete',
                    'Only the challenge creator can delete it. Would you like to leave instead?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Leave', onPress: () => handleLeaveChallenge(challengeId) },
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
  }, [activeChallenges, setActiveChallenges, setShowOptionsModal, showToast, handleLeaveChallenge]);

  // Open edit modal with challenge data
  const handleEditChallenge = useCallback((challenge: Challenge) => {
    setEditingChallenge(challenge);
    setNewName(challenge.name);
    setNewCategory(challenge.category);
    setNewTarget(String(challenge.apiData?.targetValue || challenge.progress.total || 10));
    setNewDays(challenge.totalDays);
    setNewXp(challenge.xpReward);
    setShowOptionsModal(false);
    setShowCreateModal(true);
  }, [setEditingChallenge, setNewName, setNewCategory, setNewTarget, setNewDays, setNewXp, setShowOptionsModal, setShowCreateModal]);

  return {
    handleJoinChallenge,
    handleLeaveChallenge,
    handleSubmitProof,
    handleCreateChallenge,
    handleDeleteChallenge,
    handleEditChallenge,
  };
}
