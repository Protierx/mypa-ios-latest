# OpenAI Realtime API Implementation Plan

**Goal:** Replace the current record → Whisper → GPT → TTS flow with the OpenAI Realtime API for low-latency, streaming voice with native barge-in.

---

## Current vs Realtime

| Aspect | Current (Whisper + GPT + TTS) | Realtime API |
|--------|-------------------------------|--------------|
| Latency | ~2–5s round-trip | ~300–500ms, streaming |
| Barge-in | Custom (stop TTS, start listening) | Native (model stops when you speak) |
| Flow | Record → send → transcribe → intent → TTS → play | Stream audio ↔ model |
| Connection | HTTP per request | WebSocket (or WebRTC) |

---

## Prerequisites

1. **OpenAI Realtime API access** – GA as of 2025; confirm in your OpenAI account.
2. **Model:** `gpt-realtime` – speech-to-speech capable.

---

## Architecture Overview

```
┌─────────────────┐    1. Get ephemeral key      ┌──────────────────┐
│   React Native  │ ──────────────────────────►  │  Edge Function   │
│   (VoiceContext)│  POST /realtime-session      │  realtime-session│
└────────┬────────┘                              └────────┬─────────┘
         │                                                 │
         │ 2. Returns ek_xxx (ephemeral key)               │ Calls OpenAI
         │                                                 │ POST /v1/realtime/client_secrets
         │                                                 ▼
         │                                         ┌──────────────────┐
         │ 3. Connect WebSocket with ek_xxx        │  OpenAI API      │
         └──────────────────────────────────────► │  wss://api.openai.com/v1/realtime
         │                                         └────────┬─────────┘
         │ 4. Stream audio ↔ JSON events                    │
         └─────────────────────────────────────────────────┘
```

- **API key** stays on the server; client uses short-lived ephemeral keys.
- **Tool calls** (create_task, complete_task, etc.) are received over the WebSocket; client executes via ActionExecutor and sends results back.

---

## Phases

### Phase 1: Ephemeral Key Edge Function
**What:** New Edge Function `realtime-session` that returns an ephemeral client secret.

**Flow:**
1. Client calls `POST /functions/v1/realtime-session` with user JWT.
2. Edge Function verifies user, calls `POST https://api.openai.com/v1/realtime/client_secrets` with OPENAI_API_KEY.
3. Returns `{ value: "ek_xxx" }` to client.

**Session config:**
```json
{
  "session": {
    "type": "realtime",
    "model": "gpt-realtime",
    "instructions": "<MYPA_SYSTEM_PROMPT>",
    "voice": "shimmer",
    "tools": [ /* ACTION_TOOLS in Realtime format */ ]
  }
}
```

**Files:** `supabase/functions/realtime-session/index.ts`

---

### Phase 2: WebSocket Client + Audio Pipeline
**What:** VoiceContext connects to OpenAI Realtime via WebSocket and handles audio.

**Challenges:**
1. **Audio format:** Realtime expects PCM16 (16-bit, 24kHz typically). iOS expo-av records CAF/M4A. Options:
   - Use `expo-audio` or another lib that can stream PCM.
   - Or: record in chunks, convert to PCM server-side (adds latency).
   - Or: check if Realtime accepts other formats via session config.

2. **Streaming mic:** Need real-time capture, not “record then send.” May require native module or `expo-audio` streaming.

3. **Streaming playback:** Realtime sends `response.output_audio.delta` (base64). Buffer chunks, decode to PCM, play via Audio API.

**Implementation:**
- Add `useRealtimeVoice` hook or a `RealtimeVoiceSession` that:
  - Fetches ephemeral key from `realtime-session`.
  - Opens `WebSocket("wss://api.openai.com/v1/realtime?model=gpt-realtime", ["realtime", "openai-insecure-api-key.<ek_xxx>"])`.
  - Sends `session.update` with instructions + tools.
  - Streams input audio (once format is resolved).
  - Handles `response.output_audio.delta` → play.
  - Handles `response.function_call_arguments.done` → execute action → send `function_call_output`.

**Files:** `frontend/src/contexts/VoiceContext.tsx` (new mode), `frontend/src/services/realtimeVoice.ts`

---

### Phase 3: Tool / Action Mapping
**What:** Map MYPA Action Registry to Realtime tools and execute on the client.

**Flow:**
1. Realtime sends `response.function_call_arguments.done` with `name` and `arguments`.
2. Client parses JSON, calls `executeAction()` (existing ActionExecutor).
3. Client sends `response.function_call_output` with the result.
4. Model continues and speaks the response.

**Note:** Tool schemas must match Realtime format. ACTION_TOOLS in `_shared/config.ts` are OpenAI function-calling format; Realtime uses the same structure.

**Files:** `frontend/src/services/actionExecutor.ts` (reuse), new adapter in `realtimeVoice.ts`.

---

### Phase 4: Feature Flag & Fallback
**What:** Toggle between Realtime and legacy voice; fallback if Realtime fails.

**Implementation:**
- `VoiceContext` accepts `voiceMode: 'realtime' | 'legacy'` (from settings or env).
- If `realtime` and ephemeral key fails or WebSocket disconnects, fall back to legacy (current flow).
- Persist user preference (e.g. AsyncStorage).

---

### Phase 5: Polish
- Reconnect logic on WebSocket drop.
- VAD / turn detection tuning (Realtime has built-in).
- Cost monitoring (Realtime has different pricing).

---

## Immediate Next Steps

1. **Verify Realtime access** – Ensure `gpt-realtime` is available in your OpenAI project.
2. **Implement Phase 1** – `realtime-session` Edge Function.
3. **Spike Phase 2** – Minimal WebSocket connect + `session.update` + text message (no audio) to validate end-to-end.
4. **Resolve audio format** – Confirm Realtime input format requirements and iOS recording/streaming options.

---

## References

- [Realtime API Overview](https://platform.openai.com/docs/guides/realtime)
- [Realtime WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Ephemeral Client Secrets](https://platform.openai.com/docs/guides/realtime#generating-ephemeral-api-keys)
- [Voice Agents Quickstart](https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart/) (browser/WebRTC)
- [Realtime Conversations](https://platform.openai.com/docs/guides/realtime-conversations)
