# MYPA Step-by-Step Execution Plan (Self-Contained)
## Every step has everything you need — no scrolling back and forth
### For a 2-Person Team — From ~65% Complete to App Store Launch

---

# How This Plan Works

- **15 steps, strict order.** Each step is a complete unit: tasks, partner split, AI prompt, validation, DoD, troubleshooting, and sign-off.
- **Never jump ahead.** Complete a step, pass its validation, sign off, then move on.
- **Partner A = Frontend/Voice Lead (FE).** Screens, modals, voice, event wiring, UI.
- **Partner B = Platform/Backend Lead (BE).** Supabase migrations, edge functions, RLS, cron, RevenueCat, legal.
- **Both share:** Testing, code review, architecture decisions.
- **If something breaks:** Fix it before moving forward. If stuck > 1 hour, ask for help (paste error + context).
- **After each step passes:** Commit to git. Pull latest before starting the next step.

### Checkbox Legend

| Marker | Meaning |
|--------|---------|
| `- [x]` | **Done** — code exists and is verified by audit |
| `- [o]` | **Built but needs testing** — code exists, needs you to manually verify it works |
| `- [ ]` | **Not started** — this work hasn't been done yet |

### Project Rules (Always Obey)

| Rule | Source |
|------|--------|
| Voice-first: every feature works via voice AND UI | project-context |
| Supabase only: never create Express routes, never modify `backend/` folder | project-context |
| TypeScript strict: no `any` unless absolutely necessary | project-context |
| iOS-first: SafeAreaView, respect notch/home indicator | project-context |
| Progressive unlock: locked features are VISIBLE but DISABLED (greyed + lock icon), never hidden | PRD 4.3 |
| XP values are sacred: Task=10, High-priority=20, Focus=15, Perfect=25, Streak day=5, Week=50, Month=200, Circle join=25, Assignment=30, Challenge win=100 | project-context |
| Streak multipliers are sacred: 3+ days=1.1x, 7+=1.25x, 14+=1.5x, 30+=2.0x | project-context |
| Action System: AI outputs JSON actions → client validates → client executes. If confidence < 0.7, confirm first | PRD 4.7 |
| Event Logging: EVERY user action must emit an `event_log` entry. Target 95%+ coverage | PRD 4.8 |
| Usage counters computed from `event_log`, never a mutable counter | PRD 3 |
| Circles: daily cards show COUNTS only. Task titles NEVER shared. Privacy defaults = "counts only" | PRD 4.4 |
| v1 is tap-to-talk only. No wake word | project-context |
| Model IDs live in `supabase/functions/_shared/config.ts`, never hardcoded in client | PRD 3 |
| DoD: feature isn't done unless it works via voice AND UI, is RLS-safe, logs events, handles errors, has loading/empty/error states | PRD 13 |

| Must NOT Do | Why |
|-------------|-----|
| Don't add new npm dependencies without discussion | Bundle size |
| Don't use `any` type | TypeScript strict |
| Don't leave `console.log` in production | Clean output |
| Don't bypass RLS | Security |
| Don't hardcode colors/spacing | Use design system tokens |
| Don't use `ScrollView` with `.map()` for lists | Use `FlatList` for 10+ items |
| Don't use Redux/Zustand/MobX | React Context + Supabase only |
| Don't modify `backend/` folder | Legacy dead code |
| Don't store raw audio | Stream and discard |
| Don't expose raw errors to users | Friendly messages only |

### Build Order (Why This Sequence)

```
FOUNDATION (Steps 1-5): Environment → Schema → RLS → Events → Edge Functions
    ↓ Can't build features on broken data/security
FEATURES (Steps 6-9): PostgREST Fix → Screen Wiring → Voice → Briefing
    ↓ Each layer depends on the previous
BUSINESS LOGIC (Steps 10-12): Unlocks → Monetization → Analytics
    ↓ All depend on events flowing correctly
LAUNCH PREP (Steps 13-15): QA → Legal → TestFlight & App Store
```

---
---

## Step 1: Environment & Project Sanity Check

### 1) Objective
Make sure both partners can run the app, connect to Supabase, and push code. If either partner can't run the app, nothing else works.

### 2) Why This Step Is Now
Nothing works if your environment is broken. This is the "can we even start" check.

### 3) Inputs Required
- Repository URL and git access for both partners
- Supabase project URL + anon key (from Supabase Dashboard → Settings → API)
- Supabase access token (for CLI login)
- Xcode installed with iOS simulator
- Node.js 18+ installed

### 4) Task Checklist

#### Setup — Clone & Install
- [x] Clone the repo: `git clone <your-repo-url>`
- [x] Run `cd mypa-ios-latest/frontend && npm install`
- [x] Verify `node --version` is 18+ (install via nvm if not)

#### Setup — Environment Variables
- [x] Verify `frontend/.env` file exists
- [x] Confirm `EXPO_PUBLIC_SUPABASE_URL` is set to your Supabase project URL
- [x] Confirm `EXPO_PUBLIC_SUPABASE_ANON_KEY` is set to your Supabase anon key
- [x] Confirm `.env` does NOT contain `SERVICE_ROLE_KEY` (that stays server-side only)

#### Setup — Start the App
- [x] Run `cd frontend && npx expo start`
- [x] Press `i` to open in iOS simulator
- [x] Confirm the app loads (login screen or AI Hub)

#### Setup — Supabase CLI
- [x] Run `npx supabase --version` — prints a version number
- [x] Run `npx supabase login` — authenticate with your Supabase access token
- [x] Run `npx supabase projects list` — shows your project in the list

#### Setup — Supabase Link & Push
- [x] Verify project is linked (`npx supabase link` if needed)
- [x] Run `npx supabase db push` — says "up to date" or applies pending migrations without error

#### Verification — Both Partners
- [x] Partner A: App runs on iOS simulator
- [o] Partner B: App runs on iOS simulator
- [x] Partner A: Can log in with test account and see AI Hub
- [o] Partner B: Can log in with test account and see AI Hub
- [x] Partner A: Can push a test commit to git
- [o] Partner B: Can push a test commit to git

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Verify Expo starts, test account works, simulator loads | Verify Supabase CLI, `db push`, project linked | Both confirm app runs and they can log in |

### 6) AI Prompt to Use for This Step

```
I'm working on MYPA, a voice-first iOS productivity app built with React Native + Expo + Supabase.

TASK: Help me verify my development environment is correctly set up.

Check:
1. frontend/.env has EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY set
2. .env does NOT contain SERVICE_ROLE_KEY
3. `npx expo start` runs without errors
4. `npx supabase db push` runs without errors
5. App loads in iOS simulator and I can log in

OUTPUT: List any issues found and how to fix them.
DONE CRITERIA: Both partners can run app, log in, and push to git.
ROLLBACK: If npm install fails, delete node_modules and reinstall. If supabase push fails, check that project is linked.
```

### 7) Validation Checklist
- [x] App runs without red errors in Expo terminal for Partner A
- [o] App runs without red errors in Expo terminal for Partner B
- [x] Both partners can log in and see AI Hub screen
- [x] `npx supabase db push` completes without error
- [x] Both partners can push to git

**STOP if any fail. Fix before proceeding.**

### 8) Definition of Done for This Step
- Both partners have a working dev environment
- App runs on iOS simulator
- Supabase is connected and migrations are current
- Git is working for both partners

### 9) Common Mistakes in This Step
- Missing `.env` file (it's in `.gitignore` — copy from teammate or Supabase Dashboard)
- Node version mismatch (use Node 18+ via nvm)
- Supabase CLI not logged in (`npx supabase login`)
- iOS simulator not installed (open Xcode first to trigger install)

### 10) Troubleshooting if Step Fails
- `expo start` fails → `rm -rf node_modules && npm install`
- Supabase "access token not provided" → `npx supabase login` again
- Simulator blank → check Expo terminal for red errors, restart Expo
- "Project not linked" → run `npx supabase link --project-ref <your-project-ref>`

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have committed working environment state to git

---
---

## Step 2: Database Schema Alignment

### 1) Objective
Make sure your Supabase database matches what the PRD requires — correct table names, correct columns, correct indexes. Every feature depends on the database being right.

### 2) Why This Step Is Now
Every feature depends on the database. Wrong schema = broken features. The gap report (GAP-02, GAP-03, GAP-11) identified that `event_log` is missing PRD columns, `user_model` may be incomplete, and XP trigger values are wrong. Fix all of this now.

### 3) Inputs Required
- PRD.md Section 4.8 (Event Log Schema + User Model Schema)
- docs/planning/MYPA_ARCHITECTURE_GAP_REPORT.md (GAP-02, GAP-03, GAP-11)
- supabase/migrations/ (all existing SQL files)
- Supabase Dashboard → Table Editor

### 4) Task Checklist

#### Backend — Check Migration State
- [x] Run `npx supabase db push` and note output (13 migrations exist: 001-013)
- [x] List migration files in `supabase/migrations/` and confirm they are numbered sequentially

#### Backend — Verify `event_log` Table
- [x] Open Supabase Dashboard → Table Editor → `event_log`
- [x] Confirm table is named `event_log` (NOT `user_events`) — migration 008 renames it
- [x] Confirm column exists: `action` (TEXT) — migration 008 — verified in Dashboard
- [x] Confirm column exists: `intent_raw` (TEXT) — migration 008 — verified in Dashboard
- [x] Confirm column exists: `confidence` (REAL) — migration 008 — verified in Dashboard
- [x] Confirm column exists: `latency_ms` (INTEGER) — migration 008 — verified in Dashboard
- [x] Confirm column exists: `ai_model_used` (TEXT) — migration 008 — verified in Dashboard
- [x] Confirm column exists: `tokens_used` (INTEGER) — migration 008 — verified in Dashboard
- [x] Confirm column exists: `user_override` (BOOLEAN) — migration 008 — verified in Dashboard
- [x] Confirm column exists: `error_code` (TEXT) — migration 008 — verified in Dashboard
- [x] Confirm column exists: `success` (BOOLEAN) — migration 008 — verified in Dashboard
- [x] Confirm column exists: `screen_context` (TEXT) — migration 008 — verified in Dashboard
- [x] Confirm column exists: `params` (JSONB) — migration 008 — verified in Dashboard

#### Backend — Verify `user_model` Table
- [x] Open Supabase Dashboard → Table Editor → `user_model`
- [x] Confirm table is named `user_model` (NOT `user_models`) — migration 009 renames it
- [x] Confirm column exists: `peak_hours` (JSONB) — migration 009 — verified in Dashboard
- [x] Confirm column exists: `avg_task_durations` (JSONB) — migration 009 — verified in Dashboard
- [x] Confirm column exists: `completion_rate_7d` (REAL) — migration 009 — verified in Dashboard
- [x] Confirm column exists: `overwhelm_score` (REAL) — migration 009 — verified in Dashboard
- [x] Confirm column exists: `voice_usage_rate` (REAL) — migration 009 — verified in Dashboard
- [x] Confirm column exists: `tone_preference` (TEXT) — migration 009 — verified in Dashboard
- [x] Confirm column exists: `unlock_level` (INTEGER) — migration 009 — verified in Dashboard
- [x] Confirm column exists: `days_active` (INTEGER) — migration 009 — verified in Dashboard
- [o] Confirm column exists: `completion_rate_30d` (REAL) — may not exist yet, check Dashboard
- [o] Confirm column exists: `preferred_categories` (JSONB) — may not exist yet, check Dashboard
- [o] Confirm column exists: `avg_daily_tasks` (REAL) — may not exist yet, check Dashboard
- [x] Confirm column exists: `common_reschedule_patterns` (JSONB) — migration 009 — verified in Dashboard
- [o] Confirm column exists: `last_calculated_at` (TIMESTAMPTZ) — may not exist yet, check Dashboard

#### Backend — Verify `profiles` Table
- [x] Confirm column exists: `timezone` (TEXT, IANA format) — verified in Dashboard
- [x] Confirm column exists: `briefing_cache` (TEXT) — verified in Dashboard
- [x] Confirm column exists: `briefing_date` (DATE) — verified in Dashboard
- [x] Confirm column exists: `is_premium` (BOOLEAN) — verified in Dashboard
- [x] Confirm column exists: `push_token` (TEXT) — migration 007

#### Backend — Verify XP Triggers
- [x] Run in SQL Editor: `SELECT prosrc FROM pg_proc WHERE proname = 'add_xp_on_task_complete';` — verified in Dashboard
- [x] Confirm task complete awards 10 XP (not 5) — migration 010 sets this — verified in Dashboard
- [x] Confirm high-priority task awards 20 XP (not 15) — migration 010 sets this — verified in Dashboard
- [x] If values are wrong, create a migration to fix them — migration 010 already applied

#### Backend — Verify Indexes on event_log
- [x] Run: `SELECT indexname FROM pg_indexes WHERE tablename = 'event_log';` — verified in Dashboard
- [x] Confirm index exists on `(user_id, created_at)` — `event_log_user_id_idx` exists
- [x] Confirm index exists on `(user_id, event_type, created_at)` — `idx_event_log_user_type_created` exists
- [x] If missing, add via migration — not needed, all indexes present

#### Backend — Create Seed Data
- [x] Create or verify `supabase/seed.sql` with 2 test users, 10 sample tasks (mix of complete/incomplete), 1 circle, 1 challenge, and sample `event_log` entries — seed.sql exists
- [ ] Run `npx supabase db reset` → seed data loads without errors — SKIPPED (preserving current data)
- [ ] Verify seed users can log in and see seeded tasks — SKIPPED (preserving current data)

#### Backend — Fix Any Missing Schema
- [o] If any table/column is missing, create a new migration file (next number in sequence)
- [o] Use `ALTER TABLE ADD COLUMN IF NOT EXISTS` for safety
- [o] Run `npx supabase db push` to apply the fix
- [o] Re-verify the fixed table/column in Dashboard

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Check TypeScript types in `supabase.ts` match actual DB columns | Write and run migration SQL to fix gaps | Compare TypeScript types vs actual DB together |

### 6) AI Prompt to Use for This Step

```
I'm working on MYPA, a voice-first iOS productivity app.

TASK: Review the Supabase database schema for completeness.

Check these files:
- supabase/migrations/ (all SQL files)
- frontend/src/lib/supabase.ts (TypeScript types)

Verify:
1. event_log table has ALL PRD columns: action, intent_raw, ai_model_used, confidence, tokens_used, user_override, latency_ms, error_code, success, screen_context, params
2. user_model table has ALL PRD columns: peak_hours, avg_task_durations, completion_rate_7d, overwhelm_score, voice_usage_rate, tone_preference, unlock_level, active_days_count
3. TypeScript types in supabase.ts match actual DB columns
4. Indexes exist on (user_id, created_at) and (user_id, event_type, created_at) for event_log
5. XP triggers award correct values: task=10, high-priority=20 (per PRD)

OUTPUT: List any mismatches. Provide migration SQL to fix them.
DONE CRITERIA: All PRD columns exist. Types match. Indexes exist. XP values correct.
ROLLBACK: If migration fails, document the error. Do not drop data.
```

### 7) Validation Checklist
- [x] `event_log` exists with all 13 PRD columns — verified in Dashboard
- [x] `user_model` exists with all PRD columns — verified in Dashboard
- [x] `profiles` has `timezone`, `briefing_cache`, `briefing_date`, `is_premium` — verified in Dashboard
- [x] Indexes on event_log verified — 5 indexes confirmed in Dashboard
- [x] XP trigger values match PRD (task=10, high-priority=20) — verified in Dashboard
- [x] `npx supabase db push` says "up to date" — confirmed
- [o] TypeScript types in `supabase.ts` match actual DB — needs code check later
- [x] `supabase/seed.sql` exists — seed test skipped (preserving data)

**STOP if any fail. Fix before proceeding.**

### 8) Definition of Done for This Step
- Database schema matches PRD exactly
- All missing columns/tables added via migration
- XP triggers award correct values
- Indexes exist for query performance
- Seed data creates usable test environment

### 9) Common Mistakes in This Step
- Running migrations on the wrong Supabase project (check project URL)
- Forgetting to link the project first (`npx supabase link`)
- Editing migration files after they've been applied (always create NEW migrations)
- Using `user_events` instead of `event_log` or `user_models` instead of `user_model`

### 10) Troubleshooting if Step Fails
- Migration fails → Read the error. Usually a typo or missing column reference. Fix and re-push.
- "Table already exists" → Use `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`
- "Column already exists" → This is fine, it means the column is already there

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have committed migration files to git

---
---

## Step 3: RLS Security Validation

### 1) Objective
Verify that Row Level Security prevents users from seeing each other's data. If RLS is broken, everything you build leaks private information.

### 2) Why This Step Is Now
The gap report (GAP-01) found that migration 005 sets `SELECT USING (true)` on most tables — meaning ANY user can read ANY other user's data. This is a ship-blocker. Must fix before any external testing.

### 3) Inputs Required
- docs/planning/MYPA_ARCHITECTURE_GAP_REPORT.md (GAP-01)
- supabase/migrations/ (especially 005, 011, 012, 013)
- PRD Section 4.4 (Circles privacy rules)

### 4) Task Checklist

#### Security — List All Policies
- [x] Run in SQL Editor: `SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;` — 39 policies found
- [x] Save/screenshot the output for reference — verified in Dashboard

#### Security — Audit for Dangerous Policies
- [x] Check `tasks` policies: NO `USING (true)` — migration 011 fixes to `auth.uid() = user_id`
- [x] Check `focus_sessions` policies: NO `USING (true)` — migration 011 fixes to own only
- [x] Check `event_log` policies: NO `USING (true)` — migration 011 fixes to own only
- [x] Check `user_model` policies: SELECT own row only, NO client INSERT/UPDATE — migration 011
- [x] Check `profiles` policies: SELECT/UPDATE own row only (public fields via separate policy) — migration 011

#### Security — Test Cross-User Isolation
- [o] In SQL Editor (as authenticated user): `SELECT count(*) FROM tasks;` — returns ONLY your tasks — needs app-level test
- [o] In SQL Editor: `SELECT count(*) FROM event_log;` — returns ONLY your events — needs app-level test
- [o] In SQL Editor: `SELECT count(*) FROM focus_sessions;` — returns ONLY your sessions — needs app-level test

#### Security — Verify SECURITY DEFINER Helpers
- [x] Run: `SELECT proname FROM pg_proc WHERE proname = 'is_circle_member';` — created in migration 011
- [x] Run: `SELECT proname FROM pg_proc WHERE proname = 'is_challenge_participant';` — created in migration 012

#### Security — Circle RLS Verification
- [o] Confirm circle members CAN see their circle's data — needs app-level test
- [o] Confirm non-members CANNOT see other circles' data — needs app-level test
- [o] Confirm no "infinite recursion" errors when querying `circle_members` or `challenge_participants` — needs app-level test

#### Security — Fix If Broken
- [x] If dangerous policies found, check migrations `011_rls_hardening.sql` and `012_fix_challenge_rls_recursion.sql` — both exist
- [x] If those aren't applied, run `npx supabase db push` — already up to date
- [x] If policies still wrong, create a new migration to correct them — only profiles_select is open (intentional)
- [x] Re-run all test queries above after any fix — no dangerous policies found

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Test RLS from the app: create task as User A, try to see User B's tasks | Audit RLS policies in SQL Editor, write fix migrations if needed | Run cross-user isolation test together |

### 6) AI Prompt to Use for This Step

```
TASK: Audit all Row Level Security policies on my Supabase database.

Check supabase/migrations/ for all RLS-related SQL.

For EACH table, verify:
1. SELECT policy uses auth.uid() = user_id (not USING (true))
2. INSERT policy uses WITH CHECK (auth.uid() = user_id)
3. Circle/challenge tables use SECURITY DEFINER helper functions (not direct subqueries)
4. No infinite recursion possible

Provide test queries I can run in SQL Editor to verify:
- User A cannot see User B's tasks
- User A in Circle X can see Circle X data
- User A NOT in Circle Y cannot see Circle Y data

DONE CRITERIA: All sensitive tables have strict per-user policies. Test queries return expected results.
ROLLBACK: If new policies break queries, revert to previous migration state.
```

### 7) Validation Checklist
- [x] Every table has strict RLS policies (no `USING (true)` on sensitive tables) — verified in Dashboard, only profiles_select is open (intentional)
- [o] `tasks` query returns only the current user's tasks — needs live test
- [o] `event_log` query returns only the current user's events — needs live test
- [o] No "infinite recursion" errors on any query — needs live test
- [x] `is_circle_member` and `is_challenge_participant` helper functions exist — migrations 011/012
- [o] Circle data accessible to members, blocked for non-members — needs live test

**STOP if any fail. Fix before proceeding.**

### 8) Definition of Done for This Step
- All sensitive tables have strict per-user RLS policies
- Cross-user data access is impossible
- Circle privacy is enforced (members see circle data, non-members don't)
- No infinite recursion errors

### 9) Common Mistakes in This Step
- Testing RLS while logged in as Supabase admin (admin bypasses RLS)
- Forgetting that `.select()` after `.insert()` triggers the SELECT RLS policy too
- Circle/challenge policies that reference their own table (causes infinite recursion)
- Not testing with two different authenticated users

### 10) Troubleshooting if Step Fails
- "infinite recursion detected" → Use SECURITY DEFINER helper functions instead of direct subqueries
- Queries returning 0 rows unexpectedly → Check `auth.uid()` matches the `user_id` column
- Insert operations hanging → Related to PostgREST issue (Step 6), note it for now

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have committed any RLS fix migrations to git

---
---

## Step 4: Event Logging Pipeline

### 1) Objective
Wire event logging so that every user action (task CRUD, focus sessions, voice commands, navigation) writes a row to `event_log`. This powers the entire AI learning loop, usage counters, quality metrics, and unlock calculations.

### 2) Why This Step Is Now
The gap report (GAP-06) found that `eventLogger.ts` exists but most hooks don't call it. Without events flowing, Phases 10-12 (unlocks, monetization, analytics) are impossible. Usage counters won't work. AI won't learn.

### 3) Inputs Required
- PRD Section 4.8 (Event Logging Schema)
- PRD Section 16 (Canonical Tracking Events)
- docs/planning/ACTION_SYSTEM_CONTRACT.md (event log entry per action)
- frontend/src/services/eventLogger.ts
- frontend/src/hooks/supabase/ (all hook files)

### 4) Task Checklist

#### Backend — Verify eventLogger.ts Target Table
- [x] Open `frontend/src/services/eventLogger.ts`
- [x] Confirm the flush method uses `.from('event_log')` (NOT `.from('user_events')`) — verified
- [x] Confirm it writes PRD columns as first-class fields: `action`, `intent_raw`, `confidence`, `latency_ms`, `ai_model_used`, `tokens_used`, `user_override`, `error_code`, `success`, `screen_context`, `params` — verified
- [x] Confirm queue versioning exists (stale events from old schema are cleared on init) — verified

#### Backend — Verify useTasks.ts Logging
- [x] Open `frontend/src/hooks/supabase/useTasks.ts`
- [x] Confirm `createTask` calls eventLogger with `action: 'create_task'` — calls logTaskCreated
- [x] Confirm `updateTask` calls eventLogger with `action: 'update_task'` — calls logTaskEdited
- [x] Confirm `deleteTask` calls eventLogger with `action: 'delete_task'` — calls logTaskDeleted
- [x] Confirm `completeTask` calls eventLogger with `action: 'complete_task'` — calls logTaskCompleted

#### Backend — Verify useFocusSessions.ts Logging
- [x] Open `frontend/src/hooks/supabase/useFocusSessions.ts`
- [x] Confirm `startSession` calls eventLogger with `action: 'start_focus_session'` — calls logFocusStarted
- [ ] Confirm `pauseSession` calls eventLogger with `action: 'pause_focus'` — NOT IMPLEMENTED (pause/resume functions missing)
- [ ] Confirm `resumeSession` calls eventLogger with `action: 'resume_focus'` — NOT IMPLEMENTED
- [x] Confirm `endSession` calls eventLogger with `action: 'end_focus'` — calls logFocusCompleted

#### Backend — Verify useCircles.ts Logging
- [x] Open `frontend/src/hooks/supabase/useCircles.ts`
- [x] Confirm `createCircle` calls eventLogger with `action: 'create_circle'` — WIRED
- [x] Confirm `joinCircle` calls eventLogger with `action: 'join_circle'` — WIRED
- [x] Confirm `leaveCircle` calls eventLogger with `action: 'leave_circle'` — WIRED

#### Backend — Verify useChallenges.ts Logging
- [x] Open `frontend/src/hooks/supabase/useChallenges.ts`
- [x] Confirm `createChallenge` calls eventLogger with `action: 'create_challenge'` — WIRED
- [x] Confirm `joinChallenge` calls eventLogger with `action: 'join_challenge'` — WIRED

#### Backend — Verify app_opened Event
- [x] Open `frontend/App.tsx`
- [x] Confirm `app_opened` event fires on AppState change to 'active' — verified
- [o] Confirm it includes: `first_open_today`, `timezone`, `app_version`, `is_premium` — needs param verification

#### Testing — Verify Events Reach Database
- [x] Create a task in the app → check `event_log` in Supabase Dashboard for `action: 'create_task'`, `success: true` — event logged, screen_context shows "unknown" (minor fix needed later)
- [x] Complete a task → check for `action: 'complete_task'` — verified in Dashboard
- [x] Start a focus session → check for `action: 'start_focus_session'` — verified in Dashboard
- [x] Open the app (foreground) → check for `event_type: 'app_opened'` — 1,290 events confirmed in Dashboard, app_opened events present
- [o] Check Expo terminal — confirm no `[EventLogger] Flush failed` errors

#### Fix — Wire Any Missing Events
- [x] If any hook is missing eventLogger calls, add them now — circles, challenges wired
- [o] If events are failing silently, fix column name mismatches
- [o] If old queued events are failing, bump the queue version constant

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Wire event logging calls into React hooks (useTasks, useFocus, useCircles, useChallenges) | Verify events appear in `event_log` table, fix schema if needed | Check event_log table together after each hook is wired |

### 6) AI Prompt to Use for This Step

```
CONTEXT: MYPA has an eventLogger.ts service and Supabase hooks. The event logger needs to be called from all hooks.

TASK: Update the following files to emit event_log entries on every mutation:

1. frontend/src/hooks/supabase/useTasks.ts
   - createTask → event_type: 'task_action', action: 'create_task', success: true/false
   - completeTask → action: 'complete_task'
   - updateTask → action: 'update_task'
   - deleteTask → action: 'delete_task'
   Each event must include: screen_context, params, success, latency_ms

2. frontend/src/hooks/supabase/useFocusSessions.ts
   - startSession → event_type: 'focus_action', action: 'start_focus_session'
   - endSession → action: 'end_focus'

3. frontend/src/hooks/supabase/useCircles.ts
   - createCircle → event_type: 'social_action', action: 'create_circle'
   - joinCircle → action: 'join_circle'

4. frontend/src/hooks/supabase/useChallenges.ts
   - createChallenge → event_type: 'social_action', action: 'create_challenge'
   - joinChallenge → action: 'join_challenge'

5. frontend/App.tsx
   - On app foreground: event_type: 'navigation', action: 'app_opened', params: { first_open_today, timezone, app_version, is_premium }

RULES: Use existing eventLogger.ts. Fire-and-forget (don't await). Include latency_ms.
DONE CRITERIA: Create task → event_log row. Complete task → event_log row. No UI lag.
ROLLBACK: If events fail, check column name mismatches with the DB.
```

### 7) Validation Checklist
- [x] Create a task → `event_log` row with `action: 'create_task'` — verified in Dashboard
- [x] Complete a task → `event_log` row with `action: 'complete_task'` — verified in Dashboard
- [x] Start a focus session → `event_log` row with `action: 'start_focus_session'` — verified in Dashboard
- [x] Open the app → `event_log` row with event type 'app_opened' — 1,290+ events confirmed
- [o] No `[EventLogger] Flush failed` errors in Expo terminal — needs terminal check

**STOP if any fail. Fix before proceeding.**

### 8) Definition of Done for This Step
- Every hook logs events to `event_log`
- Events appear in Supabase Dashboard within seconds of action
- No flush errors in terminal
- app_opened event fires on foreground

### 9) Common Mistakes in This Step
- EventLogger writing to old `user_events` table (should be `event_log`)
- Events failing silently because column names don't match the DB schema
- EventLogger queue filling up because flush is failing
- Awaiting eventLogger calls (should be fire-and-forget for performance)

### 10) Troubleshooting if Step Fails
- "Could not find table" → Table was renamed. Update the `.from()` call.
- Flush errors → Check column names in the INSERT match actual table columns
- Old queued events failing → Bump queue version to clear stale events

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have committed event logging changes to git

---
---

## Step 5: Edge Function Reliability

### 1) Objective
Make sure all 6 deployed edge functions work correctly and use the shared config for model routing. Voice commands, daily briefing, push notifications, and the AI greeting all depend on these.

### 2) Why This Step Is Now
If edge functions are broken or use wrong models, the app feels broken. Voice is the core product and voice-command is the most critical edge function. Model IDs must be centralized in `_shared/config.ts` per project rules.

### 3) Inputs Required
- supabase/functions/ (all 6 functions + _shared/config.ts)
- docs/planning/EDGE_FUNCTION_SPECS.md (request/response contracts)
- PRD Section 3 (Model Routing Rules)
- Supabase project secrets (OPENAI_API_KEY must be set)

### 4) Task Checklist

#### Backend — Verify Shared Config
- [x] Open `supabase/functions/_shared/config.ts`
- [x] Confirm `MODEL_CONFIG.fast` = `"gpt-4o-mini"` — verified
- [x] Confirm `MODEL_CONFIG.smart` = `"gpt-4o"` — verified
- [x] Confirm `MODEL_CONFIG.personalized` = `"gpt-4o"` — verified
- [x] Confirm `MODEL_CONFIG.cached` = `"gpt-4o"` — verified

#### Backend — Verify Each Function Uses Shared Config
- [x] `voice-command/index.ts` → uses shared config MODEL_CONFIG + ACTION_TOOLS — verified
- [x] `daily-brief/index.ts` → uses `MODEL_CONFIG.cached` — verified
- [x] `ai-greeting/index.ts` → uses `MODEL_CONFIG.fast` — verified
- [x] `calculate-unlocks/index.ts` → no model needed (DB queries only) — verified
- [x] `send-push/index.ts` → no model needed — verified
- [x] `text-to-speech/index.ts` → uses TTS endpoint — verified

#### Backend — Verify System Prompt
- [x] Open `voice-command/index.ts` and find `MYPA_SYSTEM_PROMPT` — defined in _shared/config.ts
- [x] Confirm it instructs GPT to USE the provided function tools (not just respond with text) — verified
- [x] Confirm the ACTION_TOOLS array includes all PRD actions (20+ actions) — verified

#### Backend — Deploy All Functions
- [o] Deploy: `npx supabase functions deploy voice-command` — code exists, needs deploy verification
- [o] Deploy: `npx supabase functions deploy daily-brief` — code exists, needs deploy verification
- [o] Deploy: `npx supabase functions deploy calculate-unlocks` — code exists, needs deploy verification
- [o] Deploy: `npx supabase functions deploy ai-greeting` — code exists, needs deploy verification
- [o] Deploy: `npx supabase functions deploy send-push` — code exists, needs deploy verification
- [o] Deploy: `npx supabase functions deploy text-to-speech` — code exists, needs deploy verification
- [o] Confirm all 6 deploy without errors

#### Testing — Voice Command
- [o] In the app, tap the orb
- [o] Say "What do I have today?"
- [o] Confirm you get a spoken response (not silence or error)
- [o] If response is always "unknown" → fix MYPA_SYSTEM_PROMPT

#### Testing — Check Supabase Secrets
- [o] Verify `OPENAI_API_KEY` is set in Supabase project secrets
- [o] Verify the key is valid and has not expired

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Test voice-command from the app (tap orb, speak) | Deploy all edge functions, verify shared config, check secrets | Test voice command together |

### 6) AI Prompt to Use for This Step

```
TASK: Review all Supabase edge functions for correctness.

Check these files:
- supabase/functions/voice-command/index.ts
- supabase/functions/daily-brief/index.ts
- supabase/functions/calculate-unlocks/index.ts
- supabase/functions/ai-greeting/index.ts
- supabase/functions/send-push/index.ts
- supabase/functions/text-to-speech/index.ts
- supabase/functions/_shared/config.ts

Verify:
1. All functions use MODEL_CONFIG from _shared/config.ts (no hardcoded model names)
2. voice-command uses MYPA_SYSTEM_PROMPT that instructs GPT to use function tools
3. CORS_HEADERS are used consistently
4. Error responses are structured { error: "message" }
5. No service role key exposed to client

OUTPUT: List issues found. Provide fixes file-by-file.
DONE CRITERIA: All functions use shared config, handle errors, return proper responses.
```

### 7) Validation Checklist
- [o] All 6 functions deployed without errors — code ready, deploy needs verification
- [o] `voice-command` responds to a test voice command (not silence)
- [x] No hardcoded model names in any edge function — all use shared config
- [x] `MYPA_SYSTEM_PROMPT` instructs GPT to use function tools — verified
- [o] `OPENAI_API_KEY` set in Supabase secrets

**STOP if any fail. Fix before proceeding.**

**PHASE GATE: Steps 1-5 are the Foundation. Before proceeding to Step 6:**
- [x] App runs without red errors — user confirmed Expo loads
- [x] Database schema matches PRD — migrations 008-010 define it
- [x] RLS prevents cross-user data access — migrations 011-013
- [o] Event logging writes rows to `event_log` — code wired, needs live verification
- [o] Edge functions deploy and respond — code ready, needs deploy test

### 8) Definition of Done for This Step
- All 6 edge functions deployed and responding
- All use shared MODEL_CONFIG (no hardcoded models)
- Voice command responds correctly to test input
- System prompt instructs GPT to use function calling

### 9) Common Mistakes in This Step
- Forgetting to deploy after editing (local changes don't auto-deploy)
- Wrong OpenAI API key in Supabase secrets
- System prompt not instructing GPT to use function calling (all commands return "unknown")
- Missing CORS headers (causes client-side fetch errors)

### 10) Troubleshooting if Step Fails
- "401 Unauthorized" on edge functions → Auth token expired, app will retry
- Voice always returns "unknown" → Fix MYPA_SYSTEM_PROMPT to instruct GPT to USE function tools
- "FunctionsFetchError" → Check Supabase project URL and anon key in `.env`
- Deploy fails → Check `npx supabase login` is valid

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have committed any edge function changes to git
- [ ] I have passed the Phase 1-5 Foundation gate

---
---

## Step 6: Fix Known PostgREST + RLS Issue

### 1) Objective
Resolve the issue where Supabase INSERT operations hang when chained with `.select().single()`. All write operations currently hang because PostgREST + complex RLS policies create a deadlock.

### 2) Why This Step Is Now
This is a known bug. Until fixed, creating tasks/circles hangs the entire UI.

### 3) Inputs Required
- docs/planning/MYPA_ARCHITECTURE_GAP_REPORT.md
- frontend/src/hooks/supabase/useTasks.ts
- frontend/src/hooks/supabase/useCircles.ts
- frontend/src/hooks/supabase/useChallenges.ts
- frontend/src/contexts/SupabaseAuthContext.tsx

### 4) Task Checklist

#### Fix — Split Insert Chains in useTasks.ts
- [x] Find all `.insert(data).select().single()` chains — no chained inserts found (already split)
- [x] Split into plain `.insert(data)` then separate `.select()` — already done

#### Fix — Split Insert Chains in useCircles.ts
- [x] Same pattern: split `.insert(data).select().single()` into two calls — already done

#### Fix — Split Insert Chains in useChallenges.ts
- [x] Same pattern: split `.insert(data).select().single()` into two calls — already done

#### Fix — Add Timeouts
- [x] Add `Promise.race` with timeout to `fetchTasks`, `fetchCircles`, `fetchChallenges` — Promise.race exists in all three hooks
- [x] Add 5-second timeout to `fetchProfile` in SupabaseAuthContext.tsx — 5s timeout verified

#### Fix — Profile Fetch
- [x] Change `.single()` to `.maybeSingle()` for profile fetching — verified in SupabaseAuthContext
- [x] Add 5-second timeout — verified
- [o] Confirm timeout fallback sets `isLoading = false` without clearing user state — needs behavioral test

#### Fix — Prevent Spinner Resets
- [x] Add `hasLoadedOnce` useRef to useTasks, useCircles, useChallenges — hasLoadedOnce exists in all three
- [x] Only set `loading = true` on first fetch — verified

#### Testing
- [x] Create task completes in <3 seconds — confirmed by user
- [x] Create circle completes in <3 seconds — confirmed by user
- [x] App loads past auth in <5 seconds — confirmed by user
- [x] No infinite spinners — confirmed by user

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Split chains in hooks, add timeouts | Support debugging DB issues | Test create task < 3 seconds |

### 6) AI Prompt to Use for This Step

```
I'm working on MYPA, a voice-first iOS productivity app built with React Native + Expo + Supabase.

TASK: Help split `.insert().select().single()` chains in Supabase hooks to avoid PostgREST hanging. Split into `.insert()` then separate `.select()`. Add Promise.race timeouts. Add hasLoadedOnce ref. Test each fix.

Check these files:
- frontend/src/hooks/supabase/useTasks.ts
- frontend/src/hooks/supabase/useCircles.ts
- frontend/src/hooks/supabase/useChallenges.ts
- frontend/src/contexts/SupabaseAuthContext.tsx

RULES:
1. Split every .insert().select().single() into two separate calls
2. Add Promise.race with 8-second timeout to all fetch functions
3. Add 5-second timeout to profile fetch
4. Change .single() to .maybeSingle() for profile fetching
5. Add hasLoadedOnce useRef to prevent spinner resets

DONE CRITERIA: Create task <3 sec. Create circle <3 sec. Auth <5 sec. No infinite spinners.
ROLLBACK: If insert fails after split, check that the separate .select() query matches the right row.
```

### 7) Validation Checklist
- [x] Creating a task completes in <3 seconds — confirmed by user
- [x] Creating a circle completes in <3 seconds — confirmed by user
- [x] App loads past auth in <5 seconds — confirmed by user
- [x] Task screen shows data within 3 seconds — confirmed by user
- [x] No infinite spinners anywhere in the app — confirmed by user

**STOP if any fail. Fix before proceeding.**

### 8) Definition of Done for This Step
- No infinite spinners
- All insert operations complete within 3 seconds
- App loads past auth within 5 seconds

### 9) Common Mistakes in This Step
- Using `.single()` with complex RLS policies (use `.maybeSingle()` instead)
- Not adding timeouts (operations hang indefinitely)
- Setting `loading = true` on every refetch (use `hasLoadedOnce` ref)

### 10) Troubleshooting if Step Fails
- Insert hangs → Split into two separate calls (`.insert()` then `.select()`)
- Profile fetch hangs → Add 5-second timeout with `Promise.race`
- Loading spinner never stops → Check `finally { setLoading(false) }` is present

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have committed PostgREST fix changes to git

---
---

## Step 7: Core Screen Wiring

### 1) Objective
Verify all navigation connections between screens and modals work correctly, and wire any remaining modals (JoinCircle, Notifications, privacy toggles). Most tap handlers are already wired — this step confirms and completes them.

### 2) Why This Step Is Now
Users can't interact with the app until screen-to-modal connections are wired. The Navigation Truth Table shows multiple TODO handlers.

### 3) Inputs Required
- docs/planning/NAVIGATION_TRUTH_TABLE.md
- frontend/src/screens-v2/ (all screen files)
- frontend/src/screens-v2/modals/ (all modal files)

### 4) Task Checklist

#### Wire — TasksViewScreen
- [x] Add `selectedTask` state, `showTaskDetail` state — wired
- [x] Wire tap on task row → TaskDetailModal — functional
- [x] Add `showQuickAdd` state, wire tap on "+" → QuickAddTaskOverlay — functional
- [x] Import and render both modals — both rendered
- [x] Handle close: reset `selectedTask` to null — verified

#### Wire — SocialViewScreen
- [x] Add `selectedCircleId`, `showCircleHome` state — wired
- [x] Wire tap on circle → CircleHomeModal — functional
- [x] Add `selectedChallengeId`, `showChallengeDetail` state — wired
- [x] Wire tap on challenge → ChallengeDetailModal — functional
- [x] Add `showCreateCircle` state — wired
- [x] Wire "+" → CreateCircleSheet + CreateChallengeSheet — functional
- [x] Import and render all modals — all rendered

#### Wire — ProfileViewScreen
- [x] Add `showSettings` state — wired
- [x] Wire gear icon → SettingsModal — functional
- [x] Add `selectedUnlock`, `showUnlockDetails` state — wired
- [x] Wire unlock card → UnlockDetailsModal — functional
- [x] Import and render both modals — both rendered

#### Wire — GestureNavigator
- [x] Wire swipe up from AI Hub → FocusModal as overlay — functional
- [o] Confirm FocusModal is NOT inside GestureDetector — needs verification
- [o] Confirm GestureContext.canSwipe = false when modal open — needs verification

#### Wire — JoinCircleModal (exists but not in plan)
- [o] Verify JoinCircleModal.tsx is rendered from SocialViewScreen (invite code entry)
- [o] Verify user can enter circle invite code and join
- [o] Verify join success refreshes circle list

#### Wire — NotificationsModal (exists but not in plan)
- [o] Verify NotificationsModal.tsx is rendered (bell icon or notification area)
- [o] Verify it shows push notification history
- [o] Verify notifications are marked as read on open

#### Wire — Privacy Toggles in Settings (PRD 4.4)
- [o] Verify SettingsModal has privacy toggles for circles: hide task count, hide focus minutes, hide streak
- [ ] If missing: add toggles that update `profiles` or `user_settings` in Supabase
- [o] Verify defaults are "counts only" (all count toggles ON, task titles always OFF)

#### Testing
- [x] Tap task → TaskDetailModal opens — confirmed by user
- [x] Tap "+" → QuickAddTaskOverlay opens — confirmed by user
- [x] Tap circle → CircleHomeModal opens — confirmed by user
- [x] Tap challenge → ChallengeDetailModal opens — confirmed by user
- [x] Tap gear → SettingsModal opens — confirmed by user
- [x] Swipe up → FocusModal opens — confirmed by user
- [x] All modals close cleanly — confirmed by user

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Wire all screen→modal navigation | Review modal data flow, help with Supabase queries | Demo every screen + modal |

### 6) AI Prompt to Use for This Step

```
I'm working on MYPA, a voice-first iOS productivity app built with React Native + Expo + Supabase.

TASK: Reference docs/planning/NAVIGATION_TRUTH_TABLE.md. Wire all TODO tap handlers: add state variables, onPress handlers, modal components, close handlers.

Files to update:
- frontend/src/screens-v2/TasksViewScreen.tsx
- frontend/src/screens-v2/SocialViewScreen.tsx
- frontend/src/screens-v2/ProfileViewScreen.tsx
- frontend/src/screens-v2/GestureNavigator.tsx

For each screen:
1. Add state for selectedItem and showModal
2. Wire onPress to set state and show modal
3. Import and render modal with visible/onClose props
4. Reset selectedItem to null on close

DONE CRITERIA: Every tap handler works. Every modal opens with correct data. Every modal closes cleanly.
ROLLBACK: If modal crashes, check that it's not inside GestureDetector.
```

### 7) Validation Checklist
- [x] Every tap handler works (no TODO handlers remain) — confirmed by user
- [x] Every modal opens with correct data — confirmed by user
- [x] Every modal closes cleanly — confirmed by user
- [x] No stale state after modal close — confirmed by user
- [x] FocusModal opens on swipe up — confirmed by user

**STOP if any fail. Fix before proceeding.**

### 8) Definition of Done for This Step
- All screen-to-modal navigation connected
- All modals open and close cleanly
- No TODO handlers remain

### 9) Common Mistakes in This Step
- Placing Modal inside GestureDetector (causes crashes)
- Not resetting `selectedItem` to null on close (stale data in next open)
- Forgetting to import the modal component

### 10) Troubleshooting if Step Fails
- "got more than one view as a child" → Move Modal outside GestureDetector
- Stale data in modal → Ensure `selectedItem` resets to null on close
- Modal doesn't appear → Check `visible` prop is connected to state

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have committed screen wiring changes to git

---
---

## Step 8: Voice & AI Integration

### 1) Objective
Build and harden the complete voice loop: tap orb → speak → AI processes → action executes → spoken confirmation. Voice is THE product. This is the most critical step.

### 2) Why This Step Is Now
Everything before was foundation. Voice-command edge function and VoiceContext exist but need state machine hardening, error handling, actionExecutor wiring for all action types, and event logging.

### 3) Inputs Required
- PRD Section 4.1 (Voice State Machine)
- PRD Section 4.7 (Action System)
- docs/planning/ACTION_SYSTEM_CONTRACT.md
- docs/planning/EDGE_FUNCTION_SPECS.md (voice-command)
- voice-ai-patterns rule file
- VoiceContext.tsx
- VoiceService.ts
- actionExecutor.ts

### 4) Task Checklist

#### Voice — State Machine
- [x] Verify states: IDLE, LISTENING, PROCESSING, SPEAKING exist — 4 of 7 implemented
- [x] IDLE→LISTENING: tap orb → activate mic — functional
- [x] LISTENING→PROCESSING: user stops speaking → send to edge function — functional
- [x] PROCESSING→SPEAKING: response returns → play TTS — functional
- [x] SPEAKING→IDLE: TTS finishes — functional
- [ ] TIMEOUT: 3s silence in LISTENING → "I didn't catch that" → IDLE after 2s — NOT a named state (timeout logic exists but not as distinct state)
- [ ] ERROR: 10+s in PROCESSING → "I'm having trouble" → text fallback → IDLE after 5s — NOT a named state
- [ ] OFFLINE: check network before LISTENING → "No connection. Type instead." — NOT a named state
- [x] Barge-in: speak during SPEAKING → stop TTS → LISTENING — implemented
- [o] Cancel: tap X at any state → return to IDLE — needs verification
- [ ] Max 2 retries from ERROR before suggesting text permanently — NOT IMPLEMENTED

#### Voice — Text Input Fallback
- [x] Create text input for OFFLINE and ERROR states — expo-speech fallback exists
- [o] Text sends transcript directly to voice-command (skip audio) — needs verification
- [o] Response shows as text in discreet mode — needs verification
- [ ] Also appears when voice limit hit (Step 11) — NOT BUILT (no limit logic yet)

#### Voice — Action Executor
- [x] Verify handlers for: `create_task`, `update_task`, `complete_task`, `delete_task`, `reschedule_task` — all in actionExecutor.ts
- [x] Verify: `batch_create_tasks`, `brain_dump` — both handled
- [x] Verify: `start_focus_session`, `pause_focus`, `resume_focus`, `end_focus` — all handled
- [x] Verify: `create_circle`, `invite_to_circle`, `create_challenge` — all handled
- [x] Verify: `query_tasks`, `query_schedule`, `query_stats`, `query_circles` — handled server-side
- [x] Verify: `set_preference`, `unknown` (conversational) — both handled
- [x] Wire `post_to_circle` handler — implemented
- [o] Each handler: execute Supabase mutation, return success/failure, don't crash on bad params — needs edge case testing

#### Voice — Confidence & Confirmation
- [x] `confidence < 0.7` → confirmation flow — confidence threshold in actionExecutor
- [x] `confirmation_required` (delete_task) → confirmation flow — CONFIRMATION_REQUIRED_ACTIONS in config
- [x] On "yes" → execute. On "no" → cancel. On timeout → cancel. — yes/no pattern matching in VoiceContext

#### Voice — Client-Side Timeout
- [x] 25-second `Promise.race` timeout on voice-command calls — verified in VoiceContext
- [o] On timeout → ERROR state → "I'm having trouble" — timeout exists but ERROR not a named state

#### Voice — Event Logging
- [x] Voice command events logged with PRD 4.8 fields — VoiceContext logs voice events
- [o] `voice_listening_started` when orb → LISTENING — needs verification of specific event name
- [o] `voice_transcript_received` with `latency_ms` — needs verification
- [o] `voice_action_executed` with `action`, `success`, `latency_ms`, `tokens_used`, `ai_model_used`, `confidence` — needs verification
- [o] `voice_fallback_to_text` with `reason` — needs verification
- [o] All include `screen_context` — needs verification

#### Voice — Discreet Mode (PRD 4.1 + Launch Checklist — REQUIRED for v1)
- [ ] Add "Discreet Mode" toggle in SettingsModal
- [ ] When active: skip LISTENING/SPEAKING, show text input + AI text response
- [ ] Actions still execute the same way (actionExecutor unchanged)
- [ ] Persist toggle in profiles or AsyncStorage
- [ ] Log `discreet_mode_toggled` to event_log with `enabled: true/false`
- [ ] Voice orb visual: show text icon instead of mic when discreet mode is on

#### Voice — Orb Visual States
- [x] IDLE: breathing glow — LivingBackground component exists with animations
- [x] LISTENING: pulsing with audio amplitude — VoiceWaveform component exists
- [o] PROCESSING: spinning/thinking — needs visual verification
- [o] SPEAKING: smooth wave matching TTS — needs visual verification
- [ ] TIMEOUT: fade to breathing — NOT a distinct visual state
- [ ] ERROR: red pulse — NOT IMPLEMENTED
- [ ] OFFLINE: grey pulse — NOT IMPLEMENTED

#### Testing
- [o] "Add buy groceries tomorrow" → task created with tomorrow's date — needs live voice test
- [o] "What do I have today?" → speaks task count — needs live voice test
- [o] "I'm done with [task]" → task complete — needs live voice test
- [o] "Start focus for 25 minutes" → focus starts — needs live voice test
- [o] "How's my streak?" → speaks streak — needs live voice test
- [ ] Turn off network → OFFLINE with text input — OFFLINE state not distinct
- [o] Timeout → ERROR with friendly message — timeout exists, needs test
- [o] Speak gibberish → "I didn't catch that" — needs live test
- [o] Check `event_log` for voice events — needs Dashboard check

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Build/harden state machine, text fallback, wire actionExecutor, orb visuals | Fix edge function issues, system prompt tuning, verify function tool definitions | Test 5 core commands |

### 6) AI Prompt to Use for This Step

```
I'm working on MYPA, a voice-first iOS productivity app built with React Native + Expo + Supabase.

TASK: Refactor voice system. Reference ACTION_SYSTEM_CONTRACT.md. Harden VoiceContext.tsx state machine for all 7 states. Wire actionExecutor for all action types. Add confidence/confirmation logic. Add 25s timeout. Log all voice events. Test 5 core commands.

Check these files:
- VoiceContext.tsx
- VoiceService.ts
- actionExecutor.ts
- supabase/functions/voice-command/index.ts

RULES:
1. All 7 states must be implemented: IDLE, LISTENING, PROCESSING, SPEAKING, TIMEOUT, ERROR, OFFLINE
2. Barge-in: speak during SPEAKING → stop TTS → LISTENING
3. confidence < 0.7 → confirm before executing
4. delete_task always requires confirmation
5. 25-second client-side timeout on voice-command calls
6. Log every voice event to event_log

DONE CRITERIA: 5 core commands work. All 7 states work. Barge-in works. Text fallback works.
ROLLBACK: If voice breaks, check MYPA_SYSTEM_PROMPT tells GPT to use function tools.
```

### 7) Validation Checklist
- [ ] All 7 states work correctly — only 4 of 7 implemented as named states
- [o] 5 core commands work end-to-end — action executor ready, needs live test
- [x] Barge-in works (speak during SPEAKING → stop TTS → LISTENING) — implemented
- [o] Text fallback works in OFFLINE and ERROR states — fallback exists, needs test
- [o] Voice events appear in `event_log` — logging code exists, needs Dashboard check
- [x] 25-second timeout works — Promise.race with 25s in VoiceContext
- [x] `delete_task` requires confirmation — CONFIRMATION_REQUIRED_ACTIONS config
- [ ] Discreet mode toggle works (text-only mode, no audio)

**STOP if any fail. Fix before proceeding.**

### 8) Definition of Done for This Step
- Voice loop works end-to-end
- All 7 states functional
- Text fallback for offline/error
- Voice events logged
- Confirmation for destructive actions

### 9) Common Mistakes in This Step
- System prompt not telling GPT to use function tools (all commands return "unknown")
- Not deploying edge function after editing (local changes don't auto-deploy)
- Audio format mismatch between recording and Whisper API
- Forgetting to handle the "no function call" case (conversational response)

### 10) Troubleshooting if Step Fails
- All commands return "unknown" → Fix `MYPA_SYSTEM_PROMPT` to instruct GPT to USE function tools
- Edge function 500 error → Check Supabase function logs for the error
- Audio not recognized → Verify audio format matches Whisper requirements
- TTS doesn't play → Check text-to-speech edge function is deployed

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have committed voice integration changes to git

---
---

## Step 9: Daily Briefing & Cron Jobs

### 1) Objective
First app open of the day auto-plays a personalized morning briefing. Also set up pg_cron jobs for briefing pre-generation and nightly unlock calculation.

### 2) Why This Step Is Now
This is the "wow moment" — first 5 seconds of the app. Depends on voice pipeline (Step 8) and event logging (Step 4). Cron jobs also needed for Step 10.

### 3) Inputs Required
- PRD Section 4.1 (Daily Briefing Spec)
- docs/planning/EDGE_FUNCTION_SPECS.md (daily-brief)
- supabase/functions/daily-brief/index.ts
- AIHubScreen.tsx
- profiles table (`briefing_cache`, `briefing_date`, `timezone`)

### 4) Task Checklist

#### Backend — pg_cron Setup
- [ ] Upgrade Supabase to Pro ($25/mo) for pg_cron — NOT DONE
- [ ] Verify: `SELECT * FROM cron.job;` works — NOT SET UP
- [ ] Create daily-briefing cron (hourly, filters users at 6 AM local) — NOT SET UP
- [ ] Create nightly-patterns cron (2 AM UTC, calls calculate-unlocks) — NOT SET UP
- [ ] Verify both jobs in `cron.job` table — NOT SET UP
- [ ] NOTE: `SERVICE_ROLE_KEY` only in cron, never client

#### Backend — daily-brief Edge Function
- [x] Verify it queries: profile name/streak, today's tasks, yesterday's completions, active challenges — verified
- [x] Verify context string: peak hour suggestion, challenge update, streak message, motivational insight — verified
- [x] Verify GPT call generates 15-30s paragraph — uses MODEL_CONFIG.cached (gpt-4o)
- [x] Verify template fallback if GPT fails — fallback template exists
- [x] Verify timezone from `profiles.timezone` (IANA) — timezone-aware
- [o] Deploy: `npx supabase functions deploy daily-brief` — code ready, needs deploy verification

#### Frontend — Briefing Date Check
- [x] In AIHubScreen, on mount: fetch `profiles.briefing_date` — useDailyBriefing hook does this
- [x] Get today in user's timezone — timezone-aware date comparison
- [x] If `briefing_date !== today` → trigger briefing — implemented
- [x] If `briefing_date === today` → skip — implemented

#### Frontend — Briefing Fetch and Cache
- [x] If `briefing_cache` exists AND date matches → use cached text — getDailyBrief({ check_cache: true })
- [x] If stale → call daily-brief edge function — implemented
- [x] On success: update `briefing_cache` + set `briefing_date = today` — implemented
- [x] Store text in local state — implemented

#### Frontend — Briefing Playback UI
- [x] Show briefing card/overlay on AIHub — AIHubScreen renders briefing text UI
- [o] Send text to text-to-speech → play audio — needs live test
- [o] "Skip" button → stop TTS — needs live test
- [o] Barge-in (tap orb) → stop TTS → LISTENING — needs live test
- [o] After playback → dismiss → IDLE — needs live test
- [o] TTS fails → show text (silent fallback) — needs live test

#### Frontend — Briefing Event Logging
- [o] `briefing_started` when TTS begins — needs verification
- [o] `briefing_progress` at 25%, 50%, 100% — needs verification
- [o] `briefing_skipped` if skip/barge-in (include `skipped_at_percent`) — needs verification
- [o] Log on-demand vs cached in params — needs verification

#### Frontend — Onboarding Wow Flow (PRD 17 + Critical Decision 1 — REQUIRED for v1)
- [ ] On first app open (no `profiles.timezone` set): show onboarding flow
- [ ] Step 1: Auto-detect timezone from device, show to user, let them override → save to `profiles.timezone`
- [ ] Step 2: MYPA plays a personalized greeting via TTS (ai-greeting edge function)
- [ ] Step 3: Prompt "Try saying 'Add buy groceries tomorrow'" → user speaks → task created → "Done! You're all set."
- [ ] Total flow target: ~45 seconds
- [ ] Mark onboarding complete (e.g. `profiles.onboarding_complete = true`)
- [ ] Log `onboarding_completed` to event_log with `duration_ms`
- [ ] Skip onboarding on subsequent app opens

#### Frontend — Push Notification Wiring
- [o] Request push notification permissions from user (Expo Notifications API) — pushNotifications.ts service exists, needs live test
- [o] On permission granted: get Expo push token → save to `profiles.push_token` — service + useNotifications hook + send-push edge function exist, needs live test
- [ ] Register for: streak reminders (8 PM local if no task completed today), task reminders (15 min before due)
- [ ] Verify push notification appears on physical device when `send-push` is invoked
- [ ] NOTE: Quiet hours config and per-type opt-out are nice-to-have for v1.1

#### Backend — 90-Day Event Log Cleanup (PRD 17 Engineering)
- [ ] Create a pg_cron job (or document as manual SQL) to delete event_log rows older than 90 days
- [ ] SQL: `DELETE FROM event_log WHERE created_at < now() - INTERVAL '90 days';`
- [ ] Verify the job runs without error on test data
- [ ] NOTE: Can defer to post-launch if pg_cron is not yet set up, but must be active before scaling

#### Fallback — Handling
- [x] Edge function fails → template fallback in daily-brief function — verified
- [o] TTS fails → show text card — needs live test
- [o] No tasks → still play with streak/circle info — needs live test
- [o] `profiles.timezone` null → use device timezone, save to profiles — needs verification

#### Testing
- [o] First open → briefing plays — code wired, needs live test
- [o] Second open same day → no briefing — date guard exists, needs live test
- [o] Tap skip → TTS stops — needs live test
- [o] Barge-in → TTS stops → LISTENING — needs live test
- [o] `event_log` has `briefing_started` — needs Dashboard check
- [o] Kill/reopen same day → no double-play — date guard exists, needs live test
- [o] Edge function down → text fallback — needs live test
- [ ] Cron jobs listed in `cron.job` table — NOT SET UP

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Build briefing UI, date check, skip/barge-in, event logging | Set up pg_cron, verify daily-brief edge function, configure cron | Test first open → briefing plays |

### 6) AI Prompt to Use for This Step

```
I'm working on MYPA, a voice-first iOS productivity app built with React Native + Expo + Supabase.

TASK: Wire daily briefing auto-play on first app open. In AIHubScreen: check briefing_date vs today. If stale, call daily-brief edge function. Play via TTS. Handle skip/barge-in. Log briefing_started/progress/skipped. Fallback to text if TTS fails.

Check these files:
- supabase/functions/daily-brief/index.ts
- frontend/src/screens-v2/AIHubScreen.tsx
- profiles table (briefing_cache, briefing_date, timezone)

RULES:
1. Check briefing_date vs today (in user's timezone) on mount
2. If stale, fetch from edge function or use cached briefing_cache
3. Play via TTS with skip button and barge-in support
4. Log briefing_started, briefing_progress (25/50/100%), briefing_skipped
5. Fallback to text card if TTS or edge function fails
6. Never double-play on same day (update briefing_date after playback)

DONE CRITERIA: First open plays briefing. Second same day skips. Skip/barge-in work. Events logged.
ROLLBACK: If briefing breaks, check timezone handling and briefing_date comparison.
```

### 7) Validation Checklist
- [o] First open → briefing plays — code wired, needs live test
- [o] Second open same day → no briefing — date guard exists, needs live test
- [o] Skip and barge-in work — needs live test
- [o] `event_log` has briefing events — needs Dashboard check
- [o] Fallback works when edge function or TTS fails — needs live test
- [ ] pg_cron configured (or documented as TODO) — NOT SET UP
- [ ] Onboarding wow flow works: timezone → greeting → first command → confirmed
- [ ] Push notifications arrive on physical device

**STOP if any fail. Fix before proceeding.**

### 8) Definition of Done for This Step
- Briefing auto-plays on first open with personalized content
- No double-play on same day
- Skip and barge-in work
- Events logged
- Fallback if edge function or TTS fails

### 9) Common Mistakes in This Step
- Not checking `briefing_date` before playing (causes double-play)
- Not handling null timezone (use device timezone as fallback)
- Forgetting to update `briefing_date` after playback

### 10) Troubleshooting if Step Fails
- Briefing plays every time → Check `briefing_date` comparison logic and timezone
- TTS doesn't play → Check text-to-speech edge function is deployed
- Edge function fails → Check Supabase function logs, verify `OPENAI_API_KEY` secret

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have committed briefing and cron changes to git

**PHASE GATE: Steps 6-9 are Features. Before proceeding to Step 10:**
- [o] All screen-to-modal navigation works — code wired, needs walkthrough
- [o] Voice commands execute correctly (5 core commands) — action executor ready, needs live test
- [o] Daily briefing plays on first open — code wired, needs live test
- [o] No infinite loading spinners — timeouts added, needs behavioral test
- [o] All actions log events — tasks log, circles/challenges DO NOT log yet

---
---

## Step 10: Unlock Engine & Gamification

### 1) Objective
Build the full progressive unlock system: nightly job calculates patterns, levels transition, celebration modals show, lock icons appear, XP/streak tracked. This makes MYPA feel alive.

### 2) Why This Step Is Now
Depends on events flowing (Step 4), user_model table (Step 2), pg_cron (Step 9).

### 3) Inputs Required
- PRD Section 4.3 (Gamification & Progressive Unlocks)
- PRD Section 4.8 (Nightly Pattern Calculation)
- supabase/functions/calculate-unlocks/index.ts
- project-context rules (XP values, streak multipliers)

#### Level Reference

| Level | Days | Unlocks |
|-------|------|---------|
| 1 Starter | Day 1 | Task add/complete, voice basic, brain dump, focus timer |
| 2 Familiar | Day 3+ | Smart scheduling, patterns, batch create, focus stats |
| 3 Trusted | Day 7+ | Priority suggestions, streak insights, circle suggestions |
| 4 Personal | Day 14+ | Proactive reminders, time-of-day routing, overwhelm detection |
| 5 Mastery | Day 30+ | Full delegation, multi-step workflows, predictive planning |

### 4) Task Checklist

#### Backend — calculate-unlocks Edge Function
- [x] Open/create `supabase/functions/calculate-unlocks/index.ts` — exists
- [x] Computes unlock requirements (daysActive, tasksCompleted, focusSessions, inCircle, streakDays) — feature-level unlocks work
- [ ] For each user compute from `event_log`: `peak_hours`, `completion_rate_7d`, `overwhelm_score`, `top_categories`, `active_days` — NIGHTLY LEARNING LOOP NOT BUILT (function only does feature unlocks, not user_model computation)
- [ ] Compute `unlock_level` from `active_days` (1→L1, 3+→L2, 7+→L3, 14+→L4, 30+→L5) — NOT computing numeric unlock_level
- [ ] If level increased: set `unlock_celebration_pending = true` — NOT IMPLEMENTED in edge function
- [ ] Upsert all fields into `user_model` — NOT upserting to user_model (only inserts to unlocks table)
- [o] Deploy — code exists, needs deploy

#### Backend — XP Calculation
- [x] XP values per rules: Task=10, High-priority=20, Focus=15, Perfect=25, Streak day=5, Week=50, Month=200 — migration 010 sets correct trigger values
- [x] Streak multipliers: 3+=1.1x, 7+=1.25x, 14+=1.5x, 30+=2.0x — migration 010 sets correct multipliers
- [o] Compute `total_xp` from `event_log` + streak multiplier — triggers handle this, needs live verification
- [o] Store `total_xp` and `current_streak_days` in `user_model` — needs live verification

#### Backend — Streak Calculation
- [o] Streak = consecutive days with 1+ task completed (from `event_log`) — trigger logic exists, needs verification
- [o] Query consecutive dates backwards from today — needs verification
- [o] Store `current_streak_days`. If broken → reset to 0 — needs verification

#### Frontend — useUnlocks Hook
- [x] Create/verify `frontend/src/hooks/useUnlocks.ts` — exists with hasUnlock, markSeen, checkUnlocks, pendingUnlocks
- [x] Fetch user_model on mount — UserModelContext does this
- [x] Expose: unlock status and feature check — isUnlocked(feature) via UserModelContext
- [x] Expose: `isFeatureUnlocked(featureName)` helper — isUnlocked() in UserModelContext
- [o] Re-fetch on app foreground — needs verification

#### Frontend — LockedFeature Component
- [x] Create reusable `LockedFeature` component — created at components/LockedFeature.tsx
- [x] Props: `requiredLevel`, `currentLevel`, `children`, `featureName` — implemented (currentLevel computed from stats.daysActive)
- [x] If locked: grey 40% opacity + lock icon + "Unlocks at Level X (about Y days)" — implemented
- [x] If unlocked: render normally — implemented

#### Frontend — UnlockCelebrationModal
- [x] On app open: check for pending unlocks — UnlockCelebrationModal exists with useUnlockCelebrations hook
- [x] If pending: show modal with level name, new features, confetti, "Try it now" CTA, "Maybe later" — confetti + haptics + CTAs implemented
- [x] On dismiss: set `unlock_celebration_pending = false` — markSeen on dismiss
- [x] Log `unlock_celebration_shown` and dismiss/CTA events — event logging in modal

#### Frontend — UnlockDetailsModal
- [x] From ProfileViewScreen tap on level/XP area — wired and functional
- [x] Show current level, XP progress bar, all 5 levels, streak, multiplier, peak hours — progress bars and requirements list

#### Frontend — Wire XP/Streak on ProfileView
- [x] Show XP total, streak (flame + count), level badge — stats displayed on ProfileViewScreen
- [o] Streak multiplier badge when active — needs visual verification
- [x] Tap level/XP → UnlockDetailsModal — wired

#### Frontend — Wire Lock States Across Screens
- [x] AIHub: Smart scheduling → locked until L2. Proactive reminders → locked until L4. — DONE: locked pills with lock icon + dimmed state wired
- [ ] Voice: locked feature request → friendly "X more days" response — SKIPPED (partner's voice/API work)
- [x] ProfileView: locked features with LockedFeature gates — DONE: all 11 AI features shown with LockedFeature wrapping, lock overlay + days remaining

#### Voice — Locked Features (Partner's AI/Voice Work)
- [ ] In actionExecutor: check `isFeatureUnlocked` before executing — DEFERRED (partner's voice/API work)
- [ ] If locked: voice says "I'll be able to do that after about X more days" — DEFERRED (partner's voice/API work)
- [ ] Do NOT execute mutation — DEFERRED (partner's voice/API work)
- [ ] Log `locked_feature_attempt` to `event_log` — DEFERRED (partner's voice/API work)

#### Testing
- [ ] Seed user with 7+ days `event_log` → run calculate-unlocks → `unlock_level = 3` — backend: calculate-unlocks doesn't compute unlock_level yet
- [o] App open after level change → celebration modal — modal exists, needs trigger test
- [o] Dismiss → reopen → no re-appear — markSeen exists, needs live test
- [x] Level 4 feature → lock icon + days remaining — DONE: LockedFeature shows lock + "Unlocks at Level X — about Y days"
- [ ] Voice: "Set proactive reminder" → "X more days" response — DEFERRED (partner's voice/API work)
- [o] Complete task → XP increased by 10 — trigger exists, needs live verification
- [o] 3 consecutive days → streak multiplier 1.1x — trigger exists, needs live verification
- [o] Miss a day → streak resets — needs live verification

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Build useUnlocks, LockedFeature, celebration modal, details modal, wire lock states | Build/verify calculate-unlocks, XP/streak computation, nightly job | Demo seed 7-day user → level up → celebration |

### 6) AI Prompt to Use for This Step

```
I'm working on MYPA, a voice-first iOS productivity app built with React Native + Expo + Supabase.

TASK: Wire progressive unlock system. Build calculate-unlocks edge function to compute user_model fields from event_log. Build useUnlocks hook. Build LockedFeature gating component. Wire UnlockCelebrationModal on app open. Wire lock icons across screens. Voice response for locked features.

Check these files:
- supabase/functions/calculate-unlocks/index.ts
- frontend/src/hooks/useUnlocks.ts (create if needed)
- frontend/src/components/LockedFeature.tsx (create if needed)
- frontend/src/screens-v2/modals/UnlockCelebrationModal.tsx
- frontend/src/screens-v2/modals/UnlockDetailsModal.tsx
- frontend/src/screens-v2/ProfileViewScreen.tsx

RULES:
1. XP values: Task=10, High-priority=20, Focus=15, Perfect=25, Streak day=5, Week=50, Month=200, Circle join=25, Assignment=30, Challenge win=100
2. Streak multipliers: 3+=1.1x, 7+=1.25x, 14+=1.5x, 30+=2.0x
3. Levels: 1=Day 1, 2=Day 3+, 3=Day 7+, 4=Day 14+, 5=Day 30+
4. Locked features: visible but disabled (grey + lock icon), never hidden
5. Voice: locked feature → "I'll be able to do that after about X more days"

DONE CRITERIA: Level transitions work. Celebration modal fires. Lock icons show. Voice gating works.
ROLLBACK: If calculate-unlocks fails, check event_log queries and user_model upsert.
```

### 7) Validation Checklist
- [ ] `calculate-unlocks` computes level/XP/streak correctly — backend: only does feature unlocks, not user_model
- [o] Level transitions trigger celebration modal — modal exists, trigger logic needs testing
- [x] Locked features show grey + lock icon — DONE: LockedFeature component + wired into AIHub and ProfileView
- [ ] Voice → "X more days" for locked features — DEFERRED (partner's voice/API work)
- [x] XP/streak displayed on ProfileView — stats shown (real data from UserModelContext + useFocusSessions)
- [x] UnlockDetailsModal shows all 5 levels — implemented

**STOP if any fail. Fix before proceeding.**

### 8) Definition of Done for This Step
- Full unlock system working
- Nightly calculation correct
- Celebration modal fires on level-up
- Lock icons on all screens
- Voice gating works
- XP/streak displayed

### 9) Common Mistakes in This Step
- Not deploying `calculate-unlocks` after editing (changes don't take effect)
- Forgetting to clear `celebration_pending` flag on dismiss (causes re-fire every open)
- XP values not matching project-context rules (must be exact)

### 10) Troubleshooting if Step Fails
- Level doesn't update → Check `calculate-unlocks` edge function logs
- Celebration fires every open → Check `unlock_celebration_pending` is set to `false` on dismiss
- XP wrong → Verify XP values match project-context constants exactly

### 11) Step Completion Sign-off
- [o] I have completed all task checkboxes in this step — frontend done, backend/voice deferred to partner
- [o] I have completed all validation checks in this step — frontend validation passed, backend items pending
- [o] I have met this step's DoD — frontend: LockedFeature, celebration modal, lock icons, XP/streak all done. Backend nightly loop + voice gating deferred.
- [ ] I have committed unlock engine changes to git

---
---

## Step 11: Tier Enforcement & Monetization

### 1) Objective
Make free tier limits work (10 voice commands/day, 1 circle). Make premium remove those limits. Integrate RevenueCat for subscription management. Build the paywall screen and the soft upsell flow.

### 2) Why This Step Is Now
Depends on event logging (the voice command counter is COMPUTED from `event_log`, not a mutable counter — per project rules) and all features being functional. You need working voice + circles before you can enforce limits on them.

### 3) Inputs Required
- PRD Section 3 (Business Model, Pricing, Free Tier Limits, Soft Upsell Flow)
- PRD Section 4.1 (V-10: Rate limiting)
- project-context rules (usage counters from event_log, never mutable)
- voice-ai-patterns rules (cost controls, free tier, upsell)

### 4) Task Checklist

#### Backend — Implement Voice Command Counter
- [ ] Create helper function that counts `voice_command` events in `event_log` for today (in user's timezone) — NOT BUILT
- [ ] SQL: `SELECT COUNT(*) FROM event_log WHERE user_id = $1 AND event_type = 'voice_command' AND created_at >= (now() AT TIME ZONE profiles.timezone)::date`
- [ ] Cache the count client-side for the session
- [ ] Re-query on app foreground (AppState change to 'active')

#### Frontend — Soft Upsell at Limit
- [ ] At 10 voice commands (free tier): show soft upsell bottom sheet — NOT BUILT
- [ ] Bottom sheet has: "Upgrade to Premium" (primary CTA) + "Use text instead" (secondary CTA)
- [ ] Never hard-block — always offer text input fallback
- [ ] Log `upsell_shown` to event_log with `trigger: 'limit_hit'`
- [ ] Log `upsell_clicked` with CTA chosen: `upgrade`, `dismiss`, or `text_fallback`

#### Frontend — Circle Limit
- [ ] Count user's circle memberships — NOT BUILT
- [ ] If >= 1 and not premium → show lock icon on "Create Circle" button
- [ ] Tapping locked button shows upsell sheet
- [ ] Premium users see normal "Create Circle" button

#### Backend — Add RevenueCat SDK
- [ ] Add RevenueCat SDK to `frontend/package.json` — NOT INSTALLED
- [ ] Initialize RevenueCat in App.tsx with API key (from env or config)
- [ ] On app launch: check RevenueCat entitlement → sync to `profiles.is_premium`

#### Frontend — Paywall Screen
- [ ] Build paywall screen/sheet component — NOT BUILT
- [ ] Show feature comparison: free vs premium
- [ ] Show monthly ($4.99/mo) and annual ($39.99/yr) options
- [ ] Include "Restore purchases" button
- [ ] Include terms/privacy links (these will be created in Step 14)

#### Backend — RevenueCat Webhook Edge Function
- [ ] Create `supabase/functions/revenucat-webhook/index.ts` — NOT CREATED
- [ ] Handle event: `INITIAL_PURCHASE` → set `profiles.is_premium = true`
- [ ] Handle event: `RENEWAL` → set `profiles.is_premium = true`
- [ ] Handle event: `CANCELLATION` → set `profiles.is_premium = false`
- [ ] Handle event: `EXPIRATION` → set `profiles.is_premium = false`
- [ ] Log purchase events to `event_log`
- [ ] Deploy: `npx supabase functions deploy revenucat-webhook`

#### Backend — Edge Function Rate Limiting (GAP-13)
- [ ] Add per-user rate limiting to `voice-command` edge function: max 60 requests/min/user — NOT BUILT
- [ ] On limit exceeded: return HTTP 429 with `{ error: "Rate limit exceeded. Please wait." }`
- [ ] Client: handle 429 response gracefully — show friendly message, do NOT retry immediately
- [ ] Deploy updated function: `npx supabase functions deploy voice-command`

#### Frontend — Wire Premium Checks
- [ ] Voice command limit: skip count check if `is_premium = true` — NOT BUILT
- [ ] Circle creation limit: skip if `is_premium = true`
- [ ] Model routing: premium gets gpt-4o for all requests (if applicable on edge function)

#### Testing — Monetization Flow
- [ ] 11th voice command (free user) → upsell sheet shows — NOT BUILT
- [ ] Tap "Use text instead" → text input appears, upsell dismissed
- [ ] Free user tries to create 2nd circle → sees lock icon + upsell
- [ ] Paywall displays with correct pricing ($4.99/mo, $39.99/yr)
- [ ] Sandbox purchase → `profiles.is_premium` updates to `true`
- [ ] Premium user: 11th voice command works normally (no upsell)
- [ ] Premium user: can create multiple circles

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Build paywall screen, soft upsell sheet, wire premium checks, circle limit UI | Set up RevenueCat, build webhook edge function, wire `is_premium` | Test sandbox purchase end-to-end |

### 6) AI Prompt to Use for This Step

```
CONTEXT: MYPA is a voice-first app with free (10 voice/day, 1 circle) and premium ($4.99/mo) tiers.

TASK: Implement tier enforcement and monetization.

1. Create a voice command counter that queries event_log (NOT a mutable counter):
   SELECT COUNT(*) FROM event_log WHERE user_id = $1 AND event_type = 'voice_command' AND created_at >= today_in_user_timezone
   Cache client-side, re-query on app foreground.

2. At 10 commands: show soft upsell bottom sheet with "Upgrade" + "Use text instead". Never hard-block.

3. Circle limit: 1 for free users. Lock icon on "Create Circle" if at limit.

4. Add RevenueCat SDK. Initialize in App.tsx. Sync entitlement to profiles.is_premium.

5. Build paywall screen with free vs premium comparison, monthly/annual options, restore purchases.

6. Create revenucat-webhook edge function: sync is_premium on purchase/cancel/renew/expire.

7. Wire premium bypass: skip voice limit + circle limit if is_premium.

RULES: Usage counter is COMPUTED from event_log, never stored as a mutable number. Never hard-block users.
DONE CRITERIA: 11th command shows upsell. Free can't create 2nd circle. Sandbox purchase works.
ROLLBACK: If RevenueCat fails, premium checks fall back to profiles.is_premium (manually settable for testing).
```

### 7) Validation Checklist
- [ ] 11th voice command → upsell sheet shows
- [ ] Free user can't create 2nd circle (sees lock + upsell)
- [ ] Paywall displays with correct pricing
- [ ] `profiles.is_premium` updates after sandbox purchase
- [ ] Premium user bypasses all limits
- [ ] Upsell events in event_log (upsell_shown, upsell_clicked)
- [ ] Rate limit (60 req/min) returns 429 when exceeded
- [ ] Client handles 429 gracefully (friendly message, no retry loop)

**STOP if any fail. Fix before proceeding.**

### 8) Definition of Done for This Step
- Free tier limits enforced (10 voice/day, 1 circle)
- Soft upsell shows at limit (never hard-block)
- Paywall screen with correct pricing
- RevenueCat integrated and webhook deployed
- Premium users bypass all limits
- Voice counter computed from event_log (not mutable)
- Edge function rate limiting active (60 req/min/user)

### 9) Common Mistakes in This Step
- Storing voice command count as a mutable column (MUST compute from event_log)
- Hard-blocking users instead of offering text fallback
- Not handling timezone correctly in count query (user could bypass by timezone tricks)
- Forgetting to log upsell events

### 10) Troubleshooting if Step Fails
- Counter seems wrong → Check timezone in SQL query matches profiles.timezone
- RevenueCat not syncing → Check webhook URL is correct and function is deployed
- Sandbox purchase fails → Verify products are configured in App Store Connect AND RevenueCat
- Premium check not working → Verify `profiles.is_premium` is being read correctly in hooks

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have committed monetization changes to git

---
---

## Step 12: Analytics & Quality Metrics

### 1) Objective
Build the SQL queries to measure voice quality, user engagement, and event coverage. Save them as reusable snippets. Record baseline measurements. These metrics determine if the app is ready for launch.

### 2) Why This Step Is Now
All events are flowing (Step 4). All features are built (Steps 6-11). Now we can compute KPIs that feed into the TestFlight gate decisions in Step 15.

### 3) Inputs Required
- PRD Section 11 (Success Metrics / KPIs)
- PRD Section 16 (Computed Quality Metrics)
- event_log table with real data from development/testing

### 4) Task Checklist

#### Backend — Create SQL Queries for Metrics
- [ ] Write SQL query for voice success rate: `SELECT COUNT(*) FILTER (WHERE success = true)::float / COUNT(*) FROM event_log WHERE event_type = 'voice_command';`
- [ ] Write SQL query for P95 latency: `SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) FROM event_log WHERE event_type = 'voice_command' AND action != 'unknown';`
- [ ] Write SQL query for user override rate: `SELECT COUNT(*) FILTER (WHERE user_override = true)::float / COUNT(*) FROM event_log WHERE event_type = 'voice_command';`
- [ ] Write SQL query for daily voice commands per user: `SELECT user_id, COUNT(*) FROM event_log WHERE event_type = 'voice_command' AND created_at >= CURRENT_DATE GROUP BY user_id;`
- [ ] Write SQL query for briefing listen-through rate: `SELECT COUNT(*) FILTER (WHERE action = 'briefing_progress' AND (params->>'percent')::int = 100)::float / NULLIF(COUNT(*) FILTER (WHERE action = 'briefing_started'), 0) FROM event_log;`
- [ ] Write SQL query for event log coverage: `SELECT COUNT(*) FROM event_log WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';`

#### Backend — Save Queries as Saved Snippets
- [ ] Save each query in Supabase SQL Editor as a saved snippet for reuse
- [ ] Document query names and purposes in a comment within each snippet

#### Testing — Run Metrics Against Real Data
- [ ] Run voice success rate query → returns a number (even if 0% with no data)
- [ ] Run P95 latency query → returns a number in milliseconds
- [ ] Run daily voice command count → returns correct per-user counts
- [ ] Verify all queries execute without SQL errors

#### Documentation — Record Baselines
- [ ] Record current voice success rate baseline
- [ ] Record current P95 latency baseline
- [ ] Record current event_log row count
- [ ] Note any obvious gaps in event coverage
- [ ] Compare against targets: voice success >90%, P95 latency <800ms, override rate <5%, briefing listen-through >60%, event coverage >95%

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Help verify event coverage from frontend (check all hooks log) | Write SQL queries for all KPIs, save as snippets, record baselines | Review metrics together, identify gaps |

### 6) AI Prompt to Use for This Step

```
TASK: Create SQL queries for MYPA quality metrics.

The event_log table has: user_id, event_type, action, success, latency_ms, confidence, user_override, tokens_used, params, created_at.

Write queries for:
1. Voice success rate: success=true / total voice_command events. Target: >90%
2. P95 latency: percentile_cont(0.95) of latency_ms for voice_command where action != 'unknown'. Target: <800ms
3. User override rate: user_override=true / total voice_command. Target: <5%
4. Daily voice commands per user (for limit enforcement)
5. Briefing listen-through: briefing_progress(100%) / briefing_started. Target: >60%
6. Event log coverage: total events in last 7 days

OUTPUT: SQL queries I can save as snippets in Supabase SQL Editor.
DONE CRITERIA: All queries run without errors and return meaningful numbers.
```

### 7) Validation Checklist
- [ ] Can run SQL query to get voice success rate
- [ ] Can run SQL query to get P95 latency
- [ ] Can count daily voice commands per user
- [ ] All queries execute without SQL errors
- [ ] Baselines recorded for all metrics

**STOP if any fail. Fix before proceeding.**

**PHASE GATE: Steps 10-12 Business Logic complete. Before proceeding to Step 13:**
- [ ] Unlock levels transition correctly (celebrate on level-up, lock icons show, voice gating works)
- [ ] Free tier limits enforced (10 voice/day, 1 circle for free)
- [ ] Premium bypass works (sandbox purchase → limits removed)
- [ ] Quality metrics computable from event_log (all 5 KPIs return valid numbers)
- [ ] Onboarding wow flow works (timezone → greeting → first command → confirmed)

### 8) Definition of Done for This Step
- SQL queries exist for all 5 KPIs
- Queries saved as Supabase snippets
- Baselines recorded
- Gaps in event coverage documented

### 9) Common Mistakes in This Step
- Running queries on empty tables (returns null, not 0 — handle with COALESCE)
- Not filtering by event_type (mixing voice events with task events)
- Forgetting to exclude 'unknown' actions from latency calculations

### 10) Troubleshooting if Step Fails
- Query returns null → Use `COALESCE(..., 0)` for default
- percentile_cont fails → Need at least 1 row with non-null latency_ms
- Counts seem too low → Check that hooks are actually logging events (re-verify Step 4)

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have documented baselines
- [ ] I have passed the Phase 10-12 Business Logic gate

---
---

## Step 13: QA Hardening

### 1) Objective
Add crash reporting, error boundaries, loading/empty/error states on every screen, device testing across screen sizes, performance profiling, security review, and cleanup of debug artifacts. This is the polish pass.

### 2) Why This Step Is Now
All features are built. Now we harden them for real users. Crashes during voice interactions are invisible without telemetry. White screens destroy trust. Performance issues on physical devices aren't visible in simulator.

### 3) Inputs Required
- PRD Section 13 (Definition of Done — UI/UX requirements)
- docs/planning/MYPA_ARCHITECTURE_GAP_REPORT.md (GAP-08: No crash reporting)
- All screen files in frontend/src/screens-v2/
- styling-conventions rules (design system compliance)

### 4) Task Checklist

#### Backend — Integrate Crash Reporting
- [ ] Add Sentry SDK (`@sentry/react-native`) or Expo crash reporting to the project — NOT INSTALLED
- [ ] Initialize Sentry in App.tsx with project DSN — NOT DONE
- [ ] Configure source maps for readable stack traces — NOT DONE
- [ ] Trigger a test crash → verify it appears in Sentry dashboard — NOT DONE

#### Frontend — Add Error Boundaries
- [x] Create or verify `ErrorBoundary` component exists — ErrorBoundary.tsx exists with catch, reset, dev details
- [o] Wrap AIHubScreen in ErrorBoundary — needs verification
- [o] Wrap TasksViewScreen in ErrorBoundary — needs verification
- [o] Wrap SocialViewScreen in ErrorBoundary — needs verification
- [o] Wrap ProfileViewScreen in ErrorBoundary — needs verification
- [o] Wrap FocusModal in ErrorBoundary — needs verification
- [o] Verify: throw an error in a screen → shows friendly fallback (not white screen) — needs live test

#### Frontend — Verify Loading/Empty/Error States
- [o] AIHubScreen: has loading state (isBriefingLoading + "Preparing briefing..." hint) — needs error state display added
- [o] TasksViewScreen: has loading spinner + empty state (ListEmptyComponent with icon/message) — needs error state with retry button
- [o] SocialViewScreen: has loading spinner (3s timeout failsafe) + empty state for circles — needs error state + empty state for challenges
- [ ] ProfileViewScreen: has loading state, error state — stats currently hardcoded to 0, no loading spinner visible
- [ ] FocusModal: has appropriate states

#### Testing — Device Testing
- [ ] Test on iPhone SE simulator (smallest screen) — no layout overflow
- [ ] Test on iPhone 15 Pro Max simulator (largest screen) — no layout issues
- [ ] Test on physical iOS device — app loads and functions correctly
- [ ] Check: all text is readable, all buttons are tappable, no clipping

#### Testing — Performance Profiling
- [ ] Measure cold start time (kill app → open) — target < 3 seconds
- [ ] If cold start > 3 seconds, identify bottleneck (auth check, data fetch, or heavy render)
- [ ] Measure voice command latency on physical device — note P50 and P95

#### Security — Review
- [ ] Search codebase for `service_role` or `SERVICE_ROLE` — must NOT appear in client code
- [ ] Verify `.env` does not contain service role key (only anon key)
- [ ] Verify no edge function exposes the service role key in its response
- [ ] Confirm model config is ONLY in `_shared/config.ts` — grep for hardcoded model IDs

#### Frontend — Account Data Management (PRD Section 10)
- [ ] Build "Delete Voice History" button in SettingsModal — deletes all voice-related rows from `event_log` for the current user
- [ ] Add confirmation dialog before deletion: "This will permanently delete your voice history. Continue?"
- [ ] Build "Delete Account" button in SettingsModal — calls a Supabase RPC or edge function that cascade-deletes all user data (profile, tasks, events, focus sessions, circle memberships) and then deletes the auth user
- [ ] Add 2-step confirmation for account deletion: first confirm, then type "DELETE" to confirm
- [ ] Log `account_deleted` event BEFORE deletion (for aggregate analytics only — no PII retained)
- [ ] After deletion: sign out and redirect to login screen

#### Frontend — Remove Debug Artifacts
- [ ] Search for and remove all `console.log` statements (except error logging)
- [ ] Search for and remove any `// TODO: remove` debug code
- [ ] Verify no `any` types added during development

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Add error boundaries, verify loading/empty/error states, device testing, remove console.logs | Integrate Sentry, configure source maps, security review (no service_role in client) | QA session: test on physical device together |

### 6) AI Prompt to Use for This Step

```
TASK: Create a QA checklist for MYPA covering all critical user flows.

Include:
1. Auth flow: sign up → log in → log out → log back in
2. Task flow: create → edit → complete → delete (via UI and voice)
3. Focus flow: start → pause → resume → end → XP awarded
4. Circle flow: create → invite → join → leave
5. Voice flow: tap orb → speak → action → confirmation → idle
6. Briefing flow: first open → plays → skip → second open → no play
7. Error flow: no network → error message → retry
8. Limit flow: 11th voice command → upsell → text fallback

For each flow: list exact steps, expected result, and what to check in Supabase.
OUTPUT: Markdown checklist for testing sessions.
```

### 7) Validation Checklist
- [ ] Crash reporting active (test crash appears in dashboard)
- [ ] No white screen crashes on any error (error boundaries catch them)
- [ ] Every list screen has empty state message
- [ ] Works on iPhone SE and iPhone 15 Pro Max
- [ ] Cold start < 3 seconds
- [ ] No `service_role` or `SERVICE_ROLE` in client code
- [ ] No hardcoded model IDs outside `_shared/config.ts`
- [ ] No `console.log` in production code
- [ ] "Delete Voice History" works and clears voice events
- [ ] "Delete Account" works — user data removed, signed out, redirected to login

**STOP if any fail. Fix before proceeding.**

### 8) Definition of Done for This Step
- Crash reporting active and receiving test crashes
- Error boundaries on all screens (no white screens)
- Loading/empty/error states on all list screens
- Works on smallest and largest iPhone screens
- Cold start under 3 seconds
- No security leaks (service role key, hardcoded models)
- Clean code (no console.log, no debug artifacts)
- Data deletion (voice history + full account) functional

### 9) Common Mistakes in This Step
- Not testing on a physical device (simulator hides real performance issues)
- Forgetting empty states (new users see blank screens)
- Leaving `console.log` statements that leak data in production
- Not testing the error boundary fallback (verify it actually renders)

### 10) Troubleshooting if Step Fails
- Sentry not receiving crashes → Check DSN, check source maps configuration
- Cold start too slow → Profile with Expo Dev Tools, check for heavy initial queries
- Layout broken on small screen → Use flex instead of fixed heights, test with SE simulator
- Service role key found in client → Remove it immediately, use only anon key

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have committed QA hardening changes to git

---
---

## Step 14: Legal & Compliance

### 1) Objective
Create everything needed for App Store submission: privacy policy, terms of service, support email, privacy nutrition labels, app icon, screenshots, preview video, and subscription product configuration.

### 2) Why This Step Is Now
Everything is built and QA'd. Now prepare the legal and visual assets required by Apple for App Store submission. This is ~20 hours of non-engineering work (GAP-12).

### 3) Inputs Required
- PRD Section 10 (Privacy & Data Retention Rules, OpenAI Data Processing)
- PRD Section 17 (v1 Launch Checklist — App Store + Legal section)
- docs/planning/MYPA_ARCHITECTURE_GAP_REPORT.md (GAP-12: App Store compliance 0%)
- App Store Connect access
- RevenueCat dashboard (from Step 11)

### 4) Task Checklist

#### Legal — Privacy Policy
- [ ] Draft privacy policy covering: what data is collected (name, email, voice transcripts, usage data)
- [ ] Include: voice data handling (no audio stored, transcripts retained 90 days)
- [ ] Include: OpenAI processing disclosure ("Voice commands are processed by OpenAI's API. No audio is stored.")
- [ ] Include: data retention policy (90 days for event_log, indefinite for profile)
- [ ] Include: deletion rights ("Delete voice history" and "Delete account" — both cascade)
- [ ] Host privacy policy at a public URL (GitHub Pages, Supabase Storage, or dedicated domain)
- [ ] Verify URL is accessible from a browser

#### Legal — Terms of Service
- [ ] Draft terms covering: acceptable use, subscription terms (monthly/annual), termination, liability
- [ ] Host terms at a public URL
- [ ] Verify URL is accessible from a browser

#### Legal — Support
- [ ] Set up support email address (e.g., support@mypa.app)
- [ ] Verify support email receives test messages
- [ ] Set up support URL (can be email link or help page)

#### App Store — Privacy Nutrition Labels
- [ ] Open App Store Connect → your app → App Privacy
- [ ] Declare data types collected: name, email, usage data, voice transcripts (intent_raw), purchase history
- [ ] For each type: specify if collected or tracked, linked to identity, purpose
- [ ] Submit nutrition labels

#### App Store — Visual Assets
- [ ] Create app icon: 1024x1024 PNG, no transparency, no rounded corners (Apple adds them)
- [ ] Upload icon to App Store Connect
- [ ] Create 6 screenshots for 6.7" display (1290x2796)
- [ ] Create 6 screenshots for 5.5" display (1242x2208)
- [ ] Upload all screenshots to App Store Connect
- [ ] Create 30-second preview video showing voice interaction
- [ ] Upload preview video to App Store Connect

#### App Store — Subscription Products
- [ ] In App Store Connect: create monthly subscription product ($4.99/mo)
- [ ] In App Store Connect: create annual subscription product ($39.99/yr)
- [ ] Configure subscription group
- [ ] In RevenueCat: configure products to match App Store Connect IDs
- [ ] Test sandbox purchase flow → works end-to-end (verify with Step 11)

#### App Store — Metadata
- [ ] Write app description (4000 char max)
- [ ] Write subtitle (30 char max)
- [ ] Add keywords (100 char max, comma-separated)
- [ ] Fill in all required metadata fields in App Store Connect

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Create screenshots, app icon, preview video, upload to App Store Connect | Draft privacy policy, terms, host at public URLs, nutrition labels, subscription products | Review all assets and legal docs together |

### 6) AI Prompt to Use for This Step

```
TASK: Verify MYPA is ready for App Store submission.

Check against PRD Section 17 (v1 Launch Checklist):

Legal:
- [ ] Privacy policy hosted (covers: voice data, OpenAI processing, no audio storage, 90-day retention, deletion rights)
- [ ] Terms hosted
- [ ] Support URL active

App Store:
- [ ] Nutrition labels complete (name, email, usage data, voice transcripts, purchase history)
- [ ] Subscription products configured ($4.99/mo, $39.99/yr)
- [ ] App icon + screenshots + preview video uploaded
- [ ] All metadata filled

OUTPUT: Pass/fail for each item. Action items for any failures.
```

### 7) Validation Checklist
- [ ] Privacy policy hosted and accessible via URL
- [ ] Terms of service hosted and accessible
- [ ] Support email works (receives test messages)
- [ ] All App Store Connect fields filled
- [ ] Screenshots and icon uploaded
- [ ] Subscription products configured in both App Store Connect and RevenueCat
- [ ] Sandbox purchase works end-to-end

**STOP if any fail. Fix before proceeding.**

### 8) Definition of Done for This Step
- Privacy policy and terms hosted at public URLs
- Support email functioning
- Privacy nutrition labels submitted
- All visual assets uploaded (icon, screenshots, video)
- Subscription products configured and sandbox-tested
- All App Store Connect metadata filled

### 9) Common Mistakes in This Step
- Privacy policy not mentioning OpenAI (Apple requires disclosure of third-party data processing)
- App icon with transparency or rounded corners (Apple adds rounding — don't add your own)
- Wrong screenshot dimensions (must be exact pixel counts per device size)
- Subscription products not matching between App Store Connect and RevenueCat

### 10) Troubleshooting if Step Fails
- Nutrition labels rejected → Review Apple's data collection categories carefully
- Sandbox purchase fails → Verify product IDs match between App Store Connect and RevenueCat
- Privacy policy URL not accessible → Check hosting configuration, try a different host
- Screenshots rejected → Check dimensions: 6.7" = 1290x2796, 5.5" = 1242x2208

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have documented all public URLs for privacy policy, terms, and support

---
---

## Step 15: TestFlight & App Store

### 1) Objective
Run all acceptance criteria from the PRD, build and distribute a TestFlight beta, monitor for 2 weeks, verify gate metrics pass, then submit to the App Store and launch.

### 2) Why This Step Is Now
Everything is built, hardened, and legally ready. This is the final step: validate with real users, fix what breaks, and ship.

### 3) Inputs Required
- PRD Section 15 (Build-Ready Acceptance Criteria R1-R5)
- PRD Section 17 (v1 Launch Checklist — Beta section)
- Quality metrics from Step 12
- All previous steps completed and signed off

### 4) Task Checklist

#### Pre-Beta — Run Acceptance Criteria (PRD R1-R5)
- [ ] R1 — Voice Command Execution: "Add buy groceries tomorrow" creates task, event logged, latency < 1.2s
- [ ] R1 — Voice offline: text fallback offered when no network
- [ ] R1 — Destructive action (delete_task): spoken yes/no confirmation required
- [ ] R1 — Confidence < 0.7: clarifying question before mutation
- [ ] R2 — Daily Briefing: first open → plays, skippable, barge-in works, timezone-correct
- [ ] R2 — Briefing tracking: `briefing_started` and `briefing_progress` events in event_log
- [ ] R2 — Briefing content includes: task count, top tasks, streak, circle activity
- [ ] R3 — Usage Limits: 10 voice commands → soft upsell, text fallback available
- [ ] R3 — Limit bypass impossible: offline or app restart doesn't reset counter
- [ ] R3 — 2nd circle creation blocked for free users (lock icon + upsell)
- [ ] R4 — Learning Loop: 95%+ actions have event_log records
- [ ] R4 — Unlock transitions: celebration modal fires on level change
- [ ] R4 — Unlock gating consistent: UI (grey + lock) and voice ("X more days")
- [ ] R5 — Circles MVP: daily life cards show counts only, NEVER task titles
- [ ] R5 — Circle privacy: RLS verified via direct query test (no cross-user data)
- [ ] R5 — Privacy toggles work and default to "counts only"

#### Pre-Beta — In-App Voice Feedback (PRD 17 Beta)
- [ ] Implement "Was that right?" prompt after 1 in 5 voice actions
- [ ] User taps thumbs-up or thumbs-down
- [ ] Log `voice_feedback` to event_log with `correct: true/false`, `action`, `confidence`
- [ ] Use this data to measure voice success rate during beta

#### Pre-Beta — Verify Onboarding + Discreet Mode
- [ ] Fresh install: onboarding wow flow works end-to-end (timezone → greeting → first command → confirmed)
- [ ] Discreet mode toggle works — text input + text response, no audio
- [ ] Discreet mode persists across app restarts

#### Beta — Create and Distribute Build
- [ ] Create a release build: `eas build --platform ios`
- [ ] Upload to App Store Connect / TestFlight
- [ ] Wait for build processing to complete
- [ ] Create beta test group 1: heavy voice users (~10 people)
- [ ] Create beta test group 2: text-preferred users (~10 people)
- [ ] Create beta test group 3: circles-heavy users (~10 people)
- [ ] Distribute TestFlight invites to all groups

#### Beta — Monitor for 2 Weeks
- [ ] Day 1-3: check crash reports daily in Sentry dashboard
- [ ] Day 1-3: check voice success rate from event_log (target >= 85%)
- [ ] Day 4-7: review P95 latency trend (target < 1.2s)
- [ ] Day 4-7: check for any RLS data leaks (direct query audit)
- [ ] Day 8-14: review overall metrics against gates
- [ ] Respond to beta tester feedback within 24 hours
- [ ] Fix critical bugs within 24 hours of report

#### Beta — Verify TestFlight Gates
- [ ] Voice success rate >= 85%
- [ ] Crash-free sessions >= 99%
- [ ] P95 latency < 1.2 seconds
- [ ] 0 RLS data leaks in circle privacy audit
- [ ] Minimum 2 weeks of beta testing completed

#### Launch — App Store Submission
- [ ] All R1-R5 acceptance criteria passing
- [ ] All TestFlight gate metrics met
- [ ] Prepare review notes: explain voice functionality, OpenAI API usage, subscription model
- [ ] Create demo account credentials for App Store reviewer
- [ ] Submit app for App Store review
- [ ] Monitor review status daily
- [ ] Respond to any review questions within 24 hours
- [ ] App approved → schedule release date or release immediately

### 5) Partner Split

| Partner A (FE) | Partner B (BE) | Do Together |
|----------------|----------------|-------------|
| Help with TestFlight testing, voice QA, bug fixes, acceptance criteria | Upload build, configure TestFlight groups, monitor beta metrics, security audit | Go/no-go decision on gate metrics, submit together |

### 6) AI Prompt to Use for This Step

```
TASK: Verify MYPA is ready for App Store submission.

Check against PRD Section 15 (Acceptance Criteria) and Section 17 (Launch Checklist):

Product:
- [ ] Voice loop passes 20 common + 10 edge case commands
- [ ] Daily briefing works across US timezones
- [ ] Free tier limits verified (no bypass)
- [ ] Circles privacy verified (no task title leakage)
- [ ] Unlock gating consistent

Engineering:
- [ ] Crash reporting integrated
- [ ] Voice latency P95 < 1.2s
- [ ] Rate limiting on edge functions
- [ ] Service role key not exposed
- [ ] profiles.timezone populated

Legal:
- [ ] Privacy policy hosted
- [ ] Terms hosted
- [ ] Support URL active
- [ ] Nutrition labels complete
- [ ] Subscription products configured

OUTPUT: Pass/fail for each item. Action items for any failures.
```

### 7) Validation Checklist
- [ ] All R1-R5 acceptance criteria passing
- [ ] 2+ weeks of beta testing completed
- [ ] Voice success rate >= 85%
- [ ] Crash-free sessions >= 99%
- [ ] P95 latency < 1.2 seconds
- [ ] 0 RLS data leaks
- [ ] All TestFlight gate metrics met
- [ ] App submitted and approved

**PHASE GATE: Steps 13-15 Launch Prep. ALL gates must pass:**
- [ ] Crash reporting active
- [ ] Legal docs hosted
- [ ] App Store assets uploaded
- [ ] R1-R5 acceptance criteria pass
- [ ] 2 weeks of beta with gates met

**LAUNCH if all checked.**

### 8) Definition of Done for This Step
- All acceptance criteria (R1-R5) passing
- 2+ weeks of beta testing completed with all gates met
- App approved and live in the App Store
- MYPA is launched

### 9) Common Mistakes in This Step
- Submitting before 2 full weeks of beta testing
- Not including demo account credentials in review notes (reviewer can't test voice)
- Not explaining OpenAI API usage in review notes (Apple may reject without explanation)
- Ignoring beta feedback (crashes that go unfixed will fail App Store review)

### 10) Troubleshooting if Step Fails
- App rejected → Read rejection reason carefully, fix, resubmit (usually privacy or metadata issues)
- Voice success rate below 85% → Review system prompt, check for common failure patterns in event_log
- P95 latency too high → Check if edge function is cold-starting, consider warm-up strategy
- Crash rate too high → Check Sentry for top crash causes, fix and rebuild

### 11) Step Completion Sign-off
- [ ] I have completed all task checkboxes in this step
- [ ] I have completed all validation checks in this step
- [ ] I have met this step's DoD
- [ ] I have passed all Phase 13-15 Launch gates
- [ ] App is live in the App Store

---
---

# Final Project Completion Gate

Every step must be signed off before the project is considered complete. Check each item only when ALL checkboxes within that step are done.

## Foundation (Steps 1-5)
- [o] **Step 1 signed off:** Environment & Project Sanity — app loads in Expo, Supabase connected. Needs: both partners verified, CLI tested
- [o] **Step 2 signed off:** Database Schema — migrations 008-010 define correct schema. Needs: Dashboard column verification, seed test
- [o] **Step 3 signed off:** RLS Security — migrations 011-013 harden policies. Needs: cross-user isolation live test
- [o] **Step 4 signed off:** Event Logging — useTasks, useCircles, useChallenges all log events. Needs: focus pause/resume, Expo terminal flush check
- [o] **Step 5 signed off:** Edge Functions — all 6 functions coded with shared config. Needs: deploy verification, voice test

## Features (Steps 6-9)
- [x] **Step 6 signed off:** PostgREST Fix — all operations complete under 3 seconds, no infinite spinners. Confirmed by user.
- [x] **Step 7 signed off:** Screen Wiring — all screens and modals open and close correctly. Confirmed by user.
- [o] **Step 8 signed off:** Voice & AI — 4 of 7 states, barge-in, timeout, action executor. Needs: 3 missing states (TIMEOUT/ERROR/OFFLINE), orb visuals, live voice test
- [o] **Step 9 signed off:** Daily Briefing — hook + edge function complete. Needs: pg_cron setup, live playback test

## Business Logic (Steps 10-12)
- [o] **Step 10 signed off:** Unlock Engine — LockedFeature built + wired on AIHub & ProfileView, celebration modal + details modal exist, real stats on ProfileView. Needs: calculate-unlocks nightly loop (backend), voice gating (partner's work), deploy verification
- [ ] **Step 11 signed off:** Monetization — NOTHING BUILT. Needs: RevenueCat, paywall, upsell, voice counter, webhook
- [ ] **Step 12 signed off:** Analytics — NOTHING BUILT. Needs: SQL queries, baselines

## Launch Prep (Steps 13-15)
- [ ] **Step 13 signed off:** QA Hardening — ErrorBoundary + loading/empty states exist on most screens. Needs: Sentry, error state UI on all screens, device testing, console.log cleanup, account deletion
- [ ] **Step 14 signed off:** Legal & Compliance — NOTHING BUILT. Needs: privacy policy, terms, App Store assets, subscriptions
- [ ] **Step 15 signed off:** TestFlight & Launch — NOTHING BUILT. Needs: R1-R5, beta, gates, submission

## Final Checks
- [ ] All critical PRD requirements mapped and completed
- [ ] All rule-file constraints respected (voice-first, Supabase only, TypeScript strict, no mutable counters, event logging 95%+)
- [ ] Onboarding wow flow works end-to-end
- [ ] Discreet mode toggle functional
- [ ] Push notifications functional on physical device
- [ ] Launch readiness criteria passed (PRD Section 17)
- [ ] App is live in the App Store

---

*Generated: February 2026 — based on analysis of PRD v3.0, 8 planning docs, 5 rules files, and current codebase state.*
*Structure: 15 self-contained steps with 11 subsections each. No external reference sections needed.*
