# Mylo Architecture Plan v2
## Voice-First AI Agent — Gesture-Based Navigation

> **Vision**: Mylo is not an app with AI. Mylo *is* the AI. You talk to it. Everything else is just views of what it knows.

---

## Related Documentation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **This File (Architecture)** | Technical architecture, user flows, AI functions, navigation | Understanding how features work and connect |
| [MYLO_DESIGN_SPECIFICATION.md](./MYLO_DESIGN_SPECIFICATION.md) | Pixel-perfect UI specs, colors, typography, component states | Implementing visual design |
| [MYLO_FULL_IMPLEMENTATION_GUIDE.md](./MYLO_FULL_IMPLEMENTATION_GUIDE.md) | Step-by-step implementation, code examples, API details | Building features phase by phase |

---

## Table of Contents

1. [Core Philosophy](#1-core-philosophy)
2. [The Gesture Model](#2-the-gesture-model)
3. [Screen Architecture (10 Screens)](#3-screen-architecture-10-screens)
4. [Navigation & Gestures](#4-navigation--gestures)
5. [AI Integration](#5-ai-integration)
6. [Progressive Unlock System](#6-progressive-unlock-system)
7. [AI Learning Model](#7-ai-learning-model)
8. [Data Architecture](#8-data-architecture)
   - 8.1 [Calendar Integration](#81-calendar-integration)
   - 8.2 [Recurring Tasks](#82-recurring-tasks)
   - 8.3 [iOS Widgets](#83-ios-widgets)
   - 8.4 [Quick Capture](#84-quick-capture)
   - 8.5 [Daily Brief Notifications](#85-daily-brief-notifications)
   - 8.6 [Gesture Onboarding](#86-gesture-onboarding)
   - 8.7 [AI Response Streaming](#87-ai-response-streaming)
   - 8.8 [Offline Voice Fallback](#88-offline-voice-fallback)
   - 8.9 [Smart Priority Detection](#89-smart-priority-detection)
   - 8.10 [Celebration & Reward System](#810-celebration--reward-system)
9. [Technical Implementation](#9-technical-implementation)
10. [Voice Command System](#10-voice-command-system)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [API Specifications](#12-api-specifications)
13. [Security Architecture](#13-security-architecture)
14. [Performance Architecture](#14-performance-architecture)
15. [Offline Architecture](#15-offline-architecture)
16. [Error Handling & Resilience](#16-error-handling--resilience)
17. [Gesture System Technical Details](#17-gesture-system-technical-details)
18. [AI Orb Technical Details](#18-ai-orb-technical-details)
19. [Testing Strategy](#19-testing-strategy)
20. [Deployment Architecture](#20-deployment-architecture)
21. [**COMPLETE APP REFERENCE**](#22-complete-app-reference)
22. [Summary](#summary)

---

# 22. COMPLETE APP REFERENCE

> **This is the master reference for EVERY screen, modal, function, API endpoint, and interaction in Mylo.**
> A senior developer can use this section to understand the entire application.

---

## 22.1 ALL SCREENS (37 Total)

### Core Navigation Screens
| Screen | File Path | Purpose | Entry Point |
|--------|-----------|---------|-------------|
| **AI Home** | `screens/AIHome/` | Central hub, AI orb, greeting, quick actions | App launch, gesture navigation |
| **Tasks View** | `screens/GestureTasks/` | Task list with filters, AI sorting | Swipe left from AI Home |
| **Social View** | `screens/GestureSocial/` | Circles & challenges list | Swipe right from AI Home |
| **Profile View** | `screens/GestureProfile/` | Stats, unlocks, settings access | Swipe down from AI Home |
| **Focus Modal** | `screens/FocusModal/` | Timer, AI encouragement, session tracking | Swipe up from AI Home |

### Task Management Screens
| Screen | File Path | Purpose | Entry Point |
|--------|-----------|---------|-------------|
| **Tasks (Legacy)** | `screens/Tasks/` | Full task management | Tab bar (deprecated) |
| **Task Detail** | `screens/Tasks/TaskDetail` | View/edit single task | Tap task card |
| **Task Sorting** | `screens/TaskSorting/` | Drag-drop reorder | Settings or long-press |
| **Recurring Tasks** | `screens/RecurringTasks/` | Manage repeating tasks | Settings |
| **Plan** | `screens/Plan/` | Daily/weekly planning view | Legacy tab |

### Social & Circles Screens
| Screen | File Path | Purpose | Entry Point |
|--------|-----------|---------|-------------|
| **Circles List** | `screens/Circle/Circles/` | All user's circles | Social View |
| **Circle Home** | `screens/Circle/CircleHome/` | Single circle: members, feed, challenges | Tap circle card |
| **Challenges** | `screens/Challenges/` | All challenges list | Social View tab |
| **Challenge Detail** | Within Challenges | Single challenge: leaderboard, progress | Tap challenge card |

### Profile & Settings Screens
| Screen | File Path | Purpose | Entry Point |
|--------|-----------|---------|-------------|
| **Profile** | `screens/Profile/` | User stats, achievements, settings link | Profile View |
| **Edit Profile** | `screens/EditProfile/` | Edit name, avatar, bio | Profile → Edit |
| **Settings** | `screens/Settings/` | All app settings | Profile → Settings gear |
| **Privacy Controls** | `screens/PrivacyControls/` | Data sharing, visibility | Settings |
| **Notification Settings** | `screens/Notification/` | Push notification preferences | Settings |
| **Help & Support** | `screens/HelpSupport/` | FAQ, contact, feedback | Settings |

### AI & Voice Screens
| Screen | File Path | Purpose | Entry Point |
|--------|-----------|---------|-------------|
| **Voice Assistant** | `screens/VoiceAssistant/` | Full voice conversation UI | Orb tap or dedicated button |
| **Listening** | `screens/Listening/` | Voice input capture | Orb tap |
| **AI Insights** | `screens/AIInsights/` | AI-generated insights display | Profile → Insights |
| **Daily Briefing** | `screens/DailyBriefing/` | Morning/evening AI summary | Notification tap or home |

### Gamification Screens
| Screen | File Path | Purpose | Entry Point |
|--------|-----------|---------|-------------|
| **Streak** | `screens/Streak/` | Streak details, history | Tap streak card |
| **Level** | `screens/Level/` | XP breakdown, level progress | Tap XP/level card |
| **Wallet** | `screens/Wallet/` | XP wallet, rewards history | Profile |
| **Proof** | `screens/Proof/` | Assignment proof submission | Assignment completion |

### Authentication Screens
| Screen | File Path | Purpose | Entry Point |
|--------|-----------|---------|-------------|
| **Login** | `screens/Login/` | Email/password login | App launch (unauthenticated) |
| **Reset Password** | `screens/Reset/` | Password reset flow | Login → Forgot password |
| **Onboarding** | `screens/Onboarding/` | First-time user flow | After registration |

### Other Screens
| Screen | File Path | Purpose | Entry Point |
|--------|-----------|---------|-------------|
| **Hub** | `screens/Hub/` | Legacy home screen | Deprecated |
| **Analytics** | `screens/Analytics/` | Detailed productivity stats | Profile or settings |
| **Inbox** | `screens/Inbox/` | Notifications, invitations | Notification icon |
| **Integrations** | `screens/Integrations/` | Third-party connections | Settings |
| **Subscription** | `screens/Subscription/` | Premium features, billing | Settings or paywall |
| **Saved Places** | `screens/SavedPlaces/` | Location-based reminders | Settings |
| **Daily Life Card** | `screens/DailyLifeCard/` | Daily summary card generation | Social feed |

---

## 22.2 ALL MODALS (45+ Total)

### Task Modals
| Modal | Location | Trigger | Purpose |
|-------|----------|---------|---------|
| **TaskModal** | `Tasks/modals/TaskModal.tsx` | FAB tap, "Add Task" | Create/edit task with AI suggestions |
| **TaskDetailModal** | Within Tasks | Tap task (mobile) | Quick view task details |
| **DatePickerModal** | Task creation | Tap date field | Select due date |
| **TimePickerModal** | Task creation | Tap time field | Select due time with AI suggestions |
| **DurationPickerModal** | Task creation | Tap duration | Select estimated duration |
| **PriorityPickerModal** | Task creation | Tap priority | Select HIGH/MEDIUM/LOW |
| **CategoryPickerModal** | Task creation | Tap category | Select or create category |
| **RepeatModal** | Task creation | Tap repeat | Set recurring schedule |
| **TaskDeleteConfirmModal** | Task swipe left | Swipe + confirm | Confirm task deletion |
| **TaskCompleteModal** | Task completion | After completion | Celebrate with XP animation |

### Focus Modals
| Modal | Location | Trigger | Purpose |
|-------|----------|---------|---------|
| **FocusSessionModal** | `FocusModal/` | Swipe up, "Start Focus" | Timer, AI messages, controls |
| **FocusTaskSelectModal** | Focus start | Optional task selection | Choose task to focus on |
| **FocusCompleteModal** | Timer ends | Auto on 00:00 | Celebration, XP earned, stats |
| **FocusPauseConfirmModal** | Pause button | Tap pause | Confirm pausing session |
| **FocusAbandonConfirmModal** | End early | Tap end | Confirm ending without completion |

### Circle Modals
| Modal | Location | Trigger | Purpose |
|-------|----------|---------|---------|
| **CreateCircleModal** | Circles screen | "Create Circle" | Name, emoji, privacy settings |
| **JoinCircleModal** | Circles screen | "Join Circle" | Enter invite code |
| **CircleSettingsModal** | Circle Home | Settings gear | Edit circle, manage members |
| **InviteMembersModal** | Circle Home | "Invite" button | Search users, share link |
| **CircleMemberModal** | Circle Home | Tap member avatar | View member profile, nudge |
| **NudgeConfirmModal** | Member modal | "Nudge" button | Confirm sending nudge |
| **LeaveCircleConfirmModal** | Circle settings | "Leave Circle" | Confirm leaving |
| **DeleteCircleConfirmModal** | Circle settings | "Delete Circle" | Confirm deletion |
| **KickMemberConfirmModal** | Circle settings | Kick option | Confirm removing member |

### Challenge Modals
| Modal | Location | Trigger | Purpose |
|-------|----------|---------|---------|
| **CreateChallengeModal** | Challenges screen | "Create Challenge" | Type, target, duration, XP |
| **JoinChallengeConfirmModal** | Challenge card | "Join" button | Confirm joining |
| **LeaveChallengeConfirmModal** | Challenge detail | "Leave" button | Confirm leaving |
| **ChallengeLeaderboardModal** | Challenge detail | "Leaderboard" | Full standings |
| **ChallengePrizeModal** | Challenge complete | Win condition | Celebration for winners |

### Assignment Modals
| Modal | Location | Trigger | Purpose |
|-------|----------|---------|---------|
| **CreateAssignmentModal** | Circle Home | "Assign Task" | Create assignment for member |
| **AssignmentDetailModal** | Inbox/Circle | Tap assignment | View assignment details |
| **AcceptDeclineModal** | Assignment received | Auto on receive | Accept or decline with reason |
| **SubmitProofModal** | Assignment complete | "Submit Proof" | Upload photo/note as proof |
| **ProofReviewModal** | Creator view | Tap submitted proof | Review and approve proof |

### Profile Modals
| Modal | Location | Trigger | Purpose |
|-------|----------|---------|---------|
| **AchievementsModal** | `Profile/modals/` | Tap achievements | All badges and achievements |
| **LogoutModal** | `Profile/modals/` | "Logout" button | Confirm logout |
| **DeleteAccountModal** | Settings | "Delete Account" | Confirm account deletion |
| **StreakDetailModal** | Profile | Tap streak | Calendar, streak history |
| **XPBreakdownModal** | Profile | Tap XP | Sources of XP earned |
| **EditAvatarModal** | Edit Profile | Tap avatar | Change profile picture |

### Unlock Modals
| Modal | Location | Trigger | Purpose |
|-------|----------|---------|---------|
| **UnlockCelebrationModal** | Any screen | Feature unlocked | Confetti, explanation |
| **UnlockDetailsModal** | `Unlock/UnlockProgressCard.tsx` | Tap locked feature | Progress, requirements |
| **UnlockListModal** | Profile | "View All Unlocks" | All features with status |

### System Modals
| Modal | Location | Trigger | Purpose |
|-------|----------|---------|---------|
| **PermissionModal** | Various | First use | Request mic/notifications/calendar |
| **ErrorModal** | Global | API error | Display error with retry |
| **OfflineBanner** | Global | Network lost | "You're offline" indicator |
| **UpdateAvailableModal** | App launch | New version | Prompt to update |
| **RateAppModal** | After milestones | Conditions met | Request App Store rating |
| **FeedbackModal** | Help & Support | "Send Feedback" | User feedback form |
| **WhatsNewModal** | After update | First launch | New features showcase |

### Quick Action Modals
| Modal | Location | Trigger | Purpose |
|-------|----------|---------|---------|
| **QuickCaptureModal** | `QuickCapture.tsx` | Widget, Siri, 3D Touch | Fast task entry |
| **ShareModal** | `ShareModal/` | Share action | Share achievement/invite |
| **ActionSheetModal** | Various | Long press | Context actions |

---

## 22.3 ALL API ENDPOINTS (80+ Endpoints)

### Authentication Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/logout` | Logout (invalidate tokens) |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Complete password reset |
| POST | `/auth/verify-email` | Verify email address |

### User Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update profile (name, avatar, bio) |
| DELETE | `/users/me` | Delete account |
| GET | `/users/me/stats` | Get user statistics |
| POST | `/users/me/onboarding` | Complete onboarding |
| GET | `/users/me/settings` | Get user settings |
| PATCH | `/users/me/settings` | Update settings |
| GET | `/users/check-username/:username` | Check username availability |
| GET | `/users/:username` | Get public profile by username |

### Task Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/today` | Get today's tasks |
| GET | `/tasks/open` | Get incomplete tasks |
| GET | `/tasks/stats` | Get task statistics |
| POST | `/tasks` | Create new task |
| GET | `/tasks/:id` | Get single task |
| PATCH | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |
| POST | `/tasks/:id/complete` | Mark task complete |
| POST | `/tasks/:id/uncomplete` | Mark task incomplete |
| POST | `/tasks/:id/defer` | Defer task to tomorrow |

### Focus Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/focus/active` | Get active session |
| POST | `/focus/start` | Start new session |
| POST | `/focus/pause` | Pause session |
| POST | `/focus/resume` | Resume session |
| POST | `/focus/complete` | Complete session |
| POST | `/focus/abandon` | Abandon session |
| GET | `/focus/history` | Get session history |
| GET | `/focus/stats` | Get focus statistics |

### AI Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/ai/conversation` | Main AI chat endpoint |
| POST | `/ai/process-command` | Process voice command |
| GET | `/ai/briefing` | Get morning briefing |
| GET | `/ai/evening-summary` | Get evening recap |
| GET | `/ai/suggestion` | Get proactive suggestion |
| GET | `/ai/task-suggestions` | Get task optimization tips |
| POST | `/ai/categorize-task` | Auto-categorize task |
| POST | `/ai/smart-schedule` | AI task scheduling |
| GET | `/ai/daily-insights` | Get AI insights |
| POST | `/ai/chat` | Simple Q&A |
| POST | `/ai/transcribe-base64` | Transcribe audio |
| POST | `/ai/suggest-challenge` | Generate challenge idea |

### TTS Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/tts/speak` | Generate speech audio |
| POST | `/tts/stream` | Stream speech audio |

### Circle Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/circles` | Get user's circles |
| POST | `/circles` | Create new circle |
| GET | `/circles/:id` | Get circle details |
| PATCH | `/circles/:id` | Update circle |
| DELETE | `/circles/:id` | Delete circle |
| POST | `/circles/:id/join` | Join circle |
| POST | `/circles/join/:code` | Join by invite code |
| POST | `/circles/:id/leave` | Leave circle |
| GET | `/circles/preview/:code` | Preview circle by code |
| GET | `/circles/:id/members` | Get circle members |
| PATCH | `/circles/:id/members/:userId` | Update member role |
| DELETE | `/circles/:id/members/:userId` | Remove member |
| POST | `/circles/:id/invite-code` | Regenerate invite code |
| GET | `/circles/:id/feed` | Get circle activity feed |
| POST | `/circles/:id/posts` | Create post in circle |
| POST | `/circles/:id/posts/daily-card` | Generate daily card |
| GET | `/circles/:id/assignments` | Get circle assignments |
| POST | `/circles/:id/assignments` | Create assignment |

### Challenge Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/challenges` | Get all challenges |
| GET | `/challenges/mine` | Get joined challenges |
| GET | `/challenges/active` | Get active challenges |
| POST | `/challenges` | Create challenge |
| GET | `/challenges/:id` | Get challenge details |
| PUT | `/challenges/:id` | Update challenge |
| DELETE | `/challenges/:id` | Delete challenge |
| POST | `/challenges/:id/join` | Join challenge |
| POST | `/challenges/:id/leave` | Leave challenge |
| POST | `/challenges/:id/progress` | Update progress |
| GET | `/challenges/:id/leaderboard` | Get leaderboard |

### Assignment Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/assignments/mine` | Get my assignments |
| GET | `/assignments/:id` | Get assignment details |
| PUT | `/assignments/:id` | Update assignment |
| DELETE | `/assignments/:id` | Delete assignment |
| POST | `/assignments/:id/accept` | Accept assignment |
| POST | `/assignments/:id/decline` | Decline assignment |
| POST | `/assignments/:id/complete` | Complete with proof |
| PUT | `/assignments/:id/response` | Update response |

### Brain Dump Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/brain-dump` | Get all brain dump items |
| POST | `/brain-dump` | Create brain dump item |
| POST | `/brain-dump/batch` | Batch create items |
| POST | `/brain-dump/:id/process` | Process with AI |
| POST | `/brain-dump/:id/convert` | Convert to task |
| DELETE | `/brain-dump/:id` | Delete item |
| GET | `/brain-dump/stats` | Get statistics |
| POST | `/brain-dump/smart-schedule` | AI schedule items |
| POST | `/brain-dump/quick-schedule` | Quick schedule text |

### Notification Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/notifications/register-token` | Register push token |
| DELETE | `/notifications/token` | Remove push token |
| GET | `/notifications` | Get notification history |
| GET | `/notifications/unread-count` | Get unread count |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all read |
| DELETE | `/notifications/:id` | Delete notification |
| DELETE | `/notifications` | Clear all |
| GET | `/notifications/settings` | Get settings |
| PUT | `/notifications/settings` | Update settings |
| POST | `/notifications/test` | Send test notification |

### Analytics Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/analytics/daily` | Get daily stats |
| GET | `/analytics/weekly` | Get weekly stats |
| GET | `/analytics/trends` | Get trends |
| GET | `/analytics/insights` | Get insights |
| GET | `/analytics/dashboard` | Get dashboard overview |
| GET | `/analytics/leaderboard/global` | Global leaderboard |
| GET | `/analytics/leaderboard/circle/:id` | Circle leaderboard |
| GET | `/analytics/circle/:id` | Circle analytics |

### Event Logging Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/events` | Log single event |
| POST | `/events/batch` | Log batch events |
| GET | `/events` | Get event history |
| GET | `/events/patterns` | Get learned patterns |

### Unlock Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/unlocks` | Get all unlocks |
| GET | `/unlocks/:featureId` | Get specific unlock |
| GET | `/unlocks/check/:featureId` | Check if unlocked |
| POST | `/unlocks/check` | Trigger unlock check |

### Recurring Task Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/recurring` | Get recurring tasks |
| POST | `/recurring` | Create recurring task |
| PUT | `/recurring/:id` | Update recurring task |
| POST | `/recurring/:id/pause` | Pause recurring |
| POST | `/recurring/:id/resume` | Resume recurring |
| DELETE | `/recurring/:id` | Delete recurring |
| POST | `/recurring/generate` | Generate due instances |

### Calendar Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/calendar/connect` | Connect calendar provider |
| DELETE | `/calendar/disconnect/:provider` | Disconnect provider |
| GET | `/calendar/connections` | Get connections |
| POST | `/calendar/sync/:connectionId` | Sync calendar |
| GET | `/calendar/events` | Get calendar events |
| GET | `/calendar/timeline` | Get merged timeline |
| POST | `/calendar/export/:taskId` | Export task to calendar |
| GET | `/calendar/conflicts` | Check for conflicts |
| GET | `/calendar/suggest-slots` | Get suggested times |

### Invitation Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/invitations/mine` | Get my invitations |
| POST | `/invitations/circle/:id/invite/:userId` | Send invitation |
| POST | `/invitations/:id/accept` | Accept invitation |
| POST | `/invitations/:id/decline` | Decline invitation |
| GET | `/invitations/search/:circleId` | Search users to invite |

### Post Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/posts/:id` | Get single post |
| PATCH | `/posts/:id` | Update post |
| DELETE | `/posts/:id` | Delete post |
| POST | `/posts/:id/react` | Add reaction |
| DELETE | `/posts/:id/react` | Remove reaction |
| GET | `/posts/:id/reactions` | Get all reactions |

### Brief Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/brief/daily` | Get daily brief |
| GET | `/brief/evening` | Get evening recap |
| GET | `/brief/quick` | Get quick status |

---

## 22.4 ALL COMPONENTS (150+ Components)

### Core UI Components
| Component | Location | Purpose |
|-----------|----------|---------|
| **AIOrb** | `components/AIOrb/` | Central AI interaction orb |
| **MYPAOrb** | `components/MYPAOrb.tsx` | Simplified orb variant |
| **DualInputBar** | `components/DualInputBar.tsx` | Voice + text input bar |
| **VoicePill** | `components/VoicePill.tsx` | Voice recording indicator |
| **QuickCapture** | `components/QuickCapture.tsx` | Quick task entry |
| **TabBar** | `components/TabBar.tsx` | Legacy navigation bar |
| **FloatingMYPAButton** | `components/FloatingMYPAButton.tsx` | Floating action button |
| **IOSStatusBar** | `components/IOSStatusBar.tsx` | Custom status bar |
| **ErrorBoundary** | `components/ErrorBoundary.tsx` | Error catching wrapper |
| **LoadingOverlay** | `components/LoadingOverlay.tsx` | Full-screen loading |
| **CelebrationOverlay** | `components/CelebrationOverlay.tsx` | Confetti celebration |
| **AnimatedCard** | `components/AnimatedCard.tsx` | Animated card wrapper |
| **ToggleSwitch** | `components/ToggleSwitch.tsx` | iOS-style toggle |

### Card Components
| Component | Location | Purpose |
|-----------|----------|---------|
| **TaskCard** | `screens/Tasks/components/TaskCard` | Task list item |
| **CircleCard** | `screens/Circle/components/CircleCard` | Circle list item |
| **ChallengeCard** | `screens/Challenges/components/ChallengeCard` | Challenge list item |
| **StatsCard** | Various | Statistics display |
| **InsightCard** | `AIInsights/components/` | AI insight display |
| **DailyBriefingCard** | `components/DailyBriefingCard.tsx` | Morning summary |
| **MissionCard** | `components/MissionCard.tsx` | Daily mission item |
| **MemberCard** | Circle components | Circle member display |
| **AssignmentCard** | Assignment components | Assignment display |
| **NotificationCard** | Inbox components | Notification item |
| **AchievementCard** | Profile components | Achievement badge |

### Unlock Components
| Component | Location | Purpose |
|-----------|----------|---------|
| **UnlockProgressCard** | `components/Unlock/` | Show unlock progress |
| **UnlockDetailsModal** | `components/Unlock/` | Unlock details popup |
| **UnlockCelebration** | `components/Unlock/` | Celebration animation |

### Form Components
| Component | Purpose |
|-----------|---------|
| **TextInput** | Text entry |
| **DatePicker** | Date selection |
| **TimePicker** | Time selection |
| **PriorityPicker** | Priority selection |
| **CategoryPicker** | Category selection |
| **DurationPicker** | Duration selection |
| **EmojiPicker** | Emoji selection |
| **ColorPicker** | Color selection |
| **SearchInput** | Search bar |

### List Components
| Component | Purpose |
|-----------|---------|
| **TaskList** | Task list container |
| **CircleList** | Circle list container |
| **ChallengeList** | Challenge list container |
| **MemberList** | Member list container |
| **NotificationList** | Notification list |
| **FilterTabs** | Filter tab bar |
| **SortOptions** | Sort dropdown |

### Layout Components
| Component | Purpose |
|-----------|---------|
| **ScreenContainer** | Screen wrapper with safe areas |
| **Header** | Screen header |
| **BottomSheet** | Bottom sheet modal |
| **ActionSheet** | Action sheet modal |
| **Divider** | Section divider |
| **Spacer** | Spacing utility |
| **Row** | Horizontal layout |
| **Column** | Vertical layout |

### State Components
| Component | Purpose |
|-----------|---------|
| **EmptyState** | Empty list placeholder |
| **ErrorState** | Error display |
| **LoadingState** | Loading spinner |
| **SkeletonLoader** | Skeleton loading |
| **OfflineBanner** | Offline indicator |
| **SyncIndicator** | Sync status |

---

## 22.5 ALL FILTER TABS

### Tasks View Filters
| Tab | Filter | Query |
|-----|--------|-------|
| **Today** | Tasks due today | `dueDate = today` |
| **Tomorrow** | Tasks due tomorrow | `dueDate = tomorrow` |
| **This Week** | Tasks due this week | `dueDate >= today && dueDate <= endOfWeek` |
| **All** | All incomplete tasks | `status != COMPLETED` |
| **High Priority** | High priority only | `priority = HIGH` |
| **Completed** | Completed tasks | `status = COMPLETED` |
| **Overdue** | Past due date | `dueDate < today && status != COMPLETED` |

### Social View Tabs
| Tab | Content |
|-----|---------|
| **Circles** | User's circles list |
| **Challenges** | Active challenges |
| **Activity** | Recent activity feed |

### Circle Feed Filters
| Tab | Filter |
|-----|--------|
| **All** | All post types |
| **Tasks** | Task-related posts |
| **Achievements** | Milestone posts |
| **Daily Cards** | Daily summary cards |

### Challenge Filters
| Tab | Filter |
|-----|--------|
| **Active** | Currently running |
| **Upcoming** | Starting soon |
| **Completed** | Finished challenges |
| **My Challenges** | User-created |

### Notification Filters
| Tab | Filter |
|-----|--------|
| **All** | All notifications |
| **Unread** | Unread only |
| **Invitations** | Circle invites |
| **Assignments** | Assignment notifications |
| **Social** | Social activity |

---

## 22.6 ALL SETTINGS OPTIONS

### Account Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Name** | text | From signup | Display name |
| **Username** | text | Auto-generated | Unique @username |
| **Email** | text | From signup | Account email |
| **Avatar** | image | Default | Profile picture |
| **Bio** | text | Empty | Short bio |

### Notification Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Push Enabled** | toggle | true | Master push toggle |
| **Task Reminders** | toggle | true | Due date reminders |
| **Assignment Alerts** | toggle | true | New assignments |
| **Streak Reminders** | toggle | true | Streak at risk |
| **Daily Briefing** | toggle | true | Morning brief |
| **Level Up Alerts** | toggle | true | XP milestones |
| **Challenge Updates** | toggle | true | Challenge activity |
| **Circle Activity** | toggle | true | Circle posts |
| **AI Insights** | toggle | true | AI recommendations |
| **Weekly Digest** | toggle | false | Weekly summary |
| **Sound Enabled** | toggle | true | Notification sounds |
| **Vibration Enabled** | toggle | true | Haptic feedback |
| **Badge Enabled** | toggle | true | App badge count |
| **Quiet Hours Enabled** | toggle | false | Do not disturb |
| **Quiet Hours Start** | time | 22:00 | DND start time |
| **Quiet Hours End** | time | 08:00 | DND end time |

### Privacy Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Profile Visibility** | enum | PUBLIC | Who can see profile |
| **Activity Visibility** | enum | CIRCLES | Who sees activity |
| **Show Stats** | toggle | true | Display stats publicly |
| **Allow Nudges** | toggle | true | Allow nudge notifications |
| **Allow Invites** | toggle | true | Allow circle invites |
| **Analytics Opt-in** | toggle | true | Anonymous usage data |

### App Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Theme** | enum | SYSTEM | Light/Dark/System |
| **Default Focus Duration** | number | 25 | Focus timer default |
| **Auto-Complete Voice** | toggle | true | End voice on silence |
| **Haptic Feedback** | toggle | true | Touch feedback |
| **Voice Type** | enum | nova | TTS voice selection |
| **Language** | enum | en | App language |

### Data Settings
| Setting | Action | Description |
|---------|--------|-------------|
| **Export Data** | button | Download all data (GDPR) |
| **Clear Cache** | button | Clear local cache |
| **Delete Account** | button | Permanently delete |

---

## 22.7 ALL SERVICES (Frontend)

| Service | File | Purpose |
|---------|------|---------|
| **api** | `services/api.ts` | HTTP client with auth |
| **authApi** | `services/api.ts` | Authentication methods |
| **userApi** | `services/api.ts` | User profile methods |
| **tasksApi** | `services/api.ts` | Task CRUD methods |
| **focusApi** | `services/api.ts` | Focus session methods |
| **aiApi** | `services/api.ts` | AI conversation methods |
| **ttsApi** | `services/api.ts` | Text-to-speech methods |
| **circlesApi** | `services/api.ts` | Circle methods |
| **challengesApi** | `services/api.ts` | Challenge methods |
| **assignmentsApi** | `services/api.ts` | Assignment methods |
| **brainDumpApi** | `services/api.ts` | Brain dump methods |
| **notificationsApi** | `services/api.ts` | Notification methods |
| **analyticsApi** | `services/api.ts` | Analytics methods |
| **eventsApi** | `services/api.ts` | Event logging methods |
| **unlocksApi** | `services/api.ts` | Unlock methods |
| **recurringApi** | `services/api.ts` | Recurring task methods |
| **calendarApi** | `services/api.ts` | Calendar sync methods |
| **briefApi** | `services/api.ts` | Daily brief methods |
| **postsApi** | `services/api.ts` | Social post methods |
| **invitationsApi** | `services/api.ts` | Invitation methods |
| **voiceAssistant** | `services/voiceAssistant.ts` | Voice recording/TTS |
| **intentParser** | `services/intentParser.ts` | Parse voice commands |
| **voiceActionExecutor** | `services/voiceActionExecutor.ts` | Execute voice actions |
| **pushNotifications** | `services/pushNotifications.ts` | Push token management |
| **socket** | `services/socket.ts` | WebSocket connection |
| **calendarSync** | `services/calendarSync.ts` | Calendar integration |
| **widgetService** | `services/widgetService.ts` | iOS widget data |

---

## 22.8 ALL BACKEND SERVICES

| Service | File | Purpose |
|---------|------|---------|
| **AuthService** | `auth.service.ts` | Authentication logic |
| **UserService** | `user.service.ts` | User management |
| **TaskService** | `task.service.ts` | Task CRUD |
| **FocusService** | `focus.service.ts` | Focus sessions |
| **AIService** | `ai.service.ts` | AI integration |
| **CircleService** | `circle.service.ts` | Circle management |
| **ChallengeService** | `challenge.service.ts` | Challenge logic |
| **AssignmentService** | `assignment.service.ts` | Assignment logic |
| **BraindumpService** | `braindump.service.ts` | Brain dump logic |
| **AnalyticsService** | `analytics.service.ts` | Analytics calculations |
| **PostService** | `post.service.ts` | Social posts |
| **InvitationService** | `invitation.service.ts` | Invitations |
| **PushService** | `push.service.ts` | Push notifications |
| **SocketService** | `socket.service.ts` | WebSocket handling |
| **SchedulerService** | `scheduler.service.ts` | Cron jobs |

---

## 22.9 ALL EVENT TYPES (For AI Learning)

| Event Type | Trigger | Metadata |
|------------|---------|----------|
| `app_opened` | App launch | timestamp, source |
| `task_created` | Create task | taskId, category, priority, source |
| `task_completed` | Complete task | taskId, completionTime, hourOfDay |
| `task_deferred` | Defer task | taskId, deferredTo |
| `task_deleted` | Delete task | taskId, category |
| `focus_started` | Start focus | sessionId, taskId, duration |
| `focus_completed` | Finish focus | sessionId, actualDuration, xpEarned |
| `focus_abandoned` | Abandon focus | sessionId, duration |
| `voice_command` | Voice input | command, intent, screen |
| `challenge_joined` | Join challenge | challengeId |
| `challenge_completed` | Finish challenge | challengeId, position |
| `circle_joined` | Join circle | circleId |
| `assignment_accepted` | Accept assignment | assignmentId |
| `assignment_completed` | Complete assignment | assignmentId, withProof |
| `nudge_sent` | Send nudge | targetUserId, circleId |
| `unlock_earned` | Earn unlock | featureId, via |
| `screen_viewed` | View screen | screenName, duration |
| `swipe_navigation` | Gesture nav | direction, fromScreen |

---

## 22.10 MISSING FOR PRODUCTION (Senior Dev Would Add)

### Legal & Compliance (CRITICAL)
- [ ] Terms of Service screen (content exists, no UI)
- [ ] Privacy Policy screen (content exists, no UI)
- [ ] GDPR consent flow on signup
- [ ] Cookie consent (web version)
- [ ] Data deletion confirmation flow
- [ ] Data export feature (download my data)

### Error Handling
- [ ] Global error modal with retry
- [ ] Network error specific handling
- [ ] Session expired modal (auto-redirect)
- [ ] Rate limit exceeded modal
- [ ] Server maintenance modal

### Account Management
- [ ] Email verification flow UI
- [ ] Change password screen
- [ ] Two-factor authentication
- [ ] Connected accounts (social login)
- [ ] Account recovery flow

### Deep Linking
- [ ] Universal links setup
- [ ] Task deep links (`mylo://task/:id`)
- [ ] Circle invite links (`mylo://circle/join/:code`)
- [ ] Challenge links (`mylo://challenge/:id`)
- [ ] Notification action links

### Engagement
- [ ] App rating prompt (after milestones)
- [ ] What's new screen (after updates)
- [ ] Feature tips/tooltips
- [ ] Achievement share cards

### Accessibility
- [ ] VoiceOver/TalkBack support audit
- [ ] Dynamic font sizes
- [ ] High contrast mode
- [ ] Reduced motion option
- [ ] Color blind friendly palette

### Performance
- [ ] Image lazy loading
- [ ] List virtualization verification
- [ ] Memory leak audit
- [ ] Bundle size optimization
- [ ] Startup time optimization

---

## 1. Core Philosophy

### The Inversion

**Traditional App:**
```
┌─────────────────────────────────────┐
│  App has features                   │
│  AI is one feature                  │
│  User navigates to AI               │
└─────────────────────────────────────┘
```

**Mylo:**
```
┌─────────────────────────────────────┐
│  AI IS the app                      │
│  Features are views of AI's data    │
│  AI is always present               │
└─────────────────────────────────────┘
```

### The 5 Rules

1. **AI is home** — You open the app, you see the AI. Always.
2. **Voice OR text** — Speak or type. Both are first-class citizens.
3. **Swipe for data** — Tasks, social, profile are swipe-away views.
4. **No tab bar** — Gestures replace tabs. Cleaner, more immersive.
5. **Earn insights** — AI features unlock via time OR milestones (user's choice).

### Market Positioning

**Target Audience:** People who feel overwhelmed by life's demands — particularly those with ADHD, anxiety, or executive function challenges.

**Tagline Options:**
- "The productivity app for overwhelmed minds"
- "Your ADHD-friendly task assistant"
- "Finally, a to-do list that understands you"

**Differentiation:** Not another task manager. An AI companion that learns your patterns, detects when you're drowning, and helps you focus on what matters.

### Dual Input Philosophy

Voice-first does NOT mean voice-only. Many situations make voice impractical:
- Open offices
- Public transport
- Late at night (partner sleeping)
- Social anxiety about talking to phone

**Solution: Text input as equal partner**

---

## 1.5 Complete User Interaction Reference

> **This section documents every user interaction, what happens when it's triggered, where the user navigates to, and how AI is integrated.**

### 1.5.1 AI Home Screen Interactions

| User Action | What Happens | AI Involvement | Navigation |
|-------------|--------------|----------------|------------|
| **Opens app** | Splash screen (0.5s) → AI Home loads → Greeting animates in → Orb pulses idle | AI generates personalized greeting based on time of day, name, task count, streak, challenges | Stays on AI Home |
| **Tap AI Orb** | Haptic feedback (medium) → Orb transitions to "listening" state → Microphone activates → "Listening..." text appears | AI prepares to receive voice command | Overlay appears for voice input |
| **Speak command** | Live transcription displays → Voice waves animate → User taps again OR stops speaking → Orb transitions to "processing" | AI parses intent → executes action if needed → generates contextual response | Depends on command (see Voice Commands below) |
| **Type in text field** | Keyboard rises → User types → Send button appears → User taps send | Same AI processing as voice | Depends on command |
| **Tap "Focus" quick action** | Button scales 0.97 → Haptic (light) → Focus modal slides up from bottom | AI selects next suggested task OR allows selection | Focus Session modal opens |
| **Tap "+ Task" quick action** | Button scales 0.97 → Haptic (light) → New task modal slides up | AI pre-fills duration estimate based on task patterns | Task creation modal opens |
| **Tap stats card (tasks)** | Haptic (light) → Card highlights | None | Swipes to Tasks View |
| **Tap stats card (streak)** | Haptic (light) → Celebration if milestone | AI congratulates on milestones | Profile View (streak detail) |
| **Tap stats card (rank)** | Haptic (light) | None | Social View (challenge standings) |
| **Swipe LEFT** | Screen pans left with finger → Edge peek shows Tasks → Release past threshold triggers navigation | None | Tasks View |
| **Swipe RIGHT** | Screen pans right with finger → Edge peek shows Social → Release past threshold triggers navigation | None | Social View |
| **Swipe UP** | Screen pans up → Focus modal begins to appear | AI suggests task to focus on | Focus Session modal |
| **Swipe DOWN** | Screen pans down → Profile edge peeks | None | Profile View |

### 1.5.2 Tasks View Interactions

| User Action | What Happens | AI Involvement | Navigation |
|-------------|--------------|----------------|------------|
| **Enter Tasks View** | Header animates in → Filter tabs load → Task list fetches → Mini orb appears top-right | AI silently sorts tasks by: (1) User's peak hours (2) Priority (3) Due time | Stays on Tasks View |
| **Tap filter tab (Today/Tomorrow/All/High)** | Tab highlights purple → List filters → Smooth scroll to top | AI applies smart sorting to filtered list | Stays on Tasks View |
| **Tap task checkbox** | Checkbox fills green → Task fades/strikes through → Haptic (success) → XP toast (+10 XP) → Task moves to completed section | AI logs completion → Updates user model → May trigger streak update | Stays on Tasks View |
| **Tap task row** | Row highlights → Slides to Task Detail | AI shows task insights if unlocked | Task Detail screen |
| **Swipe task LEFT** | Delete action reveals (red) → Confirm or release to cancel | AI logs deletion pattern | Delete or stay |
| **Swipe task RIGHT** | Complete action reveals (green) → Same as checkbox tap | AI logs completion | Stays on Tasks View |
| **Long press task** | Context menu appears (Edit, Delete, Move to Tomorrow, Start Focus) | AI may suggest "Best time for this task" | Context menu |
| **Tap mini orb** | Same as main orb - enters listening mode | Full AI voice capability | Voice input overlay |
| **Tap FAB (+)** | New task modal slides up → Title input focused | AI pre-fills category & duration estimate as user types | Task creation modal |
| **Swipe RIGHT (from edge)** | Navigate back to AI Home | None | AI Home |
| **Pull to refresh** | Refresh indicator → Tasks re-fetch from server | AI re-sorts with latest data | Stays on Tasks View |

### 1.5.3 Task Creation Flow (Detailed)

| Step | User Action | System Response | AI Integration |
|------|-------------|-----------------|----------------|
| 1 | Tap FAB or say "Add task" | Modal slides up OR voice acknowledges "Adding task..." | AI ready to parse |
| 2 | Enter task title | Title input captures text | AI analyzes keywords in real-time |
| 3 | (Auto) Category detected | Category chip appears (Work/Personal/Health/etc) | **AI FUNCTION:** `categorizeTask(title)` - Uses NLP to detect category from keywords ("gym" → Health, "meeting" → Work) |
| 4 | (Auto) Duration estimated | Duration chip shows "~25 min" | **AI FUNCTION:** `estimateDuration(title, category, userHistory)` - Uses historical data: user's avg duration for similar tasks |
| 5 | Tap calendar icon | Date picker appears | None |
| 6 | Select date | Date chip updates | None |
| 7 | Tap clock icon | Time picker appears | **AI FUNCTION:** `suggestOptimalTime(date, taskPriority)` - Highlights user's peak hours in picker |
| 8 | Select time | Time chip updates | None |
| 9 | Tap priority selector | HIGH/MEDIUM/LOW options | **AI FUNCTION:** `suggestPriority(title, dueDate)` - Pre-selects based on urgency keywords ("urgent", "ASAP") |
| 10 | Tap "Add Task" | Modal dismisses → Task appears in list → Haptic (success) → Toast "Task added" | AI logs event → Updates recommendations |
| 11 | (Voice alternative) Full sentence | "Add task call dentist tomorrow at 2pm high priority" parsed completely | **AI FUNCTION:** `parseNaturalLanguageTask()` - Extracts: title, date, time, priority from natural speech |

### 1.5.4 Focus Session Interactions

| User Action | What Happens | AI Involvement | Navigation |
|-------------|--------------|----------------|------------|
| **Start focus (no task)** | Timer initializes to 25:00 → Orb shows "focused" state → Ambient animation begins | AI says "Let's focus. I'll keep it quiet." | Focus modal active |
| **Start focus (with task)** | Same + task name shows "Working on: [Task]" | AI says "Focusing on [task]. You've got this." | Focus modal active |
| **Timer counts down** | Display updates every second → Progress ring fills | AI sends encouragement at milestones (5 min, halfway, 2 min left) | Stays in Focus |
| **Tap Pause** | Timer pauses → Orb dims → Buttons change to Resume/End | AI says "Taking a break? I'll be here." | Stays in Focus |
| **Tap Resume** | Timer continues → Orb brightens | AI says "Welcome back. Let's finish strong." | Stays in Focus |
| **Tap End Session** | Confirmation dialog → If confirmed: XP calculated → Celebration → Modal dismisses | AI announces: "Great session! +[XP] XP earned. [Insight]" | Returns to previous screen |
| **Timer reaches 0** | Celebration animation → Haptic (success) → Chime sound → XP awarded | AI says "You did it! [Minutes] minutes of focus. That's [streak position] this week." | Auto-dismisses after 3s |
| **Say "Add 5 minutes"** | Timer adds 5:00 → Haptic (light) | AI says "Added 5 minutes. Keep going!" | Stays in Focus |
| **Say "What's next?"** | AI reads next task without stopping focus | AI says "After this, you have [next task]." | Stays in Focus |
| **Swipe down** | Modal dismisses (with confirmation if timer active) | None | Returns to previous screen |
| **App backgrounded** | Timer continues → Push notification at completion | AI sends: "Your focus session completed! Come back to claim XP." | N/A |

### 1.5.5 Social View Interactions

| User Action | What Happens | AI Involvement | Navigation |
|-------------|--------------|----------------|------------|
| **Enter Social View** | Header animates → Circles list loads → Challenges section loads → Mini orb appears | AI generates activity summary if unlocked | Stays on Social View |
| **Tap circle card** | Card highlights → Navigates to Circle Home | AI shows circle-specific insights | Circle Home screen |
| **Tap challenge card** | Card highlights → Navigates to Challenge Detail | AI shows position and prediction | Challenge Detail screen |
| **Tap "Create Circle" button** | Creation modal opens → Name input focused | AI suggests circle name based on existing circles | Circle creation modal |
| **Tap "Invite" on circle** | Share sheet opens with invite link | None | System share sheet |
| **Tap member avatar** | Member profile modal opens → Shows their stats | AI compares: "Sarah completes 20% more tasks on Mondays" | Member modal |
| **Tap "Nudge" button** | Confirmation → Push notification sent to member | AI crafts encouraging nudge message | Toast confirmation |
| **Swipe LEFT (from edge)** | Navigate back to AI Home | None | AI Home |

### 1.5.6 Profile View Interactions

| User Action | What Happens | AI Involvement | Navigation |
|-------------|--------------|----------------|------------|
| **Enter Profile View** | Stats cards load → Unlock progress shows → Insights section loads | AI prepares personalized insights | Stays on Profile View |
| **Tap streak card** | Streak detail modal → Shows calendar of activity | AI says streak encouragement or recovery tips | Streak modal |
| **Tap XP card** | XP breakdown modal → Shows earning sources | AI says "Most of your XP comes from [source]" | XP modal |
| **Tap unlock progress card** | Full unlock list → Shows all features + progress | AI explains what each locked feature will do | Unlocks screen |
| **Tap "Insights" section** | Expands to show all unlocked insights | AI-generated insights based on user data | Expands inline |
| **Tap individual insight** | Detail view with charts/graphs | AI explains the insight in natural language | Insight detail modal |
| **Tap settings gear** | Settings screen opens | None | Settings screen |
| **Swipe UP (from edge)** | Navigate back to AI Home | None | AI Home |

### 1.5.7 Voice Command Processing (Complete Reference)

| Command Pattern | Intent Parsed | Action Executed | AI Response | Navigation |
|-----------------|---------------|-----------------|-------------|------------|
| "Add task [title]" | `add_task` | Creates task with AI-parsed details | "Added '[title]' to your tasks." | Optional: Tasks View |
| "I need to [action]" | `add_task` | Same as above | "Got it, I'll remind you to [action]." | None |
| "Mark [task] as done" | `complete_task` | Finds task by fuzzy match → Completes | "Nice! [task] is done. +10 XP." | None |
| "Complete [task]" | `complete_task` | Same as above | Same as above | None |
| "Delete [task]" | `delete_task` | Finds task → Confirms → Deletes | "Removed [task] from your list." | None |
| "What do I have today?" | `query_tasks` | Fetches today's tasks | "You have [X] tasks today. Top priority is [task]." | None |
| "How am I doing?" | `query_status` | Fetches stats | "You've completed [X] tasks this week. Streak: [Y] days. [Insight]." | None |
| "What's my streak?" | `query_streak` | Fetches streak | "You're on a [X] day streak! [Encouragement]." | None |
| "Start focus" | `start_focus` | Opens focus modal | "Let's focus. Ready when you are." | Focus modal |
| "Focus on [task]" | `start_focus` | Opens focus with task selected | "Focusing on [task]. Timer starting." | Focus modal |
| "Stop" / "I'm done" | `end_focus` | Ends current focus session | "Great session! [X] minutes focused." | Closes Focus |
| "Add [X] minutes" | `extend_focus` | Adds time to timer | "Added [X] minutes. Keep going!" | Stays in Focus |
| "Nudge [name]" | `send_nudge` | Sends push to circle member | "Sent [name] an encouraging nudge!" | None |
| "I'm overwhelmed" | `conversation` | No action | **AI FUNCTION:** `generateEmpathyResponse()` + `suggestPrioritization()` | None |
| "Help me prioritize" | `conversation` | No action | **AI FUNCTION:** `analyzeTasksAndPrioritize()` - AI analyzes all tasks, suggests top 3 | None |
| [Unrecognized] | `conversation` | No action | **AI FUNCTION:** `generateConversationalResponse()` - Contextual AI chat | None |

### 1.5.8 AI Functions Reference

| Function Name | Trigger | Input | Processing | Output |
|---------------|---------|-------|------------|--------|
| `generateGreeting()` | App open, AI Home load | userId, timeOfDay | Fetches user name, task count, streak, challenges → Builds prompt → OpenAI generates | Personalized greeting string |
| `categorizeTask()` | Task title entered | title string | NLP keyword matching + ML classification | Category enum (WORK/PERSONAL/HEALTH/FINANCE/SOCIAL/OTHER) |
| `estimateDuration()` | Task creation | title, category, userId | Queries UserModel for avg duration by category → Falls back to defaults | Minutes integer |
| `suggestOptimalTime()` | Time picker opened | date, userId | Queries UserModel.peakHours → Finds free slots on date | Array of suggested times |
| `suggestPriority()` | Task creation | title, dueDate | Keyword analysis ("urgent", "ASAP", "important") + time until due | Priority enum |
| `parseNaturalLanguageTask()` | Voice command with full details | command string | OpenAI function calling to extract structured data | { title, date, time, priority, category, duration } |
| `parseIntent()` | Any voice command | command string | Rule-based pattern matching → Falls back to OpenAI | Intent object with type + params |
| `executeAction()` | Intent has action | intent object, userId | Switch on action type → Call appropriate service | Action result |
| `generateResponse()` | After action or for conversation | context, actionResult | Builds prompt with user context + unlocks → OpenAI generates | Response string |
| `calculatePeakHours()` | Nightly batch job (3 AM) | 30 days of UserEvents | Clusters completion times → Finds hours with highest completion rate | Array of peak hours (0-23) |
| `detectOverwhelmThreshold()` | Nightly batch job | 30 days of UserEvents | Correlates task count with completion rate drop | Threshold integer |
| `checkUnlockEligibility()` | After events logged | userId, eventCounts | Checks days since signup + milestone counts | Array of newly eligible features |
| `generateInsight()` | Profile view, unlocked feature | feature type, UserModel | Builds insight-specific prompt → OpenAI generates explanation | Insight object with title + description + data |

### 1.5.9 Navigation Flow Diagram

```
                              ┌─────────────────┐
                              │   SPLASH SCREEN │
                              │    (0.5s auto)  │
                              └────────┬────────┘
                                       │
                                       ▼
                  ┌────────────────────────────────────────┐
                  │                                        │
    ┌─────────────┤           AI HOME (Center)             ├─────────────┐
    │  Swipe LEFT │                                        │ Swipe RIGHT │
    │             │    Tap Orb → Voice/Text Input          │             │
    │             │    Tap Focus → Focus Modal             │             │
    │             │    Tap + Task → Task Creation          │             │
    │             │    Swipe UP → Focus Modal              │             │
    │             │    Swipe DOWN → Profile View           │             │
    │             │                                        │             │
    │             └──────────────────┬─────────────────────┘             │
    │                                │ Swipe DOWN                        │
    ▼                                ▼                                   ▼
┌───────────┐               ┌────────────────┐               ┌───────────┐
│   TASKS   │               │    PROFILE     │               │  SOCIAL   │
│   VIEW    │               │     VIEW       │               │   VIEW    │
├───────────┤               ├────────────────┤               ├───────────┤
│ Swipe →   │               │ Swipe UP       │               │ Swipe ←   │
│ = AI Home │               │ = AI Home      │               │ = AI Home │
│           │               │                │               │           │
│ Tap Task  │               │ Tap Streak     │               │ Tap Circle│
│ = Detail  │               │ = Streak Modal │               │ = Circle  │
│           │               │                │               │   Home    │
│ Tap FAB   │               │ Tap Unlock     │               │           │
│ = Create  │               │ = Unlock List  │               │ Tap Chal. │
│   Task    │               │                │               │ = Chal.   │
└─────┬─────┘               │ Tap Settings   │               │   Detail  │
      │                     │ = Settings     │               └─────┬─────┘
      │                     └────────────────┘                     │
      ▼                                                            ▼
┌───────────────┐                                      ┌───────────────────┐
│  TASK DETAIL  │                                      │    CIRCLE HOME    │
├───────────────┤                                      ├───────────────────┤
│ Edit fields   │                                      │ See members       │
│ Start focus   │                                      │ See activity      │
│ Delete task   │                                      │ Invite members    │
│ ← Back        │                                      │ Nudge members     │
└───────────────┘                                      │ ← Back            │
                                                       └───────────────────┘

                    ┌─────────────────────────────┐
                    │       FOCUS SESSION         │
                    │        (Modal)              │
                    ├─────────────────────────────┤
                    │ Timer countdown             │
                    │ AI encouragement            │
                    │ Pause/Resume/End            │
                    │ Voice commands active       │
                    │ Swipe down = dismiss        │
                    └─────────────────────────────┘

                    ┌─────────────────────────────┐
                    │    UNLOCK CELEBRATION       │
                    │        (Modal)              │
                    ├─────────────────────────────┤
                    │ Confetti animation          │
                    │ Feature icon + name         │
                    │ AI explanation              │
                    │ "Awesome!" dismisses        │
                    └─────────────────────────────┘
```

### 1.5.10 Screen Entry Points

| Screen | How User Gets There | What Loads | What AI Does |
|--------|---------------------|------------|--------------|
| **AI Home** | App open, back navigation from any view | Greeting, orb, context cards, quick actions | Generates greeting, prepares context |
| **Tasks View** | Swipe left from AI Home | Task list with filters, mini orb | Sorts tasks by priority + peak hours |
| **Social View** | Swipe right from AI Home | Circles list, challenges, activity feed | Generates activity summary |
| **Profile View** | Swipe down from AI Home | Stats, unlocks, insights, settings | Prepares personalized insights |
| **Focus Session** | Swipe up from AI Home, tap Focus button, voice command | Timer, orb (focused state), task label | Selects/suggests task, provides encouragement |
| **Task Detail** | Tap task from Tasks View | Task info, edit fields, actions | Shows task-specific insights if unlocked |
| **Task Creation** | Tap FAB, voice "add task" | Empty form with AI suggestions | Real-time categorization, duration estimation |
| **Circle Home** | Tap circle from Social View | Members, activity, challenges | Generates circle-specific insights |
| **Challenge Detail** | Tap challenge from Social View | Standings, rules, progress | Shows position prediction |
| **Settings** | Tap gear from Profile View | App settings, notification preferences | None |
| **Unlock List** | Tap unlock card from Profile | All features with progress | Explains each feature's benefit |

### 1.5.11 Error States & Recovery

| Error Scenario | User Sees | Recovery Action | AI Involvement |
|----------------|-----------|-----------------|----------------|
| **Network offline** | "You're offline. Changes will sync when connected." | Local storage saves actions → Syncs on reconnect | AI uses cached responses, indicates "offline mode" |
| **Voice recognition fails** | "I didn't catch that. Try again or type instead." | Orb resets to idle → Text input highlighted | AI apologizes naturally: "Sorry, could you say that again?" |
| **AI service timeout** | Orb shows brief error state → Falls back to local | Local intent parsing for basic commands | Canned responses for common commands |
| **Task creation fails** | "Couldn't save task. Tap to retry." | Task saved locally → Retry button shown | None |
| **Auth token expired** | Seamless refresh in background OR login screen | Auto-refresh → If fails, smooth re-auth | None |
| **Unlock check fails** | Silent failure → Retries next app open | Background retry | None |

### 1.5.12 Haptic Feedback Reference

| Interaction | Haptic Type | iOS Equivalent | When |
|-------------|-------------|----------------|------|
| Tap orb | Medium impact | `UIImpactFeedbackGenerator(.medium)` | On touch down |
| Complete task | Success | `UINotificationFeedbackGenerator(.success)` | On completion |
| Delete task | Warning | `UINotificationFeedbackGenerator(.warning)` | On confirmation |
| Button press | Light impact | `UIImpactFeedbackGenerator(.light)` | On touch down |
| Swipe threshold reached | Medium impact | `UIImpactFeedbackGenerator(.medium)` | When past threshold |
| Error | Error | `UINotificationFeedbackGenerator(.error)` | On error |
| Focus complete | Success | `UINotificationFeedbackGenerator(.success)` | Timer reaches 0 |
| Unlock earned | Success + Heavy | Sequence: success then heavy impact | On unlock modal show |

```
┌─────────────────────────────────────────────┐
│                                             │
│              ┌───────────┐                 │
│              │   Mylo    │                 │
│              │   ORB     │                 │
│              └───────────┘                 │
│                                             │
│     "Good morning! What's on your mind?"   │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ Type a task or question...    🎤  │    │
│  └────────────────────────────────────┘    │
│                                             │
│         Tap 🎤 to speak instead            │
│                                             │
└─────────────────────────────────────────────┘
```

**Key Principle:** The text field is always visible below the orb. Mic icon inside field toggles to voice. No hidden menus, no "fallback" feeling.

### The Mental Model

```
                    ┌─────────────┐
                    │   PROFILE   │
                    │  (swipe ↓)  │
                    └─────────────┘
                          ↑
                          │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SOCIAL    │ ←── │     AI      │ ──→ │    DATA     │
│  (swipe →)  │     │   (HOME)    │     │  (swipe ←)  │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ↓
                    ┌─────────────┐
                    │   FOCUS     │
                    │  (swipe ↑)  │
                    └─────────────┘
```

**User always knows:**
- Swipe LEFT → My tasks/data
- Swipe RIGHT → My people
- Swipe UP → Start focus mode
- Swipe DOWN → My profile/settings
- TAP ORB → Talk to Mylo

---

## 2. The Gesture Model

### Why No Tab Bar?

| Tab Bar | Gesture-Based |
|---------|---------------|
| 5 buttons competing for attention | AI orb is the only focus |
| "Which tab do I need?" | "I'll just tell Mylo" |
| AI feels like a feature | AI feels like the interface |
| Conventional, forgettable | Distinctive, memorable |
| Requires thumb reach | Natural swipe motions |

### The Gesture Map

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         SWIPE DOWN                              │
│                         ┌───────┐                              │
│                         │Profile│                              │
│                         │Stats  │                              │
│                         │Settings                              │
│                         └───────┘                              │
│                              ↑                                  │
│                              │                                  │
│   SWIPE RIGHT          ┌─────────────┐          SWIPE LEFT     │
│   ┌───────┐            │             │          ┌───────┐      │
│   │Circles│ ←───────── │   AI HOME   │ ─────────→│ Tasks │      │
│   │Social │            │             │          │ Data  │      │
│   │Friends│            │  ┌─────┐    │          │ Plan  │      │
│   └───────┘            │  │ ORB │    │          └───────┘      │
│                        │  └─────┘    │                         │
│                        │             │                         │
│                        └─────────────┘                         │
│                              │                                  │
│                              ↓                                  │
│                         SWIPE UP                                │
│                         ┌───────┐                              │
│                         │ Focus │                              │
│                         │ Mode  │                              │
│                         └───────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Gesture Feedback

| Gesture | Haptic | Visual | Audio |
|---------|--------|--------|-------|
| Start swipe | Light tap | Screen peeks | None |
| Complete swipe | Medium tap | Screen slides | Soft whoosh |
| Tap orb | Heavy tap | Orb pulses | Listening chime |
| Orb responds | Light tap | Orb animates | AI speaks |

---

## 3. Screen Architecture

### Total: 10 Screens (down from 21)

```
┌─────────────────────────────────────────────────────────────────┐
│                         SCREEN MAP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CORE SCREENS (4)                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │   AI    │ │  Tasks  │ │ Social  │ │ Profile │              │
│  │  Home   │ │  View   │ │  View   │ │  View   │              │
│  │(center) │ │(swipe ←)│ │(swipe →)│ │(swipe ↓)│              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                 │
│  MODAL SCREENS (6)                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│  │  Focus  │ │  Task   │ │ Circle  │                          │
│  │ Session │ │ Detail  │ │  Home   │                          │
│  │(swipe ↑)│ │(tap task)│(tap circle)                         │
│  └─────────┘ └─────────┘ └─────────┘                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│  │Challenge│ │Settings │ │ Unlock  │                          │
│  │ Detail  │ │  Full   │ │ Modal   │                          │
│  │(tap chal)│(from prof)│(auto)    │                          │
│  └─────────┘ └─────────┘ └─────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Screen Details

| # | Screen | Access | Purpose | AI Present? |
|---|--------|--------|---------|-------------|
| 1 | **AI Home** | Default/center | Voice interface + context cards | ★ Primary |
| 2 | **Tasks View** | Swipe left | All tasks, calendar, planning | Mini orb |
| 3 | **Social View** | Swipe right | Circles, challenges, friends | Mini orb |
| 4 | **Profile View** | Swipe down | Stats, level, streaks, settings | Insights |
| 5 | **Focus Session** | Swipe up / voice | Active timer, current task | Voice control |
| 6 | **Task Detail** | Tap task | Edit single task | AI suggestions |
| 7 | **Circle Home** | Tap circle | Circle members, activity | AI summary |
| 8 | **Challenge Detail** | Tap challenge | Standings, proof | AI commentary |
| 9 | **Settings** | From profile | App configuration | None |
| 10 | **Unlock Modal** | Auto (milestones) | New feature revealed | AI explains |

---

## 4. Navigation & Gestures

### AI Home (Center)

```
┌─────────────────────────────────────────────┐
│                                             │
│  ← Tasks                        Social →   │
│                                             │
│                                             │
│              ┌───────────┐                 │
│              │           │                 │
│              │   Mylo    │                 │
│              │   ORB     │                 │
│              │           │                 │
│              └───────────┘                 │
│                                             │
│     "Morning! You have 3 tasks today.      │
│      Want to start with the report?"       │
│                                             │
│              [🎤 Tap to talk]              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ CONTEXT CARDS (scrollable)          │   │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐│   │
│  │ │Today: 3 │ │🔥 Streak│ │Challenge││   │
│  │ │ tasks   │ │  7 days │ │ 2nd     ││   │
│  │ └─────────┘ └─────────┘ └─────────┘│   │
│  └─────────────────────────────────────┘   │
│                                             │
│             ↑ Swipe up: Focus              │
│                                             │
│           Profile ↓                         │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **Tap orb** → Voice mode activates, AI listens
- **Tap context card** → Expands or navigates
- **Swipe left** → Tasks view slides in
- **Swipe right** → Social view slides in
- **Swipe up** → Focus mode (if task selected, uses that task)
- **Swipe down** → Profile view slides in

### Tasks View (Swipe Left)

```
┌─────────────────────────────────────────────┐
│  ←                               [●] [+]   │
│  Tasks                           orb  add   │
│ ─────────────────────────────────────────── │
│                                             │
│  TODAY (Mon, Feb 2)                         │
│  ┌─────────────────────────────────────┐   │
│  │ ○ Finish quarterly report    45m  H │   │
│  │ ○ Call dentist               5m   L │   │
│  │ ○ Team meeting               30m  M │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  TOMORROW                                   │
│  ┌─────────────────────────────────────┐   │
│  │ ○ Gym                        60m  M │   │
│  │ ○ Review Sarah's doc         15m  L │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  THIS WEEK                                  │
│  ┌─────────────────────────────────────┐   │
│  │ ○ Submit expenses            10m  L │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ─────────────────────────────────────────  │
│  🔒 Completed (tap to show)                │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **Swipe right** → Back to AI Home
- **Tap mini orb** → Voice mode (can add task by voice)
- **Tap +** → Quick add task
- **Tap task** → Task detail modal
- **Long press task** → Quick actions (complete, defer, delete)
- **Swipe task left** → Complete
- **Swipe task right** → Defer to tomorrow

### Social View (Swipe Right)

```
┌─────────────────────────────────────────────┐
│  [●] [+]                               →   │
│  orb  add                          Social   │
│ ─────────────────────────────────────────── │
│                                             │
│  AI SUMMARY                                 │
│  "Work circle is active. Family quiet."    │
│                                             │
│ ─────────────────────────────────────────── │
│  ACTIVE CHALLENGES                          │
│  ┌─────────────────────────────────────┐   │
│  │ 🏃 7-Day Workout           2nd/5   │   │
│  │     3 days left • Sarah leads       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  CIRCLES                                    │
│  ┌─────────────────────────────────────┐   │
│  │ 💼 Work Circle          3 online   │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 👨‍👩‍👧 Family Circle        Quiet     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  RECENT ACTIVITY                            │
│  Sarah completed "Q4 Report" • 5m ago      │
│  Mike started focus mode • 12m ago         │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **Swipe left** → Back to AI Home
- **Tap challenge** → Challenge detail
- **Tap circle** → Circle home
- **Tap +** → Create circle or start challenge
- **Tap activity** → View that person's profile

### Profile View (Swipe Down)

```
┌─────────────────────────────────────────────┐
│                                             │
│  Profile                               ↓   │
│                                             │
│        ┌──────────┐                        │
│        │  Avatar  │                        │
│        └──────────┘                        │
│          @alice                            │
│      Level 12 • 7-day streak               │
│                                             │
│ ─────────────────────────────────────────── │
│  AI INSIGHT                                 │
│  ┌─────────────────────────────────────┐   │
│  │ "You're most productive 9-11am.     │   │
│  │  85% completion rate this week.     │   │
│  │  Focus sessions up 20% vs last wk." │   │
│  └─────────────────────────────────────┘   │
│                                             │
│ ─────────────────────────────────────────── │
│  STATS                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │  XP    │ │ Tasks  │ │ Focus  │         │
│  │ 4,230  │ │  127   │ │ 42hrs  │         │
│  └────────┘ └────────┘ └────────┘         │
│                                             │
│ ─────────────────────────────────────────── │
│  🔓 UNLOCKED FEATURES                       │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │Patterns│ │Priority│ │Predict │ 🔒      │
│  └────────┘ └────────┘ └────────┘         │
│                                             │
│  [Settings]  [Help]  [Logout]              │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **Swipe up** → Back to AI Home
- **Tap stat** → Detailed breakdown
- **Tap locked feature** → Shows unlock requirements
- **Tap Settings** → Settings screen

### Focus Session (Swipe Up)

```
┌─────────────────────────────────────────────┐
│                                             │
│                   ╳                         │
│                                             │
│                                             │
│              ┌───────────┐                 │
│              │           │                 │
│              │   23:45   │                 │
│              │           │                 │
│              └───────────┘                 │
│                                             │
│        "Finishing quarterly report"         │
│                                             │
│              [🎤 Tap to talk]              │
│                                             │
│     "You've been focused for 6 minutes.    │
│      Keep going—you usually hit flow       │
│      at the 10 minute mark."               │
│                                             │
│                                             │
│                                             │
│                                             │
│         [Pause]       [End Session]        │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**Voice commands while focusing:**
- "How long have I been going?" → AI tells you
- "Add 10 minutes" → Extends timer
- "I'm done" → Ends session, logs time
- "What's next?" → AI tells you next task

---

## 5. AI Integration

### AI is Always Present

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI PRESENCE BY SCREEN                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AI HOME                                                        │
│  └─ Full orb, speaking, animated                               │
│  └─ AI initiates conversation                                  │
│  └─ Context cards generated by AI                              │
│                                                                 │
│  TASKS VIEW                                                     │
│  └─ Mini orb in corner (tap to talk)                          │
│  └─ AI sorted task order                                       │
│  └─ AI suggests priorities on hover                            │
│                                                                 │
│  SOCIAL VIEW                                                    │
│  └─ Mini orb in corner                                         │
│  └─ AI summary of activity                                     │
│  └─ AI suggests nudges/challenges                              │
│                                                                 │
│  PROFILE VIEW                                                   │
│  └─ AI insight card                                            │
│  └─ AI explains locked features                                │
│                                                                 │
│  FOCUS SESSION                                                  │
│  └─ Voice control only (no visual orb)                        │
│  └─ AI encouragement at milestones                             │
│  └─ AI announces completion                                    │
│                                                                 │
│  MODALS (Task, Circle, Challenge)                               │
│  └─ AI suggestions contextual to content                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What AI Does On Each Screen

| Screen | AI Reads | AI Says | AI Does |
|--------|----------|---------|---------|
| **AI Home** | All context | Greeting, today summary, suggestions | Routes commands, takes actions |
| **Tasks** | Task list, patterns | Nothing (unless asked) | Sorts by priority, suggests times |
| **Social** | Circle activity | Activity summary | Suggests nudges, challenges |
| **Profile** | All history | Personalized insights | Shows unlock progress |
| **Focus** | Current task, history | Encouragement | Tracks time, announces milestones |

---

## 6. Progressive Unlock System

### The Whoop Model

AI features unlock as data accumulates. This:
1. Sets expectations (AI needs to learn you)
2. Creates anticipation (what unlocks next?)
3. Builds trust (insights are earned, not fake)
4. Drives retention (come back to unlock more)

### Unlock Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│                      PROGRESSIVE UNLOCK                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DAY 1 (Immediate)                                              │
│  🔓 Voice commands (add task, complete, query)                 │
│  🔓 Basic task management                                       │
│  🔓 Focus timer                                                 │
│  🔓 Circles & challenges (join)                                │
│  🔓 Streaks & XP                                               │
│                                                                 │
│  DAY 3 (After 3 days of use)                                    │
│  🔓 AI greeting personalization                                │
│  🔓 Basic activity summary                                      │
│                                                                 │
│  DAY 7 (After 1 week)                                           │
│  🔓 Peak hours insight                                         │
│  🔓 AI task sorting by time                                    │
│  🔓 Weekly comparison                                           │
│                                                                 │
│  DAY 14 (After 2 weeks)                                         │
│  🔓 Completion rate patterns                                   │
│  🔓 Duration estimation                                        │
│  🔓 Category insights                                          │
│                                                                 │
│  DAY 30 (After 1 month)                                         │
│  🔓 Full predictive mode                                       │
│  🔓 "You'll struggle with X today"                            │
│  🔓 Proactive overwhelm detection                              │
│  🔓 Social correlation insights                                │
│                                                                 │
│  DAY 60+ (Power user)                                           │
│  🔓 Deep pattern analysis                                      │
│  🔓 Habit formation tracking                                   │
│  🔓 Long-term trend insights                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Unlock UI

#### Locked Feature (Before)
```
┌─────────────────────────────────────────────┐
│  🔒 PEAK HOURS INSIGHT                      │
│                                             │
│  "I'm still learning when you work best.   │
│   Use Mylo for 4 more days to unlock."     │
│                                             │
│  ████████░░░░░░░░ 3/7 days                 │
│                                             │
└─────────────────────────────────────────────┘
```

#### Unlock Celebration
```
┌─────────────────────────────────────────────┐
│                                             │
│           ✨ NEW INSIGHT UNLOCKED ✨        │
│                                             │
│         ┌───────────────────────┐          │
│         │       AI ORB          │          │
│         │    (celebrating)      │          │
│         └───────────────────────┘          │
│                                             │
│  "After 7 days, I've learned something:    │
│                                             │
│   You're most productive 9-11am.           │
│   I'll prioritize important tasks then."   │
│                                             │
│              [Awesome!]                     │
│                                             │
└─────────────────────────────────────────────┘
```

#### Unlocked Feature (After)
```
┌─────────────────────────────────────────────┐
│  🔓 PEAK HOURS                              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Your peak: 9am - 11am              │   │
│  │  ████████████░░░░░░░░               │   │
│  │  6am      12pm      6pm     12am    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  "Tasks scheduled during peak hours have   │
│   90% completion vs 65% at other times."   │
│                                             │
└─────────────────────────────────────────────┘
```

### Hybrid Unlock System (Time OR Milestones)

**Problem:** Paying users frustrated waiting 30 days for features they paid for.

**Solution:** Every feature can unlock via TIME or MILESTONES — whichever comes first.

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID UNLOCK SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Each feature has TWO paths to unlock:                          │
│                                                                 │
│  🔓 Peak Hours Insight                                         │
│  ├─ Path A: Use Mylo for 7 days                               │
│  └─ Path B: Complete 10 tasks (any timeframe)                 │
│  → Unlocks when EITHER condition is met                        │
│                                                                 │
│  🔓 Duration Estimation                                        │
│  ├─ Path A: Use Mylo for 14 days                              │
│  └─ Path B: Complete 20 focus sessions                        │
│                                                                 │
│  🔓 Predictive Mode                                            │
│  ├─ Path A: Use Mylo for 30 days                              │
│  └─ Path B: Complete 50 tasks + 10 focus sessions             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**UI: Dual Progress Indicator**

```
┌─────────────────────────────────────────────┐
│  🔒 PEAK HOURS INSIGHT                      │
│                                             │
│  Unlock via time:                           │
│  ████████░░░░░░░░ 5/7 days                 │
│                                             │
│  — OR —                                     │
│                                             │
│  Unlock via activity:                       │
│  ██████████████░░ 8/10 tasks               │
│                                             │
│  "2 more days OR 2 more tasks to unlock"   │
│                                             │
└─────────────────────────────────────────────┘
```

**Why This Works:**
- Engaged users unlock faster (reward behavior)
- Patient users still unlock over time (no punishment)
- "I paid for this" concern addressed
- Maintains learning narrative (AI still needs data)

### Data Requirements Per Feature

| Feature | Days | OR Milestones | Algorithm |
|---------|------|---------------|-----------|
| Greeting personalization | 3 days | 5 app opens | Time-of-day + name |
| Peak hours | 7 days | 10 completions | Hour clustering |
| Task sorting | 7 days | 15 tasks created | Priority + time correlation |
| Duration estimation | 14 days | 20 focus sessions | Category → duration avg |
| Completion patterns | 14 days | 30 tasks | Priority → completion rate |
| Predictive mode | 30 days | 50 tasks + 10 focus | Full behavior model |
| Overwhelm detection | 30 days | 5 high-load days | Task count → completion drop |

---

## 7. AI Learning Model

### What AI Learns

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER BEHAVIOR MODEL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEMPORAL PATTERNS (Unlock: Day 7)                              │
│  ├─ Peak productivity hours                                    │
│  ├─ Best day of week                                           │
│  ├─ Average session duration                                   │
│  ├─ Time between task creation and completion                  │
│  └─ When they typically open the app                           │
│                                                                 │
│  TASK PATTERNS (Unlock: Day 14)                                 │
│  ├─ Categories they use most                                   │
│  ├─ Average task duration (actual vs estimated)                │
│  ├─ Completion rate by priority                                │
│  ├─ Tasks they defer most                                      │
│  ├─ Tasks they complete fastest                                │
│  └─ Common task language/keywords                              │
│                                                                 │
│  SOCIAL PATTERNS (Unlock: Day 14)                               │
│  ├─ Circles most engaged with                                  │
│  ├─ Response to social pressure (does seeing others help?)     │
│  ├─ Challenge participation rate                               │
│  └─ Who motivates them most                                    │
│                                                                 │
│  PSYCHOLOGICAL PATTERNS (Unlock: Day 30)                        │
│  ├─ Streak sensitivity (do they protect streaks?)             │
│  ├─ XP motivation (does gamification work for them?)          │
│  ├─ Overwhelm threshold (how many tasks = stress?)            │
│  └─ Preferred AI tone (encouraging vs. direct)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### How AI Learns

#### Passive Data Collection

Every interaction is logged (user never sees this):

```typescript
interface UserEvent {
  type: 'task_created' | 'task_completed' | 'task_deferred' | 
        'app_opened' | 'voice_command' | 'focus_started' | 
        'focus_completed' | 'challenge_joined' | 'circle_viewed' |
        'swipe_to_tasks' | 'swipe_to_social' | 'orb_tapped';
  timestamp: Date;
  metadata: {
    taskId?: string;
    duration?: number;
    dayOfWeek: number;      // 0-6
    hourOfDay: number;      // 0-23
    completionTime?: number; // ms from creation to completion
    source: 'voice' | 'manual' | 'ai_suggested';
    screen: 'ai_home' | 'tasks' | 'social' | 'profile' | 'focus';
  };
}
```

#### Nightly Processing

```typescript
// Cron job: 3am daily
async function updateUserModels() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    const events = await getEvents(user.id, 30); // Last 30 days
    const daysSinceSignup = getDaysSince(user.createdAt);
    
    const model: UserModel = {
      // Always calculated
      totalTasks: countEvents(events, 'task_created'),
      totalCompleted: countEvents(events, 'task_completed'),
      totalFocusMinutes: sumFocusTime(events),
      
      // Unlock at Day 7
      peakHours: daysSinceSignup >= 7 ? calculatePeakHours(events) : null,
      bestDayOfWeek: daysSinceSignup >= 7 ? calculateBestDay(events) : null,
      
      // Unlock at Day 14
      completionRates: daysSinceSignup >= 14 ? calculateByPriority(events) : null,
      avgTaskDuration: daysSinceSignup >= 14 ? calculateAvgDuration(events) : null,
      commonCategories: daysSinceSignup >= 14 ? extractCategories(events) : null,
      
      // Unlock at Day 30
      overwhelmThreshold: daysSinceSignup >= 30 ? detectOverwhelmThreshold(events) : null,
      procrastinationPatterns: daysSinceSignup >= 30 ? findDeferralPatterns(events) : null,
      socialMotivation: daysSinceSignup >= 30 ? calculateSocialImpact(events) : null,
      
      lastUpdated: new Date(),
    };
    
    await prisma.userModel.upsert({
      where: { userId: user.id },
      update: model,
      create: { userId: user.id, ...model },
    });
    
    // Check for new unlocks
    await checkAndTriggerUnlocks(user.id, daysSinceSignup, model);
  }
}
```

#### Real-Time Context

```typescript
// Called when generating AI message
async function gatherContext(userId: string): Promise<AIContext> {
  const [user, model, tasks, circles, challenges] = await Promise.all([
    getUser(userId),
    getUserModel(userId),
    getTodaysTasks(userId),
    getUserCircles(userId),
    getActiveChallenge(userId),
  ]);
  
  return {
    user: {
      name: user.name,
      level: user.level,
      streak: user.streakCount,
      daysSinceSignup: getDaysSince(user.createdAt),
    },
    model: {
      // Only include unlocked features
      peakHours: model.peakHours, // null if not unlocked
      completionRates: model.completionRates,
      overwhelmThreshold: model.overwhelmThreshold,
    },
    today: {
      tasks: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      focusMinutes: await getTodayFocusTime(userId),
    },
    social: {
      activeChallenge: challenges[0]?.name,
      challengePosition: challenges[0]?.userPosition,
      circleActivity: await getRecentCircleActivity(userId),
    },
    time: {
      hour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      isWeekend: [0, 6].includes(new Date().getDay()),
    },
  };
}
```

### AI Prompt Engineering

#### System Prompt (Evolves with Unlocks)

```typescript
function buildSystemPrompt(user: User, model: UserModel, unlocks: string[]): string {
  let prompt = `You are Mylo, a personal productivity AI. You are:
- Warm but not cheesy
- Direct but not cold
- Encouraging but not fake
- Smart but not condescending

You speak conversationally, like a helpful friend who knows them well.

User: ${user.name}
Level: ${user.level}
Streak: ${user.streakCount} days
Days using Mylo: ${getDaysSince(user.createdAt)}
`;

  // Add unlocked insights to prompt
  if (unlocks.includes('peak_hours') && model.peakHours) {
    prompt += `\nPeak hours: ${model.peakHours.join(', ')}. Reference this naturally.`;
  }
  
  if (unlocks.includes('completion_patterns') && model.completionRates) {
    prompt += `\nCompletion rates: HIGH=${model.completionRates.HIGH}%, MED=${model.completionRates.MEDIUM}%, LOW=${model.completionRates.LOW}%.`;
  }
  
  if (unlocks.includes('overwhelm_detection') && model.overwhelmThreshold) {
    prompt += `\nOverwhelm threshold: ${model.overwhelmThreshold} tasks. If they have more, be extra supportive.`;
  }
  
  return prompt;
}
```

#### Context Prompt (Per Request)

```typescript
function buildContextPrompt(screen: string, context: AIContext): string {
  const hour = context.time.hour;
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  
  return `Current context:
- Screen: ${screen}
- Time: ${timeOfDay} (${hour}:00)
- Today's tasks: ${context.today.tasks} (${context.today.completed} done)
- Focus today: ${context.today.focusMinutes} minutes
${context.social.activeChallenge ? `- Active challenge: ${context.social.activeChallenge} (position: ${context.social.challengePosition})` : ''}

Generate a ${screen === 'ai_home' ? 'greeting and suggestion' : 'helpful response'} for this context.
Keep it under 50 words. Be specific, not generic.`;
}
```

---

## 8. Data Architecture

### Database Schema (Updated for Gestures + Unlocks)

```prisma
// User's learned model
model UserModel {
  id                    String    @id @default(uuid())
  userId                String    @unique
  
  // Basic stats (always available)
  totalTasks            Int       @default(0)
  totalCompleted        Int       @default(0)
  totalFocusMinutes     Int       @default(0)
  
  // Temporal patterns (Day 7+)
  peakHours             Int[]     // [9, 10, 11] = 9am-11am
  bestDayOfWeek         Int?      // 0-6
  avgSessionMinutes     Int?
  
  // Task patterns (Day 14+)
  avgTaskDuration       Int?      // minutes
  completionRates       Json?     // { HIGH: 0.9, MEDIUM: 0.7, LOW: 0.5 }
  commonCategories      String[]
  
  // Advanced patterns (Day 30+)
  overwhelmThreshold    Int?      // task count before completion drops
  procrastinationPatterns Json?   // { category: deferralRate }
  socialMotivation      Float?    // 0-1, how much social features help
  
  lastUpdated           DateTime  @updatedAt
  
  user                  User      @relation(fields: [userId], references: [id])
}

// Feature unlocks
model UserUnlock {
  id          String   @id @default(uuid())
  userId      String
  feature     String   // 'peak_hours', 'task_sorting', 'overwhelm_detection'
  unlockedAt  DateTime @default(now())
  seenByUser  Boolean  @default(false)
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, feature])
}

// Event log for learning
model UserEvent {
  id          String   @id @default(uuid())
  userId      String
  type        String
  screen      String   // 'ai_home', 'tasks', 'social', 'profile', 'focus'
  timestamp   DateTime @default(now())
  metadata    Json
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId, timestamp])
  @@index([userId, type])
}

// Conversation history (for context)
model Conversation {
  id          String   @id @default(uuid())
  userId      String
  messages    Json     // [{ role: 'user' | 'assistant', content: string }]
  context     Json     // app state snapshot
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
}
```

### Unlock Definitions

```typescript
const UNLOCK_DEFINITIONS = {
  // Day 3
  personalized_greeting: {
    day: 3,
    title: 'Personalized Greetings',
    description: 'Mylo now knows your name and patterns',
    requirement: 'Use Mylo for 3 days',
  },
  
  // Day 7
  peak_hours: {
    day: 7,
    title: 'Peak Hours Insight',
    description: 'See when you\'re most productive',
    requirement: 'Complete 10+ tasks',
    minEvents: { task_completed: 10 },
  },
  ai_task_sorting: {
    day: 7,
    title: 'Smart Task Sorting',
    description: 'Tasks sorted by AI-determined priority',
    requirement: 'Use Mylo for 7 days',
  },
  weekly_comparison: {
    day: 7,
    title: 'Weekly Comparison',
    description: 'Compare this week to last week',
    requirement: 'Use Mylo for 7 days',
  },
  
  // Day 14
  duration_estimation: {
    day: 14,
    title: 'Duration Estimation',
    description: 'AI predicts how long tasks will take',
    requirement: 'Complete 10+ focus sessions',
    minEvents: { focus_completed: 10 },
  },
  completion_patterns: {
    day: 14,
    title: 'Completion Patterns',
    description: 'See which tasks you complete vs defer',
    requirement: 'Create 30+ tasks',
    minEvents: { task_created: 30 },
  },
  
  // Day 30
  predictive_mode: {
    day: 30,
    title: 'Predictive Mode',
    description: 'AI predicts what you\'ll struggle with',
    requirement: 'Use Mylo for 30 days with 50+ tasks',
    minEvents: { task_created: 50 },
  },
  overwhelm_detection: {
    day: 30,
    title: 'Overwhelm Detection',
    description: 'AI notices when you have too much',
    requirement: 'Experience 5+ high-task days',
  },
};
```

### Data Flow (Gesture-Based)

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER OPENS APP                              │
│                           ↓                                      │
│                    AI HOME (CENTER)                              │
│                           ↓                                      │
│              Log event: 'app_opened'                            │
└─────────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  User swipes  │   │  User taps    │   │  User swipes  │
│  LEFT → Tasks │   │  ORB → Voice  │   │  RIGHT →Social│
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        ↓                   ↓                   ↓
   Log: 'swipe_   Log: 'orb_tapped'    Log: 'swipe_
    to_tasks'      + 'voice_command'     to_social'
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NIGHTLY BATCH JOB                             │
│                                                                 │
│  1. Aggregate events by type                                    │
│  2. Calculate patterns (if enough data)                         │
│  3. Update UserModel                                            │
│  4. Check unlock eligibility                                    │
│  5. Queue unlock notifications                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                 NEXT AI MESSAGE GENERATION                       │
│                                                                 │
│  1. Load UserModel (with unlocked fields only)                  │
│  2. Gather current context                                      │
│  3. Build personalized prompt                                   │
│  4. Generate via OpenAI                                         │
│  5. Return to user                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8.1 Calendar Integration

### Why Calendar Sync is Essential

A "life organizer" without calendar awareness is incomplete. Users think in terms of meetings, appointments, and available time slots — not just tasks.

### Calendar Features

```
┌─────────────────────────────────────────────────────────────────┐
│                    CALENDAR INTEGRATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  READ ACCESS (Day 1)                                            │
│  ├─ Show today's events in Tasks View                          │
│  ├─ AI knows about upcoming meetings                           │
│  ├─ "You have a meeting at 3pm" context in suggestions         │
│  └─ Block time awareness for focus sessions                    │
│                                                                 │
│  AI INTEGRATION                                                 │
│  ├─ "Schedule this before your 2pm meeting"                    │
│  ├─ "You have 45 minutes free — want to focus?"               │
│  └─ "Your calendar is packed — let's prioritize"              │
│                                                                 │
│  TASKS VIEW WITH CALENDAR                                       │
│  ┌─────────────────────────────────────────────┐               │
│  │ TODAY                                       │               │
│  │ ┌─────────────────────────────────────┐    │               │
│  │ │ 📅 9:00am  Team Standup (30m)       │    │               │
│  │ └─────────────────────────────────────┘    │               │
│  │ ○ Review PR before standup        15m H   │               │
│  │ ○ Prepare meeting notes           10m M   │               │
│  │ ┌─────────────────────────────────────┐    │               │
│  │ │ 📅 2:00pm  Client Call (1hr)        │    │               │
│  │ └─────────────────────────────────────┘    │               │
│  │ ○ Send follow-up email            5m  L   │               │
│  └─────────────────────────────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Permission Flow

```typescript
// Request calendar access on first Tasks View visit
const requestCalendarAccess = async () => {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status === 'granted') {
    const calendars = await Calendar.getCalendarsAsync();
    // Store user's preferred calendars
    // Fetch today's events
  } else {
    // Show inline prompt explaining benefits
    // Never block the user — calendar is optional
  }
};
```

---

## 8.2 Recurring Tasks

### Why Recurring Tasks Matter

Daily habits, weekly reviews, monthly bills — core productivity use cases. Users will feel something is "missing" without them.

### Recurrence Model

```typescript
interface TaskRecurrence {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;           // Every X days/weeks/months
  daysOfWeek?: number[];      // For weekly: [1, 3, 5] = Mon, Wed, Fri
  dayOfMonth?: number;        // For monthly: 15 = 15th of each month
  endDate?: Date;             // Optional end date
  endAfterCount?: number;     // End after X occurrences
}

// Database schema addition
model Task {
  // ... existing fields
  
  // Recurrence fields
  isRecurring       Boolean   @default(false)
  recurrenceRule    Json?     // TaskRecurrence object
  recurrenceParentId String?  // Links to original recurring task
  
  recurrenceParent  Task?     @relation("TaskRecurrence", fields: [recurrenceParentId], references: [id])
  recurrenceChildren Task[]   @relation("TaskRecurrence")
}
```

### Voice Commands for Recurring Tasks

```
"Add task take vitamins every morning"
"Remind me to call mom every Sunday"
"Add weekly team review on Fridays"
"Pay rent on the 1st of every month"
```

### UI: Recurring Task Indicator

```
┌─────────────────────────────────────────────┐
│ ○ Take vitamins                    5m  M   │
│   🔁 Daily                                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ○ Weekly review                    30m M   │
│   🔁 Weekly · Fridays                      │
└─────────────────────────────────────────────┘
```

---

## 8.3 iOS Widgets

### Why Widgets Are Critical

Users check phones 96x/day. Widgets = constant Mylo presence without opening app. Massive retention driver.

### Widget Types

```
┌─────────────────────────────────────────────────────────────────┐
│                      iOS WIDGET SUITE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SMALL WIDGET (2x2)                                             │
│  ┌─────────────────────┐                                       │
│  │ Mylo               │                                        │
│  │                    │                                        │
│  │  3 tasks today     │                                        │
│  │  🔥 7-day streak   │                                        │
│  └─────────────────────┘                                       │
│  Tap → Opens app to AI Home                                    │
│                                                                 │
│  MEDIUM WIDGET (4x2)                                            │
│  ┌─────────────────────────────────────────┐                   │
│  │ Mylo                         🔥 7 days  │                   │
│  │ ───────────────────────────────────────│                   │
│  │ ○ Finish quarterly report        45m H │                   │
│  │ ○ Call dentist                    5m L │                   │
│  │ ○ Team meeting                   30m M │                   │
│  └─────────────────────────────────────────┘                   │
│  Tap task → Opens Task Detail                                  │
│                                                                 │
│  LOCK SCREEN WIDGET                                             │
│  ┌─────────────────────────────────────────┐                   │
│  │ 📋 Next: Finish quarterly report        │                   │
│  └─────────────────────────────────────────┘                   │
│  Tap → Quick complete or open app                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Widget Data

```typescript
// Widget data structure (shared via App Groups)
interface WidgetData {
  tasksToday: number;
  topTasks: Array<{
    id: string;
    title: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedMinutes?: number;
  }>;
  streak: {
    current: number;
    isActive: boolean;
  };
  nextTask?: {
    id: string;
    title: string;
  };
  lastUpdated: Date;
}

// Update widget data on task changes
const updateWidgetData = async () => {
  const data: WidgetData = {
    tasksToday: await getTaskCountForToday(),
    topTasks: await getTopTasksForToday(3),
    streak: await getCurrentStreak(),
    nextTask: await getNextTask(),
    lastUpdated: new Date(),
  };
  
  // Write to App Group shared container
  await SharedGroupPreferences.setItem('widget_data', JSON.stringify(data));
  
  // Trigger widget refresh
  WidgetKit.reloadAllTimelines();
};
```

---

## 8.4 Quick Capture

### Why Quick Capture Matters

Opening app → waiting for load → tapping orb → speaking = too many steps for quick thoughts.

### Quick Capture Methods

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUICK CAPTURE OPTIONS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SIRI SHORTCUT                                               │
│     "Hey Siri, add to Mylo: buy milk"                          │
│     → Creates task without opening app                         │
│     → Confirmation haptic + brief notification                 │
│                                                                 │
│  2. SHARE EXTENSION                                             │
│     Safari article → Share → Mylo                              │
│     → Creates task: "Read: [Article Title]"                    │
│     → Attaches URL to task notes                               │
│                                                                 │
│  3. 3D TOUCH / HAPTIC TOUCH MENU                               │
│     Long-press app icon →                                      │
│     ├─ Quick Add Task                                          │
│     ├─ Start Focus                                             │
│     └─ View Today's Tasks                                      │
│                                                                 │
│  4. SPOTLIGHT SEARCH                                            │
│     Search "Mylo meeting notes"                                │
│     → Shows matching tasks                                     │
│     → Tap to open task detail                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Siri Shortcut Setup

```swift
// AppIntents for Siri Shortcuts (iOS 16+)
struct AddTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Add Task to Mylo"
    
    @Parameter(title: "Task")
    var taskTitle: String
    
    @Parameter(title: "Priority", default: .medium)
    var priority: TaskPriority
    
    func perform() async throws -> some IntentResult {
        let task = try await TaskService.shared.createTask(
            title: taskTitle,
            priority: priority,
            source: .siri
        )
        
        return .result(dialog: "Added '\(task.title)' to Mylo")
    }
}
```

---

## 8.5 Daily Brief Notifications

### Why Push Notifications Matter

Users forget to open the app. A well-timed notification brings them back without being annoying.

### Notification Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                  NOTIFICATION SCHEDULE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MORNING BRIEF (User's wake time, e.g., 7:30am)                │
│  "Good morning! You have 4 tasks today.                        │
│   Your best focus time is 9-11am. Ready?"                      │
│   [View Tasks] [Start Focus]                                   │
│                                                                 │
│  EVENING SUMMARY (6:00pm or after last task)                   │
│  "Great work! You completed 5 of 6 tasks today. 🎉            │
│   Tomorrow you have 3 waiting."                                │
│   [See Summary] [Plan Tomorrow]                                │
│                                                                 │
│  STREAK REMINDER (If at risk, 8:00pm)                          │
│  "Don't lose your 7-day streak! Complete 1 task to keep it."  │
│   [Quick Complete]                                             │
│                                                                 │
│  SMART NUDGES (Contextual)                                     │
│  ├─ Overdue task: "Your 'Call dentist' was due 2 days ago"    │
│  ├─ Free time: "You have 30 min before your meeting"          │
│  └─ Circle activity: "Sarah just completed a challenge task"  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Notification Preferences

```typescript
interface NotificationPreferences {
  morningBrief: {
    enabled: boolean;
    time: string;  // "07:30"
  };
  eveningSummary: {
    enabled: boolean;
    time: string;  // "18:00"
  };
  streakReminders: boolean;
  overdueReminders: boolean;
  circleActivity: boolean;
  
  // AI-learned preferences (auto-adjusted)
  quietHours: {
    start: string;  // "22:00"
    end: string;    // "08:00"
  };
}
```

---

## 8.6 Gesture Onboarding

### Why Interactive Onboarding is Essential

Gesture navigation is unfamiliar. Users won't discover it naturally. First 60 seconds must teach the core interactions.

### Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONBOARDING SEQUENCE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCREEN 1: WELCOME                                              │
│  "Meet Mylo — your AI life organizer"                          │
│  [Next]                                                         │
│                                                                 │
│  SCREEN 2: VOICE (Interactive)                                  │
│  "Tap the orb to talk to Mylo"                                 │
│  ┌─────────────────────┐                                       │
│  │    [Glowing Orb]    │  ← User must tap                      │
│  └─────────────────────┘                                       │
│  AI: "Hi! I'm Mylo. Try saying 'add task buy groceries'"      │
│                                                                 │
│  SCREEN 3: TEXT INPUT (Interactive)                            │
│  "Or type if you prefer"                                       │
│  ┌─────────────────────────────────────┐                       │
│  │ Type something...              🎤  │  ← User must type     │
│  └─────────────────────────────────────┘                       │
│                                                                 │
│  SCREEN 4: GESTURES (Interactive)                               │
│  "Swipe to navigate"                                           │
│  ← Swipe left to see your tasks                                │
│  [Animated hand showing swipe]                                 │
│  User must complete swipe to continue                          │
│                                                                 │
│  SCREEN 5: MORE GESTURES                                        │
│  "Swipe right for social, up for focus"                        │
│  Practice area with haptic feedback                            │
│                                                                 │
│  SCREEN 6: COMPLETE                                             │
│  "You're ready! Mylo learns as you use it."                    │
│  [Get Started]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Persistent Hints (First 3 Days)

```
After onboarding, show subtle hints:

DAY 1-3 HINTS (fade out after 3 seconds):
┌─────────────────────────────────────────────┐
│                                             │
│  ← Swipe for tasks                          │
│                                             │
│              [AI ORB]                       │
│                                             │
│                          Swipe for social → │
│                                             │
│            ↑ Swipe up: Focus                │
│                                             │
└─────────────────────────────────────────────┘

After Day 3: Hints hidden (user has learned)
Can be re-enabled in Settings
```

---

## 8.7 AI Response Streaming

### Why Streaming Matters

1-2 second wait for AI response feels slow in 2026. Users expect immediate feedback.

### Streaming Implementation

```typescript
// Stream OpenAI response to show words as they generate
const streamAIResponse = async (prompt: string, onChunk: (text: string) => void) => {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });
  
  let fullResponse = '';
  
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    fullResponse += text;
    onChunk(fullResponse);  // Update UI with each chunk
  }
  
  return fullResponse;
};

// Frontend: Show response as it streams
const AIMessageBubble = ({ isStreaming, text }) => {
  return (
    <View style={styles.bubble}>
      <Text style={styles.text}>{text}</Text>
      {isStreaming && <BlinkingCursor />}
    </View>
  );
};
```

### Pre-cached Common Responses

For instant feel, cache common responses:

```typescript
const INSTANT_RESPONSES = {
  task_added: [
    "Got it! Added to your list.",
    "Done! I've added that task.",
    "Added! Want to set a time for it?",
  ],
  task_completed: [
    "Nice work! ✓",
    "Marked complete. Keep it up!",
    "Done! That's {streak} tasks today.",
  ],
  greeting_morning: [
    "Good morning! You have {count} tasks today.",
    "Morning! Ready to tackle the day?",
  ],
};

// Use cached response while full AI response loads
const getQuickResponse = (type: string, context: any) => {
  const templates = INSTANT_RESPONSES[type];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return interpolate(template, context);
};
```

---

## 8.8 Offline Voice Fallback

### Why Offline Voice Matters

Voice-first app that doesn't work offline = broken. Users in subway, airplane, poor connectivity must still use voice.

### Offline Command Parser

```typescript
// Rule-based parser for common commands when offline
const parseOfflineCommand = (command: string): ParsedIntent | null => {
  const normalized = command.toLowerCase().trim();
  
  // ADD TASK patterns
  const addPatterns = [
    /^(add|create|new)\s+(task\s+)?(.+)$/i,
    /^(.+)\s+(to my list|to do)$/i,
    /^remind me to\s+(.+)$/i,
  ];
  
  for (const pattern of addPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const title = match[3] || match[1];
      return {
        type: 'create_task',
        title: cleanTitle(title),
        priority: detectPriority(title),
        offline: true,
      };
    }
  }
  
  // COMPLETE TASK patterns
  const completePatterns = [
    /^(done|complete|finish|check off)\s+(.+)$/i,
    /^i (did|finished|completed)\s+(.+)$/i,
  ];
  
  for (const pattern of completePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        type: 'complete_task',
        searchQuery: match[2],
        offline: true,
      };
    }
  }
  
  // LIST TASKS patterns
  const listPatterns = [
    /^(what|show|list).*(tasks?|to ?do|today).*$/i,
    /^what do i have (today|to do)$/i,
  ];
  
  for (const pattern of listPatterns) {
    if (pattern.test(normalized)) {
      return {
        type: 'list_tasks',
        offline: true,
      };
    }
  }
  
  // Couldn't parse offline
  return null;
};

// Detect priority from language
const detectPriority = (text: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  const highWords = ['urgent', 'important', 'critical', 'asap', 'now', 'immediately'];
  const lowWords = ['maybe', 'someday', 'eventually', 'when i have time', 'low priority'];
  
  const lower = text.toLowerCase();
  if (highWords.some(w => lower.includes(w))) return 'HIGH';
  if (lowWords.some(w => lower.includes(w))) return 'LOW';
  return 'MEDIUM';
};
```

### Offline Mode UI

```
┌─────────────────────────────────────────────┐
│  ⚠️ Offline Mode                            │
│                                             │
│  Basic voice commands available:            │
│  • Add tasks                                │
│  • Complete tasks                           │
│  • List today's tasks                       │
│                                             │
│  AI features will sync when back online.    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 8.9 Smart Priority Detection

### Auto-Detect Priority from Language

Users hate picking priority every time. AI should infer from natural language.

```typescript
const detectTaskAttributes = (title: string): TaskAttributes => {
  const lower = title.toLowerCase();
  
  // Priority detection
  let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  
  const urgentIndicators = [
    'urgent', 'asap', 'immediately', 'critical', 'emergency',
    'today', 'right now', 'important', 'must', 'have to'
  ];
  
  const lowIndicators = [
    'maybe', 'someday', 'eventually', 'when i have time',
    'would be nice', 'low priority', 'not urgent', 'whenever'
  ];
  
  if (urgentIndicators.some(w => lower.includes(w))) {
    priority = 'HIGH';
  } else if (lowIndicators.some(w => lower.includes(w))) {
    priority = 'LOW';
  }
  
  // Category detection
  let category: string | undefined;
  
  const categoryPatterns: Record<string, RegExp[]> = {
    work: [/meeting/i, /email/i, /report/i, /deadline/i, /client/i, /project/i],
    health: [/gym/i, /doctor/i, /workout/i, /vitamins/i, /dentist/i, /exercise/i],
    personal: [/call mom/i, /birthday/i, /family/i, /friends/i],
    finance: [/pay/i, /bill/i, /invoice/i, /bank/i, /rent/i, /tax/i],
    errands: [/buy/i, /groceries/i, /pickup/i, /return/i, /store/i],
  };
  
  for (const [cat, patterns] of Object.entries(categoryPatterns)) {
    if (patterns.some(p => p.test(lower))) {
      category = cat;
      break;
    }
  }
  
  // Duration estimation (basic)
  let estimatedMinutes: number | undefined;
  
  const durationPatterns = [
    { pattern: /(\d+)\s*min/i, multiplier: 1 },
    { pattern: /(\d+)\s*hour/i, multiplier: 60 },
    { pattern: /quick/i, value: 5 },
    { pattern: /call/i, value: 15 },
    { pattern: /meeting/i, value: 30 },
  ];
  
  for (const { pattern, multiplier, value } of durationPatterns) {
    const match = lower.match(pattern);
    if (match) {
      estimatedMinutes = value ?? parseInt(match[1]) * (multiplier ?? 1);
      break;
    }
  }
  
  // Clean title (remove detected keywords)
  const cleanedTitle = title
    .replace(/urgent|asap|immediately|low priority/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    title: cleanedTitle || title,
    priority,
    category,
    estimatedMinutes,
  };
};
```

---

## 8.10 Celebration & Reward System

### Why Celebrations Matter

Completing a task should feel great, not just check a box. Micro-rewards drive dopamine and retention.

### Celebration Triggers

```
┌─────────────────────────────────────────────────────────────────┐
│                    CELEBRATION SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MICRO-CELEBRATIONS (In-task)                                   │
│  ├─ Task complete: Checkmark animation + haptic               │
│  ├─ 3rd task of day: "Hat trick! 🎩" toast                    │
│  └─ High priority done: Confetti burst + "Crushed it!"        │
│                                                                 │
│  MILESTONE CELEBRATIONS (Modal)                                 │
│  ├─ 5 tasks in one day: "Productive day!" + XP bonus          │
│  ├─ 7-day streak: Full-screen celebration + badge             │
│  ├─ 30-day streak: Special animation + title unlock           │
│  ├─ 100 tasks completed: "Centurion" badge                    │
│  └─ First challenge win: Trophy animation                     │
│                                                                 │
│  WEEKLY SUMMARY (Sunday evening)                                │
│  ┌─────────────────────────────────────────┐                   │
│  │ 🎉 YOUR WEEK IN REVIEW                  │                   │
│  │                                         │                   │
│  │ Tasks completed: 23                     │                   │
│  │ Focus time: 8h 45m                      │                   │
│  │ Streak: 12 days 🔥                      │                   │
│  │                                         │                   │
│  │ "Your most productive day was Tuesday! │                   │
│  │  You completed 6 tasks in 3 hours."    │                   │
│  │                                         │                   │
│  │ [Share] [Plan Next Week]                │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### AI Acknowledgment

```typescript
const getCompletionMessage = (context: CompletionContext): string => {
  const { tasksToday, streak, isHighPriority, timeOfDay } = context;
  
  // Personalized encouragement
  if (tasksToday === 3) {
    return "That's 3 tasks before lunch. You're on fire! 🔥";
  }
  
  if (isHighPriority) {
    return "Big one done! That'll feel good for the rest of the day.";
  }
  
  if (streak >= 7 && tasksToday === 1) {
    return `Day ${streak} of your streak! Keep it going.`;
  }
  
  if (timeOfDay === 'evening' && tasksToday >= 5) {
    return "Productive day! You've earned a rest.";
  }
  
  // Default responses
  const defaults = [
    "Done! ✓",
    "Nice work!",
    "Checked off!",
    "One less thing to worry about.",
  ];
  
  return defaults[Math.floor(Math.random() * defaults.length)];
};
```

---

## 9. Technical Implementation

### Frontend Architecture (Gesture-Based)

```
frontend/
├── src/
│   ├── navigation/
│   │   ├── GestureNavigator.tsx    # Custom gesture-based nav
│   │   ├── SwipeableStack.tsx      # Swipe between screens
│   │   └── ModalStack.tsx          # Standard modal stack
│   │
│   ├── screens/
│   │   ├── AIHome/                 # CENTER - Main screen
│   │   │   ├── index.tsx
│   │   │   ├── AIOrb.tsx
│   │   │   ├── ContextCards.tsx
│   │   │   └── SwipeHints.tsx
│   │   ├── TasksView/              # SWIPE LEFT
│   │   │   ├── index.tsx
│   │   │   ├── TaskList.tsx
│   │   │   └── MiniOrb.tsx
│   │   ├── SocialView/             # SWIPE RIGHT
│   │   │   ├── index.tsx
│   │   │   ├── CircleList.tsx
│   │   │   └── ChallengeList.tsx
│   │   ├── ProfileView/            # SWIPE DOWN
│   │   │   ├── index.tsx
│   │   │   ├── StatsGrid.tsx
│   │   │   └── UnlockProgress.tsx
│   │   ├── Focus/                  # SWIPE UP (modal)
│   │   │   ├── index.tsx
│   │   │   └── FocusTimer.tsx
│   │   └── modals/
│   │       ├── TaskDetail.tsx
│   │       ├── CircleHome.tsx
│   │       ├── ChallengeDetail.tsx
│   │       ├── Settings.tsx
│   │       └── UnlockCelebration.tsx
│   │
│   ├── components/
│   │   ├── AIOrb/                  # Core AI visual
│   │   │   ├── index.tsx
│   │   │   ├── OrbAnimations.ts
│   │   │   ├── OrbStates.ts
│   │   │   └── VoiceWaves.tsx
│   │   ├── MiniOrb/                # Compact orb for other screens
│   │   │   └── index.tsx
│   │   ├── AIMessage/              # AI text bubble
│   │   │   └── index.tsx
│   │   └── SwipeIndicator/         # Visual hint for swipe
│   │       └── index.tsx
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── aiService.ts        # AI API calls
│   │   │   ├── voiceService.ts     # Speech-to-text
│   │   │   ├── ttsService.ts       # Text-to-speech
│   │   │   └── commandParser.ts    # Parse voice commands
│   │   ├── events/
│   │   │   └── eventLogger.ts      # Log user events
│   │   ├── unlocks/
│   │   │   └── unlockService.ts    # Check/show unlocks
│   │   └── api.ts
│   │
│   ├── contexts/
│   │   ├── AIContext.tsx           # AI state, conversation
│   │   ├── GestureContext.tsx      # Current screen, swipe state
│   │   ├── UnlockContext.tsx       # Unlocked features
│   │   └── AuthContext.tsx
│   │
│   └── hooks/
│       ├── useAI.ts                # AI interaction
│       ├── useVoice.ts             # Voice input
│       ├── useGesture.ts           # Swipe detection
│       └── useUnlocks.ts           # Feature unlocks
```

### Gesture Navigator

```tsx
// navigation/GestureNavigator.tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  runOnJS 
} from 'react-native-reanimated';

type Screen = 'ai_home' | 'tasks' | 'social' | 'profile';

export function GestureNavigator() {
  const currentScreen = useSharedValue<Screen>('ai_home');
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Horizontal: tasks (left) / social (right)
      if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
        translateX.value = e.translationX;
      }
      // Vertical: profile (down) / focus (up)
      else {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      const THRESHOLD = 100;
      
      // Swipe LEFT → Tasks
      if (e.translationX < -THRESHOLD && currentScreen.value === 'ai_home') {
        translateX.value = withSpring(-SCREEN_WIDTH);
        runOnJS(navigateTo)('tasks');
      }
      // Swipe RIGHT → Social
      else if (e.translationX > THRESHOLD && currentScreen.value === 'ai_home') {
        translateX.value = withSpring(SCREEN_WIDTH);
        runOnJS(navigateTo)('social');
      }
      // Swipe DOWN → Profile
      else if (e.translationY > THRESHOLD && currentScreen.value === 'ai_home') {
        translateY.value = withSpring(SCREEN_HEIGHT);
        runOnJS(navigateTo)('profile');
      }
      // Swipe UP → Focus (modal)
      else if (e.translationY < -THRESHOLD && currentScreen.value === 'ai_home') {
        runOnJS(openFocusModal)();
      }
      // Return to center
      else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });
  
  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={styles.container}>
        {/* Tasks View (left of center) */}
        <Animated.View style={[styles.screen, tasksStyle]}>
          <TasksView />
        </Animated.View>
        
        {/* AI Home (center) */}
        <Animated.View style={[styles.screen, homeStyle]}>
          <AIHome />
        </Animated.View>
        
        {/* Social View (right of center) */}
        <Animated.View style={[styles.screen, socialStyle]}>
          <SocialView />
        </Animated.View>
        
        {/* Profile View (below center) */}
        <Animated.View style={[styles.screen, profileStyle]}>
          <ProfileView />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
```

### AI Context Provider

```tsx
// contexts/AIContext.tsx
import { createContext, useContext, useState, useCallback } from 'react';
import { aiService } from '../services/ai/aiService';
import { eventLogger } from '../services/events/eventLogger';

interface AIContextType {
  message: string;
  isListening: boolean;
  isSpeaking: boolean;
  conversation: Message[];
  startListening: () => void;
  stopListening: () => void;
  sendMessage: (text: string) => Promise<void>;
  refreshContext: () => Promise<void>;
}

export function AIProvider({ children }) {
  const [state, setState] = useState({
    message: '',
    isListening: false,
    isSpeaking: false,
    conversation: [],
  });
  
  const refreshContext = useCallback(async () => {
    const response = await aiService.getContextualMessage('ai_home');
    setState(s => ({ ...s, message: response.message }));
  }, []);
  
  const sendMessage = useCallback(async (text: string) => {
    // Log the event
    await eventLogger.log('voice_command', { command: text });
    
    // Get AI response
    const response = await aiService.processVoiceCommand(text);
    
    // Update conversation
    setState(s => ({
      ...s,
      conversation: [
        ...s.conversation,
        { role: 'user', content: text },
        { role: 'assistant', content: response.message },
      ],
      message: response.message,
    }));
    
    // Execute action if needed
    if (response.action) {
      await executeAction(response.action);
    }
    
    // Navigate if needed
    if (response.navigation) {
      navigateTo(response.navigation);
    }
  }, []);
  
  return (
    <AIContext.Provider value={{ ...state, sendMessage, refreshContext }}>
      {children}
    </AIContext.Provider>
  );
}
```

### Backend AI Routes (Updated)

```typescript
// backend/src/routes/ai.routes.ts

// Get contextual message for a screen
router.post('/contextual-message', auth, async (req, res) => {
  const { screen } = req.body;
  const userId = req.user.id;
  
  // Get user + model + unlocks
  const [user, model, unlocks] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.userModel.findUnique({ where: { userId } }),
    prisma.userUnlock.findMany({ where: { userId } }),
  ]);
  
  // Gather context
  const context = await gatherContext(userId);
  
  // Build prompts
  const unlockedFeatures = unlocks.map(u => u.feature);
  const systemPrompt = buildSystemPrompt(user, model, unlockedFeatures);
  const contextPrompt = buildContextPrompt(screen, context);
  
  // Generate message
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contextPrompt },
    ],
    max_tokens: 100,
    temperature: 0.7,
  });
  
  // Log event
  await logEvent(userId, 'ai_message_generated', { screen });
  
  res.json({
    message: response.choices[0].message.content,
    unlocks: unlocks.filter(u => !u.seenByUser), // New unlocks to show
  });
});

// Process voice command
router.post('/voice-command', auth, async (req, res) => {
  const { command, history } = req.body;
  const userId = req.user.id;
  
  // Parse intent (rule-based first, then AI)
  const intent = await parseIntent(command);
  
  // Execute action
  let actionResult = null;
  if (intent.action) {
    actionResult = await executeAction(userId, intent.action);
  }
  
  // Generate response
  const context = await gatherContext(userId);
  const response = await generateResponse(userId, intent, actionResult, context, history);
  
  // Log event
  await logEvent(userId, 'voice_command', { 
    command, 
    intent: intent.type,
    action: intent.action?.type,
  });
  
  res.json({
    message: response.message,
    action: actionResult,
    navigation: intent.navigation,
  });
});

// Log user event
router.post('/event', auth, async (req, res) => {
  const { type, screen, metadata } = req.body;
  const userId = req.user.id;
  
  await prisma.userEvent.create({
    data: {
      userId,
      type,
      screen,
      metadata,
    },
  });
  
  res.json({ success: true });
});

// Check for new unlocks
router.get('/unlocks', auth, async (req, res) => {
  const userId = req.user.id;
  
  const unlocks = await prisma.userUnlock.findMany({
    where: { userId, seenByUser: false },
  });
  
  res.json({ unlocks });
});

// Mark unlock as seen
router.post('/unlocks/:feature/seen', auth, async (req, res) => {
  const { feature } = req.params;
  const userId = req.user.id;
  
  await prisma.userUnlock.update({
    where: { userId_feature: { userId, feature } },
    data: { seenByUser: true },
  });
  
  res.json({ success: true });
});
```

---

## 10. Voice Command System

### Command Types

```
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE COMMAND TYPES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TASK COMMANDS                                                  │
│  ├─ "Add task: buy groceries"                                  │
│  ├─ "I need to call the dentist"                               │
│  ├─ "Remind me to email Sarah"                                 │
│  ├─ "Mark groceries as done"                                   │
│  ├─ "Move report to tomorrow"                                  │
│  └─ "Delete the dentist task"                                  │
│                                                                 │
│  QUERY COMMANDS                                                 │
│  ├─ "What do I have today?"                                    │
│  ├─ "How am I doing?"                                          │
│  ├─ "What's my streak?"                                        │
│  ├─ "How's the challenge going?"                               │
│  └─ "When am I most productive?" (requires unlock)            │
│                                                                 │
│  ACTION COMMANDS                                                │
│  ├─ "Start focus" / "Start focus on report"                   │
│  ├─ "Stop" / "I'm done"                                        │
│  ├─ "Add 10 minutes"                                           │
│  └─ "Nudge Sarah"                                              │
│                                                                 │
│  CONVERSATION                                                   │
│  ├─ "I'm feeling overwhelmed"                                  │
│  ├─ "What should I work on?"                                   │
│  ├─ "Help me prioritize"                                       │
│  └─ Any other natural language                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Voice Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER TAPS ORB                              │
│                           ↓                                      │
│             Haptic feedback (medium)                            │
│             Orb pulses, starts listening                        │
│             "Listening..." text appears                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    USER SPEAKS                                   │
│                           ↓                                      │
│         Live transcription shows as they speak                  │
│         Voice waves animate inside orb                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   USER STOPS / TAPS ORB                         │
│                           ↓                                      │
│             Orb transitions to "processing" state               │
│             Transcript sent to backend                          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND PROCESSES                              │
│                           ↓                                      │
│  1. Parse intent (add_task? query? action? conversation?)       │
│  2. Execute action if needed (create task, start focus, etc.)  │
│  3. Generate response using context + unlocked insights        │
│  4. Return message + action result + navigation                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   AI RESPONDS                                    │
│                           ↓                                      │
│           Orb transitions to "speaking" state                   │
│           Text-to-speech plays response                         │
│           Text appears below orb                                │
│           Action confirmation shown if relevant                 │
└─────────────────────────────────────────────────────────────────┘
```

### Intent Parser

```typescript
// backend/src/services/ai/intentParser.ts

const TASK_PATTERNS = [
  /^(add|create|new) task:?\s*(.+)/i,
  /^(i need to|remind me to|don't forget to)\s*(.+)/i,
  /^(mark|complete|finish|done with)\s*(.+)/i,
  /^(move|defer|postpone)\s*(.+)\s*(to|until)\s*(.+)/i,
  /^(delete|remove|cancel)\s*(.+)/i,
];

const QUERY_PATTERNS = [
  /^(what('s| is| do i have))\s*(today|tomorrow|this week)/i,
  /^(how('m| am) i doing)/i,
  /^(what('s| is) my) (streak|level|xp)/i,
  /^(how('s| is) (the|my)) challenge/i,
  /^when (am i|is my) (most productive|peak)/i,
];

const ACTION_PATTERNS = [
  /^(start|begin) focus/i,
  /^(stop|end|i'm done|finish)/i,
  /^(add|extend) (\d+) (minutes?|mins?)/i,
  /^nudge (\w+)/i,
];

export async function parseIntent(command: string): Promise<Intent> {
  const lower = command.toLowerCase().trim();
  
  // Try rule-based first (faster, cheaper)
  for (const pattern of TASK_PATTERNS) {
    const match = lower.match(pattern);
    if (match) {
      return parseTaskIntent(match);
    }
  }
  
  for (const pattern of QUERY_PATTERNS) {
    if (pattern.test(lower)) {
      return { type: 'query', queryType: extractQueryType(lower) };
    }
  }
  
  for (const pattern of ACTION_PATTERNS) {
    const match = lower.match(pattern);
    if (match) {
      return parseActionIntent(match);
    }
  }
  
  // Fall back to AI parsing for complex/conversational
  return await aiParseIntent(command);
}

async function aiParseIntent(command: string): Promise<Intent> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: INTENT_PARSER_SYSTEM_PROMPT },
      { role: 'user', content: command },
    ],
    functions: [{
      name: 'parse_intent',
      parameters: {
        type: 'object',
        properties: {
          type: { enum: ['add_task', 'query', 'action', 'conversation'] },
          taskTitle: { type: 'string' },
          taskDuration: { type: 'number' },
          taskPriority: { enum: ['HIGH', 'MEDIUM', 'LOW'] },
          queryType: { type: 'string' },
          actionType: { type: 'string' },
          actionParams: { type: 'object' },
        },
        required: ['type'],
      },
    }],
    function_call: { name: 'parse_intent' },
  });
  
  return JSON.parse(response.choices[0].message.function_call.arguments);
}
```

---

## 11. Implementation Roadmap

---

### Phase 1: Core Gesture Navigation (Week 1-2)

**Goal:** Build the gesture foundation and AI Home screen. User can swipe between 4 screens and tap the orb to interact.

**Deliverables:**
- Swipeable screen navigation (left/right/up/down gestures)
- Haptic feedback on all interactions
- Visual indicators (peek edges, swipe hints)
- AI Orb component with state animations (idle, listening, processing, speaking)
- Context cards (tasks, streak, challenge)
- Basic voice input flow (no processing yet)

**Why:** Establishes the core gesture interaction pattern that defines Mylo. Once this is solid, everything else builds on top.

**Outcome:** App is navigable and interactive—it feels alive.

---

### Week 1: Gesture System

#### Day 1: Setup Dependencies

**Install required packages:**
```bash
cd frontend
npm install react-native-gesture-handler react-native-reanimated
npm install @react-navigation/native @react-navigation/stack
```

**Configure Reanimated (babel.config.js):**
```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'react-native-reanimated/plugin', // Must be last!
  ],
};
```

**Update App.tsx:**
```typescript
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Rest of app */}
    </GestureHandlerRootView>
  );
}
```

**Test:** App should compile without errors.

---

#### Day 2-3: Create GestureNavigator

**File: `frontend/src/navigation/GestureNavigator.tsx`**

```typescript
import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Screen = 'ai_home' | 'tasks' | 'social' | 'profile';

const SPRING_CONFIG = {
  damping: 20,
  mass: 0.8,
  stiffness: 150,
};

export function GestureNavigator() {
  const currentScreen = useSharedValue<Screen>('ai_home');
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const gestureDirection = useSharedValue<'horizontal' | 'vertical' | null>(null);

  const navigateTo = (screen: Screen) => {
    currentScreen.value = screen;
    console.log('Navigated to:', screen);
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      gestureDirection.value = null;
    })
    .onUpdate((e) => {
      // Determine gesture direction on first significant movement
      if (gestureDirection.value === null) {
        const isHorizontal = Math.abs(e.translationX) > Math.abs(e.translationY);
        gestureDirection.value = isHorizontal ? 'horizontal' : 'vertical';
      }

      // Only update relevant axis
      if (gestureDirection.value === 'horizontal') {
        translateX.value = e.translationX;
        translateY.value = 0;
      } else {
        translateX.value = 0;
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      const THRESHOLD = 100;

      if (currentScreen.value === 'ai_home') {
        // From AI Home, can swipe in any direction
        if (e.translationX < -THRESHOLD) {
          // Swipe LEFT → Tasks
          translateX.value = withSpring(-SCREEN_WIDTH, SPRING_CONFIG);
          runOnJS(navigateTo)('tasks');
        } else if (e.translationX > THRESHOLD) {
          // Swipe RIGHT → Social
          translateX.value = withSpring(SCREEN_WIDTH, SPRING_CONFIG);
          runOnJS(navigateTo)('social');
        } else if (e.translationY > THRESHOLD) {
          // Swipe DOWN → Profile
          translateY.value = withSpring(SCREEN_HEIGHT, SPRING_CONFIG);
          runOnJS(navigateTo)('profile');
        } else if (e.translationY < -THRESHOLD) {
          // Swipe UP → Focus (handled separately, just cancel gesture)
          translateX.value = withSpring(0, SPRING_CONFIG);
          translateY.value = withSpring(0, SPRING_CONFIG);
        } else {
          // Cancelled, return to center
          translateX.value = withSpring(0, SPRING_CONFIG);
          translateY.value = withSpring(0, SPRING_CONFIG);
        }
      } else {
        // From any other screen, swipe back to AI Home
        if (
          (currentScreen.value === 'tasks' && e.translationX > THRESHOLD) ||
          (currentScreen.value === 'social' && e.translationX < -THRESHOLD) ||
          (currentScreen.value === 'profile' && e.translationY < -THRESHOLD)
        ) {
          translateX.value = withSpring(0, SPRING_CONFIG);
          translateY.value = withSpring(0, SPRING_CONFIG);
          runOnJS(navigateTo)('ai_home');
        } else {
          // Stay on current screen
          translateX.value = withSpring(
            currentScreen.value === 'tasks' ? -SCREEN_WIDTH : currentScreen.value === 'social' ? SCREEN_WIDTH : 0,
            SPRING_CONFIG
          );
          translateY.value = withSpring(
            currentScreen.value === 'profile' ? SCREEN_HEIGHT : 0,
            SPRING_CONFIG
          );
        }
      }

      gestureDirection.value = null;
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, containerStyle]}>
        <View style={[styles.screen, { left: -SCREEN_WIDTH }]}>
          {/* Tasks View - Left */}
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Tasks View</Text>
          </View>
        </View>

        <View style={[styles.screen, { left: 0 }]}>
          {/* AI Home - Center */}
          <View style={[styles.placeholder, { backgroundColor: '#6366f1' }]}>
            <Text style={styles.placeholderText}>AI Home</Text>
          </View>
        </View>

        <View style={[styles.screen, { left: SCREEN_WIDTH }]}>
          {/* Social View - Right */}
          <View style={[styles.placeholder, { backgroundColor: '#10b981' }]}>
            <Text style={styles.placeholderText}>Social View</Text>
          </View>
        </View>

        <View style={[styles.screen, { top: SCREEN_HEIGHT }]}>
          {/* Profile View - Below */}
          <View style={[styles.placeholder, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.placeholderText}>Profile View</Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

**Test:** 
- Swipe left → see "Tasks View"
- Swipe right → see "Social View"  
- Swipe down → see "Profile View"
- Swipe back → return to AI Home

---

#### Day 4: Add Haptic Feedback

**Install expo-haptics:**
```bash
npm install expo-haptics
```

**Update GestureNavigator:**
```typescript
import * as Haptics from 'expo-haptics';

// In panGesture.onBegin:
runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);

// In panGesture.onEnd (when navigation completes):
runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
```

**Test:** Feel haptic feedback on swipe start and completion.

---

#### Day 5: Add Peek Indicators

**File: `frontend/src/components/SwipeIndicator.tsx`**

```typescript
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  direction: 'left' | 'right' | 'up' | 'down';
}

export function SwipeIndicator({ direction }: Props) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Show hint after 1 second, hide after 3 seconds
    opacity.value = withSequence(
      withDelay(1000, withTiming(1, { duration: 300 })),
      withDelay(3000, withTiming(0, { duration: 300 }))
    );

    // Subtle movement animation
    const offset = 10;
    if (direction === 'left') {
      translateX.value = withSequence(
        withDelay(1000, withTiming(-offset, { duration: 500 })),
        withTiming(0, { duration: 500 })
      );
    } else if (direction === 'right') {
      translateX.value = withSequence(
        withDelay(1000, withTiming(offset, { duration: 500 })),
        withTiming(0, { duration: 500 })
      );
    } else if (direction === 'up') {
      translateY.value = withSequence(
        withDelay(1000, withTiming(-offset, { duration: 500 })),
        withTiming(0, { duration: 500 })
      );
    } else {
      translateY.value = withSequence(
        withDelay(1000, withTiming(offset, { duration: 500 })),
        withTiming(0, { duration: 500 })
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const getIconName = () => {
    switch (direction) {
      case 'left': return 'chevron-back';
      case 'right': return 'chevron-forward';
      case 'up': return 'chevron-up';
      case 'down': return 'chevron-down';
    }
  };

  const getPosition = () => {
    switch (direction) {
      case 'left': return { left: 20, top: '50%' };
      case 'right': return { right: 20, top: '50%' };
      case 'up': return { left: '50%', top: 20 };
      case 'down': return { left: '50%', bottom: 20 };
    }
  };

  return (
    <Animated.View style={[styles.indicator, getPosition(), animatedStyle]}>
      <Ionicons name={getIconName()} size={32} color="#fff" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
  },
});
```

**Add to AI Home:**
```typescript
<SwipeIndicator direction="left" />
<SwipeIndicator direction="right" />
<SwipeIndicator direction="down" />
```

**Test:** See arrows appear after 1 second, fade out after 3 seconds.

---

### Week 2: AI Home Screen

#### Day 6: Create AI Orb Component

**File: `frontend/src/components/AIOrb/index.tsx`**

```typescript
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

type OrbState = 'idle' | 'listening' | 'processing' | 'speaking';

interface Props {
  state: OrbState;
  onPress: () => void;
}

export function AIOrb({ state, onPress }: Props) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    switch (state) {
      case 'idle':
        // Gentle pulsing
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
        break;

      case 'listening':
        // Larger pulse
        scale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 800 }),
            withTiming(1.0, { duration: 800 })
          ),
          -1,
          false
        );
        break;

      case 'processing':
        // Spinning
        rotation.value = withRepeat(
          withTiming(360, { duration: 1500, easing: Easing.linear }),
          -1,
          false
        );
        break;

      case 'speaking':
        // Subtle pulse
        scale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: 500 }),
            withTiming(1.0, { duration: 500 })
          ),
          -1,
          false
        );
        break;
    }
  }, [state]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.orb, animatedStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  orb: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
});
```

**Test:** Tap orb, see different animations for each state.

---

#### Day 7-8: Create AI Home Screen

**File: `frontend/src/screens/AIHome/index.tsx`**

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AIOrb } from '../../components/AIOrb';
import { ContextCard } from './ContextCard';

export function AIHomeScreen() {
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [aiMessage, setAiMessage] = useState('Good morning! Ready to tackle your day?');

  const handleOrbPress = () => {
    // Cycle through states for demo
    setOrbState('listening');
    setTimeout(() => setOrbState('processing'), 2000);
    setTimeout(() => {
      setOrbState('speaking');
      setAiMessage('I heard you! This is a demo response.');
    }, 3000);
    setTimeout(() => setOrbState('idle'), 5000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.swipeHint}>← Tasks</Text>
        <Text style={styles.swipeHint}>Social →</Text>
      </View>

      <View style={styles.orbContainer}>
        <AIOrb state={orbState} onPress={handleOrbPress} />
      </View>

      <View style={styles.messageContainer}>
        <Text style={styles.message}>{aiMessage}</Text>
      </View>

      <Text style={styles.tapHint}>🎤 Tap to talk</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cardsContainer}
        contentContainerStyle={styles.cardsContent}
      >
        <ContextCard
          icon="📋"
          title="Today"
          value="3 tasks"
          color="#3b82f6"
        />
        <ContextCard
          icon="🔥"
          title="Streak"
          value="7 days"
          color="#ef4444"
        />
        <ContextCard
          icon="🏆"
          title="Challenge"
          value="2nd place"
          color="#f59e0b"
        />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.swipeHint}>↑ Swipe up: Focus</Text>
        <Text style={styles.swipeHint}>Profile ↓</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  swipeHint: {
    color: '#64748b',
    fontSize: 14,
  },
  orbContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    paddingHorizontal: 40,
    paddingBottom: 10,
  },
  message: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
  },
  tapHint: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  cardsContainer: {
    marginBottom: 20,
  },
  cardsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    gap: 8,
  },
});
```

**File: `frontend/src/screens/AIHome/ContextCard.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface Props {
  icon: string;
  title: string;
  value: string;
  color: string;
  onPress?: () => void;
}

export function ContextCard({ icon, title, value, color, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <View style={[styles.card, { borderLeftColor: color }]}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.content}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
    gap: 12,
  },
  icon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
  },
  value: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
});
```

**Test:** 
- See AI Home with orb, message, and context cards
- Tap orb to see state transitions
- Scroll through context cards

---

**Phase 1 Complete! ✅**
- Gesture navigation works
- AI Home looks polished
- Ready for data integration

---

### Phase 2: Data Views (Week 3-4)

**Goal:** Build the 4 core data views. User can now see tasks, social, profile, and access focus mode.

**Deliverables:**
- Tasks View: list, priorities, completion toggles, mini orb
- Social View: circles, challenges, activity feed, AI insights
- Profile View: stats, level, streaks, unlocks progress
- Focus Modal: timer, task context, voice control
- Consistent swipe-back gesture from all views

**Why:** Data views let users explore and manage their data without leaving the gesture-based interface. The mini orb keeps AI present.

**Outcome:** All core data is accessible and organized. App is starting to be useful.

---

### Week 3: Tasks + Social Views

#### Day 9-10: Tasks View

**File: `frontend/src/screens/TasksView/index.tsx`**

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { MiniOrb } from '../../components/MiniOrb';
import { TaskItem } from './TaskItem';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  duration: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
}

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Finish quarterly report', duration: '45m', priority: 'HIGH', completed: false },
    { id: '2', title: 'Call dentist', duration: '5m', priority: 'LOW', completed: false },
    { id: '3', title: 'Team meeting', duration: '30m', priority: 'MEDIUM', completed: false },
  ]);

  const handleComplete = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => console.log('Navigate back')}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Tasks</Text>
        <View style={styles.headerActions}>
          <MiniOrb onPress={() => console.log('Voice command')} />
          <Pressable onPress={() => console.log('Add task')}>
            <Ionicons name="add-circle" size={32} color="#6366f1" />
          </Pressable>
        </View>
      </View>

      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>TODAY (Mon, Feb 2)</Text>
      </View>

      <FlatList
        data={tasks.filter(t => !t.completed)}
        renderItem={({ item }) => (
          <TaskItem task={item} onComplete={handleComplete} />
        )}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      {tasks.some(t => t.completed) && (
        <Pressable style={styles.completedToggle}>
          <Ionicons name="lock-closed" size={16} color="#64748b" />
          <Text style={styles.completedText}>Completed (tap to show)</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  completedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 8,
  },
  completedText: {
    color: '#64748b',
    fontSize: 14,
  },
});
```

**File: `frontend/src/screens/TasksView/TaskItem.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  duration: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
}

interface Props {
  task: Task;
  onComplete: (id: string) => void;
}

const PRIORITY_COLORS = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

export function TaskItem({ task, onComplete }: Props) {
  return (
    <Pressable
      style={[styles.container, task.completed && styles.completed]}
      onPress={() => onComplete(task.id)}
    >
      <View style={styles.checkbox}>
        {task.completed ? (
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
        ) : (
          <View style={styles.checkboxEmpty} />
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, task.completed && styles.titleCompleted]}>
          {task.title}
        </Text>
      </View>

      <Text style={styles.duration}>{task.duration}</Text>
      
      <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[task.priority] }]}>
        <Text style={styles.priorityText}>{task.priority[0]}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  completed: {
    opacity: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
  },
  checkboxEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  duration: {
    color: '#94a3b8',
    fontSize: 14,
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

**File: `frontend/src/components/MiniOrb.tsx`**

```typescript
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
  onPress: () => void;
}

export function MiniOrb({ onPress }: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable style={styles.orb} onPress={handlePress}>
      <Ionicons name="mic" size={20} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  orb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
```

**Test:**
- See task list with priorities
- Tap tasks to mark complete
- Tap mini orb (logs to console)
- Tap + button (logs to console)

---

#### Day 11-12: Social View

**File: `frontend/src/screens/SocialView/index.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MiniOrb } from '../../components/MiniOrb';
import { ChallengeCard } from './ChallengeCard';
import { CircleCard } from './CircleCard';
import { ActivityItem } from './ActivityItem';

export function SocialView() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <MiniOrb onPress={() => console.log('Voice command')} />
          <Pressable onPress={() => console.log('Add circle/challenge')}>
            <Ionicons name="add-circle" size={32} color="#6366f1" />
          </Pressable>
        </View>
        <Text style={styles.title}>Social</Text>
        <Pressable onPress={() => console.log('Navigate back')}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.aiSummary}>
          <Text style={styles.aiSummaryText}>
            "Work circle is active. Family circle is quiet."
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVE CHALLENGES</Text>
          <ChallengeCard
            emoji="🏃"
            name="7-Day Workout"
            position="2nd"
            total={5}
            daysLeft={3}
            leader="Sarah"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CIRCLES</Text>
          <CircleCard
            emoji="💼"
            name="Work Circle"
            status="3 online"
          />
          <CircleCard
            emoji="👨‍👩‍👧"
            name="Family Circle"
            status="Quiet"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          <ActivityItem
            name="Sarah"
            action='completed "Q4 Report"'
            time="5m ago"
          />
          <ActivityItem
            name="Mike"
            action="started focus mode"
            time="12m ago"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  aiSummary: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  aiSummaryText: {
    color: '#94a3b8',
    fontSize: 14,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
});
```

**Test:**
- See challenges, circles, and activity feed
- Tap items (logs to console)
- Scroll smoothly

---

### Week 4: Profile + Focus

#### Day 13-14: Profile View

**File: `frontend/src/screens/ProfileView/index.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatCard } from './StatCard';
import { UnlockCard } from './UnlockCard';

export function ProfileView() {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.closeButton}
        onPress={() => console.log('Navigate back')}
      >
        <Ionicons name="close" size={28} color="#fff" />
      </Pressable>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <Text style={styles.username}>@alice</Text>
          <Text style={styles.levelInfo}>Level 12 • 7-day streak</Text>
        </View>

        <View style={styles.aiInsight}>
          <Text style={styles.sectionTitle}>AI INSIGHT</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>
              "You're most productive 9-11am. 85% completion rate this week. Focus sessions up 20% vs last week."
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STATS</Text>
          <View style={styles.statsGrid}>
            <StatCard label="XP" value="4,230" />
            <StatCard label="Tasks" value="127" />
            <StatCard label="Focus" value="42hrs" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔓 UNLOCKED FEATURES</Text>
          <View style={styles.unlocksGrid}>
            <UnlockCard name="Patterns" unlocked={true} />
            <UnlockCard name="Priority" unlocked={true} />
            <UnlockCard name="Predict" unlocked={false} progress={0.6} />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Settings</Text>
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Help</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.logoutButton]}>
            <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 60,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  levelInfo: {
    color: '#94a3b8',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  aiInsight: {
    marginBottom: 24,
  },
  insightCard: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  insightText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  unlocksGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 32,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    color: '#ef4444',
  },
});
```

**Test:**
- See profile with avatar, stats, and unlocks
- Scroll smoothly
- Tap buttons (logs to console)

---

#### Day 15: Focus Modal

**File: `frontend/src/screens/Focus/index.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MiniOrb } from '../../components/MiniOrb';

interface Props {
  visible: boolean;
  onClose: () => void;
  taskTitle?: string;
  duration?: number;
}

export function FocusModal({ visible, onClose, taskTitle, duration = 25 }: Props) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>

        <View style={styles.timerContainer}>
          <View style={styles.timer}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        {taskTitle && (
          <Text style={styles.taskTitle}>"{taskTitle}"</Text>
        )}

        <View style={styles.micContainer}>
          <MiniOrb onPress={() => console.log('Voice command during focus')} />
          <Text style={styles.micHint}>🎤 Tap to talk</Text>
        </View>

        <View style={styles.aiMessage}>
          <Text style={styles.aiMessageText}>
            {isRunning
              ? "You've been focused for 6 minutes. Keep going—you usually hit flow at the 10 minute mark."
              : "Ready to focus? Tap Start when you're ready."}
          </Text>
        </View>

        <View style={styles.controls}>
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={handleStartPause}
          >
            <Text style={styles.buttonText}>
              {isRunning ? 'Pause' : 'Start'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.dangerButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>End Session</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 60,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#6366f1',
  },
  timerText: {
    color: '#fff',
    fontSize: 64,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  taskTitle: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 24,
  },
  micContainer: {
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  micHint: {
    color: '#64748b',
    fontSize: 14,
  },
  aiMessage: {
    paddingHorizontal: 40,
    marginTop: 24,
  },
  aiMessageText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#6366f1',
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Test:**
- Open focus modal
- Start/pause timer
- Tap mini orb during focus
- End session

---

**Phase 2 Complete! ✅**
- All 4 core views implemented
- Mini orb on secondary screens
- Focus modal working

---

### Phase 3: AI Voice System (Week 5-6)

**Goal:** Make the orb actually work. User speaks commands, AI parses intent, executes actions, and responds.

**Deliverables:**
- Speech-to-text capture (expo-speech)
- Intent parser (rule-based + fallback to GPT-4)
- Action executor (create/complete tasks, start/stop focus, answer queries)
- Text-to-speech responses
- Conversation history
- AI fallback for unclear commands

**Why:** Voice is the core interaction model. Without this working end-to-end, everything else is just UI.

**Outcome:** The app is now actually interactive. Saying "add task buy milk" creates the task and responds naturally.

---

### Week 5: Voice Processing

#### Day 16-17: Speech-to-Text Integration

**Install expo-speech:**
```bash
npm install expo-speech expo-av
```

**Request permissions (App.tsx):**
```typescript
import { Audio } from 'expo-av';

useEffect(() => {
  (async () => {
    await Audio.requestPermissionsAsync();
  })();
}, []);
```

**File: `frontend/src/services/voiceService.ts`**

```typescript
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

class VoiceService {
  private recording: Audio.Recording | null = null;
  private isRecording = false;

  async startListening(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopListening(): Promise<string> {
    if (!this.recording) {
      throw new Error('No recording in progress');
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      this.isRecording = false;

      console.log('Recording stopped:', uri);

      // Send to backend for transcription
      const formData = new FormData();
      formData.append('audio', { uri, type: 'audio/wav', name: 'recording.wav' });
      const response = await fetch(`${API_URL}/ai/transcribe`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      return result.text || this.mockTranscription();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  private mockTranscription(): string {
    const samples = [
      'Add task buy groceries',
      'What do I have today',
      'Mark report as done',
      'Start focus',
      'How am I doing',
    ];
    return samples[Math.floor(Math.random() * samples.length)];
  }

  async speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      Speech.speak(text, {
        onDone: () => resolve(),
      });
    });
  }

  stopSpeaking(): void {
    Speech.stop();
  }
}

export const voiceService = new VoiceService();
```

**Test:**
- Record audio (permission prompt on first use)
- Stop recording
- Get mock transcription

---

#### Day 18-19: Intent Parser (Backend)

**File: `backend/src/services/ai/intentParser.ts`**

```typescript
interface Intent {
  type: 'add_task' | 'complete_task' | 'query' | 'action' | 'conversation';
  taskTitle?: string;
  taskId?: string;
  taskDuration?: number;
  taskPriority?: 'HIGH' | 'MEDIUM' | 'LOW';
  queryType?: string;
  actionType?: string;
  actionParams?: Record<string, any>;
}

const TASK_ADD_PATTERNS = [
  /^(add|create|new) task:?\s*(.+)/i,
  /^(i need to|remind me to|don't forget to)\s*(.+)/i,
];

const TASK_COMPLETE_PATTERNS = [
  /^(mark|complete|finish|done with)\s*(.+)/i,
];

const QUERY_PATTERNS = [
  /^(what('s| is| do i have))\s*(today|tomorrow)/i,
  /^(how('m| am) i doing)/i,
  /^(what('s| is) my) (streak|level|xp)/i,
];

const ACTION_PATTERNS = [
  /^(start|begin) focus/i,
  /^(stop|end|i'm done)/i,
];

export async function parseIntent(command: string): Promise<Intent> {
  const lower = command.toLowerCase().trim();

  // Check task add patterns
  for (const pattern of TASK_ADD_PATTERNS) {
    const match = lower.match(pattern);
    if (match) {
      return {
        type: 'add_task',
        taskTitle: match[2],
        taskPriority: 'MEDIUM', // default
      };
    }
  }

  // Check task complete patterns
  for (const pattern of TASK_COMPLETE_PATTERNS) {
    const match = lower.match(pattern);
    if (match) {
      return {
        type: 'complete_task',
        taskTitle: match[2],
      };
    }
  }

  // Check query patterns
  for (const pattern of QUERY_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        type: 'query',
        queryType: extractQueryType(lower),
      };
    }
  }

  // Check action patterns
  for (const pattern of ACTION_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        type: 'action',
        actionType: extractActionType(lower),
      };
    }
  }

  // Fallback: conversation
  return {
    type: 'conversation',
  };
}

function extractQueryType(command: string): string {
  if (command.includes('today')) return 'tasks_today';
  if (command.includes('tomorrow')) return 'tasks_tomorrow';
  if (command.includes('doing')) return 'status';
  if (command.includes('streak')) return 'streak';
  if (command.includes('level') || command.includes('xp')) return 'level';
  return 'unknown';
}

function extractActionType(command: string): string {
  if (command.includes('start') || command.includes('begin')) return 'start_focus';
  if (command.includes('stop') || command.includes('end') || command.includes('done')) return 'end_focus';
  return 'unknown';
}
```

**Test:**
```typescript
// Add tests
describe('Intent Parser', () => {
  it('parses add task command', async () => {
    const intent = await parseIntent('add task buy groceries');
    expect(intent.type).toBe('add_task');
    expect(intent.taskTitle).toBe('buy groceries');
  });

  it('parses query command', async () => {
    const intent = await parseIntent('what do I have today');
    expect(intent.type).toBe('query');
    expect(intent.queryType).toBe('tasks_today');
  });
});
```

---

#### Day 20: Execute Commands (Backend)

**File: `backend/src/services/ai/actionExecutor.ts`**

```typescript
import { prisma } from '../../config/database';
import type { Intent } from './intentParser';

export async function executeAction(userId: string, intent: Intent): Promise<any> {
  switch (intent.type) {
    case 'add_task':
      return await createTask(userId, intent);

    case 'complete_task':
      return await completeTask(userId, intent);

    case 'query':
      return await handleQuery(userId, intent);

    case 'action':
      return await handleAction(userId, intent);

    default:
      return null;
  }
}

async function createTask(userId: string, intent: Intent) {
  const task = await prisma.task.create({
    data: {
      userId,
      title: intent.taskTitle!,
      priority: intent.taskPriority || 'MEDIUM',
      estimatedDuration: intent.taskDuration,
      source: 'voice',
    },
  });

  return {
    type: 'task_created',
    task,
  };
}

async function completeTask(userId: string, intent: Intent) {
  // Find task by title (fuzzy match)
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      completed: false,
      title: {
        contains: intent.taskTitle,
        mode: 'insensitive',
      },
    },
    take: 1,
  });

  if (tasks.length === 0) {
    return {
      type: 'task_not_found',
      query: intent.taskTitle,
    };
  }

  const task = await prisma.task.update({
    where: { id: tasks[0].id },
    data: { completed: true, completedAt: new Date() },
  });

  return {
    type: 'task_completed',
    task,
  };
}

async function handleQuery(userId: string, intent: Intent) {
  switch (intent.queryType) {
    case 'tasks_today': {
      const tasks = await prisma.task.findMany({
        where: {
          userId,
          completed: false,
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      });

      return {
        type: 'tasks_list',
        tasks,
        count: tasks.length,
      };
    }

    case 'status': {
      const [totalTasks, completedToday, streak] = await Promise.all([
        prisma.task.count({ where: { userId, completed: false } }),
        prisma.task.count({
          where: {
            userId,
            completed: true,
            completedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { streakCount: true },
        }),
      ]);

      return {
        type: 'status',
        totalTasks,
        completedToday,
        streak: streak?.streakCount || 0,
      };
    }

    default:
      return { type: 'unknown_query' };
  }
}

async function handleAction(userId: string, intent: Intent) {
  switch (intent.actionType) {
    case 'start_focus': {
      const focusSession = await prisma.focusSession.create({
        data: {
          userId,
          duration: 25,
          status: 'active',
          startedAt: new Date(),
        },
      });
      return {
        type: 'focus_started',
        duration: 25,
        sessionId: focusSession.id,
      };
    }

    case 'end_focus': {
      const session = await prisma.focusSession.findFirst({
        where: { userId, status: 'active' },
        orderBy: { startedAt: 'desc' },
      });
      if (session) {
        await prisma.focusSession.update({
          where: { id: session.id },
          data: { status: 'completed', completedAt: new Date() },
        });
      }
      return {
        type: 'focus_ended',
        duration: session ? Math.round((Date.now() - session.startedAt.getTime()) / 60000) : 0,
      };
    }

    default:
      return { type: 'unknown_action' };
  }
}
```

**Test:**
```bash
# Start backend
cd backend
npm run dev

# Test endpoint
curl -X POST http://localhost:3000/api/ai/voice-command \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"command": "add task buy groceries"}'
```

---

### Week 6: AI Responses

#### Day 21-22: Response Generator (Backend)

**File: `backend/src/services/ai/responseGenerator.ts`**

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Context {
  user: {
    name: string;
    level: number;
    streak: number;
  };
  today: {
    tasks: number;
    completed: number;
  };
  time: {
    hour: number;
    timeOfDay: string;
  };
}

export async function generateResponse(
  intent: any,
  actionResult: any,
  context: Context
): Promise<string> {
  // Simple responses for common actions
  if (actionResult?.type === 'task_created') {
    return `Got it! I've added "${actionResult.task.title}" to your list.`;
  }

  if (actionResult?.type === 'task_completed') {
    return `Nice! Marked "${actionResult.task.title}" as complete. ${getEncouragement()}`;
  }

  if (actionResult?.type === 'task_not_found') {
    return `I couldn't find a task matching "${actionResult.query}". Could you be more specific?`;
  }

  if (actionResult?.type === 'tasks_list') {
    if (actionResult.count === 0) {
      return "You have no tasks for today. Time to relax or add some?";
    }
    return `You have ${actionResult.count} task${actionResult.count > 1 ? 's' : ''} today: ${actionResult.tasks.map(t => t.title).join(', ')}.`;
  }

  if (actionResult?.type === 'status') {
    return `You're doing great! ${actionResult.completedToday} tasks done today, ${actionResult.totalTasks} left. Your streak is ${actionResult.streak} days! 🔥`;
  }

  // For conversations, use OpenAI
  return await generateAIResponse(intent, context);
}

async function generateAIResponse(intent: any, context: Context): Promise<string> {
  const systemPrompt = `You are Mylo, a personal productivity AI. You are warm, encouraging, and helpful.
User: ${context.user.name}
Level: ${context.user.level}
Streak: ${context.user.streak} days
Time: ${context.time.timeOfDay}

Keep responses under 50 words. Be specific, not generic.`;

  const userPrompt = `User said: "${intent.command}"`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 100,
    temperature: 0.7,
  });

  return response.choices[0].message.content || "I'm here to help!";
}

function getEncouragement(): string {
  const phrases = [
    'Keep it up!',
    'You\'re on fire! 🔥',
    'Great work!',
    'One step closer!',
    'Momentum building!',
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}
```

**Create API endpoint:**

**File: `backend/src/routes/ai.routes.ts`**

```typescript
import { Router } from 'express';
import { auth } from '../middleware/auth';
import { parseIntent } from '../services/ai/intentParser';
import { executeAction } from '../services/ai/actionExecutor';
import { generateResponse } from '../services/ai/responseGenerator';

const router = Router();

router.post('/voice-command', auth, async (req, res) => {
  try {
    const { command } = req.body;
    const userId = req.user.id;

    // 1. Parse intent
    const intent = await parseIntent(command);

    // 2. Execute action (if any)
    const actionResult = await executeAction(userId, intent);

    // 3. Gather context
    const context = await gatherContext(userId);

    // 4. Generate response
    const message = await generateResponse(intent, actionResult, context);

    const confidence = calculateConfidence(intent, actionResult);
    res.json({
      message,
      action: actionResult,
      confidence,
    });
  } catch (error) {
    console.error('Voice command error:', error);
    res.status(500).json({
      error: {
        code: 'VOICE_COMMAND_FAILED',
        message: 'Failed to process voice command',
      },
    });
  }
});

async function gatherContext(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      completed: false,
      dueDate: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });
  const completedToday = await prisma.task.count({
    where: {
      userId,
      completed: true,
      completedAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return {
    user: {
      name: user.name,
      level: user.level || 1,
      streak: user.streakCount || 0,
    },
    today: {
      tasks: tasks.length,
      completed: completedToday,
    },
    time: {
      hour,
      timeOfDay,
    },
  };
}

export default router;
```

**Register route in `backend/src/app.ts`:**
```typescript
import aiRoutes from './routes/ai.routes';
app.use('/api/ai', aiRoutes);
```

**Test:**
```bash
curl -X POST http://localhost:3000/api/ai/voice-command \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"command": "add task buy milk"}'
```

---

#### Day 23: Connect Frontend to Backend

**File: `frontend/src/services/aiService.ts`**

```typescript
import { api } from './api';

class AIService {
  async processVoiceCommand(command: string): Promise<{
    message: string;
    action?: any;
  }> {
    const response = await api.post('/ai/voice-command', { command });
    return response.data;
  }

  async getGreeting(): Promise<string> {
    const response = await api.get('/ai/greeting');
    return response.data.message;
  }
}

export const aiService = new AIService();
```

**Update AIOrb to use real voice:**

```typescript
// In AIHomeScreen
import { voiceService } from '../../services/voiceService';
import { aiService } from '../../services/aiService';

const handleOrbPress = async () => {
  try {
    setOrbState('listening');
    await voiceService.startListening();

    // Stop after 5 seconds (or when user taps again)
    setTimeout(async () => {
      setOrbState('processing');
      const transcript = await voiceService.stopListening();

      // Send to backend
      const response = await aiService.processVoiceCommand(transcript);

      // Speak response
      setOrbState('speaking');
      setAiMessage(response.message);
      await voiceService.speak(response.message);

      setOrbState('idle');
    }, 5000);
  } catch (error) {
    console.error('Voice error:', error);
    setOrbState('idle');
    setAiMessage('Sorry, I had trouble hearing you. Try again?');
  }
};
```

**Test end-to-end:**
1. Tap orb
2. Say "add task buy milk"
3. See processing animation
4. Hear AI response
5. Check task list - task is there!

---

**Phase 3 Complete! ✅**
- Voice recording works
- Commands are parsed and executed
- AI responds naturally
- Tasks are created/completed by voice

---

### Phase 4: Learning + Unlocks (Week 7-8)

**Goal:** Add the learning engine. The app remembers patterns and reveals new insights progressively.

**Deliverables:**
- Event logging for all user actions (swipes, voice commands, completions, focus)
- UserModel schema for storing learned patterns (peak hours, best days, completion rates)
- Nightly batch job that analyzes events and calculates patterns
- Unlock eligibility checker (Day 3/7/14/30 gates)
- Unlock celebration modal
- Personalized AI prompts using unlocked data

**Why:** Learning is what makes Mylo feel intelligent and rewarding. Progressive unlocks create milestone moments.

**Outcome:** App adapts to user. By Day 7, user sees "You're most productive 9-11am." Personalization kicks in.

---

### Week 7: Event System

#### Day 24-25: Event Logging

**Add Prisma models (already in schema from Section 8)**

**Run migration:**
```bash
cd backend
npx prisma migrate dev --name add-events-and-learning
```

**File: `backend/src/services/eventService.ts`**

```typescript
import { prisma } from '../config/database';

interface EventData {
  type: string;
  screen: string;
  metadata?: Record<string, any>;
}

class EventService {
  async logEvent(userId: string, event: EventData) {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    await prisma.userEvent.create({
      data: {
        userId,
        type: event.type,
        screen: event.screen,
        metadata: {
          ...event.metadata,
          hour OfDay,
          dayOfWeek,
        },
      },
    });
  }

  async logEvents(userId: string, events: EventData[]) {
    await prisma.userEvent.createMany({
      data: events.map(e => ({
        userId,
        type: e.type,
        screen: e.screen,
        metadata: e.metadata || {},
      })),
    });
  }

  async getEvents(userId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return await prisma.userEvent.findMany({
      where: {
        userId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getEventsByType(userId: string, type: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return await prisma.userEvent.findMany({
      where: {
        userId,
        type,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}

export const eventService = new EventService();
```

**Create API routes:**

**File: `backend/src/routes/events.routes.ts`**

```typescript
import { Router } from 'express';
import { auth } from '../middleware/auth';
import { eventService } from '../services/eventService';

const router = Router();

router.post('/', auth, async (req, res) => {
  try {
    const { events } = req.body;
    const userId = req.user.id;

    if (Array.isArray(events)) {
      await eventService.logEvents(userId, events);
    } else {
      await eventService.logEvent(userId, events);
    }

    res.json({ success: true, processed: events.length || 1 });
  } catch (error) {
    console.error('Event logging error:', error);
    res.status(500).json({
      error: {
        code: 'EVENT_LOG_FAILED',
        message: 'Failed to log events',
      },
    });
  }
});

export default router;
```

**Frontend event logger:**

**File: `frontend/src/services/eventLogger.ts`**

```typescript
import { api } from './api';

class EventLogger {
  private queue: any[] = [];
  private timer: NodeJS.Timeout | null = null;

  log(type: string, screen: string, metadata?: Record<string, any>) {
    this.queue.push({ type, screen, metadata, timestamp: new Date() });

    // Flush every 10 seconds or when queue reaches 20
    if (this.queue.length >= 20) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 10000);
    }
  }

  async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    try {
      await api.post('/events', { events });
    } catch (error) {
      console.error('Failed to log events:', error);
      // Re-queue on failure
      this.queue.unshift(...events);
    }
  }
}

export const eventLogger = new EventLogger();
```

**Add logging to app:**

```typescript
// In GestureNavigator
const navigateTo = (screen: Screen) => {
  currentScreen.value = screen;
  eventLogger.log(`swipe_to_${screen}`, 'ai_home');
};

// In AIHomeScreen
useEffect(() => {
  eventLogger.log('app_opened', 'ai_home');
}, []);

// In task creation
const createTask = async (title: string) => {
  const task = await api.createTask({ title, ... });
  eventLogger.log('task_created', 'tasks', { taskId: task.id });
};
```

**Test:**
- Perform actions (swipe, create task, etc.)
- Check database: `SELECT * FROM UserEvent;`
- Should see events logged

---

#### Day 26-27: Pattern Calculation

**File: `backend/src/services/analytics/patternCalculator.ts`**

```typescript
import { prisma } from '../../config/database';
import type { UserEvent } from '@prisma/client';

export async function calculatePeakHours(events: UserEvent[]): Promise<number[]> {
  // Count completions by hour
  const hourCounts: Record<number, number> = {};

  events
    .filter(e => e.type === 'task_completed')
    .forEach(e => {
      const hour = (e.metadata as any).hourOfDay;
      if (hour !== undefined) {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

  // Get top 3 hours
  const sortedHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  return sortedHours.sort((a, b) => a - b);
}

export async function calculateBestDayOfWeek(events: UserEvent[]): Promise<number | null> {
  const dayCounts: Record<number, number> = {};

  events
    .filter(e => e.type === 'task_completed')
    .forEach(e => {
      const day = (e.metadata as any).dayOfWeek;
      if (day !== undefined) {
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    });

  if (Object.keys(dayCounts).length === 0) return null;

  const bestDay = Object.entries(dayCounts)
    .sort(([, a], [, b]) => b - a)[0];

  return parseInt(bestDay[0]);
}

export async function calculateCompletionRates(userId: string) {
  const [highTasks, medTasks, lowTasks] = await Promise.all([
    prisma.task.findMany({ where: { userId, priority: 'HIGH' } }),
    prisma.task.findMany({ where: { userId, priority: 'MEDIUM' } }),
    prisma.task.findMany({ where: { userId, priority: 'LOW' } }),
  ]);

  const calcRate = (tasks: any[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return completed / tasks.length;
  };

  return {
    HIGH: calcRate(highTasks),
    MEDIUM: calcRate(medTasks),
    LOW: calcRate(lowTasks),
  };
}

export async function detectOverwhelmThreshold(events: UserEvent[]): Promise<number | null> {
  // Group events by day
  const dayGroups: Record<string, { created: number; completed: number }> = {};

  events.forEach(e => {
    const dateKey = e.timestamp.toISOString().split('T')[0];
    if (!dayGroups[dateKey]) {
      dayGroups[dateKey] = { created: 0, completed: 0 };
    }

    if (e.type === 'task_created') {
      dayGroups[dateKey].created++;
    } else if (e.type === 'task_completed') {
      dayGroups[dateKey].completed++;
    }
  });

  // Find threshold where completion rate drops
  const days = Object.values(dayGroups);
  if (days.length < 5) return null;

  // Simple heuristic: find task count where completion rate < 50%
  for (let threshold = 5; threshold <= 20; threshold++) {
    const highLoadDays = days.filter(d => d.created >= threshold);
    if (highLoadDays.length === 0) continue;

    const completionRate = highLoadDays.reduce((sum, d) => sum + (d.completed / d.created), 0) / highLoadDays.length;

    if (completionRate < 0.5) {
      return threshold;
    }
  }

  return null;
}
```

**Test calculations:**
```typescript
// In tests
describe('Pattern Calculator', () => {
  it('calculates peak hours', async () => {
    const events = [
      { type: 'task_completed', metadata: { hourOfDay: 9 } },
      { type: 'task_completed', metadata: { hourOfDay: 9 } },
      { type: 'task_completed', metadata: { hourOfDay: 10 } },
    ];

    const peakHours = await calculatePeakHours(events);
    expect(peakHours).toContain(9);
    expect(peakHours).toContain(10);
  });
});
```

---

#### Day 28: Nightly Batch Job

**File: `backend/src/services/scheduler/modelUpdater.ts`**

```typescript
import { prisma } from '../../config/database';
import { eventService } from '../eventService';
import {
  calculatePeakHours,
  calculateBestDayOfWeek,
  calculateCompletionRates,
  detectOverwhelmThreshold,
} from '../analytics/patternCalculator';

export async function updateAllUserModels() {
  console.log('Starting user model updates...');

  const users = await prisma.user.findMany();

  for (const user of users) {
    try {
      await updateUserModel(user.id);
    } catch (error) {
      console.error(`Failed to update model for user ${user.id}:`, error);
    }
  }

  console.log('User model updates complete!');
}

async function updateUserModel(userId: string) {
  const events = await eventService.getEvents(userId, 30);
  const daysSinceSignup = Math.floor(
    (Date.now() - (await prisma.user.findUnique({ where: { id: userId } }))!.createdAt.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Calculate stats
  const totalTasks = await prisma.task.count({ where: { userId } });
  const totalCompleted = await prisma.task.count({ where: { userId, completed: true } });
  const focusSessions = await prisma.focusSession.findMany({ where: { userId } });
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  // Calculate patterns (only if eligible)
  const peakHours = daysSinceSignup >= 7 && events.length >= 10
    ? await calculatePeakHours(events)
    : null;

  const bestDayOfWeek = daysSinceSignup >= 7
    ? await calculateBestDayOfWeek(events)
    : null;

  const completionRates = daysSinceSignup >= 14
    ? await calculateCompletionRates(userId)
    : null;

  const overwhelmThreshold = daysSinceSignup >= 30
    ? await detectOverwhelmThreshold(events)
    : null;

  // Update or create user model
  await prisma.userModel.upsert({
    where: { userId },
    update: {
      totalTasks,
      totalCompleted,
      totalFocusMinutes,
      peakHours,
      bestDayOfWeek,
      completionRates: completionRates as any,
      overwhelmThreshold,
      lastUpdated: new Date(),
    },
    create: {
      userId,
      totalTasks,
      totalCompleted,
      totalFocusMinutes,
      peakHours,
      bestDayOfWeek,
      completionRates: completionRates as any,
      overwhelmThreshold,
    },
  });

  // Check for new unlocks
  await checkUnlocks(userId, daysSinceSignup, totalTasks, totalCompleted, focusSessions.length);
}

async function checkUnlocks(
  userId: string,
  daysSinceSignup: number,
  totalTasks: number,
  totalCompleted: number,
  focusSessions: number
) {
  const unlocks = [];

  if (daysSinceSignup >= 3) {
    unlocks.push({ feature: 'personalized_greeting', userId });
  }

  if (daysSinceSignup >= 7 && totalCompleted >= 10) {
    unlocks.push({ feature: 'peak_hours', userId });
    unlocks.push({ feature: 'ai_task_sorting', userId });
    unlocks.push({ feature: 'weekly_comparison', userId });
  }

  if (daysSinceSignup >= 14 && focusSessions >= 10) {
    unlocks.push({ feature: 'duration_estimation', userId });
  }

  if (daysSinceSignup >= 14 && totalTasks >= 30) {
    unlocks.push({ feature: 'completion_patterns', userId });
  }

  if (daysSinceSignup >= 30 && totalTasks >= 50) {
    unlocks.push({ feature: 'predictive_mode', userId });
    unlocks.push({ feature: 'overwhelm_detection', userId });
  }

  // Insert new unlocks (ignore if already exists)
  for (const unlock of unlocks) {
    await prisma.userUnlock.upsert({
      where: {
        userId_feature: {
          userId: unlock.userId,
          feature: unlock.feature,
        },
      },
      update: {},
      create: unlock,
    });
  }
}
```

**Schedule with Bull queue:**

```bash
npm install bull @types/bull
```

**File: `backend/src/services/scheduler/index.ts`**

```typescript
import Queue from 'bull';
import { updateAllUserModels } from './modelUpdater';

const modelUpdateQueue = new Queue('model-updates', process.env.REDIS_URL || 'redis://localhost:6379');

// Schedule nightly at 3am
modelUpdateQueue.add(
  'update-all-users',
  {},
  {
    repeat: { cron: '0 3 * * *' },
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 },
  }
);

modelUpdateQueue.process('update-all-users', async (job) => {
  console.log('Running nightly model update...');
  await updateAllUserModels();
  console.log('Nightly model update complete!');
});

export { modelUpdateQueue };
```

**Start queue in `backend/src/index.ts`:**
```typescript
import './services/scheduler';
```

**Test manually:**
```typescript
// In a test file or admin endpoint
import { updateAllUserModels } from './services/scheduler/modelUpdater';
await updateAllUserModels();
```

---

### Week 8: Progressive Unlocks

#### Day 29-30: Unlock Celebration UI

**File: `frontend/src/screens/modals/UnlockCelebration.tsx`**

```typescript
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { AIOrb } from '../../components/AIOrb';

interface Props {
  visible: boolean;
  feature: {
    title: string;
    description: string;
    message: string;
  };
  onClose: () => void;
}

export function UnlockCelebration({ visible, feature, onClose }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Entrance animation
      scale.value = withSequence(
        withSpring(1.2, { damping: 10 }),
        withSpring(1.0)
      );
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.backdrop}>
        <Animated.View style={[styles.container, containerStyle]}>
          <Text style={styles.title}>✨ NEW INSIGHT UNLOCKED ✨</Text>

          <View style={styles.orbContainer}>
            <AIOrb state="celebrating" onPress={() => {}} />
          </View>

          <Text style={styles.featureTitle}>{feature.title}</Text>
          <Text style={styles.featureDescription}>{feature.description}</Text>

          <View style={styles.messageContainer}>
            <Text style={styles.message}>{feature.message}</Text>
          </View>

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Awesome!</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 32,
    marginHorizontal: 20,
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 24,
  },
  orbContainer: {
    marginBottom: 24,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  messageContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    marginBottom: 24,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

**Hook to check for unlocks:**

**File: `frontend/src/hooks/useUnlocks.ts`**

```typescript
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function useUnlocks() {
  const [newUnlocks, setNewUnlocks] = useState<any[]>([]);
  const [showingUnlock, setShowingUnlock] = useState<any | null>(null);

  useEffect(() => {
    checkForUnlocks();
    const interval = setInterval(checkForUnlocks, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkForUnlocks = async () => {
    try {
      const response = await api.get('/ai/unlocks');
      const unseenUnlocks = response.data.unlocks.filter(u => !u.seenByUser);

      if (unseenUnlocks.length > 0 && !showingUnlock) {
        setShowingUnlock(unseenUnlocks[0]);
      }
    } catch (error) {
      console.error('Failed to check unlocks:', error);
    }
  };

  const dismissUnlock = async () => {
    if (!showingUnlock) return;

    try {
      await api.post(`/ai/unlocks/${showingUnlock.feature}/seen`);
      setShowingUnlock(null);
      checkForUnlocks(); // Check if there are more
    } catch (error) {
      console.error('Failed to dismiss unlock:', error);
    }
  };

  return {
    showingUnlock,
    dismissUnlock,
  };
}
```

**Use in App:**

```typescript
// In App.tsx or main navigation
import { useUnlocks } from './hooks/useUnlocks';
import { UnlockCelebration } from './screens/modals/UnlockCelebration';

function App() {
  const { showingUnlock, dismissUnlock } = useUnlocks();

  return (
    <>
      {/* Main app content */}
      <GestureNavigator />

      {/* Unlock modal */}
      {showingUnlock && (
        <UnlockCelebration
          visible={!!showingUnlock}
          feature={{
            title: showingUnlock.title,
            description: showingUnlock.description,
            message: getUnlockMessage(showingUnlock.feature),
          }}
          onClose={dismissUnlock}
        />
      )}
    </>
  );
}

function getUnlockMessage(feature: string): string {
  const messages = {
    peak_hours: "After 7 days, I've learned something: You're most productive 9-11am. I'll prioritize important tasks then.",
    completion_patterns: "I've noticed patterns in how you complete tasks. I can now help you better estimate what you'll actually finish.",
    overwhelm_detection: "I can now tell when you have too much on your plate and help you prioritize better.",
  };
  return messages[feature] || "I've learned something new about you!";
}
```

**Test:**
1. Trigger unlock (manually set `daysSinceSignup` in database)
2. Run model updater
3. App should show celebration modal
4. Tap "Awesome!" to dismiss
5. Check database: `seenByUser` should be true

---

**Phase 4 Complete! ✅**
- Events are logged
- Patterns are calculated nightly
- Unlocks trigger automatically
- Celebration UI shows new features

---

### Phase 5: Polish (Week 9)

**Goal:** Make Mylo feel premium. Smooth animations, responsive feedback, and zero errors.

**Deliverables:**
- Orb animation refinement (smoother transitions, particle effects)
- Gesture transition polish (butter-smooth swipes, no jank)
- Haptic tuning (intensity/pattern verification on device)
- Error boundaries + graceful degradation
- Offline mode (mutation queues, sync on reconnect)
- Performance optimization (code splitting, lazy loading, memoization)
- QA + bug fixes across all devices/scenarios

**Why:** This is what separates a prototype from a product. Users notice polish.

**Outcome:** App is production-ready, 60fps, handles errors gracefully, works offline.

---

### Day 31-33: Animation & Transition Polish

#### Refine Orb Animations

- Add more states (e.g., "thinking" before "speaking")
- Smooth state transitions
- Add particle effects for celebration

#### Smooth Gesture Transitions

- Adjust spring config for buttery smooth swipes
- Add rubber-band effect at edges
- Ensure no jank or stuttering

#### Finalize Haptics

- Test all haptic patterns on device
- Adjust intensities
- Add haptic for unlock reveal

**Code example: Refined spring config**
```typescript
const REFINED_SPRING = {
  damping: 18,
  mass: 0.7,
  stiffness: 180,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
};
```

---

### Day 34-35: Error Handling & Offline

#### Add Error Boundaries

- Wrap each screen in error boundary
- Show friendly error messages
- Log errors to Sentry

#### Implement Offline Mode

- Queue mutations when offline
- Show "Offline" indicator
- Sync when back online
- Cache last AI message

#### Graceful Degradation

- Voice fallback to text input
- AI fallback to static messages
- Show skeleton loaders

---

### Day 36-37: Performance Optimization

#### Lazy Load Modals

```typescript
const TaskDetail = lazy(() => import('./screens/modals/TaskDetail'));
const Settings = lazy(() => import('./screens/modals/Settings'));
```

#### Optimize Re-renders

- Use React.memo for expensive components
- Avoid anonymous functions in renders
- Use useCallback for event handlers

#### Reduce Bundle Size

- Analyze bundle: `npx react-native-bundle-visualizer`
- Remove unused dependencies
- Optimize images

---

### Day 38-39: QA & Bug Fixes

#### Manual Testing Checklist

- [ ] All gestures work smoothly
- [ ] Voice commands create/complete tasks
- [ ] AI responses are relevant
- [ ] Unlocks trigger correctly
- [ ] Focus timer counts down accurately
- [ ] Haptics feel right
- [ ] No crashes or errors
- [ ] Offline mode works
- [ ] Performance is smooth (60fps)

#### Automated Tests

- Run all unit tests: `npm test`
- Run integration tests
- Run E2E tests: `npm run e2e`

#### Bug Bash

- Test on multiple devices (iOS + Android)
- Test edge cases (no internet, empty state, etc.)
- Fix all critical bugs
- Prioritize polish bugs

---

**Phase 5 Complete! ✅**
**Mylo v2.0 is ready for deployment!** 🚀

---

*Implementation Roadmap Complete*
*Total Duration: 9 weeks*
*All phases detailed with step-by-step instructions*

---

## 12. API Specifications

### Complete API Contract

#### Authentication Endpoints

```typescript
POST /api/auth/register
Request: {
  email: string;
  password: string;
  name: string;
}
Response: {
  user: User;
  token: string;
  refreshToken: string;
}
```

```typescript
POST /api/auth/login
Request: {
  email: string;
  password: string;
}
Response: {
  user: User;
  token: string;
  refreshToken: string;
}
```

```typescript
POST /api/auth/refresh
Headers: { Authorization: "Bearer <refreshToken>" }
Response: {
  token: string;
  refreshToken: string;
}
```

#### AI Endpoints

```typescript
POST /api/ai/greeting
Headers: { Authorization: "Bearer <token>" }
Response: {
  message: string;
  contextCards: Array<{
    type: 'tasks' | 'streak' | 'challenge' | 'focus';
    title: string;
    value: string | number;
    action?: string;
  }>;
  unlocks: Array<{
    feature: string;
    unlockedAt: Date;
  }>;
}
```

```typescript
POST /api/ai/voice-command
Headers: { Authorization: "Bearer <token>" }
Request: {
  command: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  screen: 'ai_home' | 'tasks' | 'social' | 'profile' | 'focus';
}
Response: {
  message: string;
  action?: {
    type: 'create_task' | 'complete_task' | 'start_focus' | 'navigate';
    data: any;
  };
  navigation?: string;
  confidence: number; // 0-1
}
```

```typescript
POST /api/ai/contextual-message
Headers: { Authorization: "Bearer <token>" }
Request: {
  screen: string;
  context?: {
    selectedTask?: string;
    currentChallenge?: string;
  };
}
Response: {
  message: string;
  suggestions: string[];
}
```

```typescript
GET /api/ai/unlocks
Headers: { Authorization: "Bearer <token>" }
Response: {
  unlocks: Array<{
    id: string;
    feature: string;
    title: string;
    description: string;
    unlockedAt: Date;
    seenByUser: boolean;
  }>;
  nextUnlock: {
    feature: string;
    requirement: string;
    progress: number; // 0-1
  } | null;
}
```

```typescript
POST /api/ai/unlocks/:feature/seen
Headers: { Authorization: "Bearer <token>" }
Response: {
  success: boolean;
}
```

#### Event Logging Endpoints

```typescript
POST /api/events
Headers: { Authorization: "Bearer <token>" }
Request: {
  events: Array<{
    type: string;
    screen: string;
    metadata: Record<string, any>;
    timestamp?: Date;
  }>;
}
Response: {
  success: boolean;
  processed: number;
}
```

```typescript
GET /api/events/analytics
Headers: { Authorization: "Bearer <token>" }
Query: {
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
  types?: string[];   // event type filter
}
Response: {
  summary: {
    totalEvents: number;
    byType: Record<string, number>;
    byDay: Array<{ date: string; count: number }>;
  };
  insights: {
    mostActiveHour: number;
    mostActiveDay: number;
    averageSessionLength: number;
  };
}
```

#### Task Endpoints (Existing, Enhanced)

```typescript
GET /api/tasks
Headers: { Authorization: "Bearer <token>" }
Query: {
  date?: string;        // ISO date for specific day
  completed?: boolean;  // filter by completion
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  sortBy?: 'ai_priority' | 'dueDate' | 'priority' | 'createdAt';
}
Response: {
  tasks: Array<Task>;
  aiSorted: boolean; // indicates if AI sorting was applied
  peakHours: number[] | null; // if unlocked
}
```

```typescript
POST /api/tasks
Headers: { Authorization: "Bearer <token>" }
Request: {
  title: string;
  description?: string;
  dueDate?: Date;
  estimatedDuration?: number; // minutes
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category?: string;
  source: 'voice' | 'manual' | 'ai_suggested';
}
Response: {
  task: Task;
  aiSuggestions?: {
    suggestedTime?: string;
    estimatedDuration?: number;
    similarTasks?: string[];
  };
}
```

```typescript
PATCH /api/tasks/:id
Headers: { Authorization: "Bearer <token>" }
Request: Partial<Task>
Response: {
  task: Task;
  xpEarned?: number;
  streakUpdated?: boolean;
}
```

#### Focus Endpoints

```typescript
POST /api/focus/start
Headers: { Authorization: "Bearer <token>" }
Request: {
  taskId?: string;
  duration: number; // minutes
}
Response: {
  session: {
    id: string;
    startedAt: Date;
    duration: number;
    taskId?: string;
  };
  encouragement: string; // AI message
}
```

```typescript
POST /api/focus/:sessionId/complete
Headers: { Authorization: "Bearer <token>" }
Request: {
  actualDuration: number; // minutes
  completed: boolean;
}
Response: {
  session: FocusSession;
  xpEarned: number;
  insights?: {
    comparedToAverage: string;
    flowStateReached: boolean;
  };
}
```

```typescript
POST /api/focus/:sessionId/extend
Headers: { Authorization: "Bearer <token>" }
Request: {
  additionalMinutes: number;
}
Response: {
  session: FocusSession;
  newEndTime: Date;
}
```

#### User Model & Analytics

```typescript
GET /api/user/model
Headers: { Authorization: "Bearer <token>" }
Response: {
  model: {
    totalTasks: number;
    totalCompleted: number;
    totalFocusMinutes: number;
    peakHours?: number[];
    bestDayOfWeek?: number;
    avgTaskDuration?: number;
    completionRates?: {
      HIGH: number;
      MEDIUM: number;
      LOW: number;
    };
    overwhelmThreshold?: number;
  };
  lastUpdated: Date;
  daysUsingMypa: number;
}
```

```typescript
GET /api/user/insights
Headers: { Authorization: "Bearer <token>" }
Response: {
  insights: Array<{
    type: 'peak_hours' | 'completion_pattern' | 'overwhelm' | 'streak';
    title: string;
    description: string;
    data: any;
    unlocked: boolean;
  }>;
}
```

### Rate Limiting

```typescript
// All endpoints rate limited by user ID
const RATE_LIMITS = {
  '/api/auth/*': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
  },
  '/api/ai/voice-command': {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 voice commands per minute
  },
  '/api/ai/greeting': {
    windowMs: 60 * 1000,
    max: 10,
  },
  '/api/events': {
    windowMs: 60 * 1000,
    max: 100, // batch submissions
  },
  '/api/tasks/*': {
    windowMs: 60 * 1000,
    max: 30,
  },
  default: {
    windowMs: 60 * 1000,
    max: 60,
  },
};
```

### Error Responses

All endpoints return errors in this format:

```typescript
{
  error: {
    code: string;        // 'AUTH_REQUIRED', 'RATE_LIMIT', 'INVALID_INPUT', etc.
    message: string;     // User-friendly message
    details?: any;       // Additional context (dev mode only)
    retryAfter?: number; // For rate limit errors (seconds)
  };
}
```

Common error codes:
- `AUTH_REQUIRED` (401): No or invalid token
- `AUTH_EXPIRED` (401): Token expired, use refresh
- `FORBIDDEN` (403): Valid token but insufficient permissions
- `NOT_FOUND` (404): Resource doesn't exist
- `RATE_LIMIT` (429): Too many requests
- `INVALID_INPUT` (400): Validation failed
- `SERVER_ERROR` (500): Internal error
- `SERVICE_UNAVAILABLE` (503): AI service down

---

## 13. Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USER REGISTERS/LOGS IN                                      │
│     ├─ Password hashed with bcrypt (cost: 12)                 │
│     ├─ Generate JWT access token (exp: 15min)                 │
│     └─ Generate refresh token (exp: 7 days)                   │
│                                                                 │
│  2. STORE TOKENS                                                │
│     ├─ Access token: AsyncStorage (encrypted)                 │
│     ├─ Refresh token: Secure storage (iOS Keychain/Android)   │
│     └─ User ID: AsyncStorage                                   │
│                                                                 │
│  3. API REQUESTS                                                │
│     ├─ Include access token in Authorization header           │
│     ├─ Backend validates token signature + expiration         │
│     └─ Extract userId from token payload                      │
│                                                                 │
│  4. TOKEN EXPIRATION                                            │
│     ├─ Access token expires → attempt refresh                 │
│     ├─ Send refresh token to /api/auth/refresh                │
│     ├─ Receive new access + refresh tokens                    │
│     └─ Retry original request with new token                  │
│                                                                 │
│  5. REFRESH TOKEN INVALID                                       │
│     ├─ Clear all stored tokens                                │
│     ├─ Navigate to login screen                               │
│     └─ Log user out                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### JWT Payload

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;    // issued at
  exp: number;    // expiration
  type: 'access' | 'refresh';
}
```

### Data Privacy & GDPR Compliance

**User Data Collected:**
- Account: email, name, password (hashed)
- Usage: tasks, focus sessions, events, conversation history
- Learned model: behavioral patterns, preferences

**Data Rights:**
```typescript
// Export all user data
GET /api/user/export
Response: {
  user: User;
  tasks: Task[];
  focusSessions: FocusSession[];
  events: UserEvent[];
  model: UserModel;
  conversations: Conversation[];
}

// Delete all user data
DELETE /api/user/account
Response: {
  success: boolean;
  deletedAt: Date;
}
```

**Data Retention:**
- Events: 90 days rolling window
- Conversations: 60 days or last 100 messages
- Tasks: permanent (until user deletes)
- User model: permanent (until account deletion)

### API Security Measures

1. **HTTPS Only**: All API calls over TLS 1.3
2. **CORS**: Whitelist specific origins in production
3. **CSRF Protection**: Not needed (stateless JWT, no cookies)
4. **SQL Injection**: Prevented by Prisma parameterized queries
5. **XSS**: Sanitize all user input before storage
6. **Rate Limiting**: Per-endpoint limits (see API section)
7. **Input Validation**: Joi schemas on all request bodies

```typescript
// Example validation schema
const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  dueDate: Joi.date().optional(),
  estimatedDuration: Joi.number().min(1).max(1440).optional(),
  priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').required(),
  category: Joi.string().max(50).optional(),
  source: Joi.string().valid('voice', 'manual', 'ai_suggested').required(),
});
```

### Sensitive Data Handling

**OpenAI API Key:**
- Stored in environment variable, never in code
- Never exposed to frontend
- Rotated every 90 days

**Database Connection:**
- Connection string in environment variable
- Use connection pooling (max: 20 connections)
- SSL required in production

**User Passwords:**
- Never stored in plaintext
- Hashed with bcrypt (cost factor: 12)
- Never included in API responses
- Password reset via email token (exp: 1 hour)

---

## 14. Performance Architecture

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| App Launch | < 2s to AI Home | Time to interactive |
| Voice Response | < 1.5s | Tap orb → AI response |
| Screen Transition | < 300ms | Swipe → new screen fully rendered |
| API Response | < 500ms p95 | All authenticated endpoints |
| AI Generation | < 2s | OpenAI response time |
| Event Logging | < 100ms | Async, non-blocking |

### Frontend Optimization

**Code Splitting:**
```typescript
// Lazy load non-core screens
const TaskDetail = lazy(() => import('./screens/modals/TaskDetail'));
const CircleHome = lazy(() => import('./screens/modals/CircleHome'));
const Settings = lazy(() => import('./screens/modals/Settings'));
```

**Memoization:**
```typescript
// Expensive AI Orb animations
const AIOrb = memo(({ state, onPress }) => {
  const animation = useMemo(
    () => getOrbAnimation(state),
    [state]
  );
  
  return <OrbView animation={animation} onPress={onPress} />;
});
```

**Virtualized Lists:**
```typescript
// Tasks list with FlatList
<FlatList
  data={tasks}
  renderItem={({ item }) => <TaskItem task={item} />}
  keyExtractor={(item) => item.id}
  windowSize={10}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: TASK_ITEM_HEIGHT,
    offset: TASK_ITEM_HEIGHT * index,
    index,
  })}
/>
```

**Image Optimization:**
```typescript
// Avatar images cached and compressed
<Image
  source={{ uri: user.avatarUrl }}
  style={styles.avatar}
  resizeMode="cover"
  cachePolicy="memory-disk"
/>
```

**State Management:**
```typescript
// Use Context + useReducer for complex state
// Zustand for simple global state
// React Query for server state + caching

import { useQuery } from '@tanstack/react-query';

const { data: tasks } = useQuery({
  queryKey: ['tasks', date],
  queryFn: () => api.getTasks(date),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});
```

### Backend Optimization

**Database Indexing:**
```prisma
// Already covered in schema, but critical indexes:
@@index([userId, timestamp]) // UserEvent
@@index([userId, type])       // UserEvent
@@index([userId, completed])  // Task
@@index([userId, dueDate])    // Task
```

**Query Optimization:**
```typescript
// Use select to fetch only needed fields
const tasks = await prisma.task.findMany({
  where: { userId, completed: false },
  select: {
    id: true,
    title: true,
    dueDate: true,
    priority: true,
    estimatedDuration: true,
  },
  orderBy: { dueDate: 'asc' },
});

// Use parallel queries with Promise.all
const [user, model, tasks, circles] = await Promise.all([
  prisma.user.findUnique({ where: { id: userId } }),
  prisma.userModel.findUnique({ where: { userId } }),
  prisma.task.findMany({ where: { userId } }),
  prisma.circle.findMany({ where: { members: { some: { userId } } } }),
]);
```

**Caching Strategy:**
```typescript
// Use Redis for frequently accessed data
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache user model for 5 minutes
async function getUserModel(userId: string): Promise<UserModel> {
  const cacheKey = `user_model:${userId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const model = await prisma.userModel.findUnique({
    where: { userId },
  });
  
  await redis.setex(cacheKey, 300, JSON.stringify(model));
  return model;
}
```

**Background Jobs:**
```typescript
// Use Bull for job queue
import Queue from 'bull';

const modelUpdateQueue = new Queue('model-updates', process.env.REDIS_URL);

// Schedule nightly updates
modelUpdateQueue.add(
  'update-all-users',
  {},
  {
    repeat: { cron: '0 3 * * *' }, // 3am daily
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 },
  }
);

modelUpdateQueue.process('update-all-users', async (job) => {
  await updateAllUserModels();
});
```

### Network Optimization

**Request Batching:**
```typescript
// Batch event logs every 10 seconds
class EventBatcher {
  private batch: UserEvent[] = [];
  private timer: NodeJS.Timeout | null = null;
  
  add(event: UserEvent) {
    this.batch.push(event);
    
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 10000);
    }
    
    if (this.batch.length >= 20) {
      this.flush();
    }
  }
  
  async flush() {
    if (this.batch.length === 0) return;
    
    const events = [...this.batch];
    this.batch = [];
    this.timer = null;
    
    await api.logEvents(events);
  }
}
```

**Response Compression:**
```typescript
// Enable gzip compression on backend
import compression from 'compression';
app.use(compression());
```

**CDN for Static Assets:**
- Host avatar images on Cloudflare CDN
- Host orb animations/sounds on CDN
- Use Expo's CDN for JS bundles

---

## 15. Offline Architecture

### Offline-First Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFLINE BEHAVIOR                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FULLY OFFLINE (No Network)                                     │
│  ├─ Show cached tasks, circles, challenges                     │
│  ├─ Allow task creation/editing (queued)                       │
│  ├─ Allow focus sessions (synced later)                        │
│  ├─ Voice commands disabled (show message)                     │
│  └─ AI greeting shows cached message                           │
│                                                                 │
│  PARTIALLY OFFLINE (Intermittent Network)                       │
│  ├─ Retry failed requests with exponential backoff            │
│  ├─ Queue mutations, sync when connected                       │
│  └─ Show "Syncing..." indicator                               │
│                                                                 │
│  BACK ONLINE                                                    │
│  ├─ Flush mutation queue (FIFO)                               │
│  ├─ Refresh all data                                           │
│  ├─ Resolve conflicts (server wins)                           │
│  └─ Show "Synced" confirmation                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Local Storage Schema

```typescript
// AsyncStorage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: '@mylo/auth_token',
  REFRESH_TOKEN: '@mylo/refresh_token',
  USER: '@mylo/user',
  
  TASKS_CACHE: '@mylo/tasks_cache',
  CIRCLES_CACHE: '@mylo/circles_cache',
  CHALLENGES_CACHE: '@mylo/challenges_cache',
  
  MUTATION_QUEUE: '@mylo/mutation_queue',
  LAST_SYNC: '@mylo/last_sync',
  
  AI_MESSAGE_CACHE: '@mylo/ai_message_cache',
  UNLOCKS_CACHE: '@mylo/unlocks_cache',
};

interface MutationQueueItem {
  id: string;
  type: 'create_task' | 'update_task' | 'delete_task' | 'complete_task' | 'start_focus' | 'end_focus';
  data: any;
  timestamp: Date;
  retries: number;
}
```

### Sync Logic

```typescript
class SyncManager {
  private queue: MutationQueueItem[] = [];
  private syncing = false;
  
  async addToQueue(mutation: Omit<MutationQueueItem, 'id' | 'timestamp' | 'retries'>) {
    const item: MutationQueueItem = {
      ...mutation,
      id: uuid(),
      timestamp: new Date(),
      retries: 0,
    };
    
    this.queue.push(item);
    await this.saveQueue();
    
    // Attempt immediate sync if online
    if (await this.isOnline()) {
      this.sync();
    }
  }
  
  async sync() {
    if (this.syncing) return;
    if (this.queue.length === 0) return;
    if (!(await this.isOnline())) return;
    
    this.syncing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue[0];
      
      try {
        await this.executeMutation(item);
        this.queue.shift(); // Remove from queue on success
        await this.saveQueue();
      } catch (error) {
        item.retries++;
        
        if (item.retries >= 3) {
          // Give up after 3 retries, log error
          console.error('Failed to sync mutation:', item, error);
          this.queue.shift();
          await this.saveQueue();
        } else {
          // Stop syncing, will retry later
          break;
        }
      }
    }
    
    this.syncing = false;
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }
  
  private async executeMutation(item: MutationQueueItem) {
    switch (item.type) {
      case 'create_task':
        return await api.createTask(item.data);
      case 'update_task':
        return await api.updateTask(item.data.id, item.data);
      case 'delete_task':
        return await api.deleteTask(item.data.id);
      case 'complete_task':
        return await api.completeTask(item.data.id);
      case 'start_focus':
        return await api.startFocus(item.data);
      case 'end_focus':
        return await api.endFocus(item.data.sessionId, item.data);
    }
  }
  
  private async isOnline(): Promise<boolean> {
    return NetInfo.fetch().then(state => state.isConnected);
  }
}
```

### Conflict Resolution

**Strategy: Server Always Wins**

```typescript
// When coming back online:
// 1. Sync mutations first (user's local changes)
// 2. Fetch fresh data from server
// 3. If conflicts, server data overwrites local

// Example: Task was edited offline, but deleted on server
try {
  await api.updateTask(taskId, changes);
} catch (error) {
  if (error.code === 'NOT_FOUND') {
    // Task was deleted, remove from local cache
    await removeFromCache(taskId);
  }
}
```

---

## 16. Error Handling & Resilience

### Error Boundaries

```typescript
// Root error boundary
class AppErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log to error tracking service
    Sentry.captureException(error, { extra: errorInfo });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    
    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// Unified error handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getToken()}`,
        ...options.headers,
      },
    });
    
    if (response.status === 401) {
      // Token expired, attempt refresh
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry original request
        return apiRequest(endpoint, options);
      } else {
        // Refresh failed, logout
        await logout();
        throw new AuthError('Session expired');
      }
    }
    
    if (response.status === 429) {
      // Rate limited
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(`Rate limited, retry after ${retryAfter}s`);
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error.message, error.code, response.status);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    if (error.message === 'Network request failed') {
      throw new NetworkError('No internet connection');
    }
    
    throw new UnknownError('Something went wrong', error);
  }
}
```

### Graceful Degradation

```typescript
// AI Features with Fallbacks
async function getAIGreeting(): Promise<string> {
  try {
    const response = await api.getAIGreeting();
    return response.message;
  } catch (error) {
    // Fallback to generic greeting
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return `Good ${timeOfDay}! Ready to tackle your tasks?`;
  }
}

// Voice Commands with Fallback
async function processVoiceCommand(command: string): Promise<string> {
  try {
    const response = await api.processVoiceCommand(command);
    return response.message;
  } catch (error) {
    // Fallback to rule-based parsing
    return parseCommandLocally(command);
  }
}
```

### Retry Logic

```typescript
// Exponential backoff retry
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

---

## 17. Gesture System Technical Details

### Gesture Configuration

```typescript
// Gesture thresholds and constants
const GESTURE_CONFIG = {
  // Distance thresholds (pixels)
  SWIPE_THRESHOLD: 100,          // Minimum swipe distance to trigger
  PEEK_THRESHOLD: 30,            // Distance to show peek of next screen
  CANCEL_THRESHOLD: 50,          // Return to center if less than this
  
  // Velocity thresholds (pixels/second)
  MIN_VELOCITY: 200,             // Minimum velocity for quick swipe
  FLING_VELOCITY: 1000,          // High velocity = instant transition
  
  // Animation timing
  SPRING_CONFIG: {
    damping: 20,
    mass: 0.8,
    stiffness: 150,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  
  // Haptic feedback
  HAPTIC_LIGHT: 'light',         // Start of swipe
  HAPTIC_MEDIUM: 'medium',       // Complete swipe
  HAPTIC_HEAVY: 'heavy',         // Tap orb
  HAPTIC_ERROR: 'notificationError',
  
  // Edge detection
  EDGE_MARGIN: 20,               // Pixels from edge for swipe hints
  EDGE_SWIPE_ENABLED: true,      // Allow swipe from screen edge
};
```

### Gesture State Machine

```typescript
type GestureState = 
  | 'idle'
  | 'peeking_left'      // Showing preview of Tasks
  | 'peeking_right'     // Showing preview of Social
  | 'peeking_up'        // Showing preview of Focus
  | 'peeking_down'      // Showing preview of Profile
  | 'transitioning'     // Mid-swipe animation
  | 'settled';          // Completed transition

interface GestureContext {
  currentScreen: 'ai_home' | 'tasks' | 'social' | 'profile';
  targetScreen: 'ai_home' | 'tasks' | 'social' | 'profile' | null;
  translationX: number;
  translationY: number;
  velocityX: number;
  velocityY: number;
}
```

### Simultaneous Gesture Handling

```typescript
// Only allow one gesture at a time
const panGesture = Gesture.Pan()
  .maxPointers(1)
  .onBegin(() => {
    'worklet';
    // Lock orientation based on initial movement
  })
  .onUpdate((e) => {
    'worklet';
    if (gestureDirection.value === null) {
      // Determine direction on first move
      const isHorizontal = Math.abs(e.translationX) > Math.abs(e.translationY);
      gestureDirection.value = isHorizontal ? 'horizontal' : 'vertical';
    }
    
    // Only update relevant axis
    if (gestureDirection.value === 'horizontal') {
      translateX.value = e.translationX;
      translateY.value = 0;
    } else {
      translateX.value = 0;
      translateY.value = e.translationY;
    }
  })
  .onEnd((e) => {
    'worklet';
    gestureDirection.value = null; // Reset for next gesture
  });
```

### Peek Indicators

```typescript
// Visual hints showing edge of adjacent screens
function SwipeHint({ direction }: { direction: 'left' | 'right' | 'up' | 'down' }) {
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    // Fade in/out hint after 3 seconds
    opacity.value = withSequence(
      withDelay(1000, withTiming(1, { duration: 300 })),
      withDelay(3000, withTiming(0, { duration: 300 }))
    );
  }, []);
  
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{
      translateX: direction === 'left' ? -10 : direction === 'right' ? 10 : 0,
      translateY: direction === 'up' ? -10 : direction === 'down' ? 10 : 0,
    }],
  }));
  
  return (
    <Animated.View style={[styles.hint, style]}>
      <Icon name={getArrowIcon(direction)} size={24} color="#fff" />
    </Animated.View>
  );
}
```

---

## 18. AI Orb Technical Details

### Orb State Machine

```typescript
type OrbState = 
  | 'idle'          // Gentle pulsing animation
  | 'listening'     // Recording voice input
  | 'processing'    // Sending to AI
  | 'speaking'      // Playing AI response
  | 'thinking'      // Short animation before speaking
  | 'celebrating'   // Unlock animation
  | 'error';        // Error occurred

interface OrbAnimation {
  scale: Animated.SharedValue<number>;
  rotation: Animated.SharedValue<number>;
  opacity: Animated.SharedValue<number>;
  color: Animated.SharedValue<string>;
  particles: ParticleSystem;
}
```

### Orb Animations

```typescript
// Idle state: gentle pulsing
function idleAnimation(scale: SharedValue<number>) {
  'worklet';
  return withRepeat(
    withSequence(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
    ),
    -1,  // infinite
    false
  );
}

// Listening state: voice wave animation
function listeningAnimation(waveAmplitude: SharedValue<number[]>) {
  'worklet';
  // Array of 8 bars that react to audio input
  return waveAmplitude.value.map((amp, i) => ({
    height: withSpring(amp * 100, { damping: 10 }),
    delay: i * 50,
  }));
}

// Processing state: spinning
function processingAnimation(rotation: SharedValue<number>) {
  'worklet';
  return withRepeat(
    withTiming(360, { duration: 1500, easing: Easing.linear }),
    -1,
    false
  );
}

// Speaking state: pulsing with audio
function speakingAnimation(scale: SharedValue<number>, audioLevel: SharedValue<number>) {
  'worklet';
  return withTiming(1.0 + (audioLevel.value * 0.1), {
    duration: 100,
    easing: Easing.out(Easing.ease),
  });
}

// Celebrating state: burst effect
function celebratingAnimation(particles: ParticleSystem) {
  'worklet';
  particles.burst({
    count: 30,
    speed: 200,
    lifespan: 1000,
    colors: ['#FFD700', '#FFA500', '#FF6347'],
  });
}
```

### Particle System for Celebrations

```typescript
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

class ParticleSystem {
  private particles: Particle[] = [];
  
  burst(config: {
    count: number;
    speed: number;
    lifespan: number;
    colors: string[];
  }) {
    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count;
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * config.speed,
        vy: Math.sin(angle) * config.speed,
        life: config.lifespan,
        color: config.colors[i % config.colors.length],
      });
    }
  }
  
  update(deltaTime: number) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      return p.life > 0;
    });
  }
}
```

### Mini Orb (Compact Version)

```typescript
// Smaller orb for Tasks/Social screens
function MiniOrb({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Scale animation
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1.0, { duration: 100 })
    );
    
    onPress();
  };
  
  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.miniOrb, animatedStyle]}>
        <MicIcon size={20} color="#fff" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  miniOrb: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
```

---

## 19. Testing Strategy

### Unit Tests

```typescript
// Test unlock eligibility logic
describe('UnlockService', () => {
  it('should unlock peak_hours after 7 days and 10 completions', async () => {
    const user = await createTestUser({
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    });
    
    await createTestEvents(user.id, 'task_completed', 10);
    
    await checkAndTriggerUnlocks(user.id);
    
    const unlocks = await getUnlocks(user.id);
    expect(unlocks).toContainEqual(
      expect.objectContaining({ feature: 'peak_hours' })
    );
  });
});

// Test intent parsing
describe('IntentParser', () => {
  it('should parse "add task buy groceries" as add_task intent', async () => {
    const intent = await parseIntent('add task buy groceries');
    
    expect(intent).toEqual({
      type: 'add_task',
      taskTitle: 'buy groceries',
      taskPriority: 'MEDIUM', // default
    });
  });
  
  it('should parse "what do I have today" as query intent', async () => {
    const intent = await parseIntent('what do I have today');
    
    expect(intent).toEqual({
      type: 'query',
      queryType: 'tasks_today',
    });
  });
});
```

### Integration Tests

```typescript
// Test voice command end-to-end
describe('Voice Command Flow', () => {
  it('should create task from voice command', async () => {
    const user = await createTestUser();
    const token = generateToken(user.id);
    
    const response = await request(app)
      .post('/api/ai/voice-command')
      .set('Authorization', `Bearer ${token}`)
      .send({ command: 'add task buy groceries' });
    
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('added');
    expect(response.body.action.type).toBe('create_task');
    
    const tasks = await getTasks(user.id);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('buy groceries');
  });
});
```

### E2E Tests

```typescript
// Test gesture navigation
describe('Gesture Navigation', () => {
  it('should navigate to Tasks view on swipe left', async () => {
    await device.launchApp();
    await element(by.id('ai-home')).swipe('left', 'fast');
    await expect(element(by.id('tasks-view'))).toBeVisible();
  });
  
  it('should open focus modal on swipe up', async () => {
    await device.launchApp();
    await element(by.id('ai-home')).swipe('up', 'fast');
    await expect(element(by.id('focus-modal'))).toBeVisible();
  });
});

// Test voice flow
describe('Voice Interaction', () => {
  it('should process voice command and update UI', async () => {
    await device.launchApp();
    await element(by.id('ai-orb')).tap();
    await expect(element(by.text('Listening...'))).toBeVisible();
    
    // Simulate voice input (mocked in test)
    await mockVoiceInput('add task buy groceries');
    
    await waitFor(element(by.text(/added/i)))
      .toBeVisible()
      .withTimeout(3000);
  });
});
```

### Performance Tests

```typescript
// Measure app launch time
test('App launches in under 2 seconds', async () => {
  const startTime = Date.now();
  await device.launchApp();
  await waitFor(element(by.id('ai-home'))).toBeVisible();
  const launchTime = Date.now() - startTime;
  
  expect(launchTime).toBeLessThan(2000);
});

// Measure voice response time
test('Voice response in under 1.5 seconds', async () => {
  await device.launchApp();
  await element(by.id('ai-orb')).tap();
  
  const startTime = Date.now();
  await mockVoiceInput('what do I have today');
  await waitFor(element(by.id('ai-response'))).toBeVisible();
  const responseTime = Date.now() - startTime;
  
  expect(responseTime).toBeLessThan(1500);
});
```

---

## 20. Deployment Architecture

### Production Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLIENT (Mobile App)                                            │
│     ↓                                                           │
│  CLOUDFLARE CDN                                                 │
│     ↓                                                           │
│  LOAD BALANCER (AWS ALB)                                        │
│     ↓                                                           │
│  API SERVERS (AWS ECS / 3 instances)                            │
│     ├─ Express.js                                              │
│     ├─ Socket.io                                               │
│     └─ Rate limiting                                            │
│     ↓                                                           │
│  DATABASE (AWS RDS PostgreSQL)                                  │
│     ├─ Primary (write)                                         │
│     └─ Read replica                                            │
│     ↓                                                           │
│  CACHE (AWS ElastiCache Redis)                                  │
│     ├─ Session storage                                         │
│     └─ User model cache                                        │
│     ↓                                                           │
│  BACKGROUND JOBS (AWS ECS / Bull queue)                         │
│     ├─ Nightly model updates                                   │
│     ├─ Email notifications                                     │
│     └─ Analytics aggregation                                   │
│     ↓                                                           │
│  STORAGE (AWS S3)                                               │
│     ├─ User avatars                                            │
│     └─ Export files                                            │
│                                                                 │
│  MONITORING                                                     │
│     ├─ Sentry (errors)                                         │
│     ├─ DataDog (metrics)                                       │
│     └─ CloudWatch (logs)                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Configuration

**Development:**
```env
NODE_ENV=development
API_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/mylo_dev
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
```

**Staging:**
```env
NODE_ENV=staging
API_URL=https://staging-api.mylo.app
DATABASE_URL=postgresql://staging-db.aws:5432/mylo_staging
REDIS_URL=redis://staging-cache.aws:6379
OPENAI_API_KEY=sk-...
SENTRY_DSN=https://...
```

**Production:**
```env
NODE_ENV=production
API_URL=https://api.mylo.app
DATABASE_URL=postgresql://prod-db.aws:5432/mylo_prod
REDIS_URL=redis://prod-cache.aws:6379
OPENAI_API_KEY=sk-...
SENTRY_DSN=https://...
DD_API_KEY=...
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd backend
          npm install
          npm test
          cd ../frontend
          npm install
          npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker image
        run: docker build -t mylo-api:${{ github.sha }} ./backend
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker tag mylo-api:${{ github.sha }} $ECR_REGISTRY/mylo-api:latest
          docker push $ECR_REGISTRY/mylo-api:latest
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster mylo-prod --service api --force-new-deployment

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build iOS
        run: |
          cd frontend
          eas build --platform ios --profile production
      - name: Build Android
        run: |
          cd frontend
          eas build --platform android --profile production
      - name: Submit to App Store
        run: eas submit --platform ios --latest
      - name: Submit to Play Store
        run: eas submit --platform android --latest
```

### Database Migrations

```bash
# Run migrations on deploy
npm run migrate:prod

# Rollback if needed
npm run migrate:rollback
```

### Monitoring & Alerts

```typescript
// Sentry error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// DataDog metrics
import { StatsD } from 'node-statsd';
const metrics = new StatsD({
  host: process.env.DD_AGENT_HOST,
  port: 8125,
});

// Track API latency
metrics.histogram('api.latency', responseTime, { route: '/api/tasks' });

// Track AI calls
metrics.increment('ai.voice_command', { success: true });

// Track unlocks
metrics.increment('unlocks.triggered', { feature: 'peak_hours' });
```

### Backup Strategy

```bash
# Daily automated backups
0 2 * * * /usr/local/bin/backup-db.sh

# backup-db.sh
#!/bin/bash
DATE=$(date +%Y-%m-%d)
pg_dump $DATABASE_URL | gzip > s3://mylo-backups/db-$DATE.sql.gz

# Retain 30 days of daily backups
# Retain 12 months of monthly backups
```

---

## Summary

### What Changed

| Old (Tab-Based) | New (Gesture-Based) |
|-----------------|---------------------|
| 5 tabs + 16 screens = 21 total | 4 swipe zones + 6 modals = 10 total |
| AI is a tab ("Talk") | AI is home (center) |
| Voice-only input | Voice OR text (dual input) |
| Features compete for attention | AI is always the focus |
| Time-locked unlocks | Hybrid unlock (time OR milestones) |
| No calendar awareness | Calendar integration |
| No recurring tasks | Full recurrence support |
| App-only access | Widgets + Siri + Share extension |
| Wait for AI response | Streaming AI responses |
| Online-only voice | Offline voice fallback |

### Core Features Summary

| Feature | Description | Day Available |
|---------|-------------|---------------|
| Dual Input | Voice OR text, both first-class | Day 1 |
| Gesture Navigation | Swipe-based, no tab bar | Day 1 |
| Calendar Sync | Device calendar in Tasks view | Day 1 |
| Recurring Tasks | Daily/weekly/monthly | Day 1 |
| iOS Widgets | Lock screen + home screen | Day 1 |
| Quick Capture | Siri + Share extension + 3D Touch | Day 1 |
| Daily Brief | Morning & evening notifications | Day 1 |
| AI Streaming | See words as AI generates | Day 1 |
| Offline Voice | Basic commands without internet | Day 1 |
| Smart Priority | Auto-detect from language | Day 1 |
| Celebrations | Micro-rewards & milestones | Day 1 |
| Peak Hours | Best productivity times | Day 7 OR 10 tasks |
| Predictive Mode | AI anticipates struggles | Day 30 OR 50 tasks |

### Screen Count: 10

| Core (4) | Modals (6) |
|----------|------------|
| AI Home (center) | Focus Session |
| Tasks View (left) | Task Detail |
| Social View (right) | Circle Home |
| Profile View (down) | Challenge Detail |
| | Settings |
| | Unlock Celebration |

### Gestures

| Direction | From Center | From View |
|-----------|-------------|-----------|
| ← Left | Tasks View | - |
| → Right | Social View | AI Home |
| ↑ Up | Focus Modal | - |
| ↓ Down | Profile View | AI Home |
| Tap Orb | Voice Mode | Voice Mode |
| Type | Text input | Text input |

### Hybrid Unlock Timeline

| Day | OR Milestone | Features |
|-----|--------------|----------|
| 1 | — | Voice/text, tasks, focus, circles, widgets |
| 3 | 5 app opens | Personalized greetings |
| 7 | 10 completions | Peak hours, task sorting, weekly comparison |
| 14 | 20 focus sessions | Duration estimation, completion patterns |
| 30 | 50 tasks | Predictive mode, overwhelm detection |

### Phase Summary (What’s in Each Phase)

**Phase 1 — Core Gesture Navigation (Week 1–2)**
- GestureNavigator with swipe directions (left/right/down/up)
- Haptic feedback + visual peek indicators + swipe hints
- AI Home screen foundation (AI Orb states + context cards)
- Tap-to-talk baseline interaction (no personalization yet)

**Phase 2 — Data Views (Week 3–4)**
- Tasks View + mini orb + task list UI
- Social View (circles + challenges) + mini orb
- Profile View with stats + unlock progress
- Focus Session modal with timer + voice control

**Phase 3 — AI Voice System (Week 5–6)**
- Speech-to-text capture + intent parsing
- Task command execution (add/complete/delete)
- Action commands (start/stop focus)
- Text-to-speech responses + conversation history
- AI fallback for complex commands

**Phase 4 — Learning + Unlocks (Week 7–8)**
- Event logging for all key actions
- UserModel schema + nightly pattern batch jobs
- Unlock eligibility checks + celebration modal
- Personalized prompts using unlocked data

**Phase 5 — Learning + Unlocks (Week 9–10)**
- Event logging for all key actions
- UserModel schema + nightly pattern batch jobs
- Hybrid unlock eligibility (time OR milestones)
- Celebration modal for unlocks

**Phase 6 — Polish (Week 11)**
- Orb/gesture animation refinement + haptic tuning
- Error handling, offline behavior, and fallbacks
- Performance optimizations + QA + bug fixes

### Timeline: 11 weeks total

### Market Positioning

**Target:** People who feel overwhelmed by life's demands — particularly ADHD, anxiety, executive function challenges.

**Taglines:**
- "The productivity app for overwhelmed minds"
- "Your ADHD-friendly task assistant"
- "Finally, a to-do list that understands you"

**Differentiation:** Not another task manager. An AI companion that learns your patterns, detects when you're drowning, and helps you focus on what matters.

---

*Document Version: 2.1*
*Updated: February 2026*
*Change: Added comprehensive technical details for API, security, performance, offline, error handling, gestures, AI orb, testing, and deployment*
