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

## 📱 App Architecture

### Frontend (React Native + TypeScript)
- **Framework:** React Native 0.81 with Expo 54
- **Navigation:** React Navigation 7 (bottom tabs + native stacks)
- **State:** React Context API + custom hooks
- **Styling:** StyleSheet with centralized theme tokens
- **Icons:** Lucide React Native
- **Real-time:** Socket.io client

### Backend (Node.js + TypeScript)
- **Runtime:** Node.js 18+
- **Framework:** Express
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with refresh token rotation
- **Real-time:** Socket.io server
- **AI Integration:** OpenAI API (voice commands, briefings)

---

## � The Problem & Market Opportunity

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

## 📂 Project Structure

```
mypa-ios-latest/
├── frontend/                 # React Native app
│   ├── src/
│   │   ├── screens/         # 26 screens (Hub, Plan, Challenges, Circles, etc.)
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/         # 27 design system components
│   │   │   └── ...         # Specialized app components
│   │   ├── contexts/       # React Context (Auth, etc.)
│   │   ├── services/       # API, Socket, Push Notifications
│   │   ├── styles/         # Theme tokens, colors, typography
│   │   └── config/         # Environment config
│   ├── ios/                # Native iOS project
│   ├── App.tsx             # App entry point with navigation
│   └── package.json
├── backend/                 # Express + Prisma API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helpers (XP, streaks)
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── AUDIT_NAVIGATION_AND_INTERACTIONS.md  # Code review with tests
├── UX_UI_PROD_READINESS_AUDIT.md        # UI/UX audit report
└── README.md               # This file
```

---

## 🛠️ Tech Stack

### Frontend
| Category | Technology |
|----------|-----------|
| **Framework** | React Native 0.81, Expo 54 |
| **Language** | TypeScript |
| **Navigation** | React Navigation 7 (bottom tabs, native stacks) |
| **State** | React Context API, custom hooks |
| **Styling** | StyleSheet, LinearGradient, theme tokens |
| **Icons** | Lucide React Native |
| **Real-time** | Socket.io client |
| **Storage** | AsyncStorage |
| **Notifications** | Expo Notifications |
| **Voice** | Expo Speech |

### Backend
| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 18+ |
| **Language** | TypeScript |
| **Framework** | Express |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Auth** | JWT (access + refresh tokens) |
| **Real-time** | Socket.io server |
| **AI** | OpenAI API |
| **Validation** | Express Validator |

---

## 🎨 Design System

MYPA uses a **token-based design system** for visual consistency:

### Color Palette
- **Primary:** `#B58CFF` (Purple) - Brand color, CTAs
- **Secondary:** `#64C7FF` (Blue) - Accents, links
- **Success:** `#10B981` (Green) - Completed tasks, positive feedback
- **Destructive:** `#EF4444` (Red) - Errors, delete actions
- **Background:** `#F6F7FA` (Light gray) - App background
- **Card:** `#FFFFFF` (White) - Card backgrounds

### Typography Scale
- **2xl:** 28px (Page headings)
- **xl:** 20px (Section headings)
- **lg:** 17px (Subheadings)
- **base:** 15px (Body text)
- **sm:** 13px (Captions)
- **xs:** 11px (Labels)

### Spacing System
`4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px`

### Components
27 reusable UI components: Button, Card, Input, Checkbox, Switch, Modal, Alert, Toast, Skeleton, etc.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **Xcode** 14+ (for iOS development)
- **Expo CLI** (install with `npm install -g expo-cli`)

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
JWT_ACCESS_SECRET="generate-with-openssl-rand-base64-32"
JWT_REFRESH_SECRET="generate-with-openssl-rand-base64-32"
OPENAI_API_KEY="your-openai-key"
PORT=3000
```

5. **Generate Prisma client & migrate:**
```bash
npm run db:generate
npm run db:push
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
```bash
# Edit src/config/env.ts
API_URL: 'http://localhost:3000'  # or your backend URL
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
```

Or press `i` in the Expo terminal.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout (invalidate refresh token) |
| POST | `/auth/logout-all` | Logout from all devices |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update profile (name, bio, avatar) |
| DELETE | `/users/me` | Deactivate account |
| GET | `/users/me/stats` | Get XP, level, streak stats |
| GET | `/users/me/settings` | Get user settings |
| PATCH | `/users/me/settings` | Update notification/privacy settings |
| POST | `/users/me/onboarding` | Complete onboarding (+50 XP) |
| GET | `/users/:username` | Get public profile |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | List tasks (filter by date, category, status) |
| POST | `/tasks` | Create new task |
| GET | `/tasks/:id` | Get task details |
| PATCH | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |
| POST | `/tasks/:id/complete` | Mark task complete (+XP) |
| POST | `/tasks/:id/uncomplete` | Mark incomplete |

### Circles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/circles` | List user's circles |
| POST | `/circles` | Create new circle |
| GET | `/circles/:id` | Get circle details |
| PATCH | `/circles/:id` | Update circle (admin only) |
| DELETE | `/circles/:id` | Delete circle (admin only) |
| POST | `/circles/:id/join` | Join circle with invite code |
| POST | `/circles/:id/leave` | Leave circle |
| GET | `/circles/:id/members` | Get circle members |
| DELETE | `/circles/:id/members/:userId` | Remove member (admin) |

### Challenges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/challenges` | List challenges (filter by type, circle) |
| POST | `/challenges` | Create new challenge |
| GET | `/challenges/:id` | Get challenge details |
| POST | `/challenges/:id/join` | Join challenge |
| POST | `/challenges/:id/leave` | Leave challenge |
| GET | `/challenges/:id/progress` | Get user's progress |
| POST | `/challenges/:id/update-progress` | Update progress |

### Posts (Circle Feed)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | List posts in circles (paginated) |
| POST | `/posts` | Create new post |
| GET | `/posts/:id` | Get post details |
| PATCH | `/posts/:id` | Edit post |
| DELETE | `/posts/:id` | Delete post |
| POST | `/posts/:id/react` | Add reaction (heart, fire, clap) |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assignments` | List assignments (sent & received) |
| POST | `/assignments` | Assign task to circle member |
| GET | `/assignments/:id` | Get assignment details |
| POST | `/assignments/:id/accept` | Accept assignment |
| POST | `/assignments/:id/decline` | Decline assignment |
| POST | `/assignments/:id/complete` | Complete assignment (+XP) |
| POST | `/assignments/:id/submit-proof` | Submit proof photo |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/overview` | Get stats overview (XP, tasks, streaks) |
| GET | `/analytics/tasks` | Task completion trends |
| GET | `/analytics/categories` | Category breakdown |
| GET | `/analytics/streaks` | Streak history |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/briefing` | Get daily briefing |
| POST | `/ai/voice-command` | Process voice command |
| POST | `/ai/suggest-challenge` | Get AI challenge suggestions |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| PATCH | `/notifications/:id/read` | Mark notification as read |
| POST | `/notifications/register-push` | Register push token |

---

## 📱 App Screens

### Main Navigation (Bottom Tabs)
1. **Home (Hub)** - Daily briefing, today's tasks, quick actions, streak/level stats
2. **Plan** - Weekly task planner, add/edit tasks
3. **Voice (Modal)** - AI voice assistant
4. **Circles** - List of circles, join/create circles
5. **Profile** - User stats, achievements, settings

### HomeStack Screens (18)
- Hub, Inbox, Wallet, Challenges, Settings, Tasks, Streak, Level, Reset, TaskSorting, ProofCamera, ProofConfirm, DailyLifeCard, SavedPlaces, Analytics, DailyBriefing, AIInsights, NotificationSettings

### ProfileStack Screens (6)
- ProfileMain, EditProfile, Notifications, PrivacyControls, HelpSupport, SettingsFromProfile

### CirclesStack Screens (1+)
- CirclesList, CircleHome (modal overlay)

**Total:** 26 screens + modals

---

## 🎮 Gamification System

### XP Rewards
| Action | XP Earned |
|--------|-----------|
| Complete task (low priority) | +5 XP |
| Complete task (medium priority) | +10 XP |
| Complete task (high priority) | +20 XP |
| Complete assignment | +15 XP |
| Daily streak milestone | +10 XP |
| Complete challenge | +50-100 XP |
| Onboarding complete | +50 XP |

### Level System
- **Level 1:** 0-100 XP
- **Level 2:** 100-250 XP
- **Level 3:** 250-500 XP
- **Level 4:** 500-1000 XP
- **Level 5+:** Increases exponentially

Formula: `XP_required = previous_threshold * 1.5`

### Streaks
- Track consecutive days of task completion
- Lose streak if no tasks completed for 24 hours
- Streak multipliers for XP (coming soon)

---

## 🧪 Testing

### Unit Tests (React Native Testing Library)
```bash
cd frontend
npm test
```

Test files in `frontend/src/__tests__/`:
- `components/LoginForm.test.tsx`
- `components/QuickActions.test.tsx`
- `components/StatCards.test.tsx`
- `navigation/App.navigation.test.tsx`
- `navigation/HomeStack.test.tsx`

### E2E Tests (Detox)
```bash
cd frontend
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug
```

Test files in `frontend/e2e/`:
- `auth.e2e.js` - Authentication flow
- `navigation.e2e.js` - Tab navigation
- `tasks.e2e.js` - Task completion journey
- `circles.e2e.js` - Circle interaction

See [AUDIT_NAVIGATION_AND_INTERACTIONS.md](AUDIT_NAVIGATION_AND_INTERACTIONS.md) for full test suite details.

---

## 📊 Code Quality & Audits

This repository includes comprehensive audit reports:

### 1. **Navigation & Interactions Audit**
**File:** [AUDIT_NAVIGATION_AND_INTERACTIONS.md](AUDIT_NAVIGATION_AND_INTERACTIONS.md)

- Complete navigation route inventory (26 screens)
- Screen-by-screen interactive element enumeration (120+ buttons/CTAs)
- Critical issues identified:
  - 🔴 VoiceAssistant navigation broken in 2 screens
  - 🟠 Missing error boundaries in handleNavigate() helpers (5 files)
- Minimal test suite (unit, navigation, interaction, E2E with Detox)

### 2. **UI/UX & Production Readiness Audit**
**File:** [UX_UI_PROD_READINESS_AUDIT.md](UX_UI_PROD_READINESS_AUDIT.md)

- Design system audit (theme usage, consistency gaps)
- Screen-by-screen UI findings (spacing, typography, colors, touch targets)
- UX flow friction analysis (6 main user journeys)
- Accessibility audit (screen readers, dynamic type, color contrast)
- Performance UX notes (FlatList optimization, memoization)
- Pre-deployment checklist (error handling, analytics, crash reporting, security)
- **Top 15 prioritized actions** with effort estimates

**Quality Score:** 6.5/10
- **Strengths:** Solid design system foundation, modular architecture, good empty states
- **Weaknesses:** 90%+ hardcoded values, 35% accessibility coverage, missing error boundaries

---

## 🐛 Known Issues & Roadmap

### Critical (P0) - Fix Before Beta
- [ ] Add error boundaries to all screens
- [ ] Fix FlatList inside ScrollView (Inbox performance)
- [ ] Add loading states to Hub, Plan, Tasks
- [ ] Fix touch targets < 44x44 (5+ violations)
- [ ] Add error UI for API failures
- [ ] Add form validation (email, password)
- [ ] Setup crash reporting (Sentry)
- [ ] Add offline detection & handling

### High Priority (P1) - Fix Before 1.0
- [ ] Add accessibility labels to all buttons (~65% missing)
- [ ] Refactor hardcoded colors to theme
- [ ] Add analytics tracking (Segment/Mixpanel)
- [ ] Add inline form validation
- [ ] Setup remote config / feature flags
- [ ] Optimize Hub task rendering (use FlatList or useMemo)

### Nice to Have (P2) - Post-Launch
- [ ] Add skeleton loading screens
- [ ] Implement focus sessions (Pomodoro timer)
- [ ] Add achievements & badges system
- [ ] Build leaderboards
- [ ] Advanced insights dashboard

See [UX_UI_PROD_READINESS_AUDIT.md](UX_UI_PROD_READINESS_AUDIT.md) Section 8 for full prioritized action list.

---

## 🤝 Contributing

This is a personal project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Code Standards:**
- Follow existing TypeScript/TSX patterns
- Use theme tokens (no hardcoded colors/spacing)
- Add accessibility labels to all interactive elements
- Write tests for new features
- Follow the component structure in refactored screens (see Hub/)

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 📞 Contact

**Project Maintainer:** Khalid  
**Repository:** [mypa-ios-latest](https://github.com/yourusername/mypa-ios-latest)

---

## 🙏 Acknowledgments

- Design inspiration: [Shadcn UI](https://ui.shadcn.com/)
- Icons: [Lucide](https://lucide.dev/)
- Backend framework: [Express](https://expressjs.com/)
- ORM: [Prisma](https://www.prisma.io/)
- Mobile framework: [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)

---

**Built with ❤️ and accountability**

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
