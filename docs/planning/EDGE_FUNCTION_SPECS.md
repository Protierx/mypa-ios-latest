# MYPA Edge Function Specifications
## Per-Function Request/Response/Error Contracts

---

## Function 1: voice-command

**File:** `supabase/functions/voice-command/index.ts` (457 lines)
**Purpose:** Process user speech into structured actions via GPT function-calling.

### Request

```
POST /functions/v1/voice-command
Authorization: Bearer {user_jwt}
Content-Type: application/json

{
  "audio": "base64_encoded_audio_data",  // OPTIONAL — raw audio (m4a)
  "transcript": "Add buy groceries tomorrow",  // OPTIONAL — pre-transcribed text
  "context": { "screen": "ai_hub" }  // OPTIONAL — current screen
}
```

**Rules:** Must provide either `audio` OR `transcript`. If `audio` provided, it's sent to Whisper STT first.

### Processing Pipeline

1. **STT (if audio):** base64 → Blob → Whisper API → transcript text
2. **Auth:** Create Supabase client with user's JWT → get user ID
3. **GPT Function Calling:** Send transcript + MYPA_SYSTEM_PROMPT + ACTION_TOOLS to GPT
   - Model: `MODEL_CONFIG.fast` (gpt-4o-mini) — always starts with fast tier
   - tool_choice: 'auto' (GPT decides whether to call a function)
   - max_tokens: 300
4. **Parse response:**
   - If tool_call present → structured action with confidence 0.95
   - If text only → unknown action with confidence 0.5
5. **Query actions (query_tasks, query_schedule, query_stats, query_circles):** Execute server-side reads, return data
6. **Mutation actions:** Generate spoken response via second GPT call, return ActionJSON for client execution
7. **Response generation:** Second GPT call with tool result context → natural language response (max 150 tokens)

### Response — Query Action

```json
{
  "success": true,
  "transcript": "What do I have today?",
  "action": {
    "action": "query_tasks",
    "params": { "date": "today" },
    "confirmation_required": false,
    "confidence": 0.95
  },
  "response_text": "You've got 3 things today: the report, that call with Sarah, and picking up your prescription.",
  "model_used": "gpt-4o-mini",
  "tokens_used": 245,
  "query_data": {
    "tasks": [
      { "title": "Finish report", "priority": "high", "due_date": "2026-02-09T10:00:00Z" },
      { "title": "Call Sarah", "priority": "medium", "due_date": "2026-02-09T14:00:00Z" },
      { "title": "Pick up prescription", "priority": "low", "due_date": "2026-02-09T17:00:00Z" }
    ],
    "timeframe": "today"
  }
}
```

### Response — Mutation Action

```json
{
  "success": true,
  "transcript": "Add buy groceries tomorrow",
  "action": {
    "action": "create_task",
    "params": { "title": "Buy groceries", "date": "tomorrow" },
    "confirmation_required": false,
    "confidence": 0.95
  },
  "response_text": "Got it! Added 'buy groceries' for tomorrow.",
  "model_used": "gpt-4o-mini",
  "tokens_used": 189
}
```

### Response — Conversational (Unknown)

```json
{
  "success": true,
  "transcript": "Good morning!",
  "action": {
    "action": "unknown",
    "params": {},
    "confirmation_required": false,
    "confidence": 0.5
  },
  "response_text": "Good morning! How can I help you today?",
  "model_used": "gpt-4o-mini",
  "tokens_used": 112
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | No transcript or audio | `{ "error": "No transcript or audio provided" }` |
| 401 | Invalid/missing JWT | `{ "error": "Unauthorized" }` |
| 500 | Whisper STT fails | `{ "error": "Failed to transcribe audio" }` |
| 500 | OpenAI API fails | `{ "error": "OpenAI API error: {status}" }` |
| 500 | Unexpected error | `{ "error": "{message}" }` |

### External API Calls

| Service | Endpoint | When |
|---------|----------|------|
| OpenAI Whisper | `POST https://api.openai.com/v1/audio/transcriptions` | When `audio` provided |
| OpenAI Chat | `POST https://api.openai.com/v1/chat/completions` | Always (intent parsing) |
| OpenAI Chat | Same | For mutations (response generation, second call) |

### Cost per Call

- Whisper STT: ~$0.006/minute of audio
- GPT-4o-mini (intent): ~$0.0003 per call (300 tokens avg)
- GPT-4o-mini (response gen): ~$0.0002 per call (150 tokens avg)
- **Total per voice command: ~$0.001-0.007** depending on whether audio transcription is needed

### Rate Limiting (NEEDED — not implemented)

- Recommended: 60 requests/minute/user
- Free tier: 10 per day (check event_log count)
- Return 429 if exceeded

---

## Function 2: daily-brief

**File:** `supabase/functions/daily-brief/index.ts` (303 lines)
**Purpose:** Generate personalized morning briefing with task summary, insights, and motivation.

### Request

```
POST /functions/v1/daily-brief
Authorization: Bearer {user_jwt}
Content-Type: application/json

{}  (no body required)
```

### Processing Pipeline

1. **Auth:** Get user from JWT
2. **Gather data:**
   - Profile: display_name, streak_current, streak_longest
   - User model: peak_hours (from user_models table)
   - Today's tasks: count, high priority count
   - Yesterday's completed: count
   - Active challenges: progress, days remaining
3. **Build context components:**
   - Peak hour suggestion: "You're in your peak focus time!" or "Peak focus in X hours"
   - Challenge update: "{title}: {percent}% complete, {days} days left"
   - Streak message: based on streak length
   - Motivational insight: based on yesterday's performance
4. **Generate AI brief:** GPT-4-turbo-preview with MYPA_BRIEF_PERSONALITY prompt + gathered context
5. **Fallback:** If OpenAI fails, generate template-based brief from data

### Response

```json
{
  "greeting": "Good morning!",
  "summary": {
    "totalTasks": 5,
    "highPriorityCount": 2,
    "completedYesterday": 3
  },
  "peakHourSuggestion": "Peak focus time coming up in 2 hours",
  "challengeUpdate": "Focus Challenge: 65% complete, 3 days left",
  "streakStatus": {
    "current": 12,
    "message": "12-day streak going!"
  },
  "motivationalInsight": "You crushed 3 tasks yesterday!",
  "briefText": "Morning Alex! You've got 5 things today with 2 big ones. Your focus sweet spot hits in about 2 hours - perfect time to tackle that proposal. You're on a 12-day streak, let's keep it rolling!"
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 401 | Invalid JWT | `{ "error": "Unauthorized" }` |
| 500 | Database or OpenAI failure | `{ "error": "{message}" }` |

### External API Calls

| Service | Endpoint | When |
|---------|----------|------|
| OpenAI Chat | `POST https://api.openai.com/v1/chat/completions` | Always (briefing generation) |

**Model used:** `gpt-4-turbo-preview` (NOTE: should use `MODEL_CONFIG.cached` from shared config instead of hardcoded)

### Cron Schedule

- Runs hourly via pg_cron
- Filters users where `profiles.timezone` indicates 6 AM local
- Caches result in `profiles.briefing_cache` + sets `profiles.briefing_date`
- **Gap:** Cron-based batch execution not implemented. Currently only works as on-demand per-user call.

---

## Function 3: calculate-unlocks

**File:** `supabase/functions/calculate-unlocks/index.ts` (204 lines)
**Purpose:** Check user progress against unlock thresholds. Grant new unlocks.

### Request

```
POST /functions/v1/calculate-unlocks
Authorization: Bearer {user_jwt}
Content-Type: application/json

{}  (no body required)
```

### Processing Pipeline

1. **Auth:** Get user from JWT
2. **Calculate stats:**
   - `daysActive`: days since account creation
   - `tasksCompleted`: COUNT from tasks WHERE status = completed
   - `focusSessions`: COUNT from focus_sessions WHERE ended_at IS NOT NULL
   - `inCircle`: EXISTS in circle_members
   - `streakDays`: from profiles.streak_current
3. **Check 8 unlock definitions against stats:**
   - task_insights: 5 tasks + 3 days
   - focus_stats: 3 focus sessions + 3 days
   - ai_sorting: 7 days
   - duration_estimates: 10 focus sessions + 7 days
   - challenges: 14 days + in a circle
   - circle_insights: 14 days + in a circle
   - custom_ai_voice: 30-day streak
   - predictive_tasks: 100 tasks + 30 days
4. **Grant new unlocks:** INSERT into `unlocks` table (user_id, feature, seen = false)
5. **Return all unlock states with progress**

### Response

```json
{
  "newUnlocks": ["ai_sorting"],
  "allUnlocks": [
    { "feature": "task_insights", "unlocked": true, "progress": null },
    { "feature": "focus_stats", "unlocked": true, "progress": null },
    { "feature": "ai_sorting", "unlocked": true, "progress": null },
    { "feature": "duration_estimates", "unlocked": false, "progress": {
      "focusSessions": { "current": 7, "required": 10 },
      "daysActive": { "current": 8, "required": 7 }
    }},
    { "feature": "challenges", "unlocked": false, "progress": {
      "daysActive": { "current": 8, "required": 14 },
      "inCircle": { "current": 1, "required": 1 }
    }}
  ],
  "stats": {
    "daysActive": 8,
    "tasksCompleted": 23,
    "focusSessions": 7,
    "inCircle": true,
    "streakDays": 5
  }
}
```

### Gaps

| Gap | Description |
|-----|------------|
| Doesn't compute user_model | PRD says nightly job should compute peak_hours, avg_task_durations, completion_rate, overwhelm_score. This function only checks unlock thresholds. |
| Doesn't update unlock_level on user_model | PRD wants a single unlock_level (1-5) on user_model, not individual feature flags |
| Doesn't set celebration pending flag | PRD wants unlock_celebration_pending flag for client to show modal |
| Doesn't insert notification on unlock | PRD wants a notification created on level transition |
| No idempotency guard | Should check last_calculated_at before re-running |
| Unlock definitions don't match PRD tiers | PRD has 5 levels (Basic/Peak Hours/Duration/Proactive/Full Personal) vs 8 individual features here |

---

## Function 4: ai-greeting

**File:** `supabase/functions/ai-greeting/index.ts` (78 lines)
**Purpose:** Generate a personalized greeting with task summary stats.

### Request

```
POST /functions/v1/ai-greeting
Authorization: Bearer {user_jwt}
```

### Response

```json
{
  "greeting": "Good morning, Alex! You've got a productive day ahead.",
  "taskCount": 5,
  "completedToday": 2,
  "streak": 12
}
```

### Notes
- Queries profiles for name and streak
- Counts today's tasks and completed tasks
- Generates greeting via GPT-4 Turbo (if API key available)
- Falls back to template greeting if OpenAI fails

---

## Function 5: send-push

**File:** `supabase/functions/send-push/index.ts` (85 lines)
**Purpose:** Send push notifications via Expo Push API.

### Request

```
POST /functions/v1/send-push
Authorization: Bearer {service_role_key}  // Server-only!
Content-Type: application/json

{
  "userId": "uuid",
  "title": "Streak Reminder",
  "body": "Don't forget to complete a task today!",
  "data": { "type": "streak_reminder" }
}
```

### Processing Pipeline

1. Look up user's push token from `profiles.push_token` (uses service role client)
2. Send to Expo Push API: `https://exp.host/--/api/v2/push/send`
3. Insert into `notifications` table for in-app display

### Response

```json
{
  "success": true,
  "result": { "id": "expo-push-ticket-id" }
}
```

### Security Note
This function is called by pg_cron with the service role key. It must NEVER be callable from the client with the anon key. Verify authorization header is the service role key.

---

## Function 6: text-to-speech

**File:** `supabase/functions/text-to-speech/index.ts` (85 lines)
**Purpose:** Convert text to speech audio via OpenAI TTS.

### Request

```
POST /functions/v1/text-to-speech
Authorization: Bearer {user_jwt}
Content-Type: application/json

{
  "text": "Got it! Added buy groceries for tomorrow.",
  "voice": "ash",    // Optional, default: ash
  "speed": 1.0       // Optional, default: 1.0
}
```

### Available Voices
alloy, ash, coral, echo, fable, onyx, nova, sage, shimmer

### Response

```json
{
  "audio": "base64_encoded_mp3_data",
  "format": "mp3",
  "voice": "ash"
}
```

### External API Call
- `POST https://api.openai.com/v1/audio/speech`
- Model: tts-1
- Response format: mp3

### Cost
- ~$0.015 per 1,000 characters

---

## Functions Needed (Not Yet Built)

### cleanup-events (Priority: P2)

```
POST /functions/v1/cleanup-events
Authorization: Bearer {service_role_key}

Purpose: Delete event_log rows older than 90 days
Schedule: Weekly (Sunday 3 AM UTC)
Idempotency: Inherent (deletes by date, safe to re-run)

Query: DELETE FROM event_log WHERE created_at < NOW() - INTERVAL '90 days'
```

### revenucat-webhook (Priority: P1)

```
POST /functions/v1/revenucat-webhook
Authorization: Bearer {revenucat_webhook_secret}

Purpose: Sync premium status on purchase/cancel/renew
Events handled:
- INITIAL_PURCHASE → UPDATE profiles SET is_premium = true
- RENEWAL → UPDATE profiles SET is_premium = true
- CANCELLATION → UPDATE profiles SET is_premium = false
- EXPIRATION → UPDATE profiles SET is_premium = false

Also: INSERT event_log with event_type = 'purchase', action = event_type
```

---

## Summary of External Dependencies

| Function | OpenAI Whisper | OpenAI Chat | OpenAI TTS | Expo Push | Supabase Auth | Supabase DB |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|
| voice-command | Yes (if audio) | Yes (2 calls) | No | No | Yes | Yes |
| daily-brief | No | Yes | No | No | Yes | Yes |
| calculate-unlocks | No | No | No | No | Yes | Yes |
| ai-greeting | No | Yes | No | No | Yes | Yes |
| send-push | No | No | No | Yes | Yes (service role) | Yes |
| text-to-speech | No | No | Yes | No | No | No |
