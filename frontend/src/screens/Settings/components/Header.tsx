import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface HeaderProps {
  onBack: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Ionicons name="arrow-back" size={20} color="#475569" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Settings</Text>
    <View style={{ width: 40 }} />
  </View>
);
