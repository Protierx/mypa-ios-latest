import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env');
}

const authConfig = Platform.OS === 'web'
  ? {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    }
  : {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authConfig,
});

// Database types (will be generated later with Supabase CLI)
export type Tables = {
  profiles: {
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
    push_token: string | null;
    timezone: string;
    briefing_cache: string | null;
    briefing_date: string | null;
    is_premium: boolean;
    created_at: string;
    updated_at: string;
  };
  tasks: {
    id: string;
    user_id: string;
    circle_id: string | null;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'completed' | 'deferred';
    estimated_duration: number | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  };
  circles: {
    id: string;
    name: string;
    emoji: string;
    description: string | null;
    owner_id: string;
    privacy: 'public' | 'invite-only' | 'private';
    invite_code: string | null;
    created_at: string;
  };
  focus_sessions: {
    id: string;
    user_id: string;
    task_id: string | null;
    duration_planned: number;
    duration_actual: number | null;
    started_at: string;
    ended_at: string | null;
    xp_earned: number;
  };
  challenges: {
    id: string;
    title: string;
    emoji: string;
    description: string | null;
    creator_id: string;
    circle_id: string | null;
    type: 'focus_time' | 'tasks_completed' | 'daily_checkin' | 'custom';
    goal_value: number;
    duration_days: number;
    starts_at: string;
    ends_at: string;
    status: 'active' | 'completed' | 'cancelled';
    created_at: string;
  };
  challenge_participants: {
    challenge_id: string;
    user_id: string;
    progress: number;
    joined_at: string;
  };
  unlocks: {
    user_id: string;
    feature: string;
    unlocked_at: string;
    seen: boolean;
  };
  notifications: {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string | null;
    data: Record<string, any>;
    read: boolean;
    created_at: string;
  };
  event_log: {
    id: string;
    user_id: string;
    event_type: string;
    action: string | null;
    intent_raw: string | null;
    ai_model_used: string | null;
    confidence: number | null;
    tokens_used: number | null;
    user_override: boolean;
    latency_ms: number | null;
    error_code: string | null;
    success: boolean;
    screen: string | null;
    screen_context: string | null;
    metadata: Record<string, any>;
    params: Record<string, any>;
    created_at: string;
  };
  user_model: {
    user_id: string;
    peak_hours: number[];
    completion_patterns: Record<string, any>;
    task_preferences: Record<string, any>;
    overwhelm_threshold: number | null;
    voice_usage_rate: number;
    common_reschedule_patterns: Record<string, any>;
    tone_preference: string;
    avg_task_durations: Record<string, any>;
    completion_rate_7d: number;
    overwhelm_score: number;
    unlock_level: number;
    focus_efficiency: number;
    preferred_focus_duration: number;
    active_days_count: number;
    calculated_at: string;
  };
};

// Export convenience types
export type Profile = Tables['profiles'];
export type Task = Tables['tasks'];
export type Circle = Tables['circles'];
export type FocusSession = Tables['focus_sessions'];
export type Challenge = Tables['challenges'];
export type ChallengeParticipant = Tables['challenge_participants'];
export type Unlock = Tables['unlocks'];
export type Notification = Tables['notifications'];
export type UserEvent = Tables['event_log'];
export type UserModel = Tables['user_model'];
export type UserEvent = Tables['user_events'];
export type UserModel = Tables['user_model'];
export type CircleMember = {
  circle_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
};
