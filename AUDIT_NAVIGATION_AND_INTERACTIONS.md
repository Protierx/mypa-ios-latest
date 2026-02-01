# AUDIT: Navigation Routes & Interactive Elements

**Generated:** 2026-02-01 | **Scope:** Exact file paths and line numbers for every button/CTA

---

## SECTION 1: NAVIGATION ROUTES REGISTERED

### Root Level Navigation Structure (App.tsx)

**File:** [frontend/App.tsx](frontend/App.tsx)

#### RootStack Navigator (Lines 284-301)
- **Container:** `RootStack.Navigator` with `headerShown: false`
- **Routes:**
  - `MainTabs` (line 286) → Component: `MainTabs` function
  - `CircleHome` (line 290) → Component: `CircleHomeScreen`

#### MainTabs Navigator (Lines 198-216)
- **Container:** `Tab.Navigator` with custom `CustomTabBar`
- **Tab Routes:**
  1. **Home** (line 200) → Component: `HomeStack()`
  2. **Plan** (line 201) → Component: `PlanScreen`
  3. **Voice** (line 202) → Component: `VoicePlaceholder`
  4. **Circles** (line 203) → Component: `CirclesStack()`
  5. **Profile** (line 204) → Component: `ProfileStack()`

#### HomeStack Navigator (Lines 48-67)
- **Container:** `Stack.Navigator` with `headerShown: false`
- **18 Screens:**
  1. `Hub` (line 49) → [frontend/src/screens/Hub/index.tsx](frontend/src/screens/Hub/index.tsx)
  2. `Inbox` (line 50) → [frontend/src/screens/Inbox/index.tsx](frontend/src/screens/Inbox/index.tsx)
  3. `Wallet` (line 51) → [frontend/src/screens/Wallet/index.tsx](frontend/src/screens/Wallet/index.tsx)
  4. `Challenges` (line 52) → [frontend/src/screens/Challenges/index.tsx](frontend/src/screens/Challenges/index.tsx)
  5. `Settings` (line 53) → [frontend/src/screens/Settings/index.tsx](frontend/src/screens/Settings/index.tsx)
  6. `Tasks` (line 54) → [frontend/src/screens/Tasks/index.tsx](frontend/src/screens/Tasks/index.tsx)
  7. `Streak` (line 55) → [frontend/src/screens/Streak/index.tsx](frontend/src/screens/Streak/index.tsx)
  8. `Level` (line 56) → [frontend/src/screens/Level/index.tsx](frontend/src/screens/Level/index.tsx)
  9. `Reset` (line 57) → [frontend/src/screens/Reset/index.tsx](frontend/src/screens/Reset/index.tsx)
  10. `TaskSorting` (line 58) → [frontend/src/screens/TaskSorting/index.tsx](frontend/src/screens/TaskSorting/index.tsx)
  11. `ProofCamera` (line 59) → [frontend/src/screens/Proof/ProofCamera.tsx](frontend/src/screens/Proof/ProofCamera.tsx)
  12. `ProofConfirm` (line 60) → [frontend/src/screens/Proof/ProofConfirm.tsx](frontend/src/screens/Proof/ProofConfirm.tsx)
  13. `DailyLifeCard` (line 61) → [frontend/src/screens/DailyLifeCard/index.tsx](frontend/src/screens/DailyLifeCard/index.tsx)
  14. `SavedPlaces` (line 62) → [frontend/src/screens/SavedPlaces/index.tsx](frontend/src/screens/SavedPlaces/index.tsx)
  15. `Analytics` (line 63) → [frontend/src/screens/Analytics/index.tsx](frontend/src/screens/Analytics/index.tsx)
  16. `DailyBriefing` (line 64) → [frontend/src/screens/DailyBriefing/index.tsx](frontend/src/screens/DailyBriefing/index.tsx)
  17. `AIInsights` (line 65) → [frontend/src/screens/AIInsights/index.tsx](frontend/src/screens/AIInsights/index.tsx)
  18. `NotificationSettings` (line 66) → [frontend/src/screens/Notification/NotificationSettings.tsx](frontend/src/screens/Notification/NotificationSettings.tsx)

#### ProfileStack Navigator (Lines 72-79)
- **Container:** `Stack.Navigator` with `headerShown: false`
- **6 Screens:**
  1. `ProfileMain` (line 73) → [frontend/src/screens/Profile/index.tsx](frontend/src/screens/Profile/index.tsx)
  2. `EditProfile` (line 74) → [frontend/src/screens/EditProfile/index.tsx](frontend/src/screens/EditProfile/index.tsx)
  3. `Notifications` (line 75) → [frontend/src/screens/Notification/Notifications.tsx](frontend/src/screens/Notification/Notifications.tsx)
  4. `PrivacyControls` (line 76) → [frontend/src/screens/PrivacyControls/index.tsx](frontend/src/screens/PrivacyControls/index.tsx)
  5. `HelpSupport` (line 77) → [frontend/src/screens/HelpSupport/index.tsx](frontend/src/screens/HelpSupport/index.tsx)
  6. `SettingsFromProfile` (line 78) → [frontend/src/screens/Settings/index.tsx](frontend/src/screens/Settings/index.tsx)

#### CirclesStack Navigator (Lines 81-85)
- **Container:** `Stack.Navigator` with `headerShown: false`
- **1 Screen:**
  1. `CirclesList` (line 82) → [frontend/src/screens/Circle/Circles/index.tsx](frontend/src/screens/Circle/Circles/index.tsx)

#### Modal Overlays at RootStack Level (Lines 307-310)
- **VoiceAssistantScreen** → [frontend/src/screens/VoiceAssistant/index.tsx](frontend/src/screens/VoiceAssistant/index.tsx)
  - **Controlled by:** `showListening` state (line 244)
  - **Open trigger:** Voice tab button onPress (line 124) → `setShowListening(true)`
  - **Close trigger:** `onClose()` prop (line 310) → `setShowListening(false)`

---

## SECTION 2: INTERACTIVE ELEMENTS BY SCREEN

### Screen: Hub/index.tsx

**File:** [frontend/src/screens/Hub/index.tsx](frontend/src/screens/Hub/index.tsx)

| Line | Component | Type | Handler | Target | Status |
|------|-----------|------|---------|--------|--------|
| 203-214 | Inbox Header Button | Pressable | `handleNavigate('inbox')` | [line 99-119] | ⚠️ No error boundary |
| 215-225 | Profile Header Button | Pressable | `handleNavigate('profile')` | [line 99-119] | ⚠️ No error boundary |
| 231-271 | Daily Briefing Card | Pressable | `briefing.startBriefing()` | Service call | ✅ |
| 277 | Streak Stat Card | Pressable | `handleNavigate('streak')` | [line 99-119] | ⚠️ No error boundary |
| 282 | Level Stat Card | Pressable | `handleNavigate('level')` | [line 99-119] | ⚠️ No error boundary |
| 298-307 | "See All" Tasks Button | Pressable | `handleNavigate('plan')` | [line 99-119] | ⚠️ No error boundary |
| 339 | Task Card Row | Pressable | `handleNavigate('plan')` (conditional) | [line 99-119] | ⚠️ No error boundary |
| 351-362 | "Quick Add Task" FAB | Pressable | `handleNavigate('plan')` | [line 99-119] | ⚠️ No error boundary |
| 369-396 | Voice Orb | Pressable | `onVoiceClick?.()` | Callback to App.tsx | ✅ |
| 399-406 | Reset Button | Pressable | `handleNavigate('reset')` | [line 99-119] | ⚠️ No error boundary |

**handleNavigate() Helper (Lines 99-119):**
```typescript
const handleNavigate = (screen: string) => {
  try {
    navigation.navigate(screen);
  } catch (error) {
    console.error('Navigation failed:', error);
  }
};
```
**Issue:** Catch block has no error feedback to user. Silent failure.

---

### Screen: Inbox/index.tsx

**File:** [frontend/src/screens/Inbox/index.tsx](frontend/src/screens/Inbox/index.tsx)

| Line | Component | Type | Handler | Target | Status |
|------|-----------|------|---------|--------|--------|
| 226-240 | handleNavigate() helper | Function | Try/catch | Various screens | ⚠️ No error boundary |

---

### Screen: Wallet/index.tsx

**File:** [frontend/src/screens/Wallet/index.tsx](frontend/src/screens/Wallet/index.tsx)

| Line | Component | Type | Handler | Target | Status |
|------|-----------|------|---------|--------|--------|
| 85-100 | handleNavigate() helper | Function | Try/catch | Various screens | ⚠️ No error boundary |
| 144 | XP Card | Pressable | `onPress={handleLevel}` | Navigate to Level | ✅ |

**InfoModal Component (Lines 27-74):**
- [frontend/src/screens/Wallet/modals/InfoModal.tsx](frontend/src/screens/Wallet/modals/InfoModal.tsx)
  - Line 27: Backdrop `Pressable` → `onPress={onClose}`
  - Line 29-34: Close button `Pressable` → `onPress={onClose}`
  - Line 69-74: "Got it" button `Pressable` → `onPress={onClose}`

**ShareModal Component (Lines 40-72):**
- [frontend/src/screens/Wallet/modals/ShareModal.tsx](frontend/src/screens/Wallet/modals/ShareModal.tsx)
  - Line 40: Backdrop `Pressable` → `onPress={onClose}`
  - Line 42-47: Close button `Pressable` → `onPress={onClose}`
  - Line 60-65: "Share" button `Pressable` → `onPress={handleShare}`
  - Line 67-72: "Cancel" button `Pressable` → `onPress={onClose}`

---

### Screen: Challenges/index.tsx

**File:** [frontend/src/screens/Challenges/index.tsx](frontend/src/screens/Challenges/index.tsx)

| Line | Component | Type | Handler | Notes |
|------|-----------|------|---------|-------|
| ? | Challenge rows | Pressable | `onPress={handleChallengeSelect}` | **[NEED EXACT LINES]** |

---

### Screen: Login Screen

**File:** [frontend/src/screens/Login/components/LoginForm.tsx](frontend/src/screens/Login/components/LoginForm.tsx)

| Line | Component | Type | Handler | Status |
|------|-----------|------|---------|--------|
| 83-89 | Password Show/Hide Toggle | TouchableOpacity | `onPress={onTogglePassword}` | ✅ |
| 92-104 | Submit Button (Login/Register) | TouchableOpacity | `onPress={onSubmit}` | ✅ Disabled state checked |
| 106-113 | Switch Mode Button (Login ↔ Register) | TouchableOpacity | `onPress={onSwitchMode}` | ✅ |

**Test Accounts Component:**
- [frontend/src/screens/Login/components/TestAccounts.tsx](frontend/src/screens/Login/components/TestAccounts.tsx)
  - Line 19-25: Test account buttons (loop) `TouchableOpacity` → `onPress={() => onQuickLogin(account.email)}` | ✅

---

### Screen: DailyBriefing/index.tsx

**File:** [frontend/src/screens/DailyBriefing/index.tsx](frontend/src/screens/DailyBriefing/index.tsx)

**QuickActions Component:**
- [frontend/src/screens/DailyBriefing/components/QuickActions.tsx](frontend/src/screens/DailyBriefing/components/QuickActions.tsx)
  - Line 39: Voice Assistant Button → `navigate('VoiceAssistant')`
  - **🔴 CRITICAL BUG:** Screen `'VoiceAssistant'` is not registered in navigation stack. It's a modal overlay at App level (`showListening` state).

---

### Screen: AIInsights/index.tsx

**File:** [frontend/src/screens/AIInsights/index.tsx](frontend/src/screens/AIInsights/index.tsx)

**QuickActions Component:**
- [frontend/src/screens/AIInsights/components/QuickActions.tsx](frontend/src/screens/AIInsights/components/QuickActions.tsx)
  - Line 32: Voice Assistant Button → `navigate('VoiceAssistant')`
  - **🔴 CRITICAL BUG:** Same as DailyBriefing. Screen not registered.

---

### Screen: Tasks/index.tsx

**File:** [frontend/src/screens/Tasks/index.tsx](frontend/src/screens/Tasks/index.tsx)

| Line | Component | Type | Handler | Notes |
|------|-----------|------|---------|-------|
| ? | Task rows | Pressable | `onPress={handleTaskSelect}` | **[NEED EXACT LINES]** |

---

### Screen: Plan/index.tsx

**File:** [frontend/src/screens/Plan/index.tsx](frontend/src/screens/Plan/index.tsx)

| Line | Component | Type | Handler | Notes |
|------|-----------|------|---------|-------|
| ? | Task creation | Pressable | `onPress={handleCreateTask}` | **[NEED EXACT LINES]** |

---

### Screen: CircleHome/index.tsx

**File:** [frontend/src/screens/Circle/CircleHome.tsx](frontend/src/screens/Circle/CircleHome.tsx)
*Note: Also referenced as CircleHomeScreen.tsx*

| Line | Component | Type | Handler | Status |
|------|-----------|------|---------|--------|
| 1764 | Back Button | TouchableOpacity | `onPress={() => navigation.goBack()}` | ✅ |
| 1779 | Members Icon Button | TouchableOpacity | `onPress={() => setShowMembersModal(true)}` | ✅ |
| 1785 | Action Menu Icon Button | TouchableOpacity | `onPress={() => setShowActionMenu(true)}` | ✅ |
| 1831 | Tab Navigation: "Feed" | TouchableOpacity | `onPress={() => setCircleTab(tab)}` | ✅ |
| 1858 | Tab Navigation: "Challenges", etc. | TouchableOpacity | `onPress={() => setFeedFilter(filter)}` | ✅ |
| 1915 | "Share Today" Button | TouchableOpacity | `onPress={handleShareToday}` | ✅ |
| 1934 | "Unhide All Posts" Button | TouchableOpacity | `onPress={handleUnhideAllPosts}` | ✅ |
| 1990 | Settings Icon | TouchableOpacity | `onPress={() => modals.setShowCircleSettings(true)}` | ✅ |
| 2019 | Navigate to Challenges | TouchableOpacity | `onPress={() => navigation.navigate('Home', {...})}` | ⚠️ Complex navigation |
| 2058 | Navigate to Challenges (alt) | TouchableOpacity | `onPress={() => navigation?.navigate('Home', {...})}` | ⚠️ Optional chaining |
| 2117 | Create New Challenge Button | TouchableOpacity | `onPress={() => setShowCreateChallengeModal(true)}` | ✅ |
| 2146-2191 | Action Menu Items (5 buttons) | TouchableOpacity | Various handlers | ✅ |

**Post Reactions:**
- Line 1704: Heart reaction → `onPress={() => handleReaction(post.id, 'heart')}`
- Line 1711: Fire reaction → `onPress={() => handleReaction(post.id, 'fire')}`
- Line 1718: Clap reaction → `onPress={() => handleReaction(post.id, 'clap')}`

**Modal Components:**
- Create Challenge Modal (Lines 2491-2662) - 15+ buttons
- Submit Proof Modal (Lines 2677-2725) - 3 buttons
- Assign Modal (Lines 2740+) - **[NEED EXACT LINES]**
- Decline Assignment Modal (Lines 2296-2478) - 5+ buttons

---

### Screen: Circles/index.tsx

**File:** [frontend/src/screens/Circle/Circles/index.tsx](frontend/src/screens/Circle/Circles/index.tsx)

| Line | Component | Type | Handler | Status |
|------|-----------|------|---------|--------|
| 39 | "Join Circle" Button | Pressable | `onPress={onJoinPress}` | ✅ |
| ? | Circle rows | Pressable | `onPress={handleCircleSelect}` | **[NEED EXACT LINES]** |

**Create Modal Component:**
- [frontend/src/screens/Circle/Circles/modals/CreateModal.tsx](frontend/src/screens/Circle/Circles/modals/CreateModal.tsx)
  - Line 49: Backdrop → `Pressable` → `onPress={onClose}`
  - Line 75-89: "Public" privacy option → `Pressable` → `onPress={() => onPrivacyChange('public')}`
  - Line 91-105: "Private" privacy option → `Pressable` → `onPress={() => onPrivacyChange('private')}`
  - Line 109-118: Create button → `Pressable` → `onPress={onSubmit}`

**Action Sheet Modal Component:**
- [frontend/src/screens/Circle/Circles/modals/ActionSheetModal.tsx](frontend/src/screens/Circle/Circles/modals/ActionSheetModal.tsx)
  - Line 47: Backdrop → `Pressable` → `onPress={onClose}`
  - Line 57-72: Copy Code → `Pressable` → `onPress={onCopyCode}`
  - Line 75-90: Mute Notifications → `Pressable` → `onPress={onMuteNotifications}`
  - Line 93-110: Leave Circle → `Pressable` → `onPress={onLeaveCircle}`

---

### Screen: Profile/index.tsx

**File:** [frontend/src/screens/Profile/index.tsx](frontend/src/screens/Profile/index.tsx)

| Line | Component | Type | Handler | Notes |
|------|-----------|------|---------|-------|
| ? | Profile menu items | Pressable | `onPress={handleNavigate(...)}` | **[NEED EXACT LINES]** |

---

### Screen: Settings/index.tsx

**File:** [frontend/src/screens/Settings/index.tsx](frontend/src/screens/Settings/index.tsx)

| Line | Component | Type | Handler | Notes |
|------|-----------|------|---------|-------|
| ? | Settings toggle switches | Pressable | `onPress={handleToggleSetting(...)}` | **[NEED EXACT LINES]** |

---

## SECTION 3: CUSTOM TAB BAR

**File:** [frontend/App.tsx](frontend/App.tsx) - Lines 107-178

| Line | Component | Type | Handler | Target |
|------|-----------|------|---------|--------|
| 155-177 | Voice Tab Button | TouchableOpacity | `onPress={onPress}` → `onVoicePress()` | Sets `showListening=true` |
| 155-177 | Standard Tabs (Home, Plan, Circles, Profile) | TouchableOpacity | `onPress={onPress}` | Navigate to respective stacks |

---

## SECTION 4: CRITICAL ISSUES

### 🔴 BLOCKER #1: VoiceAssistant Navigation in DailyBriefing
- **File:** [frontend/src/screens/DailyBriefing/components/QuickActions.tsx](frontend/src/screens/DailyBriefing/components/QuickActions.tsx) - Line 39
- **Issue:** Attempts to navigate to `'VoiceAssistant'` screen that doesn't exist in navigation stack
- **Actual Location:** Modal overlay at `App.tsx` line 307-310, controlled by `showListening` state
- **Impact:** Quick action button is dead - does nothing when tapped
- **Fix Required:** Pass callback from App → DailyBriefing → QuickActions to trigger `onVoicePress()`

### 🔴 BLOCKER #2: VoiceAssistant Navigation in AIInsights
- **File:** [frontend/src/screens/AIInsights/components/QuickActions.tsx](frontend/src/screens/AIInsights/components/QuickActions.tsx) - Line 32
- **Issue:** Same as blocker #1
- **Impact:** Quick action button is dead
- **Fix Required:** Same as blocker #1

### 🟠 HIGH #1: Missing Error Boundaries in handleNavigate()
- **Files Affected:**
  - [frontend/src/screens/Hub/index.tsx](frontend/src/screens/Hub/index.tsx) - Lines 99-119
  - [frontend/src/screens/Inbox/index.tsx](frontend/src/screens/Inbox/index.tsx) - Lines 226-240
  - [frontend/src/screens/Wallet/index.tsx](frontend/src/screens/Wallet/index.tsx) - Lines 85-100
  - [frontend/src/screens/Circles/index.tsx](frontend/src/screens/Circle/Circles/index.tsx) - Lines 220-240 (approx)
  - [frontend/src/screens/CircleHome/index.tsx](frontend/src/screens/Circle/CircleHome.tsx) - Lines 150-160 (approx)
- **Issue:** Each screen duplicates a `handleNavigate()` helper with identical try/catch but no user feedback
- **Impact:** Navigation errors are caught but silently fail - user gets no feedback
- **Fix Required:** Create centralized `useAppNavigation()` hook with error Alert

---

## SECTION 5: SCREENS REQUIRING DETAILED AUDIT

These screens need line-by-line enumeration. Use `grep_search` for each:

1. [frontend/src/screens/Challenges/index.tsx](frontend/src/screens/Challenges/index.tsx) - Challenge selection buttons
2. [frontend/src/screens/Tasks/index.tsx](frontend/src/screens/Tasks/index.tsx) - Task rows
3. [frontend/src/screens/Plan/index.tsx](frontend/src/screens/Plan/index.tsx) - Task creation form buttons
4. [frontend/src/screens/Profile/index.tsx](frontend/src/screens/Profile/index.tsx) - Profile menu navigation
5. [frontend/src/screens/Settings/index.tsx](frontend/src/screens/Settings/index.tsx) - Settings toggles
6. [frontend/src/screens/Streak/index.tsx](frontend/src/screens/Streak/index.tsx) - Streak screen interactions
7. [frontend/src/screens/Level/index.tsx](frontend/src/screens/Level/index.tsx) - Level screen interactions
8. [frontend/src/screens/Analytics/index.tsx](frontend/src/screens/Analytics/index.tsx) - Period selector buttons
9. [frontend/src/screens/DailyLifeCard/index.tsx](frontend/src/screens/DailyLifeCard/index.tsx) - Mood/mood selector buttons
10. [frontend/src/screens/Proof/ProofCamera.tsx](frontend/src/screens/Proof/ProofCamera.tsx) - Camera capture button
11. [frontend/src/screens/Proof/ProofConfirm.tsx](frontend/src/screens/Proof/ProofConfirm.tsx) - Confirm/retake buttons
12. [frontend/src/screens/SavedPlaces/index.tsx](frontend/src/screens/SavedPlaces/index.tsx) - Place cards and add button
13. [frontend/src/screens/TaskSorting/index.tsx](frontend/src/screens/TaskSorting/index.tsx) - Sort option buttons
14. [frontend/src/screens/Reset/index.tsx](frontend/src/screens/Reset/index.tsx) - Reset confirmation buttons
15. [frontend/src/screens/Notification/Notifications.tsx](frontend/src/screens/Notification/Notifications.tsx) - Notification list actions

---

## SUMMARY STATISTICS

| Metric | Count |
|--------|-------|
| **Total Registered Screens** | 26 |
| **Navigation Stacks** | 4 (Root + Home + Profile + Circles) |
| **Tab Buttons** | 5 (Home, Plan, Voice, Circles, Profile) |
| **Modal Overlays** | 1 (VoiceAssistantScreen) |
| **Interactive Elements Audited** | 120+ |
| **Critical Issues Found** | 2 (VoiceAssistant blocker x2) |
| **High Priority Issues** | 1 (Error boundary duplication) |
| **Screens Needing Detailed Audit** | 15 |

---

## SECTION 6: MINIMAL TEST SUITE

### Setup Instructions

```bash
# Install testing dependencies
cd frontend
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
npm install --save-dev detox detox-cli
```

**Jest Configuration (jest.config.js):**
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
};
```

---

### 6.1 Unit Tests for Critical Components

**Test File Structure:**
```
frontend/src/
  __tests__/
    components/
      LoginForm.test.tsx
      StatCards.test.tsx
      QuickActions.test.tsx
    screens/
      Hub.test.tsx
      CircleHome.test.tsx
    navigation/
      App.navigation.test.tsx
```

#### Test 1: LoginForm Component
**File:** `frontend/src/__tests__/components/LoginForm.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginForm } from '../../screens/Login/components/LoginForm';

describe('LoginForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnSwitchMode = jest.fn();
  const mockOnTogglePassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login mode correctly', () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginForm
        mode="login"
        email=""
        password=""
        isLoading={false}
        onEmailChange={() => {}}
        onPasswordChange={() => {}}
        onSubmit={mockOnSubmit}
        onSwitchMode={mockOnSwitchMode}
        onTogglePassword={mockOnTogglePassword}
        showPassword={false}
      />
    );

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('disables submit button when loading', () => {
    const { getByText } = render(
      <LoginForm
        mode="login"
        email="test@example.com"
        password="password123"
        isLoading={true}
        onEmailChange={() => {}}
        onPasswordChange={() => {}}
        onSubmit={mockOnSubmit}
        onSwitchMode={mockOnSwitchMode}
        onTogglePassword={mockOnTogglePassword}
        showPassword={false}
      />
    );

    const submitButton = getByText('Login').parent;
    expect(submitButton?.props.style).toContainEqual(
      expect.objectContaining({ opacity: 0.6 })
    );
  });

  it('calls onSubmit when submit button is pressed', () => {
    const { getByText } = render(
      <LoginForm
        mode="login"
        email="test@example.com"
        password="password123"
        isLoading={false}
        onEmailChange={() => {}}
        onPasswordChange={() => {}}
        onSubmit={mockOnSubmit}
        onSwitchMode={mockOnSwitchMode}
        onTogglePassword={mockOnTogglePassword}
        showPassword={false}
      />
    );

    fireEvent.press(getByText('Login'));
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('toggles password visibility', () => {
    const { getByTestId } = render(
      <LoginForm
        mode="login"
        email="test@example.com"
        password="password123"
        isLoading={false}
        onEmailChange={() => {}}
        onPasswordChange={() => {}}
        onSubmit={mockOnSubmit}
        onSwitchMode={mockOnSwitchMode}
        onTogglePassword={mockOnTogglePassword}
        showPassword={false}
      />
    );

    fireEvent.press(getByTestId('password-toggle'));
    expect(mockOnTogglePassword).toHaveBeenCalled();
  });
});
```

**Required Code Change:** Add `testID="password-toggle"` to password toggle button in [LoginForm.tsx line 83](frontend/src/screens/Login/components/LoginForm.tsx#L83)

---

#### Test 2: Hub QuickActions Component
**File:** `frontend/src/__tests__/components/QuickActions.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickActions } from '../../screens/Hub/components/QuickActions';

describe('Hub QuickActions Component', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all quick action buttons', () => {
    const { getByText } = render(
      <QuickActions onNavigate={mockOnNavigate} />
    );

    expect(getByText('Challenges')).toBeTruthy();
    expect(getByText('Wallet')).toBeTruthy();
    expect(getByText('Inbox')).toBeTruthy();
    expect(getByText('Analytics')).toBeTruthy();
  });

  it('navigates to Challenges when tapped', () => {
    const { getByText } = render(
      <QuickActions onNavigate={mockOnNavigate} />
    );

    fireEvent.press(getByText('Challenges'));
    expect(mockOnNavigate).toHaveBeenCalledWith('Challenges');
  });

  it('navigates to Wallet when tapped', () => {
    const { getByText } = render(
      <QuickActions onNavigate={mockOnNavigate} />
    );

    fireEvent.press(getByText('Wallet'));
    expect(mockOnNavigate).toHaveBeenCalledWith('Wallet');
  });
});
```

---

#### Test 3: StatCards Component
**File:** `frontend/src/__tests__/components/StatCards.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StreakCard, LevelCard } from '../../screens/Hub/components/StatCards';

describe('StatCards Components', () => {
  describe('StreakCard', () => {
    it('renders streak count correctly', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <StreakCard streak={7} onPress={mockOnPress} />
      );

      expect(getByText('7')).toBeTruthy();
      expect(getByText('Day Streak')).toBeTruthy();
    });

    it('calls onPress when tapped', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <StreakCard streak={7} onPress={mockOnPress} />
      );

      fireEvent.press(getByText('7'));
      expect(mockOnPress).toHaveBeenCalled();
    });
  });

  describe('LevelCard', () => {
    it('renders level and XP correctly', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <LevelCard level={5} xpToNext={250} onPress={mockOnPress} />
      );

      expect(getByText('5')).toBeTruthy();
      expect(getByText('Level')).toBeTruthy();
    });

    it('calls onPress when tapped', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <LevelCard level={5} xpToNext={250} onPress={mockOnPress} />
      );

      fireEvent.press(getByText('5'));
      expect(mockOnPress).toHaveBeenCalled();
    });
  });
});
```

---

### 6.2 Navigation Tests - Screen Mount Verification

**File:** `frontend/src/__tests__/navigation/App.navigation.test.tsx`

```typescript
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import App from '../../../App';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock navigation modules
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});

jest.mock('../../services/pushNotifications', () => ({
  usePushNotifications: () => ({
    register: jest.fn(),
    notification: null,
  }),
}));

describe('Navigation - Screen Mount Tests', () => {
  it('mounts LoginScreen when user is not authenticated', async () => {
    // Mock AuthContext to return no user
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
    });

    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(getByText(/login/i)).toBeTruthy();
    });
  });

  it('mounts MainTabs when user is authenticated', async () => {
    // Mock AuthContext to return a user
    jest.spyOn(require('../../contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: { id: 1, email: 'test@example.com', firstName: 'Test' },
      isLoading: false,
    });

    const { getByTestId } = render(<App />);
    
    await waitFor(() => {
      expect(getByTestId('main-tabs')).toBeTruthy();
    });
  });
});
```

**Required Code Changes:**
- Add `testID="main-tabs"` to Tab.Navigator in [App.tsx line 200](frontend/App.tsx#L200)

---

#### Navigation Test 2: HomeStack Screens
**File:** `frontend/src/__tests__/navigation/HomeStack.test.tsx`

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HubScreen } from '../../screens/Hub';
import { InboxScreen } from '../../screens/Inbox';
import { WalletScreen } from '../../screens/Wallet';
import { ChallengesScreen } from '../../screens/Challenges';

const Stack = createNativeStackNavigator();

describe('HomeStack Navigation', () => {
  it('mounts Hub screen', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Hub" component={HubScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
    
    expect(getByTestId('hub-screen')).toBeTruthy();
  });

  it('mounts Inbox screen', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Inbox" component={InboxScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
    
    expect(getByTestId('inbox-screen')).toBeTruthy();
  });

  it('mounts Wallet screen', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Wallet" component={WalletScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
    
    expect(getByTestId('wallet-screen')).toBeTruthy();
  });

  it('mounts Challenges screen', () => {
    const { getByTestId } = render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Challenges" component={ChallengesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
    
    expect(getByTestId('challenges-screen')).toBeTruthy();
  });
});
```

**Required Code Changes:** Add `testID` prop to root View in each screen:
- [Hub/index.tsx](frontend/src/screens/Hub/index.tsx) - Add `testID="hub-screen"`
- [Inbox/index.tsx](frontend/src/screens/Inbox/index.tsx) - Add `testID="inbox-screen"`
- [Wallet/index.tsx](frontend/src/screens/Wallet/index.tsx) - Add `testID="wallet-screen"`
- [Challenges/index.tsx](frontend/src/screens/Challenges/index.tsx) - Add `testID="challenges-screen"`

---

### 6.3 Interaction Tests - Main User Journeys

**File:** `frontend/src/__tests__/interactions/TaskCompletion.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { HubScreen } from '../../screens/Hub';
import * as tasksApi from '../../services/api';

// Mock API
jest.mock('../../services/api', () => ({
  tasksApi: {
    getTodayTasks: jest.fn(),
    completeTask: jest.fn(),
  },
}));

describe('Interaction Test: Task Completion Journey', () => {
  it('completes full task journey from Hub', async () => {
    const mockTasks = [
      { id: 1, title: 'Morning workout', completed: false, priority: 1 },
      { id: 2, title: 'Review documents', completed: false, priority: 2 },
    ];

    (tasksApi.tasksApi.getTodayTasks as jest.Mock).mockResolvedValue(mockTasks);
    (tasksApi.tasksApi.completeTask as jest.Mock).mockResolvedValue({ success: true });

    const { getByText, getByTestId } = render(
      <NavigationContainer>
        <HubScreen />
      </NavigationContainer>
    );

    // 1. Hub loads with tasks
    await waitFor(() => {
      expect(getByText('Morning workout')).toBeTruthy();
    });

    // 2. Tap task to complete
    fireEvent.press(getByTestId('task-1'));

    // 3. Verify completion API called
    await waitFor(() => {
      expect(tasksApi.tasksApi.completeTask).toHaveBeenCalledWith(1);
    });

    // 4. Verify UI updates
    await waitFor(() => {
      expect(getByTestId('task-1-completed')).toBeTruthy();
    });
  });
});
```

---

**File:** `frontend/src/__tests__/interactions/CircleNavigation.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { CirclesScreen } from '../../screens/Circle/Circles';
import * as circlesApi from '../../services/api';

jest.mock('../../services/api', () => ({
  circlesApi: {
    getUserCircles: jest.fn(),
  },
}));

describe('Interaction Test: Circle Navigation', () => {
  it('navigates from Circles list to CircleHome', async () => {
    const mockCircles = [
      { id: 1, name: 'Study Group', memberCount: 5 },
      { id: 2, name: 'Fitness Friends', memberCount: 3 },
    ];

    (circlesApi.circlesApi.getUserCircles as jest.Mock).mockResolvedValue(mockCircles);

    const mockNavigate = jest.fn();
    jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({
      navigate: mockNavigate,
    });

    const { getByText } = render(
      <NavigationContainer>
        <CirclesScreen />
      </NavigationContainer>
    );

    // 1. Circles list loads
    await waitFor(() => {
      expect(getByText('Study Group')).toBeTruthy();
    });

    // 2. Tap circle to navigate to CircleHome
    fireEvent.press(getByText('Study Group'));

    // 3. Verify navigation called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('CircleHome', { circleId: 1 });
    });
  });
});
```

---

**File:** `frontend/src/__tests__/interactions/VoiceAssistant.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import App from '../../../App';

describe('Interaction Test: Voice Assistant Modal', () => {
  it('opens VoiceAssistant modal when Voice tab is pressed', () => {
    const { getByText, getByTestId } = render(<App />);

    // 1. Find Voice tab button (labeled "Talk")
    const voiceButton = getByText('Talk');

    // 2. Tap Voice button
    fireEvent.press(voiceButton);

    // 3. Verify modal is visible
    expect(getByTestId('voice-assistant-modal')).toBeTruthy();
  });

  it('closes VoiceAssistant modal when onClose is called', () => {
    const { getByText, queryByTestId } = render(<App />);

    // Open modal
    fireEvent.press(getByText('Talk'));
    expect(queryByTestId('voice-assistant-modal')).toBeTruthy();

    // Close modal
    fireEvent.press(getByTestId('voice-assistant-close'));

    // Verify modal is hidden
    expect(queryByTestId('voice-assistant-modal')).toBeNull();
  });
});
```

**Required Code Changes:**
- Add `testID="voice-assistant-modal"` to VoiceAssistantScreen root View in [VoiceAssistant/index.tsx](frontend/src/screens/VoiceAssistant/index.tsx)
- Add `testID="voice-assistant-close"` to close button in VoiceAssistantScreen

---

### 6.4 E2E Testing with Detox - Smoke Test Plan

**Detox Configuration (package.json):**
```json
{
  "detox": {
    "test-runner": "jest",
    "configurations": {
      "ios.sim.debug": {
        "device": {
          "type": "iPhone 15 Pro"
        },
        "app": "ios.debug"
      }
    },
    "apps": {
      "ios.debug": {
        "type": "ios.app",
        "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/MYPAiOSApp.app",
        "build": "xcodebuild -workspace ios/MYPAiOSApp.xcworkspace -scheme MYPAiOSApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build"
      }
    }
  }
}
```

---

#### Detox Smoke Test 1: Authentication Flow
**File:** `frontend/e2e/auth.e2e.js`

```javascript
describe('E2E: Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen on first launch', async () => {
    await expect(element(by.text('Login'))).toBeVisible();
  });

  it('should login with valid credentials', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('submit-button')).tap();

    // Verify navigation to Hub
    await waitFor(element(by.id('hub-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should show error on invalid credentials', async () => {
    await element(by.id('email-input')).typeText('invalid@example.com');
    await element(by.id('password-input')).typeText('wrongpass');
    await element(by.id('submit-button')).tap();

    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });

  it('should toggle between login and register modes', async () => {
    await element(by.id('switch-mode-button')).tap();
    await expect(element(by.text('Create Account'))).toBeVisible();

    await element(by.id('switch-mode-button')).tap();
    await expect(element(by.text('Login'))).toBeVisible();
  });
});
```

**Required Code Changes for Detox:**
- Add `testID="email-input"` to email TextInput in LoginForm
- Add `testID="password-input"` to password TextInput in LoginForm
- Add `testID="submit-button"` to submit button in LoginForm
- Add `testID="switch-mode-button"` to mode switch button in LoginForm

---

#### Detox Smoke Test 2: Tab Navigation
**File:** `frontend/e2e/navigation.e2e.js`

```javascript
describe('E2E: Tab Navigation', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Assume user is logged in via test setup
  });

  it('should navigate between all tabs', async () => {
    // Home tab (default)
    await expect(element(by.id('hub-screen'))).toBeVisible();

    // Plan tab
    await element(by.text('Plan')).tap();
    await expect(element(by.id('plan-screen'))).toBeVisible();

    // Circles tab
    await element(by.text('Circles')).tap();
    await expect(element(by.id('circles-screen'))).toBeVisible();

    // Profile tab
    await element(by.text('Profile')).tap();
    await expect(element(by.id('profile-screen'))).toBeVisible();

    // Home tab again
    await element(by.text('Home')).tap();
    await expect(element(by.id('hub-screen'))).toBeVisible();
  });

  it('should open Voice Assistant modal from Voice tab', async () => {
    await element(by.text('Talk')).tap();
    await expect(element(by.id('voice-assistant-modal'))).toBeVisible();

    // Close modal
    await element(by.id('voice-assistant-close')).tap();
    await expect(element(by.id('voice-assistant-modal'))).not.toBeVisible();
  });
});
```

**Required Code Changes:**
- Add `testID="plan-screen"` to Plan screen root View
- Add `testID="circles-screen"` to CirclesList screen root View
- Add `testID="profile-screen"` to ProfileMain screen root View

---

#### Detox Smoke Test 3: Task Completion Journey
**File:** `frontend/e2e/tasks.e2e.js`

```javascript
describe('E2E: Task Completion', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Login and navigate to Hub
  });

  it('should complete a task from Hub screen', async () => {
    // Verify task appears in today's tasks
    await expect(element(by.id('task-1'))).toBeVisible();
    await expect(element(by.text('Morning workout'))).toBeVisible();

    // Tap task to complete
    await element(by.id('task-1')).tap();

    // Verify completion checkmark appears
    await waitFor(element(by.id('task-1-completed')))
      .toBeVisible()
      .withTimeout(2000);

    // Verify XP notification appears
    await expect(element(by.text('+50 XP'))).toBeVisible();
  });

  it('should navigate to Plan screen to add a task', async () => {
    // Tap "Quick Add" FAB
    await element(by.id('add-task-button')).tap();

    // Verify navigation to Plan screen
    await expect(element(by.id('plan-screen'))).toBeVisible();
  });

  it('should create a new task from Plan screen', async () => {
    await element(by.text('Plan')).tap();

    // Tap "Add Task" button
    await element(by.id('create-task-button')).tap();

    // Fill task details
    await element(by.id('task-title-input')).typeText('New test task');
    await element(by.id('task-priority-selector')).tap();
    await element(by.text('High')).tap();
    await element(by.id('save-task-button')).tap();

    // Verify task appears in list
    await expect(element(by.text('New test task'))).toBeVisible();
  });
});
```

**Required Code Changes:**
- Add `testID="task-{id}"` to each task row in Hub screen
- Add `testID="task-{id}-completed"` to completion checkmark
- Add `testID="add-task-button"` to Quick Add FAB in Hub
- Add `testID="create-task-button"` to create task button in Plan
- Add `testID="task-title-input"` to task title input in Plan
- Add `testID="task-priority-selector"` to priority selector
- Add `testID="save-task-button"` to save button

---

#### Detox Smoke Test 4: Circle Interaction
**File:** `frontend/e2e/circles.e2e.js`

```javascript
describe('E2E: Circle Interaction', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Assume logged in with user in circles
  });

  it('should navigate to CircleHome from Circles list', async () => {
    // Navigate to Circles tab
    await element(by.text('Circles')).tap();
    await expect(element(by.id('circles-screen'))).toBeVisible();

    // Tap first circle
    await element(by.id('circle-1')).tap();

    // Verify CircleHome loads
    await waitFor(element(by.id('circle-home-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should react to a post in CircleHome', async () => {
    // Assume already in CircleHome
    await expect(element(by.id('post-1'))).toBeVisible();

    // Tap heart reaction
    await element(by.id('post-1-reaction-heart')).tap();

    // Verify reaction count increments
    await expect(element(by.text('1 ❤️'))).toBeVisible();
  });

  it('should create a new challenge in circle', async () => {
    // Tap "Challenges" tab in CircleHome
    await element(by.text('Challenges')).tap();

    // Tap "Create Challenge" button
    await element(by.id('create-challenge-button')).tap();

    // Fill challenge details
    await element(by.id('challenge-title-input')).typeText('7-day streak');
    await element(by.id('challenge-type-selector')).tap();
    await element(by.text('Streak Days')).tap();
    await element(by.id('challenge-days-selector')).tap();
    await element(by.text('7 days')).tap();
    await element(by.id('create-challenge-submit')).tap();

    // Verify challenge appears in list
    await expect(element(by.text('7-day streak'))).toBeVisible();
  });
});
```

**Required Code Changes:**
- Add `testID="circle-{id}"` to circle cards in Circles list
- Add `testID="circle-home-screen"` to CircleHome root View
- Add `testID="post-{id}"` to each post card
- Add `testID="post-{id}-reaction-heart"` to heart reaction button
- Add `testID="create-challenge-button"` to create challenge button
- Add `testID` props to challenge creation form inputs

---

### Test Execution Commands

```bash
# Unit & Navigation Tests
cd frontend
npm test

# Run specific test suite
npm test -- LoginForm.test.tsx

# Run with coverage
npm test -- --coverage

# E2E Tests (Detox)
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug

# Run specific E2E test
detox test e2e/auth.e2e.js --configuration ios.sim.debug

# Run E2E in headless mode (CI)
detox test --configuration ios.sim.debug --headless
```

---

### Test Coverage Goals

| Category | Target | Current | Required Work |
|----------|--------|---------|---------------|
| Critical Components | 80% | 0% | Add 8 unit tests |
| Navigation Routes | 100% | 0% | Add testID to all 26 screens |
| User Interactions | 70% | 0% | Add 5 interaction tests |
| E2E Smoke Tests | 4 flows | 0 | Implement 4 Detox scenarios |

---

### Priority Test Implementation Order

**Phase 1 (Week 1) - Foundation:**
1. Add `testID` props to all screen root Views (26 screens)
2. Add `testID` props to critical buttons (login, submit, navigation)
3. Set up Jest configuration and test infrastructure
4. Write LoginForm unit test (validates disabled states, loading)

**Phase 2 (Week 2) - Navigation:**
5. Write navigation mount tests for all 26 screens
6. Write Hub component unit tests (QuickActions, StatCards)
7. Write interaction test for task completion journey

**Phase 3 (Week 3) - E2E:**
8. Set up Detox for iOS simulator
9. Write authentication E2E test
10. Write tab navigation E2E test
11. Write task completion E2E test

**Phase 4 (Week 4) - Coverage:**
12. Add Circle interaction tests
13. Add Voice Assistant modal tests
14. Achieve 70%+ coverage on critical paths

---

### Testing Blockers & Dependencies

**Blockers:**
1. **VoiceAssistant Navigation Bug** (Blocks E2E voice tests) - Must fix [AIInsights line 32](frontend/src/screens/AIInsights/components/QuickActions.tsx#L32) and [DailyBriefing line 39](frontend/src/screens/DailyBriefing/components/QuickActions.tsx#L39)
2. **Missing testID Props** (Blocks all tests) - Must add to all screens/components
3. **API Mocking Strategy** - Need to decide: MSW, manual mocks, or test backend

**Dependencies:**
- React Native Testing Library `^12.0.0`
- Jest Expo preset `^50.0.0`
- Detox `^20.0.0`
- Detox CLI for E2E orchestration

