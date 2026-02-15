# MYPA UI Redesign Plan — Light Mode + Consistent Design

## Overview

Unify all screens to a clean light-mode design inspired by Apple Health/Fitness, Things 3, and Notion Calendar. Swap swipe directions, consolidate the dual dark/light color system into one cohesive light theme, and elevate the AI Hub into a premium immersive experience with glass morphism.

## Current State

| Screen | Current Theme | Background | Styling Method |
|--------|--------------|------------|----------------|
| AI Hub | DARK — aurora mesh | `#000` + animated aurora | StyleSheet.create |
| Tasks | LIGHT | `#F5F5F7` | Inline styles |
| Social | LIGHT | `#F5F5F7` | Inline styles |
| Profile | DARK | NativeWind dark classes | NativeWind |
| Focus Modal | DARK | `#0a0a0f` | StyleSheet.create |
| Login | DARK — gradient | `#0A0A1A` → `#000` | NativeWind |

**Problems:**
- Two conflicting themes (dark Hub/Profile/Focus vs light Tasks/Social)
- Colors defined inline in each screen — no shared tokens
- No consistent component patterns (pills, cards, buttons differ per screen)
- Swipe directions feel backwards (Tasks on left, Social on right)

## Target State

All screens use a **unified light theme** with one shared color palette. AI Hub gets a premium light glassmorphic design. Login stays dark (brand first-impression). Swipe directions swapped to feel natural.

---

## Step 1: Swap Swipe Navigation Directions

**File:** `frontend/src/navigation-v2/SwipeNavigator.tsx`

### Current Layout
```
[Tasks ← LEFT]  [AI Hub CENTER]  [Social → RIGHT]
```
- Swipe LEFT from Hub → Tasks
- Swipe RIGHT from Hub → Social

### New Layout
```
[Social ← LEFT]  [AI Hub CENTER]  [Tasks → RIGHT]
```
- Swipe LEFT from Hub → Tasks (finger goes left, screen slides to reveal Tasks on right)
- Swipe RIGHT from Hub → Social (finger goes right, screen slides to reveal Social on left)

### Changes Required
- Swap `LEFT_SCREEN` and `RIGHT_SCREEN` position constants
- Swap screen component assignments (Tasks renders at right position, Social at left)
- Update `SwipeIndicators` labels (left arrow = "Social", right arrow = "Tasks")
- Update `navigateToScreen` voice handler mapping
- Update `ScreenContextBridge` screen detection for translateX direction

### Verification
- [ ] Swipe left from Hub → Tasks screen appears
- [ ] Swipe right from Hub → Social screen appears
- [ ] Swipe down from Hub → Profile (unchanged)
- [ ] Swipe up from Hub → Focus (unchanged)
- [ ] Voice "show me my tasks" navigates correctly
- [ ] Voice "navigate to challenges" navigates correctly

---

## Step 2: Create Unified Light-Mode Design Tokens

**Files:**
- `frontend/src/styles/colors.ts` — replace dark tokens with light
- `frontend/src/styles/theme.ts` — NEW: central theme object
- `frontend/tailwind.config.js` — update Tailwind colors

### Color Palette

#### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `bg.primary` | `#F8F8FA` | Main screen background |
| `bg.secondary` | `#F2F2F7` | Grouped section background |
| `bg.card` | `#FFFFFF` | Card surfaces |
| `bg.elevated` | `#FFFFFF` | Modals, sheets |
| `bg.input` | `#F2F2F7` | Text inputs |
| `bg.hover` | `#E8E8ED` | Pressed states |

#### Brand (unchanged)
| Token | Hex | Usage |
|-------|-----|-------|
| `brand.primary` | `#7C3AED` | CTAs, active states, accent |
| `brand.secondary` | `#A78BFA` | Secondary accent |
| `brand.tertiary` | `#C4B5FD` | Subtle accent |
| `brand.muted` | `#F5F0FF` | Light purple background |
| `brand.surface` | `#EDE5FF` | Purple tinted surface |

#### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `text.primary` | `#1C1C1E` | Primary text |
| `text.secondary` | `#48484A` | Secondary text |
| `text.tertiary` | `#8E8E93` | Hints, captions |
| `text.disabled` | `#C7C7CC` | Disabled text |
| `text.inverse` | `#FFFFFF` | Text on dark/brand bg |

#### Borders & Dividers
| Token | Hex | Usage |
|-------|-----|-------|
| `border.primary` | `#E5E5EA` | Card borders |
| `border.secondary` | `#F2F2F7` | Subtle dividers |
| `border.focus` | `#7C3AED` | Focus ring |

#### Semantic (unchanged)
| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#34C759` | Completed, positive |
| `warning` | `#FF9F0A` | Caution, streak |
| `error` | `#FF3B30` | Error, destructive |
| `info` | `#007AFF` | Info, links |

#### Shadows (light mode)
| Token | Value |
|-------|-------|
| `shadow.sm` | `0 1px 3px rgba(0,0,0,0.08)` |
| `shadow.md` | `0 4px 12px rgba(0,0,0,0.08)` |
| `shadow.lg` | `0 8px 24px rgba(0,0,0,0.12)` |
| `shadow.purple` | `0 4px 14px rgba(124,58,237,0.15)` |

### Component Tokens

#### Pills / Chips
```
height: 36px
paddingHorizontal: 16px
borderRadius: 9999 (full)
fontSize: 14px, fontWeight: 600
active: { bg: brand.primary, text: white }
inactive: { bg: bg.secondary, text: text.secondary, border: border.primary }
```

#### Cards
```
backgroundColor: bg.card
borderRadius: 16px
padding: 16px
shadow: shadow.md
border: none (shadow provides separation)
```

#### Floating Action Button
```
size: 56px
borderRadius: 28px (circle)
backgroundColor: brand.primary
shadow: shadow.purple
icon: white, 24px
position: bottom-right, 24px from edges
```

#### Section Headers
```
fontSize: 13px
fontWeight: 600
textTransform: uppercase
letterSpacing: 0.5
color: text.tertiary
paddingHorizontal: 16px
marginBottom: 8px
```

---

## Step 3: Redesign AI Hub (Premium Light Glassmorphic)

**File:** `frontend/src/screens-v2/AIHub/AIHubScreen.tsx`

### Design Inspiration
- Apple Weather app (layered cards on gradient)
- Notion Calendar (clean, minimal, functional)
- Arc browser (floating panels, glass morphism)

### Background
- Soft animated gradient: white → lavender (`#F5F0FF`) → light blue (`#EFF6FF`)
- Subtle purple aurora wisps at 10% opacity (reuse LivingBackground with light mode colors)
- The background gently shifts based on time of day:
  - Morning: warm peach tint
  - Afternoon: neutral white
  - Evening: soft lavender

### Layout (top → bottom)

#### Header Area
```
┌─────────────────────────────────────┐
│ Good evening, Khalid        🔔     │  ← greeting (22px bold) + notification bell
│ Saturday, Feb 15                    │  ← date (15px, text.tertiary)
└─────────────────────────────────────┘
```

#### Smart Briefing Card (below header, collapsible)
```
┌─────────────────────────────────────┐
│ 📋 Daily Briefing                 ▾ │  ← frosted glass card, tap to expand
│                                     │
│ You have 3 tasks today.            │  ← briefing text (when expanded)
│ No overdue items — nice work!      │
└─────────────────────────────────────┘
```
- Frosted white glass: `rgba(255,255,255,0.85)`, blur 20, border `rgba(255,255,255,0.5)`
- Collapsed: pill shape showing "3 tasks today • 5-day streak 🔥"
- Expanded: full briefing text

#### Center — Voice Interaction Zone (flex: 1)

**Idle State:**
```
         ┌──────────────────┐
         │                  │
         │    ◉ mic icon    │  ← 64px, purple, gentle pulse
         │                  │
         │  Tap to talk     │  ← 15px, text.tertiary
         │  to MYPA         │
         └──────────────────┘
```
- Clean white space, minimal
- Mic icon floats with subtle breathing animation
- Purple gradient ring around mic icon

**Listening State:**
```
┌─────────────────────────────────────┐
│                                     │
│     ████ ██████ ████ ██████        │  ← audio waveform bars (purple)
│                                     │
│  "Make me a gym schedule..."       │  ← transcript (20px, text.primary)
│                                     │
│           Cancel                    │  ← text button
└─────────────────────────────────────┘
```
- Waveform bars react to audioLevel
- Transcript appears live below waveform

**Speaking State (AI responding):**
```
┌─────────────────────────────────────┐
│  ✨                                 │  ← sparkle icon, pulsing
│                                     │
│  "Done! I've added your gym        │  ← AI response (18px, text.primary)
│   schedule across the week."       │
│                                     │
└─────────────────────────────────────┘
```
- Frosted card wraps the AI response
- Sparkle icon pulses while speaking

#### Quick Actions Row (above bottom bar)
```
┌──────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐
│🎯 Focus│ │➕ Add Task│ │🧠 Smart Sort│ │⏰ Reminders│
└──────┘ └──────────┘ └───────────┘ └──────────┘
```
- Horizontal ScrollView of pill chips
- Each pill: white bg, border, icon + label
- Active/pressed: purple fill, white text
- Locked pills show lock icon + level badge

#### Ambient Stats Bar (very bottom, above safe area)
```
│  📋 3 tasks  •  🔥 5-day streak  •  ⭐ Level 3  │
```
- 13px, text.tertiary, centered
- Subtle divider above

### Voice Active Overlay
When voice is active, the center section expands and the quick actions / stats hide. The entire interaction feels like a **conversation bubble** floating on the gradient background.

---

## Step 4: Polish Tasks Screen

**File:** `frontend/src/screens-v2/TasksView/TasksViewScreen.tsx`

### Changes
- Replace all inline color constants with shared theme tokens
- Date filter: pill chips (rounded-full) in horizontal scroll
  - Selected: `brand.primary` bg, white text
  - Unselected: `bg.secondary` bg, `text.secondary` text, `border.primary` border
- Task cards: white bg, 16px radius, `shadow.sm`, no border
- Section headers: uppercase 13px, `text.tertiary`, 0.5 letter spacing
- Swipe actions:
  - Swipe RIGHT → Complete (green bg, checkmark icon)
  - Swipe LEFT → Defer (blue bg, calendar icon)
- Floating "+" button: bottom-right, 56px circle, `brand.primary`, `shadow.purple`
- Priority indicator: 4px left border on task card (colored by priority)
- Checkbox: rounded circle, unchecked = `border.primary`, checked = `brand.primary` fill + white checkmark
- Empty state: centered illustration + "All clear! 🎉" text

---

## Step 5: Polish Social Screen

**File:** `frontend/src/screens-v2/SocialView/SocialViewScreen.tsx`

### Changes
- Replace inline colors with theme tokens
- Stats banner at top: 3 stat cards in row, white bg, shadow, icon + number + label
- Circle cards: white bg, 16px radius, shadow
  - Avatar stack (overlapping circles, max 4 + "+N")
  - Circle name (17px bold)
  - Member count pill
  - Active challenge progress bar (purple)
- Challenge cards: Apple Fitness ring style
  - Circular progress ring (purple gradient)
  - Challenge name + days remaining
  - Participant avatars
- Floating "Create" button: bottom-right, same as Tasks FAB
- Empty state: "Better together" illustration + join/create CTAs
- Tab pills at top: "Circles" | "Challenges" (pill toggle)

---

## Step 6: Convert Profile to Light Mode

**File:** `frontend/src/screens-v2/ProfileView/ProfileViewScreen.tsx`

### Changes
- Background: `bg.primary` (`#F8F8FA`)
- Avatar section: centered, 80px avatar with purple border ring, name below (22px bold), level badge pill
- XP progress bar: purple gradient on `bg.secondary` track, "Level 3 — 420/1000 XP" label
- Stats grid (2×2): white cards, shadow, icon + value + label
  - 🔥 Streak: 5 days
  - ✅ Tasks done: 47
  - 🎯 Focus time: 12h
  - 📅 Days active: 23
- AI Features section: grouped iOS-style list
  - Each row: feature name + level requirement + lock/unlock icon + chevron
  - Unlocked: purple checkmark
  - Locked: gray lock + "Level X" badge
- Settings section: grouped iOS-style list
  - Rows: Notifications, Voice Settings, Theme, Language
  - Each row: icon + label + chevron, white bg, `border.secondary` separator
- Upgrade banner (if free tier): purple gradient card, "Upgrade to Pro" CTA
- Sign Out: red text button at bottom

---

## Step 7: Convert Focus Modal to Light Mode

**File:** `frontend/src/screens-v2/FocusModal/FocusModal.tsx`

### Changes
- Background: soft gradient `bg.primary` → `brand.muted` (`#F5F0FF`)
- Duration selector: pill chips in a row (15 / 25 / 45 / 60 min)
  - Selected: `brand.primary` fill, white text
  - Unselected: white bg, `text.secondary`, border
- Timer ring: large circle (200px), purple stroke on light track (`border.secondary`)
  - Time remaining centered inside (48px bold)
  - Task name below ring (if linked to task)
- Controls: Play/Pause as large circle button (56px), purple
- States:
  - **Selecting**: duration pills + "Start Focus" CTA button
  - **Active**: timer ring + pause button + subtle background pulse
  - **Paused**: timer ring paused + resume/end buttons
  - **Completed**: checkmark animation + "25 minutes focused! +50 XP" + confetti

---

## Implementation Order

| # | Step | Priority | Est. Lines Changed |
|---|------|----------|-------------------|
| 1 | Design tokens (Step 2) | 🔴 Highest | ~200 (new file + updates) |
| 2 | Swap navigation (Step 1) | 🔴 High | ~50 |
| 3 | AI Hub redesign (Step 3) | 🔴 High | ~800 (full rewrite) |
| 4 | Tasks polish (Step 4) | 🟡 Medium | ~300 |
| 5 | Social polish (Step 5) | 🟡 Medium | ~250 |
| 6 | Profile light mode (Step 6) | 🟡 Medium | ~400 |
| 7 | Focus light mode (Step 7) | 🟢 Lower | ~200 |

**Rule:** Build tokens first → use tokens in every subsequent step. Never define colors inline again.

## Design Decisions

### AI Hub: Light or Dark?
**Decision: Light glassmorphic** with subtle purple aurora wisps. This gives the premium immersive feel while staying consistent with the light theme. The LivingBackground component gets a "light" mode prop.

### Login: Keep Dark?
**Decision: Yes.** Dark branded login is the industry standard. It sets the brand tone on first launch. The transition from dark login → light app feels intentional (like unlocking the app).

### Component Library
Use the existing shadcn-style primitives in `frontend/src/components/ui/` wherever possible. Card, Button, Badge etc. already exist — just need light theme colors.

### Styling Approach
Standardize on **StyleSheet.create** with theme token imports for all screens. NativeWind classes can remain for simple utility usage but should reference the same token values via Tailwind config.
