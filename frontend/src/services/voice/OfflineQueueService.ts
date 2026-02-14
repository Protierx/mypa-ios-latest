/**
 * OfflineQueueService — Step 20c
 *
 * Queues voice-initiated actions when the device is offline or the network is
 * degraded. Actions are persisted in AsyncStorage and automatically flushed
 * when connectivity is restored.
 *
 * Usage:
 *   await OfflineQueueService.enqueue('create_task', { title: 'Buy milk' }, userId);
 *   // later, when back online:
 *   const results = await OfflineQueueService.flush(userId);
 */

import type { ActionJSON, ActionResult } from '../actionExecutor';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueuedAction {
  id: string;
  action: string;
  params: Record<string, unknown>;
  userId: string;
  timestamp: number;
  /** Number of flush attempts so far */
  attempts: number;
}

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';

export interface FlushResult {
  succeeded: number;
  failed: number;
  remaining: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'mypa_offline_action_queue';
const MAX_ATTEMPTS = 3;
/** Actions that are safe to queue offline (idempotent or additive) */
const QUEUEABLE_ACTIONS = new Set([
  'create_task',
  'update_task',
  'complete_task',
  'reschedule_task',
  'start_focus_session',
  'end_focus_session',
  'create_braindump',
  'log_mood',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _AsyncStorage: any = null;

async function getAsyncStorage() {
  if (!_AsyncStorage) {
    _AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  }
  return _AsyncStorage;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class OfflineQueueServiceClass {
  // ── Queue management ──────────────────────────────────────────────────────

  /**
   * Check if an action type can be safely queued for later execution.
   * Some actions (like delete, query) don't make sense to queue.
   */
  canQueue(actionName: string): boolean {
    return QUEUEABLE_ACTIONS.has(actionName);
  }

  /**
   * Add an action to the offline queue.
   */
  async enqueue(
    action: string,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<QueuedAction> {
    const item: QueuedAction = {
      id: generateId(),
      action,
      params,
      userId,
      timestamp: Date.now(),
      attempts: 0,
    };

    const queue = await this.getQueue();
    queue.push(item);
    await this.saveQueue(queue);

    console.log(`[OfflineQueue] Enqueued: ${action} (${queue.length} total)`);
    return item;
  }

  /**
   * Get the current queue.
   */
  async getQueue(): Promise<QueuedAction[]> {
    try {
      const AsyncStorage = await getAsyncStorage();
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get queue length (for UI badge).
   */
  async getQueueLength(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Flush all queued actions — execute them in order.
   * Called when connectivity is restored.
   */
  async flush(userId: string): Promise<FlushResult> {
    const queue = await this.getQueue();
    if (queue.length === 0) return { succeeded: 0, failed: 0, remaining: 0 };

    // Lazy-import executeAction to avoid circular deps
    const { executeAction } = await import('../actionExecutor');

    let succeeded = 0;
    let failed = 0;
    const remaining: QueuedAction[] = [];

    console.log(`[OfflineQueue] Flushing ${queue.length} queued actions...`);

    for (const item of queue) {
      // Only flush actions belonging to this user
      if (item.userId !== userId) {
        remaining.push(item);
        continue;
      }

      try {
        const actionJson: ActionJSON = {
          action: item.action,
          params: item.params,
          confidence: 0.9,
          confirmation_required: false,
        };

        const result: ActionResult = await executeAction(actionJson, userId);

        if (result.success) {
          succeeded++;
          console.log(`[OfflineQueue] ✓ ${item.action} (queued ${this.formatAge(item.timestamp)})`);
        } else {
          item.attempts++;
          if (item.attempts < MAX_ATTEMPTS) {
            remaining.push(item);
            console.warn(`[OfflineQueue] ✗ ${item.action} — retry ${item.attempts}/${MAX_ATTEMPTS}`);
          } else {
            failed++;
            console.error(`[OfflineQueue] ✗ ${item.action} — max attempts reached, dropping`);
          }
        }
      } catch (err) {
        item.attempts++;
        if (item.attempts < MAX_ATTEMPTS) {
          remaining.push(item);
        } else {
          failed++;
        }
        console.error(`[OfflineQueue] Error flushing ${item.action}:`, err);
      }
    }

    await this.saveQueue(remaining);
    console.log(`[OfflineQueue] Flush complete: ${succeeded} ok, ${failed} dropped, ${remaining.length} remaining`);

    return { succeeded, failed, remaining: remaining.length };
  }

  /**
   * Clear the entire queue (e.g. on logout).
   */
  async clear(): Promise<void> {
    const AsyncStorage = await getAsyncStorage();
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[OfflineQueue] Cleared');
  }

  // ── Connection quality ────────────────────────────────────────────────────

  /**
   * Determine current connection quality by probing the ElevenLabs API.
   * Returns a tier that drives the degradation strategy.
   */
  async checkConnectionQuality(): Promise<ConnectionQuality> {
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('https://api.elevenlabs.io/v1/models', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const latency = Date.now() - start;

      if (!res.ok) return 'poor';
      if (latency < 300) return 'excellent';
      if (latency < 1000) return 'good';
      return 'poor';
    } catch {
      return 'offline';
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async saveQueue(queue: QueuedAction[]): Promise<void> {
    const AsyncStorage = await getAsyncStorage();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }

  private formatAge(timestamp: number): string {
    const secs = Math.round((Date.now() - timestamp) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
    return `${Math.round(secs / 3600)}h ago`;
  }
}

/** Singleton */
export const OfflineQueueService = new OfflineQueueServiceClass();
