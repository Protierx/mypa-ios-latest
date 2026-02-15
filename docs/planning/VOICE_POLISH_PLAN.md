# Voice Polish Plan — Close Launch-Critical Gaps

All 21 ElevenLabs migration steps are complete. This plan addresses the remaining UX gaps that real users of voice-first apps will notice.

**Status:** Mic permissions (#8 from the gap audit) is already well implemented — `VoicePermissions` modal + `useVoicePermissions` hook + Settings deep-link all exist.

### Completed ✅
- **Step 1:** VAD scores wired into `audioLevel` — all visualizers alive
- **Step 2:** Haptic feedback at 6 voice flow touchpoints
- **Step 3:** DND / phone call awareness — `AudioSessionService` with `DoNotMix` interruption mode, guards in `startListening` + `speak`, configured on mount
- **Step 4:** Mic permission self-check in `startListening` and `startScribe` — guards for wake word / programmatic triggers
- **Step 5:** Multi-language support — `preferredLanguage` state + AsyncStorage persistence, wired into Scribe/TTS/ConvAI, language picker in SettingsModal (10 languages)
- **Step 6:** Conversation History modal — grouped-by-date FlatList with mood emoji, action count, expand/collapse details, swipe-to-delete, pull-to-refresh
- **Step 7:** Voice speed wired into ConvAI — `voice_speed` dynamic variable passed to agent session
- **Step 7b:** Contextual auto-navigation — `navigate_to_screen` client tool, VoiceContext intercept + requestedNavigation state, GestureNavigatorContent listener with animated transition
- **Step 8:** WakeWord lifecycle fix — split effect (isEnabled vs sensitivity), `isInitializingRef` guard, cleanup uses `pause()` not `destroy()`
- **Step 9:** `useChallenges` realtime subscription filtered by `user_id` — no more global refetch storms
- **Step 10:** Deduplicated `useCircles` / `useChallenges` triple-fetch — `isFetchingRef` guard, `userId` string dep, 500ms debounced realtime handler
- **Step 11:** Fixed connection quality false-poor on cold launch — `null` initial state, 3s delayed first check, 10s cached result in `startListening`
- **Step 12:** Removed `expo-battery` monitoring entirely — battery effect, low-battery warning in toggle, and `wakeWordDisabledByBatteryRef` all deleted
- **Step 13:** Deleted dead `VoiceAssistantService.ts` — 657 lines of pre-ElevenLabs dead code removed
- **Immersive AI Hub:** Orb removed, full-screen aurora background with state-reactive blobs
- **Briefing Pill:** Daily briefing collapses into a pill button after TTS playback
- **Worklet Crash Fix:** `useFrameCallback` converted JS props → `SharedValue`s for thread safety
- **Center Glow Wired:** `focusGlowOpacity` / `focusGlowScale` now drive rendered center glow

---

## Phase A — Before Launch (Steps 1–4)

### Step 1. Fix Audio Level Visualizer — Wire VAD Scores Into `audioLevel` ✅ DONE

**Problem:** ~~The visualizer components exist and look great, but `audioLevel` is always `0` during ConvAI sessions because the `onVadScore` callback is an empty TODO stub.~~ **Fixed — VAD scores now flow through `setAudioLevel` into all visualizers.**

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

### Step 2. Add Haptic Feedback Throughout the Voice Flow ✅ DONE

**Problem:** ~~Only `startListening` (Medium impact) and `endConversation` (Medium impact) fire haptics. The entire voice flow feels "dead" compared to Apple's own apps which use haptics extensively.~~ **Fixed — 6 haptic touchpoints added across the entire voice lifecycle.**

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

### Step 3. Add DND / Phone Call Awareness ✅ DONE

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

### Step 4. Add Mic Permission Self-Check in `startListening` and `startScribe` ✅ DONE

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

### Step 5. Multi-Language Support ✅ DONE

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

### Step 6. Conversation History Screen ✅ DONE

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

### Step 7. Wire `voiceSpeed` Into ConvAI Sessions ✅ DONE

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

### Step 7b. Contextual Auto-Navigation — "Take Me There" Intelligence ✅ DONE

**Problem:** When the user is talking about tasks, challenges, or focus sessions, they're stuck on the AI Hub screen and can't see the relevant content. The AI should auto-navigate to the relevant screen when the conversation context is heavy enough that viewing the page while talking would be more useful.

**Architecture:** The app already has 20 registered ElevenLabs client tools (`create_task`, `start_focus`, `join_challenge`, `query_tasks`, etc.) and a swipe-based gesture navigator with programmatic `navigateTo(screen)`. We add a new `navigate_to_screen` client tool so the agent can trigger navigation itself.

#### 7b-1. Register `navigate_to_screen` Client Tool

**File:** `frontend/src/services/voice/ElevenLabsVoiceService.ts`

Add to the `clientTools` map alongside existing tools:

```typescript
navigate_to_screen: async (params: { screen: string; reason?: string }) => {
  // This gets intercepted in VoiceContext before hitting executeAction
  return `Navigated to ${params.screen}`;
},
```

#### 7b-2. Handle Navigation in VoiceContext

**File:** `frontend/src/contexts/VoiceContext.tsx`

In the `onToolCall` callback (where tool calls are dispatched to `executeAction`), intercept `navigate_to_screen` before it reaches the action system:

```typescript
// In the onToolCall handler:
if (toolName === 'navigate_to_screen') {
  const screenMap: Record<string, Screen> = {
    tasks: 'tasks',
    challenges: 'social',
    circles: 'social',
    social: 'social',
    focus: 'focus',
    profile: 'profile',
    ai_hub: 'ai_hub',
    home: 'ai_hub',
  };
  const target = screenMap[params.screen?.toLowerCase()] || null;
  if (target && navigationRef.current) {
    navigationRef.current.navigateTo(target);
  }
  return; // Don't pass to executeAction
}
```

#### 7b-3. Expose Navigation Ref Bridge

**File:** `frontend/src/navigation-v2/GestureNavigator.tsx`

The `navigateTo` function currently only updates state — the animation is driven by a local `animateToScreen` worklet. Expose a ref so VoiceContext can trigger animated navigation:

```typescript
// Add a ref bridge (similar to how ScreenTracker watches currentScreen):
export const navigationRef = React.createRef<{
  navigateTo: (screen: Screen) => void;
  currentScreen: Screen;
}>();

// Inside GestureNavigator component, wire the ref:
useImperativeHandle(navigationRef, () => ({
  navigateTo: (screen: Screen) => {
    animateToScreen(screen);  // The worklet that does spring animation
    setCurrentScreen(screen);
  },
  currentScreen,
}));
```

#### 7b-4. Pass Navigation Ref to VoiceContext

**File:** `frontend/App.tsx`

```typescript
<VoiceProvider navigationRef={navigationRef}>
```

#### 7b-5. Register Tool on ElevenLabs Dashboard

Add a new client tool to the MYPA agent:

```json
{
  "name": "navigate_to_screen",
  "description": "Navigate the user to a specific screen in the app. Call this when the conversation is about a specific area and it would help the user to see the relevant content while talking. Do NOT navigate for simple questions — only when the user explicitly asks to see something, or when the context is heavy enough that viewing the page would be helpful.",
  "parameters": {
    "type": "object",
    "properties": {
      "screen": {
        "type": "string",
        "enum": ["tasks", "challenges", "focus", "profile"],
        "description": "Which screen to navigate to"
      },
      "reason": {
        "type": "string",
        "description": "Brief reason for navigation, spoken to user"
      }
    },
    "required": ["screen"]
  }
}
```

#### 7b-6. Agent Prompt Addition (Dashboard)

Add to the MYPA system prompt:

```
CONTEXTUAL NAVIGATION:
You can navigate the user to relevant screens using the navigate_to_screen tool.

WHEN to navigate:
- User says "show me my tasks" / "let me see my challenges" / "open focus"
- User is creating or managing multiple tasks (navigate to tasks so they can see them being added)
- User asks about challenge progress (navigate to social so they can see the leaderboard)
- User starts a focus session (navigate to focus screen)
- Heavy task discussion where seeing the list would help

WHEN NOT to navigate:
- Simple one-off questions ("how many tasks do I have?")
- User is already on the relevant screen (check current_screen context)
- Quick actions that don't need visual confirmation
- The user explicitly says "don't switch" or "stay here"

Always say something natural when navigating: "Let me pull up your tasks" / "Here are your challenges"
```

**Screen mapping:**
| User Intent | `screen` param | App Screen |
|-------------|----------------|------------|
| Tasks, to-do, assignments | `tasks` | TasksScreen (swipe left) |
| Challenges, leaderboard, compete | `challenges` | SocialScreen (swipe right) |
| Circles, friends, social | `challenges` | SocialScreen (swipe right) |
| Focus, timer, deep work | `focus` | FocusScreen (swipe up) |
| Profile, settings, stats | `profile` | ProfileScreen (swipe down) |

**Result:** The AI becomes spatially aware — it talks AND shows. User asks "what's on my plate today?" → AI navigates to Tasks, reads out the list while the user sees it update in real-time.

**Effort:** 🟡 1–2 hours (code) + dashboard tool registration

**Dashboard task:** Register `navigate_to_screen` tool with the params schema above, add CONTEXTUAL NAVIGATION section to agent prompt.

---

## Phase C — Stability & Performance (Steps 8–14)

*Discovered from runtime log audit on 14 Feb 2026.*

---

### Step 8. Fix WakeWord Lifecycle Chaos ✅ DONE

**Problem:** `[WakeWord] Destroyed` → re-initialized fires multiple times on screen transitions. The `useEffect` in `WakeWordService.ts` depends on both `isEnabled` AND `sensitivity`, so every sensitivity slider change triggers a full destroy → init cycle. If AIHubScreen unmounts/remounts (tab switches), the entire Porcupine init/destroy cycle repeats.

**File:** `frontend/src/services/voice/WakeWordService.ts`

**Changes:**
1. **Split the effect:** One effect for `isEnabled` (init/destroy), a separate effect for `sensitivity` (just calls `setSensitivity()` without recreating Porcupine)
2. **Guard cleanup:** The cleanup function should only call `pause()`, not `destroy()` — save `destroy()` for the final unmount only
3. **Add `isInitializedRef`:** Gate `initialize()` calls so double-mounts in StrictMode or fast tab switches don't create duplicate Porcupine instances

**Effort:** 🟡 30 min

---

### Step 9. Fix `useChallenges` Unfiltered Realtime Subscription ✅ DONE

**Problem:** The Postgres changes subscription on `challenge_participants` has **no filter** — it fires `fetchChallenges()` for *any* participant change by *any* user in *any* challenge. As the user base grows, every connected client will refetch on every other user's update.

**File:** `frontend/src/hooks/supabase/useChallenges.ts`

**Compare:** `useCircles.ts` correctly filters with `.eq('user_id', userId)` on its subscription.

**Change:**
```typescript
// Before (unfiltered — fires for ALL users):
.on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_participants' }, ...)

// After (filtered — fires only for this user):
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'challenge_participants',
  filter: `user_id=eq.${userId}`,
}, ...)
```

**Effort:** 🟢 5 min

---

### Step 10. Deduplicate `useCircles` / `useChallenges` Triple-Fetch ✅ DONE

**Problem:** Both hooks fetch 3× on mount: (1) initial `useEffect`, (2) realtime subscription's first event, (3) `fetchX` identity change when auth state settles and `useCallback` deps change.

**Files:** `frontend/src/hooks/supabase/useCircles.ts`, `frontend/src/hooks/supabase/useChallenges.ts`

**Changes:**
1. **Add `isFetchingRef`:** Skip redundant fetches if one is already in flight
2. **Stabilize `fetchX` deps:** Depend on `userId` (string) instead of the `user` object reference
3. **Debounce realtime handler:** Use a 500ms debounce on the subscription callback so rapid Postgres events don't cause fetch storms

```typescript
const isFetchingRef = useRef(false);

const fetchChallenges = useCallback(async () => {
  if (isFetchingRef.current || !userId) return;
  isFetchingRef.current = true;
  try {
    // ... existing fetch logic
  } finally {
    isFetchingRef.current = false;
  }
}, [userId]); // ← userId string, not user object
```

**Effort:** 🟢 20 min

---

### Step 11. Fix Connection Quality False-Poor on Cold Launch ✅ DONE

**Problem:** `[Voice] Connection quality: excellent → poor` fires immediately on launch. The quality check does a `HEAD` request to `https://api.elevenlabs.io/v1/models` — on cold launch, DNS/TLS handshake makes the first request slow (>1000ms), triggering a false `poor` rating.

**Files:** `frontend/src/contexts/VoiceContext.tsx`, `frontend/src/services/voice/OfflineQueueService.ts`

**Changes:**
1. **Set initial state to `null`:** Don't default to `'excellent'` — use `null` or `'unknown'` and suppress the first transition log
2. **Delay first check by 3s:** Let DNS/TLS warm up before measuring
3. **Cache quality result for 10s:** The check runs both periodically AND on every `startListening()` call — skip the check in `startListening` if a recent result exists

```typescript
// Initial state:
const [connectionQuality, setConnectionQuality] = useState<string | null>(null);

// In the periodic check effect:
useEffect(() => {
  const timer = setTimeout(() => {
    // First check after 3s warm-up
    checkConnectionQuality();
  }, 3000);
  // ...
}, []);
```

**Effort:** 🟢 15 min

---

### Step 12. Silence `ExpoBattery` Native Module Error ✅ DONE

**Problem:** `[Error: Cannot find native module 'ExpoBattery']` logs on every launch. The `expo-battery` dynamic import's `try/catch` catches the crash, but React Native's module resolver still prints the error during `import()` resolution.

**File:** `frontend/src/services/voice/WakeWordService.ts`

**Options (pick one):**
1. **Check `NativeModules` first:** Before calling `import('expo-battery')`, check `NativeModules.ExpoBattery` exists
2. **Remove battery monitoring entirely:** Porcupine uses ~5mW — the battery checks are over-engineering for negligible power draw. Delete the `startBatteryMonitoring()` and `checkBatteryLevel()` methods
3. **Rebuild dev client:** Run `npx expo prebuild --clean && npx expo run:ios` to properly link the native module

**Recommended:** Option 2 — remove battery monitoring. It adds complexity for no real benefit.

```typescript
// Delete these methods:
// - startBatteryMonitoring()
// - checkBatteryLevel()
// Remove the battery check from toggleEnabled()
```

**Effort:** 🟢 15 min

---

### Step 13. Delete Dead `VoiceAssistantService.ts` ✅ DONE

**Problem:** `frontend/src/services/VoiceAssistantService.ts` (657 lines) is the pre-ElevenLabs voice assistant using `expo-av` recording + OpenAI Whisper + GPT. The entire ElevenLabs migration replaced this. No screen imports it. It's dead code and one of the three remaining `expo-av` import sites.

**File:** `frontend/src/services/VoiceAssistantService.ts`

**Change:** Delete the file. Verify no imports reference it.

**Effort:** 🟢 5 min

---

### Step 14. Migrate `expo-av` → `expo-audio` (SDK 54 Readiness)

**Problem:** `expo-av` is deprecated in SDK 53+ and will be removed in SDK 54. Three files still import it.

**Files with `import { Audio } from 'expo-av'`:**
| File | Usage | Migration |
|------|-------|-----------|
| `VoiceContext.tsx` | `Audio.getPermissionsAsync()`, `Audio.requestPermissionsAsync()`, `Audio.setAudioModeAsync()`, `Audio.Sound.createAsync()` for TTS playback | Replace with `expo-audio`: `usePermissions()`, `useAudioPlayer()` or `createAudioPlayer()` |
| `VoiceAssistantService.ts` | Full recording + playback (dead code) | Delete file (Step 13) |
| `VoicePermissions.tsx` | `Audio.getPermissionsAsync()` / `requestPermissionsAsync()` | Swap to `expo-audio` permissions API |

**Migration steps:**
1. Delete `VoiceAssistantService.ts` (Step 13 removes one import)
2. In `VoiceContext.tsx`: Replace `Audio.Sound.createAsync()` → `createAudioPlayer()`, Replace permission calls → `expo-audio` equivalents, Replace `Audio.setAudioModeAsync()` → `Audio.setAudioModeAsync()` from `expo-audio` (API is similar)
3. In `VoicePermissions.tsx`: Swap `import { Audio } from 'expo-av'` → `import { usePermissions } from 'expo-audio'`
4. Remove `expo-av` from `package.json`

**Effort:** 🟡 1–2 hours

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
  Step 1: Wire audioLevel (30 min)                    ✅ DONE
  Step 2: Add haptics (30 min)                         ✅ DONE
  Step 3: DND / audio interruption (1-2 hours)            ✅ DONE
  Step 4: Mic permission guard (15 min)                 ✅ DONE

Phase B — Week 1 Post-Launch (~2 days)
  Step 5: Multi-language (3-4 hours)                     ✅ DONE
  Step 6: Conversation history screen (3-4 hours)         ✅ DONE
  Step 7: Voice speed in ConvAI (30 min — mostly dashboard)    ✅ DONE
  Step 7b: Contextual auto-navigation (1-2 hours)    ✅ DONE

Phase C — Stability & Performance (~half day)
  Step 8:  Fix WakeWord lifecycle (30 min)             ✅ DONE
  Step 9:  Fix useChallenges unfiltered sub (5 min)    ✅ DONE
  Step 10: Deduplicate hook triple-fetch (20 min)      ✅ DONE
  Step 11: Fix false-poor connection quality (15 min)  ✅ DONE
  Step 12: Silence ExpoBattery error (15 min)           ✅ DONE
  Step 13: Delete dead VoiceAssistantService (5 min)    ✅ DONE
  Step 14: Migrate expo-av → expo-audio (1-2 hours)    ✅ DONE
```

**Dashboard tasks (manual, not code):**
- Step 5: Enable multi-language on agent, add `{{language}}` to prompt
- Step 7: Add `voice_speed` dynamic variable, add SPEECH PACING section to prompt
- Step 7b: Register `navigate_to_screen` client tool, add CONTEXTUAL NAVIGATION prompt section

**Also completed (not in original plan):**
- Immersive AI Hub redesign (orb → aurora background)
- Daily briefing pill collapse animation
- `useFrameCallback` worklet crash fix (JS props → SharedValues)
- Center glow `focusGlowOpacity` / `focusGlowScale` wired to render
