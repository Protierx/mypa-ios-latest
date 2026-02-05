/**
 * Gesture Navigator (v2)
 * 
 * Gesture-based navigation system for MYPA.
 * Replaces tab navigation with swipe gestures.
 * 
 * Architecture:
 *   - AI Hub is CENTER (default)
 *   - Tasks View is LEFT (swipe left)
 *   - Social View is RIGHT (swipe right)
 *   - Profile View is DOWN (swipe down from Hub)
 *   - Focus Modal is UP (swipe up from Hub)
 * 
 * TODO: Implement in Phase 3
 */

export { GestureNavigator } from './GestureNavigator';
export { GestureContext, useGesture } from './GestureContext';
export { useGestureNavigation } from './useGestureNavigation';
export { SwipeIndicator } from './SwipeIndicator';
