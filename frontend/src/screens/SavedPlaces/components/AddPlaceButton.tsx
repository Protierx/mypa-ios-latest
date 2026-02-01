import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles';
import { styles } from '../styles';

interface AddPlaceButtonProps {
  onPress?: () => void;
}

export const AddPlaceButton: React.FC<AddPlaceButtonProps> = ({ onPress }) => (
  <TouchableOpacity style={styles.addPlaceButton} onPress={onPress}>
    <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
    <Text style={styles.addPlaceText}>Add New Place</Text>
  </TouchableOpacity>
);
