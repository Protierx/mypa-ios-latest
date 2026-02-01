import React from 'react';
import { View, Text, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { WeekDay } from '../types';
import { styles } from '../styles';

interface WeeklyChartProps {
  weeklyBreakdown: WeekDay[];
  chartBarAnims: Animated.Value[];
  maxTime: number;
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({
  weeklyBreakdown,
  chartBarAnims,
  maxTime,
}) => {
  const todayIndex = 3; // Assuming middle of the week for display purposes

  return (
    <View style={styles.chartCard}>
      <BlurView intensity={40} tint="light" style={styles.chartBlur}>
        <Text style={styles.chartTitle}>This Week</Text>
        <View style={styles.chartContainer}>
          {weeklyBreakdown.map((day, index) => {
            const isToday = index === todayIndex;
            const heightPercent = day.time > 0 ? (day.time / maxTime) * 100 : 8;
            const animatedHeight = chartBarAnims[index]
              ? chartBarAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, heightPercent],
                })
              : heightPercent;

            return (
              <View key={day.day} style={styles.chartBarContainer}>
                <Text
                  style={[
                    styles.chartBarLabel,
                    day.time > 0 ? styles.chartBarLabelActive : styles.chartBarLabelInactive,
                  ]}
                >
                  {day.label}
                </Text>
                <View style={styles.chartBarWrapper}>
                  <Animated.View
                    style={[
                      styles.chartBar,
                      day.time > 0
                        ? isToday
                          ? styles.chartBarToday
                          : styles.chartBarActive
                        : styles.chartBarInactive,
                      {
                        height: chartBarAnims[index]
                          ? (animatedHeight as Animated.AnimatedInterpolation<number>).interpolate({
                              inputRange: [0, 100],
                              outputRange: ['0%', '100%'],
                            })
                          : `${heightPercent}%`,
                        minHeight: 8,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.chartDayLabel,
                    isToday && styles.chartDayLabelToday,
                  ]}
                >
                  {day.day}
                </Text>
              </View>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};
