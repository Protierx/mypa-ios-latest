# Voice Polish Plan — Close 7 Launch-Critical Gaps

All 21 ElevenLabs migration steps are complete. This plan addresses the remaining UX gaps that real users of voice-first apps will notice.

**Status:** Mic permissions (#8 from the gap audit) is already well implemented — `VoicePermissions` modal + `useVoicePermissions` hook + Settings deep-link all exist.

---

## Phase A — Before Launch (Steps 1–4)

### Step 1. Fix Audio Level Visualizer — Wire VAD Scores Into `audioLevel`

**Problem:** The visualizer components exist and look great, but `audioLevel` is always `0` during ConvAI sessions because the `onVadScore` callback is an empty TODO stub.

**Components that consume `audioLevel` (all working, all receiving `0`):**
| Component | File | Visual |
|-----------|------|--------|
| `VoiceBars` | `frontend/src/components/VoiceFeedback/VoiceBars.tsx` | 12 animated bars |
| `VoiceGlow` | `frontend/src/components/VoiceFeedback/VoiceGlow.tsx` | Pulsing glow ring |
| `VoiceWaveform` | `frontend/src/components/VoiceFeedback/VoiceWaveform.tsx` | Skia circular waveform |
| `MiniVoiceBars` | `frontend/src/components/VoiceFeedback/MiniVoiceBars.tsx` | Compact vertical bars |

**Changes:**

#### 1a. Add `setAudioLevel` to `stateCallbacksRef` in VoiceContext.tsx

```typescript
// In stateCallbacksRef definition (~line 267)
const stateCallbacksRef = useRef({
  setVoiceState: (state: VoiceState) => { setVoiceState(state); },
  setTranscript: (text: string) => { setTranscript(text); },
  setAiResponse: (text: string) => { setAiResponse(text); },
  setAudioLevel: (level: number) => { setAudioLevel(level); },  // ← ADD
  // ... existing callbacks
});
```

#### 1b. Wire `onVadScore` in the conversation options

In `VoiceContext.tsx`, inside the `useConversation` hook options (or wherever the conversation callbacks are configured), update the `onVadScore` callback:

```typescript
onVadScore: ({ vadScore }: { vadScore: number }) => {
  stateCallbacksRef.current.setAudioLevel(vadScore);
},
```

#### 1c. Reset `audioLevel` to 0 on session end

Already handled — `setAudioLevel(0)` is called in `stopListening`, `cancelListening`, and `endConversation`. ✅

**Result:** All 4 visualizer components instantly come alive during ConvAI sessions. Zero UI changes needed.

---

### Step 2. Add Haptic Feedback Throughout the Voice Flow

**Problem:** Only `startListening` (Medium impact) and `endConversation` (Medium impact) fire haptics. The entire voice flow feels "dead" compared to Apple's own apps which use haptics extensively.

**Changes in `VoiceContext.tsx`:**

| Trigger Point | Haptic Type | Where |
|---------------|-------------|-------|
| Session connected (`onStatusChange → connected`) | `Haptics.notificationAsync(NotificationType.Success)` | `onStatusChange` callback |
| MYPA starts speaking (`onModeChange → speaking`) | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` | `onModeChange` callback |
| Voice error | `Haptics.notificationAsync(NotificationType.Error)` | `setError()` wrapper or error handler |
| Listening timeout (8s silence) | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` | Timeout handler in `startListening` |
| Scribe segment committed | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` | `onCommittedTranscript` callback in `startScribe` |

**Changes in `WakeWordService.ts`:**

| Trigger Point | Haptic Type | Where |
|---------------|-------------|-------|
| Wake word detected | `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` | `onDetected` callback |

**Implementation note:** Import `Haptics` is already present in VoiceContext. For WakeWordService, lazy-import `expo-haptics` the same way as other native modules.

---

### Step 3. Add DND / Phone Call Awareness

**Problem:** If a phone call comes in or the user has Focus/DND enabled, MYPA will blast audio through the speaker. No audio interruption handling exists.

#### 3a. Create `frontend/src/services/voice/AudioSessionService.ts`

Lightweight service that:
1. Configures `expo-av` audio session with proper interruption mode
2. Tracks whether audio is currently interrupted (phone call, Siri, etc.)
3. Exposes state for VoiceContext to check before starting/continuing voice

```typescript
// AudioSessionService.ts — simplified interface
class AudioSessionServiceImpl {
  private _isInterrupted = false;
  private _onInterruption: ((interrupted: boolean) => void) | null = null;

  get isInterrupted(): boolean { return this._isInterrupted; }

  /** Configure audio session for voice conversations */
  async configure(): Promise<void> {
    const { Audio, InterruptionModeIOS, InterruptionModeAndroid } = await import('expo-av');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,  // ← KEY: pause on interruption
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
    });
  }

  /** Register callback for audio interruptions */
  onInterruption(callback: (interrupted: boolean) => void): void {
    this._onInterruption = callback;
  }

  /** Mark interrupted (called from VoiceContext error/disconnect handlers) */
  setInterrupted(interrupted: boolean): void {
    this._isInterrupted = interrupted;
    this._onInterruption?.(interrupted);
  }
}

export const audioSessionService = new AudioSessionServiceImpl();
```

#### 3b. Wire into VoiceContext.tsx

```typescript
// In startListening, before connecting:
if (audioSessionService.isInterrupted) {
  setError('Voice unavailable — phone call or Focus mode active');
  return;
}

// In speak() REST TTS path, before playing audio:
if (audioSessionService.isInterrupted) {
  console.log('[Voice] Skipping audio playback — audio interrupted');
  return;
}

// On ElevenLabs session error/disconnect, check if it was an interruption:
// expo-av will surface audio session errors when a call comes in
```

#### 3c. Configure audio session on mount

In VoiceContext's initialization `useEffect`, call `audioSessionService.configure()` early.

**Limitation (V1):** `expo-av` alone can detect audio route interruptions (phone calls, Siri) but cannot read iOS Focus/DND state. Full DND detection would need a custom native module or `react-native-callkeep`. The interruption-based approach covers the most critical case (phone calls) for V1.

---

### Step 4. Add Mic Permission Self-Check in `startListening` and `startScribe`

**Problem:** The permission modal works great when triggered from AIHubScreen's tap handler, but `startListening` itself doesn't check — meaning wake word triggers or programmatic calls could fail silently.

**Changes in `VoiceContext.tsx`:**

```typescript
// At the top of startListening:
const startListening = useCallback(async () => {
  // Self-check mic permission (guard for wake word / programmatic triggers)
  const { Audio } = await import('expo-av');
  const { status } = await Audio.getPermissionsAsync();
  if (status === 'denied') {
    setError('Microphone access denied. Go to Settings → MYPA to enable.');
    return;
  }
  if (status !== 'granted') {
    const { status: newStatus } = await Audio.requestPermissionsAsync();
    if (newStatus !== 'granted') {
      setError('Microphone permission is required for voice.');
      return;
    }
  }
  // ... rest of existing startListening code
}, [/* deps */]);

// Same guard at the top of startScribe:
const startScribe = useCallback(async (options?) => {
  const { Audio } = await import('expo-av');
  const { status } = await Audio.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Audio.requestPermissionsAsync();
    if (newStatus !== 'granted') {
      setError('Microphone permission is required for transcription.');
      return;
    }
  }
  // ... rest of existing startScribe code
}, [/* deps */]);
```

---

## Phase B — Week 1 Post-Launch (Steps 5–7)

### Step 5. Multi-Language Support

**Problem:** `languageCode: 'en'` is hardcoded in Scribe, `expo-speech` uses `'en-US'`, and ConvAI has no language parameter at all.

#### 5a. Add language setting to VoiceContext

```typescript
// New state + context fields:
interface VoiceContextType {
  // ... existing fields
  preferredLanguage: string;
  setPreferredLanguage: (lang: string) => void;
}

// State with AsyncStorage persistence (same pattern as discreet mode):
const [preferredLanguage, setPreferredLanguageState] = useState('en');

// Persist handler:
const handleSetPreferredLanguage = useCallback(async (lang: string) => {
  setPreferredLanguageState(lang);
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem('mypa_language', lang);
}, []);

// Load on mount (in the existing AsyncStorage useEffect):
const langVal = await AsyncStorage.getItem('mypa_language');
if (langVal) setPreferredLanguageState(langVal);
```

#### 5b. Wire into all voice paths

| Path | File | Change |
|------|------|--------|
| **ConvAI** | `ElevenLabsVoiceService.ts` → `buildSessionConfig` | Add `language: preferredLanguage` to `dynamicVariables` |
| **ConvAI agent prompt** | ElevenLabs Dashboard | Add: "Always respond in {{language}}. If the user speaks a different language, match their language." |
| **Scribe** | `VoiceContext.tsx` → `startScribe` | Replace hardcoded `'en'` with `preferredLanguage` |
| **TTS fallback** | `VoiceContext.tsx` → `speak()` | Replace `'en-US'` with `preferredLanguage + locale mapping` |
| **ElevenLabs agent** | ElevenLabs Dashboard | Enable "Multi-language" mode on the agent |

#### 5c. Add language picker in SettingsModal

In `SettingsModal.tsx`, add a picker in the "Voice & AI" section:

```typescript
const languageOptions = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
];
```

UI pattern: same chip-grid as voice picker — tap to select, current selection highlighted in purple.

**Dashboard task:** Set the ElevenLabs agent to "Multi-language" mode and add `{{language}}` to the system prompt.

---

### Step 6. Conversation History Screen

**Problem:** The `conversation_history` table exists and the webhook populates it, but users have no way to view past conversations.

#### 6a. Create `frontend/src/screens-v2/ConversationHistoryScreen.tsx`

```
┌──────────────────────────────────┐
│  ← Back     Conversations        │
├──────────────────────────────────┤
│  📅 Today                        │
│  ┌────────────────────────────┐  │
│  │ 🟢 "Rescheduled gym..."    │  │
│  │ 3 actions • calm           │  │
│  │ 2:34 PM                    │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🔵 "Created 5 new tasks"  │  │
│  │ 5 actions • focused        │  │
│  │ 9:12 AM                    │  │
│  └────────────────────────────┘  │
│                                  │
│  📅 Yesterday                    │
│  ┌────────────────────────────┐  │
│  │ 🟡 "Weekly review..."     │  │
│  │ 2 actions • stressed       │  │
│  │ 4:45 PM                    │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Data source:** `supabase.from('conversation_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)`

**Row rendering:**
- Summary text (truncated to 2 lines)
- Mood emoji (map mood string → emoji: calm→🟢, stressed→🟡, excited→🔵, tired→🟠)
- Action item count badge
- Timestamp (relative: "2:34 PM" / "Yesterday" / "Feb 12")

**Tap → expand detail:**
- Full summary text
- Key decisions as bullet list
- Action items as checklist (read-only)

**Swipe-to-delete:** `supabase.from('conversation_history').delete().eq('id', row.id)`

#### 6b. Add entry point

In `SettingsModal.tsx`, add under a new "History" section:
```typescript
<SectionHeader title="History" />
<View className="bg-zinc-900/50 mx-4 rounded-xl">
  <SettingRow
    icon="chatbubbles-outline"
    iconColor="#8b5cf6"
    title="Conversation History"
    subtitle="Browse past voice conversations"
    onPress={() => { onClose(); navigation.navigate('ConversationHistory'); }}
  />
</View>
```

#### 6c. Register screen in navigation

Add `ConversationHistory` to the navigation stack in the existing screen registry.

---

### Step 7. Wire `voiceSpeed` Into ConvAI Sessions

**Problem:** `voiceSpeed` (0.5x–2.0x) adjusts the REST TTS path but has zero effect during live ConvAI sessions, which is the primary mode.

#### 7a. Pass speed as dynamic variable

In `ElevenLabsVoiceService.ts` → `buildSessionConfig()`:

```typescript
dynamicVariables: {
  user_name: ...,
  time_of_day: ...,
  platform: 'ios',
  voice_speed: String(voiceSpeed),  // ← ADD
  // ... existing vars
},
```

#### 7b. Add prompt instruction in ElevenLabs Dashboard

Add to the MYPA system prompt:

```
SPEECH PACING:
The user's preferred voice speed is {{voice_speed}}x.
- If {{voice_speed}} is 0.5–0.8: Speak noticeably slower than normal. Pause between sentences.
- If {{voice_speed}} is 0.8–1.2: Speak at a natural, conversational pace.
- If {{voice_speed}} is 1.2–1.5: Speak briskly and efficiently. Fewer pauses.
- If {{voice_speed}} is 1.5–2.0: Speak quickly and concisely. Minimize filler words.
```

**Limitation:** This is a prompt-level control — the LLM adjusts its phrasing and the TTS interprets the text cadence. It's not sample-level speed adjustment like the REST TTS `speed` parameter. For most users (0.8x–1.3x range), this is effective. Extreme values (0.5x, 2.0x) will be approximate.

**Dashboard task:** Add the `voice_speed` dynamic variable and the SPEECH PACING prompt section.

---

## Deferred to V1.1

| Feature | Reason for deferral |
|---------|-------------------|
| **Replay last response (#6)** | ConvAI audio is streamed via WebRTC — no local file to replay. Recommend a "repeat that" voice command instead (agent re-states its last answer). Alternatively, cache REST TTS mp3s instead of deleting them. |
| **Voice shortcuts / custom commands (#9)** | Needs a full "Routines" UI + storage + matching engine. Significant scope. |
| **Continuous conversation mode toggle (#10)** | Need to decide UX: button vs setting vs voice command ("keep listening"). |
| **Siri Shortcuts integration (#13)** | Requires `expo-shortcuts` or a custom Intents extension. Apple review considerations. |
| **Background voice session (#14)** | `staysActiveInBackground: true` + background audio mode. Risk: battery drain, Apple review rejection if misused. |
| **Latency indicator (#15)** | Need to surface `connectionQuality` from the existing OfflineQueueService into a subtle UI badge. Small effort but low priority. |

---

## Implementation Order

```
Phase A — Before Launch (~1 day)
  Step 1: Wire audioLevel (30 min)
  Step 2: Add haptics (30 min)
  Step 3: DND / audio interruption (1-2 hours)
  Step 4: Mic permission guard (15 min)

Phase B — Week 1 Post-Launch (~2 days)
  Step 5: Multi-language (3-4 hours)
  Step 6: Conversation history screen (3-4 hours)
  Step 7: Voice speed in ConvAI (30 min — mostly dashboard)
```

**Dashboard tasks (manual, not code):**
- Step 5: Enable multi-language on agent, add `{{language}}` to prompt
- Step 7: Add `voice_speed` dynamic variable, add SPEECH PACING section to prompt
