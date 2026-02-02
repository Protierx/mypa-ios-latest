# MYPA - Social Productivity Platform

> **AI Agent Quick Reference**: This README contains complete architectural, business logic, and strategic context for MYPA. All formulas, data models, user journeys, and implementation details are documented below.

---

## 📖 Table of Contents

1. [What is MYPA?](#-what-is-mypa)
2. [The Problem & Market Opportunity](#-the-problem--market-opportunity)
3. [How It Works (User Journey)](#-how-it-works-user-journey)
4. [Architecture & Tech Stack](#-architecture--tech-stack)
5. [Database Schema & Data Models](#-database-schema--data-models)
6. [Gamification System (XP, Levels, Streaks)](#-gamification-system)
7. [Social Mechanics (Circles, Assignments, Challenges)](#-social-mechanics)
8. [API Endpoints](#-api-endpoints)
9. [UI/UX Design System](#-uiux-design-system)
10. [Screen Architecture & Navigation](#-screen-architecture--navigation)
11. [AI Features](#-ai-features)
12. [Business Model](#-business-model)
13. [Setup & Development](#-setup--development)
14. [Known Issues & Roadmap](#-known-issues--roadmap)
15. [Code Quality & Audits](#-code-quality--audits)

---

## 🎯 What is MYPA?

**MYPA (Make Your Plan Accountable)** is a social-first productivity app that turns task management into a multiplayer game. Instead of fighting procrastination alone, users join Circles with friends/colleagues, earn XP for completing tasks, and compete in challenges—all powered by AI that learns patterns and coaches in real-time.

### The 30-Second Pitch
*"MYPA is the Strava of productivity. You don't use Todoist because it's lonely. You don't use Habitica because it's childish. MYPA combines the gamification of Duolingo, the social accountability of fitness apps, and AI coaching—making productivity a multiplayer experience."*

### Key Differentiators
- 🎮 **Real-time Gamification** - Variable XP rewards, streak multipliers, instant level-up feedback (dopamine architecture)
- 👥 **Social Accountability Circles** - Share daily cards, assign tasks, compete in challenges (network effects)
- 🤖 **Behavioral AI** - Learns peak hours, procrastination triggers, social dynamics (data moat)
- 🔥 **Streak Addiction Mechanics** - Loss aversion + multipliers = consistent engagement
- 📊 **Social Proof Dashboard** - See when friends complete tasks (competitive drive)

---

## 🚨 The Problem & Market Opportunity

### Why Traditional Productivity Apps Fail

| App | Problem |
|-----|--------|
| **Todoist/Things** | Cold, lonely, no accountability. You vs. your tasks in isolation. |
| **Beeminder** | Punitive, requires money commitment, stressful. |
| **Habitica** | Gamification feels childish (dragons/wizards), not social. |
| **Notion** | Too complex, becomes work itself, no dopamine feedback. |

**Core Insight**: People don't fail at productivity because they lack tools—they fail because they lack **social accountability** and **immediate dopamine feedback**.

### MYPA's Competitive Advantages

1. **Network Effects** (Like Strava)
   - More friends join → More accountability → Harder to quit
   - See friend's 7-day streak → "I should post my card too"

2. **Data Moat**
   - AI learns your patterns over months (peak hours, procrastination triggers)
   - Switching cost: Lose all historical insights and social connections

3. **Viral Loop**
   ```
   You invite friend to Circle → 
   They see your Level 23 + 30-day streak → 
   "How'd you do that?" → 
   They invite their friends → 
   Exponential growth
   ```

4. **Total Addressable Market**
   - Productivity apps: $4.69B (2023)
   - Fitness social apps: $1.1B (Strava, Nike Run Club)
   - **MYPA = Productivity + Social ≈ $5B TAM**

---

## 🔄 How It Works (User Journey)

### The Daily Loop (Core User Flow)

```
1. WAKE UP (8:00 AM)
   ↓
2. HUB: AI Morning Briefing
   "Good morning! 3 tasks today. Peak focus: 9-11am."
   Notification: "Sarah just posted her daily card"
   ↓
3. PLAN: Review Tasks
   - Check assignments from circle
   - AI suggests: "Move coding task to 9am (your peak hour)"
   ↓
4. TASKS: Execute & Earn XP
   - Complete task → +10 XP animation
   - High priority → +20 XP
   - 7-day streak → 1.25x multiplier = +25 XP!
   ↓
5. CIRCLES: Post Daily Card
   "Completed 5/6 tasks today (+67% vs. last week)"
   - Upload gym selfie as proof
   - See Alex completed his workout → 🔥 reaction
   ↓
6. CHALLENGES: Check Leaderboard
   "You're #2 in 'Most Productive Week' challenge"
   Sarah is ahead by 50 XP → competitive drive kicks in
   ↓
7. PROFILE/WALLET: Review Stats
   - XP earned today: +150 XP
   - Level up! Level 12 → 13 (unlock new avatar)
   - Streak maintained: 18 days (1.5x multiplier tomorrow!)
```

### How Screens Interconnect

**HUB (Command Center)**
- Pulls data from: Tasks (today's count), Challenges (active), Circles (new posts), Analytics (trends)
- Pushes to: All screens (it's the dashboard)

**PLAN → TASKS → CIRCLES → CHALLENGES**
- PLAN receives: Assignments from Circles, AI suggestions from Hub
- TASKS sends: Completion data to Profile/Level, Circle feed
- CIRCLES creates: Assignments (for Plan), Challenges (for competition)
- CHALLENGES tracks: Task completion, Focus minutes, Streaks for leaderboards

**Real-time Socket Updates**
- "Sarah completed a task" → Notification in Hub
- "Alex assigned you 'Write report'" → Badge on Plan tab
- "Challenge ending in 1 hour" → Push notification

---

## 🏗️ Architecture & Tech Stack

### Frontend (React Native + TypeScript)

| Category | Technology | Purpose |
|----------|-----------|--------|
| **Framework** | React Native 0.81 | Cross-platform iOS/Android |
| **Build** | Expo 54 | Managed workflow, OTA updates |
| **Language** | TypeScript 5.x | Type safety, better DX |
| **Navigation** | React Navigation 7 | Bottom tabs + native stacks |
| **State** | React Context API + hooks | Auth, user, socket state |
| **Styling** | StyleSheet + LinearGradient | Theme tokens, no CSS-in-JS |
| **Icons** | Lucide React Native | 1000+ icons, tree-shakeable |
| **Real-time** | Socket.io client | Live updates (posts, assignments) |
| **Storage** | AsyncStorage | Offline cache, auth tokens |
| **Notifications** | Expo Notifications | Push notifications |
| **Voice** | Expo Speech | Text-to-speech for AI briefing |

### Backend (Node.js + Express + Prisma)

| Category | Technology | Purpose |
|----------|-----------|--------|
| **Runtime** | Node.js 18+ | Fast, async I/O |
| **Language** | TypeScript 5.x | Shared types with frontend |
| **Framework** | Express 4.x | REST API, middleware |
| **Database** | PostgreSQL 14+ | Relational data, ACID compliance |
| **ORM** | Prisma 5.x | Type-safe queries, migrations |
| **Auth** | JWT | Access + refresh token rotation |
| **Real-time** | Socket.io server | Bi-directional events |
| **AI** | OpenAI API (GPT-4) | Voice commands, daily briefings |
| **Validation** | Express Validator | Request validation middleware |

### Project Structure

```
mypa-ios-latest/
├── frontend/                    # React Native app
│   ├── src/
│   │   ├── screens/            # 26 screens
│   │   │   ├── Hub/            # Dashboard with AI briefing
│   │   │   ├── Plan/           # Weekly task planner
│   │   │   ├── Tasks/          # Task list view
│   │   │   ├── Challenges/     # Active challenges
│   │   │   ├── Circles/        # Circle list & feed
│   │   │   ├── CircleHome/     # Circle detail (modal)
│   │   │   ├── Profile/        # User profile & stats
│   │   │   ├── Wallet/         # XP, level, rewards
│   │   │   ├── Inbox/          # Notifications
│   │   │   ├── Login/          # Auth screens
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── ui/            # 27 design system components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── ...
│   │   │   ├── AnimatedCard.tsx
│   │   │   ├── MYPAOrb.tsx
│   │   │   └── TabBar.tsx
│   │   ├── contexts/          # React Context
│   │   │   ├── AuthContext.tsx
│   │   │   ├── UserContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── services/          # API, Socket, Push
│   │   │   ├── api.ts
│   │   │   ├── socket.ts
│   │   │   └── push.ts
│   │   ├── styles/            # Theme system
│   │   │   ├── colors.ts      # 40+ semantic tokens
│   │   │   ├── theme.ts       # Typography, spacing
│   │   │   └── animations.ts
│   │   └── config/
│   │       └── env.ts         # API URL, keys
│   ├── ios/                   # Native iOS project
│   ├── App.tsx                # Entry point
│   └── package.json
├── backend/                    # Express + Prisma API
│   ├── src/
│   │   ├── routes/            # API endpoints (12 files)
│   │   │   ├── auth.routes.ts
│   │   │   ├── tasks.routes.ts
│   │   │   ├── circles.routes.ts
│   │   │   ├── challenges.routes.ts
│   │   │   ├── assignments.routes.ts
│   │   │   ├── posts.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   ├── ai.routes.ts
│   │   │   └── ...
│   │   ├── services/          # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── task.service.ts
│   │   │   ├── circle.service.ts
│   │   │   ├── challenge.service.ts
│   │   │   ├── ai.service.ts
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── auth.ts        # JWT verification
│   │   │   ├── validation.ts  # Request validation
│   │   │   └── error.ts       # Error handling
│   │   ├── types/
│   │   │   └── index.ts       # Shared types
│   │   ├── utils/
│   │   │   ├── xp.ts          # XP formulas (142 lines)
│   │   │   └── streaks.ts     # Streak logic (208 lines)
│   │   └── config/
│   │       ├── database.ts
│   │       └── env.ts
│   ├── prisma/
│   │   └── schema.prisma      # Database schema (612 lines)
│   └── package.json
├── AUDIT_NAVIGATION_AND_INTERACTIONS.md  # Code review
├── UX_UI_PROD_READINESS_AUDIT.md        # UI/UX audit
└── README.md                              # This file
```

---

## 🗄️ Database Schema & Data Models

> **Location**: `backend/prisma/schema.prisma` (612 lines)

### Core Models

#### User Model
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  username      String?  @unique
  name          String?
  avatarUrl     String?
  bio           String?
  
  // Gamification
  xp            Int      @default(0)
  level         Int      @default(1)
  totalTimeSaved Int     @default(0)  // minutes
  
  // Streaks
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  lastActiveDate DateTime?
  
  // Stats
  tasksCompleted   Int   @default(0)
  focusMinutes     Int   @default(0)
  challengesWon    Int   @default(0)
  
  // Settings
  timezone         String @default("UTC")
  dailyGoalMinutes Int    @default(120)
  isActive         Boolean  @default(true)
  isOnboarded      Boolean  @default(false)
  
  // Relations
  tasks         Task[]
  ownedCircles  Circle[]       @relation("CircleOwner")
  circleMemberships CircleMember[]
  assignmentsCreated Assignment[] @relation("AssignmentCreator")
  assignmentsReceived Assignment[] @relation("AssignmentAssignee")
  posts         Post[]
  challengeParticipations ChallengeParticipant[]
}
```

#### Task Model
```prisma
model Task {
  id          String   @id @default(uuid())
  userId      String
  title       String
  description String?
  
  // Scheduling
  date        String?   // YYYY-MM-DD
  time        String?   // HH:mm
  durationMin Int       @default(30)
  isFixed     Boolean   @default(false)  // time is locked
  
  // Organization
  category    String    @default("Personal")  // Work, Health, Fitness, etc.
  priority    String    @default("NORMAL")    // LOW, NORMAL, HIGH
  tags        String    @default("[]")        // JSON array
  
  // AI
  aiCategorized Boolean @default(false)
  aiSuggestions String?
  
  // Status
  completed   Boolean   @default(false)
  completedAt DateTime?
  xpAwarded   Int       @default(0)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

#### Circle Model
```prisma
model Circle {
  id          String   @id @default(uuid())
  name        String
  description String?
  emoji       String   @default("👥")
  color       String   @default("#8B5CF6")
  ownerId     String
  
  // Settings
  isPrivate   Boolean  @default(false)
  inviteCode  String   @unique  // for joining
  maxMembers  Int      @default(20)
  totalXp     Int      @default(0)  // cumulative
  
  // Relations
  members     CircleMember[]
  assignments Assignment[]
  posts       Post[]
  challenges  Challenge[]
}
```

#### Assignment Model
```prisma
model Assignment {
  id           String    @id @default(uuid())
  circleId     String
  creatorId    String  // who assigned it
  assigneeId   String  // who it's assigned to
  
  title        String
  description  String?
  dueDate      DateTime?
  
  // Proof requirement
  requiresProof   Boolean  @default(false)
  proofImageUrl   String?
  
  // Status: PENDING, ACCEPTED, DECLINED, COMPLETED
  status       String   @default("PENDING")
  acceptedAt   DateTime?
  completedAt  DateTime?
  
  // Gamification
  xpReward     Int      @default(30)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

#### Challenge Model
```prisma
model Challenge {
  id          String   @id @default(uuid())
  circleId    String?  // null = global challenge
  
  title       String
  description String?
  emoji       String   @default("🏆")
  
  // Type: FOCUS_MINUTES, TASKS_COMPLETED, STREAK_DAYS, CUSTOM
  type        String   @default("FOCUS_MINUTES")
  targetValue Int      @default(100)  // e.g., 100 tasks
  
  // Timing
  startsAt    DateTime
  endsAt      DateTime
  
  // Rewards
  xpReward    Int      @default(100)
  isActive    Boolean  @default(true)
  
  // Relations
  participants ChallengeParticipant[]
}
```

#### Post Model (Circle Feed)
```prisma
model Post {
  id        String   @id @default(uuid())
  circleId  String
  authorId  String
  
  // Type: DAILY_CARD, ACHIEVEMENT, MILESTONE, SYSTEM, TEXT
  type      String   @default("DAILY_CARD")
  content   String?
  imageUrl  String?  // proof photo
  
  // Daily Card specific
  tasksCompleted Int?
  focusMinutes   Int?
  streakDay      Int?
  
  createdAt DateTime @default(now())
  
  // Relations
  reactions Reaction[]  // heart, fire, clap emojis
}
```

### Relationships Summary

```
User (1) ←→ (N) Task
User (1) ←→ (N) Circle (as owner)
User (N) ←→ (N) Circle (via CircleMember)
Circle (1) ←→ (N) Assignment
Circle (1) ←→ (N) Post
Circle (1) ←→ (N) Challenge
User (N) ←→ (N) Challenge (via ChallengeParticipant)
Post (1) ←→ (N) Reaction
```

---

## 🎮 Gamification System

> **Implementation**: `backend/src/utils/xp.ts` (142 lines), `backend/src/utils/streaks.ts` (208 lines)

### XP Rewards (Exact Values)

```typescript
export const XP_REWARDS = {
  // Tasks
  TASK_COMPLETE: 10,
  TASK_COMPLETE_HIGH_PRIORITY: 20,
  TASK_COMPLETE_ON_TIME: 5,  // Bonus for completing before due
  
  // Focus
  FOCUS_SESSION_COMPLETE: 15,
  FOCUS_PERFECT_SESSION: 25,  // No pauses, full duration
  
  // Streaks
  STREAK_DAY: 5,
  STREAK_WEEK: 50,
  STREAK_MONTH: 200,
  
  // Social
  CIRCLE_JOIN: 25,
  ASSIGNMENT_COMPLETE: 30,
  CHALLENGE_WIN: 100,
  DAILY_CARD_POST: 10,
  
  // Achievements
  ACHIEVEMENT_UNLOCK: 50,
  
  // Misc
  ONBOARDING_COMPLETE: 50,
  FIRST_TASK: 25,
  BRAIN_DUMP_PROCESS: 5,
};
```

### Level Progression Formula

**Formula**: `XP_required = 100 * (level - 1)^1.5`

```typescript
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

export function calculateLevel(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

export function xpToNextLevel(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  return nextLevelXp - totalXp;
}

export function levelProgress(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  
  const xpInCurrentLevel = totalXp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  
  return Math.floor((xpInCurrentLevel / xpNeededForLevel) * 100);
}
```

**Level Progression Table**:

| Level | Cumulative XP | XP for This Level |
|-------|--------------|------------------|
| 1 | 0 | 0 |
| 2 | 100 | 100 |
| 3 | 283 | 183 |
| 4 | 520 | 237 |
| 5 | 800 | 280 |
| 10 | 2,846 | 692 |
| 20 | 8,932 | 1,848 |
| 50 | 34,271 | 4,822 |

### Streak Multipliers

**Formula**: Multiply base XP by streak multiplier

```typescript
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 2.0;   // Double XP!
  if (streakDays >= 14) return 1.5;   // +50% XP
  if (streakDays >= 7) return 1.25;   // +25% XP
  if (streakDays >= 3) return 1.1;    // +10% XP
  return 1.0;                          // No bonus
}

export function calculateXpWithStreak(baseXp: number, streakDays: number): number {
  const multiplier = getStreakMultiplier(streakDays);
  return Math.floor(baseXp * multiplier);
}
```

**Streak Multiplier Table**:

| Streak Days | Multiplier | Effective XP (for 10 base) |
|------------|-----------|---------------------------|
| 0-2 | 1.0x | 10 XP |
| 3-6 | 1.1x | 11 XP |
| 7-13 | 1.25x | 12 XP |
| 14-29 | 1.5x | 15 XP |
| 30+ | 2.0x | 20 XP |

**Example**:
- Complete high-priority task (base: 20 XP)
- Current streak: 15 days
- Multiplier: 1.5x
- **Total XP**: 20 * 1.5 = **30 XP**

### Streak Logic (Exact Implementation)

**Streak Rules**:
1. Activity = completing at least 1 task OR 1 focus session
2. Streak increments if activity on consecutive days
3. Streak resets to 1 if missed a day
4. Uses user's timezone for "today" calculation

```typescript
export async function checkAndUpdateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  streakUpdated: boolean;
  isNewStreak: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActiveDate: true,
      timezone: true,
    },
  });

  const today = getTodayString(user.timezone);  // YYYY-MM-DD
  const lastActive = user.lastActiveDate?.toISOString().split('T')[0];
  
  // Already active today - no update
  if (lastActive === today) {
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      streakUpdated: false,
      isNewStreak: false,
    };
  }
  
  const yesterday = getYesterdayString(user.timezone);
  
  let newStreak = 1;
  let isNewStreak = false;
  
  if (lastActive === yesterday) {
    // Consecutive day - increment
    newStreak = user.currentStreak + 1;
  } else {
    // Streak broken - reset to 1
    newStreak = 1;
    isNewStreak = true;
  }
  
  const newLongest = Math.max(newStreak, user.longestStreak);
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: new Date(),
    },
  });
  
  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    streakUpdated: true,
    isNewStreak,
  };
}
```

---

## 👥 Social Mechanics

### 1. Accountability Circles

**Purpose**: Social pressure + support = accountability

**Use Cases**:
- **Work**: Remote team tracks daily progress
- **Fitness**: Gym buddies share workout proof photos
- **Study**: Study group assigns reading, tracks completion
- **Friends**: "Morning Warriors" complete tasks before 10am

**How It Works**:
1. **Create Circle**: "Gym Crew" with emoji 💪
2. **Invite Members**: Share invite code or send in-app invites
3. **Post Daily Cards**: Share "5/6 tasks completed today" with gym selfie
4. **React & Engage**: 🔥 reaction = "You crushed it!"
5. **Compete**: See who has longest streak, most XP

**Circle Feed (Real-time via Socket.io)**:
- Sarah posted daily card → Push notification
- Alex completed assignment → Badge on Circles tab
- Challenge ending soon → In-app alert

### 2. Assignments (Delegation as Accountability)

**Purpose**: Turn "Hey, did you do it?" into a gamified system

**Flow**:
```
Boss creates assignment "Write Q4 report" → 
Employee receives notification → 
Employee accepts (+25 XP for accepting) → 
Task added to their Plan → 
Employee completes + uploads proof photo → 
Boss gets notified → 
Employee earns +30 XP → 
Both celebrate 🎉
```

**Assignment States**:
- `PENDING`: Awaiting assignee's response
- `ACCEPTED`: Assignee agreed to do it
- `DECLINED`: Assignee rejected (no penalty)
- `COMPLETED`: Done, XP awarded

**Proof Requirement**:
- `requiresProof: true` → Must upload photo before completion
- Example: Gym trainer assigns workout → Client must upload gym selfie

### 3. Challenges (Competitive Gamification)

**Types**:
1. **TASKS_COMPLETED**: Most tasks completed in 7 days
2. **FOCUS_MINUTES**: Most focus time logged
3. **STREAK_DAYS**: Longest streak maintained
4. **CUSTOM**: Circle-defined goals

**Challenge Lifecycle**:
```
Day 1: Challenge starts, participants join
Day 2-6: Real-time leaderboard updates
  - You: 45 tasks (Rank #2)
  - Sarah: 52 tasks (Rank #1)
  - Alex: 38 tasks (Rank #3)
Day 7: Challenge ends
  - Winner gets +100 XP
  - Top 3 get badges
  - All participants get participation XP
```

**Progress Tracking** (`backend/src/services/challenge.service.ts`):
```typescript
export async function updateChallengeProgress(
  challengeId: string,
  userId: string,
  incrementBy: number
) {
  const participant = await prisma.challengeParticipant.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
  });
  
  const newProgress = participant.progress + incrementBy;
  
  await prisma.challengeParticipant.update({
    where: { id: participant.id },
    data: { progress: newProgress },
  });
  
  // Check if challenge completed
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (newProgress >= challenge.targetValue) {
    await awardChallengeXp(userId, challenge.xpReward);
    await prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: { completedAt: new Date() },
    });
  }
}
```

---

## 📡 API Endpoints

> **Implementation**: `backend/src/routes/*.routes.ts` (12 files)

### Authentication

| Method | Endpoint | Request Body | Response | Notes |
|--------|----------|-------------|----------|-------|
| POST | `/auth/register` | `{ email, password, name }` | `{ user, accessToken, refreshToken }` | Creates user, returns tokens |
| POST | `/auth/login` | `{ email, password }` | `{ user, accessToken, refreshToken }` | Returns JWT tokens |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ accessToken }` | Get new access token |
| POST | `/auth/logout` | `{ refreshToken }` | `{ success: true }` | Invalidates refresh token |
| POST | `/auth/logout-all` | - | `{ success: true }` | Invalidates all user's tokens |

### Users

| Method | Endpoint | Request Body | Response | Notes |
|--------|----------|-------------|----------|-------|
| GET | `/users/me` | - | `{ user }` | Current user profile |
| PATCH | `/users/me` | `{ name?, bio?, avatarUrl? }` | `{ user }` | Update profile |
| DELETE | `/users/me` | - | `{ success: true }` | Soft delete (isActive = false) |
| GET | `/users/me/stats` | - | `{ xp, level, currentStreak, tasksCompleted, ... }` | Gamification stats |
| POST | `/users/me/onboarding` | - | `{ user, xpAwarded: 50 }` | Mark onboarded, +50 XP |
| GET | `/users/:username` | - | `{ user }` | Public profile |

### Tasks

| Method | Endpoint | Query Params | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/tasks` | `?date=2026-01-26&category=Work&completed=false` | - | `{ tasks[] }` |
| POST | `/tasks` | - | `{ title, description?, date?, time?, category?, priority?, durationMin? }` | `{ task }` |
| GET | `/tasks/:id` | - | - | `{ task }` |
| PATCH | `/tasks/:id` | - | `{ title?, description?, date?, time?, ... }` | `{ task }` |
| DELETE | `/tasks/:id` | - | - | `{ success: true }` |
| POST | `/tasks/:id/complete` | - | - | `{ task, xpAwarded, newStreak }` |
| POST | `/tasks/:id/uncomplete` | - | - | `{ task }` |

**Task Completion Logic** (`backend/src/services/task.service.ts`):
```typescript
export async function completeTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  
  // Calculate XP based on priority
  let baseXp = XP_REWARDS.TASK_COMPLETE; // 10
  if (task.priority === 'HIGH') baseXp = XP_REWARDS.TASK_COMPLETE_HIGH_PRIORITY; // 20
  
  // Get user's streak
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const xpWithStreak = calculateXpWithStreak(baseXp, user.currentStreak);
  
  // Update task
  await prisma.task.update({
    where: { id: taskId },
    data: { completed: true, completedAt: new Date(), xpAwarded: xpWithStreak },
  });
  
  // Award XP and update streak
  await addXp(userId, xpWithStreak);
  const streakInfo = await checkAndUpdateStreak(userId);
  
  // Notify circle members (socket.io)
  await notifyCircleMembers(userId, 'task_complete', { taskId, xpAwarded: xpWithStreak });
  
  // Update challenge progress if applicable
  await updateUserChallenges(userId, 'TASKS_COMPLETED', 1);
  
  return { task, xpAwarded: xpWithStreak, ...streakInfo };
}
```

### Circles

| Method | Endpoint | Request Body | Response | Notes |
|--------|----------|-------------|----------|-------|
| GET | `/circles` | - | `{ circles[] }` | User's circles only |
| POST | `/circles` | `{ name, description?, emoji?, color?, isPrivate? }` | `{ circle }` | Creator = owner + member |
| GET | `/circles/:id` | - | `{ circle, members[], posts[] }` | Circle details |
| PATCH | `/circles/:id` | `{ name?, description?, ... }` | `{ circle }` | Admin only |
| DELETE | `/circles/:id` | - | `{ success: true }` | Owner only |
| POST | `/circles/:id/join` | `{ inviteCode }` | `{ circle, member }` | Join via code, +25 XP |
| POST | `/circles/:id/leave` | - | `{ success: true }` | Remove membership |
| GET | `/circles/:id/members` | - | `{ members[] }` | With user profiles |
| DELETE | `/circles/:id/members/:userId` | - | `{ success: true }` | Admin only |

### Assignments

| Method | Endpoint | Request Body | Response | Notes |
|--------|----------|-------------|----------|-------|
| GET | `/assignments` | `?type=sent\|received` | `{ assignments[] }` | Filter by direction |
| POST | `/assignments` | `{ circleId, assigneeId, title, description?, dueDate?, requiresProof?, xpReward? }` | `{ assignment }` | Creates + notifies assignee |
| GET | `/assignments/:id` | - | `{ assignment }` | With creator/assignee profiles |
| POST | `/assignments/:id/accept` | - | `{ assignment }` | Creates task in assignee's plan |
| POST | `/assignments/:id/decline` | - | `{ assignment }` | No penalty |
| POST | `/assignments/:id/complete` | `{ proofImageUrl? }` | `{ assignment, xpAwarded }` | +30 XP (default) |
| POST | `/assignments/:id/submit-proof` | `{ proofImageUrl }` | `{ assignment }` | Upload photo |

### Challenges

| Method | Endpoint | Query Params | Request Body | Response |
|--------|----------|-------------|-------------|----------|
| GET | `/challenges` | `?active=true&circleId=xyz` | - | `{ challenges[] }` |
| POST | `/challenges` | - | `{ title, type, targetValue, startsAt, endsAt, circleId?, xpReward? }` | `{ challenge }` |
| GET | `/challenges/:id` | - | - | `{ challenge, participants[], myRank, myProgress }` |
| POST | `/challenges/:id/join` | - | - | `{ participant }` |
| POST | `/challenges/:id/leave` | - | - | `{ success: true }` |
| GET | `/challenges/:id/progress` | - | - | `{ progress, rank, percentComplete }` |
| POST | `/challenges/:id/update-progress` | `{ incrementBy }` | `{ participant, xpAwarded? }` | Auto-called on task/focus complete |

### Posts (Circle Feed)

| Method | Endpoint | Request Body | Response | Notes |
|--------|----------|-------------|----------|-------|
| GET | `/posts` | - | `{ posts[] }` | Paginated, all circles |
| POST | `/posts` | `{ circleId, type, content?, imageUrl?, tasksCompleted?, ... }` | `{ post }` | +10 XP for daily card |
| GET | `/posts/:id` | - | `{ post, reactions[] }` | With author profile |
| PATCH | `/posts/:id` | `{ content?, imageUrl? }` | `{ post }` | Author only |
| DELETE | `/posts/:id` | - | `{ success: true }` | Author/circle admin only |
| POST | `/posts/:id/react` | `{ emoji }` | `{ reaction }` | "🔥", "❤️", "👏" |

### Analytics

| Method | Endpoint | Query Params | Response | Notes |
|--------|----------|-------------|----------|-------|
| GET | `/analytics/overview` | `?period=week\|month\|all` | `{ xpEarned, tasksCompleted, focusMinutes, ... }` | Dashboard stats |
| GET | `/analytics/tasks` | `?startDate&endDate` | `{ tasksByDay[], tasksByCategory[] }` | Trends |
| GET | `/analytics/categories` | - | `{ Work: 45, Health: 23, ... }` | Breakdown |
| GET | `/analytics/streaks` | - | `{ current, longest, history[] }` | Streak calendar |

### AI

| Method | Endpoint | Request Body | Response | Notes |
|--------|----------|-------------|----------|-------|
| POST | `/ai/briefing` | - | `{ briefing: string }` | Generates morning briefing with OpenAI |
| POST | `/ai/voice-command` | `{ command: string }` | `{ response: string, action? }` | Process voice input |
| POST | `/ai/suggest-challenge` | - | `{ challenges[] }` | AI-recommended challenges |

**AI Briefing Example** (`backend/src/services/ai.service.ts`):
```typescript
export async function generateDailyBriefing(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tasks = await prisma.task.findMany({
    where: { userId, date: getTodayString(), completed: false },
  });
  
  const prompt = `
  User: ${user.name}, Level ${user.level}, ${user.currentStreak}-day streak
  Tasks today: ${tasks.length}
  High priority: ${tasks.filter(t => t.priority === 'HIGH').length}
  
  Generate a motivating morning briefing (2-3 sentences).
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });
  
  return { briefing: response.choices[0].message.content };
}
```

### Notifications

| Method | Endpoint | Request Body | Response | Notes |
|--------|----------|-------------|----------|-------|
| GET | `/notifications` | - | `{ notifications[] }` | Sorted by createdAt DESC |
| PATCH | `/notifications/:id/read` | - | `{ notification }` | Mark as read |
| POST | `/notifications/register-push` | `{ token, platform }` | `{ success: true }` | Save Expo push token |

---

## 🎨 UI/UX Design System

> **Location**: `frontend/src/styles/` (colors.ts, theme.ts, animations.ts)

### Color Palette (40+ Semantic Tokens)

```typescript
export const colors = {
  // Brand
  primary: '#B58CFF',        // Purple - CTAs, active states
  primaryDark: '#9D6FFF',
  primaryLight: '#D4B3FF',
  
  secondary: '#64C7FF',      // Blue - Accents, links
  secondaryDark: '#4AB3FF',
  secondaryLight: '#8DD9FF',
  
  // Feedback
  success: '#10B981',        // Green - Completed tasks
  successLight: '#34D399',
  warning: '#F59E0B',        // Orange - Warnings
  destructive: '#EF4444',    // Red - Errors, delete
  
  // Neutrals
  background: '#F6F7FA',     // App background
  card: '#FFFFFF',           // Card backgrounds
  border: '#E5E7EB',
  text: '#1F2937',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  
  // Gamification
  xp: '#FFD700',             // Gold - XP badges
  level: '#8B5CF6',          // Purple - Level badges
  streak: '#F97316',         // Orange - Streak flames
  
  // Categories
  work: '#3B82F6',           // Blue
  health: '#10B981',         // Green
  fitness: '#EF4444',        // Red
  wellness: '#8B5CF6',       // Purple
  creative: '#F59E0B',       // Orange
  personal: '#6B7280',       // Gray
};
```

### Typography Scale

```typescript
export const theme = {
  // Font sizes (rem equivalents)
  text2xl: { fontSize: 28, lineHeight: 36 },  // Page headings
  textXl: { fontSize: 20, lineHeight: 28 },   // Section headings
  textLg: { fontSize: 17, lineHeight: 24 },   // Subheadings
  textBase: { fontSize: 15, lineHeight: 22 }, // Body text
  textSm: { fontSize: 13, lineHeight: 18 },   // Captions
  textXs: { fontSize: 11, lineHeight: 16 },   // Labels
  
  // Font weights
  fontRegular: '400',
  fontMedium: '500',
  fontSemibold: '600',
  fontBold: '700',
};
```

### Spacing System

```typescript
export const spacing = {
  xs: 4,     // 4px
  sm: 8,     // 8px
  md: 12,    // 12px
  base: 16,  // 16px (default)
  lg: 20,    // 20px
  xl: 24,    // 24px
  xxl: 32,   // 32px
  xxxl: 40,  // 40px
  xxxxl: 48, // 48px
};
```

### Border Radius

```typescript
export const radius = {
  sm: 6,
  base: 12,
  lg: 16,
  xl: 24,
  full: 9999,  // Circular
};
```

### Shadows

```typescript
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};
```

### Component Library (27 Components)

**Location**: `frontend/src/components/ui/`

| Component | Props | Purpose |
|-----------|-------|---------|
| **Button** | `variant, size, disabled, onPress` | Primary, secondary, outline, ghost variants |
| **Card** | `variant, padding, shadow` | Elevated, flat, bordered variants |
| **Input** | `value, onChange, placeholder, error` | Text input with label & error |
| **Checkbox** | `checked, onChange, label` | Checkbox with label |
| **Switch** | `value, onChange, label` | Toggle switch |
| **Modal** | `visible, onClose, title, children` | Bottom sheet modal |
| **Alert** | `type, title, message, visible` | Success, error, warning alerts |
| **Toast** | `type, message, duration` | Toast notifications |
| **Skeleton** | `width, height, shape` | Loading skeletons |
| **Badge** | `variant, size, label` | Notification badges |
| **Avatar** | `url, name, size` | User avatars with fallback |
| **Progress** | `value, max, color` | Progress bars |
| **Tabs** | `tabs, activeTab, onChange` | Tab navigation |
| **Accordion** | `items, expandedId` | Expandable sections |

---

## 📱 Screen Architecture & Navigation

> **Location**: `frontend/App.tsx`, `frontend/src/screens/`

### Navigation Structure

```
RootStack (Stack Navigator)
├── Login
├── Register
└── MainTabs (Bottom Tabs) ← After auth
    ├── HomeTab (Stack Navigator)
    │   ├── Hub (Dashboard)
    │   ├── Inbox
    │   ├── Wallet
    │   ├── Challenges
    │   ├── Settings
    │   ├── Tasks
    │   ├── Streak
    │   ├── Level
    │   ├── Reset
    │   ├── TaskSorting
    │   ├── ProofCamera
    │   ├── ProofConfirm
    │   ├── DailyLifeCard
    │   ├── SavedPlaces
    │   ├── Analytics
    │   ├── DailyBriefing
    │   ├── AIInsights
    │   └── NotificationSettings
    ├── PlanTab → Plan (Single screen)
    ├── VoiceTab → VoiceAssistant (Modal, not screen)
    ├── CirclesTab (Stack Navigator)
    │   ├── CirclesList
    │   └── CircleHome (Modal overlay)
    └── ProfileTab (Stack Navigator)
        ├── ProfileMain
        ├── EditProfile
        ├── Notifications
        ├── PrivacyControls
        ├── HelpSupport
        └── SettingsFromProfile
```

**Total**: 26 registered screens + 1 modal

### Screen Details

#### Hub (Dashboard)
**File**: `frontend/src/screens/Hub/index.tsx` (420 lines)

**Sections**:
1. **Morning Briefing** - AI-generated summary with TTS playback
2. **Quick Actions** - Add task, start focus, voice assistant
3. **Stats Row** - XP, Level, Streak cards
4. **Today's Tasks** - Task list with completion (+XP animation)
5. **Active Challenges** - Progress bars
6. **Circle Activity** - Recent posts from circles

**Data Sources**:
- `/users/me/stats` - XP, level, streak
- `/tasks?date=today` - Today's tasks
- `/challenges?active=true` - Active challenges
- `/posts` - Circle feed
- `/ai/briefing` - Morning briefing

**Real-time**:
- Socket event `task_complete` → Refresh stats
- Socket event `new_post` → Update circle feed

#### Plan (Weekly Planner)
**File**: `frontend/src/screens/Plan/index.tsx`

**Features**:
- 7-day week view with drag-drop (future)
- Add task button → Modal
- Filter by category
- Assignments tab (received assignments)

**Data Sources**:
- `/tasks?date=YYYY-MM-DD` - Tasks for each day
- `/assignments?type=received` - Pending assignments

#### Tasks (Task List)
**File**: `frontend/src/screens/Tasks/index.tsx`

**Features**:
- Filter: All, Today, Upcoming, Completed
- Sort: Date, Priority, Category
- Swipe actions: Complete, Edit, Delete
- Checkbox → Complete task → +XP animation

#### Challenges (Challenge Hub)
**File**: `frontend/src/screens/Challenges/index.tsx`

**Tabs**:
1. **Active** - Ongoing challenges
2. **Available** - Join new challenges
3. **Completed** - Past challenges

**Challenge Card**:
- Title, emoji, type
- Progress bar (45/100 tasks)
- Leaderboard preview (Top 3)
- Join/Leave button

#### Circles (Circle List & Feed)
**File**: `frontend/src/screens/Circles/CirclesList.tsx`

**Sections**:
1. **My Circles** - List of joined circles
2. **Discover** - Public circles to join
3. **Create Circle** - Button → Modal

**Circle Card**:
- Name, emoji, member count
- Recent activity preview
- Tap → Navigate to CircleHome

#### CircleHome (Circle Detail)
**File**: `frontend/src/screens/Circles/CircleHome.tsx` (Modal overlay)

**Tabs**:
1. **Feed** - Posts from members (daily cards, achievements)
2. **Members** - List of members with stats
3. **Challenges** - Circle-specific challenges
4. **Settings** - Edit circle, manage members (admin only)

**Actions**:
- Post daily card → Upload photo → +10 XP
- Create assignment → Select member
- React to post → 🔥❤️👏

#### Profile (User Profile & Stats)
**File**: `frontend/src/screens/Profile/ProfileMain.tsx`

**Sections**:
1. **Header** - Avatar, username, bio
2. **Stats** - XP, Level, Streak, Tasks completed
3. **Achievements** - Unlocked badges (future)
4. **Settings** - Edit profile, notifications, privacy

#### Wallet (Rewards & Progress)
**File**: `frontend/src/screens/Wallet/index.tsx`

**Sections**:
1. **Current Level** - Progress bar to next level
2. **Total XP** - Lifetime XP earned
3. **Recent XP** - History of XP gains
4. **How XP Works** - Explanation of XP system

---

## 🤖 AI Features

> **Implementation**: `backend/src/services/ai.service.ts`, OpenAI API

### 1. Daily Briefing

**Trigger**: User opens Hub in morning OR taps "Generate Briefing"

**Process**:
1. Fetch user data (level, streak, tasks, challenges)
2. Send prompt to OpenAI GPT-4
3. Receive 2-3 sentence motivating summary
4. Display in Hub with TTS playback option

**Example Output**:
```
"Good morning! You're on a 🔥 7-day streak—keep it going!
Today you have 3 tasks, including 1 high priority.
Focus on your morning tasks (you're most productive 9-11am).
Let's make today count! 💪"
```

**Implementation**:
```typescript
export async function generateDailyBriefing(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tasks = await prisma.task.findMany({
    where: { userId, date: getTodayString(), completed: false },
  });
  const challenges = await prisma.challengeParticipant.findMany({
    where: { userId },
    include: { challenge: true },
  });
  
  const prompt = `
  User: ${user.name}, Level ${user.level}, ${user.currentStreak}-day streak
  Tasks today: ${tasks.length} (${tasks.filter(t => t.priority === 'HIGH').length} high priority)
  Active challenges: ${challenges.length}
  
  Generate a brief, motivating morning briefing (2-3 sentences).
  Include streak reminder and peak productivity hours.
  Tone: Encouraging, energetic, personal.
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 150,
  });
  
  return { briefing: response.choices[0].message.content };
}
```

### 2. Voice Assistant

**Trigger**: User taps microphone icon OR says wake word (future)

**Capabilities**:
- "What's my schedule today?" → List today's tasks
- "Add task: Buy groceries" → Create task
- "How's my streak?" → Respond with streak count
- "What challenges am I in?" → List active challenges

**Process**:
1. Frontend: Record audio with Expo Audio
2. Send to backend `/ai/voice-command`
3. Backend: OpenAI Whisper (speech-to-text)
4. Parse intent with GPT-4
5. Execute action (e.g., create task)
6. Generate response text
7. Frontend: TTS playback with Expo Speech

### 3. Task Categorization (Brain Dump)

**Trigger**: User adds task without selecting category

**Process**:
1. Task title: "Call dentist at 3pm"
2. Send to OpenAI:
   ```
   Categorize this task:
   Title: "Call dentist at 3pm"
   Categories: Work, Health, Fitness, Wellness, Creative, Personal
   ```
3. Receive: `{ category: "Health", priority: "NORMAL", suggestedTime: "15:00" }`
4. Auto-fill task fields

### 4. Challenge Suggestions

**Trigger**: User taps "Suggested Challenges" in Challenges screen

**Process**:
1. Analyze user's task history (category breakdown, completion patterns)
2. Send to OpenAI:
   ```
   User completes mostly:
   - Work: 45%
   - Health: 30%
   - Fitness: 15%
   
   Suggest 3 challenges to improve balance.
   ```
3. Receive suggestions:
   - "Complete 20 fitness tasks in 7 days"
   - "Log 100 focus minutes this week"
   - "Maintain 7-day streak"

---

## 💰 Business Model

### Free Tier
- Join up to 3 circles
- Create up to 10 tasks/day
- Basic AI briefing (1/day)
- Join challenges
- Standard analytics

### Premium ($9/month)
- **Unlimited circles**
- **Unlimited tasks**
- **Advanced AI coaching** (briefing 3x/day, voice assistant unlimited)
- **Custom challenges**
- **Priority support**
- **Circle analytics dashboard** (who's most active, trends)
- **Export data** (CSV, PDF)

### Circle Pro ($29/month for up to 10 members)
**Target**: Remote teams, fitness coaches, study groups

- **Team/company circles**
- **Admin controls** (assign roles, remove members)
- **Assignment templates** (reusable task templates)
- **Performance analytics** (team productivity trends)
- **Integration with Slack/Notion** (sync tasks)
- **White-label option** (custom branding)

### Revenue Streams

1. **Consumer Premium** ($9/mo) - Target: Serious productivity enthusiasts, freelancers
2. **B2B Team Plans** ($29/mo) - Target: Remote teams (10-50 people), fitness trainers, educators
3. **Marketplace** (30% take rate) - Let users create/sell challenge templates, task templates
4. **AI Upgrades** ($4.99/mo add-on) - GPT-4 tier for deeper insights, predictive scheduling

### Unit Economics (Projected)

| Metric | Value |
|--------|-------|
| CAC (Consumer) | $12 (social virality reduces CAC) |
| LTV (Premium) | $108 (12 months * $9) |
| LTV:CAC Ratio | 9:1 |
| Churn | 15%/month (network effects reduce churn) |
| Gross Margin | 85% (SaaS economics) |

---

## 🚀 Setup & Development

### Prerequisites
- **Node.js** 18+ and npm
- **PostgreSQL** 14+ (or SQLite for local dev)
- **Xcode** 14+ (for iOS development)
- **Expo CLI** (install with `npm install -g expo-cli`)
- **OpenAI API Key** (for AI features)

### Backend Setup

1. **Navigate to backend:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create PostgreSQL database:**
```sql
CREATE DATABASE mypa;
```

4. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mypa"
# OR for local dev with SQLite:
DATABASE_URL="file:./dev.db"

JWT_ACCESS_SECRET="generate-with-openssl-rand-base64-32"
JWT_REFRESH_SECRET="generate-with-openssl-rand-base64-32"
OPENAI_API_KEY="sk-..."
PORT=3000
```

5. **Generate Prisma client & migrate:**
```bash
npx prisma generate
npx prisma db push
```

6. **Start development server:**
```bash
npm run dev
```

Backend runs at `http://localhost:3000`

---

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```typescript
// Edit src/config/env.ts
export const API_URL = 'http://localhost:3000';  // or your backend URL
```

4. **Install iOS dependencies:**
```bash
cd ios
pod install
cd ..
```

5. **Start Expo dev server:**
```bash
npm start
```

6. **Run on iOS simulator:**
```bash
npm run ios
# OR press 'i' in the Expo terminal
```

---

### Common Commands

```bash
# Backend
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Run production build
npx prisma studio        # Open database GUI
npx prisma db push       # Sync schema to database

# Frontend
npm start                # Start Expo dev server
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run build            # Build production bundle
npm test                 # Run tests
```

---

## 🐛 Known Issues & Roadmap

### Critical (P0) - Fix Before Beta Launch

From [UX_UI_PROD_READINESS_AUDIT.md](UX_UI_PROD_READINESS_AUDIT.md):

- [ ] **Add error boundaries** to all screens (2h)
  - File: Create `frontend/src/components/ErrorBoundary.tsx`
  - Wrap all screen components
  
- [ ] **Fix FlatList performance issue** in Inbox (2h)
  - File: `frontend/src/screens/Inbox/index.tsx` lines 201-223
  - Remove ScrollView wrapper, make FlatList primary scroll container
  
- [ ] **Add loading states** to Hub, Plan, Tasks (3h)
  - Show skeleton screens while data loads
  - Add RefreshControl for pull-to-refresh
  
- [ ] **Fix touch targets < 44x44** (2h)
  - Hub: Add task icon (line 234-235)
  - Challenges: Options button (line 76)
  - Use `hitSlop` or increase size
  
- [ ] **Add error UI** for API failures (2h)
  - Replace `console.error` with user-facing errors
  - Show retry button on network failures
  
- [ ] **Add form validation** (2h)
  - Login: Email regex, password strength
  - Tasks: Title required, date format
  - Show inline errors
  
- [ ] **Setup crash reporting** with Sentry (1h)
  ```bash
  npm install @sentry/react-native
  ```
  
- [ ] **Add offline detection** (1h)
  - Use NetInfo to show "No internet" banner
  - Queue tasks for sync when back online

### High Priority (P1) - Fix Before 1.0

- [ ] **Add accessibility labels** (~65% missing, 4h)
  - Hub, Plan, Tasks screens have <20% coverage
  - Add `accessibilityLabel` to all Touchables
  
- [ ] **Refactor hardcoded colors to theme** (4h)
  - 90%+ of screens use hardcoded values
  - Replace with `colors.primary`, `theme.spacing`, etc.
  
- [ ] **Add analytics tracking** (3h)
  - Segment or Mixpanel
  - Track: Screen views, task completions, challenge joins
  
- [ ] **Add inline form validation** (3h)
  - Real-time email validation
  - Password strength indicator
  - Show errors before submit
  
- [ ] **Setup remote config / feature flags** (2h)
  - Firebase Remote Config or LaunchDarkly
  - Toggle features without app update
  
- [ ] **Optimize Hub task rendering** (2h)
  - Use FlatList instead of .map()
  - Or add useMemo for heavy computations

### Nice to Have (P2) - Post-Launch

- [ ] **Add skeleton loading screens** (3h)
- [ ] **Implement focus sessions** (Pomodoro timer, 8h)
- [ ] **Add achievements & badges system** (12h)
- [ ] **Build leaderboards** (global + circle, 8h)
- [ ] **Advanced insights dashboard** (AI-powered, 16h)

---

## 📊 Code Quality & Audits

This repository includes comprehensive audit reports:

### 1. Navigation & Interactions Audit
**File**: [AUDIT_NAVIGATION_AND_INTERACTIONS.md](AUDIT_NAVIGATION_AND_INTERACTIONS.md)

- Complete navigation route inventory (26 screens)
- Screen-by-screen interactive element enumeration (120+ buttons/CTAs)
- Critical issues identified:
  - 🔴 **VoiceAssistant navigation broken** in 2 screens (AIInsights, DailyBriefing)
  - 🟠 **Missing error boundaries** in handleNavigate() helpers (5 files)
- Minimal test suite (unit, navigation, interaction, E2E with Detox)

### 2. UI/UX & Production Readiness Audit
**File**: [UX_UI_PROD_READINESS_AUDIT.md](UX_UI_PROD_READINESS_AUDIT.md)

**Overall Quality Score**: 6.5/10

**Strengths**:
- Solid design system foundation (theme tokens, components)
- Modular architecture (27 reusable UI components)
- Good empty states and feedback

**Weaknesses**:
- 90%+ hardcoded values (not using theme)
- 35% accessibility coverage (only Wallet/Profile >85%)
- 0/9 screens have error boundaries
- Critical performance issue (Inbox FlatList in ScrollView)

**Top Findings**:
- Design system audit (theme usage, consistency gaps)
- Screen-by-screen UI findings (spacing, typography, colors, touch targets)
- UX flow friction analysis (6 main user journeys scored)
- Accessibility audit (screen readers, dynamic type, color contrast)
- Performance UX notes (FlatList optimization, memoization)
- Pre-deployment checklist (error handling, analytics, crash reporting, security)
- **Top 15 prioritized actions** with effort estimates (P0: 15h, P1: 18h, P2: 3h)

---

## 🤝 Contributing

This is a personal project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Code Standards**:
- Follow existing TypeScript/TSX patterns
- **Use theme tokens** (no hardcoded colors/spacing)
- **Add accessibility labels** to all interactive elements (`accessibilityLabel`, `accessibilityRole`)
- Write tests for new features (React Native Testing Library)
- Follow the component structure in refactored screens

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 📞 Contact

**Project Maintainer**: Khalid  
**Repository**: [mypa-ios-latest](https://github.com/yourusername/mypa-ios-latest)

For AI agents: This README contains complete context. Cross-reference with:
- `backend/src/utils/xp.ts` for exact XP formulas
- `backend/src/utils/streaks.ts` for streak logic
- `backend/prisma/schema.prisma` for full data model
- `frontend/src/styles/` for design system tokens
- Audit reports for known issues and priorities

---

## 🙏 Acknowledgments

- Design inspiration: [Shadcn UI](https://ui.shadcn.com/)
- Icons: [Lucide](https://lucide.dev/)
- Backend framework: [Express](https://expressjs.com/)
- ORM: [Prisma](https://www.prisma.io/)
- Mobile framework: [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)
- AI: [OpenAI](https://openai.com/)

---

**Built with ❤️ and accountability** | MYPA - Where productivity becomes social
