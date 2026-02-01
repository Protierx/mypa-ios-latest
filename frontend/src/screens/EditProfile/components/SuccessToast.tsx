import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface SuccessToastProps {
  visible: boolean;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.successToast}>
      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
      <Text style={styles.successToastText}>Profile Updated!</Text>
    </View>
  );
};
