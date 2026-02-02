# MYPA Complete Implementation Guide
## From Current State → App Store Deployment

> A comprehensive step-by-step guide covering backend, frontend, database, auth, and deployment.
> Each step includes: what to do, the exact prompt to use, and which AI agent is best.

---

## What You Already Have

Based on your codebase:
- ✅ React Native + Expo frontend
- ✅ Express.js backend
- ✅ Prisma ORM with PostgreSQL
- ✅ Authentication (JWT-based)
- ✅ Existing screens (Hub, Plan, Focus, Circles, Profile, etc.)
- ✅ Socket.io for real-time
- ✅ Basic AI integration (OpenAI)
- ✅ Task, Circle, Challenge services

## What This Guide Adds

- 🆕 Gesture-based navigation (replacing tab bar)
- 🆕 Voice-first interface
- 🆕 AI learning system with progressive unlocks
- 🆕 Event logging for personalization
- 🆕 Production deployment

---

## Agent Legend

| Agent | Best For |
|-------|----------|
| **Claude (Sonnet/Opus)** | Architecture decisions, complex refactoring, understanding existing code |
| **Cursor (with Claude)** | In-editor code changes, file creation, debugging |
| **GPT-4** | Prompt engineering, AI system prompts, natural language parsing |
| **v0.dev** | UI component design, quick React Native mockups |
| **GitHub Copilot** | Autocomplete, boilerplate, repetitive patterns |

---

## Overview: 8 Phases

| Phase | Duration | Focus |
|-------|----------|-------|
| **0** | 2-3 days | Audit & Setup (verify what works) |
| **1** | 1 week | Backend Enhancements |
| **2** | 3-4 days | Database & Auth |
| **3** | 1 week | Gesture Navigation |
| **4** | 1 week | Voice System |
| **5** | 1 week | AI Learning System |
| **6** | 1 week | Testing & Polish |
| **7** | 1 week | Deployment |

**Total: ~7-8 weeks**

---

# PHASE 0: AUDIT & SETUP
## Days 1-3

---

### Step 0.1: Environment Verification

**Goal**: Ensure your development environment is properly set up.

**Agent**: Manual + Cursor

**Checklist**:
```bash
# Check Node version (should be 18+)
node --version

# Check if backend runs
cd backend
npm install
npm run dev
# Should see "Server running on port 3000" or similar

# Check if frontend runs
cd ../frontend
npm install
npx expo start
# Should open Expo dev tools

# Check database connection
cd ../backend
npx prisma studio
# Should open database browser
```

**Prompt if issues**:
```
My [backend/frontend] won't start. Here's the error:
[paste error]

Here's my package.json:
[paste relevant package.json]

Help me fix this.
```

---

### Step 0.2: Environment Variables Setup

**Goal**: Create proper .env files for development and production.

**Agent**: Manual

**Create files**:

**backend/.env**:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mypa_dev"

# Auth
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# OpenAI
OPENAI_API_KEY="sk-..."

# App
PORT=3000
NODE_ENV=development

# Push Notifications (optional for now)
EXPO_ACCESS_TOKEN=""

# For production, add:
# SENTRY_DSN=""
# REDIS_URL=""
```

**frontend/.env**:
```env
# API
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000

# For production builds:
# EXPO_PUBLIC_API_URL=https://api.mypa.app
# EXPO_PUBLIC_SOCKET_URL=https://api.mypa.app
```

---

### Step 0.3: Database Audit

**Goal**: Verify database schema matches your code and is production-ready.

**Agent**: Cursor (Claude)

**Prompt**:
```
Review my Prisma schema for production readiness.

File: backend/prisma/schema.prisma

Check for:
1. All relations are properly defined with onDelete behavior
2. Indexes exist for frequently queried fields
3. No missing fields that the code expects
4. Proper default values
5. Any TODO or temporary fields that need cleanup

Also identify if I'm missing tables for:
- User events (for AI learning)
- User model (for learned patterns)
- User unlocks (for progressive features)
- Conversations (for AI chat history)

Give me a list of issues and migrations needed.
```

---

### Step 0.4: API Audit

**Goal**: Verify all API routes work and are secure.

**Agent**: Cursor (Claude)

**Prompt**:
```
Audit my backend API routes for security and completeness.

Files to review:
- backend/src/routes/*.ts
- backend/src/middleware/auth.ts
- backend/src/app.ts

Check for:
1. All routes have proper auth middleware
2. Input validation on all POST/PUT routes
3. Error handling doesn't leak sensitive info
4. Rate limiting (or note if missing)
5. CORS configuration for production

List all issues found and how to fix them.
```

---

### Step 0.5: Frontend Audit

**Goal**: Identify what existing code can be reused vs. needs rewriting.

**Agent**: Cursor (Claude)

**Prompt**:
```
Audit my React Native frontend structure.

I'm going to convert from tab-based navigation to gesture-based navigation.

Review:
- frontend/src/screens/* (what can be reused?)
- frontend/src/components/* (reusable components)
- frontend/src/services/* (API services)
- frontend/src/contexts/* (state management)

Tell me:
1. Which screens can be adapted vs. need rewriting
2. Which components are already good
3. What's missing that I'll need to build
4. Any code quality issues to fix first

Focus on what I can KEEP, not just what needs changing.
```

---

### Step 0.6: Fix Critical Issues

**Goal**: Fix any blocking issues found in audits.

**Agent**: Cursor (Claude)

**Prompt** (customize based on audit findings):
```
Fix the following critical issues found in the audit:

[List issues from previous audits]

For each issue:
1. Show me the current code
2. Explain the problem
3. Provide the fix
4. Explain why this fixes it

Start with the most critical (security/data issues) first.
```

---

# PHASE 1: BACKEND ENHANCEMENTS
## Week 1

---

### Step 1.1: Add UserModel & UserUnlock Tables

**Goal**: Database tables for AI learning system.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add new Prisma models for the AI learning system.

File: backend/prisma/schema.prisma

Add these models:

1. UserModel - stores learned patterns about each user:
   - peakHours (array of integers)
   - bestDayOfWeek (int, 0-6)
   - avgTaskDuration (int, minutes)
   - completionRates (JSON: { HIGH: float, MEDIUM: float, LOW: float })
   - commonCategories (string array)
   - overwhelmThreshold (int, task count)
   - totalTasks, totalCompleted, totalFocusMinutes (stats)

2. UserUnlock - tracks unlocked AI features:
   - userId, feature (unique together)
   - unlockedAt (datetime)
   - seenByUser (boolean)

3. UserEvent - logs all user actions for learning:
   - userId, type (string), screen (string)
   - timestamp, metadata (JSON)
   - Indexes for efficient querying

4. Conversation - stores AI chat history:
   - userId, messages (JSON array)
   - context (JSON), createdAt

Make sure to add relations to the User model.
Then generate and run the migration.
```

---

### Step 1.2: Create Event Logging Service

**Goal**: Backend service to log user events.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create a backend service for logging user events.

File: backend/src/services/event.service.ts

Functions:
1. logEvent(userId, type, screen, metadata) - creates event record
2. getEvents(userId, days) - gets events from last N days
3. getEventsByType(userId, type, days) - filtered by type
4. deleteOldEvents(days) - cleanup events older than N days

Event types to support:
- app_opened
- task_created, task_completed, task_deferred, task_deleted
- focus_started, focus_completed
- voice_command
- swipe_navigation
- challenge_joined, challenge_completed
- circle_viewed, circle_joined

Also create the route:
File: backend/src/routes/events.routes.ts

POST /api/events - log event (batch support)
GET /api/events - get user's events (admin/debug only)
```

---

### Step 1.3: Create AI Voice Command Route

**Goal**: Backend endpoint for processing voice commands.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create the AI voice command processing endpoint.

File: backend/src/routes/ai.routes.ts (add to existing or create)

POST /api/ai/voice-command
- Receives: { command: string }
- Returns: { message: string, action?: object, navigation?: string }

Flow:
1. Parse intent from command (create intentParser helper)
2. Execute action if needed (task CRUD, focus, etc.)
3. Generate AI response using OpenAI
4. Return response

For now, implement:
- Add task: "add task buy groceries" → creates task
- Complete task: "mark X as done" → completes task
- Query tasks: "what do I have today" → lists tasks
- Status: "how am I doing" → returns stats
- Fallback: anything else → conversational AI response

Also create:
- backend/src/services/ai/intentParser.ts
- backend/src/services/ai/actionExecutor.ts
- backend/src/services/ai/responseGenerator.ts

Use the existing OpenAI integration you have.
```

---

### Step 1.4: Create Contextual Greeting Endpoint

**Goal**: API for personalized AI greetings.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create an endpoint for AI Home screen greetings.

File: backend/src/routes/ai.routes.ts (add)

GET /api/ai/greeting
- Returns personalized greeting based on:
  - Time of day
  - User's name
  - Today's task count
  - Streak status
  - Active challenges
  - Unlocked insights (if any)

Greeting logic:
- Morning (5am-12pm): "Good morning, [name]!"
- Afternoon (12pm-5pm): "Good afternoon, [name]!"
- Evening (5pm-9pm): "Good evening, [name]!"
- Night (9pm-5am): "Hey [name], burning the midnight oil?"

Add context:
- "[X] tasks today" or "All clear today!"
- "Day [X] of your streak!" or "Let's start fresh!"
- If challenge active: "You're [position] in [challenge]"

Keep it SHORT - this is spoken aloud.
```

---

### Step 1.5: Create Unlock Endpoints

**Goal**: API for progressive unlock system.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create endpoints for the unlock system.

File: backend/src/routes/unlock.routes.ts

GET /api/unlocks
- Returns all unlock statuses for user:
  {
    unlocks: [
      {
        feature: 'peak_hours',
        status: 'locked' | 'unlocked',
        unlockedAt: Date | null,
        seenByUser: boolean,
        progress: { current: number, required: number, description: string }
      }
    ]
  }

GET /api/unlocks/pending
- Returns unlocks that are earned but not seen (for celebration modal)

POST /api/unlocks/:feature/seen
- Marks an unlock as seen after user dismisses celebration

Unlock definitions (hardcode for now):
- Day 3: personalized_greeting
- Day 7: peak_hours (needs 10+ task completions)
- Day 7: ai_task_sorting
- Day 14: duration_estimation (needs 10+ focus sessions)
- Day 14: completion_patterns (needs 30+ tasks created)
- Day 30: predictive_mode (needs 50+ tasks)
- Day 30: overwhelm_detection

Create helper: backend/src/services/unlock.service.ts
```

---

### Step 1.6: Create Learning Batch Job

**Goal**: Nightly job to calculate user patterns.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create a batch job that calculates user patterns from event data.

File: backend/src/services/learning/batchJob.ts

Function: runNightlyUpdate()
- Gets all users
- For each user with events:
  1. Calculate patterns from last 30 days of events
  2. Update or create UserModel record
  3. Check for new unlocks earned
  4. Create UserUnlock records if earned

Pattern calculations:
File: backend/src/services/learning/patternCalculator.ts

- calculatePeakHours(events): number[] - hours with most completions
- calculateBestDay(events): number - day of week with best completion rate
- calculateCompletionRates(events): object - rate by priority
- calculateAvgDuration(events): number - average focus session minutes
- detectOverwhelmThreshold(events): number - task count where completion drops
- extractCommonCategories(events): string[] - most used categories

Set up cron job in backend/src/index.ts:
- Use node-cron
- Run at 3:00 AM daily

Also create manual trigger endpoint (for testing):
POST /api/admin/run-learning-job (admin only)
```

---

### Step 1.7: Update Existing Routes for Events

**Goal**: Add event logging to existing task/focus routes.

**Agent**: Cursor (Claude)

**Prompt**:
```
Update existing routes to log events for the learning system.

Files to update:
- backend/src/routes/tasks.routes.ts
- backend/src/routes/focus.routes.ts
- backend/src/routes/challenges.routes.ts
- backend/src/routes/circles.routes.ts

Add event logging:

Tasks:
- POST /tasks → log 'task_created'
- PUT /tasks/:id (complete) → log 'task_completed'
- PUT /tasks/:id (defer) → log 'task_deferred'
- DELETE /tasks/:id → log 'task_deleted'

Focus:
- POST /focus/start → log 'focus_started'
- POST /focus/end → log 'focus_completed' with duration

Challenges:
- POST /challenges/:id/join → log 'challenge_joined'

Use the eventService.logEvent() function.
Event logging should NEVER block the main response - fire and forget.
```

---

### Step 1.8: Add Rate Limiting & Security

**Goal**: Production-ready security.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add rate limiting and security hardening to the backend.

Install dependencies:
npm install express-rate-limit helmet express-slow-down

File: backend/src/middleware/security.ts

Add:
1. Rate limiting:
   - General: 100 requests per 15 minutes per IP
   - Auth routes: 5 requests per 15 minutes per IP
   - AI routes: 20 requests per minute per user

2. Helmet middleware for security headers

3. Request size limiting (1MB max)

Update backend/src/app.ts to use these middlewares.

Also add:
- CORS configuration for production domain
- Trust proxy setting for deployment behind load balancer
```

---

### Step 1.9: Add Health Check & Monitoring

**Goal**: Endpoints for deployment monitoring.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add health check and monitoring endpoints.

File: backend/src/routes/health.routes.ts

GET /health
- Returns: { status: 'ok', timestamp: Date }
- No auth required
- Used by load balancers

GET /health/detailed (admin only)
- Returns:
  {
    status: 'ok',
    database: 'connected' | 'error',
    uptime: seconds,
    memory: { used, total },
    version: 'from package.json'
  }

File: backend/src/utils/logger.ts
- Create structured logger using winston or pino
- Log levels: error, warn, info, debug
```

---

### Step 1.10: Test Backend Enhancements

**Goal**: Verify all new backend features work.

**Agent**: Cursor (Claude) + Manual

**Test with curl or Postman**:
```bash
# Event Logging
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"task_created","screen":"tasks","metadata":{}}'

# Voice Command
curl -X POST http://localhost:3000/api/ai/voice-command \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"add task buy groceries"}'

# Greeting
curl http://localhost:3000/api/ai/greeting \
  -H "Authorization: Bearer YOUR_TOKEN"

# Unlocks
curl http://localhost:3000/api/unlocks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Health
curl http://localhost:3000/health
```

---

# PHASE 2: DATABASE & AUTH
## Days 3-4 of Week 2

---

### Step 2.1: Run All Migrations

**Goal**: Ensure database is up to date.

**Agent**: Manual + Cursor

**Commands**:
```bash
cd backend

# Check migration status
npx prisma migrate status

# Create and run migrations
npx prisma migrate dev --name add_learning_system

# Generate Prisma client
npx prisma generate

# Verify with Prisma Studio
npx prisma studio
```

---

### Step 2.2: Verify Auth Flow

**Goal**: Ensure authentication works end-to-end.

**Agent**: Cursor (Claude)

**Prompt**:
```
Verify and document the authentication flow.

Review:
- backend/src/routes/auth.routes.ts
- backend/src/services/auth.service.ts
- backend/src/middleware/auth.ts
- frontend/src/contexts/AuthContext.tsx

Verify:
1. Registration creates user correctly
2. Login returns valid JWT
3. Protected routes reject invalid tokens
4. Logout clears tokens properly
5. Frontend stores token securely

Test cases to run manually, document any issues and fix them.
```

---

### Step 2.3: Add Token Refresh (if missing)

**Goal**: Implement token refresh for better UX.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement JWT token refresh mechanism.

Backend - POST /api/auth/refresh:
- Receives: { refreshToken: string }
- Validates refresh token
- Returns new access token

Update login to return both tokens:
- accessToken: expires in 15 minutes
- refreshToken: expires in 7 days

Frontend - Add axios interceptor:
- On 401 response, try to refresh token
- If refresh succeeds, retry original request
- If refresh fails, logout user
```

---

### Step 2.4: Add Apple Sign-In (Required for App Store)

**Goal**: Apple Sign-In for iOS App Store compliance.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add Apple Sign-In support.

Backend:
POST /api/auth/apple
- Receives: { identityToken: string, user?: { email, name } }
- Validates token with Apple
- Creates or finds user
- Returns JWT

Frontend:
- Install: expo-apple-authentication
- Add "Sign in with Apple" button to login screen
- Send token to backend

Note: Apple Sign-In is REQUIRED by App Store if you have any third-party login.
```

---

### Step 2.5: Secure Storage for Tokens

**Goal**: Use secure storage on device.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create secure storage wrapper for tokens.

File: frontend/src/services/secureStorage.ts

Use expo-secure-store to:
- Store access token securely
- Store refresh token securely
- Clear all tokens on logout

Update AuthContext to use this instead of AsyncStorage.

Tokens should NEVER be in:
- AsyncStorage
- console.log statements
- Error messages
```

---

# PHASE 3: GESTURE NAVIGATION
## Week 2-3

---

### Step 3.1: Remove Tab Navigator

**Goal**: Strip out the existing tab bar.

**Agent**: Cursor (Claude)

**Prompt**:
```
I'm refactoring from tab-based navigation to gesture-based navigation.

Current: Tab.Navigator with 5 tabs

I need you to:
1. Remove the Tab.Navigator completely
2. Create a new GestureNavigator component:
   - AI Home (center - default)
   - Tasks View (swipe left)
   - Social View (swipe right)  
   - Profile View (swipe down)
3. Keep the RootStack for modals (Focus, TaskDetail, etc.)

Don't implement gesture logic yet - just set up the structure.
```

---

### Step 3.2: Implement Swipe Gesture Logic

**Goal**: Make screens swipeable.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement swipe gesture logic for GestureNavigator.tsx.

Requirements:
1. Use Gesture.Pan() from react-native-gesture-handler
2. Use useSharedValue and useAnimatedStyle from react-native-reanimated
3. Swipe threshold: 100px to trigger navigation
4. Gestures:
   - Swipe LEFT → Tasks View
   - Swipe RIGHT → Social View
   - Swipe DOWN → Profile View
   - Swipe UP → Open Focus modal
   - Opposite swipe → Return to AI Home

5. Add haptic feedback using expo-haptics
6. Add spring animation for smooth transitions

Include proper TypeScript types.
```

---

### Step 3.3: Create AI Home Screen

**Goal**: Build the central AI Home screen.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create the AI Home screen - the center of the app.

File: src/screens/AIHome/index.tsx

Layout:
1. Header: Greeting area (connected to /api/ai/greeting)
2. AI Orb: Large centered (placeholder for now)
3. AI Message: Text below orb
4. Quick Actions: "Start Focus", "Add Task" buttons
5. Context Cards: Task count, streak, challenge
6. Swipe Hints: Subtle direction indicators

Colors:
- Background: #000000
- Card: #1a1a1a
- Accent: #6C5CE7
- Text: #FFFFFF / #8E8E93
```

---

### Step 3.4: Build the AI Orb Component

**Goal**: Create the animated AI orb.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create AI Orb component - visual representation of MYPA.

File: src/components/AIOrb/index.tsx

States:
1. IDLE: Gentle pulsing glow
2. LISTENING: Faster pulse, brighter glow
3. PROCESSING: Rotating gradient
4. SPEAKING: Rhythmic pulse

Props:
- state: 'idle' | 'listening' | 'processing' | 'speaking'
- size: 'large' (160px) | 'mini' (44px)
- onPress: () => void

Use:
- react-native-reanimated for animations
- expo-linear-gradient for gradient
- Gradient: #6C5CE7 to #a855f7
- Haptic feedback on press
```

---

### Step 3.5: Create Tasks View Screen

**Goal**: Tasks View for swipe left.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Tasks View - appears when swiping LEFT from AI Home.

Layout:
1. Header: "Tasks" title + Mini AI Orb (top right)
2. Filters: Today / Tomorrow / All / Priority tabs
3. Task List: Grouped by time or priority
4. Each Task Card: Title, due info, swipe actions
5. FAB: Quick add task button

Reuse existing task components where possible.
Connect to your existing task API.
Add pull-to-refresh.
```

---

### Step 3.6: Create Social View Screen

**Goal**: Social View for swipe right.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Social View - appears when swiping RIGHT from AI Home.

Layout:
1. Header: "Social" + Mini AI Orb
2. Sub-tabs: Circles / Challenges / Activity
3. Circles Section: List of user's circles
4. Challenges Section: Active challenges
5. Activity Feed: Recent social updates

Reuse existing circle/challenge components.
Connect to existing APIs.
```

---

### Step 3.7: Create Profile View Screen

**Goal**: Profile View for swipe down.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Profile View - appears when swiping DOWN from AI Home.

Layout:
1. Header: Profile pic, name, streak badge
2. Stats Grid: Tasks completed, Focus minutes, Current streak, XP
3. Unlocks Section: Show locked/unlocked AI features
4. Settings: List of settings options
5. Logout: At bottom

Connect to existing user data.
Show unlock progress from /api/unlocks.
```

---

### Step 3.8: Create Focus Modal

**Goal**: Focus screen as modal (swipe up).

**Agent**: Cursor (Claude)

**Prompt**:
```
Adapt existing Focus screen to work as a modal.

When user swipes UP from AI Home:
1. Focus modal slides up from bottom
2. Contains timer, task selection, controls
3. Can be dismissed by swiping down OR completing

Keep existing focus logic (timer, XP, etc.)
Just change how it's presented.
```

---

### Step 3.9: Add Navigation Indicators

**Goal**: Visual hints for swipe directions.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add subtle swipe indicators to AI Home.

On each edge:
- Left edge: Task icon, "Tasks"
- Right edge: Social icon, "Social"
- Top edge: Focus icon, "Focus"
- Bottom edge: Profile icon, "Profile"

Behavior:
- Initially visible with low opacity
- Fade out after 3 seconds on first visit
- Reappear briefly on returning to AI Home
- Can be disabled in settings

Use Animated from reanimated.
```

---

### Step 3.10: Test Gesture Navigation

**Goal**: Verify all navigation works.

**Agent**: Manual + Cursor

**Checklist**:
```
[ ] Swipe left → Tasks View
[ ] Swipe right → Social View
[ ] Swipe down → Profile View
[ ] Swipe up → Focus Modal
[ ] All return gestures work
[ ] Haptics fire correctly
[ ] Animations are smooth
[ ] No gesture conflicts
[ ] Works on different screen sizes
```

---

# PHASE 4: VOICE SYSTEM
## Week 4

---

### Step 4.1: Install Voice Dependencies

**Goal**: Set up voice libraries.

**Agent**: Manual

**Commands**:
```bash
cd frontend

# Speech-to-text
npm install @react-native-voice/voice

# For iOS, update pods:
cd ios && pod install && cd ..

# Text-to-speech (already have expo-speech likely)
npx expo install expo-speech

# Permissions
npx expo install expo-av  # for audio permissions
```

---

### Step 4.2: Create Voice Service

**Goal**: Abstraction layer for voice.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create a voice service that handles STT and TTS.

File: frontend/src/services/voice.ts

Functions:
1. startListening() - starts speech-to-text
2. stopListening() - stops STT, returns transcript
3. speak(text) - text-to-speech
4. cancelSpeech() - stops TTS

Events to expose:
- onStart - listening started
- onEnd - listening ended
- onResult - got transcript (partial or final)
- onError - error occurred

Handle:
- iOS permissions
- Error states
- Microphone in use by other app

Use @react-native-voice/voice for STT
Use expo-speech for TTS
```

---

### Step 4.3: Connect Orb to Voice

**Goal**: Orb tap triggers listening.

**Agent**: Cursor (Claude)

**Prompt**:
```
Connect the AI Orb to the voice service.

When user taps orb:
1. Orb state → LISTENING
2. Start voice recognition
3. Show transcript below orb in real-time
4. When user stops talking (or taps again):
5. Orb state → PROCESSING
6. Send transcript to /api/ai/voice-command
7. Get response
8. Orb state → SPEAKING
9. Speak the response using TTS
10. Orb state → IDLE

Handle errors:
- Microphone permission denied → show prompt
- Network error → speak "I'm having trouble connecting"
- Recognition failed → speak "I didn't catch that"
```

---

### Step 4.4: Create Voice Feedback UI

**Goal**: Visual feedback during voice interaction.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create visual feedback UI for voice interactions.

When LISTENING:
- Show animated waveform around orb
- Display transcript text below orb, updating in real-time
- Show "Tap to stop" hint

When PROCESSING:
- Show "Thinking..." or animated dots
- Keep last transcript visible

When SPEAKING:
- Show AI response text
- Sync pulse animation with speech

Add:
- Error messages with retry button
- Cancel button to stop any state
- Smooth transitions between states
```

---

### Step 4.5: Implement Intent Parser

**Goal**: Frontend intent detection for quick commands.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create a frontend intent parser for common commands.

File: frontend/src/services/intentParser.ts

Quick local parsing for common patterns:
- "add task X" → { intent: 'add_task', task: 'X' }
- "what do I have today" → { intent: 'query_tasks', filter: 'today' }
- "start focus" → { intent: 'start_focus' }
- "how am I doing" → { intent: 'status' }

If no match, return { intent: 'unknown' } and let backend handle.

This speeds up common operations - can act locally before API response.

For complex intents, always defer to backend.
```

---

### Step 4.6: Execute Voice Actions

**Goal**: Perform actions based on voice commands.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create action executor for voice commands.

File: frontend/src/services/voiceActionExecutor.ts

Handle intents from both local parser and API response:

add_task:
- Call task creation API
- Confirm with TTS "Added [task name]"

complete_task:
- Call task completion API
- Confirm with TTS "Done!"

query_tasks:
- Fetch tasks with filter
- Speak summary "You have 3 tasks today"

start_focus:
- Navigate to Focus modal
- Speak "Starting focus session"

status:
- Fetch stats
- Speak summary

navigate:
- Navigate to specified screen
- Speak confirmation

unknown:
- Use API response message directly
```

---

### Step 4.7: Add Voice to Other Screens

**Goal**: Mini orb on Tasks/Social/Profile views.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add mini AI orb to other screens for voice access.

On Tasks, Social, Profile views:
- Add mini orb (44px) in top right corner
- Tapping triggers same voice flow
- Context-aware: on Tasks screen, "add task" immediately understood

Context passing:
- Tasks screen → context: 'tasks'
- Social screen → context: 'social'
- Profile screen → context: 'profile'

Pass context to API so responses are relevant.
```

---

### Step 4.8: Implement Always-Available Listening

**Goal**: Optional always-listening mode.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement optional wake word detection.

Settings option: "Hey MYPA" wake word

When enabled:
1. Continuous low-power listening for "Hey MYPA"
2. When detected, activate full listening mode
3. Process command normally

Implementation:
- Use native iOS speech recognition for wake word
- Show subtle indicator when wake word active
- Battery optimization is critical

Note: This is optional/advanced - can skip if time constrained.
Make sure it can be disabled by default.
```

---

### Step 4.9: Voice Error Handling

**Goal**: Graceful error handling for voice.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement comprehensive voice error handling.

Errors to handle:

1. Permission denied:
   - Show permission explanation
   - "I need microphone access to hear you"
   - Button to open settings

2. Network error:
   - "I'm having trouble connecting. Try again?"
   - Retry button

3. Recognition failed:
   - "I didn't catch that. Could you repeat?"
   - Auto-retry once

4. Timeout (no speech detected):
   - "I didn't hear anything"
   - Return to idle

5. API error:
   - "Something went wrong. Let me try again."
   - Retry with exponential backoff

Always provide spoken feedback + visual feedback.
Never leave user in limbo state.
```

---

### Step 4.10: Test Voice System

**Goal**: Verify voice works end-to-end.

**Agent**: Manual + Cursor

**Checklist**:
```
[ ] Tap orb → listening state
[ ] Speak → transcript appears
[ ] "Add task buy milk" → task created, confirmed
[ ] "What do I have today" → task list spoken
[ ] "Start focus" → focus modal opens
[ ] "How am I doing" → stats spoken
[ ] Conversational query → AI responds
[ ] Error handling works
[ ] TTS speaks responses
[ ] Works on device (not just simulator)
```

---

# PHASE 5: AI LEARNING SYSTEM
## Week 5

---

### Step 5.1: Frontend Event Logging

**Goal**: Log events from frontend.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create event logging service for frontend.

File: frontend/src/services/eventLogger.ts

Log these events:
- app_opened (on app start)
- swipe_navigation (with direction)
- voice_command (with transcript)
- task_created, task_completed, task_deferred
- focus_started, focus_completed
- screen_viewed (with screen name)

Implementation:
- Queue events locally
- Batch send every 30 seconds or on 10 events
- Persist queue to handle app close
- Fire and forget - never block UI

Call eventLogger.log(type, metadata) throughout app.
```

---

### Step 5.2: Fetch User Model for AI Context

**Goal**: Use learned patterns in AI responses.

**Agent**: Cursor (Claude)

**Prompt**:
```
Fetch and use UserModel data in AI interactions.

Frontend:
- Fetch user model on app start
- Store in context
- Pass relevant data to voice commands

Backend:
- Update AI prompts to include user patterns
- When user has peak hours unlocked, mention in prompt
- When completion patterns unlocked, use in sorting

Example prompt enhancement:
"User typically completes tasks best between 9-11am.
Today they have 5 tasks. They usually struggle when over 8 tasks."

This makes AI feel personalized and aware.
```

---

### Step 5.3: Implement Unlock Celebration

**Goal**: Celebrate new unlocks.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create unlock celebration modal.

When user earns new unlock:
1. Check /api/unlocks/pending on app open
2. If pending unlocks exist, show celebration modal

Modal design:
- Confetti animation
- Unlock icon with glow
- "New AI Ability Unlocked!"
- Feature name and description
- "Awesome!" button to dismiss

After dismiss:
- POST /api/unlocks/:feature/seen
- Show unlock in Profile view

Make it feel rewarding - this is key to engagement!
```

---

### Step 5.4: Show Unlock Progress

**Goal**: Show progress toward locked features.

**Agent**: Cursor (Claude)

**Prompt**:
```
Show unlock progress in Profile view.

Design:
- List of all features (locked and unlocked)
- Unlocked: checkmark, "Unlocked Day X"
- Locked: progress bar, "X/Y tasks to unlock"

Features to show:
- Peak Hours: "Complete 10 tasks"
- AI Task Sorting: "Day 7"
- Duration Estimation: "10 focus sessions"
- Completion Patterns: "30 tasks created"
- Predictive Mode: "Day 30 + 50 tasks"
- Overwhelm Detection: "Day 30"

Update progress real-time as user completes actions.
```

---

### Step 5.5: AI Task Sorting

**Goal**: Sort tasks using learned patterns.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement AI task sorting based on learned patterns.

When user has 'ai_task_sorting' unlocked:
1. Fetch user's completion patterns
2. Sort tasks by:
   - Priority (existing)
   - Due date (existing)
   - Likelihood of completion based on:
     - Time of day vs peak hours
     - Number of existing tasks
     - Category completion rates

Backend:
- Add sorting logic to GET /tasks
- Include sort_reason in response

Frontend:
- Show "AI sorted" indicator
- Optional: show why task is prioritized
```

---

### Step 5.6: Duration Estimation

**Goal**: AI estimates task duration.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement AI duration estimation.

When user has 'duration_estimation' unlocked:
1. Use historical focus session data
2. Estimate duration for similar tasks

Backend:
- Track actual duration when tasks are completed during focus
- Calculate average by category
- Add estimated_duration to task response

Frontend:
- Show estimated duration on tasks
- "~25 mins" badge
- Use in focus session suggestions

Fallback: Use default estimates if not enough data.
```

---

### Step 5.7: Overwhelm Detection

**Goal**: AI detects when user is overwhelmed.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement overwhelm detection.

When user has 'overwhelm_detection' unlocked:
1. Calculate user's overwhelm threshold from historical data
2. When task count exceeds threshold, warn user

Backend:
- Track completion rates vs task count
- Find inflection point where completion drops
- Store in UserModel.overwhelmThreshold

Frontend:
- When threshold exceeded, AI says:
  "You have [X] tasks today. I've noticed you're most effective with [Y] or fewer. 
   Want me to help you prioritize?"
- Offer to defer or delegate tasks

This is the "magic" that makes MYPA feel like it knows you.
```

---

### Step 5.8: AI Daily Brief

**Goal**: Morning AI summary.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement AI daily brief.

Backend endpoint: GET /api/ai/daily-brief

Returns:
- Personalized greeting
- Task summary for today
- Suggested focus time (based on peak hours)
- Challenge updates
- Motivational message based on recent performance

Frontend:
- Show automatically on first app open of day
- AI speaks the brief
- User can skip or say "tell me more"

Example:
"Good morning! You have 4 tasks today. Your peak focus time is coming up at 9am.
You're 3 days into your 'Productive Week' challenge - keep it up!"
```

---

### Step 5.9: Predictive Suggestions

**Goal**: AI suggests tasks proactively.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement predictive task suggestions.

When user has 'predictive_mode' unlocked:
1. Analyze task patterns (recurring tasks, common times)
2. Suggest tasks before user creates them

Backend:
- Detect recurring patterns (e.g., "Plan week" every Sunday)
- GET /api/ai/suggestions returns predicted tasks

Frontend:
- AI proactively asks: "It's Sunday - want me to add 'Plan week' to your tasks?"
- User can confirm or dismiss

Also suggest:
- Break tasks down if commonly deferred
- Move tasks to different day if completion rate is low
```

---

### Step 5.10: Test Learning System

**Goal**: Verify AI learning works.

**Agent**: Manual + Cursor

**Checklist**:
```
[ ] Events are being logged
[ ] Batch job runs (trigger manually)
[ ] UserModel updates with patterns
[ ] Unlocks trigger at right thresholds
[ ] Celebration modal shows
[ ] Progress bars update
[ ] AI responses reference learned data
[ ] Task sorting uses patterns
[ ] Duration estimates appear
[ ] Overwhelm detection triggers
[ ] Daily brief works
```

---

# PHASE 6: TESTING & POLISH
## Week 6

---

### Step 6.1: Performance Optimization

**Goal**: 60fps animations, fast load times.

**Agent**: Cursor (Claude)

**Prompt**:
```
Optimize app performance.

Check and fix:
1. Gesture animations - must be 60fps
2. List rendering - use FlatList with proper keys
3. Re-renders - memoize components
4. Bundle size - check for large dependencies
5. Image optimization - use proper sizes
6. API calls - no duplicate calls, proper caching

Tools:
- React DevTools for re-render detection
- Flipper for performance profiling
- Expo performance tab

Target metrics:
- App start: < 2 seconds
- Screen transitions: < 300ms
- Gesture response: < 16ms
```

---

### Step 6.2: Offline Support

**Goal**: App works without internet.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add offline support.

Implementation:
1. Cache user data locally (AsyncStorage or SQLite)
2. Cache tasks, circles, challenges
3. Queue mutations when offline
4. Sync when back online
5. Show offline indicator

Handle:
- Voice commands offline → "I need internet for that"
- Reading cached data → works fine
- Creating tasks offline → queue and sync

Use:
- @react-native-async-storage/async-storage for simple data
- React Query for caching and sync
```

---

### Step 6.3: Error Boundaries

**Goal**: Graceful error handling.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add error boundaries and global error handling.

Create:
1. ErrorBoundary component that catches render errors
2. Global API error handler
3. Fallback UI for errors
4. Error reporting setup (prepare for Sentry)

When error occurs:
- Show friendly message, not stack trace
- Offer retry or go home
- Log error for debugging

Never show white screen of death.
```

---

### Step 6.4: Loading States

**Goal**: Beautiful loading states.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add polished loading states throughout app.

Create:
1. Skeleton screens for lists (tasks, circles)
2. Loading spinner for buttons
3. Pull-to-refresh indicators
4. Initial app loading screen

Design:
- Use skeleton animation (shimmer effect)
- Match the dark theme
- Feel premium, not jarring
- Minimum display time (300ms) to prevent flash
```

---

### Step 6.5: Empty States

**Goal**: Beautiful empty states that guide users.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add meaningful empty states.

Screens needing empty states:
1. Tasks: "No tasks yet. Tap the orb and say 'add task'"
2. Circles: "Join a circle to compete with friends"
3. Challenges: "No active challenges"
4. Activity: "Your activity will appear here"

Design:
- Illustration or icon
- Helpful message
- Call to action button
- Consistent with dark theme
```

---

### Step 6.6: Accessibility

**Goal**: App is accessible to all users.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add accessibility support.

Check and fix:
1. All buttons have accessibilityLabel
2. Images have accessibilityRole="image" and labels
3. Screen reader announces state changes
4. Touch targets are at least 44x44
5. Color contrast meets WCAG AA
6. VoiceOver/TalkBack navigation works

Test with:
- iOS VoiceOver
- Android TalkBack
- Increase text size setting
```

---

### Step 6.7: App Icon & Splash Screen

**Goal**: Professional app icon and splash screen.

**Agent**: Manual + Cursor

**Steps**:
```
1. Create app icon:
   - 1024x1024 PNG
   - Design: AI orb with gradient background
   - Use Figma, Sketch, or AI image generator

2. Update app.json:
   - icon: point to your icon
   - splash.image: splash screen image
   - splash.backgroundColor: #000000

3. Generate adaptive icons:
   - Use eas build to generate all sizes
   - Test on both iOS and Android
```

---

### Step 6.8: Onboarding Flow

**Goal**: First-time user experience.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create onboarding flow for new users.

Screens:
1. Welcome: "Meet MYPA, your AI productivity partner"
2. Voice: "Just talk to me" - demo voice interaction
3. Gestures: "Swipe to navigate" - show gesture hints
4. Permissions: Request microphone permission with explanation
5. Name: "What should I call you?"
6. Ready: "Let's get started!"

Design:
- Full screen, immersive
- Animated illustrations
- Skip option (but discourage)
- Progress dots

Store completion in AsyncStorage to not show again.
```

---

### Step 6.9: Comprehensive Testing

**Goal**: Test everything before deployment.

**Agent**: Manual + Cursor

**Full Checklist**:
```
NAVIGATION
[ ] All swipe gestures
[ ] All return gestures
[ ] Deep links
[ ] Background/foreground

VOICE
[ ] Tap to listen
[ ] All voice commands
[ ] TTS responses
[ ] Error handling

DATA
[ ] Tasks CRUD
[ ] Focus sessions
[ ] Circles/challenges
[ ] Profile/stats

AI
[ ] Greetings personalized
[ ] Learning system
[ ] Unlocks work
[ ] Celebrationmodals

EDGE CASES
[ ] New user
[ ] Offline mode
[ ] Lots of data
[ ] Low battery
[ ] Interrupted operations

DEVICES
[ ] iPhone SE (small)
[ ] iPhone 15 Pro (large)
[ ] iPad (if supporting)
```

---

### Step 6.10: Fix All Bugs

**Goal**: Zero known bugs.

**Agent**: Cursor (Claude)

**Prompt**:
```
Here are the bugs found during testing:

[List all bugs from testing]

For each bug:
1. Identify root cause
2. Implement fix
3. Verify fix works
4. Check for regression

Prioritize:
1. Crashes
2. Data loss
3. Security issues
4. UX issues
5. Visual bugs
```

---

# PHASE 7: DEPLOYMENT
## Week 7

---

### Step 7.1: Backend Deployment Setup

**Goal**: Prepare backend for production.

**Agent**: Cursor (Claude)

**Prompt**:
```
Prepare backend for production deployment.

Choose platform (Railway, Render, or AWS):
For Railway (recommended for simplicity):
1. Create railway.json with build settings
2. Add Procfile: web: npm start
3. Set environment variables in Railway dashboard

Required env vars:
- DATABASE_URL (use Railway's PostgreSQL add-on)
- JWT_SECRET (generate strong random string)
- OPENAI_API_KEY
- NODE_ENV=production

Also:
1. Update CORS for production domain
2. Add SSL (automatic on Railway)
3. Set up database backups
4. Add logging service connection
```

---

### Step 7.2: Database Production Setup

**Goal**: Production database with backups.

**Agent**: Manual + Cursor

**Steps**:
```bash
# Option A: Railway PostgreSQL
# - Add PostgreSQL plugin in Railway dashboard
# - Copy DATABASE_URL to env vars

# Option B: Neon (serverless PostgreSQL)
# - Create database at neon.tech
# - Copy connection string

# Run migrations on production
DATABASE_URL="production_url_here" npx prisma migrate deploy

# Verify
DATABASE_URL="production_url_here" npx prisma studio
```

**Backup Strategy**:
- Railway: Automatic daily backups
- Neon: Point-in-time recovery included
- Also: Weekly manual backup to S3/GCS

---

### Step 7.3: Deploy Backend

**Goal**: Backend live on internet.

**Agent**: Manual

**Railway Deployment**:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up

# Get URL
railway domain
```

**Test**:
```bash
# Health check
curl https://your-app.railway.app/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

### Step 7.4: Update Frontend for Production

**Goal**: Point frontend to production API.

**Agent**: Cursor (Claude)

**Prompt**:
```
Update frontend for production.

1. Create environment config:
File: frontend/src/config/env.ts
- Use EXPO_PUBLIC_API_URL
- Fallback to production URL

2. Update app.json:
- Set proper bundle identifier
- Set version number
- Update any hardcoded URLs

3. Create production .env:
EXPO_PUBLIC_API_URL=https://your-api.railway.app
EXPO_PUBLIC_SOCKET_URL=https://your-api.railway.app

4. Test with production API:
npx expo start --no-dev --minify
```

---

### Step 7.5: Apple Developer Setup

**Goal**: Apple Developer account ready.

**Agent**: Manual

**Steps**:
```
1. Apple Developer Account ($99/year)
   - developer.apple.com
   - Enroll as individual or organization

2. Create App ID:
   - Certificates, IDs & Profiles
   - New App ID
   - Bundle ID: com.yourname.mypa

3. Create Provisioning Profile:
   - App Store distribution
   - Select your App ID
   - Download and install

4. App Store Connect:
   - Create new app
   - Fill in metadata (name, description, category)
   - Upload screenshots (later)
```

---

### Step 7.6: Configure EAS Build

**Goal**: Set up Expo Application Services for builds.

**Agent**: Manual + Cursor

**Commands**:
```bash
cd frontend

# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# This creates eas.json
```

**Update eas.json**:
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "your-app-id"
      }
    }
  }
}
```

---

### Step 7.7: Build iOS App

**Goal**: Create production iOS build.

**Agent**: Manual

**Commands**:
```bash
cd frontend

# Build for App Store
eas build --platform ios --profile production

# This will:
# - Build in the cloud
# - Sign with your credentials
# - Create .ipa file
# - Takes 15-30 minutes
```

**While waiting**:
- Prepare App Store screenshots
- Write App Store description
- Prepare privacy policy URL
- Prepare support URL

---

### Step 7.8: Prepare App Store Listing

**Goal**: Complete App Store Connect listing.

**Agent**: Manual

**Required Materials**:
```
1. App Name: "MYPA - AI Productivity Partner"

2. Subtitle: "Voice-First Task Management"

3. Description (4000 char max):
   Write compelling description of MYPA's voice-first approach,
   AI learning, and productivity features.

4. Keywords: productivity, AI, tasks, voice, focus, assistant

5. Screenshots:
   - 6.7" (iPhone 15 Pro Max): 1290x2796
   - 6.5" (iPhone 14 Plus): 1284x2778
   - 5.5" (iPhone 8 Plus): 1242x2208
   Create 4-8 screenshots showing key features

6. App Preview Video (optional but recommended):
   - 15-30 seconds
   - Show voice interaction, gesture navigation

7. Privacy Policy URL

8. Support URL

9. Category: Productivity

10. Age Rating: 4+ (no objectionable content)
```

---

### Step 7.9: Submit to App Store

**Goal**: Submit for review.

**Agent**: Manual

**Steps**:
```bash
# Submit build to App Store Connect
eas submit --platform ios --profile production

# Or manually upload in App Store Connect
```

**In App Store Connect**:
1. Select build
2. Add screenshots
3. Fill in metadata
4. Answer export compliance (No encryption = select No)
5. Answer content rights
6. Submit for review

**Review typically takes**:
- First submission: 24-48 hours
- Updates: 24 hours
- May require fixes if rejected

---

### Step 7.10: Post-Launch Setup

**Goal**: Monitoring and iteration.

**Agent**: Cursor (Claude)

**Prompt**:
```
Set up post-launch monitoring.

1. Error Tracking (Sentry):
   - Create Sentry project
   - Add @sentry/react-native
   - Configure in App.tsx
   - Test error reporting

2. Analytics (optional):
   - Consider Mixpanel or Amplitude
   - Track key events
   - User retention metrics

3. Crash Reporting:
   - Sentry handles this
   - Set up alerts for new crashes

4. Performance Monitoring:
   - Sentry performance
   - Track slow API calls

5. User Feedback:
   - Add in-app feedback option
   - Monitor App Store reviews
   - Respond to reviews

6. Backend Monitoring:
   - Railway logs
   - Set up alerts for errors
   - Monitor database performance
```

---

# SUMMARY

## Total Steps: 70

| Phase | Steps | Duration | Focus |
|-------|-------|----------|-------|
| 0: Audit | 6 | 2-3 days | Verify current state |
| 1: Backend | 10 | 1 week | AI features, security |
| 2: Auth | 5 | 3-4 days | Database, auth, security |
| 3: Gestures | 10 | 1 week | Navigation system |
| 4: Voice | 10 | 1 week | Voice-first interface |
| 5: Learning | 10 | 1 week | AI personalization |
| 6: Polish | 10 | 1 week | Testing, UX, bugs |
| 7: Deploy | 10 | 1 week | App Store launch |

## Critical Path

```
Week 1: Phase 0 + Phase 1
Week 2: Phase 1 + Phase 2
Week 3: Phase 3
Week 4: Phase 4
Week 5: Phase 5
Week 6: Phase 6
Week 7: Phase 7
Week 8: Buffer for App Store review + fixes
```

## Key Tips

1. **Test on real device** - Simulator misses voice/gesture issues
2. **Commit frequently** - Easy rollback
3. **Backend first** - Get APIs stable before frontend
4. **Don't skip security** - One breach ruins everything
5. **App Store prep early** - Screenshots, descriptions take time
6. **Buffer for review** - Apple may reject first submission

---

## After Launch

1. Monitor errors and crashes
2. Respond to user feedback
3. Plan v1.1 with improvements
4. Consider Android launch
5. Marketing and growth

---

Good luck! 🚀

You're building something unique - a voice-first AI productivity app.
The hard work is worth it.
