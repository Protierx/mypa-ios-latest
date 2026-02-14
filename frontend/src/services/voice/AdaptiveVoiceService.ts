/**
 * Adaptive Voice Personality Service — Step 17
 *
 * Dynamically adjusts ElevenLabs voice settings based on:
 * - Time of day (17a): energetic mornings, balanced afternoons, calm evenings
 * - Mood / overwhelm score (17b): calmer when stressed, enthusiastic when flowing
 * - Celebration boost (17b): temporary enthusiasm after task completion
 *
 * These settings control ElevenLabs TTS parameters:
 * - **stability** — lower = more expressive, higher = more consistent
 * - **similarity_boost** — how close to the original voice timbre
 * - **style** — how dramatic / exaggerated the delivery
 *
 * Reference: ELEVENLABS_VOICE_MIGRATION_PLAN.md — Step 17
 */

// ============================================================================
// Types
// ============================================================================

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export interface AdaptiveVoiceContext {
  /** 0..23 hour of day */
  hour?: number;
  /** User's overwhelm score from user_model (0.0 – 1.0) */
  overwhelmScore?: number;
  /** User's 7-day completion rate from user_model (0.0 – 1.0) */
  completionRate?: number;
  /** Whether to apply a short enthusiasm boost (e.g. just completed a task) */
  celebrationBoost?: boolean;
}

// ============================================================================
// Time-of-Day Presets (17a)
// ============================================================================

/** Energetic morning: more expressive voice, higher style exaggeration */
const MORNING_SETTINGS: VoiceSettings = {
  stability: 0.4,
  similarity_boost: 0.7,
  style: 0.6,
  use_speaker_boost: true,
};

/** Balanced afternoon: neutral defaults */
const AFTERNOON_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.5,
  use_speaker_boost: true,
};

/** Calm evening: more stable, less dramatic */
const EVENING_SETTINGS: VoiceSettings = {
  stability: 0.7,
  similarity_boost: 0.8,
  style: 0.3,
  use_speaker_boost: true,
};

// ============================================================================
// Core Logic
// ============================================================================

/**
 * Get the time-of-day base voice settings (17a).
 */
function getTimeOfDaySettings(hour: number): VoiceSettings {
  if (hour >= 5 && hour < 12) return { ...MORNING_SETTINGS };
  if (hour >= 12 && hour < 18) return { ...AFTERNOON_SETTINGS };
  return { ...EVENING_SETTINGS };
}

/**
 * Apply mood-responsive adjustments on top of time-of-day settings (17b).
 *
 * - High overwhelm → push stability up (calmer), reduce style (less dramatic)
 * - Low overwhelm + high completion → push stability down (more expressive),
 *   increase style (more enthusiastic / celebrating momentum)
 */
function applyMoodAdjustment(
  settings: VoiceSettings,
  overwhelmScore: number,
  completionRate: number,
): VoiceSettings {
  const s = { ...settings };

  if (overwhelmScore > 0.7) {
    // User is stressed — be calmer and gentler
    s.stability = Math.min(1.0, s.stability + 0.15);
    s.style = Math.max(0.0, s.style - 0.15);
    s.similarity_boost = Math.min(1.0, s.similarity_boost + 0.05);
  } else if (overwhelmScore < 0.3 && completionRate > 0.7) {
    // User is in a great flow — more energy and expression
    s.stability = Math.max(0.0, s.stability - 0.1);
    s.style = Math.min(1.0, s.style + 0.1);
  }

  return s;
}

/**
 * Apply a short-lived celebration boost (17b).
 * Used right after a task completion to add enthusiasm.
 */
function applyCelebrationBoost(settings: VoiceSettings): VoiceSettings {
  return {
    ...settings,
    stability: Math.max(0.0, settings.stability - 0.15),
    style: Math.min(1.0, settings.style + 0.2),
    similarity_boost: settings.similarity_boost,
    use_speaker_boost: true,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Compute adaptive voice settings based on all available context.
 *
 * Call this at session start and when context changes (e.g. after task
 * completion). The returned settings can be:
 * - Passed to the TTS edge function as `voice_settings`
 * - Passed as `overrides.tts` in ElevenLabs ConvAI `startSession()`
 */
export function getAdaptiveVoiceSettings(ctx: AdaptiveVoiceContext = {}): VoiceSettings {
  const hour = ctx.hour ?? new Date().getHours();

  // 1. Start with time-of-day base
  let settings = getTimeOfDaySettings(hour);

  // 2. Layer mood-responsive adjustments
  if (ctx.overwhelmScore !== undefined) {
    settings = applyMoodAdjustment(
      settings,
      ctx.overwhelmScore,
      ctx.completionRate ?? 0.5,
    );
  }

  // 3. Celebration boost (short-lived, highest priority)
  if (ctx.celebrationBoost) {
    settings = applyCelebrationBoost(settings);
  }

  return settings;
}

/**
 * Convenience: return a label describing the current voice "mood" for logging.
 */
export function getVoiceMoodLabel(ctx: AdaptiveVoiceContext = {}): string {
  if (ctx.celebrationBoost) return 'celebration';
  const hour = ctx.hour ?? new Date().getHours();
  const overwhelm = ctx.overwhelmScore ?? 0;

  if (overwhelm > 0.7) return 'gentle';
  if (overwhelm < 0.3 && (ctx.completionRate ?? 0) > 0.7) return 'energetic';
  if (hour >= 5 && hour < 12) return 'morning-energetic';
  if (hour >= 12 && hour < 18) return 'afternoon-balanced';
  return 'evening-calm';
}
