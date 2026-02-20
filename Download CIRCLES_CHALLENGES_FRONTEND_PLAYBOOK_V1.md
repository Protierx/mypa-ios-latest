# Circles — Challenges (V1) Frontend Playbook
**Goal:** Make the *frontend UX* for challenges feel crystal clear, polished, and hard to “accidentally cheat”, **before** we touch backend/RLS.

This playbook implements the model we agreed:
- **Duration = time window** (e.g., 7 days)
- **Goal = what counts as completion** (e.g., 4 check-ins / 120 minutes / 5 challenge tasks)
- **Tracking method** determines what kind of progress events count
- **Tasks tracking** counts only **challenge-linked tasks** (created from inside the challenge experience)

**Hard guardrails (V1):**
- ✅ Keep existing navigation and tabs (no new tabs).
- ✅ Don’t redesign unrelated screens.
- ✅ No backend migrations / RLS work in this phase.
- ✅ Avoid fragile “task title must match challenge title” logic.
- ✅ No raw error strings shown to users.

---

## Outcomes (what “done” looks like)
When a user creates or views a challenge, it must be obvious:
- how long it runs (**Duration**),
- what they must do (**Goal**),
- what counts (**Tracking Method**),
- and how to log progress (proof/minutes/tasks).

### ✅ Examples (must read like English in UI)
- “**Check in 4 times** within **7 days**”
- “**Focus 120 minutes** within **7 days**”
- “**Complete 5 challenge tasks** within **7 days**”

---

## Glossary
- **Circle Daily Check-In:** daily “status” post (separate feature)
- **Challenge Progress:** progress toward a challenge’s goal (separate feature)
- **Challenge-linked Task:** a normal task that includes a `challengeId` tag/link so it counts for that challenge

---

# Step-by-step implementation plan (frontend only)

## Step 0 — Audit current challenge UI and navigation
- [ ] Locate **NewChallenge** modal/screen file and its state model
- [ ] Locate **Challenge cards** in Circle Feed and Circle Challenges tab
- [ ] Locate any existing **Challenge detail** surface (screen/modal)
- [ ] Locate existing **Add Task modal** and task creation flow
- [ ] Locate task item renderer (where you can add a “Challenge chip”)
- [ ] Confirm the existing navigation routes + params for Circle detail

**Deliverable:** a short note in code comments or PR description listing the exact files found.

---

## Step 1 — Update the New Challenge modal to include Goal (dynamic)
### 1.1 UX changes (keep the current visual structure)
In “New Challenge”, after **Tracking Method**, add **GOAL** section with dynamic input.

**Proof Check-in**
- [ ] Add input: “Required check-ins” (number)
- [ ] Helper text: “How many proof check-ins are needed to complete?”

**Focus Minutes**
- [ ] Add input: “Target minutes” (number)
- [ ] Helper text: “Total minutes needed within the challenge window.”

**Challenge Tasks** (rename from “Tasks Completed” if possible)
- [ ] Add input: “Tasks required” (number)
- [ ] Helper text: “Only tasks created from inside this challenge count.”

### 1.2 Validation rules (frontend)
- [ ] Title required (min 2 chars)
- [ ] Duration required (min 1 day)
- [ ] Goal required (min 1)
- [ ] “Create” button disabled until valid
- [ ] On submit: show friendly inline errors, not alert spam

### 1.3 Summary card update (must be clear)
Replace “Duration implies check-ins” behavior.

Summary must display:
- [ ] Title
- [ ] Duration (“7 days”)
- [ ] Tracking method label
- [ ] Goal in plain English (examples above)

**Acceptance checks**
- [ ] Set Duration 7, Goal 4, Proof check-in → summary says “Check in 4 times within 7 days”
- [ ] Set Duration 7, Goal 120, Focus minutes → summary says “Focus 120 minutes within 7 days”
- [ ] Set Duration 7, Goal 5, Challenge tasks → summary says “Complete 5 challenge tasks within 7 days”

---

## Step 2 — Challenge “Preview” surface (View → Join)
If you already have a preview modal for join, ensure it shows the new Goal wording.

- [ ] Challenge Preview displays:
  - [ ] Title
  - [ ] Circle name (optional)
  - [ ] Description/rules
  - [ ] Duration
  - [ ] Tracking method
  - [ ] **Goal sentence** (plain English)
- [ ] CTA state:
  - [ ] Not joined: “Join Challenge”
  - [ ] Joined: “View Challenge” / “Open”

**No backend required:** joined state can be stubbed from existing membership state (whatever you already have), but UI must support both states.

---

## Step 3 — Challenge Detail surface (where progress + actions live)
We need a dedicated place users land **after joining** (or when they tap “View Challenge”).

### 3.1 Layout (minimal, iOS-friendly)
- [ ] Header: challenge title + circle context
- [ ] Progress block:
  - [ ] “Progress: X / goal”
  - [ ] A progress bar
  - [ ] Goal sentence
  - [ ] Time remaining (“6 days left”) (frontend only is ok)
- [ ] Action area depends on tracking method (below)

### 3.2 Tracking-specific action area
**A) Proof Check-in**
- [ ] Primary button: “Add proof check-in”
- [ ] Opens Proof modal (can be placeholder UI-only in this phase)
- [ ] Show recent proof items list area (can be empty-state UI)

**B) Focus Minutes**
- [ ] Show “Start focus for this challenge” button
- [ ] This should **deep link** into your existing Focus surface, preselecting this challenge context (frontend param only)
- [ ] Show “Logged minutes” summary UI (empty-state ok)

**C) Challenge Tasks**
This is the key part you asked for.

- [ ] Show primary button: **“Add Challenge Task”**
- [ ] Below: list of challenge-linked tasks (empty state: “No challenge tasks yet”)

**Acceptance checks**
- [ ] For tasks method, I can add a task from inside challenge detail
- [ ] The task is visibly marked as challenge-linked
- [ ] Completing it would (eventually) increment progress (we’ll wire backend later; for now the UI must be ready)

---

## Step 4 — “Add Challenge Task” must create a normal Task (tagged)
### 4.1 Add a “challenge mode” to your existing Add Task modal
Do NOT create a separate task form.

When opened from Challenge Detail:
- [ ] Prefill a badge/label: “Counts toward: {Challenge Title}”
- [ ] Store `challengeId` in the task draft payload (frontend-only field OK)
- [ ] Optionally store `challengeTitle` for display, if needed
- [ ] Submit creates a normal task using your existing task creation pathway

### 4.2 Tasks page visibility
Challenge tasks should appear in Tasks page like normal tasks.
- [ ] Task list item shows a small chip/badge:
  - “Challenge: {title}”
- [ ] Tapping the chip can (optional) navigate back to Challenge Detail

**Acceptance checks**
- [ ] Add challenge task → appears on Tasks page
- [ ] It’s visually marked as part of a challenge
- [ ] It can be completed like any other task (completion behavior unchanged)

---

## Step 5 — Ensure challenge cards show Goal text everywhere
Anywhere a challenge appears (Feed card, Challenges tab card, Active Challenge card), add the same consistent microcopy:
- [ ] “Goal: …” sentence
- [ ] Duration

This removes confusion across the app.

---

## Step 6 — Active Challenges area (frontend behavior)
V1 rule: **only show joined challenges here**.

Frontend implementation (no backend):
- [ ] Active challenges list uses “joined” state (from existing membership state or stub)
- [ ] Challenge card shows:
  - [ ] title
  - [ ] progress X/goal (even if X is placeholder for now)
  - [ ] time remaining
  - [ ] CTA “Open” → Challenge Detail

---

## Step 7 — Error & empty states polish (must feel paid)
- [ ] Empty states for:
  - no challenges in circle
  - no active challenges
  - no challenge tasks
  - no proof check-ins
- [ ] Friendly errors:
  - “Couldn’t load challenge details. Try again.”
  - “Couldn’t create task. Please retry.”
- [ ] Loading states:
  - skeletons or “Loading…” (consistent)

---

## Step 8 — Manual QA checklist (frontend)
### Challenge creation
- [ ] Create proof check-in challenge: duration + goal set, summary reads correctly
- [ ] Create focus minutes challenge: duration + goal set, summary reads correctly
- [ ] Create challenge tasks challenge: duration + goal set, summary reads correctly
- [ ] Create button disabled until valid
- [ ] Cancelling closes safely with no partial state issues

### Join + navigation
- [ ] Tap challenge from circle → preview → join → open detail
- [ ] Preview shows goal sentence
- [ ] Joined state changes CTA from Join → View/Open

### Challenge tasks
- [ ] From challenge detail → Add Challenge Task → create task
- [ ] Task appears on Tasks page with challenge chip
- [ ] Task can be completed normally

### Focus minutes
- [ ] “Start focus for this challenge” routes into existing Focus surface (param passed)

---

# Implementation notes (so Claude doesn’t drift)
## Don’ts
- Don’t add new tabs or restructure navigation.
- Don’t implement backend migrations in this phase.
- Don’t use title-matching to count tasks.
- Don’t add a new “Tasks rule builder” complexity for V1.

## Do’s
- Keep copy consistent everywhere: “Goal sentence”.
- Make tasks tracking reliable by linking tasks to challenge.
- Make the flows obvious with minimal UI.

---

# Deliverables for this phase
- [ ] Updated New Challenge modal with Goal section + summary
- [ ] Challenge Preview shows Goal sentence
- [ ] Challenge Detail screen/modal with tracking-method actions
- [ ] Add Challenge Task opens existing Add Task modal in challenge mode
- [ ] Tasks list shows challenge chip for challenge-linked tasks
- [ ] Active Challenges shows only joined challenges (UI-ready)
- [ ] Manual QA checklist completed
