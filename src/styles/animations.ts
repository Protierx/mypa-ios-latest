import { Animated, Easing } from 'react-native';

export const animationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export const createFadeInUp = (animatedValue: Animated.Value, duration = 400) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
};

export const createFadeIn = (animatedValue: Animated.Value, duration = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
};

export const createFadeOut = (animatedValue: Animated.Value, duration = 200) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  });
};

export const createScaleIn = (animatedValue: Animated.Value, duration = 300) => {
  return Animated.spring(animatedValue, {
    toValue: 1,
    friction: 8,
    tension: 100,
    useNativeDriver: true,
  });
};

export const createSlideInRight = (animatedValue: Animated.Value, duration = 400) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
};

export const createPulse = (animatedValue: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.7,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

export const createFloat = (animatedValue: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: -8,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

export const createBounce = (animatedValue: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: -4,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

export const createGlow = (animatedValue: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.5,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ])
  );
};

export const createPressAnimation = (animatedValue: Animated.Value) => ({
  onPressIn: () => {
    Animated.spring(animatedValue, {
      toValue: 0.98,
      friction: 8,
      useNativeDriver: true,
    }).start();
  },
  onPressOut: () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  },
});

export const staggerDelay = (index: number, baseDelay = 50) => {
  return index * baseDelay;
};

export const useStaggeredAnimation = (
  count: number,
  animatedValues: Animated.Value[],
  duration = 400,
  staggerMs = 50
) => {
  const animations = animatedValues.map((value, index) =>
    Animated.timing(value, {
      toValue: 1,
      duration,
      delay: index * staggerMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    })
  );
  return Animated.parallel(animations);
};
