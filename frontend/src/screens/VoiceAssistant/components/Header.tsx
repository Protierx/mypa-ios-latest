import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AssistantState } from '../types';
import { getStatusText, getStatusColor } from '../utils';
import { styles } from '../styles';

interface HeaderProps {
  assistantState: AssistantState;
  onClose: () => void;
  onOpenSettings: () => void;
}

export function Header({ assistantState, onClose, onOpenSettings }: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="chevron-down" size={28} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>MYPA</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(assistantState) }]} />
          <Text style={styles.statusText}>{getStatusText(assistantState)}</Text>
        </View>
      </View>
      
      <TouchableOpacity onPress={onOpenSettings} style={styles.settingsButton}>
        <Ionicons name="settings-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
