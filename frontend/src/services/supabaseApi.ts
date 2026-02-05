/**
 * Supabase API Service
 * Wrapper for calling Edge Functions
 */
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface GreetingResponse {
  greeting: string;
  taskCount: number;
  completedToday: number;
  streak: number;
}

interface VoiceCommandResponse {
  success: boolean;
  message: string;
  action?: {
    type: string;
    payload: any;
  };
  shouldSpeak: boolean;
  intent: string;
}

interface UnlocksResponse {
  newUnlocks: string[];
  allUnlocks: Array<{
    feature: string;
    unlocked: boolean;
    progress: any;
  }>;
  stats: {
    daysActive: number;
    tasksCompleted: number;
    focusSessions: number;
    inCircle: boolean;
    streakDays: number;
  };
}

interface DailyBriefResponse {
  greeting: string;
  summary: {
    totalTasks: number;
    highPriorityCount: number;
    completedYesterday: number;
  };
  peakHourSuggestion: string | null;
  challengeUpdate: string | null;
  streakStatus: {
    current: number;
    message: string | null;
  };
  motivationalInsight: string | null;
  briefText: string;
}

class SupabaseApiService {
  private getAuthHeader = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session');
    }
    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  };

  /**
   * Get personalized AI greeting for the AI Hub
   */
  async getGreeting(): Promise<GreetingResponse> {
    const headers = await this.getAuthHeader();
    
    const { data, error } = await supabase.functions.invoke('ai-greeting', {
      headers,
    });

    if (error) throw error;
    return data as GreetingResponse;
  }

  /**
   * Process a voice command
   */
  async processVoiceCommand(
    transcript: string,
    context?: {
      screen?: string;
      selectedTaskId?: string;
      focusActive?: boolean;
    }
  ): Promise<VoiceCommandResponse> {
    const headers = await this.getAuthHeader();

    const { data, error } = await supabase.functions.invoke('voice-command', {
      headers,
      body: { transcript, context },
    });

    if (error) throw error;
    return data as VoiceCommandResponse;
  }

  /**
   * Check and calculate user unlocks
   */
  async checkUnlocks(): Promise<UnlocksResponse> {
    const headers = await this.getAuthHeader();

    const { data, error } = await supabase.functions.invoke('calculate-unlocks', {
      headers,
    });

    if (error) throw error;
    return data as UnlocksResponse;
  }

  /**
   * Send push notification (admin/system use)
   */
  async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ success: boolean }> {
    // Note: This should only be called from server-side or admin functions
    // The service_role_key is required, not anon key
    const { data: result, error } = await supabase.functions.invoke('send-push', {
      body: { userId, title, body, data },
    });

    if (error) throw error;
    return result;
  }

  /**
   * Get personalized daily brief
   * Returns task summary, peak hour suggestions, challenge updates, and AI-generated brief
   */
  async getDailyBrief(): Promise<DailyBriefResponse> {
    const headers = await this.getAuthHeader();

    const { data, error } = await supabase.functions.invoke('daily-brief', {
      headers,
    });

    if (error) throw error;
    return data as DailyBriefResponse;
  }
}

// Export singleton instance
export const api = new SupabaseApiService();

// Also export individual functions for convenience
export const getGreeting = () => api.getGreeting();
export const processVoiceCommand = (
  transcript: string,
  context?: { screen?: string; selectedTaskId?: string; focusActive?: boolean }
) => api.processVoiceCommand(transcript, context);
export const checkUnlocks = () => api.checkUnlocks();
export const getDailyBrief = () => api.getDailyBrief();

export default api;
