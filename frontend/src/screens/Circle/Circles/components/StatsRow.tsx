import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Flame, CheckCircle, Bell } from 'lucide-react-native';
import { styles } from '../styles';

interface StatsRowProps {
  totalStreaks: number;
  activePercentage: number;
}

export function StatsRow({ totalStreaks, activePercentage }: StatsRowProps) {
  return (
    <View style={styles.statsContainer}>
      <BlurView intensity={40} tint="light" style={styles.statsBlur}>
        <View style={styles.statsContent}>
          <View style={styles.statsLeft}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#fff7ed' }]}>
                <Flame color="#ea580c" size={20} />
              </View>
              <View>
                <Text style={styles.statValue}>{totalStreaks}</Text>
                <Text style={styles.statLabel}>Total Streaks</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#ecfdf5' }]}>
                <CheckCircle color="#059669" size={20} />
              </View>
              <View>
                <Text style={styles.statValue}>{activePercentage}%</Text>
                <Text style={styles.statLabel}>Active Today</Text>
              </View>
            </View>
          </View>
          <Pressable style={styles.nudgeButton}>
            <Bell color="#b45309" size={16} />
            <Text style={styles.nudgeText}>Nudge</Text>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}
