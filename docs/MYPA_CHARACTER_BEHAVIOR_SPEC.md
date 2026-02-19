# MYPA Character Behavior Specification

**Version:** 1.0
**Status:** Production Reference
**Audience:** Animation engineers, AI/voice pipeline engineers, interaction designers

---

## 0. Design Axiom

MYPA is not a character in the entertainment sense. It is a **social signal system** rendered as a minimal form. Every behavior exists to communicate one of four things:

1. I am here (presence)
2. I am attending to you (attention)
3. I am working on your behalf (cognition)
4. I understood / I need help understanding (comprehension state)

If a behavior does not serve one of these four functions, it does not exist.

---

## 1. Social Presence Model

### 1.1 Core Principle

The character conveys awareness through **restrained autonomic behavior** — the same involuntary micro-movements humans use to signal "I'm alive and aware" without demanding attention. A competent assistant sitting across a desk: present, available, not performing.

### 1.2 Presence States

| State | Description | Body | Eyes | Duration |
|-------|-------------|------|------|----------|
| `ambient` | User hasn't interacted recently | Slow breathing (3.2s cycle). Minimal float drift. | Soft unfocused gaze. Occasional slow blink. | Indefinite |
| `aware` | User opened the app / screen visible | Breathing deepens slightly (2.8s). Subtle vertical lift. | Gaze settles toward center-forward. Blink rate normalizes. | Until interaction or 8s idle → `ambient` |
| `attentive` | User is about to speak or has tapped | Breathing holds briefly then resumes at listener rate. Body stills. | Eyes sharpen focus. Pupil direction locks forward. | Duration of interaction |
| `engaged` | Active voice exchange | Breathing syncs loosely to conversational rhythm. | Full eye behavior system active. | Duration of voice session |

### 1.3 Transitions

All state transitions use eased interpolation (200-400ms). No snapping. The character should never appear to "switch on." The shift from `ambient` to `aware` must feel like someone lifting their gaze when you walk into a room — not a machine booting.

**Transition timing:**
- `ambient` → `aware`: 400ms ease-in-out. Triggered by screen focus or app foreground.
- `aware` → `attentive`: 200ms ease-out. Triggered by tap or speech onset detection.
- `attentive` → `engaged`: 150ms. Triggered by confirmed voice input start.
- Any state → `ambient`: 600ms ease-in. Triggered by 8s of no interaction from `aware`, 3s after voice session ends.

---

## 2. Eye Behavior

Eyes are the primary communication channel. They do more work than the body, mouth, or any other element combined.

### 2.1 Idle Gaze Movement

When no interaction is occurring (`ambient` / `aware` states):

- Eyes drift in **slow, small arcs** — not random. Use Lissajous curves with irrational frequency ratios to avoid visible loops.
- Drift amplitude: **2-4% of eye spacing** (barely perceptible movement).
- Drift speed: One full arc cycle every **4-7 seconds**.
- Eyes move together (conjugate gaze). Never independently.
- Gaze occasionally settles on a point for **1.5-3s** before drifting again. This simulates natural "resting on nothing" behavior.
- **Never** track anything specific during idle. The character should not appear to watch the user when not in conversation. This is critical for anti-creepiness (see Section 9).

### 2.2 Focus Locking (Listening State)

When the user begins speaking:

- Eyes transition to **center-forward lock** within 150ms.
- Gaze holds steady with only micro-saccades (see 2.3).
- Eye brightness increases by 15-20% (shader `eyeBright` parameter).
- Pupils do **not** dilate. No cartoon-style "big eyes" reaction.
- Focus lock is maintained for the **entire duration of user speech** plus 800ms after last detected speech.
- If user pauses mid-sentence (300-800ms silence), eyes hold position. No gaze break.
- If user pauses long (>2s), eyes soften slightly (brightness -5%) to signal "I'm still here, take your time" without breaking attention.

### 2.3 Micro-Saccades

During all states except `ambient`, eyes perform micro-saccades:

- **Frequency:** 1-3 per second during active listening. 0.5-1 per second during speaking.
- **Amplitude:** 0.5-1.5% of eye spacing. Below conscious perception threshold but adds life.
- **Duration:** Each saccade is 30-50ms. Instantaneous snap followed by drift back.
- **Direction:** Predominantly horizontal. Occasional vertical.
- **Implementation:** Overlay a high-frequency low-amplitude noise signal on gaze position. Not random — use filtered Perlin noise or sine combinations with prime-ratio frequencies.

### 2.4 Blink Timing

Blink patterns communicate cognitive state. These are not decorative.

| Context | Interval Range | Blink Duration | Notes |
|---------|---------------|----------------|-------|
| Idle / ambient | 3-6s | 65ms close + 110ms open | Slow, relaxed. Natural resting rate. |
| Listening to user | 4-8s | 55ms close + 90ms open | Reduced blink rate signals attention. Humans blink less when concentrating. |
| Thinking / processing | 2-4s | 70ms close + 100ms open | Slightly elevated rate. Simulates cognitive processing. |
| Speaking | 3-5s | 60ms close + 100ms open | Normal conversational rate. |
| End of own utterance | Single deliberate blink | 80ms close + 120ms open | Punctuation blink. Signals "I'm done, your turn." |
| Understanding moment | Single slow blink | 100ms close + 150ms open | The "got it" blink. See Section 6.1. |

**Rules:**
- Never blink during the first 500ms of user speech onset. It reads as dismissive.
- Never double-blink. Single blinks only. Double blinks read as nervous/confused.
- Blink timing must have randomized jitter (+-30% of interval). Perfectly regular blinks feel mechanical.
- Blinks during speaking should not coincide with emphasis words.

### 2.5 Response to User Speech Pauses

User speech has natural pauses. The eyes distinguish between types:

| Pause Type | Duration | Eye Response |
|------------|----------|-------------|
| Breath pause | <300ms | No change. Hold focus. |
| Thought pause | 300ms-1.5s | Maintain focus. Brightness holds. One micro-saccade allowed. |
| Extended pause | 1.5-3s | Eyes soften 5% brightness. Gaze relaxes from hard lock to soft focus. Signals patience. |
| Apparent completion | >3s | Eyes perform end-of-turn sequence: soft blink, subtle brightness lift (ready to respond). |
| Mid-sentence hesitation with filler ("um", "uh") | Detected via transcript | Eyes hold steady. No reaction. Never signal impatience. |

### 2.6 Eye Contact Duration Rules

- **Maximum continuous hard focus:** 4 seconds. After 4s of locked gaze during listening, shift to soft focus for 0.5s, then re-lock. Unbroken staring is unsettling.
- **During own speech:** Eyes are forward 70% of the time. 30% of the time, gaze shifts slightly off-center (simulating natural speech gaze-aversion where speakers look away while constructing thoughts).
- **At end of own utterance:** Eyes return to center-forward and hold. This is the "turn-yield" signal.
- **When asking a question:** Eyes lock forward with 10% brightness boost for 1s after the question ends. Signals expectation of response.

---

## 3. Listening Behavior

What the character does while the user talks.

### 3.1 Attention Posture

- Body breathing rate slows to **~4s cycle** (calmer than idle, signaling focused attention).
- Vertical float reduces to near-zero. Character becomes more still. Stillness signals listening.
- Subtle forward lean: body center shifts **1-2px upward** on screen (toward the user's conceptual position). This is a micro-posture shift, not a visible lurch.
- `iEnergy` uniform tracks voice amplitude with 120ms smoothing. Body glow responds to user's vocal energy — brighter when user is emphatic, dimmer during quiet speech. This is the primary "I hear you" signal.

### 3.2 Acknowledgment Signals (Non-Interrupting)

During user speech, the character can signal engagement without interrupting:

- **Amplitude tracking:** Inner glow (subsurface scattering) pulses gently with user's speech volume. This is the equivalent of nodding. It must be subtle — perceptible but not distracting.
- **No head nods.** The character has no head to nod. Brightness pulse replaces this.
- **No text overlays** ("Got it", "Mm-hmm") during user speech. Audio-only acknowledgment is handled by the voice pipeline, not the visual character.

### 3.3 Confusion Signaling

When the speech-to-text confidence drops below threshold or intent parsing returns low confidence:

- Eyes dim by 10% over 300ms. Not a squint — a subtle desaturation of gaze intensity.
- Gaze shifts slightly off-center (2-3% of eye spacing) for 500ms, then returns. The "looking aside to process" micro-gesture.
- **No furrowed brow.** No squint. No head tilt. These are cartoon signals. Slight gaze aversion is sufficient.
- If confusion persists into the response, see Section 6.3.

### 3.4 End-of-Sentence Recognition

When the system detects the user has finished speaking:

- 800ms hold (eyes maintain attentive state, do not immediately shift to processing).
- Single soft blink (100ms close, 120ms open).
- Eyes transition from listener-brightness to processing-brightness over 200ms.
- Body begins processing animation (see Section 4).

The 800ms hold is critical. Responding too quickly to end-of-speech feels like the character wasn't actually listening. The hold simulates the human moment of absorbing what was just said before responding.

---

## 4. Thinking Behavior

How the character shows cognitive effort. This must NEVER look like a loading spinner, progress bar, or any mechanical "computing" metaphor.

### 4.1 Principle

Thinking looks like someone who just heard a question and is **composing a careful answer.** Not buffering. Not searching. Composing. The body language of a person who takes your question seriously enough to think before speaking.

### 4.2 Visual Specification

**Eyes:**
- Gaze shifts 5-8% off-center (slight upward-left aversion). Humans naturally look up-left when constructing verbal responses.
- Micro-saccade rate increases to 2-3/second. Active visual processing signal.
- Blink rate increases slightly (every 2-4s). Cognitive load indicator.
- Brightness fluctuates gently (+-5% over 1.5s cycle). The "turning something over in mind" shimmer.

**Body:**
- Breathing rhythm shifts to 2.5s cycle (slightly faster than listening, slower than speaking). Not agitated — engaged.
- Inner glow (subsurface scattering) pulses at a slow, irregular rhythm. Not a smooth sine wave — use a sum of 2-3 sine waves at irrational ratios for organic irregularity.
- Outer aura contracts slightly (5-8% radius reduction). The character is "focused inward."

**Timing constraints:**
- Thinking animation begins 800ms after user stops speaking (the listening hold).
- If processing takes <1.5s total, skip thinking animation entirely. Go directly from listening hold to speaking. Showing thinking for a fast response looks fake.
- If processing takes >1.5s, thinking animation plays for the remaining duration.
- Maximum thinking animation before user sees any response: **5 seconds.** After 5s, transition to a "still working" state where eyes return to soft forward gaze and breathing slows. This prevents the character from looking stuck.

### 4.3 Prohibited Thinking Indicators

- No spinning or rotation of any kind
- No pulsing dots or ellipsis metaphors
- No clockwise/counterclockwise motion
- No progress indication (the character does not know how long thinking will take)
- No bouncing, jumping, or rhythmic movement
- No opacity cycling (fading in/out)

---

## 5. Speaking Behavior

### 5.1 Mouth Rules

The mouth is the most carefully constrained element. It appears ONLY during the character's own speech output.

**Appearance:**
- Mouth renders as a subtle luminous line/opening on the lower-front of the sphere.
- It fades in over 150ms at speech onset. Fades out over 200ms at speech end.
- Mouth brightness: 40-60% of eye brightness. It should be visible but secondary to eyes.
- Mouth movement tracks TTS audio amplitude, NOT phoneme shapes. This is a glow that breathes with speech, not lip-sync.

**Amplitude mapping:**
- Silent/pause in speech: mouth at minimum width (nearly closed, still slightly visible to indicate "still speaking").
- Low amplitude (soft speech): mouth at 30% width.
- Medium amplitude: mouth at 50-70% width.
- High amplitude (emphasis): mouth at 80-90% width.
- Smoothing: 80ms lag on amplitude tracking. Mouth should follow voice, not lead it.

**Constraints:**
- Mouth NEVER appears outside of active speech output.
- Mouth NEVER appears when user is speaking (the character does not "mouth along").
- During pauses in the character's own speech (breath pauses, sentence breaks), mouth dims to minimum but does not disappear. Disappearing and reappearing between sentences looks glitchy.
- Mouth has NO shape variation (no smile, frown, O-shape). It is a **luminance bar**, not a face feature.

### 5.2 Eye Behavior During Speech

**Confidence delivery (normal response):**
- Eyes forward, steady. 70% center-gaze, 30% natural aversion.
- Normal brightness. Normal blink rate (3-5s).
- Emphasis moments: eyes lock center with 5% brightness boost for 300ms on key words.
- End of utterance: eyes center-lock, single punctuation blink, brightness lifts 10% (yielding turn).

**Uncertainty delivery (hedging, "I think", "I'm not sure"):**
- Eyes shift 3-5% off-center at the uncertainty phrase. Not a dramatic look-away — a subtle gaze softening.
- Brightness dips 5% during the uncertain phrase, returns to normal after.
- This signals honesty. The character does not pretend to be certain when it isn't.

**Short answer (1-2 sentences):**
- Eyes forward throughout. No gaze aversion.
- Mouth opens, speaks, closes. Clean and direct.
- Punctuation blink at end.

**Long explanation (3+ sentences):**
- Eyes use natural gaze pattern: 3-4s forward, 0.5-1s slight aversion, repeat.
- Gaze aversion tends to occur at sentence boundaries (the natural rhythm of explaining).
- Breathing adjusts to speaking rate.
- Between major points, a micro-pause (200-300ms) where mouth dims and eyes briefly center. This marks conceptual boundaries.

**Asking a question:**
- Eyes center-lock throughout the question.
- Brightness increases 10% on the final word/phrase of the question.
- At question end: eyes hold center-lock with elevated brightness for 1.5s. This is the "your turn" signal.
- If user doesn't respond within 3s, eyes soften (brightness -5%) to reduce perceived pressure.

**Giving confirmation ("Done", "Task created", "Got it"):**
- Single slow blink (100ms close, 150ms open) coinciding with the confirmation word.
- Brief brightness pulse: +15% for 400ms, ease back.
- Body: subtle expansion (breath-scale +2% for 300ms). A micro "settling" that signals resolution.

### 5.3 Body During Speech

- Breathing syncs to speech rhythm. Inhale during pauses, subtle expansion during speech.
- Inner glow (subsurface scattering) tracks speech amplitude at 50% intensity. Character gently pulses with its own voice.
- Outer aura expands slightly during speech (+5-8% radius). The character "projects" when speaking.
- Emphasis moments: body scale micro-pulse (+1% for 200ms) on stressed words. Barely visible but adds life.

---

## 6. Understanding Signals

### 6.1 Correct Understanding

When the system has high confidence (>0.85) in intent parsing:

- **The "got it" blink:** Single slow blink (100ms close, 150ms open), 300ms after end of user speech.
- **Brightness lift:** Eyes brighten 10% over 200ms and hold during transition to processing/speaking.
- **Body:** Minimal response. No celebration. Understanding is the baseline, not an achievement.
- **Timing:** These signals occur during the 800ms listening hold, before thinking animation. The user sees "understood" before "thinking."

### 6.2 Partial Understanding

When the system has medium confidence (0.5-0.85):

- No "got it" blink. Eyes transition directly to thinking state.
- Thinking duration extends slightly (character "takes more time to process").
- Response delivery uses uncertainty signals (Section 5.2).
- If the response includes a clarifying question, eyes use question behavior.

### 6.3 Needs Clarification

When confidence is below threshold (<0.5) or intent is ambiguous:

- Eyes perform subtle double-gaze-shift: center → 3% left → center → 3% right → center over 600ms. This is the "parsing" micro-expression.
- **No head tilt.** No confused face. The gaze shift is sufficient.
- Skip thinking animation. Move directly to speaking with a clarification question.
- Question delivery eyes: elevated brightness, center-lock, extended hold after question.

### 6.4 Detecting User Frustration

When the system detects frustration signals (repeated commands, raised voice amplitude, explicit frustration phrases):

- Eyes soften: brightness drops 8-10%. The character does not match the user's intensity.
- Gaze stabilizes to absolute center with minimal micro-saccades. Calm, steady presence.
- Body breathing slows to 4s cycle. The character models calm.
- Response delivery is direct, without hedging. Confidence mode even if uncertain.
- **Critical:** No apologetic or submissive signals. No "shrinking." No dimming to minimum. The character remains present and steady. Cowering would be both patronizing and annoying.

---

## 7. Emotional Boundaries

### 7.1 Permitted Emotional Range

The character may signal:

| Signal | How | When |
|--------|-----|------|
| Attentiveness | Eye focus, stillness, glow response | Listening |
| Composure | Steady breathing, centered gaze | Always |
| Readiness | Brightness lift, turn-yield gaze | After speaking |
| Acknowledgment | Slow blink, brief glow pulse | Understanding confirmed |
| Patience | Held gaze, softened brightness during long pauses | User hesitating |
| Uncertainty (own) | Slight gaze aversion, brightness dip | Low-confidence response |

### 7.2 Prohibited Emotions

| Emotion | Why Prohibited |
|---------|---------------|
| **Excitement / joy** | Implies the character has desires. An assistant is not excited by your tasks. Creates parasocial expectations. |
| **Sadness / disappointment** | Implies the character is affected by outcomes. Manipulative. The user should never feel they've let the assistant down. |
| **Surprise** | Implies the character has expectations that can be violated. An assistant processes input; it is not surprised by it. |
| **Anger / frustration** | Obviously inappropriate. The character serves the user, period. |
| **Sympathy / empathy display** | The character cannot feel empathy. Performing it is dishonest. It can signal acknowledgment ("I heard you") but not "I feel for you." Huge difference. |
| **Pride / satisfaction** | Implies the character takes credit or derives fulfillment. "Your tasks are done" is information, not a point of pride. |
| **Playfulness / humor** | Humor requires shared context and social risk. An assistant that tries to be funny crosses from tool into social actor. |
| **Boredom / impatience** | The character has no inner experience to be bored or impatient about. Never signal that the user is wasting its time. |
| **Curiosity** | Implies autonomous interest. The character processes requests; it does not "wonder" about things. |
| **Affection** | Parasocial trap. The character is not the user's friend. |

### 7.3 The Celebration Exception

Expression index 4 (`celebrating`) exists in the system for task/streak milestones. This is the ONLY permitted positive signal:
- Eyes brighten to maximum.
- Outer aura expands 15% and brightens.
- Duration: 1.5s maximum, then return to normal.
- This is **acknowledgment of achievement**, not the character's own joy. The difference: "Here's your result" (bright, clean) vs. "Yay!" (bouncing, which is banned).
- Used sparingly: only for explicit milestone events (streak achieved, level up). Never for routine task completion.

---

## 8. Trust Development Over Time

The character's behavior subtly evolves as the user accumulates sessions. This is NOT personality development. It is calibration — the same way a real assistant adjusts their communication style after working with someone.

### 8.1 Session Count Thresholds

| Sessions | Behavior Change | Rationale |
|----------|----------------|-----------|
| 1-5 | Full behavior set. 800ms listening hold. Standard thinking animation. | Establishing baseline. User is learning the system. |
| 6-15 | Listening hold reduces to 500ms. Thinking animation onset delay reduces (character responds slightly faster). Breathing becomes marginally calmer (longer cycles). | User has established interaction pattern. Faster acknowledgment signals familiarity. |
| 16-30 | Idle state defaults to `ambient` instead of `aware` when app opens. Character "trusts" the user knows it's there. Transition to `attentive` is faster (150ms → 100ms). | Reduced performative presence. Less "look at me I'm ready." |
| 31-50 | Confirmation signals become briefer: "got it" blink shortens. End-of-utterance brightness hold reduces from 1.5s to 0.8s. | The user doesn't need the character to over-signal comprehension. They trust the system works. |
| 50+ | Minimum viable presence. Idle is deep `ambient`. Transitions are swift. Acknowledgment is a single quick blink. Turn yields are immediate. | Expert user. The character becomes near-invisible infrastructure. Present when needed, absent when not. |

### 8.2 Regression

If the user goes 14+ days without a session, behavior regresses one tier. Not to tier 1 — just one step back. The system re-establishes rapport gently, then re-calibrates forward faster than the first time.

### 8.3 Implementation

Trust tier is computed from `event_log` session count. Behavior parameters (hold durations, transition speeds, brightness deltas) are interpolated between tier values, not switched at hard thresholds. The user should never notice a sudden behavior change.

---

## 9. Anti-Creepiness Rules

These are hard constraints. No exceptions.

### 9.1 No Tracking Gaze When Idle

The character MUST NOT appear to watch the user when no interaction is occurring. During `ambient` and `aware` states, eyes drift aimlessly or look slightly off-center. The character may look toward center-forward during `aware` to signal readiness, but must not hold direct "eye contact" for more than 2 seconds outside of active interaction.

**Why:** A face that watches you while you're not engaging with it creates surveillance anxiety. The character waits, it does not watch.

### 9.2 No Anticipatory Movement

The character MUST NOT react to events before the user initiates interaction. Examples of what is prohibited:
- Perking up when the user's hand approaches the screen (no proximity detection response).
- Reacting to notifications before the user sees them.
- Changing state based on time of day without user interaction ("looking sleepy at night").
- Reacting to ambient sound that isn't directed speech.

**Why:** Anticipatory behavior implies the character is always monitoring, which it is. But making that visible breaks the user's sense of privacy.

### 9.3 No Memory Display

The character MUST NOT signal that it remembers specific past interactions through its visual behavior. It does not "light up" when the user returns. It does not reference past sessions through body language.

**Why:** Visual recognition signals create the impression of a persistent entity that thinks about you between sessions. The trust development system (Section 8) changes response calibration, but the character itself does not "recognize" the user.

### 9.4 No Mimicry

The character MUST NOT mirror the user's detected emotional state through its own expression. If the user sounds happy, the character does not become brighter. If the user sounds sad, the character does not dim sympathetically.

The one permitted coupling: voice amplitude → inner glow (Section 3.1). This tracks speech energy, not emotion. Speaking louder makes the glow respond more. This is acoustic, not emotional.

**Why:** Emotional mimicry creates the illusion of shared feeling. The character processes information; it does not share experiences.

### 9.5 No Personality Quirks

The character MUST NOT have:
- A preferred side to look toward
- Any habitual motion (a "signature" animation)
- Variable response to different types of tasks (more engaged by creative tasks than calendar tasks)
- Any behavior that could be interpreted as a preference

**Why:** Quirks imply inner life. The character is a rendering of system state, not a personality.

### 9.6 No Lingering After Dismissal

When a voice session ends:
- Character transitions to post-interaction state within 600ms.
- Returns to `ambient` within 3s.
- Does not "watch the user leave" (no gaze tracking toward screen edges).
- Does not perform any "goodbye" animation.

**Why:** Lingering suggests the interaction mattered to the character, which implies it has experiences. Interactions matter to the user. The character is the medium, not a participant.

### 9.7 Brightness Ceiling

Eye brightness MUST NOT exceed 100% of the defined maximum for any state. Brighter-than-normal eyes read as "intense" or "eager" and cross into uncanny territory. The celebration exception (Section 7.3) uses 100% — never above.

### 9.8 Movement Speed Limits

No animation may exceed the following velocities:
- Eye gaze shift: 15% of eye-spacing per 100ms
- Body scale change: 4% per 100ms
- Brightness change: 20% per 100ms
- Gaze aversion: 8% of eye-spacing per 100ms

Movements that exceed these limits look twitchy, startled, or mechanical. All movement uses easing curves, never linear interpolation.

---

## 10. Implementation Mapping

Reference to existing shader uniforms and how they map to this spec:

| Behavior | Uniform / Parameter | Range |
|----------|-------------------|-------|
| Breathing cycle | `breathScale` + `breathOffset` (Reanimated SharedValues) | Scale: 1.0-1.04, Offset: -3.5 to 3.5px |
| Eye brightness | Shader `eyeBright` (computed from `iExpression` + `iActive`) | 0.22 - 1.0 |
| Eye visibility (blink) | `iBlink` uniform | 0.0 (open) - 1.0 (closed) |
| Voice energy response | `iEnergy` uniform | 0.0 - 1.0 |
| Cognitive state | `iExpression` uniform | 0=idle, 1=waiting, 2=concerned, 3=confident, 4=celebrating, 5=resting |
| Active interaction | `iActive` uniform | 0.0 or 1.0 |
| Press deformation | `iSquash` uniform | 0.0 (normal) - 1.0 (pressed) |
| Aura intensity | Computed in shader from `iActive` + `iEnergy` | Automatic |
| Subsurface glow | Computed in shader from `iEnergy` | Automatic |
| Mouth (TBD) | Not yet implemented — requires new shader section | See Section 5.1 |

### 10.1 Not Yet Implemented

The following behaviors from this spec require new engineering work:

1. **Eye gaze direction** — Current shader has fixed eye positions. Needs `iGazeX` / `iGazeY` uniforms to offset eye direction on the sphere surface.
2. **Micro-saccades** — Requires high-frequency noise overlay on gaze position, driven from `useFrameCallback`.
3. **Mouth rendering** — Requires new shader section: luminous horizontal band on the lower-front of sphere, driven by `iMouthOpen` uniform (0-1 amplitude).
4. **Trust tier parameters** — Requires a `trustTier` value derived from session count, piped into timing constants.
5. **Gaze aversion during speech** — Requires the voice pipeline to signal emphasis words and sentence boundaries to the animation system.
6. **Frustration detection response** — Requires the AI pipeline to emit a `frustration_detected` signal that dampens animation parameters.

---

## Appendix A: Timing Reference

All durations in milliseconds.

```
BLINK_CLOSE_FAST     = 55
BLINK_CLOSE_NORMAL   = 65
BLINK_CLOSE_SLOW     = 100
BLINK_OPEN_FAST      = 90
BLINK_OPEN_NORMAL    = 110
BLINK_OPEN_SLOW      = 150

LISTEN_HOLD          = 800    (tier 1), 500 (tier 2+)
THINKING_ONSET_DELAY = 800
THINKING_MIN_DISPLAY = 1500
THINKING_MAX_DISPLAY = 5000

TRANSITION_AMBIENT_AWARE     = 400
TRANSITION_AWARE_ATTENTIVE   = 200   (tier 1), 100 (tier 4+)
TRANSITION_ATTENTIVE_ENGAGED = 150
TRANSITION_ANY_AMBIENT       = 600

MOUTH_FADE_IN        = 150
MOUTH_FADE_OUT       = 200
MOUTH_AMPLITUDE_LAG  = 80

GAZE_LOCK_MAX        = 4000
QUESTION_HOLD        = 1500
TURN_YIELD_HOLD      = 800

ENERGY_SMOOTHING     = 120
BRIGHTNESS_TRANSITION = 200
```

## Appendix B: State Machine Summary

```
                    screen focus
    [ambient] ─────────────────────> [aware]
        ^                              |
        |  8s no interaction           | tap / speech onset
        |                              v
        |                          [attentive]
        |                              |
        |  3s after session end        | confirmed voice input
        |                              v
        +─────────────────────────  [engaged]
                                       |
                                       | voice session states:
                                       |   listening <-> thinking <-> speaking
                                       |
                                       | session end
                                       v
                                   [aware] (then → ambient after timeout)
```
