# Barge-In: Tap During SPEAKING → LISTENING

**PRD 4.1:** “If user speaks [or taps] while MYPA is in SPEAKING state, immediately stop TTS playback and transition to LISTENING.”

**Current:** Tap during SPEAKING calls `stopSpeaking()` + `cancelListening()` → state goes to **IDLE**.

**Target:** Tap during SPEAKING → stop TTS → transition to **LISTENING** (user can immediately speak their next command).

---

## Plan Overview

| Step | What | Where |
|------|------|--------|
| 1 | Add `bargeIn(): Promise<void>` that stops playback and starts listening **without** setting state to IDLE | `VoiceContext.tsx` |
| 2 | Expose `bargeIn` from context type and provider value | `VoiceContext.tsx` |
| 3 | In AI Hub tap handler: when `voiceState === 'speaking'`, call `bargeIn()` instead of `stopSpeaking()` + `cancelListening()` | `AIHubScreen.tsx` |
| 4 | (Optional) Unify briefing barge-in to use the same `bargeIn()` so one code path handles all “tap during SPEAKING” | `AIHubScreen.tsx` |

---

## Step 1 & 2: VoiceContext — `bargeIn()`

**Requirement:** Stop TTS immediately and transition to LISTENING. Do **not** set state to IDLE in between (avoids UI flash and keeps PRD semantics).

**Implementation:**

- Add a function that:
  1. Awaits `stopPlayback()` (so TTS actually stops and sound is unloaded).
  2. Does **not** call `setVoiceState('idle')`.
  3. Calls the same logic as “start listening” (permissions, audio mode for recording, start recording, then `setVoiceState('listening')`). Reuse `startListening()` so you don’t duplicate logic.

- So: `bargeIn = async () => { await stopPlayback(); await startListening(); }`.

- `startListening()` already:
  - Stops any existing recording and playback.
  - Requests permissions, sets recording audio mode, creates recording, sets `voiceState('listening')`.

- **Edge case:** If `startListening()` fails (e.g. permission denied), set state to IDLE and/or set error so the UI doesn’t stay stuck.

- Export: add `bargeIn` to `VoiceContextType` and to the context `value` object.

**Files:** `frontend/src/contexts/VoiceContext.tsx`

---

## Step 3: AI Hub — Tap During SPEAKING → `bargeIn()`

**Current `handleTap` logic (simplified):**

- `voiceState === 'idle'` → start listening.
- `voiceState === 'listening'` → stop listening (process).
- Else (processing or speaking) → `cancelListening()` + `stopSpeaking()` → IDLE.

**Change:**

- When `voiceState === 'speaking'`:
  - If briefing is playing: keep existing briefing cleanup (progress timers, markBriefingPlayed, etc.), then **call `await voice.bargeIn()`** instead of `voice.stopSpeaking(); await voice.startListening();`.
  - If not briefing: call `await voice.bargeIn()` instead of `voice.cancelListening(); voice.stopSpeaking();`.

- When `voiceState === 'processing'`:
  - Keep current behavior: `cancelListening()` (and optionally `stopSpeaking()` if any). No change to IDLE.

So the branch becomes:

- `speaking` → barge-in (stop TTS, go to LISTENING) via `bargeIn()`.
- `processing` → cancel → IDLE (unchanged).

**Files:** `frontend/src/screens-v2/AIHub/AIHubScreen.tsx`

---

## Step 4 (Optional): Unify Briefing Barge-In

Today briefing has its own block: it clears briefing state, logs `briefing_skipped`, then calls `voice.stopSpeaking(); await voice.startListening();`. Unify by:

- Doing briefing-specific cleanup (timers, `markBriefingPlayed`, `setIsBriefingPlaying(false)`), then calling `await voice.bargeIn()` for the actual transition to LISTENING. No need to call `stopSpeaking()` separately; `bargeIn()` stops playback.

**Files:** `frontend/src/screens-v2/AIHub/AIHubScreen.tsx`

---

## Testing

### Running on device (Xcode local build)

1. **Start Metro** (from repo root or `frontend`): `npx expo start` or `npx expo start --clear`
2. **Phone and Mac on same Wi‑Fi** so the app can load the JS bundle from your machine.
3. **Open in Xcode:** `frontend/ios/MYPAiOSApp.xcworkspace` → select your **physical device** → **Product → Run** (⌘R).
4. **If the app shows a red error or "Could not connect to development server":** On the device, **shake** to open the dev menu → **Settings** → set the **bundler URL** to your Mac's IP and port (e.g. `192.168.1.x:8081`). Then reload.

Once the app is running on device, use the cases below to test barge-in (TTS is more reliable on device than in the simulator).

### Barge-in behavior

- **Speaking (normal):** Trigger a voice command so MYPA is in SPEAKING. Tap once → TTS stops, orb shows LISTENING (e.g. waveform / “Listening…”). Speak a new command → it is processed.
- **Speaking (briefing):** Open app with daily briefing playing. Tap → briefing stops, LISTENING → speak → new command processed.
- **Processing:** Trigger a command and tap while “Thinking…” → goes to IDLE (no LISTENING).
- **No regression:** Idle → tap → listening; Listening → tap → processing; then speaking → tap → listening again.

---

## Summary

| Item | Action |
|------|--------|
| VoiceContext | Add `bargeIn()` = `await stopPlayback(); await startListening();`, expose in type and value |
| AIHubScreen handleTap | If `voiceState === 'speaking'` → run briefing cleanup if needed, then `await voice.bargeIn()`; if `voiceState === 'processing'` → keep cancel → IDLE |
| Optional | Unify briefing barge-in to use `voice.bargeIn()` after cleanup |
