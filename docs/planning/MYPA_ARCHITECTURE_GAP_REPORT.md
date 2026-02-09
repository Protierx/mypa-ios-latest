# MYPA Architecture Gap Report
## Brutal Gap Analysis — February 2026

---

## Severity Scale

| Level | Definition |
|-------|-----------|
| **CRITICAL** | Ship-blocker. Must fix before any beta. |
| **HIGH** | Must fix before App Store submission. |
| **MEDIUM** | Should fix before v1.0. Acceptable risk for beta. |
| **LOW** | Fix in v1.1 or later. |

---

## GAP-01: RLS Policies Are Dangerously Permissive
**Severity: CRITICAL**

**What's wrong:** Migration 005 (`nuclear_rls_fix.sql`) sets `SELECT USING (true)` on most tables including `tasks`, `focus_sessions`, `user_events`, and `user_models`. This means any authenticated user can read any other user's data by querying Supabase directly.

**Impact:** Complete privacy failure. User A can see User B's tasks, focus sessions, voice transcripts, and AI patterns. This violates the core privacy promise ("task titles are NEVER shared") and would be an immediate App Store/PR disaster.

**Fix:** Create new migration that drops all permissive policies and recreates strict per-user policies:
- `tasks`: `SELECT/INSERT/UPDATE/DELETE USING (auth.uid() = user_id)`
- `focus_sessions`: same pattern
- `event_log`: `SELECT USING (auth.uid() = user_id)`, `INSERT WITH CHECK (auth.uid() = user_id)`
- `user_model`: `SELECT USING (auth.uid() = user_id)`, no client INSERT/UPDATE (server-only)
- Circle tables: use EXISTS subquery on `circle_members` for membership check (avoid recursion from migration 004)

**When to fix:** Week 1, Day 2. Before any external testing.

---

## GAP-02: event_log Schema Mismatch
**Severity: HIGH**

**What's wrong:** Actual table is named `user_events` with a basic schema (event_type, screen, metadata JSONB). PRD specifies `event_log` with specific columns: action, intent_raw, ai_model_used, confidence, tokens_used, user_override, latency_ms, error_code, screen_context, params JSONB, success BOOLEAN.

**Impact:** Without the PRD schema, the following are impossible:
- Voice success rate calculation (needs `success` column)
- Latency dashboard (needs `latency_ms`)
- Cost tracking (needs `tokens_used`)
- User override rate (needs `user_override`)
- Usage counter computation (needs `event_type` + `action` indexing)
- AI learning loop (needs structured data, not generic JSONB)

**Fix:** New migration: rename table, add all PRD columns, create indexes on (user_id, created_at) and (user_id, event_type, created_at).

**When to fix:** Week 1, Day 1.

---

## GAP-03: XP Values in Triggers Don't Match PRD
**Severity: MEDIUM**

**What's wrong:** Database triggers in migration 003 award: urgent=15, high=10, medium=5, low=3. PRD specifies: task_complete=10, high_priority=20, focus_session=15, perfect_focus=25, streak_day=5, streak_week=50, streak_month=200, circle_join=25, assignment_complete=30, challenge_win=100.

**Impact:** Gamification feels wrong. Users earn different XP than intended. Level progression is miscalibrated. Streak multipliers may also be missing from triggers.

**Fix:** Update triggers to match PRD values. Add streak multiplier logic (3+ days: 1.1x, 7+: 1.25x, 14+: 1.5x, 30+: 2.0x). Verify level formula matches `XP_needed = 100 * (level - 1)^1.5`.

**When to fix:** Week 1 (alongside schema migration).

---

## GAP-04: Voice System Not Using Realtime API
**Severity: CRITICAL**

**What's wrong:** VoiceContext.tsx and VoiceService.ts implement a record-upload-process-playback flow. The OpenAI Realtime API (WebSocket streaming for <500ms latency) is not integrated. Current estimated latency is ~2 seconds.

**Impact:** The product's core thesis ("MYPA IS the AI") fails if voice feels slow. 2-second latency makes voice feel like a command interface, not a conversation. Users will prefer typing.

**Fix:** Implement Realtime API WebSocket connection with audio streaming in both directions, barge-in support, and function-calling integration. Fall back to REST path (current implementation) when WebSocket fails.

**When to fix:** Week 2 (critical path). If Realtime API is unavailable or unstable, the REST path with optimizations can still meet the beta target (<1.2s).

---

## GAP-05: Daily Briefing Not Wired to UI
**Severity: HIGH**

**What's wrong:** `daily-brief` edge function exists and generates briefings via GPT-4. `profiles.briefing_cache` and `profiles.briefing_date` columns exist (added in migration 006). But nothing in the client checks briefing_date on app open, fetches the cached briefing, or auto-plays it via TTS.

**Impact:** The "first 5 seconds" experience is missing. Users open the app to silence instead of a warm morning briefing. This is the #1 "wow moment" for new users.

**Fix:** In App.tsx or AIHubScreen, on mount: check if `briefing_date !== today` → fetch cached briefing (or generate on-demand) → play via TTS → transition to IDLE. Track briefing_started/progress/skipped events.

**When to fix:** Week 2, Day 9.

---

## GAP-06: Event Logging Not Wired Throughout App
**Severity: HIGH**

**What's wrong:** `eventLogger.ts` exists with queue/batch logic, but most hooks (useTasks, useCircles, useChallenges, useFocusSessions) don't call it. Voice events are not tracked. UI actions from modals are not tracked. app_opened is not tracked.

**Impact:** Without comprehensive events:
- Usage counters don't work (voice limit enforcement fails)
- Nightly user_model calculation has no data
- Quality metrics (voice success rate, latency P95) can't be computed
- Upsell conversion can't be measured
- The entire learning loop is dead

**Fix:** Systematically add event_log calls to every hook, modal, and context. Create an audit checklist of all user-facing actions and verify each emits an event.

**When to fix:** Week 1 (Days 3-5) + Week 2 (voice events).

---

## GAP-07: No RevenueCat Integration
**Severity: HIGH**

**What's wrong:** No RevenueCat SDK in package.json. No paywall screen. No webhook endpoint. profiles.is_premium exists but is never set from a real purchase. No subscription products in App Store Connect.

**Impact:** No monetization. Free-tier limits exist in code but premium bypass doesn't work because is_premium is never set to true via a real purchase flow.

**Fix:** Add RevenueCat SDK, configure products in App Store Connect, build paywall screen, create webhook edge function, wire is_premium sync.

**When to fix:** Week 4 (Days 16-17).

---

## GAP-08: No Crash Reporting
**Severity: HIGH**

**What's wrong:** No Sentry, Bugsnag, or Expo crash reporting SDK integrated. For a voice-first app, crashes during voice interactions are invisible — the user just hears silence or sees a blank screen with no stack trace.

**Impact:** Can't diagnose production issues. Can't measure crash-free session rate (a TestFlight gate). Voice failures are especially hard to debug without error telemetry.

**Fix:** Integrate Sentry via `@sentry/react-native` or Expo's built-in error reporting. Configure source maps for readable stack traces.

**When to fix:** Week 5 (Day 21). Should be earlier if possible.

---

## GAP-09: No Offline Strategy
**Severity: MEDIUM**

**What's wrong:** PRD specifies OFFLINE voice state with text fallback, but no network detection, offline queueing, or retry logic exists. If the network drops mid-voice-interaction, the app likely crashes or hangs.

**Impact:** Poor experience on unreliable networks (subway, elevator, rural areas). Voice interactions fail silently.

**Fix:** Implement network state detection (NetInfo API). In LISTENING state, check network before proceeding. If offline: show OFFLINE state with text input. Queue mutations for retry when online. Display pending state for queued actions.

**When to fix:** Week 2 (Day 9) for basic detection. Week 5 for queuing/retry.

---

## GAP-10: Missing Seed Data
**Severity: LOW**

**What's wrong:** `config.toml` references `seed.sql` but the file doesn't exist. Developers must manually create test data after every `supabase db reset`.

**Impact:** Slows development and testing. Every reset requires manual data creation. Can't reproduce bugs without consistent test data.

**Fix:** Create `supabase/seed.sql` with: 2 test users (one free, one premium), 10+ tasks (mix of today/tomorrow/completed), 1 circle with both users, 1 active challenge, sample event_log entries, sample user_model data.

**When to fix:** Week 1, Day 3.

---

## GAP-11: user_model Table Not Created
**Severity: HIGH**

**What's wrong:** PRD specifies a `user_model` table with specific columns (peak_hours, avg_task_durations, completion_rate_7d, overwhelm_score, tone_preference, unlock_level, etc.). The actual `user_models` table exists but may not have all columns. The calculate-unlocks edge function references an `unlocks` table, not `user_model`.

**Impact:** The progressive unlock system and personalization engine can't function without the correct user_model schema. The nightly job may be writing to wrong columns or a different table structure.

**Fix:** Verify actual user_models schema against PRD user_model. Create migration to align. Update calculate-unlocks edge function to write to correct columns. Ensure unlock_level lives on user_model (or profiles).

**When to fix:** Week 1, Day 1 (alongside GAP-02).

---

## GAP-12: App Store Compliance is 0%
**Severity: HIGH**

**What's wrong:** No privacy policy, no terms of service, no privacy nutrition labels, no support URL, no subscription product configuration, no app icon or screenshots.

**Impact:** Cannot submit to App Store. This is ~20 hours of work that is non-engineering but mandatory.

**Fix:** Draft privacy policy (template + voice/OpenAI disclosures), terms, set up support email. Complete nutrition labels in App Store Connect. Configure subscription products. Create visual assets.

**When to fix:** Week 6 (Days 26-29). Start privacy policy research in Week 4.

---

## GAP-13: Rate Limiting on Edge Functions Missing
**Severity: MEDIUM**

**What's wrong:** No rate limiting on the `voice-command` edge function. A malicious or buggy client could send hundreds of requests per minute, running up OpenAI costs.

**Impact:** Cost blowout risk. A single user could generate significant OpenAI charges. Also a potential abuse vector.

**Fix:** Implement per-user rate limiting in the voice-command edge function. Check event_log for request count in last minute. If >60, return 429 Too Many Requests. Also enforce daily limit for free tier (10 voice commands).

**When to fix:** Week 5 (Day 25).

---

## GAP-14: SocialView Screen Is Incomplete
**Severity: MEDIUM**

**What's wrong:** SocialViewScreen.tsx is marked "Partial" — it shows circles and challenges lists but is missing: create circle CTA, challenge join flow from the list, proper empty state for new users, and real-time circle activity updates.

**Impact:** Social features feel unfinished. New users see a dead social screen. The "circles MVP" experience depends on this being polished.

**Fix:** Add "Create Circle" button (gated by free/premium), wire circle tap to CircleHomeModal, add challenge join flow, improve empty state ("Invite friends to stay accountable").

**When to fix:** Week 4 (Days 18-19).

---

## GAP-15: ProfileView Screen Is Incomplete
**Severity: MEDIUM**

**What's wrong:** ProfileViewScreen.tsx is marked "Partial" — shows stats but has TODOs for settings navigation, real unlock data, and edit profile flow.

**Impact:** Users can't access settings or see their real unlock progress from the profile. Profile feels like a placeholder.

**Fix:** Wire settings button to SettingsModal, wire unlock section to real useUnlocks data, add edit profile flow.

**When to fix:** Week 3 (alongside unlock engine work).

---

## GAP-16: No Toast/Confirmation Feedback Layer
**Severity: LOW**

**What's wrong:** When a user completes an action via UI (complete task, join circle, etc.), there's no visual confirmation toast. The only feedback is the list updating. Voice actions get spoken confirmation, but UI actions are silent.

**Impact:** Users are unsure if their action worked. Especially problematic for destructive actions (delete task) where the item disappears without confirmation.

**Fix:** Implement a global toast component (slide-in from top or bottom) that shows brief success/error messages. Use for all mutation confirmations.

**When to fix:** Week 5 (polish).

---

## GAP-17: Spec Conflict — Navigation Model
**Severity: LOW**

**What's wrong:** PRD Section 5 describes a 5-tab bar (Home, Plan, Talk, Circles, Profile). The actual codebase and handoff doc describe gesture-based navigation (center/left/right/down/up). The gesture model is clearly the intended direction.

**Impact:** Confusion for new developers reading the PRD. Minor — the codebase is the source of truth for navigation.

**Fix:** Update PRD Section 5 to reflect gesture-based navigation. Remove tab bar references.

**When to fix:** v1.1 (doc cleanup). Not blocking.

---

## GAP-18: No Data Export Flow
**Severity: MEDIUM**

**What's wrong:** PRD specifies "Export my data" (JSON export via Supabase Storage signed URL). No implementation exists — no edge function, no settings UI, no export logic.

**Impact:** Required for privacy compliance (right to access). App Store reviewers may ask about data portability.

**Fix:** Create edge function that queries all user data, generates JSON, uploads to Supabase Storage, returns signed URL (24h expiry). Add button in Settings.

**When to fix:** Week 6 (alongside legal compliance).

---

## GAP-19: Notification Strategy Undefined
**Severity: LOW**

**What's wrong:** `send-push` edge function exists and can send notifications. But there's no strategy for: quiet hours, per-type opt-out, daily notification cap, or notification pacing for circles.

**Impact:** Risk of notification fatigue. If circles are active, users could get dozens of notifications daily (reactions, new members, challenge updates). This drives uninstalls.

**Fix:** Implement quiet hours in user_settings (default 10 PM - 8 AM). Per-type toggle in notification settings. Daily cap of 20 notifications. Circle digest (batch circle notifications into 1-2 daily summaries instead of individual notifications).

**When to fix:** v1.1 (post-launch tuning based on data).

---

## GAP-20: actionExecutor.ts → Supabase Mutation Gap
**Severity: MEDIUM**

**What's wrong:** `actionExecutor.ts` receives ActionJSON from the voice-command edge function and is responsible for executing mutations via Supabase. However, it needs to handle all 16+ action types including: task CRUD, focus session control, circle operations, and challenges. Need to verify all action handlers are implemented and handle errors correctly.

**Impact:** Voice commands that parse correctly may fail at execution if the action handler is incomplete. User says "create a circle called Study Buddies" → intent parsed → but if create_circle handler is missing, nothing happens.

**Fix:** Audit actionExecutor.ts against the complete Action Registry. Verify every action type has a handler. Add error handling for each. Add event logging for each execution.

**When to fix:** Week 2 (alongside voice integration).

---

## Summary Table

| Gap | Severity | Week to Fix |
|-----|----------|-------------|
| GAP-01: RLS too permissive | CRITICAL | 1 |
| GAP-02: event_log schema mismatch | HIGH | 1 |
| GAP-03: XP trigger values wrong | MEDIUM | 1 |
| GAP-04: No Realtime API | CRITICAL | 2 |
| GAP-05: Daily briefing not wired | HIGH | 2 |
| GAP-06: Event logging not wired | HIGH | 1-2 |
| GAP-07: No RevenueCat | HIGH | 4 |
| GAP-08: No crash reporting | HIGH | 5 |
| GAP-09: No offline strategy | MEDIUM | 2-5 |
| GAP-10: No seed data | LOW | 1 |
| GAP-11: user_model schema mismatch | HIGH | 1 |
| GAP-12: App Store compliance 0% | HIGH | 6 |
| GAP-13: No rate limiting | MEDIUM | 5 |
| GAP-14: SocialView incomplete | MEDIUM | 4 |
| GAP-15: ProfileView incomplete | MEDIUM | 3 |
| GAP-16: No toast feedback | LOW | 5 |
| GAP-17: PRD nav spec conflict | LOW | v1.1 |
| GAP-18: No data export | MEDIUM | 6 |
| GAP-19: Notification strategy undefined | LOW | v1.1 |
| GAP-20: actionExecutor completeness | MEDIUM | 2 |

**Critical (2):** RLS policies, Voice Realtime API
**High (7):** event_log schema, Daily briefing, Event wiring, RevenueCat, Crash reporting, user_model schema, App Store compliance
**Medium (7):** XP values, Offline strategy, Rate limiting, SocialView, ProfileView, Data export, actionExecutor
**Low (4):** Seed data, Toast feedback, PRD nav conflict, Notification strategy
