/**
 * Wake Word Service — "Hey MYPA" Hotword Detection
 *
 * Uses Picovoice Porcupine for on-device wake word detection.
 * No audio is sent to the cloud until the wake word triggers.
 *
 * How it works:
 * 1. Porcupine runs a lightweight ML model on-device (~2MB, <1% CPU)
 * 2. Continuously listens for the trained keyword "Hey MYPA"
 * 3. When detected → fires `onDetected` callback → VoiceContext starts ElevenLabs session
 * 4. While ElevenLabs session is active, wake word detection is paused (avoids mic conflict)
 * 5. When session ends → wake word detection resumes automatically
 *
 * IMPORTANT: Picovoice modules are lazy-imported inside initialize() to avoid
 * crashing the app at module load time if native bindings aren't ready.
 *
 * Reference: docs/planning/ELEVENLABS_VOICE_MIGRATION_PLAN.md §12
 */

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Picovoice modules are loaded lazily in initialize() — NOT at top level.
// The native modules may not be available at import time (e.g. Expo Go,
// missing prebuild, or BuiltInKeyword enum being undefined at runtime).
// ---------------------------------------------------------------------------
type PorcupineInstance = {
  frameLength: number;
  sampleRate: number;
  process: (frame: number[]) => Promise<number>;
  delete: () => Promise<void>;
};

type VoiceProcessorType = {
  addFrameListener: (listener: (frame: number[]) => void | Promise<void>) => void;
  removeFrameListener: (listener: (frame: number[]) => void | Promise<void>) => void;
  addErrorListener: (listener: (error: Error) => void) => void;
  removeErrorListener: (listener: (error: Error) => void) => void;
  start: (frameLength: number, sampleRate: number) => Promise<void>;
  stop: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/**
 * Picovoice Access Key — required for on-device inference.
 * Get one free at https://console.picovoice.ai
 */
const PICOVOICE_ACCESS_KEY = 'KAq6oXeLa+8dNRfCjDa7BuUY0vOI5DXyusRhVqastBBwDbYUfUseaA==';

/**
 * Path to the custom "Hey MYPA" .ppn keyword model file in the assets directory.
 * Trained at https://console.picovoice.ai and placed in assets/.
 */
const CUSTOM_KEYWORD_ASSET_PATH = Platform.select({
  ios: 'hey-my-low_en_ios_v4_0_0.ppn',
}) as string;

/**
 * Default detection sensitivity (0.0 = fewest false positives, 1.0 = most sensitive).
 * 0.5 is a good balance for quiet environments. Users can adjust in Settings.
 */
const DEFAULT_SENSITIVITY = 0.5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WakeWordConfig {
  /** Picovoice access key (from console.picovoice.ai) */
  accessKey?: string;
  /** Path to custom .ppn keyword model file, or null for built-in */
  customKeywordPath?: string | null;
  /** Detection sensitivity 0.0–1.0 */
  sensitivity?: number;
  /** Callback fired when wake word is detected */
  onDetected: () => void;
  /** Optional error callback */
  onError?: (error: Error) => void;
}

export interface WakeWordState {
  isListening: boolean;
  isInitialized: boolean;
  sensitivity: number;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class WakeWordServiceImpl {
  private porcupine: PorcupineInstance | null = null;
  private voiceProcessor: VoiceProcessorType | null = null;
  private _isListening = false;
  private _isInitialized = false;
  private _sensitivity = DEFAULT_SENSITIVITY;
  private _error: string | null = null;
  private onDetected: (() => void) | null = null;
  private onError: ((error: Error) => void) | null = null;
  private _isPaused = false; // Paused while ElevenLabs session is active
  private _lastDetectionTs = 0;

  // -----------------------------------------------------------------------
  // Public getters
  // -----------------------------------------------------------------------

  get isListening(): boolean {
    return this._isListening;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  get sensitivity(): number {
    return this._sensitivity;
  }

  get error(): string | null {
    return this._error;
  }

  get state(): WakeWordState {
    return {
      isListening: this._isListening,
      isInitialized: this._isInitialized,
      sensitivity: this._sensitivity,
      error: this._error,
    };
  }

  // -----------------------------------------------------------------------
  // Initialize — create Porcupine engine
  // -----------------------------------------------------------------------

  async initialize(config: WakeWordConfig): Promise<void> {
    if (this._isInitialized) {
      console.log('[WakeWord] Already initialized');
      return;
    }

    const accessKey = config.accessKey || PICOVOICE_ACCESS_KEY;
    if (!accessKey || accessKey === '__PICOVOICE_ACCESS_KEY__') {
      const msg = 'Picovoice access key not configured. Get one at console.picovoice.ai';
      console.warn('[WakeWord]', msg);
      this._error = msg;
      config.onError?.(new Error(msg));
      return;
    }

    this.onDetected = config.onDetected;
    this.onError = config.onError || null;
    this._sensitivity = config.sensitivity ?? DEFAULT_SENSITIVITY;

    // Prefer: explicit path > default custom .ppn
    const keywordPath = config.customKeywordPath ?? CUSTOM_KEYWORD_ASSET_PATH ?? null;

    try {
      // Lazy-import Picovoice native modules — avoids crash if loaded at top level
      // before native bindings are ready (BuiltInKeyword enum is undefined at import time).
      const PorcupineModule = require('@picovoice/porcupine-react-native');
      const Porcupine = PorcupineModule.Porcupine ?? PorcupineModule.default;
      const VoiceProcessorModule = require('@picovoice/react-native-voice-processor');
      const VoiceProcessorRef = VoiceProcessorModule.VoiceProcessor ?? VoiceProcessorModule.default;

      if (!Porcupine || !VoiceProcessorRef) {
        throw new Error('Picovoice native modules not available');
      }

      if (keywordPath) {
        // Custom "Hey MYPA" keyword model file (trained at console.picovoice.ai)
        console.log('[WakeWord] Using custom keyword:', keywordPath);
        this.porcupine = await Porcupine.fromKeywordPaths(
          accessKey,
          [keywordPath],
          [this._sensitivity],
        );
      } else {
        // No custom .ppn available — cannot initialize
        throw new Error('No custom wake word .ppn file configured');
      }

      // VoiceProcessor is a singleton class — get the instance
      this.voiceProcessor = VoiceProcessorRef.instance ?? VoiceProcessorRef;
      this._isInitialized = true;
      this._error = null;
      console.log('[WakeWord] Porcupine initialized successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[WakeWord] Failed to initialize Porcupine:', error.message);
      this._error = error.message;
      this._isInitialized = false;
      this.onError?.(error);
    }
  }

  // -----------------------------------------------------------------------
  // Start — begin listening for wake word
  // -----------------------------------------------------------------------

  async start(): Promise<void> {
    if (!this._isInitialized || !this.porcupine) {
      console.warn('[WakeWord] Not initialized — call initialize() first');
      return;
    }

    if (this._isListening) {
      console.log('[WakeWord] Already listening');
      return;
    }

    // iOS-only: check if we're on a supported platform
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      console.warn('[WakeWord] Wake word not supported on this platform');
      return;
    }

    try {
      // Register frame listener with VoiceProcessor
      // Porcupine processes audio frames and calls our callback on detection
      if (this.voiceProcessor) {
        this.voiceProcessor.addFrameListener(this.handleFrame);
        this.voiceProcessor.addErrorListener(this.handleVoiceProcessorError);
        await this.voiceProcessor.start(
          this.porcupine.frameLength,
          this.porcupine.sampleRate,
        );
      }

      this._isListening = true;
      this._isPaused = false;
      this._error = null;
      console.log('[WakeWord] Listening for wake word...');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[WakeWord] Failed to start:', error.message);
      this._error = error.message;
      this.onError?.(error);
    }
  }

  // -----------------------------------------------------------------------
  // Stop — stop listening completely
  // -----------------------------------------------------------------------

  async stop(): Promise<void> {
    if (!this._isListening && !this._isPaused) return;

    try {
      if (this.voiceProcessor) {
        this.voiceProcessor.removeFrameListener(this.handleFrame);
        this.voiceProcessor.removeErrorListener(this.handleVoiceProcessorError);
        await this.voiceProcessor.stop();
      }
    } catch (err) {
      console.warn('[WakeWord] Error stopping VoiceProcessor:', err);
    }

    this._isListening = false;
    this._isPaused = false;
    console.log('[WakeWord] Stopped listening');
  }

  // -----------------------------------------------------------------------
  // Pause / Resume — for when ElevenLabs session takes the mic
  // -----------------------------------------------------------------------

  /**
   * Pause wake word detection while an ElevenLabs voice session is active.
   * The mic can't be shared between Porcupine and WebRTC simultaneously.
   */
  async pause(): Promise<void> {
    if (!this._isListening) return;

    try {
      if (this.voiceProcessor) {
        this.voiceProcessor.removeFrameListener(this.handleFrame);
        this.voiceProcessor.removeErrorListener(this.handleVoiceProcessorError);
        await this.voiceProcessor.stop();
      }
    } catch (err) {
      console.warn('[WakeWord] Error pausing:', err);
    }

    this._isListening = false;
    this._isPaused = true;
    console.log('[WakeWord] Paused (ElevenLabs session active)');
  }

  /**
   * Resume wake word detection after an ElevenLabs session ends.
   */
  async resume(): Promise<void> {
    if (!this._isInitialized || !this.porcupine) return;
    if (this._isListening) return;

    // If restart happens too quickly after WebRTC teardown, the mic can still
    // be busy. Retry a few times before giving up to avoid "works once" stalls.
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.start();
      if (this._isListening) {
        this._isPaused = false;
        console.log('[WakeWord] Resumed');
        return;
      }
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 250 * attempt));
      }
    }

    // Keep paused=true so future resume() calls can still recover.
    this._isPaused = true;
    console.warn('[WakeWord] Resume failed after retries; will retry on next trigger');
  }

  // -----------------------------------------------------------------------
  // Sensitivity — adjustable at runtime
  // -----------------------------------------------------------------------

  /**
   * Update detection sensitivity. Requires re-initialization of the engine
   * since Porcupine bakes sensitivity into the model at creation time.
   */
  async setSensitivity(sensitivity: number): Promise<void> {
    const clamped = Math.max(0, Math.min(1, sensitivity));
    if (clamped === this._sensitivity) return;

    this._sensitivity = clamped;

    // If running, restart with new sensitivity
    if (this._isInitialized && this.onDetected) {
      const wasListening = this._isListening;
      await this.destroy();
      await this.initialize({
        sensitivity: clamped,
        onDetected: this.onDetected,
        onError: this.onError || undefined,
      });
      if (wasListening) await this.start();
    }
  }

  // -----------------------------------------------------------------------
  // Destroy — release all resources
  // -----------------------------------------------------------------------

  async destroy(): Promise<void> {
    await this.stop();

    if (this.porcupine) {
      try {
        await this.porcupine.delete();
      } catch (err) {
        console.warn('[WakeWord] Error deleting Porcupine:', err);
      }
      this.porcupine = null;
    }

    this._isInitialized = false;
    this._error = null;
    console.log('[WakeWord] Destroyed');
  }

  // -----------------------------------------------------------------------
  // Private: audio frame handler
  // -----------------------------------------------------------------------

  /**
   * Called by VoiceProcessor for each audio frame.
   * Porcupine processes the frame and returns the keyword index if detected.
   * -1 means no detection, 0+ means keyword at that index was detected.
   */
  private handleFrame = async (frame: number[]): Promise<void> => {
    if (!this.porcupine || !this._isListening) return;

    try {
      const keywordIndex = await this.porcupine.process(frame);

      if (keywordIndex >= 0) {
        const now = Date.now();
        if (now - this._lastDetectionTs < 1500) return;
        this._lastDetectionTs = now;
        console.log('[WakeWord] 🎤 Wake word detected! (index:', keywordIndex, ')');
        // Immediately pause Porcupine so mic handoff to WebRTC is reliable.
        // VoiceContext will resume wake word after the session ends.
        this.pause().catch(() => {});
        // Heavy haptic — user feels the wake word land
        try {
          const Haptics = await import('expo-haptics');
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch {}
        this.onDetected?.();
      }
    } catch (err) {
      // Don't spam errors — Porcupine can throw on individual frames
      // if the engine is in a bad state. Log once and continue.
      if (err instanceof Error && err.constructor.name === 'PorcupineError') {
        console.warn('[WakeWord] Porcupine process error:', err.message);
      }
    }
  };

  /**
   * Called when VoiceProcessor encounters an error (e.g., mic access denied).
   */
  private handleVoiceProcessorError = (error: Error): void => {
    console.error('[WakeWord] VoiceProcessor error:', error.message);
    this._error = error.message;
    this.onError?.(error);
  };
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/**
 * Singleton wake word service instance.
 * Used by VoiceContext to start/stop detection based on user settings.
 */
export const wakeWordService = new WakeWordServiceImpl();

export default wakeWordService;
