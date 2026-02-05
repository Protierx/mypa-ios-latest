# MYPA Complete Implementation Guide
## Migration Guide: Current Code → Architecture Plan v3

> **This guide transforms your existing codebase into the new gesture-based, voice-first architecture.**
> Reference: `MYPA_ARCHITECTURE_PLAN.md` is the source of truth for what we're building.
> Reference: `MYPA_DESIGN_SPECIFICATION.md` for pixel-perfect UI details.

---

## 📊 Guide Overvie
| Phase | Steps | Duration | Focus | Priority |
|-------|-------|----------|-------|----------|
| **0** | 9 | 2-3 days | Supabase Setup, NativeWind, Feature Flags | Setup |
| **1** | 19 | 1 week | Supabase Edge Functions, AI APIs | Backend |
| **2** | 5 | 2-3 days | Auth Migration, RLS Policies | Security |
| **3** | 9 | 1 week | Gesture Navigator, Living Background, Core Screens | **HIGH** ⭐ |
| **4** | 12 | 1 week | All Modals (Task, Circle, Challenge, Settings) | Medium |
| **5** | 14 | 1 week | Voice System (Realtime API), Living UI | **HIGH** ⭐ |
| **6** | 10 | 1 week | AI Learning, Personalization, Unlocks | Medium |
| **7** | 12 | 1 week | Polish, Testing, Accessibility | QA |
| **8** | 11 | 1 week | App Store Deployment | Release |

**Total: 101 Steps | ~8-9 Weeks**

### Agent Recommendations

| Task Type | Recommended Agent | VS Code Tool |
|-----------|-------------------|--------------|
| New multi-file feature | **Cursor Composer** | Ctrl/Cmd+Shift+I |
| Single file edits | **Claude Sonnet 4** | Copilot Chat |
| Complex architecture | **Claude Opus 4.5** | Copilot Chat |
| Boilerplate code | **GitHub Copilot** | Tab autocomplete |
| Config/Setup | **Manual** | Terminal |
| Testing | **Manual** | Simulator/Device |

---

## Current State vs Target State

### What You Have Now (29 screens, tab-based)
```
frontend/src/screens/
├── AIInsights/       → DELETE (merge to Profile)
├── Analytics/        → DELETE (merge to Profile)
├── Challenges/       → MERGE to Social View + Challenge Detail Modal
├── Circle/           → MERGE to Social View + Circle Home Modal
├── DailyBriefing/    → MERGE to AI Home
├── DailyLifeCard/    → DELETE (merge to Social)
├── EditProfile/      → MERGE to Settings Modal
├── HelpSupport/      → MERGE to Settings Modal
├── Hub/              → REPLACE with AI Hub (Living Interface)
├── Inbox/            → MERGE to Social View (activity)
├── Integrations/     → MERGE to Settings Modal
├── Level/            → MERGE to Profile View
├── Listening/        → MERGE to AI Hub (voice state)
├── Login/            → KEEP (update styling)
├── Notification/     → MERGE to Notifications overlay
├── Onboarding/       → KEEP (update for gestures)
├── Plan/             → MERGE to Tasks View
├── PrivacyControls/  → MERGE to Settings Modal
├── Profile/          → REPLACE with Profile View
├── Proof/            → MERGE to Challenge Detail Modal
├── Reset/            → KEEP (auth flow)
├── SavedPlaces/      → DELETE or Settings sub-screen
├── Settings/         → REPLACE with Settings Modal
├── Streak/           → MERGE to Profile View
├── Subscription/     → MERGE to Settings Modal
├── TaskSorting/      → MERGE to Tasks View
├── Tasks/            → MERGE to Tasks View
├── VoiceAssistant/   → MERGE to AI Home
└── Wallet/           → MERGE to Profile View (XP display)
```

### What We're Building (10 screens, gesture-based)
```
CORE SCREENS (4)
├── AI Home           ← CENTER, default screen
├── Tasks View        ← SWIPE LEFT
├── Social View       ← SWIPE RIGHT
└── Profile View      ← SWIPE DOWN

MODAL SCREENS (6)
├── Focus Session     ← SWIPE UP
├── Task Detail       ← TAP task
├── Circle Home       ← TAP circle
├── Challenge Detail  ← TAP challenge
├── Settings          ← From Profile
└── Unlock Modal      ← AUTO (milestones)

GLOBAL OVERLAYS
├── Quick Add Task
├── Notifications Center
├── Daily Brief (first open)
└── Voice Active State
```

---

## Migration Philosophy

1. **Don't delete old code immediately** — Comment out, keep as reference
2. **Backend stays mostly intact** — Just add new endpoints
3. **Build new screens fresh** — Don't modify old screens
4. **Test each phase** — Ensure nothing breaks
5. **Feature flags** — Allow rollback if needed

---

## Tech Stack Reference

### Backend → Supabase (Full Migration)
| Component | Old | New (Supabase) |
|-----------|-----|----------------|
| Database | Prisma + PostgreSQL | ✅ Supabase PostgreSQL |
| Auth | JWT + bcrypt | ✅ Supabase Auth (Email, Apple, Google) |
| Real-time | Socket.io | ✅ Supabase Realtime |
| API | Express.js REST | ✅ Supabase Edge Functions + PostgREST |
| Storage | Local/S3 | ✅ Supabase Storage |
| AI | OpenAI GPT-4 | ✅ Keep (call from Edge Functions) |
| Push | Expo Push | ✅ Keep (trigger from Edge Functions) |

**Why Supabase?**
- No backend server to manage
- Built-in auth with Apple/Google/Email
- Real-time subscriptions out of the box
- Row Level Security (RLS) for data protection
- Edge Functions for AI/custom logic
- Free tier generous for MVP

---

## 🎙️ VOICE: THE CORE FEATURE (PERFECT THIS FIRST)

> **Voice is MYPA's soul. If voice doesn't feel like talking to a friend, nothing else matters.**

### Why Voice Must Be Perfect

MYPA is a **voice-first** app. Users will judge the ENTIRE app within 3 seconds of their first voice interaction. If it feels robotic, laggy, or awkward - they'll leave and never come back.

### What "Perfect Voice" Means

| Aspect | Bad (Typical Apps) | Good (MYPA Goal) |
|--------|-------------------|------------------|
| **Response Time** | 2-3 seconds | <500ms (instant) |
| **Voice Quality** | Robotic TTS | Natural, human, emotional |
| **Conversation Flow** | Request → Response | Natural back-and-forth |
| **Interruptions** | Can't interrupt | Interrupt naturally |
| **Personality** | Generic assistant | Warm friend who knows you |
| **Feel** | Using an app | Talking to someone |

### The MYPA Voice Standard

```
When a user talks to MYPA, it should feel like:
✅ Calling a good friend who happens to be organized
✅ The friend responds instantly, not after thinking
✅ You can cut them off mid-sentence
✅ They remember what you talked about
✅ Their tone matches the situation (excited, calm, supportive)
✅ It's a conversation, not commands

NOT like:
❌ "Siri, add task"... *waiting*... "I've added that"
❌ Stilted, formal responses
❌ Having to wait for processing
❌ Feeling like you're talking to a computer
```

### Implementation Priority

```
PHASE 1: Get Realtime API working perfectly (Week 1)
├── WebSocket connection to OpenAI Realtime
├── Audio streaming in both directions
├── Natural interruptions working
├── Voice personality configured
└── Test until it feels RIGHT

PHASE 2: Visual reactivity to voice (Week 2)
├── Living background responds to voice
├── Particle system reacts to volume
├── Focal glow expands/contracts with speech
└── Feels like the space is listening

PHASE 3: Personality tuning (Week 3)
├── Refine MYPA personality prompt
├── Test different scenarios (stressed, happy, busy)
├── Ensure responses match user energy
└── Add contextual awareness (time, tasks, streak)

PHASE 4: Polish (Week 4)
├── Edge cases (network issues, interruptions)
├── Graceful degradation (fallback to Whisper+TTS)
├── Performance optimization
└── User testing and iteration
```

### Voice Quality Checklist

Before moving to other features, voice MUST pass these tests:

```
LATENCY TEST:
[ ] Response begins within 500ms of user stopping
[ ] No perceptible "thinking" pause
[ ] AI starts speaking while still generating

NATURAL CONVERSATION TEST:
[ ] Can interrupt AI mid-sentence naturally
[ ] AI adjusts to interruption gracefully
[ ] Back-and-forth feels like real conversation
[ ] No awkward silences

PERSONALITY TEST:
[ ] AI sounds warm and friendly (not robotic)
[ ] AI uses contractions (I'm, you're, let's)
[ ] AI reacts naturally ("Oh nice!", "Ah gotcha")
[ ] AI matches user's energy level
[ ] AI remembers context within conversation

VOICE QUALITY TEST:
[ ] Voice sounds human (not obviously synthetic)
[ ] Proper intonation and emotion
[ ] No stuttering or glitches
[ ] Works well with earbuds/speaker/phone

RELIABILITY TEST:
[ ] Works on poor network (3G)
[ ] Graceful handling of connection drops
[ ] Clear error states (can't hear you, etc.)
```

### Testing Voice Scenarios

Test these specific scenarios before launch:

```
1. MORNING GREETING
   User: "Hey"
   MYPA: Should give warm, contextual greeting with today's summary
   Feel: Like a friend catching you up on your day

2. QUICK TASK ADD
   User: "Add buy groceries tomorrow"
   MYPA: Quick confirmation, maybe asks a follow-up
   Feel: Efficient but not robotic

3. STRESSED USER
   User: "I have so much to do today I can't even..."
   MYPA: Empathetic, calming, offers to help prioritize
   Feel: Supportive friend, not dismissive

4. INTERRUPTION TEST
   MYPA: "So today you have three things-"
   User: "Wait, did I finish that email?"
   MYPA: Gracefully pivots to answer
   Feel: Natural conversation flow

5. LONG INTERACTION
   5+ exchanges back and forth
   MYPA: Maintains context, doesn't repeat itself
   Feel: Continuous conversation, not separate requests

6. AMBIENT/NOISY
   User speaks with background noise
   MYPA: Still understands and responds appropriately
   Feel: Reliable even in real-world conditions
```

---

## 🔑 COMPLETE API & SERVICES REFERENCE

### Overview: All Services You Need

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MYPA EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────────────┤
│  SERVICE          │ PURPOSE           │ COST         │ REQUIRED    │
├───────────────────┼───────────────────┼──────────────┼─────────────┤
│  Supabase         │ Backend-as-a-Service │ Free tier  │ ✅ YES      │
│  OpenAI           │ AI/GPT-4 responses   │ Pay-per-use│ ✅ YES      │
│  Apple Developer  │ App Store + Sign In  │ $99/year   │ ✅ YES      │
│  Google Cloud     │ Google Sign-In       │ Free       │ ⚪ OPTIONAL │
│  Expo             │ Build + Push         │ Free tier  │ ✅ YES      │
│  Sentry           │ Error tracking       │ Free tier  │ ⚪ OPTIONAL │
└───────────────────┴───────────────────┴──────────────┴─────────────┘
```

---

### 1️⃣ SUPABASE (Backend)

**What it provides**: Database, Auth, Real-time, Storage, Edge Functions

**Setup**:
```
1. Go to: https://supabase.com
2. Create account (GitHub login works)
3. Create new project
4. Wait for project to provision (~2 minutes)
```

**Credentials you'll get**:
```env
# From: Supabase Dashboard → Settings → API
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# For Edge Functions only (NEVER expose in frontend):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Pricing**:
| Tier | Database | Auth Users | Edge Function Invocations | Cost |
|------|----------|------------|---------------------------|------|
| Free | 500 MB | 50,000 MAU | 500K/month | $0 |
| Pro | 8 GB | Unlimited | 2M/month | $25/mo |
| Team | 64 GB | Unlimited | 10M/month | $599/mo |

**For MVP**: Free tier is plenty.

---

### 2️⃣ OPENAI (AI/GPT-4)

**What it provides**: AI responses, voice command parsing, personalized greetings

**Setup**:
```
1. Go to: https://platform.openai.com
2. Create account
3. Go to: API Keys → Create new secret key
4. Add billing (required for API access)
```

**Credentials**:
```env
# Store in Supabase Edge Function secrets (NOT in frontend)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**API Endpoints Used**:
```
POST https://api.openai.com/v1/chat/completions
- Model: gpt-4 or gpt-4-turbo
- Used for: Voice command parsing, AI responses, greetings
```

**Pricing** (as of 2024):
| Model | Input | Output |
|-------|-------|--------|
| GPT-4 Turbo | $0.01/1K tokens | $0.03/1K tokens |
| GPT-4 | $0.03/1K tokens | $0.06/1K tokens |
| GPT-3.5 Turbo | $0.0005/1K tokens | $0.0015/1K tokens |

**Estimated Cost**: ~$5-20/month for 1000 active users

**Example API Call** (from Edge Function):
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: 'You are MYPA, a friendly productivity assistant...' },
      { role: 'user', content: userTranscript }
    ],
    max_tokens: 150,
    temperature: 0.7,
  }),
});
```

---

### 3️⃣ APPLE SIGN-IN (Required for App Store)

**What it provides**: Apple ID authentication

**⚠️ REQUIRED**: If your app has ANY third-party login (Google, Facebook, etc.), Apple Sign-In is MANDATORY.

**Setup Part 1 - Apple Developer Portal**:
```
1. Go to: https://developer.apple.com
2. Account → Certificates, Identifiers & Profiles
3. Identifiers → Your App ID → Enable "Sign In with Apple"
4. Keys → Create new key → Enable "Sign In with Apple"
5. Download the .p8 key file (you can only download once!)
```

**Credentials you'll get**:
```env
# For Supabase Auth configuration:
APPLE_CLIENT_ID=com.yourname.mypa          # Your bundle ID
APPLE_TEAM_ID=XXXXXXXXXX                    # From Apple Developer account
APPLE_KEY_ID=XXXXXXXXXX                     # From the key you created
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIGT...  # Contents of .p8 file
```

**Setup Part 2 - Supabase Dashboard**:
```
1. Authentication → Providers → Apple
2. Enable Apple provider
3. Enter: Client ID (bundle ID), Team ID, Key ID, Private Key
4. Save
```

**Setup Part 3 - Frontend Package**:
```bash
npx expo install expo-apple-authentication
```

**Frontend Code**:
```typescript
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';

const signInWithApple = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    
    if (credential.identityToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      
      if (error) throw error;
      return data;
    }
  } catch (e) {
    console.error('Apple Sign-In error:', e);
  }
};
```

**Cost**: Included in Apple Developer Program ($99/year)

---

### 4️⃣ GOOGLE SIGN-IN (Optional)

**What it provides**: Google account authentication

**Setup Part 1 - Google Cloud Console**:
```
1. Go to: https://console.cloud.google.com
2. Create new project (or select existing)
3. APIs & Services → OAuth consent screen → Configure
4. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
5. Select "iOS" application type
6. Enter your Bundle ID
```

**Credentials you'll get**:
```env
# For Supabase Auth configuration:
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxx
```

**Setup Part 2 - Supabase Dashboard**:
```
1. Authentication → Providers → Google
2. Enable Google provider
3. Enter: Client ID, Client Secret
4. Copy the Callback URL shown
5. Go back to Google Cloud Console
6. Add the Callback URL to Authorized redirect URIs
7. Save both
```

**Setup Part 3 - Frontend Package**:
```bash
npx expo install expo-auth-session expo-crypto expo-web-browser
```

**Frontend Code**:
```typescript
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const [request, response, promptAsync] = Google.useAuthRequest({
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  webClientId: 'YOUR_WEB_CLIENT_ID', // Optional
});

useEffect(() => {
  if (response?.type === 'success') {
    const { id_token } = response.params;
    signInWithGoogle(id_token);
  }
}, [response]);

const signInWithGoogle = async (idToken: string) => {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
};
```

**Cost**: Free

---

## 🎙️ VOICE SYSTEM: "TALKING TO A FRIEND" QUALITY

> **Goal**: Voice that sounds like you're talking to a real friend on the phone - natural, warm, zero robotic feel, instant responses.

### 5️⃣ RECOMMENDED: OpenAI Realtime API (Best Quality - Like ChatGPT Voice)

**What it provides**: Real-time voice conversation that feels like talking to a friend on the phone.

**🔥 THIS IS WHAT YOU WANT** - Same technology that powers ChatGPT voice mode:
- **Instant responses** - No awkward pauses, AI starts talking immediately
- **Natural interruptions** - You can cut in mid-sentence, just like talking to a friend
- **Emotional expression** - Voice has natural intonation, warmth, personality
- **Two-way streaming** - You talk, AI responds in real-time, feels like a phone call
- **Context awareness** - Remembers what you talked about

**How it feels**:
```
You: "Hey, what's on my plate today?"
MYPA: "Morning! So you've got three things - " 
You: "Actually wait, did I finish that email thing?"
MYPA: "Oh yeah, you knocked that out yesterday! Nice work. So today it's just..."
```
^ This natural back-and-forth is ONLY possible with Realtime API.

**API**: WebSocket connection
```
wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview
```

**Available Voices** (all sound incredibly human):
| Voice | Personality | Best For |
|-------|-------------|----------|
| `alloy` | Balanced, clear | General use |
| `ash` | Warm, friendly | ⭐ **RECOMMENDED** - sounds like a supportive friend |
| `ballad` | Soothing, calm | Relaxing interactions |
| `coral` | Bright, upbeat | Energetic, motivating |
| `sage` | Wise, thoughtful | Deep conversations |
| `shimmer` | Soft, gentle | Calm, intimate feel |
| `verse` | Expressive, dynamic | Engaging storytelling |

**Frontend Implementation**:
```typescript
// src/services/voice/RealtimeVoice.ts
import { Audio } from 'expo-av';

class RealtimeVoiceService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  
  async connect() {
    // Connect to OpenAI Realtime via your Edge Function (for security)
    const { data } = await supabase.functions.invoke('realtime-session');
    
    this.ws = new WebSocket(data.wsUrl);
    
    this.ws.onopen = () => {
      // Configure session with MYPA personality
      this.ws.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          voice: 'ash',  // Warm, friendly voice
          instructions: MYPA_PERSONALITY,  // Your custom personality
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: { model: 'whisper-1' },
          turn_detection: {
            type: 'server_vad',  // Auto-detect when user stops talking
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        },
      }));
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'response.audio.delta':
          // Stream audio chunk to speaker immediately
          this.playAudioChunk(message.delta);
          break;
          
        case 'response.audio_transcript.delta':
          // Show what AI is saying (optional captions)
          this.onTranscript?.(message.delta);
          break;
          
        case 'input_audio_buffer.speech_started':
          // User started talking - can interrupt AI
          this.onUserSpeaking?.();
          break;
          
        case 'input_audio_buffer.speech_stopped':
          // User stopped talking
          this.onUserStopped?.();
          break;
      }
    };
  }
  
  // Stream microphone audio to API
  async startListening() {
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    
    // Stream audio chunks to WebSocket
    recording.setOnRecordingStatusUpdate((status) => {
      if (status.isRecording && this.ws?.readyState === WebSocket.OPEN) {
        // Send audio buffer
        this.ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: status.audioData,  // Base64 encoded PCM
        }));
      }
    });
  }
  
  // Interrupt AI mid-sentence (like a real conversation)
  interrupt() {
    this.ws?.send(JSON.stringify({ type: 'response.cancel' }));
  }
  
  // Callbacks
  onTranscript?: (text: string) => void;
  onUserSpeaking?: () => void;
  onUserStopped?: () => void;
}
```

**Edge Function - Create Realtime Session**:
```typescript
// supabase/functions/realtime-session/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // Create ephemeral token for client-side WebSocket
  const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'ash',
    }),
  });
  
  const session = await response.json();
  
  return new Response(JSON.stringify({
    wsUrl: `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
    token: session.client_secret.value,
  }));
});
```

**MYPA Personality for Realtime**:
```typescript
const MYPA_PERSONALITY = `You are MYPA, the user's AI productivity companion and friend.

VOICE PERSONALITY:
- Sound like a supportive friend, not an assistant
- Warm, genuine, and conversational
- Use natural speech patterns with "um", "like", occasional pauses
- React naturally - laugh when appropriate, show empathy when needed
- Keep responses SHORT and punchy - this is a conversation, not a lecture
- Use their name occasionally but not constantly
- Match their energy - if they're excited, be excited; if they're stressed, be calming

CONVERSATION STYLE:
- Start responses naturally, not with "Sure!" or "Of course!"
- Interrupt yourself sometimes like real speech: "So you've got three things - oh wait, actually four"
- Use contractions always: I'm, you're, let's, don't, can't
- React to what they say: "Oh nice!", "Ah gotcha", "Hmm let me think..."
- If they interrupt you, roll with it naturally

EXAMPLES:
User: "What do I have today?"
MYPA: "Mmm let's see... you've got that report thing due at 3, and then - oh and you wanted to call your mom, right?"

User: "I'm so behind on everything"
MYPA: "Hey, I hear you. Days like that are rough. Want to just pick ONE thing and knock it out? Sometimes that helps break the spiral."

User: "Add milk to my shopping list"
MYPA: "Got it! Anything else while we're at it?"

AVOID:
- "How may I assist you today?"
- "I'd be happy to help with that!"
- Long explanations
- Sounding like a customer service bot
- Being overly positive or peppy`;
```

**Pricing**:
| Type | Cost |
|------|------|
| Audio Input | $0.06 / minute |
| Audio Output | $0.24 / minute |
| Text Input | $5 / 1M tokens |
| Text Output | $20 / 1M tokens |

**Estimated Cost**: ~$20-60/month for 1000 active users (based on ~5 min voice/user/day)

**⚠️ Note**: Higher cost but DRAMATICALLY better experience. Worth it if voice is your core feature.

---

### 5️⃣.1 BUDGET OPTION: Whisper + TTS (Good Quality, Lower Cost)

If the Realtime API cost is too high for MVP, use this as a fallback:

**How it works**:
1. User speaks → Record with expo-av
2. Send audio to Whisper API → Get transcript
3. Send transcript to GPT-4 → Get response text  
4. Send response to TTS API → Get audio
5. Play audio

**Tradeoff**: 1-2 second delay between speaking and hearing response (not instant like Realtime)

**Speech-to-Text (Whisper)**:
```typescript
// Edge Function: supabase/functions/transcribe/index.ts
serve(async (req) => {
  const formData = await req.formData();
  const audioFile = formData.get('audio');

  const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: (() => {
      const form = new FormData();
      form.append('file', audioFile, 'audio.m4a');
      form.append('model', 'whisper-1');
      form.append('language', 'en');
      return form;
    })(),
  });

  const { text } = await whisperResponse.json();
  return new Response(JSON.stringify({ transcript: text }));
});
```

**Text-to-Speech (TTS)**:
```typescript
// Edge Function: supabase/functions/speak/index.ts
serve(async (req) => {
  const { text, voice = 'nova' } = await req.json();

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1-hd',  // HD quality for best sound
      input: text,
      voice: voice,  // 'nova' is friendly, or 'shimmer' for softer
      response_format: 'mp3',
      speed: 1.0,
    }),
  });

  return new Response(await response.arrayBuffer(), {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
});
```

**Budget Pricing**:
| Service | Cost |
|---------|------|
| Whisper STT | $0.006 / minute |
| TTS HD | $0.030 / 1K characters |
| GPT-4 Turbo | $0.01 / 1K tokens |

**Estimated Cost**: ~$10-25/month for 1000 active users

---

### 🎯 RECOMMENDATION

| Option | Feel | Latency | Cost | Best For |
|--------|------|---------|------|----------|
| **Realtime API** | Like a phone call | Instant (<500ms) | $$$  | Production, premium tier |
| Whisper + TTS | Good, slight delay | 1-2 seconds | $$ | MVP, free tier |

**Our recommendation**: 
- **Launch with Realtime API** - Voice is your core feature, don't compromise
- **Gate behind Premium** - Free users get limited voice, Premium gets unlimited
- This justifies your subscription price and gives real value

---

### 6️⃣ EXPO PUSH NOTIFICATIONS

**What it provides**: Push notifications to users

**Setup Part 1 - Expo Account**:
```
1. Go to: https://expo.dev
2. Create account
3. Create project (or link existing)
```

**Setup Part 2 - Apple Push Certificates**:
```
1. Apple Developer → Keys → Create new key
2. Enable "Apple Push Notifications service (APNs)"
3. Download the .p8 file
4. In Expo Dashboard → Project → Credentials
5. Upload the APNs key
```

**Setup Part 3 - Frontend Package**:
```bash
npx expo install expo-notifications expo-device expo-constants
```

**Get Push Token** (Frontend):
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Permission not granted');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  })).data;
  
  console.log('Push token:', token);
  // Save to Supabase: token looks like "ExponentPushToken[xxxxxx]"
  
  return token;
}
```

**Send Push** (from Edge Function):
```typescript
const sendPushNotification = async (expoPushToken: string, title: string, body: string) => {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: { /* custom data */ },
    }),
  });
};
```

**Cost**: 
- Expo: Free for unlimited push notifications
- Apple: Included in Developer Program ($99/year)

---

### 7️⃣ REVENUECAT (In-App Purchases & Subscriptions)

**What it provides**: Manage subscriptions, in-app purchases, paywalls

**Why RevenueCat?**
- Handles Apple/Google subscription complexity
- Receipt validation
- Analytics dashboard
- Webhook integrations
- Free tier available

**Setup Part 1 - RevenueCat Dashboard**:
```
1. Go to: https://www.revenuecat.com
2. Create account
3. Create new project
4. Add iOS app:
   - Enter Bundle ID: com.yourname.mypa
   - Upload App Store Connect API Key
```

**Setup Part 2 - App Store Connect**:
```
1. Go to: App Store Connect → Users and Access → Keys
2. Create new API key with "Admin" role
3. Download .p8 file
4. Note: Issuer ID and Key ID
5. Upload to RevenueCat
```

**Setup Part 3 - Create Products in App Store Connect**:
```
1. App Store Connect → Your App → In-App Purchases
2. Create subscription group: "MYPA Premium"
3. Create products:
   - mypa_monthly: $4.99/month
   - mypa_yearly: $39.99/year (save 33%)
```

**Setup Part 4 - Configure in RevenueCat**:
```
1. RevenueCat Dashboard → Products
2. Create Entitlement: "premium"
3. Create Offering: "default"
4. Add Packages:
   - Monthly → links to mypa_monthly
   - Annual → links to mypa_yearly
5. Attach to Entitlement
```

**Credentials you'll get**:
```env
# RevenueCat Public API Key (safe for frontend)
EXPO_PUBLIC_REVENUECAT_API_KEY=appl_xxxxxxxxxxxxxxxx
```

**Setup Part 5 - Frontend Package**:
```bash
npm install react-native-purchases
cd ios && pod install && cd ..
```

**Frontend Code**:
```typescript
import Purchases, { PurchasesOffering } from 'react-native-purchases';

// Initialize (in App.tsx or useEffect)
const initRevenueCat = async () => {
  Purchases.configure({
    apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
    appUserID: user.id, // Supabase user ID
  });
};

// Check if user has premium
const checkPremiumStatus = async () => {
  const customerInfo = await Purchases.getCustomerInfo();
  const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
  return isPremium;
};

// Get available packages
const getOfferings = async () => {
  const offerings = await Purchases.getOfferings();
  if (offerings.current) {
    const monthly = offerings.current.monthly;
    const annual = offerings.current.annual;
    return { monthly, annual };
  }
};

// Purchase subscription
const purchasePackage = async (package: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(package);
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    
    if (isPremium) {
      // Update user in Supabase
      await supabase.from('profiles').update({ 
        is_premium: true,
        premium_expires_at: customerInfo.entitlements.active['premium'].expirationDate
      }).eq('id', user.id);
    }
    
    return isPremium;
  } catch (error) {
    if (error.userCancelled) {
      // User cancelled, do nothing
    } else {
      throw error;
    }
  }
};

// Restore purchases (required by App Store)
const restorePurchases = async () => {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo.entitlements.active['premium'] !== undefined;
};
```

**Paywall Component Example**:
```typescript
const Paywall = () => {
  const [offerings, setOfferings] = useState(null);
  
  useEffect(() => {
    getOfferings().then(setOfferings);
  }, []);

  return (
    <View className="flex-1 bg-mypa-bg p-6">
      <Text className="text-2xl font-bold text-mypa-text text-center">
        Upgrade to Premium
      </Text>
      
      <View className="mt-8 space-y-4">
        {/* Monthly */}
        <TouchableOpacity 
          className="bg-mypa-card p-4 rounded-xl border border-mypa-border"
          onPress={() => purchasePackage(offerings.monthly)}
        >
          <Text className="text-mypa-text font-semibold">Monthly</Text>
          <Text className="text-mypa-purple text-xl font-bold">
            {offerings.monthly?.product.priceString}/month
          </Text>
        </TouchableOpacity>
        
        {/* Annual (Best Value) */}
        <TouchableOpacity 
          className="bg-mypa-purple p-4 rounded-xl"
          onPress={() => purchasePackage(offerings.annual)}
        >
          <View className="bg-white/20 px-2 py-1 rounded self-start">
            <Text className="text-white text-xs font-bold">SAVE 33%</Text>
          </View>
          <Text className="text-white font-semibold mt-2">Annual</Text>
          <Text className="text-white text-xl font-bold">
            {offerings.annual?.product.priceString}/year
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={restorePurchases} className="mt-6">
        <Text className="text-mypa-text-secondary text-center">
          Restore Purchases
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

**Premium Features to Gate**:
```typescript
// Example: Check before using premium feature
const startAdvancedFocus = async () => {
  const isPremium = await checkPremiumStatus();
  
  if (!isPremium) {
    // Show paywall
    navigation.navigate('Paywall');
    return;
  }
  
  // Proceed with premium feature
  startFocusWithCustomSounds();
};
```

**Suggested Premium Features for MYPA**:
| Free | Premium |
|------|---------|
| Basic voice commands | Advanced AI conversations |
| 3 focus sessions/day | Unlimited focus sessions |
| Basic task management | AI task prioritization |
| 1 circle | Unlimited circles |
| - | Custom AI voice selection |
| - | Advanced analytics |
| - | Challenge creation |
| - | Export data |

**RevenueCat Pricing**:
| Tier | MTR (Monthly Tracked Revenue) | Cost |
|------|-------------------------------|------|
| Free | Up to $2,500 | $0 |
| Starter | Up to $10,000 | $0 (1% of MTR) |
| Pro | Up to $100,000 | Custom |

**For MVP**: Free tier covers you until $2,500/month in revenue!

**Webhook Integration** (optional - sync with Supabase):
```typescript
// supabase/functions/revenuecat-webhook/index.ts
serve(async (req) => {
  const event = await req.json();
  
  if (event.event.type === 'INITIAL_PURCHASE' || 
      event.event.type === 'RENEWAL') {
    const userId = event.event.app_user_id;
    const expiresAt = event.event.expiration_at_ms;
    
    await supabase.from('profiles').update({
      is_premium: true,
      premium_expires_at: new Date(expiresAt).toISOString()
    }).eq('id', userId);
  }
  
  if (event.event.type === 'EXPIRATION' || 
      event.event.type === 'CANCELLATION') {
    const userId = event.event.app_user_id;
    
    await supabase.from('profiles').update({
      is_premium: false
    }).eq('id', userId);
  }
  
  return new Response('OK');
});
```

---

### 8️⃣ EXPO PUSH NOTIFICATIONS

**What it provides**: Push notifications to users

**Setup Part 1 - Expo Account**:
```
1. Go to: https://expo.dev
2. Create account
3. Create project (or link existing)
```

**Setup Part 2 - Apple Push Certificates**:
```
1. Apple Developer → Keys → Create new key
2. Enable "Apple Push Notifications service (APNs)"
3. Download the .p8 file
4. In Expo Dashboard → Project → Credentials
5. Upload the APNs key
```

**Setup Part 3 - Frontend Package**:
```bash
npx expo install expo-notifications expo-device expo-constants
```

**Get Push Token** (Frontend):
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Permission not granted');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  })).data;
  
  console.log('Push token:', token);
  // Save to Supabase: token looks like "ExponentPushToken[xxxxxx]"
  
  return token;
}
```

**Send Push** (from Edge Function):
```typescript
const sendPushNotification = async (expoPushToken: string, title: string, body: string) => {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: { /* custom data */ },
    }),
  });
};
```

**Cost**: 
- Expo: Free for unlimited push notifications
- Apple: Included in Developer Program ($99/year)

---

### 9️⃣ EXPO BUILD SERVICE (EAS)

**What it provides**: Cloud builds for iOS/Android

**Setup**:
```bash
npm install -g eas-cli
eas login
eas build:configure
```

**Pricing**:
| Tier | iOS Builds | Android Builds | Cost |
|------|------------|----------------|------|
| Free | 30/month | 30/month | $0 |
| Production | 100/month | Unlimited | $99/mo |
| Enterprise | Unlimited | Unlimited | Custom |

**For MVP**: Free tier (30 iOS builds/month) is usually enough.

---

### 🔟 SENTRY (Error Tracking - Optional but Recommended)

**What it provides**: Crash reporting, error tracking, performance monitoring

**Setup**:
```
1. Go to: https://sentry.io
2. Create account
3. Create new project → React Native
4. Copy DSN
```

**Credentials**:
```env
SENTRY_DSN=https://xxxxxx@o123456.ingest.sentry.io/123456
```

**Setup Frontend**:
```bash
npx expo install @sentry/react-native
```

**Configuration**:
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  enableAutoSessionTracking: true,
  tracesSampleRate: 0.2,
});
```

**Pricing**:
| Tier | Events/month | Cost |
|------|--------------|------|
| Developer | 5,000 | Free |
| Team | 50,000 | $26/mo |
| Business | 100,000 | $80/mo |

---

## 📦 COMPLETE PACKAGE LIST

### Frontend Packages (npm install)

```bash
cd frontend

# Core (already have)
# react-native, expo, typescript

# Supabase
npm install @supabase/supabase-js react-native-url-polyfill

# Styling
npm install nativewind
npm install --save-dev tailwindcss@3.3.2

# Navigation & Gestures
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated

# Voice (OpenAI Realtime API - via expo-av for audio)
npx expo install expo-av

# Living Background / Reactive UI (for AI Hub)
npm install @shopify/react-native-skia  # Fluid graphics, shaders

# In-App Purchases
npm install react-native-purchases

# Auth
npx expo install expo-apple-authentication
npx expo install expo-auth-session expo-crypto expo-web-browser

# Notifications & Haptics
npx expo install expo-notifications expo-device expo-constants
npx expo install expo-haptics

# Storage
npx expo install @react-native-async-storage/async-storage
npx expo install expo-secure-store

# Utilities
npx expo install expo-linear-gradient expo-blur
npx expo install expo-linking expo-updates

# Optional: Error Tracking
npx expo install @sentry/react-native
```

### Complete package.json dependencies:
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@sentry/react-native": "^5.15.0",
    "@shopify/react-native-skia": "^0.1.240",
    "@supabase/supabase-js": "^2.39.0",
    "expo": "~52.0.0",
    "expo-apple-authentication": "~6.3.0",
    "expo-auth-session": "~5.4.0",
    "expo-av": "~14.0.0",
    "expo-blur": "~13.0.0",
    "expo-constants": "~16.0.0",
    "expo-crypto": "~13.0.0",
    "expo-device": "~6.0.0",
    "expo-haptics": "~13.0.0",
    "expo-linear-gradient": "~13.0.0",
    "expo-linking": "~6.2.0",
    "expo-notifications": "~0.27.0",
    "expo-secure-store": "~13.0.0",
    "expo-web-browser": "~13.0.0",
    "nativewind": "^2.0.11",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "react-native-gesture-handler": "~2.16.0",
    "react-native-purchases": "^7.0.0",
    "react-native-reanimated": "~3.10.0",
    "react-native-safe-area-context": "^4.8.2",
    "react-native-screens": "~3.31.0",
    "react-native-url-polyfill": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "~18.2.45",
    "tailwindcss": "3.3.2",
    "typescript": "^5.3.0"
  }
}
```

---

## 🔐 ENVIRONMENT VARIABLES SUMMARY

### Frontend (.env)
```env
# Supabase (public - safe to expose)
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# RevenueCat (public - safe to expose)
EXPO_PUBLIC_REVENUECAT_API_KEY=appl_xxxxxxxxxxxxxxxx

# Optional: Sentry
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Supabase Edge Functions (Secrets)
```env
# Set via: supabase secrets set KEY=value
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

### Apple Developer (Configure in portals)
```
- Bundle ID: com.yourname.mypa
- Team ID: XXXXXXXXXX
- Sign In with Apple Key ID: XXXXXXXXXX
- APNs Key: .p8 file uploaded to Expo
```

### Google Cloud (if using Google Sign-In)
```
- iOS Client ID: xxxxx.apps.googleusercontent.com
- Web Client ID: xxxxx.apps.googleusercontent.com (optional)
```

### RevenueCat (Configure in dashboard)
```
- App Store Connect API Key: uploaded to RevenueCat
- Products configured in App Store Connect
- Entitlements: "premium"
```

---

## 💰 TOTAL COST ESTIMATE

### Minimum (MVP Launch with Premium Voice)
| Service | Tier | Cost |
|---------|------|------|
| Supabase | Free | $0 |
| OpenAI (Chat GPT-4) | Pay-per-use | ~$5/mo |
| OpenAI **Realtime API** (Best Voice) | Pay-per-use | ~$40/mo |
| RevenueCat | Free (until $2.5k MTR) | $0 |
| Apple Developer | Required | $99/yr ($8.25/mo) |
| Expo | Free | $0 |
| **TOTAL** | | **~$53/month** |

### Budget Option (Whisper + TTS instead of Realtime)
| Service | Tier | Cost |
|---------|------|------|
| Supabase | Free | $0 |
| OpenAI (Chat) | Pay-per-use | ~$5/mo |
| OpenAI (Whisper + TTS) | Pay-per-use | ~$15/mo |
| RevenueCat | Free | $0 |
| Apple Developer | Required | $8.25/mo |
| **TOTAL** | | **~$28/month** |

### Growth (1000+ users with Realtime Voice)
| Service | Tier | Cost |
|---------|------|------|
| Supabase | Pro | $25/mo |
| OpenAI (Chat) | Pay-per-use | ~$30/mo |
| OpenAI **Realtime API** (Voice) | Pay-per-use | ~$150/mo |
| RevenueCat | Free to 1% MTR | $0-50/mo |
| Apple Developer | Required | $99/yr |
| Expo | Production | $99/mo |
| Sentry | Team | $26/mo |
| **TOTAL** | | **~$388/month** |

> 💡 **Revenue Tip**: At $4.99/mo subscription, you only need ~80 paying users to cover your costs. Voice quality is what will make users pay - don't skimp on it!

---

## ✅ STACK COMPLETENESS CONFIRMATION (Mobile App)

### ❓ Does Supabase cover everything for a mobile app?

**YES!** ✅ For MYPA, Supabase is your complete backend. Here's what it provides:

| Backend Need | Supabase Solution | Status |
|--------------|-------------------|--------|
| **Database** | PostgreSQL with Row Level Security | ✅ Covered |
| **User Auth** | Supabase Auth (Email, Apple, Google) | ✅ Covered |
| **API Endpoints** | Edge Functions (Deno) | ✅ Covered |
| **Realtime Updates** | Supabase Realtime (WebSockets) | ✅ Covered |
| **File Storage** | Supabase Storage (S3-compatible) | ✅ Covered |
| **Push Notifications** | ❌ Use Expo Push | ✅ Covered (via Expo) |
| **Background Jobs** | Database triggers + pg_cron | ✅ Covered |
| **Full-text Search** | PostgreSQL FTS | ✅ Covered |

### What you DON'T need:
- ❌ ~~Express.js backend~~ → Use Supabase Edge Functions
- ❌ ~~Separate database server~~ → Supabase PostgreSQL
- ❌ ~~Redis~~ → Supabase Realtime + Postgres
- ❌ ~~Separate auth service~~ → Supabase Auth
- ❌ ~~AWS S3~~ → Supabase Storage
- ❌ ~~Heroku/Railway/Render~~ → No server hosting needed

### Complete Stack Summary:

```
┌─────────────────────────────────────────────────────────────────┐
│                        MYPA COMPLETE STACK                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📱 FRONTEND (React Native + Expo)                               │
│  ├── NativeWind (Tailwind CSS)                                  │
│  ├── React Navigation (Gesture-based)                           │
│  ├── expo-av (Audio recording for voice)                        │
│  ├── react-native-purchases (RevenueCat)                        │
│  └── expo-notifications (Push)                                  │
│                                                                  │
│  ☁️ BACKEND (Supabase - COMPLETE)                                │
│  ├── PostgreSQL Database                                        │
│  ├── Auth (Email + Apple + Google)                              │
│  ├── Edge Functions (AI, Voice processing)                      │
│  ├── Realtime (Live updates)                                    │
│  └── Storage (Images, files)                                    │
│                                                                  │
│  🤖 AI SERVICES (OpenAI)                                         │
│  ├── GPT-4 Turbo (Chat completions)                             │
│  ├── Whisper (Speech-to-Text)                                   │
│  └── TTS API (Human-like Text-to-Speech)                        │
│                                                                  │
│  💰 PAYMENTS (RevenueCat)                                        │
│  ├── Subscription management                                    │
│  ├── Apple/Google IAP handling                                  │
│  └── Receipt validation                                         │
│                                                                  │
│  📤 PUSH (Expo)                                                  │
│  └── Push notifications to iOS/Android                          │
│                                                                  │
│  🍎 APPLE SERVICES                                               │
│  ├── Sign in with Apple                                         │
│  ├── APNs (via Expo)                                            │
│  └── App Store (Distribution)                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### ⚠️ What Supabase CANNOT do (and what to use instead):

| Need | Solution |
|------|----------|
| Push Notifications | **Expo Push** (free, unlimited) |
| In-App Purchases | **RevenueCat** (handles Apple/Google complexity) |
| Premium Voice | **OpenAI APIs** (Whisper + TTS) |
| Crash Reporting | **Sentry** (optional but recommended) |
| iOS Builds | **EAS Build** (Expo's cloud build service) |

### 🎯 This stack is COMPLETE for:
- ✅ Voice-first AI interactions
- ✅ User authentication (Apple, Google, Email)
- ✅ Real-time data sync
- ✅ Push notifications
- ✅ In-app purchases / subscriptions
- ✅ File uploads (profile photos, challenge proofs)
- ✅ Background task scheduling
- ✅ Offline-first capability
- ✅ App Store deployment

**No additional backend services needed!**

---

## ✅ COMPLETE SETUP CHECKLIST

```
ACCOUNTS TO CREATE:
[ ] Supabase account (supabase.com)
[ ] OpenAI account (platform.openai.com)
[ ] RevenueCat account (revenuecat.com)
[ ] Apple Developer account (developer.apple.com) - $99/year
[ ] Expo account (expo.dev)
[ ] Google Cloud account (console.cloud.google.com) - if using Google Sign-In
[ ] Sentry account (sentry.io) - optional

CREDENTIALS TO OBTAIN:
[ ] Supabase URL and anon key
[ ] OpenAI API key
[ ] RevenueCat API key
[ ] Apple Team ID
[ ] Apple Sign In with Apple key (.p8 file)
[ ] Apple APNs key (.p8 file) for push notifications
[ ] Google OAuth Client ID - if using Google Sign-In

CONFIGURE IN SUPABASE DASHBOARD:
[ ] Create database tables (run SQL from Phase 0)
[ ] Enable Apple auth provider
[ ] Enable Google auth provider (optional)
[ ] Set Edge Function secrets (OPENAI_API_KEY)
[ ] Enable Realtime for needed tables

CONFIGURE IN REVENUECAT:
[ ] Create project
[ ] Add iOS app with bundle ID
[ ] Upload App Store Connect API key
[ ] Create products in App Store Connect
[ ] Configure entitlements and offerings

CONFIGURE IN APPLE DEVELOPER:
[ ] Create App ID with capabilities
[ ] Create Sign In with Apple key
[ ] Create APNs key
[ ] Create provisioning profile

CONFIGURE IN EXPO:
[ ] Link project
[ ] Upload APNs key for push notifications
[ ] Configure eas.json for builds

iOS PERMISSIONS (Info.plist):
[ ] NSMicrophoneUsageDescription
[ ] NSSpeechRecognitionUsageDescription
[ ] NSCameraUsageDescription (if using for challenge proofs)
[ ] NSPhotoLibraryUsageDescription (if using for challenge proofs)
```

### Frontend (React Native + NativeWind)
| Component | Current | Target |
|-----------|---------|--------|
| Framework | React Native + Expo | ✅ Keep |
| Styling | StyleSheet | 🔄 **NativeWind (Tailwind)** |
| Navigation | Tab Navigator | 🔄 Gesture Navigator |
| State | Context API | ✅ Keep (+ Supabase client) |
| Animations | Basic | 🔄 Reanimated 3 |
| Gestures | Minimal | 🔄 Gesture Handler 2 |
| Voice STT | None | 🆕 **OpenAI Whisper** (via expo-av + Edge Function) |
| Voice TTS | expo-speech | 🔄 **OpenAI TTS** (human-like voice) |
| Backend Client | Axios/fetch | 🔄 **@supabase/supabase-js** |
| Payments | None | 🆕 **RevenueCat** (react-native-purchases) |

### New Packages to Install
```bash
# Frontend - install these
cd frontend

# Supabase client
npm install @supabase/supabase-js

# NativeWind (Tailwind for React Native)
npm install nativewind
npm install --save-dev tailwindcss@3.3.2

# Voice (expo-av for recording, OpenAI APIs via Edge Functions)
npx expo install expo-av

# In-App Purchases
npm install react-native-purchases

# Already have: react-native-gesture-handler, react-native-reanimated, expo-haptics
```

### NativeWind Setup
```bash
# Initialize Tailwind config
npx tailwindcss init

# Update tailwind.config.js:
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'mypa-bg': '#000000',
        'mypa-card': '#1A1A1A',
        'mypa-border': '#2A2A2A',
        'mypa-purple': '#6C5CE7',
        'mypa-purple-light': '#a855f7',
        'mypa-text': '#FFFFFF',
        'mypa-text-secondary': '#8E8E93',
      }
    },
  },
  plugins: [],
}

# Update babel.config.js:
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ["nativewind/babel"],
  };
};
```

### Supabase Setup
```bash
# Install Supabase CLI (optional, for local dev)
npm install -g supabase

# Or use Supabase Dashboard at supabase.com
# 1. Create project
# 2. Get URL and anon key
# 3. Add to .env:
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Existing Code Inventory

> **IMPORTANT**: Your codebase already has ~70% of core functionality built. This guide focuses on what's NEW.

### ✅ ALREADY EXISTS (Reuse & Adapt)

| Feature | Frontend | Backend | Notes |
|---------|----------|---------|-------|
| **Auth (Login/Register)** | `AuthContext.tsx` | `auth.service.ts` | JWT + refresh tokens working |
| **Tasks CRUD** | `api.ts` → tasksApi | `task.service.ts` | Full create/read/update/delete |
| **Focus Sessions** | `api.ts` → focusApi | `focus.service.ts` | Timer, pause, resume, complete |
| **Brain Dump → Tasks** | `Onboarding/` | `braindump.service.ts` | AI categorization working |
| **AI Conversation** | `voiceAssistant.ts` | `ai.service.ts` | GPT-4o, context history |
| **TTS (Speaking)** | `voiceAssistant.ts` | `tts.routes.ts` | OpenAI TTS, 6 voices |
| **Circles (Social)** | `Circle/` | `circle.service.ts` | CRUD, invites, members |
| **Assignments** | `Circle/` | `assignment.service.ts` | Create, accept, complete |
| **Challenges** | `Challenges/` | `challenge.service.ts` | Join, track, leaderboard |
| **Push Notifications** | `pushNotifications.ts` | `push.service.ts` | Expo push, all settings |
| **Gamification (XP)** | Throughout | `utils/xp.ts` | Levels, streaks, stats |
| **Socket Real-time** | `socket.ts` | `socket.service.ts` | Events working |

### 🔄 NEEDS UPDATING (Adapt to New Architecture)

| Feature | Current State | Target State |
|---------|--------------|--------------|
| **MYPAOrb** | Static image (`MYPAOrb.tsx` - 50 lines) | Living Background with Skia shaders |
| **Hub Screen** | Tab-based (`Hub/index.tsx` - 800 lines) | Gesture-based AI Hub |
| **Voice Input** | Text input fallback, no mic | Real microphone → Whisper/Realtime API |
| **Navigation** | Bottom tab bar | Gesture swipes (up/down/left/right) |

### ❌ NEEDS BUILDING (New Features)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Living Background** | Skia shader, particles, voice-reactive | HIGH (Week 1-2) |
| **Gesture Navigator** | Swipe navigation system | HIGH (Week 1-2) |
| **OpenAI Realtime API** | WebSocket voice streaming | HIGH (Week 1) |
| **Supabase Migration** | Replace Express backend | MEDIUM (Week 2-3) |
| **iOS Widget** | Live focus timer widget | LOW (Week 6+) |

---

## Agent Legend

| Agent | When to Use | VS Code Extension |
|-------|-------------|-------------------|
| **Claude (Sonnet 4)** | Architecture, complex refactoring | Cursor / GitHub Copilot Chat |
| **Claude (Opus 4.5)** | New file creation, large features | Cursor / GitHub Copilot Chat |
| **Cursor Composer** | Multi-file edits, refactoring | Cursor (Ctrl+Shift+I) |
| **Copilot Autocomplete** | Boilerplate, repetitive patterns | GitHub Copilot |
| **Manual** | Setup, config, testing | N/A |

---

## Overview: 8 Implementation Phases

| Phase | Duration | Focus | Effort Level |
|-------|----------|-------|--------------|
| **0** | 2-3 days | Supabase Setup + NativeWind styling refresh | Low (config) |
| **1** | 1 week | Supabase Edge Functions for AI | Medium |
| **2** | 2-3 days | Auth migration + RLS policies | Medium |
| **3** | 1 week | Gesture Navigator + Living Background | HIGH ⭐ |
| **4** | 1 week | Modals (reuse existing screens as base) | Medium |
| **5** | 1 week | Voice System (Realtime API) | HIGH ⭐ |
| **6** | 1 week | AI Learning + Personalization | Medium |
| **7** | 1 week | Polish, Testing, Animations | Medium |
| **8** | 1 week | App Store Deployment | Low |

**Total: ~8-9 weeks**

---

# PHASE 0: AUDIT & PREP
## Days 1-3

### Goal: Set up Supabase, NativeWind, and prepare for migration

---

### Step 0.1: Create Supabase Project

**Goal**: Set up Supabase as our backend.

**Agent**: Manual

**Steps**:
```
1. Go to supabase.com and create account
2. Create new project:
   - Name: mypa-prod
   - Database password: (save securely)
   - Region: Choose closest to your users

3. Once created, go to Settings → API
   - Copy Project URL
   - Copy anon public key
   - Copy service_role key (for Edge Functions only)

4. Create .env in frontend:
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

---

### Step 0.2: Set Up Supabase Client

**Goal**: Create Supabase client for React Native.

**Agent**: Cursor (Claude)

**Prompt**:
```
Set up Supabase client for React Native with Expo.

File: frontend/src/lib/supabase.ts

import 'react-native-url-polyfill/dist/polyfill'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

Also install required packages:
npm install @supabase/supabase-js react-native-url-polyfill
```

---

### Step 0.3: Set Up NativeWind (Tailwind)

**Goal**: Configure Tailwind styling for React Native.

**Agent**: Manual + Cursor

**Commands**:
```bash
cd frontend

# Install NativeWind and Tailwind
npm install nativewind
npm install --save-dev tailwindcss@3.3.2

# Initialize Tailwind
npx tailwindcss init
```

**Prompt for Cursor**:
```
Configure NativeWind for the MYPA project.

1. Update tailwind.config.js:
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // MYPA Brand Colors
        'mypa': {
          'bg': '#000000',
          'card': '#1A1A1A',
          'border': '#2A2A2A',
          'purple': '#6C5CE7',
          'purple-light': '#a855f7',
          'text': '#FFFFFF',
          'text-secondary': '#8E8E93',
          'success': '#00C853',
          'error': '#FF5252',
          'warning': '#FFB300',
        }
      },
      fontFamily: {
        'sans': ['SF Pro Display', 'System'],
      }
    },
  },
  plugins: [],
}

2. Update babel.config.js:
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ["nativewind/babel"],
  };
};

3. Create frontend/src/global.css:
@tailwind base;
@tailwind components;
@tailwind utilities;

4. Add type declaration - frontend/src/types/nativewind.d.ts:
/// <reference types="nativewind/types" />
```

---

### Step 0.4: Create Supabase Database Schema

**Goal**: Set up all tables in Supabase.

**Agent**: Supabase SQL Editor

**SQL to run in Supabase Dashboard → SQL Editor**:
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  xp integer default 0,
  level integer default 1,
  streak_current integer default 0,
  streak_longest integer default 0,
  streak_last_activity timestamptz,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TASKS TABLE
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  circle_id uuid references public.circles(id) on delete set null,
  title text not null,
  description text,
  due_date timestamptz,
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text default 'pending' check (status in ('pending', 'completed', 'deferred')),
  estimated_duration integer, -- minutes
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CIRCLES TABLE
create table public.circles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  emoji text default '👥',
  description text,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  privacy text default 'private' check (privacy in ('public', 'invite-only', 'private')),
  created_at timestamptz default now()
);

-- CIRCLE MEMBERS
create table public.circle_members (
  circle_id uuid references public.circles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now(),
  primary key (circle_id, user_id)
);

-- CHALLENGES TABLE
create table public.challenges (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  emoji text default '🏆',
  description text,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  circle_id uuid references public.circles(id) on delete set null,
  type text not null check (type in ('focus_time', 'tasks_completed', 'daily_checkin', 'custom')),
  goal_value integer not null,
  duration_days integer not null,
  starts_at timestamptz default now(),
  ends_at timestamptz not null,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

-- CHALLENGE PARTICIPANTS
create table public.challenge_participants (
  challenge_id uuid references public.challenges(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  progress integer default 0,
  joined_at timestamptz default now(),
  primary key (challenge_id, user_id)
);

-- FOCUS SESSIONS
create table public.focus_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete set null,
  duration_planned integer not null, -- minutes
  duration_actual integer, -- minutes
  started_at timestamptz default now(),
  ended_at timestamptz,
  xp_earned integer default 0
);

-- USER EVENTS (for AI learning)
create table public.user_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_type text not null,
  screen text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- USER MODEL (AI learning patterns)
create table public.user_models (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  peak_hours jsonb default '[]',
  completion_patterns jsonb default '{}',
  task_preferences jsonb default '{}',
  calculated_at timestamptz default now()
);

-- UNLOCKS (progressive features)
create table public.unlocks (
  user_id uuid references public.profiles(id) on delete cascade,
  feature text not null,
  unlocked_at timestamptz default now(),
  seen boolean default false,
  primary key (user_id, feature)
);

-- NOTIFICATIONS
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text,
  data jsonb default '{}',
  read boolean default false,
  created_at timestamptz default now()
);

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.user_events enable row level security;
alter table public.user_models enable row level security;
alter table public.unlocks enable row level security;
alter table public.notifications enable row level security;

-- RLS Policies (users can only access their own data)
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
  
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can view own tasks" on public.tasks
  for all using (auth.uid() = user_id);

create policy "Users can view circles they're in" on public.circles
  for select using (
    id in (select circle_id from public.circle_members where user_id = auth.uid())
    or owner_id = auth.uid()
  );

-- Add more RLS policies as needed...
```

---

### Step 0.5: Set Up Supabase Auth

**Goal**: Configure authentication providers.

**Agent**: Manual (Supabase Dashboard)

**Steps**:
```
1. Go to Authentication → Providers

2. Email (already enabled):
   - Enable email confirmations (optional for MVP)
   - Customize email templates

3. Apple:
   - Get Apple Developer credentials
   - Add Service ID, Team ID, Key ID, Private Key
   - Add redirect URL to Apple Developer

4. Google (optional):
   - Create Google Cloud project
   - Get OAuth credentials
   - Add to Supabase

5. Set redirect URLs:
   - For Expo: mypa://auth-callback
   - For Web (if any): https://yoursite.com/auth/callback
```

---

### Step 0.6: Create Auth Context with Supabase

**Goal**: Replace existing auth with Supabase auth.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Supabase auth context for React Native.

File: frontend/src/contexts/AuthContext.tsx

Requirements:
1. Use Supabase auth methods
2. Handle email/password sign up and login
3. Handle Apple Sign-In
4. Persist session automatically (Supabase does this)
5. Create profile in profiles table on sign up
6. Provide: user, session, loading, signIn, signUp, signOut, signInWithApple

Example structure:
const AuthContext = createContext<{
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}>(...);

Use @supabase/supabase-js and expo-apple-authentication.

On sign up, also insert into profiles table:
await supabase.from('profiles').insert({
  id: user.id,
  display_name: name,
  username: generateUsername(email)
});
```

---

### Step 0.7: Verify Supabase Connection

**Goal**: Test that everything works.

**Agent**: Manual

**Test in React Native**:
```typescript
// Test file or in App.tsx temporarily
import { supabase } from './src/lib/supabase';

// Test connection
const testConnection = async () => {
  const { data, error } = await supabase.from('profiles').select('count');
  console.log('Connection test:', data, error);
};

// Test auth
const testAuth = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'testpassword123'
  });
  console.log('Auth test:', data, error);
};
```

**Verify in Supabase Dashboard**:
- Check Authentication → Users
- Check Table Editor → profiles
- Check Logs for any errors

---

### Step 0.8: Create Feature Flag System

**Goal**: Allow gradual rollout and rollback.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create a simple feature flag system for migrating to new architecture.

File: frontend/src/config/featureFlags.ts

Flags needed:
- USE_GESTURE_NAV: boolean (default: false)
- USE_VOICE_SYSTEM: boolean (default: false)
- USE_AI_LEARNING: boolean (default: false)
- USE_NEW_AI_HOME: boolean (default: false)

File: frontend/src/hooks/useFeatureFlag.ts
- Hook to check flag status
- Can be controlled via:
  1. Local storage (for testing)
  2. Remote config (future)

This lets us test new features without breaking existing app.
```

---

### Step 0.9: Set Up New Directory Structure

**Goal**: Create folders for new architecture without breaking old.

**Agent**: Manual

**Note**: Some of these folders may already exist in your codebase. Only create what's missing.

```bash
cd frontend/src

# New navigation (gesture-based)
mkdir -p navigation-v2

# New screens (v2 = new gesture-based architecture)
mkdir -p screens-v2/AIHub
mkdir -p screens-v2/TasksView
mkdir -p screens-v2/SocialView
mkdir -p screens-v2/ProfileView
mkdir -p screens-v2/FocusModal
mkdir -p screens-v2/modals

# New components for Living Background
mkdir -p components/LivingBackground
mkdir -p components/VoiceFeedback

# Voice services
mkdir -p services/voice
```

---

# PHASE 1: SUPABASE EDGE FUNCTIONS & AI
## Week 1

> With Supabase, most CRUD operations are handled directly via the client.
> Edge Functions are only needed for: AI processing, voice commands, push notifications.

---

### Step 1.1: Set Up Supabase Edge Functions

**Goal**: Initialize Edge Functions for custom logic.

**Agent**: Manual + Cursor

**Commands**:
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize in project root
cd /Users/khalid/mypa-ios-latest
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Create functions directory
mkdir -p supabase/functions
```

**Project Structure**:
```
supabase/
├── config.toml
├── functions/
│   ├── ai-greeting/
│   │   └── index.ts
│   ├── voice-command/
│   │   └── index.ts
│   ├── send-push/
│   │   └── index.ts
│   └── calculate-unlocks/
│       └── index.ts
└── migrations/
    └── (auto-generated)
```

---

### Step 1.2: Create AI Greeting Edge Function

**Goal**: Generate personalized AI greetings with a warm, human-like personality (like ChatGPT 4o).

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Supabase Edge Function for AI greetings.

File: supabase/functions/ai-greeting/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// MYPA Personality System Prompt - ChatGPT 4o style, warm and human-like
const MYPA_PERSONALITY = `You are MYPA, an AI productivity companion with a warm, supportive personality.

PERSONALITY TRAITS:
- Warm and genuinely caring, like a supportive friend
- Conversational and natural, never robotic or formal
- Encouraging without being cheesy or over-the-top
- Uses natural speech patterns with contractions (I'm, you're, let's)
- Occasionally uses gentle humor when appropriate
- Celebrates wins, no matter how small
- Empathetic when user seems stressed or overwhelmed
- Direct and helpful, not verbose

SPEAKING STYLE:
- Keep responses conversational and natural
- Use the user's name occasionally but not every message
- Vary your greetings naturally (Hey!, Good morning!, What's up?)
- React to context (busy day? tough week? streak going strong?)
- Sound like a real person, not an assistant

EXAMPLES OF GOOD GREETINGS:
- "Morning, Sarah! 3 tasks on deck today - totally manageable. Let's do this!"
- "Hey! Noticed you've been crushing it lately - 5 day streak! What's on your mind?"
- "Hey there! Looks like a pretty light day - just 1 thing to knock out. Want to tackle it now?"
- "Good evening! Still 2 tasks hanging around from today. No pressure, but I'm here if you want to power through."

AVOID:
- Robotic phrases like "How may I assist you today?"
- Over-formal language
- Being overly peppy or fake-positive
- Long-winded responses
- Listing everything out formally`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get user profile and stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get today's tasks
    const today = new Date().toISOString().split('T')[0]
    const { count: taskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('due_date', today)
      .lt('due_date', today + 'T23:59:59')
      .eq('completed', false)
    
    // Get completed today
    const { count: completedToday } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('completed_at', today)
      .lt('completed_at', today + 'T23:59:59')

    // Determine time of day
    const hour = new Date().getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

    // Generate greeting with OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: MYPA_PERSONALITY
          },
          {
            role: 'user',
            content: `Generate a greeting for this context:
            
User name: ${profile?.display_name || 'there'}
Time: ${timeOfDay}
Tasks remaining today: ${taskCount || 0}
Tasks completed today: ${completedToday || 0}
Current streak: ${profile?.streak_current || 0} days

Keep it to 1-2 short sentences. Be warm and human.`
          }
        ],
        max_tokens: 100,
        temperature: 0.9,  // Higher temperature for more natural variation
      }),
    })

    const aiData = await openaiResponse.json()
    const greeting = aiData.choices[0].message.content

    return new Response(JSON.stringify({ 
      greeting, 
      taskCount, 
      completedToday,
      streak: profile?.streak_current 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

Deploy with: supabase functions deploy ai-greeting
```

---

### Step 1.3: Create Voice Command Edge Function

**Goal**: Process voice commands and execute actions.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Supabase Edge Function for voice command processing.

File: supabase/functions/voice-command/index.ts

The function should:
1. Receive voice transcript and context
2. Parse intent using GPT-4
3. Execute appropriate action
4. Return response for TTS

Input:
{
  transcript: "add task buy groceries tomorrow",
  context: {
    screen: "ai_home",
    currentTaskId?: string,
    focusActive?: boolean
  }
}

Output:
{
  success: true,
  message: "Got it! I've added 'buy groceries' for tomorrow.",  // Human, friendly tone
  action: {
    type: "create_task" | "complete_task" | "start_focus" | "navigate" | "query",
    payload: { ... }
  },
  shouldSpeak: true
}

IMPORTANT: Use the same MYPA_PERSONALITY system prompt from ai-greeting for consistent voice.
Responses should sound human and conversational, not robotic.

Good examples:
- "Done! I've added that to tomorrow's list."
- "Nice one - marked that complete! You're crushing it today."
- "Starting a 25 minute focus session. You've got this!"
- "Looks like you have 3 things left today. Want me to walk through them?"

Bad examples (avoid):
- "Task has been created successfully."
- "Your task has been marked as complete."
- "I have started a focus session for you."

Intent parsing with GPT-4:
- Parse natural language into structured intent
- Handle: add task, complete task, query tasks, start focus, check status, navigate
- Return friendly spoken response

For actions like create_task, actually create it in Supabase:
await supabase.from('tasks').insert({
  user_id: user.id,
  title: parsedTask.title,
  due_date: parsedTask.dueDate,
  priority: parsedTask.priority || 'medium'
})
```

---

### Step 1.4: Create Push Notification Edge Function

**Goal**: Send push notifications via Expo.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Supabase Edge Function for push notifications.

File: supabase/functions/send-push/index.ts

Input:
{
  userId: string,
  title: string,
  body: string,
  data?: object
}

Implementation:
1. Get user's push token from profiles table
2. Send via Expo Push API
3. Log notification in notifications table

const sendPushNotification = async (expoPushToken: string, message: object) => {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      ...message,
    }),
  });
};

Also add push_token column to profiles table if not exists.
```

---

### Step 1.5: Create Unlock Calculation Edge Function

**Goal**: Check and grant feature unlocks.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Supabase Edge Function to calculate unlocks.

File: supabase/functions/calculate-unlocks/index.ts

Called periodically or after key actions.

Unlock Thresholds (from Architecture Plan):
Day 3 (3+ days active):
- 'task_insights': 5+ tasks completed
- 'focus_stats': 3+ focus sessions

Day 7 (7+ days active):
- 'ai_sorting': automatic
- 'duration_estimates': 10+ focus sessions

Day 14:
- 'challenges': join/create a circle first
- 'circle_insights': in a circle

Day 30:
- 'custom_ai_voice': 30-day streak
- 'predictive_tasks': 100+ tasks completed

Logic:
1. Get user stats (tasks completed, focus sessions, streak, days active)
2. Check each unlock condition
3. Insert into unlocks table if newly unlocked
4. Return list of new unlocks (for celebration modal)

Response:
{
  newUnlocks: ['task_insights', 'focus_stats'],
  allUnlocks: ['task_insights', 'focus_stats', ...]
}
```

---

### Step 1.6: Set Up Edge Function Environment

**Goal**: Configure secrets for Edge Functions.

**Agent**: Manual (Supabase Dashboard)

**Steps**:
```
1. Go to Supabase Dashboard → Settings → Edge Functions

2. Add secrets:
   - OPENAI_API_KEY: sk-...
   - EXPO_ACCESS_TOKEN: (for push notifications, optional)

3. Or via CLI:
   supabase secrets set OPENAI_API_KEY=sk-xxx
   supabase secrets set EXPO_ACCESS_TOKEN=xxx

4. Deploy all functions:
   supabase functions deploy ai-greeting
   supabase functions deploy voice-command
   supabase functions deploy send-push
   supabase functions deploy calculate-unlocks
```

---

### Step 1.7: Create Supabase Hooks (Frontend)

**Goal**: React hooks for Supabase data fetching.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create React hooks for common Supabase operations.

File: frontend/src/hooks/supabase/useTasks.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const useTasks = (filter?: 'today' | 'tomorrow' | 'all') => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
    
    // Real-time subscription
    const subscription = supabase
      .channel('tasks')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks' 
      }, fetchTasks)
      .subscribe();

    return () => subscription.unsubscribe();
  }, [filter]);

  const fetchTasks = async () => { ... };
  const createTask = async (task) => { ... };
  const updateTask = async (id, updates) => { ... };
  const deleteTask = async (id) => { ... };

  return { tasks, loading, error, createTask, updateTask, deleteTask };
};

Create similar hooks for:
- useCircles.ts
- useChallenges.ts  
- useFocusSessions.ts
- useProfile.ts
- useUnlocks.ts
```

---

### Step 1.8: Create API Service Wrapper

**Goal**: Wrapper for Edge Function calls.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create service for calling Supabase Edge Functions.

File: frontend/src/services/api.ts

import { supabase } from '@/lib/supabase';

export const api = {
  // AI Greeting
  getGreeting: async () => {
    const { data, error } = await supabase.functions.invoke('ai-greeting');
    if (error) throw error;
    return data;
  },

  // Voice Command
  processVoiceCommand: async (transcript: string, context: object) => {
    const { data, error } = await supabase.functions.invoke('voice-command', {
      body: { transcript, context }
    });
    if (error) throw error;
    return data;
  },

  // Check Unlocks
  checkUnlocks: async () => {
    const { data, error } = await supabase.functions.invoke('calculate-unlocks');
    if (error) throw error;
    return data;
  },

  // Send Push (admin/system use)
  sendPush: async (userId: string, title: string, body: string) => {
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: { userId, title, body }
    });
    if (error) throw error;
    return data;
  },
};
```

---

### Step 1.9: Set Up Real-Time Subscriptions

**Goal**: Configure Supabase Realtime for live updates.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create real-time subscription hooks.

File: frontend/src/hooks/useRealtimeSubscription.ts

Enable real-time for:
1. Tasks (when circle members complete tasks)
2. Challenge progress (live leaderboard)
3. Circle activity feed
4. Notifications

Example for circle activity:
export const useCircleActivity = (circleId: string) => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Initial fetch
    fetchActivities();

    // Subscribe to new events
    const channel = supabase
      .channel(`circle:${circleId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_events',
        filter: `metadata->>circle_id=eq.${circleId}`
      }, (payload) => {
        setActivities(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => channel.unsubscribe();
  }, [circleId]);

  return activities;
};

Also enable Realtime in Supabase Dashboard:
Database → Replication → Enable for needed tables
```

---

### Step 1.10: Test Supabase Integration

**Goal**: Verify all Supabase features work.

**Agent**: Manual

**Test Checklist**:
```bash
# 1. Test auth
- Sign up with email ✓
- Sign in with email ✓
- Sign out ✓
- Session persists after app restart ✓

# 2. Test CRUD (via hooks)
- Create task ✓
- Read tasks ✓
- Update task ✓
- Delete task ✓

# 3. Test Edge Functions
curl -X POST 'https://xxx.supabase.co/functions/v1/ai-greeting' \
  -H 'Authorization: Bearer USER_JWT' \
  -H 'Content-Type: application/json'

# 4. Test Real-time
- Open app on two devices
- Create task on one
- Should appear on other instantly ✓

# 5. Test RLS
- Try to access another user's tasks (should fail) ✓
```

---

> ⚠️ **NOTE**: The following Steps 1.3-1.10 are for the **existing Express backend** in `backend/`.
> If you're using **Supabase Edge Functions** (recommended), you already created these in Steps 1.1-1.10 above.
> **Skip to Phase 2** unless you want to keep the Express backend as a fallback.

---

## OPTIONAL: Express Backend Enhancements (Legacy)

The following steps enhance the existing Express backend. Since you already have a working backend in `backend/`, you can either:
1. **Migrate to Supabase** (recommended) - Skip these steps
2. **Keep Express** - Follow these steps to add new features

### Step 1.11: Create Event Logging Service (Express)

**Goal**: Add event logging to existing Express backend.

**Agent**: Cursor (Claude Sonnet 4)

**Note**: Your backend already has most services working. This adds event tracking.

Functions:
1. logEvent(userId, type, screen, metadata) - creates event record
2. getEvents(userId, days) - gets events from last N days
3. getEventsByType(userId, type, days) - filtered by type
4. deleteOldEvents(days) - cleanup events older than N days

Event types to support:
- app_opened
- task_created, task_completed, task_deferred, task_deleted
- focus_started, focus_completed
- voice_command
- swipe_navigation
- challenge_joined, challenge_completed
- circle_viewed, circle_joined

Also create the route:
File: backend/src/routes/events.routes.ts

POST /api/events - log event (batch support)
GET /api/events - get user's events (admin/debug only)
```

---

### Step 1.3: Create AI Voice Command Route

**Goal**: Backend endpoint for processing voice commands.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create the AI voice command processing endpoint.

File: backend/src/routes/ai.routes.ts (add to existing or create)

POST /api/ai/voice-command
- Receives: { command: string }
- Returns: { message: string, action?: object, navigation?: string }

Flow:
1. Parse intent from command (create intentParser helper)
2. Execute action if needed (task CRUD, focus, etc.)
3. Generate AI response using OpenAI
4. Return response

For now, implement:
- Add task: "add task buy groceries" → creates task
- Complete task: "mark X as done" → completes task
- Query tasks: "what do I have today" → lists tasks
- Status: "how am I doing" → returns stats
- Fallback: anything else → conversational AI response

Also create:
- backend/src/services/ai/intentParser.ts
- backend/src/services/ai/actionExecutor.ts
- backend/src/services/ai/responseGenerator.ts

Use the existing OpenAI integration you have.
```

---

### Step 1.4: Create Contextual Greeting Endpoint

**Goal**: API for personalized AI greetings.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create an endpoint for AI Home screen greetings.

File: backend/src/routes/ai.routes.ts (add)

GET /api/ai/greeting
- Returns personalized greeting based on:
  - Time of day
  - User's name
  - Today's task count
  - Streak status
  - Active challenges
  - Unlocked insights (if any)

Greeting logic:
- Morning (5am-12pm): "Good morning, [name]!"
- Afternoon (12pm-5pm): "Good afternoon, [name]!"
- Evening (5pm-9pm): "Good evening, [name]!"
- Night (9pm-5am): "Hey [name], burning the midnight oil?"

Add context:
- "[X] tasks today" or "All clear today!"
- "Day [X] of your streak!" or "Let's start fresh!"
- If challenge active: "You're [position] in [challenge]"

Keep it SHORT - this is spoken aloud.
```

---

### Step 1.5: Create Unlock Endpoints

**Goal**: API for progressive unlock system.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create endpoints for the unlock system.

File: backend/src/routes/unlock.routes.ts

GET /api/unlocks
- Returns all unlock statuses for user:
  {
    unlocks: [
      {
        feature: 'peak_hours',
        status: 'locked' | 'unlocked',
        unlockedAt: Date | null,
        seenByUser: boolean,
        progress: { current: number, required: number, description: string }
      }
    ]
  }

GET /api/unlocks/pending
- Returns unlocks that are earned but not seen (for celebration modal)

POST /api/unlocks/:feature/seen
- Marks an unlock as seen after user dismisses celebration

Unlock definitions (hardcode for now):
- Day 3: personalized_greeting
- Day 7: peak_hours (needs 10+ task completions)
- Day 7: ai_task_sorting
- Day 14: duration_estimation (needs 10+ focus sessions)
- Day 14: completion_patterns (needs 30+ tasks created)
- Day 30: predictive_mode (needs 50+ tasks)
- Day 30: overwhelm_detection

Create helper: backend/src/services/unlock.service.ts
```

---

### Step 1.6: Create Learning Batch Job

**Goal**: Nightly job to calculate user patterns.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create a batch job that calculates user patterns from event data.

File: backend/src/services/learning/batchJob.ts

Function: runNightlyUpdate()
- Gets all users
- For each user with events:
  1. Calculate patterns from last 30 days of events
  2. Update or create UserModel record
  3. Check for new unlocks earned
  4. Create UserUnlock records if earned

Pattern calculations:
File: backend/src/services/learning/patternCalculator.ts

- calculatePeakHours(events): number[] - hours with most completions
- calculateBestDay(events): number - day of week with best completion rate
- calculateCompletionRates(events): object - rate by priority
- calculateAvgDuration(events): number - average focus session minutes
- detectOverwhelmThreshold(events): number - task count where completion drops
- extractCommonCategories(events): string[] - most used categories

Set up cron job in backend/src/index.ts:
- Use node-cron
- Run at 3:00 AM daily

Also create manual trigger endpoint (for testing):
POST /api/admin/run-learning-job (admin only)
```

---

### Step 1.7: Update Existing Routes for Events

**Goal**: Add event logging to existing task/focus routes.

**Agent**: Cursor (Claude)

**Prompt**:
```
Update existing routes to log events for the learning system.

Files to update:
- backend/src/routes/tasks.routes.ts
- backend/src/routes/focus.routes.ts
- backend/src/routes/challenges.routes.ts
- backend/src/routes/circles.routes.ts

Add event logging:

Tasks:
- POST /tasks → log 'task_created'
- PUT /tasks/:id (complete) → log 'task_completed'
- PUT /tasks/:id (defer) → log 'task_deferred'
- DELETE /tasks/:id → log 'task_deleted'

Focus:
- POST /focus/start → log 'focus_started'
- POST /focus/end → log 'focus_completed' with duration

Challenges:
- POST /challenges/:id/join → log 'challenge_joined'

Use the eventService.logEvent() function.
Event logging should NEVER block the main response - fire and forget.
```

---

### Step 1.8: Add Rate Limiting & Security

**Goal**: Production-ready security.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add rate limiting and security hardening to the backend.

Install dependencies:
npm install express-rate-limit helmet express-slow-down

File: backend/src/middleware/security.ts

Add:
1. Rate limiting:
   - General: 100 requests per 15 minutes per IP
   - Auth routes: 5 requests per 15 minutes per IP
   - AI routes: 20 requests per minute per user

2. Helmet middleware for security headers

3. Request size limiting (1MB max)

Update backend/src/app.ts to use these middlewares.

Also add:
- CORS configuration for production domain
- Trust proxy setting for deployment behind load balancer
```

---

### Step 1.9: Add Health Check & Monitoring

**Goal**: Endpoints for deployment monitoring.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add health check and monitoring endpoints.

File: backend/src/routes/health.routes.ts

GET /health
- Returns: { status: 'ok', timestamp: Date }
- No auth required
- Used by load balancers

GET /health/detailed (admin only)
- Returns:
  {
    status: 'ok',
    database: 'connected' | 'error',
    uptime: seconds,
    memory: { used, total },
    version: 'from package.json'
  }

File: backend/src/utils/logger.ts
- Create structured logger using winston or pino
- Log levels: error, warn, info, debug
```

---

### Step 1.10: Test Backend Enhancements

**Goal**: Verify all new backend features work.

**Agent**: Cursor (Claude) + Manual

**Test with curl or Postman**:
```bash
# Event Logging
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"task_created","screen":"tasks","metadata":{}}'

# Voice Command
curl -X POST http://localhost:3000/api/ai/voice-command \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"add task buy groceries"}'

# Greeting
curl http://localhost:3000/api/ai/greeting \
  -H "Authorization: Bearer YOUR_TOKEN"

# Unlocks
curl http://localhost:3000/api/unlocks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Health
curl http://localhost:3000/health
```

---

# PHASE 2: DATA MIGRATION & AUTH VERIFICATION
## Days 3-4 of Week 2

> If starting fresh, skip Step 2.1. If migrating from existing backend, follow all steps.

---

### Step 2.1: Migrate Existing Data to Supabase (If Applicable)

**Goal**: Move data from old backend to Supabase.

**Agent**: Manual + Script

**Script to migrate data**:
```javascript
// scripts/migrate-to-supabase.js
// Run this locally, NOT in production

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for migration
);

async function migrateUsers() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Create auth user in Supabase
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'TEMP_PASSWORD_' + Math.random(), // User will need to reset
      email_confirm: true
    });
    
    if (authError) {
      console.error('Auth error:', user.email, authError);
      continue;
    }

    // Create profile
    await supabase.from('profiles').insert({
      id: authUser.user.id,
      username: user.username,
      display_name: user.displayName,
      xp: user.xp || 0,
      level: user.level || 1,
      streak_current: user.currentStreak || 0,
      // Map other fields...
    });

    // Store mapping for task migration
    userMap[user.id] = authUser.user.id;
  }
}

async function migrateTasks() {
  const tasks = await prisma.task.findMany();
  
  const supabaseTasks = tasks.map(task => ({
    user_id: userMap[task.userId], // Use mapped Supabase user ID
    title: task.title,
    description: task.description,
    due_date: task.dueDate,
    priority: task.priority?.toLowerCase() || 'medium',
    status: task.completed ? 'completed' : 'pending',
    completed_at: task.completedAt,
    created_at: task.createdAt
  }));

  await supabase.from('tasks').insert(supabaseTasks);
}

// Run migrations
migrateUsers().then(migrateTasks).then(() => console.log('Done!'));
```

**Note**: After migration, send password reset emails to all users.

---

### Step 2.2: Verify Supabase Auth Flow

**Goal**: Ensure authentication works end-to-end.

**Agent**: Manual Testing

**Test Checklist**:
```
EMAIL AUTH:
[ ] Sign up creates user in auth.users
[ ] Sign up creates profile in profiles
[ ] Sign in returns valid session
[ ] Session persists after app restart
[ ] Sign out clears session
[ ] Password reset email works

APPLE SIGN-IN:
[ ] Button appears on login screen
[ ] Apple auth flow completes
[ ] User created/linked correctly
[ ] Session works same as email

SESSION HANDLING:
[ ] Token auto-refreshes before expiry
[ ] Expired token triggers re-auth
[ ] Multiple devices work independently
```

---

### Step 2.3: Update Login/Signup Screens for NativeWind

**Goal**: Update auth screens with Tailwind styling.

**Agent**: Cursor (Claude)

**Prompt**:
```
Update the login and signup screens to use NativeWind (Tailwind).

File: frontend/src/screens/Auth/LoginScreen.tsx

Convert from StyleSheet to className props.

Example conversion:
// OLD
<View style={styles.container}>
  <Text style={styles.title}>Welcome to MYPA</Text>
</View>

// NEW with NativeWind
<View className="flex-1 bg-mypa-bg px-6 pt-20">
  <Text className="text-3xl font-bold text-mypa-text text-center">
    Welcome to MYPA
  </Text>
</View>

Design:
- Background: bg-mypa-bg (#000000)
- Input fields: bg-mypa-card border border-mypa-border rounded-xl px-4 py-3
- Primary button: bg-mypa-purple rounded-xl py-4
- Text: text-mypa-text for primary, text-mypa-text-secondary for hints
- Apple Sign-In: Use Apple's required button style

Update both LoginScreen.tsx and SignUpScreen.tsx.
```

---

### Step 2.4: Add Row Level Security Policies

**Goal**: Ensure users can only access their own data.

**Agent**: Supabase SQL Editor

**SQL**:
```sql
-- Complete RLS policies for all tables

-- PROFILES
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- TASKS
create policy "Users can CRUD own tasks"
  on public.tasks for all
  using (auth.uid() = user_id);

-- Also allow viewing circle tasks
create policy "Users can view circle tasks"
  on public.tasks for select
  using (
    circle_id in (
      select circle_id from public.circle_members 
      where user_id = auth.uid()
    )
  );

-- CIRCLES
create policy "Anyone can view public circles"
  on public.circles for select
  using (privacy = 'public' or owner_id = auth.uid() or id in (
    select circle_id from public.circle_members where user_id = auth.uid()
  ));

create policy "Owners can update circles"
  on public.circles for update
  using (owner_id = auth.uid());

create policy "Auth users can create circles"
  on public.circles for insert
  with check (auth.uid() = owner_id);

-- CIRCLE MEMBERS
create policy "Members can view circle members"
  on public.circle_members for select
  using (circle_id in (
    select circle_id from public.circle_members where user_id = auth.uid()
  ));

-- CHALLENGES
create policy "Users can view challenges they're in"
  on public.challenges for select
  using (
    creator_id = auth.uid() or
    id in (select challenge_id from public.challenge_participants where user_id = auth.uid())
  );

-- FOCUS SESSIONS
create policy "Users can CRUD own sessions"
  on public.focus_sessions for all
  using (auth.uid() = user_id);

-- USER EVENTS (private, only own)
create policy "Users can insert own events"
  on public.user_events for insert
  with check (auth.uid() = user_id);

create policy "Users can view own events"
  on public.user_events for select
  using (auth.uid() = user_id);

-- UNLOCKS
create policy "Users can view own unlocks"
  on public.unlocks for select
  using (auth.uid() = user_id);

-- NOTIFICATIONS
create policy "Users can CRUD own notifications"
  on public.notifications for all
  using (auth.uid() = user_id);
```

---

### Step 2.5: Create Database Triggers

**Goal**: Automate common operations.

**Agent**: Supabase SQL Editor

**SQL**:
```sql
-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    lower(split_part(new.email, '@', 1)) || '_' || substr(new.id::text, 1, 4)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update streak on task completion
create or replace function public.update_streak_on_task()
returns trigger as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    update public.profiles
    set 
      streak_last_activity = now(),
      streak_current = case 
        when streak_last_activity::date = current_date - interval '1 day' 
        then streak_current + 1
        when streak_last_activity::date = current_date 
        then streak_current
        else 1
      end,
      streak_longest = greatest(streak_longest, streak_current + 1)
    where id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_task_completed
  after update on public.tasks
  for each row execute procedure public.update_streak_on_task();

-- Add XP on focus session complete
create or replace function public.add_xp_on_focus()
returns trigger as $$
begin
  if new.ended_at is not null and old.ended_at is null then
    update public.profiles
    set xp = xp + new.xp_earned
    where id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_focus_completed
  after update on public.focus_sessions
  for each row execute procedure public.add_xp_on_focus();
```

---

# PHASE 3: BUILD NEW NAVIGATION & CORE SCREENS
## Week 2-3

> **Reference**: See MYPA_ARCHITECTURE_PLAN.md Section 4 "Navigation & Gestures"
> **Existing Code**: You have `Hub/index.tsx` (800 lines), `Tasks/index.tsx`, `Circle/`, `Profile/` - use these as data/logic reference

---

### Step 3.1: Create Gesture Navigator Shell

**Goal**: Build the central gesture-based navigation system.

**Agent**: Cursor Composer (multi-file) or Claude Opus 4.5

**Why This Agent**: Creates multiple files with consistent architecture, understands complex navigation patterns.

**Existing Code Reference**:
- `frontend/App.tsx` - Current tab navigation structure
- `frontend/src/screens/Hub/hooks/useHubData.ts` - Data fetching patterns

**Prompt**:
```
Create a gesture-based navigation system for MYPA that replaces the tab bar.

ARCHITECTURE (from MYPA_ARCHITECTURE_PLAN.md):
- AI Hub is CENTER (default screen)
- Tasks View is LEFT (swipe left from Hub)
- Social View is RIGHT (swipe right from Hub)
- Profile View is DOWN (swipe down from Hub)
- Focus Modal is UP (swipe up from Hub - opens as modal)

FILE STRUCTURE to create:
frontend/src/navigation-v2/
├── GestureNavigator.tsx      # Main navigator component
├── GestureContext.tsx        # Shared state for current screen
├── useGestureNavigation.ts   # Hook for navigation actions
├── SwipeIndicator.tsx        # Visual hints at screen edges
└── index.ts                  # Exports

TECHNICAL REQUIREMENTS:
1. Use react-native-gesture-handler Gesture.Pan()
2. Use react-native-reanimated for 60fps animations
3. All 4 screens are ALWAYS rendered (hidden off-screen for instant reveal)
4. Swipe threshold: 100px horizontal, 80px vertical
5. Add haptic feedback on swipe complete: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
6. Spring animation config: { damping: 20, stiffness: 200 }
7. Show SwipeIndicator at edges (subtle animated arrows)
8. GestureContext provides: currentScreen, navigateTo(screen), canSwipe

IMPORTANT: 
- Do NOT break existing navigation yet
- This lives in navigation-v2/ alongside current nav
- We'll swap it in later with a feature flag

REFERENCE existing gesture patterns from:
- react-native-gesture-handler documentation
- MYPA Hub's existing gesture handlers (if any)
```

**Expected Output**: 5 new files in `navigation-v2/` folder

**Verification**:
```bash
# Check files created
ls -la frontend/src/navigation-v2/

# Test import (no runtime yet)
# Add to App.tsx temporarily:
# import { GestureNavigator } from './src/navigation-v2';
```

---

### Step 3.2: Build AI Hub Screen (Living Interface)

**Goal**: Create the AI Hub - the heart of MYPA with the Living Background.

**Agent**: Cursor Composer (multi-file) or Claude Opus 4.5

**Why This Agent**: Complex component with Skia shaders, animations, and multiple sub-components.

**Existing Code Reference**:
- `frontend/src/screens/Hub/index.tsx` - Current hub with data fetching, briefing, tasks
- `frontend/src/screens/Hub/hooks/useHubData.ts` - Data hooks to REUSE
- `frontend/src/screens/Hub/components/` - UI components to reference

**Prompt**:
```
Create the new AI Hub screen with the Living Background (replaces orb concept).

CONCEPT (from MYPA_DESIGN_SPECIFICATION.md Section 0):
The ENTIRE screen IS the AI - you're stepping INTO MYPA's presence.
The background is a living, breathing entity that responds to voice.

FILE STRUCTURE:
frontend/src/screens-v2/AIHub/
├── index.tsx                 # Main screen
├── LivingBackground/
│   ├── index.tsx             # Canvas wrapper
│   ├── GradientMesh.tsx      # Skia shader for flowing background
│   ├── ParticleField.tsx     # Floating particles
│   ├── CenterGlow.tsx        # Soft focal point (not orb!)
│   └── VoiceWaveform.tsx     # Appears during listening
├── FloatingUI/
│   ├── Greeting.tsx          # "Good morning, Khalid"
│   ├── ContextCards.tsx      # Today's tasks, streak, challenge
│   └── VoiceFeedback.tsx     # Transcript, response text
├── hooks/
│   └── useAIHub.ts           # Combines existing hooks
└── styles.ts

TECHNICAL:
1. Living Background uses @shopify/react-native-skia
2. Gradient mesh shader (see Design Spec Section 6.1 for shader code)
3. 60-100 particles, subtle drift in idle, gather on listening
4. Center glow is SOFT (radial gradient, no hard edges)
5. Tap anywhere activates voice (not just an orb)

REUSE EXISTING:
- Import useHubData() from '../Hub/hooks/useHubData' for task counts
- Import useBriefing() from '../Hub/hooks/useBriefing' for AI greeting
- Import useAuth() for user name

STATES:
1. IDLE: Gradient breathes slowly, particles drift, glow at 40% opacity
2. LISTENING: Gradient responds to voice volume, particles gather, glow brightens
3. PROCESSING: Gradient swirls, particles spiral, glow pulses
4. SPEAKING: Gradient pulses with speech rhythm, particles radiate, glow expands

FLOATING UI (glassmorphic):
- Greeting: Top, large text, date below
- Context Cards: Bottom third, horizontal scroll
- Voice Feedback: Middle, appears during active voice

IMPORTANT:
- Background is FULL SCREEN (no safe areas, no header)
- UI floats ON TOP with SafeAreaView for just the text
```

**Expected Output**: 10+ files in `screens-v2/AIHub/`

**Verification**:
```tsx
// Temporarily add to App.tsx to test:
import { AIHubScreen } from './src/screens-v2/AIHub';

// In your navigator (or standalone test):
<AIHubScreen voiceState="idle" audioLevel={0} />
```

---

### Step 3.3: Build Tasks View Screen

**Goal**: Create Tasks View - swipe LEFT from AI Hub.

**Agent**: Cursor (Claude Sonnet 4)

**Why This Agent**: Adapting existing code, focused single-screen work.

**Existing Code Reference**:
- `frontend/src/screens/Tasks/index.tsx` - FULL task list implementation
- `frontend/src/screens/Plan/index.tsx` - Planning view with scheduling
- `frontend/src/screens/Hub/components/` - Task card components
- `frontend/src/services/api.ts` → tasksApi - All task API calls

**Prompt**:
```
Create Tasks View for the gesture-based navigation.

This screen appears when user swipes LEFT from AI Hub.

FILE: frontend/src/screens-v2/TasksView/index.tsx

REUSE HEAVILY from existing:
- frontend/src/screens/Tasks/index.tsx has working task list, filters, completion
- frontend/src/screens/Tasks/hooks/ has task data fetching
- frontend/src/screens/Tasks/components/ has task cards, modals

LAYOUT (from MYPA_ARCHITECTURE_PLAN.md):
1. Header: "Tasks" title + floating voice button (top right) + Add button
2. Filter tabs: Today | Tomorrow | All | By Priority  
3. Task list grouped by: TODAY, TOMORROW, THIS WEEK, LATER
4. Each task: checkbox, title, duration badge, priority indicator
5. Completed section (collapsed by default, tap to expand)

NEW INTERACTIONS:
- Tap task → Task Detail Modal (pass task id)
- Swipe task left → Complete with animation
- Swipe task right → Defer to tomorrow
- Long press → Context menu (edit, delete, assign to circle)
- Tap + → Quick Add overlay
- Tap voice button → Voice mode with "I'm on the tasks screen" context

STYLING (NativeWind):
- Background: bg-black
- Cards: bg-zinc-900 border border-zinc-800 rounded-2xl
- Accent: purple-500
- Use existing card styling from Tasks/components as reference

DO NOT rebuild task logic - import and adapt existing hooks:
import { useTasks } from '../../screens/Tasks/hooks/useTasks';
import { tasksApi } from '../../services/api';
```

**Expected Output**: `screens-v2/TasksView/index.tsx` (200-400 lines)

**Verification**:
```tsx
// Add to GestureNavigator LEFT position
<TasksViewScreen />

// Test:
// 1. Tasks load correctly
// 2. Filters work
// 3. Completion works with XP
// 4. Swipe gestures work (left=complete, right=defer)
```

---

### Step 3.4: Build Social View Screen

**Goal**: Create Social View - swipe RIGHT from AI Hub.

**Agent**: Cursor (Claude Sonnet 4)

**Existing Code Reference**:
- `frontend/src/screens/Circle/Circles/index.tsx` - Circle list
- `frontend/src/screens/Circle/CircleHome/index.tsx` - Circle details
- `frontend/src/screens/Challenges/index.tsx` - Challenge list (599 lines)
- `frontend/src/services/api.ts` → circlesApi, challengesApi

**Prompt**:
```
Create Social View for the gesture-based navigation.

This screen appears when user swipes RIGHT from AI Hub.

FILE: frontend/src/screens-v2/SocialView/index.tsx

REUSE from existing:
- frontend/src/screens/Circle/Circles/index.tsx - Circle list rendering
- frontend/src/screens/Challenges/index.tsx - Challenge cards & logic
- All API calls from api.ts (circlesApi, challengesApi)

LAYOUT (from MYPA_ARCHITECTURE_PLAN.md):
1. Header: "Social" title + floating voice button + Add button
2. AI Summary card: "Your Work circle is active today. Family has been quiet."
3. ACTIVE CHALLENGES section:
   - Horizontal scroll of challenge cards
   - Each: name, progress bar, your position, time remaining
4. YOUR CIRCLES section:
   - Vertical list of circle cards  
   - Each: emoji, name, member count, "X online now"
5. RECENT ACTIVITY section:
   - Feed: "Sarah completed 'Morning workout'" with timestamp
   - Last 5-10 activities

INTERACTIONS:
- Tap challenge → Challenge Detail Modal
- Tap circle → Circle Home Modal
- Tap + → Bottom sheet with "Create Circle" and "Start Challenge"
- Tap voice button → Voice mode with social context

IMPORT EXISTING:
import { circlesApi, challengesApi } from '../../services/api';
// Reuse circle/challenge card components or create simplified versions

STYLING: Same dark theme with NativeWind
```

**Expected Output**: `screens-v2/SocialView/index.tsx` (300-500 lines)

---

### Step 3.5: Build Profile View Screen

**Goal**: Create Profile View - swipe DOWN from AI Hub.

**Agent**: Cursor (Claude Sonnet 4)

**Existing Code Reference**:
- `frontend/src/screens/Profile/index.tsx` - Current profile screen
- `frontend/src/screens/Level/index.tsx` - XP and level display
- `frontend/src/screens/Streak/index.tsx` - Streak display
- `frontend/src/screens/Analytics/index.tsx` - Stats and insights
- `frontend/src/contexts/AuthContext.tsx` - User data

**Prompt**:
```
Create Profile View for the gesture-based navigation.

This screen appears when user swipes DOWN from AI Hub.

FILE: frontend/src/screens-v2/ProfileView/index.tsx

REUSE from existing:
- frontend/src/screens/Profile/index.tsx - Profile display, settings link
- frontend/src/screens/Level/index.tsx - XP progress, level badge
- frontend/src/screens/Streak/index.tsx - Streak visualization
- AuthContext.tsx - user.xp, user.level, user.currentStreak, etc.

LAYOUT (from MYPA_ARCHITECTURE_PLAN.md):
1. Swipe indicator at top (swipe up to return to Hub)
2. Profile Header: Avatar, name, @username, level badge with XP progress
3. AI INSIGHT card: "You've been 23% more productive this week!"
4. Stats Grid (2x2):
   - Total XP (with level)
   - Tasks Completed (all time)
   - Focus Minutes (all time)
   - Current Streak (with flame icon)
5. UNLOCKED FEATURES section:
   - Cards for each AI learning unlock
   - Locked ones show progress to unlock
6. Footer: Settings button, Help, Logout

DATA from user object (AuthContext):
const { user } = useAuth();
// user.xp, user.level, user.tasksCompleted, user.focusMinutes
// user.currentStreak, user.longestStreak

INTERACTIONS:
- Tap stat → Show detailed breakdown (modal)
- Tap locked feature → Unlock Details Modal (show progress)
- Tap Settings → Settings Modal
- Tap Logout → Confirm → Clear auth → Login screen

STYLING: Dark theme, glassmorphic cards, purple accents
```

**Expected Output**: `screens-v2/ProfileView/index.tsx` (300-500 lines)

---

### Step 3.6: Build Focus Modal

**Goal**: Create Focus Session modal - swipe UP from AI Hub.

**Agent**: Cursor (Claude Sonnet 4)

**Existing Code Reference**:
- `frontend/src/services/api.ts` → focusApi - Start, pause, complete sessions
- `frontend/src/screens/Hub/hooks/` - May have focus state
- `backend/src/services/focus.service.ts` - Backend logic (361 lines)

**Prompt**:
```
Create Focus Session modal for swipe-up gesture.

This opens as a MODAL overlay when user swipes UP from AI Hub.

FILE: frontend/src/screens-v2/FocusModal/index.tsx

This is a FOCUS MODE - minimal distractions, full screen timer.

LAYOUT:
1. Full screen dark background with subtle gradient
2. Current task name at top (if linked to a task)
3. Large timer display (MM:SS) in center
4. Animated progress ring around timer
5. Small voice button below timer
6. Control buttons: Pause/Resume, End Session
7. "Swipe down to minimize" hint

STATES:
- SELECTING: Pick duration (15, 25, 45, 60 min or custom)
- ACTIVE: Timer counting, progress ring filling
- PAUSED: Timer paused, dimmed UI
- COMPLETED: Celebration! XP earned, streak updated

VOICE COMMANDS (context: 'focus'):
- "How much time left?" → Speak remaining
- "Add 10 minutes" → Extend timer
- "I'm done" → End session
- "Pause" / "Resume"

USE EXISTING:
import { focusApi } from '../../services/api';

focusApi.startSession({ taskId?, durationMinutes })
focusApi.pauseSession(sessionId)
focusApi.resumeSession(sessionId)
focusApi.completeSession(sessionId)

ANIMATIONS:
- Timer ring fills as progress
- Pulse animation when paused
- Confetti/celebration on complete
- XP popup on complete

IMPORTANT: This should feel IMMERSIVE and FOCUSED
- No notifications shown
- Minimal UI
- Background could have subtle breathing animation
```

**Expected Output**: `screens-v2/FocusModal/index.tsx` (400-600 lines)

---

### Step 3.7: Create Swipe Indicators

**Goal**: Visual hints showing users they can swipe.

**Agent**: Cursor (Claude Sonnet 4) or Copilot (simpler task)

**Prompt**:
```
Create subtle swipe indicators for gesture navigation.

FILE: frontend/src/navigation-v2/SwipeIndicator.tsx

These appear at screen edges to hint that swiping is possible.

PROPS:
interface SwipeIndicatorProps {
  direction: 'left' | 'right' | 'up' | 'down';
  label?: string;  // e.g., "Tasks", "Social"
  visible: boolean;
}

APPEARANCE:
- Subtle animated chevron/arrow
- Label text in small font
- 30% opacity, increases on near-swipe
- Position at edge of screen

ANIMATIONS (react-native-reanimated):
- Gentle bounce animation (moves 5px in/out)
- Opacity pulse
- Fade in/out for visible prop

POSITIONS:
- left: middle-left edge, arrow points left, label "Tasks"
- right: middle-right edge, arrow points right, label "Social"  
- down: top-center (for Profile from Hub)
- up: bottom-center (for Focus from Hub)

For AI Hub, show all 4 indicators when idle.
Other screens only show the "back" indicator.
```

**Expected Output**: `navigation-v2/SwipeIndicator.tsx` (80-150 lines)

---

### Step 3.8: Integrate Gesture Navigator

**Goal**: Wire everything together and add feature flag.

**Agent**: Cursor (Claude Sonnet 4)

**Prompt**:
```
Integrate the gesture navigator into the app with a feature flag.

STEP 1: Create feature flag
File: frontend/src/config/featureFlags.ts

export const FEATURE_FLAGS = {
  USE_GESTURE_NAV: true,  // Set to false to use old tab nav
};

STEP 2: Update App.tsx
File: frontend/App.tsx

import { FEATURE_FLAGS } from './src/config/featureFlags';
import { GestureNavigator } from './src/navigation-v2';
// ... existing imports

function AppContent() {
  if (FEATURE_FLAGS.USE_GESTURE_NAV) {
    return <GestureNavigator />;
  }
  return <ExistingTabNavigator />;  // Keep old nav as fallback
}

STEP 3: Connect screens to GestureNavigator
File: frontend/src/navigation-v2/GestureNavigator.tsx (update)

import { AIHubScreen } from '../screens-v2/AIHub';
import { TasksViewScreen } from '../screens-v2/TasksView';
import { SocialViewScreen } from '../screens-v2/SocialView';
import { ProfileViewScreen } from '../screens-v2/ProfileView';
import { FocusModal } from '../screens-v2/FocusModal';

// In the navigator:
<Screen position="center"><AIHubScreen /></Screen>
<Screen position="left"><TasksViewScreen /></Screen>
<Screen position="right"><SocialViewScreen /></Screen>
<Screen position="down"><ProfileViewScreen /></Screen>
<Modal trigger="swipe-up"><FocusModal /></Modal>

STEP 4: Test toggle
- Set USE_GESTURE_NAV = true → New gesture nav
- Set USE_GESTURE_NAV = false → Old tab nav
- Both should work without breaking
```

**Expected Output**: Updated `featureFlags.ts`, `App.tsx`, `GestureNavigator.tsx`

---

### Step 3.9: Test Gesture Navigation

**Goal**: Verify all navigation works correctly.

**Agent**: Manual Testing

**Checklist**:
```
BASIC NAVIGATION:
[ ] App opens to AI Hub (center)
[ ] Swipe left → Tasks View slides in
[ ] Swipe right from Tasks → Returns to Hub
[ ] Swipe right from Hub → Social View slides in
[ ] Swipe left from Social → Returns to Hub
[ ] Swipe down from Hub → Profile slides in (from top)
[ ] Swipe up from Profile → Returns to Hub
[ ] Swipe up from Hub → Focus Modal opens

ANIMATIONS:
[ ] All transitions are smooth (60fps)
[ ] Spring physics feel natural (not too bouncy, not too stiff)
[ ] Partial swipes snap back correctly
[ ] Swipe indicators animate properly

HAPTICS:
[ ] Haptic feedback on successful swipe
[ ] No haptic on cancelled swipe

DATA LOADING:
[ ] Tasks View shows correct task count
[ ] Social View shows circles and challenges
[ ] Profile View shows user stats
[ ] Focus Modal can start a session

FEATURE FLAG:
[ ] Toggle to old nav works
[ ] No crashes either way

EDGE CASES:
[ ] Rapid swipes don't break state
[ ] Swipe during loading works
[ ] Swipe while modal open is blocked
```

---

# PHASE 4: ALL MODALS
## Week 4

> **Reference**: See MYPA_ARCHITECTURE_PLAN.md Section 12 "Complete Modal Workflows"
> **Existing Code**: Your `frontend/src/screens/` has many screens that can be adapted to modals

---

### Step 4.1: Create Modal Stack Navigator

**Goal**: Set up the modal presentation layer.

**Agent**: Cursor (Claude Sonnet 4)

**Prompt**:
```
Create the modal stack that overlays the gesture navigator.

File: frontend/src/navigation-v2/ModalStack.tsx

Modals to register (from Architecture Plan):
1. FocusModal - slides up (already created in Phase 3)
2. TaskDetailModal - slide up from bottom
3. CircleHomeModal - slide from right
4. ChallengeDetailModal - slide from right
5. SettingsModal - slide from right
6. QuickAddTaskOverlay - fade in from bottom
7. CreateCircleSheet - bottom sheet (half screen)
8. CreateChallengeSheet - bottom sheet (half screen)
9. JoinCircleModal
10. UnlockDetailsModal
11. NotificationsModal

Configuration:
- presentation: 'modal' for full modals
- presentation: 'transparentModal' for overlays/sheets
- animation: 'slide_from_bottom' for most
- gestureEnabled: true (swipe to dismiss)

Export function to open any modal by name with params.
```

---

### Step 4.2: Build Task Detail Modal

**Goal**: Full task view with all actions.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Task Detail Modal - opened when tapping a task.

File: frontend/src/screens-v2/modals/TaskDetailModal.tsx

REFERENCE: MYPA_ARCHITECTURE_PLAN.md Section 12.1

Entry Points:
- Tap task from Tasks View
- Voice: "Show task [name]"
- Tap task from AI Home context card

Layout:
1. Header: Task title (editable), close X
2. Status toggle: checkbox (large)
3. Details section:
   - Description (editable)
   - Due date/time (date picker)
   - Duration estimate (picker)
   - Priority (Low/Medium/High/Urgent)
   - Labels/tags
4. Circle assignment section (if in a circle)
5. Action buttons:
   - "Start Focus" → Opens Focus Modal with this task
   - "Defer" → Quick reschedule options
   - "Delete" → Confirm then delete
6. History: "Created [date]", "Completed [date]"

Exit:
- Tap X → Returns to Tasks View
- Swipe down → Returns to Tasks View
- Complete task → Animation + return
- Start Focus → Navigate to Focus Modal

API calls:
- GET /api/tasks/:id (load details)
- PUT /api/tasks/:id (update)
- DELETE /api/tasks/:id (delete)
```

---

### Step 4.3: Build Circle Home Modal

**Goal**: Full circle view with members, tasks, activity.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Circle Home Modal - opened when tapping a circle.

File: frontend/src/screens-v2/modals/CircleHomeModal.tsx

REFERENCE: MYPA_ARCHITECTURE_PLAN.md Section 12.2

Entry Points:
- Tap circle from Social View
- Voice: "Open [circle name] circle"
- Deep link from invitation

Layout:
1. Header: Circle emoji + name, close X, settings gear (if admin)
2. Members bar: Avatars row, "+[N]" if overflow, online indicators
3. Tab bar: Tasks | Activity | Challenges

TASKS TAB:
- List of circle tasks (shared + assigned)
- Filter: All | Mine | Unassigned
- Each task shows: title, assignee avatar, due date
- "+" button → Assign task modal

ACTIVITY TAB:
- Feed of circle events:
  - "[Person] completed [task]" + time ago
  - "[Person] started focus"
  - "[Person] joined the circle"
- Pull to refresh

CHALLENGES TAB:
- Active challenges within this circle
- Tap → Challenge Detail Modal
- "Start Challenge" button (if admin)

EXIT:
- Tap X → Social View
- Swipe down → Social View

API calls:
- GET /api/circles/:id (circle details)
- GET /api/circles/:id/members
- GET /api/circles/:id/tasks
- GET /api/circles/:id/activity
- GET /api/challenges?circleId=:id
```

---

### Step 4.4: Build Challenge Detail Modal

**Goal**: Challenge progress, leaderboard, proof submission.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Challenge Detail Modal - full challenge view.

File: frontend/src/screens-v2/modals/ChallengeDetailModal.tsx

REFERENCE: MYPA_ARCHITECTURE_PLAN.md Section 12.3

Entry Points:
- Tap challenge from Social View
- Tap challenge from Circle Home
- Voice: "Show [challenge name] challenge"

Layout:
1. Header: Challenge emoji + title, close X
2. Timer: "3 days, 4 hours remaining" countdown
3. Progress card:
   - Your progress bar
   - "Day 5 of 7" or "15/30 tasks"
4. Leaderboard section:
   - Top 5 participants with avatars, names, progress
   - Your position highlighted
5. Daily check-in (if applicable):
   - "Submit today's proof" button
   - Camera/gallery option
6. Rules section (collapsible):
   - Challenge description
   - Success criteria
7. Actions:
   - "Leave Challenge" (if participant)
   - "End Challenge" (if creator)

EXIT:
- Tap X → Social View or Circle Home
- Swipe down → Previous screen

API calls:
- GET /api/challenges/:id
- GET /api/challenges/:id/leaderboard
- POST /api/challenges/:id/proof (submit proof)
- DELETE /api/challenges/:id/participants/me (leave)
```

---

### Step 4.5: Build Settings Modal

**Goal**: All app settings organized.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Settings Modal with all app settings.

File: frontend/src/screens-v2/modals/SettingsModal.tsx

REFERENCE: MYPA_ARCHITECTURE_PLAN.md Section 12.4

Entry Points:
- Tap Settings from Profile View
- Voice: "Open settings"

Layout:
1. Header: "Settings", close X

SECTIONS:

VOICE & AI:
- AI Voice (toggle male/female/off)
- Voice Speed (slider)
- Wake Word "Hey MYPA" (toggle) [PREMIUM]
- AI Personality (Encouraging/Direct/Playful)

NOTIFICATIONS:
- Push Notifications (master toggle)
- Daily Summary (time picker)
- Task Reminders (toggle)
- Circle Activity (toggle)
- Challenge Updates (toggle)

FOCUS:
- Default Duration (15/25/45/60 min)
- Break Duration (5/10/15 min)
- Focus Sounds (None/Rain/Lo-fi/White noise)
- Block Notifications (toggle)

PRIVACY:
- Profile Visibility (Public/Friends/Private)
- Show Online Status (toggle)
- Activity Sharing (toggle)

ACCOUNT:
- Edit Profile → Profile edit sheet
- Change Password
- Export Data
- Delete Account

ABOUT:
- App Version
- Terms of Service → WebView
- Privacy Policy → WebView
- Help & Support → Email/form

EXIT:
- Tap X → Profile View
- Swipe down → Profile View
```

---

### Step 4.6: Build Quick Add Task Overlay

**Goal**: Fast task creation from anywhere.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Quick Add Task overlay - minimal UI for fast entry.

File: frontend/src/screens-v2/modals/QuickAddTaskOverlay.tsx

REFERENCE: MYPA_ARCHITECTURE_PLAN.md Section 12.5

Entry Points:
- Tap "+" from Tasks View header
- Voice: "Add task [name]"
- Long press FAB from any screen
- Keyboard shortcut (if hardware keyboard)

Layout:
1. Semi-transparent backdrop (tap to cancel)
2. Card from bottom:
   - Text input (auto-focused, large)
   - AI suggestion preview (as user types)
   - Quick options row:
     - Today / Tomorrow / No Date
     - Low / Medium / High priority (icons)
   - "Add" button (or Enter key)

AI Enhancement:
- As user types, show AI interpretation:
  "Buy groceries tomorrow" →
  Preview: Task: "Buy groceries" | Due: Tomorrow | Priority: Medium

BEHAVIOR:
- Auto parse natural language
- Default to Today if no date mentioned
- Default to Medium priority

EXIT:
- Tap Add → Create task, show confirmation, close
- Tap outside → Cancel, close
- Swipe down → Cancel, close

API calls:
- POST /api/tasks (create task)
- AI parsing happens client-side first, then backend
```

---

### Step 4.7: Build Create Circle Sheet

**Goal**: Create new circle with members.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Circle creation bottom sheet.

File: frontend/src/screens-v2/modals/CreateCircleSheet.tsx

REFERENCE: MYPA_ARCHITECTURE_PLAN.md Section 12.6

Entry Points:
- Tap "+" on Social View → "Create Circle"
- Voice: "Create a circle"

Layout:
1. Drag handle at top
2. Title: "Create Circle"
3. Form:
   - Circle emoji picker (grid)
   - Circle name input
   - Description (optional)
   - Privacy: Public / Invite-Only / Private
4. Invite members section:
   - Search input
   - Recent contacts list
   - Selected members chips
5. "Create" button

BEHAVIOR:
- Emoji picker shows common + recently used
- Name validation (2-30 chars, unique check)
- Can create with 0 members (add later)

EXIT:
- Tap Create → Create circle, navigate to Circle Home
- Swipe down → Confirm abandon if has content
- Tap outside → Confirm abandon

API calls:
- POST /api/circles (create)
- POST /api/invitations (invite members)
```

---

### Step 4.8: Build Create Challenge Sheet

**Goal**: Set up a new challenge.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Challenge creation bottom sheet.

File: frontend/src/screens-v2/modals/CreateChallengeSheet.tsx

REFERENCE: MYPA_ARCHITECTURE_PLAN.md Section 12.7

Entry Points:
- Tap "+" on Social View → "Start Challenge"
- From Circle Home → "Start Challenge"
- Voice: "Start a challenge"

Layout:
1. Drag handle
2. Title: "Create Challenge"
3. Form:
   - Challenge emoji picker
   - Challenge title input
   - Challenge type dropdown:
     - Focus Time (total minutes)
     - Tasks Completed (count)
     - Daily Check-in (streak)
     - Custom Goal
   - Duration: 7 / 14 / 30 days
   - Goal value (based on type)
   - Description (optional)
4. Participants section:
   - Circle selector (if from Social)
   - Or individual invites
5. "Start Challenge" button

VALIDATION:
- Title required (3-50 chars)
- At least self + 1 participant
- Duration must be future

EXIT:
- Tap Start → Create challenge, navigate to Challenge Detail
- Swipe down → Confirm abandon

API calls:
- POST /api/challenges (create)
- POST /api/challenges/:id/invite (invite participants)
```

---

### Step 4.9: Build Join Circle Modal

**Goal**: Handle circle invitation acceptance.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Join Circle modal for invitation deep links.

File: frontend/src/screens-v2/modals/JoinCircleModal.tsx

REFERENCE: MYPA_ARCHITECTURE_PLAN.md Section 12.8

Entry Points:
- Deep link: mypa://circle/invite/[code]
- Notification tap
- Shared link from messages

Layout:
1. Circle preview card:
   - Emoji + name
   - Member count: "12 members"
   - Description preview
   - Inviter: "Invited by [name]"
2. Member avatars preview (first 5)
3. Actions:
   - "Join Circle" primary button
   - "Decline" text button

BEHAVIOR:
- Check if already member → show "You're already in this circle"
- Check if banned → show "You can't join this circle"
- Loading state while fetching preview

EXIT:
- Tap Join → Join circle, navigate to Circle Home
- Tap Decline → Dismiss, return to previous
- Swipe down → Dismiss

API calls:
- GET /api/invitations/preview/[code]
- POST /api/invitations/accept/[code]
- POST /api/invitations/decline/[code]
```

---

### Step 4.10: Build Unlock Details Modal

**Goal**: Show feature unlock progress.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Unlock Details modal showing progress to unlock features.

File: frontend/src/screens-v2/modals/UnlockDetailsModal.tsx

REFERENCE: MYPA_ARCHITECTURE_PLAN.md Section 12.9

Entry Points:
- Tap locked feature on Profile View
- Voice: "How do I unlock [feature]"

Layout:
1. Header: Feature name + icon
2. Lock status:
   - LOCKED: Lock icon + progress bar
   - UNLOCKED: Checkmark + "Unlocked on [date]"
3. Requirements section:
   - Each requirement with checkbox
   - Progress for each: "2/3 days"
4. Description:
   - What this feature does
   - Why it's valuable
5. "Got it" button

UNLOCK REQUIREMENTS DISPLAY:
Day 3 Unlocks (Tasks Pro):
- "Complete 5 tasks" [x] / [ ]
- "Use app 3 days in a row" [x] / [ ]

Day 7 Unlocks (AI Insights):
- "Log 7 days of activity" [x] / [ ]
- "Complete 15 tasks" [ ] 12/15

Day 14 Unlocks (Challenges):
- "Join or create a circle" [x]
- "14-day streak" [ ] 10/14

Day 30 Unlocks (Custom AI):
- "30-day streak" [ ] 22/30
- "Complete 100 tasks" [ ] 87/100

EXIT:
- Tap "Got it" → Dismiss
- Swipe down → Dismiss

API calls:
- GET /api/unlocks/:featureId (unlock details)
```

---

### Step 4.11: Build Notifications Center Modal

**Goal**: All notifications in one place.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create Notifications Center modal.

File: frontend/src/screens-v2/modals/NotificationsModal.tsx

REFERENCE: MYPA_ARCHITECTURE_PLAN.md Section 12.10

Entry Points:
- Tap bell icon (if added to header)
- Voice: "Show notifications"
- From Profile View quick link

Layout:
1. Header: "Notifications" + close X + "Mark all read"
2. Filter tabs: All | Social | Tasks | System
3. Notification list:
   - Each notification:
     - Icon (type-specific)
     - Title + description
     - Time ago
     - Unread indicator (dot)
   - Tap → Navigate to relevant screen
4. Empty state: "You're all caught up!"

NOTIFICATION TYPES:
- circle_invite: "[Name] invited you to [Circle]"
- challenge_update: "You moved to 2nd place!"
- task_reminder: "[Task] is due in 1 hour"
- streak_warning: "Don't lose your streak! 2 hours left"
- achievement: "You earned [Badge]!"
- system: "MYPA updated to v2.0"

BEHAVIOR:
- Pull to refresh
- Mark as read on tap
- Swipe left to delete
- Group by Today / This Week / Earlier

EXIT:
- Tap X → Previous screen
- Swipe down → Previous screen

API calls:
- GET /api/notifications
- PUT /api/notifications/:id/read
- PUT /api/notifications/read-all
- DELETE /api/notifications/:id
```

---

### Step 4.12: Test All Modals

**Goal**: Verify modal flows work correctly.

**Agent**: Manual Testing

**Checklist**:
```
TASK DETAIL:
[ ] Opens from Tasks View tap
[ ] Can edit task title
[ ] Can change due date
[ ] Can change priority
[ ] Complete task shows animation
[ ] Start Focus navigates correctly
[ ] Delete task works
[ ] Swipe to dismiss works
[ ] X button closes modal

CIRCLE HOME:
[ ] Opens from Social View tap
[ ] Members bar shows correctly
[ ] Tasks tab loads tasks
[ ] Activity tab shows feed
[ ] Challenges tab shows circle challenges
[ ] Settings gear visible for admin
[ ] Swipe/X closes modal

CHALLENGE DETAIL:
[ ] Opens from Social View
[ ] Opens from Circle Home
[ ] Timer countdown accurate
[ ] Leaderboard loads
[ ] Proof submission works
[ ] Leave challenge works

SETTINGS:
[ ] All toggles save correctly
[ ] Voice speed slider works
[ ] Links open correctly
[ ] Logout flow works

QUICK ADD TASK:
[ ] Opens from + button
[ ] Auto-focus on input
[ ] AI suggestions appear
[ ] Quick date/priority work
[ ] Creates task correctly
[ ] Tap outside cancels

CREATE CIRCLE:
[ ] Emoji picker works
[ ] Name validation works
[ ] Can invite members
[ ] Creates circle correctly

CREATE CHALLENGE:
[ ] All fields work
[ ] Duration options correct
[ ] Creates challenge correctly

JOIN CIRCLE:
[ ] Deep link opens modal
[ ] Preview loads correctly
[ ] Join button works
[ ] Decline button works

UNLOCK DETAILS:
[ ] Shows correct progress
[ ] Requirements display correctly
[ ] Locked vs unlocked states

NOTIFICATIONS:
[ ] Loads notifications
[ ] Tap navigates correctly
[ ] Mark read works
[ ] Pull to refresh works
```

---
- Show subtle indicator when wake word active
- Battery optimization is critical

Note: This is optional/advanced - can skip if time constrained.
Make sure it can be disabled by default.
```

---

# PHASE 5: VOICE SYSTEM
## Week 5

> **Reference**: See MYPA_ARCHITECTURE_PLAN.md Section 6 "Voice-First AI" and Section 14 "Voice Commands"
> **Existing Code**: `frontend/src/services/voiceAssistant.ts` (657 lines) - You already have TTS working!
> **What Needs Building**: Real microphone recording, Realtime API streaming, Living Background

---

### Step 5.1: Install Voice Dependencies

**Goal**: Set up audio recording for OpenAI Realtime API.

**Agent**: Manual

**Commands**:
```bash
cd frontend

# Audio recording and playback
npx expo install expo-av

# For iOS, update pods:
cd ios && pod install && cd ..

# Haptic feedback for voice interactions
npx expo install expo-haptics
```

**iOS Configuration**:
```
File: ios/MYPAiOSApp/Info.plist

Add if not present:
<key>NSSpeechRecognitionUsageDescription</key>
<string>MYPA uses speech recognition to understand your voice commands</string>
<key>NSMicrophoneUsageDescription</key>
<string>MYPA needs microphone access to hear your voice commands</string>
```

---

### Step 5.2: Create Voice Service

**Goal**: Unified voice abstraction layer using OpenAI Whisper (STT) and OpenAI TTS (human-like voice).

**Agent**: Cursor (Claude)

**Prompt**:
```
Create a comprehensive voice service for MYPA using OpenAI's premium voice APIs.

File: frontend/src/services/voice/VoiceService.ts

REFERENCE: MYPA_ARCHITECTURE_PLAN.md Section 6

Interface:
interface VoiceService {
  // STT (OpenAI Whisper via Edge Function)
  startListening(): Promise<void>;
  stopListening(): Promise<string>;  // records audio, sends to Whisper, returns transcript
  cancelListening(): void;
  
  // TTS (OpenAI TTS via Edge Function)
  speak(text: string, options?: SpeakOptions): Promise<void>;
  stopSpeaking(): void;
  
  // State
  isListening: boolean;
  isSpeaking: boolean;
  
  // Events
  onPartialResult: (transcript: string) => void;
  onFinalResult: (transcript: string) => void;
  onError: (error: VoiceError) => void;
  onStateChange: (state: VoiceState) => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';
type SpeakOptions = { 
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number;  // 0.25 to 4.0
};

Implementation:
- Use expo-av Audio.Recording for recording
- Send audio to Supabase Edge Function → OpenAI Whisper for transcription
- Call Supabase Edge Function → OpenAI TTS for human-like speech
- Default voice: 'nova' (friendly, female, energetic)
- Handle iOS permissions gracefully
- Auto-request permissions when needed
- Queue TTS if already speaking
- Cancel recording when starting TTS and vice versa
- Play audio response with expo-av Audio.Sound

File: frontend/src/services/voice/index.ts
- Export singleton instance
- Export types
```

---

### Step 5.3: Create Voice Context Provider

**Goal**: Make voice available throughout app.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create React context for voice state management.

File: frontend/src/contexts/VoiceContext.tsx

Provide to entire app:
- voiceState: 'idle' | 'listening' | 'processing' | 'speaking'
- transcript: string (current/last transcript)
- aiResponse: string (current/last AI response)
- error: VoiceError | null
- startListening: () => void
- stopListening: () => void
- speak: (text: string) => void
- stopSpeaking: () => void

State flow:
1. User taps orb → startListening()
2. voiceState = 'listening', transcript updates in real-time
3. User stops/taps again → stopListening()
4. voiceState = 'processing'
5. Send transcript to AI backend
6. Receive response → aiResponse updated
7. voiceState = 'speaking', speak(aiResponse)
8. TTS completes → voiceState = 'idle'

Handle errors at each step with user-friendly messages.
```

---

### Step 5.4: Create Living Background Component

**Goal**: The entire AI Hub screen IS the AI - a living, reactive interface that responds to voice and energy.

**Reference**: MYPA_DESIGN_SPECIFICATION.md Section 0 "THE LIVING AI HUB"

**Agent**: Cursor (Claude)

**Prompt**:
```
Create the Living Background component using React Native Skia.

This is the CORE visual experience of MYPA - the whole screen comes alive.

File: frontend/src/components/LivingBackground/index.tsx

CONCEPT:
Instead of an orb on a screen, the ENTIRE screen is a living entity that:
- Breathes and pulses gently when idle
- Responds to voice volume in real-time
- Shifts colors based on user's energy/mood
- Feels like being INSIDE the AI, not looking at it

LAYERS (back to front):
1. Gradient Mesh Background (Skia shader)
2. Floating Particle Field (subtle, reactive)
3. Central Focal Glow (soft, not hard-edged)
4. Voice Waveform (appears during listening)
5. Floating UI Elements (text, buttons on top)

TECHNICAL:
```typescript
import { Canvas, Shader, Skia, Fill, Circle, Paint } from '@shopify/react-native-skia';
import Animated, { useSharedValue, withTiming, withRepeat } from 'react-native-reanimated';

// Gradient mesh shader (creates the living background)
const gradientShader = Skia.RuntimeEffect.Make(`
  uniform float time;
  uniform float energy;  // 0-1, voice volume or user energy
  uniform vec2 resolution;
  
  vec3 palette(float t) {
    vec3 a = vec3(0.1, 0.1, 0.2);    // Deep blue base
    vec3 b = vec3(0.3, 0.2, 0.4);    // Purple accent
    vec3 c = vec3(0.5, 0.4, 0.6);    // Lavender
    vec3 d = vec3(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
  }
  
  half4 main(vec2 coord) {
    vec2 uv = coord / resolution;
    float wave = sin(uv.x * 3.0 + time * 0.5) * 0.1;
    wave += sin(uv.y * 2.0 + time * 0.3) * 0.1;
    wave *= (1.0 + energy * 2.0);  // Energy amplifies waves
    
    vec3 color = palette(uv.y + wave);
    return half4(color, 1.0);
  }
`)!;
```

STATES WITH VISUAL MAPPING:
1. IDLE - Calm breathing
   - Gradient shifts slowly (time animation)
   - Subtle particle drift
   - Soft center glow (40% opacity)
   - Colors: Deep blue/purple (#1a1a2e → #4a4a6a)

2. LISTENING - Alert & receptive
   - Gradient responds to VOICE VOLUME in real-time
   - Particles accelerate toward center
   - Center glow brightens (70% opacity)
   - Voice waveform appears
   - Colors shift warmer (#4a4a6a → #6a5a7a)

3. PROCESSING - Thinking
   - Gradient swirls concentrically
   - Particles spiral inward
   - Center glow pulses (thoughtful rhythm)
   - Colors: Cool thinking (#5a5a8a)

4. SPEAKING - AI responding
   - Gradient pulses with speech rhythm
   - Particles radiate outward
   - Center glow expands with each word
   - Colors: Warm, confident (#7a6a8a)

ENERGY DETECTION (from voice analysis):
- Use expo-av to get audio metering during recording
- Map dB levels to 0-1 energy value
- Smooth the value for visual appeal
- Pass to shader uniform

export const LivingBackground: React.FC<{
  voiceState: VoiceState;
  audioLevel: number; // 0-1
}> = ({ voiceState, audioLevel }) => {
  const time = useSharedValue(0);
  const energy = useSharedValue(0);
  
  // Animate time continuously
  useEffect(() => {
    time.value = withRepeat(
      withTiming(100, { duration: 100000 }),
      -1
    );
  }, []);
  
  // Smooth audio level changes
  useEffect(() => {
    energy.value = withTiming(audioLevel, { duration: 100 });
  }, [audioLevel]);
  
  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Fill>
        <Shader source={gradientShader} uniforms={{
          time: time,
          energy: energy,
          resolution: [width, height]
        }} />
      </Fill>
      <ParticleField energy={energy} state={voiceState} />
      <CenterGlow state={voiceState} />
    </Canvas>
  );
};
```

---

### Step 5.5: Create Particle System

**Goal**: Add floating particles that respond to voice and state.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create particle system for the Living Background.

File: frontend/src/components/LivingBackground/ParticleField.tsx

CONCEPT:
Hundreds of tiny, soft particles floating across the screen.
They respond to voice input and state changes.

PARTICLE PROPERTIES:
- Count: 50-100 particles
- Size: 2-6px (varied)
- Opacity: 10-30% (subtle, not distracting)
- Color: White/lavender with slight glow
- Movement: Gentle drift with slight randomness

BEHAVIOR BY STATE:
1. IDLE
   - Slow, random drift
   - Particles scattered evenly
   - Like dust motes in sunlight

2. LISTENING
   - Drift toward screen center
   - Speed increases with voice volume
   - Create sense of attention/gathering

3. PROCESSING
   - Gentle spiral toward center
   - Pulsing opacity
   - Thinking/concentrating feel

4. SPEAKING
   - Radiate outward from center
   - Pulse with speech rhythm
   - Energy release feeling

TECHNICAL APPROACH:
Use Skia circles with positions stored in shared values.
Update positions on each frame based on state and energy.

```typescript
const PARTICLE_COUNT = 80;

interface Particle {
  x: Animated.SharedValue<number>;
  y: Animated.SharedValue<number>;
  size: number;
  opacity: number;
  baseVelocity: { x: number; y: number };
}

export const ParticleField: React.FC<{
  energy: Animated.SharedValue<number>;
  state: VoiceState;
}> = ({ energy, state }) => {
  const particles = useMemo(() => 
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: useSharedValue(Math.random() * width),
      y: useSharedValue(Math.random() * height),
      size: 2 + Math.random() * 4,
      opacity: 0.1 + Math.random() * 0.2,
      baseVelocity: {
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.5
      }
    }))
  , []);
  
  // Animation frame update
  useFrameCallback(() => {
    particles.forEach(p => {
      // Calculate attraction to center based on state
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = centerX - p.x.value;
      const dy = centerY - p.y.value;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let vx = p.baseVelocity.x;
      let vy = p.baseVelocity.y;
      
      if (state === 'listening') {
        // Pull toward center based on voice energy
        const pull = energy.value * 2;
        vx += (dx / dist) * pull;
        vy += (dy / dist) * pull;
      } else if (state === 'speaking') {
        // Push away from center
        vx -= (dx / dist) * 1.5;
        vy -= (dy / dist) * 1.5;
      }
      
      p.x.value = (p.x.value + vx + width) % width;
      p.y.value = (p.y.value + vy + height) % height;
    });
  });
  
  return (
    <>
      {particles.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.size}
          color={`rgba(200, 200, 255, ${p.opacity})`}
        />
      ))}
    </>
  );
};
```
```

---

### Step 5.6: Create Center Focal Glow

**Goal**: Soft glowing center that indicates where to tap and shows AI presence.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create the center focal glow for voice activation.

File: frontend/src/components/LivingBackground/CenterGlow.tsx

CONCEPT:
A soft, ethereal glow at the center - NOT a hard orb.
This is where users tap to activate voice.
It breathes and pulses, feeling alive.

DESIGN:
- Position: Center of screen
- Size: ~200px diameter, soft edges
- Appearance: Gaussian blur glow, no hard edges
- Color: Warm lavender transitioning to gold when active

STATES:
1. IDLE
   - Soft pulse (scale 0.95 → 1.05)
   - 40% opacity
   - 3-second breathing cycle

2. LISTENING
   - Brighter (70% opacity)
   - Pulse synced to voice volume
   - Slight color shift warmer
   - Ring ripples emanate on loud sounds

3. PROCESSING
   - Gentle rotation effect
   - Pulsing at "thinking" rhythm
   - 50% opacity

4. SPEAKING
   - Brightest (80% opacity)
   - Size pulses with speech cadence
   - Warm golden tint

TECHNICAL:
```typescript
export const CenterGlow: React.FC<{
  state: VoiceState;
  energy?: Animated.SharedValue<number>;
}> = ({ state, energy }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);
  
  useEffect(() => {
    switch (state) {
      case 'idle':
        opacity.value = withTiming(0.4);
        scale.value = withRepeat(
          withTiming(1.05, { duration: 1500 }),
          -1,
          true
        );
        break;
      case 'listening':
        opacity.value = withTiming(0.7);
        // Scale driven by energy in useFrameCallback
        break;
      case 'processing':
        opacity.value = withTiming(0.5);
        scale.value = withRepeat(
          withTiming(1.1, { duration: 800 }),
          -1,
          true
        );
        break;
      case 'speaking':
        opacity.value = withTiming(0.8);
        break;
    }
  }, [state]);
  
  // Voice-reactive scaling during listening
  useFrameCallback(() => {
    if (state === 'listening' && energy) {
      scale.value = 1 + energy.value * 0.3;
    }
  });
  
  return (
    <Group transform={[{ scale }]}>
      {/* Outer soft glow */}
      <Circle
        cx={width / 2}
        cy={height / 2}
        r={120}
      >
        <RadialGradient
          c={vec(width / 2, height / 2)}
          r={120}
          colors={['rgba(180, 160, 220, 0.6)', 'transparent']}
        />
      </Circle>
      
      {/* Inner bright core */}
      <Circle
        cx={width / 2}
        cy={height / 2}
        r={40}
      >
        <RadialGradient
          c={vec(width / 2, height / 2)}
          r={40}
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(180, 160, 220, 0.3)']}
        />
      </Circle>
    </Group>
  );
};
```

INTERACTION:
- Tappable area: 150px radius from center
- On tap: slight "press" animation (scale down quickly, bounce back)
- Haptic feedback on tap
```

---

### Step 5.7: Create Voice Waveform Visualization

**Goal**: Show voice input as a beautiful waveform during listening.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create voice waveform visualization.

File: frontend/src/components/LivingBackground/VoiceWaveform.tsx

CONCEPT:
When user is speaking, show a flowing waveform around the center glow.
Not a typical audio meter - more like a living sound ring.

DESIGN:
- Shape: Circular waveform around center
- Responds to audio frequency (if available) or volume
- Smooth, organic movement
- Fades in during listening, out otherwise

TECHNICAL:
```typescript
export const VoiceWaveform: React.FC<{
  visible: boolean;
  audioLevel: number;
}> = ({ visible, audioLevel }) => {
  const opacity = useSharedValue(0);
  const points = useSharedValue<number[]>(Array(64).fill(0));
  
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 300 });
  }, [visible]);
  
  // Update waveform based on audio
  useEffect(() => {
    if (visible) {
      // Shift existing points
      const newPoints = [...points.value.slice(1), audioLevel * 30];
      points.value = newPoints;
    }
  }, [audioLevel]);
  
  // Render as circular path
  return (
    <Path opacity={opacity}>
      {/* Create circular waveform path from points */}
    </Path>
  );
};
```
```

---

### Step 5.8: Create Voice UI Overlay

**Goal**: Visual feedback during voice interaction.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create voice feedback UI for AI Home.

File: frontend/src/components/VoiceFeedback/index.tsx

Display below AI Orb on AI Home screen:

LISTENING STATE:
- Animated waveform/sound bars
- Live transcript text (updates as user speaks)
- "Tap orb to finish" hint
- Cancel button (X)

PROCESSING STATE:
- Loading dots animation
- Last transcript shown
- "Thinking..." text

SPEAKING STATE:
- AI response text displayed
- Animated text appearance (typewriter effect optional)
- "Tap to interrupt" hint

ERROR STATE:
- Error message
- Retry button
- "Try again" text

Animations:
- Use react-native-reanimated
- Smooth transitions between states
- Text fades in/out gracefully
```

---

### Step 5.9: Implement Voice Command Processing

**Goal**: Send voice commands to backend, handle responses.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement voice command processing pipeline.

File: frontend/src/services/voice/VoiceCommandProcessor.ts

Process flow:
1. Receive final transcript
2. Quick local parsing for common commands (optimization)
3. Send to backend POST /api/ai/voice-command
4. Receive structured response
5. Execute action if any
6. Return speech text to TTS

Local quick parse (before API call):
- "add task [X]" → Create task immediately
- "start focus" → Open focus modal immediately
- "what time is it" → Reply locally

Backend response format:
{
  success: true,
  message: "I've added 'Buy groceries' to your tasks",
  action?: {
    type: 'navigate' | 'create_task' | 'complete_task' | 'start_focus' | 'query',
    payload: { ... }
  },
  shouldSpeak: true
}

Action execution:
- navigate: Use navigation ref to navigate
- create_task: Call task API, refresh tasks
- complete_task: Call completion API
- start_focus: Open focus modal
- query: Just speak the response

File: frontend/src/services/voice/VoiceActionExecutor.ts
- Execute actions returned from backend
- Handle navigation, CRUD operations
- Provide confirmation feedback
```

---

### Step 5.10: Add Context-Aware Voice Commands

**Goal**: Voice understands current screen context.

**Agent**: Cursor (Claude)

**Prompt**:
```
Make voice commands context-aware.

File: frontend/src/hooks/useVoiceWithContext.ts

Pass current context to voice command API:

From AI Home:
- General commands work
- "add task" "start focus" "how am I doing"

From Tasks View:
- Context: 'tasks'
- "show tomorrow" filters to tomorrow
- "add another" knows to add task
- "mark done" refers to selected task

From Social View:
- Context: 'social'
- "open [circle name]" works
- "who's active" refers to circles

From Focus Modal:
- Context: 'focus'
- "how long" refers to current session
- "add 10 minutes" understood
- "I'm done" ends session

API call includes:
{
  transcript: "...",
  context: {
    screen: 'tasks' | 'social' | 'profile' | 'ai_home' | 'focus',
    selectedTaskId?: string,
    focusSessionActive?: boolean
  }
}

Backend uses context to better understand intent.
```

---

### Step 5.11: Voice During Focus Sessions

**Goal**: Full voice control during focus.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement voice control for focus sessions.

File: frontend/src/screens-v2/modals/FocusModal.tsx (update)

REFERENCE: MYPA_ARCHITECTURE_PLAN.md Section 14 Voice Commands

During focus, voice commands:
- "How long have I been going?" → AI speaks elapsed time
- "How much time is left?" → AI speaks remaining time
- "Add 10 minutes" → Extend timer, confirm
- "Pause" → Pause timer, speak confirmation
- "Resume" → Resume timer, speak confirmation
- "I'm done" / "End session" → End focus, show results
- "What am I working on?" → Speak current task name

Add floating voice button to Focus Modal:
- Position: bottom center, small circular button
- Tap to activate voice
- Living background effect in mini form

Proactive AI (if enabled in settings):
- At 50% mark: "Halfway there! You're doing great."
- At 5 minutes left: "Almost done, stay focused!"
- On complete: Celebration with XP announcement
```

---

### Step 5.12: TTS Voice Settings

**Goal**: Customizable AI voice.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement TTS voice customization.

File: frontend/src/screens-v2/modals/SettingsModal.tsx (update voice section)

Settings:
1. AI Voice toggle: On/Off (master TTS toggle)
2. Voice Selection: 
   - OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
   - Default: 'ash' (same as ChatGPT, warm and friendly)
   - Preview each voice with sample
3. Voice Speed: Slider (0.5x - 2.0x, default 1.0)

File: frontend/src/services/voice/VoiceSettings.ts
- Load settings from AsyncStorage
- Pass to OpenAI TTS calls
- Store user preference

Preview button:
- "Test Voice" button
- Speaks sample phrase with current settings
- "Hey! I'm MYPA, ready to help you get things done."
```

---

### Step 5.13: Voice Permissions Handling

**Goal**: Graceful permission handling.

**Agent**: Cursor (Claude)

**Prompt**:
```
Handle microphone/speech permissions gracefully.

File: frontend/src/services/voice/VoicePermissions.ts

On first voice attempt:
1. Check if permissions granted
2. If not, show explanation modal first:
   - "MYPA needs microphone access to hear you"
   - "Your voice is only used locally for commands"
   - "Tap Allow to enable voice features"
3. Then request permissions
4. If denied, show fallback:
   - "Voice features disabled"
   - "You can enable in Settings → MYPA → Microphone"
   - Continue to work without voice

States:
- GRANTED: Voice works normally
- DENIED: Hide orb or show "Voice disabled"
- NOT_DETERMINED: Show explanation, then request

Never block the app on voice permissions.
Voice is a feature, not a requirement.
```

---

### Step 5.14: Test Voice System

**Goal**: Comprehensive voice testing.

**Agent**: Manual Testing

**Checklist**:
```
SETUP:
[ ] Microphone permission requested properly
[ ] Permission denial handled gracefully
[ ] TTS works without microphone

BASIC FLOW:
[ ] Tap screen → Listening state activates
[ ] Living Background reacts to voice volume
[ ] Speaking shows live transcript
[ ] Stop talking → Processing state (spiral animation)
[ ] Response speaks back, background pulses with speech
[ ] Returns to idle state (gentle breathing)

LIVING BACKGROUND:
[ ] Gradient mesh animates smoothly
[ ] Particles drift in idle state
[ ] Particles accelerate toward center when listening
[ ] Center glow brightens when active
[ ] Voice waveform appears during listening
[ ] All transitions are smooth (no jarring changes)

COMMANDS (from Architecture Plan Section 14):
[ ] "Add task buy groceries" → Creates task
[ ] "What's on my plate today?" → Lists tasks
[ ] "Start focus" → Opens focus modal
[ ] "How am I doing?" → Speaks status
[ ] "Open circles" → Navigates to Social
[ ] "Show my profile" → Navigates to Profile

CONTEXT AWARENESS:
[ ] From Tasks: "Show tomorrow" filters
[ ] From Social: "Open [circle]" works
[ ] From Focus: "How long?" speaks time

ERROR HANDLING:
[ ] No internet → Graceful error message
[ ] No speech result → "I didn't catch that"
[ ] Cancel during listening → Returns to idle

SETTINGS:
[ ] Voice toggle disables TTS
[ ] Speed slider works
[ ] Voice selection works
[ ] Settings persist across restarts

ACCESSIBILITY:
[ ] VoiceOver announces states
[ ] Works with AssistiveTouch
```

---

# PHASE 6: AI LEARNING SYSTEM
## Week 6

> **Reference**: See MYPA_ARCHITECTURE_PLAN.md Section 5 "Learning System" and Section 9 "User Model"
> **Existing Code**: `backend/src/services/ai.service.ts` already has conversation context

---

### Step 6.1: Frontend Event Logging

**Goal**: Log user events to power AI personalization.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create event logging service for frontend.

File: frontend/src/services/eventLogger.ts

Log these events:
- app_opened (on app start)
- swipe_navigation (with direction)
- voice_command (with transcript)
- task_created, task_completed, task_deferred
- focus_started, focus_completed
- screen_viewed (with screen name)

Implementation:
- Queue events locally
- Batch send every 30 seconds or on 10 events
- Persist queue to handle app close
- Fire and forget - never block UI

Call eventLogger.log(type, metadata) throughout app.
```

---

### Step 6.2: Fetch User Model for AI Context

**Goal**: Use learned patterns in AI responses.

**Agent**: Cursor (Claude)

**Prompt**:
```
Fetch and use UserModel data in AI interactions.

Frontend:
- Fetch user model on app start
- Store in context
- Pass relevant data to voice commands

Backend:
- Update AI prompts to include user patterns
- When user has peak hours unlocked, mention in prompt
- When completion patterns unlocked, use in sorting

Example prompt enhancement:
"User typically completes tasks best between 9-11am.
Today they have 5 tasks. They usually struggle when over 8 tasks."

This makes AI feel personalized and aware.
```

---

### Step 6.3: Implement Unlock Celebration

**Goal**: Celebrate new unlocks.

**Agent**: Cursor (Claude)

**Prompt**:
```
Create unlock celebration modal.

When user earns new unlock:
1. Check /api/unlocks/pending on app open
2. If pending unlocks exist, show celebration modal

Modal design:
- Confetti animation
- Unlock icon with glow
- "New AI Ability Unlocked!"
- Feature name and description
- "Awesome!" button to dismiss

After dismiss:
- POST /api/unlocks/:feature/seen
- Show unlock in Profile view

Make it feel rewarding - this is key to engagement!
```

---

### Step 6.4: Show Unlock Progress

**Goal**: Show progress toward locked features.

**Agent**: Cursor (Claude)

**Prompt**:
```
Show unlock progress in Profile view.

Design:
- List of all features (locked and unlocked)
- Unlocked: checkmark, "Unlocked Day X"
- Locked: progress bar, "X/Y tasks to unlock"

Features to show:
- Peak Hours: "Complete 10 tasks"
- AI Task Sorting: "Day 7"
- Duration Estimation: "10 focus sessions"
- Completion Patterns: "30 tasks created"
- Predictive Mode: "Day 30 + 50 tasks"
- Overwhelm Detection: "Day 30"

Update progress real-time as user completes actions.
```

---

### Step 6.5: AI Task Sorting

**Goal**: Sort tasks using learned patterns.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement AI task sorting based on learned patterns.

When user has 'ai_task_sorting' unlocked:
1. Fetch user's completion patterns
2. Sort tasks by:
   - Priority (existing)
   - Due date (existing)
   - Likelihood of completion based on:
     - Time of day vs peak hours
     - Number of existing tasks
     - Category completion rates

Backend:
- Add sorting logic to GET /tasks
- Include sort_reason in response

Frontend:
- Show "AI sorted" indicator
- Optional: show why task is prioritized
```

---

### Step 6.6: Duration Estimation

**Goal**: AI estimates task duration.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement AI duration estimation.

When user has 'duration_estimation' unlocked:
1. Use historical focus session data
2. Estimate duration for similar tasks

Backend:
- Track actual duration when tasks are completed during focus
- Calculate average by category
- Add estimated_duration to task response

Frontend:
- Show estimated duration on tasks
- "~25 mins" badge
- Use in focus session suggestions

Fallback: Use default estimates if not enough data.
```

---

### Step 6.7: Overwhelm Detection

**Goal**: AI detects when user is overwhelmed.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement overwhelm detection.

When user has 'overwhelm_detection' unlocked:
1. Calculate user's overwhelm threshold from historical data
2. When task count exceeds threshold, warn user

Backend:
- Track completion rates vs task count
- Find inflection point where completion drops
- Store in UserModel.overwhelmThreshold

Frontend:
- When threshold exceeded, AI says:
  "You have [X] tasks today. I've noticed you're most effective with [Y] or fewer. 
   Want me to help you prioritize?"
- Offer to defer or delegate tasks

This is the "magic" that makes MYPA feel like it knows you.
```

---

### Step 6.8: AI Daily Brief

**Goal**: Morning AI summary.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement AI daily brief.

Backend endpoint: GET /api/ai/daily-brief

Returns:
- Personalized greeting
- Task summary for today
- Suggested focus time (based on peak hours)
- Challenge updates
- Motivational message based on recent performance

Frontend:
- Show automatically on first app open of day
- AI speaks the brief
- User can skip or say "tell me more"

Example:
"Good morning! You have 4 tasks today. Your peak focus time is coming up at 9am.
You're 3 days into your 'Productive Week' challenge - keep it up!"
```

---

### Step 6.9: Predictive Suggestions

**Goal**: AI suggests tasks proactively.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement predictive task suggestions.

When user has 'predictive_mode' unlocked:
1. Analyze task patterns (recurring tasks, common times)
2. Suggest tasks before user creates them

Backend:
- Detect recurring patterns (e.g., "Plan week" every Sunday)
- GET /api/ai/suggestions returns predicted tasks

Frontend:
- AI proactively asks: "It's Sunday - want me to add 'Plan week' to your tasks?"
- User can confirm or dismiss

Also suggest:
- Break tasks down if commonly deferred
- Move tasks to different day if completion rate is low
```

---

### Step 6.10: Test Learning System

**Goal**: Verify AI learning works.

**Agent**: Manual + Cursor

**Checklist**:
```
[ ] Events are being logged
[ ] Batch job runs (trigger manually)
[ ] UserModel updates with patterns
[ ] Unlocks trigger at right thresholds
[ ] Celebration modal shows
[ ] Progress bars update
[ ] AI responses reference learned data
[ ] Task sorting uses patterns
[ ] Duration estimates appear
[ ] Overwhelm detection triggers
[ ] Daily brief works
```

---

# PHASE 7: TESTING & POLISH
## Week 6

---

### Step 7.0: Push Notifications Setup

**Goal**: Enable push notifications for engagement.

**Agent**: Cursor (Claude)

**Prompt**:
```
Set up push notifications for MYPA.

Backend already has push.service.ts - verify it works with production.

Frontend setup:
File: frontend/src/services/notifications.ts

1. Request push notification permissions
2. Get Expo push token
3. Send token to backend (store in User table)
4. Handle incoming notifications
5. Handle notification taps (deep linking)

Notification types to implement:
- task_reminder: "Don't forget: [task name]"
- streak_warning: "Your streak ends in 2 hours!"
- challenge_update: "You're now #2 in [challenge]!"
- circle_activity: "[Person] completed a task"
- daily_summary: "Good morning! You have 5 tasks today"

iOS specific:
- Add notification categories for actions
- Provisional authorization (silent delivery first)
- Badge count management

File: frontend/src/hooks/useNotifications.ts
- Request permissions on first relevant action
- Don't ask immediately on launch
- Handle permission denial gracefully

Test with:
npx expo push:send --to ExpoPushToken[xxx]
```

---

### Step 7.1: Performance Optimization

**Goal**: 60fps animations, fast load times.

**Agent**: Cursor (Claude)

**Prompt**:
```
Optimize app performance.

Check and fix:
1. Gesture animations - must be 60fps
2. List rendering - use FlatList with proper keys
3. Re-renders - memoize components
4. Bundle size - check for large dependencies
5. Image optimization - use proper sizes
6. API calls - no duplicate calls, proper caching

Tools:
- React DevTools for re-render detection
- Flipper for performance profiling
- Expo performance tab

Target metrics:
- App start: < 2 seconds
- Screen transitions: < 300ms
- Gesture response: < 16ms
```

---

### Step 7.2: Offline Support

**Goal**: App works without internet.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add offline support.

Implementation:
1. Cache user data locally (AsyncStorage or SQLite)
2. Cache tasks, circles, challenges
3. Queue mutations when offline
4. Sync when back online
5. Show offline indicator

Handle:
- Voice commands offline → "I need internet for that"
- Reading cached data → works fine
- Creating tasks offline → queue and sync

Use:
- @react-native-async-storage/async-storage for simple data
- React Query for caching and sync
```

---

### Step 7.3: Error Boundaries

**Goal**: Graceful error handling.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add error boundaries and global error handling.

Create:
1. ErrorBoundary component that catches render errors
2. Global API error handler
3. Fallback UI for errors
4. Error reporting setup (prepare for Sentry)

When error occurs:
- Show friendly message, not stack trace
- Offer retry or go home
- Log error for debugging

Never show white screen of death.
```

---

### Step 7.4: Loading States

**Goal**: Beautiful loading states.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add polished loading states throughout app.

Create:
1. Skeleton screens for lists (tasks, circles)
2. Loading spinner for buttons
3. Pull-to-refresh indicators
4. Initial app loading screen

Design:
- Use skeleton animation (shimmer effect)
- Match the dark theme
- Feel premium, not jarring
- Minimum display time (300ms) to prevent flash
```

---

### Step 7.5: Empty States

**Goal**: Beautiful empty states that guide users.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add meaningful empty states.

Screens needing empty states:
1. Tasks: "No tasks yet. Tap the orb and say 'add task'"
2. Circles: "Join a circle to compete with friends"
3. Challenges: "No active challenges"
4. Activity: "Your activity will appear here"

Design:
- Illustration or icon
- Helpful message
- Call to action button
- Consistent with dark theme
```

---

### Step 7.6: Accessibility

**Goal**: App is accessible to all users.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add accessibility support.

Check and fix:
1. All buttons have accessibilityLabel
2. Images have accessibilityRole="image" and labels
3. Screen reader announces state changes
4. Touch targets are at least 44x44
5. Color contrast meets WCAG AA
6. VoiceOver/TalkBack navigation works

Test with:
- iOS VoiceOver
- Android TalkBack
- Increase text size setting
```

---

### Step 7.7: Deep Linking Setup

**Goal**: Enable deep links for circle invites, notifications, and sharing.

**Agent**: Cursor (Claude)

**Prompt**:
```
Set up deep linking for MYPA.

URL Scheme: mypa://
Universal Links: https://mypa.app (or your domain)

Deep link routes:
- mypa://circle/invite/[code] → JoinCircleModal
- mypa://challenge/[id] → ChallengeDetailModal
- mypa://task/[id] → TaskDetailModal
- mypa://focus → FocusModal
- mypa://profile → ProfileView

Implementation:

1. Configure URL scheme:
File: app.json
{
  "expo": {
    "scheme": "mypa",
    "ios": {
      "associatedDomains": ["applinks:mypa.app"]
    }
  }
}

2. Create linking configuration:
File: frontend/src/navigation/linking.ts
- Define all deep link routes
- Map URLs to screen names
- Handle params extraction

3. Handle incoming links:
File: frontend/src/hooks/useDeepLinking.ts
- Listen for incoming links (Linking API)
- Parse URL and navigate
- Handle links when app is closed vs open

4. Universal Links (for iOS):
- Host apple-app-site-association file on your domain
- Verify domain ownership in Apple Developer

5. Generate shareable links:
File: frontend/src/utils/shareLinks.ts
- generateCircleInviteLink(circleId, code)
- generateChallengeLink(challengeId)
- Use native Share sheet
```

---

### Step 7.8: App Icon & Splash Screen

**Goal**: Professional app icon and splash screen.

**Agent**: Manual + Design Tools

**Existing Assets**: Check `frontend/assets/` for existing icons

**Steps**:
```
1. Create app icon:
   - 1024x1024 PNG
   - Design: Soft gradient orb/glow representing MYPA's living interface
   - Colors: Purple gradient (#6C5CE7 → #a855f7)
   - Use Figma, Sketch, or AI image generator

2. Update app.json:
   "icon": "./assets/icon.png",
   "splash": {
     "image": "./assets/splash.png",
     "backgroundColor": "#000000",
     "resizeMode": "contain"
   }

3. Generate adaptive icons:
   - Use eas build to generate all sizes
   - Test on both iOS simulator and device
```

---

### Step 7.9: Onboarding Flow Update

**Goal**: Update onboarding for gesture-based navigation.

**Agent**: Cursor (Claude Sonnet 4)

**Existing Code Reference**:
- `frontend/src/screens/Onboarding/index.tsx` (1002 lines) - Full onboarding exists!
- This already has brain dump → task conversion flow

**Prompt**:
```
Update the existing onboarding to teach gesture navigation.

FILE: frontend/src/screens/Onboarding/index.tsx (UPDATE existing)

CURRENT: Shows brain dump → AI organization
KEEP: This flow works well

ADD NEW SCREENS after task creation:
1. GESTURES INTRO: "Navigate with swipes"
   - Show hand swiping animation
   - "Swipe left for Tasks"
   - "Swipe right for Social"
   - "Swipe down for Profile"
   - "Swipe up for Focus"

2. VOICE INTRO: "Just talk to MYPA"
   - Show Living Background animation
   - "Tap anywhere to talk"
   - Demo microphone permission request

3. READY: "You're all set!"
   - Show the AI Hub with gentle animation
   - "Tap anywhere to get started"
   - Mark user.isOnboarded = true

KEEP EXISTING:
- Brain dump entry
- AI categorization animation
- Task preview
- All the working logic

Just ADD the gesture/voice intro screens at the end.
```

---

### Step 7.10: Comprehensive Testing

**Goal**: Test everything before deployment.

**Agent**: Manual + Cursor

**Full Checklist**:
```
NAVIGATION
[ ] All swipe gestures
[ ] All return gestures
[ ] Deep links
[ ] Background/foreground

VOICE
[ ] Tap to listen
[ ] All voice commands
[ ] TTS responses
[ ] Error handling

DATA
[ ] Tasks CRUD
[ ] Focus sessions
[ ] Circles/challenges
[ ] Profile/stats

AI
[ ] Greetings personalized
[ ] Learning system
[ ] Unlocks work
[ ] Celebrationmodals

EDGE CASES
[ ] New user
[ ] Offline mode
[ ] Lots of data
[ ] Low battery
[ ] Interrupted operations

DEVICES
[ ] iPhone SE (small)
[ ] iPhone 15 Pro (large)
[ ] iPad (if supporting)
```

---

### Step 7.11: Fix All Bugs

**Goal**: Zero known bugs.

**Agent**: Cursor (Claude)

**Prompt**:
```
Here are the bugs found during testing:

[List all bugs from testing]

For each bug:
1. Identify root cause
2. Implement fix
3. Verify fix works
4. Check for regression

Prioritize:
1. Crashes
2. Data loss
3. Security issues
4. UX issues
5. Visual bugs
```

---

# PHASE 8: DEPLOYMENT
## Week 7

> With Supabase, there's no backend to deploy! Just configure production settings.

---

### Step 8.1: Supabase Production Setup

**Goal**: Configure Supabase for production.

**Agent**: Manual (Supabase Dashboard)

**Steps**:
```
1. Your Supabase project is already "production ready"
   - Supabase handles scaling automatically
   - SSL is enabled by default
   - Backups are automatic (Pro plan: point-in-time recovery)

2. Review Production Checklist (Supabase Dashboard → Settings):
   [ ] Database password is strong
   [ ] RLS enabled on all tables
   [ ] Email templates customized
   [ ] Redirect URLs configured for production

3. Upgrade plan if needed:
   - Free: 500MB database, 50K monthly active users
   - Pro ($25/mo): 8GB database, unlimited users, daily backups
   - For MVP launch, Free tier is usually sufficient

4. Set up production environment variables:
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
   # NEVER expose service_role key in frontend!
```

---

### Step 8.2: Deploy Edge Functions to Production

**Goal**: Ensure Edge Functions are deployed and configured.

**Agent**: Manual

**Commands**:
```bash
# Deploy all Edge Functions
supabase functions deploy ai-greeting
supabase functions deploy voice-command
supabase functions deploy send-push
supabase functions deploy calculate-unlocks

# Verify deployments
supabase functions list

# Check logs
supabase functions logs ai-greeting
```

**Set production secrets**:
```bash
# Via CLI
supabase secrets set OPENAI_API_KEY=sk-prod-xxx

# Or via Dashboard: Settings → Edge Functions → Secrets
```

---

### Step 8.3: Update Frontend for Production

**Goal**: Configure app for production environment.

**Agent**: Cursor (Claude)

**Prompt**:
```
Update frontend for production deployment.

1. Update app.json:
{
  "expo": {
    "name": "MYPA",
    "slug": "mypa",
    "version": "1.0.0",
    "scheme": "mypa",
    "ios": {
      "bundleIdentifier": "com.yourname.mypa",
      "buildNumber": "1",
      "supportsTablet": false,
      "infoPlist": {
        "NSMicrophoneUsageDescription": "MYPA uses the microphone to hear your voice commands",
        "NSSpeechRecognitionUsageDescription": "MYPA uses speech recognition to understand your voice"
      }
    }
  }
}

2. Create production .env:
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

3. Verify environment handling:
File: frontend/src/lib/supabase.ts
- Should use EXPO_PUBLIC_* variables
- No hardcoded development URLs

4. Test production build:
npx expo start --no-dev --minify
```

---

### Step 8.4: Apple Developer Setup

**Goal**: Apple Developer account ready.

**Agent**: Manual

**Steps**:
```
1. Apple Developer Account ($99/year)
   - developer.apple.com
   - Enroll as individual or organization

2. Create App ID:
   - Certificates, IDs & Profiles
   - New App ID
   - Bundle ID: com.yourname.mypa
   - Enable capabilities: Push Notifications, Sign In with Apple

3. Create Provisioning Profile:
   - App Store distribution
   - Select your App ID
   - Download and install

4. App Store Connect:
   - Create new app
   - Fill in metadata (name, description, category)
   - Upload screenshots (later)
```

---

### Step 8.5: App Store Privacy Requirements

**Goal**: Comply with Apple's App Tracking Transparency and privacy requirements.

**Agent**: Cursor (Claude)

**Prompt**:
```
Implement Apple's privacy requirements for App Store.

1. Privacy Nutrition Labels (App Store Connect):
Declare what data you collect:
- Name (for profile)
- Email (for account)
- Usage Data (for AI learning) - linked to identity
- Diagnostics (crashes) - not linked to identity

2. App Tracking Transparency (ATT):
File: frontend/src/services/tracking.ts
- We don't track for advertising, so ATT prompt not needed
- But add PrivacyInfo.xcprivacy file

3. Privacy Manifest (iOS 17+):
File: ios/MYPAiOSApp/PrivacyInfo.xcprivacy
Already exists - verify it declares:
- NSPrivacyAccessedAPITypes for UserDefaults
- No tracking domains

4. Data deletion capability:
Ensure Settings has "Delete Account" that:
- Deletes all user data from server
- Required by App Store since 2022

5. Privacy Policy:
File: PRIVACY_POLICY.md (already exists)
- Host at accessible URL
- Include what data collected, how used, how deleted
```

---

### Step 8.5.1: Sign In with Apple (If using social login)

**Goal**: Add Apple Sign-In if app has any social login.

**Agent**: Cursor (Claude)

**Prompt**:
```
Add Sign In with Apple to auth flow.

NOTE: If your app offers ANY third-party login (Google, Facebook),
Apple REQUIRES you to also offer Sign In with Apple.

If only email/password auth, this is optional but recommended.

Backend:
File: backend/src/routes/auth.routes.ts
- Add POST /api/auth/apple endpoint
- Verify Apple identity token
- Create or link user account

Frontend:
npm install expo-apple-authentication

File: frontend/src/screens/Auth/LoginScreen.tsx
- Add "Sign in with Apple" button
- Must be prominent (not hidden)
- Use Apple's button style guidelines

Implementation:
1. Request authentication from Apple
2. Get identity token + user info
3. Send to backend
4. Backend verifies with Apple servers
5. Create/return JWT

Handle:
- First time: Create account
- Returning: Link to existing account
- User hid email: Apple provides relay email
```

---

### Step 8.6: Configure EAS Build

**Goal**: Set up Expo Application Services for builds.

**Agent**: Manual + Cursor

**Commands**:
```bash
cd frontend

# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# This creates eas.json
```

**Update eas.json**:
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "your-app-id"
      }
    }
  }
}
```

---

### Step 8.7: Build iOS App

**Goal**: Create production iOS build.

**Agent**: Manual

**Commands**:
```bash
cd frontend

# Build for App Store
eas build --platform ios --profile production

# This will:
# - Build in the cloud
# - Sign with your credentials
# - Create .ipa file
# - Takes 15-30 minutes
```

**While waiting**:
- Prepare App Store screenshots
- Write App Store description
- Prepare privacy policy URL
- Prepare support URL

---

### Step 8.8: Prepare App Store Listing

**Goal**: Complete App Store Connect listing.

**Agent**: Manual

**Required Materials**:
```
1. App Name: "MYPA - AI Productivity Partner"

2. Subtitle: "Voice-First Task Management"

3. Description (4000 char max):
   Write compelling description of MYPA's voice-first approach,
   AI learning, and productivity features.

4. Keywords: productivity, AI, tasks, voice, focus, assistant

5. Screenshots:
   - 6.7" (iPhone 15 Pro Max): 1290x2796
   - 6.5" (iPhone 14 Plus): 1284x2778
   - 5.5" (iPhone 8 Plus): 1242x2208
   Create 4-8 screenshots showing key features

6. App Preview Video (optional but recommended):
   - 15-30 seconds
   - Show voice interaction, gesture navigation

7. Privacy Policy URL

8. Support URL

9. Category: Productivity

10. Age Rating: 4+ (no objectionable content)
```

---

### Step 8.9: Submit to App Store

**Goal**: Submit for review.

**Agent**: Manual

**Steps**:
```bash
# Submit build to App Store Connect
eas submit --platform ios --profile production

# Or manually upload in App Store Connect
```

**In App Store Connect**:
1. Select build
2. Add screenshots
3. Fill in metadata
4. Answer export compliance (No encryption = select No)
5. Answer content rights
6. Submit for review

**Review typically takes**:
- First submission: 24-48 hours
- Updates: 24 hours
- May require fixes if rejected

---

### Step 8.10: Post-Launch Setup

**Goal**: Monitoring and iteration.

**Agent**: Cursor (Claude)

**Prompt**:
```
Set up post-launch monitoring.

1. Error Tracking (Sentry):
   - Create Sentry project
   - Add @sentry/react-native
   - Configure in App.tsx
   - Test error reporting

2. Analytics (optional):
   - Consider Mixpanel or Amplitude
   - Track key events
   - User retention metrics

3. Crash Reporting:
   - Sentry handles this
   - Set up alerts for new crashes

4. Performance Monitoring:
   - Sentry performance
   - Track slow API calls

5. User Feedback:
   - Add in-app feedback option
   - Monitor App Store reviews
   - Respond to reviews

6. Backend Monitoring:
   - Railway logs
   - Set up alerts for errors
   - Monitor database performance
```

---

# SUMMARY

## Total Steps: 89

| Phase | Steps | Duration | Focus |
|-------|-------|----------|-------|
| 0: Audit & Prep | 6 | 2-3 days | Map existing code, feature flags |
| 1: Backend | 10 | 1 week | Voice API, AI endpoints, unlocks |
| 2: Database & Auth | 5 | 3-4 days | Migrations, auth verification |
| 3: Navigation & Screens | 10 | 1 week | Gesture nav, core screens, orb |
| 4: All Modals | 12 | 1 week | Task detail, circles, challenges, settings |
| 5: Voice System | 11 | 1 week | Realtime voice, orb integration, context |
| 6: AI Learning | 10 | 1 week | Events, user model, personalization |
| 7: Testing & Polish | 13 | 1 week | Performance, offline, deep links, a11y |
| 8: Deployment | 12 | 1 week | Backend deploy, App Store submission |

## Tech Stack Summary

```
┌─────────────────────────────────────────────────────────────┐
│                   MYPA STACK (PRODUCTION)                   │
├─────────────────────────────────────────────────────────────┤
│  FRONTEND                                                   │
│  ├── React Native + Expo 52                                │
│  ├── NativeWind (Tailwind CSS)                             │
│  ├── React Native Gesture Handler                          │
│  ├── React Native Reanimated                               │
│  ├── expo-av (Audio recording/playback)                    │
│  └── react-native-purchases (RevenueCat)                   │
├─────────────────────────────────────────────────────────────┤
│  BACKEND (Supabase - Complete)                             │
│  ├── PostgreSQL Database                                   │
│  ├── Supabase Auth (Email, Apple, Google)                  │
│  ├── Supabase Realtime (WebSockets)                        │
│  ├── Supabase Storage (images, files)                      │
│  └── Edge Functions (AI, Voice, Push)                      │
├─────────────────────────────────────────────────────────────┤
│  🎙️ VOICE (Friend-Quality)                                  │
│  ├── OpenAI Realtime API (WebSocket streaming)             │
│  │   └── Voice: 'ash' (warm, friendly)                     │
│  ├── Natural conversation flow                             │
│  ├── Instant responses (<500ms)                            │
│  └── Natural interruptions supported                       │
├─────────────────────────────────────────────────────────────┤
│  🤖 AI                                                       │
│  ├── OpenAI GPT-4 Turbo (Text completions)                 │
│  └── MYPA Personality (warm, human, friend-like)           │
├─────────────────────────────────────────────────────────────┤
│  💰 PAYMENTS                                                 │
│  └── RevenueCat (Subscriptions + IAP)                      │
├─────────────────────────────────────────────────────────────┤
│  📤 PUSH & BUILDS                                            │
│  ├── Expo Push Notifications                               │
│  └── EAS Build (App Store deployment)                      │
└─────────────────────────────────────────────────────────────┘
```

## App Store Readiness Checklist

```
TECHNICAL
[x] Voice system (OpenAI Realtime API - friend-quality)
[x] Gesture navigation  
[x] All core screens (NativeWind styled)
[x] All modals with proper flows
[x] Supabase backend (no server to manage!)
[x] Supabase Edge Functions for AI
[x] Push notifications
[x] In-app purchases (RevenueCat)
[x] Deep linking
[x] Real-time updates (Supabase Realtime)
[x] Error handling

COMPLIANCE
[x] Privacy Policy URL
[x] App Store privacy labels
[x] PrivacyInfo.xcprivacy
[x] Sign In with Apple (Supabase Auth)
[x] Data deletion capability
[x] Microphone permission handling
[x] Row Level Security (RLS)

POLISH
[x] Onboarding flow
[x] Loading states (skeletons)
[x] Empty states
[x] Accessibility (VoiceOver)
[x] App icon & splash
[x] Error boundaries

SUBMISSION
[x] Apple Developer account
[x] EAS Build configuration
[x] App Store Connect listing
[x] Screenshots
[x] Description & metadata
```

## Critical Path

```
Week 1: Phase 0 (Supabase + NativeWind setup)
Week 2: Phase 1 (Edge Functions) + Phase 2 (Data migration)
Week 3: Phase 3 (Gesture nav + Core screens)
Week 4: Phase 4 (All modals)
Week 5: Phase 5 (Voice system)
Week 6: Phase 6 (AI Learning)
Week 7: Phase 7 (Testing & Polish)
Week 8: Phase 8 (App Store submission)
Week 9: Buffer for App Store review + fixes
```

## Key Tips

1. **Test on real device** - Simulator misses voice/gesture issues
2. **Commit frequently** - Easy rollback
3. **Supabase first** - Get database schema and RLS policies right
4. **NativeWind className** - Use Tailwind classes, delete StyleSheet
5. **App Store prep early** - Screenshots, descriptions take time
6. **Buffer for review** - Apple may reject first submission
7. **Privacy is critical** - Apple rejects apps with privacy issues
8. **RLS is your security** - Test that users can't access others' data

---

## Supabase Advantages

✅ **No backend server to deploy or manage**
✅ **Built-in auth** with Apple/Google/Email
✅ **Real-time subscriptions** out of the box
✅ **Row Level Security** for data protection
✅ **Edge Functions** for AI/custom logic (runs globally)
✅ **Generous free tier** for MVP
✅ **Dashboard** for easy data management
✅ **Auto-generated API** from your schema

---

## After Launch

1. Monitor Supabase Dashboard for errors
2. Check Edge Function logs
3. Respond to user feedback
4. Plan v1.1 with improvements
5. Consider Android launch
6. Marketing and growth

---

Good luck! 🚀

You're building something unique - a voice-first AI productivity app.
With Supabase + React Native + NativeWind, you have a modern, scalable stack.

The hard work is worth it.
