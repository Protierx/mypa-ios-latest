# CIRCLES CHALLENGE JOIN FLOW PLAN

## V1 Challenge Flow: Create → Notify → Preview → Join → Track

---

## V1 UX RULES (DO NOT VIOLATE)

- Keep existing tabs/screens as-is (no new tabs).
- Challenges are created in a Circle and must appear in:
  1. Circle Feed (circle_posts)
  2. Circle Challenges tab
- All circle members receive an IN-APP notification in Hub → Socials tab.
- Users can join from:
  - Circle → Challenges tab (tap challenge → preview modal → Join)
  - Socials notification (tap → opens circle → preview modal → Join)
- Do NOT show challenges in "Active Challenges" until AFTER user joins.
- Circle daily check-in is separate from challenge progress.

---

## FRONTEND IMPLEMENTATION

### 1) Challenge Preview Modal (shared)

- Shows: title, emoji, circle name, description/rules, dates, participant count
- CTA:
  - Not joined → "Join Challenge" (inserts `challenge_participants` row)
  - Joined → "View Challenge"
- Join updates UI + Active Challenges immediately
- Friendly errors only (no raw DB strings)

### 2) Notifications on Challenge Creation

- Server-side: `create-challenge` edge function fans out notifications to all circle members (excluding creator)
- Each notification includes `challenge_id`, `circle_id`, challenge title, circle name
- Category: `circle_challenge`
- Type: `challenge_created`

### 3) Socials Tab Notification Tap Routing

- Tap notification → mark as read (`read_at = NOW()`) → navigate to Circle detail with params:
  - `circleId`
  - `openChallengeId`
- Circle screen auto-opens Challenge Preview Modal when `openChallengeId` is present, then clears the param

### 4) Active Challenges Area

- Query: `challenge_participants` WHERE `user_id = auth.uid()` JOIN `challenges` WHERE `status = 'active'`
- Must NEVER display unjoined challenges
- Empty state when no joined active challenges

---

## BACKEND IMPLEMENTATION (SUPABASE)

### EXISTING SCHEMA (already in production — DO NOT recreate)

These tables already exist from prior migrations and are fully operational:

#### `challenges` table (migration 001 + 024)
```sql
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  emoji TEXT DEFAULT '🏆',
  description TEXT,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  circle_id UUID REFERENCES public.circles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('focus_time', 'tasks_completed', 'daily_checkin', 'custom')),
  goal_value INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  tracking_method TEXT NOT NULL DEFAULT 'auto' CHECK (tracking_method IN ('auto', 'manual')),
  verification_mode TEXT NOT NULL DEFAULT 'auto_accept' CHECK (verification_mode IN ('auto_accept', 'creator_approval')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `challenge_participants` table (migration 001)
```sql
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (challenge_id, user_id)
);
```

#### `challenge_progress` table (migration 023)
```sql
CREATE TABLE IF NOT EXISTS public.challenge_progress (
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  progress_value INTEGER NOT NULL DEFAULT 0,
  last_counted_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (challenge_id, user_id)
);
```

#### `challenge_checkins` table (migration 024)
```sql
CREATE TABLE IF NOT EXISTS public.challenge_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  note TEXT,
  proof_url TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `notifications` table (migration 001 + 028)
```sql
-- Effective schema after all migrations:
-- id          UUID PK
-- user_id     UUID FK profiles NOT NULL
-- type        TEXT NOT NULL
-- title       TEXT NOT NULL
-- body        TEXT
-- data        JSONB DEFAULT '{}'
-- read        BOOLEAN DEFAULT FALSE (legacy)
-- category    TEXT DEFAULT 'system'
-- read_at     TIMESTAMPTZ DEFAULT NULL
-- deleted_at  TIMESTAMPTZ DEFAULT NULL
-- created_at  TIMESTAMPTZ DEFAULT NOW()
```

#### `circle_posts` table (migration 022)
```sql
CREATE TABLE IF NOT EXISTS public.circle_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'checkin', 'checkout',
    'challenge_created', 'challenge_completed',
    'milestone', 'achievement', 'member_joined'
  )),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Existing helper functions
```sql
-- is_circle_member(_circle_id UUID, _user_id UUID) → BOOLEAN
-- is_challenge_participant(_challenge_id UUID, _user_id UUID) → BOOLEAN
-- is_challenge_creator(_challenge_id UUID, _user_id UUID) → BOOLEAN
```

---

### 1) NEW MIGRATION: 037_challenge_notification_fanout.sql

This migration adds the server-side RPC for atomic challenge creation with notification fanout. All referenced tables already exist — this adds only the RPC function and a supporting index.

```sql
-- ════════════════════════════════════════════════════════════════
-- Migration 037 — Challenge Notification Fanout
-- Purpose: Server-side RPC for challenge create + notify all members
-- ════════════════════════════════════════════════════════════════

-- ── Supporting index for notification queries ──
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_created
  ON public.notifications (user_id, type, created_at DESC)
  WHERE deleted_at IS NULL;

-- ── Index for fast participant lookup by user ──
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user
  ON public.challenge_participants (user_id);

-- ── Index for joined+active challenge queries ──
CREATE INDEX IF NOT EXISTS idx_challenges_status_ends
  ON public.challenges (status, ends_at)
  WHERE status = 'active';

-- ════════════════════════════════════════════════════════════════
-- RPC: create_challenge_with_notifications
--
-- Atomically:
--   1. Inserts the challenge row
--   2. Auto-joins the creator as participant
--   3. Initializes challenge_progress for creator
--   4. Creates circle_posts feed entry
--   5. Fans out notifications to all circle members (excluding creator)
--
-- Runs as SECURITY DEFINER to bypass RLS for notification inserts.
-- Caller must be authenticated (checked via auth.uid()).
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.create_challenge_with_notifications(
  p_circle_id        UUID,
  p_title            TEXT,
  p_description      TEXT DEFAULT NULL,
  p_emoji            TEXT DEFAULT '🏆',
  p_type             TEXT DEFAULT 'daily_checkin',
  p_tracking_method  TEXT DEFAULT 'auto',
  p_verification_mode TEXT DEFAULT 'auto_accept',
  p_goal_value       INTEGER DEFAULT 1,
  p_duration_days    INTEGER DEFAULT 7,
  p_request_id       UUID DEFAULT NULL  -- idempotency key
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id       UUID := auth.uid();
  v_challenge_id  UUID;
  v_start_at      TIMESTAMPTZ := NOW();
  v_end_at        TIMESTAMPTZ;
  v_circle_name   TEXT;
  v_member        RECORD;
  v_notify_count  INTEGER := 0;
  v_existing_id   UUID;
BEGIN
  -- ── Auth check ──
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- ── Circle membership check ──
  IF NOT public.is_circle_member(p_circle_id, v_user_id) THEN
    RAISE EXCEPTION 'Not a member of this circle';
  END IF;

  -- ── Idempotency: if request_id provided, check for existing challenge ──
  IF p_request_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.challenges
    WHERE creator_id = v_user_id
      AND circle_id = p_circle_id
      AND title = p_title
      AND created_at > NOW() - INTERVAL '5 minutes';

    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'ok', true,
        'challenge_id', v_existing_id,
        'deduplicated', true
      );
    END IF;
  END IF;

  -- ── Get circle name for notifications ──
  SELECT name INTO v_circle_name
  FROM public.circles
  WHERE id = p_circle_id;

  IF v_circle_name IS NULL THEN
    RAISE EXCEPTION 'Circle not found';
  END IF;

  -- ── Compute end date ──
  v_end_at := v_start_at + (p_duration_days || ' days')::INTERVAL;

  -- ── 1. Insert challenge ──
  INSERT INTO public.challenges (
    title, emoji, description, creator_id, circle_id,
    type, tracking_method, verification_mode,
    goal_value, duration_days, starts_at, ends_at, status
  ) VALUES (
    p_title, p_emoji, p_description, v_user_id, p_circle_id,
    p_type, p_tracking_method, p_verification_mode,
    p_goal_value, p_duration_days, v_start_at, v_end_at, 'active'
  )
  RETURNING id INTO v_challenge_id;

  -- ── 2. Auto-join creator as participant ──
  INSERT INTO public.challenge_participants (challenge_id, user_id, progress)
  VALUES (v_challenge_id, v_user_id, 0)
  ON CONFLICT (challenge_id, user_id) DO NOTHING;

  -- ── 3. Initialize challenge_progress for creator ──
  INSERT INTO public.challenge_progress (challenge_id, user_id, progress_value, updated_at)
  VALUES (v_challenge_id, v_user_id, 0, NOW())
  ON CONFLICT (challenge_id, user_id) DO NOTHING;

  -- ── 4. Post to circle feed ──
  INSERT INTO public.circle_posts (circle_id, user_id, type, payload)
  VALUES (
    p_circle_id,
    v_user_id,
    'challenge_created',
    jsonb_build_object(
      'challenge_id', v_challenge_id,
      'title', p_title,
      'emoji', p_emoji,
      'tracking_method', p_tracking_method,
      'target_value', p_goal_value,
      'duration_days', p_duration_days
    )
  );

  -- ── 5. Fan out notifications to all circle members (exclude creator) ──
  FOR v_member IN
    SELECT cm.user_id
    FROM public.circle_members cm
    WHERE cm.circle_id = p_circle_id
      AND cm.user_id != v_user_id
  LOOP
    INSERT INTO public.notifications (
      user_id, type, title, body, data, category, read, read_at, deleted_at
    ) VALUES (
      v_member.user_id,
      'challenge_created',
      '🏆 New Challenge in ' || v_circle_name,
      p_title,
      jsonb_build_object(
        'challenge_id', v_challenge_id,
        'circle_id', p_circle_id,
        'circle_name', v_circle_name,
        'challenge_title', p_title,
        'emoji', p_emoji
      ),
      'circle_challenge',
      false,
      NULL,
      NULL
    );
    v_notify_count := v_notify_count + 1;
  END LOOP;

  -- ── Return result ──
  RETURN jsonb_build_object(
    'ok', true,
    'challenge_id', v_challenge_id,
    'notifications_sent', v_notify_count,
    'deduplicated', false
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_challenge_with_notifications TO authenticated;
```

---

### 2) EXISTING RLS POLICIES (already applied — DO NOT duplicate)

These are the active RLS policies from prior migrations. Listed here for reference only.

#### Challenges RLS (migration 012)
```sql
-- SELECT: creator, participant, or circle member can read
CREATE POLICY "challenges_select" ON public.challenges
  FOR SELECT USING (
    creator_id = auth.uid()
    OR public.is_challenge_participant(id, auth.uid())
    OR (circle_id IS NOT NULL AND public.is_circle_member(circle_id, auth.uid()))
  );

-- INSERT: only the creator
CREATE POLICY "challenges_insert" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- UPDATE: only the creator
CREATE POLICY "challenges_update" ON public.challenges
  FOR UPDATE USING (auth.uid() = creator_id);

-- DELETE: only the creator
CREATE POLICY "challenges_delete" ON public.challenges
  FOR DELETE USING (auth.uid() = creator_id);
```

#### Challenge Participants RLS (migration 012)
```sql
-- SELECT: own rows, fellow participants, or challenge creator
CREATE POLICY "challenge_participants_select" ON public.challenge_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_challenge_participant(challenge_id, auth.uid())
    OR public.is_challenge_creator(challenge_id, auth.uid())
  );

-- INSERT: only for yourself (join)
CREATE POLICY "challenge_participants_insert" ON public.challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: only your own row
CREATE POLICY "challenge_participants_update" ON public.challenge_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: only your own row (leave)
CREATE POLICY "challenge_participants_delete" ON public.challenge_participants
  FOR DELETE USING (auth.uid() = user_id);
```

#### Notifications RLS (migration 028)
```sql
-- SELECT: own notifications, excluding soft-deleted
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

-- UPDATE: own notifications (mark read, etc.)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- INSERT: service role / SECURITY DEFINER functions can insert
CREATE POLICY "Service can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);
```

#### Circle Posts RLS (migration 022)
```sql
-- SELECT: circle members only
CREATE POLICY "Circle members can view posts" ON public.circle_posts
  FOR SELECT USING (public.is_circle_member(circle_id, auth.uid()));

-- INSERT: circle members, own posts only
CREATE POLICY "Users can insert own posts" ON public.circle_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.is_circle_member(circle_id, auth.uid())
  );
```

---

### 3) EDGE FUNCTION UPDATE: `create-challenge/index.ts`

The existing `create-challenge` edge function already handles:
- ✅ Auth
- ✅ Validation
- ✅ Challenge insert
- ✅ Auto-join creator
- ✅ Initialize challenge_progress
- ✅ Post to circle feed

**What to ADD** — notification fanout after the feed post:

```typescript
// ---------- Notify circle members (exclude creator) ----------
if (circleId) {
  // Get circle name
  const { data: circle } = await supabase
    .from('circles')
    .select('name')
    .eq('id', circleId)
    .single();

  const circleName = circle?.name || 'your circle';

  // Get all members except creator
  const { data: members } = await supabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', circleId)
    .neq('user_id', userId);

  if (members && members.length > 0) {
    const notifications = members.map((m) => ({
      user_id: m.user_id,
      type: 'challenge_created',
      title: `🏆 New Challenge in ${circleName}`,
      body: trimmedTitle,
      data: {
        challenge_id: challenge.id,
        circle_id: circleId,
        circle_name: circleName,
        challenge_title: trimmedTitle,
        emoji: emoji || '🏆',
      },
      category: 'circle_challenge',
      read: false,
    }));

    // Use service role client for notification inserts
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error: notifyError } = await serviceClient
      .from('notifications')
      .insert(notifications);

    if (notifyError) {
      console.error('Notification fanout error:', notifyError);
      // Non-fatal: challenge is still created successfully
    }
  }
}
```

**Alternative path (Postgres RPC):** If using the RPC from migration 037 instead of the edge function, the frontend would call:

```typescript
const { data, error } = await supabase.rpc('create_challenge_with_notifications', {
  p_circle_id: circleId,
  p_title: title,
  p_description: description,
  p_emoji: emoji,
  p_type: legacyType,
  p_tracking_method: trackingMethod,
  p_verification_mode: verificationMode,
  p_goal_value: targetValue,
  p_duration_days: durationDays,
  p_request_id: requestId, // optional UUID for idempotency
});
```

**Recommended approach:** Update the edge function (option in section 3 above). It's already deployed and handles validation. The RPC is provided as a fallback/alternative for maximum reliability.

---

### 4) NOTIFICATION DATA SHAPE

Every challenge notification inserted has this shape:

| Field | Value | Purpose |
|-------|-------|---------|
| `user_id` | member's UUID | recipient |
| `type` | `'challenge_created'` | filter/routing |
| `title` | `'🏆 New Challenge in {circleName}'` | display |
| `body` | challenge title | display |
| `data` | `{ challenge_id, circle_id, circle_name, challenge_title, emoji }` | tap routing |
| `category` | `'circle_challenge'` | grouping in Socials tab |
| `read` | `false` | unread state |
| `read_at` | `NULL` | v2 unread tracking |
| `deleted_at` | `NULL` | soft delete |

---

### 5) FRONTEND QUERIES

#### Fetch active joined challenges for current user
```typescript
const { data } = await supabase
  .from('challenge_participants')
  .select(`
    challenge_id,
    progress,
    joined_at,
    challenges (
      id, title, emoji, description, circle_id, type,
      tracking_method, goal_value, duration_days,
      starts_at, ends_at, status, creator_id,
      circles ( id, name, emoji )
    )
  `)
  .eq('user_id', userId)
  .eq('challenges.status', 'active');
```

#### Fetch challenge participant count
```typescript
const { count } = await supabase
  .from('challenge_participants')
  .select('*', { count: 'exact', head: true })
  .eq('challenge_id', challengeId);
```

#### Check if current user has joined a challenge
```typescript
const { data } = await supabase
  .from('challenge_participants')
  .select('challenge_id')
  .eq('challenge_id', challengeId)
  .eq('user_id', userId)
  .maybeSingle();

const hasJoined = !!data;
```

#### Join a challenge (insert participant)
```typescript
const { error } = await supabase
  .from('challenge_participants')
  .insert({
    challenge_id: challengeId,
    user_id: userId,
    progress: 0,
  });
```

#### Fetch circle challenge notifications
```typescript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('category', 'circle_challenge')
  .is('deleted_at', null)
  .order('created_at', { ascending: false });
```

#### Mark notification as read
```typescript
const { error } = await supabase
  .from('notifications')
  .update({ read_at: new Date().toISOString(), read: true })
  .eq('id', notificationId)
  .eq('user_id', userId);
```

---

### 6) REQUEST / RESPONSE SHAPES

#### Edge Function: `POST /create-challenge`

**Request body:**
```json
{
  "circleId": "uuid",
  "title": "Read 30 mins daily",
  "description": "Read for at least 30 minutes every day",
  "trackingMethod": "active_days",
  "targetValue": 7,
  "durationDays": 7,
  "verificationMode": "auto_accept",
  "emoji": "📚"
}
```

**Success response (201):**
```json
{
  "ok": true,
  "challenge": {
    "id": "uuid",
    "title": "Read 30 mins daily",
    "circle_id": "uuid",
    "status": "active",
    "starts_at": "2026-02-20T...",
    "ends_at": "2026-02-27T...",
    "...": "..."
  }
}
```

**Validation error (400):**
```json
{
  "error": "Validation failed",
  "details": ["title must be at least 3 characters"]
}
```

#### RPC: `create_challenge_with_notifications`

**Call:**
```sql
SELECT public.create_challenge_with_notifications(
  p_circle_id := 'uuid',
  p_title := 'Read 30 mins daily',
  p_description := 'Read for at least 30 minutes every day',
  p_emoji := '📚',
  p_type := 'daily_checkin',
  p_tracking_method := 'active_days',
  p_verification_mode := 'auto_accept',
  p_goal_value := 7,
  p_duration_days := 7,
  p_request_id := 'uuid'  -- optional
);
```

**Success response:**
```json
{
  "ok": true,
  "challenge_id": "uuid",
  "notifications_sent": 3,
  "deduplicated": false
}
```

**Idempotent duplicate:**
```json
{
  "ok": true,
  "challenge_id": "uuid (existing)",
  "deduplicated": true
}
```

---

### 7) IDEMPOTENCY STRATEGY

| Layer | Strategy |
|-------|----------|
| Edge Function | Client sends optional `requestId` (UUID). Server checks for duplicate challenge by same creator + circle + title within 5-minute window. |
| RPC | `p_request_id` parameter. Same dedup logic in PL/pgSQL. |
| Join Challenge | `challenge_participants` has PK `(challenge_id, user_id)`. `INSERT ... ON CONFLICT DO NOTHING` prevents duplicate joins. |
| Notifications | Notification insert is fire-and-forget. Duplicates are cosmetically harmless (user sees 2 notifications at worst). For strict dedup, add a unique index on `(user_id, type, data->>'challenge_id')` — not required for V1. |

---

### 8) FAILURE HANDLING

| Failure | Behavior | User Impact |
|---------|----------|-------------|
| Challenge insert fails | RPC raises exception, entire transaction rolls back. Edge function returns 500. | User sees "Something went wrong, please try again." |
| Participant insert fails | RPC: rolled back (atomic). Edge function: challenge exists but creator not joined — logged, non-fatal. | Minimal — creator can manually join. |
| Feed post fails | Non-fatal in edge function. In RPC: rolled back (atomic). | Challenge exists but no feed entry. |
| Notification fanout fails | Non-fatal in both paths. Error logged. | Members won't get notification but can still see challenge in circle. |
| Join challenge fails (RLS) | Supabase returns permission error. | Frontend shows "Unable to join. Are you a member of this circle?" |
| Join duplicate | `ON CONFLICT DO NOTHING` — silent success. | No error shown. |

---

## BACKEND TEST CHECKLIST

### Two-Account Permission Tests

| # | Test | User | Expected | Table |
|---|------|------|----------|-------|
| 1 | Create challenge in circle | Admin/Owner (User A) | ✅ Success + notifications sent to User B | challenges, notifications |
| 2 | Create challenge in circle | Member (User B) | ✅ Success (any member can create) OR ❌ if restricted to admin | challenges |
| 3 | Read challenge details | Circle member (User B) | ✅ Visible via RLS | challenges |
| 4 | Read challenge details | Non-member (User C) | ❌ Empty result (RLS blocks) | challenges |
| 5 | Join challenge | Circle member (User B) | ✅ Participant row created | challenge_participants |
| 6 | Join challenge | Non-circle-member (User C) | ❌ RLS blocks insert (not a circle member) | challenge_participants |
| 7 | Join challenge twice | User B | ✅ Silent no-op (PK constraint) | challenge_participants |
| 8 | Read own notifications | User B | ✅ Sees challenge_created notification | notifications |
| 9 | Read other's notifications | User A reads User B's | ❌ Empty (RLS: user_id = auth.uid()) | notifications |
| 10 | Mark notification read | User B | ✅ read_at set | notifications |
| 11 | Mark other's notification read | User A tries User B's | ❌ No rows updated (RLS) | notifications |
| 12 | Non-member access circle feed | User C | ❌ Empty (RLS) | circle_posts |
| 13 | Active challenges query | User B (joined) | ✅ Returns challenge | challenge_participants + challenges |
| 14 | Active challenges query | User B (not joined) | ✅ Empty — challenge not shown | challenge_participants |

### Notification Integrity Tests

| # | Test | Expected |
|---|------|----------|
| 15 | Creator does NOT receive self-notification | ✅ Excluded from fanout loop |
| 16 | All other circle members receive notification | ✅ Count matches (members - 1) |
| 17 | Notification data contains challenge_id + circle_id | ✅ Present in data JSONB |
| 18 | Notification category = 'circle_challenge' | ✅ Correct category |
| 19 | Tapping notification with data.circle_id + data.challenge_id routes correctly | ✅ Frontend routing test |

### Edge Cases

| # | Test | Expected |
|---|------|----------|
| 20 | Create challenge in circle with 1 member (creator only) | ✅ No notifications sent, count = 0 |
| 21 | Create challenge with same title twice quickly (idempotency) | ✅ Second call returns existing ID |
| 22 | Delete circle → challenges cascade | ✅ Challenges deleted (ON DELETE SET NULL on circle_id — verify behavior) |
| 23 | User leaves circle after joining challenge | Challenge remains in their active list (participant row persists) |

---

## FILE-BY-FILE CHANGE PLAN

### Backend (Supabase)

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/037_challenge_notification_fanout.sql` | CREATE | RPC function + indexes |
| `supabase/functions/create-challenge/index.ts` | MODIFY | Add notification fanout after feed post |

### Frontend (React Native)

| File | Action | Description |
|------|--------|-------------|
| `src/components/challenges/ChallengePreviewModal.tsx` | CREATE | Shared preview/join modal |
| `src/screens-v2/SocialView/SocialViewScreen.tsx` | MODIFY | Handle challenge notification tap → route to circle with openChallengeId |
| `src/screens-v2/CircleDetail/CircleDetailScreen.tsx` | MODIFY | Accept openChallengeId param, auto-open preview modal |
| `src/screens-v2/CircleDetail/ChallengesTab.tsx` | MODIFY | Tap challenge → open ChallengePreviewModal |
| `src/hooks/useActiveChallenges.ts` | CREATE or MODIFY | Query joined+active challenges only |
| `src/hooks/useChallengeJoin.ts` | CREATE | Join challenge + optimistic UI update |

---

## MANUAL QA CHECKLIST

1. **User A (admin)** creates a challenge "Read Daily" in Circle "Book Club"
2. Verify challenge appears in Circle → Feed tab as `challenge_created` post
3. Verify challenge appears in Circle → Challenges tab
4. **User B (member)** opens app → Hub → Socials tab
5. Verify User B sees notification: "🏆 New Challenge in Book Club" / "Read Daily"
6. User B taps notification → navigates to Book Club circle → Challenge Preview Modal auto-opens
7. Verify modal shows: title, emoji, circle name, description, participant count (1), "Join Challenge" button
8. User B taps "Join Challenge" → verify participant count updates to 2, CTA changes to "View Challenge"
9. Verify challenge now appears in User B's Active Challenges area
10. **User A** does NOT receive a self-notification
11. **User C (non-member)** cannot see the challenge or the notification
12. User B taps the same challenge again → modal shows "View Challenge" (not join again)
13. Close and reopen — state persists

---

## KNOWN LIMITATIONS (V1)

1. **No push notifications** — V1 is in-app only. Push can be added later via Supabase webhooks or a cron.
2. **No real-time subscription** — notifications are fetched on screen focus, not streamed. Can add Supabase Realtime later.
3. **Creator can always create** — V1 does not restrict challenge creation to admin/owner only. Any circle member can create. Restriction can be added via RLS if needed.
4. **Notification dedup is soft** — no unique constraint on notifications. Worst case: a user sees a duplicate notification if the edge function retries. Cosmetically harmless.
5. **Challenge cascade on circle delete** — `circle_id` has `ON DELETE SET NULL`, so challenges become orphaned rather than deleted. This is intentional for solo challenges but may need revisiting for circle-only challenges.
