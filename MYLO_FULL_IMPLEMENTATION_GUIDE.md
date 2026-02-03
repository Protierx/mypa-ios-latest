# Mylo Complete Implementation Guide
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

## Overview: 9 Phases

| Phase | Duration | Focus |
|-------|----------|-------|
| **0** | 2-3 days | Audit & Setup (verify what works) |
| **1** | 1 week | Backend Enhancements |
| **2** | 3-4 days | Database & Auth + Recurring Tasks |
| **3** | 1 week | Gesture Navigation + Onboarding |
| **4** | 1 week | Voice System + Streaming + Offline |
| **5** | 1 week | Calendar + Widgets + Quick Capture |
| **6** | 1 week | AI Learning System + Hybrid Unlocks |
| **7** | 1 week | Testing & Polish + Celebrations |
| **8** | 1 week | Deployment |

**Total: ~10-11 weeks**

---

## Senior Developer Context & Architecture Decisions

### Dependency & Version Lock Strategy

This guide targets these exact versions - they work together without conflicts:

**Backend Stack**:
- Node.js 18.17+ (LTS) - stable, no memory leaks in event handlers
- Express.js 4.18.2 - mature, security patches back-ported
- Prisma 5.7+ - latest with connection pooling support
- PostgreSQL 15+ - JSONB performance, proper constraint checking
- TypeScript 5.3+ - improved type narrowing, better tooling
- OpenAI SDK 4.26+ - supports streaming, timeout handling

**Why these versions**:
- Express 4.x: Framework stability over new features (5.x is still beta)
- Prisma 5.x: Native enum support, better migrations
- PostgreSQL 15+: Performance improvements for JSONB queries (used for user patterns)
- Node 18 LTS: Long-term support until 2025, predictable deprecations

**Frontend Stack**:
- React Native 0.72+ with Expo SDK 50+ - stable gesture support
- TypeScript 5.3+
- react-native-gesture-handler 2.14+ - required for swipe navigation
- react-native-reanimated 3.6+ - 60fps animations, worklet support
- axios 1.6+ - request interceptor for token refresh
- zustand 4.4+ - lightweight state management
- TanStack Query 5.28+ - robust data fetching with caching

**Why Zustand over Redux**:
- 2KB vs 60KB bundle size
- Less boilerplate for storing user patterns and UI state
- Still supports devtools and middleware for debugging

**Critical conflict prevention**:
```json
{
  "resolutions": {
    "react-native/hermit": "hermit@0.3.2"
  }
}
```

### Architectural Principles

#### 1. **Offline-First with Optimistic Updates**
- Write to local state immediately
- Queue mutations for later sync
- Never block UI for network operations
- Implement conflict resolution for concurrent edits

#### 2. **Progressive Enhancement**
- Core features work offline (tasks, focus)
- Advanced features (voice, AI) require connectivity
- Graceful fallbacks when services unavailable
- Show clear indicators for partial functionality

#### 3. **Security by Default**
- All production APIs must use HTTPS
- JWT stored in secure enclave (not AsyncStorage)
- Never log sensitive data (tokens, passwords, PII)
- Rate limit all endpoints (prevent scraping)
- Validate all input on backend (frontend validation optional)

#### 4. **Performance Budgets**
- App startup: < 2 seconds
- Screen transition: < 300ms
- API response: < 1000ms (with 3000ms timeout)
- Gesture response: < 16ms (60fps)
- List rendering: 1000s items at 60fps

### Common Gotchas & How to Avoid Them

**Gotcha 1: N+1 Queries on Task List**
```javascript
// ❌ Bad: Loads user, then loads tasks, then loads challenges for each task
const tasks = await prisma.task.findMany({ where: { userId } });
const challenges = await Promise.all(tasks.map(t => prisma.challenge.findUnique(...)));

// ✅ Good: Single query with relations
const tasks = await prisma.task.findMany({
  where: { userId },
  include: { challenge: { select: { id, name } } }
});
```

**Gotcha 2: Microphone Permissions Lost After Kill**
- iOS kills app background mic permission if silent
- Always re-request permission on voice screen enter
- Show inline permission prompt, not native modal

**Gotcha 3: React Query Cache Stale During Edits**
- Mutations must invalidate correct cache keys
- Example: Creating task should invalidate "tasks" but also "unlocks"
- Use structured cache key naming: `tasks_${userId}_${date}`

**Gotcha 4: JWT Expiration During Long Focus Sessions**
- User starts 2-hour focus session with 1-hour token
- Token expires mid-session
- Solution: Refresh token every 30 minutes in background

**Gotcha 5: Database Connection Pool Exhaustion**
- Each serverless function gets new pool connection
- Default pool size 10, but many concurrent requests
- Set `connection_limit=5` on production DATABASE_URL

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

**Backend Configuration Philosophy**:
- Never hardcode secrets (even in dev)
- Use different secrets for dev/staging/prod
- Production should use managed secrets (Railway secrets, not .env)
- Each environment needs complete isolation

**Create files**:

**backend/.env.development**:
```env
# Database - use local PostgreSQL or docker container
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mylo_dev"

# Auth - use long random string
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# OpenAI - get from https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL="gpt-4-turbo-preview"  # or gpt-3.5-turbo for cost
OPENAI_MAX_TOKENS=1000
OPENAI_TIMEOUT_MS=30000

# App Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true

# Caching - Redis is optional in dev
REDIS_URL="redis://localhost:6379"  # comment out to skip

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# CORS - allow dev server
FRONTEND_URL="http://localhost:8081"
SOCKET_CORS_ORIGIN="http://localhost:8081"

# Background Jobs
ENABLE_BATCH_JOBS=true
BATCH_JOB_TIME="03:00"  # 3 AM UTC

# Error Tracking (optional for dev)
SENTRY_DSN=""
```

**backend/.env.production** (managed via Railway dashboard):
```env
DATABASE_URL="postgresql://..."  # Railway auto-provides
JWT_SECRET="[CHANGE IN DEPLOYMENT]"
JWT_EXPIRES_IN="15m"  # Shorter in production
JWT_REFRESH_EXPIRES_IN="30d"
OPENAI_API_KEY="[USE RAILWAY SECRETS]"
OPENAI_MODEL="gpt-4-turbo-preview"
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=false  # reduce noise
REDIS_URL="[RAILWAY REDIS]"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200  # higher for legitimate traffic
FRONTEND_URL="https://mylo.app"
SOCKET_CORS_ORIGIN="https://mylo.app"
ENABLE_BATCH_JOBS=true
BATCH_JOB_TIME="03:00"
SENTRY_DSN="https://[your-sentry-key]"
```

**frontend/.env.development**:
```env
# API Endpoints - must match backend port
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000

# Features (enable all in dev)
EXPO_PUBLIC_ENABLE_DEV_MENU=true
EXPO_PUBLIC_ENABLE_VOICE=true
EXPO_PUBLIC_ENABLE_ANALYTICS=false

# Logging
EXPO_PUBLIC_LOG_LEVEL=debug
```

**frontend/.env.production**:
```env
EXPO_PUBLIC_API_URL=https://api.mylo.app
EXPO_PUBLIC_SOCKET_URL=https://api.mylo.app
EXPO_PUBLIC_ENABLE_DEV_MENU=false
EXPO_PUBLIC_ENABLE_VOICE=true
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_LOG_LEVEL=info
```

**⚠️ Senior Dev Tip**: Use environment config builder to prevent typos:
```typescript
// backend/src/config/env.ts
const getEnv = () => {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }

  return {
    db: process.env.DATABASE_URL!,
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    // ... rest of config
  };
};

export const config = getEnv();
```

---

### Step 0.3: Database Audit

**Goal**: Verify database schema matches your code and is production-ready.

**Agent**: Cursor (Claude)

**Critical Checklist** (senior dev focus):

```sql
-- 1. Check for N+1 query opportunities
-- Every frequently queried entity should have its relations indexed
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- 2. Verify indexes exist for frequent queries
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' ORDER BY tablename;

-- 3. Check foreign key constraints for cascading
SELECT constraint_name, table_name, column_name, foreign_table_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public' AND foreign_table_name IS NOT NULL;

-- 4. Find missing indexes on foreign keys
SELECT tablename, attname FROM pg_attribute
WHERE attrelid IN (SELECT oid FROM pg_class WHERE relname IN (
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public'
)) AND attname LIKE '%_id';
```

**Schema Validation Prompt**:
```
Review my Prisma schema for production readiness.

File: backend/prisma/schema.prisma

Critical checks:
1. All relations have explicit onDelete behavior (not just relying on defaults)
2. Frequently queried fields are indexed:
   - User.email (for login lookups)
   - Task.userId + Task.dueDate (for dashboard queries)
   - Event.userId + Event.timestamp (for learning batch job)
3. No circular dependencies without @relation("name")
4. All string IDs are cuid() or uuid() - NOT autoincrement integers
5. All timestamps use @db.Timestamptz() - NOT DateTime (lose timezone info)
6. User model has these fields:
   - id, email (unique), password, name, createdAt, updatedAt
7. Task model has these fields:
   - id, userId, title, description, priority, dueDate, completed, completedAt
   - category (optional), estimatedMinutes, focusSessionId (FK)
8. UserEvent model for learning exists with:
   - id, userId, type, screen, metadata (JSON), timestamp (indexed)
9. UserModel for learned patterns:
   - id, userId (unique), peakHours (JSON), bestDay, patterns (JSON), updatedAt
10. UserUnlock model:
    - id, userId, feature, unlockedAt, seenByUser (indexed together)

Flag issues and required migrations.
```

**Schema Optimization** (add to Prisma schema):
```prisma
// Add these indexes for performance
model UserEvent {
  @@index([userId, timestamp])
  @@index([userId, type])
  @@index([timestamp])  // for cleanup queries
}

model Task {
  @@index([userId, dueDate])
  @@index([userId, completed])
  @@index([focusSessionId])
}

model UserUnlock {
  @@unique([userId, feature])
}

model Conversation {
  @@index([userId, createdAt])
}
```

**⚠️ Production Schema Decisions**:
- Use `@db.Timestamptz` everywhere (timezone-aware)
- Use `String @id @default(cuid())` for IDs (sortable, distributed)
- Don't use `autoincrement()` for IDs (leaks scale information)
- Add `createdAt` and `updatedAt` to every table (critical for auditing)
- Use `Decimal` for money, not Float
- Use `Int` for durations (milliseconds), not Float

---

### Step 0.4: API Audit

**Goal**: Verify all API routes work and are secure.

**Agent**: Cursor (Claude)

**Security Audit Checklist**:

```typescript
// ✅ Every route must have auth AND validation
// ❌ BAD
app.get('/api/tasks', (req, res) => {
  const tasks = prisma.task.findMany({ where: { userId: req.query.userId } });
  res.json(tasks);
});

// ✅ GOOD
app.get('/api/tasks', 
  authMiddleware,
  validateQuery({ filter: z.enum(['today', 'all']) }),
  async (req, res) => {
    const userId = req.user!.id; // use authenticated user, never trust query
    const tasks = await tasksService.getTasks(userId, req.query.filter);
    res.json(tasks);
  }
);
```

**Complete API Audit Prompt**:
```
Security audit of my backend API.

Critical vulnerabilities to check for:

1. Authentication:
   - All non-health routes protected with authMiddleware
   - Tokens validated before any database query
   - No hardcoded admin checks (use role-based access control)

2. Input Validation:
   - POST/PUT routes validate request body
   - Query parameters validated against expected types
   - No raw SQL queries (use Prisma prepared statements)

3. Response Security:
   - Error messages don't leak schema info
   - Passwords never sent to client
   - User endpoints don't expose other users' data
   - List endpoints check ownership

4. Rate Limiting:
   - Auth endpoints (login, register) limited to 5 per 15 min
   - General API limited to 100 per 15 min per user
   - Voice endpoints (expensive) limited to 20 per minute

5. Permissions Model:
   - Users can't access other users' tasks
   - Circles: verify user is member before operations
   - Admin endpoints clearly marked and protected

6. Data Exposure:
   - Soft deletes for sensitive data (tasks, conversations)
   - No timestamp data that shows when user sleeps
   - Aggregate statistics don't reveal individuals

Example validation middleware needed:
- Input body validator (use Zod or Joi)
- Query param validator
- Rate limiter with Redis backend
- CORS configured for specific origins
```

**API Response Format Standard** (critical for frontend):

```typescript
// Success response (HTTP 200)
{
  success: true,
  data: { /* resource */ },
  meta: {
    timestamp: '2024-02-02T10:30:00Z',
    version: '1.0'
  }
}

// Error response (HTTP 400+)
{
  success: false,
  error: {
    code: 'TASK_NOT_FOUND',  // machine readable
    message: 'Task not found',  // user readable
    statusCode: 404,
    details: { taskId: '123' }  // for debugging
  }
}

// List response with pagination
{
  success: true,
  data: [{ /* items */ }],
  pagination: {
    total: 150,
    limit: 20,
    offset: 0,
    hasMore: true
  }
}
```

**Required API Status Codes**:
- `200` - Success, return data
- `201` - Created, return created resource
- `204` - No content (e.g., DELETE success)
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not allowed, even authenticated)
- `404` - Not found (resource doesn't exist)
- `429` - Rate limited (too many requests)
- `500` - Server error (unexpected)

**API Timeout & Retry Strategy**:
```typescript
// Frontend retry logic (exponential backoff)
const apiClient = axios.create({
  timeout: 3000,  // fail fast
  maxRetries: 3
});

// Add retry interceptor
apiClient.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 429) {
    // Rate limited - wait and retry
    await delay(1000 * (attempt ** 2));
    return apiClient.request(error.config);
  }
  return Promise.reject(error);
});
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

**Prisma Schema - Complete Implementation**:
```prisma
// backend/prisma/schema.prisma

model UserModel {
  id                  String          @id @default(cuid())
  userId              String          @unique
  user                User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Peak productivity hours (0-23): [9, 10, 14, 15] means most productive 9-11am, 2-4pm
  peakHours           Int[]           @default([])
  
  // Best day for productivity (0=Sunday, 6=Saturday)
  bestDayOfWeek       Int?
  
  // Average task duration by category
  avgTaskDuration     Int             @default(25)  // minutes
  
  // Completion rates by priority level
  completionRates     Json            @default("{\"HIGH\":0.8,\"MEDIUM\":0.6,\"LOW\":0.4}")
  
  // Most frequently used categories
  commonCategories    String[]        @default([])
  
  // When user gets overwhelmed (task count > this = drop in completion)
  overwhelmThreshold  Int             @default(8)
  
  // Lifetime statistics
  totalTasksCreated   Int             @default(0)
  totalTasksCompleted Int             @default(0)
  totalFocusMinutes   Int             @default(0)
  currentStreak       Int             @default(0)
  longestStreak       Int             @default(0)
  
  // Focus patterns
  avgFocusSessionMinutes Int           @default(25)
  completionRateWhenFocused Float      @default(0.85)
  
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  
  @@index([userId])
  @@index([updatedAt])
}

model UserUnlock {
  id                  String          @id @default(cuid())
  userId              String
  user                User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Feature name: 'peak_hours', 'ai_sorting', 'overwhelm_detection', etc
  feature             String
  
  // When this feature was unlocked
  unlockedAt          DateTime        @default(now())
  
  // Whether user has seen the celebration modal
  seenByUser          Boolean         @default(false)
  
  createdAt           DateTime        @default(now())
  
  @@unique([userId, feature])
  @@index([userId])
  @@index([seenByUser])  // for pending unlocks query
}

model UserEvent {
  id                  String          @id @default(cuid())
  userId              String
  user                User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Event type: 'task_created', 'task_completed', 'voice_command', 'focus_started'
  type                String
  
  // Screen name where event occurred
  screen              String          @default("unknown")
  
  // Additional event data (JSON is critical for flexibility)
  metadata            Json            @default("{}")
  
  // Timestamp of event (timezone-aware)
  timestamp           DateTime        @db.Timestamptz @default(now())
  
  createdAt           DateTime        @default(now())
  
  // Critical indexes for batch jobs and queries
  @@index([userId, timestamp])      // for getting user's events
  @@index([userId, type])            // for event type filtering
  @@index([timestamp])               // for cleanup (delete events > 90 days)
  @@index([type])                    // for analytics aggregation
}

model Conversation {
  id                  String          @id @default(cuid())
  userId              String
  user                User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Array of message objects: [{ role: 'user'|'assistant', content: string, timestamp }]
  messages            Json            @default("[]")
  
  // Context from when conversation started
  context             Json            @default("{}")
  
  // How many times was this conversation referenced by user
  referenceCount      Int             @default(0)
  
  // Whether user found this helpful
  isHelpful           Boolean?
  
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  
  @@index([userId, createdAt])
  @@index([isHelpful])  // for analytics
}

// Update User model to include these relations
model User {
  // ... existing fields ...
  
  // Add these relations:
  userModel           UserModel?
  unlocks             UserUnlock[]
  events              UserEvent[]
  conversations       Conversation[]
}
```

**Migration Path**:
```bash
# Generate migration
npx prisma migrate dev --name add_learning_system

# This creates:
# prismamigrations/20240202_add_learning_system/migration.sql

# The migration will:
# 1. Create UserModel table with indexes
# 2. Create UserUnlock table with unique constraint
# 3. Create UserEvent table with optimized indexes
# 4. Create Conversation table
# 5. Add foreign keys with CASCADE delete (critical!)

# Run in production:
DATABASE_URL="prod_url" npx prisma migrate deploy
```

**⚠️ Senior Dev Note**: Soft deletes for events?
- Keep all events for 90 days minimum (learning needs history)
- Then delete via batch job (don't rely on cascade)
- This prevents accidental data loss and supports audit trails

**Prisma Relation Gotchas**:
```typescript
// ❌ Wrong - N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const model = await prisma.userModel.findUnique({ 
    where: { userId: user.id } 
  });
  console.log(model);
}

// ✅ Correct - single query with include
const usersWithModels = await prisma.user.findMany({
  include: { userModel: true }  // One query, fetches relations
});
```

---

### Step 1.2: Create Event Logging Service

**Goal**: Backend service to log user events.

**Agent**: Cursor (Claude)

**Complete Implementation**:

```typescript
// backend/src/services/event.service.ts

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

type EventType = 
  | 'app_opened' 
  | 'task_created' 
  | 'task_completed' 
  | 'task_deferred' 
  | 'task_deleted'
  | 'focus_started' 
  | 'focus_completed' 
  | 'voice_command'
  | 'swipe_navigation'
  | 'challenge_joined' 
  | 'challenge_completed'
  | 'circle_viewed' 
  | 'circle_joined';

export class EventService {
  /**
   * Log a single event - fire and forget, never blocks UI
   * Always use fire-and-forget pattern (no await from caller)
   */
  static async logEvent(
    userId: string,
    type: EventType,
    screen: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await prisma.userEvent.create({
        data: {
          userId,
          type,
          screen,
          metadata: {
            ...metadata,
            userAgent: 'mobile_app',  // could add device info
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Never throw - just log
      logger.error('Event logging failed', { userId, type, error });
    }
  }

  /**
   * Log multiple events in batch - used by frontend bulk operations
   * Validates before insert to prevent corruption
   */
  static async logEventsBatch(
    userId: string,
    events: Array<{
      type: EventType;
      screen: string;
      metadata?: Record<string, any>;
      timestamp?: Date;
    }>
  ): Promise<number> {
    if (events.length === 0) return 0;
    if (events.length > 100) {
      logger.warn('Batch larger than 100 events, truncating', { userId });
      events = events.slice(0, 100);
    }

    try {
      const created = await prisma.userEvent.createMany({
        data: events.map(e => ({
          userId,
          type: e.type,
          screen: e.screen,
          metadata: e.metadata || {},
          timestamp: e.timestamp || new Date(),
        })),
        skipDuplicates: false,  // fail if any duplicate
      });

      logger.debug('Batch logged', { userId, count: created.count });
      return created.count;
    } catch (error) {
      logger.error('Batch logging failed', { userId, count: events.length, error });
      return 0;
    }
  }

  /**
   * Get user's events for debugging or analytics
   * Admin only - implement auth check in route
   */
  static async getEvents(
    userId: string,
    days: number = 7
  ) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return prisma.userEvent.findMany({
      where: {
        userId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000,  // limit results
    });
  }

  /**
   * Get events by type for behavior analysis
   */
  static async getEventsByType(
    userId: string,
    type: EventType,
    days: number = 30
  ) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return prisma.userEvent.findMany({
      where: {
        userId,
        type,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Critical: Cleanup old events (never accessed after 90 days)
   * Run as scheduled job every week
   */
  static async deleteOldEvents(daysOld: number = 90): Promise<number> {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    try {
      const result = await prisma.userEvent.deleteMany({
        where: {
          timestamp: { lt: cutoff },
        },
      });

      logger.info('Old events cleaned up', { 
        cutoff, 
        count: result.count 
      });
      return result.count;
    } catch (error) {
      logger.error('Event cleanup failed', { error });
      return 0;
    }
  }

  /**
   * Get event statistics for a user (used for learning system)
   */
  static async getEventStats(
    userId: string,
    days: number = 30
  ) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await prisma.userEvent.findMany({
      where: {
        userId,
        timestamp: { gte: since },
      },
      select: { type: true, metadata: true },
    });

    const stats = {
      totalEvents: events.length,
      byType: {} as Record<EventType, number>,
      taskCompletionRate: 0,
      voiceCommandCount: 0,
    };

    for (const event of events) {
      stats.byType[event.type as EventType] = 
        (stats.byType[event.type as EventType] || 0) + 1;
    }

    // Calculate completion rate
    const created = stats.byType.task_created || 0;
    const completed = stats.byType.task_completed || 0;
    stats.taskCompletionRate = created > 0 ? completed / created : 0;
    stats.voiceCommandCount = stats.byType.voice_command || 0;

    return stats;
  }
}

export default EventService;
```

**Routes Implementation**:
```typescript
// backend/src/routes/events.routes.ts

import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import EventService from '../services/event.service';
import { z } from 'zod';

const router = express.Router();

// POST /api/events - log event(s)
router.post(
  '/events',
  authMiddleware,
  validateBody(
    z.object({
      type: z.string(),
      screen: z.string(),
      metadata: z.record(z.any()).optional(),
      events: z.array(z.object({
        type: z.string(),
        screen: z.string(),
        metadata: z.record(z.any()).optional(),
      })).optional(),
    })
  ),
  async (req, res) => {
    const userId = req.user!.id;

    try {
      if (req.body.events) {
        // Batch event logging
        const count = await EventService.logEventsBatch(
          userId,
          req.body.events
        );
        res.json({ success: true, data: { logged: count } });
      } else {
        // Single event logging
        await EventService.logEvent(
          userId,
          req.body.type,
          req.body.screen,
          req.body.metadata
        );
        res.json({ success: true });
      }
    } catch (error) {
      res.status(500).json({ error: 'Event logging failed' });
    }
  }
);

// GET /api/events - admin only
router.get(
  '/events',
  authMiddleware,
  async (req, res) => {
    // Verify admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const userId = req.query.userId as string;
    const days = parseInt(req.query.days as string) || 7;

    const events = await EventService.getEvents(userId, days);
    res.json({ success: true, data: events });
  }
);

// GET /api/events/stats - user's event statistics
router.get(
  '/events/stats',
  authMiddleware,
  async (req, res) => {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;

    const stats = await EventService.getEventStats(userId, days);
    res.json({ success: true, data: stats });
  }
);

export default router;
```

**Frontend Integration** (fire-and-forget pattern):
```typescript
// frontend/src/services/eventLogger.ts

import { axiosInstance } from './api';

export const logEvent = (
  type: string,
  screen: string,
  metadata: Record<string, any> = {}
) => {
  // Fire and forget - don't await
  axiosInstance.post('/api/events', {
    type,
    screen,
    metadata,
  }).catch(error => {
    console.warn('Event logging failed (non-critical):', error.message);
    // Don't throw - this should never block user interaction
  });
};

// In your screens:
import { logEvent } from '../services/eventLogger';

const TaskScreen = () => {
  useEffect(() => {
    logEvent('app_opened', 'tasks', { timestamp: Date.now() });
  }, []);

  const handleTaskCreated = (task) => {
    // Create task first
    createTask(task);
    
    // Then log - don't wait
    logEvent('task_created', 'tasks', { taskId: task.id });
  };
};
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

### Step 2.2: Verify Auth Flow - Complete Implementation

**Goal**: End-to-end authentication with token refresh.

**Agent**: Cursor (Claude)

**Backend Auth Service** (complete):
```typescript
// backend/src/services/auth.service.ts

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { config } from '../config/env';

export class AuthService {
  /**
   * Register a new user
   * Never store plain password - always hash
   */
  static async register(email: string, password: string, name: string) {
    // Validation
    if (!email || !password || password.length < 8) {
      throw new Error('Invalid email or password');
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('User already exists');
    }

    // Hash password with salt rounds 12 (slow, secure)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  /**
   * Login user
   */
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Compare passwords (never log password)
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const tokens = this.generateTokens(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        config.jwt.refreshSecret
      ) as { userId: string };

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return this.generateTokens(user.id);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   * Access: short-lived (15 min), for API calls
   * Refresh: long-lived (30 days), for getting new access tokens
   */
  private static generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      config.jwt.secret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      config.jwt.refreshSecret || config.jwt.secret,
      { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify token is valid (used by middleware)
   */
  static verifyToken(token: string) {
    return jwt.verify(token, config.jwt.secret) as { userId: string };
  }
}
```

**Auth Middleware** (complete):
```typescript
// backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.slice(7);  // remove "Bearer "

    try {
      const decoded = AuthService.verifyToken(token);
      req.user = { id: decoded.userId };
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Optional: middleware for refresh token endpoint
export const refreshTokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = req.body.refreshToken;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  req.body.refreshToken = refreshToken;
  next();
};
```

**Auth Routes** (complete):
```typescript
// backend/src/routes/auth.routes.ts

import express from 'express';
import { validateBody } from '../middleware/validation';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';

const router = express.Router();

// POST /api/auth/register
router.post(
  '/auth/register',
  validateBody(z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
  })),
  async (req, res) => {
    try {
      const result = await AuthService.register(
        req.body.email,
        req.body.password,
        req.body.name
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }
);

// POST /api/auth/login
router.post(
  '/auth/login',
  validateBody(z.object({
    email: z.string().email(),
    password: z.string(),
  })),
  async (req, res) => {
    try {
      const result = await AuthService.login(
        req.body.email,
        req.body.password
      );
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }
  }
);

// POST /api/auth/refresh
router.post(
  '/auth/refresh',
  validateBody(z.object({
    refreshToken: z.string(),
  })),
  async (req, res) => {
    try {
      const tokens = await AuthService.refreshToken(req.body.refreshToken);
      res.json({ success: true, data: tokens });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }
  }
);

export default router;
```

**Frontend Auth Context** (complete):
```typescript
// frontend/src/contexts/AuthContext.tsx

import React, { createContext, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { axiosInstance } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string; email: string; name: string } | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await axiosInstance.post('/api/auth/login', {
      email,
      password,
    });

    // Store tokens securely
    await SecureStore.setItemAsync('accessToken', data.data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);

    // Set default auth header
    axiosInstance.defaults.headers.common['Authorization'] = 
      `Bearer ${data.data.accessToken}`;

    setUser(data.data.user);
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    name: string
  ) => {
    const { data } = await axiosInstance.post('/api/auth/register', {
      email,
      password,
      name,
    });

    await SecureStore.setItemAsync('accessToken', data.data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);

    axiosInstance.defaults.headers.common['Authorization'] = 
      `Bearer ${data.data.accessToken}`;

    setUser(data.data.user);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const refreshToken = useCallback(async () => {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const { data } = await axiosInstance.post('/api/auth/refresh', {
      refreshToken,
    });

    await SecureStore.setItemAsync('accessToken', data.data.accessToken);
    axiosInstance.defaults.headers.common['Authorization'] = 
      `Bearer ${data.data.accessToken}`;
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      register,
      logout,
      refreshToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**⚠️ Critical: Token Refresh Interceptor** (prevents session drops):
```typescript
// frontend/src/services/api.ts

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Response interceptor for automatic token refresh
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/api/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data.data;
        await SecureStore.setItemAsync('accessToken', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch {
        // Refresh failed - logout user
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        // Trigger logout (implement navigation to login)
      }
    }

    return Promise.reject(error);
  }
);
```

---

### Step 2.3: Add Apple Sign-In (Required for App Store)

**Goal**: Apple Sign-In for iOS App Store compliance.

**Agent**: Cursor (Claude)

**Installation**:
```bash
cd frontend
npx expo install expo-apple-authentication expo-auth-session expo-web-browser
cd ios && pod install && cd ..
```

**Backend Endpoint** (accepts Apple token):
```typescript
// backend/src/routes/auth.routes.ts

import axios from 'axios';

// POST /api/auth/apple
router.post(
  '/auth/apple',
  validateBody(z.object({
    identityToken: z.string(),
    user: z.object({
      email: z.string().email(),
      name: z.string(),
    }).optional(),
  })),
  async (req, res) => {
    try {
      // Verify token with Apple
      const tokenResponse = await axios.post(
        'https://appleid.apple.com/auth/token',
        {
          client_id: process.env.APPLE_CLIENT_ID,
          client_secret: generateClientSecret(),  // requires private key
          code: req.body.identityToken,
          grant_type: 'authorization_code',
        }
      );

      // Extract Apple user info
      const tokenPayload = JSON.parse(
        Buffer.from(tokenResponse.data.id_token.split('.')[1], 'base64').toString()
      );

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { appleId: tokenPayload.sub },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            appleId: tokenPayload.sub,
            email: req.body.user?.email || tokenPayload.email,
            name: req.body.user?.name || 'User',
            password: '', // no password for Apple auth
          },
        });
      }

      const tokens = AuthService.generateTokens(user.id);
      res.json({ success: true, data: { user, ...tokens } });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Apple auth failed' });
    }
  }
);
```

**Frontend Apple Sign-In**:
```typescript
// frontend/src/screens/Login/AppleSignIn.tsx

import * as AppleAuthentication from 'expo-apple-authentication';
import { axiosInstance } from '../services/api';

export const AppleSignInButton: React.FC = () => {
  const handlePress = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Send to backend
      const response = await axiosInstance.post('/api/auth/apple', {
        identityToken: credential.identityToken,
        user: {
          email: credential.email,
          name: `${credential.fullName?.givenName} ${credential.fullName?.familyName}`,
        },
      });

      // Login successful
      authContext.login(response.data.data);
    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled
        return;
      }
      console.error('Apple SignIn error:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>Sign in with Apple</Text>
    </TouchableOpacity>
  );
};
```

---

### Step 2.4: Secure Token Storage

**Goal**: Use secure enclave for tokens.

**Implementation**:
```typescript
// frontend/src/services/secureStorage.ts

import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async setAccessToken(token: string) {
    await SecureStore.setItemAsync('auth_access', token);
  },

  async getAccessToken() {
    return SecureStore.getItemAsync('auth_access');
  },

  async setRefreshToken(token: string) {
    await SecureStore.setItemAsync('auth_refresh', token);
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync('auth_refresh');
  },

  async clearAll() {
    await SecureStore.deleteItemAsync('auth_access');
    await SecureStore.deleteItemAsync('auth_refresh');
  },
};
```

**⚠️ Never do this**:
```typescript
// ❌ WRONG - tokens in AsyncStorage are readable by any app
AsyncStorage.setItem('token', jwt);

// ❌ WRONG - tokens in Redux store are in memory, logged in debugger
store.dispatch(setToken(jwt));

// ❌ WRONG - tokens in console
console.log('Token:', jwt);
```

---

### Step 2.5: Recurring Tasks Schema & Logic

**Goal**: Add support for daily/weekly/monthly recurring tasks.

**Database Schema Addition**:
```prisma
// Add to Task model in schema.prisma
model Task {
  // ... existing fields
  
  // Recurrence fields
  isRecurring        Boolean   @default(false)
  recurrenceRule     Json?     // { type, interval, daysOfWeek, dayOfMonth, endDate }
  recurrenceParentId String?
  
  recurrenceParent   Task?     @relation("TaskRecurrence", fields: [recurrenceParentId], references: [id])
  recurrenceChildren Task[]    @relation("TaskRecurrence")
}
```

**Recurrence Service**:
```typescript
// backend/src/services/recurrence.service.ts
interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;          // Every X days/weeks/months
  daysOfWeek?: number[];     // For weekly: [1, 3, 5] = Mon, Wed, Fri
  dayOfMonth?: number;       // For monthly: 15 = 15th
  endDate?: Date;
  endAfterCount?: number;
}

export class RecurrenceService {
  async createRecurringTask(
    userId: string,
    taskData: CreateTaskDto,
    rule: RecurrenceRule
  ) {
    // Create parent task
    const parentTask = await prisma.task.create({
      data: {
        ...taskData,
        userId,
        isRecurring: true,
        recurrenceRule: rule,
      },
    });

    // Generate next occurrence
    await this.generateNextOccurrence(parentTask);
    
    return parentTask;
  }

  async generateNextOccurrence(parentTask: Task) {
    const rule = parentTask.recurrenceRule as RecurrenceRule;
    const nextDate = this.calculateNextDate(new Date(), rule);
    
    if (rule.endDate && nextDate > rule.endDate) {
      return null; // Recurrence ended
    }

    return prisma.task.create({
      data: {
        title: parentTask.title,
        description: parentTask.description,
        priority: parentTask.priority,
        estimatedDuration: parentTask.estimatedDuration,
        userId: parentTask.userId,
        dueDate: nextDate,
        recurrenceParentId: parentTask.id,
      },
    });
  }

  calculateNextDate(from: Date, rule: RecurrenceRule): Date {
    const next = new Date(from);
    
    switch (rule.type) {
      case 'daily':
        next.setDate(next.getDate() + rule.interval);
        break;
      case 'weekly':
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          // Find next matching day
          do {
            next.setDate(next.getDate() + 1);
          } while (!rule.daysOfWeek.includes(next.getDay()));
        } else {
          next.setDate(next.getDate() + (7 * rule.interval));
        }
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + rule.interval);
        if (rule.dayOfMonth) {
          next.setDate(rule.dayOfMonth);
        }
        break;
    }
    
    return next;
  }

  // Call this when a recurring task is completed
  async onTaskCompleted(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { recurrenceParent: true },
    });

    if (task?.recurrenceParentId) {
      // Generate next occurrence from parent
      const parent = task.recurrenceParent!;
      await this.generateNextOccurrence(parent);
    }
  }
}
```

**Voice Command Parsing for Recurring**:
```typescript
// Detect recurring patterns in voice commands
const RECURRING_PATTERNS = [
  { pattern: /every\s+day|daily/i, rule: { type: 'daily', interval: 1 } },
  { pattern: /every\s+morning/i, rule: { type: 'daily', interval: 1 } },
  { pattern: /every\s+week|weekly/i, rule: { type: 'weekly', interval: 1 } },
  { pattern: /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, 
    handler: (match) => ({ type: 'weekly', interval: 1, daysOfWeek: [dayToNumber(match[1])] }) },
  { pattern: /every\s+month|monthly/i, rule: { type: 'monthly', interval: 1 } },
  { pattern: /on\s+the\s+(\d+)(st|nd|rd|th)\s+of\s+every\s+month/i,
    handler: (match) => ({ type: 'monthly', interval: 1, dayOfMonth: parseInt(match[1]) }) },
];

function parseRecurrence(command: string): RecurrenceRule | null {
  for (const { pattern, rule, handler } of RECURRING_PATTERNS) {
    const match = command.match(pattern);
    if (match) {
      return handler ? handler(match) : rule;
    }
  }
  return null;
}
```

---

### Step 2.6: Hybrid Unlock System

**Goal**: Implement unlock via time OR milestones (whichever first).

**Updated Unlock Definitions**:
```typescript
// backend/src/config/unlocks.ts
interface UnlockDefinition {
  feature: string;
  title: string;
  description: string;
  
  // Either condition unlocks the feature
  daysRequired: number;
  milestonesRequired?: {
    eventType: string;
    count: number;
  };
}

export const UNLOCK_DEFINITIONS: UnlockDefinition[] = [
  {
    feature: 'personalized_greetings',
    title: 'Personalized Greetings',
    description: 'Mylo remembers your name and time preferences',
    daysRequired: 3,
    milestonesRequired: { eventType: 'app_opened', count: 5 },
  },
  {
    feature: 'peak_hours',
    title: 'Peak Hours Insight',
    description: 'See when you're most productive',
    daysRequired: 7,
    milestonesRequired: { eventType: 'task_completed', count: 10 },
  },
  {
    feature: 'ai_task_sorting',
    title: 'Smart Task Sorting',
    description: 'AI prioritizes your tasks based on patterns',
    daysRequired: 7,
    milestonesRequired: { eventType: 'task_created', count: 15 },
  },
  {
    feature: 'duration_estimation',
    title: 'Duration Estimation',
    description: 'AI predicts how long tasks will take',
    daysRequired: 14,
    milestonesRequired: { eventType: 'focus_completed', count: 20 },
  },
  {
    feature: 'predictive_mode',
    title: 'Predictive Mode',
    description: "AI anticipates what you'll struggle with",
    daysRequired: 30,
    milestonesRequired: { eventType: 'task_completed', count: 50 },
  },
  {
    feature: 'overwhelm_detection',
    title: 'Overwhelm Detection',
    description: 'AI notices when you have too much',
    daysRequired: 30,
    milestonesRequired: { eventType: 'high_load_day', count: 5 },
  },
];
```

**Hybrid Check Logic**:
```typescript
// backend/src/services/unlock.service.ts
async function checkHybridUnlock(
  userId: string,
  definition: UnlockDefinition
): Promise<{ eligible: boolean; reason: 'time' | 'milestone' | null; progress: UnlockProgress }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const daysSinceSignup = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check time-based eligibility
  const timeEligible = daysSinceSignup >= definition.daysRequired;
  const timeProgress = Math.min(daysSinceSignup / definition.daysRequired, 1);

  // Check milestone-based eligibility
  let milestoneEligible = false;
  let milestoneProgress = 0;
  
  if (definition.milestonesRequired) {
    const eventCount = await prisma.userEvent.count({
      where: {
        userId,
        type: definition.milestonesRequired.eventType,
      },
    });
    milestoneEligible = eventCount >= definition.milestonesRequired.count;
    milestoneProgress = Math.min(eventCount / definition.milestonesRequired.count, 1);
  }

  return {
    eligible: timeEligible || milestoneEligible,
    reason: timeEligible ? 'time' : milestoneEligible ? 'milestone' : null,
    progress: {
      timeDays: daysSinceSignup,
      timeRequired: definition.daysRequired,
      timeProgress,
      milestoneCount: definition.milestonesRequired 
        ? await prisma.userEvent.count({ where: { userId, type: definition.milestonesRequired.eventType } })
        : 0,
      milestoneRequired: definition.milestonesRequired?.count ?? 0,
      milestoneProgress,
    },
  };
}
```

**Progress API Endpoint**:
```typescript
// GET /api/unlocks/progress
router.get('/progress', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  
  const progress = await Promise.all(
    UNLOCK_DEFINITIONS.map(async (def) => {
      const unlocked = await prisma.userUnlock.findUnique({
        where: { userId_feature: { userId, feature: def.feature } },
      });
      
      if (unlocked) {
        return { ...def, unlocked: true, unlockedAt: unlocked.unlockedAt };
      }
      
      const check = await checkHybridUnlock(userId, def);
      return {
        ...def,
        unlocked: false,
        progress: check.progress,
        canUnlockVia: check.eligible 
          ? check.reason 
          : check.progress.timeProgress > check.progress.milestoneProgress 
            ? 'time' 
            : 'milestone',
      };
    })
  );
  
  res.json({ unlocks: progress });
});
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
Create AI Orb component - visual representation of Mylo.

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

Settings option: "Hey Mylo" wake word

When enabled:
1. Continuous low-power listening for "Hey Mylo"
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

This is the "magic" that makes Mylo feel like it knows you.
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

**Performance Metrics** (hard targets):

```typescript
// Profile key operations with React Native Debugger
import { Performance } from 'react-native-performance';

Performance.mark('app_start');

// ... app startup code ...

Performance.mark('app_end');
Performance.measure('app_startup', 'app_start', 'app_end');
// Should be < 2000ms

// For gesture performance:
Performance.mark('swipe_start');
// ... swipe handling ...
Performance.mark('swipe_end');
Performance.measure('swipe', 'swipe_start', 'swipe_end');
// Should be < 16ms (60fps)
```

**Specific Optimizations**:

```typescript
// 1. Memoize components to prevent re-renders
const TaskItem = React.memo(({ task, onPress }) => {
  return <TaskItemComponent task={task} onPress={onPress} />;
}, (prevProps, nextProps) => {
  // Custom comparison if needed
  return prevProps.task.id === nextProps.task.id;
});

// 2. Use FlatList for long lists (never use ScrollView for many items)
<FlatList
  data={tasks}
  renderItem={({ item }) => <TaskItem task={item} />}
  keyExtractor={item => item.id}
  initialNumToRender={20}  // Render less initially
  maxToRenderPerBatch={10}  // Batch smaller chunks
  updateCellsBatchingPeriod={50}  // Batch updates
  removeClippedSubviews={true}  // Remove off-screen items
/>

// 3. Lazy load images and components
const TaskListImage = lazy(() => import('./TaskListImage'));

// 4. Use Reanimated for 60fps animations
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

// Uses GPU, not JS thread
```

**Bundle Optimization**:
```bash
# Analyze bundle size
npx metro-bundle-analyzer

# Key targets:
# - react-native-reanimated: must have (~500KB)
# - @react-native-voice/voice: ~200KB
# - Total app: < 15MB for IPA
# - Initial JS bundle: < 2MB
```

**Database Query Optimization**:
```typescript
// ❌ Slow - N+1 problem
const tasks = await prisma.task.findMany();
for (const task of tasks) {
  task.focusSession = await prisma.focusSession.findUnique({
    where: { id: task.focusSessionId }
  });
}

// ✅ Fast - single query with include
const tasks = await prisma.task.findMany({
  include: { focusSession: true },  // Fetched in one query
  take: 20,  // Pagination
  skip: 0,
  orderBy: { dueDate: 'asc' },
});

// ✅ Even better - select only needed fields
const tasks = await prisma.task.findMany({
  select: {
    id: true,
    title: true,
    dueDate: true,
    focusSession: { select: { duration: true } },
  },
});
```

**Caching Strategy**:
```typescript
// Frontend: Use TanStack Query for smart caching
import { useQuery } from '@tanstack/react-query';

const { data: tasks } = useQuery({
  queryKey: ['tasks', userId],
  queryFn: () => fetchTasks(userId),
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,    // Keep in cache 10 minutes
  retry: 2,
});

// Backend: Cache with Redis
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const getCachedTasks = async (userId: string) => {
  const cached = await redis.get(`tasks:${userId}`);
  if (cached) return JSON.parse(cached);

  const tasks = await prisma.task.findMany({ where: { userId } });
  
  // Cache for 5 minutes
  await redis.setex(`tasks:${userId}`, 300, JSON.stringify(tasks));
  return tasks;
};

// Invalidate on mutations
await redis.del(`tasks:${userId}`);  // When task changes
```

---

### Step 6.2: Testing Strategy

**Goal**: Comprehensive testing at all layers.

**Agent**: Cursor (Claude)

**Unit Testing** (backend):
```typescript
// backend/__tests__/services/event.service.test.ts

import { EventService } from '../../src/services/event.service';
import { prisma } from '../../src/config/database';

describe('EventService', () => {
  afterEach(async () => {
    // Cleanup after each test
    await prisma.userEvent.deleteMany({});
  });

  it('should log event successfully', async () => {
    const userId = 'test-user';
    
    await EventService.logEvent(
      userId,
      'task_created',
      'tasks',
      { taskId: '123' }
    );

    const events = await prisma.userEvent.findMany({
      where: { userId }
    });

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('task_created');
  });

  it('should handle batch logging', async () => {
    const userId = 'test-user';
    
    const count = await EventService.logEventsBatch(userId, [
      { type: 'task_created', screen: 'tasks' },
      { type: 'task_completed', screen: 'tasks' },
    ]);

    expect(count).toBe(2);
  });

  it('should clean up old events', async () => {
    const userId = 'test-user';
    
    // Create event with old timestamp
    await prisma.userEvent.create({
      data: {
        userId,
        type: 'task_created',
        screen: 'tasks',
        timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),  // 100 days ago
      },
    });

    const deleted = await EventService.deleteOldEvents(90);
    
    expect(deleted).toBe(1);
  });
});
```

**Integration Testing** (backend):
```typescript
// backend/__tests__/integration/auth.test.ts

import request from 'supertest';
import app from '../../src/app';

describe('Auth Integration', () => {
  it('should complete full auth flow', async () => {
    // 1. Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'testpass123',
        name: 'Test User',
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.accessToken).toBeDefined();
    expect(registerRes.body.data.refreshToken).toBeDefined();

    // 2. Use access token to call protected route
    const tasksRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${registerRes.body.data.accessToken}`);

    expect(tasksRes.status).toBe(200);

    // 3. Refresh token
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: registerRes.body.data.refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
  });
});
```

**Component Testing** (frontend):
```typescript
// frontend/__tests__/components/AIOrb.test.tsx

import { render, fireEvent } from '@testing-library/react-native';
import AIOrb from '../../src/components/AIOrb';

describe('AIOrb', () => {
  it('should render in idle state', () => {
    const { getByTestId } = render(<AIOrb state="idle" />);
    
    expect(getByTestId('ai-orb')).toBeDefined();
    expect(getByTestId('ai-orb-glow')).toHaveStyle({ opacity: 0.5 });
  });

  it('should call onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AIOrb state="idle" onPress={onPress} />
    );

    fireEvent.press(getByTestId('ai-orb-button'));
    expect(onPress).toHaveBeenCalled();
  });

  it('should change animation in listening state', () => {
    const { getByTestId, rerender } = render(<AIOrb state="idle" />);
    
    rerender(<AIOrb state="listening" />);
    
    expect(getByTestId('ai-orb-glow')).toHaveStyle({ opacity: 0.8 });
  });
});
```

**E2E Testing** (Detox):
```typescript
// frontend/e2e/auth.e2e.ts

describe('Auth Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete login flow', async () => {
    // Navigate to login
    await element(by.id('login-tab')).tap();

    // Enter credentials
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('testpass123');

    // Tap login
    await element(by.id('login-button')).multiTap();

    // Verify logged in (tasks screen should appear)
    await waitFor(element(by.id('tasks-list')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should persist login after app restart', async () => {
    // App is logged in from previous test
    await device.sendToBackground(3000);
    await device.bringToFront();

    // Should still be logged in
    await waitFor(element(by.id('tasks-list')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

**Testing Checklist**:
```
UNIT TESTS
[ ] Event logging service (create, batch, cleanup)
[ ] Auth service (register, login, refresh)
[ ] Task service (CRUD, filtering)
[ ] Unlock system (check eligibility, grant)
[ ] Pattern calculator (peak hours, completion rates)

INTEGRATION TESTS
[ ] Auth flow (register → login → refresh → logout)
[ ] Task creation → event logging → pattern update
[ ] Voice command → intent parsing → action execution
[ ] Database migrations (run and rollback)

E2E TESTS
[ ] First-time user flow (register → onboarding → create task)
[ ] Voice interaction (tap orb → speak → confirm)
[ ] Gesture navigation (all swipe directions)
[ ] Focus session (create, complete, streak update)

COVERAGE TARGETS
[ ] 80% branch coverage for critical services
[ ] 100% of auth flows
[ ] 100% of event logging paths
[ ] All error conditions
```

---

### Step 6.3: Error Boundaries & Global Error Handling

**Goal**: No white screens of death.

**Error Boundary Component**:
```typescript
// frontend/src/components/ErrorBoundary.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    logger.error('React error boundary caught', {
      error: error.toString(),
      errorInfo,
    });

    // Send to Sentry
    if (process.env.NODE_ENV === 'production') {
      captureException(error, { extra: errorInfo });
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return (
          <this.props.fallback
            error={this.state.error!}
            retry={this.retry}
          />
        );
      }

      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, marginBottom: 20 }}>
            Something went wrong
          </Text>
          <TouchableOpacity
            onPress={this.retry}
            style={{ padding: 12, backgroundColor: '#6C5CE7', borderRadius: 8 }}
          >
            <Text style={{ color: 'white' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
```

**Global Error Handler**:
```typescript
// frontend/src/utils/errorHandler.ts

import { axiosInstance } from '../services/api';

export const setupErrorHandling = () => {
  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason });
  });

  // API errors
  axiosInstance.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 500) {
        logger.error('Server error', {
          status: error.response.status,
          data: error.response.data,
        });

        // Show user-friendly message
        showErrorAlert('Something went wrong. Our team has been notified.');
      }

      return Promise.reject(error);
    }
  );
};
```

---

### Step 6.4-6.10: Polish Checklist

This section becomes your final checklist:

```markdown
## PHASE 6: FINAL QUALITY CHECKLIST

### Performance
- [ ] App startup < 2 seconds
- [ ] Screen transition < 300ms  
- [ ] Gesture response < 16ms (60fps)
- [ ] API responses < 1 second
- [ ] Memory usage < 150MB
- [ ] No memory leaks (test 5 min of usage)

### Testing
- [ ] Unit tests for all services
- [ ] Integration tests for auth and critical flows
- [ ] E2E tests for user journeys
- [ ] 80%+ code coverage
- [ ] All error states tested

### Security
- [ ] No secrets in code or logs
- [ ] HTTPS enforced
- [ ] JWT token refresh works
- [ ] Tokens stored securely
- [ ] Input validation on all routes
- [ ] Rate limiting active
- [ ] CORS properly configured

### Accessibility
- [ ] All buttons have accessibilityLabel
- [ ] Images have accessibility descriptions
- [ ] Touch targets 44x44 minimum
- [ ] Color contrast passes WCAG AA
- [ ] VoiceOver/TalkBack tested

### User Experience
- [ ] Loading states for all async operations
- [ ] Empty states for lists
- [ ] Error messages are helpful
- [ ] No console errors
- [ ] Offline mode works
- [ ] Reconnection handling smooth

### App Store Requirements
- [ ] App icon (1024x1024)
- [ ] Privacy policy written
- [ ] Terms of service written
- [ ] Screenshots prepared (min 2, max 5)
- [ ] App description compelling
- [ ] Contact email in app
- [ ] Age rating appropriate
```

---

# PHASE 7: DEPLOYMENT
## Week 7

### Deployment Strategy

From a senior developer perspective, deployment should be:
1. **Automated** - no manual steps, use CI/CD
2. **Tested** - staging environment mirrors production
3. **Monitored** - alerts for errors, performance issues
4. **Reversible** - rollbacks should be < 5 minutes
5. **Observable** - logging, tracing, metrics everything

---

### Step 7.1: Backend Deployment Setup

**Goal**: Prepare backend for production with proper monitoring.

**Agent**: Cursor (Claude)

**Choice: Railway (recommended) vs AWS vs Heroku**

| Platform | Cost | Ease | Monitoring | Cold Starts |
|----------|------|------|-----------|-------------|
| Railway | $20/month | ⭐⭐⭐⭐ | Good | None |
| Render | $12/month | ⭐⭐⭐ | Basic | 30s |
| AWS | Variable | ⭐⭐ | Excellent | N/A |
| Heroku | Expensive | ⭐⭐⭐ | Good | 30s |

**Railway Setup** (recommended):

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Link to your Git repo
railway link

# This creates railway.toml
```

**backend/railway.toml**:
```toml
[build]
builder = "dockerfile"

[deploy]
startCommand = "npm run migrate:deploy && npm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

**backend/Dockerfile** (for Railway):
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY src ./src
COPY tsconfig.json ./

# Build
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Environment Variables** (Railway Dashboard):

Set these in Railway project settings:
```
DATABASE_URL=postgresql://...  (Railway generates this)
REDIS_URL=redis://...  (add Redis plugin)
JWT_SECRET=<generate-long-random-string>
JWT_REFRESH_SECRET=<generate-another-long-random-string>
OPENAI_API_KEY=sk-...
NODE_ENV=production
LOG_LEVEL=info
SENTRY_DSN=https://...
```

**Health Check Configuration**:
```
GET /health
Expected: 200 OK with body { "status": "ok" }
Timeout: 10s
Interval: 30s
Threshold: 3 failures
```

---

### Step 7.2: Database Production Setup

**Goal**: Production database with backups and monitoring.

**Railway PostgreSQL Setup**:

```bash
# Add PostgreSQL plugin in Railway dashboard
# Railway automatically generates DATABASE_URL

# Connect locally to production DB (admin only!)
DATABASE_URL="<copy-from-railway>" npx prisma studio

# Run migrations
DATABASE_URL="<railway-url>" npx prisma migrate deploy

# Verify schema
DATABASE_URL="<railway-url>" npx prisma db execute --stdin < schema_check.sql
```

**schema_check.sql**:
```sql
-- Verify critical tables exist
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify indexes
SELECT COUNT(*) as index_count FROM pg_indexes 
WHERE schemaname = 'public';

-- Check user count
SELECT COUNT(*) as user_count FROM "User";
```

**Backup Strategy**:
```bash
# Railway includes automatic daily backups
# For extra safety, add weekly manual backups:

# Export backup
pg_dump "$PRODUCTION_DATABASE_URL" > backup_$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d).sql s3://mylo-backups/

# Set up cron job (weekly)
0 2 * * 0 /path/to/backup.sh
```

**⚠️ Production Database Rules**:
- Never run destructive migrations without testing in staging
- Always have rollback plan
- Backup before major changes
- Monitor connection pool usage
- Set up alerts for disk space

---

### Step 7.3: Deploy Backend

**Goal**: Backend live on internet with monitoring.

**Railway Deployment**:

```bash
# Deploy current branch
railway up

# View logs
railway logs

# Get production URL
railway domain

# Test health endpoint
curl https://api-prod.railway.app/health
```

**Verification Checklist**:
```
[ ] Health check returns 200
[ ] Database connection works
[ ] Environment variables loaded
[ ] OpenAI API connection verified
[ ] Redis connection established
[ ] Batch job scheduler running
[ ] Error logging active
[ ] Metrics being collected
```

**Monitoring Setup** (Sentry):

```typescript
// backend/src/index.ts

import * as Sentry from "@sentry/node";

// Initialize at startup
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    tracesSampleRate: 0.1,  // Sample 10% of transactions
  });
}

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());

// Manually capture errors
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}
```

---

### Step 7.4: Update Frontend for Production

**Goal**: Point frontend to production API.

**frontend/app.json**:
```json
{
  "expo": {
    "name": "Mylo",
    "slug": "mylo-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "ios": {
      "supportsTabletMode": false,
      "bundleIdentifier": "com.myloapp.ios",
      "buildNumber": "1"
    },
    "plugins": [
      ["expo-apple-authentication"],
      ["@react-native-voice/voice"]
    ],
    "extra": {
      "apiUrl": "https://api-prod.railway.app"
    }
  }
}
```

**frontend/.env.production**:
```env
EXPO_PUBLIC_API_URL=https://api-prod.railway.app
EXPO_PUBLIC_SOCKET_URL=https://api-prod.railway.app
EXPO_PUBLIC_LOG_LEVEL=info
```

**frontend/src/config/env.ts**:
```typescript
export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api-prod.railway.app',
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || 'https://api-prod.railway.app',
  isDevelopment: process.env.NODE_ENV === 'development',
  logLevel: process.env.EXPO_PUBLIC_LOG_LEVEL || 'info',
};
```

---

### Step 7.5: Apple Developer Account Setup

**Goal**: Apple Developer account ready for submissions.

**Setup Steps**:

```
1. Create Apple Developer Account ($99/year)
   - Go to developer.apple.com
   - Click "Account" → "Join the Apple Developer Program"
   - Enroll as Individual or Organization
   - Verify email and payment

2. Create App ID in Xcode
   - Xcode → Preferences → Accounts → Apple IDs
   - Click "Manage Certificates..."
   - Create "Apple Development" certificate

3. Create Bundle ID
   - developer.apple.com
   - Certificates, IDs & Profiles → Identifiers
   - Click "+", select "App ID"
   - Bundle ID: com.yourcompany.mylo
   - Enable Capabilities: Push Notifications, Sign in with Apple

4. Create Provisioning Profile
   - Certificates, IDs & Profiles → Profiles
   - New Profile → App Store
   - Select your App ID and certificate
   - Download profile
```

---

### Step 7.6: Configure EAS Build

**Goal**: Build and sign iOS app for App Store.

**Installation & Setup**:

```bash
cd frontend

# Install EAS CLI
npm install -g eas-cli

# Login with Apple ID
eas login

# Configure for your project
eas build:configure

# This creates eas.json
```

**eas.json** (production configuration):
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildType": "simulator"
      }
    },
    "production": {
      "distribution": "store",
      "autoIncrement": "buildNumber",
      "ios": {
        "image": "latest"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_ASC_APP_ID",
        "appleId": "your@apple.com",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

---

### Step 7.7: Build iOS App for App Store

**Goal**: Create production iOS build.

**Build Process**:

```bash
cd frontend

# Build for production (takes 15-30 minutes)
eas build --platform ios --profile production

# This will:
# 1. Build on EAS servers
# 2. Sign with your certificate
# 3. Upload to Apple servers
# 4. Return build ID

# View build status
eas build:list

# After build completes, it's ready in App Store Connect
```

**While Build Compiles** (prepare metadata):

1. **App Store Screenshots** (required):
   - 6.7" (max): 1290x2796px
   - 6.5": 1284x2778px
   - 5.5": 1242x2208px
   - Create in Figma or Sketch showing:
     - Main feature (AI Orb)
     - Voice interaction
     - Task management
     - Gesture navigation
     - Learning/unlocks

2. **App Store Description** (4000 chars max):
   ```
   Mylo - Your AI Productivity Partner
   
   Meet Mylo, the voice-first AI assistant designed for 
   unstoppable productivity. Just talk to manage tasks, 
   stay focused, and crush your goals.
   
   • Voice-First Interface: Simply talk to your AI orb 
     to create tasks, start focus sessions, and track progress
   • Gesture Navigation: Intuitive swipe gestures replace 
     traditional buttons
   • Smart Learning: AI learns your productivity patterns 
     and unlocks personalized features
   • Focus Sessions: Distraction-free work with timer, 
     streak tracking, and XP rewards
   • Social Circles: Compete with friends, complete 
     challenges, stay accountable
   ```

3. **Keywords**:
   productivity, ai, tasks, voice, focus, assistant, time management

4. **Privacy Policy** (must be HTTPS URL)

5. **Support Website** (must be HTTPS URL)

---

### Step 7.8: App Store Submission

**Goal**: Submit to Apple for review.

**Pre-Submission Checklist**:

```
[ ] Build is ready in App Store Connect
[ ] Screenshots uploaded (all required sizes)
[ ] App description complete and compelling
[ ] Keywords filled in
[ ] Support URL is valid HTTPS
[ ] Privacy policy URL is valid HTTPS
[ ] Category: Productivity
[ ] Age Rating: 4+
[ ] No objectionable content
[ ] Microphone permission reason: "To speak commands"
[ ] No undisclosed features
[ ] App runs without crashes (test build locally)
[ ] Version number matches app.json
```

**Submit via CLI**:

```bash
eas submit --platform ios --profile production
```

**Or manually in App Store Connect**:

1. Go to App Store Connect
2. Select your app
3. Click "Version 1.0" (or current version)
4. Upload screenshots
5. Fill in description, keywords, support URL
6. Answer export compliance (likely "No" for encryption)
7. Save
8. Click "Submit for Review"

**Review Timeline**:
- First submission: 24-48 hours
- Updates: 24 hours  
- Rejections: Usually fixable, 2nd try usually succeeds

---

### Step 7.9: Post-Launch Monitoring

**Goal**: Monitor app health after launch.

**Critical Alerts to Set Up**:

```yaml
Sentry:
  - New crash type → Notify immediately
  - Error rate > 1% → Notify
  - Performance degradation > 50% → Notify

Railway:
  - CPU > 80% → Investigate
  - Memory > 200MB → Investigate
  - Database connections > 8 → Check for leaks
  - 5xx errors > threshold → Page on-call

App Store Connect:
  - 1-star reviews → Read immediately
  - Crash reports > 5% → Critical
```

**Daily Monitoring Routine** (first week):

```
1. Check Sentry dashboard for new errors
2. Review crash reports in App Store Connect
3. Check Railway logs for 5xx errors
4. Monitor database connection health
5. Check user feedback in reviews
6. Verify batch jobs completed
7. Check API response times
```

**Metrics to Track**:
- Daily active users (DAU)
- Crash rate (target: < 0.1%)
- Error rate (target: < 0.5%)
- API latency p95 (target: < 500ms)
- Voice command success rate (target: > 95%)
- Session duration (avg)

---

### Step 7.10: Rollback & Disaster Recovery

**Goal**: Be prepared for problems.

**Rollback Procedures**:

```bash
# Backend rollback (Railway)
# If current deploy is broken:

# 1. See deployment history
railway deployments

# 2. Rollback to previous version
railway rollback <deployment-id>

# 3. Verify health
curl https://api-prod.railway.app/health

# 4. Check logs
railway logs --since=1h
```

**Database Rollback** (if migration fails):

```bash
# List migrations
npx prisma migrate status

# Rollback one migration
npx prisma migrate resolve --rolled-back 20240202_add_learning_system

# Redeploy
npx prisma migrate deploy
```

**Frontend Rollback** (via App Store Connect):

App Store builds are versioned:
- Cannot "rollback" but can submit fix
- Users with broken version should update
- Add version compatibility check if needed

```typescript
// backend/src/routes/health.ts
GET /health/app-version
Returns: { minVersion: "1.0.1", recommendedVersion: "1.0.1" }

// frontend can check and force update if below minVersion
```

**Disaster Recovery Plan**:

```
IF DATABASE CORRUPTED:
  1. Restore from backup (Railway has auto-backups)
  2. Verify data integrity
  3. Test in staging first
  4. Re-deploy backend
  5. Communicate with users

IF API REPEATEDLY CRASHES:
  1. Check logs for error pattern
  2. Rollback to previous deploy
  3. Fix issue locally
  4. Re-deploy
  5. Run extra tests

IF REDIS FAILS:
  1. Restart Redis
  2. Cache will rebuild naturally
  3. No data loss (cache only)

IF BATCH JOB FAILS:
  1. Check logs for error
  2. Fix and test locally
  3. Restart batch job
  4. Manual recalculation if needed
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

---

# SUMMARY

## Total Steps: 70+ Detailed Implementations

| Phase | Steps | Duration | Focus | Status |
|-------|-------|----------|-------|--------|
| **0: Audit** | 6 | 2-3 days | Verify current state | Foundation |
| **1: Backend** | 10 | 1 week | AI features, security | Core APIs |
| **2: Auth** | 4 | 3-4 days | Database, tokens, security | User system |
| **3: Gestures** | 10 | 1 week | Navigation system | UX layer |
| **4: Voice** | 10 | 1 week | Voice-first interface | AI layer |
| **5: Learning** | 10 | 1 week | AI personalization | Intelligence |
| **6: Testing** | 10 | 1 week | Testing, UX, bugs | Quality |
| **7: Deploy** | 10 | 1 week | App Store launch | Production |

**Total: ~7-8 weeks** (with buffer for App Store review)

---

## Critical Path & Dependencies

```
WEEK 1:
├─ Phase 0: Environment verification (Days 1-3)
├─ Phase 1: Backend event logging (Days 3-7)
└─ Database: Learning tables created

WEEK 2:
├─ Phase 1: Batch jobs, learning system (Days 1-3)
├─ Phase 2: Auth complete (Days 3-4)
└─ Frontend: Can authenticate

WEEK 3:
├─ Phase 3: Gesture navigation (all week)
└─ Backend: All routes ready

WEEK 4:
├─ Phase 4: Voice system (all week)
└─ Frontend: Gestures + voice working

WEEK 5:
├─ Phase 5: AI learning & unlocks (all week)
└─ Backend: All AI features active

WEEK 6:
├─ Phase 6: Testing & optimization (all week)
└─ App: Ready for launch

WEEK 7:
├─ Phase 7: Deployment (all week)
└─ App Store: Submitted

WEEK 8:
└─ Buffer: App Store review + emergency fixes
```

---

## Technology Stack - Production Validated

### Backend
```
Express.js 4.18.2        - Web framework
Prisma 5.7+              - ORM (includes migrations)
PostgreSQL 15+           - Database
TypeScript 5.3+          - Type safety
OpenAI SDK 4.26+         - AI integration
node-cron 3.0+           - Scheduled jobs
redis 4.6+               - Cache layer
bcryptjs 2.4.3           - Password hashing
jsonwebtoken 9.1+        - Auth tokens
zod 3.22+                - Input validation
```

### Frontend
```
React Native 0.72+       - UI framework
Expo SDK 50+             - Development/build
TypeScript 5.3+          - Type safety
react-native-gesture-handler 2.14+ - Swipe gestures
react-native-reanimated 3.6+       - 60fps animations
@tanstack/react-query 5.28+        - Data fetching + cache
zustand 4.4+             - State management
expo-secure-store 12+    - Secure token storage
@react-native-voice/voice 3.2+     - Speech-to-text
expo-speech 12+          - Text-to-speech
expo-apple-authentication 6.2+     - Apple Sign-In
axios 1.6+               - HTTP client
```

### Deployment
```
Railway                  - Backend hosting
EAS                      - iOS build service
App Store Connect        - iOS publishing
Sentry                   - Error tracking
PostgreSQL 15+ on Railway - Managed database
Redis on Railway         - Managed cache
```

---

## Senior Developer Decision Matrix

### When to Use Zustand vs Redux
- **Zustand**: < 5000 LOC, < 3 state slices → Zustand
- **Redux**: > 10000 LOC, complex interactions → Redux
- **Context**: < 500 LOC, single screen → Context
- **Mylo**: ~4000 LOC total → Zustand is perfect

### When to Cache vs Query Fresh
- **Cache**: Read-heavy (tasks list, user profile, unlocks)
- **Fresh**: Write-sensitive (task completion, focus state)
- **Strategy**: Cache tasks, cache user model, query fresh on mutations

### When to Use Soft Deletes
- **Soft delete**: User account, conversations, tasks
- **Hard delete**: Events > 90 days, temp audit records
- **Mylo**: Use soft deletes everywhere (compliance, recovery)

### When to Batch Operations
- **Batch**: Events logging (10-100 per batch)
- **Individual**: Real-time updates (task completion)
- **Mylo**: Batch event logging, individual task mutations

### When to Use Transactions
- **Transaction**: Multi-table updates (unlock + event + stat)
- **No transaction**: Single table (just log event)
- **Mylo**: Transaction for unlock + celebration flow

---

## Common Gotchas & Solutions

### 🚨 Gotcha: Token Expires During 2-Hour Focus Session
**Problem**: JWT token expires after 15 minutes, user on long focus session
**Solution**: Backend silently refreshes token every 30 minutes
```typescript
setInterval(async () => {
  const token = await secureStorage.getRefreshToken();
  if (token) {
    // Refresh in background
    axiosInstance.post('/api/auth/refresh', { refreshToken: token });
  }
}, 30 * 60 * 1000);
```

### 🚨 Gotcha: React Query Cache Staleness After Mutations
**Problem**: Create task, but task list still shows old data
**Solution**: Invalidate exact cache keys on mutation
```typescript
const mutation = useMutation({
  mutationFn: createTask,
  onSuccess: (newTask) => {
    queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    queryClient.invalidateQueries({ queryKey: ['unlocks'] });
  }
});
```

### 🚨 Gotcha: Microphone Permission Lost on iOS App Kill
**Problem**: App background killed → voice permission revoked
**Solution**: Re-request permission on voice screen enter
```typescript
useEffect(() => {
  requestMicrophonePermission();
}, []);
```

### 🚨 Gotcha: Database Connection Pool Exhaustion
**Problem**: Railway connections timeout → app errors
**Solution**: Set connection limits in DATABASE_URL
```
postgresql://...?connection_limit=5&pool_size=5
```

### 🚨 Gotcha: N+1 Query on Large Task Lists
**Problem**: 100 tasks → 1 query for tasks + 100 queries for focus sessions
**Solution**: Always include relations
```typescript
const tasks = await prisma.task.findMany({
  include: { focusSession: { select: { duration: true } } }
});
```

### 🚨 Gotcha: Silent Event Logging Failures
**Problem**: Event logging fails, user doesn't know, learning data corrupted
**Solution**: Never block UI, log failures separately
```typescript
logEvent(...).catch(error => {
  logger.error('Event logging failed', { error });
  // Don't throw - event logging must never fail user experience
});
```

### 🚨 Gotcha: Gesture Conflicts on Android
**Problem**: Swipe left triggers navigation + closes notification panel
**Solution**: Test extensively on real Android device, disable system gestures
```typescript
// Verify doesn't conflict with system
<GestureDetector gesture={swipeGesture} enabled={!hasSystemGestureConflict} />
```

### 🚨 Gotcha: Voice Command Works on Simulator, Not on Device
**Problem**: STT works on iPhone simulator, fails on real device (permission)
**Solution**: Always test voice on real device
```bash
eas build --platform ios --profile preview
# Install on real device via TestFlight
```

---

## Troubleshooting Guide

### Frontend Issues

**Symptom**: "White screen after splash"
```
1. Check React DevTools for render errors
2. Enable error boundary
3. Check backend is reachable (network tab)
4. Check token is stored in secure storage
5. Check app.json configured correctly
```

**Symptom**: "Gestures don't work"
```
1. Verify react-native-gesture-handler installed
2. Check enabledRootViewGestureHandler() called
3. Test on real device (simulators have gesture lag)
4. Check no conflicting gestures
5. Increase threshold if too sensitive
```

**Symptom**: "Voice doesn't work"
```
1. Check microphone permission granted
2. Test on real device (simulator limited)
3. Check language matches device
4. Verify internet connection (STT requires upload)
5. Check error logs in Sentry
```

### Backend Issues

**Symptom**: "Database migrations fail"
```
1. Check DATABASE_URL is correct
2. Verify database exists and accessible
3. Check for existing migrations in conflict
4. Run: npx prisma migrate status
5. If stuck: npx prisma migrate reset (DEV ONLY)
```

**Symptom**: "OpenAI API returns 401"
```
1. Verify OPENAI_API_KEY is set
2. Check key hasn't been revoked
3. Verify correct model name (gpt-4, not gpt-4-turbo)
4. Check rate limit not hit
5. Test: curl -H "Authorization: Bearer $OPENAI_API_KEY" ...
```

**Symptom**: "Batch job not running"
```
1. Check NODE_ENV=production
2. Verify cron schedule correct (24-hour format)
3. Check timezone matches server (UTC)
4. Look for logs: DATABASE_URL=... npm run dev
5. Manually trigger: POST /admin/run-learning-job
```

**Symptom**: "500 error on random requests"
```
1. Check database connection pool size
2. Look for unhandled promise rejections
3. Check Redis connection if using cache
4. Monitor memory (might be heap overflow)
5. Check logs: railway logs --since=1h
```

### Deployment Issues

**Symptom**: "App Store Connect build not appearing"
```
1. Wait 5-10 minutes (takes time to upload)
2. Check build status: eas build:list
3. Verify build completed successfully
4. Check TestFlight tab (builds appear there first)
5. Check signing certificate is valid
```

**Symptom**: "App Store rejects with 'Missing Required Entitlements'"
```
1. Check app.json has correct plugins
2. Verify all capabilities are enabled in developer account
3. Check Podfile is updated (run: cd ios && pod install)
4. Re-create provisioning profile
```

**Symptom**: "Performance is terrible on device"
```
1. Profile with React DevTools Profiler
2. Check for re-render storms (components rendering 100x/sec)
3. Use FlatList for all lists (never ScrollView + 100 items)
4. Check gesture animations are 60fps (Profiler)
5. Profile bundle size (npx metro-bundle-analyzer)
```

---

## Scalability Path (When You Grow)

### Stage 1: MVP (~1000 users)
**What we built**: Single Railway instance, single database
**Bottlenecks**: None yet
**Action**: Monitor, don't over-engineer

### Stage 2: Growth (~10k users)
**Bottlenecks**:
- Database CPU spiking during batch job
- API response time > 500ms
**Solutions**:
- Enable read replicas for read-heavy queries
- Add Redis caching layer
- Move batch job to separate service

### Stage 3: Scale (~100k users)
**Bottlenecks**:
- Database: can't fit all data in memory
- API: need load balancing
- Storage: S3 for audio/file storage
**Solutions**:
- Horizontal scaling: multiple Railway instances
- Database: partitioning by userId
- Queue system: Bull for async jobs
- CDN: CloudFlare for static assets

### Stage 4: Enterprise (~1M users)
**Bottlenecks**:
- Everything - need proper infrastructure
**Solutions**:
- Kubernetes for orchestration
- PostgreSQL optimization (Patroni for HA)
- Microservices: separate voice, learning, notifications
- Machine learning: custom models, not OpenAI
- Data warehouse: analytics separate from transactional DB

**Current recommendation**: Start with Railway, migrate to AWS/Kubernetes when > 50k users

---

## Financial Projections (App Store Launch)

### Monthly Costs (MVP Stage)
```
Railway Backend:    $20/month
Railway Database:   $10/month
Railway Redis:      $5/month
Sentry (errors):    $0/month (free tier)
OpenAI API:         $100-500/month (depends on usage)
Domain name:        $1-15/month
Apple Dev Account:  $99/year ($8/month)
─────────────────────────────
Total:             ~$140-600/month
```

### Revenue Model Options
1. **Freemium**: Free core, $3.99/mo for AI features
   - 1000 users × 10% conversion × $3.99 = $400/mo
   - Break-even after ~2 months

2. **Subscription**: $4.99/mo all features
   - Requires immediate value
   - 500 users × $4.99 = $2500/mo

3. **B2B**: Team plans $99/team/month
   - For teams or enterprises

---

## Post-Launch Roadmap (First 6 Months)

```
Week 1-2:   Monitor crashes, respond to reviews
Week 3-4:   Fix critical bugs, add requested features
Month 2:    A/B test onboarding, improve retention
Month 3:    Implement in-app purchases (IAP)
Month 4:    Marketing push, content creators
Month 5:    Android launch
Month 6:    v1.1 major update with new features
```

---

## How to Use This Guide

1. **Start here**: Read phases in order
2. **Environment**: Complete Phase 0 first (don't skip)
3. **Each phase**: Follow steps sequentially
4. **Code examples**: Use them as-is, customize for your app
5. **When stuck**: Check troubleshooting guide
6. **Git commits**: Commit after each step completion
7. **Testing**: Never skip testing phases
8. **Deployment**: Follow security checklist before deploying

---

## One More Thing

From a senior developer perspective:

**The hardest part isn't coding - it's decisions.**

- When to add a library vs build it
- When to sacrifice perfect code for speed
- When to say "good enough"
- When to ask for help

**My advice**:
1. Build the MVP first (get it working)
2. Ship it (get users)
3. Optimize based on real data (not guesses)
4. Refactor when it hurts (not before)

This guide gives you both - complete working code AND production-grade architecture.

**You've got this.** 🚀

---

# Appendix: Quick Reference

## Important Commands

```bash
# Backend
cd backend
npm run dev                 # Start development server
npx prisma migrate dev     # Create and run migration
npx prisma studio         # View database GUI
npm run build              # Build for production
npm start                  # Start production server

# Frontend
cd frontend
npx expo start             # Start development
npx expo start --ios       # Start and open iOS simulator
eas build --platform ios   # Build for App Store
eas build:list             # Check build status
eas submit --platform ios  # Submit to App Store

# Database
DATABASE_URL="..." npx prisma db push  # Apply changes
DATABASE_URL="..." npx prisma db pull  # Pull from prod
DATABASE_URL="..." npx prisma migrate reset  # ⚠️ DEV ONLY

# Git
git add .
git commit -m "Step X.X: Description"
git push origin main

# Deployment
railway up                 # Deploy current branch
railway logs              # View backend logs
railway status            # Check deployment status
```

## Useful Links

- **Backend**: Express docs
- **Frontend**: React Native docs, Expo docs
- **Database**: Prisma docs, PostgreSQL docs
- **Testing**: Jest docs, Detox docs
- **Deployment**: Railway docs, EAS docs, App Store Connect help
- **Monitoring**: Sentry docs, Railway analytics

---

Good luck! You're building something people will love. 🎉

The hard work starts now. The reward is a thriving community using your app.

