/**
 * Supabase Circles Hook — v2
 *
 * Circle management with real-time updates, invite-code join,
 * role management (owner/admin/member), and member controls.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { supabase, Circle, CircleMember } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { eventLogger } from '@/services/eventLogger';

// ════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════

export interface CircleMemberProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface CircleWithMembers extends Circle {
  members?: CircleMemberProfile[];
  memberCount?: number;
  userRole?: 'owner' | 'admin' | 'member' | null;
}

export interface UseCirclesReturn {
  circles: CircleWithMembers[];
  loading: boolean;
  error: Error | null;
  createCircle: (circle: Partial<Circle>) => Promise<Circle | null>;
  joinCircleByCode: (inviteCode: string) => Promise<{ success: boolean; circleId?: string; error?: string }>;
  leaveCircle: (circleId: string) => Promise<boolean>;
  getCircle: (circleId: string) => Promise<CircleWithMembers | null>;
  getCircleMembers: (circleId: string) => Promise<CircleMemberProfile[]>;
  getCircleActivity: (circleId: string) => Promise<any[]>;
  getUserRole: (circleId: string) => Promise<'owner' | 'admin' | 'member' | null>;
  updateMemberRole: (circleId: string, userId: string, newRole: 'admin' | 'member') => Promise<boolean>;
  removeMember: (circleId: string, userId: string) => Promise<boolean>;
  transferOwnership: (circleId: string, newOwnerId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

// ════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════

export function useCircles(): UseCirclesReturn {
  const { user } = useSupabaseAuth();
  const [circles, setCircles] = useState<CircleWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedOnce = React.useRef(false);

  // ── Fetch all user's circles ──
  const fetchCircles = useCallback(async () => {
    if (!user) { setCircles([]); setLoading(false); return; }

    try {
      if (!hasLoadedOnce.current) setLoading(true);
      setError(null);

      const memberQuery = supabase
        .from('circle_members')
        .select('circle_id, role')
        .eq('user_id', user.id);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Circles fetch timed out')), 8000)
      );
      const { data: memberships, error: memberError } = await Promise.race([memberQuery, timeout]) as any;
      if (memberError) throw memberError;

      const circleIds = memberships?.map((m: any) => m.circle_id) || [];
      if (circleIds.length === 0) { setCircles([]); return; }

      const { data: circlesData, error: circlesError } = await supabase
        .from('circles')
        .select('*')
        .in('id', circleIds);
      if (circlesError) throw circlesError;

      const enriched = await Promise.all(
        (circlesData || []).map(async (circle) => {
          const { count } = await supabase
            .from('circle_members')
            .select('*', { count: 'exact', head: true })
            .eq('circle_id', circle.id);

          const userMembership = memberships?.find((m: any) => m.circle_id === circle.id);

          return {
            ...circle,
            memberCount: count || 0,
            userRole: userMembership?.role || null,
          } as CircleWithMembers;
        })
      );

      setCircles(enriched);
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('[useCircles] Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch circles'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCircles(); }, [fetchCircles]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('circles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'circle_members', filter: `user_id=eq.${user.id}` }, () => fetchCircles())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCircles]);

  const createCircle = async (circle: Partial<Circle>): Promise<Circle | null> => {
    if (!user) return null;
    try {
      const payload = {
        name: circle.name || 'New Circle',
        emoji: circle.emoji || '👥',
        description: circle.description || null,
        owner_id: user.id,
        privacy: circle.privacy || 'private',
      };

      const { error } = await supabase.from('circles').insert(payload);
      if (error) throw error;

      const { data, error: fetchError } = await supabase
        .from('circles')
        .select()
        .eq('owner_id', user.id)
        .eq('name', payload.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (fetchError || !data) throw new Error('Circle created but could not retrieve it');

      await supabase.from('circle_members').insert({
        circle_id: data.id, user_id: user.id, role: 'owner',
      });

      eventLogger.logCircleCreated(data.id, payload.name);
      fetchCircles();
      return data;
    } catch (err: any) {
      console.error('[useCircles] createCircle error:', err?.message || err);
      throw err;
    }
  };

  const joinCircleByCode = async (inviteCode: string): Promise<{ success: boolean; circleId?: string; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const code = inviteCode.trim().toLowerCase();

      const { data: circle, error: lookupErr } = await supabase
        .from('circles')
        .select('id, name')
        .eq('invite_code', code)
        .maybeSingle();

      if (lookupErr) throw lookupErr;
      if (!circle) return { success: false, error: 'Invalid invite code. Please check and try again.' };

      const { count } = await supabase
        .from('circle_members')
        .select('*', { count: 'exact', head: true })
        .eq('circle_id', circle.id)
        .eq('user_id', user.id);

      if ((count || 0) > 0) return { success: false, error: "You're already a member of this circle." };

      const { error: joinErr } = await supabase.from('circle_members').insert({
        circle_id: circle.id, user_id: user.id, role: 'member',
      });
      if (joinErr) throw joinErr;

      eventLogger.logCircleJoined(circle.id);
      fetchCircles();
      return { success: true, circleId: circle.id };
    } catch (err) {
      console.error('[useCircles] joinCircleByCode error:', err);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  };

  const leaveCircle = async (circleId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('circle_members').delete()
        .eq('circle_id', circleId).eq('user_id', user.id);
      if (error) throw error;
      eventLogger.logCircleLeft(circleId);
      return true;
    } catch (err) {
      console.error('[useCircles] leaveCircle error:', err);
      return false;
    }
  };

  const getCircle = async (circleId: string): Promise<CircleWithMembers | null> => {
    try {
      const { data, error } = await supabase.from('circles').select('*').eq('id', circleId).single();
      if (error) throw error;

      const members = await getCircleMembers(circleId);
      const myRole = user ? members.find(m => m.id === user.id)?.role || null : null;

      return { ...data, members, memberCount: members.length, userRole: myRole };
    } catch (err) {
      console.error('[useCircles] getCircle error:', err);
      return null;
    }
  };

  const getCircleMembers = async (circleId: string): Promise<CircleMemberProfile[]> => {
    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select(`user_id, role, joined_at, profiles:user_id (id, display_name, username, avatar_url)`)
        .eq('circle_id', circleId);
      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.profiles?.id || m.user_id,
        display_name: m.profiles?.display_name || 'User',
        username: m.profiles?.username || null,
        avatar_url: m.profiles?.avatar_url || null,
        role: m.role as 'owner' | 'admin' | 'member',
        joined_at: m.joined_at,
      }));
    } catch (err) {
      console.error('[useCircles] getCircleMembers error:', err);
      return [];
    }
  };

  const getCircleActivity = async (circleId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`id, title, completed_at, profiles:user_id (display_name, avatar_url)`)
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
        action: 'completed a task',
        task_title: t.title,
        created_at: t.completed_at,
      }));
    } catch (err) {
      console.error('[useCircles] getCircleActivity error:', err);
      return [];
    }
  };

  const getUserRole = async (circleId: string): Promise<'owner' | 'admin' | 'member' | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('circle_members')
        .select('role')
        .eq('circle_id', circleId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as 'owner' | 'admin' | 'member') || null;
    } catch {
      return null;
    }
  };

  const updateMemberRole = async (circleId: string, userId: string, newRole: 'admin' | 'member'): Promise<boolean> => {
    if (!user) return false;
    try {
      const callerRole = await getUserRole(circleId);
      if (!callerRole || callerRole === 'member') return false;

      const { error } = await supabase
        .from('circle_members')
        .update({ role: newRole })
        .eq('circle_id', circleId)
        .eq('user_id', userId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[useCircles] updateMemberRole error:', err);
      return false;
    }
  };

  const removeMember = async (circleId: string, userId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const callerRole = await getUserRole(circleId);
      if (!callerRole || callerRole === 'member') return false;

      const { error } = await supabase
        .from('circle_members').delete()
        .eq('circle_id', circleId).eq('user_id', userId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[useCircles] removeMember error:', err);
      return false;
    }
  };

  const transferOwnership = async (circleId: string, newOwnerId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const callerRole = await getUserRole(circleId);
      if (callerRole !== 'owner') return false;

      await supabase.from('circle_members').update({ role: 'admin' }).eq('circle_id', circleId).eq('user_id', user.id);
      await supabase.from('circle_members').update({ role: 'owner' }).eq('circle_id', circleId).eq('user_id', newOwnerId);
      await supabase.from('circles').update({ owner_id: newOwnerId }).eq('id', circleId);
      return true;
    } catch (err) {
      console.error('[useCircles] transferOwnership error:', err);
      return false;
    }
  };

  return {
    circles, loading, error,
    createCircle, joinCircleByCode, leaveCircle,
    getCircle, getCircleMembers, getCircleActivity,
    getUserRole, updateMemberRole, removeMember, transferOwnership,
    refresh: fetchCircles,
  };
}

export default useCircles;
