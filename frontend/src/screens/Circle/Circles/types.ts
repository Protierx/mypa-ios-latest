import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Navigation types
export interface CirclesScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

// Data types
export interface CircleMember {
  id: string;
  initial: string;
  posted: boolean;
}

export interface Circle {
  id: string;
  name: string;
  members: CircleMember[];
  challenge?: string;
  streak: number;
  inviteCode: string;
  isNew?: boolean;
}

// State types
export interface CirclesState {
  circles: Circle[];
  loading: boolean;
  searchQuery: string;
  filterChip: 'all' | 'streak' | 'pending';
  expandedCard: string | null;
  longPressedCard: Circle | null;
  createOpen: boolean;
  joinModalOpen: boolean;
  newName: string;
  newMembers: string;
  newPrivacy: 'public' | 'private';
  joinCode: string;
  joinError: string;
  joinSuccess: boolean;
  toastVisible: boolean;
  toastMessage: string;
  toastType: 'success' | 'info';
}

// Animation types
export interface CardAnimation {
  scale: any;
  opacity: any;
}
