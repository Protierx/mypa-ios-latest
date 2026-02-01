import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { styles } from '../styles';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  filterChip: 'all' | 'streak' | 'pending';
  onFilterChange: (filter: 'all' | 'streak' | 'pending') => void;
}

export function SearchFilter({
  searchQuery,
  onSearchChange,
  filterChip,
  onFilterChange,
}: SearchFilterProps) {
  const filters: { key: 'all' | 'streak' | 'pending'; label: string }[] = [
    { key: 'all', label: 'All Circles' },
    { key: 'streak', label: 'On Streak 🔥' },
    { key: 'pending', label: 'Need Posts' },
  ];

  return (
    <View style={styles.searchFilterRow}>
      <View style={styles.searchContainer}>
        <Search color="#94a3b8" size={18} style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search circles..."
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => onSearchChange('')} style={styles.clearButton}>
            <X color="#94a3b8" size={18} />
          </Pressable>
        )}
      </View>
      <View style={styles.filterChips}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => onFilterChange(f.key)}
            style={[
              styles.filterChip,
              filterChip === f.key && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                filterChip === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
