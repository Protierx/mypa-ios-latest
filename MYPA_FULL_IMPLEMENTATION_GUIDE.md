# MYPA/Mylo - Complete Codebase Audit

> **Generated**: February 3, 2026  
> **Purpose**: Comprehensive inventory of all functions, screens, components, modals, services, and interactions

---

## 📱 TABLE OF CONTENTS

1. [Frontend Screens](#1-frontend-screens)
2. [Frontend Components](#2-frontend-components)
3. [Frontend Services](#3-frontend-services)
4. [Frontend Contexts & Hooks](#4-frontend-contexts--hooks)
5. [Backend Routes](#5-backend-routes)
6. [Backend Services](#6-backend-services)
7. [Modals Inventory](#7-modals-inventory)
8. [Filter & Tab Systems](#8-filter--tab-systems)
9. [Missing Features for Production](#9-missing-features-for-production)
10. [Interaction Audit](#10-interaction-audit)

---

## 1. FRONTEND SCREENS

### 1.1 Main Navigation Screens

| Screen | File | Function | Purpose |
|--------|------|----------|---------|
| **AIHomeScreen** | `screens/AIHome/index.tsx` | `AIHomeScreen()` | Central AI assistant screen with orb, greeting, quick actions |
| **HubScreen** | `screens/Hub/index.tsx` | `HubScreen()` | Main dashboard with tasks, stats, briefing |
| **GestureTasksView** | `screens/GestureTasks/index.tsx` | `GestureTasksView()` | Tasks view accessible via swipe left |
| **GestureSocialView** | `screens/GestureSocial/index.tsx` | `GestureSocialView()` | Social/circles view via swipe right |
| **GestureProfileView** | `screens/GestureProfile/index.tsx` | `GestureProfileView()` | Profile view via swipe down |
| **FocusModal** | `screens/FocusModal/index.tsx` | `FocusModal()` | Focus session modal via swipe up |

### 1.2 Authentication Screens

| Screen | File | Function | Purpose |
|--------|------|----------|---------|
| **LoginScreen** | `screens/Login/index.tsx` | `LoginScreen()` | Login/Register with email/password |
| **OnboardingScreen** | `screens/Onboarding/index.tsx` | `OnboardingScreen()` | Brain dump onboarding flow |
| **EnhancedOnboarding** | `screens/Onboarding/EnhancedOnboarding.tsx` | - | Alternative onboarding variant |

### 1.3 Task Management Screens

| Screen | File | Function | Purpose |
|--------|------|----------|---------|
| **TasksScreen** | `screens/Tasks/index.tsx` | `TasksScreen()` | Full task management view |
| **TaskSortingScreen** | `screens/TaskSorting/index.tsx` | `TaskSortingScreen()` | AI-powered task sorting/prioritization |
| **RecurringTasksScreen** | `screens/RecurringTasks/index.tsx` | `RecurringTasksScreen()` | Manage recurring tasks |
| **PlanScreen** | `screens/Plan/index.tsx` | `PlanScreen()` | Daily/weekly planning view |

### 1.4 Social & Circles Screens

| Screen | File | Function | Purpose |
|--------|------|----------|---------|
| **CirclesScreen** | `screens/Circle/Circles/index.tsx` | `CirclesScreen()` | List all circles |
| **CircleHomeScreen** | `screens/Circle/CircleHome/index.tsx` | `CircleHomeScreen()` | Single circle detail view |
| **ChallengesScreen** | `screens/Challenges/index.tsx` | `ChallengesScreen()` | View and join challenges |
| **InboxScreen** | `screens/Inbox/index.tsx` | `InboxScreen()` | Assignments and invitations inbox |

### 1.5 Profile & Settings Screens

| Screen | File | Function | Purpose |
|--------|------|----------|---------|
| **ProfileScreen** | `screens/Profile/index.tsx` | `ProfileScreen()` | User profile overview |
| **EditProfileScreen** | `screens/EditProfile/index.tsx` | `EditProfileScreen()` | Edit profile details |
| **SettingsScreen** | `screens/Settings/index.tsx` | `SettingsScreen()` | App settings |
| **PrivacyControlsScreen** | `screens/PrivacyControls/index.tsx` | `PrivacyControlsScreen()` | Privacy settings |

### 1.6 Analytics & Progress Screens

| Screen | File | Function | Purpose |
|--------|------|----------|---------|
| **AnalyticsScreen** | `screens/Analytics/index.tsx` | `AnalyticsScreen()` | Productivity analytics |
| **LevelScreen** | `screens/Level/index.tsx` | `LevelScreen()` | XP and level progress |
| **StreakScreen** | `screens/Streak/index.tsx` | `StreakScreen()` | Streak tracking |
| **WalletScreen** | `screens/Wallet/index.tsx` | `WalletScreen()` | Time saved / rewards wallet |

### 1.7 AI & Voice Screens

| Screen | File | Function | Purpose |
|--------|------|----------|---------|
| **VoiceAssistantScreen** | `screens/VoiceAssistant/index.tsx` | `VoiceAssistantScreen()` | Full voice assistant interface |
| **ListeningScreen** | `screens/Listening/index.tsx` | `ListeningScreen()` | Voice input modal |
| **AIInsightsScreen** | `screens/AIInsights/index.tsx` | `AIInsightsScreen()` | AI-generated insights |
| **DailyBriefingScreen** | `screens/DailyBriefing/index.tsx` | `DailyBriefingScreen()` | Daily AI briefing |

### 1.8 Utility Screens

| Screen | File | Function | Purpose |
|--------|------|----------|---------|
| **NotificationsScreen** | `screens/Notification/Notifications/index.tsx` | `NotificationsScreen()` | Notification list |
| **NotificationSettingsScreen** | `screens/Notification/NotificationSettings/index.tsx` | `NotificationSettingsScreen()` | Notification preferences |
| **HelpSupportScreen** | `screens/HelpSupport/index.tsx` | `HelpSupportScreen()` | Help & support |
| **ResetScreen** | `screens/Reset/index.tsx` | `ResetScreen()` | Mental reset/breathing |
| **SavedPlacesScreen** | `screens/SavedPlaces/index.tsx` | `SavedPlacesScreen()` | Location management |
| **IntegrationsScreen** | `screens/Integrations/index.tsx` | - | Calendar integrations |
| **SubscriptionScreen** | `screens/Subscription/index.tsx` | `SubscriptionScreen()` | Premium subscription |
| **DailyLifeCardScreen** | `screens/DailyLifeCard/index.tsx` | `DailyLifeCardScreen()` | Daily summary card |

### 1.9 Proof/Camera Screens

| Screen | File | Function | Purpose |
|--------|------|----------|---------|
| **ProofCameraScreen** | `screens/Proof/ProofCamera/index.tsx` | `ProofCameraScreen()` | Camera for proof photos |
| **ProofConfirmScreen** | `screens/Proof/ProofConfirm/index.tsx` | `ProofConfirmScreen()` | Confirm proof submission |

---

## 2. FRONTEND COMPONENTS

### 2.1 Core UI Components (`components/ui/`)

| Component | Purpose |
|-----------|---------|
| `Accordion.tsx` | Collapsible content sections |
| `Alert.tsx` | Alert/notification display |
| `Avatar.tsx` | User avatar display |
| `Badge.tsx` | Status/count badges |
| `Button.tsx` | Standard button component |
| `Card.tsx` | Card container |
| `Checkbox.tsx` | Checkbox input |
| `Dialog.tsx` | Modal dialog |
| `Input.tsx` | Text input field |
| `InputOTP.tsx` | OTP input field |
| `Label.tsx` | Form labels |
| `Progress.tsx` | Progress bar |
| `RadioGroup.tsx` | Radio button group |
| `Select.tsx` | Dropdown select |
| `Separator.tsx` | Visual separator |
| `Sheet.tsx` | Bottom sheet |
| `Skeleton.tsx` | Loading skeleton |
| `Slider.tsx` | Slider input |
| `Switch.tsx` | Toggle switch |
| `Table.tsx` | Data table |
| `Tabs.tsx` | Tab navigation |
| `Textarea.tsx` | Multi-line text input |
| `Toast.tsx` | Toast notifications |
| `Toggle.tsx` | Toggle button |
| `ToggleGroup.tsx` | Toggle button group |
| `Tooltip.tsx` | Tooltip display |

### 2.2 Main Application Components

| Component | File | Purpose |
|-----------|------|---------|
| **AIOrb** | `components/AIOrb/index.tsx` | Animated AI assistant orb |
| **MYPAOrb** | `components/MYPAOrb.tsx` | Alternative orb design |
| **DualInputBar** | `components/DualInputBar.tsx` | Voice + text input bar |
| **VoicePill** | `components/VoicePill.tsx` | Voice input indicator |
| **QuickCapture** | `components/QuickCapture.tsx` | Quick task capture |
| **TabBar** | `components/TabBar.tsx` | Bottom tab navigation |
| **DailyBriefingCard** | `components/DailyBriefingCard.tsx` | Briefing display card |
| **MissionCard** | `components/MissionCard.tsx` | Mission/challenge card |
| **AnimatedCard** | `components/AnimatedCard.tsx` | Animated card wrapper |
| **CelebrationOverlay** | `components/CelebrationOverlay.tsx` | Achievement celebration |
| **ErrorBoundary** | `components/ErrorBoundary.tsx` | React error boundary |
| **FloatingMYPAButton** | `components/FloatingMYPAButton.tsx` | Floating action button |
| **IOSStatusBar** | `components/IOSStatusBar.tsx` | iOS status bar wrapper |
| **LoadingOverlay** | `components/LoadingOverlay.tsx` | Full-screen loading |
| **ToggleSwitch** | `components/ToggleSwitch.tsx` | Custom toggle switch |

### 2.3 Share Components

| Component | File | Purpose |
|-----------|------|---------|
| **ShareModal** | `components/ShareModal/index.tsx` | Content sharing modal |

### 2.4 Unlock Components

| Component | File | Purpose |
|-----------|------|---------|
| **UnlockCelebration** | `components/Unlock/UnlockCelebration.tsx` | Feature unlock celebration |
| **UnlockProgressCard** | `components/Unlock/UnlockProgressCard.tsx` | Progress toward unlock |
| **UnlockTimeline** | `components/Unlock/UnlockTimeline.tsx` | Unlock timeline view |

### 2.5 Screen-Specific Components

#### AIInsights Components
- `BrainCard.tsx` - Brain visualization
- `EmptyState.tsx` - Empty insights state
- `InsightCard.tsx` - Individual insight
- `InsightsList.tsx` - Insights list
- `QuickActions.tsx` - Quick action buttons
- `StatsSnapshot.tsx` - Stats overview
- `SuggestionCard.tsx` - AI suggestion
- `SuggestionsList.tsx` - Suggestions list

#### Analytics Components
- `CategoryBreakdown.tsx` - Category statistics
- `Header.tsx` - Screen header
- `LevelProgress.tsx` - Level progress bar
- `LifetimeStats.tsx` - All-time statistics
- `Milestones.tsx` - Achievement milestones
- `PeakHours.tsx` - Peak productivity hours
- `PeriodSelector.tsx` - Time period selector
- `SummaryCards.tsx` - Summary cards
- `TrendChart.tsx` - Trend visualization

#### Challenges Components
- `ChallengeCard.tsx` - Challenge display
- `ChallengesHeader.tsx` - Header
- `IconRenderer.tsx` - Dynamic icon rendering
- `StatsBanner.tsx` - Challenge stats
- `TabBar.tsx` - Filter tabs

#### Circle/CircleHome Components
- `AssignmentCard.tsx` - Assignment display
- `ChallengeCard.tsx` - Circle challenge
- `CircleActivityCard.tsx` - Activity feed item
- `MemberList.tsx` - Member display
- `PostCard.tsx` - Social post

#### Circle/Circles Components
- `CircleCard.tsx` - Circle list item
- `CirclesHeader.tsx` - Header
- `EmptyState.tsx` - No circles state
- `SearchFilter.tsx` - Search/filter
- `StatsRow.tsx` - Stats display

#### DailyBriefing Components
- `BriefingHeader.tsx` - Header
- `InsightsCard.tsx` - Daily insights
- `MissionsCard.tsx` - Today's missions
- `PriorityFocus.tsx` - Priority display
- `ProductivityScoreCard.tsx` - Score display
- `QuickActions.tsx` - Quick actions
- `QuoteCard.tsx` - Motivational quote
- `TodaysSchedule.tsx` - Schedule view
- `WeeklyProgress.tsx` - Week progress

#### EditProfile Components
- `AvatarSection.tsx` - Avatar upload
- `BasicInfoSection.tsx` - Name, username
- `ContactInfoSection.tsx` - Email, phone
- `DangerZone.tsx` - Delete account
- `Header.tsx` - Header
- `SecuritySection.tsx` - Password change
- `SuccessToast.tsx` - Save confirmation

#### HelpSupport Components
- `ContactCard.tsx` - Contact method card
- `FAQSection.tsx` - FAQ display
- `Header.tsx` - Header
- `QuickContactGrid.tsx` - Contact options
- `ResourcesSection.tsx` - Help resources
- `ResponseTime.tsx` - Response time display
- `SearchBar.tsx` - FAQ search

#### Hub Components
- `BriefingBanner.tsx` - Briefing display
- `BriefingModal.tsx` - Full briefing modal
- `DaySummaryModal.tsx` - Day summary
- `FloatingActionButton.tsx` - FAB
- `HubLoadingState.tsx` - Loading state
- `QuickActions.tsx` - Quick actions
- `StatCards.tsx` - Stats display
- `TaskCard.tsx` - Task item
- `UpcomingEventBanner.tsx` - Event notification

#### Inbox Components
- `AnimatedComponents.tsx` - Animations
- `AssignmentCard.tsx` - Assignment item
- `EmptyState.tsx` - Empty inbox
- `InboxHeader.tsx` - Header
- `NotificationCard.tsx` - Notification item
- `SelectionHeader.tsx` - Multi-select header

#### Level Components
- `Header.tsx` - Header
- `LevelRewardsSection.tsx` - Level rewards
- `MainCard.tsx` - Level display
- `RankProgression.tsx` - Rank progress
- `RecentXPSection.tsx` - XP history

#### Listening Components
- `Controls.tsx` - Audio controls
- `Header.tsx` - Header
- `OrbSection.tsx` - Listening orb
- `TextInputBar.tsx` - Text input
- `TranscriptsList.tsx` - Transcripts

#### Login Components
- `LoginForm.tsx` - Login form
- `Logo.tsx` - App logo
- `TestAccounts.tsx` - Dev test accounts

#### NotificationSettings Components
- `CategorySection.tsx` - Notification categories
- `DeliveryOptionsSection.tsx` - Push/email settings
- `QuietHoursSection.tsx` - Quiet hours
- `SettingRow.tsx` - Setting toggle row
- `StatusCard.tsx` - Permission status
- `TestNotificationCard.tsx` - Test button

#### Plan Components
- `AddedBanner.tsx` - Task added banner
- `CalendarEventsCard.tsx` - Calendar events
- `EmptyState.tsx` - Empty plan
- `FocusCard.tsx` - Focus session card
- `NextFocusCard.tsx` - Next focus display
- `PlanHeader.tsx` - Header
- `ProgressCard.tsx` - Progress display
- `SwipeableTask.tsx` - Swipeable task item

#### PrivacyControls Components
- `AdditionalSettings.tsx` - Extra settings
- `CircleSettings.tsx` - Circle privacy
- `DataPermissions.tsx` - Data permissions
- `Header.tsx` - Header
- `InfoCard.tsx` - Info display
- `PrivacyModeSelector.tsx` - Privacy mode
- `Toggle.tsx` - Privacy toggle

#### Profile Components
- `AchievementsButton.tsx` - Achievements access
- `LogoutButton.tsx` - Logout button
- `SettingsCard.tsx` - Settings access
- `StatsRow.tsx` - Stats display
- `UserCard.tsx` - User info card

#### ProofCamera Components
- `CameraControls.tsx` - Camera buttons
- `CameraPreview.tsx` - Camera view
- `Header.tsx` - Header

#### ProofConfirm Components
- `ActionButtons.tsx` - Confirm/retry
- `Header.tsx` - Header
- `ImagePreview.tsx` - Photo preview
- `TaskCard.tsx` - Task context

#### Reset Components
- `BreatheView.tsx` - Breathing animation
- `Header.tsx` - Header
- `InputBar.tsx` - Text input
- `MessageList.tsx` - Messages
- `QuickPrompts.tsx` - Quick prompts

#### SavedPlaces Components
- `AddPlaceButton.tsx` - Add place
- `Header.tsx` - Header
- `PlaceCard.tsx` - Place item
- `SearchBar.tsx` - Place search

#### Settings Components
- `DangerZone.tsx` - Delete account
- `Header.tsx` - Header
- `ProfileCard.tsx` - Profile summary
- `SettingsSection.tsx` - Settings group
- `VersionInfo.tsx` - App version

#### Streak Components
- `ActivityCalendar.tsx` - Calendar view
- `BenefitsSection.tsx` - Streak benefits
- `Header.tsx` - Header
- `MainCard.tsx` - Streak display
- `MilestonesSection.tsx` - Milestones

#### Tasks Components
- `FilterTabs.tsx` - Task filters
- `Header.tsx` - Header
- `SearchBar.tsx` - Task search
- `StatsRow.tsx` - Task stats
- `TaskCard.tsx` - Task item
- `TasksList.tsx` - Task list

#### TaskSorting Components
- `EmptyState.tsx` - No tasks
- `TaskCard.tsx` - Sortable task

#### VoiceAssistant Components
- `Header.tsx` - Header
- `InputBar.tsx` - Input bar
- `MessagesList.tsx` - Message history
- `VoiceOrb.tsx` - Voice orb

#### Wallet Components
- `HowItWorksCard.tsx` - Explanation
- `MilestonesCard.tsx` - Milestones
- `PeriodSelector.tsx` - Period filter
- `QuickAccessRow.tsx` - Quick actions
- `RecentSavingsSection.tsx` - Recent saves
- `StatsGrid.tsx` - Stats grid
- `TimeCard.tsx` - Time saved card
- `WalletHeader.tsx` - Header
- `WeeklyChart.tsx` - Weekly chart
- `XPCard.tsx` - XP display

---

## 3. FRONTEND SERVICES

### 3.1 API Service (`services/api.ts`)

**Core Functions:**
- `api.get()` - GET request
- `api.post()` - POST request
- `api.patch()` - PATCH request
- `api.put()` - PUT request
- `api.delete()` - DELETE request
- `api.setTokens()` - Store auth tokens
- `api.clearTokens()` - Clear auth tokens
- `api.isAuthenticated()` - Check auth status

**Auth API (`authApi`):**
- `register(email, password, name)`
- `login(email, password)`
- `logout()`
- `getStoredUser()`

**User API (`userApi`):**
- `getProfile()`
- `updateProfile(data)`
- `getStats()`
- `getSettings()`
- `updateSettings(data)`
- `completeOnboarding()`

**Tasks API (`tasksApi`):**
- `getAll()`
- `getToday()`
- `getOpen()`
- `getStats()`
- `create(task)`
- `update(id, data)`
- `complete(id)`
- `delete(id)`

**Focus API (`focusApi`):**
- `getActive()`
- `start(data)`
- `pause()`
- `resume()`
- `complete()`
- `abandon()`
- `getHistory()`
- `getStats()`

**Brain Dump API (`brainDumpApi`):**
- `getAll(processed?)`
- `create(content, autoProcess)`
- `batchCreate(items)`
- `process(id)`
- `convertToTask(id, overrides)`
- `delete(id)`
- `getStats()`
- `smartSchedule(itemIds, autoCreate)`
- `quickSchedule(items, autoCreate)`

**AI API (`aiApi`):**
- `conversation(message, history)`
- `processCommand(text)`
- `getBriefing()`
- `getEveningSummary()`
- `getSuggestion()`
- `getTaskSuggestions()`
- `categorizeTask(title, description)`
- `smartSchedule(tasks, preferences)`
- `getDailyInsights()`
- `chat(message)`
- `transcribe(audioBase64, language)`
- `suggestChallenge(prompt)`

**TTS API (`ttsApi`):**
- `speak(text, voice, speed)`
- `stream(text, voice, speed)`

**Challenges API (`challengesApi`):**
- `getAll()`
- `getMine()`
- `getActive()`
- `getById(id)`
- `getLeaderboard(id, limit)`
- `create(data)`
- `join(id)`
- `leave(id)`
- `updateProgress(id, amount)`
- `update(id, data)`
- `delete(id)`

**Circles API (`circlesApi`):**
- `list()`
- `getAll()`
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`
- `join(id)`
- `joinByCode(code)`
- `leave(id)`
- `previewByCode(code)`
- `getMembers(circleId)`
- `updateMemberRole(circleId, userId, role)`
- `kickMember(circleId, userId)`
- `regenerateInviteCode(circleId)`
- `getFeed(circleId, options)`
- `createPost(circleId, data)`
- `createDailyCard(circleId)`
- `getAssignments(circleId, status)`
- `createAssignment(circleId, data)`

**Assignments API (`assignmentsApi`):**
- `getMine(options)`
- `getCircleAssignments(circleId, status)`
- `create(data)`
- `getById(id)`
- `accept(id)`
- `decline(id, reason)`
- `complete(id, proof)`
- `submitProof(id, proofUrl, proofNote)`
- `delete(id)`
- `update(id, data)`
- `updateResponse(id, action, reason)`

**Posts API (`postsApi`):**
- `getById(id)`
- `delete(id)`
- `update(id, data)`
- `react(id, emoji)`
- `removeReaction(id)`
- `getReactions(id)`

**Invitations API (`invitationsApi`):**
- `getMine(status)`
- `invite(circleId, userId, message)`
- `accept(invitationId)`
- `decline(invitationId)`
- `searchUsers(circleId, query)`

**Analytics API (`analyticsApi`):**
- `getDaily(date)`
- `getWeekly(weekStart)`
- `getOverview()`
- `getTrends()`
- `getInsights()`
- `getDashboard()`
- `getGlobalLeaderboard(limit)`
- `getCircleLeaderboard(circleId)`
- `getCircleAnalytics(circleId)`

**Notifications API (`notificationsApi`):**
- `registerToken(pushToken, platform)`
- `removeToken()`
- `getAll(options)`
- `getUnreadCount()`
- `markRead(id)`
- `markAllRead()`
- `delete(id)`
- `clearAll()`
- `getSettings()`
- `updateSettings(settings)`
- `sendTest()`

**Events API (`eventsApi`):**
- `log(eventType, metadata)`
- `logBatch(events)`
- `getHistory(options)`

**Unlocks API (`unlocksApi`):**
- `getAll()`
- `getUnlock(featureId)`
- `check(featureId)`
- `triggerCheck()`

**Recurring API (`recurringApi`):**
- `getAll(includeInactive)`
- `create(data)`
- `update(id, data)`
- `pause(id)`
- `resume(id)`
- `delete(id, deleteInstances)`
- `generate()`

**Calendar API (`calendarApi`):**
- `connect(data)`
- `disconnect(provider)`
- `getConnections()`
- `sync(connectionId)`
- `getEvents(startDate, endDate)`
- `getTimeline(date)`
- `exportTask(taskId, connectionId)`
- `checkConflicts(startTime, endTime, excludeTaskId)`
- `suggestSlots(options)`

**Brief API (`briefApi`):**
- `getDaily()`
- `getEvening()`
- `getQuick()`

### 3.2 Voice Assistant Service (`services/voiceAssistant.ts`)

**Class: VoiceAssistant**
- `updateConfig(config)`
- `getState()`
- `isListening()`
- `start()`
- `stop()`
- `chat(text)` - Main AI conversation
- `processText(text)` - Process voice/text input
- `speakResponse(text)` - TTS output
- `stopPlayback()`

### 3.3 Intent Parser Service (`services/intentParser.ts`)

**Functions:**
- `parseIntent(text)` - Parse user intent from text
- `extractDateTime(text)` - Extract date/time from text

**Intent Types:**
- `add_task`
- `complete_task`
- `query_tasks`
- `start_focus`
- `status`
- `navigate`
- `braindump`
- `unknown`

### 3.4 Voice Action Executor (`services/voiceActionExecutor.ts`)

**Functions:**
- `executeIntent(intent, options)` - Execute parsed intent
- `handleAddTask()` - Add task action
- `handleCompleteTask()` - Complete task action
- `handleQueryTasks()` - Query tasks action
- `handleStartFocus()` - Start focus action
- `handleStatus()` - Get status action
- `handleNavigate()` - Navigate action
- `handleBrainDump()` - Brain dump action
- `handleUnknown()` - Fallback to AI

### 3.5 Other Services

| Service | File | Purpose |
|---------|------|---------|
| **calendarSync** | `services/calendarSync.ts` | Calendar sync operations |
| **pushNotifications** | `services/pushNotifications.ts` | Push notification handling |
| **socket** | `services/socket.ts` | WebSocket connection |
| **widgetService** | `services/widgetService.ts` | iOS widget communication |

---

## 4. FRONTEND CONTEXTS & HOOKS

### 4.1 Contexts

| Context | File | Purpose |
|---------|------|---------|
| **AuthContext** | `contexts/AuthContext.tsx` | User authentication state |
| **VoiceContext** | `contexts/VoiceContext.tsx` | Voice assistant state |

**AuthContext Functions:**
- `login(email, password)`
- `register(email, password, name)`
- `logout()`
- `refreshUser()`
- `updateUser(data)`

**VoiceContext Functions:**
- `openVoiceAssistant()`
- `closeVoiceAssistant()`

### 4.2 Global Hooks

| Hook | File | Purpose |
|------|------|---------|
| **useWidgetSync** | `hooks/useWidgets.ts` | Widget synchronization |
| **useFocusWidget** | `hooks/useWidgets.ts` | Focus widget data |
| **useTasksWidget** | `hooks/useWidgets.ts` | Tasks widget data |
| **useStatsWidget** | `hooks/useWidgets.ts` | Stats widget data |
| **useCalendarEvents** | `hooks/useCalendarEvents.ts` | Calendar events |
| **useMilestones** | `hooks/useMilestones.ts` | User milestones |

### 4.3 Screen-Specific Hooks

Each screen has its own hooks in a `hooks/` directory:
- `useHubData` - Hub screen data
- `useHubAnimations` - Hub animations
- `useBriefing` - Daily briefing
- `useTasksData` - Tasks screen data
- `useProfileData` - Profile data
- `useProfileActions` - Profile actions
- `useLoginData` - Login form state
- `useSettingsData` - Settings state
- etc.

---

## 5. BACKEND ROUTES

### 5.1 Auth Routes (`routes/auth.routes.ts`)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout user |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Complete password reset |
| PUT | `/auth/change-password` | Change password |

### 5.2 Users Routes (`routes/users.routes.ts`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/users/me` | Get current user |
| PATCH | `/users/me` | Update profile |
| DELETE | `/users/me` | Delete account |
| GET | `/users/me/stats` | Get user stats |
| GET | `/users/me/settings` | Get settings |
| PATCH | `/users/me/settings` | Update settings |
| POST | `/users/me/onboarding` | Complete onboarding |

### 5.3 Tasks Routes (`routes/tasks.routes.ts`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/tasks` | List tasks |
| GET | `/tasks/today` | Today's tasks |
| GET | `/tasks/open` | Incomplete tasks |
| GET | `/tasks/stats` | Task statistics |
| GET | `/tasks/date/:date` | Tasks for date |
| POST | `/tasks` | Create task |
| POST | `/tasks/batch` | Create multiple tasks |
| GET | `/tasks/:id` | Get task |
| PATCH | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |
| POST | `/tasks/:id/complete` | Complete task |

### 5.4 Focus Routes (`routes/focus.routes.ts`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/focus/active` | Get active session |
| POST | `/focus/start` | Start focus session |
| POST | `/focus/pause` | Pause session |
| POST | `/focus/resume` | Resume session |
| POST | `/focus/complete` | Complete session |
| POST | `/focus/abandon` | Abandon session |
| GET | `/focus/history` | Session history |
| GET | `/focus/stats` | Focus statistics |

### 5.5 Brain Dump Routes (`routes/braindump.routes.ts`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/brain-dump` | Get brain dumps |
| POST | `/brain-dump` | Create brain dump |
| POST | `/brain-dump/batch` | Batch create |
| POST | `/brain-dump/:id/process` | AI process item |
| POST | `/brain-dump/:id/convert` | Convert to task |
| DELETE | `/brain-dump/:id` | Delete item |
| GET | `/brain-dump/stats` | Statistics |
| POST | `/brain-dump/smart-schedule` | AI smart schedule |
| POST | `/brain-dump/quick-schedule` | Quick schedule |

### 5.6 AI Routes (`routes/ai.routes.ts`)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/ai/conversation` | Main AI chat |
| POST | `/ai/process-command` | Process voice command |
| GET | `/ai/briefing` | Morning briefing |
| GET | `/ai/evening-summary` | Evening summary |
| GET | `/ai/suggestion` | Proactive suggestion |
| GET | `/ai/task-suggestions` | Task suggestions |
| POST | `/ai/categorize-task` | Categorize task |
| POST | `/ai/smart-schedule` | Smart scheduling |
| GET | `/ai/daily-insights` | Daily insights |
| POST | `/ai/chat` | Simple chat |
| POST | `/ai/transcribe-base64` | Whisper transcription |
| POST | `/ai/suggest-challenge` | Suggest challenge |

### 5.7 Challenges Routes (`routes/challenges.routes.ts`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/challenges` | List challenges |
| GET | `/challenges/mine` | My challenges |
| GET | `/challenges/active` | Active challenges |
| GET | `/challenges/:id` | Get challenge |
| GET | `/challenges/:id/leaderboard` | Leaderboard |
| POST | `/challenges` | Create challenge |
| POST | `/challenges/:id/join` | Join challenge |
| POST | `/challenges/:id/leave` | Leave challenge |
| POST | `/challenges/:id/progress` | Update progress |
| PUT | `/challenges/:id` | Update challenge |
| DELETE | `/challenges/:id` | Delete challenge |

### 5.8 Circles Routes (`routes/circles.routes.ts`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/circles` | List circles |
| GET | `/circles/:id` | Get circle |
| POST | `/circles` | Create circle |
| PATCH | `/circles/:id` | Update circle |
| DELETE | `/circles/:id` | Delete circle |
| POST | `/circles/:id/join` | Join circle |
| POST | `/circles/join/:code` | Join by code |
| POST | `/circles/:id/leave` | Leave circle |
| GET | `/circles/preview/:code` | Preview circle |
| GET | `/circles/:id/members` | Get members |
| PATCH | `/circles/:id/members/:userId` | Update member role |
| DELETE | `/circles/:id/members/:userId` | Remove member |
| POST | `/circles/:id/invite-code` | Regenerate invite code |
| GET | `/circles/:id/feed` | Get feed |
| POST | `/circles/:id/posts` | Create post |
| POST | `/circles/:id/posts/daily-card` | Create daily card |
| GET | `/circles/:id/assignments` | Get assignments |
| POST | `/circles/:id/assignments` | Create assignment |

### 5.9 Other Routes

| Route File | Base Path | Purpose |
|------------|-----------|---------|
| `assignments.routes.ts` | `/assignments` | Assignment management |
| `posts.routes.ts` | `/posts` | Post management |
| `invitations.routes.ts` | `/invitations` | Circle invitations |
| `analytics.routes.ts` | `/analytics` | Analytics data |
| `notifications.routes.ts` | `/notifications` | Notifications |
| `events.routes.ts` | `/events` | Event logging |
| `unlocks.routes.ts` | `/unlocks` | Feature unlocks |
| `recurring.routes.ts` | `/recurring` | Recurring tasks |
| `calendar.routes.ts` | `/calendar` | Calendar integration |
| `brief.routes.ts` | `/brief` | Daily briefings |
| `tts.routes.ts` | `/tts` | Text-to-speech |

---

## 6. BACKEND SERVICES

### 6.1 AI Service (`services/ai.service.ts`)

**Functions:**
- `categorizeBrainDump(content)` - AI categorize brain dump
- `categorizeBrainDumpBatch(items)` - Batch categorization
- `generateDailyBriefing(context)` - Generate morning briefing
- `generateEveningSummary(context)` - Generate evening summary
- `processConversation(message, history, userId)` - Main AI conversation
- `processVoiceCommand(text, userId)` - Process voice command
- `getSuggestion(userId)` - Get proactive suggestion
- `smartScheduleTasks(tasks, preferences)` - AI smart scheduling

### 6.2 Auth Service (`services/auth.service.ts`)

**Functions:**
- `register(email, password, name)` - Register user
- `login(email, password)` - Login user
- `refreshTokens(refreshToken)` - Refresh tokens
- `logout(refreshToken)` - Logout
- `changePassword(userId, oldPassword, newPassword)` - Change password
- `requestPasswordReset(email)` - Request reset
- `resetPassword(token, newPassword)` - Reset password

### 6.3 Task Service (`services/task.service.ts`)

**Functions:**
- `createTask(userId, input)` - Create task
- `createManyTasks(userId, tasks)` - Batch create
- `getTaskById(userId, taskId)` - Get task
- `getTasks(userId, options)` - List tasks
- `getTasksForDate(userId, date)` - Tasks for date
- `getOpenTasks(userId)` - Incomplete tasks
- `updateTask(userId, taskId, input)` - Update task
- `completeTask(userId, taskId)` - Complete task
- `deleteTask(userId, taskId)` - Delete task
- `getTaskStats(userId)` - Task statistics

### 6.4 Focus Service (`services/focus.service.ts`)

**Functions:**
- `startFocusSession(userId, input)` - Start session
- `getActiveSession(userId)` - Get active session
- `pauseSession(userId)` - Pause session
- `resumeSession(userId)` - Resume session
- `completeSession(userId, notes?)` - Complete session
- `abandonSession(userId)` - Abandon session
- `getFocusHistory(userId, limit?)` - Session history
- `getFocusStats(userId)` - Focus statistics

### 6.5 Circle Service (`services/circle.service.ts`)

**Functions:**
- `createCircle(userId, input)` - Create circle
- `getCircleById(circleId, userId?)` - Get circle
- `getUserCircles(userId)` - User's circles
- `updateCircle(userId, circleId, input)` - Update circle
- `deleteCircle(userId, circleId)` - Delete circle
- `joinCircle(userId, circleId)` - Join circle
- `joinByCode(userId, code)` - Join by invite code
- `leaveCircle(userId, circleId)` - Leave circle
- `getMembers(circleId)` - Get members
- `updateMemberRole(userId, circleId, targetUserId, role)` - Update role
- `removeMember(userId, circleId, targetUserId)` - Remove member
- `regenerateInviteCode(userId, circleId)` - New invite code
- `getCircleFeed(circleId, userId, options)` - Get feed
- `createPost(circleId, userId, data)` - Create post

### 6.6 Challenge Service (`services/challenge.service.ts`)

**Functions:**
- `getChallenges(userId, options?)` - List challenges
- `getChallengeById(challengeId, userId)` - Get challenge
- `createChallenge(userId, data)` - Create challenge
- `joinChallenge(userId, challengeId)` - Join challenge
- `leaveChallenge(userId, challengeId)` - Leave challenge
- `updateProgress(userId, challengeId, amount)` - Update progress
- `autoUpdateChallengeProgress(userId, type, amount)` - Auto-update
- `getLeaderboard(challengeId, limit?)` - Get leaderboard

### 6.7 Other Services

| Service | File | Purpose |
|---------|------|---------|
| **assignmentService** | `assignment.service.ts` | Assignment CRUD |
| **braindumpService** | `braindump.service.ts` | Brain dump operations |
| **calendarService** | `calendar.service.ts` | Calendar integration |
| **dailybriefService** | `dailybrief.service.ts` | Daily briefing generation |
| **eventService** | `event.service.ts` | Event logging |
| **invitationService** | `invitation.service.ts` | Circle invitations |
| **learningService** | `learning.service.ts` | AI learning/patterns |
| **postService** | `post.service.ts` | Post CRUD |
| **pushService** | `push.service.ts` | Push notifications |
| **recurringService** | `recurring.service.ts` | Recurring tasks |
| **schedulerService** | `scheduler.service.ts` | Task scheduling |
| **socketService** | `socket.service.ts` | WebSocket handling |
| **unlockService** | `unlock.service.ts` | Feature unlocks |
| **userService** | `user.service.ts` | User operations |
| **analyticsService** | `analytics.service.ts` | Analytics data |

---

## 7. MODALS INVENTORY

### 7.1 Circle/CircleHome Modals
| Modal | Purpose |
|-------|---------|
| `ActionMenuModal` | Action options menu |
| `AssignModal` | Create assignment |
| `AssignmentOptionsModal` | Assignment actions |
| `CircleSettingsModal` | Circle settings |
| `CreateChallengeModal` | Create challenge |
| `DeclineModal` | Decline assignment |
| `EditAssignmentModal` | Edit assignment |
| `EditPostModal` | Edit post |
| `InviteModal` | Invite to circle |
| `MemberDetailModal` | Member details |
| `MemberOptionsModal` | Member actions |
| `MemberPickerModal` | Select member |
| `MembersModal` | Members list |
| `PostOptionsModal` | Post actions |
| `ShareModal` | Share circle/content |
| `SubmitProofModal` | Submit proof |
| `TodayModal` | Today's summary |
| `ViewProofModal` | View submitted proof |

### 7.2 Circle/Circles Modals
| Modal | Purpose |
|-------|---------|
| `ActionSheetModal` | Action options |
| `CreateModal` | Create circle |
| `JoinModal` | Join circle |

### 7.3 EditProfile Modals
| Modal | Purpose |
|-------|---------|
| `ChangePasswordModal` | Change password |

### 7.4 HelpSupport Modals
| Modal | Purpose |
|-------|---------|
| `ContactModal` | Contact support |

### 7.5 Hub Modals
| Modal | Purpose |
|-------|---------|
| `BriefingModal` | Full daily briefing |
| `DaySummaryModal` | Day summary |

### 7.6 Inbox Modals
| Modal | Purpose |
|-------|---------|
| `ActionSheetModal` | Action options |
| `DeclineModal` | Decline assignment |
| `DetailModal` | Item details |
| `EditMissionModal` | Edit mission |
| `EditResponseModal` | Edit response |

### 7.7 Listening Modals
| Modal | Purpose |
|-------|---------|
| `SettingsModal` | Voice settings |

### 7.8 NotificationSettings Modals
| Modal | Purpose |
|-------|---------|
| `TimePickerModal` | Quiet hours picker |

### 7.9 Plan Modals
| Modal | Purpose |
|-------|---------|
| `AbandonConfirmModal` | Confirm abandon session |
| `AddTaskModal` | Add task to plan |
| `EditTaskModal` | Edit planned task |
| `SessionSummaryModal` | Focus session summary |

### 7.10 PrivacyControls Modals
| Modal | Purpose |
|-------|---------|
| `PrivacyPickerModal` | Privacy level picker |

### 7.11 Profile Modals
| Modal | Purpose |
|-------|---------|
| `AchievementsModal` | Achievements list |
| `LogoutModal` | Logout confirmation |

### 7.12 Tasks Modals
| Modal | Purpose |
|-------|---------|
| `TaskModal` | Create/edit task |

### 7.13 TaskSorting Modals
| Modal | Purpose |
|-------|---------|
| `AddToPlanModal` | Add to daily plan |
| `AiSortModal` | AI sorting options |

### 7.14 VoiceAssistant Modals
| Modal | Purpose |
|-------|---------|
| `SettingsModal` | Voice settings |

### 7.15 Wallet Modals
| Modal | Purpose |
|-------|---------|
| `InfoModal` | Feature info |
| `ShareModal` | Share achievements |

---

## 8. FILTER & TAB SYSTEMS

### 8.1 Task Filters
- **All** - All tasks
- **Today** - Today's tasks
- **Tomorrow** - Tomorrow's tasks
- **This Week** - Week's tasks
- **Completed** - Completed tasks
- **High Priority** - Priority tasks

### 8.2 Challenge Tabs
- **Active** - Active challenges
- **Joined** - My challenges
- **Completed** - Past challenges
- **Circle** - Circle-specific

### 8.3 Inbox Tabs
- **Assignments** - Task assignments
- **Invitations** - Circle invitations
- **Notifications** - System notifications

### 8.4 Analytics Periods
- **Today** - Daily view
- **This Week** - Weekly view
- **This Month** - Monthly view
- **All Time** - Lifetime stats

### 8.5 Circle Feed Filters
- **All** - All posts
- **Posts** - Regular posts
- **Challenges** - Challenge updates
- **Achievements** - Achievements

---

## 9. MISSING FEATURES FOR PRODUCTION

### 9.1 ❌ MISSING Settings Screens & Options

| Feature | Status | Priority |
|---------|--------|----------|
| **Theme/Appearance Settings** | ⚠️ Partial (backend only) | HIGH |
| **Language Selection** | ❌ Missing | HIGH |
| **Date/Time Format** | ❌ Missing | MEDIUM |
| **Default View Preference** | ❌ Missing | LOW |
| **Notification Sound Selection** | ❌ Missing | LOW |
| **Haptic Feedback Toggle** | ❌ Missing | MEDIUM |
| **Font Size/Accessibility** | ❌ Missing | HIGH |
| **Reduce Motion** | ❌ Missing | MEDIUM |
| **Data Saver Mode** | ❌ Missing | LOW |
| **Auto-Sync Settings** | ❌ Missing | MEDIUM |

### 9.2 ❌ MISSING Error Handling

| Feature | Status | Priority |
|---------|--------|----------|
| **Network Error Modal** | ⚠️ Partial | HIGH |
| **Server Error Modal** | ❌ Missing | HIGH |
| **Session Expired Modal** | ⚠️ Partial | HIGH |
| **Permission Denied Modal** | ❌ Missing | MEDIUM |
| **Feature Unavailable Modal** | ❌ Missing | LOW |
| **Sync Error Modal** | ❌ Missing | MEDIUM |
| **Retry Logic UI** | ❌ Missing | HIGH |
| **Offline Mode Indicator** | ❌ Missing | HIGH |
| **Connection Status Banner** | ❌ Missing | MEDIUM |

### 9.3 ❌ MISSING Empty States

| Screen | Empty State | Status |
|--------|------------|--------|
| Tasks | No tasks | ✅ Exists |
| Circles | No circles | ✅ Exists |
| Challenges | No challenges | ⚠️ Partial |
| Inbox | No items | ✅ Exists |
| Analytics | No data | ⚠️ Partial |
| Focus History | No sessions | ❌ Missing |
| Notifications | No notifications | ⚠️ Partial |
| Search Results | No results | ❌ Missing |
| Saved Places | No places | ⚠️ Partial |

### 9.4 ❌ MISSING Loading States

| Screen | Loading State | Status |
|--------|--------------|--------|
| Hub | Skeleton loader | ✅ Exists |
| Tasks | Loading spinner | ⚠️ Basic |
| Analytics | Skeleton loader | ⚠️ Partial |
| Profile | Loading state | ⚠️ Partial |
| Circle | Loading state | ⚠️ Partial |
| Pull-to-Refresh | Refresh indicator | ✅ Exists |

### 9.5 ❌ MISSING Permission Flows

| Permission | Flow | Status |
|------------|------|--------|
| **Push Notifications** | Request permission | ⚠️ Partial |
| **Microphone** | Voice input | ⚠️ Partial |
| **Camera** | Proof photos | ⚠️ Partial |
| **Location** | Saved places | ❌ Missing |
| **Calendar** | Calendar sync | ⚠️ Partial |
| **Contacts** | Invite friends | ❌ Missing |
| **Photo Library** | Avatar upload | ⚠️ Partial |
| **Face ID/Touch ID** | Biometric auth | ❌ Missing |

### 9.6 ❌ MISSING Onboarding Screens

| Screen | Status | Priority |
|--------|--------|----------|
| **App Tour** | ❌ Missing | HIGH |
| **Permission Explanation** | ❌ Missing | HIGH |
| **Feature Highlights** | ❌ Missing | MEDIUM |
| **Gesture Tutorial** | ❌ Missing | HIGH |
| **Voice Commands Guide** | ❌ Missing | MEDIUM |
| **First Task Guide** | ⚠️ Partial | MEDIUM |
| **Circle Introduction** | ❌ Missing | LOW |

### 9.7 ❌ MISSING Account Management

| Feature | Status | Priority |
|---------|--------|----------|
| **Delete Account Flow** | ⚠️ Backend only | HIGH |
| **Download My Data** | ❌ Missing | HIGH |
| **Account Recovery** | ❌ Missing | MEDIUM |
| **Connected Accounts** | ❌ Missing | MEDIUM |
| **Security Log** | ❌ Missing | LOW |
| **Active Sessions** | ❌ Missing | MEDIUM |
| **Two-Factor Auth** | ❌ Missing | LOW |
| **Email Verification** | ⚠️ Partial | HIGH |
| **Phone Number** | ❌ Missing | LOW |

### 9.8 ❌ MISSING Legal/Compliance Screens

| Screen | Status | Priority |
|--------|--------|----------|
| **Terms of Service Screen** | ❌ Missing (file exists) | HIGH |
| **Privacy Policy Screen** | ❌ Missing (file exists) | HIGH |
| **Cookie Policy** | ❌ Missing | MEDIUM |
| **Data Processing Info** | ❌ Missing | MEDIUM |
| **GDPR Consent** | ❌ Missing | HIGH |
| **Age Verification** | ❌ Missing | MEDIUM |
| **Licenses/Attribution** | ❌ Missing | LOW |

### 9.9 ❌ MISSING Engagement Features

| Feature | Status | Priority |
|---------|--------|----------|
| **App Rating Prompt** | ❌ Missing | HIGH |
| **Feedback Form** | ❌ Missing | HIGH |
| **Share App** | ❌ Missing | MEDIUM |
| **Referral System** | ❌ Missing | LOW |
| **Achievement Sharing** | ⚠️ Partial | MEDIUM |
| **Social Media Share** | ⚠️ Partial | MEDIUM |
| **In-App Updates** | ❌ Missing | MEDIUM |
| **What's New Screen** | ❌ Missing | MEDIUM |
| **Feature Request** | ❌ Missing | LOW |

### 9.10 ❌ MISSING Deep Linking

| Deep Link | Status | Priority |
|-----------|--------|----------|
| **Task Deep Link** | ❌ Missing | HIGH |
| **Circle Deep Link** | ❌ Missing | HIGH |
| **Challenge Deep Link** | ❌ Missing | MEDIUM |
| **Invite Deep Link** | ❌ Missing | HIGH |
| **Password Reset Link** | ❌ Missing | HIGH |
| **Email Verification Link** | ❌ Missing | HIGH |
| **Push Notification Links** | ⚠️ Partial | HIGH |

### 9.11 ❌ MISSING About/Help

| Feature | Status | Priority |
|---------|--------|----------|
| **About Screen** | ❌ Missing | HIGH |
| **FAQ In-App** | ⚠️ Partial | MEDIUM |
| **Contact Support** | ⚠️ Partial | MEDIUM |
| **Report Bug** | ❌ Missing | MEDIUM |
| **Tutorial Videos** | ❌ Missing | LOW |
| **Changelog** | ❌ Missing | LOW |
| **Social Links** | ❌ Missing | LOW |

### 9.12 ❌ MISSING Additional Features

| Feature | Status | Priority |
|---------|--------|----------|
| **Search (Global)** | ❌ Missing | HIGH |
| **Keyboard Shortcuts** | ❌ Missing | LOW |
| **Siri Shortcuts** | ❌ Missing | MEDIUM |
| **Apple Watch App** | ❌ Missing | LOW |
| **iPad Layout** | ❌ Missing | MEDIUM |
| **Landscape Support** | ❌ Missing | LOW |
| **Widget Customization** | ⚠️ Partial | MEDIUM |
| **Quick Actions (3D Touch)** | ❌ Missing | MEDIUM |
| **Spotlight Search** | ❌ Missing | MEDIUM |

---

## 10. INTERACTION AUDIT

### 10.1 Navigation Interactions

| Action | Trigger | Handler |
|--------|---------|---------|
| Swipe Left | Pan gesture | `navigateToView('tasks')` |
| Swipe Right | Pan gesture | `navigateToView('social')` |
| Swipe Down | Pan gesture | `navigateToView('profile')` |
| Swipe Up | Pan gesture | `openFocusModal()` |
| Tab Back | Swipe/Button | `returnToHome()` |

### 10.2 Task Interactions

| Action | Trigger | Handler |
|--------|---------|---------|
| Create Task | Button/Voice | `tasksApi.create()` |
| Complete Task | Checkbox/Swipe | `tasksApi.complete()` |
| Edit Task | Tap card | `openEditModal()` |
| Delete Task | Swipe/Button | `tasksApi.delete()` |
| Reorder Task | Long press + drag | `handleReorder()` |
| Filter Tasks | Tab selection | `setFilter()` |
| Search Tasks | Text input | `setSearchQuery()` |

### 10.3 Focus Session Interactions

| Action | Trigger | Handler |
|--------|---------|---------|
| Start Session | Button/Voice | `focusApi.start()` |
| Pause Session | Button | `focusApi.pause()` |
| Resume Session | Button | `focusApi.resume()` |
| Complete Session | Button/Timer | `focusApi.complete()` |
| Abandon Session | Button | `focusApi.abandon()` |
| Select Duration | Preset buttons | `setSelectedDuration()` |
| Select Task | Task picker | `setSelectedTask()` |

### 10.4 Voice Interactions

| Action | Trigger | Handler |
|--------|---------|---------|
| Start Listening | Tap orb | `voiceAssistant.start()` |
| Stop Listening | Tap orb | `voiceAssistant.stop()` |
| Send Text | Input submit | `voiceAssistant.chat()` |
| Cancel | Swipe down | `closeVoiceAssistant()` |

### 10.5 Circle Interactions

| Action | Trigger | Handler |
|--------|---------|---------|
| Create Circle | Button | `circlesApi.create()` |
| Join Circle | Code input | `circlesApi.joinByCode()` |
| Leave Circle | Button | `circlesApi.leave()` |
| Create Post | Button | `circlesApi.createPost()` |
| React to Post | Emoji tap | `postsApi.react()` |
| Create Assignment | Button | `assignmentsApi.create()` |
| Complete Assignment | Button | `assignmentsApi.complete()` |
| Submit Proof | Camera/Button | `assignmentsApi.submitProof()` |

### 10.6 Challenge Interactions

| Action | Trigger | Handler |
|--------|---------|---------|
| Join Challenge | Button | `challengesApi.join()` |
| Leave Challenge | Button | `challengesApi.leave()` |
| View Leaderboard | Tap card | Navigate to leaderboard |
| Create Challenge | Button | `challengesApi.create()` |

### 10.7 Haptic Feedback Map

| Interaction | Haptic Type |
|-------------|-------------|
| Task Complete | Success |
| Focus Complete | Success |
| Navigation Swipe | Selection |
| Navigation Complete | Medium Impact |
| Error | Error |
| Button Press | Light Impact |
| Achievement Unlock | Heavy Impact |

---

## SUMMARY

### Total Counts

| Category | Count |
|----------|-------|
| **Screens** | 37 |
| **Screen Components** | 150+ |
| **UI Components** | 26 |
| **Main Components** | 18 |
| **Modals** | 45+ |
| **API Functions** | 200+ |
| **Backend Routes** | 80+ |
| **Backend Services** | 22 |
| **Hooks** | 30+ |
| **Missing Features** | 70+ |

### Production Readiness Score

| Area | Score | Notes |
|------|-------|-------|
| Core Features | 85% | Tasks, Focus, Voice working |
| Social Features | 75% | Circles, Challenges functional |
| Settings/Preferences | 50% | Many options missing |
| Error Handling | 40% | Needs improvement |
| Onboarding | 60% | Basic flow exists |
| Account Management | 45% | Delete flow incomplete |
| Legal Compliance | 30% | Screens not implemented |
| Engagement | 35% | Basic features only |
| Accessibility | 25% | Needs work |
| Deep Linking | 20% | Mostly missing |

**Overall Production Readiness: ~55%**

---

*Last Updated: February 3, 2026*

