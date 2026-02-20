# MYPA Project Handoff Document
## Technical Summary for Management

**Document Version:** 1.0  
**Date:** February 6, 2026  
**Prepared by:** Senior Developer  
**Project Status:** In Development (~60% Complete)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Decisions](#4-architecture-decisions)
5. [Current Implementation Status](#5-current-implementation-status)
6. [Database Schema](#6-database-schema)
7. [API & Backend Services](#7-api--backend-services)
8. [Frontend Architecture](#8-frontend-architecture)
9. [AI & Voice Integration](#9-ai--voice-integration)
10. [Remaining Work](#10-remaining-work)
11. [Cost Estimates](#11-cost-estimates)
12. [Risks & Considerations](#12-risks--considerations)

---

## 1. Executive Summary

**MYPA** (My Personal AI) is a voice-first productivity application for iOS that fundamentally reimagines task management by putting AI conversation at the center of the user experience. Unlike traditional productivity apps with AI bolted on, MYPA's core interaction model is voice - users talk to MYPA like a supportive friend who helps them stay organized.

### Key Differentiators

| Traditional Apps | MYPA |
|-----------------|------|
| AI is a feature | AI IS the app |
| Tab-based navigation | Gesture-based (swipe) navigation |
| Type to add tasks | Talk to add tasks |
| Static interface | Living, breathing interface |
| Features available immediately | Progressive unlock (earns trust) |

### Business Model

- **Free Tier:** Basic task management, limited voice commands
- **Premium ($4.99/month or $39.99/year):** Unlimited voice, AI insights, advanced features
- **Target Market:** Productivity-focused professionals, ADHD community, busy parents

---

## 1.5. Founder's Vision

> **"MYPA is not an app with AI. MYPA IS the AI."**

### The Core Insight

Every productivity app treats AI as a feature—a chatbot in a corner, a button you press. MYPA inverts this entirely. When you open MYPA, you're not opening an app; you're talking to your personal assistant. The AI isn't inside the app—the AI IS the app.

### What MYPA Should Feel Like

**The moment you open MYPA:**
- You get an immediate briefing on your day—spoken to you like a friend catching you up
- You can interrupt, ask questions, or just listen
- You can say "move my dentist appointment to Thursday" and it happens
- No typing, no navigating, no friction

**The voice is the product.** If the voice sounds robotic, the app fails. If there's a 2-second delay, the app fails. The AI must feel like calling a friend who happens to be incredibly organized.

### The Three Pillars

| Pillar | Why It Matters |
|--------|----------------|
| **1. Human-Like AI Voice** | This is the core experience. Users talk to MYPA like a human. The voice, tone, and response speed must be indistinguishable from talking to a real assistant. |
| **2. Social Accountability** | The gap in the market. No productivity app has cracked social. Circles let friends hold each other accountable, set challenges, and celebrate wins together. |
| **3. Progressive AI Learning** | The retention hook. MYPA collects usage patterns (focus times, completion rates, preferred task styles) and becomes smarter over time. Users "unlock" a fully personalized AI after X days of use. |

### The "Unlock" Psychology

Users don't just use MYPA—they **invest in it**. Every day of use teaches the AI more:

- **Day 1-7:** Basic commands work, AI is learning
- **Day 7+:** AI unlocks "peak hours" insight (when you're most productive)
- **Day 14+:** AI starts predicting task durations based on your history
- **Day 30+:** AI knows you. It adjusts tone, suggests proactively, warns when you're overloaded

This creates a retention loop: **"I've trained my MYPA for 30 days. I can't switch apps now."**

### The Market Gap

| What Exists | What's Missing (MYPA) |
|-------------|----------------------|
| Todoist, Things, TickTick | Voice-first, AI-native experience |
| Siri, Alexa | Actually executes complex life management |
| BeReal, Strava | Social accountability for PRODUCTIVITY |
| Generic AI assistants | Learns YOUR patterns, becomes YOUR assistant |

### Success Criteria

The app succeeds if users say:
1. "I just told MYPA and it handled it" (voice works seamlessly)
2. "My MYPA knows I work best at 9am" (AI has learned them)
3. "My circle keeps me accountable" (social creates stickiness)

---

## 2. Product Overview

### Core Concept

When users open MYPA, they're greeted by a "living" interface - not an app with buttons, but a presence. The entire screen represents the AI, with a soft glowing center that breathes and responds to voice. Users can simply tap anywhere and say:

> "Add buy groceries tomorrow"

And MYPA responds naturally:

> "Got it! Added that to tomorrow's list. Anything else?"

### Navigation Model

The app uses **gesture-based navigation** inspired by modern mobile UX patterns:

```
                    ┌─────────────┐
                    │   PROFILE   │
                    │  (swipe ↓)  │
                    └─────────────┘
                          ↑
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SOCIAL    │ ←── │   AI HUB    │ ──→ │   TASKS     │
│  (swipe →)  │     │  (CENTER)   │     │  (swipe ←)  │
└─────────────┘     └─────────────┘     └─────────────┘
                          ↓
                    ┌─────────────┐
                    │   FOCUS     │
                    │  (swipe ↑)  │
                    └─────────────┘
```

- **AI Hub (Center):** Default screen, voice interface, living background
- **Tasks View (Left):** Traditional task list for power users
- **Social View (Right):** Circles (groups), challenges, accountability
- **Profile View (Down):** Stats, XP, unlocks, settings
- **Focus Mode (Up):** Distraction-free timer for deep work

### Core Features

1. **Voice-First Interaction**
   - Natural language task creation
   - Voice queries ("What do I have today?")
   - Voice control during focus sessions

2. **Gamification**
   - XP system for task completion
   - Levels (1-100)
   - Daily/weekly streaks
   - Challenges with friends

3. **Social Accountability (Circles)**
   - Create groups with friends/colleagues
   - See each other's progress
   - Start group challenges
   - Friendly competition

4. **Progressive AI Learning**
   - AI learns user patterns over time
   - Features unlock as data accumulates
   - Personalized insights (peak hours, patterns)

5. **Focus Sessions**
   - Pomodoro-style timer
   - Task-linked sessions
   - Voice control while focusing
   - Earn XP for focus time

---

## 3. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81.5 | Cross-platform mobile framework |
| **Expo** | 54.0.0 | Development toolchain, builds, OTA updates |
| **TypeScript** | 5.9.2 | Type safety |
| **NativeWind** | 4.2.1 | Tailwind CSS for React Native |
| **React Navigation** | 7.0.0 | Navigation framework |
| **React Native Reanimated** | 4.1.1 | 60fps animations |
| **React Native Gesture Handler** | 2.28.0 | Gesture recognition |
| **React Native Skia** | 2.4.18 | GPU-accelerated graphics (living background) |

### Backend (Supabase)

| Service | Purpose |
|---------|---------|
| **Supabase Auth** | Authentication (Email, Apple Sign-In, Google) |
| **Supabase PostgreSQL** | Primary database |
| **Supabase Realtime** | WebSocket subscriptions for live updates |
| **Supabase Edge Functions** | Serverless functions (Deno) for AI processing |
| **Supabase Storage** | File storage (avatars, challenge proofs) |

### External Services

| Service | Purpose | Cost |
|---------|---------|------|
| **OpenAI GPT-4 Turbo** | AI responses, voice command parsing | ~$0.01-0.03/1K tokens |
| **OpenAI Whisper** | Speech-to-text (future) | ~$0.006/minute |
| **OpenAI TTS** | Text-to-speech | ~$0.015/1K characters |
| **Expo Push** | Push notifications | Free |
| **RevenueCat** | In-app purchases (planned) | Free up to $2.5K MTR |

### Development Tools

- **VS Code** with GitHub Copilot
- **Supabase CLI** for local development
- **EAS Build** for iOS builds
- **TestFlight** for beta distribution

---

## 4. Architecture Decisions

### Why Supabase Over Custom Backend?

We migrated from a custom Express.js + Prisma backend to Supabase for several reasons:

| Factor | Custom Backend | Supabase |
|--------|---------------|----------|
| **Server Management** | Required (Railway/Heroku) | None (serverless) |
| **Authentication** | Custom JWT implementation | Built-in, Apple/Google ready |
| **Real-time** | Socket.io setup required | Built-in WebSocket |
| **Security** | Manual implementation | Row Level Security (RLS) |
| **Cost** | Server costs + maintenance | Pay-per-use, free tier |
| **Time to Market** | Weeks | Days |

**Decision:** The `backend/` folder contains legacy Express code that is **no longer used**. All backend functionality has been migrated to Supabase.

### Why Gesture Navigation Over Tabs?

| Factor | Tab Bar | Gestures |
|--------|---------|----------|
| **Screen Real Estate** | Takes 50-80px at bottom | Full screen |
| **AI Centrality** | AI is "one of the tabs" | AI is THE interface |
| **Distinctiveness** | Every app has tabs | Memorable, unique |
| **Immersion** | Transactional | Conversational |

### Why Progressive Unlocks?

Inspired by Whoop's fitness tracking:

1. **Sets Expectations:** AI needs data to be useful
2. **Builds Trust:** Insights are earned, not fake
3. **Drives Retention:** "What unlocks next?"
4. **Premium Value:** Advanced unlocks can be premium

---

## 5. Current Implementation Status

### ✅ Completed Components

#### Supabase Infrastructure
- [x] Database schema (11 tables)
- [x] Row Level Security policies
- [x] Database triggers (auto-profile, streaks, XP)
- [x] 6 Edge Functions deployed

#### Frontend - Core Architecture
- [x] Gesture Navigator (swipe between screens)
- [x] Supabase Auth Context
- [x] Voice Context (state management)
- [x] User Model Context (AI learning data)
- [x] Event Logger service

#### Screens (v2 - New Architecture)
- [x] AI Hub with Living Background
- [x] Tasks View
- [x] Social View
- [x] Profile View
- [x] Focus Modal
- [x] Auth screens (Login/Signup)

#### Components
- [x] Living Background (Skia shaders)
- [x] Voice Feedback UI
- [x] Unlock Celebration Modal
- [x] Error Boundary
- [x] Mini Voice Button

#### Supabase Hooks
- [x] useTasks
- [x] useCircles
- [x] useChallenges
- [x] useFocusSessions
- [x] useProfile
- [x] useUnlocks
- [x] useNotifications

#### AI Services
- [x] AI Task Sorting
- [x] Duration Estimation
- [x] Overwhelm Detection
- [x] Predictive Suggestions

### 🔄 In Progress

- [ ] Voice system integration (OpenAI Realtime API)
- [ ] Runtime issue debugging
- [ ] Complete modal workflows

### ❌ Not Started

- [ ] Task Detail Modal
- [ ] Circle Home Modal
- [ ] Challenge Detail Modal
- [ ] Settings Modal
- [ ] Quick Add Task overlay
- [ ] Push notification integration
- [ ] RevenueCat (in-app purchases)
- [ ] App Store submission

---

## 6. Database Schema

### Entity Relationship Overview

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   profiles  │───────│    tasks    │       │   circles   │
│  (users)    │       │             │───────│             │
└─────────────┘       └─────────────┘       └─────────────┘
       │                                           │
       │              ┌─────────────┐              │
       └──────────────│   circle_   │──────────────┘
                      │   members   │
                      └─────────────┘
       │
       │              ┌─────────────┐       ┌─────────────┐
       └──────────────│ challenges  │───────│ challenge_  │
                      │             │       │ participants│
                      └─────────────┘       └─────────────┘
       │
       │              ┌─────────────┐
       └──────────────│   focus_    │
                      │  sessions   │
                      └─────────────┘
       │
       │              ┌─────────────┐
       └──────────────│   unlocks   │
                      └─────────────┘
       │
       │              ┌─────────────┐
       └──────────────│ user_events │ (AI learning)
                      └─────────────┘
       │
       │              ┌─────────────┐
       └──────────────│ user_models │ (AI patterns)
                      └─────────────┘
```

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User data (extends auth.users) | xp, level, streak, push_token |
| `tasks` | User tasks | title, due_date, priority, status, estimated_duration |
| `circles` | Social groups | name, emoji, owner_id, privacy, invite_code |
| `circle_members` | Group membership | circle_id, user_id, role |
| `challenges` | Group challenges | type, goal_value, duration_days |
| `challenge_participants` | Challenge progress | progress |
| `focus_sessions` | Focus time tracking | duration_planned, duration_actual, xp_earned |
| `unlocks` | Progressive features | feature, seen |
| `user_events` | AI learning data | event_type, screen, metadata |
| `user_models` | Computed AI patterns | peak_hours, completion_patterns |
| `notifications` | Push notifications | type, title, body, read |
| `invitations` | Circle invites | code, status, expires_at |

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

- Users can only read/write their own data
- Circle data visible to members only
- Challenge data visible to participants
- Public profiles visible to all authenticated users

---

## 7. API & Backend Services

### Supabase Edge Functions

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `ai-greeting` | `/functions/v1/ai-greeting` | Personalized AI greeting |
| `voice-command` | `/functions/v1/voice-command` | Process voice commands |
| `calculate-unlocks` | `/functions/v1/calculate-unlocks` | Check/grant unlocks |
| `daily-brief` | `/functions/v1/daily-brief` | Morning summary |
| `send-push` | `/functions/v1/send-push` | Send push notifications |
| `text-to-speech` | `/functions/v1/text-to-speech` | OpenAI TTS wrapper |

### Direct Database Access (via Supabase Client)

Most CRUD operations use the Supabase client directly with RLS:

```typescript
// Example: Get user's tasks
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', user.id)
  .order('due_date', { ascending: true });
```

### Realtime Subscriptions

The following tables have realtime enabled:
- `tasks` (instant task updates)
- `challenges` (live leaderboards)
- `challenge_participants` (progress updates)
- `notifications` (instant notifications)

---

## 8. Frontend Architecture

### Directory Structure

```
frontend/src/
├── components/           # Reusable UI components
│   ├── LivingBackground/ # Skia shader background
│   ├── VoiceFeedback/    # Voice UI overlay
│   └── ...
├── contexts/             # React contexts
│   ├── SupabaseAuthContext.tsx
│   ├── VoiceContext.tsx
│   └── UserModelContext.tsx
├── hooks/
│   └── supabase/         # Data fetching hooks
│       ├── useTasks.ts
│       ├── useCircles.ts
│       └── ...
├── navigation-v2/        # Gesture-based navigation
│   ├── GestureNavigator.tsx
│   └── GestureContext.tsx
├── screens-v2/           # New gesture-based screens
│   ├── AIHub/
│   ├── TasksView/
│   ├── SocialView/
│   ├── ProfileView/
│   ├── FocusModal/
│   └── Auth/
├── services/             # Business logic
│   ├── supabaseApi.ts
│   ├── eventLogger.ts
│   └── voice/
└── styles/               # Shared styles
```

### State Management

| State Type | Solution |
|------------|----------|
| Auth state | SupabaseAuthContext |
| Voice state | VoiceContext |
| AI patterns | UserModelContext |
| Server data | Custom hooks with Supabase |
| UI state | Local component state |

### Styling Approach

Using **NativeWind** (Tailwind for React Native):

```tsx
<View className="flex-1 bg-black p-4">
  <Text className="text-white text-xl font-bold">
    Hello MYPA
  </Text>
</View>
```

Brand colors defined in `tailwind.config.js`:
- Primary: `#6C5CE7` (Purple)
- Background: `#000000` (Black)
- Card: `#1A1A1A` (Dark gray)

---

## 9. AI & Voice Integration

### Voice Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User taps screen → Listening state → User speaks              │
│                                                                 │
│  ↓                                                              │
│                                                                 │
│  Audio recorded (expo-av) → Sent to Edge Function              │
│                                                                 │
│  ↓                                                              │
│                                                                 │
│  voice-command function:                                        │
│  1. Parse intent (rule-based + GPT-4 fallback)                 │
│  2. Execute action (create task, complete, query, etc.)        │
│  3. Generate response (GPT-4)                                  │
│  4. Return to client                                           │
│                                                                 │
│  ↓                                                              │
│                                                                 │
│  Response spoken via TTS → UI updates                          │
└─────────────────────────────────────────────────────────────────┘
```

### Supported Voice Commands

| Intent | Example | Action |
|--------|---------|--------|
| Create task | "Add buy groceries tomorrow" | Creates task |
| Complete task | "Done with the report" | Marks complete |
| Query tasks | "What do I have today?" | Lists tasks |
| Start focus | "Start focus" | Opens focus mode |
| Check status | "How am I doing?" | Reports stats |
| Navigate | "Show my tasks" | Swipes to Tasks |

### AI Personality

MYPA speaks like a supportive friend:

**Good:**
> "Got it! Added 'buy groceries' for tomorrow. Anything else?"

**Bad (avoided):**
> "I have successfully created a task titled 'buy groceries' with a due date of tomorrow."

### Progressive AI Learning

| Unlock | Requirement | Feature |
|--------|-------------|---------|
| Day 3 | 3 days active | Personalized greetings |
| Day 7 | 10+ tasks completed | Peak hours insight |
| Day 7 | 7 days active | AI task sorting |
| Day 14 | 10+ focus sessions | Duration estimation |
| Day 14 | 30+ tasks created | Completion patterns |
| Day 30 | 50+ tasks | Predictive mode |
| Day 30 | 5+ overwhelm days | Overwhelm detection |

---

## 10. Vision vs Reality: What's Built

> **Assessment: You're on the right path. Architecture supports the vision. Execution needed on voice quality.**

### Pillar 1: Human-Like AI Voice

| Component | Status | Notes |
|-----------|--------|-------|
| Voice recording | ✅ Built | expo-av integration done |
| Voice command parsing | ✅ Built | voice-command Edge Function |
| Text-to-speech | ✅ Built | OpenAI TTS via Edge Function |
| AI personality | ✅ Built | GPT-4 with MYPA personality prompt |
| **OpenAI Realtime API** | ❌ NOT DONE | **CRITICAL** - This makes voice feel instant/human |
| Daily briefing on open | 🟡 Partial | daily-brief Edge Function exists, not wired to UI |
| Interruption handling | ❌ NOT DONE | Needs Realtime API |

**Gap:** The architecture is there, but **voice won't feel human until OpenAI Realtime API is integrated**. Current flow has ~2 second delay. Realtime API enables <500ms response with natural interruptions.

### Pillar 2: Social Accountability (Circles)

| Component | Status | Notes |
|-----------|--------|-------|
| Circle CRUD | ✅ Built | Create, join, leave, delete |
| Circle membership | ✅ Built | Roles: owner, admin, member |
| Circle invitations | ✅ Built | Invite codes, accept/decline |
| Circle activity feed | ✅ Built | Real-time with Supabase |
| **Challenges** | ✅ Built | Focus time, tasks, custom goals |
| **Leaderboards** | ✅ Built | Rankings with Supabase queries |
| Nudge friends | ✅ Built | Push notifications |
| SocialView screen | 🟡 Partial | UI built, needs polish |

**Status:** Social is ~85% complete. This is a strong differentiator and mostly working.

### Pillar 3: Progressive AI Learning

| Component | Status | Notes |
|-----------|--------|-------|
| Event logging | 🟡 Partial | eventLogger service exists, not fully wired |
| User patterns table | ✅ Built | `user_models` in Supabase |
| calculate-unlocks | ✅ Built | Edge Function deployed |
| Unlock definitions | ✅ Built | Day 3, 7, 14, 30 unlocks defined |
| **Pattern calculation** | ❌ NOT DONE | Nightly batch job not running |
| **Unlock celebration UI** | ❌ NOT DONE | Modal not built |
| **Personalized AI responses** | ❌ NOT DONE | AI doesn't use learned patterns yet |
| Peak hours insight | ❌ NOT DONE | Logic exists, not displayed |
| Overwhelm detection | ❌ NOT DONE | Logic exists, not triggered |

**Gap:** The infrastructure is there, but the "magic" isn't connected. Users won't feel the AI learning yet.

### The Honest Assessment

| Vision Element | Built? | Blocking Issue |
|----------------|--------|----------------|
| "User opens app, gets briefing" | 🟡 | daily-brief exists, not auto-playing on open |
| "Voice feels human" | ❌ | Need OpenAI Realtime API for <500ms response |
| "Requests done seamlessly" | 🟡 | Works but has ~2s delay |
| "AI hovers over all screens" | ✅ | Gesture nav centers AI Hub |
| "Social accountability" | ✅ | Circles + challenges working |
| "Focus sessions record patterns" | ✅ | Focus sessions log to DB |
| "AI learns after X days" | ❌ | Pattern calculation not running |
| "Unlock AI to full potential" | ❌ | Unlock UI not built |

### Priority Order to Achieve Vision

1. **🔴 CRITICAL: OpenAI Realtime API** - Voice must feel instant
2. **🔴 CRITICAL: Daily briefing auto-play** - First impression matters
3. **🟡 HIGH: Unlock celebration UI** - The "aha" moment
4. **🟡 HIGH: Wire pattern calculation** - Make learning visible
5. **🟢 MEDIUM: Polish social UI** - Already works, needs UX love
6. **🟢 MEDIUM: Personalized AI responses** - Use learned data

---

## 11. Remaining Work

### Phase 4: Modals (1 week estimated)

- [ ] Task Detail Modal - Edit task, start focus, delete
- [ ] Circle Home Modal - Members, activity, challenges
- [ ] Challenge Detail Modal - Leaderboard, progress
- [ ] Settings Modal - Voice, notifications, account
- [ ] Quick Add Task overlay
- [ ] Create Circle/Challenge flows
- [ ] **Unlock Celebration Modal** - Shows when user unlocks new AI feature

### Phase 5: Voice System - THE CRITICAL PATH (1-2 weeks estimated)

**This phase determines if MYPA feels human or robotic.**

- [ ] **OpenAI Realtime API integration** - WebSocket streaming for <500ms response
- [ ] **Auto-play daily briefing on app open** - First thing user hears
- [ ] Natural interruption handling - User can cut in mid-response
- [ ] Voice during focus sessions
- [ ] Context-aware commands (knows what screen you're on)
- [ ] Error handling & graceful fallbacks
- [ ] Voice settings (speed, personality)

### Phase 6: AI Learning - THE MAGIC (1 week estimated)

**This phase makes MYPA "yours" after X days.**

- [ ] **Wire event logging throughout app** - Every action feeds the AI
- [ ] **Implement nightly pattern calculation** - pg_cron job (requires Supabase Pro $25/mo)
- [ ] **Connect unlocks to UI** - Show progress, celebrate unlocks
- [ ] Personalized AI responses using user_model data
- [ ] Peak hours insight display
- [ ] Overwhelm detection alerts
- [ ] Duration estimation based on history

### Phase 7: Polish (1 week estimated)

- [ ] Performance optimization
- [ ] Offline support
- [ ] Error boundaries everywhere
- [ ] Loading states
- [ ] Accessibility (VoiceOver)

### Phase 8: Deployment (1 week estimated)

- [ ] RevenueCat integration
- [ ] App Store assets (icon, screenshots)
- [ ] Privacy policy / terms
- [ ] TestFlight beta
- [ ] App Store submission

---

## 11. Cost Estimates

### Development Costs (Remaining)

| Phase | Estimated Hours | Notes |
|-------|-----------------|-------|
| Modals | 40 hours | 8 modals/flows |
| Voice | 30 hours | Complex integration |
| AI Learning | 25 hours | Batch jobs, UI |
| Polish | 30 hours | Testing, fixes |
| Deployment | 20 hours | Store prep |
| **Total** | **~145 hours** | |

### Monthly Operating Costs (Post-Launch)

| Service | Free Tier | Growth (1K users) | Scale (10K users) |
|---------|-----------|-------------------|-------------------|
| Supabase | $0 | $25/mo | $50/mo |
| OpenAI | ~$5 | ~$50/mo | ~$300/mo |
| Expo | $0 | $0 | $99/mo |
| RevenueCat | $0 | $0 | 1% of revenue |
| Apple Dev | $8.25/mo | $8.25/mo | $8.25/mo |
| **Total** | **~$15/mo** | **~$85/mo** | **~$460/mo** |

### Revenue Projections

| Scenario | Users | Conversion | MRR |
|----------|-------|------------|-----|
| Pessimistic | 1,000 | 2% | $100 |
| Moderate | 5,000 | 5% | $1,250 |
| Optimistic | 20,000 | 8% | $8,000 |

---

## 12. Risks & Considerations

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI API costs spike | High | Rate limiting, caching, fallback to lighter models |
| Voice recognition accuracy | Medium | Fallback to text input, error handling |
| iOS App Store rejection | High | Follow guidelines, privacy compliance |
| Supabase outage | High | Error states, offline mode |

### Product Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users prefer typing | High | Hybrid approach (voice + manual) |
| Voice feels awkward | High | Excellent voice quality, natural responses |
| Competition (Todoist, Things) | Medium | Unique voice-first positioning |
| Privacy concerns | Medium | Transparent data usage, local processing options |

### Compliance Requirements

- [x] Privacy policy required
- [x] Apple Sign-In required (if offering social login)
- [x] Data deletion capability required
- [x] Privacy nutrition labels
- [ ] GDPR compliance (if EU users)

---

## Appendix A: Environment Variables

### Frontend (.env)

```
EXPO_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

### Supabase Edge Functions (Secrets)

```
OPENAI_API_KEY=sk-...
```

---

## Appendix B: Key File Locations

| Purpose | Path |
|---------|------|
| App entry | `frontend/App.tsx` |
| Supabase client | `frontend/src/lib/supabase.ts` |
| Auth context | `frontend/src/contexts/SupabaseAuthContext.tsx` |
| Gesture navigator | `frontend/src/navigation-v2/GestureNavigator.tsx` |
| AI Hub screen | `frontend/src/screens-v2/AIHub/` |
| Tasks hook | `frontend/src/hooks/supabase/useTasks.ts` |
| Database schema | `supabase/migrations/001_schema.sql` |
| Edge functions | `supabase/functions/` |
| Legacy backend | `backend/` (NOT IN USE) |

---

## Appendix C: Contact & Resources

- **Supabase Project:** exztrtyvjipikqexpirr
- **Supabase Dashboard:** https://app.supabase.com/project/exztrtyvjipikqexpirr
- **Expo Project ID:** afe64d01-5928-4966-8026-4cc0833ee9a2
- **Architecture Doc:** `MYPA_ARCHITECTURE_PLAN.md`
- **Design Spec:** `MYPA_DESIGN_SPECIFICATION.md`
- **Implementation Guide:** `MYPA_FULL_IMPLEMENTATION_GUIDE.md`

---

## Appendix D: Legacy Backend Folder Analysis

> **⚠️ IMPORTANT:** The `backend/` folder contains the original Express.js backend that has been **replaced by Supabase**. This section documents what's in it for reference purposes.

### Backend Structure Overview

| Folder | Files | Purpose |
|--------|-------|---------|
| `config/` | 2 | `database.ts` (Prisma client), `env.ts` (env vars) |
| `middleware/` | 3 | JWT auth, error handling, Zod validation |
| `routes/` | 14 | All REST API endpoints |
| `services/` | 15 | Core business logic |
| `utils/` | 2 | XP system, streak tracking |
| `types/` | 1 | TypeScript type definitions |

### Service Files - Migration Status

| Service | Lines | Purpose | Supabase Status |
|---------|-------|---------|-----------------|
| **scheduler.service.ts** | 281 | ⚠️ Morning briefings (8am), streak reminders (8pm), task reminders | ❌ **NOT MIGRATED** - Needs `pg_cron` |
| push.service.ts | 507 | Expo push notifications | ✅ `send-push` Edge Function |
| socket.service.ts | 310 | Real-time events (Socket.io) | ✅ Supabase Realtime |
| ai.service.ts | 598 | GPT-4 conversations, brain dump processing | ✅ Edge Functions |
| focus.service.ts | 361 | Focus sessions + XP | ✅ Direct Supabase queries |
| circle.service.ts | 603 | Circle CRUD, membership | ✅ Direct Supabase queries |
| challenge.service.ts | 571 | Challenges + leaderboards | ✅ Direct Supabase queries |
| task.service.ts | ~400 | Tasks CRUD + XP | ✅ Direct Supabase queries |
| user.service.ts | ~300 | Profile + XP + streaks | ✅ Direct Supabase queries |
| auth.service.ts | ~200 | JWT token management | ✅ Supabase Auth |
| braindump.service.ts | 384 | Brain dump + AI processing | ✅ Edge Functions |
| analytics.service.ts | 600 | Stats, trends, insights | ✅ Direct Supabase queries |
| invitation.service.ts | ~200 | Circle invites | ✅ Direct Supabase queries |
| assignment.service.ts | ~200 | Circle assignments | ✅ Direct Supabase queries |
| post.service.ts | ~150 | Circle posts | ✅ Direct Supabase queries |

### ⏰ Scheduler Service - The Migration Gap

**This is the ONLY piece NOT migrated to Supabase.** The scheduler handles:

```typescript
startScheduler() {
  // 1. Every 5 minutes: Check if 8am → sendMorningBriefings()
  // 2. Every 5 minutes: Check if 8pm → sendStreakReminders()
  // 3. Every hour: scheduleUpcomingTaskReminders()
}

// Key functions:
sendMorningBriefings()   // Push notification with daily task summary
sendStreakReminders()    // Push to users with streaks who haven't acted today
scheduleTaskReminder()   // Schedule push 15min before task time
```

**To migrate this, you need:**
1. **Supabase pg_cron** (available on Pro plan $25/mo) - OR
2. **External cron service** (Vercel Cron, Railway, GitHub Actions)

### XP System Reference (utils/xp.ts)

```typescript
// Level formula: XP = 100 * level^1.5
// Level 1: 0 XP → Level 10: 2,154 XP → Level 50: 24,749 XP

XP_REWARDS = {
  TASK_COMPLETE: 10,
  TASK_COMPLETE_HIGH_PRIORITY: 20,
  FOCUS_SESSION_COMPLETE: 15,
  FOCUS_PERFECT_SESSION: 25,  // No pauses
  STREAK_DAY: 5,
  STREAK_WEEK: 50,
  STREAK_MONTH: 200,
  CIRCLE_JOIN: 25,
  ASSIGNMENT_COMPLETE: 30,
  CHALLENGE_WIN: 100,
}

// Streak multipliers:
// 3+ days: 1.1x | 7+ days: 1.25x | 14+ days: 1.5x | 30+ days: 2.0x
```

### 14 API Routes Summary

| Route File | Key Endpoints |
|------------|---------------|
| auth.routes.ts | register, login, refresh, logout |
| users.routes.ts | /me, stats, settings, onboarding |
| tasks.routes.ts | CRUD, /today, /complete, /batch |
| focus.routes.ts | /active, /start, /pause, /resume, /complete |
| circles.routes.ts | CRUD, /join, /leave, /members |
| challenges.routes.ts | CRUD, /join, /leaderboard |
| ai.routes.ts | /conversation, /process-command (916 lines) |
| tts.routes.ts | /speak, /stream |
| braindump.routes.ts | CRUD, /process, /convert |
| notifications.routes.ts | /register-token, history, /read |
| invitations.routes.ts | send, accept, decline |
| analytics.routes.ts | /daily, /weekly, /trends, /insights |
| assignments.routes.ts | Circle task assignments CRUD |
| posts.routes.ts | Circle posts + reactions |

### Recommendation: Keep or Delete?

**Keep as reference until:**
- ✅ App runs successfully on Supabase
- ✅ Push notifications work end-to-end
- ⏳ Scheduler reimplemented with pg_cron

**Then archive:**
```bash
mv backend backend_archive_reference
```

---

*Document generated: February 6, 2026*
