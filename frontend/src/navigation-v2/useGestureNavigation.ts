/**
 * useGestureNavigation Hook
 * 
 * Provides navigation actions for gesture-based navigation.
 */

import { useGesture, Screen, GestureProvider } from './GestureContext';
import * as Haptics from 'expo-haptics';

export type { Screen };

// Export provider as GestureNavigationProvider for App.tsx
export { GestureProvider as GestureNavigationProvider };

export function useGestureNavigation() {
  const { currentScreen, navigateTo, canSwipe, setCanSwipe } = useGesture();

  const navigate = async (screen: Screen) => {
    if (!canSwipe) return;
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    navigateTo(screen);
  };

  // Convenience methods
  const goToTasks = () => navigate('tasks');
  const goToSocial = () => navigate('social');
  const goToProfile = () => navigate('profile');
  const goToAIHub = () => navigate('ai_hub');
  const goToFocus = () => navigate('focus');

  return {
    currentScreen,
    navigateTo,
    navigate,
    goToTasks,
    goToSocial,
    goToProfile,
    goToAIHub,
    goToFocus,
    canSwipe,
    setCanSwipe,
  };
}
