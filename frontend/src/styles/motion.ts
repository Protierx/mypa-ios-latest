/**
 * MYPA Motion System — Reanimated-based shared animation utilities.
 *
 * Snappy, energetic — bold confident motion.
 *
 * Rules:
 * - All transforms run on the UI thread via useAnimatedStyle.
 * - No heavy shadow animation.
 * - Respect reduce-motion where possible (kept subtle by default).
 */

import { useCallback, useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
  type SharedValue,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

// ─── Duration tokens (snappier) ─────────────────────────────
export const durations = {
  fast: 100,
  normal: 200,
  slow: 350,
  sheet: 300,
} as const;

// ─── Easing presets ──────────────────────────────────────────
export const easings = {
  /** Standard deceleration — entering elements */
  easeOut: Easing.bezier(0.16, 1, 0.3, 1),
  /** Standard acceleration — exiting elements */
  easeIn: Easing.bezier(0.4, 0, 1, 1),
  /** Smooth both ways — transforming elements */
  easeInOut: Easing.bezier(0.4, 0, 0.2, 1),
  /** Snappy overshoot — micro-interactions */
  overshoot: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

// ─── Spring presets (higher stiffness, less damping) ────────
export const springs = {
  /** Snappy press feedback */
  press: {
    damping: 14,
    stiffness: 550,
    mass: 0.3,
  } satisfies WithSpringConfig,

  /** Card expand / collapse */
  card: {
    damping: 16,
    stiffness: 280,
    mass: 0.5,
  } satisfies WithSpringConfig,

  /** Bottom sheet slide */
  sheet: {
    damping: 20,
    stiffness: 220,
    mass: 0.6,
  } satisfies WithSpringConfig,

  /** Gentle section reveal */
  gentle: {
    damping: 18,
    stiffness: 160,
    mass: 0.7,
  } satisfies WithSpringConfig,

  /** Bouncy celebration */
  bouncy: {
    damping: 8,
    stiffness: 400,
    mass: 0.4,
  } satisfies WithSpringConfig,

  /** Completion pop */
  pop: {
    damping: 10,
    stiffness: 450,
    mass: 0.35,
  } satisfies WithSpringConfig,

  /** Ultra-snappy micro-interaction */
  snap: {
    damping: 18,
    stiffness: 700,
    mass: 0.25,
  } satisfies WithSpringConfig,

  /** Celebration elastic bounce */
  elastic: {
    damping: 6,
    stiffness: 350,
    mass: 0.5,
  } satisfies WithSpringConfig,
} as const;

// ─── Press feedback hook ─────────────────────────────────────
/**
 * Returns animated style + press handlers for scale-down press feedback.
 *
 * Usage:
 * ```tsx
 * const { animatedStyle, pressHandlers } = usePressFeedback();
 * <Animated.View style={animatedStyle} {...pressHandlers}> … </Animated.View>
 * ```
 */
export function usePressFeedback(scale = 0.95, opacityMin = 0.75) {
  const pressed = useSharedValue(0);

  const onPressIn = useCallback(() => {
    'worklet';
    pressed.value = withSpring(1, springs.press);
  }, [pressed]);

  const onPressOut = useCallback(() => {
    'worklet';
    pressed.value = withSpring(0, springs.press);
  }, [pressed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, scale]) }],
    opacity: interpolate(pressed.value, [0, 1], [1, opacityMin]),
  }));

  return {
    animatedStyle,
    pressHandlers: {
      onPressIn,
      onPressOut,
    },
    /** Direct access to the shared value for custom compositions */
    pressed,
  };
}

// ─── Screen enter animation hook ─────────────────────────────
/**
 * Fade + slight translateY on mount — fast and non-blocking.
 *
 * Usage:
 * ```tsx
 * const enterStyle = useEnterAnimation();
 * <Animated.View style={enterStyle}> … </Animated.View>
 * ```
 */
export function useEnterAnimation(
  translateY = 20,
  duration: number = durations.normal,
  delay: number = 0,
) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: easings.easeOut }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [translateY, 0]) },
    ],
  }));

  return animatedStyle;
}

// ─── Stagger-in hook ─────────────────────────────────────────
/**
 * Returns an array of animated styles for staggered entry.
 *
 * Usage:
 * ```tsx
 * const staggerStyles = useStaggerIn(items.length);
 * items.map((item, i) => <Animated.View style={staggerStyles[i]} key={item.id} />)
 * ```
 */
export function useStaggerIn(
  count: number,
  staggerMs = 45,
  translateY = 24,
  duration = durations.normal,
) {
  const progresses = Array.from({ length: count }, () => useSharedValue(0));

  useEffect(() => {
    progresses.forEach((p, i) => {
      p.value = withDelay(
        i * staggerMs,
        withTiming(1, { duration, easing: easings.easeOut }),
      );
    });
  }, [count]);

  const styles = progresses.map((p) =>
    useAnimatedStyle(() => ({
      opacity: p.value,
      transform: [
        { translateY: interpolate(p.value, [0, 1], [translateY, 0]) },
      ],
    })),
  );

  return styles;
}

// ─── Completion "pop" helper ─────────────────────────────────
/**
 * Drives a shared value through a pop sequence:
 * 1 → 1.25 → 0 (scale up then collapse).
 */
export function triggerCompletionPop(sv: SharedValue<number>) {
  'worklet';
  sv.value = withSequence(
    withSpring(1.25, springs.pop),
    withTiming(0, { duration: durations.fast, easing: easings.easeIn }),
  );
}

// ─── Sheet helpers ───────────────────────────────────────────
/**
 * Spring-in value from 0 → 1 (for sheet translateY interpolation).
 */
export function sheetOpen(sv: SharedValue<number>) {
  'worklet';
  sv.value = withSpring(1, springs.sheet);
}

export function sheetClose(
  sv: SharedValue<number>,
  onFinished?: () => void,
) {
  'worklet';
  sv.value = withTiming(0, { duration: durations.fast, easing: easings.easeIn }, (finished) => {
    if (finished && onFinished) {
      runOnJS(onFinished)();
    }
  });
}

// ─── Aggregate export ────────────────────────────────────────
export const motion = {
  durations,
  easings,
  springs,
  triggerCompletionPop,
  sheetOpen,
  sheetClose,
} as const;
