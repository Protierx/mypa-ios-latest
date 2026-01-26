import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MYPAOrb } from './MYPAOrb';

interface VoicePillProps {
  placeholder?: string;
  onVoiceClick?: () => void;
  isListening?: boolean;
}

export function VoicePill({
  placeholder = 'Say something to your day...',
  onVoiceClick,
}: VoicePillProps) {
  const [isRecording, setIsRecording] = useState(false);

  const handlePillClick = () => {
    setIsRecording(!isRecording);
    onVoiceClick?.();
  };

  if (isRecording) {
    return (
      <View style={styles.orbContainer}>
        <TouchableOpacity onPress={handlePillClick} activeOpacity={0.8}>
          <MYPAOrb size="md" showGlow={true} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePillClick} style={styles.pill} activeOpacity={0.9}>
        <Text style={styles.placeholder}>{placeholder}</Text>
        <View style={styles.iconContainer}>
          <Ionicons name="mic" size={16} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
  },
  orbContainer: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 112,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#8B5CF6',
    shadowColor: 'rgba(181, 140, 255, 0.35)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  placeholder: {
    flex: 1,
    fontSize: 17,
    color: 'rgba(255,255,255,0.7)',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
});
