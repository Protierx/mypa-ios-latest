/**
 * Analytics Invalidation Bus
 *
 * Simple event emitter that allows gamification events (task completion,
 * focus completion, check-ins) to tell the analytics hook to refetch.
 *
 * Solves the core bug: "completing a task gives +12 XP, but Analytics
 * does not update" — because the useAnalytics hook caches for 60s and
 * had no way to know the backend data changed.
 */

type Listener = () => void;

class AnalyticsInvalidationBus {
  private listeners: Set<Listener> = new Set();

  /** Subscribe to invalidation events. Returns unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Notify all subscribers to refetch analytics. */
  invalidate(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn('[AnalyticsInvalidationBus] listener error:', e);
      }
    });
  }
}

/** Singleton — imported by both GamificationContext and useAnalytics. */
export const analyticsInvalidationBus = new AnalyticsInvalidationBus();
