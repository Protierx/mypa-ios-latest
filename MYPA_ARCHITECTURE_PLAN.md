# MYPA Architecture Plan v2
## Voice-First AI Agent — Gesture-Based Navigation

> **Vision**: MYPA is not an app with AI. MYPA *is* the AI. You talk to it. Everything else is just views of what it knows.

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
- TAP ORB → Talk to MYPA

---

## 2. The Gesture Model

### Why No Tab Bar?

| Tab Bar | Gesture-Based |
|---------|---------------|
| 5 buttons competing for attention | AI orb is the only focus |
| "Which tab do I need?" | "I'll just tell MYPA" |
| AI feels like a feature | AI feels like the interface |
| Conventional, forgettable | Distinctive, memorable |
| Requires thumb reach | Natural swipe motions |

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
│   │Circles│ ←───────── │   AI HOME   │ ─────────→│ Tasks │      │
│   │Social │            │             │          │ Data  │      │
│   │Friends│            │  ┌─────┐    │          │ Plan  │      │
│   └───────┘            │  │ ORB │    │          └───────┘      │
│                        │  └─────┘    │                         │
│                        │             │                         │
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
| Tap orb | Heavy tap | Orb pulses | Listening chime |
| Orb responds | Light tap | Orb animates | AI speaks |

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
│                                             │
│           ✨ NEW INSIGHT UNLOCKED ✨        │
│                                             │
│         ┌───────────────────────┐          │
│         │       AI ORB          │          │
│         │    (celebrating)      │          │
│         └───────────────────────┘          │
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
- [ ] Create swipeable screen stack (AI Home, Tasks, Social, Profile)
- [ ] Add haptic feedback on gestures
- [ ] Visual peek indicators (show edge of adjacent screen)
- [ ] Swipe hints for new users

**Week 2: AI Home Screen**
- [ ] Build AI Orb component with states (idle, listening, processing, speaking)
- [ ] Context cards below orb (today's tasks, streak, challenge)
- [ ] Basic voice input (tap orb → listen → stop)
- [ ] Static AI greeting (no personalization yet)

### Phase 2: Data Views (Week 3-4)

**Week 3: Tasks + Social Views**
- [ ] Tasks View (swipe left) with task list
- [ ] Mini orb on Tasks View
- [ ] Social View (swipe right) with circles + challenges
- [ ] Mini orb on Social View
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

*Document Version: 2.0*
*Updated: February 2026*
*Change: Tab-based → Gesture-based, 21 screens → 10 screens, Progressive unlocks added*
