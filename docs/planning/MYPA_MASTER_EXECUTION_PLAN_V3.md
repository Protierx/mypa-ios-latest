# MYPA Master Execution Plan v3
## Product + Architecture + AI + Delivery + Investor Blueprint
### Canonical Version (Post-PRD Integration) — February 2026

---

## Executive Findings

1. **Codebase is further along than docs suggest.** Frontend has 6 core screens (5 complete), 10 modals (9 complete), 7 Supabase hooks, 3 contexts, and 13 services. The "~60% complete" estimate in the PRD is conservative — structurally it's closer to 70-75%, but the *critical path* items (voice quality, event wiring, unlock celebration flow) are the missing 25%.

2. **Voice is the existential risk.** VoiceContext exists and records audio, but the OpenAI Realtime API (WebSocket streaming) is not integrated. Current flow is record → upload → STT → GPT → TTS → playback with ~2s latency. This must drop to <800ms for launch. Everything else is secondary.

3. **RLS policies are dangerously permissive.** Migration 005 (`nuclear_rls_fix.sql`) sets `SELECT USING (true)` on most tables. This means any authenticated user can read any other user's tasks, focus sessions, and events. This is a ship-blocker for circles privacy and must be hardened before any beta.

4. **XP values in DB triggers don't match the PRD.** Triggers award urgent=15, high=10, medium=5, low=3. PRD says task=10, high-priority=20, focus=15, perfect-focus=25. This will cause silent bugs in gamification. Fix before wiring unlock calculations.

5. **Table naming is inconsistent.** Actual schema uses `user_events` and `user_models`; PRD references `event_log` and `user_model`. The `event_log` schema in the PRD has richer columns (action, intent_raw, ai_model_used, confidence, tokens_used, user_override) than what `user_events` actually has. The PRD schema should be treated as canonical — migrate the actual table.

6. **Event logging is the biggest wiring gap.** `eventLogger.ts` exists with queue/batch logic, but it's not called from most UI flows. Without comprehensive event coverage, the learning loop, usage counters, latency dashboards, and unlock calculations all fail.

7. **Daily briefing edge function is complete but not wired.** `daily-brief` function generates briefings via GPT-4, but nothing in the client auto-plays it on first open of the day. This is the "first 5 seconds" experience and must be wired early.

8. **No RevenueCat integration exists.** Premium entitlement, subscription management, and the entire monetization layer is absent. This is Week 7-8 work but needs early architectural decisions (webhook endpoint, profile sync, entitlement caching).

9. **Action executor is well-designed.** `actionExecutor.ts` and `_shared/config.ts` implement the PRD's Action System Contract faithfully — function-calling tools, model routing, confirmation requirements. This is the strongest piece of the AI system.

10. **Missing seed data.** `config.toml` references `seed.sql` but the file doesn't exist. For development velocity, a seed script with test users, tasks, circles, and challenges is essential.

11. **No crash reporting or analytics SDK.** Sentry/Bugsnag is not integrated. For a voice-first app where failures are invisible (no stack trace in a voice interaction), crash reporting is a launch blocker.

12. **Offline strategy is undefined.** The PRD specifies OFFLINE voice state and text fallback, but no queuing, retry, or optimistic mutation logic exists in the codebase.

13. **App Store compliance is 0% complete.** No privacy policy, terms, nutrition labels, support URL, or subscription product configuration exists. This is ~20 hours of non-engineering work that should start Week 6 at latest.

14. **The gesture navigation system is solid.** `GestureNavigator.tsx` implements the spatial model (center/left/right/down/up) with spring physics, haptics, and swipe indicators. This is production-ready.

15. **Model config is correctly centralized.** `_shared/config.ts` stores model IDs server-side with capability-based routing. This matches the PRD exactly and is the right architecture.

---

## 1. Product Vision and Positioning

### Vision
"Users don't navigate an app — they talk to a personal assistant that is incredibly organized."

### One-liner
"MYPA is not an app with AI. MYPA IS the AI."

### Success Signals
- "I told MYPA and it handled it." — voice works seamlessly
- "MYPA knows when I work best." — AI has learned their patterns
- "My circle keeps me accountable." — social creates stickiness

### Positioning Matrix

| vs. | MYPA Advantage |
|-----|---------------|
| Task apps (Todoist, Things) | AI is core product, not bolt-on. Voice-first capture eliminates friction. |
| Voice assistants (Siri, Alexa) | Deep life organization, not shallow queries. Learns YOUR patterns. |
| Social apps (BeReal, Strava) | Accountability for productivity, not photos/fitness. |
| Generic chatbots | User-specific learned behavior. Progressive personalization moat. |

---

## 2. Scope and Non-goals

### v1.0 (App Store Launch) — 6 weeks remaining
**In scope:**
- Voice command execution loop (tap-to-talk → action → confirmation)
- Daily briefing auto-play on first open
- Task CRUD via voice + UI
- Focus sessions with XP
- Circles MVP (create/join, daily life cards with counts only, reactions)
- Progressive unlock engine (5 levels, celebration modal)
- Event logging across all meaningful actions
- Free-tier limits (10 voice/day, 1 circle) with soft upsell
- Premium subscription via RevenueCat
- Privacy policy, terms, nutrition labels
- TestFlight beta (2 weeks minimum)

**Not in scope for v1.0:**
- Wake word (always-on mic)
- Calendar sync
- Voice during focus sessions
- Whisper mode
- Android
- GDPR (US-only launch)
- Proof photos for challenges
- Deeper challenge/leaderboard sophistication

### v1.1 (First Update — 4 weeks post-launch)
- Voice during focus sessions
- Whisper mode (low-volume, haptic feedback)
- Challenge leaderboards polish
- Calendar sync (read-only)
- Notification strategy tuning (quiet hours, per-type opt-out)
- P95 latency target: <500ms

### v2.0 (Major — 3 months post-launch)
- Wake word (if App Store permits)
- Calendar sync (read-write)
- Android
- Family/team tier
- On-device STT fallback (Apple Speech framework)
- GDPR compliance for EU expansion

---

## 3. Information Architecture and Navigation

### Canonical Spatial Map

```
                    ┌──────────┐
                    │ PROFILE  │
                    │ (down)   │
                    └──────────┘
                         ↑
┌──────────┐       ┌──────────┐       ┌──────────┐
│  TASKS   │ ←──── │  AI HUB  │ ────→ │  SOCIAL  │
│ (left)   │       │ (CENTER) │       │ (right)  │
└──────────┘       └──────────┘       └──────────┘
                         ↓
                    ┌──────────┐
                    │  FOCUS   │
                    │ (up)     │
                    └──────────┘
```

### Core Rules
1. AI Hub is the navigation anchor and default screen.
2. Gestures, tap controls, and voice routing all resolve to the same route APIs.
3. Focus is a modal overlay — does not destroy the navigation stack.
4. Deep links resolve to: base route + optional modal. Example: challenge notification → Social + ChallengeDetail.
5. Back behavior is deterministic: close top modal → if non-hub route, navigate toward hub → if hub, app exit/confirm.

### Deep Link Contract

| Trigger | Resolution |
|---------|-----------|
| Task notification | Tasks + TaskDetailModal |
| Challenge notification | Social + ChallengeDetailModal |
| Circle invite | Social + JoinCircleModal |
| Settings link | Profile + SettingsModal |
| Unlock achieved | AI Hub + UnlockCelebrationModal |

### Accessibility
Every gesture path has a visible tap control fallback. Route changes are announced to assistive tech. All interactive elements have accessibility labels.

---

## 4. Core Screens, Modals, and Overlays

### Core Screens (5)

| Screen | Route | Status | Key Behavior |
|--------|-------|--------|-------------|
| AIHubScreen | center | Complete | Living background, greeting, tap-to-talk focal glow, quick action pills, ambient stats |
| TasksViewScreen | left | Complete | Task list with AI sorting, filters (today/tomorrow/all), completion toggle, pull-to-refresh |
| SocialViewScreen | right | Partial | Circles list, challenges list, empty states. Needs: create circle CTA, challenge join flow |
| ProfileViewScreen | down | Partial | Stats display, unlock progress, settings link. Needs: real unlock data, edit profile |
| FocusModal | up | Complete | Timer with duration selection, pause/resume, completion celebration, XP award |

### Modals (10)

| Modal | Trigger | Status | Key Behavior |
|-------|---------|--------|-------------|
| TaskDetailModal | Tap task | Complete | Edit fields, complete toggle, date/priority picker, start focus, delete |
| CircleHomeModal | Tap circle | Complete | Members tab, activity tab, challenges tab |
| ChallengeDetailModal | Tap challenge | Complete | Leaderboard, progress bar, proof submission, leave |
| SettingsModal | From Profile | Complete | Voice/AI, notifications, focus, privacy, account sections |
| QuickAddTaskOverlay | FAB or voice | Complete | Minimal overlay, title + due date + priority |
| CreateCircleSheet | From Social | Complete | Name, emoji, description, privacy options |
| CreateChallengeSheet | From Circle | Complete | Title, type, target, duration, emoji |
| JoinCircleModal | From invite | Complete | Preview, members, join/decline |
| NotificationsModal | Bell icon | Complete | Filter, mark read, delete |
| UnlockDetailsModal | From Profile | Partial | Needs real unlock data wiring |

### Global Overlays

| Overlay | Trigger | Status | Key Behavior |
|---------|---------|--------|-------------|
| Daily Brief | First app open of day | Not wired | Auto-play TTS, skippable, barge-in → LISTENING |
| Voice State | Tap focal glow | Partial | IDLE → LISTENING → PROCESSING → SPEAKING states |
| Unlock Celebration | Level transition | Component exists, not triggered | Confetti, description, "Try it now" CTA |
| Offline/Error | Network loss | Not built | Text fallback, retry button |
| Toast/Confirmation | Action completion | Not built | Brief success/error feedback |

---

## 5. AI System Blueprint

### 5.1 Intent Taxonomy (Canonical)

**Mutations:** `create_task`, `update_task`, `complete_task`, `delete_task`, `reschedule_task`, `batch_create_tasks`, `start_focus_session`, `pause_focus`, `resume_focus`, `end_focus`, `create_circle`, `invite_to_circle`, `create_challenge`, `post_to_circle`, `brain_dump`, `set_preference`

**Queries:** `query_tasks`, `query_schedule`, `query_stats`, `query_circles`

**Fallback:** `unknown`

### 5.2 Action System Contract

Architecture: User utterance → Edge Function (GPT function-calling) → ActionJSON → Client validation → Supabase mutation → Response → TTS

**ActionJSON schema:**
```
{ action, params, confirmation_required, confidence }
```

**Validation rules:**
- confidence < 0.7 → clarify before mutation
- confirmation_required (delete_task) → spoken yes/no
- params fail validation → natural clarification
- unknown → conversational response + log for review

**Response contract:**
- Success: echo what was done + optional next-step CTA
- Partial: what succeeded + what needs clarification
- Failure: friendly message + text fallback offer
- Never: fake success, expose raw errors, bypass RLS

### 5.3 Model Routing

| Tier | Description | Current Model |
|------|------------|--------------|
| fast | Simple intent → single mutation | gpt-4o-mini |
| smart | Multi-step reasoning, brain dump | gpt-4o |
| personalized | Uses user_model context | gpt-4o |
| cached | Pre-generated (daily briefing) | gpt-4o |

Config lives in `supabase/functions/_shared/config.ts`. Swap model IDs without code changes.

### 5.4 AI Boundaries
- Never fake success
- Never bypass RLS/authorization
- Never expose raw backend errors
- Never execute destructive actions under ambiguity (confidence < 0.7)
- Never store raw audio
- Never send PII beyond: current utterance, today's task titles, user's first name

---

## 6. Voice System Blueprint

### 6.1 Interaction Mode
v1: Tap-to-talk only. Wake word deferred to v2+.

### 6.2 Voice State Machine

```
IDLE → (tap orb) → LISTENING → (speech) → PROCESSING → (response) → SPEAKING → (done) → IDLE
                    ↓ (3s silence)       ↓ (10s timeout)              ↓ (barge-in)
                   TIMEOUT → IDLE       ERROR → IDLE                 → LISTENING
                                                                      
Network check before LISTENING → OFFLINE (text fallback)
```

| State | Visual | Behavior |
|-------|--------|----------|
| IDLE | Soft breathing focal glow (30% opacity, 4s pulse) | Waiting for tap. Shows last response faintly. |
| LISTENING | Pulsing glow with audio amplitude, waveform | Mic active. 3s silence → TIMEOUT. |
| PROCESSING | Spinning/thinking animation | Mic off. >3s → "Still thinking..." If >10s → ERROR. |
| SPEAKING | Organic blob matching TTS cadence | Playing TTS. Barge-in (tap or speak) → cancel TTS → LISTENING. |
| TIMEOUT | Fade to breathing | "I didn't catch that — tap to try again." → IDLE after 2s. |
| ERROR | Red pulse | "I'm having trouble connecting." Tap to retry or text fallback. → IDLE after 5s. Max 2 retries. |
| OFFLINE | Grey pulse | "No connection. You can type instead." Show text input. |

### 6.3 Latency Targets

| Milestone | P95 Target | Measurement |
|-----------|-----------|-------------|
| Beta (TestFlight) | <1.2s | User stops speaking → first TTS byte |
| v1.0 (App Store) | <800ms | Same |
| v1.1+ | <500ms | Same |

### 6.4 Daily Briefing

- Triggers on first app open of the day (guarded by `profiles.briefing_date`)
- Content: task count, top 3 tasks, streak status, circle activity, upcoming deadlines
- Duration: 15-30 seconds max
- Skippable (tap) and interruptible (barge-in → LISTENING)
- Pre-generated at 6 AM local via pg_cron (preferred); on-demand fallback if cache is stale
- Timezone: IANA string from `profiles.timezone`
- Tracking: `briefing_started`, `briefing_progress` (25/50/100), `briefing_skipped` → event_log

### 6.5 Fallback Path
If Realtime API WebSocket fails:
1. Attempt reconnect with exponential backoff (1s, 2s, 4s)
2. After 3 failures: fall back to REST path (Whisper STT → GPT → TTS)
3. REST path adds ~1-2s latency but is functional
4. If REST also fails: OFFLINE state with text input
5. Log all fallbacks to event_log for reliability monitoring

---

## 7. Data Architecture

### 7.1 Schema — Required State

**Critical rename needed:** Actual tables are `user_events` / `user_models`. PRD canonical names are `event_log` / `user_model`. Decision: **rename actual tables to match PRD** via new migration. The PRD schema has richer columns that are needed for the learning loop.

**Core tables (12):**
profiles, tasks, focus_sessions, brain_dump_items, circles, circle_members, challenges, challenge_participants, posts, reactions, notifications, event_log

**Supporting tables (5):**
circle_invitations, push_tokens, achievements, user_achievements, user_settings

**AI tables (2):**
event_log (stream), user_model (computed)

### 7.2 event_log Schema (PRD Canonical)

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | PK |
| user_id | UUID | FK → profiles |
| event_type | TEXT | voice_command, task_action, focus_action, navigation, social_action, upsell |
| action | TEXT | Matches action registry |
| screen_context | TEXT | Which screen user was on |
| intent_raw | TEXT | Original utterance (voice) |
| params | JSONB | Action params |
| success | BOOLEAN | Did it work |
| error_code | TEXT | Null on success |
| latency_ms | INTEGER | Intent to execution complete |
| ai_model_used | TEXT | Model ID |
| confidence | REAL | AI confidence 0-1 |
| user_override | BOOLEAN | User corrected AI |
| tokens_used | INTEGER | Cost tracking |
| created_at | TIMESTAMPTZ | Timestamp |

RLS: users read only their own events. Indexes: (user_id, created_at), (user_id, event_type).
TTL: 90 days, then archive/delete via weekly cron.

### 7.3 RLS Strategy

**Current state is broken.** Migration 005 uses `SELECT USING (true)` on most tables. Required fixes:

| Table | SELECT Policy | INSERT/UPDATE/DELETE Policy |
|-------|--------------|---------------------------|
| profiles | Own row only (except display_name, avatar for circle members) | Own row only |
| tasks | Own rows only | Own rows only |
| focus_sessions | Own rows only | Own rows only |
| event_log | Own rows only | Own rows only (insert only) |
| user_model | Own row only | Server-only (edge function with service role) |
| circles | Members only (via circle_members join) | Owner/admin |
| circle_members | Same circle members | Own membership |
| challenges | Participants or circle members | Circle admin |
| notifications | Own rows only | Server-only insert, own read/delete |

**Critical test:** User A must NOT be able to read User B's tasks even with a direct Supabase query.

### 7.4 Retention Policies

| Data | Retention | Mechanism |
|------|----------|-----------|
| Raw audio | Never stored | Streamed to OpenAI, discarded |
| Transcripts (event_log.intent_raw) | 90 days | Weekly cron cleanup |
| event_log rows | 90 days | Weekly cron archive/delete |
| user_model | Indefinite | Recomputed nightly |
| Briefing cache | 24 hours | Overwritten daily |
| User data (account deletion) | Cascading delete within 24h | Supabase CASCADE |

---

## 8. Backend Functions, Scheduling, and Jobs

### 8.1 Edge Functions (Deployed)

| Function | Purpose | External Calls | Status |
|----------|---------|---------------|--------|
| voice-command | Process voice → ActionJSON | OpenAI (Whisper + GPT) | Complete |
| daily-brief | Generate morning briefing | OpenAI GPT-4 | Complete |
| calculate-unlocks | Nightly pattern calc + unlock | None (DB queries) | Complete |
| ai-greeting | Personalized greeting | OpenAI GPT-4 | Complete |
| send-push | Send push notifications | Expo Push API | Complete |
| text-to-speech | Text → speech audio | OpenAI TTS | Complete |

### 8.2 Edge Functions (Needed)

| Function | Purpose | Priority |
|----------|---------|----------|
| cleanup-events | Archive event_log rows >90 days | P2 (pre-launch) |
| revenucat-webhook | Sync premium entitlement on purchase/cancel | P1 (monetization) |

### 8.3 Cron Jobs (pg_cron — Supabase Pro $25/mo)

| Job | Schedule | Function | Idempotency Guard |
|-----|----------|----------|-------------------|
| Daily briefing | Hourly (filters by timezone offset for 6 AM local) | daily-brief | profiles.briefing_date |
| Nightly patterns | 2:00 AM UTC daily | calculate-unlocks | user_model.last_calculated_at (skip if <20h) |
| Streak reminders | Hourly (filters for 8 PM local) | send-push | Check if reminder already sent today |
| Task reminders | Every 15 minutes | send-push | tasks.reminder_sent flag |
| Event cleanup | Sunday 3:00 AM UTC | cleanup-events | Deletes rows >90 days (inherently idempotent) |

**All cron-triggered functions MUST be idempotent** — safe to call twice without side effects.

---

## 9. Monetization and Tier Enforcement

### 9.1 Pricing

| Tier | Price | Includes |
|------|-------|---------|
| Free | $0 | Basic tasks, 10 voice/day, 1 circle, GPT-4o-mini only |
| Premium | $4.99/mo or $39.99/yr | Unlimited voice, AI insights, unlimited circles, focus, GPT-4o |

### 9.2 Enforcement Architecture

| Counter | How Computed | Where Enforced |
|---------|-------------|---------------|
| voice_commands_today | COUNT from event_log WHERE event_type='voice_command' AND today | Client (cached) + Edge Function (server) |
| is_premium | RevenueCat entitlement → profiles.is_premium | Client + Edge Function |
| circles_count | COUNT from circle_members WHERE user_id | Client on create |

### 9.3 Soft Upsell Flow

1. User hits limit → bottom sheet: "You've used your 10 voice commands today"
2. Primary CTA: "Upgrade to Premium" → RevenueCat paywall
3. Secondary CTA: "Use text instead" → text input
4. Never hard-block. Always offer degraded fallback.
5. Track: upsell_shown, upsell_clicked (upgrade/dismiss/text_fallback) → event_log

### 9.4 RevenueCat Integration Plan

1. Configure products in App Store Connect (monthly + annual)
2. Configure entitlement in RevenueCat dashboard
3. Add RevenueCat SDK to frontend
4. On purchase: RevenueCat webhook → Edge Function → update profiles.is_premium
5. On app launch: check RevenueCat entitlement → sync to profiles.is_premium
6. Client caches is_premium for the session; re-checks on foreground

---

## 10. Event Logging and KPI Instrumentation

### 10.1 Canonical Events

| Event | Properties | Source |
|-------|-----------|--------|
| app_opened | first_open_today, timezone, app_version, is_premium | Client |
| briefing_started | briefing_length_chars | Client |
| briefing_progress | percent (25, 50, 100) | Client |
| briefing_skipped | skipped_at_percent | Client |
| voice_listening_started | screen_context | Client |
| voice_transcript_received | transcript_length, latency_ms | Client |
| voice_action_proposed | action, confidence, model_tier | Edge Function |
| voice_action_executed | action, success, latency_ms, tokens_used | Client + Edge |
| voice_fallback_to_text | reason (offline, error, limit, user_choice) | Client |
| ui_action_executed | action, screen_context | Client |
| upsell_shown | trigger, source_screen | Client |
| upsell_clicked | cta (upgrade, dismiss, text_fallback) | Client |
| purchase_completed | tier, price, source | RevenueCat webhook |
| unlock_achieved | new_level, days_active | Edge Function |

### 10.2 Computed Quality Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Voice success rate | voice_action_executed(success=true) / voice_transcript_received | >90% |
| Latency P95 | P95 of voice_action_executed.latency_ms | <800ms (v1.0) |
| User override rate | event_log(user_override=true) / event_log(event_type='voice_command') | <5% |
| Briefing listen-through | briefing_progress(100%) / briefing_started | >60% |
| Upsell conversion | purchase_completed / upsell_shown | >3% |
| Event log coverage | event_log rows / (expected actions from UI + voice) | >95% |

---

## 11. Privacy, Security, and Compliance

### 11.1 Voice Data Rules

| Data | Stored? | Retention | Deletable? |
|------|---------|----------|-----------|
| Raw audio | Never | N/A | N/A |
| Transcripts | Yes (event_log.intent_raw) | 90 days | Yes — "Delete voice history" in Settings |
| AI responses | No (ephemeral) | N/A | N/A |
| TTS audio | No (streamed) | N/A | N/A |

### 11.2 Account Data Lifecycle

| Action | Behavior |
|--------|----------|
| Delete voice history | Clear event_log WHERE event_type='voice_command' |
| Export my data | JSON export via Supabase Storage signed URL (24h expiry) |
| Delete account | CASCADE delete all user data. Storage files deleted. Confirm by typing "DELETE". |

### 11.3 Circle Privacy Defaults

| Data | Visible to Circle? | Configurable? |
|------|-------------------|--------------|
| Task completed count | Yes (Daily Life Card) | Yes |
| Task titles | NEVER | N/A |
| Focus minutes | Yes (Daily Life Card) | Yes |
| Streak day count | Yes | Yes |
| Challenge progress | Yes (within challenge) | No (required for participation) |

### 11.4 App Store Compliance Checklist

- [ ] Privacy policy hosted (voice data, OpenAI processing disclosure)
- [ ] Terms of Service hosted
- [ ] Support URL active
- [ ] Privacy Nutrition Labels in App Store Connect
- [ ] Subscription products configured in App Store Connect
- [ ] RevenueCat entitlement sync verified
- [ ] No private API usage
- [ ] No always-on mic (tap-to-talk only)
- [ ] Data deletion capability
- [ ] GDPR deferred (US-only v1)

---

## 12. QA Strategy and Definition of Done

### 12.1 Definition of Done (Every Feature)

**Functional:**
- [ ] Works via voice command (action in registry, AI can trigger it)
- [ ] Works via UI fallback (manual tap/type path)
- [ ] RLS-safe (no cross-user data leakage)
- [ ] Event logged to event_log
- [ ] Errors handled gracefully (no raw errors)

**UI/UX:**
- [ ] Loading state (skeleton or spinner)
- [ ] Empty state (friendly message)
- [ ] Error state (retry button)
- [ ] Works on iPhone SE through iPhone 15 Pro Max
- [ ] Respects design system tokens

**Quality:**
- [ ] No `any` types
- [ ] No console.log in production
- [ ] Tested on simulator + physical device

### 12.2 Build-Ready Acceptance

**R1 — Voice Command Execution:** Given "Add buy groceries tomorrow" → task created, event logged, latency <1.2s (beta), <800ms (launch). Offline → text fallback offered.

**R2 — Daily Briefing:** First open → 15-30s briefing, skippable, barge-in works, timezone-correct, listen-through tracked.

**R3 — Usage Limits:** At 10 voice commands → soft upsell shown, text fallback offered, limit computed from event_log (not mutable counter), cannot bypass offline.

**R4 — Learning Loop:** 95%+ actions have event_log record, nightly job is idempotent, unlock level transitions fire celebration modal.

**R5 — Circles MVP:** Daily life cards show counts only (never task titles), privacy toggles work, RLS verified via direct query test.

### 12.3 TestFlight Gates

| Metric | Gate |
|--------|------|
| Voice success rate | >= 85% |
| Crash-free sessions | >= 99% |
| P95 latency | < 1.2s |
| RLS data leak audit | 0 leaks |
| Minimum beta duration | 2 weeks |

---

## 13. Release Plan

### TestFlight Beta (2 weeks)
- Groups: (1) heavy voice users, (2) text-preferred, (3) circles-heavy
- In-app feedback: "Was that right?" prompt after 1 in 5 voice actions
- Daily metrics review: latency, success rate, crash rate
- Weekly team review against acceptance criteria

### App Store Submission
- Requires: all R1-R5 passing, legal compliance, store assets
- Store assets: icon, 6 screenshots (6.7" + 5.5"), 30s preview video
- Review notes: explain voice functionality, OpenAI API usage, subscription model
- Expected review time: 1-3 days

---

## 14. Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| OpenAI Realtime API instability | High | Fallback to REST path (Whisper → GPT → TTS). Monitor via event_log latency. |
| Voice latency > targets | High | Staged targets. Edge caching for briefings. Response caching for repeated queries. |
| OpenAI cost spike | High | Capability-based routing, response caching, usage limits, per-user cost monitoring via tokens_used. |
| App Store rejection | High | No wake word, no always-on mic, privacy compliance, proper disclosures. |
| RLS data leaks | Critical | Harden policies (migration 005 is too permissive). Direct query testing in beta. |
| Circles engagement too low | Medium | Lightweight MVP (daily cards + reactions). Careful notification pacing. |
| Users prefer typing | Medium | UI fallback is first-class, not degraded. Discreet mode suggested during onboarding. |
| Timezone/DST bugs | Medium | IANA timezone strings only. Test across US timezones + DST transitions. On-demand briefing fallback. |
| Service role key exposure | High | Used ONLY in pg_cron → Edge Function calls. Never in client. Rotate before launch. |

---

## 15. Investor Narrative

### KPI Tree

**North Star:** Daily Active Voice Users (users with >= 1 voice action/day)

**Engagement branch:**
- DAU/MAU → 30% month 1, 50% month 6
- Voice commands/user/day → 3 month 1, 8 month 6
- 7-day retention → 40% month 1, 60% month 6
- 30-day retention → 20% month 1, 40% month 6

**Quality branch:**
- Voice success rate → >90%
- P95 latency → <800ms
- User override rate → <5%
- Briefing listen-through → >60%

**Revenue branch:**
- Free→premium conversion → 5% by month 6
- Monthly churn → <8%
- LTV:CAC → >3:1
- ARPU vs AI cost/user → positive unit economics at 5K users

**Social branch:**
- % users in >= 1 circle → 30% by month 3
- Average circle size → 4 members
- Challenge activity → 2 per circle per month

### Milestone Logic
1. **TestFlight** — Voice loop works, circles stable, 50 beta users
2. **App Store launch** — Full v1 scope, premium available
3. **1K MAU** — Prove retention, voice quality, social engagement
4. **5K MAU** — Prove unit economics, conversion rate
5. **Seed raise** — With DAU/MAU >40%, retention >30% at 30d, positive unit economics trajectory

---

## 16. What to Build Now

The critical path is: **Voice quality → Event wiring → RLS hardening → Unlock celebration → RevenueCat → Legal compliance → TestFlight.**

Every other feature is either already built or can be polished in parallel. The voice system is the existential dependency — if it doesn't feel right, nothing else matters.
