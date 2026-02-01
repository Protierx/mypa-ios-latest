import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';
import { styles } from '../styles';

interface HeaderProps {
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBack }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Analytics</Text>
      <View style={styles.backButton} />
    </View>
  );
};
