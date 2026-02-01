import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface HeaderProps {
  onBack: () => void;
  onAdd: () => void;
}

export function Header({ onBack, onAdd }: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color="#475569" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Tasks</Text>
      <TouchableOpacity style={styles.addHeaderButton} onPress={onAdd}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
