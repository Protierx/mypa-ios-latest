import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterType } from '../types';
import { styles } from '../styles';

interface FilterTabsProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function FilterTabs({ filter, onFilterChange }: FilterTabsProps) {
  const filters: FilterType[] = ['all', 'pending', 'completed'];
  
  return (
    <View style={styles.filterContainer}>
      {filters.map((f) => (
        <TouchableOpacity
          key={f}
          style={[styles.filterButton, filter === f && styles.filterButtonActive]}
          onPress={() => onFilterChange(f)}
        >
          {f === 'all' && <Ionicons name="list" size={14} color={filter === f ? '#FFFFFF' : '#64748B'} />}
          {f === 'pending' && <Ionicons name="time-outline" size={14} color={filter === f ? '#FFFFFF' : '#64748B'} />}
          {f === 'completed' && <Ionicons name="checkmark-done" size={14} color={filter === f ? '#FFFFFF' : '#64748B'} />}
          <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
