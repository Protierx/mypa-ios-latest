# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MYPA (My Personal AI) is a **voice-first** iOS productivity app built with React Native + Expo. The AI IS the app — not a feature bolted on. Every feature should be operable via voice.

## Build & Run Commands

All commands run from the `frontend/` directory:

```bash
cd frontend
npm install          # Install dependencies (runs patch-package via postinstall)
npm start            # Start Expo dev server
npm run ios          # Build and run on iOS simulator
npm run web          # Start web dev server on port 5000
```

**iOS native build:** Uses CocoaPods (`frontend/ios/Podfile`). After adding native dependencies: `cd ios && pod install`.

**Supabase local dev:** `supabase start` from project root (requires Supabase CLI). Edge functions: `supabase functions serve`.

There are no test or lint commands configured.

## Architecture

- **Frontend:** React Native 0.81.5 + Expo 54 + TypeScript (strict mode)
- **Backend:** Supabase (Auth, PostgreSQL with RLS, Realtime, Edge Functions)
- **AI/Voice:** OpenAI GPT-4 Turbo, Whisper (STT), TTS
- **The `backend/` folder is LEGACY Express.js — NEVER modify or extend it**

### Key Paths

| Purpose | Path |
|---------|------|
| App entry | `frontend/App.tsx` |
| Screens (v2 gesture flow) | `frontend/src/screens-v2/` |
| Components | `frontend/src/components/` |
| UI primitives | `frontend/src/components/ui/` |
| Services/API | `frontend/src/services/` |
| Custom hooks | `frontend/src/hooks/` (Supabase data hooks in `hooks/supabase/`) |
| Auth context | `frontend/src/contexts/SupabaseAuthContext.tsx` |
| Voice context | `frontend/src/contexts/VoiceContext.tsx` |
| Styles/theme | `frontend/src/styles/` |
| Supabase client | `frontend/src/lib/supabase.ts` |
| Supabase migrations | `supabase/migrations/` |
| Edge functions | `supabase/functions/` |
| Shared AI config | `supabase/functions/_shared/config.ts` |

### Gesture Navigation (v2)

The app uses a custom gesture navigator (`frontend/src/navigation-v2/`) instead of standard tab navigation:
- **Center:** AI Hub — Living Background orb + voice interface
- **Swipe left:** Tasks view
- **Swipe right:** Social view (Circles & Challenges)
- **Swipe down:** Profile view
- **Swipe up:** Focus Modal (full-screen overlay)

### State Management

- **Auth:** `SupabaseAuthContext` (React Context)
- **Voice:** `VoiceContext` with state machine (`idle → listening → processing → speaking → idle`)
- **User model:** `UserModelContext` for AI personalization
- **Server state:** Direct Supabase queries via custom hooks (no Redux/Zustand/MobX)
- **Local state:** `useState`/`useReducer` per component

### Voice Pipeline & Action System

Voice flow: User speaks → Whisper STT → GPT-4 intent parsing → JSON action → client executes via Supabase → TTS response.

**AI never writes data directly.** AI outputs JSON actions from the Action Registry; client validates and executes. If `confidence < 0.7`, ask user to confirm. Actions and model routing config live in `supabase/functions/_shared/config.ts`.

**Barge-in:** User can interrupt TTS → stop speaker → return to listening state.

### Database

19 tables total. RLS enabled on ALL tables — never bypass RLS or use service role on client. Always check `error` before using `data` from Supabase queries.

**Usage counters are computed from `event_log`**, not stored as mutable columns. Every user action must log to `event_log` (target: 95%+ coverage).

## Critical Rules

1. **TypeScript strict** — no `any` unless absolutely necessary
2. **No new dependencies** without explicit approval (bundle size matters for mobile)
3. **iOS-first design** — use `SafeAreaView`, respect notch/home indicator
4. **Supabase only** — never create Express routes; use Supabase client, Edge Functions, RLS, Realtime
5. **v1 is tap-to-talk only** — no wake word (deferred to v2+)
6. **Progressive unlock model** — features unlock over 5 levels; locked features are visible but disabled (never hidden)
7. **Event logging** — every user action emits an `event_log` entry
8. **Model routing is capability-based** (fast/smart/personalized/cached) — model IDs in `supabase/functions/_shared/config.ts`, NOT hardcoded in client
9. **Circles MVP** — daily cards show counts only; task titles NEVER shared to circles

## Styling

- Import from `@/styles/colors` and `@/styles/theme` — never hardcode colors
- Primary: `#B58CFF` (purple), Secondary: `#64C7FF` (blue)
- Use `StyleSheet.create()` at bottom of file — no inline styles except dynamic values
- Animations: React Native Reanimated (not Animated API), target 60fps on UI thread
- Living Background orb: Shopify Skia for GPU rendering
- Use path aliases: `@/components/`, `@/services/`, `@/styles/`, etc.

## XP & Gamification Constants (do not change)

```
TASK_COMPLETE: 10  TASK_HIGH_PRIORITY: 20  FOCUS_SESSION: 15  FOCUS_PERFECT: 25
STREAK_DAY: 5  STREAK_WEEK: 50  STREAK_MONTH: 200
CIRCLE_JOIN: 25  ASSIGNMENT: 30  CHALLENGE_WIN: 100
```

Streak multipliers: 3+ days 1.1x | 7+ days 1.25x | 14+ days 1.5x | 30+ days 2.0x
