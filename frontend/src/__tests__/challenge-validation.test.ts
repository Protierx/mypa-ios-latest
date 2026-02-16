/**
 * Challenge Validation Tests
 *
 * Tests the pure validation functions from types/challenge.ts
 * Run: npx jest frontend/src/__tests__/challenge-validation.test.ts
 */

import {
  validateChallengeForm,
  DEFAULT_TARGETS,
  TRACKING_METHODS,
  DURATION_OPTIONS,
} from '../types/challenge';

describe('validateChallengeForm', () => {
  const validForm = {
    title: 'Test Challenge',
    trackingMethod: 'tasks_completed' as const,
    targetValue: '20',
    durationDays: 7 as const,
  };

  // ── Success path ──

  it('passes with valid form data', () => {
    const { valid, errors } = validateChallengeForm(validForm);
    expect(valid).toBe(true);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('passes with minimum title length (3 chars)', () => {
    const { valid } = validateChallengeForm({ ...validForm, title: 'ABC' });
    expect(valid).toBe(true);
  });

  it('passes with maximum title length (60 chars)', () => {
    const { valid } = validateChallengeForm({ ...validForm, title: 'A'.repeat(60) });
    expect(valid).toBe(true);
  });

  it('passes with all tracking methods', () => {
    for (const method of TRACKING_METHODS) {
      const target = method.value === 'active_days' ? '7' : '20';
      const { valid } = validateChallengeForm({
        ...validForm,
        trackingMethod: method.value,
        targetValue: target,
      });
      expect(valid).toBe(true);
    }
  });

  it('passes with all valid durations', () => {
    for (const opt of DURATION_OPTIONS) {
      const { valid } = validateChallengeForm({ ...validForm, durationDays: opt.value });
      expect(valid).toBe(true);
    }
  });

  // ── Failure path: title ──

  it('fails with empty title', () => {
    const { valid, errors } = validateChallengeForm({ ...validForm, title: '' });
    expect(valid).toBe(false);
    expect(errors.title).toBeDefined();
  });

  it('fails with whitespace-only title', () => {
    const { valid, errors } = validateChallengeForm({ ...validForm, title: '   ' });
    expect(valid).toBe(false);
    expect(errors.title).toBeDefined();
  });

  it('fails with title too short (2 chars)', () => {
    const { valid, errors } = validateChallengeForm({ ...validForm, title: 'AB' });
    expect(valid).toBe(false);
    expect(errors.title).toContain('at least 3');
  });

  it('fails with title too long (61 chars)', () => {
    const { valid, errors } = validateChallengeForm({ ...validForm, title: 'A'.repeat(61) });
    expect(valid).toBe(false);
    expect(errors.title).toContain('60');
  });

  // ── Failure path: targetValue ──

  it('fails with empty target', () => {
    const { valid, errors } = validateChallengeForm({ ...validForm, targetValue: '' });
    expect(valid).toBe(false);
    expect(errors.targetValue).toBeDefined();
  });

  it('fails with zero target', () => {
    const { valid, errors } = validateChallengeForm({ ...validForm, targetValue: '0' });
    expect(valid).toBe(false);
    expect(errors.targetValue).toBeDefined();
  });

  it('fails with negative target', () => {
    const { valid, errors } = validateChallengeForm({ ...validForm, targetValue: '-5' });
    expect(valid).toBe(false);
    expect(errors.targetValue).toBeDefined();
  });

  it('fails with non-numeric target', () => {
    const { valid, errors } = validateChallengeForm({ ...validForm, targetValue: 'abc' });
    expect(valid).toBe(false);
    expect(errors.targetValue).toBeDefined();
  });

  // ── Failure path: active_days constraint ──

  it('fails when active_days target exceeds duration', () => {
    const { valid, errors } = validateChallengeForm({
      ...validForm,
      trackingMethod: 'active_days',
      targetValue: '10',
      durationDays: 7,
    });
    expect(valid).toBe(false);
    expect(errors.targetValue).toContain('7');
  });

  it('passes when active_days target equals duration', () => {
    const { valid } = validateChallengeForm({
      ...validForm,
      trackingMethod: 'active_days',
      targetValue: '7',
      durationDays: 7,
    });
    expect(valid).toBe(true);
  });

  it('passes when active_days target is less than duration', () => {
    const { valid } = validateChallengeForm({
      ...validForm,
      trackingMethod: 'active_days',
      targetValue: '5',
      durationDays: 7,
    });
    expect(valid).toBe(true);
  });

  // ── Failure path: null tracking method ──

  it('fails with null tracking method', () => {
    const { valid, errors } = validateChallengeForm({
      ...validForm,
      trackingMethod: null as any,
    });
    expect(valid).toBe(false);
    expect(errors.trackingMethod).toBeDefined();
  });

  // ── Double-submit prevention ──

  it('multiple calls to validate do not mutate state', () => {
    const form1 = { ...validForm };
    const result1 = validateChallengeForm(form1);
    const result2 = validateChallengeForm(form1);
    expect(result1.valid).toBe(result2.valid);
    expect(JSON.stringify(result1.errors)).toBe(JSON.stringify(result2.errors));
  });
});

describe('DEFAULT_TARGETS', () => {
  it('has defaults for all tracking methods', () => {
    expect(DEFAULT_TARGETS.tasks_completed).toBe(20);
    expect(DEFAULT_TARGETS.focus_minutes).toBe(300);
    expect(DEFAULT_TARGETS.active_days).toBe(7);
    expect(DEFAULT_TARGETS.proof_checkin).toBe(7);
  });

  it('all defaults are positive integers', () => {
    for (const [, value] of Object.entries(DEFAULT_TARGETS)) {
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe('TRACKING_METHODS metadata', () => {
  it('has exactly 4 tracking methods', () => {
    expect(TRACKING_METHODS).toHaveLength(4);
  });

  it('each method has required display metadata', () => {
    for (const method of TRACKING_METHODS) {
      expect(method.value).toBeDefined();
      expect(method.label).toBeDefined();
      expect(method.icon).toBeDefined();
      expect(method.description).toBeDefined();
      expect(method.targetLabel).toBeDefined();
      expect(method.targetUnit).toBeDefined();
    }
  });
});
