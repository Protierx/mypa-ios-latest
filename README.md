# MYPA Backend v2.0

A TypeScript + Express + Prisma backend for the MYPA productivity app.

## Features

- ✅ **Authentication** - JWT with refresh token rotation
- ✅ **Users** - Profile, stats, XP, levels, streaks
- ✅ **Tasks** - CRUD with gamification (XP on completion)
- 🔜 **Focus Sessions** - Pomodoro tracking
- 🔜 **Brain Dump** - Quick capture with AI categorization
- 🔜 **Circles** - Social accountability groups
- 🔜 **Challenges** - Gamified competitions
- 🔜 **AI** - Voice commands, daily briefing

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT with refresh tokens

## Setup

### 1. Install dependencies

```bash
cd backend-ts
npm install
```

### 2. Set up database

Create a PostgreSQL database:

```sql
CREATE DATABASE mypa;
```

### 3. Configure environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Generate with `openssl rand -base64 32`
- `JWT_REFRESH_SECRET` - Generate with `openssl rand -base64 32`

### 4. Generate Prisma client & push schema

```bash
npm run db:generate
npm run db:push
```

### 5. Run development server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh tokens |
| POST | `/auth/logout` | Logout (invalidate refresh token) |
| POST | `/auth/logout-all` | Logout from all devices |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update profile |
| DELETE | `/users/me` | Deactivate account |
| GET | `/users/me/stats` | Get XP, level, streak stats |
| GET | `/users/me/settings` | Get user settings |
| PATCH | `/users/me/settings` | Update settings |
| POST | `/users/me/onboarding` | Complete onboarding (+50 XP) |
| GET | `/users/check-username/:username` | Check availability |
| GET | `/users/:username` | Get public profile |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | List tasks (with filters) |
| POST | `/tasks` | Create task |
| POST | `/tasks/batch` | Create multiple tasks |
| GET | `/tasks/today` | Get today's tasks |
| GET | `/tasks/open` | Get all incomplete tasks |
| GET | `/tasks/stats` | Get task statistics |
| GET | `/tasks/date/:date` | Get tasks for date |
| GET | `/tasks/:id` | Get task by ID |
| PATCH | `/tasks/:id` | Update task |
| POST | `/tasks/:id/complete` | Complete task (+XP) |
| POST | `/tasks/:id/uncomplete` | Mark incomplete |
| DELETE | `/tasks/:id` | Delete task |

## XP & Gamification

### XP Rewards

| Action | XP |
|--------|-----|
| Complete task | 10 |
| Complete high-priority task | 20 |
| First task | 25 |
| Complete onboarding | 50 |
| Focus session complete | 15 |
| Assignment complete | 30 |
| Challenge win | 100 |

### Streak Multipliers

| Streak | Multiplier |
|--------|------------|
| 3+ days | 1.1x |
| 7+ days | 1.25x |
| 14+ days | 1.5x |
| 30+ days | 2.0x |

### Level Progression

Uses formula: `XP = 100 * (level - 1)^1.5`

| Level | XP Required |
|-------|-------------|
| 2 | 100 |
| 5 | 800 |
| 10 | 2,154 |
| 20 | 6,084 |

## Example Usage

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'
```

### Create Task

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "category": "Personal", "priority": "NORMAL", "date": "2026-01-26"}'
```

### Complete Task

```bash
curl -X POST http://localhost:3000/tasks/TASK_ID/complete \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Development

```bash
# Run with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Next Steps (Phase 2+)

- [ ] Focus Sessions API
- [ ] Brain Dump API with AI categorization
- [ ] Circles (social accountability)
- [ ] Assignments within circles
- [ ] Challenges & leaderboards
- [ ] Push notifications
- [ ] Real-time updates (Socket.io)
- [ ] AI voice commands
- [ ] Daily briefing generation
