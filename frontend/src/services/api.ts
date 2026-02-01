/**
 * API Service - Centralized HTTP client for MYPA Backend
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { config } from '../config/env';

// Use environment-based API URL
const API_BASE_URL = config.apiUrl;

// Storage keys
const TOKEN_KEY = 'mypa_access_token';
const REFRESH_TOKEN_KEY = 'mypa_refresh_token';
const USER_KEY = 'mypa_user';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.loadTokens();
  }

  // Load tokens from storage on init
  private async loadTokens() {
    try {
      const [access, refresh] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
      ]);
      this.accessToken = access;
      this.refreshToken = refresh;
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }

  // Save tokens to storage
  async setTokens(tokens: TokenPair) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, tokens.accessToken),
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  }

  // Clear tokens (logout)
  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  }

  // Get current access token
  getAccessToken() {
    return this.accessToken;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }

  // Refresh the access token
  private async refreshAccessToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        if (!this.refreshToken) {
          return false;
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        const data = await response.json();

        if (data.success && data.data) {
          await this.setTokens({
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          });
          return true;
        }
        return false;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Main request method
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(url, { ...options, headers });

      // If unauthorized, try to refresh token
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          await this.clearTokens();
          return { success: false, error: 'Session expired. Please log in again.' };
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Convenience methods
  get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Singleton instance
export const api = new ApiService();

// Auth-specific methods
export const authApi = {
  async register(email: string, password: string, name?: string) {
    const response = await api.post('/auth/register', { email, password, name });
    if (response.success && response.data) {
      await api.setTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    }
    return response;
  },

  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    if (response.success && response.data) {
      await api.setTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    }
    return response;
  },

  async logout() {
    await api.post('/auth/logout');
    await api.clearTokens();
  },

  async getStoredUser() {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
};

// User API
export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.patch('/users/me', data),
  getStats: () => api.get('/users/me/stats'),
  getSettings: () => api.get('/users/me/settings'),
  updateSettings: (data: any) => api.patch('/users/me/settings', data),
};

// Tasks API
export const tasksApi = {
  getAll: () => api.get('/tasks'),
  getToday: () => api.get('/tasks/today'),
  getOpen: () => api.get('/tasks/open'),
  getStats: () => api.get('/tasks/stats'),
  create: (task: any) => api.post('/tasks', task),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  complete: (id: string) => api.post(`/tasks/${id}/complete`),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// Focus API
export const focusApi = {
  getActive: () => api.get('/focus/active'),
  start: (data: { targetMinutes?: number; taskId?: string; category?: string }) =>
    api.post('/focus/start', data),
  pause: () => api.post('/focus/pause'),
  resume: () => api.post('/focus/resume'),
  complete: () => api.post('/focus/complete'),
  abandon: () => api.post('/focus/abandon'),
  getHistory: () => api.get('/focus/history'),
  getStats: () => api.get('/focus/stats'),
};

// Brain Dump API
export const brainDumpApi = {
  getAll: (processed?: boolean) =>
    api.get(`/brain-dump${processed !== undefined ? `?processed=${processed}` : ''}`),
  create: (content: string, autoProcess = false) =>
    api.post('/brain-dump', { content, autoProcess }),
  batchCreate: (items: string[]) => api.post('/brain-dump/batch', { items }),
  process: (id: string) => api.post(`/brain-dump/${id}/process`),
  convert: (id: string, overrides?: any) =>
    api.post(`/brain-dump/${id}/convert`, overrides || {}),
  delete: (id: string) => api.delete(`/brain-dump/${id}`),
  getStats: () => api.get('/brain-dump/stats'),
  
  // AI Smart Scheduling
  smartSchedule: (itemIds: string[], autoCreate = true) =>
    api.post('/brain-dump/smart-schedule', { itemIds, autoCreate }),
  
  // Quick schedule - takes raw text items and schedules them
  quickSchedule: (items: string[], autoCreate = true) =>
    api.post('/brain-dump/quick-schedule', { items, autoCreate }),
};

// AI API - MYPA Assistant
export const aiApi = {
  // Main conversation endpoint - use this for all AI interactions
  conversation: (message: string, conversationHistory?: { role: 'user' | 'assistant'; content: string }[]) =>
    api.post('/ai/conversation', { message, conversationHistory }),
  
  // Process voice command (simpler, action-focused)
  processCommand: (text: string) => api.post('/ai/process-command', { text }),
  
  // Get morning briefing
  getBriefing: () => api.get('/ai/briefing'),
  
  // Get evening summary
  getEveningSummary: () => api.get('/ai/evening-summary'),
  
  // Get proactive suggestion
  getSuggestion: () => api.get('/ai/suggestion'),
  
  // Get task optimization suggestions
  getTaskSuggestions: () => api.get('/ai/task-suggestions'),
  
  // Auto-categorize a task
  categorizeTask: (title: string, description?: string) =>
    api.post('/ai/categorize-task', { title, description }),
  
  // Smart schedule tasks
  smartSchedule: (
    tasks: { id: string; title: string; priority?: string; durationMin?: number }[],
    preferences?: { workingHoursStart?: string; workingHoursEnd?: string; preferMorningForWork?: boolean }
  ) => api.post('/ai/smart-schedule', { tasks, preferences }),
  
  // Get daily insights
  getDailyInsights: () => api.get('/ai/daily-insights'),
  
  // General chat (simple Q&A)
  chat: (message: string) => api.post('/ai/chat', { message }),
  
  // Transcribe audio (Whisper)
  transcribe: (audioBase64: string, language = 'en') =>
    api.post('/ai/transcribe-base64', { audio: audioBase64, language }),
  
  // Suggest a challenge based on user prompt
  suggestChallenge: (prompt: string) => api.post('/ai/suggest-challenge', { prompt }),
};

// TTS API - Text to Speech
export const ttsApi = {
  speak: (text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova', speed = 1.0) =>
    api.post('/tts/speak', { text, voice, speed }),
  
  stream: (text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova', speed = 1.0) =>
    api.post('/tts/stream', { text, voice, speed }),
};

// Challenges API
export const challengesApi = {
  // Get all available challenges
  getAll: () => api.get('/challenges'),
  
  // Get challenges user has joined
  getMine: () => api.get('/challenges/mine'),
  
  // Get active challenges
  getActive: () => api.get('/challenges/active'),
  
  // Get challenge by ID
  getById: (id: string) => api.get(`/challenges/${id}`),
  
  // Get challenge leaderboard
  getLeaderboard: (id: string, limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return api.get(`/challenges/${id}/leaderboard${query}`);
  },
  
  // Create a new challenge
  create: (data: {
    title: string;
    description?: string; // Allow description in challenge create API call typing
    emoji?: string;
    type: 'FOCUS_MINUTES' | 'TASKS_COMPLETED' | 'STREAK_DAYS' | 'CUSTOM';
    targetValue: number;
    startsAt: string;
    endsAt: string;
    xpReward?: number;
    circleId?: string;
  }) => api.post('/challenges', data),
  
  // Join a challenge
  join: (id: string) => api.post(`/challenges/${id}/join`),
  
  // Leave a challenge
  leave: (id: string) => api.post(`/challenges/${id}/leave`),
  
  // Update progress
  updateProgress: (id: string, amount: number) => 
    api.post(`/challenges/${id}/progress`, { amount }),
  
  // Update challenge (only creator can edit)
  update: (id: string, data: {
    title?: string;
    description?: string;
    emoji?: string;
    targetValue?: number;
    endsAt?: string;
    xpReward?: number;
  }) => api.put(`/challenges/${id}`, data),
  
  // Delete challenge (only creator can delete)
  delete: (id: string) => api.delete(`/challenges/${id}`),
};

// Circles API
export const circlesApi = {
  // Circle CRUD
  list: () => api.get('/circles'),
  getAll: () => api.get('/circles'),
  getById: (id: string) => api.get(`/circles/${id}`),
  create: (data: { name: string; description?: string; emoji?: string; color?: string; isPrivate?: boolean }) =>
    api.post('/circles', data),
  update: (id: string, data: any) => api.patch(`/circles/${id}`, data),
  delete: (id: string) => api.delete(`/circles/${id}`),
  
  // Membership
  join: (id: string) => api.post(`/circles/${id}/join`),
  joinByCode: (code: string) => api.post(`/circles/join/${code}`),
  leave: (id: string) => api.post(`/circles/${id}/leave`),
  previewByCode: (code: string) => api.get(`/circles/preview/${code}`),
  
  // Members
  getMembers: (circleId: string) => api.get(`/circles/${circleId}/members`),
  updateMemberRole: (circleId: string, userId: string, role: 'ADMIN' | 'MEMBER') =>
    api.patch(`/circles/${circleId}/members/${userId}`, { role }),
  kickMember: (circleId: string, userId: string) =>
    api.delete(`/circles/${circleId}/members/${userId}`),
  
  // Invite code
  regenerateInviteCode: (circleId: string) => api.post(`/circles/${circleId}/invite-code`),
  
  // Feed & Posts
  getFeed: (circleId: string, options?: { type?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (options?.type) params.set('type', options.type);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    const query = params.toString();
    return api.get(`/circles/${circleId}/feed${query ? `?${query}` : ''}`);
  },
  createPost: (circleId: string, data: { type?: string; content?: string; imageUrl?: string }) =>
    api.post(`/circles/${circleId}/posts`, data),
  createDailyCard: (circleId: string) => api.post(`/circles/${circleId}/posts/daily-card`),
  
  // Assignments
  getAssignments: (circleId: string, status?: string) => {
    const query = status ? `?status=${status}` : '';
    return api.get(`/circles/${circleId}/assignments${query}`);
  },
  createAssignment: (circleId: string, data: {
    assigneeId: string;
    title: string;
    description?: string;
    dueDate?: string;
    xpReward?: number;
    repeatEnabled?: boolean;
    repeatFrequency?: string;
    requireProof?: boolean;
  }) => api.post(`/circles/${circleId}/assignments`, data),
};

// Assignments API
export const assignmentsApi = {
  getMine: (options?: { role?: 'assignee' | 'creator'; status?: string }) => {
    const params = new URLSearchParams();
    if (options?.role) params.set('role', options.role);
    if (options?.status) params.set('status', options.status);
    const query = params.toString();
    return api.get(`/assignments/mine${query ? `?${query}` : ''}`);
  },
  getCircleAssignments: (circleId: string, status?: string) => {
    const query = status ? `?status=${status}` : '';
    return api.get(`/circles/${circleId}/assignments${query}`);
  },
  create: (data: {
    circleId: string;
    assigneeId: string;
    title: string;
    description?: string;
    dueDate?: string;
    xpReward?: number;
    repeatEnabled?: boolean;
    repeatFrequency?: string;
    requireProof?: boolean;
  }) => {
    const { circleId, ...body } = data;
    return api.post(`/circles/${circleId}/assignments`, body);
  },
  getById: (id: string) => api.get(`/assignments/${id}`),
  accept: (id: string) => api.post(`/assignments/${id}/accept`),
  decline: (id: string, reason?: string) => api.post(`/assignments/${id}/decline`, { reason }),
  complete: (id: string, proof?: { proofUrl?: string; proofNote?: string }) =>
    api.post(`/assignments/${id}/complete`, proof || {}),
  delete: (id: string) => api.delete(`/assignments/${id}`),
  // Update assignment details (creator only)
  update: (id: string, data: {
    title?: string;
    description?: string | null;
    dueDate?: string | null;
    xpReward?: number;
    repeatEnabled?: boolean;
    repeatFrequency?: string | null;
    requireProof?: boolean;
  }) => api.put(`/assignments/${id}`, data),
  // Update decline response (assignee only) - accept or update reason
  updateResponse: (id: string, action: 'update-reason' | 'accept', reason?: string) =>
    api.put(`/assignments/${id}/response`, { action, reason }),
};

// Posts API
export const postsApi = {
  getById: (id: string) => api.get(`/posts/${id}`),
  delete: (id: string) => api.delete(`/posts/${id}`),
  react: (id: string, emoji: string) => api.post(`/posts/${id}/react`, { emoji }),
  removeReaction: (id: string) => api.delete(`/posts/${id}/react`),
  getReactions: (id: string) => api.get(`/posts/${id}/reactions`),
};

// Invitations API
export const invitationsApi = {
  // Get my pending invitations
  getMine: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return api.get(`/invitations/mine${query}`);
  },
  
  // Send invitation to a user
  invite: (circleId: string, userId: string, message?: string) =>
    api.post(`/invitations/circle/${circleId}/invite/${userId}`, { message }),
  
  // Accept invitation
  accept: (invitationId: string) => api.post(`/invitations/${invitationId}/accept`),
  
  // Decline invitation
  decline: (invitationId: string) => api.post(`/invitations/${invitationId}/decline`),
  
  // Search users to invite
  searchUsers: (circleId: string, query: string) =>
    api.get(`/invitations/search/${circleId}?q=${encodeURIComponent(query)}`),
};

// Analytics API
export const analyticsApi = {
  // Get daily stats
  getDaily: (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return api.get(`/analytics/daily${query}`);
  },
  
  // Get weekly stats
  getWeekly: (weekStart?: string) => {
    const query = weekStart ? `?weekStart=${weekStart}` : '';
    return api.get(`/analytics/weekly${query}`);
  },
  
  // Get productivity trends
  getTrends: () => api.get('/analytics/trends'),
  
  // Get user insights and milestones
  getInsights: () => api.get('/analytics/insights'),
  
  // Get dashboard summary
  getDashboard: () => api.get('/analytics/dashboard'),
  
  // Get global leaderboard
  getGlobalLeaderboard: (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return api.get(`/analytics/leaderboard/global${query}`);
  },
  
  // Get circle leaderboard
  getCircleLeaderboard: (circleId: string) => 
    api.get(`/analytics/leaderboard/circle/${circleId}`),
  
  // Get circle analytics
  getCircleAnalytics: (circleId: string) => 
    api.get(`/analytics/circle/${circleId}`),
};

// Notifications API
export const notificationsApi = {
  // Register push token
  registerToken: (pushToken: string, platform?: 'ios' | 'android' | 'expo') =>
    api.post('/notifications/register-token', { pushToken, platform: platform || 'expo' }),
  
  // Remove push token
  removeToken: () => api.delete('/notifications/token'),
  
  // Get notification history
  getAll: (options?: { limit?: number; offset?: number; unreadOnly?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    if (options?.unreadOnly) params.set('unreadOnly', 'true');
    const query = params.toString();
    return api.get(`/notifications${query ? `?${query}` : ''}`);
  },
  
  // Get unread count
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  // Mark notification as read
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  
  // Mark all as read
  markAllRead: () => api.put('/notifications/read-all'),
  
  // Delete notification
  delete: (id: string) => api.delete(`/notifications/${id}`),
  
  // Clear all notifications
  clearAll: () => api.delete('/notifications'),
  
  // Get notification settings
  getSettings: () => api.get('/notifications/settings'),
  
  // Update notification settings
  updateSettings: (settings: {
    pushEnabled?: boolean;
    taskReminders?: boolean;
    assignmentAlerts?: boolean;
    streakReminders?: boolean;
    dailyBriefing?: boolean;
    levelUpAlerts?: boolean;
    challengeUpdates?: boolean;
    circleActivity?: boolean;
    aiInsights?: boolean;
    weeklyDigest?: boolean;
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    badgeEnabled?: boolean;
    quietHoursEnabled?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }) => api.put('/notifications/settings', settings),
  
  // Send test notification
  sendTest: () => api.post('/notifications/test'),
};

export default api;
