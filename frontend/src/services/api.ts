/**
 * API Service - Centralized HTTP client for MYPA Backend
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use your machine's LAN IP address - visible in Expo output as 192.168.1.31
const API_BASE_URL = 'http://192.168.1.31:3000';

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
  
  // General chat (simple Q&A)
  chat: (message: string) => api.post('/ai/chat', { message }),
  
  // Transcribe audio (Whisper)
  transcribe: (audioBase64: string, language = 'en') =>
    api.post('/ai/transcribe-base64', { audio: audioBase64, language }),
};

// TTS API - Text to Speech
export const ttsApi = {
  speak: (text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova', speed = 1.0) =>
    api.post('/tts/speak', { text, voice, speed }),
  
  stream: (text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova', speed = 1.0) =>
    api.post('/tts/stream', { text, voice, speed }),
};

export default api;
