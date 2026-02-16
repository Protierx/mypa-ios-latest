# MYPA — Profile vs Settings Restructure (iOS, Frontend Only)

## Objective
Fix current UX confusion where Profile and Settings content is mixed together.
Create a clean separation:

- Profile = identity + progress + outcomes
- Analytics = performance insights (75% modal)
- Settings = controls/configuration (full screen)

This is a frontend-only restructuring pass.
Do NOT modify backend schema, Supabase tables, or API contracts in this pass.

---

## Product Rules

1. Keep iOS-native feel:
   - Large title style
   - Rounded cards/sheets
   - Clear spacing hierarchy
   - Minimum 44x44 tap targets
   - Smooth sheet transitions

2. Keep existing navigation architecture wherever possible.
3. No duplicate controls across Profile and Settings.
4. No dead taps: every visible CTA must have working behavior (or disabled state with reason).
5. No raw errors shown to users.

---

## Information Architecture (Final Source of Truth)

## A) Profile Screen (Full Page)
Purpose: "Who I am + how I’m doing"

### Must contain
- Header:
  - Avatar
  - Display Name
  - Username
- Progress strip:
  - Level + XP + progress to next level
- KPI cards (summary only):
  - Streak
  - Tasks completed
  - Focus time
  - Challenges active/completed (summary metric)
- Primary action:
  - "Analytics" pill button -> opens Analytics modal (75% sheet)
- Secondary actions:
  - "Edit Profile" (optional)
  - "Open Settings" (required entry point)
- Optional:
  - Voice orb shortcut (if already used globally in app)

### Must NOT contain
- Integration connect/disconnect controls
- Notification toggles
- Voice sensitivity slider
- Legal/privacy controls
- Theme/accent toggles

---

## B) Analytics Modal (75% Sheet from bottom)
Purpose: "Performance insights"

### Presentation
- Bottom sheet occupying ~75% height
- Dismiss by swipe-down and close button
- Title: "Analytics"

### Sections
1. Time Saved Wallet
   - Today / 7 days / 30 days
2. XP Trends
   - XP gained over time
3. Streak Insights
   - Current streak
   - Longest streak
   - Missed days (if available in local data)
4. Completion Trends
   - Tasks completed over last 7/30 days
5. Focus Trends
   - Total focus time
   - Avg per day
6. Challenges Snapshot
   - Active
   - Completed
   - Participation ratio (if data exists)

### Notes
- If chart components already exist, reuse.
- If not, render clean stat rows/cards (no fake complex charting required for v1).
- Use empty states when data missing.
- Never show raw null/undefined.

---

## C) Settings Screen (Full Screen)
Purpose: "App controls & configuration"

### Required sections

#### 1) Account
- Display Name (editable)
- Username (editable)
- Timezone
- Location (optional)
- Avatar change entry

#### 2) Integrations
- Apple
- Google
- Email
- Calendar (if available in UI contract)
Each row:
- Status: Connected / Not connected
- Action: Connect / Manage / Disconnect (frontend placeholders allowed)
- No backend mutation required in this pass unless already wired

#### 3) AI & Voice
- Tap to Talk toggle
- Hold to Talk toggle
- Spoken Replies toggle
- Voice Sensitivity control

#### 4) Preferences
- Theme: Light / Dark / System
- Accent color preset picker
- Haptics toggle
- Notification preferences entry

#### 5) Privacy & Security
- Data export entry (placeholder allowed)
- Delete account entry (danger style, confirmation modal)
- Privacy policy / Terms links

#### 6) Session
- Sign out button

### Must NOT contain
- KPI performance cards duplicated from Profile
- Analytics charts (those belong in Analytics modal)

---

## Interaction & Navigation Rules

1. Swipe down from top gesture currently opening wrong mixed surface:
   - Rewire so gesture opens Profile (not mixed settings form).
2. From Profile:
   - Analytics pill opens Analytics 75% modal.
   - Settings button opens full Settings screen.
3. Back/close behavior:
   - Analytics sheet dismiss returns to Profile state unchanged.
   - Settings close/back returns to Profile.
4. Preserve existing mic/voice trigger behavior as currently implemented globally.

---

## UI/Design Requirements (iOS Theme)

- Use a soft neutral background with elevated white cards in light mode.
- Consistent corner radius scale:
  - Pills: 14–18
  - Cards: 16–20
  - Sheets: 24 top corners
- Typography hierarchy:
  - Large title for screen header
  - Section headers medium semibold
  - Metadata subdued gray
- Vertical rhythm:
  - 8/12/16/20 spacing system
- Avoid clutter:
  - Max 4 KPI cards visible above fold on Profile
- Accessibility:
  - Buttons/toggles >= 44px height
  - Sufficient contrast in both light/dark
  - Accessibility labels for toggles and destructive actions

---

## Engineering Scope

## In scope
- Refactor/move UI blocks between Profile and Settings
- Add Analytics modal component and wire opening/closing
- Update navigation routes/actions
- Fix duplicated/misplaced sections
- Improve iOS-consistent spacing/layout

## Out of scope
- Backend migrations
- Supabase schema changes
- New server-side analytics pipeline
- Payment/monetization UI
- Rewriting unrelated screens

---

## Expected File-Level Changes (guide)
(Use actual project paths; this is intent-level)

- Profile screen component
- Settings screen component
- Analytics modal component (new or extracted)
- Navigation wiring file(s)
- Shared settings rows/components (if needed)
- Theme tokens if minor adjustments needed

---

## Acceptance Criteria (must pass)

1. Profile screen no longer includes settings controls.
2. Settings screen no longer includes KPI/analytics cards.
3. Analytics opens as 75% sheet from Profile and dismisses correctly.
4. Integrations appear only in Settings.
5. No dead taps on visible controls.
6. No console errors from missing props after restructure.
7. iOS layout looks intentional (not prototype-like).
8. Existing task/circles behavior outside this scope is not broken.

---

## QA Checklist (manual)

1. Open profile via current gesture -> lands on clean Profile.
2. Tap Analytics pill -> analytics sheet opens at ~75% height.
3. Swipe down analytics sheet -> closes smoothly.
4. Tap Settings from Profile -> full Settings screen opens.
5. Verify sections exist: Account, Integrations, AI & Voice, Preferences, Privacy, Session.
6. Toggle voice/preferences controls -> UI state updates immediately.
7. Return to Profile -> state preserved.
8. Switch light/dark mode -> layout and contrast remain clean.
9. Test on small iPhone viewport -> no overlap/truncation.
10. Confirm no mixed duplicated rows between Profile and Settings.

---

## Implementation Notes for Claude
- Prefer incremental refactor over full rewrite.
- Reuse existing components where stable.
- Remove obsolete duplicated blocks after migration.
- Keep commit-ready, production-clean code.
- If blocked by unknown route names, infer best fit and document assumptions.
