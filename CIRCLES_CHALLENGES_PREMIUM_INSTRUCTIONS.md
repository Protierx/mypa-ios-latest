CIRCLES V1 EXECUTION PLAN (iOS Themed, £20/mo Quality Bar)

You are my Lead React Native Engineer + UX Architect + QA Lead.

CRITICAL RULES

Implement real code edits now. No vague advice.

Keep everything iOS-themed: clean spacing, large tap targets, soft cards, subtle shadows, native-feeling sheets.

No dead taps. Every CTA must do something meaningful.

No raw backend errors in UI. User-friendly errors only.

Small steps: complete each step fully before moving on.

Do not clutter the Tasks screen. Circles is the accountability hub.

SCOPE

Build/finish:

Circles Home Screen (list of circles + join/create + summary)

Circle Detail Screen (per-circle accountability hub)

Check-In / Check-Out flows (per circle, per day)

Circle Activity Feed (shows check-ins/check-outs + challenge updates)

Members view (status + who checked in)

Challenges (admin creates; members view details; progress tracking)

Admin/Settings (role-based controls)

Mic button remains (top-left in circle screens) to access AI voice assistant

PRODUCT MODEL (must implement exactly)
Key Rule: Check-in is per circle

User checks into the specific circle they are currently inside.

No check-in from Circles Home (home can show status, but check-in action happens inside circle).

Daily check-in / check-out rules

1 check-in per circle per day (enforced)

After check-in, main CTA becomes “Check Out”

Check-out references what was committed in check-in (pre-filled)

NAVIGATION (must be implemented + verified)
Circles Home → Circle Detail

Tap circle card → navigates to CircleDetail(circleId)

Circle Detail tabs (top segmented control)

Tabs (in this exact order):

Overview

Feed

Members

Challenges

Modal stack

Check In modal (bottom sheet)

Check Out modal (bottom sheet)

Challenge detail (screen or sheet)

Create challenge (admin only) (sheet)

Circle settings/admin (admin only) (screen)

Mic:

Mic icon should be accessible from CircleDetail (top-left)

It opens existing AI assistant modal (do not rebuild assistant, just wire to existing)

DATA MODEL (use Supabase or existing store patterns)
Entities (minimum)
circles

id

name

description (optional)

invite_code

owner_user_id

created_at

circle_members

id

circle_id

user_id

role: owner | admin | member

joined_at

circle_checkins

id

circle_id

user_id

date (YYYY-MM-DD)

intention_text

committed_task_ids (array, optional)

committed_focus_minutes (optional)

committed_challenge_id (optional)

proof_type (none|photo|voice) optional

proof_url optional

created_at

circle_checkouts

id

circle_id

user_id

date (YYYY-MM-DD)

result_status: done|partial|missed

completed_task_ids (array optional)

reflection_win (optional)

reflection_blocker (optional)

proof_type optional

proof_url optional

created_at

circle_challenges

id

circle_id

title

description

start_date

end_date

created_by

status: active|upcoming|completed|archived

created_at

circle_posts (feed)

(Optional but recommended for clean feed)

id

circle_id

user_id

type: checkin|checkout|challenge_created|challenge_completed|milestone|achievement

payload json

created_at

If you already have something similar in repo, map to existing schema. If missing, implement these tables + RLS.

UX SPEC (must match a premium app feel)
Circles Home (polish requirements)

Layout must include:

Header “Circles” + date subtitle

Top-right: “+” create/join action (or two pills)

Summary row: Circles count / Members count / Active challenges count (clean cards)

Section: “Your Circles” list

Each circle card shows: name, member count, your role badge, today check-in status badge (small)

Section: “Challenges” (circle-based only; SOLO can be moved later—keep minimal)

“Join with invite code” card at bottom (clean, not bulky)

NO weird extra sections. No clutter.

Circle Detail (the accountability hub)

Top area:

Back button

Circle name + small subtitle (members, streak, today status)

Mic icon top-left (opens AI voice)

Settings icon top-right (admin only or visible but gated)

Overview tab includes:

“Today’s Accountability” module:

Shows who checked in (avatars)

shows “x/y checked in”

progress bar

Primary CTA:

If not checked in today → Check In

If checked in but not checked out → Check Out

If checked out → show “Checked out ✅” + allow “View” (no re-checkout)

Feed tab:

Shows feed cards:

check-in posts

check-out posts

challenge created/ended updates

Each card:

avatar, name, timestamp

compact text

optional commitment/proof indicator

Keep reactions minimal in V1 (optional: 👍)

Members tab:

List of members with:

avatar

name

role badge if admin/owner

“Checked in today” badge

Challenges tab:

Active challenges list

Each challenge card shows:

title

end date countdown

participants count

progress summary (optional)

Admin-only: “New Challenge” button

CHECK-IN MODAL (exact fields)

Bottom sheet title: Check In
Fields:

Intention (required, 1 line or short text)
Placeholder: “What are you committing to today?”

Commitment chips

Tasks (optional): “Select tasks” opens picker sheet (pull from Tasks for Today/Overdue)

Focus minutes (optional): quick chips 15/30/60/custom

Challenge (optional): pick active challenge in this circle

Optional proof:

“Add photo” or “Add voice note” (optional; can be stubbed if not ready)
Primary button: Post Check-In

Rules:

Prevent double submit

After submit:

create checkin record

create feed post

update overview status immediately (optimistic UI if possible)

CHECK-OUT MODAL (exact fields)

Bottom sheet title: Check Out
Fields:

Result (required): Done / Partial / Missed (segmented control)

Completed tasks (if tasks were selected during check-in): checklist

Quick reflection (optional):

Win (short)

Blocker (short)

Optional proof
Primary button: Post Check-Out

Rules:

After submit:

create checkout record

create feed post

update overview status immediately

ADMIN + ROLES (must enforce)

Roles:

Owner/Admin can:

create challenge

edit circle details

remove members

regenerate invite code

Members can:

check in/out

view members/challenges/feed

If non-admin taps admin action:

show iOS alert: “Admin only”

RLS:

All reads limited to circle members

Writes only allowed if member of circle

Admin writes limited to admin/owner

CHALLENGES (V1 functionality)

Admin creates challenge:

title

description

start date

end date

auto status = upcoming or active depending on date
Members can:

view details

see countdown
Feed auto-posts:

“New challenge created”

“Challenge ended”

Progress tracking V1:

simple: show “days active” and participation count

do not overbuild scoring yet

IMPLEMENTATION STEPS (execute in this order)
STEP 1 — Audit + map files

Find existing Circles screens/components/hooks.

List exact files you will change.

Identify what buttons are currently dead and why.
Deliver: short audit list + file map.

STEP 2 — Circles Home polish + working navigation

Make Circles Home layout match spec.

Ensure Create Circle and Join Circle actions work.

Ensure tapping a circle navigates correctly with circleId.
Deliver: working screen + no dead taps.

STEP 3 — Circle Detail skeleton + tabs

Build CircleDetail with segmented tabs: Overview/Feed/Members/Challenges.

Wire mic button top-left to existing AI assistant modal.
Deliver: navigation works + tabs switch.

STEP 4 — Check-in flow end-to-end

Implement Check In modal + saving + feed post.

Enforce “1 check-in per circle per day”.

Update Overview to reflect checked-in state.
Deliver: end-to-end working.

STEP 5 — Check-out flow end-to-end

Implement Check Out modal + saving + feed post.

After checkout, lock actions for the day (view only).
Deliver: end-to-end working.

STEP 6 — Members tab + “checked in today” status

Query members and today’s checkins.

Render badges correctly.
Deliver: accurate member status.

STEP 7 — Challenges tab + admin creation

Implement challenge list and details.

Admin-only “New Challenge” modal.
Deliver: creation works; members can view.

STEP 8 — Admin/settings

Circle settings screen/sheet:

edit name

invite code copy/share

role management (basic)
Deliver: gated + functional.

STEP 9 — QA pass

Manual QA checklist: click-by-click

Fix any dead taps or missing states
Deliver: stable experience.

ACCEPTANCE CRITERIA (non-negotiable)

No dead buttons.

Check-in creates a feed post and changes the CTA to Check Out.

Check-out creates a feed post and locks for the day.

Feed shows check-in/check-out cards with timestamps.

Members list shows who checked in today.

Challenges can be created by admin and seen by members.

Mic is top-left on CircleDetail and works.

iOS spacing/tap targets (no tiny buttons).

OUTPUT FORMAT (Claude must follow)

For each step:

What changed

Files changed

Key logic added

How to verify (manual QA)

Do not jump steps. Implement step-by-step.