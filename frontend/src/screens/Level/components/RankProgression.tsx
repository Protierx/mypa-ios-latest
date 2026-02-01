import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TierDisplay } from '../types';
import { styles } from '../styles';

interface RankProgressionProps {
  tiers: TierDisplay[];
}

export const RankProgression: React.FC<RankProgressionProps> = ({ tiers }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="trending-up" size={20} color="#8B5CF6" />
        <Text style={styles.sectionTitle}>Rank Progression</Text>
      </View>
      {tiers.map((tier, i) => (
        <View
          key={i}
          style={[
            styles.tierItem,
            tier.current && styles.tierItemCurrent,
            i < 2 && styles.tierItemCompleted,
            i > 2 && { opacity: 0.6 },
          ]}
        >
          <View
            style={[
              styles.tierIcon,
              tier.current && { backgroundColor: tier.color },
            ]}
          >
            <MaterialCommunityIcons
              name={tier.icon as any}
              size={20}
              color={tier.current ? '#FFFFFF' : tier.color}
            />
          </View>
          <View style={styles.tierContent}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>{tier.name}</Text>
              {tier.current && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>YOU</Text>
                </View>
              )}
              {i < 2 && <Ionicons name="checkmark" size={16} color="#10B981" />}
            </View>
            <Text style={styles.tierLevel}>Level {tier.level}</Text>
          </View>
          {i > 2 && (
            <Ionicons name="lock-closed" size={16} color="#CBD5E1" />
          )}
        </View>
      ))}
    </View>
  );
};
