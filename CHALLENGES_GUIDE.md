# MYPA Challenges System - Complete Guide

## Overview
The challenges system lets users create competitive challenges with their circles or publicly. Users can track progress, earn XP, and compete on leaderboards.

---

## Database Structure

### Tables
1. **challenges** - Stores challenge details
   - `id`, `title`, `description`, `emoji`
   - `type`: FOCUS_MINUTES, TASKS_COMPLETED, STREAK_DAYS, CUSTOM
   - `targetValue`: Goal number (e.g., 300 minutes, 25 tasks)
   - `startsAt`, `endsAt`: Challenge duration
   - `xpReward`: Points awarded on completion
   - `circleId`: If shared with a circle (NULL = public)
   - `isActive`: Whether challenge is available

2. **challenge_participants** - Tracks who joined and their progress
   - `id`, `challengeId`, `userId`
   - `progress`: Current value (e.g., 45 out of 300 minutes)
   - `rank`: Position in leaderboard
   - `completedAt`: When user completed challenge
   - `joinedAt`: When user joined

---

## Backend API Routes

### GET /challenges
**Returns:** All available challenges (includes user's circles + public)
- Shows if user has joined (`isJoined`)
- Shows user's progress (`myProgress`)
- Shows participant count

### GET /challenges/mine
**Returns:** Only challenges the user has joined

### POST /challenges
**Creates** a new challenge
**Body:** 
```json
{
  "title": "Deep Work Week",
  "description": "Complete 300 minutes of focused work",
  "emoji": "🧠",
  "type": "FOCUS_MINUTES",
  "targetValue": 300,
  "startsAt": "2026-01-29T00:00:00Z",
  "endsAt": "2026-02-05T23:59:59Z",
  "xpReward": 200,
  "circleId": "uuid-of-circle-or-null"
}
```

### POST /challenges/:id/join
**Joins** a challenge (creates participant record)

### DELETE /challenges/:id/leave
**Leaves** a challenge (removes participant)

### POST /challenges/:id/progress
**Updates** user's progress
**Body:** `{ "amount": 45 }`
- Checks if target reached, marks complete, awards XP
- Updates rank/leaderboard

### PUT /challenges/:id
**Edits** challenge (creator only)

### DELETE /challenges/:id
**Deletes** challenge (creator only)

---

## Frontend Implementation

### 1. ChallengesScreen (`/frontend/src/screens/ChallengesScreen.tsx`)
**Main challenges page**
- Shows all available challenges in cards
- "Create Challenge" button opens modal
- Join/Leave buttons on each card
- Challenge cards show:
  - Emoji, title, type
  - Progress bar
  - Days remaining
  - Participant count
  - XP reward
  - Circle name (if circle challenge)

**Create Modal:**
- Title, description, emoji picker
- Type selector (Focus Minutes, Tasks, Streak, Custom)
- Target value input
- Duration picker (start/end dates)
- XP reward selector (chips: 50, 100, 150, 200)
- Circle selector (shows user's circles or "Just Me")
  - Locked if no circles
  - Uses chip selector with icons

### 2. CircleHomeScreen - Challenges Tab
**Shows challenges for a specific circle**
- Filters challenges by `circleId`
- Same card UI as ChallengesScreen
- "Go to Challenges" button if empty
- Enhanced cards with:
  - Participant avatars (stacked)
  - Gradient progress bar
  - Warning badge if < 2 days left
  - "Joined" status badge

### 3. API Service (`/frontend/src/services/api.ts`)
```typescript
challengesApi = {
  getAll: () => GET /challenges
  getMine: () => GET /challenges/mine
  create: (data) => POST /challenges
  update: (id, data) => PUT /challenges/:id
  delete: (id) => DELETE /challenges/:id
  join: (id) => POST /challenges/:id/join
  leave: (id) => DELETE /challenges/:id/leave
  updateProgress: (id, amount) => POST /challenges/:id/progress
}
```

---

## Current Data

### Challenges in Database:
1. **Deep Work Week** (Bob, Mull circle) - 🧠
   - 300 min focus target, 200 XP
   - Participants: Alice (45 min), Charlie (30 min)

2. **Productivity Sprint** (Bob, Hunk circle) - ⚡
   - 25 tasks target, 150 XP
   - Participants: Alice (8 tasks), Charlie (12 tasks)

3. **7 Day Streak** (Bob, Public) - 🔥
   - 7 day streak target, 300 XP
   - Participants: Alice (3 days), Charlie (5 days)

### Users with Circles:
- **Khalid** (khalidmuflahi81@gmail.com): Mull, Hunk
- **Alice** (alice@mypa.app): Mull, Hunk (owner)
- **Bob** (bob@mypa.app): Mull, Hunk
- **Charlie** (charlie@mypa.app): Mull, Hunk

---

## How It Works

### Creating a Challenge:
1. User taps "Create Challenge" button
2. Fills out form (title, type, target, duration, XP, circle)
3. Backend creates challenge record
4. Challenge appears in ChallengesScreen and CircleHomeScreen (if circle)

### Joining a Challenge:
1. User sees challenge card
2. Taps "Join Challenge" button
3. Backend creates `challenge_participants` record
4. Button changes to "Joined" or "Leave"

### Updating Progress:
**Currently manual, but could be automatic:**
- Focus session completed → auto-increment FOCUS_MINUTES challenges
- Task completed → auto-increment TASKS_COMPLETED challenges
- Daily login → auto-increment STREAK_DAYS challenges

### Completing a Challenge:
When progress >= targetValue:
1. Sets `completedAt` timestamp
2. Awards XP to user
3. Updates user's `challengesWon` count
4. Shows completion badge/animation

---

## What's Working
✅ Create challenges (public or circle)
✅ Join/leave challenges
✅ View all challenges
✅ View my challenges
✅ Circle-specific challenges tab
✅ Participant tracking
✅ Progress tracking
✅ XP rewards on completion
✅ Edit/delete (creator only)
✅ Enhanced UI with avatars, gradients, badges

## What Needs Work
🔄 Automatic progress updates (from tasks/focus/streak)
🔄 Real-time leaderboard/rankings
🔄 Push notifications for challenge events
🔄 Challenge feed/activity
🔄 Challenge invitations
🔄 More challenge types

---

## Key Files

**Backend:**
- `/backend/src/routes/challenges.routes.ts` - API routes
- `/backend/src/services/challenge.service.ts` - Business logic
- `/backend/prisma/schema.prisma` - Database schema

**Frontend:**
- `/frontend/src/screens/ChallengesScreen.tsx` - Main screen
- `/frontend/src/screens/CircleHomeScreen.tsx` - Circle challenges tab
- `/frontend/src/services/api.ts` - API client (line 345+)

**Database:**
- `/backend/prisma/dev.db` - SQLite database

---

## Testing

### Test Flow:
1. Login as Khalid
2. Go to Challenges screen
3. See Bob's 3 challenges
4. Join "Deep Work Week"
5. Go to Circles → Mull → Challenges tab
6. Should see same challenge
7. Create new challenge for Mull circle
8. Other Mull members should see it

### Test Accounts:
- khalidmuflahi81@gmail.com / (your password)
- alice@mypa.app / password123
- bob@mypa.app / password123
- charlie@mypa.app / password123
