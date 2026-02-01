import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { styles } from '../styles';

// Slide-in animation wrapper for cards
export const SlideInCard = ({ 
  children, 
  index 
}: { 
  children: React.ReactNode; 
  index?: number 
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      delay: Math.min((index || 0) * 40, 200),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

// Pulsing dot indicator for new items
export const PulseDot = ({ color }: { color: string }) => {
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.pulseDot, { backgroundColor: color, opacity: pulse }]} />
  );
};
