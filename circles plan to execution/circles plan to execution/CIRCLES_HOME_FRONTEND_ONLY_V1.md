# Circles — Circle Detail Screen (FRONTEND ONLY) Execution Plan (iOS-themed)

## Goal
Refactor the Circle Detail screen UI so it feels premium and iOS-native:
- Stop the “everything clumped together” feeling.
- Move “Invite/Code/Members” into a proper Settings modal.
- Make the social/accountability mechanic obvious:
  - show who checked in today
  - show who posted today
  - clear Check In + Check Out flows
- Keep feed as read-only posts (NO chat typing).
- Keep the mic button visible, but iOS styled and correctly placed.

## Non-negotiables
- FRONTEND ONLY: do NOT edit Supabase schema, migrations, or backend policies.
- No fake “dead” buttons: every button must do something (even if it’s a stub modal with “Coming soon”).
- iOS-native spacing, typography, and tappable targets (44px min).
- Use existing theme tokens/colors where possible.
- Avoid clutter: show only what matters on the main screen.

---

# A) Target Layout (New Structure)

## 1) Top Navigation Header (Fixed + Clean)
Replace the big banner-like header with a compact iOS header:

**Top row:**
- Left: Back (chevron) OR dismiss (if modal), whichever matches your nav pattern.
- Center: Circle name (bold). Optional tiny subtitle (member count).
- Right: 
  - Members icon (opens Members sheet OR Settings sheet to Members tab)
  - Settings icon (opens Settings modal)

**Mic button:**
- Must be visible on this screen.
- Place as a floating circular button near top-left OR top-right (choose best based on layout).
- Style: iOS floating icon button (white background, subtle shadow, purple icon), not oversized.

## 2) “Today Status Strip” (Competitiveness Block)
Directly under header: a compact strip that shows daily progress & faces.

Content:
- Label: “Today” + date
- Progress text: “3/6 checked in • 2 posts”
- Right side: small progress ring or percentage (optional)

Below that: “Member status bubbles” horizontal scroll:
- Each member shown as small avatar circle:
  - Checked-in: purple ring
  - Posted: green dot badge
  - Not checked-in: grey ring
- On tap: open small profile preview modal (name + status + streak placeholder)

This is the core “accountability feel”.

## 3) Primary Action Area (Check In / Check Out)
Below the member bubbles:

### If user has NOT checked in today:
Show a large primary button:
- “Check In” (purple filled)
Secondary: “What is this?” (tiny link opening explainer)

### If user HAS checked in today but NOT checked out:
Show a large button:
- “Check Out” OR “Share your day”
And show a subtle timer-like text:
- “Checked in at 10:24 • 2 tasks done” (if available)

### If user HAS checked out today:
Show completed state:
- “Done for today ✅”
- Optional: “View your post”

NOTE: Since backend is not included, state can be simulated with local component state (or existing store if present).

---

# B) Tabs (Content Areas)
Replace the current “Overview / Feed / Members / Challenges” bar with a cleaner iOS segmented control OR icon-tabs, but only show what matters:

Recommended tabs:
1) Feed (default after check-in strip)
2) Challenges
3) Overview (optional)

Members should NOT be a full tab anymore — it lives in Settings modal.

## Feed tab behavior
- This is NOT chat.
- It is a timeline of “daily posts” / check-in/out posts.
- Each post card shows:
  - avatar + name
  - timestamp
  - check-in text or check-out summary
  - XP gained (pill)
  - Time saved (pill)
  - Streak/level (tiny inline badge)
- No typing input.
- Optional: reactions row (like, clap) can be stubbed.

If feed is empty:
- Show a friendly empty state:
  “No posts yet. Be the first to check in today.”

## Challenges tab behavior
- Show active challenges for THIS circle only.
- Each challenge card shows:
  - title
  - description (1 line)
  - start/end dates
  - progress bar (even if placeholder)
  - “View details” → opens a modal (frontend only)
- If user is Owner/Admin, show “Create Challenge” button:
  - opens modal with Title/Description/Start/End date inputs
  - on save: add to local state list (frontend only)

## Overview tab behavior
Keep it simple:
- Members count
- Active challenges count
- Posts this week
- Basic streak placeholder

---

# C) Settings Modal (REQUIRED)
Add a Settings icon top-right that opens a modal (75% height sheet).

Modal layout:
- Header: “Circle Settings”
- Segmented tabs inside modal:
  1) Invite
  2) Members
  3) Admin (only if Owner)

### Invite tab
- Show invite code in a copyable pill
- “Copy code” button
- “Share invite” button (uses iOS share sheet if available, else stub)

### Members tab
- List of members with role badges (Owner/Admin/Member)
- Each row: avatar, name, role, status (checked in today or not)
- If Owner/Admin: actions on each member:
  - “Remove from circle” (confirm modal — frontend only)
  - “Make admin” (frontend only toggle)

### Admin tab (Owner only)
- Circle name edit (frontend only)
- Danger zone: “Leave circle” / “Delete circle” (confirm modal; stubbed action)

**Important:** This replaces the clutter of having Invite/Code/Members all on main page.

---

# D) Check In / Check Out Flow (FRONTEND ONLY)
When user taps Check In:
Open a modal (70–80% height) with:
- Title: “Check in”
- Prompt: “What are you focusing on today?”
- Suggested quick chips (tap to append):
  - “Gym”
  - “Work”
  - “Deep focus”
- Optional toggle: “Share my top 3 tasks” (if tasks exist, show preview list)
- Primary button: “Post Check-in”

On submit:
- Mark user checked-in in UI
- Add a feed post card: type=check_in with their text

When user taps Check Out:
Open a modal with:
- Title: “Check out”
- Prompt: “How did today go?”
- Quick selectors:
  - Mood (1–5)
  - “Time saved” (auto or manual input)
  - “XP gained” (auto or manual input)
- Text area: “Wins / what got done”
- Primary button: “Share update”

On submit:
- Mark user checked-out in UI
- Add a feed post card: type=check_out with summary

No backend = store these in local state for now, but structure code so it’s ready for backend later.

---

# E) Required Fixes / UX polish
- Remove the huge circle icon/banner dominance.
- Improve hierarchy: header → today status → action → tabs → content.
- Ensure the mic button does NOT overlap critical UI.
- Ensure every tap works:
  - Settings opens
  - Members opens
  - Challenges opens
  - Create challenge opens
  - Check-in/out opens + creates feed item
- Add subtle haptics on primary actions (if you’re already using expo-haptics).

---

# F) Deliverables (Claude must output these)
1) Files changed list
2) What UI components were created/updated
3) How check-in/out state is tracked (local)
4) Manual QA checklist:
   - check in
   - check out
   - open settings + copy code
   - open members list
   - create a challenge (owner)
   - feed rendering
5) Screenshots are not required, but the code must compile and run.

---

# G) Guardrails
- Do NOT change Supabase or backend.
- Do NOT add new navigation stacks unless required.
- Prefer bottom sheets / modals instead of pushing new screens.
- Keep it iOS themed and minimal.
