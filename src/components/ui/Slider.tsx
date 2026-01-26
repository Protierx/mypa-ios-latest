import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder, Animated, ViewStyle, Text } from 'react-native';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  trackColor?: string;
  activeTrackColor?: string;
  thumbColor?: string;
  style?: ViewStyle;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = false,
  trackColor = '#E2E8F0',
  activeTrackColor = '#8B5CF6',
  thumbColor = '#FFFFFF',
  style,
}: SliderProps) {
  const trackWidth = useRef(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const percentage = ((value - min) / (max - min)) * 100;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        if (trackWidth.current > 0) {
          const newPercentage = Math.max(0, Math.min(100, (gestureState.moveX / trackWidth.current) * 100));
          const range = max - min;
          let newValue = min + (newPercentage / 100) * range;
          
          if (step > 0) {
            newValue = Math.round(newValue / step) * step;
          }
          
          newValue = Math.max(min, Math.min(max, newValue));
          onValueChange(newValue);
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  return (
    <View style={[styles.container, style]}>
      <View
        style={styles.trackContainer}
        onLayout={(e) => {
          trackWidth.current = e.nativeEvent.layout.width;
        }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.track, { backgroundColor: trackColor }]}>
          <View
            style={[
              styles.activeTrack,
              { width: `${percentage}%`, backgroundColor: activeTrackColor },
            ]}
          />
        </View>
        <View
          style={[
            styles.thumb,
            {
              left: `${percentage}%`,
              backgroundColor: thumbColor,
              borderColor: activeTrackColor,
            },
            disabled && styles.disabled,
          ]}
        />
      </View>
      {showValue && (
        <Text style={styles.valueText}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  activeTrack: {
    height: '100%',
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    minWidth: 32,
    textAlign: 'right',
  },
});
