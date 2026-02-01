import { LucideIcon } from 'lucide-react-native';

export interface ProfileScreenProps {
  navigation?: any;
}

export interface Achievement {
  id: number;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  progress?: number;
}

export interface SettingsItem {
  id: string;
  label: string;
  icon: LucideIcon;
  colors: [string, string];
}

export interface StatConfig {
  key: string;
  value: number | string;
  label: string;
  icon: LucideIcon;
  color: string;
  screen: string;
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  timeSaved: string;
  challengesWon: number;
  circlesJoined: number;
}
