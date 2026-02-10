# AI Voice System — PRD & Rules Compliance Audit

**Date:** February 2026  
**Reference:** PRD 4.1 (Voice-First), 4.7 (Action System), 4.8 (Event Logging), `.cursor/rules` (voice-ai-patterns, project-context)

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| **Voice pipeline (stack)** | Compliant | Whisper STT → GPT function calling → Action execution → TTS |
| **Action System (4.7)** | Compliant | AI outputs ActionJSON; client executes; confidence &lt; 0.7 → confirm; destructive → yes/no |
| **Event logging (4.8)** | Compliant | `voice_command` with action, intent_raw, confidence, latency_ms, tokens_used, user_override |
| **Model routing** | Compliant | `supabase/functions/_shared/config.ts`; no client hardcoding (Rule 12) |
| **Tap-to-talk only** | Compliant | No wake word (v1) |
| **Daily briefing** | Compliant | Auto-play, skip/interrupt, briefing events logged |
| **Barge-in** | Done | Tap stops TTS and goes to IDLE; PRD says “go to LISTENING” |
| **LISTENING 3s silence timeout** | Not implemented | PRD: 3s silence → “I didn’t catch that” → IDLE |
| **PROCESSING 10s timeout** | Partial | Client uses 30s; PRD says 10s → ERROR |
| **Context-aware commands (V-7)** | Not implemented | `voice-command` always receives `screen: 'ai_home'`; Tasks/Social/Profile/Focus context not passed |
| **Rate limiting (V-10)** | Not implemented | 10 commands/day (free) not enforced |
| **OpenAI Realtime API (V-3)** | Not started | Current: REST Whisper + GPT + TTS |
| **Text fallback (V-9)** | Partial | Error state shown; no persistent text input on Hub |

---

## 1. What Matches PRD & Rules

### 1.1 Voice pipeline (PRD 4.1, voice-ai-patterns)

- **User speaks** → Device mic (expo-av `Audio.Recording`).
- **STT** → `voice-command` Edge Function → OpenAI Whisper.
- **Intent** → GPT-4 (function calling) in same Edge Function; returns ActionJSON.
- **Execution** → Client `actionExecutor` runs mutations (Supabase); queries run server-side in Edge Function.
- **TTS** → `text-to-speech` Edge Function (OpenAI TTS) with expo-speech fallback.

Rule: “Model IDs in `_shared/config.ts`” — satisfied. No model IDs in client.

### 1.2 Action System (PRD 4.7)

- AI returns JSON with `action`, `params`, `confidence`, `confirmation_required`.
- **Confidence &lt; 0.7:** `actionExecutor` returns `needsConfirmation`; VoiceContext speaks prompt and waits for yes/no (transcribed via voice-command again).
- **Destructive actions** (e.g. `delete_task`): `CONFIRMATION_REQUIRED_ACTIONS` in config; user must say yes/no.
- AI does not write data; client validates and executes via Supabase.

### 1.3 Event logging (PRD 4.8)

- Every voice command path calls `eventLogger.logVoiceCommand(transcript, action, success, { confidence, latency_ms, ai_model_used, tokens_used, user_override })`.
- Flush builds `event_log` rows with `action`, `intent_raw` (from transcript), `confidence`, `latency_ms`, `tokens_used`, `user_override`, `ai_model_used`, `success`.

### 1.4 Voice state machine

- States: `idle` | `listening` | `processing` | `speaking`.
- Tap to start → LISTENING; tap to stop → stop recording and PROCESSING; then SPEAKING or IDLE.
- Tap during SPEAKING → `stopSpeaking()` + `cancelListening()` → IDLE (see gap below).

### 1.5 Daily briefing

- `useDailyBriefing` + AI Hub: auto-play first open of day, skip/interrupt (barge-in), TTS.
- Events: `briefing_started`, `briefing_progress` (25%, 50%, 100%), `briefing_skipped` in `event_log`.

---

## 2. Gaps vs PRD / Rules

### 2.1 Barge-in → LISTENING (PRD 4.1)

- **PRD:** “If user speaks while MYPA is in SPEAKING state, immediately stop TTS playback and transition to **LISTENING**.”
- **Current:** Tap during SPEAKING stops TTS and goes to **IDLE**.
- **Change:** On barge-in (tap or detected speech), stop TTS and call `startListening()` instead of only going to IDLE.
- **Implemented:** `VoiceContext.bargeIn()` stops playback then starts listening; AI Hub `handleTap` calls `bargeIn()` when `voiceState === 'speaking'` (briefing and normal). Plan: `docs/planning/BARGE_IN_IMPLEMENTATION_PLAN.md`.

### 2.2 3s silence timeout in LISTENING (PRD 4.1)

- **PRD:** “3s of silence in LISTENING → TIMEOUT → IDLE” with “I didn’t catch that — tap to try again.”
- **Current:** No automatic timeout; user must tap to stop.
- **Change:** In LISTENING, start a 3s timer on silence (e.g. from metering); on expiry speak “I didn’t catch that” and return to IDLE.

### 2.3 PROCESSING timeout 10s (PRD 4.1)

- **PRD:** “10s of no response in PROCESSING → ERROR.”
- **Current:** `Promise.race` with 30s.
- **Change:** Reduce to 10s and show ERROR state (“Having trouble…”) then IDLE with retry.

### 2.4 Context-aware commands (V-7)

- **PRD:** “AI must know what screen the user is on.”
- **Current:** VoiceContext always sends `context: { screen: 'ai_home' }` to `voice-command`. MiniVoiceButton has `screenContext` (tasks/social/profile/focus) but it is not passed into the invoke.
- **Change:** Pass current screen (e.g. from GestureContext or a callback) into the voice-command body as `context.screen` so prompts and actions can be contextual.

### 2.5 Rate limiting (V-10)

- **PRD / rules:** Free tier 10 voice commands/day; limit computed from `event_log` (count `voice_command` for today in user timezone); soft upsell, no hard block.
- **Current:** No check before calling voice-command; no upsell.
- **Change:** Before starting LISTENING (or before invoking voice-command), query or cache “voice_commands_today” from `event_log`; if at limit and not premium, show soft upsell and optionally still allow text input.

### 2.6 OpenAI Realtime API (V-3)

- **PRD:** Target &lt;500ms latency via Realtime API (WebSocket).
- **Current:** REST: Whisper → GPT → TTS.
- **Note:** Documented as “Not started”; no code change in this audit.

### 2.7 Graceful fallback to text input (V-9)

- **PRD:** On voice failure, offer text input.
- **Current:** Error message and IDLE; no persistent text input on AI Hub.
- **Change:** In ERROR (and optionally OFFLINE) state, show a text field + “Send” so the user can type the same intent (same action execution path).

---

## 3. File Reference

| Concern | Location |
|--------|----------|
| Voice pipeline, speak, state | `frontend/src/contexts/VoiceContext.tsx` |
| Action execution, confidence threshold | `frontend/src/services/actionExecutor.ts` |
| Event log payload | `frontend/src/services/eventLogger.ts` |
| Voice-command (Whisper + GPT) | `supabase/functions/voice-command/index.ts` |
| TTS | `supabase/functions/text-to-speech/index.ts` |
| Model config | `supabase/functions/_shared/config.ts` |
| Screen context for voice | `VoiceContext` invoke body; `MiniVoiceButton` / `useVoiceWithContext` |

---

## 4. Conclusion

The **core voice stack, Action System, and event logging are aligned** with the PRD and rules. The main missing or partial items are:

1. **Behavioral:** 3s LISTENING silence timeout, 10s PROCESSING timeout, barge-in → LISTENING.
2. **Product:** Context-aware screen passed to voice-command, rate limiting (10/day free), text fallback on failure.
3. **Roadmap:** Realtime API for latency (V-3).

Implementing the items in section 2 would bring the voice system to full PRD and rules compliance for the current (non-Realtime) pipeline.
