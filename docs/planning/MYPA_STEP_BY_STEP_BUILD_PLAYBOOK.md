# MYPA Step-by-Step Build Playbook
## Week-by-Week Execution Plan for 2-Person Team
### February 2026

---

## Team Roles

| Role | Abbreviation | Responsibilities |
|------|-------------|-----------------|
| Frontend / Voice Lead | FE | Screens, modals, voice integration, event wiring, UI polish |
| Platform / AI Lead | BE | Supabase migrations, edge functions, RLS, cron, RevenueCat, legal |

Both share: QA testing, code review, architecture decisions.

---

## Critical Path

```
RLS Hardening ──→ Event Log Schema Migration ──→ Event Wiring ──→ Voice Integration ──→ Daily Briefing
                                                       ↓                                      ↓
                                              Unlock Calculation ──→ Unlock Celebration UI ──→ RevenueCat
                                                                                               ↓
                                                                              Legal/Compliance ──→ TestFlight ──→ App Store
```

**The longest pole is Voice Integration.** Everything else can be parallelized around it.

---

## Parallel Workstreams

| Stream | Owner | Weeks | Dependencies |
|--------|-------|-------|-------------|
| A: Voice System | FE | 1-3 | OpenAI Realtime API access |
| B: Data Hardening | BE | 1-2 | None |
| C: Event Wiring | FE | 2-3 | Stream B (schema migration) |
| D: Unlock Engine | FE+BE | 3-4 | Stream C (events flowing) |
| E: Monetization | BE | 4-5 | RevenueCat account setup |
| F: Legal/Compliance | BE | 4-6 | Privacy lawyer / template |
| G: QA + Polish | Both | 5-6 | All streams substantially complete |
| H: Beta + Launch | Both | 7-8 | Stream G passing gates |

---

## Week 1: Foundation Hardening
**Theme: Fix what's broken before building what's missing**

### Day 1 (Monday) — Architecture Freeze

| Task | Owner | Why Now | Output | Done When |
|------|-------|---------|--------|-----------|
| Freeze this master plan in repo as /docs/planning/ | BE | Single source of truth | Files committed | Merged to main |
| Create migration 007: rename user_events → event_log, add missing columns (intent_raw, ai_model_used, confidence, tokens_used, user_override, latency_ms, error_code) | BE | PRD schema is canonical; current table is missing critical columns | SQL migration file | Migration runs without error |
| Create migration 008: rename user_models → user_model, add missing columns (voice_usage_rate, common_reschedule_patterns, tone_preference) | BE | Same alignment | SQL migration file | Migration runs without error |
| Audit XP trigger values vs PRD | BE | Current triggers use different values than PRD | Updated trigger SQL or documented decision | Values match PRD or deviation is documented |

**Blocker/Precondition:** Supabase CLI installed, project linked, migrations can be pushed.

### Day 2 (Tuesday) — RLS Hardening

| Task | Owner | Why Now | Output | Done When |
|------|-------|---------|--------|-----------|
| Create migration 009: drop all policies from migration 005, recreate strict policies per table | BE | Migration 005 is "SELECT USING (true)" — any user can read any data | SQL migration with correct policies | Direct query test: User A cannot see User B's tasks |
| Write RLS test script: create 2 test users, attempt cross-user reads on all sensitive tables | BE | Must verify policies work | Test script (can be SQL or Node) | All cross-user reads return 0 rows |
| Verify circle data isolation: circle member can see circle data, non-member cannot | BE | Circles MVP privacy requirement | Test results | Passes |

**Blocker:** Migration 007/008 from Day 1 must be applied first.

### Day 3 (Wednesday) — Event Logging Schema + Wiring Start

| Task | Owner | Why Now | Output | Done When |
|------|-------|---------|--------|-----------|
| Update eventLogger.ts to use new event_log schema (add all PRD columns) | FE | Event logger exists but writes to old schema with fewer columns | Updated service file | Events written have all required columns |
| Wire event_log calls into useTasks hook (create, complete, update, delete) | FE | Task actions are the most common events | Updated hook | Task CRUD emits events with action, success, screen_context |
| Wire event_log into useFocusSessions hook (start, pause, resume, end) | FE | Focus is second most common action | Updated hook | Focus actions emit events |
| Create seed.sql with 2 test users, 10 tasks, 1 circle, 1 challenge | BE | Dev velocity requires test data | seed.sql file | supabase db reset populates data |

**Blocker:** Migration 007 (event_log schema) must be applied.

### Day 4 (Thursday) — Event Wiring Continued + Voice Prep

| Task | Owner | Why Now | Output | Done When |
|------|-------|---------|--------|-----------|
| Wire event_log into useCircles hook (create, join, leave, post) | FE | Social actions must be tracked | Updated hook | Circle actions emit events |
| Wire event_log into useChallenges hook (create, join, progress) | FE | Challenge actions tracked | Updated hook | Challenge actions emit events |
| Wire app_opened event in App.tsx | FE | Tracks DAU, first_open_today | Updated App.tsx | app_opened fires once per foreground with timezone |
| Research OpenAI Realtime API: auth, WebSocket protocol, streaming format, barge-in support | FE | Voice integration starts Week 2; need to understand the API | Notes document | Clear understanding of API contract, auth, and limitations |

**Blocker:** None (parallel tracks).

### Day 5 (Friday) — Voice Context Audit + Event Coverage Audit

| Task | Owner | Why Now | Output | Done When |
|------|-------|---------|--------|-----------|
| Audit VoiceContext.tsx: map current state machine to PRD spec, identify gaps | FE | Voice refactor starts Monday; need clear gap list | Gap document | Every PRD state/transition accounted for |
| Wire event_log into voice flow: voice_listening_started, voice_transcript_received, voice_action_executed, voice_fallback_to_text | FE | Voice events are the most important for quality metrics | Updated VoiceContext | Voice events fire correctly |
| Wire event_log into UI actions: QuickAddTask, TaskDetail (from modals) | FE | UI actions need same coverage as voice | Updated modals | UI task actions emit events |
| Run event coverage audit: list all user-facing actions, check which have event_log calls | BE | Need to know what's missing before beta | Audit spreadsheet/checklist | Coverage documented, <5 gaps remaining |

**Exit criteria for Week 1:** RLS is strict. event_log schema matches PRD. >80% of user actions emit events. Seed data exists. Voice API research complete.

---

## Week 2: Voice Integration Sprint
**Theme: Make the voice feel human**

### Day 6 (Monday) — Voice Architecture

| Task | Owner | Why Now | Output | Done When |
|------|-------|---------|--------|-----------|
| Implement OpenAI Realtime API WebSocket connection in VoiceService.ts | FE | This is the core product | Updated service with connect/disconnect/send | WebSocket connects and receives events |
| Implement audio streaming: mic → WebSocket (send audio chunks) | FE | Prerequisite for STT | Audio streaming code | Audio from mic reaches OpenAI |
| Set up Supabase Pro ($25/mo) for pg_cron | BE | Needed for briefing generation and nightly jobs | Supabase Pro active | pg_cron extension available |

### Day 7 (Tuesday) — Voice Pipeline End-to-End

| Task | Owner | Why Now | Output | Done When |
|------|-------|---------|--------|-----------|
| Implement audio playback from WebSocket (receive TTS audio chunks → play) | FE | Second half of voice pipeline | Audio playback code | Can hear AI response |
| Wire function-calling through Realtime API (or hybrid: Realtime for STT/TTS, REST for GPT) | FE | AI needs to execute actions | Action execution from voice | "Add buy groceries tomorrow" creates a task |
| Configure pg_cron jobs: daily-brief (hourly), calculate-unlocks (2 AM UTC) | BE | Briefing and unlock calculation need to run automatically | pg_cron entries configured | Jobs appear in cron.job table |

### Day 8 (Wednesday) — Barge-in + State Machine

| Task | Owner | Why Now | Output | Done When |
|------|-------|---------|--------|-----------|
| Implement barge-in: detect user speech during SPEAKING → cancel TTS → LISTENING | FE | Key UX requirement | Updated state machine | Can interrupt AI mid-sentence |
| Implement TIMEOUT (3s silence → "I didn't catch that") | FE | Edge case handling | Timeout logic | Works consistently |
| Implement ERROR state (10s processing timeout, network failure) | FE | Reliability | Error handling | Graceful degradation to text |
| Test daily-brief edge function via pg_cron: verify it generates for correct timezones | BE | Briefing must work across US timezones | Test results | EST/CST/MST/PST all get briefings at 6 AM local |

### Day 9 (Thursday) — Daily Briefing + Fallback

| Task | Owner | Why Now | Output | Done When |
|------|-------|---------|--------|-----------|
| Wire daily briefing auto-play on first app open of day | FE | "First 5 seconds" experience | Updated App.tsx / AIHubScreen | Opens app → hears briefing → can skip or barge-in |
| Implement briefing tracking: briefing_started, briefing_progress, briefing_skipped | FE | KPI measurement | Event logging calls | Events fire at 25/50/100% and on skip |
| Implement REST fallback path (Whisper → GPT → TTS) when Realtime fails | FE | Reliability requirement | Fallback code | Works when WebSocket is down |
| Implement OFFLINE detection + text input fallback | FE | Offline UX | Network check + UI | No network → text input shown |

### Day 10 (Friday) — Voice Polish + Latency Measurement

| Task | Owner | Why Now | Output | Done When |
|------|-------|---------|--------|-----------|
| Measure P50/P95 latency on physical device (10 test commands) | FE | Need baseline measurement | Latency numbers | Documented: "Current P95 is Xms" |
| Tune voice personality prompt if responses feel wrong | FE | Voice must feel like a friend | Updated MYPA_SYSTEM_PROMPT if needed | 10 test conversations feel natural |
| Test voice on physical device in quiet + noisy environments | FE | Real-world conditions | Test notes | Acceptable in both environments |
| Implement discreet mode toggle in Settings | BE | Alternative for public use | Settings toggle | Toggle works, text input replaces voice |

**Exit criteria for Week 2:** Voice loop works end-to-end on physical device. Barge-in works. Daily briefing auto-plays. REST fallback works. P95 latency measured and documented.

---

## Week 3: Learning Loop + Unlock Engine
**Theme: Make the AI get smarter**

### Days 11-12 — Nightly Calculation Wiring

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Verify calculate-unlocks edge function computes all user_model fields from event_log | BE | Updated function if needed | peak_hours, avg_task_durations, completion_rate_7d, overwhelm_score all computed correctly |
| Test nightly job end-to-end: seed user with 14 days of events → run calculate-unlocks → verify user_model and unlock_level | BE | Test results | Unlock level transitions correctly at day 7, 14, 21, 30 thresholds |
| Wire unlock level changes to notification insert + unlock_celebration_pending flag | BE | Updated edge function | On level change: notification created, flag set |

### Days 13-14 — Unlock Celebration UI

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Wire UnlockCelebrationModal to fire on app open when unlock_celebration_pending is true | FE | Updated App.tsx | Modal appears on unlock, dismisses, doesn't re-fire |
| Wire UnlockDetailsModal to show real unlock data (progress toward next level, days remaining) | FE | Updated modal | Shows actual user progress |
| Implement unlock gating in voice: locked feature request → "I'll be able to do that after about X more days" | FE | Updated voice handler | Voice responds correctly to locked feature requests |
| Implement unlock gating in UI: locked features show greyed + lock icon + "X days to unlock" | FE | Updated screens | Consistent across all gated features |

### Day 15 — Free-Tier Limit Enforcement

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Implement voice command counter from event_log (client-side cache + server-side check) | FE+BE | Counter logic | Count is accurate, resets at midnight user-local |
| Implement soft upsell bottom sheet when limit hit | FE | Upsell component | Shows at 10 commands, offers text fallback |
| Implement circle limit (1 for free) with lock icon on "Create Circle" | FE | UI gating | Free user sees lock, premium user sees create |
| Wire upsell_shown and upsell_clicked events to event_log | FE | Event logging | Events fire on show/click |

**Exit criteria for Week 3:** Nightly job runs and computes user_model. Unlock celebrations fire. Limits enforced. Upsell shown.

---

## Week 4: Monetization + Social Polish
**Theme: Get paid, make circles work**

### Days 16-17 — RevenueCat Integration

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Set up RevenueCat account, configure products (monthly + annual) | BE | RevenueCat dashboard | Products created |
| Configure subscription products in App Store Connect | BE | App Store Connect | Products approved |
| Add RevenueCat SDK to frontend, implement paywall screen | FE | Paywall component | Paywall displays, purchase flow works |
| Create revenucat-webhook edge function: sync is_premium on purchase/cancel/renew | BE | Edge function | Premium status syncs within 30s of purchase |
| Wire profiles.is_premium checks throughout app (voice limits, circle limits) | FE | Updated checks | Premium users bypass limits |

### Days 18-19 — Circles MVP Polish

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Verify Daily Life Cards show counts only (tasks completed, focus minutes, streak) — never task titles | FE | UI audit | Confirmed no title leakage |
| Verify privacy toggles work (hide task count, focus minutes, streak from circles) | FE | Toggle testing | Toggles respected in card rendering |
| Verify emoji reactions work in real-time (Supabase Realtime) | FE | Realtime testing | Reactions appear instantly for other circle members |
| Run full RLS audit on circle data: non-member cannot see circle activity | BE | Test results | 0 leaks |

### Day 20 — Integration Testing

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Test complete flow: sign up → first briefing → create task via voice → join circle → see daily card → hit limit → upsell → upgrade → unlimited | Both | Test walkthrough | Entire flow works without errors |
| Fix any bugs found in integration test | Both | Bug fixes | All critical bugs resolved |

**Exit criteria for Week 4:** RevenueCat integrated, purchases work. Circles privacy verified. End-to-end flow tested.

---

## Week 5: Polish + Crash Reporting
**Theme: Make it reliable**

### Days 21-22 — Crash Reporting + Error States

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Integrate Sentry (or Expo's crash reporting) | BE | Sentry SDK configured | Crashes reported to dashboard |
| Implement error boundaries on all screens | FE | ErrorBoundary components | No white screen crashes |
| Implement loading states on all data-fetching screens | FE | Skeleton/spinner states | No blank screens while loading |
| Implement empty states on all list screens | FE | Empty state components | Friendly messages when no data |

### Days 23-24 — Performance + Device Testing

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Test on iPhone SE (smallest screen) | FE | Bug list | No layout issues |
| Test on iPhone 15 Pro Max (largest screen) | FE | Bug list | No layout issues |
| Profile app startup time, optimize if >3s | FE | Performance notes | Cold start <3s |
| Profile voice latency, optimize if >1.2s P95 | FE | Latency data | P95 <1.2s on device |

### Day 25 — Edge Function Security Review

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Audit all edge functions: verify no service role key exposure to client | BE | Security audit doc | 0 exposed keys |
| Implement rate limiting on voice-command edge function (60 req/min/user) | BE | Rate limit logic | Excessive requests rejected with 429 |
| Rotate service role key | BE | New key deployed | Old key invalidated |
| Verify model config is only in _shared/config.ts (not hardcoded elsewhere) | BE | Grep results | 0 hardcoded model IDs |

**Exit criteria for Week 5:** Crash reporting live. Error/loading/empty states everywhere. Device tested. Security reviewed.

---

## Week 6: Legal, Compliance, and Store Prep
**Theme: Get ready to ship**

### Days 26-27 — Legal Documents

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Draft and host privacy policy (voice data, OpenAI processing, no audio storage, data retention) | BE | Hosted URL | Accessible via URL |
| Draft and host terms of service | BE | Hosted URL | Accessible via URL |
| Set up support email/URL | BE | Contact point | Responds to test email |
| Complete Privacy Nutrition Labels in App Store Connect | BE | Labels submitted | All categories filled |

### Days 28-29 — App Store Assets

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Design app icon (1024x1024) | FE | Icon file | Uploaded to App Store Connect |
| Create 6 screenshots for 6.7" display | FE | Screenshot files | Uploaded |
| Create 6 screenshots for 5.5" display | FE | Screenshot files | Uploaded |
| Create 30-second preview video | FE | Video file | Uploaded |
| Write App Store description, keywords, subtitle | BE | Copy | Entered in App Store Connect |

### Day 30 — Final Pre-Beta Checklist

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Run complete acceptance criteria (R1-R5) | Both | Pass/fail for each | All R1-R5 passing |
| Fix any remaining failures | Both | Bug fixes | All critical issues resolved |
| Create TestFlight build | BE | IPA uploaded | Build processing in App Store Connect |

**Exit criteria for Week 6:** Legal docs hosted. Store assets uploaded. R1-R5 passing. TestFlight build uploaded.

---

## Weeks 7-8: Beta + Launch
**Theme: Validate with real users, then ship**

### Week 7 — TestFlight Beta

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Distribute to beta group 1 (heavy voice users, ~10 people) | Both | TestFlight invites | Users testing |
| Distribute to beta group 2 (text-preferred, ~10 people) | Both | TestFlight invites | Users testing |
| Distribute to beta group 3 (circles-heavy, ~10 people) | Both | TestFlight invites | Users testing |
| Monitor daily: crash rate, voice success rate, P95 latency, RLS leaks | Both | Daily metrics | Dashboards checked daily |
| In-app feedback: "Was that right?" after 1 in 5 voice actions | FE | Feedback mechanism | Responses collected |
| Fix bugs reported by beta testers | Both | Bug fixes | Critical bugs resolved within 24h |

### Week 8 — Launch

| Task | Owner | Output | Done When |
|------|-------|--------|-----------|
| Verify TestFlight gates met: voice success >= 85%, crash-free >= 99%, P95 < 1.2s, 0 RLS leaks | Both | Gate check | All gates passing |
| Submit to App Store review | BE | Submission | "Waiting for Review" status |
| Prepare launch communications (social, Product Hunt, etc.) | Both | Launch assets | Ready to post on approval |
| Monitor App Store review, respond to any questions | BE | Review responses | App approved |
| Launch | Both | App live | Available in App Store |

**Exit criteria for Week 8:** App live in App Store with all R1-R5 passing, legal compliance complete, and beta-validated quality metrics.

---

## Contingency: If Voice Takes Longer

If OpenAI Realtime API integration takes >2 weeks:
1. Ship with REST fallback path (Whisper → GPT → TTS) as primary voice. Latency will be ~1.5-2s.
2. Label it "beta voice quality" in TestFlight notes.
3. Continue Realtime API work in parallel with beta.
4. Gate App Store submission on voice P95 <1.2s (achievable even with REST path).
5. Ship Realtime API as a post-launch update for the <800ms target.

This is acceptable because the PRD's beta target is <1.2s, which the REST path can meet.

---

## What to Build Now

Start Day 1 immediately. The highest-leverage action today is: **create migration 007 (event_log schema alignment) + migration 009 (RLS hardening)**. Everything downstream depends on correct data and correct security.
