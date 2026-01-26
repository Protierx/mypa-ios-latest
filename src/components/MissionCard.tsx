import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MissionCardProps {
  title: string;
  status: 'pending' | 'completed' | 'at-risk';
  onComplete?: () => void;
}

export function MissionCard({ title, status, onComplete }: MissionCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={22} color="#10B981" />;
      case 'at-risk':
        return <Ionicons name="alert-circle" size={22} color="#F59E0B" />;
      default:
        return <Ionicons name="ellipse-outline" size={22} color="#94A3B8" />;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>{getStatusIcon()}</View>
        <Text
          style={[
            styles.title,
            status === 'completed' && styles.titleCompleted,
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {status === 'pending' && (
          <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
            <Ionicons name="checkmark" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 17,
    color: '#0F172A',
  },
  titleCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
