/**
 * Authentication Context
 * Provides user state and auth methods throughout the app
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, authApi, userApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socketService } from '../services/socket';
import { setCalendarSyncUser } from '../services/calendarSync';

export interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  tasksCompleted: number;
  focusMinutes: number;
  challengesWon: number;
  totalTimeSaved: number;
  isOnboarded: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Connect to socket when user is authenticated
  useEffect(() => {
    if (user && api.isAuthenticated()) {
      socketService.connect().then((connected) => {
        if (connected) {
          console.log('🔌 Socket connected after auth');
        }
      });
    }
  }, [user]);

  async function checkAuth() {
    try {
      // First check for stored user
      const storedUser = await authApi.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setCalendarSyncUser(storedUser.id); // Set user for calendar sync
      }

      // Then verify with server if we have a token
      if (api.isAuthenticated()) {
        const response = await userApi.getProfile();
        if (response.success && response.data) {
          setUser(response.data);
          setCalendarSyncUser(response.data.id); // Set user for calendar sync
          await AsyncStorage.setItem('mypa_user', JSON.stringify(response.data));
        } else {
          // Token invalid, clear everything
          await authApi.logout();
          setUser(null);
          setCalendarSyncUser(null); // Clear user for calendar sync
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        setUser(response.data.user);
        setCalendarSyncUser(response.data.user.id); // Set user for calendar sync
        return { success: true };
      }
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async function register(email: string, password: string, name?: string) {
    try {
      const response = await authApi.register(email, password, name);
      if (response.success && response.data) {
        setUser(response.data.user);
        setCalendarSyncUser(response.data.user.id); // Set user for calendar sync
        return { success: true };
      }
      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async function logout() {
    socketService.disconnect();
    setCalendarSyncUser(null); // Clear user for calendar sync
    await authApi.logout();
    setUser(null);
  }

  async function refreshUser() {
    const response = await userApi.getProfile();
    if (response.success && response.data) {
      setUser(response.data);
      await AsyncStorage.setItem('mypa_user', JSON.stringify(response.data));
    }
  }

  function updateUser(data: Partial<User>) {
    if (user) {
      setUser({ ...user, ...data });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
