/**
 * Supabase Circles Hook
 * Circle management with real-time updates
 */
import React, { useEffect, useState, useCallback } from 'react';
import { supabase, Circle, CircleMember } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface CircleWithMembers extends Circle {
  members?: CircleMember[];
  memberCount?: number;
}

interface UseCirclesReturn {
  circles: CircleWithMembers[];
  loading: boolean;
  error: Error | null;
  createCircle: (circle: Partial<Circle>) => Promise<Circle | null>;
  joinCircle: (circleId: string) => Promise<boolean>;
  leaveCircle: (circleId: string) => Promise<boolean>;
  getCircle: (circleId: string) => Promise<Circle | null>;
  getCircleMembers: (circleId: string) => Promise<any[]>;
  getCircleTasks: (circleId: string) => Promise<any[]>;
  getCircleActivity: (circleId: string) => Promise<any[]>;
  getInvitePreview: (inviteCode: string) => Promise<any | null>;
  acceptInvite: (inviteCode: string) => Promise<Circle | null>;
  declineInvite: (inviteCode: string) => Promise<boolean>;
  checkMembership: (circleId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useCircles(): UseCirclesReturn {
  const { user } = useSupabaseAuth();
  const [circles, setCircles] = useState<CircleWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedOnce = React.useRef(false);

  const fetchCircles = useCallback(async () => {
    if (!user) {
      setCircles([]);
      setLoading(false);
      return;
    }

    try {
      // Only show loading spinner on first fetch, not on refetches
      if (!hasLoadedOnce.current) setLoading(true);
      setError(null);

      console.log('[useCircles] Fetching circles for user:', user.id.substring(0, 8));

      // Get circles user is a member of (with timeout)
      const memberQuery = supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id);
      const memberTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Circles fetch timed out')), 8000)
      );
      const { data: memberCircles, error: memberError } = await Promise.race([memberQuery, memberTimeout]);

      if (memberError) {
        console.error('[useCircles] circle_members query error:', JSON.stringify(memberError));
        throw memberError;
      }

      const circleIds = memberCircles?.map(m => m.circle_id) || [];
      console.log('[useCircles] Found', circleIds.length, 'circle memberships');

      if (circleIds.length === 0) {
        setCircles([]);
        return;
      }

      // Get circle details
      const { data: circlesData, error: circlesError } = await supabase
        .from('circles')
        .select('*')
        .in('id', circleIds);

      if (circlesError) throw circlesError;

      // Get member counts
      const circlesWithCounts = await Promise.all(
        (circlesData || []).map(async (circle) => {
          const { count } = await supabase
            .from('circle_members')
            .select('*', { count: 'exact', head: true })
            .eq('circle_id', circle.id);

          return {
            ...circle,
            memberCount: count || 0,
          };
        })
      );

      setCircles(circlesWithCounts);
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('Error fetching circles:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch circles'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchCircles();
  }, [fetchCircles]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('circles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'circle_members',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCircles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCircles]);

  const createCircle = async (circle: Partial<Circle>): Promise<Circle | null> => {
    if (!user) {
      console.error('[useCircles] createCircle: No authenticated user');
      return null;
    }

    try {
      console.log('[useCircles] Creating circle:', { name: circle.name, privacy: circle.privacy });
      
      // Step 1: Insert without .select() to avoid PostgREST + RLS hang
      const insertPayload = {
        name: circle.name || 'New Circle',
        emoji: circle.emoji || '👥',
        description: circle.description || null,
        owner_id: user.id,
        privacy: circle.privacy || 'private',
      };

      const { error } = await supabase
        .from('circles')
        .insert(insertPayload);

      if (error) {
        console.error('[useCircles] Insert circle error:', JSON.stringify(error));
        throw error;
      }

      // Step 2: Fetch the just-created circle separately
      const { data, error: fetchError } = await supabase
        .from('circles')
        .select()
        .eq('owner_id', user.id)
        .eq('name', insertPayload.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !data) {
        console.error('[useCircles] Could not fetch created circle:', fetchError?.message);
        throw new Error('Circle created but could not retrieve it');
      }

      console.log('[useCircles] Circle created:', data.id, 'invite_code:', data.invite_code);

      // Add creator as member (also without .select())
      const { error: memberError } = await supabase.from('circle_members').insert({
        circle_id: data.id,
        user_id: user.id,
        role: 'owner',
      });

      if (memberError) {
        console.error('[useCircles] Add member error:', JSON.stringify(memberError));
        // Circle was created but member add failed — don't throw, circle still exists
      }

      // Refresh circle list
      fetchCircles();

      return data;
    } catch (err: any) {
      console.error('[useCircles] Error creating circle:', err?.message || err);
      throw err; // Re-throw so the UI can show the error
    }
  };

  const joinCircle = async (circleId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circleId,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error joining circle:', err);
      return false;
    }
  };

  const leaveCircle = async (circleId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', circleId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error leaving circle:', err);
      return false;
    }
  };

  const getCircle = async (circleId: string): Promise<Circle | null> => {
    try {
      const { data, error } = await supabase
        .from('circles')
        .select('*')
        .eq('id', circleId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching circle:', err);
      return null;
    }
  };

  const getCircleMembers = async (circleId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select(`
          user_id,
          role,
          joined_at,
          profiles:user_id (id, display_name, username, avatar_url)
        `)
        .eq('circle_id', circleId);

      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m.profiles,
        role: m.role,
        joined_at: m.joined_at,
      }));
    } catch (err) {
      console.error('Error fetching circle members:', err);
      return [];
    }
  };

  const getCircleTasks = async (circleId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('circle_id', circleId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching circle tasks:', err);
      return [];
    }
  };

  const getCircleActivity = async (circleId: string): Promise<any[]> => {
    try {
      // Get recent task completions in this circle
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          completed_at,
          profiles:user_id (display_name, avatar_url)
        `)
        .eq('circle_id', circleId)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      return (data || []).map((t: any) => ({
        id: t.id,
        user_name: t.profiles?.display_name || 'User',
        user_avatar: t.profiles?.avatar_url,
        action: 'completed',
        task_title: t.title,
        created_at: t.completed_at,
      }));
    } catch (err) {
      console.error('Error fetching circle activity:', err);
      return [];
    }
  };

  const getInvitePreview = async (inviteCode: string): Promise<any | null> => {
    try {
      // For now, decode invite code as circle_id (simplified)
      // In production, this would be a separate invites table
      const circleId = inviteCode;
      
      const [circle, members] = await Promise.all([
        getCircle(circleId),
        getCircleMembers(circleId),
      ]);

      if (!circle) return null;

      const { count } = await supabase
        .from('circle_members')
        .select('*', { count: 'exact', head: true })
        .eq('circle_id', circleId);

      return {
        circle,
        members: members.slice(0, 5),
        memberCount: count || 0,
      };
    } catch (err) {
      console.error('Error fetching invite preview:', err);
      return null;
    }
  };

  const acceptInvite = async (inviteCode: string): Promise<Circle | null> => {
    if (!user) return null;
    
    try {
      // Simplified: treat invite code as circle_id
      const circleId = inviteCode;
      
      const { error } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circleId,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;
      return await getCircle(circleId);
    } catch (err) {
      console.error('Error accepting invite:', err);
      return null;
    }
  };

  const declineInvite = async (inviteCode: string): Promise<boolean> => {
    // In production, mark invite as declined
    return true;
  };

  const checkMembership = async (circleId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { count } = await supabase
        .from('circle_members')
        .select('*', { count: 'exact', head: true })
        .eq('circle_id', circleId)
        .eq('user_id', user.id);

      return (count || 0) > 0;
    } catch (err) {
      return false;
    }
  };

  return {
    circles,
    loading,
    error,
    createCircle,
    joinCircle,
    leaveCircle,
    getCircle,
    getCircleMembers,
    getCircleTasks,
    getCircleActivity,
    getInvitePreview,
    acceptInvite,
    declineInvite,
    checkMembership,
    refresh: fetchCircles,
  };
}

export default useCircles;
