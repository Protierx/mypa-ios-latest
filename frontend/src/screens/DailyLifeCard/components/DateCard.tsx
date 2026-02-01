import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

export const DateCard: React.FC = () => (
  <View style={styles.dateCard}>
    <Text style={styles.dateLabel}>Today</Text>
    <Text style={styles.dateValue}>
      {new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })}
    </Text>
  </View>
);
