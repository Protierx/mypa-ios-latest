import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../styles';
import { Assignment } from '../types';

interface MissionsCardProps {
  assignments: Assignment[];
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

export const MissionsCard: React.FC<MissionsCardProps> = ({
  assignments,
  fadeAnim,
  scaleAnim,
}) => {
  const navigation = useNavigation();

  if (assignments.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons name="paper-plane" size={20} color="#AF52DE" />
        <Text style={[styles.sectionTitle, { color: '#AF52DE' }]}>
          Incoming Missions
        </Text>
        <View style={styles.missionBadge}>
          <Text style={styles.missionBadgeText}>{assignments.length}</Text>
        </View>
      </View>
      <View style={styles.missionsCard}>
        {assignments.map((assignment, index) => (
          <TouchableOpacity
            key={assignment.id}
            style={[
              styles.missionItem,
              index < assignments.length - 1 && styles.missionItemBorder,
            ]}
            onPress={() => navigation.navigate('Inbox' as never)}
          >
            <View style={styles.missionEmoji}>
              <Text style={{ fontSize: 24 }}>{assignment.circleEmoji || '📋'}</Text>
            </View>
            <View style={styles.missionContent}>
              <Text style={styles.missionTitle} numberOfLines={1}>
                {assignment.title}
              </Text>
              <Text style={styles.missionMeta}>
                From {assignment.assignedByName || 'Someone'}
                {assignment.circleName && ` • ${assignment.circleName}`}
              </Text>
            </View>
            <View style={styles.missionXp}>
              <Ionicons name="flash" size={14} color="#FF9500" />
              <Text style={styles.missionXpText}>{assignment.xpReward || 50}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.viewMissionsButton}
          onPress={() => navigation.navigate('Inbox' as never)}
        >
          <Text style={styles.viewMissionsText}>View all missions</Text>
          <Ionicons name="chevron-forward" size={16} color="#AF52DE" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};
