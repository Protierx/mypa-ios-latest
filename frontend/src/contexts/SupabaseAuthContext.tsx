/**
 * Supabase Authentication Context
 * New auth system using Supabase Auth
 * 
 * Provides: user, session, loading states, and auth methods
 * Automatically persists session and syncs with profiles table
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Profile type matching our Supabase profiles table
export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak_current: number;
  streak_longest: number;
  streak_last_activity: string | null;
  onboarding_completed: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

// Combined user type for app use
export interface AppUser {
  id: string;
  email: string;
  profile: Profile | null;
  // Convenience accessors
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  isOnboarded: boolean;
  isPremium: boolean;
}

interface SupabaseAuthContextType {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Auth methods
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  
  // Profile methods
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

// Helper to generate username from email
function generateUsername(email: string): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}_${suffix}`;
}

// Convert Supabase user + profile to AppUser
function toAppUser(supabaseUser: SupabaseUser, profile: Profile | null): AppUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    profile,
    // Convenience accessors with fallbacks
    name: profile?.display_name || supabaseUser.user_metadata?.name || null,
    username: profile?.username || null,
    avatarUrl: profile?.avatar_url || null,
    xp: profile?.xp || 0,
    level: profile?.level || 1,
    currentStreak: profile?.streak_current || 0,
    longestStreak: profile?.streak_longest || 0,
    isOnboarded: profile?.onboarding_completed || false,
    isPremium: profile?.is_premium || false,
  };
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let cancelled = false;

    // Timeout: if auth check takes too long, stop loading but don't wipe session
    // (onAuthStateChange may still deliver the session after this)
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      console.warn('[Auth] Initial session check timed out – stopping spinner');
      setIsLoading(false);
      // Don't clear user/session here — onAuthStateChange may still fire
    }, 12000);

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user);
        } else {
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        console.error('Error getting session:', error);
        setIsLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        setSession(session);
        
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Fetch profile from profiles table (with timeout to prevent hang)
  async function fetchProfile(supabaseUser: SupabaseUser) {
    try {
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();  // maybeSingle won't error on 0 rows

      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'Profile fetch timed out' } }), 5000)
      );

      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.warn('[Auth] Profile fetch issue:', error.message);
      }

      setUser(toAppUser(supabaseUser, profile));
    } catch (error) {
      console.error('[Auth] Error fetching profile:', error);
      setUser(toAppUser(supabaseUser, null));
    } finally {
      setIsLoading(false);
    }
  }

  // Sign up with email/password
  async function signUp(email: string, password: string, name?: string) {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }, // Store name in user metadata
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            display_name: name || null,
            username: generateUsername(email),
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Don't fail signup if profile creation fails
          // The profile can be created later
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }

  // Sign in with email/password
  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }

  // Sign in with Apple
  async function signInWithApple() {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple Sign-In is only available on iOS' };
    }

    try {
      setIsLoading(true);

      // Check if Apple auth is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return { success: false, error: 'Apple Sign-In is not available on this device' };
      }

      // Request Apple credential
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return { success: false, error: 'No identity token received from Apple' };
      }

      // Sign in with Supabase using the Apple token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If this is a new user, create their profile
      if (data.user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          // Build name from Apple credential
          const fullName = credential.fullName
            ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
            : null;

          await supabase.from('profiles').insert({
            id: data.user.id,
            display_name: fullName,
            username: generateUsername(data.user.email || `user${Date.now()}`),
          });
        }
      }

      return { success: true };
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        return { success: false, error: 'Sign in was cancelled' };
      }
      console.error('Apple Sign-In error:', error);
      return { success: false, error: 'Apple Sign-In failed' };
    } finally {
      setIsLoading(false);
    }
  }

  // Sign out
  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  // Refresh profile data
  async function refreshProfile() {
    if (session?.user) {
      await fetchProfile(session.user);
    }
  }

  // Update profile
  async function updateProfile(data: Partial<Profile>) {
    if (!user?.id) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Refresh profile to get updated data
      await refreshProfile();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update profile' };
    }
  }

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signInWithApple,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

// Alias for easier migration - can use useAuth() with the new provider
export { useSupabaseAuth as useAuth };
