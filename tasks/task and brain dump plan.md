# TASKS PAGE iOS EXECUTION RUNBOOK (Claude)

You are my Lead iOS React Native Engineer + QA Reliability Lead.

You must execute this runbook in strict order.
No scope drift. No analysis-only responses. Real code edits required.

---

## 0) Operating Contract (MANDATORY)

- Work in IMPLEMENTATION mode.
- Finish each step completely before moving to next.
- Do not touch unrelated screens.
- Keep iOS-native interaction patterns.
- No raw backend/internal errors in UI.
- No dead taps.
- No fake success states.
- If blocked by missing dependency, choose safest default, continue, and document assumption.
- Do not claim “done” unless all acceptance criteria pass.

---

## 1) Read Context + Map Current Wiring

### Actions
1. Read all relevant files for Tasks screen, modal, task service/store/hooks, prioritize logic, brain dump integration, calendar/date handling, and mic/voice entry.
2. Build an interaction map for every tap target on Tasks page:
   - All/Today/Tomorrow tabs
   - Calendar button
   - Prioritize button
   - Brain Dump button
   - Task row tap
   - Completion circle tap
   - Swipe actions
   - Completed section toggle
   - FAB (+)
   - Add/Edit modal controls
   - “Move to today/tomorrow” prompts
   - Edit “Save”
3. Identify every dead/no-op path and stale state path.

### Deliverable
- Output `Step 1 Report`:
  - files inspected
  - interaction map
  - list of broken flows with exact root-cause file/function

### Exit Criteria
- Every interaction has a mapped handler and expected effect.
- All broken paths are explicitly identified.

---

## 2) Fix Data Flow Integrity (Critical)

### Actions
1. Ensure single source of truth for tasks state (server + local store sync).
2. Fix create/edit payload mapping to DB fields.
3. Fix edit save pipeline:
   - update call
   - state refresh
   - UI re-render
4. Fix reschedule pipeline:
   - move to today/tomorrow updates due date
   - visible section/filter updates immediately
5. Fix prioritize pipeline:
   - action produces real reorder/update
   - UI reflects new order/data
6. Ensure optimistic updates rollback cleanly on failure.

### Deliverable
- Output `Step 2 Report`:
  - exact functions fixed
  - before/after behavior
  - error-handling paths

### Exit Criteria
- Edit Save always persists.
- Reschedule always changes due date + visible grouping.
- Prioritize is real (not cosmetic).

---

## 3) Rebuild Task Interaction Model (iOS-native)

### Required Behavior
- Completion circle tap = complete/uncomplete only.
- Row tap = open task detail/edit.
- Swipe left = delete (+ optional reschedule).
- No trailing arrow icon on task cards.
- Delete from detail uses iOS destructive confirmation.

### Actions
1. Implement iOS swipe actions for row-level destructive action(s).
2. Add undo banner/snackbar for delete (5–8s).
3. Add haptics for complete/delete actions.
4. Prevent duplicate tap triggers.

### Deliverable
- Output `Step 3 Report`:
  - gesture/tap map after changes
  - delete + undo behavior proof

### Exit Criteria
- User can complete, edit, and delete predictably in one attempt.
- No ambiguous controls.

---

## 4) Fix Header, Safe Area, and Top Controls

### Actions
1. Fix header/status-bar overlap and safe-area spacing on iOS.
2. Increase All/Today/Tomorrow touch targets:
   - min height ~44pt
   - wider pills
   - more spacing between controls
3. Keep calendar action aligned and consistent.
4. Preserve clean top rhythm (title/date/tabs/actions).

### Deliverable
- Output `Step 4 Report` with screenshots/description of spacing values used.

### Exit Criteria
- No overlap with Dynamic Island/status bar.
- Tabs are easy to hit; no frequent mis-taps.

---

## 5) Make Task Cards Informative (Not Empty)

### Required card content
- Title (prominent)
- Due status (Overdue/Today/Tomorrow/date)
- Time (if set)
- Duration (if set)
- Priority indicator (clear but subtle)
- Optional note indicator (if note exists)

### Actions
1. Redesign row metadata hierarchy for quick scanning.
2. Keep color semantics:
   - overdue/problem = red
   - neutral metadata = gray
   - primary actions = brand accent
3. Remove duplicated/competing chips.

### Deliverable
- Output `Step 5 Report` with field mapping and visual hierarchy summary.

### Exit Criteria
- Each card communicates status in <2 seconds.
- No “empty/blank” feeling.

---

## 6) Make “Estimated Time” Card Truly Alive

### Rules
- Must compute from active visible tasks in current filter context.
- Sum only tasks with duration.
- Show missing duration count.
- Exclude completed (unless explicitly configured otherwise).
- Recompute after create/edit/delete/complete/filter changes.

### Actions
1. Implement deterministic selector/computation.
2. Update card copy to explain scope (e.g., “Today”, “All active”, etc.).
3. Add subtle update feedback on recalculation.

### Deliverable
- Output `Step 6 Report`:
  - exact compute function
  - recompute triggers
  - sample calculations

### Exit Criteria
- Card updates instantly and correctly after each relevant action.

---

## 7) Rebuild Add/Edit Task Modal to iOS Standard

### Required modal behavior
- Clean bottom-sheet layout
- Clear header and close affordance
- Title -> Notes -> Date/Time/Duration -> Priority -> Primary CTA
- Primary CTA fixed above safe area
- Pickers commit on Done, revert on Cancel
- Save enabled only when valid/dirty

### Critical logic
- Edit must preload existing values correctly.
- Save must persist and refresh row immediately.
- Create without date/time routes to Brain Dump flow (existing product rule).

### Actions
1. Refactor modal layout and state handling.
2. Fix field binding bugs and picker commit bugs.
3. Ensure friendly error messaging and loading guards.

### Deliverable
- Output `Step 7 Report`:
  - modal state model
  - validation rules
  - create/edit branch behavior

### Exit Criteria
- No blank fields after save.
- No “Save does nothing.”
- Modal feels iOS-native and clean.

---

## 8) Replace Completed Row UX (Current Chevron Problem)

### Actions
1. Replace tiny ambiguous completed row with a clear expandable control:
   - “Completed (N)” + explicit View/Expand affordance.
2. Keep completed collapsed by default.
3. Ensure large completed counts remain manageable.
4. Optional: add “Clear completed” with confirmation (if supported by app policy).

### Deliverable
- Output `Step 8 Report`:
  - new completed interaction model
  - scalability behavior

### Exit Criteria
- Completed area is clear and not messy.

---

## 9) Restore Voice Mic on Tasks (Required)

### Requirement
Mic must exist on Tasks page (it was removed during redesign).

### Actions
1. Re-add mic entry point in top action zone without overlap.
2. Implement/confirm states:
   - idle
   - listening
   - processing
   - failure/retry
3. Prevent duplicate session launches.
4. Handle mic permissions gracefully with friendly prompts.

### Deliverable
- Output `Step 9 Report`:
  - mic placement
  - voice state behavior
  - failure handling

### Exit Criteria
- Mic is always available and stable on Tasks.

---

## 10) Fix Prioritize + Move Actions End-to-End

### Required
- “Prioritize” must perform real reorder logic (overdue + priority + nearest due).
- Move overdue task to today/tomorrow must persist and relocate item immediately.

### Actions
1. Implement deterministic prioritize strategy.
2. Ensure reschedule mutations update DB/store/UI.
3. Add user feedback messages with real result counts.
4. Add rollback on failure.

### Deliverable
- Output `Step 10 Report`:
  - strategy rules
  - before/after list behavior examples

### Exit Criteria
- Prioritize and move actions are verifiably functional.

---

## 11) Error UX + Reliability Hardening

### Actions
1. Replace raw errors with friendly copy:
   - “Couldn’t save changes. Try again.”
   - “Couldn’t move task right now.”
2. Keep technical details in dev logs only.
3. Add loading/disabled states for all primary actions.
4. Ensure no action can be tapped repeatedly to duplicate operations.

### Deliverable
- Output `Step 11 Report` with error map (UI message by failure type).

### Exit Criteria
- No raw technical error strings appear in user UI.
- No duplicate submissions from rapid taps.

---

## 12) Final Verification + Proof

### Mandatory verification matrix
Run and report pass/fail for each:

1. Create task with full data -> appears correctly
2. Create task without date/time -> routes to Brain Dump
3. Edit task -> save persists + UI updates
4. Complete/uncomplete -> counts + placement correct
5. Swipe delete -> deletes + undo restores
6. Reschedule/move day -> due date + section update
7. Prioritize -> actual reorder
8. Estimated card -> recalculates on every relevant change
9. Completed section -> clear expand/collapse behavior
10. Mic -> launches voice flow reliably
11. No raw errors visible
12. No dead taps on Tasks screen

### Deliverable
- Output `Step 12 Final Report`:
  - files changed (exact paths)
  - all pass/fail results
  - known limitations (if any)
  - why ready / what blocks readiness

### Definition of Done
Do not mark complete until ALL 12 verification items pass.

---

## OUTPUT FORMAT (Use this after each step)

### Step X Report
1. Files changed
2. What implemented
3. What tested
4. Pass/fail
5. Bugs fixed
6. Risks remaining
7. Next step

Use checkboxes for completion status:
- [ ] Done
- [ ] Partially done
- [ ] Blocked
