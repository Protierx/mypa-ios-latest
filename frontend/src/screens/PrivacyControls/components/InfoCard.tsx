import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

export const InfoCard: React.FC = () => (
  <View style={styles.infoCard}>
    <Text style={styles.infoTitle}>🔒 Your data, your choice</Text>
    <Text style={styles.infoText}>
      Control what you share with your circles. You can set different privacy
      levels for each activity and adjust at any time.
    </Text>
  </View>
);
