/**
 * Notification Types & Deep-Link Map
 *
 * Central definitions for notification categories, types, and the
 * deep-link routing table used when a user taps a notification.
 */

// ── Categories (tabs) ──────────────────────────────────────────────

export type NotificationCategory = 'social' | 'tasks' | 'system';

export const NOTIFICATION_CATEGORIES = ['social', 'tasks', 'system'] as const;

// ── Notification type constants ────────────────────────────────────

export const NotificationType = {
  // Social
  CIRCLE_INVITE: 'circle_invite',
  CIRCLE_JOINED: 'circle_joined',
  CHALLENGE_CREATED: 'CHALLENGE_CREATED',
  CHALLENGE_ENDING_SOON: 'CHALLENGE_ENDING_SOON',
  CHALLENGE_CHECKIN_APPROVED: 'CHALLENGE_CHECKIN_APPROVED',

  // Tasks
  TASK_DUE_SOON: 'TASK_DUE_SOON',
  TASK_OVERDUE_SUMMARY: 'TASK_OVERDUE_SUMMARY',
  DAILY_PLANNING_REMINDER: 'DAILY_PLANNING_REMINDER',

  // System
  PERMISSION_REQUIRED_MIC: 'PERMISSION_REQUIRED_MIC',
  PERMISSION_REQUIRED_CALENDAR: 'PERMISSION_REQUIRED_CALENDAR',
  SYNC_FAILED: 'SYNC_FAILED',
} as const;

export type NotificationTypeKey = keyof typeof NotificationType;
export type NotificationTypeValue = typeof NotificationType[NotificationTypeKey];

// Map type → category
export const TYPE_TO_CATEGORY: Record<string, NotificationCategory> = {
  [NotificationType.CIRCLE_INVITE]: 'social',
  [NotificationType.CIRCLE_JOINED]: 'social',
  [NotificationType.CHALLENGE_CREATED]: 'social',
  [NotificationType.CHALLENGE_ENDING_SOON]: 'social',
  [NotificationType.CHALLENGE_CHECKIN_APPROVED]: 'social',

  [NotificationType.TASK_DUE_SOON]: 'tasks',
  [NotificationType.TASK_OVERDUE_SUMMARY]: 'tasks',
  [NotificationType.DAILY_PLANNING_REMINDER]: 'tasks',

  [NotificationType.PERMISSION_REQUIRED_MIC]: 'system',
  [NotificationType.PERMISSION_REQUIRED_CALENDAR]: 'system',
  [NotificationType.SYNC_FAILED]: 'system',
};

// ── Icon map ───────────────────────────────────────────────────────

export const NOTIFICATION_ICON_MAP: Record<string, { icon: string; color: string }> = {
  [NotificationType.CIRCLE_INVITE]: { icon: 'person-add-outline', color: '#B958FF' },
  [NotificationType.CIRCLE_JOINED]: { icon: 'people-outline', color: '#30D158' },
  [NotificationType.CHALLENGE_CREATED]: { icon: 'trophy-outline', color: '#FF9F0A' },
  [NotificationType.CHALLENGE_ENDING_SOON]: { icon: 'time-outline', color: '#FF453A' },
  [NotificationType.CHALLENGE_CHECKIN_APPROVED]: { icon: 'checkmark-circle-outline', color: '#30D158' },

  [NotificationType.TASK_DUE_SOON]: { icon: 'alarm-outline', color: '#FF9F0A' },
  [NotificationType.TASK_OVERDUE_SUMMARY]: { icon: 'alert-circle-outline', color: '#FF453A' },
  [NotificationType.DAILY_PLANNING_REMINDER]: { icon: 'calendar-outline', color: '#0A84FF' },

  [NotificationType.PERMISSION_REQUIRED_MIC]: { icon: 'mic-outline', color: '#6B6B7B' },
  [NotificationType.PERMISSION_REQUIRED_CALENDAR]: { icon: 'calendar-outline', color: '#6B6B7B' },
  [NotificationType.SYNC_FAILED]: { icon: 'cloud-offline-outline', color: '#FF453A' },

  // Fallback
  default: { icon: 'notifications-outline', color: '#B958FF' },
};

export function getNotificationIcon(type: string) {
  return NOTIFICATION_ICON_MAP[type] ?? NOTIFICATION_ICON_MAP.default;
}

// ── Deep-link routing ──────────────────────────────────────────────

export type DeepLinkTarget =
  | { screen: 'tasks'; modal?: 'taskDetail'; params?: { taskId: string } }
  | { screen: 'tasks'; modal?: 'overdueList' }
  | { screen: 'tasks'; modal?: 'todayPlanner' }
  | { screen: 'social'; modal?: 'challengeDetail'; params?: { challengeId: string } }
  | { screen: 'profile'; modal?: 'settings' }
  | { screen: 'profile'; modal?: 'settingsPermissions' }
  | { screen: 'profile'; modal?: 'syncHelp' }
  | null;

/**
 * Given a notification type and its `data` payload, return the
 * deep-link target screen + modal + params.
 */
export function resolveDeepLink(
  type: string,
  data: Record<string, any> | null | undefined
): DeepLinkTarget {
  switch (type) {
    // Social → circle invite / join
    case NotificationType.CIRCLE_INVITE:
    case NotificationType.CIRCLE_JOINED:
      return { screen: 'social' };

    // Social → challenge detail
    case NotificationType.CHALLENGE_CREATED:
    case NotificationType.CHALLENGE_ENDING_SOON:
    case NotificationType.CHALLENGE_CHECKIN_APPROVED:
      if (data?.challenge_id) {
        return { screen: 'social', modal: 'challengeDetail', params: { challengeId: data.challenge_id } };
      }
      return { screen: 'social' };

    // Tasks → task detail
    case NotificationType.TASK_DUE_SOON:
      if (data?.task_id) {
        return { screen: 'tasks', modal: 'taskDetail', params: { taskId: data.task_id } };
      }
      return { screen: 'tasks' };

    // Tasks → overdue list
    case NotificationType.TASK_OVERDUE_SUMMARY:
      return { screen: 'tasks', modal: 'overdueList' };

    // Tasks → today planner
    case NotificationType.DAILY_PLANNING_REMINDER:
      return { screen: 'tasks', modal: 'todayPlanner' };

    // System → settings / permissions
    case NotificationType.PERMISSION_REQUIRED_MIC:
    case NotificationType.PERMISSION_REQUIRED_CALENDAR:
      return { screen: 'profile', modal: 'settingsPermissions' };

    // System → sync help
    case NotificationType.SYNC_FAILED:
      return { screen: 'profile', modal: 'syncHelp' };

    default:
      return null;
  }
}

// ── Tab filter label map ───────────────────────────────────────────

export type NotificationTab = 'all' | 'social' | 'tasks' | 'system';

export const TAB_LABELS: Record<NotificationTab, string> = {
  all: 'All',
  social: 'Social',
  tasks: 'Tasks',
  system: 'System',
};

export const TAB_EMPTY_STATES: Record<NotificationTab, { icon: string; title: string; subtitle: string }> = {
  all: {
    icon: 'notifications-off-outline',
    title: "You're all caught up!",
    subtitle: 'No notifications to show',
  },
  social: {
    icon: 'people-outline',
    title: 'No social updates',
    subtitle: 'Challenge updates & circle activity will appear here',
  },
  tasks: {
    icon: 'checkmark-done-outline',
    title: 'No task alerts',
    subtitle: 'Due-date reminders & overdue alerts will appear here',
  },
  system: {
    icon: 'settings-outline',
    title: 'No system notices',
    subtitle: 'Permission requests & sync alerts will appear here',
  },
};
