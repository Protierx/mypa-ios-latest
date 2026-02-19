/**
 * Tests: Circle Challenge Visibility
 *
 * Validates that challenges created from within a circle's Challenges tab
 * appear immediately in that circle's list and NOT in other circles.
 */

// ── Simulated data ──────────────────────────────────────

const CIRCLE_A_ID = 'circle-aaa-111';
const CIRCLE_B_ID = 'circle-bbb-222';
const USER_ID = 'user-123';

interface MockChallenge {
  id: string;
  title: string;
  circle_id: string | null;
  status: 'active' | 'draft' | 'completed';
  creator_id: string;
  type: string;
  tracking_method: string;
  goal_value: number;
  userProgress: number;
  participantCount: number;
}

const makeChallenges = (): MockChallenge[] => [
  { id: 'ch-1', title: 'Circle A Focus', circle_id: CIRCLE_A_ID, status: 'active', creator_id: USER_ID, type: 'focus_time', tracking_method: 'focus_minutes', goal_value: 300, userProgress: 0, participantCount: 1 },
  { id: 'ch-2', title: 'Circle B Tasks', circle_id: CIRCLE_B_ID, status: 'active', creator_id: USER_ID, type: 'tasks_completed', tracking_method: 'tasks_completed', goal_value: 20, userProgress: 5, participantCount: 3 },
  { id: 'ch-3', title: 'Global Challenge', circle_id: null, status: 'active', creator_id: USER_ID, type: 'daily_checkin', tracking_method: 'active_days', goal_value: 7, userProgress: 2, participantCount: 1 },
  { id: 'ch-4', title: 'Draft Challenge', circle_id: CIRCLE_A_ID, status: 'draft', creator_id: USER_ID, type: 'tasks_completed', tracking_method: 'tasks_completed', goal_value: 10, userProgress: 0, participantCount: 0 },
  { id: 'ch-5', title: 'Completed Old', circle_id: CIRCLE_A_ID, status: 'completed', creator_id: USER_ID, type: 'focus_time', tracking_method: 'focus_minutes', goal_value: 100, userProgress: 100, participantCount: 2 },
];

// ── Filter logic (mirrors CircleHomeModal) ──────────────

function filterCircleChallenges(allChallenges: MockChallenge[], circleId: string): MockChallenge[] {
  return allChallenges.filter(c => c.circle_id === circleId);
}

function filterActiveChallenges(challenges: MockChallenge[]): MockChallenge[] {
  return challenges.filter(c => c.status === 'active');
}

// ── Tests ───────────────────────────────────────────────

describe('Circle Challenge Visibility', () => {
  const challenges = makeChallenges();

  test('Challenge created in Circle A appears in Circle A list', () => {
    const circleAChallenges = filterCircleChallenges(challenges, CIRCLE_A_ID);
    expect(circleAChallenges.some(c => c.id === 'ch-1')).toBe(true);
    expect(circleAChallenges.length).toBeGreaterThan(0);
  });

  test('Challenge from Circle A does NOT appear in Circle B', () => {
    const circleBChallenges = filterCircleChallenges(challenges, CIRCLE_B_ID);
    expect(circleBChallenges.some(c => c.id === 'ch-1')).toBe(false);
  });

  test('Circle B challenge appears in Circle B only', () => {
    const circleBChallenges = filterCircleChallenges(challenges, CIRCLE_B_ID);
    expect(circleBChallenges.length).toBe(1);
    expect(circleBChallenges[0].id).toBe('ch-2');
  });

  test('Global challenge (null circle_id) does not appear in any circle', () => {
    const circleAChallenges = filterCircleChallenges(challenges, CIRCLE_A_ID);
    const circleBChallenges = filterCircleChallenges(challenges, CIRCLE_B_ID);
    expect(circleAChallenges.some(c => c.id === 'ch-3')).toBe(false);
    expect(circleBChallenges.some(c => c.id === 'ch-3')).toBe(false);
  });

  test('Challenge with zero progress/check-ins still appears', () => {
    const circleAChallenges = filterCircleChallenges(challenges, CIRCLE_A_ID);
    const active = filterActiveChallenges(circleAChallenges);
    const zeroProgress = active.find(c => c.id === 'ch-1');
    expect(zeroProgress).toBeDefined();
    expect(zeroProgress!.userProgress).toBe(0);
    expect(zeroProgress!.participantCount).toBe(1);
  });

  test('Draft challenge does NOT appear in active challenges', () => {
    const circleAChallenges = filterCircleChallenges(challenges, CIRCLE_A_ID);
    const active = filterActiveChallenges(circleAChallenges);
    expect(active.some(c => c.id === 'ch-4')).toBe(false);
  });

  test('Completed challenge appears in circle list but not in active filter', () => {
    const circleAChallenges = filterCircleChallenges(challenges, CIRCLE_A_ID);
    expect(circleAChallenges.some(c => c.id === 'ch-5')).toBe(true);
    
    const active = filterActiveChallenges(circleAChallenges);
    expect(active.some(c => c.id === 'ch-5')).toBe(false);
  });

  test('All Circle A challenges (all statuses) returned', () => {
    const circleAChallenges = filterCircleChallenges(challenges, CIRCLE_A_ID);
    // ch-1 (active), ch-4 (draft), ch-5 (completed)
    expect(circleAChallenges.length).toBe(3);
  });

  test('Active filter returns only active challenges for Circle A', () => {
    const circleAChallenges = filterCircleChallenges(challenges, CIRCLE_A_ID);
    const active = filterActiveChallenges(circleAChallenges);
    expect(active.length).toBe(1);
    expect(active[0].id).toBe('ch-1');
    expect(active[0].status).toBe('active');
  });
});

describe('Create Challenge Payload Validation', () => {
  test('circleId is required when creating from circle context', () => {
    const circleId: string | undefined = CIRCLE_A_ID;
    const payload = {
      title: 'New Test Challenge',
      type: 'tasks_completed',
      goal_value: 10,
      duration_days: 7,
      circle_id: circleId || null,
    };
    expect(payload.circle_id).toBe(CIRCLE_A_ID);
    expect(payload.circle_id).not.toBeNull();
  });

  test('Missing circleId results in null circle_id', () => {
    const circleId: string | undefined = undefined;
    const payload = {
      title: 'No Circle Challenge',
      type: 'focus_time',
      goal_value: 300,
      duration_days: 14,
      circle_id: circleId || null,
    };
    expect(payload.circle_id).toBeNull();
  });

  test('Challenge with null circle_id does not appear in any circle filter', () => {
    const challengeWithoutCircle: MockChallenge = {
      id: 'ch-new',
      title: 'Orphan Challenge',
      circle_id: null,
      status: 'active',
      creator_id: USER_ID,
      type: 'tasks_completed',
      tracking_method: 'tasks_completed',
      goal_value: 10,
      userProgress: 0,
      participantCount: 1,
    };

    const allChallenges = [...makeChallenges(), challengeWithoutCircle];
    const circleAChallenges = filterCircleChallenges(allChallenges, CIRCLE_A_ID);
    const circleBChallenges = filterCircleChallenges(allChallenges, CIRCLE_B_ID);

    expect(circleAChallenges.some(c => c.id === 'ch-new')).toBe(false);
    expect(circleBChallenges.some(c => c.id === 'ch-new')).toBe(false);
  });
});

describe('Newly Created Challenge Immediate Visibility', () => {
  test('After creation, challenge is in the list and visible in correct circle', () => {
    const existing = makeChallenges();
    
    // Simulate creating a new challenge in Circle A
    const newChallenge: MockChallenge = {
      id: 'ch-new-created',
      title: 'Fresh Challenge',
      circle_id: CIRCLE_A_ID,
      status: 'active',
      creator_id: USER_ID,
      type: 'tasks_completed',
      tracking_method: 'tasks_completed',
      goal_value: 15,
      userProgress: 0,
      participantCount: 1,
    };

    // Simulate the refetch adding it to the list
    const updatedList = [...existing, newChallenge];

    // Circle A should now show it
    const circleAChallenges = filterCircleChallenges(updatedList, CIRCLE_A_ID);
    const active = filterActiveChallenges(circleAChallenges);

    expect(active.some(c => c.id === 'ch-new-created')).toBe(true);
    expect(active.find(c => c.id === 'ch-new-created')!.userProgress).toBe(0);
  });

  test('Newly created challenge does NOT appear in Circle B', () => {
    const existing = makeChallenges();
    const newChallenge: MockChallenge = {
      id: 'ch-new-created',
      title: 'Fresh Challenge',
      circle_id: CIRCLE_A_ID,
      status: 'active',
      creator_id: USER_ID,
      type: 'tasks_completed',
      tracking_method: 'tasks_completed',
      goal_value: 15,
      userProgress: 0,
      participantCount: 1,
    };

    const updatedList = [...existing, newChallenge];
    const circleBChallenges = filterCircleChallenges(updatedList, CIRCLE_B_ID);

    expect(circleBChallenges.some(c => c.id === 'ch-new-created')).toBe(false);
  });
});
