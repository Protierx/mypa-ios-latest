import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface HeaderProps {
  dots: string;
  onOpenSettings: () => void;
  onClose: () => void;
}

export function Header({ dots, onOpenSettings, onClose }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <View style={styles.activeIndicator}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Active</Text>
        </View>
        <Text style={styles.title}>I'm{'\n'}Listening{dots}</Text>
      </View>
      <View style={styles.headerButtons}>
        <TouchableOpacity 
          style={styles.headerBtn}
          onPress={onOpenSettings}
        >
          <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
