# Agent Terminal Run – Errors and Fixes

Summary from terminal running `cd frontend && npm start` and static checks.

---

## 1. Runtime: 401 Invalid JWT (main issue)

Logs show:
- `[SupabaseApi] daily-brief error: 401 {"code": 401, "message": "Invalid JWT"}`
- checkUnlocks and voice-command also return non-2xx (same cause)

**Cause:** Edge Functions reject the app JWT. Usually:
- App and Edge Functions use different Supabase projects (wrong URL/anon key in .env), or
- JWT secret was rotated; user needs to sign out and sign in again.

**Fix:** Use the same project for app and functions; ensure .env has correct EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY; deploy functions to that project; sign out and sign in for a fresh token.

---

## 2. Runtime: "Text strings must be rendered within a <Text> component"

Seen in logs; component not pinpointed. Fix by wrapping the rendered string in a <Text> component (check stack trace).

---

## 3. TypeScript (npx tsc --noEmit)

- **Fixed:** UserModelContext.tsx – `UnlockItem` replaced with `UnlockStatus`.
- **Remaining (pre-existing):** LoadingOverlay (missing ../../styles), useMilestones/usePredictiveSuggestions (AuthContext), phase6Tests (test_event, flush). Main app and briefing code typecheck.

---

## 4. Warnings

expo-av deprecated; SafeAreaView deprecated – non-blocking.
