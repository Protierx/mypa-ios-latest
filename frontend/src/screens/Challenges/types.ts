// Navigation types
export interface ChallengesScreenProps {
  navigation: any;
  route?: any;
}

// API Challenge type
export interface APIChallenge {
  id: string;
  title: string;
  description?: string;
  emoji: string;
  type: 'FOCUS_MINUTES' | 'TASKS_COMPLETED' | 'STREAK_DAYS' | 'CUSTOM';
  targetValue: number;
  startsAt: string;
  endsAt: string;
  xpReward: number;
  isActive: boolean;
  circleId?: string;
  circle?: { id: string; name: string; emoji: string };
  isJoined?: boolean;
  myProgress?: number;
  myRank?: number;
  isCompleted?: boolean;
  participantCount?: number;
  participants?: ChallengeParticipant[];
}

export interface ChallengeParticipant {
  rank: number;
  user: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    level: number;
  };
  progress: number;
  percentComplete: number;
  isCompleted: boolean;
}

// Local display type
export interface Challenge {
  id: string;
  name: string;
  iconName: string;
  iconColor: string;
  daysLeft: number;
  totalDays: number;
  members: ChallengeMember[];
  todayPrompt: string;
  progress: { completed: number; total: number };
  myStatus: 'pending' | 'completed' | 'missed';
  myStreak: number;
  category: ChallengeCategory;
  xpReward: number;
  stakes?: string;
  apiData?: APIChallenge;
}

export interface ChallengeMember {
  id?: string;
  name: string;
  initial: string;
  color: string;
  streak: number;
  rank: number;
}

export type ChallengeCategory = 'fitness' | 'wellness' | 'learning' | 'productivity' | 'social';

export interface AvailableChallenge {
  id: string;
  title: string;
  emoji: string;
  type: string;
  targetValue: number;
  xpReward: number;
  participantCount: number;
  daysLeft?: number;
  creatorName?: string;
}

export interface Achievement {
  id: string;
  name: string;
  iconName: string;
  color: string;
  description: string;
  unlocked: boolean;
  xp: number;
  progress?: number;
  total?: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  initial: string;
  xp: number;
  streak: number;
  wins: number;
  isYou: boolean;
  movement: 'up' | 'down' | 'same';
}

export interface UserStats {
  totalXP: number;
  currentStreak: number;
  rank: number;
  totalMembers: number;
  level: number;
  nextLevelXP: number;
  challengesWon: number;
}

export interface UserCircle {
  id: string;
  name: string;
  emoji: string;
}

export type TabType = 'active' | 'leaderboard' | 'achievements';
export type TimeframeType = 'week' | 'month' | 'all';
