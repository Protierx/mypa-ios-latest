// Types for Inbox Screen

export interface Assignment {
  id: number | string;
  title: string;
  description?: string;
  assignedByName: string;
  assignedByAvatar?: string;
  assignedById?: string;  // Creator ID
  assigneeId?: string;    // Recipient ID
  circleName?: string;
  circleEmoji?: string;
  circleId?: string;
  dueTime?: string;
  dueDate?: string;
  dueDateFull?: string;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  category?: string;
  xpReward?: number;
  requireProof?: boolean;
  repeatEnabled?: boolean;
  repeatFrequency?: string;
  declineReason?: string;
  isEdited?: boolean;
  editedAt?: string;
  editedChanges?: string[];  // Array of what was changed
  createdAt?: string;
}

export type TabType = 'all' | 'messages' | 'reminders' | 'invites';

export interface NotificationItem {
  id: number | string;
  title: string;
  subtitle?: string;
  type: 'message' | 'reminder' | 'invite' | 'social';
  time: string;
  isNew?: boolean;
  circleName?: string;
  senderName?: string;
  _invitationId?: number | string;
}

export type Feedback = { id: number; message: string; type: 'success' | 'info' } | null;

export type DelayedActionBase = { id: number; delayMs: number };

export type DelayedAction =
  | (DelayedActionBase & { type: 'removeItem'; itemId: number | string })
  | (DelayedActionBase & { type: 'removeItemNavigate'; itemId: number | string; target: string })
  | (DelayedActionBase & { type: 'removeAssignment'; assignmentId: number | string })
  | (DelayedActionBase & { type: 'removeAssignmentNavigate'; assignmentId: number | string; target: string })
  | (DelayedActionBase & { type: 'clearSnooze'; itemId: number | string });

export type DelayedActionInput =
  | { type: 'removeItem'; itemId: number | string; delayMs: number }
  | { type: 'removeItemNavigate'; itemId: number | string; delayMs: number; target: string }
  | { type: 'removeAssignment'; assignmentId: number | string; delayMs: number }
  | { type: 'removeAssignmentNavigate'; assignmentId: number | string; delayMs: number; target: string }
  | { type: 'clearSnooze'; itemId: number | string; delayMs: number };

export interface EditMissionData {
  title: string;
  description: string;
  dueDate: Date | null;
  dueTime: Date | null;
  xpReward: number;
  repeatEnabled: boolean;
  repeatFrequency: string;
  requireProof: boolean;
}

export const STORAGE_KEYS = {
  pendingPlanTasks: 'pendingPlanTasks',
  highlightNewTask: 'highlightNewTask',
  pendingCircleAction: 'pendingCircleAction',
  pendingMessageAction: 'pendingMessageAction',
  lastCompletedReminder: 'lastCompletedReminder',
};

export const tabs: { id: TabType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'messages', label: 'Messages' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'invites', label: 'Invites' },
];
