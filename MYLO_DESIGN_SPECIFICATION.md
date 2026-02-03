# Mylo Design Specification
## Pixel-Perfect UI Specification Document

> Every measurement, color, and component defined precisely.
> Copy these specs directly into Figma or code.

---

## Related Documentation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [MYLO_ARCHITECTURE_PLAN.md](./MYLO_ARCHITECTURE_PLAN.md) | Technical architecture, user flows, AI functions, navigation | Understanding feature logic and AI integration |
| **This File (Design)** | Pixel-perfect UI specs, colors, typography, component states, visual feedback | Implementing visual design |
| [MYLO_FULL_IMPLEMENTATION_GUIDE.md](./MYLO_FULL_IMPLEMENTATION_GUIDE.md) | Step-by-step implementation, code examples, API details | Building features phase by phase |

---

## Table of Contents

1. [Color Specification](#section-1-color-specification)
2. [Typography Specification](#section-2-typography-specification)
3. [Spacing Specification](#section-3-spacing-specification)
4. [Border Radius Specification](#section-4-border-radius-specification)
5. [Shadow Specification](#section-5-shadow-specification)
6. [Component Specifications](#section-6-component-specifications)
7. [Screen Designs (Detailed)](#section-7-screen-designs-detailed)
8. [Iconography](#section-8-iconography)
9. [Animation Specifications](#section-9-animation-specifications)
10. [Design Tokens Export](#section-10-design-tokens-export)
11. [Gesture Navigation & Interaction](#section-11-gesture-navigation--interaction-specifications)
12. [Figma Setup Prompts](#section-12-figma-setup-prompts)
13. [NEW: Dual Input UI](#section-13-dual-input-ui)
14. [NEW: Calendar & Recurring Tasks](#section-14-calendar--recurring-tasks)
15. [NEW: iOS Widgets](#section-15-ios-widgets)
16. [NEW: Onboarding Flow](#section-16-onboarding-flow)
17. [NEW: Quick Capture](#section-17-quick-capture)
18. [NEW: Daily Brief & Notifications](#section-18-daily-brief--notifications)
19. [NEW: Celebration System](#section-19-celebration-system)
20. [**USER INTERACTION FLOWS**](#section-20-user-interaction-flows)
21. [**COMPONENT STATES & BEHAVIORS**](#section-21-component-states--behaviors)
22. [**AI VISUAL FEEDBACK**](#section-22-ai-visual-feedback)

---

# SECTION 20: USER INTERACTION FLOWS

> **This section details exactly what the user sees and experiences during every interaction, with pixel-perfect visual specifications.**

## 20.1 App Launch Flow

### Visual Sequence
```
┌─────────────────────────────────────┐
│           SPLASH SCREEN             │
│                                     │
│            ┌───────┐               │
│            │       │               │  Mylo logo: 80px, centered
│            │ MYLO  │               │  Background: #000000
│            │       │               │  Duration: 0.5s
│            └───────┘               │
│                                     │
└─────────────────────────────────────┘
                 │
                 │ Fade transition (0.3s)
                 ▼
┌─────────────────────────────────────┐
│           AI HOME LOADS             │
│                                     │
│ 1. Background fades to #000000      │
│ 2. Orb scales from 0.5 → 1.0        │
│    (spring animation, 0.4s)         │
│ 3. Greeting text fades in (0.3s)    │
│ 4. Stats cards slide up (0.3s)      │
│ 5. Orb begins idle pulse            │
│                                     │
└─────────────────────────────────────┘
```

### Timing
- Splash display: 500ms minimum
- Logo fade out: 300ms ease-out
- Screen fade in: 300ms ease-in
- Elements stagger: 100ms between each
- Total perceived load: < 1.5s

## 20.2 Tap Orb → Voice Input Flow

### Step-by-Step Visual States

**Step 1: User Touches Orb**
```
┌─────────────────────────────────────┐
│ Visual Change:                      │
│ - Orb scales to 0.95 (50ms)         │
│ - Glow intensifies 20%              │
│ - Haptic: Medium impact             │
│                                     │
│ Orb State: "pressed"                │
│ Color: Same gradient                │
│ Scale: 0.95                         │
└─────────────────────────────────────┘
```

**Step 2: User Releases → Listening Begins**
```
┌─────────────────────────────────────┐
│ Visual Change:                      │
│ - Orb scales to 1.1 (200ms spring)  │
│ - Inner ring appears (voice wave)   │
│ - Glow pulses rhythmically          │
│ - "Listening..." text appears below │
│                                     │
│ Orb State: "listening"              │
│ Inner Animation: Voice wave rings   │
│ Glow: Pulsing at 1Hz                │
│ Text: "Listening..." in body,       │
│       text-secondary, centered      │
└─────────────────────────────────────┘
```

**Step 3: User Speaks → Real-time Transcription**
```
┌─────────────────────────────────────┐
│ Visual Change:                      │
│ - Voice waves react to volume       │
│ - Transcription text appears        │
│ - Text types character by character │
│                                     │
│ Transcription Area:                 │
│ Position: Below orb, 24px margin    │
│ Width: 280px max, centered          │
│ Text: body-medium, text-primary     │
│ Background: #161616, radius-lg      │
│ Padding: 16px                       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ "Add task buy gro|"             │ │ Cursor blinks
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Step 4: User Stops → Processing**
```
┌─────────────────────────────────────┐
│ Visual Change:                      │
│ - Voice waves collapse to center    │
│ - Orb shows loading spinner inside  │
│ - "Thinking..." replaces text       │
│                                     │
│ Orb State: "processing"             │
│ Animation: Circular spinner (1.5s)  │
│ Spinner: 40px, #A78BFA, 2px stroke  │
│ Text: "Thinking..." in footnote,    │
│       text-tertiary                 │
└─────────────────────────────────────┘
```

**Step 5: AI Responds**
```
┌─────────────────────────────────────┐
│ Visual Change:                      │
│ - Spinner fades out                 │
│ - Orb pulses once (success)         │
│ - Response text streams in          │
│ - TTS audio plays                   │
│ - Haptic: Light impact              │
│                                     │
│ Orb State: "speaking"               │
│ Glow: Steady, brighter (40%)        │
│                                     │
│ Response Bubble:                    │
│ Background: #161616                 │
│ Border-left: 3px #7C3AED            │
│ Text: body, text-primary            │
│ Streams word by word (50ms/word)    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ┃ "Added 'buy groceries' to     │ │
│ │ ┃ your tasks for today."        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Action Confirmation (if task added):│
│ ┌─────────────────────────────────┐ │
│ │ ✓ buy groceries         +10 XP  │ │ Success toast, slides up
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Step 6: Return to Idle**
```
┌─────────────────────────────────────┐
│ After 3 seconds of no interaction:  │
│ - Response bubble fades (0.5s)      │
│ - Orb returns to idle state         │
│ - Greeting updates if relevant      │
│                                     │
│ Orb State: "idle"                   │
│ Animation: Gentle breathing pulse   │
└─────────────────────────────────────┘
```

## 20.3 Swipe Navigation Flow

### Swipe LEFT (AI Home → Tasks)

**Phase 1: Touch Down**
```
Position: User touches anywhere on screen
Response: None (waiting for movement)
```

**Phase 2: Dragging**
```
┌─────────────────────────────────────┐
│ As finger moves LEFT:               │
│                                     │
│ - AI Home content translates LEFT   │
│   (follows finger 1:1)              │
│ - Tasks View peeks from right edge  │
│ - Tasks View: 20% visible initially │
│ - Parallax: AI Home moves faster    │
│   than Tasks (1.2:1 ratio)          │
│                                     │
│ Edge Peek Visual:                   │
│ ┌───────────────────────┬──────────┐
│ │                       │  Tasks   │
│ │      AI HOME          │  Preview │
│ │     (translating)     │  (peek)  │
│ │                       │          │
│ └───────────────────────┴──────────┘
│                                     │
│ At 50px drag: Light haptic          │
│ At 100px drag: Threshold reached    │
│               Medium haptic         │
└─────────────────────────────────────┘
```

**Phase 3: Release (Past Threshold)**
```
┌─────────────────────────────────────┐
│ Spring animation to Tasks View      │
│                                     │
│ Config:                             │
│ - damping: 20                       │
│ - mass: 0.8                         │
│ - stiffness: 150                    │
│ - Duration: ~300ms                  │
│                                     │
│ AI Home: Slides fully off-left      │
│ Tasks: Springs to full position     │
│                                     │
│ Post-animation:                     │
│ - Mini orb fades in (top-right)     │
│ - Task list loads/refreshes         │
│ - Filter tabs become interactive    │
└─────────────────────────────────────┘
```

**Phase 3B: Release (Before Threshold)**
```
┌─────────────────────────────────────┐
│ Snap back animation                 │
│                                     │
│ AI Home: Springs back to center     │
│ Tasks peek: Disappears              │
│ Haptic: None (gesture cancelled)    │
└─────────────────────────────────────┘
```

## 20.4 Task Creation Flow

### Entry Points (Visual Differences)

**Via FAB Button:**
```
1. User taps FAB (+) in bottom-right
2. FAB scales to 0.9 (50ms)
3. Haptic: Light impact
4. Modal slides up from bottom (300ms)
5. Title input auto-focused
6. Keyboard rises
```

**Via Voice ("Add task..."):**
```
1. AI parses command
2. Task creation modal slides up
3. Fields pre-filled by AI:
   - Title: From voice command
   - Category: AI-detected (chip shown)
   - Duration: AI-estimated (chip shown)
   - Priority: AI-suggested (highlighted)
4. User can modify or tap "Add Task"
```

### Task Creation Modal Layout
```
┌─────────────────────────────────────┐
│ ────────── (drag handle)            │ 36×4px, #3F3F46, centered
│                                     │
│ New Task                       ✕    │ title-2, close button 44px
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ What do you need to do?         │ │ Input: height 56px
│ └─────────────────────────────────┘ │
│                                     │
│ AI Suggestions (appear as typing):  │
│ ┌─────────────────────────────────┐ │
│ │ 🏷️ Work  ⏱️ ~25 min  🔥 Medium │ │ Chips row
│ └─────────────────────────────────┘ │
│                                     │
│ Schedule                            │ subhead, text-secondary
│ ┌────────────┐  ┌────────────┐     │
│ │ 📅 Today   │  │ 🕐 2:00 PM │     │ Picker buttons
│ └────────────┘  └────────────┘     │
│                                     │
│ Priority                            │
│ ┌────────┐ ┌────────┐ ┌────────┐   │
│ │  LOW   │ │ MEDIUM │ │  HIGH  │   │ AI highlights suggested
│ └────────┘ └────────┘ └────────┘   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │          Add Task               │ │ Primary button, full width
│ └─────────────────────────────────┘ │
│                                     │
│ (safe area)                         │
└─────────────────────────────────────┘
```

### AI Suggestion Chips Behavior
```
As User Types "gym workout tomorrow":

1. "gym" detected → Health category chip appears
2. "workout" → Duration updates to ~45 min
3. "tomorrow" → Date picker updates to tomorrow
4. Chips animate in with spring (scale 0→1)
5. Each chip: #1C1C1E bg, radius-sm, padding 6px 12px
6. Icon: 16px, left of text
7. Text: caption-1, text-secondary
```

## 20.5 Task Completion Flow

### Tap Checkbox Method
```
┌─────────────────────────────────────┐
│ Before:                             │
│ ┌─────────────────────────────────┐ │
│ │ ○  Buy groceries         ~15min │ │ Checkbox: 24px, border #52525B
│ │    Personal · Today             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ User taps checkbox:                 │
│ 1. Haptic: Success notification     │
│ 2. Checkbox fills green (0→100%)    │
│    Animation: 200ms ease-out        │
│ 3. Checkmark draws in (SVG anim)    │
│ 4. Task title strikes through       │
│    Color: text-secondary → tertiary │
│ 5. Row fades to 60% opacity         │
│ 6. XP toast slides up from bottom   │
│                                     │
│ After:                              │
│ ┌─────────────────────────────────┐ │
│ │ ✓  Buy groceries         ~15min │ │ Green fill: #22C55E
│ │    Personal · Today             │ │ Strikethrough on title
│ └─────────────────────────────────┘ │
│                                     │
│ XP Toast (appears for 2s):          │
│ ┌─────────────────────────────────┐ │
│ │ ✓ Task completed!       +10 XP  │ │ #161616 bg, success border
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Swipe Right to Complete
```
┌─────────────────────────────────────┐
│ User swipes task row RIGHT:         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✓ │○  Buy groceries      ~15min │ │ Green action reveals
│ │   │   Personal · Today          │ │ from left edge
│ └───┴─────────────────────────────┘ │
│                                     │
│ Action area:                        │
│ - Background: #22C55E (success)     │
│ - Icon: Checkmark, 24px, white      │
│ - Reveals as user drags (max 80px)  │
│                                     │
│ If released past 60px:              │
│ - Row collapses to 0 height (200ms) │
│ - Same completion animation plays   │
│ - Haptic: Success                   │
│                                     │
│ If released before 60px:            │
│ - Row springs back                  │
│ - Action hides                      │
└─────────────────────────────────────┘
```

## 20.6 Focus Session Flow

### Starting Focus
```
┌─────────────────────────────────────┐
│ Trigger: Tap "Focus" or swipe up    │
│                                     │
│ Animation sequence:                 │
│ 1. Bottom sheet rises (300ms)       │
│    - From: translateY(100%)         │
│    - To: translateY(0)              │
│    - Spring config: medium          │
│                                     │
│ 2. Backdrop fades in                │
│    - From: opacity 0                │
│    - To: opacity 0.6                │
│    - Background: #000000            │
│                                     │
│ 3. Sheet content fades in (stagger) │
│    - Timer: 0ms delay               │
│    - Orb: 100ms delay               │
│    - Message: 200ms delay           │
│    - Buttons: 300ms delay           │
│                                     │
│ 4. Timer begins countdown           │
│    - 25:00 default (or last used)   │
│    - Digits: SF Mono, 48px bold     │
└─────────────────────────────────────┘
```

### Timer Display States
```
┌─────────────────────────────────────┐
│ Running:                            │
│   25:00 → 24:59 → ...               │
│   Color: text-primary               │
│   Colon blinks every second         │
│                                     │
│ Under 5 minutes:                    │
│   04:32                             │
│   Color: #EAB308 (warning)          │
│   Subtle pulse animation            │
│                                     │
│ Under 1 minute:                     │
│   00:45                             │
│   Color: #22C55E (success)          │
│   Numbers scale up slightly (1.05)  │
│                                     │
│ Completed:                          │
│   00:00                             │
│   Color: #22C55E                    │
│   Celebration animation triggers    │
└─────────────────────────────────────┘
```

### Focus Completion Celebration
```
┌─────────────────────────────────────┐
│ When timer reaches 00:00:           │
│                                     │
│ 1. Haptic: Success (strong)         │
│                                     │
│ 2. Orb celebration animation:       │
│    - Scale: 1.0 → 1.3 → 1.0 (bounce)│
│    - Glow: 40% → 80% → 40%          │
│    - Particles emit from center     │
│                                     │
│ 3. XP counter animates:             │
│    ┌───────────────────────────────┐│
│    │        ✨ +25 XP ✨           ││ Scales up from 0
│    └───────────────────────────────┘│
│                                     │
│ 4. AI message updates:              │
│    "Amazing! 25 minutes of focus.   │
│     That's your 5th session today!" │
│                                     │
│ 5. Auto-dismiss after 3 seconds     │
│    OR tap anywhere to dismiss       │
└─────────────────────────────────────┘
```

---

# SECTION 21: COMPONENT STATES & BEHAVIORS

## 21.1 AI Orb States

| State | Visual | Animation | Trigger |
|-------|--------|-----------|---------|
| **Idle** | Purple gradient, soft glow | Gentle breathing (scale 1.0↔1.02, 3s loop) | Default state |
| **Pressed** | Same gradient, reduced glow | Scale 0.95, 50ms | Touch down on orb |
| **Listening** | Brighter glow, inner voice rings | Rings pulse with audio input, 1Hz base | After tap release |
| **Processing** | Circular spinner inside | Spinner rotates (1.5s loop) | After voice input ends |
| **Speaking** | Steady bright glow | None (stable) | AI response playing |
| **Success** | Green tint overlay | Single pulse (scale 1.0→1.1→1.0) | Action completed |
| **Error** | Red tint briefly | Shake (translateX -5→5→0) | Error occurred |
| **Focused** | Dimmed, smaller (120px) | Slow breathing (5s loop) | During focus session |

## 21.2 Button States

### Primary Button
| State | Background | Shadow | Scale | Text |
|-------|------------|--------|-------|------|
| Default | Gradient (#7C3AED→#9333EA) | Purple glow | 1.0 | #FFFFFF |
| Pressed | Same | Reduced glow | 0.97 | #FFFFFF |
| Disabled | #3F3F46 | None | 1.0 | #71717A |
| Loading | Same | Same | 1.0 | Spinner (white, 20px) |

### Secondary Button
| State | Background | Border | Scale | Text |
|-------|------------|--------|-------|------|
| Default | #1C1C1E | 1px #3F3F46 | 1.0 | #FFFFFF |
| Pressed | #2C2C2E | 1px #52525B | 0.98 | #FFFFFF |
| Disabled | #1C1C1E | 1px #2C2C2E | 1.0 | #52525B |

## 21.3 Task Card States

| State | Background | Left Border | Checkbox | Title | Opacity |
|-------|------------|-------------|----------|-------|---------|
| Default | #161616 | None | Empty, #52525B | Normal | 100% |
| AI Suggested | #161616 | 3px #7C3AED | Empty, #52525B | Normal | 100% |
| Pressed | #1C1C1E | Same | Same | Same | 100% |
| Completed | #161616 | None | Filled #22C55E | Strikethrough | 60% |
| Overdue | #161616 | 3px #EF4444 | Empty, #EF4444 | Normal | 100% |
| Swiping Right | Slides right | Green action reveals | Same | Same | 100% |
| Swiping Left | Slides left | Red action reveals | Same | Same | 100% |

## 21.4 Input Field States

| State | Background | Border | Placeholder | Text |
|-------|------------|--------|-------------|------|
| Default | #161616 | 1px #3F3F46 | #52525B | - |
| Focused | #161616 | 2px #7C3AED + glow | Hidden | #FFFFFF |
| Filled | #161616 | 1px #3F3F46 | Hidden | #FFFFFF |
| Error | #161616 | 2px #EF4444 | Hidden | #FFFFFF |
| Disabled | #0D0D0D | 1px #2C2C2E | #3F3F46 | #52525B |

## 21.5 Filter Tab States

| State | Background | Text | Scale |
|-------|------------|------|-------|
| Inactive | Transparent | #71717A | 1.0 |
| Active | #7C3AED | #FFFFFF | 1.0 |
| Pressed (inactive) | #7C3AED20 | #71717A | 0.98 |

---

# SECTION 22: AI VISUAL FEEDBACK

> **This section defines how AI interactions are visualized to the user.**

## 22.1 AI Message Displays

### Greeting (AI Home)
```
Position: 32px below safe area, centered
Style: title-1, text-primary
Animation: Fade in (0.3s) on load
Update: Smooth crossfade when greeting changes

Examples:
- "Good morning, Alex" (5am-12pm)
- "Good afternoon, Alex" (12pm-5pm)
- "Hey Alex, burning the midnight oil?" (9pm-5am)
```

### Contextual Message (Below Orb)
```
Position: 24px below orb, centered
Style: body, text-secondary
Max Width: 280px (wrap if longer)
Animation: Types in word by word (50ms/word) after greeting

Examples:
- "How can I help you today?"
- "You have 5 tasks. Want to focus?"
- "Great progress this week!"
```

### Response Bubble (After Voice Command)
```
┌─────────────────────────────────────┐
│ Position: Below orb, centered       │
│ Width: 280px max                    │
│ Background: #161616                 │
│ Border-left: 3px #7C3AED            │
│ Border-radius: 12px                 │
│ Padding: 16px                       │
│ Text: body, text-primary            │
│                                     │
│ Animation:                          │
│ - Slides up from 20px below (200ms) │
│ - Fades in (200ms)                  │
│ - Text streams word by word         │
│ - Auto-dismisses after 5s           │
└─────────────────────────────────────┘
```

## 22.2 AI Action Confirmations

### Task Added Toast
```
┌─────────────────────────────────────┐
│ ✓ Added "buy groceries"    +10 XP   │
└─────────────────────────────────────┘
Position: Bottom, 100px from safe area
Background: #161616
Border: 1px #22C55E (left only, 3px)
Icon: Checkmark, 20px, #22C55E
Text: body-medium, text-primary
XP: caption-1, #22C55E
Animation: Slide up (200ms), hold 2s, fade out (300ms)
```

### Task Completed Toast
```
┌─────────────────────────────────────┐
│ ✓ Task completed!          +10 XP   │
└─────────────────────────────────────┘
Same styling as above
```

### Focus Started Toast
```
┌─────────────────────────────────────┐
│ ⏱️ Focus session started    25:00   │
└─────────────────────────────────────┘
Border: 1px #7C3AED (left)
Icon: Timer, 20px, #7C3AED
```

## 22.3 AI Insight Cards

### Unlocked Insight Display
```
┌─────────────────────────────────────┐
│ Peak Hours                    🔓    │ title-3, text-primary
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  █████████░░░░░░░░░░░░         │ │ Visual: Bar chart
│ │  9am     12pm    3pm    6pm    │ │ Peak hours highlighted
│ └─────────────────────────────────┘ │
│                                     │
│ "You're most productive between     │ body, text-secondary
│  9-11am. I'll suggest important     │
│  tasks during this window."         │
│                                     │
└─────────────────────────────────────┘
Background: #161616
Border-radius: 14px
Padding: 20px
Lock icon: 16px, #22C55E (unlocked)
```

### Locked Insight Display
```
┌─────────────────────────────────────┐
│ 🔒 Peak Hours                       │ title-3, text-tertiary
├─────────────────────────────────────┤
│                                     │
│ "I'm still learning when you work   │ body, text-tertiary
│  best. Use Mylo for 4 more days     │
│  to unlock this insight."           │
│                                     │
│ Progress:                           │
│ ████████░░░░░░░░ 3/7 days          │ Progress bar: #7C3AED fill
│                                     │
│ — OR —                              │ footnote, text-disabled
│                                     │
│ ██████████████░░ 8/10 tasks        │ Alternative progress
│                                     │
└─────────────────────────────────────┘
Background: #0D0D0D (darker, indicating locked)
Border: 1px dashed #3F3F46
```

## 22.4 AI Suggestion Highlights

### Time Picker with AI Suggestion
```
When AI suggests optimal time (peak hours):

┌─────────────────────────────────────┐
│ Select Time                         │
├─────────────────────────────────────┤
│  8:00 AM                            │ Normal: text-secondary
│  9:00 AM  ⚡ Peak hour              │ Highlighted: #7C3AED bg tint
│ 10:00 AM  ⚡ Peak hour              │ "⚡ Peak hour" badge
│ 11:00 AM  ⚡ Peak hour              │
│ 12:00 PM                            │
│  1:00 PM                            │
└─────────────────────────────────────┘

Highlight: Background rgba(124,58,237,0.15)
Badge: caption-2, #A78BFA, left of time
```

### Priority with AI Suggestion
```
When AI suggests priority:

┌────────┐ ┌────────┐ ┌────────┐
│  LOW   │ │ MEDIUM │ │  HIGH  │  ← AI suggests
└────────┘ └────────┘ └────────┘
                          │
                          └─ Pulsing border: 2px #7C3AED
                             Subtle glow animation
                             "AI suggests" label below
```

## 22.5 AI Encouragement in Focus

### Message Rotation
```
During focus session, AI shows encouragement:

Position: Below orb (24px)
Style: body, text-secondary
Max width: 280px, centered

Rotation timing:
- Initial: Shown immediately
- Every 5 minutes: Crossfade to new message

Messages (examples):
- "Stay focused, you're doing great."
- "Deep work mode activated."
- "15 minutes down, keep going!"
- "Almost there, finish strong!"
- "You're in the zone."

Animation: Crossfade (0.5s) between messages
```

### Milestone Announcements
```
At specific times during focus:

5 minutes in:
  "5 minutes of focus! 💪"
  (Toast appears briefly)

Halfway (12:30 remaining):
  "Halfway there!"
  Orb pulses once

2 minutes left:
  "Final stretch!"
  Timer color changes to success green

Completion:
  "You did it! 25 minutes of focus."
  Full celebration animation
```

---

# SECTION 1: COLOR SPECIFICATION

## 1.1 Background Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| `bg-black` | `#000000` | 0, 0, 0 | Main app background, always |
| `bg-surface-1` | `#0D0D0D` | 13, 13, 13 | Slightly elevated areas, headers |
| `bg-surface-2` | `#161616` | 22, 22, 22 | Cards, list items, modals |
| `bg-surface-3` | `#1C1C1E` | 28, 28, 30 | Interactive elements, inputs, pressed states |
| `bg-surface-4` | `#2C2C2E` | 44, 44, 46 | Hover states, selected items |

## 1.2 Brand Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| `brand-primary` | `#7C3AED` | 124, 58, 237 | Primary buttons, orb core, key accents |
| `brand-secondary` | `#A78BFA` | 167, 139, 250 | Secondary accents, links, highlights |
| `brand-tertiary` | `#C4B5FD` | 196, 181, 253 | Subtle accents, icon tints |
| `brand-muted` | `#4C1D95` | 76, 29, 149 | Dark purple for backgrounds, borders |

## 1.3 Text Colors

| Name | Hex | Opacity | Usage |
|------|-----|---------|-------|
| `text-primary` | `#FFFFFF` | 100% | Headings, important text, titles |
| `text-secondary` | `#A1A1AA` | 100% | Body text, descriptions |
| `text-tertiary` | `#71717A` | 100% | Hints, placeholders, timestamps |
| `text-disabled` | `#52525B` | 100% | Disabled text |
| `text-inverse` | `#000000` | 100% | Text on light backgrounds |

## 1.4 Semantic Colors

| Name | Hex | Light Variant | Usage |
|------|-----|---------------|-------|
| `success` | `#22C55E` | `#22C55E1A` (10%) | Completed tasks, positive feedback |
| `warning` | `#EAB308` | `#EAB3081A` (10%) | Attention needed, due soon |
| `error` | `#EF4444` | `#EF44441A` (10%) | Errors, delete actions, overdue |
| `info` | `#3B82F6` | `#3B82F61A` (10%) | Information, tips |

## 1.5 Gradient Definitions

### Orb Gradient (Primary)
```css
background: conic-gradient(
  from 180deg at 50% 50%,
  #7C3AED 0deg,
  #A78BFA 120deg,
  #C4B5FD 180deg,
  #A78BFA 240deg,
  #7C3AED 360deg
);
```

### Button Gradient
```css
background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%);
```

### Card Highlight Gradient
```css
background: linear-gradient(
  180deg,
  rgba(124, 58, 237, 0.08) 0%,
  rgba(124, 58, 237, 0) 100%
);
```

### Orb Glow
```css
box-shadow: 
  0 0 60px rgba(124, 58, 237, 0.4),
  0 0 120px rgba(124, 58, 237, 0.2),
  0 0 180px rgba(124, 58, 237, 0.1);
```

---

# SECTION 2: TYPOGRAPHY SPECIFICATION

## 2.1 Font Family

```
Primary: SF Pro Display
Fallback: -apple-system, BlinkMacSystemFont, system-ui
Mono: SF Mono (for timers, numbers)
```

## 2.2 Type Scale (Exact)

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| `display-large` | 48px | 700 | 56px | -1.5px | Timer digits only |
| `display` | 34px | 700 | 40px | -0.5px | Screen titles (rare) |
| `title-1` | 28px | 700 | 34px | -0.3px | Section headers |
| `title-2` | 22px | 600 | 28px | -0.2px | Card titles, modal headers |
| `title-3` | 20px | 600 | 24px | -0.1px | Subsection headers |
| `headline` | 17px | 600 | 22px | -0.4px | Important labels, buttons |
| `body` | 17px | 400 | 24px | -0.4px | Main body text |
| `body-medium` | 17px | 500 | 24px | -0.4px | Emphasized body |
| `callout` | 16px | 400 | 21px | -0.3px | Secondary text |
| `subhead` | 15px | 400 | 20px | -0.2px | Metadata, subtitles |
| `footnote` | 13px | 400 | 18px | -0.1px | Timestamps, hints |
| `caption-1` | 12px | 500 | 16px | 0px | Labels, badges |
| `caption-2` | 11px | 400 | 13px | 0.1px | Tiny labels |

## 2.3 Typography by Screen Element

### AI Home Screen
```
Greeting "Good morning, Alex": title-1, text-primary
AI Message "How can I help?": body, text-secondary
Quick Action Button: headline, text-primary
Stats Card Number: title-2, text-primary
Stats Card Label: caption-1, text-tertiary
Swipe Hint: footnote, text-tertiary
```

### Tasks Screen
```
Screen Title "Tasks": title-1, text-primary
Filter Tab Active: headline, text-primary
Filter Tab Inactive: headline, text-tertiary
Section Header "MORNING": caption-1, text-tertiary, uppercase, letter-spacing 1px
Task Title: body-medium, text-primary
Task Time: subhead, text-tertiary
Task Category Tag: caption-1, text-secondary
AI Duration Estimate: caption-1, brand-secondary
```

### Focus Screen
```
Timer: display-large, text-primary, SF Mono
AI Encouragement: body, text-secondary
Task Label: subhead, text-tertiary
Button Label: headline, text-primary
Session Stats: footnote, text-tertiary
```

### Profile Screen
```
User Name: title-2, text-primary
Streak Badge: caption-1, brand-secondary
Stat Number: title-1, text-primary
Stat Label: caption-1, text-tertiary
Unlock Title: body-medium, text-primary
Unlock Status: subhead, text-secondary
Settings Item: body, text-primary
```

---

# SECTION 3: SPACING SPECIFICATION

## 3.1 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | None |
| `space-1` | 4px | Tight element spacing |
| `space-2` | 8px | Related element gaps |
| `space-3` | 12px | Component internal padding |
| `space-4` | 16px | Card padding, list item padding |
| `space-5` | 20px | Screen horizontal margin |
| `space-6` | 24px | Section gaps |
| `space-7` | 32px | Major section spacing |
| `space-8` | 40px | Screen top padding (below safe area) |
| `space-9` | 48px | Hero spacing |
| `space-10` | 64px | Large gaps |

## 3.2 Screen Layout

```
Safe Area Top: 59px (iPhone 15 Pro) / 47px (iPhone SE)
Safe Area Bottom: 34px (home indicator) / 0px (iPhone SE)

Screen Horizontal Padding: 20px
Screen Top Padding (below safe area): 16px
Screen Bottom Padding (above safe area): 24px

Content Max Width: 100% (no max on mobile)
```

## 3.3 Component Spacing

### Card Spacing
```
Card Margin (between cards): 12px
Card Padding: 16px
Card Inner Element Gap: 12px
Card Title to Content: 8px
```

### List Spacing
```
List Item Height (single line): 56px
List Item Height (two line): 72px
List Item Horizontal Padding: 16px
List Item Vertical Padding: 12px
List Separator Inset: 16px from left
List Section Header Margin Top: 24px
List Section Header Margin Bottom: 8px
```

### Button Spacing
```
Button Padding (large): 16px 32px
Button Padding (medium): 12px 24px
Button Padding (small): 8px 16px
Button Gap (between buttons): 12px
Button Icon Gap: 8px
```

---

# SECTION 4: BORDER RADIUS SPECIFICATION

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | 0px | Sharp corners |
| `radius-sm` | 6px | Small tags, badges |
| `radius-md` | 10px | Buttons, inputs |
| `radius-lg` | 14px | Cards, list items |
| `radius-xl` | 20px | Modals, large cards |
| `radius-2xl` | 28px | Bottom sheets |
| `radius-full` | 9999px | Pills, circular buttons, orb |

---

# SECTION 5: SHADOW SPECIFICATION

## 5.1 Elevation Shadows

```css
/* No shadow - flat design mostly */
shadow-none: none;

/* Subtle lift */
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);

/* Card elevation */
shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);

/* Modal elevation */
shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.5);

/* Floating elements */
shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.6);
```

## 5.2 Glow Shadows (for brand elements)

```css
/* Button glow */
glow-button: 0 4px 14px rgba(124, 58, 237, 0.4);

/* Orb glow - idle */
glow-orb-idle: 
  0 0 40px rgba(124, 58, 237, 0.3),
  0 0 80px rgba(124, 58, 237, 0.15);

/* Orb glow - active */
glow-orb-active:
  0 0 60px rgba(124, 58, 237, 0.5),
  0 0 120px rgba(124, 58, 237, 0.3),
  0 0 180px rgba(124, 58, 237, 0.15);

/* Success glow */
glow-success: 0 0 20px rgba(34, 197, 94, 0.4);
```

---

# SECTION 6: COMPONENT SPECIFICATIONS

## 6.1 AI Orb Component

### Large Orb (AI Home)
```
Diameter: 160px
Border Radius: 80px (full circle)

Structure (layers from outside to inside):
1. Outer Glow Layer: 200px diameter, blur 60px, brand-primary at 20% opacity
2. Middle Ring: 168px diameter, 2px border, brand-tertiary at 30% opacity
3. Main Orb: 160px diameter, conic gradient fill
4. Inner Core: 80px diameter, brand-primary solid, blur 20px
5. Highlight Spot: 24px diameter, white at 40%, positioned top-left

Animation (idle):
- Scale: 1.0 → 1.03 → 1.0
- Duration: 4000ms
- Easing: ease-in-out
- Loop: infinite

Animation (listening):
- Scale: 1.0 → 1.08 → 1.0
- Duration: 800ms
- Glow opacity: 0.3 → 0.6 → 0.3
- Sound waves: 3 rings expanding from center every 400ms
```

### Mini Orb (Other Screens)
```
Diameter: 44px
Border Radius: 22px

Structure:
1. Glow: 52px diameter, brand-primary at 15%
2. Main Circle: 44px diameter, gradient fill
3. Inner Highlight: 8px diameter, white at 30%

Touch Target: 44px × 44px minimum
Position: Top right, 20px from edges
```

### Orb Design Prompt (Figma/AI)
```
Create an AI orb component for a voice assistant app.

LARGE VERSION (160px):
- Outer glow: Soft purple haze extending 20px beyond orb
- Main body: Conic gradient rotating through purple spectrum
  Colors: #7C3AED → #A78BFA → #C4B5FD → #A78BFA → #7C3AED
- Inner core: Solid #7C3AED with 20px blur
- Top-left highlight: Small white dot (24px) at 40% opacity
- Subtle rotating animation implied

MINI VERSION (44px):
- Simplified: Just gradient fill with small glow
- Same color scheme, less detail

States to show:
1. Idle: Calm, gentle glow
2. Listening: Brighter glow, implied pulsing
3. Processing: Gradient appears to rotate faster
4. Speaking: Rhythmic pulse visualization

Background: Pure black #000000
Style: Magical, alive, approachable
```

---

## 6.2 Task Card Component

### Dimensions
```
Width: 100% - 40px (20px margin each side)
Min Height: 72px
Padding: 16px
Border Radius: 14px
Background: #161616
```

### Layout
```
┌────────────────────────────────────────────────────┐
│ 16px padding                                       │
│  ┌──────┐                                          │
│  │  ○   │ 12px  Task Title Here                   │
│  │ 24px │  gap  9:00 AM · Work · ~25 min          │
│  └──────┘                                          │
│ 16px padding                                       │
└────────────────────────────────────────────────────┘

Checkbox: 24px × 24px
Checkbox Border: 2px, #52525B
Checkbox Checked: Fill #22C55E, checkmark #000000

Title: body-medium (17px/500), #FFFFFF
Metadata Line: subhead (15px/400), #71717A
Category Tag: caption-1 (12px/500), #A1A1AA, background #2C2C2E, padding 4px 8px, radius 6px
Duration Estimate: caption-1, #A78BFA
```

### States
```
Default:
- Background: #161616
- No border

Pressed:
- Background: #1C1C1E
- Scale: 0.98

Completed:
- Title: strikethrough, #71717A
- Checkbox: filled green with checkmark
- Background: #161616 (same)

Overdue:
- Left border: 3px solid #EF4444
- Time text: #EF4444

AI Suggested:
- Left border: 3px solid #7C3AED
- Small "AI" badge top right

Recurring Task:
- Recurring icon: 16px repeat/arrow.clockwise SF Symbol
- Icon position: Right side of metadata line
- Icon color: #A78BFA
- Tooltip on long press: "Repeats daily/weekly/monthly"

Calendar Event (Synced):
- Left border: 3px solid #3B82F6 (info blue)
- Small calendar icon (12px) before time
- "Synced" badge: caption-2, #3B82F6, top right
```

### Swipe Actions
```
Swipe Left Reveals (from right):
- Complete: Green (#22C55E) background, checkmark icon
- Delete: Red (#EF4444) background, trash icon
- Action width: 80px each

Swipe Right Reveals (from left):
- Defer: Orange (#EAB308) background, arrow-right icon
- Action width: 80px
```

### Task Card Design Prompt
```
Design a task card component for a dark productivity app.

SPECIFICATIONS:
- Width: Full width minus 40px margins
- Height: Auto, minimum 72px
- Background: #161616
- Border radius: 14px
- Padding: 16px all sides

LAYOUT (left to right):
1. Checkbox (24×24px):
   - Unchecked: 2px border #52525B, transparent fill
   - Checked: Solid #22C55E fill, black checkmark
   
2. Content (12px gap from checkbox):
   - Title: 17px semibold white
   - Metadata: 15px regular #71717A
   - Format: "9:00 AM · Category · ~25 min"
   - Category is a small tag with #2C2C2E background

STATES TO SHOW:
1. Default task
2. Completed (strikethrough title, green checkbox)
3. Overdue (red left border, red time)
4. AI suggested (purple left border, "AI" badge)
5. Pressed (darker background, slight scale down)

SWIPE PREVIEW:
- Show card mid-swipe revealing green "Complete" action

Background: Pure black
Style: Clean, scannable, minimal
```

---

## 6.3 Stats Card Component

### Dimensions
```
Width: Flexible, typically 25% of screen - gaps (for 4-column grid)
       Or 80px fixed width
Height: 80px
Padding: 12px
Border Radius: 14px
Background: #161616
```

### Layout
```
┌─────────────┐
│    156      │  Number: title-1 (28px/700), centered, #FFFFFF
│   tasks     │  Label: caption-1 (12px/500), centered, #71717A
└─────────────┘
```

### Variants
```
Standard:
- Background: #161616
- Number + Label

With Icon:
- Small icon (16px) top-left corner
- Icon color: brand-secondary

Highlighted:
- Background: linear-gradient(180deg, rgba(124,58,237,0.1) 0%, #161616 100%)
- Subtle purple top glow

With Trend:
- Small arrow icon next to number
- Green arrow up = positive
- Red arrow down = negative
```

### Stats Card Design Prompt
```
Design a stats card component for a productivity app.

SPECIFICATIONS:
- Size: 80px × 80px (square) or flexible width
- Background: #161616
- Border radius: 14px
- Padding: 12px

CONTENT (vertically centered):
- Number: 28px bold white, centered
- Label: 12px medium #71717A, centered, below number

VARIANTS:
1. Basic: Just number + label (e.g., "156" / "tasks")
2. With icon: 16px icon in top-left (#A78BFA tint)
3. Highlighted: Subtle purple gradient at top
4. With trend: Small up/down arrow next to number

EXAMPLE VALUES:
- "156 tasks" (with checkmark icon)
- "42h focus" (with timer icon)
- "47 days" (with flame icon, highlighted)
- "2.4k XP" (with star icon)

Background: Black
Style: Compact, glanceable, premium
```

---

## 6.4 Button Components

### Primary Button
```
Height: 56px
Padding: 16px 32px
Border Radius: 14px
Background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)
Shadow: 0 4px 14px rgba(124, 58, 237, 0.4)

Text: headline (17px/600), #FFFFFF, centered
Icon (optional): 20px, #FFFFFF, 8px gap from text

States:
- Default: As above
- Pressed: Scale 0.97, shadow reduced
- Disabled: Opacity 0.5, no shadow
- Loading: Spinner replaces text
```

### Secondary Button
```
Height: 56px
Padding: 16px 32px
Border Radius: 14px
Background: #1C1C1E
Border: 1px solid #3F3F46

Text: headline (17px/600), #FFFFFF

States:
- Default: As above
- Pressed: Background #2C2C2E
- Disabled: Opacity 0.5
```

### Ghost Button
```
Height: 48px
Padding: 12px 24px
Border Radius: 10px
Background: transparent

Text: headline (17px/600), #A78BFA

States:
- Default: As above
- Pressed: Background rgba(124, 58, 237, 0.1)
- Disabled: Text opacity 0.5
```

### Icon Button
```
Size: 44px × 44px
Border Radius: 22px (circle)
Background: #1C1C1E
Icon: 24px, #FFFFFF

States:
- Default: As above
- Pressed: Background #2C2C2E
- Active: Background #7C3AED, icon #FFFFFF
```

### Small Button (Tags, Actions)
```
Height: 32px
Padding: 8px 16px
Border Radius: 8px
Background: #1C1C1E

Text: caption-1 (12px/500), #A1A1AA

States:
- Default: As above
- Selected: Background #7C3AED, text #FFFFFF
```

### Button Design Prompt
```
Design a button system for a dark premium app.

PRIMARY BUTTON:
- Height: 56px
- Background: Purple gradient (#7C3AED to #9333EA)
- Text: 17px semibold white
- Border radius: 14px
- Shadow: Purple glow underneath
- Pressed: Slight scale down (0.97)

SECONDARY BUTTON:
- Height: 56px
- Background: #1C1C1E
- Border: 1px solid #3F3F46
- Text: 17px semibold white
- Pressed: Darker background

GHOST BUTTON:
- Height: 48px
- Background: Transparent
- Text: 17px semibold purple (#A78BFA)
- Pressed: Subtle purple background tint

ICON BUTTON:
- Size: 44×44px (circular)
- Background: #1C1C1E
- Icon: 24px white
- Active state: Purple background

Show all buttons in:
- Default state
- Pressed state
- Disabled state (50% opacity)

Background: Black
```

---

## 6.5 Input Field Component

### Text Input
```
Height: 56px
Padding: 16px
Border Radius: 12px
Background: #161616
Border: 1px solid #3F3F46

Text: body (17px/400), #FFFFFF
Placeholder: body (17px/400), #52525B

States:
- Default: Border #3F3F46
- Focused: Border #7C3AED, glow 0 0 0 3px rgba(124,58,237,0.2)
- Error: Border #EF4444, error message below
- Disabled: Opacity 0.5
```

### Search Input
```
Height: 48px
Padding: 12px 16px 12px 44px (extra left for icon)
Border Radius: 24px (pill shape)
Background: #1C1C1E
Border: none

Search Icon: 20px, #71717A, positioned 12px from left
Clear Button: 20px, #71717A, appears when has value
Placeholder: "Search..." in #52525B
```

### Input Field Design Prompt
```
Design input field components for a dark app.

TEXT INPUT:
- Height: 56px
- Background: #161616
- Border: 1px solid #3F3F46
- Border radius: 12px
- Padding: 16px
- Text: 17px white
- Placeholder: 17px #52525B

States:
1. Default: Gray border
2. Focused: Purple border (#7C3AED) with subtle glow
3. Error: Red border with error message below
4. With value: White text visible

SEARCH INPUT:
- Height: 48px
- Background: #1C1C1E
- Border radius: 24px (pill)
- Search icon on left (gray)
- Clear X button on right (when has text)
- Placeholder: "Search..."

Background: Black
```

---

## 6.6 Filter Tabs Component

### Dimensions
```
Container Height: 44px
Tab Padding: 12px 16px
Tab Border Radius: 22px (pill)
Tab Gap: 8px
```

### States
```
Inactive Tab:
- Background: transparent
- Text: headline (17px/600), #71717A

Active Tab:
- Background: #7C3AED
- Text: headline (17px/600), #FFFFFF

Pressed (inactive):
- Background: rgba(124, 58, 237, 0.1)
```

### Filter Tabs Design Prompt
```
Design horizontal filter tabs for a dark app.

SPECIFICATIONS:
- Container: Full width, horizontal scroll if needed
- Tab shape: Pill (fully rounded)
- Tab padding: 12px horizontal, 8px vertical
- Gap between tabs: 8px

INACTIVE TAB:
- Background: Transparent
- Text: 17px semibold #71717A

ACTIVE TAB:
- Background: #7C3AED (solid purple)
- Text: 17px semibold white

Example tabs: "Today" (active), "Tomorrow", "All", "High Priority"

Background: Black
Style: Clean, touch-friendly
```

---

## 6.7 List Item Component

### Standard List Item
```
Height: 56px
Padding: 16px horizontal
Background: transparent
Separator: 1px solid #1C1C1E, inset 16px from left

Content:
- Left Icon (optional): 24px, #A1A1AA, 12px gap to text
- Title: body (17px/400), #FFFFFF
- Right Chevron: 16px, #52525B
- Right Value (optional): subhead (15px/400), #71717A

Pressed: Background #161616
```

### List Section Header
```
Height: 32px
Padding: 16px horizontal, 8px vertical
Background: transparent

Text: caption-1 (12px/500), #71717A, uppercase, letter-spacing 1px
```

### List Item Design Prompt
```
Design list item components for a dark settings-style list.

STANDARD ITEM:
- Height: 56px
- Padding: 16px horizontal
- Background: Transparent (black shows through)

Content layout:
- Optional icon on left (24px, gray)
- Title in white (17px regular)
- Optional value text on right (15px gray)
- Chevron on far right (16px, dark gray)

Separator: Thin line (#1C1C1E), inset from left

SECTION HEADER:
- Height: 32px
- Text: 12px medium, gray, UPPERCASE
- Letter spacing: 1px

States:
- Default: Transparent background
- Pressed: Dark background (#161616)

Background: Black
```

---

## 6.8 Badge Components

### Count Badge
```
Min Width: 20px
Height: 20px
Padding: 4px 6px
Border Radius: 10px (full)
Background: #EF4444 (notifications) or #7C3AED (count)

Text: caption-2 (11px/400), #FFFFFF, centered
Position: Absolute, top-right of parent, offset -4px
```

### Status Badge
```
Height: 24px
Padding: 4px 10px
Border Radius: 12px
Background: Semantic color at 15% opacity

Text: caption-1 (12px/500), semantic color full

Examples:
- "Active": Background #22C55E26, text #22C55E
- "Due Soon": Background #EAB30826, text #EAB308
- "Overdue": Background #EF444426, text #EF4444
```

### Category Tag
```
Height: 24px
Padding: 4px 10px
Border Radius: 6px
Background: #2C2C2E

Text: caption-1 (12px/500), #A1A1AA
Icon (optional): 12px, before text, 4px gap
```

### Badge Design Prompt
```
Design badge components for a dark app.

COUNT BADGE (for notifications):
- Size: 20px minimum width, 20px height
- Background: Red (#EF4444) or Purple (#7C3AED)
- Text: 11px white, centered
- Shape: Pill/circle
- Position: Top-right corner of parent element

STATUS BADGE:
- Height: 24px
- Padding: 4px 10px
- Border radius: 12px (pill)
- Background: Semantic color at 15% opacity
- Text: 12px semibold in full semantic color

Show: "Active" (green), "Due Soon" (yellow), "Overdue" (red)

CATEGORY TAG:
- Height: 24px
- Padding: 4px 10px
- Background: #2C2C2E
- Border radius: 6px
- Text: 12px gray

Show: "Work", "Personal", "Health" with optional icons

Background: Black
```

---

## 6.9 Modal / Bottom Sheet

### Bottom Sheet
```
Border Radius: 28px (top corners only)
Background: #0D0D0D
Handle: 36px × 4px, #3F3F46, centered, 8px from top

Padding:
- Top: 24px (below handle)
- Horizontal: 20px
- Bottom: 34px + safe area

Shadow: 0 -10px 40px rgba(0, 0, 0, 0.5)
Backdrop: #000000 at 60% opacity
```

### Center Modal
```
Width: 90% of screen, max 340px
Border Radius: 24px
Background: #161616
Padding: 24px

Shadow: 0 20px 60px rgba(0, 0, 0, 0.6)
Backdrop: #000000 at 70% opacity
```

### Modal Design Prompt
```
Design modal components for a dark app.

BOTTOM SHEET:
- Slides up from bottom
- Background: #0D0D0D
- Top corners: 28px radius
- Drag handle: 36×4px gray bar, centered at top
- Padding: 24px top, 20px sides, 34px bottom (+ safe area)
- Backdrop: Black at 60% opacity

CENTER MODAL:
- Centered on screen
- Background: #161616
- Border radius: 24px
- Padding: 24px
- Max width: 340px
- Backdrop: Black at 70% opacity

Show example:
- Celebration modal with icon, title, description, button

Background: Black
```

---

## 6.10 Progress Bar

### Standard Progress Bar
```
Height: 8px
Border Radius: 4px
Background (track): #1C1C1E
Background (fill): linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%)
```

### Thin Progress Bar
```
Height: 4px
Border Radius: 2px
Same colors as standard
```

### Progress Bar Design Prompt
```
Design progress bar components.

STANDARD (8px height):
- Track: #1C1C1E
- Fill: Purple gradient (#7C3AED to #A78BFA)
- Border radius: 4px

THIN (4px height):
- Same colors, smaller size

Show at: 0%, 33%, 66%, 100% fill states

Optional: Animated shimmer effect on fill
```

---

# SECTION 7: SCREEN DESIGNS (DETAILED)

## 7.1 AI Home Screen

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│ Safe Area Top (59px)                │
├─────────────────────────────────────┤
│ 16px                                │
│                                     │
│ ← Tasks (left edge hint)            │ Hint: footnote, #52525B, 20px from edge
│                Focus ↑ (top hint)   │
│                                     │
│ 48px                                │
│                                     │
│     "Good morning, Alex"            │ title-1 (28px/700), #FFFFFF, centered
│                                     │
│ 32px                                │
│                                     │
│            ┌───────┐                │
│            │       │                │
│            │  ORB  │                │ 160px × 160px, centered
│            │       │                │
│            └───────┘                │
│                                     │
│ 24px                                │
│                                     │
│    "How can I help you today?"      │ body (17px/400), #A1A1AA, centered
│                                     │
│ 32px                                │
│                                     │
│   ┌──────────┐  12px  ┌──────────┐ │ Buttons: 120px wide each
│   │ ▶ Focus  │        │ + Task   │ │ Secondary style
│   └──────────┘        └──────────┘ │
│                                     │
│ 32px                                │
│                                     │
│   ┌────┐ 12px ┌────┐ 12px ┌────┐   │ Stats cards: 80px each
│   │ 5  │      │🔥47│      │ #2 │   │
│   │task│      │days│      │rank│   │
│   └────┘      └────┘      └────┘   │
│                                     │
│ 24px                                │
│                                     │
│ → Social (right edge hint)          │
│                Profile ↓ (bottom)   │
│                                     │
├─────────────────────────────────────┤
│ Safe Area Bottom (34px)             │
└─────────────────────────────────────┘
```

### AI Home Design Prompt
```
Design the AI Home screen for Mylo app - exact specifications.

CANVAS: iPhone 15 Pro (393 × 852px), include safe areas
BACKGROUND: #000000

LAYOUT (from top):

1. NAVIGATION HINTS (optional, fade out after 3s):
   - "← Tasks" left edge, 20px from edge, vertically centered-left
   - "Focus ↑" top center, 80px from top
   - "Social →" right edge, 20px from edge
   - "↓ Profile" bottom center, 80px from bottom
   - All hints: 13px regular #52525B

2. GREETING (48px below safe area):
   - "Good morning, Alex"
   - 28px bold white, centered
   - Dynamic: morning/afternoon/evening

3. AI ORB (32px below greeting):
   - 160×160px centered
   - Conic gradient: #7C3AED → #A78BFA → #C4B5FD → #A78BFA → #7C3AED
   - Outer glow: 60px blur, #7C3AED at 30%
   - Inner highlight: 24px white dot top-left at 40%

4. AI MESSAGE (24px below orb):
   - "How can I help you today?"
   - 17px regular #A1A1AA, centered

5. QUICK ACTIONS (32px below message):
   - Two buttons side by side, 12px gap
   - Button size: 120×48px each
   - Style: Secondary (dark background, gray border)
   - Left: "▶ Focus" (play icon + text)
   - Right: "+ Task" (plus icon + text)
   - Centered as a group

6. STATS CARDS (32px below buttons):
   - Three cards, 12px gaps
   - Card size: 80×80px
   - Background: #161616
   - Radius: 14px
   - Content:
     - "5" / "tasks" (checkmark icon)
     - "47" / "days" (flame icon, highlighted purple glow)
     - "#2" / "rank" (trophy icon)
   - Numbers: 22px bold white
   - Labels: 12px medium #71717A

7. SAFE AREA BOTTOM: 34px clear

Total interaction: Tap orb to speak, tap buttons for actions, swipe edges to navigate
```

---

## 7.2 Tasks Screen

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│ Safe Area Top                       │
├─────────────────────────────────────┤
│ 20px │ Tasks                   ◉ │ 20px
│      │                              │
│ Header: title-1 left, mini orb right│
├─────────────────────────────────────┤
│ 16px                                │
│ ┌─────────────────────────────────┐ │
│ │ Today | Tomorrow | All | High  │ │ Filter tabs
│ └─────────────────────────────────┘ │
│ 24px                                │
│ MORNING                             │ Section header
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ ○  Review project brief         │ │ Task card 1
│ │    9:00 AM · Work               │ │
│ └─────────────────────────────────┘ │
│ 12px                                │
│ ┌─────────────────────────────────┐ │
│ │ ○  Team standup call            │ │ Task card 2
│ │    10:00 AM · Work              │ │
│ └─────────────────────────────────┘ │
│ 24px                                │
│ AFTERNOON                           │
│ 8px                                 │
│ ┌─────────────────────────────────┐ │
│ │ ○  Gym session                  │ │ Task card 3
│ │    2:00 PM · Health  ~45 min    │ │
│ └─────────────────────────────────┘ │
│                                     │
│                              ┌───┐  │
│                              │ + │  │ FAB
│                              └───┘  │
├─────────────────────────────────────┤
│ Safe Area Bottom                    │
└─────────────────────────────────────┘
```

### Tasks Screen Design Prompt
```
Design the Tasks screen for Mylo app - exact specifications.

CANVAS: iPhone 15 Pro (393 × 852px)
BACKGROUND: #000000

HEADER (below safe area):
- Height: 56px
- Padding: 20px horizontal
- Left: "Tasks" - 28px bold white
- Right: Mini AI orb (44px), tap to voice command

FILTER TABS (16px below header):
- Horizontal scroll container
- Padding: 0 20px
- Tabs: "Today" (active), "Tomorrow", "All", "High Priority"
- Active: #7C3AED background, white text, pill shape
- Inactive: Transparent, #71717A text
- Tab padding: 12px 16px
- Tab gap: 8px

SECTION HEADERS:
- "MORNING", "AFTERNOON", "EVENING"
- 12px medium, #71717A, uppercase
- Letter spacing: 1px
- Margin: 24px top, 8px bottom
- Padding: 0 20px

TASK CARDS:
- Width: Full width - 40px (20px margins)
- Background: #161616
- Radius: 14px
- Padding: 16px
- Gap between cards: 12px

Card content:
- Checkbox: 24×24px, 2px border #52525B, 12px gap to text
- Title: 17px medium white
- Metadata: 15px regular #71717A
- Category tag: 12px, #2C2C2E background, 6px radius
- AI estimate: 12px #A78BFA (e.g., "~45 min")

Card states:
- Show one completed (strikethrough, green checkbox)
- Show one with purple left border (AI suggested)

FAB (Floating Action Button):
- Size: 56×56px
- Position: Bottom right, 20px from edges, above safe area
- Background: Purple gradient
- Icon: Plus, 24px white
- Shadow: Purple glow

Show swipe action preview on one card (green complete action revealed)
```

---

## 7.3 Focus Screen (Modal)

### Exact Layout Measurements
```
┌─────────────────────────────────────┐
│                                     │
│          ────────                   │ Drag handle: 36×4px, #3F3F46
│                                     │
│ 48px                                │
│                                     │
│             25:00                   │ Timer: display-large (48px), SF Mono
│                                     │
│ 40px                                │
│                                     │
│            ┌───────┐                │
│            │  ORB  │                │ 120px orb (medium)
│            └───────┘                │
│                                     │
│ 32px                                │
│                                     │
│     "Stay focused, you're          │ body (17px), #A1A1AA, centered
│         doing great"               │ Max width: 280px
│                                     │
│ 24px                                │
│                                     │
│   Working on: Project Brief         │ subhead (15px), #71717A
│                                     │
│ 48px                                │
│                                     │
│   ┌──────────┐    ┌──────────┐     │
│   │  Pause   │    │   End    │     │
│   └──────────┘    └──────────┘     │
│                                     │
│ 24px                                │
│                                     │
│      18:32 elapsed · +25 XP         │ footnote (13px), #52525B
│                                     │
├─────────────────────────────────────┤
│ Safe Area Bottom                    │
└─────────────────────────────────────┘
```

### Focus Screen Design Prompt
```
Design the Focus Timer modal for Mylo app - exact specifications.

PRESENTATION: Bottom sheet, 90% screen height
BACKGROUND: #0D0D0D
TOP CORNERS: 28px radius

DRAG HANDLE:
- 36×4px, #3F3F46, centered
- 12px from top

TIMER (48px below handle):
- "25:00" format
- Font: SF Mono, 48px bold white
- Centered
- Subtle pulsing glow when active

AI ORB (40px below timer):
- 120×120px (medium size)
- Same gradient as main orb
- Gentler animation during focus
- Centered

AI MESSAGE (32px below orb):
- Encouraging text, changes every few minutes
- Examples: "Stay focused, you're doing great", "Almost there!", "Deep work mode"
- 17px regular #A1A1AA
- Centered, max width 280px

TASK LABEL (24px below message):
- "Working on: [Task Name]"
- Or "General focus session" if no task
- 15px regular #71717A
- Centered

CONTROL BUTTONS (48px below task):
- Two buttons side by side, 16px gap
- Width: 140px each
- "Pause": Secondary style (dark bg, border)
- "End Session": Ghost style (outline, no fill)
- Centered as group

SESSION STATS (24px below buttons):
- "18:32 elapsed · +25 XP"
- 13px regular #52525B
- Centered

BACKDROP: Black at 60% opacity over previous screen
```

---

## 7.4 Unlock Celebration Modal

### Exact Layout
```
┌─────────────────────────────────────┐
│                                     │
│           ✨ 🎊 ✨                   │ Confetti animation
│                                     │
│            ┌─────┐                  │
│            │  ⚡  │                 │ Icon: 48px, in 80px circle
│            └─────┘                  │ Circle: #7C3AED20 bg, purple glow
│                                     │
│        New AI Ability!              │ title-2 (22px), white
│                                     │
│        Peak Hours                   │ title-3 (20px), #A78BFA
│          Detection                  │
│                                     │
│   "I now know when you're most     │ body (17px), #A1A1AA
│    productive. I'll suggest your   │ Max width: 280px, centered
│    important tasks during your     │
│    peak focus hours."              │
│                                     │
│         ┌────────────────┐         │
│         │    Awesome!    │         │ Primary button, full width - 48px
│         └────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

### Unlock Celebration Design Prompt
```
Design the Unlock Celebration modal for Mylo - exact specifications.

MODAL TYPE: Center modal
SIZE: 320px wide, auto height
BACKGROUND: #161616
RADIUS: 24px
PADDING: 32px

CONFETTI:
- Particle animation at top
- Colors: #7C3AED, #A78BFA, #EAB308, #FFFFFF
- 50-80 particles falling
- Duration: 3 seconds

ICON CONTAINER:
- 80×80px circle
- Background: #7C3AED at 20%
- Icon: 48px, white (use bolt/lightning for this unlock)
- Subtle purple glow around circle
- Centered

TITLE (16px below icon):
- "New AI Ability!"
- 22px semibold white
- Centered

FEATURE NAME (8px below title):
- "Peak Hours Detection"
- 20px semibold #A78BFA
- Centered

DESCRIPTION (16px below name):
- AI explanation in first person
- 17px regular #A1A1AA
- Max width: 280px
- Centered, multi-line

BUTTON (24px below description):
- "Awesome!"
- Primary style (purple gradient)
- Full width minus 48px padding
- Height: 56px

BACKDROP: Black at 70%

Animation sequence:
1. Modal scales up from 0.8 to 1.0 (200ms)
2. Confetti starts
3. Icon pulses once
4. Text fades in sequentially (100ms each)
```

---

# SECTION 8: ICONOGRAPHY

## 8.1 SF Symbols Mapping

### Navigation Icons
```
Tasks view:      checklist (filled when active)
Social view:     person.2.fill
Profile view:    person.circle.fill
Focus view:      timer
AI Home:         sparkles
```

### Action Icons
```
Add/Create:      plus
Complete:        checkmark
Delete:          trash
Edit:            pencil
Share:           square.and.arrow.up
Close:           xmark
Back:            chevron.left
Forward:         chevron.right
More:            ellipsis
Settings:        gearshape.fill
```

### Status Icons
```
Streak/Fire:     flame.fill
XP/Star:         star.fill
Trophy:          trophy.fill
Lock:            lock.fill
Unlock:          lock.open.fill
Clock:           clock.fill
Calendar:        calendar
Notification:    bell.fill
```

### Voice Icons
```
Microphone:      mic.fill
Listening:       waveform
Speaker:         speaker.wave.2.fill
Mute:            speaker.slash.fill
```

## 8.2 Icon Sizes

```
Navigation bar:   24px, 2px stroke
In buttons:       20px
In list items:    24px
Tab bar:          28px
Feature icons:    32px
Hero icons:       48px
```

## 8.3 Icon Colors

```
Default:          #A1A1AA (text-secondary)
Active:           #FFFFFF
Brand:            #A78BFA (brand-secondary)
Disabled:         #52525B
Success:          #22C55E
Warning:          #EAB308
Error:            #EF4444
```

---

# SECTION 9: ANIMATION SPECIFICATIONS

## 9.1 Timing Functions

```javascript
// Standard ease
ease: 'cubic-bezier(0.4, 0, 0.2, 1)'

// Ease in (acceleration)
easeIn: 'cubic-bezier(0.4, 0, 1, 1)'

// Ease out (deceleration)
easeOut: 'cubic-bezier(0, 0, 0.2, 1)'

// Spring (for gestures)
spring: {
  damping: 20,
  stiffness: 200,
  mass: 1
}

// Bounce (for celebrations)
bounce: {
  damping: 10,
  stiffness: 400,
  mass: 0.5
}
```

## 9.2 Duration Scale

```
instant:    0ms    (color changes)
fast:       100ms  (micro-interactions)
normal:     200ms  (standard transitions)
slow:       300ms  (complex transitions)
slower:     500ms  (entrance animations)
slowest:    1000ms (dramatic effects)
```

## 9.3 Specific Animations

### Button Press
```javascript
{
  scale: [1, 0.97, 1],
  duration: 150,
  easing: 'ease-out'
}
```

### Card Appear (staggered list)
```javascript
{
  opacity: [0, 1],
  translateY: [20, 0],
  duration: 200,
  delay: index * 50,
  easing: 'ease-out'
}
```

### Screen Swipe Transition
```javascript
{
  translateX: [fromX, toX],
  spring: { damping: 20, stiffness: 200 }
}
// Peek: show 15% of target screen at swipe start
// Threshold: 100px to complete transition
```

### Orb Idle Pulse
```javascript
{
  scale: [1, 1.03, 1],
  opacity: [0.8, 1, 0.8], // glow
  duration: 4000,
  easing: 'ease-in-out',
  loop: true
}
```

### Orb Listening Pulse
```javascript
{
  scale: [1, 1.08, 1],
  duration: 800,
  easing: 'ease-in-out',
  loop: true
}
// Plus: sound wave rings every 400ms
```

### Confetti Particle
```javascript
{
  translateY: [0, screenHeight + 100],
  translateX: randomRange(-50, 50),
  rotate: randomRange(0, 720),
  scale: [1, 0],
  duration: randomRange(2000, 3000),
  easing: 'ease-in'
}
```

### Success Checkmark Draw
```javascript
{
  pathLength: [0, 1],
  duration: 300,
  easing: 'ease-out'
}
// Then: scale bounce [0, 1.2, 1] over 200ms
```

### Modal Entrance
```javascript
{
  scale: [0.9, 1],
  opacity: [0, 1],
  duration: 200,
  easing: 'ease-out'
}
```

### Toast Notification
```javascript
// Enter from top
{
  translateY: [-100, 0],
  opacity: [0, 1],
  duration: 300,
  easing: 'spring'
}
// Auto dismiss after 3s
{
  translateY: [0, -100],
  opacity: [1, 0],
  duration: 200,
  easing: 'ease-in'
}
```

---

# SECTION 10: DESIGN TOKENS EXPORT

## 10.1 JSON Export (for React Native)

```json
{
  "colors": {
    "background": {
      "primary": "#000000",
      "surface1": "#0D0D0D",
      "surface2": "#161616",
      "surface3": "#1C1C1E",
      "surface4": "#2C2C2E"
    },
    "brand": {
      "primary": "#7C3AED",
      "secondary": "#A78BFA",
      "tertiary": "#C4B5FD",
      "muted": "#4C1D95"
    },
    "text": {
      "primary": "#FFFFFF",
      "secondary": "#A1A1AA",
      "tertiary": "#71717A",
      "disabled": "#52525B"
    },
    "semantic": {
      "success": "#22C55E",
      "successMuted": "#22C55E1A",
      "warning": "#EAB308",
      "warningMuted": "#EAB3081A",
      "error": "#EF4444",
      "errorMuted": "#EF44441A",
      "info": "#3B82F6"
    }
  },
  "spacing": {
    "0": 0,
    "1": 4,
    "2": 8,
    "3": 12,
    "4": 16,
    "5": 20,
    "6": 24,
    "7": 32,
    "8": 40,
    "9": 48,
    "10": 64
  },
  "borderRadius": {
    "none": 0,
    "sm": 6,
    "md": 10,
    "lg": 14,
    "xl": 20,
    "2xl": 28,
    "full": 9999
  },
  "typography": {
    "displayLarge": {
      "fontSize": 48,
      "fontWeight": "700",
      "lineHeight": 56,
      "letterSpacing": -1.5
    },
    "display": {
      "fontSize": 34,
      "fontWeight": "700",
      "lineHeight": 40,
      "letterSpacing": -0.5
    },
    "title1": {
      "fontSize": 28,
      "fontWeight": "700",
      "lineHeight": 34,
      "letterSpacing": -0.3
    },
    "title2": {
      "fontSize": 22,
      "fontWeight": "600",
      "lineHeight": 28,
      "letterSpacing": -0.2
    },
    "title3": {
      "fontSize": 20,
      "fontWeight": "600",
      "lineHeight": 24,
      "letterSpacing": -0.1
    },
    "headline": {
      "fontSize": 17,
      "fontWeight": "600",
      "lineHeight": 22,
      "letterSpacing": -0.4
    },
    "body": {
      "fontSize": 17,
      "fontWeight": "400",
      "lineHeight": 24,
      "letterSpacing": -0.4
    },
    "bodyMedium": {
      "fontSize": 17,
      "fontWeight": "500",
      "lineHeight": 24,
      "letterSpacing": -0.4
    },
    "callout": {
      "fontSize": 16,
      "fontWeight": "400",
      "lineHeight": 21,
      "letterSpacing": -0.3
    },
    "subhead": {
      "fontSize": 15,
      "fontWeight": "400",
      "lineHeight": 20,
      "letterSpacing": -0.2
    },
    "footnote": {
      "fontSize": 13,
      "fontWeight": "400",
      "lineHeight": 18,
      "letterSpacing": -0.1
    },
    "caption1": {
      "fontSize": 12,
      "fontWeight": "500",
      "lineHeight": 16,
      "letterSpacing": 0
    },
    "caption2": {
      "fontSize": 11,
      "fontWeight": "400",
      "lineHeight": 13,
      "letterSpacing": 0.1
    }
  },
  "shadows": {
    "sm": {
      "shadowColor": "#000000",
      "shadowOffset": { "width": 0, "height": 1 },
      "shadowOpacity": 0.5,
      "shadowRadius": 2
    },
    "md": {
      "shadowColor": "#000000",
      "shadowOffset": { "width": 0, "height": 4 },
      "shadowOpacity": 0.4,
      "shadowRadius": 6
    },
    "lg": {
      "shadowColor": "#000000",
      "shadowOffset": { "width": 0, "height": 10 },
      "shadowOpacity": 0.5,
      "shadowRadius": 25
    },
    "glow": {
      "shadowColor": "#7C3AED",
      "shadowOffset": { "width": 0, "height": 4 },
      "shadowOpacity": 0.4,
      "shadowRadius": 14
    }
  },
  "animation": {
    "duration": {
      "instant": 0,
      "fast": 100,
      "normal": 200,
      "slow": 300,
      "slower": 500
    },
    "spring": {
      "default": { "damping": 20, "stiffness": 200, "mass": 1 },
      "bounce": { "damping": 10, "stiffness": 400, "mass": 0.5 }
    }
  }
}
```

## 10.2 CSS Variables Export

```css
:root {
  /* Background */
  --bg-primary: #000000;
  --bg-surface-1: #0D0D0D;
  --bg-surface-2: #161616;
  --bg-surface-3: #1C1C1E;
  --bg-surface-4: #2C2C2E;
  
  /* Brand */
  --brand-primary: #7C3AED;
  --brand-secondary: #A78BFA;
  --brand-tertiary: #C4B5FD;
  --brand-muted: #4C1D95;
  
  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #A1A1AA;
  --text-tertiary: #71717A;
  --text-disabled: #52525B;
  
  /* Semantic */
  --success: #22C55E;
  --warning: #EAB308;
  --error: #EF4444;
  --info: #3B82F6;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --space-10: 64px;
  
  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-2xl: 28px;
  --radius-full: 9999px;
}
```

---

# SECTION 11: GESTURE NAVIGATION & INTERACTION SPECIFICATIONS

## 11.1 Swipe Gesture Specifications

### Swipe Distances & Velocities

```
SWIPE LEFT (Tasks View)
├─ Trigger: Swipe > 50px left
├─ Velocity: > 300px/s completes
├─ Peek threshold: 15% of screen width (59px)
├─ Complete threshold: 50% of screen width (196px)
└─ Animation duration: 300ms spring

SWIPE RIGHT (Social View)
├─ Trigger: Swipe > 50px right
├─ Velocity: > 300px/s completes
├─ Peek threshold: 15% of screen width
├─ Complete threshold: 50% of screen width
└─ Animation duration: 300ms spring

SWIPE UP (Focus Mode)
├─ Trigger: Swipe > 80px up
├─ Velocity: > 400px/s completes
├─ Peek threshold: 20% of screen height
├─ Complete threshold: 60% of screen height
└─ Animation duration: 350ms spring

SWIPE DOWN (Profile View)
├─ Trigger: Swipe > 80px down
├─ Velocity: > 400px/s completes
├─ Peek threshold: 20% of screen height
├─ Complete threshold: 60% of screen height
└─ Animation duration: 350ms spring
```

### Screen Peek Behavior

```
VISUAL FEEDBACK DURING SWIPE:
├─ At 0px drag: No change
├─ At peek threshold (59px left): Show 15% of target screen
│  ├─ Fade in overlay (black at 5% opacity)
│  └─ Small offset shadow on AI Home
├─ At 50% drag: Show 50% of target screen
│  ├─ Fade overlay to 15% opacity
│  └─ Large shadow on AI Home
└─ At completion: Full screen transition

PARALLAX EFFECT:
- AI Home: Slight scale (1.0 → 0.98) during drag
- Orb: Maintains visibility, dims slightly (opacity 1.0 → 0.7)
- Source screen appears to move behind target
```

### Swipe Direction Hints (Optional)

```
ONBOARDING ONLY (First 3 sessions):
├─ "← Tasks" appears on left edge, fades out
├─ "→ Social" appears on right edge, fades out
├─ "↑ Focus" appears top center, fades out
├─ "↓ Profile" appears bottom center, fades out
└─ All hints: 13px regular #52525B, auto-hide after 3s

HINT ANIMATION:
├─ Fade in: 200ms
├─ Hold: 2.5s
└─ Fade out: 200ms ease-out
```

---

## 11.2 Haptic Feedback Patterns

### Haptic Pattern Specifications

```
LIGHT TAP (Initial swipe start)
├─ Intensity: 0.3 (subtle)
├─ Duration: 50ms
├─ Trigger: Swipe begins
└─ Devices: All (iOS with Haptic Engine)

MEDIUM TAP (Swipe completion)
├─ Intensity: 0.6 (noticeable)
├─ Duration: 100ms
├─ Trigger: Swipe reaches 50% threshold
└─ Pattern: Single pulse

HEAVY TAP (Orb tap activation)
├─ Intensity: 0.8 (strong)
├─ Duration: 150ms
├─ Trigger: User taps orb
└─ Pattern: Double pulse (50ms gap)

SUCCESS FEEDBACK (Task completion)
├─ Pattern: Triple light taps
├─ Intervals: 50ms gaps
├─ Total duration: 200ms
└─ Intensity: 0.4 each

ERROR FEEDBACK (Action failed)
├─ Pattern: Heavy bump + double light
├─ Sequence: [0.9 × 100ms] + gap + [0.3 × 50ms, 0.3 × 50ms]
└─ Intensity: 0.7 average

VOICE LISTENING (Orb listening)
├─ Pattern: Continuous light pulse
├─ Pulse interval: 100ms
├─ Intensity: 0.2 (very subtle)
├─ Duration: While listening
└─ Effect: Steady rhythm matching audio

VOICE RESPONSE (Orb responding)
├─ Pattern: Heavy pulse at start, then fade
├─ Intensity: 0.8 → 0.2
├─ Duration: 1000ms total
└─ Effect: Feels responsive, then retreats
```

### iOS Native Haptics Integration

```javascript
// React Native haptic integration
import { Haptics } from 'react-native-haptics';

// Light swipe start
Haptics.selection(); // Light tap

// Gesture completion
Haptics.notificationAsync(
  Haptics.NotificationFeedbackType.Success
); // Medium tap

// Orb tap
Haptics.impactAsync(
  Haptics.ImpactFeedbackStyle.Heavy
); // Heavy impact

// Voice listening pulse
const pulseInterval = setInterval(() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}, 100);
```

---

## 11.3 Voice UI States

### Orb Voice States

```
STATE 1: IDLE (Default)
├─ Visual: Calm gradient, gentle glow
├─ Animation: Pulse scale 1.0 ↔ 1.03 every 4s
├─ Glow opacity: 0.3
├─ Haptic: None
└─ User action: Tap to speak

STATE 2: LISTENING (Tap detected)
├─ Visual: Bright gradient, intense glow
├─ Animation: Rapid pulse scale 1.0 ↔ 1.08 every 800ms
├─ Glow opacity: 0.6
├─ Sound waves: 3 concentric rings expanding outward
│  ├─ Ring 1: Starts at orb edge, expands 60px
│  ├─ Ring 2: 200ms delay
│  ├─ Ring 3: 400ms delay
│  └─ Line width: 2px, brand-secondary at 40% opacity
├─ Haptic: Light continuous pulse (100ms intervals, 0.2 intensity)
└─ Audio: Listening chime (if enabled)

STATE 3: PROCESSING (Sending voice to AI)
├─ Visual: Gradient appears to rotate
├─ Animation: Continuous 360° rotation every 1.5s
├─ Glow opacity: 0.5
├─ Haptic: Heavy pulse (0.8 intensity × 200ms)
├─ Particles: Subtle sparkles orbit the orb (3-5 particles)
│  ├─ Particle size: 2-4px
│  ├─ Color: brand-tertiary at 60% opacity
│  ├─ Speed: 3s per orbit
│  └─ Random distribution
└─ Audio: None (quiet processing state)

STATE 4: SPEAKING (AI responds)
├─ Visual: Rhythmic pulsing matching AI voice
├─ Animation: Amplitude response to audio frequency
│  ├─ Scale range: 1.0 → 1.15
│  ├─ Glow opacity: 0.4 → 0.8
│  └─ Synchronized with audio output
├─ Haptic: Pulse matching audio (adaptive intensity)
├─ Wave visualization: Outward moving waves
│  ├─ Wave count: 4-6 simultaneous
│  ├─ Wave height: Matches audio amplitude
│  ├─ Color: brand-secondary
│  └─ Opacity: 60% → 0% (fade out)
└─ Audio: AI voice playback

STATE 5: ERROR (Something failed)
├─ Visual: Slight shake, red tint (momentary)
├─ Animation: Shake [0px, -5px, 5px, -5px, 0px] over 200ms
├─ Glow: Flash red (#EF4444) at 40% opacity for 100ms
├─ Haptic: Error pattern (heavy bump + double light)
├─ Duration: 1 second then revert to idle
└─ Text: Brief error message appears below orb
```

### Voice UI Container

```
VOICE STATE INDICATOR (Below Orb):
├─ Text: Changes based on state
│  ├─ Idle: "Tap to talk" (13px, #71717A)
│  ├─ Listening: "Listening..." (13px, #A78BFA, animated dots)
│  ├─ Processing: "Thinking..." (13px, #A78BFA)
│  ├─ Speaking: AI response text (17px, #FFFFFF, body)
│  └─ Error: "Didn't catch that. Try again?" (13px, #EF4444)
├─ Animation: Fade in/out 200ms
└─ Position: Centered below orb, 24px gap

MICROPHONE STATUS INDICATOR (Top-right corner):
├─ Icon: Microphone (20px)
├─ Color: brand-secondary when active, text-tertiary when inactive
├─ Animation: Pulse when listening
└─ Permission error: Icon shows ⊘ (denied)
```

---

## 11.4 Context Cards Component

### Context Card Specifications

```
DIMENSIONS:
├─ Width: 90% of screen width (with 5% margins each side)
├─ Height: 90px
├─ Border radius: 14px
├─ Background: #161616
├─ Padding: 12px
└─ Shadow: shadow-md

SCROLLABLE CONTAINER:
├─ Position: Below AI message, above quick actions
├─ Scroll direction: Horizontal
├─ Card gap: 12px
├─ Show count: 3 cards max visible
├─ Auto-scroll: First card centered on load
└─ Snap to card on scroll end

CARD TYPES:
```

### Context Card Type 1: Today's Tasks

```
LAYOUT (Vertical stack):
┌─────────────────────┐
│ 📋 Today    12:04pm │ (header, 12px caption-1, justified)
│ ─────────────────── │
│ 3 tasks · 2.5 hours │ (description, 17px body-medium, left)
│ 45% complete        │ (progress, 13px footnote, #A78BFA, left)
└─────────────────────┘

STYLES:
├─ Icon: 20px, #A78BFA
├─ Header: caption-1 #71717A, right-aligned timestamp
├─ Description: body-medium #FFFFFF
├─ Progress: footnote #A78BFA
├─ Border: None
└─ On tap: Navigate to Tasks view (swipe left)
```

### Context Card Type 2: Streak Badge

```
LAYOUT (Vertical center):
┌─────────────────────┐
│   🔥               │ (Icon, 32px, centered)
│ ────────────────── │
│ 47 Days           │ (Number, title-2, centered)
│ Your Streak       │ (Label, caption-1, centered, #71717A)
└─────────────────────┘

STYLES:
├─ Background: Subtle gradient (light purple overlay)
│  └─ linear-gradient(180deg, rgba(124,58,237,0.1) 0%, #161616 100%)
├─ Icon: Fire emoji or SF Symbols flame.fill
├─ Number: 22px bold #FFFFFF
├─ Label: 12px medium #71717A
├─ Glow: Subtle purple around entire card
└─ On tap: Show streak details / history
```

### Context Card Type 3: Challenge Status

```
LAYOUT (Vertical stack):
┌─────────────────────┐
│ 🏃 7-Day Workout    │ (title, 15px subhead)
│ ─────────────────── │
│ 2nd / 5 friends     │ (ranking, 13px footnote, #A78BFA)
│ ████░░░░░░░░░░░░░  │ (progress bar, 4px height)
│ 3 days left         │ (countdown, 12px caption-1, #71717A)
└─────────────────────┘

STYLES:
├─ Icon: 16px, left-aligned
├─ Title: 15px medium #FFFFFF
├─ Ranking: 13px #A78BFA
├─ Progress bar: 8px height, 14px border-radius
│  ├─ Track: #2C2C2E
│  └─ Fill: brand-primary (animated if active)
├─ Countdown: 12px #71717A
└─ On tap: Open Challenge detail modal
```

### Context Card Interactions

```
SWIPE BEHAVIOR:
├─ Horizontal scroll within container
├─ Snap to cards on scroll end
├─ Scroll indicator: Small dots below cards
│  ├─ Active dot: 4px brand-primary
│  ├─ Inactive dot: 4px #52525B
│  └─ Gap between: 6px
└─ Auto-hide scroll indicator after 2s inactive

TAP BEHAVIOR:
├─ Card background pulse (scale 0.98 → 1.0)
├─ Navigate to relevant screen
└─ Haptic: Light tap (0.3 intensity)

REFRESH:
├─ Cards refresh every 5 minutes
├─ On background return: Instant refresh
├─ Animation: Subtle fade-in update (no disruption)
└─ New cards: Slide in from right

EMPTY STATE:
├─ If no active challenges/tasks
├─ Show placeholder: "Start a challenge to see progress here"
├─ Text: 15px #71717A, centered
└─ Fade opacity: 0.6
```

---

## 11.5 Progressive Unlock Visual Treatment

### Locked Feature Appearance

```
LOCK BADGE (appears on locked elements):
├─ Icon: lock.fill SF Symbol
├─ Size: 16px
├─ Color: #A78BFA
├─ Position: Top-right corner, inside element
├─ Background: Semi-transparent dark circle (24px)
└─ Shadow: None

LOCKED CARD VISUAL TREATMENT:
├─ Opacity: 0.6 (slightly faded)
├─ Blur filter: None (sharp but dim)
├─ Border: 1px dashed #52525B (dashed pattern)
├─ Background: Same as normal, but darker overlay
│  └─ Add rgba(0,0,0,0.2) overlay
├─ Text: Still readable, but less prominent
└─ On hover: No change (disabled state)

UNLOCK REQUIREMENT TEXT:
├─ Position: Below locked element
├─ Format: "Unlock at Day 7" or "Complete 50 tasks"
├─ Style: footnote #A78BFA, centered
├─ Icon: Small key icon before text
└─ Animation: Fade in 200ms when view loads

CLICK BEHAVIOR (Locked):
├─ On tap: Show unlock modal (bottom sheet)
├─ Modal content:
│  ├─ Feature name: title-2 #A78BFA
│  ├─ Lock icon: Large (48px), brand-primary
│  ├─ Description: body #A1A1AA
│  ├─ Requirements: List of bullets
│  │  ├─ Format: ✓ requirement met
│  │  ├─ Format: ○ requirement pending (X% complete)
│  │  └─ Color: #22C55E for met, #EAB308 for pending
│  ├─ Progress bar: Shows overall unlock % (animated)
│  └─ Close button: Ghost style
└─ Animation: Bottom sheet slides up 300ms spring
```

### Unlock Animation (When Feature Unlocks)

```
TRIGGER: User meets requirements

CELEBRATION MODAL:
├─ Entry: Scale 0.9 → 1.0 over 200ms (spring)
├─ Entrance timing: Auto-triggered when condition met
├─ Content:
│  ├─ Confetti animation (2.5 seconds)
│  ├─ Feature icon: 48px, animated
│  │  └─ Scale pulse: 0.8 → 1.2 → 1.0 over 600ms
│  ├─ Headline: "New AI Ability!" (title-2)
│  ├─ Feature name: 20px #A78BFA
│  ├─ Description: body text explaining ability
│  ├─ Celebrate button: Primary style
│  └─ Optional: Animation showing feature in action
└─ Exit: Modal dismisses on button tap or auto-close after 5s

CONFETTI PARTICLES:
├─ Particle count: 50-80
├─ Particle types: Squares (4×4px) and circles (3px)
├─ Colors: Mix of #7C3AED, #A78BFA, #EAB308, #FFFFFF
├─ Animation:
│  ├─ Start position: Scattered across top (y: -100px)
│  ├─ End position: Below visible area (y: screen height)
│  ├─ Rotation: 0° → random(0-720)°
│  ├─ Scale: 1.0 → 0.0
│  ├─ Duration: random(2.0-3.0) seconds
│  ├─ Easing: ease-in
│  └─ Stagger: Particles begin in sequence (50ms apart)
└─ Visual: Particles drift down with slight horizontal motion
```

---

# SECTION 12: FIGMA SETUP PROMPTS

---

# SECTION 12: FIGMA SETUP PROMPTS

## 12.1 Gesture Navigation System Prompt

```
Prompt for Figma/AI design tool:

Create comprehensive gesture navigation mockups for Mylo app showing all swipe states.

CANVAS: iPhone 15 Pro (393 × 852px) × 4 frames for 4 swipe directions

FRAME 1: SWIPE LEFT (Tasks View)
Show 0% → 15% → 50% → 100% drag states with peek behavior

FRAME 2: SWIPE RIGHT (Social View)
Mirror of Frame 1, right direction

FRAME 3: SWIPE UP (Focus Mode)
Bottom sheet appearing with drag states

FRAME 4: SWIPE DOWN (Profile View)
Top sheet appearing with drag states

For each frame include:
- Haptic feedback indicators (light/medium/heavy)
- Animation curve markers
- Velocity thresholds
- Duration timings
```

## 12.2 Voice UI States & Orb Animations Prompt

```
Prompt for Figma/AI design tool:

Create voice UI state animations for the AI Orb - show all 5 states:

1. IDLE: Calm gradient, gentle pulse, "Tap to talk"
2. LISTENING: Bright glow, sound waves, "Listening..." with dots
3. PROCESSING: Rotating gradient, particles, "Thinking..."
4. SPEAKING: Audio-reactive waves, "AI response text"
5. ERROR: Shake animation, red flash, error message

For each state show:
- Orb visual with animation indicators
- Voice state indicator text below
- Haptic pattern notation
- Duration and easing info
```

## 12.3 Context Cards & Progressive Unlock Prompt

```
Prompt for Figma/AI design tool:

Create Context Cards carousel and Progressive Unlock treatment:

TOP: Context Cards (3 types)
- Card 1: Today's Tasks (icon, "3 tasks · 2.5 hours", "45% complete")
- Card 2: Streak Badge (47 days with glow)
- Card 3: Challenge Status (ranking, progress bar, countdown)

BOTTOM: Progressive Unlock
- Unlocked feature (normal appearance)
- Locked feature (opacity 0.6, dashed border, lock icon)
- Unlock requirements modal (bottom sheet)
- Celebration modal (confetti, icon, button)
```

## 12.4 Gesture Feedback & Haptic Patterns Prompt

```
Prompt for Figma/AI design tool:

Create visual reference guide - 4×4 grid showing:

ROW 1: Swipe left feedback (start, peek, threshold, complete)
ROW 2: Voice interaction haptics (idle, tap, listening, success)
ROW 3: Error patterns (triggered, failed, reversed, rate-limit)
ROW 4: Timing reference (gesture timeline, curves, intensity scale, targets)

Each frame includes haptic notation and timing details
```

## 12.5 Complete AI Home Screen Mockup Prompt

```
Prompt for Figma/AI design tool:

Create the complete AI Home screen (393 × 852px):

1. Safe areas and notch visualization
2. Swipe hints (optional, fade-out)
3. Greeting: "Good morning, Alex"
4. AI Orb (160×160px) with gentle pulse
5. AI Message: "How can I help you today?"
6. Context Cards carousel (3 cards visible)
7. Quick Action buttons ("Focus", "+ Task")
8. Stats grid (3 cards: tasks, streak, rank)

Show pagination dots and pagination scroll indicator
```

## 12.6 Create Design System File

```
Prompt for Figma/AI design tool:

Create a Figma design system file for Mylo:

PAGE 1: FOUNDATIONS
- Color styles (backgrounds, brand, text, semantic)
- Text styles (all typography levels)
- Effect styles (shadows, glows)

PAGE 2: COMPONENTS
1. AI Orb (sizes: large/medium/mini, states: idle/listening/processing/speaking/error)
2. Buttons (variants: primary/secondary/ghost/icon, sizes: large/medium/small)
3. Task Card (states: default/completed/overdue/AI-suggested/pressed/recurring/calendar-synced)
4. Stats Card (variants: basic/with-icon/highlighted)
5. Context Cards (types: today/streak/challenge/calendar)
6. Input Fields (text, search, dual-input)
7. Filter Tabs
8. List Items
9. Badges (count, status, category, lock, recurring)
10. Modals (bottom-sheet, center, unlock, celebration, quick-capture)
11. Progress Bars
12. iOS Widgets (small, medium, large)
13. Onboarding Screens
14. Daily Brief Notification

PAGE 3: SCREENS
- AI Home (complete with all components + text input)
- Tasks View (with swipe peek)
- Social View (with swipe peek)
- Profile View (with swipe peek)
- Focus Modal
- Task Detail Modal
- Unlock Celebration Modal
- Onboarding Flow (4 screens)
- Quick Capture Sheet

All on iPhone 15 Pro (393 × 852px)
```

---

# SECTION 13: DUAL INPUT UI

> Voice-first doesn't mean voice-only. Users need both options.

## 13.1 AI Home Text Input Field

### Collapsed State (Default)
```
Position: Below AI message, above quick actions
Width: 100% - 40px (20px margins)
Height: 48px
Background: #1C1C1E
Border Radius: 24px (pill shape)
Border: 1px solid #2C2C2E

Layout:
┌──────────────────────────────────────────────────┐
│  🎤  │  Type or tap orb to speak...        │ ⌨️ │
└──────────────────────────────────────────────────┘

Left Icon: Microphone (20px), #71717A
Placeholder: "Type or tap orb to speak...", 15px #52525B
Right Icon: Keyboard hint (16px), #52525B

On Tap: Expands to active state, keyboard appears
```

### Active State (Expanded)
```
Height: 56px (grows slightly)
Background: #161616
Border: 1px solid #7C3AED (purple focus)
Glow: 0 0 0 3px rgba(124,58,237,0.15)

Layout:
┌──────────────────────────────────────────────────┐
│  Add a task, ask a question...              ➤   │
└──────────────────────────────────────────────────┘

Placeholder: "Add a task, ask a question...", 17px #52525B
Send Button: 32px circle, #7C3AED, arrow.up icon
- Appears when text.length > 0
- Disabled state: #3F3F46 background

Multiline: Grows to max 120px (3 lines)
Max Characters: 500
```

### AI Streaming Response
```
Position: Below input, replaces AI message area
Animation: Characters appear one by one (typewriter effect)
Speed: 30ms per character
Cursor: Blinking purple line at end

Container:
- Background: transparent
- Max height: 200px (scrollable if longer)
- Text: body (17px), #A1A1AA

States:
- Streaming: Blinking cursor, text appearing
- Complete: Cursor fades, full response visible
- Error: Red text, retry button
```

### Dual Input Design Prompt
```
Design dual input system for AI Home screen.

COLLAPSED INPUT BAR:
- Pill shape, 48px height
- Mic icon left, keyboard hint right
- Placeholder: "Type or tap orb to speak..."
- Background: #1C1C1E

ACTIVE INPUT:
- 56px height, purple border with glow
- Send button appears (purple circle, arrow icon)
- Multiline support up to 3 lines
- Keyboard visible

STREAMING RESPONSE:
- Text appears character by character
- Blinking cursor
- Below input field
- Smooth animation

Show: collapsed → tap → active → typing → send → streaming response
```

---

# SECTION 14: CALENDAR & RECURRING TASKS

## 14.1 Calendar Event Card

### Synced Calendar Event
```
Width: 100% - 40px
Height: Auto (min 72px)
Background: #161616
Border Radius: 14px
Left Border: 3px solid #3B82F6 (info blue)

Layout:
┌─────────────────────────────────────────────────────┐
│  📅  Team Standup                          Synced  │
│      10:00 AM - 10:30 AM · Google Calendar         │
│      Conference Room A                              │
└─────────────────────────────────────────────────────┘

Icon: Calendar (20px), #3B82F6
Title: body-medium (17px/500), #FFFFFF
Time Range: subhead (15px), #71717A
Source: caption-1 (12px), #3B82F6, shows calendar name
Location: caption-1 (12px), #71717A (optional)
Badge: "Synced" - caption-2, #3B82F6, top right

Read-only: No checkbox (events can't be "completed")
Tap action: Opens native calendar app
```

### Calendar Integration Banner
```
Position: Top of Tasks screen (when not connected)
Height: 64px
Background: linear-gradient(90deg, #3B82F615 0%, #16161600 100%)
Border: 1px solid #3B82F630
Border Radius: 14px

Content:
- Icon: calendar.badge.plus (24px), #3B82F6
- Text: "Connect your calendar to see events here"
- Button: "Connect" - ghost style, #3B82F6
```

## 14.2 Recurring Task Indicator

### Visual Treatment
```
Indicator Icon: arrow.clockwise SF Symbol
Size: 14px
Color: #A78BFA
Position: Right side of task card, aligned with metadata

Recurrence Badge (in task detail):
- Background: #A78BFA15
- Text: "Repeats daily" / "Every Monday" / "Monthly on 15th"
- Style: caption-1 (12px), #A78BFA
- Border Radius: 6px
- Padding: 4px 8px
```

### Recurring Task Card
```
┌─────────────────────────────────────────────────────┐
│  ○  Morning meditation                         🔄  │
│     8:00 AM · Health · ~15 min                     │
└─────────────────────────────────────────────────────┘

🔄 = arrow.clockwise icon indicating recurrence
On long press: Show "Edit series" or "Edit this occurrence" options
```

### Recurrence Selector (in Task Creation)
```
Position: Below due date picker
Style: Segmented control + custom option

Options:
┌────────────────────────────────────────────────┐
│ None │ Daily │ Weekly │ Monthly │ Custom ▼    │
└────────────────────────────────────────────────┘

Custom Modal:
- Repeat every: [1-99] [days/weeks/months/years]
- On: [day selector for weekly]
- Ends: Never / After X occurrences / On date
```

---

# SECTION 15: iOS WIDGETS

## 15.1 Small Widget (158×158 points)

### Today's Tasks Widget
```
┌─────────────────────────────────────┐
│  Mylo                           🟣  │  Header: 10px, #71717A, mini orb 16px
│─────────────────────────────────────│
│  3 tasks today                      │  Count: 17px bold white
│                                     │
│  ○ Review brief                     │  Task 1: 13px #FFFFFF
│  ○ Team call                        │  Task 2: 13px #FFFFFF
│  ○ +1 more                          │  Overflow: 13px #71717A
│                                     │
│  ████████░░░░░  60%                 │  Progress bar: 4px, brand gradient
└─────────────────────────────────────┘

Background: #0D0D0D
Border Radius: 22px (widget standard)
Padding: 12px
Tap action: Opens Mylo app
```

### Streak Widget
```
┌─────────────────────────────────────┐
│                                     │
│            🔥                       │  Icon: 32px centered
│            47                       │  Number: 28px bold white
│         day streak                  │  Label: 13px #71717A
│                                     │
│  Mylo                               │  Branding: 10px #52525B, bottom left
└─────────────────────────────────────┘

Background: Gradient overlay on #0D0D0D
- linear-gradient(180deg, rgba(124,58,237,0.15) 0%, transparent 60%)
```

## 15.2 Medium Widget (338×158 points)

### Tasks + Focus Widget
```
┌───────────────────────────────────────────────────────────────────────────┐
│  Mylo                                                            🟣       │
│───────────────────────────────────────────────────────────────────────────│
│                                        │                                  │
│  Today                                 │  Focus Today                     │
│  3 tasks remaining                     │  2h 15m                          │
│                                        │                                  │
│  ○ Review project brief                │  ████████████░░░░  75%           │
│  ○ Team standup                        │  Goal: 3 hours                   │
│  ○ Submit report                       │                                  │
│                                        │  ▶ Start Focus                   │
│                                        │                                  │
└───────────────────────────────────────────────────────────────────────────┘

Left Section: Tasks list (max 3)
Right Section: Focus stats + button
Divider: 1px #2C2C2E vertical line
Button: Ghost style, tappable to start focus
```

## 15.3 Large Widget (338×354 points)

### Daily Overview Widget
```
┌───────────────────────────────────────────────────────────────────────────┐
│  Mylo · Monday, Jan 15                                          🟣       │
│───────────────────────────────────────────────────────────────────────────│
│                                                                           │
│  Good morning! You have 5 tasks today.                                   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ MORNING                                                              │ │
│  │  ○ Review project brief              9:00 AM                        │ │
│  │  ○ Team standup                      10:00 AM                       │ │
│  │ AFTERNOON                                                            │ │
│  │  ○ Submit weekly report              2:00 PM                        │ │
│  │  ○ Gym session                       5:00 PM                        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │   5     │  │  🔥47   │  │  2.3h   │  │  #2     │                      │
│  │  tasks  │  │  streak │  │  focus  │  │  rank   │                      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘                      │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

Header: Date + mini orb
AI Greeting: Contextual message
Tasks: Grouped by time of day (max 4 visible)
Stats Row: 4 mini stat cards at bottom
```

## 15.4 Lock Screen Widget

### Circular Accessory
```
┌─────┐
│  3  │  Number: 17px bold white
│tasks│  Label: 8px #71717A
└─────┘

Size: 58×58 points
Background: Frosted glass (system)
```

### Rectangular Accessory
```
┌─────────────────────────┐
│ 🔥 47 days  │  3 tasks  │
└─────────────────────────┘

Size: 160×58 points
Two sections with divider
```

---

# SECTION 16: ONBOARDING FLOW

## 16.1 Welcome Screen (1 of 4)

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│            ┌───────┐                │
│            │       │                │  Large orb: 200px
│            │  ORB  │                │  Animated idle state
│            │       │                │
│            └───────┘                │
│                                     │
│         Welcome to Mylo             │  title-1 (28px), white
│                                     │
│    Your AI-powered life organizer   │  body (17px), #A1A1AA
│    that learns and grows with you   │
│                                     │
│                                     │
│        ┌────────────────────┐       │
│        │   Get Started      │       │  Primary button
│        └────────────────────┘       │
│                                     │
│          Already have account?      │  Ghost link, 15px #A78BFA
│                                     │
│              ● ○ ○ ○                │  Page indicator
└─────────────────────────────────────┘

Background: #000000
Orb: Calm pulsing animation
```

## 16.2 Voice Introduction (2 of 4)

```
┌─────────────────────────────────────┐
│                                     │
│            ┌───────┐                │
│            │  ORB  │                │  120px orb, listening animation
│            └───────┘                │
│                                     │
│          Talk or Type               │  title-2 (22px), white
│                                     │
│    "Add gym tomorrow at 5pm"        │  Example in quotes
│                                     │
│    Tap the orb to speak, or type    │  body, #A1A1AA
│    below. I understand natural      │
│    language — no special commands   │
│    needed.                          │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ 🎤  Try saying something...    │ │  Demo input field
│  └────────────────────────────────┘ │
│                                     │
│        ┌────────────────────┐       │
│        │     Continue       │       │
│        └────────────────────┘       │
│                                     │
│              ○ ● ○ ○                │
└─────────────────────────────────────┘
```

## 16.3 Navigation Tutorial (3 of 4)

```
┌─────────────────────────────────────┐
│                                     │
│  ← Tasks                   Social → │  Animated hint arrows
│                                     │
│             ↑ Focus                 │
│                                     │
│                                     │
│            ┌───────┐                │
│            │  ORB  │                │  64px orb, centered
│            └───────┘                │
│                                     │
│                                     │
│            ↓ Profile                │
│                                     │
│       Navigate with Swipes          │  title-2, white
│                                     │
│    Swipe in any direction from      │  body, #A1A1AA
│    the home screen to access        │
│    different areas. No tapping      │
│    through menus.                   │
│                                     │
│        ┌────────────────────┐       │
│        │    Try it Out      │       │  User can practice swipes
│        └────────────────────┘       │
│                                     │
│              ○ ○ ● ○                │
└─────────────────────────────────────┘

Arrows: Animated pulsing, pointing outward
Interactive: Let user try one swipe before continuing
```

## 16.4 AI Learning Introduction (4 of 4)

```
┌─────────────────────────────────────┐
│                                     │
│     ┌─────┐  ┌─────┐  ┌─────┐      │
│     │ 🔒 │  │ 🔒 │  │ 🔒 │       │  Locked abilities (3 cards)
│     │Day 3│  │Day 7│  │Day14│      │  Faded, with lock icons
│     └─────┘  └─────┘  └─────┘      │
│                                     │
│           ⚡ Unlocking              │  Lightning bolt animated
│                                     │
│      I Get Smarter Over Time        │  title-2, white
│                                     │
│    Use Mylo daily to unlock new     │  body, #A1A1AA
│    AI abilities. I'll learn your    │
│    patterns and help you become     │
│    more productive.                 │
│                                     │
│    Available now:                   │
│    ✓ Task creation & management     │  Checklist of initial features
│    ✓ Focus timer                    │
│    ✓ Basic AI assistance            │
│                                     │
│        ┌────────────────────┐       │
│        │   Let's Begin!     │       │
│        └────────────────────┘       │
│                                     │
│              ○ ○ ○ ●                │
└─────────────────────────────────────┘

Animation: Lock cards shake slightly, hinting at unlocking
```

---

# SECTION 17: QUICK CAPTURE

## 17.1 Quick Capture Floating Button

### Position & Style
```
Position: Bottom-right, 20px from edges, above safe area
Size: 56×56px
Shape: Circle
Background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)
Shadow: 0 4px 14px rgba(124,58,237,0.4)
Icon: plus (24px), white

Animation:
- Idle: Subtle breathing scale (1.0 → 1.02 → 1.0, 3s loop)
- Tap: Scale 0.9 → 1.0, haptic feedback

Visibility:
- Hidden during: Focus mode, onboarding, modals open
- Visible on: AI Home, Tasks, Profile
```

## 17.2 Quick Capture Sheet

### Bottom Sheet Layout
```
┌─────────────────────────────────────┐
│           ────────                  │  Drag handle
│                                     │
│      Quick Add                      │  title-3 (20px), white
│                                     │
│  ┌────────────────────────────────┐ │
│  │ What do you need to do?        │ │  Multiline input, auto-focus
│  │                                │ │  56px min height, grows
│  │                             ➤  │ │  Send button when has text
│  └────────────────────────────────┘ │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐ │  Quick action chips
│  │Today │ │ 🔔   │ │ 🏷️  │ │ 🎤 │ │
│  └──────┘ └──────┘ └──────┘ └────┘ │
│                                     │
│  Today = Set due today              │
│  🔔 = Add reminder                  │
│  🏷️ = Add category                 │
│  🎤 = Switch to voice input         │
│                                     │
└─────────────────────────────────────┘

Height: Dynamic (keyboard + content)
Background: #0D0D0D
Top Corners: 28px radius
Input: Auto-focused, keyboard appears immediately
```

### Quick Action Chips
```
Style: Small button (32px height)
Background: #1C1C1E
Border Radius: 16px
Text/Icon: 14px, #A1A1AA
Selected: Background #7C3AED, text white

Chips:
- "Today" - Sets due date to today
- Bell icon - Opens time picker for reminder
- Tag icon - Shows category picker
- Mic icon - Activates voice input
```

### Smart Parse Preview
```
As user types, show AI interpretation below input:

User types: "Call mom tomorrow at 3pm"

Preview:
┌────────────────────────────────────┐
│ 📝 Call mom                        │  Parsed task title
│ 📅 Tomorrow, 3:00 PM               │  Parsed date/time
│ 🔔 Reminder at 3:00 PM             │  Auto-suggested reminder
└────────────────────────────────────┘

Style: 13px, #71717A, with colored icons
Animation: Fade in as parsing completes (200ms)
```

---

# SECTION 18: DAILY BRIEF & NOTIFICATIONS

## 18.1 Daily Brief Notification

### Rich Notification (iOS)
```
┌───────────────────────────────────────────────────────────────┐
│  Mylo                                           8:00 AM       │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Good morning! Here's your day:                                │
│                                                                 │
│  📋 5 tasks · 🔥 47 day streak · ⏱️ 2.5h estimated            │
│                                                                 │
│  Top priority: Review project brief (9 AM)                     │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  View Day   │  │ Start Focus │  │   Snooze    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└───────────────────────────────────────────────────────────────┘

Actions:
- View Day: Opens app to Tasks view
- Start Focus: Opens app directly to Focus mode
- Snooze: Reschedules notification for 1 hour later
```

### In-App Daily Brief Card

```
Position: Top of AI Home, dismissible
Width: 100% - 40px
Background: linear-gradient(135deg, #1C1C1E 0%, #161616 100%)
Border: 1px solid #2C2C2E
Border Radius: 14px

Layout:
┌─────────────────────────────────────────────────────────────┐
│  ☀️ Good morning, Alex!                              ✕      │
│                                                              │
│  Today: 5 tasks · 2.5 hours estimated                       │
│                                                              │
│  🔥 47 day streak! Keep it going.                           │
│                                                              │
│  💡 Tip: Your peak hours are 9-11 AM. Schedule important    │
│     work then.                                               │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  See Full Plan  │  │   Dismiss       │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘

Dismiss: X button top right, or swipe up
Persists: Until dismissed or user views tasks
AI Tip: Personalized based on user patterns (unlocks at Day 7)
```

## 18.2 Push Notification Styles

### Task Reminder
```
┌───────────────────────────────────────────────┐
│  Mylo                              now        │
│  ⏰ Reminder: Team standup in 15 minutes      │
│  Don't forget your 10 AM meeting              │
└───────────────────────────────────────────────┘
```

### Streak Warning
```
┌───────────────────────────────────────────────┐
│  Mylo                              6:00 PM    │
│  🔥 Don't break your 47-day streak!           │
│  Complete a task before midnight to keep it   │
└───────────────────────────────────────────────┘
```

### Achievement Unlock
```
┌───────────────────────────────────────────────┐
│  Mylo                              just now   │
│  🎉 New AI Ability Unlocked!                  │
│  "Peak Hours Detection" - Tap to see          │
└───────────────────────────────────────────────┘
```

### Challenge Update
```
┌───────────────────────────────────────────────┐
│  Mylo                              2:30 PM    │
│  🏆 Sarah just passed you in "7-Day Workout"! │
│  You're now in 3rd place. Time to catch up!  │
└───────────────────────────────────────────────┘
```

---

# SECTION 19: CELEBRATION SYSTEM

## 19.1 Achievement Celebration Modal

### Layout
```
┌─────────────────────────────────────┐
│                                     │
│        ✨ 🎊 ✨ 🎉 ✨                │  Confetti burst (50-80 particles)
│                                     │
│            ┌─────┐                  │
│            │ 🏆  │                  │  Icon: 48px in 80px circle
│            └─────┘                  │  Circle: #7C3AED20, purple glow
│                                     │
│        Achievement Unlocked!        │  title-2 (22px), white
│                                     │
│          Week Warrior               │  title-3 (20px), #A78BFA
│                                     │
│   You completed all tasks for 7     │  body (17px), #A1A1AA
│   days straight! Your consistency   │  Max width 280px, centered
│   is impressive.                    │
│                                     │
│          +500 XP earned             │  XP badge: 15px #EAB308
│                                     │
│      ┌────────────────────┐         │
│      │    Celebrate!      │         │  Primary button
│      └────────────────────┘         │
│                                     │
│         Share Achievement →         │  Ghost link
│                                     │
└─────────────────────────────────────┘

Confetti Colors: #7C3AED, #A78BFA, #EAB308, #FFFFFF
Animation Duration: 3 seconds
Modal Entry: Scale 0.8 → 1.0 with spring easing
```

## 19.2 Streak Milestone Celebration

### Special Treatment for Milestones (7, 14, 30, 50, 100, 365 days)
```
Background: Animated gradient (slow rotation)
- Colors: #7C3AED → #9333EA → #A78BFA → #7C3AED

Icon: Larger (64px), animated bounce
Number: display-large (48px), white, with glow

Special Confetti:
- More particles (100+)
- Includes flame emoji particles
- Longer duration (5 seconds)

Sound: Achievement chime (if enabled)
Haptic: Success pattern (triple tap)
```

## 19.3 Task Completion Micro-Celebration

### Checkbox Animation
```
On complete:
1. Checkbox fills with green (#22C55E), 100ms
2. Checkmark draws in (SVG path animation), 200ms
3. Small burst of 5-8 particles from checkbox
4. Particles: 4px circles, green + white
5. Scale pulse on card (1.0 → 1.02 → 1.0), 150ms
6. Haptic: Light success tap

No modal - just satisfying micro-feedback
```

### Streak Continuation (Daily)
```
When completing first task of the day that continues streak:

Toast Notification (top):
┌─────────────────────────────────────┐
│  🔥 Day 48! Streak continues        │
└─────────────────────────────────────┘

Duration: 2 seconds
Animation: Slide in from top, fade out
Haptic: Light double tap
```

## 19.4 XP Gain Animation

### Floating XP Numbers
```
Position: Originates from completed task/action
Animation:
1. "+25 XP" appears at task position
2. Floats upward 60px over 800ms
3. Fades out during last 200ms
4. Curves slightly toward top-right (where XP counter is)

Style:
- Font: caption-1 (12px) bold
- Color: #EAB308 (gold)
- Shadow: 0 2px 4px rgba(0,0,0,0.3)
```

### XP Counter Update
```
Position: Profile screen or mini display in header

When XP gained:
1. Counter highlights (background pulses #EAB30826)
2. Number counts up smoothly (200ms)
3. Small +amount appears next to it briefly
4. Highlight fades (300ms)
```

## 19.5 Level Up Celebration

### Full Screen Takeover
```
Trigger: When XP crosses level threshold

Animation Sequence:
1. Screen dims (backdrop 80% black)
2. Level badge flies to center (spring animation)
3. Burst of particles from badge
4. "LEVEL UP!" text appears (scale + fade)
5. New level number counts from old to new
6. Unlocked perks list fades in
7. "Continue" button appears

Duration: ~4 seconds before interactive
Skip: Tap anywhere to fast-forward

Sound: Level up chime
Haptic: Heavy success pattern
```

---

# APPENDIX: NEW FEATURE SUMMARY

All new competitive features now have complete design specifications:

| Feature | Section | Status |
|---------|---------|--------|
| Dual Input (Voice + Text) | Section 13 | ✅ Complete |
| Calendar Event Cards | Section 14.1 | ✅ Complete |
| Recurring Task Indicators | Section 14.2 | ✅ Complete |
| iOS Widgets (S/M/L/Lock) | Section 15 | ✅ Complete |
| Onboarding Flow (4 screens) | Section 16 | ✅ Complete |
| Quick Capture Sheet | Section 17 | ✅ Complete |
| Daily Brief Notification | Section 18.1 | ✅ Complete |
| Push Notification Styles | Section 18.2 | ✅ Complete |
| Celebration System | Section 19 | ✅ Complete |
| AI Streaming Response | Section 13.1 | ✅ Complete |

---

This specification document is now fully aligned with the Architecture Plan and Implementation Guide, providing pixel-perfect design guidance for all core and new competitive features.

---

This specification document now provides complete design coverage including gesture navigation, voice UI states, haptic feedback, context cards, progressive unlocks, and all interactive states. All elements are aligned with the Architecture Plan and Implementation Guide.
