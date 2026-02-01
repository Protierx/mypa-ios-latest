import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles';
import { SavedPlace } from '../types';
import { styles } from '../styles';

interface PlaceCardProps {
  place: SavedPlace;
  onPress?: () => void;
  onMore?: () => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, onPress, onMore }) => (
  <TouchableOpacity style={styles.placeCard} onPress={onPress}>
    <View style={[styles.placeIcon, { backgroundColor: `${place.color}20` }]}>
      <Ionicons name={place.icon as any} size={22} color={place.color} />
    </View>
    <View style={styles.placeInfo}>
      <Text style={styles.placeName}>{place.name}</Text>
      <Text style={styles.placeAddress}>{place.address}</Text>
    </View>
    <TouchableOpacity style={styles.moreButton} onPress={onMore}>
      <Ionicons name="ellipsis-vertical" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  </TouchableOpacity>
);
