/**
 * Challenge Types — Create Challenge feature
 *
 * Defines the tracking method enum, verification mode,
 * and API request/response shapes for challenge creation.
 */

// ── Tracking method enum ─────────────────────────────────────

export type TrackingMethod =
  | 'tasks_completed'
  | 'focus_minutes'
  | 'active_days'
  | 'proof_checkin';

export type VerificationMode = 'auto_accept' | 'creator_approval';

export type DurationDays = 7 | 14 | 30;

// ── Tracking method display metadata ─────────────────────────

export interface TrackingMethodOption {
  value: TrackingMethod;
  label: string;
  icon: string;
  description: string;
  targetLabel: string;
  targetUnit: string;
}

export const TRACKING_METHODS: TrackingMethodOption[] = [
  {
    value: 'tasks_completed',
    label: 'Tasks Completed',
    icon: 'checkbox-outline',
    description: 'Complete tasks to earn progress',
    targetLabel: 'Tasks to complete',
    targetUnit: 'tasks',
  },
  {
    value: 'focus_minutes',
    label: 'Focus Minutes',
    icon: 'timer-outline',
    description: 'Accumulate focused work time',
    targetLabel: 'Minutes to focus',
    targetUnit: 'minutes',
  },
  {
    value: 'active_days',
    label: 'Active Days',
    icon: 'calendar-outline',
    description: 'Be active for a number of days',
    targetLabel: 'Days to be active',
    targetUnit: 'days',
  },
  {
    value: 'proof_checkin',
    label: 'Proof Check-in',
    icon: 'camera-outline',
    description: 'Submit daily proof of progress',
    targetLabel: 'Check-ins to submit',
    targetUnit: 'check-ins',
  },
];

export const DURATION_OPTIONS: { value: DurationDays; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

// ── Default target values per tracking method ────────────────

export const DEFAULT_TARGETS: Record<TrackingMethod, number> = {
  tasks_completed: 20,
  focus_minutes: 300,
  active_days: 7,
  proof_checkin: 7,
};

// ── API request/response shapes ──────────────────────────────

export interface CreateChallengeRequest {
  circleId?: string;
  title: string;
  description?: string;
  trackingMethod: TrackingMethod;
  targetValue: number;
  durationDays: DurationDays;
  verificationMode?: VerificationMode;
  emoji?: string;
}

export interface CreateChallengeResponse {
  ok: boolean;
  challenge: {
    id: string;
    title: string;
    emoji: string;
    description: string | null;
    creator_id: string;
    circle_id: string | null;
    type: string;
    tracking_method: TrackingMethod;
    verification_mode: VerificationMode | null;
    goal_value: number;
    duration_days: number;
    starts_at: string;
    ends_at: string;
    status: string;
    created_at: string;
  };
  error?: string;
  details?: string[];
}

// ── Validation helpers ───────────────────────────────────────

export function validateChallengeForm(form: {
  title: string;
  trackingMethod: TrackingMethod | null;
  targetValue: string;
  durationDays: DurationDays;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const trimmed = form.title.trim();
  if (!trimmed) {
    errors.title = 'Title is required';
  } else if (trimmed.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (trimmed.length > 60) {
    errors.title = 'Title must be 60 characters or less';
  }

  if (!form.trackingMethod) {
    errors.trackingMethod = 'Select a tracking method';
  }

  const target = parseInt(form.targetValue, 10);
  if (!form.targetValue || isNaN(target) || target <= 0) {
    errors.targetValue = 'Enter a positive number';
  } else if (form.trackingMethod === 'active_days' && target > form.durationDays) {
    errors.targetValue = `Cannot exceed ${form.durationDays} days`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
