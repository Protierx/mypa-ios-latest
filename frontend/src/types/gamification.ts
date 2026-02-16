/**
 * Gamification types — shared between frontend services
 * Matches the response shapes from gamification edge functions
 */

export interface ChallengeUpdate {
  challengeId: string;
  type: string;
  progressValue: number;
  target: number;
  completed: boolean;
}

export interface AnalyticsDelta {
  tasksCompleted?: number;
  onTimeInc?: number;
  lateInc?: number;
  overdueRecoveredInc?: number;
  xpGained?: number;
  focusMinutesInc?: number;
}

export interface TaskCompletedResponse {
  ok: boolean;
  xpDelta: number;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  leveledUp: boolean;
  streak: {
    current: number;
    longest: number;
  };
  challengeUpdates: ChallengeUpdate[];
  analyticsDelta: AnalyticsDelta;
}

export interface FocusCompletedResponse {
  ok: boolean;
  xpDelta: number;
  qualifies: boolean;
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  leveledUp: boolean;
  streak: {
    current: number;
    longest: number;
  };
  challengeUpdates: ChallengeUpdate[];
  analyticsDelta: AnalyticsDelta;
}

export interface CheckinResponse {
  ok: boolean;
  status: 'accepted' | 'pending';
  message?: string;
  xpDelta?: number;
  totalXp?: number;
  level?: number;
  xpIntoLevel?: number;
  xpForNextLevel?: number;
  leveledUp?: boolean;
  streak?: {
    current: number;
    longest: number;
  };
  challengeUpdate?: ChallengeUpdate;
}

export interface ApproveResponse {
  ok: boolean;
  status: 'accepted' | 'rejected';
  xpDelta?: number;
  challengeUpdate?: ChallengeUpdate;
}

export interface GamificationState {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  streak: {
    current: number;
    longest: number;
  };
  todayXp: number;
  dailyXpCap: number;
  /** Active challenge progress (loaded separately) */
  activeChallenges: ChallengeUpdate[];
}

export interface PendingEvent {
  eventId: string;
  taskId: string;
  createdAt: string;
  retryCount: number;
}
