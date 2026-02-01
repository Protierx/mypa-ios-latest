import React from 'react';
import { View, Text } from 'react-native';
import { ProductivityTrends } from '../types';
import { formatHour } from '../utils';
import { styles } from '../styles';

interface PeakHoursProps {
  trends: ProductivityTrends | null;
}

export const PeakHours: React.FC<PeakHoursProps> = ({ trends }) => {
  if (!trends?.peakHours?.length) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Peak Productivity Hours</Text>
      {trends.peakHours.slice(0, 3).map((peak, index) => (
        <View
          key={index}
          style={[
            styles.peakHourRow,
            index === Math.min(2, trends.peakHours.length - 1) && {
              borderBottomWidth: 0,
            },
          ]}
        >
          <View style={styles.peakHourRank}>
            <Text style={styles.peakHourRankText}>{index + 1}</Text>
          </View>
          <View style={styles.peakHourInfo}>
            <Text style={styles.peakHourTime}>{formatHour(peak.hour)}</Text>
            <Text style={styles.peakHourDesc}>
              {peak.completions} tasks completed
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};
