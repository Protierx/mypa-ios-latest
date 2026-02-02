# MYPA Backend - Production Audit & Improvement Plan

> **Audit Date**: February 1, 2026  
> **Framework**: Express.js 4.21 + Node.js 18+  
> **Database**: PostgreSQL 14+ (with Prisma 5.22 ORM)  
> **Real-time**: Socket.io 4.8  
> **Language**: TypeScript 5.6  

---

## 📋 Executive Summary

MYPA's backend is a **well-structured Express.js API** with solid foundational patterns (authentication, validation, error handling, Prisma ORM). However, it requires **critical security fixes, authorization enforcement, and operational hardening** before production deployment.

**Overall Production Readiness**: **5.5/10**

### Critical Issues (Must Fix Before Prod)
1. **Authorization bypass risk** - Missing ownership/role checks in 15+ endpoints
2. **CORS allows all origins** in dev config (wildcard `*`)
3. **No rate limiting** - Open to brute force attacks (auth), DDoS
4. **Socket.io CORS misconfigured** - Allows any origin
5. **No request logging** - Can't debug failures in production
6. **No crash reporting** integration (Sentry)
7. **Missing pagination defaults** - List endpoints can return unlimited records
8. **Database connection pooling** not explicitly configured
9. **No validation for UUID parameters** - Injection risk via malformed IDs
10. **Secrets exposure risk** - `.env` in `.gitignore`, but no validation on startup

### High Priority (Fix Before Beta)
- Add comprehensive request logging
- Implement rate limiting (auth: 5 attempts/5min, general: 100 reqs/min)
- Add authorization middleware (verify circle ownership, admin roles)
- Setup health checks and graceful shutdown
- Add API versioning strategy
- Database migration strategy documentation
- Setup Prisma seed script for test data

### Good Practices Already In Place ✅
- JWT with access + refresh token rotation (secure!)
- Password hashing with bcryptjs (10 rounds, industry standard)
- Input validation with Zod (comprehensive schemas)
- Centralized error handler (AppError class)
- Proper HTTP status codes (201 for create, 400 for validation, etc.)
- Socket.io authentication middleware
- Prisma ORM (prevents SQL injection)
- TypeScript throughout (type safety)
- Environment config management

---

## 🗺️ Backend Map

### Runtime & Framework

| Component | Value | Notes |
|-----------|-------|-------|
| **Runtime** | Node.js 18+ | Specified in `package.json` engines |
| **Framework** | Express 4.21.0 | Lightweight, well-tested |
| **Language** | TypeScript 5.6 | Compiled to ES modules |
| **ORM** | Prisma 5.22 | Type-safe, zero runtime dependencies |
| **Database** | PostgreSQL 14+ | Production-grade relational DB |
| **Real-time** | Socket.io 4.8.3 | Bi-directional event streaming |
| **Auth** | JWT (access + refresh) | Token-based, stateless |
| **Validation** | Zod 3.23.8 | Runtime schema validation |
| **Hashing** | bcryptjs 2.4.3 | Password hashing (10 rounds) |

### Entry Points

| File | Purpose |
|------|---------|
| `backend/src/index.ts` (108 lines) | HTTP server creation, Socket.io init, scheduler start, DB connection |
| `backend/src/app.ts` (85 lines) | Express app setup, middleware chain, route registration |
| `package.json` scripts | `npm run dev` (tsx watch), `npm run build` (tsc), `npm start` (node dist) |

### Directory Structure

```
backend/
├── src/
│   ├── index.ts             # Entry point (creates server)
│   ├── app.ts               # Express app setup
│   ├── config/
│   │   ├── env.ts           # Environment variables (validated)
│   │   └── database.ts      # Prisma singleton
│   ├── middleware/
│   │   ├── auth.ts          # JWT verification (authenticateToken, optionalAuth)
│   │   ├── error.ts         # Error handler + AppError class
│   │   └── validation.ts    # Zod validation middleware (validateBody, validateParams, etc.)
│   ├── routes/              # 15 route files (see endpoint inventory below)
│   ├── services/            # 16 service files (business logic)
│   ├── utils/
│   │   ├── xp.ts            # XP calculation formulas
│   │   └── streaks.ts       # Streak logic
│   └── types/
│       └── index.ts         # Shared TypeScript types
├── prisma/
│   └── schema.prisma        # Data model (612 lines)
├── .env                     # Secrets (git-ignored)
├── .env.example             # Template for env vars
└── tsconfig.json            # TypeScript configuration

```

### Middleware Chain

**Order matters!** Current order in `app.ts`:

```
1. Trust Proxy Enabled          (reverse proxies like nginx)
2. CORS Middleware              (configurable per environment)
3. JSON Parser (10mb limit)      (body-parser)
4. URL-encoded Parser           (form data)
5. Route-specific auth          (authenticateToken on protected routes)
6. Route handlers               (business logic)
7. 404 Handler                  (notFoundHandler)
8. Global Error Handler         (errorHandler - last middleware)
```

**Missing Middleware** (recommend adding):
- Request logging (express.js/morgan or pino)
- Rate limiting (express-rate-limit)
- Request ID tracking (uuid)
- Response compression (compression)
- Helmet (security headers)
- Request timeout (express-timeout)

---

## 📡 Endpoint Inventory

### Auth Routes (`/auth`)

| Method | Path | Auth? | Validation | Status | File | Notes |
|--------|------|-------|-----------|--------|------|-------|
| POST | `/auth/register` | ❌ | Zod (email, password, name) | 201 | `auth.routes.ts:27` | Email unique check, password hashed (10 rounds) |
| POST | `/auth/login` | ❌ | Zod (email, password) | 200 | `auth.routes.ts:49` | Constant-time password compare, checks isActive |
| POST | `/auth/refresh` | ❌ | Zod (refreshToken) | 200 | `auth.routes.ts:69` | Validates token exists in DB, regenerates access token |
| POST | `/auth/logout` | ❌ | Zod (refreshToken) | 200 | `auth.routes.ts:88` | Invalidates single refresh token |
| POST | `/auth/logout-all` | ✅ (JWT) | None | 200 | `auth.routes.ts:110` | Invalidates ALL user's refresh tokens |

**Issues Found:**
- ❌ No rate limiting on `/register` and `/login` → brute force risk
- ❌ Error message "Invalid credentials" is generic (good for security) but response time varies based on user existence (timing attack possible)
- ✅ Password requirements only "min 8 chars" — consider requiring uppercase, number, special char
- ✅ Refresh token invalidated on logout but not on suspicious activity

---

### Users Routes (`/users`)

| Method | Path | Auth? | Validation | Status | Purpose | File |
|--------|------|-------|-----------|--------|---------|------|
| GET | `/users/me` | ✅ | None | 200 | Get current user | `users.routes.ts` |
| PATCH | `/users/me` | ✅ | Zod (name, bio, avatarUrl) | 200 | Update profile | `users.routes.ts` |
| DELETE | `/users/me` | ✅ | None | 200 | Soft delete (isActive=false) | `users.routes.ts` |
| GET | `/users/me/stats` | ✅ | None | 200 | User's gamification stats | `users.routes.ts` |
| GET | `/users/me/settings` | ✅ | None | 200 | User settings (notifications, privacy) | `users.routes.ts` |
| PATCH | `/users/me/settings` | ✅ | Zod (multiple fields) | 200 | Update settings | `users.routes.ts` |
| POST | `/users/me/onboarding` | ✅ | None | 200 | Mark onboarded (+50 XP) | `users.routes.ts` |
| GET | `/users/:username` | ❌ | None | 200 | Get public user profile | `users.routes.ts` |

**Issues Found:**
- ✅ Good: `/users/me` enforces JWT auth
- ❌ No validation on `:username` parameter → potential NoSQL injection if Prisma used unsafely (not an issue with Prisma, but add schema validation)
- ✅ Good: DELETE is soft delete (doesn't destroy data)
- ⚠️ `/users/:username` returns public data only (verify no sensitive fields leaked)

---

### Tasks Routes (`/tasks`)

| Method | Path | Auth? | Validation | Pagination | Status | Purpose | File |
|--------|------|-------|-----------|-----------|--------|---------|------|
| GET | `/tasks` | ✅ | Zod query (date, category, priority, completed) | `limit`, `offset` | 200 | List user's tasks | `tasks.routes.ts:30` |
| POST | `/tasks` | ✅ | Zod body (title required, max 500) | N/A | 201 | Create task | `tasks.routes.ts:70` |
| POST | `/tasks/batch` | ✅ | Zod (array of 1-50 tasks) | N/A | 201 | Batch create | `tasks.routes.ts:95` |
| GET | `/tasks/today` | ✅ | None | N/A | 200 | Today's tasks | `tasks.routes.ts:55` |
| GET | `/tasks/open` | ✅ | None | N/A | 200 | All incomplete tasks | `tasks.routes.ts:60` |
| GET | `/tasks/stats` | ✅ | None | N/A | 200 | Task statistics | `tasks.routes.ts:65` |
| GET | `/tasks/date/:date` | ✅ | Regex (YYYY-MM-DD) | N/A | 200 | Tasks for date | `tasks.routes.ts:80` |
| GET | `/tasks/:id` | ✅ | None | N/A | 200 | Get task by ID | `tasks.routes.ts:100` |
| PATCH | `/tasks/:id` | ✅ | Zod (partial fields) | N/A | 200 | Update task | `tasks.routes.ts:110` |
| DELETE | `/tasks/:id` | ✅ | None | N/A | 200 | Delete task | `tasks.routes.ts:120` |
| POST | `/tasks/:id/complete` | ✅ | None | N/A | 200 | Mark complete (+XP) | `tasks.routes.ts:130` |
| POST | `/tasks/:id/uncomplete` | ✅ | None | N/A | 200 | Mark incomplete | `tasks.routes.ts:140` |

**Issues Found:**
- ❌ **No default `limit` on GET `/tasks`** → Could return ALL tasks (1000s) if client doesn't pass `limit`
  - Fix: Add `limit: limit ? Math.min(limit, 100) : 20` (default 20, max 100)
- ✅ `/tasks/:id` missing ownership verification → **If auth is enforced at route level**, need service-level check
  - Service should verify `task.userId === req.user.id` before modifying
- ✅ Date validation regex good but could be stricter (allows invalid dates like 2026-99-99)
- ✅ XP awarded on task completion — good, but ensure idempotency (complete task twice = 2x XP bug?)

---

### Circles Routes (`/circles`)

| Method | Path | Auth? | Validation | Status | Purpose | File | Issues |
|--------|------|-------|-----------|--------|---------|------|--------|
| GET | `/circles` | ✅ | None | 200 | List user's circles | `circles.routes.ts:40` | ✅ Good |
| POST | `/circles` | ✅ | Zod (name, emoji, color) | 201 | Create circle (user=owner) | `circles.routes.ts:52` | ✅ Good |
| GET | `/circles/:id` | ✅ | None | 200 | Circle details | `circles.routes.ts:70` | ❌ No membership check — returns data if public |
| PATCH | `/circles/:id` | ✅ | Zod (partial) | 200 | Update circle | `circles.routes.ts:90` | ❌ **CRITICAL**: No owner/admin check! Any member can edit |
| DELETE | `/circles/:id` | ✅ | None | 200 | Delete circle | `circles.routes.ts:105` | ❌ **CRITICAL**: No owner check! Any member can delete |
| POST | `/circles/join/:code` | ✅ | None | 200 | Join via invite code | `circles.routes.ts:65` | ✅ Good |
| GET | `/circles/preview/:code` | ❌ | None | 200 | Preview before joining | `circles.routes.ts:60` | ✅ Good |
| POST | `/circles/:id/leave` | ✅ | None | 200 | Leave circle | `circles.routes.ts:120` | ✅ Good |
| GET | `/circles/:id/members` | ✅ | None | 200 | List members | `circles.routes.ts:130` | ✅ Good |
| DELETE | `/circles/:id/members/:userId` | ✅ | None | 200 | Remove member | `circles.routes.ts:145` | ❌ No admin check! Any member can remove others |
| PATCH | `/circles/:id/members/:userId` | ✅ | Zod (role) | 200 | Update member role | `circles.routes.ts:155` | ❌ No admin check! Any member can promote themselves |

**Critical Authorization Issues**:
1. **PATCH `/circles/:id`** - Calls `circleService.updateCircle(userId, circleId, body)` but service doesn't verify owner/admin role
2. **DELETE `/circles/:id`** - Only checks if circle exists, not if user is owner
3. **DELETE `/circles/:id/members/:userId`** - No role check (should be owner/admin only)
4. **PATCH `/circles/:id/members/:userId`** - No role check (should be owner/admin only)

---

### Assignments Routes (`/assignments`)

| Method | Path | Auth? | Validation | Status | Purpose | File | Issues |
|--------|------|-------|-----------|--------|---------|------|--------|
| GET | `/assignments` | ✅ | Query (type: sent/received) | 200 | List assignments | `assignments.routes.ts:30` | ⚠️ No pagination |
| POST | `/assignments` | ✅ | Zod (circleId, assigneeId, title, dueDate, requiresProof) | 201 | Create assignment | `assignments.routes.ts:50` | ❌ No verification that assignee is in circle |
| GET | `/assignments/:id` | ✅ | None | 200 | Get assignment | `assignments.routes.ts:80` | ❌ No ownership check |
| POST | `/assignments/:id/accept` | ✅ | None | 200 | Accept assignment | `assignments.routes.ts:100` | ✅ Good (only assignee can accept) |
| POST | `/assignments/:id/decline` | ✅ | None | 200 | Decline assignment | `assignments.routes.ts:115` | ✅ Good (only assignee can decline) |
| POST | `/assignments/:id/complete` | ✅ | Zod (proofImageUrl optional) | 200 | Complete + award XP | `assignments.routes.ts:130` | ⚠️ No proof validation |
| POST | `/assignments/:id/submit-proof` | ✅ | Zod (proofImageUrl) | 200 | Upload proof photo | `assignments.routes.ts:145` | ⚠️ No image validation (size, format) |

**Issues Found**:
- ❌ No verification that assignee exists in the circle
- ❌ No check that creator has permission to create assignments (should be admin+)
- ⚠️ Proof image URL accepted as string — should validate URL format or implement file upload with virus scan
- ❌ Missing pagination on GET assignments (could return hundreds)

---

### Challenges Routes (`/challenges`)

| Method | Path | Auth? | Validation | Status | Purpose | File | Issues |
|--------|------|-------|-----------|--------|---------|------|--------|
| GET | `/challenges` | ✅ | Query (active, circleId) | 200 | List challenges | `challenges.routes.ts:30` | ⚠️ No pagination (default limit) |
| POST | `/challenges` | ✅ | Zod (title, type, targetValue, dates) | 201 | Create challenge | `challenges.routes.ts:50` | ✅ Good |
| GET | `/challenges/:id` | ✅ | None | 200 | Challenge details | `challenges.routes.ts:75` | ✅ Good |
| POST | `/challenges/:id/join` | ✅ | None | 200 | Join challenge | `challenges.routes.ts:90` | ✅ Good |
| POST | `/challenges/:id/leave` | ✅ | None | 200 | Leave challenge | `challenges.routes.ts:105` | ✅ Good |
| GET | `/challenges/:id/progress` | ✅ | None | 200 | User's progress | `challenges.routes.ts:120` | ✅ Good |
| POST | `/challenges/:id/update-progress` | ✅ | Zod (incrementBy) | 200 | Update progress | `challenges.routes.ts:135` | ❌ Only called by backend on task complete (good) but no anti-cheat |

**Issues Found**:
- ⚠️ No leaderboard caching — if challenge has 1000 participants, recalculating ranks on every request is expensive
- ⚠️ Progress auto-increments but no idempotency check (complete task twice = 2x progress?)

---

### Posts & Feed Routes (`/posts`)

| Method | Path | Auth? | Status | Purpose | File | Issues |
|--------|------|-------|--------|---------|------|--------|
| GET | `/posts` | ✅ | 200 | List posts (all circles) | `posts.routes.ts:30` | ⚠️ No pagination |
| POST | `/posts` | ✅ | 201 | Create post | `posts.routes.ts:50` | ✅ Good |
| GET | `/posts/:id` | ✅ | 200 | Get post details | `posts.routes.ts:75` | ✅ Good |
| PATCH | `/posts/:id` | ✅ | 200 | Update post (author only) | `posts.routes.ts:90` | ✅ Good |
| DELETE | `/posts/:id` | ✅ | 200 | Delete post (author/admin) | `posts.routes.ts:105` | ✅ Good |
| POST | `/posts/:id/react` | ✅ | 200 | Add reaction (emoji) | `posts.routes.ts:120` | ✅ Good |

**Issues Found**:
- ❌ GET `/posts` likely returns ALL posts (no default pagination) — could be thousands
- ✅ Ownership checks look good (author can only update/delete own posts)

---

### AI Routes (`/ai`)

| Method | Path | Auth? | Validation | Status | Purpose | File | Notes |
|--------|------|-------|-----------|--------|---------|------|-------|
| POST | `/ai/briefing` | ✅ | None | 200 | Generate morning briefing | `ai.routes.ts:30` | Calls OpenAI (cost per request!) |
| POST | `/ai/voice-command` | ✅ | Zod (command: string) | 200 | Process voice input | `ai.routes.ts:50` | Calls OpenAI + Whisper |
| POST | `/ai/suggest-challenge` | ✅ | None | 200 | AI challenge suggestions | `ai.routes.ts:70` | Calls OpenAI |

**Issues Found**:
- ❌ No rate limiting on AI endpoints (expensive!) → Users could spam requests and run up OpenAI bill
  - Fix: Add per-user rate limit (e.g., 5 briefings/day, 10 voice commands/day)
- ❌ No timeout set on OpenAI API calls → Could hang for minutes
  - Fix: Add 10-second timeout with fallback response
- ❌ No caching of briefings → If same user requests twice within 1 hour, calls OpenAI twice
  - Fix: Cache briefing for 1 hour per user
- ✅ Good: Voice commands validate input length

---

### Analytics Routes (`/analytics`)

| Method | Path | Auth? | Status | Purpose | File |
|--------|------|-------|--------|---------|------|
| GET | `/analytics/overview` | ✅ | 200 | Stats overview (period filter) | `analytics.routes.ts` |
| GET | `/analytics/tasks` | ✅ | 200 | Task completion trends | `analytics.routes.ts` |
| GET | `/analytics/categories` | ✅ | 200 | Category breakdown | `analytics.routes.ts` |
| GET | `/analytics/streaks` | ✅ | 200 | Streak history | `analytics.routes.ts` |

**Issues Found**:
- ⚠️ Trends calculation might be slow (scanning all user's tasks/posts from date range)
  - Recommend: Add database indexes on `(userId, createdAt)` for efficient range queries

---

### Notifications Routes (`/notifications`)

| Method | Path | Auth? | Status | Purpose | File |
|--------|------|-------|--------|---------|------|
| GET | `/notifications` | ✅ | 200 | List notifications | `notifications.routes.ts` |
| PATCH | `/notifications/:id/read` | ✅ | 200 | Mark as read | `notifications.routes.ts` |
| POST | `/notifications/register-push` | ✅ | 200 | Register Expo push token | `notifications.routes.ts` |

**Issues Found**:
- ⚠️ No pagination on GET notifications
- ❌ Push token stored without device ID / platform tracking (can't target specific devices)

---

### Other Routes

| Prefix | Purpose | File | Status |
|--------|---------|------|--------|
| `/focus` | Focus session API | `focus.routes.ts` | ✅ |
| `/brain-dump` | Brain dump items | `braindump.routes.ts` | ✅ |
| `/tts` | Text-to-speech | `tts.routes.ts` | ✅ |
| `/invitations` | Circle invitations | `invitations.routes.ts` | ✅ |

---

## 🔐 Security & Auth Audit

### 1. Authentication (JWT Implementation)

**Status**: ✅ **Well-implemented** but needs minor improvements

**Flow**:
1. POST `/auth/register` → Hash password (bcryptjs 10 rounds) → Store user → Generate access + refresh tokens
2. POST `/auth/login` → Compare password (constant-time) → Generate tokens
3. Access token expires in 15 minutes (default `ACCESS_TOKEN_EXPIRY=15m`)
4. Refresh token expires in 7 days (default `REFRESH_TOKEN_EXPIRY=7d`)
5. POST `/auth/refresh` → Verify refresh token exists in DB → Generate new access token

**Strengths**:
- ✅ Refresh tokens stored in DB → Can revoke (logout invalidates)
- ✅ Password hashing with 10 rounds (industry standard)
- ✅ Constant-time password comparison via bcrypt
- ✅ Token type validation (access vs refresh)
- ✅ Expiry times configurable via env vars

**Weaknesses**:
- ❌ **No rate limiting on login/register** → 10,000 login attempts/minute possible
  - Fix: Add `express-rate-limit` (5 failed attempts → 15 min cooldown)
- ❌ **No account lockout** → Brute force attacks not blocked
  - Fix: Track failed login attempts, lock account after 5 failures
- ⚠️ **Token expiry defaults could be longer** → 15 min access token is good for security but requires frequent refreshes
  - Acceptable for security-conscious app
- ⚠️ **No "remember me"** option → All users logout after 7 days (by design, fine)

**JWT Payload Structure** (good):
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "type": "access",
  "iat": 1706777500,
  "exp": 1706778400
}
```

### 2. Authorization (Access Control)

**Status**: ❌ **CRITICAL GAPS** — Multiple endpoints missing ownership/role checks

**Issues by Endpoint**:

| Endpoint | Issue | Severity | Fix |
|----------|-------|----------|-----|
| PATCH `/circles/:id` | No owner/admin check | **CRITICAL** | Service should verify `circle.ownerId === userId \|\| circle.role === 'ADMIN'` |
| DELETE `/circles/:id` | No owner check | **CRITICAL** | Same as above |
| DELETE `/circles/:id/members/:userId` | No admin check | **CRITICAL** | Verify requester is owner/admin |
| PATCH `/circles/:id/members/:userId` | No admin check | **CRITICAL** | Verify requester is owner/admin |
| GET `/tasks/:id` | No ownership check (service-level) | **HIGH** | Service returns `where: { id, userId }` but route doesn't pass userId context |
| DELETE `/tasks/:id` | No ownership check (service-level) | **HIGH** | Same as above |
| PATCH `/assignments/:id` | No creator/assignee check | **HIGH** | Only creator or assignee should access |
| GET `/assignments/:id` | No visibility check | **HIGH** | Only creator/assignee should see |

**How to Fix** (Authorization Pattern):

```typescript
// Current (❌ INSECURE):
router.patch('/:id', validateBody(updateSchema), async (req, res, next) => {
  try {
    const circle = await circleService.updateCircle(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: circle });
  } catch (error) { next(error); }
});

// Fixed (✅ SECURE):
router.patch('/:id', validateBody(updateSchema), async (req, res, next) => {
  try {
    // Verify ownership in service
    const circle = await circleService.getCircleById(req.params.id);
    
    // Check authorization
    if (circle.ownerId !== req.user!.id && circle.userRole !== 'ADMIN') {
      throw new AppError('Only circle owner/admin can edit', 403, 'FORBIDDEN');
    }
    
    const updated = await circleService.updateCircle(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

// Or better: Move check into service
export async function updateCircle(userId: string, circleId: string, data: UpdateCircleInput) {
  const circle = await prisma.circle.findUnique({ where: { id: circleId } });
  
  // Authorization check in service (DRY principle)
  if (circle.ownerId !== userId) {
    const member = await prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });
    if (!member || member.role !== 'ADMIN') {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }
  }
  
  // Update
  return prisma.circle.update({ where: { id: circleId }, data });
}
```

### 3. Input Validation

**Status**: ✅ **Excellent** — Zod validates all inputs

**Coverage**:
- ✅ Email format validation (RFC 5322)
- ✅ Password minimum length (8 chars)
- ✅ UUID format validation (where needed)
- ✅ Date format validation (YYYY-MM-DD)
- ✅ Enum validation (priority: LOW/NORMAL/HIGH)
- ✅ Array size limits (e.g., tasks batch: 1-50)

**Improvements Needed**:
- ⚠️ UUID parameter validation missing in some routes
  - Example: `GET /circles/:id` should validate `:id` is UUID format
  - Fix: Add validateParams middleware
- ⚠️ Pagination limits not enforced
  - Current: `limit` can be 999999 (returns all records)
  - Fix: `limit: Math.min(parseInt(limit) || 20, 100)` (max 100 per page)
- ⚠️ Date validation allows invalid dates (2026-99-99)
  - Fix: Use `new Date()` validation or `zod-date` library

### 4. Secrets & Config Management

**Status**: ⚠️ **Acceptable but room for improvement**

**Current Setup** (`backend/src/config/env.ts`):
```typescript
export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access-secret', // ❌ INSECURE DEFAULT!
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret', // ❌ INSECURE DEFAULT!
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  // ... more
};

// Validation in production
if (env.NODE_ENV === 'production') {
  const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
```

**Issues**:
- ❌ **Insecure defaults for JWT secrets** → If `.env` not set, app uses hardcoded secrets!
  - Fix: Throw error immediately if not in dev:
    ```typescript
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || (
      process.env.NODE_ENV === 'production' 
        ? (() => { throw new Error('JWT_ACCESS_SECRET required in production'); })()
        : 'dev-access-secret'
    ),
    ```
- ✅ `.env` in `.gitignore` (good)
- ✅ Production validation exists
- ✅ Env vars loaded via dotenv at startup

**Secrets Not Exposed** (verified):
- ❌ But check logs — are secrets logged on startup?
  - Current: No startup logs that echo secrets (good)
  - But: Error handler shows stack traces in dev (could expose env vars)

**Recommendations**:
1. Use AWS Secrets Manager or HashiCorp Vault in production
2. Never log secrets (add filter in logger)
3. Rotate JWT secrets quarterly
4. Use different secrets for access vs refresh tokens (✅ already doing)
5. Implement secret versioning (key rotation without redeploying)

### 5. CORS Configuration

**Status**: ❌ **PRODUCTION RISK** — Allows all origins

**Current** (`app.ts`):
```typescript
app.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Placeholder, needs to be set!
    : '*',  // ❌ Dev allows all origins (fine for dev)
  credentials: true,
}));
```

**Issues**:
- ❌ **CORS origin is hardcoded to placeholder** → Must be updated before prod deployment
- ⚠️ `credentials: true` allows cookies in cross-origin requests (not an issue here since we use JWT, but ensure understood)

**Fix for Production**:
```typescript
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));
```

### 6. Socket.io Security

**Status**: ❌ **CRITICAL ISSUE** — CORS allows all origins

**Current** (`socket.service.ts`):
```typescript
export function initializeSocket(server: HTTPServer) {
  io = new SocketServer(server, {
    cors: {
      origin: '*', // ❌ DANGEROUS: allows any origin to connect
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    transports: ['websocket', 'polling'],
  });
  
  // Good: Authentication middleware exists
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    // ... validates JWT
  });
}
```

**Issues**:
- ❌ CORS `origin: '*'` allows any website to connect
  - Example: attacker.com can connect to your Socket.io server if user visits their site
  - Fix: Restrict to known origins
- ✅ Good: Auth middleware validates JWT before connection
- ⚠️ Transports include 'polling' → If WebSocket fails, falls back to HTTP polling (less efficient)

**Fix for Production**:
```typescript
const allowedSocketOrigins = process.env.SOCKET_ORIGINS?.split(',') || ['http://localhost:3000'];

io = new SocketServer(server, {
  cors: {
    origin: allowedSocketOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  transports: ['websocket'],  // Remove 'polling' in production
});
```

### 7. Rate Limiting

**Status**: ❌ **MISSING** — No protection against brute force or DDoS

**Current**: No rate limiting middleware

**Attacks Possible**:
1. **Brute force login** → 10,000 attempts/minute
2. **Spam AI requests** → Exhaust OpenAI quota
3. **DDoS** → Crash server with GET requests
4. **Account enumeration** → Register test accounts in bulk

**Recommendation**:
```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

// Auth rate limiter (strict)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// General API rate limiter (relaxed)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
});

// AI rate limiter (very strict, expensive)
const aiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 10, // 10 AI requests per day
  message: 'Daily AI request limit exceeded',
});

app.use('/auth', authLimiter);
app.use(apiLimiter);
app.post('/ai/briefing', aiLimiter, ...);
app.post('/ai/voice-command', aiLimiter, ...);
app.post('/ai/suggest-challenge', aiLimiter, ...);
```

### 8. Request Validation Summary

| Validation Type | Implemented? | Quality | Notes |
|-----------------|-------------|---------|-------|
| Email format | ✅ Yes | Good | Uses Zod email() validator |
| Password strength | ⚠️ Partial | Fair | Only checks min 8 chars; no uppercase/special char required |
| UUID format | ❌ No | Poor | No validation on route params `:id` |
| Pagination limits | ❌ No | Poor | No default/max limits enforced |
| Date format | ✅ Yes | Good | YYYY-MM-DD regex validation |
| Array size | ✅ Yes | Good | Batch tasks: 1-50 items |
| SQL injection | ✅ Yes | Excellent | Prisma ORM prevents |
| XSS | ✅ Yes | Good | Zod parsing + Express doesn't auto-stringify HTML |
| CSRF | ✅ Yes | Good | Stateless JWT (no cookies) |

---

## 🗄️ Data Layer & Reliability Audit

### 1. Database Setup

**Current**:
```typescript
// backend/src/config/database.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});
```

**Issues**:
- ⚠️ No explicit connection pooling configuration
  - Prisma uses embedded connection pool (good default)
  - But production should tune: max connections, idle timeout, queue timeout
  - Fix: Add `.env` variables:
    ```
    DATABASE_URL="postgresql://user:pass@host/db?connection_limit=10&pool_timeout=30"
    ```

- ❌ No health check endpoint
  - Server could start even if DB is unreachable
  - Fix: Add `GET /health` that checks DB connectivity

- ⚠️ Prisma logs queries in dev (good for debugging but could expose secrets)
  - Ensure no passwords in table names or values logged

### 2. Data Model Sanity

**Status**: ✅ **Well-designed** — Good normalization, relationships, constraints

**Key Models**:

| Model | Purpose | Strengths | Concerns |
|-------|---------|-----------|----------|
| `User` | Authentication + gamification | ✅ UUID PK, email unique, soft delete | ⚠️ `passwordHash` never deleted on soft delete |
| `Task` | Todo items | ✅ User FK, date/time fields, priority enum | ⚠️ No soft delete (data loss risk) |
| `Circle` | Social accountability groups | ✅ Owner FK, invite code unique | ✅ Good |
| `CircleMember` | Membership + roles | ✅ Composite PK, role enum | ✅ Good |
| `Assignment` | Delegated tasks | ✅ Creator/assignee FKs, status enum | ⚠️ No soft delete |
| `Challenge` | Competitive goals | ✅ Circle FK (optional for global), dates | ✅ Good |
| `Post` | Circle feed | ✅ Author/circle FK, type enum | ⚠️ Can't delete posts later (no soft delete) |
| `RefreshToken` | Session management | ✅ User FK, expiry, unique token | ✅ Good |

**Risks**:
1. **Hard deletes on Task/Assignment/Post** → Data loss if user deletes by mistake
   - Recommendation: Add `deletedAt: DateTime?` soft delete pattern

2. **No audit trail** → Can't see who changed what/when
   - Add `createdAt`, `updatedAt` (✅ already have)
   - Consider: `@db.Timestamp` for precision timing

3. **Circular dependency possible** → User A assigns task to User B in Circle → B completes → A gets XP?
   - Verify assignment logic prevents self-assignment

### 3. Migrations & Schema Management

**Status**: ⚠️ **Undocumented** — No migration strategy documented

**Current**:
- Using Prisma migrations (good!)
- Commands: `npx prisma migrate dev`, `npx prisma db push`

**Issues**:
- ❌ No documented migration process for production
- ❌ No backup before migration
- ❌ No rollback procedure documented

**Recommended Production Migration Process**:
```bash
# Before deploying:
1. Backup production database
   pg_dump -U user mypa > backup_$(date +%Y%m%d_%H%M%S).sql

2. Test migration on staging
   npx prisma migrate deploy --preview-feature

3. If migration fails, restore backup
   psql -U user mypa < backup_20260201_120000.sql

4. Deploy to production
   npx prisma migrate deploy

5. Verify schema matches code
   npx prisma introspect
```

### 4. Race Conditions & Concurrency

**Status**: ⚠️ **POTENTIAL ISSUES** — Need explicit transaction handling

**Identified Race Conditions**:

1. **Task Completion + XP Award**
   ```typescript
   // Current (❌ Not atomic):
   const task = await prisma.task.update({
     where: { id: taskId },
     data: { completed: true, completedAt: new Date() },
   });
   await addXp(userId, xp); // Separate DB call
   
   // If crash between calls: XP awarded but task not marked complete!
   
   // Fixed (✅ Atomic):
   await prisma.$transaction([
     prisma.task.update({
       where: { id: taskId },
       data: { completed: true, completedAt: new Date() },
     }),
     prisma.user.update({
       where: { id: userId },
       data: { xp: { increment: xp } },
     }),
   ]);
   ```

2. **Challenge Progress Update**
   - Multiple users might update same challenge in parallel
   - Use Prisma's `$transaction` for atomicity

3. **Stripe Payment + XP Award** (if implemented)
   - Current: No payment system, so N/A
   - When added: Ensure transaction logic

**Recommendation**: Audit all multi-step operations and wrap in `$transaction()`

### 5. ID Generation & Collisions

**Status**: ✅ **Good** — Using UUID v4 (no collisions practically)

**Current**:
```typescript
import { v4 as uuidv4 } from 'uuid';
// Used in: User.id, Task.id, Circle.id, etc.
```

**Risk**: ⚠️ Invite codes are generated with `uuidv4()` but stored in string column
- UUID collision: 1 in 10^36 (negligible)
- Current code: `inviteCode: generateInviteCode()` (need to check implementation)

---

## 📊 Error Handling & Observability Audit

### 1. Centralized Error Handler

**Status**: ✅ **Good foundation** — AppError class + middleware

**Current** (`middleware/error.ts`):
```typescript
export class AppError extends Error {
  statusCode: number;
  code?: string;
  
  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function errorHandler(err: Error | AppError, req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err);
  
  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;
  
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  } else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      statusCode = 409;
      message = 'A record with this value already exists';
      code = 'DUPLICATE_ENTRY';
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
      code = 'NOT_FOUND';
    }
  }
  
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
```

**Strengths**:
- ✅ Centralized error handling (all errors caught here)
- ✅ Consistent error response format
- ✅ Prisma errors mapped to HTTP status codes
- ✅ Stack traces only in dev (security)

**Weaknesses**:
- ❌ **No request logging** → Can't trace which endpoint failed
- ❌ **Logged to console** → Doesn't persist, can't search logs
- ❌ **No error context** → `req.path`, `req.method`, `req.user.id` missing
- ❌ **No error categorization** → All errors treated the same

**Improved Error Handler**:
```typescript
// Add request logging middleware (before routes)
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || uuidv4();
  
  // Store for error handler
  (req as any).requestId = requestId;
  (req as any).startTime = startTime;
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
    });
  });
  
  next();
});

// Enhanced error handler
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req as any).requestId;
  
  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;
  
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  } else if (err.name === 'PrismaClientKnownRequestError') {
    // ... handle Prisma errors
  }
  
  // Log with context
  logger.error({
    requestId,
    method: req.method,
    path: req.path,
    statusCode,
    message,
    code,
    userId: req.user?.id,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    requestId, // For customer support: "I got error ABC123"
  });
}
```

### 2. Logging Strategy

**Status**: ❌ **MISSING** — Only `console.error()` calls

**Current Usage**:
- `console.log()` in `index.ts` (startup messages)
- `console.error()` in error handler
- `console.log()` in socket.io connection logs

**Issues**:
- ❌ No structured logging (can't filter/search)
- ❌ No log levels (DEBUG, INFO, WARN, ERROR)
- ❌ No log persistence (lost on restart)
- ❌ No log rotation (disk fills up)
- ❌ Secrets could be logged accidentally

**Recommendation** — Install pino (fast JSON logger):
```bash
npm install pino pino-transport
```

```typescript
// backend/src/config/logger.ts
import pino from 'pino';

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    redact: {
      paths: ['*.password', '*.token', '*.secret'],
      remove: true,
    },
  },
  pino.destination({
    dest: './logs/app.log',
    mkdir: true,
  })
);

export default logger;
```

**Then use in code**:
```typescript
logger.info({ userId, taskId, xpAwarded }, 'Task completed');
logger.error({ error: err.message }, 'Failed to create circle');
logger.warn({ tokensExpiring: 5 }, 'Refresh tokens expiring soon');
```

### 3. Health Checks

**Status**: ⚠️ **Partial** — Basic health endpoint exists

**Current** (`app.ts`):
```typescript
app.get('/health', (_req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});
```

**Issues**:
- ❌ Doesn't check database connection
- ❌ Doesn't check external services (OpenAI, Expo)
- ❌ No liveness vs readiness distinction

**Recommended Health Checks**:
```typescript
// Liveness: Is server running? (K8s uses this)
app.get('/health/live', (_req, res) => {
  res.json({ status: 'alive' });
});

// Readiness: Is server ready to serve requests? (K8s uses this)
app.get('/health/ready', async (_req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    // Check external services (optional)
    // await openai.models.list();
    
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

### 4. Crash Reporting (Sentry)

**Status**: ❌ **MISSING** — No crash reporting

**Recommendation**:
```bash
npm install @sentry/node @sentry/tracing
```

```typescript
// backend/src/config/sentry.ts
import * as Sentry from '@sentry/node';
import { env } from './env.js';

export function initSentry(app) {
  if (env.NODE_ENV === 'production' && env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: 0.1, // Sample 10% of transactions for performance
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection(),
      ],
    });
    
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.errorHandler());
  }
}
```

**Usage in error handler**:
```typescript
export function errorHandler(err: Error, req: Request, res: Response) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(err, {
      tags: { endpoint: req.path },
      user: { id: req.user?.id },
    });
  }
  
  // ... rest of error handling
}
```

---

## ⚡ Performance & Scalability Audit

### 1. Database Queries - Hot Paths

**Status**: ⚠️ **POTENTIAL ISSUES** — Missing indexes, N+1 queries

**Identified Hot Paths**:

1. **GET `/tasks` with joins**
   ```typescript
   // Current (potentially slow):
   const tasks = await prisma.task.findMany({
     where: { userId },
     include: { 
       focusSessions: true,  // N+1: loads sessions for each task
       assignments: true,    // N+1: loads assignments for each task
     },
   });
   ```
   - Fix: Add database index on `(userId, createdAt DESC)`

2. **GET `/challenges/:id` with 1000 participants**
   - Fetches all participants, calculates ranks
   - Fix: Cache leaderboard (update on progress change, not on request)

3. **GET `/posts` across all circles**
   - If user in 50 circles, fetches posts from all
   - Fix: Pagination (limit 20, offset)

4. **GET `/analytics/tasks` date range**
   - Scans ALL user's tasks for date range
   - Fix: Add composite index on `(userId, createdAt)`

**Recommended Indexes**:
```prisma
model User {
  // ... fields
  
  @@index([email])  // For login lookups
}

model Task {
  // ... fields
  
  @@index([userId])
  @@index([userId, createdAt])  // For analytics
  @@index([completed])  // For filtering
}

model Post {
  // ... fields
  
  @@index([circleId])
  @@index([circleId, createdAt])
}

model Challenge {
  // ... fields
  
  @@index([circleId])
  @@index([startsAt, endsAt])  // For active challenge queries
}
```

### 2. Caching Opportunities

**Status**: ❌ **MISSING** — No caching layer

**Recommended Caches**:

1. **Daily Briefing (AI)**
   - Cache for 1 hour per user
   - Invalidate on: Task completion, new assignment
   - Storage: Redis

2. **Challenge Leaderboards**
   - Recalculate on progress update (not on request)
   - Cache for 5 minutes
   - Storage: Redis

3. **User Stats** (GET `/users/me/stats`)
   - Calculate from aggregates, not by scanning tasks
   - Cache for 1 hour
   - Invalidate on: Task completion, XP gain

4. **Circle Members List**
   - Cache for 1 day
   - Invalidate on: Member join/leave

**Implementation**:
```bash
npm install redis
```

```typescript
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

export async function getCachedUserStats(userId: string) {
  const cached = await redisClient.get(`user:${userId}:stats`);
  if (cached) return JSON.parse(cached);
  
  const stats = await calculateUserStats(userId); // Expensive query
  await redisClient.setEx(`user:${userId}:stats`, 3600, JSON.stringify(stats));
  return stats;
}
```

### 3. Pagination & Limits

**Status**: ❌ **CRITICAL** — No default limits

**Current Issues**:
- GET `/tasks` can return 1,000,000 tasks if no limit specified
- GET `/posts` can return all posts across all circles
- GET `/assignments` can return all assignments

**Fix**: Add pagination middleware
```typescript
router.use((req, res, next) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
  
  (req as any).pagination = { limit, offset };
  next();
});

// In routes:
const tasks = await prisma.task.findMany({
  where: { userId: req.user!.id },
  take: req.pagination.limit,
  skip: req.pagination.offset,
});
```

### 4. OpenAI API Efficiency

**Status**: ⚠️ **COST RISK** — No caching, rate limiting, or fallbacks

**Current Issues**:
- POST `/ai/briefing` → Calls OpenAI every time (cost: ~$0.01 per request)
- No timeout → Could hang indefinitely
- No fallback → If OpenAI down, users get error

**Optimization**:
```typescript
// Cache briefing for 1 hour
async function getDailyBriefing(userId: string) {
  const cached = await redisClient.get(`briefing:${userId}:${dateKey}`);
  if (cached) return JSON.parse(cached);
  
  try {
    const briefing = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [...],
      timeout: 10000, // 10 second timeout
    });
    
    await redisClient.setEx(
      `briefing:${userId}:${dateKey}`,
      3600, // Cache for 1 hour
      JSON.stringify(briefing)
    );
    
    return briefing;
  } catch (error) {
    // Fallback: Return cached from yesterday
    const oldBriefing = await redisClient.get(`briefing:${userId}:${oldDateKey}`);
    if (oldBriefing) {
      logger.warn(`OpenAI error, returning cached briefing for user ${userId}`);
      return JSON.parse(oldBriefing);
    }
    
    // Ultimate fallback: Generic briefing
    return { content: 'Good morning! Keep up the productivity!' };
  }
}
```

### 5. Connection Pooling

**Status**: ✅ **Default Prisma pooling** but not tuned

**Current**:
```typescript
new PrismaClient({
  log: ['query', 'error'],
});
```

**Production Tuning**:
```env
# .env
DATABASE_URL="postgresql://user:password@host/db?schema=public&sslmode=require&connection_limit=20&pool_timeout=30&statement_cache_size=100"
```

---

## ✅ Pre-Deployment Checklist

### A. Environment Variables

**Required in Production**:
```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/mypa?schema=public&sslmode=require

# JWT
JWT_ACCESS_SECRET=<64-char-random-secret>
JWT_REFRESH_SECRET=<64-char-random-secret>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# OpenAI
OPENAI_API_KEY=sk-<key>

# CORS & Socket
CORS_ORIGINS=https://app.mypa.com,https://www.mypa.com
SOCKET_ORIGINS=https://app.mypa.com

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://key@sentry.io/project

# Redis (if caching)
REDIS_URL=redis://localhost:6379

# Expo Push Notifications
EXPO_ACCESS_TOKEN=<token>
```

**Validation Script**:
```typescript
// backend/src/config/validateEnv.ts
const required = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'OPENAI_API_KEY',
  'CORS_ORIGINS',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required env var: ${key}`);
  }
}

if (process.env.JWT_ACCESS_SECRET.length < 32) {
  throw new Error('❌ JWT_ACCESS_SECRET must be at least 32 characters');
}

console.log('✅ All required env vars present');
```

### B. Secret Management

**Option 1: AWS Secrets Manager**
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getSecret(secretName: string) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return JSON.parse(response.SecretString);
}
```

**Option 2: Hashicorp Vault**
```typescript
import vault from '@hashicorp/node-vault';

const vaultClient = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

const secrets = await vaultClient.read('secret/mypa/prod');
```

**Option 3: .env (Simple)**
- Keep `.env` in `.gitignore` ✅
- Never commit secrets
- Use strong permissions: `chmod 600 .env`
- Rotate secrets quarterly

### C. Database Migrations

**Before Deploying**:
1. **Backup Production Database**
   ```bash
   pg_dump -h proddb.example.com -U postgres mypa > mypa_backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test on Staging**
   ```bash
   # Restore from production
   psql -h stagingdb.example.com -U postgres mypa < mypa_backup_20260201_120000.sql
   
   # Run migration
   npm run db:migrate
   ```

3. **Deploy to Production**
   ```bash
   npm run db:migrate
   ```

4. **Verify**
   ```bash
   npm run db:studio
   ```

### D. Build & Run Commands

**Local Development**:
```bash
npm run dev  # tsx watch src/index.ts
```

**Production Build**:
```bash
npm run build  # tsc → outputs to dist/
npm start      # node dist/index.js
```

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Install & build
RUN npm ci --only=production
RUN npm run build
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start
CMD ["npm", "start"]
```

**Docker Compose** (for local):
```yaml
version: '3.9'
services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/mypa
      NODE_ENV: development
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mypa
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### E. CI/CD Pipeline

**GitHub Actions**:
```yaml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm run db:push  # Create test schema
      - run: npm test  # If tests exist
      - run: npm run lint  # If linter exists

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          # Push Docker image to ECR/Docker Hub
          docker build -t mypa-api:${{ github.sha }} ./backend
          docker push mypa-api:${{ github.sha }}
          # Trigger Kubernetes/ECS deployment
```

### F. Basic Integration Tests

**Test File Structure**:
```
backend/__tests__/
├── auth.test.ts
├── tasks.test.ts
├── circles.test.ts
└── setup.ts (database setup)
```

**Example Test** (using Jest + Supertest):
```bash
npm install --save-dev jest ts-jest supertest @types/jest @types/supertest
```

```typescript
// backend/__tests__/auth.test.ts
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('POST /auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
    });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.accessToken).toBeDefined();
  });
  
  it('should reject duplicate email', async () => {
    await request(app).post('/auth/register').send({
      email: 'duplicate@example.com',
      password: 'Password123',
    });
    
    const res = await request(app).post('/auth/register').send({
      email: 'duplicate@example.com',
      password: 'Password123',
    });
    
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_EXISTS');
  });
});
```

### G. Staging vs Production Config

**Staging** (Pre-prod Testing):
- Real database (copy of prod)
- Real external services (OpenAI, Expo)
- Rate limiting enabled but relaxed
- Logging at INFO level
- Sentry enabled (but separate project)

**Production** (Live):
- Isolated database with backups
- Rate limiting strict
- Logging at WARN level (less noisy)
- Sentry enabled
- Health checks every 30 seconds
- Graceful shutdown (30 second drain)

**Environment Config**:
```typescript
// backend/src/config/env.ts
const config = {
  development: {
    dbConnectTimeout: 5000,
    requestTimeout: 30000,
    logLevel: 'debug',
    rateLimit: { windowMs: 60000, max: 10000 },
  },
  staging: {
    dbConnectTimeout: 10000,
    requestTimeout: 30000,
    logLevel: 'info',
    rateLimit: { windowMs: 60000, max: 100 },
  },
  production: {
    dbConnectTimeout: 30000,
    requestTimeout: 10000,
    logLevel: 'warn',
    rateLimit: { windowMs: 60000, max: 50 },
  },
};

export const deploymentConfig = config[env.NODE_ENV];
```

### H. Rollback Plan

**If Deployment Fails**:
1. **Revert code**: `git revert <commit-hash>`
2. **Revert DB**: `psql -U postgres mypa < mypa_backup_20260201_120000.sql`
3. **Redeploy**: `git push` → CI/CD pipeline runs automatically
4. **Notify**: Slack alert to team

**Zero-Downtime Deployment**:
- Use blue-green deployment (2 API instances)
- Route traffic to blue instance
- Deploy to green instance
- If green healthy, switch traffic
- Keep blue as rollback fallback

---

## 🚨 Top 20 Prioritized Actions

### NOW (This Week) — Critical Production Blockers
**Effort**: 15 hours | **Priority**: CRITICAL

| # | Action | Severity | Files | Effort | Status |
|---|--------|----------|-------|--------|--------|
| 1 | **Add authorization checks** to circle update/delete/member endpoints | 🔴 CRITICAL | `circles.service.ts`, `circles.routes.ts` | 2h | TODO |
| 2 | **Fix CORS configuration** — Replace wildcard with allowlist | 🔴 CRITICAL | `app.ts`, `.env.example` | 1h | TODO |
| 3 | **Fix Socket.io CORS** — Restrict origins, disable polling | 🔴 CRITICAL | `socket.service.ts`, `.env.example` | 1h | TODO |
| 4 | **Add rate limiting** on auth endpoints (5 attempts/5min) | 🔴 CRITICAL | `routes/auth.routes.ts` | 2h | TODO |
| 5 | **Fix JWT secret defaults** — Throw error in production | 🔴 CRITICAL | `config/env.ts` | 1h | TODO |
| 6 | **Add pagination defaults** (max 100 per page) | 🔴 CRITICAL | All list endpoints (`/tasks`, `/posts`, `/assignments`, `/challenges`) | 2h | TODO |
| 7 | **Add database indexes** for hot paths | 🔴 CRITICAL | `prisma/schema.prisma` | 2h | TODO |
| 8 | **Implement graceful shutdown** (drain in-flight requests, close DB) | 🟠 HIGH | `index.ts` | 2h | TODO |
| 9 | **Add health check endpoint** that verifies DB connection | 🟠 HIGH | `app.ts` | 1h | TODO |
| 10 | **Setup Sentry** for crash reporting | 🟠 HIGH | `config/sentry.ts`, `middleware/error.ts` | 2h | TODO |

### NEXT (Next Sprint) — High Priority
**Effort**: 18 hours | **Priority**: HIGH

| # | Action | Severity | Files | Effort |
|---|--------|----------|-------|--------|
| 11 | **Add structured logging** (pino) + request ID tracking | 🟠 HIGH | `config/logger.ts`, all middleware | 3h |
| 12 | **Implement request validation** for UUID params | 🟠 HIGH | `middleware/validation.ts`, all routes | 2h |
| 13 | **Add authorization middleware** for roles (OWNER, ADMIN, MEMBER) | 🟠 HIGH | `middleware/auth.ts` | 2h |
| 14 | **Verify data ownership** in all service methods | 🟠 HIGH | All service files | 4h |
| 15 | **Setup Redis caching** for AI briefings + leaderboards | 🟠 HIGH | `services/ai.service.ts`, `services/challenge.service.ts` | 3h |
| 16 | **Add transaction handling** for multi-step operations | 🟠 HIGH | `services/task.service.ts`, `services/challenge.service.ts` | 2h |
| 17 | **Implement soft deletes** for Task, Assignment, Post | 🟠 HIGH | `prisma/schema.prisma` | 2h |
| 18 | **Add request timeout** (10 seconds default) | 🟠 HIGH | `app.ts` | 1h |

### LATER (Post-Launch) — Nice to Have
**Effort**: 8 hours | **Priority**: MEDIUM

| # | Action | Severity | Files | Effort |
|---|--------|----------|-------|--------|
| 19 | **Add OpenAI timeout** + fallback briefing | 🟡 MEDIUM | `services/ai.service.ts` | 1h |
| 20 | **Setup integration tests** (Jest + Supertest) | 🟡 MEDIUM | `__tests__/` | 3h |

---

## 📊 Risk Assessment Matrix

| Risk | Severity | Likelihood | Impact | Mitigation |
|------|----------|-----------|--------|-----------|
| **Unauthorized circle deletion** | 🔴 CRITICAL | High | Data loss | Add role verification ✅ Action #1 |
| **Brute force login attack** | 🔴 CRITICAL | High | Account takeover | Add rate limiting ✅ Action #4 |
| **CORS from malicious site** | 🔴 CRITICAL | High | Token theft | Fix CORS ✅ Action #2 |
| **OpenAI API bill spike** | 🟠 HIGH | Medium | Financial loss | Add rate limiting + caching ✅ Action #15 |
| **Database connection pool exhaustion** | 🟠 HIGH | Medium | Server downtime | Configure pooling + add health check |
| **Unhandled async errors** | 🟠 HIGH | Medium | Silent failures | Add error logging ✅ Action #11 |
| **Missing pagination → 1M records returned** | 🟠 HIGH | High | Memory exhaustion | Add defaults ✅ Action #6 |
| **Race condition on task completion** | 🟠 HIGH | Low | Duplicate XP | Add transactions ✅ Action #16 |
| **No audit trail on data changes** | 🟡 MEDIUM | Medium | Can't debug issues | Add audit logging (Action #11) |

---

## Summary & Next Steps

### Overall Production Readiness: **5.5/10**

**Red Flags** 🚨:
1. Authorization checks missing (critical security risk)
2. CORS allows all origins
3. No rate limiting (brute force vulnerability)
4. No logging/monitoring
5. Missing pagination defaults

**Green Flags** ✅:
1. JWT auth well-implemented
2. Password hashing correct (bcryptjs 10 rounds)
3. Input validation comprehensive (Zod)
4. Error handling structure good (AppError class)
5. Prisma ORM prevents SQL injection
6. TypeScript throughout (type safety)

### Immediate Action Plan:
1. **This week** (5h): Fix CORS, add authorization checks, add rate limiting
2. **Next 2 weeks** (10h): Add logging, structured error handling, health checks
3. **Before launch** (5h): Database indexes, caching layer, integration tests

### Recommended Reading:
- [OWASP Top 10](https://owasp.org/Top10/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [Prisma Security Best Practices](https://www.prisma.io/docs/concepts/more/security)
- [Express.js Security Guide](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Audit Conducted**: February 1, 2026  
**Backend Version**: 2.0.0  
**Next Audit Due**: Post-deployment or when major features added
