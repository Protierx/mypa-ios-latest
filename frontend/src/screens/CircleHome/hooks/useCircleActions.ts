import { useState } from 'react';
import { Alert } from 'react-native';
import { circlesApi, assignmentsApi, postsApi, challengesApi } from '../../../services/api';
import * as Clipboard from 'expo-clipboard';

/**
 * Custom hook for common Circle actions
 * Handles post reactions, invites, member actions, etc.
 */
export function useCircleActions(circleId: string, userId?: string) {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);

  // Copy text to clipboard with feedback
  const handleCopyInvite = async (text: string, type: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      Alert.alert('Copy failed', 'Unable to copy the invite link.');
    }
  };

  // React to a post
  const handleReaction = async (
    postId: string,
    reactionType: 'heart' | 'fire' | 'clap',
    currentReaction: string | null,
    onSuccess?: (newReaction: string | null) => void
  ) => {
    const emojiMap = { heart: '❤️', fire: '🔥', clap: '👏' };
    const emoji = emojiMap[reactionType];
    const hasReacted = currentReaction === emoji;

    try {
      if (hasReacted) {
        // Remove reaction
        const response = await postsApi.removeReaction(postId);
        if (response.success) {
          onSuccess?.(null);
        }
      } else {
        // Add reaction (replaces any existing)
        const response = await postsApi.react(postId, emoji);
        if (response.success) {
          onSuccess?.(emoji);
        }
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  // Delete a post
  const handleDeletePost = async (
    postId: string | number,
    onSuccess?: () => void
  ) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await postsApi.delete(String(postId));
              if (response.success) {
                onSuccess?.();
              } else {
                Alert.alert('Error', response.error || 'Failed to delete post');
              }
            } catch (error) {
              console.error('Failed to delete post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Accept an assignment
  const handleAcceptAssignment = async (
    assignmentId: string,
    onSuccess?: () => void
  ) => {
    try {
      const response = await assignmentsApi.accept(assignmentId);
      if (response.success) {
        onSuccess?.();
        Alert.alert('Accepted!', "You've accepted this mission.");
      } else {
        Alert.alert('Error', response.error || 'Failed to accept assignment');
      }
    } catch (error) {
      console.error('Failed to accept assignment:', error);
      Alert.alert('Error', 'Failed to accept assignment');
    }
  };

  // Decline an assignment (without reason)
  const handleDeclineAssignment = async (
    assignmentId: string,
    reason?: string,
    onSuccess?: () => void
  ) => {
    try {
      const response = await assignmentsApi.decline(assignmentId, reason);
      if (response.success) {
        onSuccess?.();
        Alert.alert('Declined', 'You have declined this mission.');
      } else {
        Alert.alert('Error', response.error || 'Failed to decline assignment');
      }
    } catch (error) {
      console.error('Failed to decline assignment:', error);
      Alert.alert('Error', 'Failed to decline assignment');
    }
  };

  // Complete an assignment
  const handleCompleteAssignment = async (
    assignmentId: string,
    proof?: { proofUrl?: string; proofNote?: string },
    onSuccess?: () => void
  ) => {
    try {
      const response = await assignmentsApi.complete(String(assignmentId), proof);
      if (response.success) {
        onSuccess?.();
        Alert.alert('🎉 Complete!', 'Great job completing this mission!');
      } else {
        Alert.alert('Error', response.error || 'Failed to complete');
      }
    } catch (error) {
      console.error('Failed to complete assignment:', error);
      Alert.alert('Error', 'Failed to complete assignment');
    }
  };

  // Submit proof and complete assignment
  const submitProofAndComplete = async (
    assignmentId: string,
    proofUrl: string,
    proofNote: string,
    onSuccess?: () => void
  ) => {
    if (!proofUrl.trim() && !proofNote.trim()) {
      Alert.alert('Proof required', 'Add a proof link or a short note.');
      return;
    }

    setSubmittingProof(true);
    try {
      await handleCompleteAssignment(
        assignmentId,
        {
          proofUrl: proofUrl.trim() || undefined,
          proofNote: proofNote.trim() || undefined,
        },
        onSuccess
      );
    } finally {
      setSubmittingProof(false);
    }
  };

  // Join a challenge
  const handleJoinChallenge = async (
    challengeId: string,
    challengeTitle: string,
    onSuccess?: () => void
  ) => {
    try {
      const response = await challengesApi.join(challengeId);
      if (response.success) {
        onSuccess?.();
        Alert.alert('Joined!', `You've joined ${challengeTitle}`);
      } else {
        Alert.alert('Error', response.error || 'Failed to join challenge');
      }
    } catch (error) {
      console.error('Failed to join challenge:', error);
      Alert.alert('Error', 'Failed to join challenge');
    }
  };

  // Leave circle
  const handleLeaveCircle = async (
    circleName: string,
    onSuccess?: () => void
  ) => {
    Alert.alert(
      'Leave Circle',
      `Are you sure you want to leave ${circleName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await circlesApi.leave(circleId);
              if (response.success) {
                onSuccess?.();
              } else {
                Alert.alert('Error', response.error || 'Failed to leave circle');
              }
            } catch (error) {
              console.error('Failed to leave circle:', error);
              Alert.alert('Error', 'Failed to leave circle. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Kick member from circle (admin only)
  const handleKickMember = async (
    memberId: string,
    memberName: string,
    onSuccess?: () => void
  ) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this circle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await circlesApi.kickMember(circleId, memberId);
              if (response.success) {
                onSuccess?.();
              } else {
                Alert.alert('Error', response.error || 'Failed to remove member');
              }
            } catch (error) {
              console.error('Failed to remove member:', error);
              Alert.alert('Error', 'Failed to remove member. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Update member role (admin only)
  const handleUpdateMemberRole = async (
    memberId: string,
    newRole: 'ADMIN' | 'MEMBER',
    onSuccess?: () => void
  ) => {
    try {
      const response = await circlesApi.updateMemberRole(circleId, memberId, newRole);
      if (response.success) {
        onSuccess?.();
        Alert.alert(
          'Updated',
          `Member has been ${newRole === 'ADMIN' ? 'promoted to admin' : 'demoted to member'}.`
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to update member role');
      }
    } catch (error) {
      console.error('Failed to update member role:', error);
      Alert.alert('Error', 'Failed to update member role. Please try again.');
    }
  };

  // Create daily card (share your day)
  const handleShareDailyCard = async (onSuccess?: () => void) => {
    try {
      const response = await circlesApi.createDailyCard(circleId);
      if (response.success) {
        onSuccess?.();
        Alert.alert('🎉 Shared!', 'Your day has been shared with the circle.');
      } else {
        Alert.alert('Error', response.error || 'Failed to share your day');
      }
    } catch (error) {
      console.error('Failed to post daily card:', error);
      Alert.alert('Error', 'Failed to share your day. Please try again.');
    }
  };

  return {
    // State
    copySuccess,
    submittingProof,
    
    // Actions
    handleCopyInvite,
    handleReaction,
    handleDeletePost,
    handleAcceptAssignment,
    handleDeclineAssignment,
    handleCompleteAssignment,
    submitProofAndComplete,
    handleJoinChallenge,
    handleLeaveCircle,
    handleKickMember,
    handleUpdateMemberRole,
    handleShareDailyCard,
  };
}
