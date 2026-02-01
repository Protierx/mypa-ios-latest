import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../styles';
import { styles } from '../styles';

interface HeaderProps {
  onBack: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={colors.white} />
    </TouchableOpacity>
    <Text style={styles.title}>Confirm Proof</Text>
    <View style={{ width: 40 }} />
  </View>
);
