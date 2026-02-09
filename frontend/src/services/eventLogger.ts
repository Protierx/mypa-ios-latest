/**
 * Event Logger Service
 * 
 * Logs user events to power AI personalization and learning.
 * Events are queued locally and batch-sent to Supabase.
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 6, Step 6.1
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 5 "Learning System"
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

/**
 * Event types that power AI learning
 */
export type EventType =
  // App lifecycle
  | 'app_opened'
  | 'app_backgrounded'
  | 'screen_viewed'
  
  // Navigation
  | 'swipe_navigation'
  
  // Voice interactions
  | 'voice_command'
  | 'voice_activated'
  | 'voice_error'
  
  // Task events (key for AI learning)
  | 'task_created'
  | 'task_completed'
  | 'task_deferred'
  | 'task_deleted'
  | 'task_edited'
  
  // Focus sessions (key for duration estimation)
  | 'focus_started'
  | 'focus_paused'
  | 'focus_resumed'
  | 'focus_completed'
  | 'focus_abandoned'
  
  // Social events
  | 'circle_joined'
  | 'circle_viewed'
  | 'challenge_joined'
  | 'challenge_progress'
  | 'challenge_completed'
  
  // AI interactions
  | 'ai_greeting_shown'
  | 'daily_brief_shown'
  | 'unlock_earned'
  | 'unlock_celebration_shown'

  // Briefing tracking (PRD R2.5)
  | 'briefing_started'
  | 'briefing_progress'
  | 'briefing_skipped'
  
  // Engagement metrics
  | 'feature_used'
  | 'button_pressed'
  | 'modal_opened'
  | 'modal_dismissed';

/**
 * Event metadata varies by event type
 */
export interface EventMetadata {
  // Screen context
  screen?: string;
  previousScreen?: string;
  
  // Navigation
  direction?: 'left' | 'right' | 'up' | 'down';
  
  // Voice
  transcript?: string;
  intent?: string;
  action?: string;
  success?: boolean;
  errorType?: string;

  // PRD 4.8 voice command fields
  confidence?: number;
  latency_ms?: number;
  ai_model_used?: string;
  tokens_used?: number;
  user_override?: boolean;
  
  // Task
  taskId?: string;
  taskTitle?: string;
  taskPriority?: 'low' | 'medium' | 'high' | 'urgent';
  deferredTo?: string;
  completionTimeMinutes?: number;
  
  // Focus
  sessionId?: string;
  durationPlanned?: number;
  durationActual?: number;
  taskLinked?: boolean;
  
  // Social
  circleId?: string;
  circleName?: string;
  challengeId?: string;
  challengeType?: string;
  
  // Unlock
  feature?: string;
  unlockType?: string;
  
  // Briefing (PRD R2.5)
  briefingLengthChars?: number;
  briefingProgressPercent?: number;
  skippedAtPercent?: number;

  // Generic
  [key: string]: any;
}

/**
 * Event record structure
 */
interface EventRecord {
  id: string;
  event_type: EventType;
  screen: string | null;
  metadata: EventMetadata;
  timestamp: string;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  /** Storage key for persisted event queue */
  STORAGE_KEY: 'mypa_event_queue',
  
  /** Max events before forcing a flush */
  BATCH_SIZE: 10,
  
  /** Interval for automatic batch send (ms) */
  FLUSH_INTERVAL: 30000, // 30 seconds
  
  /** Max queue size before dropping oldest events */
  MAX_QUEUE_SIZE: 100,
  
  /** Retry delay for failed sends (ms) */
  RETRY_DELAY: 5000,
  
  /** Max retry attempts before dropping events */
  MAX_RETRIES: 3,
};

// ============================================================================
// Event Logger Service
// ============================================================================

class EventLoggerService {
  private queue: EventRecord[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;
  private retryCount = 0;
  private currentScreen: string = 'unknown';
  private isInitialized = false;

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  /**
   * Initialize the event logger
   * Call this on app start
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load persisted queue from storage
      await this.loadQueue();
      
      // Start periodic flush timer
      this.startFlushTimer();
      
      this.isInitialized = true;
      console.log('[EventLogger] Initialized with', this.queue.length, 'queued events');
    } catch (error) {
      console.error('[EventLogger] Failed to initialize:', error);
    }
  }

  /**
   * Cleanup on app shutdown
   */
  async shutdown(): Promise<void> {
    this.stopFlushTimer();
    await this.persistQueue();
    console.log('[EventLogger] Shutdown complete');
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * Log an event (fire and forget)
   * 
   * @param type - Event type
   * @param metadata - Additional event data
   */
  log(type: EventType, metadata: EventMetadata = {}): void {
    // Generate event record
    const event: EventRecord = {
      id: this.generateId(),
      event_type: type,
      screen: this.currentScreen,
      metadata: {
        ...metadata,
        // Add timestamp to metadata for analysis
        loggedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    // Add to queue
    this.enqueue(event);

    // Check if we should flush
    if (this.queue.length >= CONFIG.BATCH_SIZE) {
      this.flush();
    }

    // Debug log in development
    if (__DEV__) {
      console.log('[EventLogger]', type, metadata);
    }
  }

  /**
   * Update current screen (for screen context in events)
   */
  setCurrentScreen(screen: string): void {
    const previousScreen = this.currentScreen;
    this.currentScreen = screen;
    
    // Auto-log screen view
    this.log('screen_viewed', { 
      screen, 
      previousScreen: previousScreen !== 'unknown' ? previousScreen : undefined 
    });
  }

  /**
   * Force flush all queued events
   * Useful before app backgrounding
   */
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  /**
   * Get current queue size (for debugging)
   */
  get queueSize(): number {
    return this.queue.length;
  }

  // --------------------------------------------------------------------------
  // Convenience Methods
  // --------------------------------------------------------------------------

  /**
   * Log app opened event
   */
  logAppOpened(): void {
    this.log('app_opened', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log app backgrounded event
   */
  logAppBackgrounded(): void {
    this.log('app_backgrounded', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log swipe navigation
   */
  logSwipe(direction: 'left' | 'right' | 'up' | 'down', toScreen: string): void {
    this.log('swipe_navigation', {
      direction,
      screen: toScreen,
    });
  }

  /**
   * Log voice command (PRD 4.8)
   *
   * @param transcript - Raw transcript from Whisper STT
   * @param action - Action name from GPT function calling
   * @param success - Whether the action executed successfully
   * @param details - PRD 4.8 fields: confidence, latency_ms, ai_model_used, tokens_used, user_override
   */
  logVoiceCommand(
    transcript: string,
    action?: string,
    success: boolean = true,
    details?: {
      confidence?: number;
      latency_ms?: number;
      ai_model_used?: string;
      tokens_used?: number;
      user_override?: boolean;
    },
  ): void {
    this.log('voice_command', {
      transcript,
      intent: action,   // keep 'intent' key for backward compat
      action,            // PRD 4.8 field
      success,
      ...details,
    });
  }

  /**
   * Log task created
   */
  logTaskCreated(taskId: string, title: string, priority?: string): void {
    this.log('task_created', {
      taskId,
      taskTitle: title,
      taskPriority: priority as any,
    });
  }

  /**
   * Log task completed
   */
  logTaskCompleted(taskId: string, title: string, completionTimeMinutes?: number): void {
    this.log('task_completed', {
      taskId,
      taskTitle: title,
      completionTimeMinutes,
    });
  }

  /**
   * Log task deferred
   */
  logTaskDeferred(taskId: string, title: string, deferredTo: string): void {
    this.log('task_deferred', {
      taskId,
      taskTitle: title,
      deferredTo,
    });
  }

  /**
   * Log focus session started
   */
  logFocusStarted(sessionId: string, durationPlanned: number, taskId?: string): void {
    this.log('focus_started', {
      sessionId,
      durationPlanned,
      taskId,
      taskLinked: !!taskId,
    });
  }

  /**
   * Log focus session completed
   */
  logFocusCompleted(sessionId: string, durationActual: number, durationPlanned: number): void {
    this.log('focus_completed', {
      sessionId,
      durationActual,
      durationPlanned,
      completionRatio: durationActual / durationPlanned,
    });
  }

  /**
   * Log focus session abandoned
   */
  logFocusAbandoned(sessionId: string, durationActual: number, durationPlanned: number): void {
    this.log('focus_abandoned', {
      sessionId,
      durationActual,
      durationPlanned,
      completionRatio: durationActual / durationPlanned,
    });
  }

  /**
   * Log unlock earned
   */
  logUnlockEarned(feature: string): void {
    this.log('unlock_earned', {
      feature,
    });
  }

  /**
   * Log daily briefing started (PRD R2.5)
   */
  logBriefingStarted(lengthChars: number): void {
    this.log('briefing_started', {
      briefingLengthChars: lengthChars,
    });
  }

  /**
   * Log daily briefing progress (PRD R2.5)
   */
  logBriefingProgress(percent: 25 | 50 | 100): void {
    this.log('briefing_progress', {
      briefingProgressPercent: percent,
    });
  }

  /**
   * Log daily briefing skipped / barge-in (PRD R2.5)
   */
  logBriefingSkipped(skippedAtPercent: number): void {
    this.log('briefing_skipped', {
      skippedAtPercent,
    });
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  /**
   * Add event to queue
   */
  private enqueue(event: EventRecord): void {
    this.queue.push(event);
    
    // Trim if queue is too large (drop oldest)
    if (this.queue.length > CONFIG.MAX_QUEUE_SIZE) {
      const dropped = this.queue.splice(0, this.queue.length - CONFIG.MAX_QUEUE_SIZE);
      console.warn('[EventLogger] Dropped', dropped.length, 'old events (queue full)');
    }
    
    // Persist queue (async, fire and forget)
    this.persistQueue().catch(() => {});
  }

  /**
   * Flush queue to Supabase
   */
  private async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;
    
    this.isFlushing = true;
    const eventsToSend = [...this.queue];
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // No user logged in, keep events for later
        this.isFlushing = false;
        return;
      }

      // Prepare events for insert
      const records = eventsToSend.map(event => ({
        user_id: user.id,
        event_type: event.event_type,
        screen: event.screen,
        metadata: event.metadata,
        created_at: event.timestamp,
      }));

      // Batch insert to Supabase
      const { error } = await supabase
        .from('user_events')
        .insert(records);

      if (error) {
        throw error;
      }

      // Success - remove sent events from queue
      this.queue = this.queue.filter(e => !eventsToSend.includes(e));
      this.retryCount = 0;
      
      // Persist updated queue
      await this.persistQueue();
      
      if (__DEV__) {
        console.log('[EventLogger] Flushed', eventsToSend.length, 'events');
      }
    } catch (error) {
      console.error('[EventLogger] Flush failed:', error);
      
      // Retry logic
      this.retryCount++;
      if (this.retryCount < CONFIG.MAX_RETRIES) {
        setTimeout(() => this.flush(), CONFIG.RETRY_DELAY);
      } else {
        console.warn('[EventLogger] Max retries reached, will try again later');
        this.retryCount = 0;
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    this.stopFlushTimer();
    this.flushTimer = setInterval(() => {
      this.flush();
    }, CONFIG.FLUSH_INTERVAL);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Persist queue to AsyncStorage
   */
  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        CONFIG.STORAGE_KEY,
        JSON.stringify(this.queue)
      );
    } catch (error) {
      console.error('[EventLogger] Failed to persist queue:', error);
    }
  }

  /**
   * Load queue from AsyncStorage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(CONFIG.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[EventLogger] Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Generate unique event ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const eventLogger = new EventLoggerService();

// Default export for convenience
export default eventLogger;
