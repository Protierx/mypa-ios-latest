import React from 'react';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface IconRendererProps {
  name: string;
  size: number;
  color: string;
}

export function renderIcon(name: string, size: number, color: string) {
  switch (name) {
    case 'dumbbell':
      return <MaterialCommunityIcons name="dumbbell" size={size} color={color} />;
    case 'book-open':
      return <Feather name="book-open" size={size} color={color} />;
    case 'cellphone-off':
      return <MaterialCommunityIcons name="cellphone-off" size={size} color={color} />;
    case 'water':
      return <Ionicons name="water" size={size} color={color} />;
    case 'target':
      return <MaterialCommunityIcons name="target" size={size} color={color} />;
    case 'fire':
      return <MaterialCommunityIcons name="fire" size={size} color={color} />;
    case 'crown':
      return <MaterialCommunityIcons name="crown" size={size} color={color} />;
    case 'heart':
      return <Ionicons name="heart" size={size} color={color} />;
    case 'trophy':
      return <Ionicons name="trophy" size={size} color={color} />;
    case 'medal':
      return <MaterialCommunityIcons name="medal" size={size} color={color} />;
    default:
      return <Ionicons name="help-circle" size={size} color={color} />;
  }
}
