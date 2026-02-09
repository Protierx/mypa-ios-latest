# MYPA Claude Opus Task Prompts
## Implementation Prompt Pack for Cursor AI

---

## How to Use These Prompts

Each prompt is designed for a single implementation session. Copy the prompt into Cursor's AI chat. Each prompt forces:
- File-by-file edits (not bulk rewrites)
- Tests or verification steps
- Rollback plan
- Acceptance checklist

**Before using any prompt:** Ensure you have the latest code pulled and the relevant planning docs context.

---

## Prompt 1: RLS Hardening Migration

```
CONTEXT:
I'm building MYPA, a voice-first productivity app. The Supabase database has Row Level Security policies that are too permissive (migration 005 uses SELECT USING (true) on most tables).

TASK:
Create a new Supabase migration file at supabase/migrations/009_strict_rls.sql that:

1. Drops ALL existing RLS policies on these tables: profiles, tasks, focus_sessions, event_log (or user_events), user_model (or user_models), circles, circle_members, challenges, challenge_participants, posts, reactions, notifications, unlocks, invitations.

2. Recreates strict policies:
   - profiles: SELECT own row only. UPDATE own row only. Public fields (display_name, avatar_url) readable by authenticated users via a separate policy.
   - tasks: ALL operations restricted to auth.uid() = user_id
   - focus_sessions: ALL operations restricted to auth.uid() = user_id
   - event_log: SELECT own rows. INSERT with check auth.uid() = user_id. No UPDATE/DELETE from client.
   - user_model: SELECT own row. No client INSERT/UPDATE (server-only via service role).
   - circles: SELECT if user is a member (EXISTS subquery on circle_members). INSERT by any authenticated user. UPDATE/DELETE by owner only.
   - circle_members: SELECT same circle members. INSERT own membership. DELETE own membership.
   - challenges: SELECT if in circle. INSERT/UPDATE if circle admin.
   - challenge_participants: SELECT own or same challenge. INSERT own.
   - posts: SELECT if in same circle. INSERT own.
   - reactions: SELECT if in same circle. INSERT own. DELETE own.
   - notifications: SELECT own. UPDATE own (mark read). DELETE own.
   - unlocks: SELECT own. INSERT own. UPDATE own.

3. IMPORTANT: Avoid infinite recursion. circle_members policies must NOT reference circle_members in their own SELECT policy. Use auth.uid() directly where possible.

OUTPUT: Single SQL file. Include comments explaining each policy. Include a test section at the bottom (commented out) with queries that should return 0 rows for cross-user access.

ROLLBACK: If this breaks, revert to migration 005 behavior by re-applying 005.

ACCEPTANCE:
- [ ] Migration runs without error on supabase db reset
- [ ] User A cannot SELECT User B's tasks (test with direct query)
- [ ] User A in Circle X can see Circle X data
- [ ] User A NOT in Circle Y cannot see Circle Y data
- [ ] No infinite recursion errors on any query
```

---

## Prompt 2: Event Log Schema Migration

```
CONTEXT:
MYPA's event_log table (currently named user_events) has a basic schema. The PRD requires a richer schema for AI learning, quality metrics, and usage counting.

TASK:
Create supabase/migrations/007_event_log_schema.sql that:

1. Renames user_events to event_log (if different)
2. Ensures these columns exist (add if missing):
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
   - event_type TEXT NOT NULL (voice_command, task_action, focus_action, navigation, social_action, upsell)
   - action TEXT NOT NULL (create_task, complete_task, etc.)
   - screen_context TEXT
   - intent_raw TEXT (original voice utterance)
   - params JSONB
   - success BOOLEAN NOT NULL DEFAULT true
   - error_code TEXT
   - latency_ms INTEGER
   - ai_model_used TEXT
   - confidence REAL
   - user_override BOOLEAN DEFAULT false
   - tokens_used INTEGER
   - created_at TIMESTAMPTZ NOT NULL DEFAULT now()

3. Creates indexes: (user_id, created_at), (user_id, event_type, created_at)
4. Enables RLS: SELECT own rows only, INSERT with check auth.uid() = user_id

Also create supabase/migrations/008_user_model_schema.sql that:
1. Renames user_models to user_model (if different)
2. Ensures all PRD columns: peak_hours JSONB, avg_task_durations JSONB, completion_rate_7d REAL, completion_rate_30d REAL, overwhelm_score REAL, preferred_categories JSONB, voice_usage_rate REAL, avg_daily_tasks REAL, common_reschedule_patterns JSONB, tone_preference TEXT DEFAULT 'friendly', unlock_level INTEGER DEFAULT 1, days_active INTEGER DEFAULT 0, last_calculated_at TIMESTAMPTZ, updated_at TIMESTAMPTZ DEFAULT now()

OUTPUT: Two SQL migration files. Use ALTER TABLE ADD COLUMN IF NOT EXISTS for safety.

ACCEPTANCE:
- [ ] Both migrations run without error
- [ ] event_log has all 15 columns
- [ ] user_model has all 13 columns
- [ ] Indexes exist and are used by queries
```

---

## Prompt 3: Event Logger Wiring

```
CONTEXT:
MYPA has an eventLogger.ts service and Supabase hooks (useTasks, useCircles, useChallenges, useFocusSessions). The event logger needs to be called from all hooks to track user actions for AI learning and quality metrics.

TASK:
Update the following files to emit event_log entries on every mutation:

1. frontend/src/hooks/supabase/useTasks.ts
   - createTask → event_type: 'task_action', action: 'create_task', success: true/false
   - completeTask → event_type: 'task_action', action: 'complete_task'
   - updateTask → event_type: 'task_action', action: 'update_task'
   - deleteTask → event_type: 'task_action', action: 'delete_task'
   Each event must include: screen_context (from navigation state), params (task data), success, latency_ms (measure time from call to completion)

2. frontend/src/hooks/supabase/useFocusSessions.ts
   - startSession → event_type: 'focus_action', action: 'start_focus_session'
   - pauseSession → action: 'pause_focus'
   - resumeSession → action: 'resume_focus'
   - endSession → action: 'end_focus'

3. frontend/src/hooks/supabase/useCircles.ts
   - createCircle → event_type: 'social_action', action: 'create_circle'
   - joinCircle → action: 'join_circle'
   - leaveCircle → action: 'leave_circle'

4. frontend/src/hooks/supabase/useChallenges.ts
   - createChallenge → event_type: 'social_action', action: 'create_challenge'
   - joinChallenge → action: 'join_challenge'

5. frontend/App.tsx
   - On app foreground (AppState change to 'active'): event_type: 'navigation', action: 'app_opened', params: { first_open_today, timezone, app_version, is_premium }

RULES:
- Use the existing eventLogger.ts service. Don't create a new one.
- Events must not block the UI. Fire-and-forget (async, no await).
- Include latency_ms for all mutations (Date.now() before and after).
- If the eventLogger has a different API than expected, adapt the calls to match its interface.

ACCEPTANCE:
- [ ] Create a task → check event_log table → row exists with correct action, success, latency_ms
- [ ] Complete a task → same check
- [ ] Start focus → same check
- [ ] Open app → app_opened event in event_log
- [ ] No UI lag from event logging (fire-and-forget)
```

---

## Prompt 4: Voice System — OpenAI Realtime API Integration

```
CONTEXT:
MYPA is a voice-first app. Current voice implementation records audio, uploads to edge function, processes with Whisper+GPT, returns text+audio. Target: replace with OpenAI Realtime API for <800ms latency.

The VoiceContext.tsx manages voice state (IDLE, LISTENING, PROCESSING, SPEAKING, TIMEOUT, ERROR, OFFLINE).
The VoiceService.ts handles audio recording and playback.
The actionExecutor.ts executes ActionJSON from voice commands.

TASK:
Refactor the voice system to use OpenAI Realtime API:

1. In VoiceService.ts:
   - Add WebSocket connection to OpenAI Realtime API endpoint
   - Implement connect(), disconnect(), sendAudio(chunk), onTranscript(cb), onAudio(cb), onFunctionCall(cb)
   - Handle WebSocket lifecycle: open, close, error, reconnect with exponential backoff
   - Audio format: 16kHz PCM (or whatever Realtime API requires)

2. In VoiceContext.tsx:
   - Wire state machine transitions to VoiceService events
   - IDLE → (tap) → LISTENING: start mic capture, stream audio chunks to WebSocket
   - LISTENING → (silence 3s) → TIMEOUT
   - LISTENING → (speech detected, then silence) → PROCESSING
   - PROCESSING → (function_call received) → execute via actionExecutor → SPEAKING
   - PROCESSING → (text response) → SPEAKING (play TTS from Realtime API)
   - SPEAKING → (barge-in: user speaks) → cancel TTS → LISTENING
   - SPEAKING → (done) → IDLE
   - Any state → (error) → ERROR with retry logic
   - Implement OFFLINE detection (check network before LISTENING)

3. Fallback path:
   - If WebSocket fails to connect after 3 attempts: fall back to REST path
   - REST path: record audio → POST to voice-command edge function → play response
   - Log fallback events to event_log

4. Configure function-calling in Realtime API session config:
   - Pass ACTION_TOOLS from the shared config
   - When function_call received: parse ActionJSON, execute via actionExecutor, send result back

IMPORTANT: The Realtime API may use a different protocol than standard OpenAI REST. Research the current API format. If Realtime API is not available or requires special access, implement the optimized REST path as primary with clear TODO markers for Realtime API upgrade.

ROLLBACK: Keep the current REST-based voice flow as the fallback. Never delete it.

ACCEPTANCE:
- [ ] Tap orb → mic activates → speak → response plays in <1.5s on device
- [ ] "Add buy groceries tomorrow" → task created in database
- [ ] Barge-in works: speak during AI response → TTS stops → listening resumes
- [ ] 3s silence → "I didn't catch that" timeout message
- [ ] Network off → OFFLINE state with text input shown
- [ ] WebSocket failure → falls back to REST path
- [ ] All voice events logged to event_log
```

---

## Prompt 5: Daily Briefing Auto-Play

```
CONTEXT:
MYPA has a daily-brief edge function that generates personalized morning briefings. profiles table has briefing_cache (text) and briefing_date columns. The briefing should auto-play via TTS on first app open of the day.

TASK:
Wire the daily briefing to auto-play:

1. In App.tsx or AIHubScreen.tsx:
   - On mount (after auth): check profiles.briefing_date
   - If briefing_date !== today (user's timezone):
     a. If briefing_cache has content: use cached text
     b. If no cache: call daily-brief edge function, cache result
   - Play briefing text via TTS (use text-to-speech edge function or Realtime API)
   - During playback: show briefing text on screen with typing animation
   - User can tap to skip → stop TTS, dismiss text
   - User can barge-in (speak) → stop TTS, transition to LISTENING
   - After playback completes or skip: update briefing_date to today

2. Event logging:
   - briefing_started: when TTS begins
   - briefing_progress: at 25%, 50%, 100% of text played
   - briefing_skipped: if user taps skip or barge-in, include skipped_at_percent

3. Edge cases:
   - If TTS fails: show briefing as text card on AIHub (silent fallback)
   - If edge function fails: show generic greeting "Good morning! You have X tasks today."
   - If user has no tasks: briefing still plays with streak/circle info

ACCEPTANCE:
- [ ] First open of day → briefing plays automatically
- [ ] Second open same day → no briefing (guarded by briefing_date)
- [ ] Tap during briefing → stops, returns to IDLE
- [ ] Barge-in during briefing → stops, goes to LISTENING
- [ ] event_log has briefing_started, briefing_progress, and/or briefing_skipped entries
- [ ] Works across EST, CST, MST, PST timezones
```

---

## Prompt 6: Unlock Celebration Flow

```
CONTEXT:
MYPA has a progressive AI unlock system (5 levels). UnlockCelebrationModal component exists. calculate-unlocks edge function exists. Need to wire them together.

TASK:
1. In calculate-unlocks edge function (or create new logic):
   - When unlock_level increases: set a flag (e.g., user_model.unlock_celebration_pending = new_level)
   - Insert notification: "You've unlocked Level X: [Feature Name]!"

2. In App.tsx:
   - On app open: check user_model.unlock_celebration_pending
   - If pending: show UnlockCelebrationModal with:
     - Level name and number
     - Description of what's new
     - Example of the new AI behavior
     - "Try it now" CTA that deep-links to relevant feature
     - Confetti animation
   - After dismiss: clear unlock_celebration_pending flag

3. In UnlockDetailsModal:
   - Wire to real useUnlocks data
   - Show progress toward next level (days remaining estimate)
   - Show what each locked level will unlock

4. In voice handler:
   - When user requests a locked feature: respond with "I'll be able to do that after about X more days of use — I'm still learning your patterns."
   - Don't reject harshly. Be encouraging.

5. In UI screens:
   - Locked features show: greyed out + lock icon + "X days to unlock"
   - Consistent across AIHub, TasksView, ProfileView

ACCEPTANCE:
- [ ] Seed user with 7+ days of data → run calculate-unlocks → unlock_level = 2
- [ ] Open app → celebration modal appears for Level 2
- [ ] Dismiss → modal doesn't re-appear
- [ ] Locked feature in UI shows lock icon + days remaining
- [ ] Voice request for locked feature → encouraging response
```

---

## Prompt 7: RevenueCat Integration

```
CONTEXT:
MYPA needs subscription monetization. Free tier: 10 voice commands/day, 1 circle. Premium: $4.99/mo or $39.99/yr, unlimited everything.

TASK:
1. Add RevenueCat SDK to frontend/package.json
2. Initialize RevenueCat in App.tsx with API key from env
3. Create a paywall screen/sheet component:
   - Show feature comparison (free vs premium)
   - Monthly and annual options
   - "Restore purchases" button
   - Terms/privacy links
4. Create edge function: supabase/functions/revenucat-webhook/index.ts
   - Handle: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION
   - Update profiles.is_premium accordingly (true/false)
   - Log purchase events to event_log
5. On app launch: check RevenueCat entitlement → sync to profiles.is_premium
6. Wire is_premium checks:
   - Voice command limit (skip count check if premium)
   - Circle creation limit (skip if premium)
   - Model routing (premium gets gpt-4o for all requests)

ACCEPTANCE:
- [ ] Paywall displays with correct pricing
- [ ] Sandbox purchase works in development
- [ ] profiles.is_premium updates after purchase
- [ ] Premium user bypasses voice limit
- [ ] Premium user can create multiple circles
- [ ] Cancellation sets is_premium = false
```

---

## Prompt 8: Supabase Schema + Seed Data

```
CONTEXT:
MYPA needs test data for development. config.toml references seed.sql but it doesn't exist.

TASK:
Create supabase/seed.sql with:

1. Two test users (use Supabase auth.users if possible, otherwise profiles directly):
   - User A: "Alex Test" — free tier, 14 days active, level 3, 47-day streak
   - User B: "Sam Test" — premium, 30 days active, level 5, 12-day streak

2. Tasks for User A (10 tasks):
   - 3 completed today, 4 pending today, 2 pending tomorrow, 1 overdue
   - Mix of categories (Work, Personal, Health)
   - Mix of priorities (low, medium, high, urgent)

3. Tasks for User B (8 tasks):
   - Similar mix

4. One circle: "Productivity Squad" with both users
   - User A is owner, User B is member
   - One active challenge: "Focus Challenge" (focus_time type, 7 days, target 300 minutes)
   - Both users participating, User A at 120 min, User B at 200 min

5. Sample event_log entries (last 14 days):
   - 50 voice_command events for User A (various actions, success rates, latencies)
   - 30 task_action events for User A
   - 20 events for User B

6. user_model entries:
   - User A: peak_hours 9-11 AM, completion_rate_7d 0.72, overwhelm_score 0.3, unlock_level 3
   - User B: peak_hours 2-4 PM, completion_rate_7d 0.85, overwhelm_score 0.1, unlock_level 5

NOTE: Use gen_random_uuid() for IDs. Use NOW() - INTERVAL for dates. Make data realistic.

ACCEPTANCE:
- [ ] supabase db reset populates all data without error
- [ ] App loads and shows tasks for logged-in user
- [ ] Circle shows both members
- [ ] Challenge shows progress
```

---

## Prompt 9: QA Voice Test Script

```
CONTEXT:
MYPA needs a regression test script for voice commands. This tests the end-to-end voice loop: speak → parse → execute → respond.

TASK:
Create docs/qa/VOICE_QA_SCRIPT.md with:

1. 20 Common Commands (must all pass):
   - "Add buy groceries tomorrow"
   - "What do I have today?"
   - "I'm done with the report"
   - "Delete buy groceries" (should confirm first)
   - "Start focus for 25 minutes"
   - "How's my streak?"
   - "Move dentist to Thursday"
   - "Add meeting with Sarah at 3pm tomorrow"
   - "What's my level?"
   - "Create a circle called Study Group"
   - "How many tasks do I have this week?"
   - "Add high priority: finish proposal by Friday"
   - "Pause focus"
   - "Resume focus"
   - "End focus session"
   - "Show my circles"
   - "I need to buy milk, eggs, and bread" (batch create)
   - "What did I complete today?"
   - "Set my focus duration to 30 minutes"
   - "Good morning" (should trigger greeting, not action)

2. 10 Edge Cases:
   - Empty utterance (silence) → timeout gracefully
   - Unintelligible speech → "I didn't catch that"
   - Ambiguous: "do the thing" → clarification question
   - Destructive without confirmation: "delete everything" → must confirm
   - Network drop mid-request → error state + text fallback
   - Very long utterance (brain dump) → batch create or clarify
   - Command for locked feature → encouraging response about unlock
   - Rate limited (11th command for free user) → soft upsell
   - Barge-in during response → TTS stops, listening resumes
   - Simultaneous tap and speak → no crash, enters LISTENING

For each test: state the input, expected action, expected voice response, and expected UI change.

OUTPUT: Markdown file formatted as a test checklist that can be printed and used during QA sessions.
```

---

## Prompt 10: Release Hardening

```
CONTEXT:
MYPA is preparing for TestFlight and App Store submission. Need to verify all launch requirements.

TASK:
Create docs/release/APP_STORE_CHECKLIST.md with detailed steps for:

1. Privacy Policy:
   - Sections needed: data collected, voice data handling, OpenAI disclosure, retention, deletion rights
   - Hosting: where to host (GitHub Pages, Supabase Storage, or dedicated URL)
   - Must be accessible before submission

2. Terms of Service:
   - Key clauses: acceptable use, subscription terms, termination, liability
   - Same hosting as privacy policy

3. Privacy Nutrition Labels:
   - Data types collected: name, email, voice transcripts, usage data, purchase history
   - For each: collected vs tracked, linked to identity?, purpose
   - Where to fill in App Store Connect

4. Subscription Configuration:
   - Products to create in App Store Connect (monthly + annual)
   - RevenueCat entitlement setup
   - Sandbox testing verification

5. App Store Assets:
   - Icon: 1024x1024 specification
   - Screenshots: 6.7" (1290x2796) and 5.5" (1242x2208) — 6 each
   - Preview video: 30 seconds, key flows to show
   - Description, keywords, subtitle copy suggestions

6. Review Notes:
   - Explain voice functionality
   - Explain OpenAI API usage
   - Demo account credentials for reviewer
   - Expected review questions and prepared answers

7. Pre-Submission Verification:
   - Build uploads and processes correctly
   - All required fields filled in App Store Connect
   - Test account works
   - All URLs (privacy, terms, support) are live

OUTPUT: Comprehensive checklist with action items, links to Apple documentation, and specific instructions for each step.
```

---

## Usage Notes

- Use prompts in order (1-2 first for foundation, 3-6 for core features, 7-10 for launch prep)
- Each prompt is self-contained — provide it to Claude in a single message
- After each prompt execution: verify the acceptance checklist before moving to the next prompt
- If a prompt fails: fix the issue, don't skip the acceptance criteria
- Prompts can be split into smaller sessions if too large for a single interaction
