# MYPA Hub Redesign v2.0
## From MVP to Premium AI-First Experience

> **Goal**: Transform the Hub from a static dashboard into a living, breathing AI command center that feels like it was built by a 50-person team over 5 years.

---

## 📐 Design Philosophy

### The Three Pillars

1. **AI-Native, Not AI-Added**
   - The AI isn't a feature—it's the soul of the app
   - Every empty state is an AI conversation starter
   - Every completion is an AI-guided next step

2. **Consistent Structure, Dynamic Content**
   - Layout bones NEVER change
   - Only the AI's words and task content adapt
   - User builds muscle memory

3. **Premium Polish**
   - Every interaction has purpose
   - Micro-animations that feel expensive
   - Typography that breathes
   - Whitespace that commands respect

---

## 🎯 Hub States & AI Behavior

### State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                        HUB STATES                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│  │  EMPTY  │───▶│ PLANNED │───▶│ ACTIVE  │───▶│  DONE   │ │
│  │         │    │         │    │         │    │         │ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘ │
│       │              │              │              │       │
│       ▼              ▼              ▼              ▼       │
│   AI prompts     AI confirms    AI coaches    AI guides   │
│   "Let's plan"   "Ready to go"  "Keep going"  "What next" │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### State Definitions

| State | Condition | AI Personality | Primary Action |
|-------|-----------|----------------|----------------|
| **EMPTY** | 0 tasks for today | Proactive, Curious | "Plan with AI" |
| **PLANNED** | Tasks exist, 0 complete | Confident, Ready | "Start first task" |
| **ACTIVE** | 1+ complete, more to go | Encouraging, Coach | "Continue" |
| **DONE** | All tasks complete | Celebratory → Forward-looking | "Plan tomorrow" |
| **OVERDUE** | Past-due tasks exist | Gentle, Non-judgmental | "Let's reset" |

---

## 🏗️ Hub Architecture

### Screen Structure (Top to Bottom)

```
┌─────────────────────────────────────────────┐
│ ░░░░░░░░░░░░ SAFE AREA TOP ░░░░░░░░░░░░░░░ │
├─────────────────────────────────────────────┤
│                                             │
│  HEADER BAR                          44pt   │
│  [Greeting + Level] [Notif] [Avatar]        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  STATS STRIP                         64pt   │
│  [XP] [Tasks] [Streak] — Tappable           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  AI CARD (The Heart)               180pt    │
│  ┌─────────────────────────────────────┐   │
│  │  Orb + Dynamic Message              │   │
│  │  Primary CTA + Secondary CTA        │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  TODAY'S FOCUS                     Flex     │
│  Section Header: "Today's Focus" [See All]  │
│  ┌─────────────────────────────────────┐   │
│  │ Task 1                              │   │
│  │ Task 2                              │   │
│  │ Task 3                              │   │
│  │ + Add task (inline)                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  COMING UP (Collapsed by default)    80pt   │
│  "Tomorrow: 2 tasks • This week: 5"         │
│                                             │
├─────────────────────────────────────────────┤
│ ░░░░░░░░░░░░ TAB BAR SPACE ░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Header Bar (Always Visible)
```
┌─────────────────────────────────────────────┐
│ Good afternoon        ⚡Lv 3    🔔    [A]   │
│ alice                                       │
└─────────────────────────────────────────────┘
```
- **Greeting**: Time-contextual (morning/afternoon/evening)
- **Name**: User's display name, bold
- **Level Badge**: Tappable → Level screen
- **Notification Bell**: Badge count if unread
- **Avatar**: Tappable → Profile

**Premium Details:**
- Greeting fades between time periods (no jarring change at noon)
- Level badge has subtle shimmer animation
- Bell has gentle bounce when new notification arrives

#### 2. Stats Strip
```
┌──────────────┬──────────────┬──────────────┐
│    ⚡ 940    │    ◎ 2/5    │    🔥 7     │
│      XP      │    TASKS    │   STREAK    │
└──────────────┴──────────────┴──────────────┘
```
- **XP**: Today's earnings, tappable → Wallet
- **Tasks**: Completion ratio, tappable → Plan
- **Streak**: Current streak with fire, tappable → Streak screen

**Premium Details:**
- XP counter animates up when tasks complete (slot machine effect)
- Task ratio updates in real-time
- Streak fire icon flickers subtly
- Cards have soft shadows that respond to scroll position

#### 3. AI Card (The Heart of the App)

This is the **hero component**. It must feel alive.

```
┌─────────────────────────────────────────────┐
│                                             │
│              ┌───────────┐                  │
│              │    ◐◓◑    │  ← AI Orb       │
│              │   Orb     │    (animated)   │
│              └───────────┘                  │
│                                             │
│        "Your afternoon looks free.          │
│         Based on your patterns, you         │
│         crush tasks on Sunday evenings.     │
│         Ready to plan something?"           │
│                                             │
│    ┌─────────────┐  ┌─────────────────┐   │
│    │ Plan with AI │  │ I'll add myself │   │
│    └─────────────┘  └─────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**AI Card States:**

| State | Gradient | Orb Animation | Message Type |
|-------|----------|---------------|--------------|
| EMPTY | Purple→Pink | Slow pulse, curious | Question/Invitation |
| PLANNED | Blue→Purple | Ready pulse | Affirmation |
| ACTIVE | Teal→Blue | Energetic pulse | Encouragement |
| DONE | Green→Teal | Celebration burst → Calm | Celebration → Forward |
| OVERDUE | Amber→Orange | Gentle pulse | Compassionate |

**Premium Details:**
- Orb has depth (inner glow, outer glow, subtle 3D)
- Gradient shifts subtly over time (living background)
- Text appears with typewriter effect on first load
- Buttons have haptic feedback
- Tapping orb opens voice assistant

#### 4. Today's Focus Section

```
┌─────────────────────────────────────────────┐
│ Today's Focus                    See all ›  │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ ○  Finish project proposal      ⏱ 45m  │ │
│ │    High priority • Work                 │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ○  Call dentist                 ⏱ 5m   │ │
│ │    Personal                            │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ◉  Morning workout              ✓ Done  │ │
│ │    Health • +25 XP                      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│    ┌─────────────────────────────────────┐ │
│    │  + What else do you need to do?     │ │
│    └─────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Task Card Design:**
- Uncompleted: White background, subtle left border (priority color)
- Completed: Subtle gray background, checkmark, XP earned badge
- Overdue: Soft red tint, "Overdue" label

**Interaction Details:**
- Swipe right → Complete (with haptic + XP animation)
- Swipe left → Reschedule options
- Long press → Quick actions menu
- Tap → Expand for details/subtasks

**Empty State (No tasks):**
```
┌─────────────────────────────────────────────┐
│                                             │
│      ┌───────────────────────────────┐     │
│      │    What's on your mind?       │     │
│      │                               │     │
│      │    [ Type or tap 🎤 to talk ] │     │
│      └───────────────────────────────┘     │
│                                             │
│      ─────── or try these ───────          │
│                                             │
│      📅 Import from calendar               │
│      🔄 Repeat yesterday                   │
│      ✨ AI suggests based on goals         │
│                                             │
└─────────────────────────────────────────────┘
```

#### 5. Coming Up Section (Collapsed)

```
┌─────────────────────────────────────────────┐
│ Coming Up                            ∨      │
│ Tomorrow: 2 tasks • This week: Meeting Thu  │
└─────────────────────────────────────────────┘
```

**Expanded:**
```
┌─────────────────────────────────────────────┐
│ Coming Up                            ∧      │
├─────────────────────────────────────────────┤
│ Tomorrow (Mon)                              │
│   ○ Team standup                    9:00am  │
│   ○ Review PR                       2:00pm  │
├─────────────────────────────────────────────┤
│ This Week                                   │
│   Thu  Meeting with client          2:00pm  │
│   Fri  Project deadline                     │
└─────────────────────────────────────────────┘
```

---

## 🎨 Visual Design Specifications

### Typography Scale

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Greeting | SF Pro | 16 | Regular | 20 |
| User Name | SF Pro | 28 | Bold | 34 |
| Section Header | SF Pro | 18 | Semibold | 24 |
| AI Message | SF Pro | 17 | Regular | 26 |
| Task Title | SF Pro | 16 | Medium | 22 |
| Task Meta | SF Pro | 13 | Regular | 18 |
| Button Primary | SF Pro | 16 | Semibold | 20 |
| Button Secondary | SF Pro | 14 | Medium | 18 |
| Stats Value | SF Pro Rounded | 24 | Bold | 28 |
| Stats Label | SF Pro | 11 | Medium | 14 |

### Color System

```
AI Card Gradients:
─────────────────
EMPTY:    ['#9333EA', '#EC4899']  // Purple → Pink
PLANNED:  ['#3B82F6', '#8B5CF6']  // Blue → Purple  
ACTIVE:   ['#0D9488', '#3B82F6']  // Teal → Blue
DONE:     ['#10B981', '#0D9488']  // Green → Teal
OVERDUE:  ['#F59E0B', '#EA580C']  // Amber → Orange

Semantic Colors:
────────────────
primary:     #8B5CF6  // Actions, highlights
success:     #10B981  // Complete, positive
warning:     #F59E0B  // Attention needed
destructive: #EF4444  // Delete, errors

Neutral Palette:
────────────────
background:  #F8FAFC  // Main background
card:        #FFFFFF  // Card surfaces
border:      #E2E8F0  // Subtle borders
textPrimary: #0F172A  // Main text
textSecondary: #64748B // Supporting text
textMuted:   #94A3B8  // Disabled, hints
```

### Spacing System (8pt Grid)

```
xs:   4px   // Tight internal spacing
sm:   8px   // Default internal spacing  
md:   16px  // Section padding
lg:   24px  // Between major sections
xl:   32px  // Major vertical breaks
xxl:  48px  // Hero spacing
```

### Border Radius

```
sm:   8px   // Buttons, inputs
md:   12px  // Cards, task items
lg:   16px  // Sections
xl:   24px  // AI Card, modals
full: 9999px // Pills, avatars
```

### Shadows

```
sm: 0 1px 2px rgba(0,0,0,0.05)           // Subtle depth
md: 0 4px 6px -1px rgba(0,0,0,0.1)       // Cards
lg: 0 10px 15px -3px rgba(0,0,0,0.1)     // Elevated elements
xl: 0 20px 25px -5px rgba(0,0,0,0.1)     // Modals, AI Card

// Colored glows for AI Card
purpleGlow: 0 0 60px rgba(139,92,246,0.3)
greenGlow:  0 0 60px rgba(16,185,129,0.3)
```

---

## ✨ Micro-Interactions & Animations

### AI Orb Animations

```typescript
// Idle State - Gentle breathing
const idlePulse = {
  scale: [1, 1.05, 1],
  duration: 3000,
  easing: 'easeInOut',
  loop: true,
};

// Listening State - Active pulse
const listeningPulse = {
  scale: [1, 1.15, 1],
  duration: 800,
  easing: 'easeInOut',
  loop: true,
};

// Celebration - Burst then settle
const celebrationBurst = {
  scale: [1, 1.3, 1.1],
  opacity: [1, 0.8, 1],
  duration: 600,
  easing: 'spring',
};

// Ripple rings when active
const rippleRing = {
  scale: [1, 2.5],
  opacity: [0.4, 0],
  duration: 2000,
  loop: true,
  stagger: 666, // 3 rings, 666ms apart
};
```

### Task Completion Animation

```typescript
// When user completes a task
const taskComplete = {
  // 1. Checkbox fills with spring
  checkbox: {
    scale: [1, 1.2, 1],
    duration: 300,
    easing: 'spring',
  },
  
  // 2. XP flies up to stats bar
  xpAnimation: {
    from: taskPosition,
    to: xpCounterPosition,
    duration: 600,
    easing: 'easeOut',
  },
  
  // 3. XP counter increments
  xpCounter: {
    scale: [1, 1.1, 1],
    duration: 200,
  },
  
  // 4. Task fades slightly
  taskCard: {
    opacity: [1, 0.7],
    backgroundColor: ['#FFF', '#F1F5F9'],
    duration: 300,
  },
};
```

### Stats Counter Animation

```typescript
// XP earned animation (slot machine effect)
const xpIncrement = (from: number, to: number) => ({
  value: from,
  toValue: to,
  duration: 800,
  easing: 'easeOut',
  // Shows intermediate values like 940 → 941 → 942... → 965
});
```

### Page Transitions

```typescript
// Stats cards on scroll
const statsParallax = {
  // Cards have subtle vertical parallax on scroll
  translateY: scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
  }),
  opacity: scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.9, 0.8],
  }),
};
```

---

## 🗣️ AI Message Content

### Message Templates by State

#### EMPTY State
**Morning (6am-12pm):**
- "Good morning! Your day is a blank canvas. What's the one thing that would make today a win?"
- "Rise and shine! I've noticed you're most productive before 11am. Want to tackle something meaningful?"
- "Morning! No tasks yet—want me to suggest some based on your goals?"

**Afternoon (12pm-5pm):**
- "Afternoon's here and it's wide open. What would move the needle today?"
- "You've got the afternoon free. Last week you crushed it on days like this. Ready to plan?"
- "Hey! Quick check-in—anything on your mind you want to capture?"

**Evening (5pm-10pm):**
- "Winding down the day. Want to set up tomorrow for success?"
- "Evening! Some people do their best planning now. Want to prep for tomorrow?"
- "Quiet evening ahead. Perfect time to brain dump or plan the week."

#### PLANNED State
- "Locked and loaded. {count} tasks ready to go. Which one first?"
- "You've got {count} tasks lined up. Your peak focus time is coming up—let's make it count."
- "Plan's set! The most important one looks like '{topTask}'. Ready when you are."

#### ACTIVE State (In Progress)
- "You're rolling! {completed}/{total} done. Keep that momentum going."
- "Nice progress! {remaining} more to go. You've got this."
- "{completed} down, {remaining} to go. You're ahead of last week's pace!"

#### DONE State
- "All done! You earned {xp} XP today. Want to get ahead on tomorrow?"
- "Crushed it! {count} tasks complete. Tomorrow you've got a meeting at 2pm—want to prep?"
- "✨ Clean sweep! Your streak is now {streak} days. See you tomorrow?"

#### OVERDUE State
- "I noticed some tasks from yesterday. No worries—want to reschedule or clear them out?"
- "Life happens! You've got {count} overdue. Let's do a quick reset together."
- "Some tasks carried over. Sometimes the best move is a fresh start. Reset for today?"

### Dynamic Personalization Variables

```typescript
interface AIMessageContext {
  userName: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  taskCount: number;
  completedCount: number;
  streakDays: number;
  xpToday: number;
  peakProductivityHour: number;
  lastActivePattern: string;
  upcomingCalendarEvent?: string;
  yesterdayPerformance: 'better' | 'same' | 'worse';
}
```

---

## 🔌 Data Requirements

### Hub API Calls (On Load)

```typescript
// Parallel fetch on Hub mount
const [
  userData,
  todaysTasks,
  tomorrowsTasks,
  weeklyOverview,
  activeCircleUpdates,
  aiBriefing,
] = await Promise.all([
  userApi.getProfile(),           // XP, level, streak
  tasksApi.getByDate(today),      // Today's tasks
  tasksApi.getByDate(tomorrow),   // Coming up preview
  analyticsApi.getWeeklyOverview(), // This week summary
  circlesApi.getRecentActivity(), // Social updates
  aiApi.getDailyBriefing(),       // AI-generated message
]);
```

### Real-Time Updates (Socket Events)

```typescript
// Listen for these events
socket.on('task:completed', updateTaskList);
socket.on('task:created', updateTaskList);
socket.on('circle:newPost', updateSocialBadge);
socket.on('challenge:update', updateChallengeStatus);
socket.on('xp:earned', animateXPGain);
socket.on('level:up', showLevelUpCelebration);
socket.on('streak:extended', updateStreakCounter);
```

### Cached Data (AsyncStorage)

```typescript
// Cache for offline/fast load
const cachedHubData = {
  lastTasks: Task[],
  lastStats: UserStats,
  lastBriefing: string,
  lastUpdated: timestamp,
};

// Stale-while-revalidate pattern
// Show cached data immediately, fetch fresh in background
```

---

## 📱 Responsive Considerations

### Device Sizes

| Device | Width | AI Card Height | Tasks Visible |
|--------|-------|----------------|---------------|
| iPhone SE | 375 | 160pt | 2-3 |
| iPhone 14 | 390 | 180pt | 3-4 |
| iPhone 14 Pro Max | 430 | 200pt | 4-5 |
| iPad | 768+ | 220pt | 6+ |

### Dynamic Adjustments

```typescript
const hubLayout = {
  aiCardHeight: Math.min(180, screenHeight * 0.22),
  taskListMaxHeight: screenHeight * 0.4,
  statsStripHeight: isSmallDevice ? 56 : 64,
};
```

---

## ♿ Accessibility

### VoiceOver Annotations

```typescript
// AI Card
accessible={true}
accessibilityRole="summary"
accessibilityLabel={`AI Assistant says: ${aiMessage}. ${primaryAction} button available.`}

// Task Item
accessibilityRole="checkbox"
accessibilityState={{ checked: task.completed }}
accessibilityLabel={`${task.title}, ${task.priority} priority, ${task.duration} minutes`}
accessibilityHint="Double tap to mark complete, swipe right to complete, swipe left to reschedule"

// Stats
accessibilityLabel={`${xp} experience points earned today. ${completed} of ${total} tasks completed. ${streak} day streak.`}
```

### Reduced Motion

```typescript
const prefersReducedMotion = useReducedMotion();

// Disable animations for users who prefer reduced motion
const orbAnimation = prefersReducedMotion 
  ? { scale: 1 }  // Static
  : pulseAnimation; // Animated
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Refactor Hub layout to fixed structure
- [ ] Implement new stats strip component
- [ ] Create consistent AI Card component (no state-based layout changes)
- [ ] Add "Coming Up" section

### Phase 2: AI Integration (Week 2)
- [ ] Implement AI message service with context
- [ ] Add dynamic message templates
- [ ] Connect calendar for context
- [ ] Add yesterday/pattern awareness

### Phase 3: Polish (Week 3)
- [ ] Implement all micro-animations
- [ ] Add haptic feedback
- [ ] Optimize real-time updates
- [ ] Add offline support with cache

### Phase 4: Premium Details (Week 4)
- [ ] Orb depth and glow effects
- [ ] XP flying animation
- [ ] Stats parallax on scroll
- [ ] Typewriter effect for AI messages
- [ ] Accessibility audit

---

## 📊 Success Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Time to First Task | Unknown | < 10s | Analytics: Hub load → First task tap |
| Daily Task Creation | Unknown | +30% | Tasks created per DAU |
| AI Briefing Engagement | Unknown | > 60% | Taps on AI Card CTA |
| Session Depth | Unknown | +25% | Screens visited per session |
| Streak Retention | Unknown | +40% | 7-day retention of streak users |

---

## 🎯 Quick Actions Redesign

Replace current Quick Actions with context-aware actions:

### When EMPTY:
```
[ 🎤 Talk to AI ]  [ ✏️ Quick Add ]  [ 📅 Calendar ]
```

### When HAS TASKS:
```
[ ▶️ Focus Mode ]  [ ✏️ Add Task ]  [ 📊 Progress ]
```

### When DONE:
```
[ 📅 Plan Tomorrow ]  [ 📊 Summary ]  [ 🎯 Challenges ]
```

---

## 🔮 Future Enhancements

### v2.1 - Smart Suggestions
- AI proactively suggests tasks based on:
  - Calendar gaps
  - Historical patterns
  - Goal progress
  - Circle activity

### v2.2 - Widget Support
- iOS Home Screen widget showing:
  - Next task
  - Progress ring
  - Quick add button

### v2.3 - Watch Companion
- Apple Watch app with:
  - Today's tasks
  - Quick complete
  - Voice capture

---

## 📝 Summary

The Hub transforms from a **dashboard** to a **command center** by:

1. **Making AI the voice** - Every state has AI speaking, not static copy
2. **Keeping structure stable** - Same layout, different content
3. **Adding premium polish** - Animations, haptics, micro-interactions
4. **Being proactive** - Don't wait for user action, guide them
5. **Staying connected** - Real-time updates, social awareness

The goal: When users open MYPA, they feel like they have a **personal productivity partner** waiting for them, not just another app with checkboxes.

---

*Last Updated: February 2026*
*Design Lead: AI-Assisted*
*Version: 2.0*
