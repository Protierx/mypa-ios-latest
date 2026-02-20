/**
 * Navigation Event Bus
 *
 * Lightweight pub/sub for cross-screen navigation actions that can't
 * be handled by the swipe-based GestureNavigator (which is screen-level only).
 *
 * Primary use case: Tapping a challenge notification in the Hub screen
 * needs to navigate to the Social screen AND open the ChallengeDetailModal
 * with the right challengeId. The NotificationsModal emits the event,
 * and SocialViewScreen subscribes to act on it.
 */

type OpenChallengeListener = (challengeId: string, circleId?: string) => void;

class NavigationBus {
  private challengeListeners: Set<OpenChallengeListener> = new Set();

  /** Subscribe to "open challenge" events. Returns unsubscribe function. */
  onOpenChallenge(listener: OpenChallengeListener): () => void {
    this.challengeListeners.add(listener);
    return () => {
      this.challengeListeners.delete(listener);
    };
  }

  /** Emit an "open challenge" event — all subscribers will be called. */
  openChallenge(challengeId: string, circleId?: string): void {
    this.challengeListeners.forEach((fn) => {
      try {
        fn(challengeId, circleId);
      } catch (e) {
        console.warn('[NavigationBus] listener error:', e);
      }
    });
  }
}

/** Singleton — imported by NotificationsModal and SocialViewScreen. */
export const navigationBus = new NavigationBus();
