# MYPA — Remaining Implementation Plan

## From ~60% to App Store Launch

Generated: 16 February 2026
Based on: MYLO PLAN audit + full codebase analysis

---

## How to Use This Plan

- **4 phases, strict order.** Each phase has numbered tasks.
- **Each task is self-contained** — files to edit, what to do, done criteria.
- **Estimate: ~80–100 hours of work** across both partners.
- **Priority:** 🔴 = launch blocker, 🟡 = important, 🟢 = nice-to-have (can ship without)

---

## Phase 1: Backend & Infrastructure Gaps (~25 hours)

These are foundational — features and launch prep depend on them.

---

### 1.1 🔴 Focus Pause/Resume Persistence

**Problem:** FocusModal has pause/resume UI but it's client-side only. `useFocusSessions.ts` has no `pauseSession` / `resumeSession` functions. Pauses aren't persisted to Supabase.

**Files to edit:**
- `frontend/src/hooks/supabase/useFocusSessions.ts`
- `frontend/src/screens-v2/FocusModal/FocusModal.tsx`

**Tasks:**
- [ ] Add migration: `ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS total_paused_ms INTEGER DEFAULT 0;`
- [ ] Add `pauseSession(sessionId)` to `useFocusSessions.ts` — updates `paused_at = now()`, logs `focus_paused` event
- [ ] Add `resumeSession(sessionId)` to `useFocusSessions.ts` — computes pause duration, adds to `total_paused_ms`, clears `paused_at`, logs `focus_resumed` event
- [ ] Wire FocusModal's `togglePause()` to call `pauseSession` / `resumeSession` instead of just toggling local state
- [ ] Ensure `endSession` accounts for `total_paused_ms` in final duration calculation

**Done:** Pause → resume → end session → DB shows correct paused time + events logged.

---

### 1.2 🔴 user_model Nightly Computation

**Problem:** The `user_model` table exists (migration 009) with columns like `peak_hours`, `completion_rate_7d`, `overwhelm_score`, but **nothing writes to them**. `calculate-unlocks` only handles feature unlock checks.

**Files to create/edit:**
- `supabase/functions/compute-user-model/index.ts` (NEW)
- `supabase/functions/_shared/config.ts` (add CORS import)

**Tasks:**
- [ ] Create new edge function `compute-user-model` that for each user:
  - Queries `event_log` for last 30 days
  - Computes `peak_hours`: group task completions by hour → top 3 hours as JSONB array
  - Computes `completion_rate_7d`: tasks completed / tasks created in last 7 days
  - Computes `completion_rate_30d`: same for 30 days
  - Computes `overwhelm_score`: (overdue tasks + deferred tasks) / total active tasks (0.0–1.0)
  - Computes `voice_usage_rate`: voice_command events / total action events
  - Computes `avg_task_durations`: average focus session duration per task category as JSONB
  - Computes `avg_daily_tasks`: total tasks created / distinct active days
  - Computes `common_reschedule_patterns`: most common reschedule day/time shifts as JSONB
  - Sets `last_calculated_at = now()`
  - Upserts all fields into `user_model` for each user
- [ ] Deploy: `npx supabase functions deploy compute-user-model`
- [ ] Test with current user data — verify `user_model` row is populated

**Done:** Edge function runs → `user_model` has real computed values for the current user.

**Note:** This will be called by pg_cron nightly (Task 1.3) or manually for now.

---

### 1.3 🟡 pg_cron Setup

**Problem:** No automated nightly jobs. Briefing pre-generation, unlock calculation, user_model computation, and event cleanup all need cron.

**Prerequisite:** Supabase Pro plan ($25/mo) for pg_cron access.

**Files to create:**
- `supabase/migrations/024_cron_jobs.sql` (NEW)

**Tasks:**
- [ ] Upgrade Supabase project to Pro plan
- [ ] Verify pg_cron is enabled: `SELECT * FROM cron.job;`
- [ ] Create migration `024_cron_jobs.sql` with:
  ```sql
  -- Nightly user model computation (2 AM UTC)
  SELECT cron.schedule('compute-user-models', '0 2 * * *',
    $$SELECT net.http_post(
      url := 'https://<project>.supabase.co/functions/v1/compute-user-model',
      headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
    )$$
  );

  -- Nightly unlock calculation (2:30 AM UTC)
  SELECT cron.schedule('calculate-unlocks', '30 2 * * *',
    $$SELECT net.http_post(
      url := 'https://<project>.supabase.co/functions/v1/calculate-unlocks',
      headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
    )$$
  );

  -- Hourly briefing pre-generation (for users at 6 AM local)
  SELECT cron.schedule('pre-generate-briefings', '0 * * * *',
    $$SELECT net.http_post(
      url := 'https://<project>.supabase.co/functions/v1/daily-brief',
      headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
      body := '{"pregenerate": true}'::jsonb
    )$$
  );

  -- 90-day event log cleanup (3 AM UTC daily)
  SELECT cron.schedule('cleanup-old-events', '0 3 * * *',
    $$DELETE FROM event_log WHERE created_at < now() - INTERVAL '90 days'$$
  );
  ```
- [ ] Run `npx supabase db push`
- [ ] Verify jobs in `cron.job` table

**Done:** 4 cron jobs active. `user_model` updates nightly. Old events cleaned.

---

### 1.4 🟡 Edge Function Rate Limiting

**Problem:** `voice-command` has no per-user rate limiting. Free tier "10 voice/day" is only enforced client-side (bypassable).

**Files to edit:**
- `supabase/functions/voice-command/index.ts`

**Tasks:**
- [ ] At the top of the function, after auth check, add rate limit logic:
  ```typescript
  // Count today's voice commands for this user
  const { count } = await supabase
    .from('event_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'voice_command')
    .gte('created_at', todayStart); // today in user's timezone

  // Check if premium
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', userId)
    .single();

  if (!profile?.is_premium && count >= 10) {
    return new Response(JSON.stringify({ error: 'Daily voice limit reached', code: 'VOICE_LIMIT' }), {
      status: 429, headers: CORS_HEADERS
    });
  }

  // Also enforce 60 req/min burst limit
  const { count: minuteCount } = await supabase
    .from('event_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'voice_command')
    .gte('created_at', oneMinuteAgo);

  if (minuteCount >= 60) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded', code: 'RATE_LIMIT' }), {
      status: 429, headers: CORS_HEADERS
    });
  }
  ```
- [ ] In `VoiceContext.tsx`, handle 429 response → show `SoftUpsellSheet` or rate limit message
- [ ] Deploy: `npx supabase functions deploy voice-command`

**Done:** 11th voice command (free user) returns 429 server-side. Client shows upsell.

---

### 1.5 🟡 Deploy All Edge Functions

**Problem:** Code exists for 14 edge functions but deployment status is unverified.

**Tasks:**
- [ ] Run each deploy command and note success/failure:
  ```bash
  npx supabase functions deploy voice-command
  npx supabase functions deploy daily-brief
  npx supabase functions deploy calculate-unlocks
  npx supabase functions deploy ai-greeting
  npx supabase functions deploy send-push
  npx supabase functions deploy text-to-speech
  npx supabase functions deploy elevenlabs-signed-url
  npx supabase functions deploy elevenlabs-webhook
  npx supabase functions deploy pronunciation-dict
  npx supabase functions deploy scribe-token
  npx supabase functions deploy voice-isolate
  npx supabase functions deploy analytics-summary
  npx supabase functions deploy task-completed
  npx supabase functions deploy compute-user-model
  ```
- [ ] Verify Supabase secrets are set: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`
- [ ] Test `voice-command` from the app (tap orb → speak → action executes)
- [ ] Test `daily-brief` (first open of day → briefing plays)

**Done:** All functions deployed. Voice command and briefing work end-to-end.

---

## Phase 2: Feature Completions (~30 hours)

Frontend features that are partially built or missing entirely.

---

### 2.1 🔴 Onboarding Flow

**Problem:** No first-run experience. User opens app → goes straight to AI Hub. PRD requires: timezone detection → AI greeting → first voice command → "You're all set."

**Files to create/edit:**
- `frontend/src/screens-v2/Onboarding/OnboardingScreen.tsx` (NEW)
- `frontend/src/screens-v2/Onboarding/index.ts` (NEW)
- `frontend/App.tsx` (add onboarding gate)

**Tasks:**
- [ ] Create `OnboardingScreen.tsx` with 3-step flow:
  - **Step 1 — Welcome:** "Hi, I'm MYPA" animation + auto-detect timezone from device → display → let user override → save to `profiles.timezone`
  - **Step 2 — Voice intro:** Call `ai-greeting` edge function → play TTS greeting → show transcript
  - **Step 3 — First command:** Prompt "Try saying 'Add buy groceries tomorrow'" → user taps orb → speaks → task created → "Done! You're all set." confetti
  - Total target: ~45 seconds
- [ ] On completion: update `profiles.onboarding_complete = true` via Supabase
- [ ] Log `onboarding_completed` to `event_log` with `duration_ms`
- [ ] In `App.tsx`, inside `AppContent`: after auth check, if `user.profile?.onboarding_complete !== true` → render `OnboardingScreen` instead of `GestureNavigator`
- [ ] Skip onboarding on subsequent opens (profile flag persists)

**Done:** Fresh install → 3-step onboarding → AI Hub. Subsequent opens skip straight to AI Hub.

---

### 2.2 🔴 Account Deletion (Apple Requirement)

**Problem:** "Delete Account" button shows placeholder alerts but does nothing. Apple requires functional account deletion for App Store approval.

**Files to create/edit:**
- `supabase/functions/delete-account/index.ts` (NEW)
- `frontend/src/screens-v2/settings/SettingsScreen.tsx`

**Tasks:**
- [ ] Create `delete-account` edge function (uses SERVICE_ROLE_KEY):
  ```typescript
  // 1. Delete from: event_log, tasks, focus_sessions, circle_members,
  //    challenge_participants, brain_dump_items, notifications,
  //    conversation_history, unlocks, user_model
  // 2. Delete from profiles
  // 3. Delete auth user via admin.deleteUser(userId)
  // All in a transaction
  ```
- [ ] Deploy: `npx supabase functions deploy delete-account`
- [ ] In `SettingsScreen.tsx`, update the Delete Account handler:
  - Step 1: Alert "Are you sure? This permanently deletes all your data."
  - Step 2: Alert with text input — type "DELETE" to confirm
  - Step 3: Call `delete-account` edge function
  - Step 4: Log `account_deleted` event (before deletion)
  - Step 5: Call `signOut()` → redirect to login
- [ ] Add "Delete Voice History" button above Delete Account:
  - Confirmation dialog → deletes all `event_log` rows where `event_type = 'voice_command'` for current user
  - Log `voice_history_deleted` event

**Done:** Delete Account → 2-step confirm → all data removed → signed out. Delete Voice History → confirmed → voice events cleared.

---

### 2.3 🟡 Circle Privacy Toggles

**Problem:** PRD 4.4 requires per-circle privacy settings: "counts only" (default), option to share/hide task count, focus minutes, streak. Currently no privacy toggle UI exists.

**Files to edit:**
- `frontend/src/screens-v2/settings/SettingsScreen.tsx`
- `supabase/migrations/025_circle_privacy.sql` (NEW)

**Tasks:**
- [ ] Create migration to add privacy columns:
  ```sql
  ALTER TABLE circle_members ADD COLUMN IF NOT EXISTS share_task_count BOOLEAN DEFAULT true;
  ALTER TABLE circle_members ADD COLUMN IF NOT EXISTS share_focus_minutes BOOLEAN DEFAULT true;
  ALTER TABLE circle_members ADD COLUMN IF NOT EXISTS share_streak BOOLEAN DEFAULT true;
  ```
- [ ] Add "Circle Privacy" section to SettingsScreen with toggles:
  - "Share task count with circles" (default ON)
  - "Share focus minutes with circles" (default ON)
  - "Share streak with circles" (default ON)
  - Note: "Task titles are never shared"
- [ ] Wire toggles to update `circle_members` rows for the current user
- [ ] Update circle daily cards to respect these flags (filter out hidden stats)

**Done:** Toggles work. Turning off "share streak" → circle members don't see your streak.

---

### 2.4 🟡 Voice Gating for Locked Features

**Problem:** When user requests a locked feature via voice, the action executor should respond "I'll be able to do that after about X more days" instead of executing.

**Files to edit:**
- `frontend/src/services/actionExecutor.ts`
- `frontend/src/contexts/UserModelContext.tsx` (or wherever `isUnlocked` lives)

**Tasks:**
- [ ] Import `isUnlocked` check into `actionExecutor.ts`
- [ ] Before executing any action, check if the action's required feature is unlocked:
  ```typescript
  const FEATURE_REQUIREMENTS: Record<string, { feature: string; level: number }> = {
    'smart_schedule': { feature: 'ai_sorting', level: 2 },
    'proactive_reminder': { feature: 'proactive_alerts', level: 4 },
    'predictive_planning': { feature: 'predictive_tasks', level: 5 },
    // ... map all gated actions
  };
  ```
- [ ] If locked: return `{ success: false, message: "I'll be able to do that after about X more days of use together" }` — DO NOT execute mutation
- [ ] Log `locked_feature_attempt` to `event_log` with `{ action, required_level, current_level }`
- [ ] Voice reads the friendly message aloud

**Done:** "Set proactive reminder" (Level 4 feature, user is Level 2) → "I'll be able to do that after about 11 more days."

---

### 2.5 🟡 ProfileView Loading/Empty/Error States

**Problem:** ProfileViewScreen renders immediately with 0/fallback values. No loading spinner, no error state, no retry.

**Files to edit:**
- `frontend/src/screens-v2/ProfileView/ProfileViewScreen.tsx`

**Tasks:**
- [ ] Add loading state: show skeleton/shimmer cards while `userModel` and `focusSessions` are loading
- [ ] Add error state: if `userModel` or profile fetch fails → show error card with retry button (same pattern as TasksViewScreen)
- [ ] Ensure stats show "—" instead of "0" while loading

**Done:** Profile shows skeleton → data loads → real stats. Error → retry button → recovers.

---

### 2.6 🟡 SocialView Error State

**Problem:** SocialViewScreen has loading + empty state but no error state UI. If fetch fails, user sees empty state (misleading).

**Files to edit:**
- `frontend/src/screens-v2/SocialView/SocialViewScreen.tsx`

**Tasks:**
- [ ] Destructure `error` from `useCircles` and `useChallenges` hooks
- [ ] Add error state UI (similar to TasksViewScreen): cloud-offline icon, "Couldn't load circles", retry button
- [ ] Show error state if either hook has an error AND data is empty

**Done:** Network error → "Couldn't load circles" with retry → tap retry → data loads.

---

### 2.7 🟡 Voice Feedback ("Was that right?")

**Problem:** PRD 17 Beta requires a "Was that right?" prompt after 1 in 5 voice actions to measure quality during beta.

**Files to create/edit:**
- `frontend/src/components/VoiceFeedbackPrompt.tsx` (NEW)
- `frontend/src/contexts/VoiceContext.tsx`

**Tasks:**
- [ ] Create `VoiceFeedbackPrompt` component: small bottom toast with "Was that right?" + 👍 / 👎 buttons
- [ ] In VoiceContext, after successful action execution, increment a counter
- [ ] Every 5th action: show `VoiceFeedbackPrompt`
- [ ] On thumbs up: log `voice_feedback` event with `{ correct: true, action, confidence }`
- [ ] On thumbs down: log `voice_feedback` event with `{ correct: false, action, confidence }`
- [ ] Auto-dismiss after 5 seconds if no response
- [ ] Only show during beta (gate behind a config flag or remote config)

**Done:** Every 5th voice command → "Was that right?" → tap 👍/👎 → event logged.

---

### 2.8 🟡 Analytics SQL Queries & Baselines

**Problem:** Step 12 requires saved SQL queries for 5 KPIs with baseline measurements.

**Files to create:**
- `docs/analytics_queries.sql` (NEW)

**Tasks:**
- [ ] Write and save in Supabase SQL Editor:
  1. **Voice success rate:** `SELECT COALESCE(COUNT(*) FILTER (WHERE success = true)::float / NULLIF(COUNT(*), 0), 0) FROM event_log WHERE event_type = 'voice_command';`
  2. **P95 latency:** `SELECT COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) FROM event_log WHERE event_type = 'voice_command' AND action != 'unknown';`
  3. **User override rate:** `SELECT COALESCE(COUNT(*) FILTER (WHERE user_override = true)::float / NULLIF(COUNT(*), 0), 0) FROM event_log WHERE event_type = 'voice_command';`
  4. **Daily voice commands per user:** `SELECT user_id, COUNT(*) FROM event_log WHERE event_type = 'voice_command' AND created_at >= CURRENT_DATE GROUP BY user_id;`
  5. **Briefing listen-through rate:** `SELECT COALESCE(COUNT(*) FILTER (WHERE action = 'briefing_progress' AND (params->>'percent')::int = 100)::float / NULLIF(COUNT(*) FILTER (WHERE action = 'briefing_started'), 0), 0) FROM event_log;`
  6. **Event coverage (last 7 days):** `SELECT COUNT(*) FROM event_log WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';`
- [ ] Also save these as `docs/analytics_queries.sql` in the repo
- [ ] Run each query → record current baseline values
- [ ] Note: Targets are voice success >90%, P95 <800ms, override <5%, briefing listen >60%

**Done:** All 6 queries saved. Baselines recorded. Gaps documented.

---

## Phase 3: Monetization & Crash Reporting (~20 hours)

---

### 3.1 🔴 RevenueCat Integration

**Problem:** PaywallSheet and SoftUpsellSheet exist as UI but have no payment backend. "Subscribe" buttons do nothing.

**Prerequisites:** RevenueCat account, App Store Connect subscription products created.

**Files to create/edit:**
- `frontend/package.json` (add dependency)
- `frontend/App.tsx` (init SDK)
- `frontend/src/screens-v2/modals/PaywallSheet.tsx`
- `frontend/src/screens-v2/modals/SoftUpsellSheet.tsx`
- `frontend/src/contexts/SupabaseAuthContext.tsx`
- `supabase/functions/revenucat-webhook/index.ts` (NEW)

**Tasks:**

**SDK Setup:**
- [ ] Install: `npx expo install react-native-purchases`
- [ ] In `App.tsx`, initialize RevenueCat after auth:
  ```typescript
  import Purchases from 'react-native-purchases';
  Purchases.configure({ apiKey: 'appl_XXXXXXXX' });
  ```
- [ ] On app launch, check entitlement:
  ```typescript
  const customerInfo = await Purchases.getCustomerInfo();
  const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
  ```
- [ ] Sync `isPremium` to `profiles.is_premium` in Supabase
- [ ] Update `SupabaseAuthContext` to call this on auth + app foreground

**PaywallSheet:**
- [ ] Replace TODO in `handleSubscribe`:
  ```typescript
  const offerings = await Purchases.getOfferings();
  const pkg = selectedPlan === 'annual'
    ? offerings.current?.annual
    : offerings.current?.monthly;
  const { customerInfo } = await Purchases.purchasePackage(pkg!);
  // Update profile
  ```
- [ ] Replace TODO in `handleRestore`:
  ```typescript
  const customerInfo = await Purchases.restorePurchases();
  const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
  // Update profile
  ```

**Webhook:**
- [ ] Create `revenucat-webhook/index.ts`:
  - Verify webhook signature
  - Handle events: `INITIAL_PURCHASE` / `RENEWAL` → `is_premium = true`
  - Handle events: `CANCELLATION` / `EXPIRATION` → `is_premium = false`
  - Log purchase events to `event_log`
- [ ] Deploy: `npx supabase functions deploy revenucat-webhook`
- [ ] Configure webhook URL in RevenueCat dashboard

**App Store Connect:**
- [ ] Create subscription group "MYPA Premium"
- [ ] Create monthly product: `mypa_monthly` — £4.99/mo
- [ ] Create annual product: `mypa_annual` — £39.99/yr
- [ ] Configure products in RevenueCat dashboard
- [ ] Test sandbox purchase end-to-end

**Done:** Subscribe → payment → `is_premium = true` → limits removed. Cancel → `is_premium = false` → limits re-applied.

---

### 3.2 🔴 Sentry Crash Reporting

**Problem:** No crash reporting. Crashes are invisible. GAP-08 flagged this.

**Files to edit:**
- `frontend/package.json`
- `frontend/App.tsx`
- `frontend/src/components/ErrorBoundary.tsx`

**Tasks:**
- [ ] Install: `npx expo install @sentry/react-native`
- [ ] Create Sentry project at sentry.io → get DSN
- [ ] Initialize in `App.tsx` at the top level (before providers):
  ```typescript
  import * as Sentry from '@sentry/react-native';
  Sentry.init({
    dsn: 'https://xxx@sentry.io/xxx',
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
  });
  ```
- [ ] Wrap app export: `export default Sentry.wrap(App);`
- [ ] In `ErrorBoundary.tsx`, replace the TODO with: `Sentry.captureException(error);`
- [ ] Configure source maps in `app.json` or `eas.json` for readable stack traces
- [ ] Trigger a test crash → verify it appears in Sentry dashboard
- [ ] Add user context: `Sentry.setUser({ id: userId })` after auth

**Done:** App crash → Sentry dashboard shows crash with stack trace + user ID.

---

### 3.3 🟢 Per-Screen Error Boundaries

**Problem:** Currently one `ErrorBoundary` wraps the entire app. A crash in one screen takes down everything.

**Files to edit:**
- `frontend/src/screens-v2/GestureNavigator.tsx`

**Tasks:**
- [ ] Wrap each screen view in its own `ErrorBoundary`:
  ```tsx
  <ErrorBoundary><AIHubScreen /></ErrorBoundary>
  <ErrorBoundary><TasksViewScreen /></ErrorBoundary>
  <ErrorBoundary><SocialViewScreen /></ErrorBoundary>
  <ErrorBoundary><ProfileViewScreen /></ErrorBoundary>
  ```
- [ ] Each boundary shows per-screen fallback (can still swipe to other screens)

**Done:** Crash in Tasks screen → Tasks shows error fallback, other screens still work.

---

## Phase 4: Launch Prep (~25 hours)

---

### 4.1 🔴 Code Cleanup

**Files:** All frontend source files

**Tasks:**
- [ ] Search and remove all `console.log` statements: `grep -rn "console.log" frontend/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules`
- [ ] Search and remove `// TODO: remove` debug code
- [ ] Search for `any` types: `grep -rn ": any" frontend/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules` — fix where possible
- [ ] Search for `service_role` or `SERVICE_ROLE` in client code — must return 0 results
- [ ] Search for hardcoded model IDs outside `_shared/config.ts`
- [ ] Verify `.env` has only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Done:** Clean codebase. No debug artifacts. No security leaks.

---

### 4.2 🔴 Device Testing

**Tasks:**
- [ ] Test on iPhone SE simulator (smallest screen):
  - All text readable, no clipping
  - All buttons tappable (min 44pt)
  - Modals don't overflow
  - Gesture navigation works
- [ ] Test on iPhone 15 Pro Max simulator (largest screen):
  - No excessive whitespace
  - Layout fills appropriately
  - Dynamic Island doesn't overlap content
- [ ] Test on physical iOS device:
  - Voice recording works (mic permission)
  - TTS playback works (speaker)
  - Haptics work
  - Push notifications arrive
  - Performance acceptable (no jank)
- [ ] Measure cold start time → target < 3 seconds
- [ ] Measure voice command latency on device → note P50 and P95

**Done:** App works correctly across all 3 device targets. Cold start < 3s.

---

### 4.3 🔴 Privacy Policy & Terms of Service

**Tasks:**
- [ ] Draft privacy policy covering:
  - Data collected: name, email, voice transcripts (intent_raw), usage data, purchase history
  - Voice handling: "No audio is stored. Voice is converted to text via OpenAI Whisper, processed, and discarded."
  - OpenAI disclosure: "Voice commands are processed by OpenAI's API"
  - Data retention: event_log 90 days, profile indefinite
  - Deletion rights: "Delete Voice History" and "Delete Account" (cascade)
  - Third parties: Supabase (hosting), OpenAI (voice processing), RevenueCat (payments), Sentry (crash reports)
- [ ] Draft terms of service:
  - Acceptable use, subscription terms, auto-renewal, cancellation, refunds (Apple handles)
  - Liability limitations
  - Termination rights
- [ ] Host both at public URLs (GitHub Pages, Vercel, or Supabase Storage)
- [ ] Update links in SettingsScreen (currently placeholder)
- [ ] Set up support email (e.g., support@mypa.app)
- [ ] Test: can access privacy policy and terms from a browser

**Done:** Privacy policy + terms live at public URLs. Support email works.

---

### 4.4 🔴 App Store Assets & Metadata

**Tasks:**
- [ ] Create app icon: 1024×1024 PNG, no transparency, no rounded corners
- [ ] Create 6 screenshots for 6.7" display (1290×2796): AI Hub, Tasks, Focus, Social, Voice, Profile
- [ ] Create 6 screenshots for 5.5" display (1242×2208): same screens
- [ ] Create 30-second preview video showing voice interaction
- [ ] In App Store Connect:
  - Upload icon
  - Upload screenshots for both sizes
  - Upload preview video
  - Write app description (4000 char max)
  - Write subtitle (30 char max): "Your voice-first AI productivity assistant"
  - Add keywords (100 char max)
  - Fill age rating, copyright, support URL
  - Configure App Privacy nutrition labels:
    - Name: collected, linked to identity
    - Email: collected, linked to identity
    - Usage data: collected, linked to identity
    - Voice transcripts (identifiers): collected, linked to identity, analytics purpose
    - Purchase history: collected, linked to identity

**Done:** All App Store Connect fields filled. Assets uploaded.

---

### 4.5 🔴 R1–R5 Acceptance Criteria Validation

**Tasks:**
- [ ] **R1 — Voice Command Execution:**
  - "Add buy groceries tomorrow" → task created, event logged, latency < 1.2s
  - Offline → text fallback offered
  - "Delete [task]" → spoken yes/no confirmation
  - Low confidence → clarifying question before mutation
- [ ] **R2 — Daily Briefing:**
  - First open → briefing plays, skippable, barge-in works, timezone-correct
  - `briefing_started` and `briefing_progress` events in event_log
  - Briefing includes: task count, top tasks, streak, circle activity
- [ ] **R3 — Usage Limits:**
  - 10 voice commands → soft upsell, text fallback available
  - Counter can't be bypassed (server-side enforcement)
  - 2nd circle blocked for free users
- [ ] **R4 — Learning Loop:**
  - 95%+ actions have event_log records
  - Celebration modal fires on level change
  - Lock icons consistent across UI and voice
- [ ] **R5 — Circles MVP:**
  - Daily cards show counts only, NEVER task titles
  - RLS prevents cross-user data access
  - Privacy toggles default to "counts only"

**Done:** All R1–R5 pass. Ready for TestFlight.

---

### 4.6 🔴 EAS Build & TestFlight

**Tasks:**
- [ ] Run `eas build --platform ios --profile production`
- [ ] Upload to App Store Connect / TestFlight
- [ ] Wait for build processing
- [ ] Create 3 beta test groups:
  - Group 1: Heavy voice users (~10)
  - Group 2: Text-preferred users (~10)
  - Group 3: Circles-heavy users (~10)
- [ ] Distribute TestFlight invites
- [ ] Monitor for 2 weeks:
  - Day 1–3: check Sentry daily for crashes
  - Day 1–3: check voice success rate (target ≥ 85%)
  - Day 4–7: review P95 latency trend (target < 1.2s)
  - Day 8–14: review all metrics

**TestFlight Gates (must pass before App Store submission):**
- [ ] Voice success rate ≥ 85%
- [ ] Crash-free sessions ≥ 99%
- [ ] P95 latency < 1.2 seconds
- [ ] 0 RLS data leaks
- [ ] 2 full weeks of beta completed

**Done:** All gates pass → submit to App Store.

---

### 4.7 🔴 App Store Submission

**Tasks:**
- [ ] Prepare review notes:
  - Explain voice functionality
  - Explain OpenAI API usage
  - Explain subscription model
  - Provide demo account credentials
- [ ] Submit for review
- [ ] Monitor review status daily
- [ ] Respond to any review questions within 24 hours
- [ ] On approval: release immediately or schedule date

**Done:** App live in the App Store. 🚀

---

## Summary — Task Count by Priority

| Priority | Count | Description |
|----------|-------|-------------|
| 🔴 Launch Blocker | 14 | Must complete before App Store submission |
| 🟡 Important | 9 | Should complete, can workaround if desperate |
| 🟢 Nice-to-have | 1 | Can ship without, add in v1.1 |
| **Total** | **24** | |

## Recommended Execution Order

```
Week 1: Phase 1 (1.1–1.5) — Backend gaps
Week 2: Phase 2 (2.1–2.4) — Critical features
Week 3: Phase 2 (2.5–2.8) + Phase 3 (3.1–3.3) — Features + monetization
Week 4: Phase 4 (4.1–4.4) — Launch prep
Week 5–6: Phase 4 (4.5–4.6) — Beta testing
Week 7: Phase 4 (4.7) — App Store submission
```

## Partner Split Summary

| Partner A (FE) | Partner B (BE) |
|----------------|----------------|
| 2.1 Onboarding flow | 1.2 user_model computation |
| 2.3 Circle privacy toggles | 1.3 pg_cron setup |
| 2.4 Voice gating | 1.4 Rate limiting |
| 2.5 ProfileView states | 1.5 Deploy all functions |
| 2.6 SocialView error state | 2.2 Account deletion (edge function) |
| 2.7 Voice feedback prompt | 3.1 RevenueCat (webhook + App Store) |
| 3.2 Sentry integration | 4.3 Privacy policy + terms |
| 3.3 Per-screen error boundaries | 4.4 App Store assets |
| 4.1 Code cleanup | 2.8 Analytics queries |
| 4.2 Device testing | 4.5 R1–R5 validation |
| **Both:** 1.1 Focus pause/resume, 4.6 TestFlight, 4.7 Submission |
