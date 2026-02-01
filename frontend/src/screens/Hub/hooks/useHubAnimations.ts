/**
 * useHubAnimations Hook
 * Manages all animations for the Hub screen
 */
import { useRef, useEffect, useCallback } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UseHubAnimationsReturn {
  // Animation values
  xpPopupAnim: Animated.Value;
  pulseAnim: Animated.Value;
  floatAnim: Animated.Value;
  shimmerAnim: Animated.Value;
  orbBreathAnim: Animated.Value;
  waveAnims: Animated.Value[];
  insightFadeAnim: Animated.Value;
  briefingSlideAnim: Animated.Value;
  
  // Computed transforms
  shimmerTranslate: Animated.AnimatedInterpolation<number>;
  
  // Methods
  startXpPopupAnimation: (onComplete: () => void) => void;
  startWaveAnimation: () => () => void;
  stopWaveAnimation: () => void;
  animateBriefingSlide: (step: number) => void;
  animateInsightTransition: (onMidpoint: () => void) => void;
}

export function useHubAnimations(
  isSpeaking: boolean,
  showXpPopup: boolean
): UseHubAnimationsReturn {
  // Animation values
  const xpPopupAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const orbBreathAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([...Array(5)].map(() => new Animated.Value(8))).current;
  const insightFadeAnim = useRef(new Animated.Value(1)).current;
  const briefingSlideAnim = useRef(new Animated.Value(0)).current;

  // Float animation
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    floatAnimation.start();
    return () => floatAnimation.stop();
  }, []);

  // Pulse glow animation
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  // Orb breathe animation
  useEffect(() => {
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(orbBreathAnim, {
          toValue: 1.03,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbBreathAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    breatheAnimation.start();
    return () => breatheAnimation.stop();
  }, []);

  // Shimmer animation
  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, []);

  // Waveform animation for speaking
  useEffect(() => {
    if (isSpeaking) {
      const animations = waveAnims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 24,
              duration: 250,
              delay: i * 100,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 8,
              duration: 250,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        )
      );
      animations.forEach(a => a.start());
      return () => animations.forEach(a => a.stop());
    } else {
      waveAnims.forEach(anim => anim.setValue(8));
    }
  }, [isSpeaking]);

  // Computed transforms
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  // XP popup animation
  const startXpPopupAnimation = useCallback((onComplete: () => void) => {
    xpPopupAnim.setValue(0);
    Animated.sequence([
      Animated.timing(xpPopupAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(xpPopupAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  }, [xpPopupAnim]);

  // Wave animation control
  const startWaveAnimation = useCallback(() => {
    const animations = waveAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 24,
            duration: 250,
            delay: i * 100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 8,
            duration: 250,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, [waveAnims]);

  const stopWaveAnimation = useCallback(() => {
    waveAnims.forEach(anim => anim.setValue(8));
  }, [waveAnims]);

  // Briefing slide animation
  const animateBriefingSlide = useCallback((step: number) => {
    Animated.spring(briefingSlideAnim, {
      toValue: step,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [briefingSlideAnim]);

  // Insight transition animation
  const animateInsightTransition = useCallback((onMidpoint: () => void) => {
    Animated.sequence([
      Animated.timing(insightFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(insightFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    // Call midpoint callback after fade out
    setTimeout(onMidpoint, 200);
  }, [insightFadeAnim]);

  return {
    xpPopupAnim,
    pulseAnim,
    floatAnim,
    shimmerAnim,
    orbBreathAnim,
    waveAnims,
    insightFadeAnim,
    briefingSlideAnim,
    shimmerTranslate,
    startXpPopupAnimation,
    startWaveAnimation,
    stopWaveAnimation,
    animateBriefingSlide,
    animateInsightTransition,
  };
}
