# CIRCLES ACCOUNTABILITY PAGE — REQUIREMENT LOCK (iOS, v1)

Implement exactly this behavior for circle detail/accountability surface.

## 1) Core Product Rule
This screen is for accountability inside a circle.
Do NOT implement "Assign Mission" in v1.
If any old "Assign Mission" UI exists, remove or hide it.

## 2) Challenge Permissions (MANDATORY)
Roles:
- Owner
- Admin
- Member

Permissions:
- Owner/Admin: can create challenge, edit challenge, archive challenge
- Member: read-only for challenge config, can view details and participate/check-in

Enforcement:
- Apply at UI level (button visibility) AND service level (role guard).
- If unauthorized user calls create/edit challenge action, return friendly error:
  "You don’t have permission to manage challenges in this circle."

## 3) Challenge Model (MANDATORY FIELDS)
Challenge create form must require:
- title (string, required, max sensible length)
- description (string, optional but supported)
- start_date (date, required)
- end_date (date, required, must be >= start_date)

Derived status:
- upcoming: today < start_date
- active: start_date <= today <= end_date
- completed: today > end_date
- archived: manually archived by owner/admin

Validation:
- title cannot be empty
- end_date must not be before start_date
- reject invalid save with inline error messages

## 4) Circle Detail Screen Purpose + Layout (iOS themed)
When user taps a circle from Circles Home, open Circle Detail sheet/page with this structure:

A) Top Nav
- Back/close (left)
- Circle identity center (icon + name + member count)
- Actions (right): share/invite/settings (role-based)
- iOS safe-area correct spacing

B) Accountability Summary Block (top content)
- "Today’s activity" summary line (e.g., "3/5 posted today")
- Member avatar row with visual posted/not-posted status
- Progress bar for today accountability completion
- Optional streak chip (if data available)

C) Primary Actions Row
- Primary button: "Share Update" (all members)
- Secondary button: "Invite" (owner/admin)
- Secondary button: "New Challenge" (owner/admin only)
- No Assign Mission button in v1

D) Section Tabs (segmented / pill style)
- Feed
- Members
- Challenges
(Default tab: Feed)

E) Feed tab
- Accountability posts/check-ins list
- Each item: member, timestamp, quick stats, reactions (if supported)
- Empty state copy if no activity

F) Members tab
- Member list + role badges
- Owner/Admin controls:
  - Promote/demote
  - Remove member
  - Transfer ownership (owner only)
- Member sees read-only list

G) Challenges tab
- List by status groups:
  - Active
  - Upcoming
  - Completed
- Challenge card shows:
  - title
  - date range
  - participant count/progress (if available)
- Tap card -> challenge detail view (readable by all)

## 5) Challenge Detail View
Must show:
- title
- description
- start date
- end date
- status badge (upcoming/active/completed/archived)
- created by (optional if available)
- participant section (if available)

Role actions:
- Owner/Admin: Edit, Archive
- Member: no edit/archive controls

## 6) Mic Placement Rule (MANDATORY)
- Keep mic entry on Circles Home at top-left action area (not floating bottom-right).
- If current mic exists bottom-right, relocate to top action bar.
- Must not overlap title/safe area.
- Tap opens AI assistant flow as currently wired.

## 7) Navigation + Functionality Contracts
All these must be fully wired (no dead taps):
- Tap circle row -> opens correct circle detail
- Tap New Challenge -> opens challenge form
- Save challenge -> persists + appears in Challenges tab immediately
- Tap challenge card -> opens detail
- Invite action -> opens share/invite flow
- Tab switching Feed/Members/Challenges updates content immediately
- Back/close returns correctly without stale state

## 8) Error Handling + UX Reliability
- No raw technical/backend errors in UI
- Friendly errors only:
  - "Couldn’t create challenge. Try again."
  - "Couldn’t load circle activity."
- Prevent duplicate submissions (disable save while saving)
- Show loading/skeleton for initial fetch and tab transitions
- Ensure all touch targets are iOS friendly (>=44pt)

## 9) Visual Direction (based on provided reference)
Use the reference layout intent:
- Clean light theme
- Purple accent for primary actions
- Strong hierarchy in accountability area
- Soft cards, clear spacing, iOS-native typography
But ignore/remove "Assign Mission" concept entirely.

## 10) Acceptance Criteria (must pass before done)
1. Admin/Owner can create challenge with required fields
2. Member cannot create/edit/archive challenge
3. Challenge appears in list with correct status and dates
4. Challenge detail shows title/description/start/end
5. Feed/Members/Challenges tabs all functional
6. Invite action works
7. Mic is top-left on Circles Home
8. No dead taps
9. No raw error strings in UI
10. iOS safe-area/layout has no overlap issues

## 11) Required Output Format from Claude
After implementation, output:
1) Files changed
2) What each changed file now does
3) Role/permission checks implemented
4) List of functions wired (tap -> result)
5) Test/verification performed
6) Remaining limitations (if any)po