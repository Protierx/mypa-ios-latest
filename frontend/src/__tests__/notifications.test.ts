/**
 * Notification Types & Deep-Link Tests
 *
 * Validates the notification type → category mapping, icon resolution,
 * deep-link routing, and empty-state definitions.
 */
import {
  NotificationType,
  TYPE_TO_CATEGORY,
  NOTIFICATION_ICON_MAP,
  getNotificationIcon,
  resolveDeepLink,
  TAB_EMPTY_STATES,
  TAB_LABELS,
  NOTIFICATION_CATEGORIES,
} from '../types/notifications';

// ── Category Mapping ────────────────────────────────────────────────

describe('TYPE_TO_CATEGORY', () => {
  it('maps all social types to "social"', () => {
    expect(TYPE_TO_CATEGORY[NotificationType.CHALLENGE_CREATED]).toBe('social');
    expect(TYPE_TO_CATEGORY[NotificationType.CHALLENGE_ENDING_SOON]).toBe('social');
    expect(TYPE_TO_CATEGORY[NotificationType.CHALLENGE_CHECKIN_APPROVED]).toBe('social');
  });

  it('maps all task types to "tasks"', () => {
    expect(TYPE_TO_CATEGORY[NotificationType.TASK_DUE_SOON]).toBe('tasks');
    expect(TYPE_TO_CATEGORY[NotificationType.TASK_OVERDUE_SUMMARY]).toBe('tasks');
    expect(TYPE_TO_CATEGORY[NotificationType.DAILY_PLANNING_REMINDER]).toBe('tasks');
  });

  it('maps all system types to "system"', () => {
    expect(TYPE_TO_CATEGORY[NotificationType.PERMISSION_REQUIRED_MIC]).toBe('system');
    expect(TYPE_TO_CATEGORY[NotificationType.PERMISSION_REQUIRED_CALENDAR]).toBe('system');
    expect(TYPE_TO_CATEGORY[NotificationType.SYNC_FAILED]).toBe('system');
  });

  it('covers all NotificationType values', () => {
    const allTypes = Object.values(NotificationType);
    for (const t of allTypes) {
      expect(TYPE_TO_CATEGORY[t]).toBeDefined();
      expect(NOTIFICATION_CATEGORIES).toContain(TYPE_TO_CATEGORY[t]);
    }
  });
});

// ── Icon Map ────────────────────────────────────────────────────────

describe('getNotificationIcon', () => {
  it('returns correct icon for known types', () => {
    const icon = getNotificationIcon(NotificationType.CHALLENGE_CREATED);
    expect(icon.icon).toBe('trophy-outline');
    expect(icon.color).toBeTruthy();
  });

  it('returns default icon for unknown types', () => {
    const icon = getNotificationIcon('TOTALLY_UNKNOWN_TYPE');
    expect(icon.icon).toBe('notifications-outline');
  });

  it('has an entry for every NotificationType', () => {
    for (const t of Object.values(NotificationType)) {
      const icon = NOTIFICATION_ICON_MAP[t];
      expect(icon).toBeDefined();
      expect(icon.icon).toBeTruthy();
      expect(icon.color).toBeTruthy();
    }
  });
});

// ── Deep-Link Routing ───────────────────────────────────────────────

describe('resolveDeepLink', () => {
  // Social
  it('CHALLENGE_CREATED → social + challengeDetail when challenge_id present', () => {
    const target = resolveDeepLink(NotificationType.CHALLENGE_CREATED, { challenge_id: 'abc-123' });
    expect(target).toEqual({
      screen: 'social',
      modal: 'challengeDetail',
      params: { challengeId: 'abc-123' },
    });
  });

  it('CHALLENGE_CREATED → social without modal when no challenge_id', () => {
    const target = resolveDeepLink(NotificationType.CHALLENGE_CREATED, {});
    expect(target).toEqual({ screen: 'social' });
  });

  it('CHALLENGE_ENDING_SOON → social + challengeDetail', () => {
    const target = resolveDeepLink(NotificationType.CHALLENGE_ENDING_SOON, { challenge_id: 'x' });
    expect(target?.screen).toBe('social');
    expect(target?.modal).toBe('challengeDetail');
  });

  it('CHALLENGE_CHECKIN_APPROVED → social + challengeDetail', () => {
    const target = resolveDeepLink(NotificationType.CHALLENGE_CHECKIN_APPROVED, { challenge_id: 'y' });
    expect(target?.screen).toBe('social');
  });

  // Tasks
  it('TASK_DUE_SOON → tasks + taskDetail when task_id present', () => {
    const target = resolveDeepLink(NotificationType.TASK_DUE_SOON, { task_id: 'task-1' });
    expect(target).toEqual({
      screen: 'tasks',
      modal: 'taskDetail',
      params: { taskId: 'task-1' },
    });
  });

  it('TASK_DUE_SOON → tasks without modal when no task_id', () => {
    const target = resolveDeepLink(NotificationType.TASK_DUE_SOON, null);
    expect(target).toEqual({ screen: 'tasks' });
  });

  it('TASK_OVERDUE_SUMMARY → tasks + overdueList', () => {
    const target = resolveDeepLink(NotificationType.TASK_OVERDUE_SUMMARY, {});
    expect(target).toEqual({ screen: 'tasks', modal: 'overdueList' });
  });

  it('DAILY_PLANNING_REMINDER → tasks + todayPlanner', () => {
    const target = resolveDeepLink(NotificationType.DAILY_PLANNING_REMINDER, {});
    expect(target).toEqual({ screen: 'tasks', modal: 'todayPlanner' });
  });

  // System
  it('PERMISSION_REQUIRED_MIC → profile + settingsPermissions', () => {
    const target = resolveDeepLink(NotificationType.PERMISSION_REQUIRED_MIC, {});
    expect(target).toEqual({ screen: 'profile', modal: 'settingsPermissions' });
  });

  it('PERMISSION_REQUIRED_CALENDAR → profile + settingsPermissions', () => {
    const target = resolveDeepLink(NotificationType.PERMISSION_REQUIRED_CALENDAR, {});
    expect(target).toEqual({ screen: 'profile', modal: 'settingsPermissions' });
  });

  it('SYNC_FAILED → profile + syncHelp', () => {
    const target = resolveDeepLink(NotificationType.SYNC_FAILED, {});
    expect(target).toEqual({ screen: 'profile', modal: 'syncHelp' });
  });

  // Unknown
  it('unknown type returns null', () => {
    const target = resolveDeepLink('MYSTERY_TYPE', {});
    expect(target).toBeNull();
  });
});

// ── Tab Config ──────────────────────────────────────────────────────

describe('Tab configuration', () => {
  it('TAB_LABELS covers all tabs', () => {
    expect(TAB_LABELS.all).toBe('All');
    expect(TAB_LABELS.social).toBe('Social');
    expect(TAB_LABELS.tasks).toBe('Tasks');
    expect(TAB_LABELS.system).toBe('System');
  });

  it('TAB_EMPTY_STATES has icon + title + subtitle for each tab', () => {
    for (const tab of ['all', 'social', 'tasks', 'system'] as const) {
      const state = TAB_EMPTY_STATES[tab];
      expect(state.icon).toBeTruthy();
      expect(state.title).toBeTruthy();
      expect(state.subtitle).toBeTruthy();
    }
  });
});
