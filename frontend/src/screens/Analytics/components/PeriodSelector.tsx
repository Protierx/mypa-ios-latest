import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PeriodType } from '../types';
import { styles } from '../styles';

interface PeriodSelectorProps {
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

const PERIODS: { key: PeriodType; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  return (
    <View style={styles.periodSelector}>
      {PERIODS.map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodOption,
            selectedPeriod === period.key && styles.periodOptionActive,
          ]}
          onPress={() => onPeriodChange(period.key)}
        >
          <Text
            style={[
              styles.periodText,
              selectedPeriod === period.key && styles.periodTextActive,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
