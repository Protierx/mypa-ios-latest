export interface LevelScreenProps {
  navigation?: any;
}

export interface Tier {
  name: string;
  icon: string;
  color: string;
}

export interface TierDisplay {
  level: string;
  name: string;
  icon: string;
  color: string;
  current: boolean;
}

export interface RecentXPItem {
  action: string;
  xp: number;
  time: string;
  icon: string;
  color: string;
}

export interface LevelReward {
  level: number;
  reward: string;
  icon: string;
  color: string;
  unlocked: boolean;
  current?: boolean;
}

export interface LevelData {
  currentLevel: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  totalXPEarned: number;
  rank: string;
}
