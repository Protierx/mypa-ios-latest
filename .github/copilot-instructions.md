# MYPA Architecture Plan v3
## Voice-First AI Agent — Gesture-Based Navigation

> **Vision**: MYPA is not an app with AI. MYPA *is* the AI. You talk to it. Everything else is just views of what it knows.

---

## Tech Stack

```
FRONTEND: React Native + Expo + NativeWind (Tailwind)
BACKEND:  Supabase (Auth, Database, Realtime, Edge Functions)
AI:       OpenAI GPT-4 (via Edge Functions)
VOICE:    @react-native-voice/voice (STT) + expo-speech (TTS)
```

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [The Gesture Model](#the-gesture-model)
3. [Screen Architecture (10 Screens)](#screen-architecture)
4. [Navigation & Gestures](#navigation--gestures)
5. [AI Integration](#ai-integration)
6. [Progressive Unlock System](#progressive-unlock-system)
7. [AI Learning Model](#ai-learning-model)
8. [Data Architecture](#data-architecture)
9. [Technical Implementation](#technical-implementation)
10. [Voice Command System](#voice-command-system)
11. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Core Philosophy

### The Inversion

**Traditional App:**
```
┌─────────────────────────────────────┐
│  App has features                   │
│  AI is one feature                  │
│  User navigates to AI               │
└─────────────────────────────────────┘
```

**MYPA:**
```
┌─────────────────────────────────────┐
│  AI IS the app                      │
│  Features are views of AI's data    │
│  AI is always present               │
└─────────────────────────────────────┘
```

### The 4 Rules

1. **AI is home** — You open the app, you see the AI. Always.
2. **Voice is default** — The mic is always ready. Tap to talk.
3. **Swipe for data** — Tasks, social, profile are swipe-away views.
4. **No tab bar** — Gestures replace tabs. Cleaner, more immersive.

### The Mental Model

```
                    ┌─────────────┐
                    │   PROFILE   │
                    │  (swipe ↓)  │
                    └─────────────┘
                          ↑
                          │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SOCIAL    │ ←── │     AI      │ ──→ │    DATA     │
│  (swipe →)  │     │   (HOME)    │     │  (swipe ←)  │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ↓
                    ┌─────────────┐
                    │   FOCUS     │
                    │  (swipe ↑)  │
                    └─────────────┘
```

**User always knows:**
- Swipe LEFT → My tasks/data
- Swipe RIGHT → My people
- Swipe UP → Start focus mode
- Swipe DOWN → My profile/settings
- TAP ANYWHERE → Talk to MYPA

---

## 2. The Gesture Model

### Why No Tab Bar?

| Tab Bar | Gesture-Based |
|---------|---------------|
| 5 buttons competing for attention | AI IS the interface |
| "Which tab do I need?" | "I'll just tell MYPA" |
| AI feels like a feature | AI feels like being WITH you |
| Conventional, forgettable | Distinctive, memorable |
| Requires thumb reach | Natural swipe motions |

### The Living Interface
The AI Hub isn't a screen WITH an orb - the entire screen IS MYPA. When you open the app, you're stepping INTO the AI's presence. The whole screen breathes, pulses, and responds to your voice and energy.

### The Gesture Map

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         SWIPE DOWN                              │
│                         ┌───────┐                              │
│                         │Profile│                              │
│                         │Stats  │                              │
│                         │Settings                              │
│                         └───────┘                              │
│                              ↑                                  │
│                              │                                  │
│   SWIPE RIGHT          ┌─────────────┐          SWIPE LEFT     │
│   ┌───────┐            │             │          ┌───────┐      │
│   │Circles│ ←───────── │  AI HUB     │ ─────────→│ Tasks │      │
│   │Social │            │ (Living     │          │ Data  │      │
│   │Friends│            │  Interface) │          │ Plan  │      │
│   └───────┘            │             │          └───────┘      │
│                        │  ╭ · · · ╮  │                         │
│                        │  · glow ·   │                         │
│                        │  ╰ · · · ╯  │                         │
│                        └─────────────┘                         │
│                              │                                  │
│                              ↓                                  │
│                         SWIPE UP                                │
│                         ┌───────┐                              │
│                         │ Focus │                              │
│                         │ Mode  │                              │
│                         └───────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Gesture Feedback

| Gesture | Haptic | Visual | Audio |
|---------|--------|--------|-------|
| Start swipe | Light tap | Screen peeks | None |
| Complete swipe | Medium tap | Screen slides | Soft whoosh |
| Tap screen | Heavy tap | Background brightens | Listening chime |
| AI responds | Light tap | Background pulses | AI speaks |

---

## 3. Screen Architecture

### Total: 10 Screens (down from 21)

```
┌─────────────────────────────────────────────────────────────────┐
│                         SCREEN MAP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CORE SCREENS (4)                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │   AI    │ │  Tasks  │ │ Social  │ │ Profile │              │
│  │  Home   │ │  View   │ │  View   │ │  View   │              │
│  │(center) │ │(swipe ←)│ │(swipe →)│ │(swipe ↓)│              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                 │
│  MODAL SCREENS (6)                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│  │  Focus  │ │  Task   │ │ Circle  │                          │
│  │ Session │ │ Detail  │ │  Home   │                          │
│  │(swipe ↑)│ │(tap task)│(tap circle)                         │
│  └─────────┘ └─────────┘ └─────────┘                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│  │Challenge│ │Settings │ │ Unlock  │                          │
│  │ Detail  │ │  Full   │ │ Modal   │                          │
│  │(tap chal)│(from prof)│(auto)    │                          │
│  └─────────┘ └─────────┘ └─────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Screen Details

| # | Screen | Access | Purpose | AI Present? |
|---|--------|--------|---------|-------------|
| 1 | **AI Home** | Default/center | Voice interface + context cards | ★ Primary |
| 2 | **Tasks View** | Swipe left | All tasks, calendar, planning | Mini orb |
| 3 | **Social View** | Swipe right | Circles, challenges, friends | Mini orb |
| 4 | **Profile View** | Swipe down | Stats, level, streaks, settings | Insights |
| 5 | **Focus Session** | Swipe up / voice | Active timer, current task | Voice control |
| 6 | **Task Detail** | Tap task | Edit single task | AI suggestions |
| 7 | **Circle Home** | Tap circle | Circle members, activity | AI summary |
| 8 | **Challenge Detail** | Tap challenge | Standings, proof | AI commentary |
| 9 | **Settings** | From profile | App configuration | None |
| 10 | **Unlock Modal** | Auto (milestones) | New feature revealed | AI explains |

---

## 4. Navigation & Gestures

### AI Home (Center)

```
┌─────────────────────────────────────────────┐
│                                             │
│  ← Tasks                        Social →   │
│                                             │
│                                             │
│              ┌───────────┐                 │
│              │           │                 │
│              │   MYPA    │                 │
│              │   ORB     │                 │
│              │           │                 │
│              └───────────┘                 │
│                                             │
│     "Morning! You have 3 tasks today.      │
│      Want to start with the report?"       │
│                                             │
│              [🎤 Tap to talk]              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ CONTEXT CARDS (scrollable)          │   │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐│   │
│  │ │Today: 3 │ │🔥 Streak│ │Challenge││   │
│  │ │ tasks   │ │  7 days │ │ 2nd     ││   │
│  │ └─────────┘ └─────────┘ └─────────┘│   │
│  └─────────────────────────────────────┘   │
│                                             │
│             ↑ Swipe up: Focus              │
│                                             │
│           Profile ↓                         │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **Tap orb** → Voice mode activates, AI listens
- **Tap context card** → Expands or navigates
- **Swipe left** → Tasks view slides in
- **Swipe right** → Social view slides in
- **Swipe up** → Focus mode (if task selected, uses that task)
- **Swipe down** → Profile view slides in

### Tasks View (Swipe Left)

```
┌─────────────────────────────────────────────┐
│  ←                               [●] [+]   │
│  Tasks                           orb  add   │
│ ─────────────────────────────────────────── │
│                                             │
│  TODAY (Mon, Feb 2)                         │
│  ┌─────────────────────────────────────┐   │
│  │ ○ Finish quarterly report    45m  H │   │
│  │ ○ Call dentist               5m   L │   │
│  │ ○ Team meeting               30m  M │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  TOMORROW                                   │
│  ┌─────────────────────────────────────┐   │
│  │ ○ Gym                        60m  M │   │
│  │ ○ Review Sarah's doc         15m  L │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  THIS WEEK                                  │
│  ┌─────────────────────────────────────┐   │
│  │ ○ Submit expenses            10m  L │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ─────────────────────────────────────────  │
│  🔒 Completed (tap to show)                │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **Swipe right** → Back to AI Home
- **Tap mini orb** → Voice mode (can add task by voice)
- **Tap +** → Quick add task
- **Tap task** → Task detail modal
- **Long press task** → Quick actions (complete, defer, delete)
- **Swipe task left** → Complete
- **Swipe task right** → Defer to tomorrow

### Social View (Swipe Right)

```
┌─────────────────────────────────────────────┐
│  [●] [+]                               →   │
│  orb  add                          Social   │
│ ─────────────────────────────────────────── │
│                                             │
│  AI SUMMARY                                 │
│  "Work circle is active. Family quiet."    │
│                                             │
│ ─────────────────────────────────────────── │
│  ACTIVE CHALLENGES                          │
│  ┌─────────────────────────────────────┐   │
│  │ 🏃 7-Day Workout           2nd/5   │   │
│  │     3 days left • Sarah leads       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  CIRCLES                                    │
│  ┌─────────────────────────────────────┐   │
│  │ 💼 Work Circle          3 online   │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 👨‍👩‍👧 Family Circle        Quiet     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  RECENT ACTIVITY                            │
│  Sarah completed "Q4 Report" • 5m ago      │
│  Mike started focus mode • 12m ago         │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **Swipe left** → Back to AI Home
- **Tap challenge** → Challenge detail
- **Tap circle** → Circle home
- **Tap +** → Create circle or start challenge
- **Tap activity** → View that person's profile

### Profile View (Swipe Down)

```
┌─────────────────────────────────────────────┐
│                                             │
│  Profile                               ↓   │
│                                             │
│        ┌──────────┐                        │
│        │  Avatar  │                        │
│        └──────────┘                        │
│          @alice                            │
│      Level 12 • 7-day streak               │
│                                             │
│ ─────────────────────────────────────────── │
│  AI INSIGHT                                 │
│  ┌─────────────────────────────────────┐   │
│  │ "You're most productive 9-11am.     │   │
│  │  85% completion rate this week.     │   │
│  │  Focus sessions up 20% vs last wk." │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  STATS                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │  XP    │ │ Tasks  │ │ Focus  │         │
│  │ 4,230  │ │  127   │ │ 42hrs  │         │
│  └────────┘ └────────┘ └────────┘         │
│                                             │
│ ─────────────────────────────────────────── │
│  🔓 UNLOCKED FEATURES                       │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │Patterns│ │Priority│ │Predict │ 🔒      │
│  └────────┘ └────────┘ └────────┘         │
│                                             │
│  [Settings]  [Help]  [Logout]              │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **Swipe up** → Back to AI Home
- **Tap stat** → Detailed breakdown
- **Tap locked feature** → Shows unlock requirements
- **Tap Settings** → Settings screen

### Focus Session (Swipe Up)

```
┌─────────────────────────────────────────────┐
│                                             │
│                   ╳                         │
│                                             │
│                                             │
│              ┌───────────┐                 │
│              │           │                 │
│              │   23:45   │                 │
│              │           │                 │
│              └───────────┘                 │
│                                             │
│        "Finishing quarterly report"         │
│                                             │
│              [🎤 Tap to talk]              │
│                                             │
│     "You've been focused for 6 minutes.    │
│      Keep going—you usually hit flow       │
│      at the 10 minute mark."               │
│                                             │
│                                             │
│                                             │
│                                             │
│         [Pause]       [End Session]        │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**Voice commands while focusing:**
- "How long have I been going?" → AI tells you
- "Add 10 minutes" → Extends timer
- "I'm done" → Ends session, logs time
- "What's next?" → AI tells you next task

---

## 5. AI Integration

### AI is Always Present

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI PRESENCE BY SCREEN                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AI HOME                                                        │
│  └─ Full orb, speaking, animated                               │
│  └─ AI initiates conversation                                  │
│  └─ Context cards generated by AI                              │
│                                                                 │
│  TASKS VIEW                                                     │
│  └─ Mini orb in corner (tap to talk)                          │
│  └─ AI sorted task order                                       │
│  └─ AI suggests priorities on hover                            │
│                                                                 │
│  SOCIAL VIEW                                                    │
│  └─ Mini orb in corner                                         │
│  └─ AI summary of activity                                     │
│  └─ AI suggests nudges/challenges                              │
│                                                                 │
│  PROFILE VIEW                                                   │
│  └─ AI insight card                                            │
│  └─ AI explains locked features                                │
│                                                                 │
│  FOCUS SESSION                                                  │
│  └─ Voice control only (no visual orb)                        │
│  └─ AI encouragement at milestones                             │
│  └─ AI announces completion                                    │
│                                                                 │
│  MODALS (Task, Circle, Challenge)                               │
│  └─ AI suggestions contextual to content                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What AI Does On Each Screen

| Screen | AI Reads | AI Says | AI Does |
|--------|----------|---------|---------|
| **AI Home** | All context | Greeting, today summary, suggestions | Routes commands, takes actions |
| **Tasks** | Task list, patterns | Nothing (unless asked) | Sorts by priority, suggests times |
| **Social** | Circle activity | Activity summary | Suggests nudges, challenges |
| **Profile** | All history | Personalized insights | Shows unlock progress |
| **Focus** | Current task, history | Encouragement | Tracks time, announces milestones |

---

## 6. Progressive Unlock System

### The Whoop Model

AI features unlock as data accumulates. This:
1. Sets expectations (AI needs to learn you)
2. Creates anticipation (what unlocks next?)
3. Builds trust (insights are earned, not fake)
4. Drives retention (come back to unlock more)

### Unlock Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│                      PROGRESSIVE UNLOCK                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DAY 1 (Immediate)                                              │
│  🔓 Voice commands (add task, complete, query)                 │
│  🔓 Basic task management                                       │
│  🔓 Focus timer                                                 │
│  🔓 Circles & challenges (join)                                │
│  🔓 Streaks & XP                                               │
│                                                                 │
│  DAY 3 (After 3 days of use)                                    │
│  🔓 AI greeting personalization                                │
│  🔓 Basic activity summary                                      │
│                                                                 │
│  DAY 7 (After 1 week)                                           │
│  🔓 Peak hours insight                                         │
│  🔓 AI task sorting by time                                    │
│  🔓 Weekly comparison                                           │
│                                                                 │
│  DAY 14 (After 2 weeks)                                         │
│  🔓 Completion rate patterns                                   │
│  🔓 Duration estimation                                        │
│  🔓 Category insights                                          │
│                                                                 │
│  DAY 30 (After 1 month)                                         │
│  🔓 Full predictive mode                                       │
│  🔓 "You'll struggle with X today"                            │
│  🔓 Proactive overwhelm detection                              │
│  🔓 Social correlation insights                                │
│                                                                 │
│  DAY 60+ (Power user)                                           │
│  🔓 Deep pattern analysis                                      │
│  🔓 Habit formation tracking                                   │
│  🔓 Long-term trend insights                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Unlock UI

#### Locked Feature (Before)
```
┌─────────────────────────────────────────────┐
│  🔒 PEAK HOURS INSIGHT                      │
│                                             │
│  "I'm still learning when you work best.   │
│   Use MYPA for 4 more days to unlock."     │
│                                             │
│  ████████░░░░░░░░ 3/7 days                 │
│                                             │
└─────────────────────────────────────────────┘
```

#### Unlock Celebration
```
┌─────────────────────────────────────────────┐
│     ╭ · · · · · · · · · · · · · ╮           │
│     ·                           ·           │
│     ·    ✨ NEW INSIGHT ✨      ·           │
│     ·       UNLOCKED            ·           │
│     ·                           ·           │
│     ╰ · · · · · · · · · · · · · ╯           │
│                                             │
│  (Living background pulses with excitement) │
│                                             │
│  "After 7 days, I've learned something:    │
│                                             │
│   You're most productive 9-11am.           │
│   I'll prioritize important tasks then."   │
│                                             │
│              [Awesome!]                     │
│                                             │
└─────────────────────────────────────────────┘
```

#### Unlocked Feature (After)
```
┌─────────────────────────────────────────────┐
│  🔓 PEAK HOURS                              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Your peak: 9am - 11am              │   │
│  │  ████████████░░░░░░░░               │   │
│  │  6am      12pm      6pm     12am    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  "Tasks scheduled during peak hours have   │
│   90% completion vs 65% at other times."   │
│                                             │
└─────────────────────────────────────────────┘
```

### Data Requirements Per Feature

| Feature | Days | Events Needed | Algorithm |
|---------|------|---------------|-----------|
| Greeting personalization | 3 | 5+ app opens | Time-of-day + name |
| Peak hours | 7 | 10+ completions | Hour clustering |
| Task sorting | 7 | 15+ tasks | Priority + time correlation |
| Duration estimation | 14 | 20+ focus sessions | Category → duration avg |
| Completion patterns | 14 | 30+ tasks | Priority → completion rate |
| Predictive mode | 30 | 50+ tasks | Full behavior model |
| Overwhelm detection | 30 | 5+ high-load days | Task count → completion drop |

---

## 7. AI Learning Model

### What AI Learns

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER BEHAVIOR MODEL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEMPORAL PATTERNS (Unlock: Day 7)                              │
│  ├─ Peak productivity hours                                    │
│  ├─ Best day of week                                           │
│  ├─ Average session duration                                   │
│  ├─ Time between task creation and completion                  │
│  └─ When they typically open the app                           │
│                                                                 │
│  TASK PATTERNS (Unlock: Day 14)                                 │
│  ├─ Categories they use most                                   │
│  ├─ Average task duration (actual vs estimated)                │
│  ├─ Completion rate by priority                                │
│  ├─ Tasks they defer most                                      │
│  ├─ Tasks they complete fastest                                │
│  └─ Common task language/keywords                              │
│                                                                 │
│  SOCIAL PATTERNS (Unlock: Day 14)                               │
│  ├─ Circles most engaged with                                  │
│  ├─ Response to social pressure (does seeing others help?)     │
│  ├─ Challenge participation rate                               │
│  └─ Who motivates them most                                    │
│                                                                 │
│  PSYCHOLOGICAL PATTERNS (Unlock: Day 30)                        │
│  ├─ Streak sensitivity (do they protect streaks?)             │
│  ├─ XP motivation (does gamification work for them?)          │
│  ├─ Overwhelm threshold (how many tasks = stress?)            │
│  └─ Preferred AI tone (encouraging vs. direct)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### How AI Learns

#### Passive Data Collection

Every interaction is logged (user never sees this):

```typescript
interface UserEvent {
  type: 'task_created' | 'task_completed' | 'task_deferred' | 
        'app_opened' | 'voice_command' | 'focus_started' | 
        'focus_completed' | 'challenge_joined' | 'circle_viewed' |
        'swipe_to_tasks' | 'swipe_to_social' | 'orb_tapped';
  timestamp: Date;
  metadata: {
    taskId?: string;
    duration?: number;
    dayOfWeek: number;      // 0-6
    hourOfDay: number;      // 0-23
    completionTime?: number; // ms from creation to completion
    source: 'voice' | 'manual' | 'ai_suggested';
    screen: 'ai_home' | 'tasks' | 'social' | 'profile' | 'focus';
  };
}
```

#### Nightly Processing

```typescript
// Cron job: 3am daily
async function updateUserModels() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    const events = await getEvents(user.id, 30); // Last 30 days
    const daysSinceSignup = getDaysSince(user.createdAt);
    
    const model: UserModel = {
      // Always calculated
      totalTasks: countEvents(events, 'task_created'),
      totalCompleted: countEvents(events, 'task_completed'),
      totalFocusMinutes: sumFocusTime(events),
      
      // Unlock at Day 7
      peakHours: daysSinceSignup >= 7 ? calculatePeakHours(events) : null,
      bestDayOfWeek: daysSinceSignup >= 7 ? calculateBestDay(events) : null,
      
      // Unlock at Day 14
      completionRates: daysSinceSignup >= 14 ? calculateByPriority(events) : null,
      avgTaskDuration: daysSinceSignup >= 14 ? calculateAvgDuration(events) : null,
      commonCategories: daysSinceSignup >= 14 ? extractCategories(events) : null,
      
      // Unlock at Day 30
      overwhelmThreshold: daysSinceSignup >= 30 ? detectOverwhelmThreshold(events) : null,
      procrastinationPatterns: daysSinceSignup >= 30 ? findDeferralPatterns(events) : null,
      socialMotivation: daysSinceSignup >= 30 ? calculateSocialImpact(events) : null,
      
      lastUpdated: new Date(),
    };
    
    await prisma.userModel.upsert({
      where: { userId: user.id },
      update: model,
      create: { userId: user.id, ...model },
    });
    
    // Check for new unlocks
    await checkAndTriggerUnlocks(user.id, daysSinceSignup, model);
  }
}
```

#### Real-Time Context

```typescript
// Called when generating AI message
async function gatherContext(userId: string): Promise<AIContext> {
  const [user, model, tasks, circles, challenges] = await Promise.all([
    getUser(userId),
    getUserModel(userId),
    getTodaysTasks(userId),
    getUserCircles(userId),
    getActiveChallenge(userId),
  ]);
  
  return {
    user: {
      name: user.name,
      level: user.level,
      streak: user.streakCount,
      daysSinceSignup: getDaysSince(user.createdAt),
    },
    model: {
      // Only include unlocked features
      peakHours: model.peakHours, // null if not unlocked
      completionRates: model.completionRates,
      overwhelmThreshold: model.overwhelmThreshold,
    },
    today: {
      tasks: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      focusMinutes: await getTodayFocusTime(userId),
    },
    social: {
      activeChallenge: challenges[0]?.name,
      challengePosition: challenges[0]?.userPosition,
      circleActivity: await getRecentCircleActivity(userId),
    },
    time: {
      hour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      isWeekend: [0, 6].includes(new Date().getDay()),
    },
  };
}
```

### AI Prompt Engineering

#### System Prompt (Evolves with Unlocks)

```typescript
function buildSystemPrompt(user: User, model: UserModel, unlocks: string[]): string {
  let prompt = `You are MYPA, a personal productivity AI. You are:
- Warm but not cheesy
- Direct but not cold
- Encouraging but not fake
- Smart but not condescending

You speak conversationally, like a helpful friend who knows them well.

User: ${user.name}
Level: ${user.level}
Streak: ${user.streakCount} days
Days using MYPA: ${getDaysSince(user.createdAt)}
`;

  // Add unlocked insights to prompt
  if (unlocks.includes('peak_hours') && model.peakHours) {
    prompt += `\nPeak hours: ${model.peakHours.join(', ')}. Reference this naturally.`;
  }
  
  if (unlocks.includes('completion_patterns') && model.completionRates) {
    prompt += `\nCompletion rates: HIGH=${model.completionRates.HIGH}%, MED=${model.completionRates.MEDIUM}%, LOW=${model.completionRates.LOW}%.`;
  }
  
  if (unlocks.includes('overwhelm_detection') && model.overwhelmThreshold) {
    prompt += `\nOverwhelm threshold: ${model.overwhelmThreshold} tasks. If they have more, be extra supportive.`;
  }
  
  return prompt;
}
```

#### Context Prompt (Per Request)

```typescript
function buildContextPrompt(screen: string, context: AIContext): string {
  const hour = context.time.hour;
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  
  return `Current context:
- Screen: ${screen}
- Time: ${timeOfDay} (${hour}:00)
- Today's tasks: ${context.today.tasks} (${context.today.completed} done)
- Focus today: ${context.today.focusMinutes} minutes
${context.social.activeChallenge ? `- Active challenge: ${context.social.activeChallenge} (position: ${context.social.challengePosition})` : ''}

Generate a ${screen === 'ai_home' ? 'greeting and suggestion' : 'helpful response'} for this context.
Keep it under 50 words. Be specific, not generic.`;
}
```

---

## 8. Data Architecture

### Database Schema (Updated for Gestures + Unlocks)

```prisma
// User's learned model
model UserModel {
  id                    String    @id @default(uuid())
  userId                String    @unique
  
  // Basic stats (always available)
  totalTasks            Int       @default(0)
  totalCompleted        Int       @default(0)
  totalFocusMinutes     Int       @default(0)
  
  // Temporal patterns (Day 7+)
  peakHours             Int[]     // [9, 10, 11] = 9am-11am
  bestDayOfWeek         Int?      // 0-6
  avgSessionMinutes     Int?
  
  // Task patterns (Day 14+)
  avgTaskDuration       Int?      // minutes
  completionRates       Json?     // { HIGH: 0.9, MEDIUM: 0.7, LOW: 0.5 }
  commonCategories      String[]
  
  // Advanced patterns (Day 30+)
  overwhelmThreshold    Int?      // task count before completion drops
  procrastinationPatterns Json?   // { category: deferralRate }
  socialMotivation      Float?    // 0-1, how much social features help
  
  lastUpdated           DateTime  @updatedAt
  
  user                  User      @relation(fields: [userId], references: [id])
}

// Feature unlocks
model UserUnlock {
  id          String   @id @default(uuid())
  userId      String
  feature     String   // 'peak_hours', 'task_sorting', 'overwhelm_detection'
  unlockedAt  DateTime @default(now())
  seenByUser  Boolean  @default(false)
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, feature])
}

// Event log for learning
model UserEvent {
  id          String   @id @default(uuid())
  userId      String
  type        String
  screen      String   // 'ai_home', 'tasks', 'social', 'profile', 'focus'
  timestamp   DateTime @default(now())
  metadata    Json
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId, timestamp])
  @@index([userId, type])
}

// Conversation history (for context)
model Conversation {
  id          String   @id @default(uuid())
  userId      String
  messages    Json     // [{ role: 'user' | 'assistant', content: string }]
  context     Json     // app state snapshot
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
}
```

### Unlock Definitions

```typescript
const UNLOCK_DEFINITIONS = {
  // Day 3
  personalized_greeting: {
    day: 3,
    title: 'Personalized Greetings',
    description: 'MYPA now knows your name and patterns',
    requirement: 'Use MYPA for 3 days',
  },
  
  // Day 7
  peak_hours: {
    day: 7,
    title: 'Peak Hours Insight',
    description: 'See when you\'re most productive',
    requirement: 'Complete 10+ tasks',
    minEvents: { task_completed: 10 },
  },
  ai_task_sorting: {
    day: 7,
    title: 'Smart Task Sorting',
    description: 'Tasks sorted by AI-determined priority',
    requirement: 'Use MYPA for 7 days',
  },
  weekly_comparison: {
    day: 7,
    title: 'Weekly Comparison',
    description: 'Compare this week to last week',
    requirement: 'Use MYPA for 7 days',
  },
  
  // Day 14
  duration_estimation: {
    day: 14,
    title: 'Duration Estimation',
    description: 'AI predicts how long tasks will take',
    requirement: 'Complete 10+ focus sessions',
    minEvents: { focus_completed: 10 },
  },
  completion_patterns: {
    day: 14,
    title: 'Completion Patterns',
    description: 'See which tasks you complete vs defer',
    requirement: 'Create 30+ tasks',
    minEvents: { task_created: 30 },
  },
  
  // Day 30
  predictive_mode: {
    day: 30,
    title: 'Predictive Mode',
    description: 'AI predicts what you\'ll struggle with',
    requirement: 'Use MYPA for 30 days with 50+ tasks',
    minEvents: { task_created: 50 },
  },
  overwhelm_detection: {
    day: 30,
    title: 'Overwhelm Detection',
    description: 'AI notices when you have too much',
    requirement: 'Experience 5+ high-task days',
  },
};
```

### Data Flow (Gesture-Based)

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER OPENS APP                              │
│                           ↓                                      │
│                    AI HOME (CENTER)                              │
│                           ↓                                      │
│              Log event: 'app_opened'                            │
└─────────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  User swipes  │   │  User taps    │   │  User swipes  │
│  LEFT → Tasks │   │  ORB → Voice  │   │  RIGHT →Social│
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        ↓                   ↓                   ↓
   Log: 'swipe_   Log: 'orb_tapped'    Log: 'swipe_
    to_tasks'      + 'voice_command'     to_social'
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NIGHTLY BATCH JOB                             │
│                                                                 │
│  1. Aggregate events by type                                    │
│  2. Calculate patterns (if enough data)                         │
│  3. Update UserModel                                            │
│  4. Check unlock eligibility                                    │
│  5. Queue unlock notifications                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                 NEXT AI MESSAGE GENERATION                       │
│                                                                 │
│  1. Load UserModel (with unlocked fields only)                  │
│  2. Gather current context                                      │
│  3. Build personalized prompt                                   │
│  4. Generate via OpenAI                                         │
│  5. Return to user                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Technical Implementation

### Frontend Architecture (Gesture-Based)

```
frontend/
├── src/
│   ├── navigation/
│   │   ├── GestureNavigator.tsx    # Custom gesture-based nav
│   │   ├── SwipeableStack.tsx      # Swipe between screens
│   │   └── ModalStack.tsx          # Standard modal stack
│   │
│   ├── screens/
│   │   ├── AIHome/                 # CENTER - Main screen
│   │   │   ├── index.tsx
│   │   │   ├── AIOrb.tsx
│   │   │   ├── ContextCards.tsx
│   │   │   └── SwipeHints.tsx
│   │   ├── TasksView/              # SWIPE LEFT
│   │   │   ├── index.tsx
│   │   │   ├── TaskList.tsx
│   │   │   └── MiniOrb.tsx
│   │   ├── SocialView/             # SWIPE RIGHT
│   │   │   ├── index.tsx
│   │   │   ├── CircleList.tsx
│   │   │   └── ChallengeList.tsx
│   │   ├── ProfileView/            # SWIPE DOWN
│   │   │   ├── index.tsx
│   │   │   ├── StatsGrid.tsx
│   │   │   └── UnlockProgress.tsx
│   │   ├── Focus/                  # SWIPE UP (modal)
│   │   │   ├── index.tsx
│   │   │   └── FocusTimer.tsx
│   │   └── modals/
│   │       ├── TaskDetail.tsx
│   │       ├── CircleHome.tsx
│   │       ├── ChallengeDetail.tsx
│   │       ├── Settings.tsx
│   │       └── UnlockCelebration.tsx
│   │
│   ├── components/
│   │   ├── AIOrb/                  # Core AI visual
│   │   │   ├── index.tsx
│   │   │   ├── OrbAnimations.ts
│   │   │   ├── OrbStates.ts
│   │   │   └── VoiceWaves.tsx
│   │   ├── MiniOrb/                # Compact orb for other screens
│   │   │   └── index.tsx
│   │   ├── AIMessage/              # AI text bubble
│   │   │   └── index.tsx
│   │   └── SwipeIndicator/         # Visual hint for swipe
│   │       └── index.tsx
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── aiService.ts        # AI API calls
│   │   │   ├── voiceService.ts     # Speech-to-text
│   │   │   ├── ttsService.ts       # Text-to-speech
│   │   │   └── commandParser.ts    # Parse voice commands
│   │   ├── events/
│   │   │   └── eventLogger.ts      # Log user events
│   │   ├── unlocks/
│   │   │   └── unlockService.ts    # Check/show unlocks
│   │   └── api.ts
│   │
│   ├── contexts/
│   │   ├── AIContext.tsx           # AI state, conversation
│   │   ├── GestureContext.tsx      # Current screen, swipe state
│   │   ├── UnlockContext.tsx       # Unlocked features
│   │   └── AuthContext.tsx
│   │
│   └── hooks/
│       ├── useAI.ts                # AI interaction
│       ├── useVoice.ts             # Voice input
│       ├── useGesture.ts           # Swipe detection
│       └── useUnlocks.ts           # Feature unlocks
```

### Gesture Navigator

```tsx
// navigation/GestureNavigator.tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  runOnJS 
} from 'react-native-reanimated';

type Screen = 'ai_home' | 'tasks' | 'social' | 'profile';

export function GestureNavigator() {
  const currentScreen = useSharedValue<Screen>('ai_home');
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Horizontal: tasks (left) / social (right)
      if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
        translateX.value = e.translationX;
      }
      // Vertical: profile (down) / focus (up)
      else {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      const THRESHOLD = 100;
      
      // Swipe LEFT → Tasks
      if (e.translationX < -THRESHOLD && currentScreen.value === 'ai_home') {
        translateX.value = withSpring(-SCREEN_WIDTH);
        runOnJS(navigateTo)('tasks');
      }
      // Swipe RIGHT → Social
      else if (e.translationX > THRESHOLD && currentScreen.value === 'ai_home') {
        translateX.value = withSpring(SCREEN_WIDTH);
        runOnJS(navigateTo)('social');
      }
      // Swipe DOWN → Profile
      else if (e.translationY > THRESHOLD && currentScreen.value === 'ai_home') {
        translateY.value = withSpring(SCREEN_HEIGHT);
        runOnJS(navigateTo)('profile');
      }
      // Swipe UP → Focus (modal)
      else if (e.translationY < -THRESHOLD && currentScreen.value === 'ai_home') {
        runOnJS(openFocusModal)();
      }
      // Return to center
      else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });
  
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={styles.container}>
        {/* Tasks View (left of center) */}
        <Animated.View style={[styles.screen, tasksStyle]}>
          <TasksView />
        </Animated.View>
        
        {/* AI Home (center) */}
        <Animated.View style={[styles.screen, homeStyle]}>
          <AIHome />
        </Animated.View>
        
        {/* Social View (right of center) */}
        <Animated.View style={[styles.screen, socialStyle]}>
          <SocialView />
        </Animated.View>
        
        {/* Profile View (below center) */}
        <Animated.View style={[styles.screen, profileStyle]}>
          <ProfileView />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
```

### AI Context Provider

```tsx
// contexts/AIContext.tsx
import { createContext, useContext, useState, useCallback } from 'react';
import { aiService } from '../services/ai/aiService';
import { eventLogger } from '../services/events/eventLogger';

interface AIContextType {
  message: string;
  isListening: boolean;
  isSpeaking: boolean;
  conversation: Message[];
  startListening: () => void;
  stopListening: () => void;
  sendMessage: (text: string) => Promise<void>;
  refreshContext: () => Promise<void>;
}

export function AIProvider({ children }) {
  const [state, setState] = useState({
    message: '',
    isListening: false,
    isSpeaking: false,
    conversation: [],
  });
  
  const refreshContext = useCallback(async () => {
    const response = await aiService.getContextualMessage('ai_home');
    setState(s => ({ ...s, message: response.message }));
  }, []);
  
  const sendMessage = useCallback(async (text: string) => {
    // Log the event
    await eventLogger.log('voice_command', { command: text });
    
    // Get AI response
    const response = await aiService.processVoiceCommand(text);
    
    // Update conversation
    setState(s => ({
      ...s,
      conversation: [
        ...s.conversation,
        { role: 'user', content: text },
        { role: 'assistant', content: response.message },
      ],
      message: response.message,
    }));
    
    // Execute action if needed
    if (response.action) {
      await executeAction(response.action);
    }
    
    // Navigate if needed
    if (response.navigation) {
      navigateTo(response.navigation);
    }
  }, []);
  
  return (
    <AIContext.Provider value={{ ...state, sendMessage, refreshContext }}>
      {children}
    </AIContext.Provider>
  );
}
```

### Backend AI Routes (Updated)

```typescript
// backend/src/routes/ai.routes.ts

// Get contextual message for a screen
router.post('/contextual-message', auth, async (req, res) => {
  const { screen } = req.body;
  const userId = req.user.id;
  
  // Get user + model + unlocks
  const [user, model, unlocks] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.userModel.findUnique({ where: { userId } }),
    prisma.userUnlock.findMany({ where: { userId } }),
  ]);
  
  // Gather context
  const context = await gatherContext(userId);
  
  // Build prompts
  const unlockedFeatures = unlocks.map(u => u.feature);
  const systemPrompt = buildSystemPrompt(user, model, unlockedFeatures);
  const contextPrompt = buildContextPrompt(screen, context);
  
  // Generate message
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contextPrompt },
    ],
    max_tokens: 100,
    temperature: 0.7,
  });
  
  // Log event
  await logEvent(userId, 'ai_message_generated', { screen });
  
  res.json({
    message: response.choices[0].message.content,
    unlocks: unlocks.filter(u => !u.seenByUser), // New unlocks to show
  });
});

// Process voice command
router.post('/voice-command', auth, async (req, res) => {
  const { command, history } = req.body;
  const userId = req.user.id;
  
  // Parse intent (rule-based first, then AI)
  const intent = await parseIntent(command);
  
  // Execute action
  let actionResult = null;
  if (intent.action) {
    actionResult = await executeAction(userId, intent.action);
  }
  
  // Generate response
  const context = await gatherContext(userId);
  const response = await generateResponse(userId, intent, actionResult, context, history);
  
  // Log event
  await logEvent(userId, 'voice_command', { 
    command, 
    intent: intent.type,
    action: intent.action?.type,
  });
  
  res.json({
    message: response.message,
    action: actionResult,
    navigation: intent.navigation,
  });
});

// Log user event
router.post('/event', auth, async (req, res) => {
  const { type, screen, metadata } = req.body;
  const userId = req.user.id;
  
  await prisma.userEvent.create({
    data: {
      userId,
      type,
      screen,
      metadata,
    },
  });
  
  res.json({ success: true });
});

// Check for new unlocks
router.get('/unlocks', auth, async (req, res) => {
  const userId = req.user.id;
  
  const unlocks = await prisma.userUnlock.findMany({
    where: { userId, seenByUser: false },
  });
  
  res.json({ unlocks });
});

// Mark unlock as seen
router.post('/unlocks/:feature/seen', auth, async (req, res) => {
  const { feature } = req.params;
  const userId = req.user.id;
  
  await prisma.userUnlock.update({
    where: { userId_feature: { userId, feature } },
    data: { seenByUser: true },
  });
  
  res.json({ success: true });
});
```

---

## 10. Voice Command System

### Command Types

```
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE COMMAND TYPES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TASK COMMANDS                                                  │
│  ├─ "Add task: buy groceries"                                  │
│  ├─ "I need to call the dentist"                               │
│  ├─ "Remind me to email Sarah"                                 │
│  ├─ "Mark groceries as done"                                   │
│  ├─ "Move report to tomorrow"                                  │
│  └─ "Delete the dentist task"                                  │
│                                                                 │
│  QUERY COMMANDS                                                 │
│  ├─ "What do I have today?"                                    │
│  ├─ "How am I doing?"                                          │
│  ├─ "What's my streak?"                                        │
│  ├─ "How's the challenge going?"                               │
│  └─ "When am I most productive?" (requires unlock)            │
│                                                                 │
│  ACTION COMMANDS                                                │
│  ├─ "Start focus" / "Start focus on report"                   │
│  ├─ "Stop" / "I'm done"                                        │
│  ├─ "Add 10 minutes"                                           │
│  └─ "Nudge Sarah"                                              │
│                                                                 │
│  CONVERSATION                                                   │
│  ├─ "I'm feeling overwhelmed"                                  │
│  ├─ "What should I work on?"                                   │
│  ├─ "Help me prioritize"                                       │
│  └─ Any other natural language                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Voice Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER TAPS ORB                              │
│                           ↓                                      │
│             Haptic feedback (medium)                            │
│             Orb pulses, starts listening                        │
│             "Listening..." text appears                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    USER SPEAKS                                   │
│                           ↓                                      │
│         Live transcription shows as they speak                  │
│         Voice waves animate inside orb                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   USER STOPS / TAPS ORB                         │
│                           ↓                                      │
│             Orb transitions to "processing" state               │
│             Transcript sent to backend                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND PROCESSES                              │
│                           ↓                                      │
│  1. Parse intent (add_task? query? action? conversation?)       │
│  2. Execute action if needed (create task, start focus, etc.)  │
│  3. Generate response using context + unlocked insights        │
│  4. Return message + action result + navigation                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   AI RESPONDS                                    │
│                           ↓                                      │
│           Orb transitions to "speaking" state                   │
│           Text-to-speech plays response                         │
│           Text appears below orb                                │
│           Action confirmation shown if relevant                 │
└─────────────────────────────────────────────────────────────────┘
```

### Intent Parser

```typescript
// backend/src/services/ai/intentParser.ts

const TASK_PATTERNS = [
  /^(add|create|new) task:?\s*(.+)/i,
  /^(i need to|remind me to|don't forget to)\s*(.+)/i,
  /^(mark|complete|finish|done with)\s*(.+)/i,
  /^(move|defer|postpone)\s*(.+)\s*(to|until)\s*(.+)/i,
  /^(delete|remove|cancel)\s*(.+)/i,
];

const QUERY_PATTERNS = [
  /^(what('s| is| do i have))\s*(today|tomorrow|this week)/i,
  /^(how('m| am) i doing)/i,
  /^(what('s| is) my) (streak|level|xp)/i,
  /^(how('s| is) (the|my)) challenge/i,
  /^when (am i|is my) (most productive|peak)/i,
];

const ACTION_PATTERNS = [
  /^(start|begin) focus/i,
  /^(stop|end|i'm done|finish)/i,
  /^(add|extend) (\d+) (minutes?|mins?)/i,
  /^nudge (\w+)/i,
];

export async function parseIntent(command: string): Promise<Intent> {
  const lower = command.toLowerCase().trim();
  
  // Try rule-based first (faster, cheaper)
  for (const pattern of TASK_PATTERNS) {
    const match = lower.match(pattern);
    if (match) {
      return parseTaskIntent(match);
    }
  }
  
  for (const pattern of QUERY_PATTERNS) {
    if (pattern.test(lower)) {
      return { type: 'query', queryType: extractQueryType(lower) };
    }
  }
  
  for (const pattern of ACTION_PATTERNS) {
    const match = lower.match(pattern);
    if (match) {
      return parseActionIntent(match);
    }
  }
  
  // Fall back to AI parsing for complex/conversational
  return await aiParseIntent(command);
}

async function aiParseIntent(command: string): Promise<Intent> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: INTENT_PARSER_SYSTEM_PROMPT },
      { role: 'user', content: command },
    ],
    functions: [{
      name: 'parse_intent',
      parameters: {
        type: 'object',
        properties: {
          type: { enum: ['add_task', 'query', 'action', 'conversation'] },
          taskTitle: { type: 'string' },
          taskDuration: { type: 'number' },
          taskPriority: { enum: ['HIGH', 'MEDIUM', 'LOW'] },
          queryType: { type: 'string' },
          actionType: { type: 'string' },
          actionParams: { type: 'object' },
        },
        required: ['type'],
      },
    }],
    function_call: { name: 'parse_intent' },
  });
  
  return JSON.parse(response.choices[0].message.function_call.arguments);
}
```

---

## 11. Implementation Roadmap

### Phase 1: Core Gesture Navigation (Week 1-2)

**Week 1: Gesture System**
- [ ] Implement GestureNavigator with react-native-gesture-handler
- [ ] Create swipeable screen stack (AI Hub, Tasks, Social, Profile)
- [ ] Add haptic feedback on gestures
- [ ] Visual peek indicators (show edge of adjacent screen)
- [ ] Swipe hints for new users

**Week 2: AI Hub Screen (Living Interface)**
- [ ] Build Living Background with @shopify/react-native-skia
- [ ] Gradient mesh shader with gentle animation
- [ ] Particle field system (drift, gather, radiate)
- [ ] Center focal glow (soft, not hard-edged)
- [ ] Voice state integration (idle, listening, processing, speaking)
- [ ] Context cards floating on top (today's tasks, streak, challenge)
- [ ] Tap anywhere to activate voice

### Phase 2: Data Views (Week 3-4)

**Week 3: Tasks + Social Views**
- [ ] Tasks View (swipe left) with task list
- [ ] Subtle voice button on Tasks View
- [ ] Social View (swipe right) with circles + challenges
- [ ] Subtle voice button on Social View
- [ ] Consistent return gestures (swipe back to center)

**Week 4: Profile + Focus**
- [ ] Profile View (swipe down) with stats
- [ ] Unlock progress display
- [ ] Focus Session (swipe up) as modal
- [ ] Focus timer with voice control

### Phase 3: AI Voice System (Week 5-6)

**Week 5: Voice Processing**
- [ ] Speech-to-text integration
- [ ] Intent parser (rule-based)
- [ ] Execute task commands (add, complete, delete)
- [ ] Execute action commands (start focus, stop)
- [ ] Query responses (what do I have today, how am I doing)

**Week 6: AI Responses**
- [ ] Text-to-speech integration
- [ ] Contextual message generation
- [ ] Conversation history
- [ ] AI fallback for complex commands

### Phase 4: Learning + Unlocks (Week 7-8)

**Week 7: Event System**
- [ ] Event logging for all user actions
- [ ] UserModel schema in database
- [ ] Nightly batch job for pattern calculation
- [ ] Unlock eligibility checker

**Week 8: Progressive Unlocks**
- [ ] Unlock celebration modal
- [ ] Day 7 unlocks (peak hours, task sorting)
- [ ] Day 14 unlocks (completion patterns, duration estimation)
- [ ] Personalized AI prompts using unlocked data

### Phase 5: Polish (Week 9)

- [ ] Orb animations refined
- [ ] Gesture transitions polished
- [ ] Haptic patterns finalized
- [ ] Error states and fallbacks
- [ ] Offline handling
- [ ] Performance optimization
- [ ] QA and bug fixes

---

## Summary

### What Changed

| Old (Tab-Based) | New (Gesture-Based) |
|-----------------|---------------------|
| 5 tabs + 16 screens = 21 total | 4 swipe zones + 6 modals = 10 total |
| AI is a tab ("Talk") | AI is home (center) |
| Voice is a feature | Voice is THE interface |
| Features compete for attention | AI is always the focus |
| Insights always available | Insights unlock over time |
| Conventional navigation | Distinctive gesture navigation |

### Screen Count: 10

| Core (4) | Modals (6) |
|----------|------------|
| AI Home (center) | Focus Session |
| Tasks View (left) | Task Detail |
| Social View (right) | Circle Home |
| Profile View (down) | Challenge Detail |
| | Settings |
| | Unlock Celebration |

### Gestures

| Direction | From Center | From View |
|-----------|-------------|-----------|
| ← Left | Tasks View | - |
| → Right | Social View | AI Home |
| ↑ Up | Focus Modal | - |
| ↓ Down | Profile View | AI Home |
| Tap Orb | Voice Mode | Voice Mode |

### Unlock Timeline

| Day | Features |
|-----|----------|
| 1 | Voice commands, tasks, focus, circles |
| 3 | Personalized greetings |
| 7 | Peak hours, task sorting, weekly comparison |
| 14 | Duration estimation, completion patterns |
| 30 | Predictive mode, overwhelm detection |

### Timeline: 9 weeks total

---

## 12. Complete Modal Workflows

### Task Detail Modal

**Entry Points:**
- Tap any task in Tasks View
- Tap task in Context Card (AI Home)
- Voice: "Show me the [task name] task"
- Tap task notification

**Exit Points:**
- Swipe down → Dismiss (return to previous screen)
- Tap X button → Dismiss
- Save changes → Dismiss with success feedback
- Delete task → Confirm dialog → Dismiss

```
┌─────────────────────────────────────────────┐
│  ╳                              [Delete]   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Task Title (editable)               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Due: Today, 3:00 PM          [Change]     │
│  Duration: ~30 mins           [Change]     │
│  Priority: HIGH ●●●           [Change]     │
│  Category: Work               [Change]     │
│                                             │
│ ─────────────────────────────────────────── │
│  AI SUGGESTION                              │
│  ┌─────────────────────────────────────┐   │
│  │ "Based on your patterns, you're     │   │
│  │  70% likely to complete this if you │   │
│  │  start before 11am."                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  SUBTASKS                                   │
│  ○ Research competitors                    │
│  ○ Write outline                           │
│  + Add subtask                             │
│                                             │
│ ─────────────────────────────────────────── │
│                                             │
│  [Start Focus on This]    [Mark Complete]  │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Tap title → Edit inline
- Tap any field → Picker/editor appears
- "Start Focus on This" → Opens Focus Modal with task pre-selected
- "Mark Complete" → Completes task, awards XP, dismisses modal
- "Delete" → Confirmation dialog → Deletes → Dismisses

**API Calls:**
- `GET /api/tasks/:id` - Load task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/complete` - Complete task
- `GET /api/ai/task-suggestion/:id` - Get AI suggestion for task

---

### Circle Home Modal

**Entry Points:**
- Tap any circle in Social View
- Voice: "Show me [circle name]"
- Tap circle notification
- Deep link from invite

**Exit Points:**
- Swipe down → Dismiss (return to Social View)
- Tap X button → Dismiss
- Tap member → Member Profile sheet
- Tap challenge → Challenge Detail Modal

```
┌─────────────────────────────────────────────┐
│  ╳                              [Settings] │
│                                             │
│         💼 Work Circle                     │
│         5 members • Created Jan 2026       │
│                                             │
│ ─────────────────────────────────────────── │
│  AI SUMMARY                                 │
│  "Team productivity up 15% this week.      │
│   Sarah is leading with 23 tasks done."    │
│                                             │
│ ─────────────────────────────────────────── │
│  MEMBERS                                    │
│  ┌─────────────────────────────────────┐   │
│  │ 👤 Sarah (Owner)     🔥 12 streak  │   │
│  │ 👤 Mike              ● Online       │   │
│  │ 👤 Lisa              ○ Away         │   │
│  │ 👤 You               🔥 7 streak   │   │
│  │ + Invite member                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  ACTIVE CHALLENGES                          │
│  ┌─────────────────────────────────────┐   │
│  │ 🏃 Weekly Focus Challenge   Day 3/7│   │
│  │    Sarah: 240min | You: 180min     │   │
│  └─────────────────────────────────────┘   │
│  [+ Start New Challenge]                   │
│                                             │
│ ─────────────────────────────────────────── │
│  RECENT ACTIVITY                            │
│  Mike completed "Q4 Report" • 2m ago       │
│  Sarah started focus mode • 15m ago        │
│  Lisa joined the circle • 2 days ago       │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Tap member → Shows member stats sheet (bottom sheet)
- "Invite member" → Share invite link or search users
- Tap challenge → Opens Challenge Detail Modal
- "Start New Challenge" → Opens Create Challenge flow
- Settings → Circle settings (rename, leave, delete if owner)

**API Calls:**
- `GET /api/circles/:id` - Load circle details
- `GET /api/circles/:id/members` - Load members
- `GET /api/circles/:id/activity` - Load activity feed
- `GET /api/circles/:id/challenges` - Load challenges
- `POST /api/circles/:id/invite` - Create invite
- `DELETE /api/circles/:id/leave` - Leave circle

---

### Challenge Detail Modal

**Entry Points:**
- Tap challenge in Social View
- Tap challenge in Circle Home
- Tap challenge Context Card (AI Home)
- Voice: "How's the challenge going?"
- Challenge notification tap

**Exit Points:**
- Swipe down → Dismiss
- Tap X → Dismiss
- Complete challenge → Celebration → Dismiss

```
┌─────────────────────────────────────────────┐
│  ╳                                    →    │
│                                             │
│         🏃 7-Day Focus Challenge           │
│         Work Circle • 3 days left          │
│                                             │
│ ─────────────────────────────────────────── │
│  LEADERBOARD                                │
│  ┌─────────────────────────────────────┐   │
│  │ 🥇 Sarah         320 mins  ████████ │   │
│  │ 🥈 You           245 mins  ██████   │   │
│  │ 🥉 Mike          180 mins  ████     │   │
│  │ 4. Lisa          120 mins  ███      │   │
│  │ 5. John           60 mins  █        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  AI COMMENTARY                              │
│  "You're 75 mins behind Sarah. With your   │
│   usual 2hr daily focus, you can catch up  │
│   by tomorrow!"                            │
│                                             │
│ ─────────────────────────────────────────── │
│  YOUR PROGRESS                              │
│  ┌─────────────────────────────────────┐   │
│  │  Today: 45 mins                     │   │
│  │  ████████░░░░░░░░ 45/120 goal      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Start Focus Session]                     │
│                                             │
│ ─────────────────────────────────────────── │
│  PROOF SUBMISSIONS (if required)            │
│  ┌───────┐ ┌───────┐ ┌───────┐            │
│  │ Day 1 │ │ Day 2 │ │ Day 3 │            │
│  │  ✓    │ │  ✓    │ │  +    │            │
│  └───────┘ └───────┘ └───────┘            │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Tap leaderboard member → Show their stats
- "Start Focus Session" → Opens Focus Modal (progress counts)
- Tap proof day → Submit proof (photo + note)
- Share button (→) → Share challenge to invite others

**API Calls:**
- `GET /api/challenges/:id` - Load challenge details
- `GET /api/challenges/:id/leaderboard` - Load standings
- `POST /api/challenges/:id/proof` - Submit proof
- `GET /api/ai/challenge-commentary/:id` - Get AI commentary

---

### Settings Modal

**Entry Points:**
- Tap "Settings" in Profile View
- Voice: "Open settings"

**Exit Points:**
- Swipe down → Dismiss
- Tap X → Dismiss
- Tap back arrow → Dismiss

```
┌─────────────────────────────────────────────┐
│  ←  Settings                               │
│                                             │
│ ─────────────────────────────────────────── │
│  ACCOUNT                                    │
│  ┌─────────────────────────────────────┐   │
│  │ Edit Profile                    →   │   │
│  │ Change Password                 →   │   │
│  │ Connected Accounts              →   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  VOICE & AI                                 │
│  ┌─────────────────────────────────────┐   │
│  │ Voice Speed          [Normal ▼]     │   │
│  │ Voice Name           [Nova ▼]       │   │
│  │ "Hey MYPA" Wake Word    [○ OFF]     │   │
│  │ AI Personality       [Friendly ▼]   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  NOTIFICATIONS                              │
│  ┌─────────────────────────────────────┐   │
│  │ Push Notifications      [● ON]      │   │
│  │ Daily Brief             [● ON]      │   │
│  │ Task Reminders          [● ON]      │   │
│  │ Challenge Updates       [● ON]      │   │
│  │ Quiet Hours             [10PM-7AM]  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  FOCUS                                      │
│  ┌─────────────────────────────────────┐   │
│  │ Default Duration        [25 min]    │   │
│  │ Break Duration          [5 min]     │   │
│  │ Auto-start Breaks       [○ OFF]     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  ABOUT                                      │
│  ┌─────────────────────────────────────┐   │
│  │ Privacy Policy                  →   │   │
│  │ Terms of Service                →   │   │
│  │ Help & Support                  →   │   │
│  │ Rate MYPA                       →   │   │
│  │ Version 1.0.0                       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  [Sign Out]                                 │
│                                             │
└─────────────────────────────────────────────┘
```

**Sub-screens:**
- Edit Profile → Name, username, avatar, bio
- Connected Accounts → Apple ID, Google (future)
- Privacy Policy/Terms → WebView
- Help & Support → FAQ + Contact form

**API Calls:**
- `GET /api/users/settings` - Load settings
- `PUT /api/users/settings` - Update settings
- `PUT /api/users/profile` - Update profile
- `POST /api/auth/logout` - Sign out

---

### Quick Add Task Flow

**Entry Points:**
- Tap + button in Tasks View
- Voice: "Add task [name]"
- Long press on AI Hub screen → Quick add
- Notification action "Add Task"

```
┌─────────────────────────────────────────────┐
│                                             │
│                   ╳                         │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ What do you need to do?             │   │
│  │ _________________________________   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐  │
│  │ Today │ │Tmrw   │ │ This  │ │ No    │  │
│  │   ●   │ │       │ │ Week  │ │ Date  │  │
│  └───────┘ └───────┘ └───────┘ └───────┘  │
│                                             │
│  ┌───────┐ ┌───────┐ ┌───────┐            │
│  │ HIGH  │ │MEDIUM │ │ LOW   │            │
│  │  ●●●  │ │  ●●   │ │  ●    │            │
│  └───────┘ └───────┘ └───────┘            │
│                                             │
│  [More Options]                            │
│                                             │
│         [Add Task]                         │
│                                             │
│  ─────────────────────────────────────────  │
│  AI: "Should I also schedule time for      │
│       this based on your calendar?"        │
│       [Yes]  [No]                          │
│                                             │
└─────────────────────────────────────────────┘
```

**Flow:**
1. User types task name
2. Select date (default: Today)
3. Select priority (default: Medium)
4. Tap "Add Task" → Task created
5. AI may suggest scheduling → Optional
6. Modal dismisses with success haptic

**API Calls:**
- `POST /api/tasks` - Create task
- `GET /api/ai/task-parse` - AI parses natural language for duration/category

---

### Create Circle Flow

**Entry Points:**
- Tap + in Social View → "Create Circle"
- Voice: "Create a new circle"

**Step 1: Circle Info**
```
┌─────────────────────────────────────────────┐
│  ←  Create Circle                          │
│                                             │
│  Step 1 of 3                               │
│                                             │
│  Circle Name                               │
│  ┌─────────────────────────────────────┐   │
│  │ Work Team                           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Description (optional)                    │
│  ┌─────────────────────────────────────┐   │
│  │ Our productivity accountability     │   │
│  │ group                               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Choose an emoji                           │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│  │💼│ │🏠│ │💪│ │📚│ │🎯│ │🚀│     │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘     │
│                                             │
│                                             │
│              [Next]                        │
│                                             │
└─────────────────────────────────────────────┘
```

**Step 2: Privacy**
```
┌─────────────────────────────────────────────┐
│  ←  Create Circle                          │
│                                             │
│  Step 2 of 3                               │
│                                             │
│  Who can join?                             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ● Invite Only                       │   │
│  │   Only people you invite can join   │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ ○ Anyone with Link                  │   │
│  │   Share link, anyone can join       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                                             │
│              [Next]                        │
│                                             │
└─────────────────────────────────────────────┘
```

**Step 3: Invite Members**
```
┌─────────────────────────────────────────────┐
│  ←  Create Circle                          │
│                                             │
│  Step 3 of 3                               │
│                                             │
│  Invite members                            │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🔍 Search by username or email      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Or share invite link:                     │
│  ┌─────────────────────────────────────┐   │
│  │ mypa.app/join/abc123        [Copy]  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Share via Messages]                      │
│  [Share via WhatsApp]                      │
│  [Share via Email]                         │
│                                             │
│                                             │
│  [Skip for Now]    [Create Circle]         │
│                                             │
└─────────────────────────────────────────────┘
```

**API Calls:**
- `POST /api/circles` - Create circle
- `POST /api/circles/:id/invite` - Send invite
- `GET /api/users/search?q=` - Search users

---

### Create Challenge Flow

**Entry Points:**
- "Start New Challenge" in Circle Home
- Tap + in Social View → "Start Challenge"
- Voice: "Start a challenge with [circle]"

**Step 1: Challenge Type**
```
┌─────────────────────────────────────────────┐
│  ←  New Challenge                          │
│                                             │
│  What type of challenge?                   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ⏱️  Focus Minutes                   │   │
│  │     Who can focus the most?         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ ✓  Tasks Completed                  │   │
│  │     Who completes the most tasks?   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🔥 Streak Days                      │   │
│  │     Who can maintain the longest?   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🎯 Custom Goal                      │   │
│  │     Set your own target             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│              [Next]                        │
│                                             │
└─────────────────────────────────────────────┘
```

**Step 2: Details**
```
┌─────────────────────────────────────────────┐
│  ←  New Challenge                          │
│                                             │
│  Challenge Details                         │
│                                             │
│  Name                                      │
│  ┌─────────────────────────────────────┐   │
│  │ Weekly Focus Sprint                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Duration                                  │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐  │
│  │3 Days │ │ 1 Week│ │2 Weeks│ │1 Month│  │
│  │       │ │   ●   │ │       │ │       │  │
│  └───────┘ └───────┘ └───────┘ └───────┘  │
│                                             │
│  Daily Goal (optional)                     │
│  ┌─────────────────────────────────────┐   │
│  │ 60 minutes per day                  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Require Proof?                            │
│  ┌─────────────────────────────────────┐   │
│  │ ○ No proof needed                   │   │
│  │ ● Daily photo/screenshot            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│              [Create Challenge]            │
│                                             │
└─────────────────────────────────────────────┘
```

**API Calls:**
- `POST /api/challenges` - Create challenge
- `POST /api/challenges/:id/join` - Auto-join creator

---

### Join Circle by Invite Flow

**Entry Points:**
- Deep link: `mypa.app/join/[code]`
- Notification: "You've been invited to join [Circle]"
- Paste invite code

```
┌─────────────────────────────────────────────┐
│                                             │
│                   ╳                         │
│                                             │
│         You're Invited!                    │
│                                             │
│         ┌───────────────┐                  │
│         │      💼       │                  │
│         │  Work Circle  │                  │
│         └───────────────┘                  │
│                                             │
│         5 members                          │
│         Created by Sarah                   │
│                                             │
│  "Our team's accountability group for      │
│   staying productive together!"            │
│                                             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Members you may know:               │   │
│  │ 👤 Sarah  👤 Mike  👤 Lisa         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                                             │
│    [Decline]         [Join Circle]         │
│                                             │
└─────────────────────────────────────────────┘
```

**Flow:**
1. Deep link opens app (or App Store if not installed)
2. If logged in → Show invite preview
3. If not logged in → Login first, then show preview
4. "Join Circle" → Added to circle → Navigate to Circle Home
5. "Decline" → Dismiss, invitation marked declined

**API Calls:**
- `GET /api/invitations/:code` - Get invite details
- `POST /api/invitations/:code/accept` - Accept invite
- `POST /api/invitations/:code/decline` - Decline invite

---

### Unlock Details Flow

**Entry Points:**
- Tap locked feature in Profile View
- Tap unlock progress card
- Voice: "What features can I unlock?"

```
┌─────────────────────────────────────────────┐
│                                             │
│                   ╳                         │
│                                             │
│         🔒 Peak Hours Insight              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │  This feature shows you when       │   │
│  │  you're most productive during     │   │
│  │  the day, based on your actual     │   │
│  │  task completion patterns.         │   │
│  │                                     │   │
│  │  MYPA will automatically           │   │
│  │  schedule important tasks during   │   │
│  │  your peak hours.                  │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  HOW TO UNLOCK                              │
│                                             │
│  ✓ Use MYPA for 7 days         7/7        │
│  ○ Complete 10 tasks           6/10       │
│                                             │
│  ████████████████░░░░ 85%                  │
│                                             │
│  "Complete 4 more tasks to unlock!"        │
│                                             │
│                [Got it]                    │
│                                             │
└─────────────────────────────────────────────┘
```

---

### Notifications Center

**Entry Points:**
- Tap bell icon (if shown)
- Swipe down from top (system notification)
- Voice: "Show my notifications"

```
┌─────────────────────────────────────────────┐
│  ←  Notifications                          │
│                                             │
│  TODAY                                      │
│  ┌─────────────────────────────────────┐   │
│  │ 🔔 Sarah completed "Q4 Report"     │   │
│  │    Work Circle • 2 mins ago         │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 🏆 You're now 2nd in Focus Sprint  │   │
│  │    Keep going! • 1 hour ago         │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ ✨ New unlock available!            │   │
│  │    Tap to see • 3 hours ago         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  YESTERDAY                                  │
│  ┌─────────────────────────────────────┐   │
│  │ 🔥 7-day streak! Keep it up!       │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 👥 Mike invited you to join Family │   │
│  │    [Accept]  [Decline]              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  EARLIER                                    │
│  ...                                        │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Tap notification → Navigate to relevant screen
- Swipe notification left → Delete
- Circle invite → Accept/Decline inline

**API Calls:**
- `GET /api/notifications` - Load all notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

---

## 13. Complete Navigation Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE NAVIGATION MAP                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌─────────────┐                               │
│                              │   LAUNCH    │                               │
│                              └──────┬──────┘                               │
│                                     │                                       │
│                    ┌────────────────┼────────────────┐                     │
│                    ↓                ↓                ↓                     │
│              ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│              │Onboarding│    │  Login   │    │ AI Home  │                 │
│              │(new user)│───→│          │───→│ (center) │                 │
│              └──────────┘    └──────────┘    └────┬─────┘                 │
│                                                    │                       │
│     ┌────────────────┬────────────────┬───────────┼───────────┐           │
│     ↓                ↓                ↓           ↓           ↓           │
│ ┌────────┐     ┌──────────┐    ┌──────────┐ ┌──────────┐ ┌────────┐      │
│ │ Tasks  │     │  Social  │    │ Profile  │ │  Focus   │ │ Voice  │      │
│ │  View  │     │   View   │    │   View   │ │  Modal   │ │ Active │      │
│ │(swipe←)│     │ (swipe→) │    │ (swipe↓) │ │(swipe ↑) │ │(tap orb│      │
│ └───┬────┘     └────┬─────┘    └────┬─────┘ └────┬─────┘ └────────┘      │
│     │               │               │            │                        │
│     ↓               ↓               ↓            │                        │
│ ┌────────┐    ┌──────────┐    ┌──────────┐      │                        │
│ │ Task   │    │  Circle  │    │ Settings │      │                        │
│ │ Detail │    │   Home   │    │  Modal   │      │                        │
│ │ Modal  │    │  Modal   │    └──────────┘      │                        │
│ └────────┘    └────┬─────┘                      │                        │
│                    │                             │                        │
│               ┌────┴─────┐                      │                        │
│               ↓          ↓                      │                        │
│          ┌────────┐ ┌──────────┐               │                        │
│          │Challenge│ │  Invite  │               │                        │
│          │ Detail │ │  Flow    │               │                        │
│          │ Modal  │ └──────────┘               │                        │
│          └────────┘                             │                        │
│                                                 │                        │
│  ┌──────────────────────────────────────────────┘                        │
│  │                                                                        │
│  ↓                                                                        │
│ ┌─────────────────────────────────────────────────────────────────────┐  │
│ │                        GLOBAL OVERLAYS                              │  │
│ ├─────────────────────────────────────────────────────────────────────┤  │
│ │  • Unlock Celebration Modal (auto-triggered)                        │  │
│ │  • Quick Add Task (+ button or voice)                               │  │
│ │  • Notifications Center (bell or swipe)                             │  │
│ │  • Error/Offline States (auto-triggered)                            │  │
│ │  • Daily Brief (first open of day)                                  │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Voice Command Complete Reference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE VOICE COMMANDS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TASK COMMANDS                                                              │
│  ├─ "Add task [name]"              → Creates task, confirms              │
│  ├─ "Add task [name] for tomorrow" → Creates with date                   │
│  ├─ "Add task [name] high priority"→ Creates with priority               │
│  ├─ "What do I have today?"        → Lists today's tasks                 │
│  ├─ "What do I have tomorrow?"     → Lists tomorrow's tasks              │
│  ├─ "What's my most important task?"→ Shows highest priority            │
│  ├─ "Mark [task] as done"          → Completes task                      │
│  ├─ "Complete [task]"              → Completes task                      │
│  ├─ "Move [task] to tomorrow"      → Defers task                         │
│  ├─ "Delete [task]"                → Confirms, then deletes              │
│  └─ "How many tasks do I have?"    → Counts by status                    │
│                                                                             │
│  FOCUS COMMANDS                                                             │
│  ├─ "Start focus"                  → Opens Focus Modal                   │
│  ├─ "Start focus on [task]"        → Focus with specific task            │
│  ├─ "Start a 30 minute focus"      → Focus with duration                 │
│  ├─ "How long have I been focused?"→ (During focus) Reports time         │
│  ├─ "Add 10 minutes"               → (During focus) Extends              │
│  ├─ "I'm done" / "Stop"            → (During focus) Ends session         │
│  ├─ "What's next?"                 → (During focus) Next task            │
│  └─ "Pause" / "Resume"             → (During focus) Controls timer       │
│                                                                             │
│  QUERY COMMANDS                                                             │
│  ├─ "How am I doing?"              → Stats summary                       │
│  ├─ "What's my streak?"            → Streak info                         │
│  ├─ "What level am I?"             → XP and level                        │
│  ├─ "How's the challenge going?"   → Challenge status                    │
│  ├─ "When am I most productive?"   → (Requires unlock) Peak hours       │
│  └─ "Show me my stats"             → Full stats breakdown                │
│                                                                             │
│  NAVIGATION COMMANDS                                                        │
│  ├─ "Show me my tasks"             → Navigates to Tasks View             │
│  ├─ "Open social" / "Show circles" → Navigates to Social View            │
│  ├─ "Open profile"                 → Navigates to Profile View           │
│  ├─ "Open settings"                → Opens Settings Modal                │
│  ├─ "Show [circle name]"           → Opens Circle Home                   │
│  └─ "Go back" / "Go home"          → Returns to AI Home                  │
│                                                                             │
│  SOCIAL COMMANDS                                                            │
│  ├─ "Create a circle"              → Starts Create Circle flow           │
│  ├─ "Start a challenge"            → Starts Create Challenge flow        │
│  ├─ "Nudge [person]"               → Sends nudge notification            │
│  ├─ "How's [circle] doing?"        → Circle summary                      │
│  └─ "Who's winning the challenge?" → Leaderboard summary                 │
│                                                                             │
│  CONVERSATIONAL                                                             │
│  ├─ "I'm feeling overwhelmed"      → Supportive response + suggestions   │
│  ├─ "Help me prioritize"           → AI suggests order                   │
│  ├─ "What should I work on?"       → AI recommends task                  │
│  ├─ "I'm procrastinating"          → Motivational response               │
│  └─ Any other natural language     → Conversational AI response          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 15. API Endpoints Complete Reference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE API REFERENCE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  AUTH                                                                       │
│  POST   /api/auth/register         Register new user                       │
│  POST   /api/auth/login            Login with email/password               │
│  POST   /api/auth/apple            Login with Apple                        │
│  POST   /api/auth/refresh          Refresh access token                    │
│  POST   /api/auth/logout           Logout (invalidate tokens)              │
│  POST   /api/auth/forgot-password  Send reset email                        │
│  POST   /api/auth/reset-password   Reset with token                        │
│                                                                             │
│  USERS                                                                      │
│  GET    /api/users/me              Get current user                        │
│  PUT    /api/users/me              Update profile                          │
│  GET    /api/users/settings        Get user settings                       │
│  PUT    /api/users/settings        Update settings                         │
│  GET    /api/users/search          Search users by username                │
│  GET    /api/users/:id/stats       Get user stats                          │
│                                                                             │
│  TASKS                                                                      │
│  GET    /api/tasks                 List tasks (with filters)               │
│  POST   /api/tasks                 Create task                             │
│  GET    /api/tasks/:id             Get task details                        │
│  PUT    /api/tasks/:id             Update task                             │
│  DELETE /api/tasks/:id             Delete task                             │
│  POST   /api/tasks/:id/complete    Complete task                           │
│  POST   /api/tasks/:id/defer       Defer task                              │
│                                                                             │
│  FOCUS                                                                      │
│  GET    /api/focus/active          Get active session (if any)             │
│  POST   /api/focus/start           Start focus session                     │
│  POST   /api/focus/pause           Pause session                           │
│  POST   /api/focus/resume          Resume session                          │
│  POST   /api/focus/end             End session                             │
│  GET    /api/focus/history         Get focus history                       │
│  GET    /api/focus/stats           Get focus stats                         │
│                                                                             │
│  CIRCLES                                                                    │
│  GET    /api/circles               List user's circles                     │
│  POST   /api/circles               Create circle                           │
│  GET    /api/circles/:id           Get circle details                      │
│  PUT    /api/circles/:id           Update circle                           │
│  DELETE /api/circles/:id           Delete circle (owner only)              │
│  GET    /api/circles/:id/members   Get members                             │
│  POST   /api/circles/:id/invite    Create invite                           │
│  DELETE /api/circles/:id/leave     Leave circle                            │
│  GET    /api/circles/:id/activity  Get activity feed                       │
│                                                                             │
│  INVITATIONS                                                                │
│  GET    /api/invitations           List pending invitations                │
│  GET    /api/invitations/:code     Get invite details                      │
│  POST   /api/invitations/:code/accept   Accept invite                      │
│  POST   /api/invitations/:code/decline  Decline invite                     │
│                                                                             │
│  CHALLENGES                                                                 │
│  GET    /api/challenges            List challenges                         │
│  POST   /api/challenges            Create challenge                        │
│  GET    /api/challenges/:id        Get challenge details                   │
│  GET    /api/challenges/:id/leaderboard  Get standings                    │
│  POST   /api/challenges/:id/join   Join challenge                          │
│  POST   /api/challenges/:id/proof  Submit proof                            │
│  DELETE /api/challenges/:id/leave  Leave challenge                         │
│                                                                             │
│  AI                                                                         │
│  GET    /api/ai/greeting           Get contextual greeting                 │
│  POST   /api/ai/voice-command      Process voice command                   │
│  GET    /api/ai/daily-brief        Get daily brief                         │
│  GET    /api/ai/suggestions        Get proactive suggestions               │
│  GET    /api/ai/task-suggestion/:id  Get task-specific AI suggestion      │
│  GET    /api/ai/challenge-commentary/:id  Get challenge commentary        │
│  POST   /api/ai/contextual-message Process screen-specific message        │
│                                                                             │
│  UNLOCKS                                                                    │
│  GET    /api/unlocks               Get all unlock statuses                 │
│  GET    /api/unlocks/pending       Get unseen unlocks                      │
│  POST   /api/unlocks/:feature/seen Mark unlock as seen                     │
│                                                                             │
│  EVENTS                                                                     │
│  POST   /api/events                Log events (batch)                      │
│  GET    /api/events                Get events (debug)                      │
│                                                                             │
│  NOTIFICATIONS                                                              │
│  GET    /api/notifications         List notifications                      │
│  PUT    /api/notifications/:id/read  Mark as read                          │
│  DELETE /api/notifications/:id     Delete notification                     │
│  POST   /api/notifications/push-token  Register push token                │
│                                                                             │
│  HEALTH                                                                     │
│  GET    /health                    Basic health check                      │
│  GET    /health/detailed           Detailed health (admin)                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Screen-to-Old-Screen Migration Map

This maps which old screens combine into new screens:

| NEW Screen | OLD Screens to Merge/Replace |
|------------|------------------------------|
| **AI Home** | Hub (partial), VoiceAssistant, Listening, DailyBriefing |
| **Tasks View** | Plan, Tasks, TaskSorting |
| **Social View** | Circle (list), Challenges (list), Inbox (activity) |
| **Profile View** | Profile, Streak, Level, Wallet (XP display) |
| **Focus Modal** | Focus (existing - adapt) |
| **Task Detail Modal** | Tasks/TaskDetail (if exists) |
| **Circle Home Modal** | Circle (detail) |
| **Challenge Detail Modal** | Challenges (detail), Proof |
| **Settings Modal** | Settings, Notification (settings), PrivacyControls |
| **Unlock Modal** | NEW - no equivalent |

**Screens to DELETE:**
- Hub (replaced by AI Home)
- AIInsights (merged into Profile)
- Analytics (merged into Profile)
- DailyLifeCard (merged into Social)
- EditProfile (merged into Settings)
- HelpSupport (merged into Settings)
- Integrations (Settings sub-screen)
- Login/Reset (keep for auth flow)
- Onboarding (keep, update)
- SavedPlaces (remove or Settings sub-screen)
- Subscription (Settings sub-screen)

---

*Document Version: 3.0*
*Updated: February 2026*
*Change: Added complete modal workflows, navigation map, voice commands, API reference, migration map*
