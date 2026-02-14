/**
 * Supabase Challenges Hook
 * Challenge management with real-time leaderboard updates
 */
import React, { useEffect, useState, useCallback } from 'react';
import { supabase, Challenge, ChallengeParticipant } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { eventLogger } from '@/services/eventLogger';

interface ChallengeWithParticipation extends Challenge {
  participants?: ChallengeParticipant[];
  participantCount?: number;
  userProgress?: number;
  userRank?: number;
}

interface UseChallengesReturn {
  challenges: ChallengeWithParticipation[];
  loading: boolean;
  error: Error | null;
  createChallenge: (challenge: Partial<Challenge>) => Promise<Challenge | null>;
  joinChallenge: (challengeId: string) => Promise<boolean>;
  leaveChallenge: (challengeId: string) => Promise<boolean>;
  updateProgress: (challengeId: string, progress: number) => Promise<boolean>;
  getChallenge: (challengeId: string) => Promise<ChallengeWithParticipation | null>;
  getChallengeLeaderboard: (challengeId: string) => Promise<any[]>;
  submitProof: (challengeId: string, proofUrl: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useChallenges(): UseChallengesReturn {
  const { user } = useSupabaseAuth();
  const [challenges, setChallenges] = useState<ChallengeWithParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedOnce = React.useRef(false);

  const fetchChallenges = useCallback(async () => {
    if (!user) {
      setChallenges([]);
      setLoading(false);
      return;
    }

    try {
      // Only show loading spinner on first fetch, not on refetches
      if (!hasLoadedOnce.current) setLoading(true);
      setError(null);

      console.log('[useChallenges] Fetching challenges for user:', user.id.substring(0, 8));

      // Get challenges user is participating in (with timeout)
      const partQuery = supabase
        .from('challenge_participants')
        .select('challenge_id, progress')
        .eq('user_id', user.id);
      const partTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Challenges fetch timed out')), 8000)
      );
      const { data: participations, error: partError } = await Promise.race([partQuery, partTimeout]);

      if (partError) {
        console.error('[useChallenges] participations query error:', JSON.stringify(partError));
        throw partError;
      }

      const challengeIds = participations?.map(p => p.challenge_id) || [];
      console.log('[useChallenges] Found', challengeIds.length, 'challenge participations');
      
      if (challengeIds.length === 0) {
        setChallenges([]);
        return;
      }

      // Get challenge details (all statuses, not just active)
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .in('id', challengeIds)
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;

      // Enrich with participation data
      const enrichedChallenges = await Promise.all(
        (challengesData || []).map(async (challenge) => {
          // Get all participants
          const { data: participants } = await supabase
            .from('challenge_participants')
            .select('user_id, progress')
            .eq('challenge_id', challenge.id)
            .order('progress', { ascending: false });

          const userParticipation = participations?.find(
            p => p.challenge_id === challenge.id
          );

          const userRank = participants?.findIndex(p => p.user_id === user.id) ?? -1;

          return {
            ...challenge,
            participants,
            participantCount: participants?.length || 0,
            userProgress: userParticipation?.progress || 0,
            userRank: userRank >= 0 ? userRank + 1 : undefined,
          };
        })
      );

      setChallenges(enrichedChallenges);
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch challenges'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Real-time subscription for leaderboard updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('challenges-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_participants',
        },
        () => {
          fetchChallenges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchChallenges]);

  const createChallenge = async (challenge: Partial<Challenge>): Promise<Challenge | null> => {
    if (!user) return null;

    try {
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + (challenge.duration_days || 7));

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          title: challenge.title || 'New Challenge',
          emoji: challenge.emoji || '🏆',
          description: challenge.description || null,
          creator_id: user.id,
          circle_id: challenge.circle_id || null,
          type: challenge.type || 'tasks_completed',
          goal_value: challenge.goal_value || 10,
          duration_days: challenge.duration_days || 7,
          ends_at: endsAt.toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as participant
      await supabase.from('challenge_participants').insert({
        challenge_id: data.id,
        user_id: user.id,
        progress: 0,
      });

      // Log event for AI learning
      eventLogger.logChallengeCreated(data.id, challenge.type || 'tasks_completed');

      return data;
    } catch (err) {
      console.error('Error creating challenge:', err);
      return null;
    }
  };

  const joinChallenge = async (challengeId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          progress: 0,
        });

      if (error) throw error;

      // Log event for AI learning
      eventLogger.logChallengeJoined(challengeId);

      return true;
    } catch (err) {
      console.error('Error joining challenge:', err);
      return false;
    }
  };

  const leaveChallenge = async (challengeId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error leaving challenge:', err);
      return false;
    }
  };

  const updateProgress = async (challengeId: string, progress: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('challenge_participants')
        .update({ progress })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating progress:', err);
      return false;
    }
  };

  const getChallenge = async (challengeId: string): Promise<ChallengeWithParticipation | null> => {
    if (!user) return null;

    try {
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;

      // Get participants
      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('user_id, progress')
        .eq('challenge_id', challengeId)
        .order('progress', { ascending: false });

      // Get user's participation
      const userParticipation = participants?.find(p => p.user_id === user.id);
      const userRank = participants?.findIndex(p => p.user_id === user.id) ?? -1;

      return {
        ...challenge,
        participants,
        participantCount: participants?.length || 0,
        userProgress: userParticipation?.progress || 0,
        userRank: userRank >= 0 ? userRank + 1 : undefined,
      };
    } catch (err) {
      console.error('Error fetching challenge:', err);
      return null;
    }
  };

  const getChallengeLeaderboard = async (challengeId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`
          user_id,
          progress,
          joined_at,
          profiles:user_id (id, display_name, username, avatar_url)
        `)
        .eq('challenge_id', challengeId)
        .order('progress', { ascending: false });

      if (error) throw error;

      return (data || []).map((p: any, index: number) => ({
        rank: index + 1,
        userId: p.user_id,
        displayName: p.profiles?.display_name || 'User',
        username: p.profiles?.username,
        avatarUrl: p.profiles?.avatar_url,
        progress: p.progress,
        isCurrentUser: p.user_id === user?.id,
      }));
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      return [];
    }
  };

  const submitProof = async (challengeId: string, proofUrl: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get current participation
      const { data: participation, error: getError } = await supabase
        .from('challenge_participants')
        .select('progress')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      if (getError) throw getError;

      // Increment progress and store proof reference
      const { error } = await supabase
        .from('challenge_participants')
        .update({ 
          progress: (participation?.progress || 0) + 1,
          // Note: proof_url would need to be added to schema
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error submitting proof:', err);
      return false;
    }
  };

  return {
    challenges,
    loading,
    error,
    createChallenge,
    joinChallenge,
    leaveChallenge,
    updateProgress,
    getChallenge,
    getChallengeLeaderboard,
    submitProof,
    refresh: fetchChallenges,
  };
}

export default useChallenges;
