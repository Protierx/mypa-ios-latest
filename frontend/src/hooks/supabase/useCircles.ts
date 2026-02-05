/**
 * Supabase Circles Hook
 * Circle management with real-time updates
 */
import { useEffect, useState, useCallback } from 'react';
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

  const fetchCircles = useCallback(async () => {
    if (!user) {
      setCircles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get circles user is a member of
      const { data: memberCircles, error: memberError } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const circleIds = memberCircles?.map(m => m.circle_id) || [];

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
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('circles')
        .insert({
          name: circle.name || 'New Circle',
          emoji: circle.emoji || '👥',
          description: circle.description || null,
          owner_id: user.id,
          privacy: circle.privacy || 'private',
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as member
      await supabase.from('circle_members').insert({
        circle_id: data.id,
        user_id: user.id,
        role: 'owner',
      });

      return data;
    } catch (err) {
      console.error('Error creating circle:', err);
      return null;
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
