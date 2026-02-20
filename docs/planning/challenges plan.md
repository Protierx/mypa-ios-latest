You are my Senior React Native Engineer + Supabase Engineer.

Implement the V1 “Challenge Create → Notify → Preview → Join → Track (Active Challenges)” flow.

You MUST follow this plan file exactly:
@CIRCLES_CHALLENGE_JOIN_FLOW_PLAN.md

V1 RULES (DO NOT VIOLATE):
- Keep existing tabs/screens as-is (no new tabs).
- Challenges are created in a Circle and must appear in:
  1) Circle Feed
  2) Circle Challenges tab
- All circle members must receive an IN-APP notification in Hub → Socials tab:
  - includes challenge name + circle name
  - tapping it routes directly into the circle and opens the Challenge Preview Modal
- Users can join from:
  - Circle → Challenges tab (tap challenge → preview modal → Join)
  - Socials notification (tap → circle opens → preview modal → Join)
- Do NOT show challenges in the user’s “Active Challenges” area until AFTER they join.
- Circle daily check-in is separate from challenge progress (do not merge concepts).

IMPLEMENTATION REQUIREMENTS:
1) Challenge Preview Modal (single shared modal)
- Shows title, circle name, description/rules, dates if available, participant count
- CTA:
  - Not joined: “Join Challenge”
  - Joined: “View Challenge”
- Join creates participant record and updates UI + Active Challenges immediately
- Friendly errors only (no raw DB error strings)

2) Notifications on challenge creation
- On challenge create, create notifications for all circle members (optionally exclude creator)
- Preferred: server-side edge function/RPC for reliability (create challenge + fanout notifications)
- If server-side is not feasible in this project, implement a safe client-side fanout with rollback/alerts and document the limitation.

3) Socials tab notification tap routing
- Tap notification → mark as read → navigate to Circle detail with params:
  - circleId
  - openChallengeId
- Circle screen auto-opens the Challenge Preview Modal when openChallengeId is present, then clears the param/flag so it doesn’t reopen.

4) Active Challenges area logic
- Must display ONLY joined + active challenges (participant-based)
- Must NEVER display unjoined challenges
- Must include empty state

DELIVERABLE FORMAT (MANDATORY):
A) File-by-file change plan (before you edit)
B) Implementation (real code changes, no placeholders)
C) Mapping: where each plan requirement was implemented
D) Manual QA checklist (two-account test included)
E) Known limitations (if any)

GUARDRAILS:
- Do not redesign UI broadly.
- Do not add new tabs.
- Keep changes scoped to Circles + Socials notifications + minimal shared navigation/util if needed.
- If blocked, state the blocker + best default assumption, then continue.