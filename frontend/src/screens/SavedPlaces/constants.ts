import { colors } from '../../styles';
import { SavedPlace } from './types';

export const SAVED_PLACES: SavedPlace[] = [
  { id: '1', name: 'Home', address: '123 Main Street, City', icon: 'home', color: colors.primary },
  { id: '2', name: 'Work', address: '456 Business Ave, Downtown', icon: 'briefcase', color: colors.work },
  { id: '3', name: 'Gym', address: '789 Fitness Blvd, Uptown', icon: 'barbell', color: colors.fitness },
  { id: '4', name: 'Coffee Shop', address: '321 Brew Lane, Midtown', icon: 'cafe', color: colors.creative },
  { id: '5', name: 'Park', address: 'Central Park, North End', icon: 'leaf', color: colors.health },
];
