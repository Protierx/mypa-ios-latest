import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface HeaderProps {
  onBack?: () => void;
  onBreathe: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBack, onBreathe }) => {
  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Safe space</Text>
        </View>
      </View>

      <View style={styles.titleCard}>
        <View style={styles.titleCardContent}>
          <View>
            <Text style={styles.titleLabel}>RESET MODE</Text>
            <Text style={styles.titleText}>No rush. Just be.</Text>
          </View>
          <TouchableOpacity style={styles.breatheButton} onPress={onBreathe}>
            <Ionicons name="moon" size={20} color="#A78BFA" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};
