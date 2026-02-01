import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles';
import { styles } from '../styles';

export const SearchBar: React.FC = () => (
  <View style={styles.searchContainer}>
    <Ionicons name="search" size={20} color={colors.mutedForeground} />
    <Text style={styles.searchPlaceholder}>Search places...</Text>
  </View>
);
