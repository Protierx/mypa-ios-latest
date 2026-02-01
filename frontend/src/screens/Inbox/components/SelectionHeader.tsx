import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { selectionStyles } from '../styles';

interface SelectionHeaderProps {
  selectedCount: number;
  isDeleting: boolean;
  onCancel: () => void;
  onDelete: () => void;
}

export const SelectionHeader: React.FC<SelectionHeaderProps> = ({
  selectedCount,
  isDeleting,
  onCancel,
  onDelete,
}) => {
  return (
    <View style={selectionStyles.header}>
      <TouchableOpacity 
        style={selectionStyles.cancelButton}
        onPress={onCancel}
      >
        <Feather name="x" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={selectionStyles.headerText}>
        {selectedCount} selected
      </Text>
      <View style={selectionStyles.headerActions}>
        <TouchableOpacity 
          style={selectionStyles.deleteButton}
          onPress={onDelete}
          disabled={isDeleting || selectedCount === 0}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="trash-2" size={22} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
