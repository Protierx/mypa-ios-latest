/**
 * Gamification Event Queue — offline-safe retry mechanism
 *
 * If the POST /task-completed call fails (network, timeout, etc.),
 * the event is persisted to AsyncStorage and retried later.
 * The same event_id guarantees idempotency on the server side.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/supabaseApi';
import type { PendingEvent, TaskCompletedResponse } from '@/types/gamification';

const QUEUE_KEY = '@gamification_pending_events';
const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 30_000; // 30 seconds

let retryTimer: ReturnType<typeof setInterval> | null = null;
let onEventProcessed: ((taskId: string, response: TaskCompletedResponse) => void) | null = null;

// ---------------------------------------------------------------------------
// Queue persistence
// ---------------------------------------------------------------------------

async function loadQueue(): Promise<PendingEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: PendingEvent[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Add a failed event to the retry queue.
 */
export async function enqueueEvent(eventId: string, taskId: string): Promise<void> {
  const queue = await loadQueue();
  // Don't double-add
  if (queue.some((e) => e.eventId === eventId)) return;
  queue.push({
    eventId,
    taskId,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  });
  await saveQueue(queue);
  ensureRetryLoop();
}

/**
 * Remove a successfully-processed event from the queue.
 */
export async function dequeueEvent(eventId: string): Promise<void> {
  const queue = await loadQueue();
  await saveQueue(queue.filter((e) => e.eventId !== eventId));
}

/**
 * Get all pending events (for UI display or debugging).
 */
export async function getPendingEvents(): Promise<PendingEvent[]> {
  return loadQueue();
}

/**
 * Register a callback for when a queued event is finally processed.
 * The GamificationContext uses this to reconcile state.
 */
export function setOnEventProcessed(cb: (taskId: string, response: TaskCompletedResponse) => void): void {
  onEventProcessed = cb;
}

/**
 * Process all pending events — called on app launch and periodically.
 */
export async function processQueue(): Promise<void> {
  const queue = await loadQueue();
  if (queue.length === 0) {
    stopRetryLoop();
    return;
  }

  const remaining: PendingEvent[] = [];

  for (const event of queue) {
    try {
      const response = await api.taskCompleted(event.eventId, event.taskId);
      // Success — notify listener
      onEventProcessed?.(event.taskId, response);
    } catch (err) {
      // Still failing — keep in queue if under max retries
      const next = { ...event, retryCount: event.retryCount + 1 };
      if (next.retryCount < MAX_RETRIES) {
        remaining.push(next);
      } else {
        console.warn('[EventQueue] Dropping event after max retries:', event.eventId);
      }
    }
  }

  await saveQueue(remaining);
  if (remaining.length === 0) stopRetryLoop();
}

// ---------------------------------------------------------------------------
// Retry loop
// ---------------------------------------------------------------------------

function ensureRetryLoop(): void {
  if (retryTimer) return;
  retryTimer = setInterval(() => {
    processQueue().catch(console.warn);
  }, RETRY_INTERVAL_MS);
}

function stopRetryLoop(): void {
  if (retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
}

/**
 * Start processing any queued events (call on app mount).
 */
export function startEventQueueProcessor(): void {
  processQueue().catch(console.warn);
}
