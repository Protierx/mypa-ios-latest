# Plan: ElevenLabs Conversational AI — Full Voice Migration

Replace the entire OpenAI Realtime + TTS voice pipeline with ElevenLabs Conversational AI SDK. This removes ~1,200 lines of manual audio handling (recording, PCM conversion, barge-in monitoring, WAV headers) and replaces them with the `@elevenlabs/react-native` SDK which handles STT, LLM, TTS, turn-taking, and interruptions natively via WebRTC.

## Steps

### 1. Install ElevenLabs SDK + LiveKit dependencies

In `frontend/package.json`, add:
- `@elevenlabs/react-native`
- `@livekit/react-native`
- `@livekit/react-native-webrtc`
- `@config-plugins/react-native-webrtc`
- `@livekit/react-native-expo-plugin`
- `livekit-client`
- `npm:elevenlabs` (for edge functions)

Update `frontend/app.json`:
- Add `NSMicrophoneUsageDescription` in `infoPlist`
- Add plugins: `["@livekit/react-native-expo-plugin", "@config-plugins/react-native-webrtc"]`

Run `npx expo prebuild --clean`.

### 2. Create `supabase/functions/elevenlabs-signed-url/index.ts`

New edge function that:
- Authenticates user via Supabase JWT
- Calls `POST https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id={AGENT_ID}` with `ELEVENLABS_API_KEY` header server-side
- Returns the signed WebSocket URL to the client
- Keeps API key off the device

Set `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` as Supabase secrets.

### 3. Rewrite `supabase/functions/text-to-speech/index.ts`

Swap OpenAI `tts-1` for ElevenLabs `eleven_flash_v2_5` model via `elevenlabs.textToSpeech.stream()`. Add Supabase Storage caching:
- Hash text+voice → check cache → stream if miss, tee to storage
- Keep same response format (`{ audio: base64, format: 'mp3' }`) so `speak()` fallback still works

This is the REST/discreet mode TTS path.

### 4. Create `frontend/src/services/voice/ElevenLabsVoiceService.ts`

Thin wrapper around the `useConversation` hook output, providing an imperative API that `VoiceContext.tsx` can call. Responsibilities:
- Map ElevenLabs callbacks (`onMessage`, `onModeChange`, `onStatusChange`, `onError`) to existing `VoiceState` machine (`idle`, `listening`, `processing`, `speaking`)
- Register all 22 action tools from `config.ts` as `clientTools` that call `actionExecutor`
- Handle `dynamicVariables` (user name, time of day, platform)
- Expose: `startSession(signedUrl)`, `endSession()`, `sendTextMessage(text)`, `sendContextualUpdate(context)`, `setMicMuted(bool)`

### 5. Rewrite `frontend/src/contexts/VoiceContext.tsx`

The biggest change. **Remove:**
- All `expo-av` recording logic
- `RealtimeVoiceService` usage
- PCM conversion, WAV headers
- Barge-in monitor (`startBargeInMonitor`, `stopBargeInMonitor`)
- Metering intervals, speech-end detection
- Manual audio playback

**Replace with:**
- `useConversation` hook from `@elevenlabs/react-native` with all callbacks wired to existing state
- `onModeChange({ mode: 'speaking' | 'listening' })` → sets `voiceState` to `speaking` or `listening`
- `onStatusChange({ status: 'connected' | 'connecting' | 'disconnected' })` → manages connection state
- `onMessage({ message, source })` → updates `transcript` (user) or `aiResponse` (agent)
- `clientTools` object with all 22 tools from `ACTION_TOOLS`, each calling `actionExecutor` and returning the result string
- `startListening()` → fetches signed URL from edge function → `conversation.startSession({ signedUrl, dynamicVariables, clientTools })`
- `stopListening()` / `endConversation()` → `conversation.endSession()`
- `bargeIn()` → no-op (ElevenLabs handles interruption natively via turn-taking model)
- `speak(text)` → `conversation.sendUserMessage(text)` if session active, else TTS fallback via edge function
- `submitText(text)` → `conversation.sendUserMessage(text)` for discreet mode
- Keep the REST fallback path for when ElevenLabs is unavailable (feature flag / network failure)
- Keep `confirmAction` / `cancelAction` as-is (these are UI button handlers)

### 6. Wrap `frontend/App.tsx` with `<ElevenLabsProvider>`

Add provider above `VoiceProvider` in the component tree:
```
GestureHandlerRootView
  └── ErrorBoundary
      └── SupabaseAuthProvider
          └── UserModelProvider
              └── ElevenLabsProvider        ← NEW
                  └── VoiceProvider
                      └── AppContent
```

This initializes the WebRTC subsystem that the `useConversation` hook requires.

### 7. Update `frontend/src/screens-v2/modals/SettingsModal.tsx` voice picker

Replace the 5 OpenAI voice options with ElevenLabs voice IDs:
- Group by accent (British, American, Australian) and gender (male, female)
- Add voice preview via `speak()`
- Store selected `voiceId` string instead of OpenAI voice name
- Pass as `dynamicVariable` or agent override on session start

### 8. Update `frontend/src/config/featureFlags.ts`

Rename `USE_REALTIME_VOICE` to `USE_ELEVENLABS_VOICE`. When `false`, fall back to the REST path (voice-command + text-to-speech edge functions with ElevenLabs TTS).

### 9. Configure ElevenLabs Agent in Dashboard

Create agent at `elevenlabs.io/app/agents` with:
- MYPA system prompt from `supabase/functions/_shared/config.ts`
- All 22 tools registered as client tools
- Voice selection (accent + gender)
- LLM set to `gpt-4o` (or `gemini-2.0-flash` for cost optimization on simple actions)
- Turn-detection settings tuned for responsiveness
- Authentication enabled (signed URL mode)

### 10. Remove deprecated files

- Delete `frontend/src/services/voice/RealtimeVoiceService.ts`
- Delete `frontend/src/services/voice/pcmUtils.ts` (if exists)
- Delete `supabase/functions/realtime-session/index.ts`
- Remove `socket.io-client` from dependencies (unused)

---

## Smoothness, Latency & Interruption Tuning

### Latency
- Use ElevenLabs `eleven_flash_v2_5` model for TTS (optimized for low TTFB)
- In the agent dashboard, set LLM to `gemini-2.0-flash` for simple CRUD tools and `gpt-4o` for complex tasks (brain dump, queries)
- Set `chunk_length_schedule: [50, 120, 160, 290]` for faster first-byte streaming

### Interruption / Barge-in
- ElevenLabs handles this natively via their proprietary turn-taking model — no custom barge-in monitor needed
- The multi-context WebSocket system automatically closes the current speech context and starts a new one when the user interrupts
- Configure interruption sensitivity in the agent dashboard under "Conversation flow"

### Voice Isolation
- For noisy environments, optionally create a `supabase/functions/voice-isolate/index.ts` edge function using `elevenlabs.audio_isolation.convert()` to clean audio before processing
- Future enhancement — the built-in ASR already handles moderate noise well

### Continuous Conversation
- `onModeChange` automatically alternates between `speaking` and `listening` — no manual auto-listen timer needed
- The session stays open until `endSession()` is called

### Silence / Idle Handling
- ElevenLabs bills silence at 5% rate
- Set an inactivity timeout (e.g., 30s) in the agent config to auto-end sessions when the user stops engaging
- In the client, listen for `onDisconnect` to reset to idle state

### Audio Quality
- WebRTC provides opus codec with adaptive bitrate — significantly better than the current PCM16-over-WebSocket approach
- No manual audio format conversion needed

### Caching
- The rewritten `text-to-speech` edge function caches ElevenLabs responses in Supabase Storage with hash-based keys
- Repeated phrases (greetings, confirmations like "Done!", "Okay, cancelled") serve instantly from CDN

---

## Further Considerations

1. **ElevenLabs Agent setup** — Configure the agent in the ElevenLabs dashboard (visual UI) for initial setup; use API for version control later.
2. **Tool registration** — ElevenLabs `clientTools` run on-device (React Native), while the current action system uses server-side `actionExecutor`. Both work, but client tools have lower latency since they skip the network round-trip. Recommend registering all 22 tools as client tools.
3. **Voice cloning option** — ElevenLabs supports custom voice cloning. If MYPA should have a unique branded voice (not a stock voice), this is possible with just a few minutes of sample audio.

---

## Current Architecture Reference

### Files to modify
| File | Action |
|------|--------|
| `frontend/package.json` | Add ElevenLabs + LiveKit deps |
| `frontend/app.json` | Add plugins + mic permission |
| `frontend/App.tsx` | Wrap with `<ElevenLabsProvider>` |
| `frontend/src/contexts/VoiceContext.tsx` (1,679 lines) | Major rewrite — replace OpenAI Realtime with ElevenLabs `useConversation` |
| `frontend/src/config/featureFlags.ts` | Rename flag |
| `frontend/src/screens-v2/modals/SettingsModal.tsx` | New voice picker with accents/gender |
| `supabase/functions/text-to-speech/index.ts` | Swap OpenAI TTS → ElevenLabs TTS + caching |

### Files to create
| File | Purpose |
|------|---------|
| `supabase/functions/elevenlabs-signed-url/index.ts` | Signed URL generation (auth) |
| `frontend/src/services/voice/ElevenLabsVoiceService.ts` | Imperative wrapper for useConversation |

### Files to delete
| File | Reason |
|------|--------|
| `frontend/src/services/voice/RealtimeVoiceService.ts` (671 lines) | Replaced by ElevenLabs SDK |
| `frontend/src/services/voice/pcmUtils.ts` | No longer needed (no PCM) |
| `supabase/functions/realtime-session/index.ts` | Replaced by elevenlabs-signed-url |

### Voice State Machine (preserved)
```
idle → listening → processing → speaking → idle (or → listening if continuous)
                                         ↗
timeout ← listening (8s no speech)
error ← any (auto-recover 5s)
offline ← idle (no network)
```

### Exported Context API (preserved)
```typescript
value = {
  voiceState, isVoiceEnabled, audioLevel, transcript, aiResponse, error,
  awaitingConfirmation, pendingAction, isConversationActive,
  startListening, stopListening, cancelListening, speak, stopSpeaking,
  bargeIn, confirmAction, cancelAction, endConversation,
  setVoiceEnabled, voiceSpeed, setVoiceSpeed, selectedVoice, setSelectedVoice,
  isDiscreetMode, setDiscreetMode, submitText,
  isOffline, connectionMode, retryConnection,
}
```

All consumers (AIHubScreen, VoiceFeedback, SettingsModal) continue to work without changes — the context API surface stays identical.

---

## 🚀 Advanced Features — Making MYPA the Best AI Voice on the Market

These steps go beyond the basic migration and add every capability from the ElevenLabs platform plus MYPA-specific intelligence features that no competitor has.

---

### 11. Post-Call Webhooks → User Learning Pipeline

**Purpose:** After every voice conversation, ElevenLabs sends a POST webhook with the full conversation transcript, tool usage, and evaluation scores. MYPA uses this to learn the user's patterns and get smarter over time.

#### 11a. Configure webhook in ElevenLabs Agent Dashboard
- URL: `https://<project-ref>.supabase.co/functions/v1/elevenlabs-webhook`
- Events: `conversation.ended`
- Enable "Data collection" with these fields:
  - `task_types_mentioned` (array) — categories of tasks the user talked about
  - `user_mood` (string) — detected emotional tone (calm, stressed, excited, tired)
  - `action_success_rate` (number) — % of tools that executed successfully
  - `session_duration_seconds` (number)
  - `interruption_count` (number) — how many times the user interrupted the agent
  - `topics_discussed` (array) — free-form topic extraction
- Enable "Evaluation criteria":
  - `task_completed`: Did the user accomplish what they wanted? (1-5)
  - `user_satisfied`: Did the user seem happy with the interaction? (1-5)
  - `response_relevance`: Were the agent's responses relevant? (1-5)

#### 11b. Create `supabase/functions/elevenlabs-webhook/index.ts`

New edge function that:
1. **Verifies webhook signature** using `elevenlabs-signature` header and shared secret
2. **Extracts conversation data:**
   - Full transcript (user + agent messages)
   - All tool calls and their results
   - Data collection fields (mood, topics, task types)
   - Evaluation scores
   - Duration, latency metrics
3. **Updates `user_model` table** with learned patterns:
   - `tone_preference` ← derived from `user_mood` trends (if user is consistently stressed, MYPA softens tone)
   - `common_reschedule_patterns` ← extracted from task manipulation patterns
   - `avg_task_durations` ← updated from focus session discussions
   - `voice_usage_rate` ← incremented from session count
   - `overwhelm_score` ← weighted from mood + interruption count + task volume
   - `completion_rate_7d` ← recalculated from tool success data
4. **Inserts into `event_log`** table:
   - `event_type: 'voice_session_complete'`
   - `action: 'conversation_analysis'`
   - `params: { transcript, tool_calls, evaluation_scores, data_collection }`
   - `latency_ms: session_duration_seconds * 1000`
   - `ai_model_used: 'elevenlabs-convai'`
   - `confidence: evaluation_scores.response_relevance / 5`
5. **Triggers nightly learning loop** — the existing `calculate-unlocks` edge function already reads `event_log` and updates `user_model`. The webhook data enriches this pipeline with voice-specific insights.

```typescript
// Webhook payload shape (from ElevenLabs docs)
interface WebhookPayload {
  type: 'conversation.ended';
  conversation_id: string;
  agent_id: string;
  status: 'done' | 'failed';
  transcript: Array<{ role: 'user' | 'agent'; message: string; timestamp: number }>;
  tool_calls: Array<{ tool_name: string; params: Record<string, any>; result: string }>;
  data_collection: Record<string, any>;
  evaluation: Record<string, number>;
  metadata: { duration_seconds: number; user_id: string };
}
```

#### 11c. Wire `user_id` into webhook metadata

When starting a session, pass the Supabase `user.id` as a `dynamicVariable`:
```typescript
conversation.startSession({
  signedUrl,
  dynamicVariables: {
    user_id: user.id,      // ← webhook receives this back
    user_name: profile.name,
    time_of_day: getTimeOfDay(),
    platform: 'ios',
  },
  clientTools,
});
```

The ElevenLabs agent prompt references `{{user_id}}` in a hidden system message so the webhook payload includes it.

---

### 12. Wake Word / Hotword Detection ("Hey MYPA")

**Purpose:** Users can activate MYPA hands-free without tapping the microphone button — just like "Hey Siri" or "OK Google". This is the Raspberry Pi-style always-listening feature adapted for mobile.

#### 12a. On-device hotword detection

Use `react-native-porcupine` (Picovoice) for on-device wake word detection:
- No audio sent to cloud until wake word triggers
- Custom wake word: "Hey MYPA" (trained via Picovoice Console)
- Runs in background with minimal battery impact
- Falls back to button-tap activation on devices that restrict background audio

Add to `frontend/package.json`:
```json
"@picovoice/porcupine-react-native": "^3.0.0",
"@picovoice/react-native-voice-processor": "^1.2.0"
```

#### 12b. Create `frontend/src/services/voice/WakeWordService.ts`

```typescript
interface WakeWordService {
  start(): Promise<void>;          // Begin listening for "Hey MYPA"
  stop(): void;                    // Stop hotword detection
  onDetected: () => void;          // Callback → startListening()
  isListening: boolean;
  sensitivity: number;             // 0.0 (fewer false positives) to 1.0 (more sensitive)
}
```

- When wake word detected → auto-call `startListening()` → opens ElevenLabs session
- While ElevenLabs session is active, pause wake word detection (avoid double-listen)
- On session end → resume wake word detection
- Configurable in Settings: toggle "Hey MYPA" on/off, sensitivity slider

#### 12c. Update `VoiceContext.tsx`

Add to context:
```typescript
isWakeWordEnabled: boolean;
setWakeWordEnabled: (enabled: boolean) => void;
wakeWordSensitivity: number;
setWakeWordSensitivity: (sensitivity: number) => void;
```

Wire `WakeWordService.onDetected` → `startListening()`.

#### 12d. Update Settings UI

Add "Hands-Free Activation" section in `SettingsModal.tsx`:
- Toggle: "Hey MYPA" wake word (default: off)
- Slider: Sensitivity (low / medium / high)
- Info text: "MYPA listens for the wake word on-device. No audio is sent to the cloud until activated."

#### 12e. Battery & permission considerations
- Request "Always" microphone permission if wake word enabled
- Add background audio mode to `app.json` infoPlist
- Monitor battery and auto-disable wake word below 15%
- Show persistent notification when wake word is active (iOS requirement)

---

### 13. Voice Isolation for Noisy Environments

**Purpose:** Clean the user's audio in noisy environments (coffee shops, commute, gym) before processing, dramatically improving accuracy.

#### 13a. Create `supabase/functions/voice-isolate/index.ts`

```typescript
import { ElevenLabsClient } from 'npm:elevenlabs';

// Accepts raw audio, returns voice-isolated audio
// Uses ElevenLabs Audio Isolation API
const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });
const isolatedStream = await client.audioIsolation.audioIsolation({
  audio: audioBlob,
});
```

#### 13b. Smart noise detection

In `VoiceContext.tsx`, monitor ambient noise level during idle state:
- If average dB > threshold (e.g., -30 dBFS), activate noise isolation mode
- Show subtle UI indicator: "🎧 Noise isolation active"
- Can be manually toggled in Settings

#### 13c. Integration with ElevenLabs Conversational AI

The ElevenLabs ASR already handles moderate noise. Voice isolation is for extreme cases:
- Pre-process audio before sending in REST/fallback mode
- For realtime mode, ElevenLabs' built-in noise handling is usually sufficient
- Offer a "Noisy environment" toggle that adjusts ASR sensitivity

---

### 14. Dynamic Contextual Awareness via `sendContextualUpdate()`

**Purpose:** MYPA's voice agent always knows what screen the user is on and what they're looking at, so it can give relevant responses without the user having to explain.

#### 14a. Screen context injection

When the user navigates between screens, send a contextual update to the active ElevenLabs session:

```typescript
// In navigation listener
conversation.sendContextualUpdate({
  type: 'screen_change',
  context: `User is now viewing their ${screenName}. ${screenSpecificContext}`,
});
```

Screen-specific context:
| Screen | Context sent |
|--------|-------------|
| Hub (Home) | "User has {n} tasks due today, {n} overdue. Current streak: {n} days." |
| Task List | "User is viewing {category} tasks. {n} incomplete, {n} due soon." |
| Focus Timer | "User is in a focus session for '{taskName}'. {minutes} remaining." |
| Circles | "User is viewing circle '{circleName}' with {n} members." |
| Brain Dump | "User is in brain dump mode. They've entered {n} items so far." |
| Settings | "User is in settings. Current voice: {voiceName}, speed: {speed}x." |
| Calendar | "User is viewing {date}. {n} events scheduled." |

#### 14b. Task context injection

When a conversation starts, inject recent task data as dynamic context:
```typescript
conversation.sendContextualUpdate({
  type: 'task_summary',
  context: `Recent tasks: ${recentTasks.map(t => t.title).join(', ')}. 
  Overdue: ${overdueTasks.length}. 
  Most common category: ${topCategory}.
  User's peak productivity hours: ${peakHours.join(', ')}.`,
});
```

#### 14c. Emotional/energy awareness

Use `user_model` data to adjust agent behavior:
```typescript
const overwhelmScore = userModel.overwhelm_score;
const completionRate = userModel.completion_rate_7d;

conversation.sendContextualUpdate({
  type: 'user_state',
  context: overwhelmScore > 0.7 
    ? 'User appears overwhelmed. Be extra gentle, suggest breaks, and avoid adding pressure.'
    : completionRate > 0.8
    ? 'User is in a great flow. Encourage momentum and celebrate wins.'
    : 'Normal state. Be warm and supportive as usual.',
});
```

---

### 15. Knowledge Base / RAG Integration

**Purpose:** Ground MYPA's responses in the user's actual data — their tasks, habits, preferences, and history — not just generic LLM knowledge.

#### 15a. ElevenLabs Agent Knowledge Base

In the ElevenLabs agent dashboard:
- Upload MYPA's personality guide as a static knowledge base document
- Enable "Dynamic knowledge" that's injected per-session via the system prompt

#### 15b. Per-session knowledge injection

When starting a session, build a knowledge context from Supabase data:
```typescript
const buildKnowledgeContext = async (userId: string) => {
  const [tasks, focusSessions, userModel] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', userId).order('due_date').limit(20),
    supabase.from('focus_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('user_model').select('*').eq('user_id', userId).single(),
  ]);
  
  return `
    USER'S CURRENT TASKS: ${JSON.stringify(tasks.data)}
    RECENT FOCUS SESSIONS: ${JSON.stringify(focusSessions.data)}
    USER PREFERENCES: tone=${userModel.data?.tone_preference}, 
    peak_hours=${JSON.stringify(userModel.data?.peak_hours)},
    overwhelm_score=${userModel.data?.overwhelm_score}
  `;
};
```

Inject as the first `sendContextualUpdate()` after session starts.

#### 15c. Conversation memory across sessions

Store conversation summaries in a new `conversation_history` table:
```sql
CREATE TABLE public.conversation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  conversation_id TEXT NOT NULL,
  summary TEXT NOT NULL,            -- LLM-generated summary of the conversation
  key_decisions JSONB DEFAULT '[]', -- e.g. ["User decided to reschedule gym to Tuesday"]
  action_items JSONB DEFAULT '[]',  -- tasks/actions that came out of the conversation
  mood TEXT,                        -- user's detected mood
  created_at TIMESTAMPTZ DEFAULT now()
);
```

The webhook (Step 11) generates a summary and stores it. On the next session, the last 3 summaries are injected as context:
```
"Previous conversations: 
1. Yesterday: User was stressed about deadline, rescheduled 3 tasks. Decided to focus on Project X first.
2. Monday: User completed weekly review, feeling good. Set up 5 new tasks.
3. Last Friday: User asked about circle features, invited 2 friends."
```

This gives MYPA continuity — it remembers what you talked about.

---

### 16. Pronunciation Dictionary

**Purpose:** Ensure MYPA correctly pronounces the user's name, project names, custom terminology, and app-specific vocabulary.

> ⚠️ **Model compatibility:** Phoneme tags (IPA/CMU) only work with `eleven_flash_v2`, `eleven_turbo_v2`, and `eleven_monolingual_v1` models. Other models silently skip phoneme entries. For those models, use **Alias tags** instead (word → alternative spelling). Phoneme tags are English-only; use Alias for other languages.

#### 16a. Create MYPA base pronunciation dictionary (PLS format)

Create a PLS XML file with MYPA-specific terms:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<lexicon version="1.0"
  xmlns="http://www.w3.org/2005/01/pronunciation-lexicon"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.w3.org/2005/01/pronunciation-lexicon
  http://www.w3.org/TR/2007/CR-pronunciation-lexicon-20071212/pls.xsd"
  alphabet="ipa" xml:lang="en-US">
  <lexeme>
    <grapheme>MYPA</grapheme>
    <phoneme>/maɪ.pɑː/</phoneme>
  </lexeme>
  <lexeme>
    <grapheme>Mypa</grapheme>
    <phoneme>/maɪ.pɑː/</phoneme>
  </lexeme>
  <lexeme>
    <grapheme>braindump</grapheme>
    <alias>brain dump</alias>
  </lexeme>
</lexicon>
```

#### 16b. Upload dictionary via edge function

Create `supabase/functions/pronunciation-dict/index.ts` that:
1. Calls `elevenlabs.pronunciationDictionaries.createFromFile()` with the PLS file on first run
2. Stores the returned `dictionary_id` + `version_id` in Supabase
3. Passes `PronunciationDictionaryVersionLocator` to all TTS calls:

```typescript
import { PronunciationDictionaryVersionLocator } from 'npm:elevenlabs';

const audio = await elevenlabs.textToSpeech.convert({
  text: responseText,
  voice_id: selectedVoice,
  model_id: 'eleven_flash_v2_5',
  pronunciation_dictionary_locators: [
    new PronunciationDictionaryVersionLocator({
      pronunciation_dictionary_id: dictId,
      version_id: versionId,
    }),
  ],
});
```

#### 16c. Dynamic user vocabulary

When user creates tasks with unusual names, add them to a per-user pronunciation map stored in their profile:
```typescript
// In Settings
customPronunciations: {
  "Khalid": "kah-LEED",
  "JIRA": "JEE-rah",
  "QBR": "Q B R",  // spell out acronyms
}
```

Two approaches:
- **For TTS fallback path:** Create per-user dictionaries via the API and attach locators to TTS calls
- **For Conversational AI agent:** Inject pronunciation guide into the system prompt as natural text ("Pronounce MYPA as My-Pah, the user's name Khalid as kah-LEED") — the agent's TTS will follow text cues
- **Tip:** Use AI tools (Claude, ChatGPT) to generate IPA/CMU notation for unusual words

---

### 17. Adaptive Voice Personality

**Purpose:** MYPA's voice dynamically adjusts based on context — more energetic in the morning, calmer at night, gentler when the user is stressed.

#### 17a. Time-of-day voice adjustment

```typescript
const getVoiceConfig = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { stability: 0.4, similarity_boost: 0.7, style: 0.6 };  // Energetic morning
  } else if (hour >= 12 && hour < 18) {
    return { stability: 0.5, similarity_boost: 0.75, style: 0.5 }; // Balanced afternoon
  } else {
    return { stability: 0.7, similarity_boost: 0.8, style: 0.3 };  // Calm evening
  }
};
```

These ElevenLabs voice settings control:
- **Stability** (lower = more expressive, higher = more consistent)
- **Similarity boost** (how close to the original voice)
- **Style exaggeration** (how dramatic the delivery)

#### 17b. Mood-responsive adjustment

Using the `overwhelm_score` from `user_model`:
- High overwhelm → increase stability (calmer), reduce style (less dramatic)
- Low overwhelm → decrease stability (more expressive), increase style (more enthusiastic)
- Celebrate wins: when user completes a task, temporarily boost enthusiasm

#### 17c. Per-response emotion hints

In the agent system prompt, instruct MYPA to use SSML-like emotion markers:
```
When the user completes a task, respond with genuine excitement.
When the user is stressed, lower your energy and be reassuring.
When giving time-sensitive reminders, be clear and slightly urgent.
```

ElevenLabs' expressive TTS naturally interprets these emotional cues from the text.

---

### 18. Real-Time Analytics Dashboard Data

**Purpose:** Feed voice interaction data into analytics so users can see their voice usage patterns and MYPA can quantify its own effectiveness.

#### 18a. Metrics to track (via webhook + event_log)

| Metric | Source | Storage |
|--------|--------|---------|
| Voice sessions per day | webhook `conversation.ended` | `event_log` |
| Avg session duration | webhook `duration_seconds` | `event_log.latency_ms` |
| Tasks created via voice | `clientTools` call count | `event_log.action = 'create_task'` |
| Voice command success rate | webhook `evaluation.task_completed` | `user_model.completion_rate_7d` |
| Most common voice commands | webhook `tool_calls` aggregation | `event_log.params` |
| User satisfaction trend | webhook `evaluation.user_satisfied` | new `voice_analytics` table |
| Interruption rate | webhook `interruption_count` | `event_log.params` |
| Time saved estimate | task creation time (voice vs manual) | computed metric |

#### 18b. Create `voice_analytics` aggregate table

```sql
CREATE TABLE public.voice_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sessions_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  tasks_created_by_voice INTEGER DEFAULT 0,
  avg_satisfaction REAL DEFAULT 0,
  avg_task_completion REAL DEFAULT 0,
  top_commands JSONB DEFAULT '[]',
  interruption_rate REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);
```

Updated daily by the webhook handler (Step 11) or the nightly `calculate-unlocks` function.

---

### 19. Conversation Quick Actions (Proactive Agent)

**Purpose:** MYPA doesn't just respond to commands — it proactively suggests actions based on context, making it feel truly intelligent.

#### 19a. Proactive triggers via agent prompt

In the MYPA system prompt, add proactive behavior rules:
```
PROACTIVE BEHAVIORS:
- If the user has overdue tasks, mention them naturally: "By the way, you have 2 overdue tasks. Want me to reschedule them?"
- If it's the user's peak productivity hour, suggest starting a focus session
- If the user hasn't done a brain dump this week, gently suggest one
- If a task deadline is within 2 hours, give a friendly reminder
- If the user's overwhelm score is high, suggest taking a break or deprioritizing
- After completing a task, suggest the next highest-priority one
```

#### 19b. Smart greeting via `dynamicVariables`

The agent greeting changes based on context:
```typescript
dynamicVariables: {
  greeting_context: overdueTasks > 0 
    ? `User has ${overdueTasks} overdue tasks` 
    : focusStreak > 5 
    ? `User is on a ${focusStreak}-day streak!` 
    : `Normal day, ${totalTasksToday} tasks planned`,
}
```

Agent prompt: "Use {{greeting_context}} to craft a personalized, natural opening. Don't just say 'hello'."

---

### 20. Offline Resilience & Graceful Degradation

**Purpose:** MYPA should work even with poor connectivity, degrading gracefully rather than breaking.

#### 20a. Connection quality detection

Monitor WebRTC connection quality metrics:
```typescript
// ElevenLabs SDK exposes connection stats
const connectionQuality = conversation.getConnectionQuality(); // 'excellent' | 'good' | 'poor'
```

#### 20b. Degradation tiers

| Network Quality | Voice Mode | Fallback |
|-----------------|-----------|----------|
| Excellent | Full ElevenLabs Conversational AI | — |
| Good | ElevenLabs with reduced audio quality | Auto-adjust bitrate |
| Poor | REST mode (voice-command + TTS edge functions) | Text input suggested |
| Offline | Discreet mode only (local text input) | Queue actions for sync |

#### 20c. Action queueing

When offline or degraded, queue voice-initiated actions locally:
```typescript
// Store in AsyncStorage
const queuedActions = [
  { action: 'create_task', params: { title: 'Buy groceries', priority: 'medium' }, timestamp: Date.now() },
];
// Sync when connection restored
```

---

### 21. Scribe v2 Realtime STT (Live Transcription)

**Purpose:** ElevenLabs' standalone Speech-to-Text API — **separate** from the Conversational AI agent (which handles STT internally). This gives MYPA three powerful capabilities the agent alone doesn't provide: live captions, faster discreet mode, and continuous voice-to-text brain dump.

> The Conversational AI agent already handles STT for normal voice conversations. Scribe v2 is for **additional** STT use cases outside the agent session.

#### 21a. Create single-use token edge function

Client-side Scribe requires a temporary token (not the API key). Create `supabase/functions/scribe-token/index.ts`:

```typescript
import { ElevenLabsClient } from 'npm:elevenlabs';

const client = new ElevenLabsClient({ apiKey: Deno.env.get('ELEVENLABS_API_KEY')! });

Deno.serve(async (req) => {
  // Auth: verify Supabase JWT
  const token = await client.tokens.singleUse.create('realtime_scribe');
  // Token auto-expires after 15 minutes
  return new Response(JSON.stringify(token), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 21b. Install client SDK

Add to `frontend/package.json`:
```json
"@elevenlabs/react": "latest",
"@elevenlabs/elevenlabs-js": "latest"
```

The `useScribe` hook from `@elevenlabs/react` handles mic access, WebSocket connection, and transcript events.

#### 21c. Create `frontend/src/services/voice/ScribeService.ts`

Wrapper around the `useScribe` hook for imperative use:

```typescript
import { useScribe } from '@elevenlabs/react';

// Hook usage in a component/context:
const scribe = useScribe({
  modelId: 'scribe_v2_realtime',
  onPartialTranscript: (data) => {
    // Live partial text — update UI in real-time
    setLiveCaption(data.text);
  },
  onCommittedTranscript: (data) => {
    // Final committed text — append to transcript
    appendTranscript(data.text);
  },
  onCommittedTranscriptWithTimestamps: (data) => {
    // Word-level timestamps for brain dump review
    appendWithTimestamps(data.words);
  },
});

// Connect with token + mic settings
await scribe.connect({
  token: singleUseToken, // from scribe-token edge function
  microphone: {
    echoCancellation: true,
    noiseSuppression: true,
  },
});

// Disconnect
scribe.disconnect();
```

#### 21d. Commit strategies

Two commit strategies depending on use case:

**VAD (Voice Activity Detection) — for live captions & brain dump:**
Auto-commits when silence is detected. Best for continuous transcription.
```typescript
import { CommitStrategy, AudioFormat } from '@elevenlabs/client';

const connection = Scribe.connect({
  token: singleUseToken,
  modelId: 'scribe_v2_realtime',
  audioFormat: AudioFormat.PCM_16000,
  commitStrategy: CommitStrategy.VAD,
  vadSilenceThresholdSecs: 1.5,  // commit after 1.5s silence
  vadThreshold: 0.4,             // sensitivity (0-1)
  minSpeechDurationMs: 100,
  minSilenceDurationMs: 100,
});
```

**Manual commit — for discreet mode:**
User types/taps "send" to commit the current segment.
```typescript
// Default strategy — commit when ready
await connection.commit();
```

> ⚠️ Don't commit manually in rapid succession — degrades model performance. Commit every 20-30s or during natural pauses. Auto-commit happens at 90s max.

#### 21e. Previous text context

When reconnecting or starting a follow-up transcription, send previous text context with the first audio chunk to improve accuracy:

```typescript
await connection.send({
  audio_base_64: audioChunk,
  previous_text: lastCommittedTranscript.slice(-50), // last 50 chars
});
```

Useful for:
- **Conversational AI context** — send the agent's last response as `previous_text` so Scribe understands the conversation flow
- **Reconnection after network error** — pick up where it left off
- Best results when `previous_text` is under 50 characters

#### 21f. Three use cases in MYPA

**1. Live captions (accessibility)**
Show partial transcripts on-screen as the user speaks during an ElevenLabs agent session. The agent handles STT→LLM→TTS, but Scribe provides visible text feedback:
```
┌──────────────────────────────┐
│  🎤 "Can you reschedule my..."  │  ← live partial (Scribe)
│                                  │
│  MYPA: "Sure! I've moved your    │  ← agent response
│  meeting to 3pm tomorrow."       │
└──────────────────────────────┘
```
Toggle in Settings: "Show live captions" (default: on)

**2. Improved discreet mode**
Instead of the current flow (record audio → send to voice-command edge function → wait for response), use client-side Scribe for instant local-ish transcription:
- User speaks → Scribe commits text in real-time → send committed text to AI via `submitText()` → response displayed as text (no audio playback)
- Much faster than the current REST round-trip for STT
- No ElevenLabs agent session needed — just Scribe + existing text AI pipeline

**3. Voice-to-text brain dump**
Continuous transcription mode for the brain dump feature:
- User taps "Voice Brain Dump" → Scribe starts with VAD commit strategy
- User talks freely for minutes — every committed segment becomes a brain dump item
- Word-level timestamps allow the user to review and tap any word to hear playback position
- When done, all committed transcripts are parsed by the AI into structured tasks (using existing brain dump → task pipeline)

#### 21g. Error handling

Handle these Scribe-specific errors gracefully:

| Error | Meaning | MYPA Response |
|-------|---------|---------------|
| `auth_error` | Bad token | Fetch new single-use token, reconnect |
| `quota_exceeded` | Plan limit hit | Fall back to existing voice-command edge function |
| `commit_throttled` | Too many manual commits | Show "Processing..." and wait |
| `insufficient_audio_activity` | Silence too long | Auto-disconnect, show "Listening timed out" |
| `session_time_limit_exceeded` | Max session reached | Auto-commit, start new session seamlessly |
| `chunk_size_exceeded` | Audio chunks too large | Reduce chunk size to 0.1-1s range |

#### 21h. Audio format best practices

- Use `PCM_16000` (16-bit PCM, 16kHz, little-endian) — best balance of quality and bandwidth
- Send audio chunks of 0.1-1 second for smooth streaming
- Only mono audio supported
- Ensure clean audio input, appropriate mic gain to avoid clipping

---

## Implementation Priority Order

| Priority | Steps | Impact | Effort |
|----------|-------|--------|--------|
| **P0 — Ship** | 1-10 | Core migration, voice works | 3-4 days |
| **P1 — Intelligence** | 11, 14, 15c, 19 | Webhooks, context, memory, proactive | 2 days |
| **P2 — Delight** | 12, 17, 16 | Wake word, adaptive voice, pronunciation | 2 days |
| **P3 — Robustness** | 13, 18, 20 | Noise isolation, analytics, offline | 1-2 days |
| **P4 — Polish** | 15a-b, 21 | Knowledge base, RAG tuning, Scribe live transcription | 1-2 days |

**Total estimated effort: 10-12 days** (from basic migration to best-in-market voice AI)

---

## What Makes This "Best in Market"

| Feature | Siri | Alexa | ChatGPT Voice | **MYPA** |
|---------|------|-------|---------------|----------|
| Natural voice quality | ⚡ Good | ⚡ Good | ⚡⚡ Great | ⚡⚡⚡ ElevenLabs (best TTS) |
| Accent & voice selection | ❌ Limited | ❌ Few | ❌ 1 voice | ✅ 5,000+ voices, accents, genders |
| Wake word | ✅ | ✅ | ❌ | ✅ "Hey MYPA" |
| Interruption handling | ⚡ Basic | ⚡ Basic | ⚡⚡ Good | ⚡⚡⚡ Native turn-taking |
| Learns from conversations | ❌ | ❌ Limited | ❌ | ✅ Post-call webhook → user model |
| Remembers past conversations | ❌ | ❌ | ✅ (ChatGPT Plus) | ✅ Conversation history summaries |
| Context-aware | ❌ | ❌ | ❌ | ✅ Screen + task + mood context |
| Proactive suggestions | ❌ | ❌ | ❌ | ✅ Based on user patterns |
| Noise handling | ⚡ Basic | ⚡ Basic | ⚡ Basic | ⚡⚡ Voice isolation API |
| Offline resilience | ✅ | ❌ | ❌ | ✅ Graceful degradation |
| Adaptive personality | ❌ | ❌ | ❌ | ✅ Time + mood + context |
| Task management integration | ❌ | ⚡ Basic | ❌ | ✅ 22 native tools |
| Live captions | ❌ | ❌ | ✅ (text mode) | ✅ Scribe v2 real-time partials |
| Voice-to-text brain dump | ❌ | ❌ | ❌ | ✅ Continuous Scribe → task parser |
| Open analytics | ❌ | ❌ | ❌ | ✅ Voice analytics dashboard |
