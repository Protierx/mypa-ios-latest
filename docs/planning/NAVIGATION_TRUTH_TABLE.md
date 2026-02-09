# MYPA Navigation Truth Table
## Complete Route Graph — Every Screen, Every Action, Every Modal

---

## Architecture Overview

MYPA uses a **gesture-based spatial navigation** system. There is NO React Navigation stack. All screens are rendered simultaneously in a 2D plane, and the user swipes between them.

```
                    ┌──────────────┐
                    │   PROFILE    │
                    │  (swipe ↓)   │
                    └──────┬───────┘
                           │ swipe ↑ to return
                           ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    TASKS     │◄──│   AI HUB     │──►│    SOCIAL    │
│  (swipe ←)   │   │   (CENTER)   │   │  (swipe →)   │
└──────────────┘   └──────┬───────┘   └──────────────┘
  swipe → to return       │ swipe ↑       swipe ← to return
                    ┌─────┴────────┐
                    │ FOCUS MODAL  │
                    │  (overlay)   │
                    └──────────────┘
```

**Modals** are presented as overlays on top of the current screen. They don't change the underlying gesture position. `GestureContext.canSwipe` should be set to `false` when any modal is open.

---

## App Entry Flow

```
App.tsx
  └─ SupabaseAuthProvider
       └─ UserModelProvider
            └─ VoiceProvider
                 └─ AppContent
                      ├─ isLoading → LoadingScreen (orb + spinner)
                      ├─ !user → LoginScreenV2
                      └─ user → AuthenticatedApp
                           ├─ GestureNavigator (all 4 screens)
                           └─ UnlockCelebrationModal (overlay, auto-shown)
```

| Condition | Screen Shown | Component |
|-----------|-------------|-----------|
| Auth loading | Splash/loading | `<LoadingContainer>` in App.tsx |
| Not authenticated | Login | `LoginScreenV2` |
| Authenticated | AI Hub (center) | `GestureNavigator` → `AIHubScreen` |

---

## Screen-by-Screen Truth Table

### SCREEN: AI Hub (CENTER — Default Home)

**File:** `screens-v2/AIHub/AIHubScreen.tsx`
**Gesture to reach:** App launch / swipe back from any other screen
**Gesture to leave:** Swipe left/right/down/up

| User Action | Target | Params | Implementation Status |
|-------------|--------|--------|----------------------|
| Swipe LEFT | TasksViewScreen | none | DONE |
| Swipe RIGHT | SocialViewScreen | none | DONE |
| Swipe DOWN | ProfileViewScreen | none | DONE |
| Swipe UP | FocusModal (overlay) | none | PARTIAL — gesture recognized but snaps back. FocusModal component exists but not wired to gesture. |
| Tap anywhere on screen | Start voice listening | none | DONE — activates VoiceContext |
| Mic permission denied → tap | VoicePermissions modal | none | DONE — `showPermissionModal` state |

**Displays:** Greeting, date, task count summary, streak, XP bar, AI orb animation
**Voice button:** Full orb (tap to activate)

**Swipe indicators visible:**
- Left edge: "Tasks"
- Right edge: "Social"
- Bottom edge: "Profile"
- Top edge: "Focus"

---

### SCREEN: Tasks View (LEFT)

**File:** `screens-v2/TasksView/TasksViewScreen.tsx`
**Gesture to reach:** Swipe LEFT from AI Hub
**Gesture to leave:** Swipe RIGHT → returns to AI Hub

| User Action | Target | Params | Implementation Status |
|-------------|--------|--------|----------------------|
| Swipe RIGHT | AI Hub | none | DONE |
| Tap "+" FAB button | QuickAddTaskOverlay | none | TODO — line 260, `// TODO: Open quick add modal` |
| Tap a task row | TaskDetailModal | `{ task: Task }` | TODO — task tap handler not wired |
| Tap checkbox on task | Complete task inline | `{ taskId }` | DONE — via `useTasks().completeTask()` |
| Tap filter tab (Today/Tomorrow/All) | Filter task list | `{ filter }` | DONE — local state |
| Tap AI sort toggle | Toggle AI auto-sort | none | DONE — via `useAITaskSorting()` |

**Displays:** Filter tabs, task list with priorities/categories, AI sorting indicator
**Voice button:** MiniVoiceButton (bottom-right corner)

**Swipe indicators visible:**
- Right edge: "Back"

---

### SCREEN: Social View (RIGHT)

**File:** `screens-v2/SocialView/SocialViewScreen.tsx`
**Gesture to reach:** Swipe RIGHT from AI Hub
**Gesture to leave:** Swipe LEFT → returns to AI Hub

| User Action | Target | Params | Implementation Status |
|-------------|--------|--------|----------------------|
| Swipe LEFT | AI Hub | none | DONE |
| Tap "+" button | Create menu (Circle or Challenge) | none | TODO — line 49, `// TODO: Open create menu` |
| Tap a challenge card | ChallengeDetailModal | `{ challengeId }` | TODO — line 85, `// TODO: Open challenge detail` |
| Tap a circle card | CircleHomeModal | `{ circleId }` | TODO — line 123, `// TODO: Open circle home` |
| Tap "Create a Circle" CTA | CreateCircleSheet | none | TODO — line 146, `// TODO: Create circle` |

**Displays:** Active challenges section, your circles section, empty states with CTAs
**Voice button:** MiniVoiceButton (bottom-right corner)

**Swipe indicators visible:**
- Left edge: "Back"

---

### SCREEN: Profile View (DOWN)

**File:** `screens-v2/ProfileView/ProfileViewScreen.tsx`
**Gesture to reach:** Swipe DOWN from AI Hub
**Gesture to leave:** Swipe UP → returns to AI Hub

| User Action | Target | Params | Implementation Status |
|-------------|--------|--------|----------------------|
| Swipe UP | AI Hub | none | DONE |
| Tap settings gear icon | SettingsModal | none | TODO — line 173, `// TODO: Open settings` |
| Tap help "?" icon | Help modal | none | TODO — line 185, `// TODO: Open help` |
| Tap an unlock card | UnlockDetailsModal | `{ feature: FeatureUnlock }` | TODO |
| Tap "Sign Out" | Supabase signOut → LoginScreen | none | DONE — via `useSupabaseAuth().signOut()` |

**Displays:** Avatar, display name, level, XP bar, streak, stats grid, unlocks progress
**Voice button:** MiniVoiceButton (bottom-right corner)

**Swipe indicators visible:**
- Top edge: "Back"

---

### OVERLAY: Focus Modal

**File:** `screens-v2/FocusModal/FocusModal.tsx`
**Trigger:** Swipe UP from AI Hub (not yet wired) / voice "start focus session" / TaskDetailModal "Start Focus" button
**Dismiss:** Close button → `goToAIHub()` / "Done" after completion

| State | User Action | Result | Implementation |
|-------|-------------|--------|----------------|
| selecting | Tap duration option (15/25/45/60) | Set planned duration | DONE |
| selecting | Tap task link | Link focus to specific task | TODO |
| selecting | Tap "Start" | Transition to active state, INSERT focus_sessions | DONE |
| active | Tap pause button | Transition to paused state | DONE (client-side) |
| active | Tap end button | End session, UPDATE focus_sessions | DONE |
| paused | Tap resume button | Transition to active state | DONE |
| paused | Tap end button | End session | DONE |
| completed | Tap "Done" | Reset to selecting state | DONE |
| any | Tap close (chevron-down) | Call handleEnd(), dismiss modal | DONE |

**Displays:** Timer ring, duration selector, pause/resume/end buttons, completion celebration
**Voice button:** MiniVoiceButton (during active/paused only)

---

## Modal Truth Table

### MODAL: QuickAddTaskOverlay

**File:** `screens-v2/modals/QuickAddTaskOverlay.tsx`
**Props:** `visible, onClose, onTaskCreated?`

| Opened From | Trigger | Params |
|-------------|---------|--------|
| TasksViewScreen | Tap "+" FAB button | none |
| AI Hub (voice) | "Add task" voice command shows UI confirmation | none |

| User Action | Result | Implementation |
|-------------|--------|----------------|
| Type title + tap "Add" | INSERT into tasks, call onTaskCreated, close | DONE |
| Tap date chip (Today/Tomorrow/Custom) | Set due_date | DONE |
| Tap priority flag | Set priority | DONE |
| Tap backdrop | Close without saving | DONE |
| Tap close button | Close without saving | DONE |

**Dismiss:** Backdrop tap or close button → `onClose()`

---

### MODAL: TaskDetailModal

**File:** `screens-v2/modals/TaskDetailModal.tsx`
**Props:** `visible, task: Task | null, onClose, onStartFocus?`

| Opened From | Trigger | Params |
|-------------|---------|--------|
| TasksViewScreen | Tap a task row | `{ task: Task }` |

| User Action | Result | Implementation |
|-------------|--------|----------------|
| Edit title | UPDATE tasks.title | DONE |
| Tap date picker | Change due_date | DONE |
| Tap priority selector | Change priority | DONE |
| Edit estimated duration | UPDATE tasks.estimated_duration | DONE |
| Toggle completion checkbox | UPDATE status to completed/pending | DONE |
| Tap "Start Focus Session" | Call onStartFocus(taskId) → open FocusModal | TODO — callback not wired |
| Tap "Delete Task" | Confirm alert → DELETE from tasks → close | DONE |
| Tap close (X) | If unsaved changes → confirm alert; else close | DONE |

**Dismiss:** Close (X) with unsaved changes warning → `handleClose()`

---

### MODAL: ChallengeDetailModal

**File:** `screens-v2/modals/ChallengeDetailModal.tsx`
**Props:** `visible, challengeId: string | null, onClose`

| Opened From | Trigger | Params |
|-------------|---------|--------|
| SocialViewScreen | Tap a challenge card | `{ challengeId }` |
| CircleHomeModal | Tap challenge in challenges tab | `{ challengeId }` via onOpenChallenge callback |

| User Action | Result | Implementation |
|-------------|--------|----------------|
| View leaderboard | Displays participants ranked by progress | DONE |
| Submit proof | Upload photo/note as proof of progress | TODO |
| Tap "Leave Challenge" | DELETE from challenge_participants → close | DONE |
| Tap close (X) | Close | DONE |

**Dismiss:** Close button (X) → `onClose()`

---

### MODAL: CircleHomeModal

**File:** `screens-v2/modals/CircleHomeModal.tsx`
**Props:** `visible, circleId: string | null, onClose, onOpenChallenge?`

| Opened From | Trigger | Params |
|-------------|---------|--------|
| SocialViewScreen | Tap a circle card | `{ circleId }` |

| User Action | Result | Implementation |
|-------------|--------|----------------|
| Tap Tasks tab | Show circle members' task stats | DONE |
| Tap Activity tab | Show circle activity feed | DONE |
| Tap Challenges tab | Show circle challenges | DONE |
| Tap a challenge | Call onOpenChallenge(id) → open ChallengeDetailModal | TODO — callback not wired |
| Tap invite button | Share invite code/link | TODO |
| Tap settings icon | Open circle settings | TODO |
| Tap close (X) | Close | DONE |

**Dismiss:** Close button (X) → `onClose()`

---

### MODAL: CreateCircleSheet

**File:** `screens-v2/modals/CreateCircleSheet.tsx`
**Props:** `visible, onClose, onCircleCreated?`

| Opened From | Trigger | Params |
|-------------|---------|--------|
| SocialViewScreen | Tap "+" → "Create Circle" or "Create a Circle" CTA | none |

| User Action | Result | Implementation |
|-------------|--------|----------------|
| Pick emoji | Set circle emoji | DONE |
| Enter name | Set circle name | DONE |
| Enter description | Set description | DONE |
| Select privacy (invite-only/public) | Set privacy level | DONE |
| Tap "Create" | INSERT circles + circle_members, call onCircleCreated, close | DONE |
| Tap "Cancel" | If unsaved changes → confirm alert; else close | DONE |
| Tap backdrop | Same as Cancel | DONE |

**Dismiss:** Cancel/backdrop with unsaved changes guard → `handleClose()`

---

### MODAL: CreateChallengeSheet

**File:** `screens-v2/modals/CreateChallengeSheet.tsx`
**Props:** `visible, onClose, circleId?, onChallengeCreated?`

| Opened From | Trigger | Params |
|-------------|---------|--------|
| SocialViewScreen | Tap "+" → "Create Challenge" | none (select circle in form) |
| CircleHomeModal | Tap "Create Challenge" in challenges tab | `{ circleId }` (pre-selected) |

| User Action | Result | Implementation |
|-------------|--------|----------------|
| Pick emoji | Set challenge emoji | DONE |
| Enter title | Set challenge title | DONE |
| Select type (focus_time/tasks_completed/daily_checkin/custom) | Set type | DONE |
| Set target value | Set goal_value | DONE |
| Set duration (1-30 days) | Set duration_days | DONE |
| Select circle (if not pre-selected) | Set circle_id | DONE |
| Tap "Create" | INSERT challenges + challenge_participants, callback, close | DONE |
| Tap "Cancel" | Unsaved changes guard → close | DONE |

**Dismiss:** Cancel/backdrop → `handleClose()`

---

### MODAL: JoinCircleModal

**File:** `screens-v2/modals/JoinCircleModal.tsx`
**Props:** `visible, inviteCode: string | null, onClose, onJoined?`

| Opened From | Trigger | Params |
|-------------|---------|--------|
| Deep link | `mypa://join-circle/{code}` | `{ inviteCode }` |
| NotificationsModal | Tap circle_invite notification | `{ inviteCode }` |

| User Action | Result | Implementation |
|-------------|--------|----------------|
| Tap "Join" | INSERT circle_members, call onJoined, close | DONE |
| Tap "Decline" | Close without joining | DONE |
| Already a member | Show "Already a member" state | DONE |

**Dismiss:** Close button or "Decline" → `onClose()`

---

### MODAL: NotificationsModal

**File:** `screens-v2/modals/NotificationsModal.tsx`
**Props:** `visible, onClose, onNotificationPress?`

| Opened From | Trigger | Params |
|-------------|---------|--------|
| AI Hub | Tap notifications bell icon | none |
| Profile | Tap notifications button | none |
| **CURRENT:** No trigger wired | — | — |

| User Action | Result | Implementation |
|-------------|--------|----------------|
| Tap filter (All/Social/Tasks/System) | Filter notification list | DONE |
| Tap a notification | Call onNotificationPress(notification) | TODO — callback action depends on notification type |
| Tap "Mark all read" | UPDATE notifications SET read = true | DONE |
| Long press notification | Delete notification | DONE |
| Tap close (X) | Close | DONE |

**Notification type → target action mapping (NEEDED):**
| notification.type | Expected Action |
|-------------------|-----------------|
| circle_invite | Open JoinCircleModal with invite code |
| challenge_complete | Open ChallengeDetailModal |
| streak_reminder | Navigate to AI Hub |
| task_reminder | Open TaskDetailModal |
| level_up | Open ProfileViewScreen |

**Dismiss:** Close (X) → `onClose()`

---

### MODAL: SettingsModal

**File:** `screens-v2/modals/SettingsModal.tsx`
**Props:** `visible, onClose`

| Opened From | Trigger | Params |
|-------------|---------|--------|
| ProfileViewScreen | Tap settings gear icon | none |

| User Action | Result | Implementation |
|-------------|--------|----------------|
| Toggle voice wake word | UPDATE user_settings | TODO |
| Change notification preferences | UPDATE user_settings | TODO |
| Toggle focus Do Not Disturb | UPDATE user_settings | DONE |
| Edit profile | Open edit profile screen | TODO — line 370 |
| Tap "Sign Out" | Supabase signOut → LoginScreen | DONE |
| Tap "Delete Account" | Confirm → delete user data | DONE (confirmation alert) |
| Tap close (X) | Close | DONE |

**Settings sections:** Voice & AI, Notifications, Focus, Privacy, Account, About

**Dismiss:** Close (X) → `onClose()`

---

### MODAL: UnlockDetailsModal

**File:** `screens-v2/modals/UnlockDetailsModal.tsx`
**Props:** `visible, feature: FeatureUnlock | null, onClose`

| Opened From | Trigger | Params |
|-------------|---------|--------|
| ProfileViewScreen | Tap unlock card | `{ feature: FeatureUnlock }` |

| User Action | Result | Implementation |
|-------------|--------|----------------|
| View progress bars | See requirement completion | DONE |
| Tap "Got it" | Close | DONE |

**Dismiss:** "Got it" button → `onClose()`

---

### GLOBAL OVERLAY: UnlockCelebrationModal

**File:** `components/UnlockCelebrationModal.tsx`
**Managed by:** `useUnlockCelebrations()` hook in `App.tsx`

| Trigger | Params |
|---------|--------|
| Automatic — when calculate-unlocks returns newUnlocks | `{ feature: string }` |

| User Action | Result |
|-------------|--------|
| Wait (auto-dismiss) | Modal disappears after animation |
| Tap dismiss | Modal closes immediately |

---

## Deep Link Routes (NEEDED — Not Implemented)

| URI Pattern | Target | Params |
|-------------|--------|--------|
| `mypa://` | AI Hub | none |
| `mypa://tasks` | TasksViewScreen | none |
| `mypa://social` | SocialViewScreen | none |
| `mypa://profile` | ProfileViewScreen | none |
| `mypa://focus` | FocusModal | none |
| `mypa://join-circle/{code}` | JoinCircleModal | `{ inviteCode }` |
| `mypa://challenge/{id}` | ChallengeDetailModal | `{ challengeId }` |
| `mypa://task/{id}` | TaskDetailModal | `{ taskId }` → fetch task |

---

## Complete Wiring Gap List (TODO Audit)

These are the navigation connections that exist as components but are NOT wired up:

| Priority | From → To | Action Required |
|----------|-----------|-----------------|
| **P0** | TasksViewScreen → TaskDetailModal | Add `selectedTask` state + `onPress` handler to task rows |
| **P0** | TasksViewScreen → QuickAddTaskOverlay | Add `showQuickAdd` state + FAB `onPress` handler |
| **P0** | SocialViewScreen → CircleHomeModal | Add `selectedCircleId` state + circle card `onPress` |
| **P0** | SocialViewScreen → ChallengeDetailModal | Add `selectedChallengeId` state + challenge card `onPress` |
| **P1** | SocialViewScreen → CreateCircleSheet | Add `showCreateCircle` state + "+" menu handler |
| **P1** | SocialViewScreen → CreateChallengeSheet | Add `showCreateChallenge` state + "+" menu handler |
| **P1** | ProfileViewScreen → SettingsModal | Add `showSettings` state + gear icon `onPress` |
| **P1** | ProfileViewScreen → UnlockDetailsModal | Add `selectedUnlock` state + unlock card `onPress` |
| **P1** | AI Hub gesture UP → FocusModal | Wire `animateToScreen('focus')` in GestureNavigator instead of snapping back |
| **P2** | CircleHomeModal → ChallengeDetailModal | Wire `onOpenChallenge` prop through SocialViewScreen |
| **P2** | TaskDetailModal → FocusModal | Wire `onStartFocus` prop through TasksViewScreen |
| **P2** | NotificationsModal trigger | Add bell icon to AI Hub header or ProfileView |
| **P2** | Notification tap → appropriate modal | Implement `onNotificationPress` router |
| **P3** | Deep link handling | Add `expo-linking` config + URL handler in App.tsx |
| **P3** | Push notification tap → deep link | Wire push tap → URL → deep link handler |

---

## Wiring Pattern (How to Connect a Modal)

Every modal follows the same pattern. Here's the template for wiring TaskDetailModal into TasksViewScreen:

```tsx
// In TasksViewScreen.tsx — add state
const [selectedTask, setSelectedTask] = useState<Task | null>(null);
const [showTaskDetail, setShowTaskDetail] = useState(false);

// In task row render — add onPress
<TouchableOpacity onPress={() => {
  setSelectedTask(task);
  setShowTaskDetail(true);
}}>

// At bottom of return — add modal
<TaskDetailModal
  visible={showTaskDetail}
  task={selectedTask}
  onClose={() => {
    setShowTaskDetail(false);
    setSelectedTask(null);
  }}
  onStartFocus={(taskId) => {
    setShowTaskDetail(false);
    // Open FocusModal with taskId
  }}
/>
```

The same pattern applies to all P0 and P1 items above: useState for visibility + selected item, onPress to set both, pass as props to modal component.

---

## Navigation State Machine (from GestureContext)

```
Screens: ai_hub | tasks | social | profile | focus

Transitions:
  ai_hub  → tasks     (swipe left)
  ai_hub  → social    (swipe right)
  ai_hub  → profile   (swipe down)
  ai_hub  → focus     (swipe up) [NOT WIRED]
  tasks   → ai_hub    (swipe right)
  social  → ai_hub    (swipe left)
  profile → ai_hub    (swipe up)
  focus   → ai_hub    (close button)

Dead ends (cannot navigate between):
  tasks ✗→ social
  tasks ✗→ profile
  social ✗→ profile
  social ✗→ tasks
  profile ✗→ tasks
  profile ✗→ social

All non-hub screens MUST return to AI Hub first.
```
