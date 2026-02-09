# MYPA Action System Contract
## Complete Action-by-Action Specification
### Every action: what it receives, what it touches, what it returns, what it logs

---

## How the Pipeline Works (End-to-End)

```
1. User speaks → mic captures audio
2. Audio sent to voice-command Edge Function (base64 or transcript)
3. Edge Function:
   a. If audio: Whisper STT → transcript
   b. GPT function-calling with ACTION_TOOLS → ActionJSON
   c. If query: execute server-side, return response_text + query_data
   d. If mutation: generate response_text, return ActionJSON for client
4. Client receives response:
   a. If query: speak response_text via TTS, done
   b. If mutation: actionExecutor.ts validates + executes via Supabase client
   c. Speak response_text via TTS
5. Event logged to event_log
```

**Key rule:** AI never writes data directly. Mutations always go through the client's `actionExecutor.ts`, which uses the user's authenticated Supabase session (RLS enforced).

---

## Action-by-Action Specifications

### 1. create_task

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast (gpt-4o-mini) |
| **Confirmation** | No |
| **Required Params** | `title` (string) |
| **Optional Params** | `date` (string, natural language or ISO), `time` (string), `duration_min` (number), `category` (Personal/Work/Health/Fitness/Wellness/Creative), `priority` (low/medium/high/urgent) |

**Supabase mutation:**
- Table: `tasks`
- Operation: INSERT
- Fields set: `user_id`, `title`, `due_date` (parsed from date param, defaults to today), `priority` (defaults to "medium"), `estimated_duration` (if provided), `category` (if provided)
- Date parsing: "tomorrow" → +1 day, "next week" → +7 days, ISO string → parsed directly

**Voice response:** `"Got it! Added '{title}' to your list."`
**Failure response:** `"Hmm, couldn't add that task. Mind trying again?"`

**Event log entry:**
- event_type: `task_action`
- action: `create_task`
- params: `{ title, date, priority, category }`
- success: true/false
- latency_ms: measured

**UI fallback:** QuickAddTaskOverlay or TasksViewScreen "+" button

---

### 2. update_task

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast |
| **Confirmation** | No |
| **Required Params** | `task_name` (string, fuzzy-matched) |
| **Optional Params** | `title`, `date`, `time`, `duration_min`, `category`, `priority` |

**Supabase mutation:**
- Table: `tasks`
- Step 1: SELECT id, title FROM tasks WHERE user_id = auth.uid() AND title ILIKE '%{task_name}%' AND status != 'completed' LIMIT 1
- Step 2: UPDATE tasks SET {changed fields} WHERE id = matched_task.id

**Voice response:** `"Updated '{task.title}'."`
**Not found:** `"Couldn't find a task matching '{task_name}'."`

**Event log:** event_type: `task_action`, action: `update_task`

**UI fallback:** TaskDetailModal → edit fields → save

---

### 3. complete_task

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast |
| **Confirmation** | No |
| **Required Params** | `task_name` (string, fuzzy-matched) |

**Supabase mutation:**
- Table: `tasks`
- Step 1: Fuzzy match by title (ILIKE, non-completed only)
- Step 2: UPDATE tasks SET status = 'completed', completed_at = now() WHERE id = matched_task.id
- Side effect: DB trigger `add_xp_on_task_complete` fires → updates profiles.xp

**Voice response:** `"Nice work! Marked '{task.title}' complete."`
**Not found:** `"I couldn't find a task matching '{task_name}'. What's it called?"`

**Event log:** event_type: `task_action`, action: `complete_task`

**UI fallback:** TasksViewScreen → tap checkbox, or TaskDetailModal → complete toggle

---

### 4. delete_task

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast |
| **Confirmation** | **YES** — spoken yes/no required |
| **Required Params** | `task_name` (string, fuzzy-matched) |

**Flow with confirmation:**
1. Edge Function returns `confirmation_required: true`
2. Client speaks: `"I'll delete '{task_name}' — are you sure?"`
3. Wait for user yes/no
4. If yes → execute DELETE
5. If no → cancel, return to IDLE

**Supabase mutation:**
- Table: `tasks`
- Step 1: Fuzzy match (includes completed tasks)
- Step 2: DELETE FROM tasks WHERE id = matched_task.id

**Voice response:** `"Deleted '{task.title}'."`

**Event log:** event_type: `task_action`, action: `delete_task`

**UI fallback:** TaskDetailModal → delete button → confirm alert

---

### 5. reschedule_task

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast |
| **Confirmation** | No |
| **Required Params** | `task_name` (string), `new_date` (string) |
| **Optional Params** | `new_time` (string) |

**Supabase mutation:**
- Table: `tasks`
- Step 1: Fuzzy match by title (non-completed)
- Step 2: UPDATE tasks SET due_date = parsed_date WHERE id = matched_task.id
- Date parsing: same as create_task ("tomorrow", "next week", ISO)

**Voice response:** `"Moved '{task.title}' to {date_label}."`
**Not found:** `"Couldn't find a task matching '{task_name}'."`

**Event log:** event_type: `task_action`, action: `reschedule_task`, params includes `{ new_date }`

**UI fallback:** TaskDetailModal → change date → save

---

### 6. batch_create_tasks

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | smart (gpt-4o) — multi-step reasoning needed to parse list |
| **Confirmation** | No |
| **Required Params** | `tasks` (array of {title, date?, priority?, category?}) |

**Supabase mutation:**
- Table: `tasks`
- Operation: INSERT multiple rows
- Each task gets: user_id, title, due_date (defaults to today), priority (defaults to "medium")

**Voice response:** `"Added {count} tasks to your list!"`
**Empty list:** `"No tasks to create."`

**Event log:** event_type: `task_action`, action: `batch_create_tasks`, params: `{ task_count }`

**UI fallback:** Brain dump screen → AI processes → review → confirm

---

### 7. start_focus_session

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast |
| **Confirmation** | No |
| **Required Params** | None |
| **Optional Params** | `task_name` (string, links focus to a task), `duration_min` (number, default 25) |

**Supabase mutation:**
- Table: `focus_sessions`
- Operation: INSERT
- Fields: user_id, duration_planned, task_id (if task_name matched), started_at

**Voice response:** `"Starting a {duration} minute focus session. You've got this!"`

**Event log:** event_type: `focus_action`, action: `start_focus_session`

**UI fallback:** FocusModal (swipe up) → select duration → start

---

### 8. pause_focus

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side, mostly UI-tracked) |
| **Model Tier** | fast |
| **Confirmation** | No |

**Supabase query:**
- Table: `focus_sessions`
- SELECT id FROM focus_sessions WHERE user_id = auth.uid() AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1
- Pause is tracked client-side (no DB column for paused state currently)

**Voice response:** `"Focus session paused. Take a breather!"`
**No active session:** `"No active focus session to pause."`

**Event log:** event_type: `focus_action`, action: `pause_focus`

---

### 9. resume_focus

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast |
| **Confirmation** | No |

Same pattern as pause_focus — finds active session, confirms it exists.

**Voice response:** `"Back at it! Focus session resumed."`

**Event log:** event_type: `focus_action`, action: `resume_focus`

---

### 10. end_focus

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast |
| **Confirmation** | No |

**Supabase mutation:**
- Table: `focus_sessions`
- Step 1: Find active session (ended_at IS NULL)
- Step 2: UPDATE SET ended_at = now(), duration_actual = calculated_minutes
- Side effect: DB trigger `add_xp_on_focus` fires → updates profiles.xp

**Voice response:** `"Nice work! {duration} minutes of focused time."`

**Event log:** event_type: `focus_action`, action: `end_focus`, params: `{ duration_actual }`

---

### 11. create_circle

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast |
| **Confirmation** | No |
| **Required Params** | `name` (string) |
| **Optional Params** | `emoji` (string, default "🎯"), `description` (string) |

**Supabase mutations (2 operations):**
1. INSERT into `circles`: name, emoji, description, owner_id, privacy = 'invite-only'
2. INSERT into `circle_members`: circle_id, user_id, role = 'owner'

**Free tier check:** Count user's circle memberships first. If >= 1 and not premium → reject with upsell message.

**Voice response:** `"Created '{name}' {emoji}!"`

**Event log:** event_type: `social_action`, action: `create_circle`

**UI fallback:** SocialViewScreen → Create Circle button → CreateCircleSheet

---

### 12. invite_to_circle

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast |
| **Confirmation** | No |
| **Required Params** | `circle_name` (string), `username` (string) |
| **Optional Params** | `message` (string) |

**Supabase mutations:**
1. SELECT circle by fuzzy name match (circles.name ILIKE)
2. SELECT target user by fuzzy username match (profiles.username ILIKE)
3. INSERT into `notifications`: type = 'circle_invite', user_id = target, data = { circle_id }

**Voice response:** `"Sent an invite to {username} for {circle.name}!"`
**Circle not found:** `"Couldn't find a circle called '{circle_name}'."`
**User not found:** `"Couldn't find a user '{username}'."`

**Event log:** event_type: `social_action`, action: `invite_to_circle`

**UI fallback:** CircleHomeModal → invite button

---

### 13. create_challenge

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast |
| **Confirmation** | No |
| **Required Params** | `circle_name`, `title`, `type` (focus_time/tasks_completed/daily_checkin/custom), `target_value` (number) |
| **Optional Params** | `duration_days` (default 7), `emoji`, `xp_reward` |

**Supabase mutations (2 operations):**
1. Find circle by name → INSERT into `challenges`: title, emoji, creator_id, circle_id, type, goal_value, duration_days, starts_at, ends_at, status = 'active'
2. INSERT into `challenge_participants`: challenge_id, user_id (creator), progress = 0

**Voice response:** `"Created challenge '{title}'! {duration_days} days to hit {target_value}."`

**Event log:** event_type: `social_action`, action: `create_challenge`

**UI fallback:** CircleHomeModal → Challenges tab → Create → CreateChallengeSheet

---

### 14. post_to_circle

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast |
| **Confirmation** | No |
| **Required Params** | `circle_name`, `content` |

**Supabase mutation:**
- Find circle by name
- **Current gap:** The action handler acknowledges but doesn't actually INSERT into `posts` table. Needs implementation.

**Voice response:** `"Posted to {circle.name}!"`

**Event log:** event_type: `social_action`, action: `post_to_circle`

**Gap note:** Handler is a stub — needs to INSERT into `posts` table.

---

### 15. brain_dump

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | smart (gpt-4o) |
| **Confirmation** | No |
| **Required Params** | `content` (string — raw stream of thoughts) |

**Current behavior:**
- INSERT single task with truncated title (100 chars) and full content as description
- **Gap:** Should use GPT to parse content into multiple tasks (batch_create_tasks behavior)

**Voice response:** `"Brain dump captured! I'll help you sort through it later."`

**Event log:** event_type: `task_action`, action: `brain_dump`

**Gap note:** Current implementation just saves as one task. Should ideally parse into structured tasks using the smart model.

---

### 16. set_preference

| Field | Value |
|-------|-------|
| **Type** | Mutation (client-side) |
| **Model Tier** | fast |
| **Confirmation** | No |
| **Required Params** | `key` (string), `value` (string) |

**Supabase mutation:**
- Table: `profiles`
- UPDATE profiles SET {key} = {value} WHERE id = auth.uid()
- Falls back to acknowledge even if column doesn't exist

**Voice response:** `"Updated {key} to {value}."`

**Event log:** event_type: `navigation`, action: `set_preference`

**Gap note:** Dynamically setting columns on profiles is fragile. Should validate key against a known list, or use a user_settings JSONB column.

---

### 17. query_tasks (SERVER-SIDE)

| Field | Value |
|-------|-------|
| **Type** | Query (executed on Edge Function) |
| **Model Tier** | fast |
| **Required Params** | None |
| **Optional Params** | `date` (today/tomorrow/ISO), `filter` (all/pending/completed/high_priority) |

**Supabase query (server-side, via authenticated client):**
- Table: `tasks`
- SELECT title, priority, due_date WHERE user_id AND date range AND status != completed
- ORDER BY due_date ASC, LIMIT 10

**Response examples:**
- 0 tasks: `"You're all clear for today! Nice work."`
- 1 task: `"Just one thing today: {title}."`
- N tasks: `"You've got {N} things today: {titles joined}."`

**Returns to client:** `query_data: { tasks, timeframe }`

---

### 18. query_schedule (SERVER-SIDE)

| Field | Value |
|-------|-------|
| **Type** | Query (executed on Edge Function) |
| **Optional Params** | `date` (today/tomorrow), `range` (day/week) |

**Supabase query:** Same as query_tasks but with range support (day or week lookahead). Includes estimated_duration.

**Response:** `"Here's what's coming up: {titles}. That's {N} items."`

---

### 19. query_stats (SERVER-SIDE)

| Field | Value |
|-------|-------|
| **Type** | Query (executed on Edge Function) |
| **Optional Params** | `metric` (streak/xp/level/focus/all) |

**Supabase query:**
- Table: `profiles`
- SELECT xp, level, streak_current, streak_longest WHERE id = user.id

**Response by metric:**
- streak: `"You're on a {N} day streak! {best note}"`
- xp: `"You've got {N} XP total."`
- level: `"You're level {N}."`
- all: `"Level {N}, {XP} XP, {streak} day streak. Keep it up!"`

---

### 20. query_circles (SERVER-SIDE)

| Field | Value |
|-------|-------|
| **Type** | Query (executed on Edge Function) |
| **Optional Params** | `circle_name` (string, for specific circle detail) |

**Supabase query:**
- Tables: `circle_members` JOIN `circles`
- SELECT circles.name, circles.emoji WHERE circle_members.user_id = user.id LIMIT 5

**Response:** `"You're in {N} circle(s): {names with emojis}."`
**No circles:** `"You're not in any circles yet. Want to create one?"`

---

### 21. unknown (CONVERSATIONAL FALLBACK)

| Field | Value |
|-------|-------|
| **Type** | Neither query nor mutation |
| **Model Tier** | smart (gpt-4o) |
| **Confidence** | 0.5 (default for text-only GPT responses) |

**Behavior:** GPT responded with text only (no function call). This means the user said something conversational, ambiguous, or unrecognized.

**Response:** Whatever GPT generated (e.g., "I'm here! What can I help with?")

**Event log:** event_type: `voice_command`, action: `unknown`, intent_raw: original transcript

**Important:** These should be monitored — high unknown rate means intent coverage is poor.

---

## Confidence and Confirmation Flow Summary

| Condition | Behavior |
|-----------|----------|
| confidence >= 0.7, no confirmation | Execute immediately |
| confidence < 0.7 | Ask: "Did you mean to {action}?" → wait for yes/no |
| confirmation_required (delete_task) | Ask: "I'll delete '{name}' — are you sure?" → wait for yes/no |
| yes → execute | Proceed with handler |
| no → cancel | Return to IDLE, no mutation |

---

## Gaps Found in Current Implementation

| Gap | Description | Severity |
|-----|------------|----------|
| post_to_circle is a stub | Acknowledges but doesn't INSERT into posts | Medium |
| brain_dump doesn't parse | Saves as single task instead of parsing into multiple | Medium |
| set_preference is fragile | Dynamic column names on profiles table | Low |
| No event logging in handlers | actionExecutor logs in processVoiceResponse, but individual handlers don't log | High — wiring gap |
| Date parsing is basic | Only handles "tomorrow" and "next week", not "next Monday", "Friday" | Medium |
| No time-of-day parsing | `time` param accepted but never applied to due_date | Low |
| Fuzzy match is basic | ILIKE '%name%' can match wrong tasks. No ranking/scoring. | Medium |
