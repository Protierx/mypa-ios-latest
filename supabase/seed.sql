-- =====================================================
-- MYPA Seed Data
-- Run after schema migrations: supabase db reset
-- Creates 2 test users, 10 tasks, 1 circle, 1 challenge
-- =====================================================

-- NOTE: These UUIDs must match auth.users entries.
-- When using `supabase db reset`, the auth schema is wiped,
-- so we insert into auth.users first, then profiles.

-- =====================================================
-- 1. Test Users (auth + profiles)
-- =====================================================

-- Password for both: "testpassword123"
-- bcrypt hash of "testpassword123"
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  role, aud, created_at, updated_at, confirmation_token
) VALUES
  (
    'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000000',
    'testuser1@mypa.dev',
    '$2a$10$PznpIIBOD4CguouiiQ3Bce/S.NLzYqN0lODqSrhS5rt0vkSwT5bWe',
    NOW(), 'authenticated', 'authenticated', NOW(), NOW(), ''
  ),
  (
    'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000000',
    'testuser2@mypa.dev',
    '$2a$10$PznpIIBOD4CguouiiQ3Bce/S.NLzYqN0lODqSrhS5rt0vkSwT5bWe',
    NOW(), 'authenticated', 'authenticated', NOW(), NOW(), ''
  )
ON CONFLICT (id) DO NOTHING;

-- Profiles
INSERT INTO public.profiles (id, username, display_name, xp, level, streak_current, streak_longest, onboarding_completed)
VALUES
  ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'alex_test', 'Alex Test', 250, 3, 5, 12, TRUE),
  ('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'jordan_test', 'Jordan Test', 80, 2, 2, 4, TRUE)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. Tasks (10 total — 7 for user1, 3 for user2)
-- =====================================================

INSERT INTO public.tasks (id, user_id, title, description, due_date, priority, status, estimated_duration) VALUES
  -- Alex's tasks (varied priorities and dates)
  (
    '11111111-0001-0001-0001-111111111111',
    'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
    'Buy groceries',
    'Milk, eggs, bread, chicken',
    (CURRENT_DATE + INTERVAL '0 days')::timestamptz,
    'medium', 'pending', 30
  ),
  (
    '11111111-0002-0002-0002-111111111111',
    'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
    'Finish project proposal',
    'Draft and send to client by EOD',
    (CURRENT_DATE + INTERVAL '0 days')::timestamptz,
    'high', 'pending', 90
  ),
  (
    '11111111-0003-0003-0003-111111111111',
    'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
    'Call dentist',
    'Schedule annual checkup',
    (CURRENT_DATE + INTERVAL '1 day')::timestamptz,
    'low', 'pending', 10
  ),
  (
    '11111111-0004-0004-0004-111111111111',
    'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
    'Review pull request',
    'Team PR #42 needs code review',
    (CURRENT_DATE + INTERVAL '0 days')::timestamptz,
    'high', 'pending', 45
  ),
  (
    '11111111-0005-0005-0005-111111111111',
    'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
    'Gym workout',
    'Leg day routine',
    (CURRENT_DATE + INTERVAL '1 day')::timestamptz,
    'medium', 'pending', 60
  ),
  (
    '11111111-0006-0006-0006-111111111111',
    'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
    'Read chapter 5',
    'Atomic Habits book club',
    (CURRENT_DATE + INTERVAL '2 days')::timestamptz,
    'low', 'pending', 40
  ),
  (
    '11111111-0007-0007-0007-111111111111',
    'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
    'Prepare presentation slides',
    'Team sync on Wednesday',
    (CURRENT_DATE + INTERVAL '3 days')::timestamptz,
    'urgent', 'pending', 120
  ),

  -- Jordan's tasks
  (
    '22222222-0001-0001-0001-222222222222',
    'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb',
    'Write blog post',
    'Draft about productivity tips',
    (CURRENT_DATE + INTERVAL '0 days')::timestamptz,
    'medium', 'pending', 60
  ),
  (
    '22222222-0002-0002-0002-222222222222',
    'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb',
    'Fix landing page bug',
    'Mobile nav menu not closing',
    (CURRENT_DATE + INTERVAL '0 days')::timestamptz,
    'high', 'pending', 30
  ),
  (
    '22222222-0003-0003-0003-222222222222',
    'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb',
    'Meal prep for the week',
    NULL,
    (CURRENT_DATE + INTERVAL '1 day')::timestamptz,
    'low', 'pending', 90
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. Circle (1 circle, both users as members)
-- =====================================================

INSERT INTO public.circles (id, name, emoji, description, owner_id, privacy, invite_code)
VALUES (
  'cccccccc-0001-0001-0001-cccccccccccc',
  'Productivity Squad',
  '🚀',
  'A circle for accountability and focus challenges',
  'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
  'invite-only',
  'squad2024'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.circle_members (circle_id, user_id, role) VALUES
  ('cccccccc-0001-0001-0001-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'owner'),
  ('cccccccc-0001-0001-0001-cccccccccccc', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'member')
ON CONFLICT (circle_id, user_id) DO NOTHING;

-- =====================================================
-- 4. Challenge (1 active, linked to circle)
-- =====================================================

INSERT INTO public.challenges (id, title, emoji, description, creator_id, circle_id, type, goal_value, duration_days, starts_at, ends_at, status)
VALUES (
  'dddddddd-0001-0001-0001-dddddddddddd',
  '7-Day Focus Marathon',
  '🔥',
  'Complete 300 minutes of focus sessions in 7 days',
  'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
  'cccccccc-0001-0001-0001-cccccccccccc',
  'focus_time',
  300,
  7,
  NOW(),
  NOW() + INTERVAL '7 days',
  'active'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.challenge_participants (challenge_id, user_id, progress) VALUES
  ('dddddddd-0001-0001-0001-dddddddddddd', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 45),
  ('dddddddd-0001-0001-0001-dddddddddddd', 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 20)
ON CONFLICT (challenge_id, user_id) DO NOTHING;

-- =====================================================
-- 5. Focus sessions (a few completed for history)
-- =====================================================

INSERT INTO public.focus_sessions (id, user_id, task_id, duration_planned, duration_actual, started_at, ended_at, xp_earned) VALUES
  (
    'eeeeeeee-0001-0001-0001-eeeeeeeeeeee',
    'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
    '11111111-0002-0002-0002-111111111111',
    25, 25,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 35 minutes',
    25
  ),
  (
    'eeeeeeee-0002-0002-0002-eeeeeeeeeeee',
    'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
    NULL,
    15, 12,
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '4 hours 48 minutes',
    15
  ),
  (
    'eeeeeeee-0003-0003-0003-eeeeeeeeeeee',
    'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb',
    '22222222-0002-0002-0002-222222222222',
    25, 20,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '2 hours 40 minutes',
    15
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. User models (baseline learning data)
-- =====================================================

INSERT INTO public.user_model (user_id, peak_hours, completion_patterns, task_preferences, overwhelm_threshold, voice_usage_rate, tone_preference, completion_rate_7d, overwhelm_score, unlock_level, focus_efficiency, preferred_focus_duration, active_days_count, calculated_at)
VALUES
  (
    'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa',
    '[9, 10, 14, 15]',
    '{"morning": 0.7, "afternoon": 0.5, "evening": 0.3}',
    '{"prefers_short": true, "avg_duration": 35}',
    8,
    0.4,
    'warm',
    0.65,
    3.5,
    2,
    0.8,
    25,
    14,
    NOW()
  ),
  (
    'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb',
    '[11, 13, 16]',
    '{"morning": 0.3, "afternoon": 0.6, "evening": 0.5}',
    '{"prefers_short": false, "avg_duration": 50}',
    6,
    0.2,
    'direct',
    0.45,
    5.0,
    1,
    0.6,
    30,
    7,
    NOW()
  )
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 7. Unlocks (Alex has a few features unlocked)
-- =====================================================

INSERT INTO public.unlocks (user_id, feature, unlocked_at, seen) VALUES
  ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'voice_commands', NOW() - INTERVAL '10 days', TRUE),
  ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'focus_timer', NOW() - INTERVAL '7 days', TRUE),
  ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'circles', NOW() - INTERVAL '3 days', TRUE),
  ('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', 'voice_commands', NOW() - INTERVAL '5 days', TRUE)
ON CONFLICT (user_id, feature) DO NOTHING;

-- =====================================================
-- Done! Two test users with realistic data for dev.
-- Login: testuser1@mypa.dev / testpassword123
-- Login: testuser2@mypa.dev / testpassword123
-- =====================================================
