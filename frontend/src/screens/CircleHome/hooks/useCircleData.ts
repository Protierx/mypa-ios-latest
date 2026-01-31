/**
 * useCircleData Hook
 * Manages all circle data fetching and state
 */
import { useState, useEffect } from 'react';
import { circlesApi, assignmentsApi, challengesApi, tasksApi, postsApi } from '../../../services/api';

export function useCircleData(circleId: string, userId: string) {
  const [circleDetails, setCircleDetails] = useState<any>(null);
  const [circleMembers, setCircleMembers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [circleChallenges, setCircleChallenges] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState({ completed: 0, total: 0, timeSaved: 0 });
  const [userPosted, setUserPosted] = useState(false);
  
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch circle details
  const fetchCircleDetails = async () => {
    try {
      const response = await circlesApi.getById(circleId);
      if (response.success && response.data) {
        setCircleDetails(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch circle details:', error);
    }
  };

  // Fetch circle members
  const fetchCircleMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await circlesApi.getMembers(circleId);
      if (response.success && response.data) {
        const members = response.data
          .filter((m: any) => m.userId !== userId)
          .map((m: any) => ({
            id: m.userId,
            name: m.user?.name || m.user?.username || 'Unknown',
            initial: (m.user?.name || m.user?.username || 'U').charAt(0).toUpperCase(),
            posted: m.hasPostedToday || false,
            lastPostTime: m.lastPostTime,
            role: m.role?.toLowerCase() || 'member',
            avatarUrl: m.user?.avatarUrl,
            xpContributed: m.xpContributed || 0,
            tasksCompleted: m.tasksCompleted || 0,
          }));
        setCircleMembers(members);
      } else {
        setCircleMembers([]);
      }
    } catch (error) {
      console.error('Failed to fetch circle members:', error);
      setCircleMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch feed
  const fetchFeed = async () => {
    setLoadingFeed(true);
    try {
      const response = await circlesApi.getFeed(circleId);
      if (response.success && response.data) {
        const apiPosts = response.data.map((p: any) => {
          if (p.type === 'SYSTEM') {
            const systemContent = p.systemContent ? JSON.parse(p.systemContent) : {};
            const action = systemContent.action;
            let systemText = p.content || '';
            let iconName = 'info';
            let isAssignmentRelated = false;

            if (action === 'assigned') {
              systemText = `${p.author?.name} assigned "${systemContent.title}" to ${systemContent.assigneeName}`;
              iconName = 'user-plus';
              isAssignmentRelated = true;
            } else if (action === 'completed') {
              systemText = `${p.author?.name} completed "${systemContent.title}"`;
              iconName = 'check-circle';
              isAssignmentRelated = true;
            } else if (action === 'accepted') {
              systemText = `${p.author?.name} accepted "${systemContent.title}"`;
              iconName = 'check';
              isAssignmentRelated = true;
            }

            return {
              id: p.id,
              type: 'system',
              systemText,
              iconName,
              dueTime: formatTimeAgo(p.createdAt),
              user: { id: p.authorId, name: p.author?.name || 'System' },
              isAssignmentRelated,
              assignmentId: systemContent.assignmentId,
              assignmentTitle: systemContent.title,
              assignerId: systemContent.assignerId,
              assigneeId: systemContent.assigneeId,
              assignmentAction: systemContent.action,
            };
          }

          return {
            id: p.id,
            user: {
              id: p.authorId,
              initial: (p.author?.name || p.author?.username || 'U').charAt(0).toUpperCase(),
              name: p.author?.name || p.author?.username || 'Unknown',
            },
            time: formatTimeAgo(p.createdAt),
            type: p.type === 'DAILY_CARD' ? 'receipt' : 'post',
            content: p.content,
            missions: p.tasksCompleted !== undefined ? { completed: p.tasksCompleted, total: p.totalTasks || 0 } : undefined,
            wallet: p.focusMinutes ? `+${p.focusMinutes}m` : (p.timeSaved ? `+${p.timeSaved}m` : undefined),
            streak: p.streakDay || p.streak,
            reactions: {
              heart: p.reactions?.filter((r: any) => r.emoji === '❤️').length || 0,
              fire: p.reactions?.filter((r: any) => r.emoji === '🔥').length || 0,
              clap: p.reactions?.filter((r: any) => r.emoji === '👏').length || 0,
            },
            userReaction: p.reactions?.find((r: any) => r.userId === userId)?.emoji || null,
          };
        });
        setPosts(apiPosts);
        
        const userPost = response.data.find((p: any) => 
          p.authorId === userId && 
          p.type === 'DAILY_CARD' &&
          new Date(p.createdAt).toDateString() === new Date().toDateString()
        );
        setUserPosted(!!userPost);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Failed to fetch feed:', error);
      setPosts([]);
    } finally {
      setLoadingFeed(false);
    }
  };

  // Fetch assignments
  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const response = await assignmentsApi.getCircleAssignments(circleId);
      if (response.success && response.data) {
        const apiAssignments = response.data.map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          assignedBy: a.creator?.name || a.creator?.username || a.assigner?.name || 'Unknown',
          assignedById: a.creatorId || a.creator?.id || a.assigner?.id,
          assignedTo: a.assignee?.name || a.assignee?.username || 'Unknown',
          assignedToId: a.assigneeId || a.assignee?.id,
          dueTime: formatDueTime(a.dueDate),
          dueDate: a.dueDate,
          status: a.status?.toLowerCase() || 'pending',
          proofUrl: a.proofUrl,
          createdAt: a.createdAt,
          xpReward: a.xpReward || 50,
          repeatEnabled: a.repeatEnabled || false,
          repeatFrequency: a.repeatFrequency,
          requireProof: a.requireProof || false,
          declineReason: a.declineReason,
        }));
        setAssignments(apiAssignments);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Fetch challenges
  const fetchChallenges = async () => {
    setLoadingChallenges(true);
    try {
      const response = await challengesApi.getAll();
      if (response.success && response.data) {
        const circleOnlyChallenges = response.data.filter((c: any) => c.circleId === circleId);
        setCircleChallenges(circleOnlyChallenges);
      } else {
        setCircleChallenges([]);
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
      setCircleChallenges([]);
    } finally {
      setLoadingChallenges(false);
    }
  };

  // Fetch today's task stats
  const fetchTodayStats = async () => {
    try {
      const response = await tasksApi.getToday();
      if (response.success && response.data) {
        const tasks = response.data;
        const completed = tasks.filter((t: any) => t.completed).length;
        const total = tasks.length;
        const timeSaved = tasks
          .filter((t: any) => t.completed)
          .reduce((sum: number, t: any) => sum + (t.durationMin || 0), 0);
        
        setTodayStats({ completed, total, timeSaved });
      } else {
        setTodayStats({ completed: 0, total: 0, timeSaved: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch today stats:', error);
      setTodayStats({ completed: 0, total: 0, timeSaved: 0 });
    }
  };

  // Load all data
  const loadAllData = async () => {
    await Promise.all([
      fetchCircleDetails(),
      fetchCircleMembers(),
      fetchFeed(),
      fetchAssignments(),
      fetchChallenges(),
      fetchTodayStats(),
    ]);
  };

  // Refresh all data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // Helper functions
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatDueTime = (dateString: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${timeStr}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${timeStr}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
    }
  };

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [circleId]);

  return {
    // Data
    circleDetails,
    circleMembers,
    posts,
    assignments,
    circleChallenges,
    todayStats,
    userPosted,
    
    // Loading states
    loadingMembers,
    loadingFeed,
    loadingAssignments,
    loadingChallenges,
    refreshing,
    
    // Actions
    fetchCircleDetails,
    fetchCircleMembers,
    fetchFeed,
    fetchAssignments,
    fetchChallenges,
    fetchTodayStats,
    loadAllData,
    onRefresh,
    setPosts,
    setUserPosted,
    setCircleMembers,
  };
}
