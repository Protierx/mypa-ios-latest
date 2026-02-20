# MYPA — Product Requirements Document

**Version:** 3.0
**Date:** February 8, 2026
**Status:** In Development (~60% Complete)

---

## 1. Product Vision

MYPA (My Personal AI) is a voice-first productivity app for iOS that redefines task management by making AI conversation the core interaction model. Users don't navigate an app — they talk to a personal assistant that happens to be incredibly organized.

**One-liner:** "MYPA is not an app with AI. MYPA IS the AI."

### Success Criteria

1. Users say: "I just told MYPA and it handled it" — voice works seamlessly
2. Users say: "My MYPA knows I work best at 9am" — AI has learned their patterns
3. Users say: "My circle keeps me accountable" — social creates stickiness

---

## 2. Target Users

### Primary Personas

| Persona | Description | Pain Point | MYPA Solution |
|---------|-------------|------------|---------------|
| **Busy Professional** | 25-45, knowledge worker, juggles meetings/deadlines | Too many apps, too much friction to organize | Voice-first capture, AI handles organization |
| **ADHD Community** | Adults struggling with executive function | Traditional task apps require discipline they lack | MYPA reduces friction to near-zero; talk, don't type |
| **Busy Parent** | Managing family schedules + work | Hands full, can't type | Voice commands while multitasking |
| **Accountability Seeker** | Wants social motivation | Solo productivity lacks motivation | Circles provide peer accountability |

### Market Positioning

| Competitor | What They Do | What MYPA Does Differently |
|------------|-------------|---------------------------|
| Todoist / Things / TickTick | Traditional task management with AI features | AI IS the product, not a feature |
| Siri / Alexa | Voice assistants for general queries | Deep, personalized life management |
| BeReal / Strava | Social accountability for photos/fitness | Social accountability for PRODUCTIVITY |
| Generic AI chatbots | One-size-fits-all assistants | Learns YOUR patterns, becomes YOUR assistant |

---

## 3. Business Model

### Pricing

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | Basic task management, 10 voice commands/day, 1 circle |
| **Premium** | $4.99/month or $39.99/year | Unlimited voice, AI insights, advanced analytics, unlimited circles, focus sessions |

### Revenue Projections

| Scenario | MAU | Premium Conversion | MRR |
|----------|-----|-------------------|-----|
| Pessimistic | 1,000 | 2% | $100 |
| Moderate | 5,000 | 5% | $1,250 |
| Optimistic | 20,000 | 8% | $8,000 |

### Monetization via RevenueCat

- In-app purchase managed through RevenueCat SDK
- Free up to $2.5K MTR, then percentage-based
- Apple takes 30% (15% after year 1 in small business program)

### Cost & Tier Enforcement

#### Usage Counters

| Counter | Storage | How It Works |
|---------|---------|-------------|
| `voice_commands_today` | **Computed** from `event_log` | `SELECT COUNT(*) FROM event_log WHERE user_id = $1 AND event_type = 'voice_command' AND created_at >= (now() AT TIME ZONE profiles.timezone)::date`. No mutable counter to reset; stale-counter bug is impossible. Cached in memory for the session; re-queried on app foreground. |
| `is_premium` | RevenueCat entitlement, cached in `profiles.is_premium` | Synced on app launch + RevenueCat webhook. Client checks `is_premium` before enforcing limits. |

#### Free Tier Limits

| Resource | Limit | What Happens at Limit |
|----------|-------|-----------------------|
| Voice commands / day | 10 | Soft upsell: "You've used your 10 voice commands today. Upgrade to Premium for unlimited, or use the text input." Text input remains available. |
| Circles | 1 | "Create Circle" button shows lock icon + "Premium" badge. Tapping shows upsell sheet. |
| AI model | GPT-3.5 only | Transparent to user; premium unlocks GPT-4 for complex queries |
| Focus sessions | Unlimited | No limit (drives engagement) |
| Brain dump | 3 / day | Similar soft upsell as voice |

#### On Limit Hit: Soft Upsell Flow

1. Show bottom sheet: "You've hit today's limit"
2. Two CTAs: "Upgrade to Premium" (primary) / "Use text instead" (secondary)
3. Never hard-block the user — always offer a degraded fallback
4. Track upsell impressions and conversions in `event_log`

#### Model Routing Rules (OpenAI Cost Control)

Routing is **capability-based**, not model-name-based. Concrete model IDs live in server config (`supabase/functions/_shared/config.ts`), NOT hardcoded in client or PRD. When OpenAI ships new models, swap the config — no PRD or code changes needed.

| Capability Tier | Description | Actions | Current Model (config) |
|----------------|-------------|---------|----------------------|
| **fast** | Simple intent → single mutation | `create_task`, `complete_task`, `update_task`, `delete_task`, `reschedule_task`, `query_*`, `start_focus_session`, `pause_focus`, `resume_focus`, `end_focus`, `set_preference` | `gpt-3.5-turbo` |
| **smart** | Multi-step reasoning, NL parsing | `batch_create_tasks`, `brain_dump`, `unknown`, `create_challenge` | `gpt-4-turbo` |
| **personalized** | Uses `user_model` context | Proactive suggestions, adapted tone (unlock level 4+) | `gpt-4-turbo` (premium-only on free tier) |
| **cached** | Pre-generated, served from storage | Daily briefing | `gpt-4-turbo` (generated once/day) |

**Config shape:**

```typescript
// supabase/functions/_shared/config.ts
export const MODEL_CONFIG = {
  fast: "gpt-4o-mini",
  smart: "gpt-4o",
  personalized: "gpt-4o",
  cached: "gpt-4o",
} as const;
```

#### Response Caching

- **Daily briefing:** Generated once at 6 AM, cached in Supabase Storage as text. Served from cache on app open.
- **Common greetings:** 10 pre-generated greeting variants stored locally. Rotated randomly.
- **Repeated queries:** If user asks the same `query_tasks` within 5 minutes, serve cached response.

---

## 4. Core Features

### 4.1 Voice-First Interaction (THE Core Experience)

**Priority: CRITICAL — This is the product.**

The moment the user opens MYPA, they can speak. No buttons, no menus, no friction.

#### Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| V-1 | Natural language task creation ("Add buy groceries tomorrow") | P0 | **Done** |
| V-2 | Voice queries ("What do I have today?") | P0 | **Done** |
| V-3 | OpenAI Realtime API for <500ms response latency | P0 | Not Started |
| V-4 | Auto-play daily briefing on app open | P0 | Not Started |
| V-5 | Natural interruption handling (user can cut in mid-response) | P1 | Not Started |
| V-6 | Voice control during focus sessions | P1 | Not Started |
| V-7 | Context-aware commands (knows what screen user is on) | P1 | Not Started |
| V-8 | Voice settings (speed, personality, language) | P2 | Not Started |
| V-9 | Graceful fallback to text input on voice failure | P1 | Not Started |
| V-10 | Rate limiting: 10 commands/day (free), unlimited (premium) | P1 | Not Started |

#### Voice Pipeline

```
User speaks → Microphone capture → OpenAI Realtime API (WebSocket)
  → STT (Whisper) → Intent parsing (GPT-4) → Action execution
  → Response generation → TTS → Audio playback to user
```

**Target latency (staged):**

| Milestone | P95 Latency Target | Notes |
|-----------|-------------------|-------|
| **Beta (TestFlight)** | <1.2s | Acceptable for early testers; focus on reliability |
| **v1.0 (App Store launch)** | <800ms | "Feels responsive" threshold |
| **v1.1+** | <500ms | "Feels instant" — requires Realtime API optimizations + edge caching |

Latency is measured from: user stops speaking → first byte of TTS audio plays.

#### Voice UX State Machine

**v1: Tap-to-talk only.** Wake word is deferred to v2+ (major technical + App Store risk; requires always-on mic permission).

```
                    ┌─────────────────────────────┐
                    │                             │
                    ▼                             │
              ┌──────────┐      tap orb        ┌──────────┐
              │   IDLE   │ ──────────────────► │ LISTENING│
              └──────────┘                     └──────────┘
                ▲   ▲                            │     │
                │   │                   silence  │     │ speech
                │   │                  (3s)      │     │ detected
                │   │                   ┌────────┘     │
                │   │                   ▼              ▼
                │   │              ┌──────────┐  ┌────────────┐
                │   │              │ TIMEOUT  │  │ PROCESSING │
                │   │              └──────────┘  └────────────┘
                │   │                                  │
                │   │                                  │ response ready
                │   │                                  ▼
                │   │                            ┌──────────┐
                │   └────── done speaking ───────│ SPEAKING │
                │                                └──────────┘
                │                                   │
                │               barge-in (user      │
                │               starts talking)     │
                └───────────────────────────────────┘
                        (cancel TTS → LISTENING)
```

| State | Orb Visual | Behaviour |
|-------|-----------|-----------|
| **IDLE** | Slow breathing glow | Waiting for tap on orb. Shows last response text faintly. |
| **LISTENING** | Pulsing with audio amplitude | Mic active. Waveform visualizer. 3s silence → TIMEOUT. |
| **PROCESSING** | Spinning/thinking animation | Mic off. Waiting for AI response. If >3s → show "Still thinking..." |
| **SPEAKING** | Smooth wave matching TTS cadence | Playing TTS audio. User can barge-in (tap or speak) → cancel TTS, go to LISTENING. |
| **TIMEOUT** | Fade back to breathing | "I didn't catch that — tap to try again." → IDLE after 2s. |
| **ERROR** | Red pulse | "I'm having trouble connecting." Tap to retry or text fallback. → IDLE after 5s. |
| **OFFLINE** | Grey pulse | "No connection. You can type instead." Show text input. |

#### Transitions & Edge Cases

- **Barge-in:** If user speaks while MYPA is in SPEAKING state, immediately stop TTS playback and transition to LISTENING
- **Cancel:** User taps X or swipes down at any state → return to IDLE, cancel any in-flight request
- **Timeout:** 3s of silence in LISTENING → TIMEOUT → IDLE. 10s of no response in PROCESSING → ERROR
- **Offline:** Network check before LISTENING. If offline → OFFLINE state with text input fallback
- **Retry:** From ERROR, tap to retry → LISTENING. Max 2 retries before suggesting text input
- **Discreet mode:** Toggle in settings. When active: skip LISTENING/SPEAKING, show text input + AI text response. Actions still execute the same way.
- **Whisper mode:** Lower TTS volume, shorter responses, haptic feedback instead of audio confirmation

#### Daily Briefing Spec

- Triggers automatically on app open (first open of the day)
- Content: today's task count, top 3 tasks, streak status, any circle activity, upcoming deadlines
- Tone: warm, conversational, like a friend catching you up
- Duration: 15-30 seconds max
- User can tap to skip or interrupt with a new command (barge-in → LISTENING)

**Generation strategy:**

1. **Pre-generation (preferred):** pg_cron runs hourly, calls `daily-brief` Edge Function. Function queries users whose `profiles.timezone` (IANA string, e.g. `America/New_York`) indicates it is currently 6:00 AM local. Generates briefing text via GPT-4, caches in `profiles.briefing_cache` (text + `briefing_date`).
2. **On-demand fallback:** If user opens app and `briefing_date != today`, generate on-demand (adds ~1-2s latency on first open). Cache result for the rest of the day.
3. **DST handling:** Always compute local time from IANA timezone via `AT TIME ZONE`. Never store raw UTC offsets.
4. **`profiles.timezone` is required:** Set during onboarding (auto-detected from device, user can override). If missing, default to device timezone on first app open and persist.
5. **Freshness SLA:** Briefing reflects task state as of generation time. If user completes tasks after briefing was cached, briefing is NOT regenerated (acceptable; briefing is a morning snapshot).
6. **Tracking:** Log `briefing_started`, `briefing_progress` (25%, 50%, 100%), `briefing_skipped` to `event_log` for listen-through rate measurement.

---

### 4.2 Task Management

**Priority: HIGH — The backbone that voice commands operate on.**

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| T-1 | Create tasks (title, date, time, duration, category, priority) | P0 | Done |
| T-2 | View tasks by day, week, all open | P0 | Done |
| T-3 | Complete/uncomplete tasks with XP award | P0 | Done |
| T-4 | Edit task details | P1 | Partial |
| T-5 | Delete tasks | P0 | Done |
| T-6 | Batch task creation (from brain dump) | P1 | Partial |
| T-7 | Task sorting / reordering | P1 | Done |
| T-8 | AI-suggested categorization and priority | P2 | Not Started |
| T-9 | Recurring tasks | P2 | Not Started |
| T-10 | Task detail modal (edit, start focus, delete) | P1 | Not Started |

#### Task Data Model

```
Task {
  id, user_id, title, description?,
  date?, time?, duration_min (default 30),
  category (Personal | Work | Health | Fitness | Wellness | Creative),
  priority (LOW | NORMAL | HIGH | URGENT),
  is_fixed (boolean), completed (boolean), completed_at?,
  ai_categorized, ai_suggestions?, xp_awarded,
  created_at, updated_at
}
```

---

### 4.3 Gamification & Progressive Unlocks

**Priority: HIGH — The retention engine.**

#### XP System

| Action | XP Awarded |
|--------|-----------|
| Complete task | 10 |
| Complete high-priority task | 20 |
| Complete focus session | 15 |
| Perfect focus session (no pauses) | 25 |
| Daily streak | 5 |
| Weekly streak (7 days) | 50 |
| Monthly streak (30 days) | 200 |
| Join a circle | 25 |
| Complete assignment | 30 |
| Win challenge | 100 |

**Level formula:** `XP_needed = 100 * (level - 1)^1.5`

**Streak multipliers:** 3+ days: 1.1x | 7+ days: 1.25x | 14+ days: 1.5x | 30+ days: 2.0x

#### Progressive AI Unlock System

This is the "moat" — users invest in MYPA and can't switch.

| Unlock | Trigger | Description |
|--------|---------|-------------|
| Basic Commands | Day 1 | Task creation, queries, simple commands |
| Peak Hours Insight | Day 7+ | AI identifies when user is most productive |
| Duration Estimation | Day 14+ | AI predicts how long tasks will take based on history |
| Proactive Suggestions | Day 21+ | AI suggests tasks, warns about overload |
| Full Personalization | Day 30+ | AI adjusts tone, knows preferences, anticipates needs |

#### Unlock Gating Rules

**Policy: Locked = visible but disabled.** Users can see that a feature exists (greyed out with a lock icon and "X days to unlock" label), but cannot interact with it. This creates anticipation without confusion.

| Unlock Level | `user_model.unlock_level` | UI Changes | Voice Changes |
|--------------|--------------------------|------------|---------------|
| **1 — Basic** (Day 1) | 1 | Task CRUD, streak display, circles, focus timer all active. Insight cards show "Collecting data..." placeholder. | Voice handles: `create_task`, `complete_task`, `query_tasks`, `query_schedule`, `query_stats`. Daily briefing is generic template. |
| **2 — Peak Hours** (Day 7+) | 2 | "Peak Hours" card appears on Hub with productive time ranges. Profile shows "AI Level 2" badge. Unlock celebration modal fires once. | Briefing includes: "You're usually most productive around 9-11am." AI can reference peak hours in responses. |
| **3 — Duration Est.** (Day 14+) | 3 | Task creation shows "AI estimate: ~25 min" below duration field. Plan view shows estimated total time. | Voice: "That usually takes you about 30 minutes — want me to block that time?" |
| **4 — Proactive** (Day 21+) | 4 | Push notifications for proactive suggestions. "MYPA Suggests" section appears on Hub. Overwhelm alert banner when score > 0.7. | Voice proactively speaks: "Heads up — you've got 8 tasks tomorrow and usually complete 5. Want to reschedule some?" |
| **5 — Full Personal.** (Day 30+) | 5 | All insight cards fully active. "Fully Trained" badge on profile. Personalized Hub layout. | AI adapts tone to `tone_preference`. Anticipates needs: "Good morning — you usually add gym on Tuesdays, want me to add it?" |

#### Unlock Celebration Modal

- Fires once per unlock level transition (tracked via `user_model.unlock_level` + local flag)
- Shows: unlock name, description, example of what's new, animated confetti
- CTA: "Try it now" (deep-links to relevant feature)
- Dismissible; never blocks the app

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| G-1 | XP awarded on task completion (with streak multiplier) | P0 | Done |
| G-2 | Level calculation and display | P0 | Done |
| G-3 | Streak tracking (daily) | P0 | Done |
| G-4 | Streak screen with calendar visualization | P1 | Done |
| G-5 | Level screen with progress bar | P1 | Done |
| G-6 | Unlock celebration modal | P1 | Not Started |
| G-7 | Event logging for AI learning | P1 | Partial (voice wired) |
| G-8 | Nightly pattern calculation (pg_cron) | P1 | Not Started |
| G-9 | Connect unlock milestones to UI | P1 | Not Started |
| G-10 | Overwhelm detection alerts | P2 | Not Started |

---

### 4.4 Social Accountability (Circles)

**Priority: HIGH — The market differentiator.**

Circles are groups where friends/colleagues hold each other accountable.

#### Circles MVP (v1 launch requirement)

The v1 Circles experience must be stable and privacy-safe, but does NOT need full challenge/leaderboard depth. MVP is the "Strava daily card" loop:

1. Create / join a circle
2. See members + daily life cards (counts only, no task titles — see Privacy Defaults)
3. React to daily cards (emoji reactions)
4. Privacy toggles work and default to "counts only"
5. Realtime updates do not leak data across users (RLS verified)

Challenges, leaderboards, assignments, and proof photos are **v1.x polish** — they exist in code but are not launch-blocking.

#### Full Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| S-1 | Create circle (name, emoji, color, description) | P0 | Done |
| S-2 | Invite members (by invite code or username) | P0 | Done |
| S-3 | View circle members and their activity | P0 (MVP) | Partial |
| S-4 | Circle feed (daily life cards) | P0 (MVP) | Partial |
| S-5 | Reactions on feed posts | P0 (MVP) | Partial |
| S-6 | Create/join challenges within circles | P1 | Partial |
| S-7 | Challenge leaderboards | P1 | Partial |
| S-8 | Circle assignments (assign tasks to members) | P1 | Partial |
| S-9 | Proof submission for challenges (photo) | P1 | Done |
| S-10 | Circle home modal (members, activity, challenges) | P1 | Not Started |

#### Challenge Types

- `FOCUS_MINUTES` — who can accumulate the most focus time
- `TASKS_COMPLETED` — who completes the most tasks
- `STREAK_DAYS` — who maintains the longest streak
- `CUSTOM` — configurable by circle admin

#### Daily Life Card

Auto-generated card showing a member's daily activity:
- Tasks completed count
- Focus minutes
- Current streak day
- Shared to the circle feed automatically

---

### 4.5 Focus Sessions

**Priority: MEDIUM — Enhances productivity loop.**

Pomodoro-style focus timer linked to tasks.

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| F-1 | Start focus session (with optional task link) | P0 | Partial |
| F-2 | Pause / resume session | P0 | Partial |
| F-3 | Complete session with XP award | P0 | Partial |
| F-4 | Configurable session/break duration | P1 | Partial |
| F-5 | Voice control during focus ("pause", "how much time left") | P2 | Not Started |
| F-6 | Focus history and stats | P2 | Partial |

**Default timings:** 25min focus / 5min break / 15min long break / 4 sessions before long break

---

### 4.6 Brain Dump

**Priority: MEDIUM — Reduces friction for capture.**

Quick, unstructured thought capture that AI processes into actionable tasks.

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| B-1 | Free-text brain dump capture | P1 | Done |
| B-2 | AI categorization of dump items | P1 | Partial |
| B-3 | Convert dump items to tasks | P1 | Partial |
| B-4 | Voice brain dump ("Let me just dump everything...") | P2 | Not Started |

---

### 4.7 Action System Contract

**Priority: CRITICAL — The interface between AI and app logic.**

The AI never writes data directly. It proposes structured JSON actions; client code or Edge Functions validate and execute them.

#### Architecture Rule

```
User utterance → AI (GPT-4) → { action, params, confirmation? }
  → Client validates → Supabase mutation → Success/failure response → TTS
```

#### Action Registry

| Action | Required Params | Optional Params | Confirm? | Model |
|--------|----------------|-----------------|----------|-------|
| `create_task` | `title` | `date`, `time`, `duration_min`, `category`, `priority` | No | GPT-3.5 |
| `update_task` | `task_id`, at least one field | `title`, `date`, `time`, `duration_min`, `category`, `priority` | No | GPT-3.5 |
| `complete_task` | `task_id` | — | No | GPT-3.5 |
| `delete_task` | `task_id` | — | **Yes** | GPT-3.5 |
| `reschedule_task` | `task_id`, `new_date` | `new_time` | No | GPT-3.5 |
| `batch_create_tasks` | `tasks[]` (each with `title`) | per-task fields | No | GPT-4 |
| `start_focus_session` | — | `task_id`, `duration_min` | No | GPT-3.5 |
| `pause_focus` | — | — | No | GPT-3.5 |
| `resume_focus` | — | — | No | GPT-3.5 |
| `end_focus` | — | — | No | GPT-3.5 |
| `create_circle` | `name` | `emoji`, `color`, `description` | No | GPT-3.5 |
| `invite_to_circle` | `circle_id`, `username` or `invite_code` | `message` | No | GPT-3.5 |
| `create_challenge` | `circle_id`, `title`, `type`, `target_value`, `ends_at` | `emoji`, `xp_reward` | No | GPT-3.5 |
| `post_to_circle` | `circle_id`, `content` | `type` | No | GPT-3.5 |
| `query_tasks` | — | `date`, `filter`, `range` | No | GPT-3.5 |
| `query_schedule` | — | `date`, `range` | No | GPT-3.5 |
| `query_stats` | — | `metric` (streak, xp, level, focus) | No | GPT-3.5 |
| `query_circles` | — | `circle_id` | No | GPT-3.5 |
| `brain_dump` | `content` | — | No | GPT-4 |
| `set_preference` | `key`, `value` | — | No | GPT-3.5 |
| `unknown` | — | `raw_text` | No | GPT-4 |

#### Action JSON Schema

```json
{
  "action": "create_task",
  "params": {
    "title": "Buy groceries",
    "date": "2026-02-09",
    "category": "Personal",
    "priority": "NORMAL"
  },
  "confirmation_required": false,
  "confidence": 0.95
}
```

#### Validation Rules

- If `confidence < 0.7`: ask the user to confirm before executing
- If `confirmation_required`: speak confirmation and wait for "yes" / "no"
- If params fail validation: respond with a natural clarification ("What day should I add that to?")
- If action is `unknown`: attempt a conversational response, log the intent for review

#### Success / Failure Responses

- **Success:** "Done! Added 'Buy groceries' to tomorrow's list." (always echo back what was done)
- **Partial:** "I added the task, but I couldn't set a time — when should it be?"
- **Failure:** "Sorry, I couldn't do that. Want to try again?" (never expose raw errors)
- **Confirmation flow:** "I'll delete 'Buy groceries' — are you sure?" → wait for yes/no

---

### 4.8 Event Logging Schema & AI Learning Loop

**Priority: HIGH — Powers Phase 6 (progressive AI learning).**

Every meaningful user action is logged to the `event_log` table. A nightly batch job aggregates events into the `user_model` table.

#### Event Log Schema

```sql
CREATE TABLE event_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,       -- 'voice_command' | 'task_action' | 'focus_action' | 'navigation' | 'social_action'
  action        TEXT NOT NULL,       -- matches action registry: 'create_task', 'complete_task', etc.
  screen_context TEXT,               -- which screen the user was on
  intent_raw    TEXT,                -- original user utterance (if voice)
  params        JSONB,              -- action params that were sent
  success       BOOLEAN NOT NULL DEFAULT true,
  error_code    TEXT,                -- null on success
  latency_ms    INTEGER,            -- time from intent to execution complete
  ai_model_used TEXT,               -- 'gpt-3.5-turbo' | 'gpt-4-turbo'
  confidence    REAL,               -- AI confidence score 0-1
  user_override BOOLEAN DEFAULT false, -- true if user corrected the AI
  tokens_used   INTEGER,            -- OpenAI token count for cost tracking
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: users can only read their own events
-- Index on (user_id, created_at) for nightly aggregation
-- Index on (user_id, event_type) for pattern queries
-- TTL: raw events older than 90 days are archived/deleted
```

#### User Model Schema

```sql
CREATE TABLE user_model (
  user_id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  peak_hours           JSONB,    -- e.g. {"most_productive": "09:00-11:00", "least_productive": "14:00-15:00"}
  avg_task_durations   JSONB,    -- e.g. {"Work": 45, "Personal": 20, "Health": 30}
  completion_rate_7d   REAL,     -- 0.0-1.0
  completion_rate_30d  REAL,
  overwhelm_score      REAL,     -- 0.0-1.0 (high = too many tasks, low completion)
  preferred_categories JSONB,    -- ordered list by frequency
  voice_usage_rate     REAL,     -- % of actions done via voice vs UI
  avg_daily_tasks      REAL,
  common_reschedule_patterns JSONB, -- e.g. {"monday_to_tuesday": 0.3}
  tone_preference      TEXT DEFAULT 'friendly', -- 'friendly' | 'direct' | 'motivational'
  unlock_level         INTEGER DEFAULT 1,       -- 1-5 mapping to unlock tiers
  days_active          INTEGER DEFAULT 0,
  last_calculated_at   TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ DEFAULT now()
);
```

#### Nightly Pattern Calculation

- **Trigger:** pg_cron job at 2:00 AM UTC daily (Supabase Pro required)
- **Edge Function:** `calculate-unlocks` (already deployed, needs wiring)
- **Process:**
  1. Query `event_log` for each active user (last 30 days)
  2. Calculate: peak hours, avg durations per category, completion rates, overwhelm score
  3. Upsert into `user_model`
  4. Check if `days_active` crossed an unlock threshold → update `unlock_level`
  5. If new unlock → insert notification + set flag for celebration modal
- **Idempotency:** Safe to re-run; uses upsert with `last_calculated_at` guard

---

## 5. Navigation & UX

### Information Architecture

The app uses a **custom tab bar** with 5 destinations:

```
┌──────┬──────┬──────┬──────┬──────┐
│ Home │ Plan │ Talk │ Circ │ Prof │
└──────┴──────┴──────┴──────┴──────┘
```

| Tab | Screen | Purpose |
|-----|--------|---------|
| **Home** | HubScreen | Dashboard — today's tasks, streak, quick actions |
| **Plan** | PlanScreen | Calendar/week view of tasks |
| **Talk** | VoiceAssistantScreen (overlay) | Full-screen voice interface — the MYPA orb |
| **Circles** | CirclesScreen → CircleHomeScreen | Social accountability groups |
| **Profile** | ProfileScreen | Stats, XP, level, streak, settings |

### Screen Inventory

| Screen | Stack | Status |
|--------|-------|--------|
| HubScreen | Home | Done |
| PlanScreen | Plan (root) | Done |
| InboxScreen | Home | Done |
| WalletScreen | Home | Done |
| TasksScreen | Home | Done |
| TaskSortingScreen | Home | Done |
| VoiceAssistantScreen | Overlay | Partial |
| ListeningScreen | — | Done |
| CirclesScreen | Circles | Done |
| CircleHomeScreen | Circles | Partial |
| ChallengesScreen | Home | Partial |
| ProfileScreen | Profile | Done |
| EditProfileScreen | Profile | Done |
| SettingsScreen | Profile/Home | Partial |
| StreakScreen | Home | Done |
| LevelScreen | Home | Done |
| ResetScreen | Home | Done |
| ProofCameraScreen | Home | Done |
| ProofConfirmScreen | Home | Done |
| DailyLifeCardScreen | Home | Done |
| SavedPlacesScreen | Home | Done |
| LoginScreen | Auth | Done |
| NotificationsScreen | Profile | Partial |
| PrivacyControlsScreen | Profile | Partial |
| HelpSupportScreen | Profile | Partial |

### Modals (Not Yet Built)

| Modal | Purpose | Priority |
|-------|---------|----------|
| Task Detail | Edit task, start focus, delete | P1 |
| Circle Home | Members, activity, challenges | P1 |
| Challenge Detail | Leaderboard, progress | P1 |
| Settings | Voice, notifications, account | P1 |
| Quick Add Task | Overlay for fast task creation | P1 |
| Create Circle / Challenge | Multi-step creation flows | P1 |
| Unlock Celebration | Shows when user unlocks new AI feature | P1 |

---

## 6. Technical Architecture

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native | 0.81.5 |
| Toolchain | Expo | 54.0.0 |
| Language | TypeScript | 5.9.2 |
| Animations | React Native Reanimated | 4.1.1 |
| Gestures | React Native Gesture Handler | 2.28.0 |
| Navigation | React Navigation | 7.0.0 |
| Icons | Lucide React Native | 0.563.0 |
| Backend | Supabase | Cloud |
| AI | OpenAI GPT-4 Turbo | Latest |
| STT | OpenAI Whisper | Latest |
| TTS | OpenAI TTS | Latest |
| Payments | RevenueCat | TBD |

### Supabase Services

| Service | Purpose |
|---------|---------|
| Auth | Email, Apple Sign-In, Google Sign-In |
| PostgreSQL | Primary database (19 tables + RLS — see schema below) |
| Realtime | WebSocket subscriptions for live updates |
| Edge Functions | AI processing, TTS, push notifications (6 deployed) |
| Storage | Avatars, challenge proof photos |

### Database Schema

#### Core Tables (11)

| Table | Purpose |
|-------|---------|
| `profiles` | User profile, XP, level, streaks |
| `tasks` | Task CRUD, scheduling, completion |
| `focus_sessions` | Pomodoro timer sessions |
| `brain_dump_items` | Quick-capture items for AI processing |
| `circles` | Accountability groups |
| `circle_members` | Circle membership + role |
| `challenges` | Circle challenges (focus, tasks, streaks) |
| `challenge_participants` | Per-user challenge progress |
| `posts` | Circle feed content (daily cards, etc.) |
| `reactions` | Emoji reactions on posts |
| `notifications` | In-app notifications |

#### Supporting Tables (7)

| Table | Purpose |
|-------|---------|
| `circle_invitations` | Pending/accepted/declined invites |
| `push_tokens` | Expo push notification tokens |
| `achievements` | Achievement definitions |
| `user_achievements` | Per-user unlocked achievements |
| `user_settings` | Voice, privacy, focus preferences |
| `saved_places` | User's saved locations |
| `event_log` | **NEW** — AI learning event stream (see 4.8) |

#### Planned Tables (1)

| Table | Purpose |
|-------|---------|
| `user_model` | **NEW** — AI-computed user patterns (see 4.8) |

**Total: 19 tables (11 core + 7 supporting + 1 planned)**

All tables have Row Level Security (RLS) enabled. Database triggers handle: auto-profile creation on signup, streak calculation, XP awards.

### External Services

| Service | Purpose | Cost |
|---------|---------|------|
| OpenAI GPT-4 Turbo | AI responses, intent parsing | ~$0.01-0.03/1K tokens |
| OpenAI Whisper | Speech-to-text | ~$0.006/minute |
| OpenAI TTS | Text-to-speech | ~$0.015/1K chars |
| Expo Push | Push notifications | Free |
| RevenueCat | Subscription management | Free up to $2.5K MTR |

---

## 7. Implementation Roadmap

### Current Status: ~60% Complete

#### Completed (Phases 1-3)

- [x] Supabase infrastructure (schema, RLS, triggers, 6 Edge Functions)
- [x] Auth flow (login, signup, session management)
- [x] Core navigation (tab bar with custom voice button)
- [x] Home/Hub dashboard
- [x] Task CRUD with gamification
- [x] Plan/calendar view
- [x] Basic voice interface (VoiceAssistantScreen)
- [x] Circles CRUD, invitations, membership
- [x] Challenges framework
- [x] Profile, XP, levels, streaks screens
- [x] Daily Life Cards
- [x] Proof camera for challenges
- [x] UI component library (20+ components in `components/ui/`)

### Phase 4: Modals — Estimated 1 week (40 hours)

- [ ] Task Detail Modal
- [ ] Circle Home Modal
- [ ] Challenge Detail Modal
- [ ] Settings Modal
- [ ] Quick Add Task overlay
- [ ] Create Circle / Challenge flows
- [ ] Unlock Celebration Modal

### Phase 5: Voice System (CRITICAL PATH) — Estimated 1-2 weeks (30 hours)

- [ ] OpenAI Realtime API integration (WebSocket streaming)
- [x] Auto-play daily briefing on app open
- [x] Natural interruption handling (barge-in skips TTS, transitions to listening)
- [ ] Voice during focus sessions
- [ ] Context-aware commands
- [x] Error handling and graceful fallbacks (Action System wired)
- [ ] Voice settings (speed, personality)

### Phase 6: AI Learning (THE MAGIC) — Estimated 1 week (25 hours)

- [x] Wire event logging throughout app (voice pipeline complete; UI actions pending)
- [ ] Implement nightly pattern calculation (pg_cron, requires Supabase Pro $25/mo)
- [ ] Connect unlock milestones to UI
- [ ] Personalized AI responses using user_model data
- [ ] Peak hours insight display
- [ ] Overwhelm detection alerts
- [ ] Duration estimation based on history

### Phase 7: Polish — Estimated 1 week (30 hours)

- [ ] Performance optimization
- [ ] Offline support / error boundaries
- [ ] Loading states everywhere
- [ ] Accessibility (VoiceOver)
- [ ] Dark mode polish

### Phase 8: Launch — Estimated 1 week (20 hours)

- [ ] RevenueCat integration
- [ ] App Store assets (icon, screenshots, preview video)
- [ ] Privacy policy and terms of service
- [ ] TestFlight beta distribution
- [ ] App Store submission

**Total remaining: ~145 hours across 5-6 weeks**

---

## 8. Scheduling & Cron Decision

### Decision: Supabase Pro pg_cron (primary) + GitHub Actions (fallback)

**Primary:** Supabase Pro ($25/mo) provides pg_cron for in-database scheduling. This is the cleanest option since all data is already in Supabase PostgreSQL.

**Fallback:** If Supabase Pro is deferred, use GitHub Actions scheduled workflows calling Edge Functions via HTTP.

### Cron Jobs

| Job | Schedule | Edge Function | Idempotency Rule |
|-----|----------|---------------|------------------|
| **Daily briefing generation** | 6:00 AM user-local (batch by timezone at UTC offsets) | `daily-brief` | Checks `last_briefing_date` on profile; skips if already generated today |
| **Nightly pattern calculation** | 2:00 AM UTC | `calculate-unlocks` | Uses `user_model.last_calculated_at`; skips if calculated in last 20 hours |
| **Streak reminders** | 8:00 PM user-local (batch) | `send-push` | Checks if user has completed any task today; only sends if streak is at risk and no reminder sent today |
| **Task reminders** | Every 15 minutes | `send-push` | Checks `tasks` where `time` is 15 min from now and `reminder_sent = false`; marks sent after push |
| **Event log cleanup** | Weekly (Sunday 3:00 AM UTC) | `cleanup-events` (new) | Archives `event_log` rows older than 90 days to cold storage / deletes |

### pg_cron Setup

```sql
-- Daily briefing (runs hourly, filters by timezone offset)
SELECT cron.schedule('daily-briefing', '0 * * * *',
  $$SELECT net.http_post(
    url := 'https://exztrtyvjipikqexpirr.supabase.co/functions/v1/daily-brief',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
  )$$
);

-- Nightly pattern calc
SELECT cron.schedule('nightly-patterns', '0 2 * * *',
  $$SELECT net.http_post(
    url := 'https://exztrtyvjipikqexpirr.supabase.co/functions/v1/calculate-unlocks',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
  )$$
);
```

All Edge Functions called by cron must be **idempotent** — safe to call twice without side effects. Each checks a timestamp guard before executing.

---

## 9. Monthly Operating Costs

| Service | Free Tier | 1K Users | 10K Users |
|---------|-----------|----------|-----------|
| Supabase | $0 | $25/mo | $50/mo |
| OpenAI | ~$5 | ~$50/mo | ~$300/mo |
| Expo | $0 | $0 | $99/mo |
| RevenueCat | $0 | $0 | 1% revenue |
| Apple Developer | $8.25/mo | $8.25/mo | $8.25/mo |
| **Total** | **~$15/mo** | **~$85/mo** | **~$460/mo** |

---

## 10. Risks, Mitigations & Privacy

### Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **OpenAI Realtime API stability** | High | Reconnect logic with exponential backoff. Fallback to REST (Whisper → GPT → TTS) if WebSocket fails. Monitor via latency dashboard. |
| OpenAI API costs spike at scale | High | Capability-based model routing (fast/smart), response caching, usage limits. Model IDs in config — swap to cheaper models without code changes. |
| Voice latency > targets | High | Staged targets (1.2s beta → 800ms v1 → 500ms v1.1). Edge caching for briefings. |
| Voice recognition accuracy | Medium | Fallback to text input, confirmation for destructive actions. Monitor `user_override` rate as proxy. |
| iOS App Store rejection | High | Follow HIG, privacy compliance, no private API usage, no wake word (no always-on mic). |
| Supabase outage | High | Error states, offline queue, retry logic. |
| **Cron timezone / DST correctness** | Medium | Use IANA timezone strings (never raw UTC offsets). Test across US timezones + DST transitions. On-demand briefing fallback if cron misses. |
| **Service role key exposure** | High | SERVICE_ROLE_KEY used ONLY in pg_cron → Edge Function calls (server-side). Never exposed to client. Rotate before launch. Audit Edge Functions for accidental exposure. |
| **Mobile network variability** | Medium | Voice state machine handles OFFLINE state. Reconnect on network change. Queue actions if network drops mid-execution. |

### Product Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Users prefer typing over voice | High | UI fallback is first-class — not degraded. Discreet mode suggested during onboarding for "on the go" users. |
| Voice feels awkward in public | Medium | Discreet mode (text input with AI), suggested during onboarding. Whisper mode for v1.1. |
| Competition from Todoist/Things adding AI | Medium | Unique voice-first positioning, social moat with circles, progressive unlock lock-in. |
| Privacy concerns about voice data | Medium | No audio stored (ever). Transcripts 90-day TTL. Clear privacy policy disclosure. |
| **Circles engagement too low** | Medium | Circles MVP is lightweight (daily cards + reactions). If daily cards feel spammy or empty, social moat won't form. Need careful notification pacing + "quiet hours." |
| **Cost control sensitivity** | Medium | Economics depend on routing + caching + limits. If users use voice heavily (>50/day), costs spike. Monitor per-user cost via `event_log.tokens_used`. |

### Compliance

- [x] Apple Sign-In support (required if offering social login)
- [x] Data deletion capability
- [ ] Privacy policy (required for App Store)
- [ ] Privacy nutrition labels (required for App Store)
- [ ] GDPR compliance (if targeting EU users)
- [ ] Terms of Service

### Privacy & Data Retention Rules (Ship Blocker)

#### Voice Data

| Data Type | Stored? | Where | Retention | User Can Delete? |
|-----------|---------|-------|-----------|-----------------|
| Raw audio | **No** | Never stored. Streamed to OpenAI Realtime API and discarded. | N/A | N/A |
| Transcripts (STT text) | **Yes** | `event_log.intent_raw` | 90 days, then archived/deleted | Yes — "Delete voice history" in Settings |
| AI responses (text) | **No** | Not stored server-side. Displayed ephemerally in voice UI. | N/A | N/A |
| TTS audio | **No** | Streamed and discarded after playback. | N/A | N/A |

#### Account Data Lifecycle

| Action | Behaviour |
|--------|-----------|
| **Delete voice history** | Clears `event_log` rows where `event_type = 'voice_command'` for that user. Immediate. |
| **Export my data** | Generates JSON export of: profile, tasks, focus sessions, brain dumps, event log, user model. Delivered via Supabase Storage signed URL (expires in 24h). |
| **Delete account** | Cascading delete: profile → all related rows (tasks, events, circles membership, etc.). Supabase Storage files (avatar, proofs) deleted. Completed within 24 hours. Confirmation required (type "DELETE"). |

#### Circle Privacy Defaults

| Data | Visible to Circle Members? | Configurable? |
|------|-----------------------------|---------------|
| Tasks completed count (number only) | Yes (via Daily Life Card) | Yes — toggle in Privacy Controls |
| Task titles | **No** — never shared | N/A |
| Focus minutes (number only) | Yes (via Daily Life Card) | Yes — toggle |
| Streak day count | Yes | Yes — toggle |
| XP / Level | Yes (on profile) | Yes — toggle `show_level`, `show_streak` in `user_settings` |
| Challenge progress | Yes (within challenge) | No — required for challenge participation |

#### OpenAI Data Processing

- MYPA uses the OpenAI API (not ChatGPT) — OpenAI does **not** train on API data by default
- No user data is sent to OpenAI except: the current utterance transcript + minimal context (task titles for the current day, user's first name)
- Privacy policy must disclose: "Voice commands are processed by OpenAI's API. No audio is stored."

#### GDPR (if targeting EU)

- Right to access: covered by "Export my data"
- Right to erasure: covered by "Delete account"
- Right to rectification: users can edit all profile data
- Data processing agreement: Supabase DPA + OpenAI DPA required
- **Decision: defer GDPR for v1 launch (US-only). Add before EU expansion.**

---

## 11. Success Metrics (KPIs)

### Engagement

| Metric | Target (Month 1) | Target (Month 6) |
|--------|-------------------|-------------------|
| DAU/MAU ratio | 30% | 50% |
| Voice commands per user per day | 3 | 8 |
| Tasks created per user per day | 2 | 5 |
| Average session duration | 3 min | 5 min |
| 7-day retention | 40% | 60% |
| 30-day retention | 20% | 40% |

### Social

| Metric | Target |
|--------|--------|
| % users in at least 1 circle | 30% by month 3 |
| Average circle size | 4 members |
| Challenges created per circle per month | 2 |

### Revenue

| Metric | Target |
|--------|--------|
| Free-to-premium conversion | 5% by month 6 |
| Monthly churn rate | <8% |
| LTV:CAC ratio | >3:1 |

### Voice Quality

| Metric | Target |
|--------|--------|
| STT accuracy | >95% |
| Response latency (P95) | <800ms |
| Voice interaction success rate | >90% |
| Daily briefing listen-through rate | >60% |

---

## 12. Calendar Sync (v2 — Post-Launch)

### Decision: Yes, but v2. Not in initial launch.

Calendar sync adds significant value (AI can reason about free time, avoid conflicts) but is not a launch blocker. Ship v1 without it; add in first major update.

### v2 Spec (when implemented)

| Aspect | Apple Calendar | Google Calendar |
|--------|---------------|-----------------|
| **Direction** | Read-only (v2), Read-write (v3) | Read-only (v2), Read-write (v3) |
| **What's read** | Event titles, start/end times, all-day flags | Same |
| **What's NOT read** | Attendees, notes, locations (privacy) | Same |
| **Permission UX** | iOS native calendar permission prompt | OAuth consent screen |
| **Conflict rules** | If user creates a task during a calendar event, MYPA warns: "You have a meeting at that time — reschedule?" | Same |
| **Write (v3 only)** | Create calendar events for fixed tasks | Same |
| **Sync frequency** | On app open + every 30 min background fetch | On app open + webhook if available |

### Why Not v1

- Adds 2+ weeks of dev time
- Requires additional permissions (privacy nutrition labels)
- Core value prop (voice + tasks + social) doesn't depend on it
- Can ship as a compelling "what's new" in first update

---

## 13. Definition of Done (DoD)

Every feature is considered "done" when ALL of the following are true:

### Functional

- [ ] Works via **voice command** (action registered in Action Registry, AI can trigger it)
- [ ] Works via **UI fallback** (manual tap/type path exists for the same action)
- [ ] **RLS-safe**: all Supabase queries use the authenticated user's context; no data leaks across users
- [ ] **Event logged**: all user actions emit an entry to `event_log` (see 4.8)
- [ ] **Errors handled gracefully**: network failure, API error, invalid input all produce friendly user-facing messages (never raw errors)

### UI / UX

- [ ] Has **loading state** (skeleton or spinner while data loads)
- [ ] Has **empty state** (friendly message when no data, e.g. "No tasks yet — say 'add a task' to get started")
- [ ] Has **error state** (retry button + message)
- [ ] Respects the **design system** (uses `colors`, `textStyles`, `spacing`, `radius` from theme — no hardcoded values)
- [ ] Works on iPhone SE (small screen) through iPhone 15 Pro Max (large screen)

### AI / Unlock

- [ ] If the feature is gated by an unlock level, it follows the **Unlock Gating Rules** (visible but disabled when locked)
- [ ] Updates `user_model` / unlock state if the feature contributes to AI learning

### Quality

- [ ] TypeScript — no `any` types
- [ ] No new dependencies added without approval
- [ ] No console.log / console.error left in production code
- [ ] Tested on iOS simulator + physical device

---

## 14. Critical Decisions (Resolved)

Answers to the questions flagged during PM/tech-lead review.

| # | Question | Decision |
|---|----------|----------|
| 1 | **v1 activation moment:** What is the single onboarding path that guarantees wow in <60s? | **Briefing → one voice command → confirmed execution.** Onboarding flow: (1) set timezone, (2) MYPA plays a personalized greeting, (3) prompt: "Try saying 'Add buy groceries tomorrow'" → user speaks → task created → "Done! You're all set." Total: ~45 seconds. |
| 2 | **Voice in public:** Is discreet mode default-on or hidden? | **Suggested during onboarding, not default.** Onboarding asks: "Will you use MYPA mostly at home or on the go?" If "on the go" → enable discreet mode by default. Otherwise voice-first. User can toggle anytime in Settings. |
| 3 | **Wake word:** Are we committing? | **No. v1 is tap-to-talk only.** Wake word deferred to v2+. Removed from state machine. Requires always-on mic (battery, privacy, App Store risk). |
| 4 | **Briefing generation:** Pre-generated AND on-demand? Freshness SLA? | **Both.** Pre-generate at 6 AM local via pg_cron. On-demand fallback if cache is missing. Freshness SLA: briefing is a morning snapshot; NOT regenerated if user completes tasks later. See section 4.1 Daily Briefing Spec. |
| 5 | **Circles privacy:** Task titles never shared? Future opt-in? | **Correct: task titles are NEVER shared in v1.** Future: add opt-in "share task titles with this circle" toggle (v2), disabled by default. |
| 6 | **Unlock gating consistency:** "Visible but disabled" everywhere? | **Yes, consistent across UI + voice + upsells.** In UI: greyed card with lock icon + "X days to unlock." In voice: if user asks for a locked feature, MYPA says "I'll be able to do that after about X more days of use — I'm still learning your patterns." In upsell: locked features shown in premium comparison screen but NOT purchasable early (they're time-gated, not pay-gated). |
| 7 | **STT accuracy measurement:** How to measure >95% in production? | **Proxy metric + sampling.** Proxy: `voice_success_rate = voice_action_executed.success / voice_transcript_received`. Sampling: log 5% of transcripts (anonymized, no PII) for manual review weekly during beta. Post-beta: rely on `user_override` rate (if user corrects AI > 5% of the time, accuracy is below target). |

---

## 15. Build-Ready Acceptance Criteria

These are the 5 core requirements with exact acceptance tests. A feature passes when ALL criteria are met.

### R1 — Voice Command Execution (Core Loop)

**Requirement:** User speaks a command → MYPA executes it via the Action Contract with confirmations and fallbacks.

**Acceptance Criteria:**

- [x] Given "Add buy groceries tomorrow," system outputs action JSON `{ action: "create_task", params: { title: "Buy groceries", date: "tomorrow" }, confidence: 0.9+ }` and creates the task in Supabase
- [x] If `confidence < 0.7`, MYPA asks a clarifying question BEFORE mutation ("Did you mean 'Buy groceries' for tomorrow?")
- [x] Destructive actions (`delete_task`) require spoken "yes/no" confirmation before execution
- [x] On Supabase mutation failure, user sees friendly error ("Sorry, I couldn't save that. Want to try again?") + text input fallback offered; no raw error messages
- [x] `event_log` entry written with: `action`, `latency_ms`, `success`, `ai_model_used`, `confidence`, `tokens_used`, `user_override`
- [ ] Latency P95 < 1.2s for beta, < 800ms for v1.0
- [ ] Works offline: OFFLINE state shown, text input offered, action queued if possible

### R2 — Daily Briefing (Habit + Delight)

**Requirement:** On first open of day, MYPA plays a 15-30s briefing that is skippable and interruptible.

**Acceptance Criteria:**

- [x] Briefing triggers exactly once per day per user (guarded by `profiles.briefing_date`)
- [x] User can barge-in to cancel TTS → transitions to LISTENING for new command
- [x] If `briefing_cache` is missing or stale, generate on-demand and cache result
- [x] Briefing uses correct timezone from `profiles.timezone` (IANA string)
- [x] Briefing listen-through is tracked: `briefing_started`, `briefing_progress` (25%, 50%, 100%), `briefing_skipped` logged to `event_log`
- [x] Content includes: task count today, top 3 tasks, streak status, circle activity (if any)

### R3 — Usage Limits + Upsell

**Requirement:** Free users get 10 voice commands/day and 1 circle; premium removes limits.

**Acceptance Criteria:**

- [ ] At limit, show bottom sheet with "Upgrade to Premium" (primary CTA) + "Use text instead" (secondary)
- [ ] Limit is computed from `event_log` (not a mutable counter), so it cannot go stale
- [ ] Limit cannot be bypassed by going offline (client-side check + server-side enforcement on Edge Function)
- [ ] Every upsell view + tap is logged to `event_log` (`event_type: 'upsell'`)
- [ ] Premium entitlement synced via RevenueCat webhook + app launch check
- [ ] Free user creating a 2nd circle sees lock icon + upsell sheet

### R4 — Learning Loop Readiness

**Requirement:** Every meaningful action emits an event; nightly job updates `user_model` and `unlock_level`.

**Acceptance Criteria:**

- [ ] 95%+ of user actions have a corresponding `event_log` record (audited by comparing UI action counts vs event_log counts in beta)
- [ ] Nightly job (`calculate-unlocks`) is idempotent — safe to run twice without side effects
- [ ] Unlock level transitions trigger: (1) one-time `notification` insert, (2) `unlock_celebration_pending` flag on `user_model`, (3) next app open shows celebration modal
- [ ] `user_model` correctly computes: `peak_hours`, `avg_task_durations`, `completion_rate_7d`, `overwhelm_score`, `days_active`
- [ ] Gating is consistent: locked features show in UI (greyed + lock), voice says "I'll be able to do that after X more days"

### R5 — Circles MVP

**Requirement:** Users can create/join a circle and see daily activity cards without sharing task titles.

**Acceptance Criteria:**

- [ ] Daily life card shows counts only (tasks completed, focus minutes, streak day) — NEVER task titles
- [ ] Privacy toggles work: user can hide task count, focus minutes, streak from circles
- [ ] Privacy defaults are "counts only" (all toggles ON for counts, task titles always OFF)
- [ ] Realtime updates use RLS — verified: User A cannot see User B's task titles even with direct Supabase query
- [ ] Emoji reactions on daily cards work in real-time
- [ ] Circle membership changes (join/leave) reflected immediately via Supabase Realtime

---

## 16. Canonical Tracking Events

These are the minimum viable analytics events. Most map directly to `event_log` entries.

### Core Funnel

| Event | Properties | Source |
|-------|-----------|--------|
| `app_opened` | `first_open_today`, `timezone`, `app_version`, `is_premium` | Client |
| `briefing_started` | `briefing_length_chars` | Client |
| `briefing_progress` | `percent` (25, 50, 100) | Client |
| `briefing_skipped` | `skipped_at_percent` | Client |
| `voice_listening_started` | `screen_context` | Client |
| `voice_transcript_received` | `transcript_length`, `latency_ms` | Client |
| `voice_action_proposed` | `action`, `confidence`, `model_tier` | Edge Function |
| `voice_action_executed` | `action`, `success`, `latency_ms`, `tokens_used` | Client + Edge |
| `voice_fallback_to_text` | `reason` (offline, error, limit, user_choice) | Client |
| `ui_action_executed` | `action`, `screen_context` | Client |
| `upsell_shown` | `trigger` (limit_hit, locked_feature, premium_screen), `source_screen` | Client |
| `upsell_clicked` | `cta` (upgrade, dismiss, text_fallback) | Client |
| `purchase_completed` | `tier`, `price`, `source` | RevenueCat webhook |
| `unlock_achieved` | `new_level`, `days_active` | Edge Function |

### Computed Quality Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| **Voice success rate** | `voice_action_executed(success=true) / voice_transcript_received` | >90% |
| **Latency P95** | P95 of `voice_action_executed.latency_ms` | <800ms (v1.0) |
| **User override rate** | `event_log(user_override=true) / event_log(event_type='voice_command')` | <5% |
| **Briefing listen-through** | `briefing_progress(100%) / briefing_started` | >60% |
| **Upsell conversion** | `purchase_completed / upsell_shown` | >3% |
| **Daily active voice users** | Users with >= 1 `voice_action_executed` today | Track trend |
| **Event log coverage** | `event_log rows / (expected actions from UI + voice)` | >95% |

### STT Accuracy Measurement Plan

1. **Beta:** Sample 5% of transcripts (anonymized). Manual review weekly by team. Flag accuracy issues.
2. **Post-beta:** Rely on `user_override` rate as proxy. If override rate > 5%, investigate.
3. **Ongoing:** Track `voice_fallback_to_text(reason=error)` rate — spike = STT degradation.

---

## 17. v1 Launch Checklist

### Product Readiness

- [ ] Voice core loop passes scripted QA (20 common commands + 10 edge cases)
- [ ] Daily briefing works across US timezones (EST, CST, MST, PST) + DST fallback tested
- [ ] Free tier limits verified (no bypass via offline, app restart, or API manipulation)
- [ ] Circles MVP stable — no task title leakage confirmed via RLS audit
- [ ] Unlock gating consistent across UI and voice for all 5 levels
- [ ] Onboarding wow flow works end-to-end (timezone → greeting → first command → confirmed)
- [ ] Discreet mode toggle works; text fallback is fully functional

### Engineering

- [ ] Crash reporting integrated (Sentry or equivalent via Expo)
- [ ] Voice latency dashboard live (P50, P95, P99 from `event_log.latency_ms`)
- [ ] Rate limiting on Edge Functions (prevent spam voice requests; max 60 requests/min/user)
- [ ] Edge Function security review: no service role key exposed to client; rotated before launch
- [ ] Data retention job verified: 90-day event_log cleanup runs without error
- [ ] `profiles.timezone` populated for all test accounts (IANA format)
- [x] Model config lives in `supabase/functions/_shared/config.ts` — not hardcoded in client

### App Store + Legal

- [ ] App icon + 6 screenshots (6.7" and 5.5") + 30s preview video
- [ ] Privacy policy hosted (covers: voice data, OpenAI processing, no audio storage)
- [ ] Terms of Service hosted
- [ ] Support URL active (email or in-app)
- [ ] Privacy Nutrition Labels completed in App Store Connect
- [ ] Subscription products configured in App Store Connect + RevenueCat
- [ ] RevenueCat entitlement → `profiles.is_premium` sync verified

### Beta (TestFlight)

- [ ] TestFlight groups: (1) heavy voice users, (2) text-preferred users, (3) circles-heavy users
- [ ] In-app feedback capture: "Was that right?" prompt after 1 in 5 voice actions (logs to `event_log`)
- [ ] Release criteria gates:
  - Voice success rate >= 85%
  - Crash-free sessions >= 99%
  - P95 latency < 1.2s
  - No RLS data leaks in circle privacy audit
- [ ] Beta runs minimum 2 weeks before App Store submission

---

## 18. Open Questions (Remaining)

1. **Offline voice:** Should MYPA work offline with on-device STT (Apple Speech framework) as fallback? *Leaning: v2, too complex for v1.*
2. **Android:** When (if ever) should Android be prioritized? *Leaning: after iOS v1.1 is stable.*
3. **Notification strategy:** How aggressive should push notifications be? *Need: quiet hours config, per-type opt-out, daily cap.*
4. **Family plan:** Should there be a family/team tier? *Leaning: v2, depends on circle engagement data.*
5. **Onboarding depth:** Guided tutorial vs free-form? *Decision above: guided 3-step wow flow.*

---

*Document generated: February 8, 2026 | Updated: February 8, 2026 (v3.0 — PM/tech-lead review incorporated)*
