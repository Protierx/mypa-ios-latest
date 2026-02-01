import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../styles';
import { styles } from '../styles';

interface HeaderProps {
  onClose: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onClose }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <Ionicons name="close" size={28} color={colors.white} />
    </TouchableOpacity>
    <Text style={styles.title}>Proof of Completion</Text>
    <View style={{ width: 44 }} />
  </View>
);
