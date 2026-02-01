import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Period } from '../types';
import { PERIODS, PERIOD_LABELS } from '../constants';
import { styles } from '../styles';

interface PeriodSelectorProps {
  selectedPeriod: Period;
  onSelect: (period: Period) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onSelect,
}) => {
  return (
    <View style={styles.periodSelector}>
      {PERIODS.map(period => (
        <Pressable
          key={period}
          onPress={() => onSelect(period)}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}
          >
            {PERIOD_LABELS[period]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};
