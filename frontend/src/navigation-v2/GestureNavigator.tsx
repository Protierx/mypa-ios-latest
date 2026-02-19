/**
 * Gesture Navigator
 * 
 * Main navigation component using swipe gestures.
 * - CENTER: AI Hub (default)
 * - LEFT: Social View
 * - RIGHT: Tasks View
 * - DOWN: Profile View
 * - UP: Focus Modal (opens as overlay)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Modal, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useGestureNavigation, Screen } from './useGestureNavigation';
import { GestureProvider, useGesture } from './GestureContext';
import { FocusModalProvider } from './FocusModalContext';
import { useVoice } from '../contexts/VoiceContext';

// Import screens
import { AIHubScreen } from '../screens-v2/AIHub';
import { TasksViewScreen } from '../screens-v2/TasksView';
import { SocialViewScreen } from '../screens-v2/SocialView';
import { ProfileViewScreen } from '../screens-v2/ProfileView';
import { FocusModal } from '../screens-v2/FocusModal/FocusModal';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Swipe thresholds
const HORIZONTAL_THRESHOLD = 80;
const VERTICAL_THRESHOLD = 30;
// Profile return is intentionally easier — shorter swipe needed to go back
const PROFILE_RETURN_THRESHOLD = 25;
const PROFILE_RETURN_VELOCITY = -150;

// Spring config for smooth animations
const SPRING_CONFIG = {
  damping: 22,
  stiffness: 160,
  mass: 0.8,
};

function GestureNavigatorContent() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const { currentScreen, navigateTo, canSwipe } = useGestureNavigation();
  const { requestedNavigation, clearNavigationRequest } = useVoice();
  
  // Focus modal overlay state
  const [showFocusModal, setShowFocusModal] = useState(false);

  // Animated values for screen positions
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Track if we're currently transitioning
  const isTransitioning = useSharedValue(false);

  // Axis lock: 0=undecided, 1=horizontal, 2=vertical
  // Determined on first significant movement, held for the entire gesture
  const lockedAxis = useSharedValue(0);

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Open focus modal as overlay
  const openFocusModal = useCallback((_taskId?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowFocusModal(true);
  }, []);

  // Navigate with animation
  const animateToScreen = useCallback((screen: Screen) => {
    'worklet';
    
    isTransitioning.value = true;
    
    switch (screen) {
      case 'tasks':
        translateX.value = withSpring(-SCREEN_WIDTH, SPRING_CONFIG, () => {
          isTransitioning.value = false;
        });
        translateY.value = withSpring(0, SPRING_CONFIG);
        break;
      case 'social':
        translateX.value = withSpring(SCREEN_WIDTH, SPRING_CONFIG, () => {
          isTransitioning.value = false;
        });
        translateY.value = withSpring(0, SPRING_CONFIG);
        break;
      case 'profile':
        translateY.value = withSpring(-SCREEN_HEIGHT, SPRING_CONFIG, () => {
          isTransitioning.value = false;
        });
        translateX.value = withSpring(0, SPRING_CONFIG);
        break;
      case 'ai_hub':
      default:
        translateX.value = withSpring(0, SPRING_CONFIG, () => {
          isTransitioning.value = false;
        });
        translateY.value = withSpring(0, SPRING_CONFIG);
        break;
    }
    
    runOnJS(navigateTo)(screen);
    runOnJS(triggerHaptic)();
  }, [navigateTo, triggerHaptic, SCREEN_WIDTH, SCREEN_HEIGHT]);

  // Step 7b: Voice-triggered navigation — AI tool call sets requestedNavigation,
  // we animate to that screen and clear the request.
  useEffect(() => {
    if (!requestedNavigation) return;
    const { screen } = requestedNavigation;
    if (screen === currentScreen) {
      clearNavigationRequest();
      return;
    }
    if (screen === 'focus') {
      openFocusModal();
    } else {
      animateToScreen(screen);
    }
    clearNavigationRequest();
  }, [requestedNavigation, currentScreen, animateToScreen, openFocusModal, clearNavigationRequest]);

  // Pan gesture handler — axis-locked grid navigation
  const panGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-12, 12])
    .activeOffsetY([-10, 10])
    .onBegin(() => {
      lockedAxis.value = 0; // reset for each new gesture
    })
    .onUpdate((event) => {
      if (isTransitioning.value) return;

      // ── Axis lock: determine dominant direction on first significant movement ──
      if (lockedAxis.value === 0) {
        const absX = Math.abs(event.translationX);
        const absY = Math.abs(event.translationY);
        if (absX > 10 || absY > 10) {
          lockedAxis.value = absX >= absY ? 1 : 2;
        }
        return; // don't translate until axis is determined
      }

      // ── Drag preview (only on the locked axis) ──
      if (currentScreen === 'ai_hub') {
        if (lockedAxis.value === 1) {
          // Horizontal: peek left/right screens
          translateX.value = event.translationX * 0.7;
        } else {
          // Vertical: only preview downward for Profile peek
          // Upward swipe opens Focus Modal (overlay, no grid position to preview)
          // Negate Y: swipe down (positive translationY) → container shifts up (negative translateY)
          if (event.translationY > 0) {
            translateY.value = -event.translationY * 0.7;
          }
        }
      } else if (currentScreen === 'tasks') {
        // Only allow rightward swipe to return (translationX > 0)
        translateX.value = -SCREEN_WIDTH + Math.max(0, event.translationX * 0.5);
      } else if (currentScreen === 'social') {
        // Only allow leftward swipe to return (translationX < 0)
        translateX.value = SCREEN_WIDTH + Math.min(0, event.translationX * 0.5);
      } else if (currentScreen === 'profile') {
        // Swipe up to return: negate translationY so preview moves toward AI Hub
        // translationY < 0 (finger up) → -translationY is positive → closer to 0
        // Use 0.9 multiplier (less dampening) so the drag feels responsive
        const returnProgress = Math.max(0, -event.translationY * 0.9);
        translateY.value = -SCREEN_HEIGHT + returnProgress;
      }
    })
    .onEnd((event) => {
      if (isTransitioning.value) return;

      const { translationX, translationY, velocityX, velocityY } = event;

      // From AI Hub — locked axis determines which thresholds to check
      if (currentScreen === 'ai_hub') {
        if (lockedAxis.value === 1) {
          // Horizontal axis locked → only left/right navigation
          if (translationX < -HORIZONTAL_THRESHOLD || velocityX < -500) {
            animateToScreen('tasks');
          } else if (translationX > HORIZONTAL_THRESHOLD || velocityX > 500) {
            animateToScreen('social');
          } else {
            animateToScreen('ai_hub');
          }
        } else if (lockedAxis.value === 2) {
          // Vertical axis locked → only up (Focus) / down (Profile)
          if (translationY < -VERTICAL_THRESHOLD || velocityY < -200) {
            animateToScreen('ai_hub'); // snap back, Focus is a modal overlay
            runOnJS(openFocusModal)();
          } else if (translationY > VERTICAL_THRESHOLD || velocityY > 200) {
            animateToScreen('profile');
          } else {
            animateToScreen('ai_hub');
          }
        } else {
          // Axis never determined (tiny gesture) → snap back
          animateToScreen('ai_hub');
        }
      }
      // From Tasks — swipe right to return
      else if (currentScreen === 'tasks') {
        if (translationX > HORIZONTAL_THRESHOLD || velocityX > 500) {
          animateToScreen('ai_hub');
        } else {
          animateToScreen('tasks');
        }
      }
      // From Social — swipe left to return
      else if (currentScreen === 'social') {
        if (translationX < -HORIZONTAL_THRESHOLD || velocityX < -500) {
          animateToScreen('ai_hub');
        } else {
          animateToScreen('social');
        }
      }
      // From Profile — swipe up to return (intentionally forgiving)
      else if (currentScreen === 'profile') {
        if (translationY < -PROFILE_RETURN_THRESHOLD || velocityY < PROFILE_RETURN_VELOCITY) {
          animateToScreen('ai_hub');
        } else {
          animateToScreen('profile');
        }
      }

      lockedAxis.value = 0;
    }), [currentScreen, animateToScreen, SCREEN_WIDTH, SCREEN_HEIGHT]);

  // Animated styles for the screen container
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // Dynamic screen positioning based on current window dimensions
  const screenStyle = useMemo(() => ({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  }), [SCREEN_WIDTH, SCREEN_HEIGHT]);

  const containerDynamic = useMemo(() => ({
    width: SCREEN_WIDTH * 3,
    height: SCREEN_HEIGHT * 2,
  }), [SCREEN_WIDTH, SCREEN_HEIGHT]);

  return (
    <>
      <FocusModalProvider openFocusModal={openFocusModal}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.container}>
            <Animated.View style={[styles.screenContainer, containerDynamic, animatedContainerStyle]}>
              <View style={[screenStyle, { position: 'absolute', left: -SCREEN_WIDTH, top: 0 }]}>
                <ErrorBoundary>
                  <SocialViewScreen />
                </ErrorBoundary>
              </View>
              <View style={[screenStyle, { position: 'absolute', left: 0, top: 0 }]}>
                <ErrorBoundary>
                  <AIHubScreen />
                </ErrorBoundary>
              </View>
              <View style={[screenStyle, { position: 'absolute', left: SCREEN_WIDTH, top: 0 }]}>
                <ErrorBoundary>
                  <TasksViewScreen />
                </ErrorBoundary>
              </View>
              <View style={[screenStyle, { position: 'absolute', left: 0, top: SCREEN_HEIGHT }]}>
                <ErrorBoundary>
                  <ProfileViewScreen />
                </ErrorBoundary>
              </View>
            </Animated.View>
          
          {/* Swipe indicators removed — users learn gestures via AppTour */}
        </View>
      </GestureDetector>
      </FocusModalProvider>

      {/* Focus Modal Overlay — outside GestureDetector to avoid single-child constraint */}
      <Modal
        visible={showFocusModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFocusModal(false)}
      >
        <FocusModal onDismiss={() => setShowFocusModal(false)} />
      </Modal>
    </>
  );
}

/**
 * Bridge component — watches screen changes and sends contextual updates
 * to the active ElevenLabs voice session (Step 14a).
 * Lives inside GestureProvider so it can access both useGesture() and useVoice().
 */
function ScreenContextBridge() {
  const { currentScreen } = useGesture();
  const { updateScreenContext } = useVoice();
  const prevScreenRef = useRef<Screen>(currentScreen);

  useEffect(() => {
    if (currentScreen !== prevScreenRef.current) {
      prevScreenRef.current = currentScreen;
      updateScreenContext(currentScreen);
    }
  }, [currentScreen, updateScreenContext]);

  return null; // Renderless bridge
}

export function GestureNavigator() {
  return (
    <View style={styles.root}>
      <GestureProvider>
        <ScreenContextBridge />
        <GestureNavigatorContent />
      </GestureProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  screenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
