import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

export const ResponseTime: React.FC = () => {
  return (
    <View style={styles.responseTime}>
      <Ionicons name="time" size={20} color="#10B981" />
      <View>
        <Text style={styles.responseTimeTitle}>Typical response time</Text>
        <Text style={styles.responseTimeValue}>Under 24 hours</Text>
      </View>
    </View>
  );
};
