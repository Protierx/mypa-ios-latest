/**
 * Scribe Service — ElevenLabs Scribe v2 Realtime STT
 *
 * Provides real-time speech-to-text using the ElevenLabs Scribe v2 Realtime
 * API over WebSocket. Audio is captured via the Picovoice VoiceProcessor
 * (same mechanism as WakeWordService) and streamed as base64 PCM chunks.
 *
 * Two commit strategies:
 *   • VAD (voice activity detection) — Scribe auto-commits on silence
 *   • Manual — caller triggers commit() explicitly
 *
 * Use cases:
 *   1. Discreet mode — speak instead of type, Scribe transcribes → submitText()
 *   2. Brain dump — dictate freely, committed transcripts accumulate
 *   3. Live captions — (future) display what the user is saying in real-time
 *
 * IMPORTANT: VoiceProcessor is a singleton — when Scribe is active, wake word
 * detection must be paused (same as during ConvAI sessions).
 *
 * Reference:
 *   API: https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime
 *   Events: https://elevenlabs.io/docs/developers/guides/cookbooks/speech-to-text/realtime/event-reference
 */

import { supabase } from '../../lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Picovoice VoiceProcessor — lazy-imported to avoid native module crashes
// ---------------------------------------------------------------------------
type VoiceProcessorType = {
  addFrameListener: (listener: (frame: number[]) => void | Promise<void>) => void;
  removeFrameListener: (listener: (frame: number[]) => void | Promise<void>) => void;
  addErrorListener: (listener: (error: Error) => void) => void;
  removeErrorListener: (listener: (error: Error) => void) => void;
  start: (frameLength: number, sampleRate: number) => Promise<void>;
  stop: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** WebSocket endpoint for Scribe v2 Realtime */
const SCRIBE_WSS_URL = 'wss://api.elevenlabs.io/v1/speech-to-text/realtime';

/** Model ID for Scribe v2 Realtime */
const SCRIBE_MODEL_ID = 'scribe_v2_realtime';

/** PCM sample rate — VoiceProcessor captures at 16kHz */
const SAMPLE_RATE = 16_000;

/**
 * VoiceProcessor frame length (samples per frame).
 * 512 samples @ 16kHz = 32ms per frame — matches Porcupine default.
 */
const FRAME_LENGTH = 512;

/** Audio format matching PCM 16-bit 16kHz mono */
const AUDIO_FORMAT = 'pcm_16000';

/**
 * Buffer N frames before sending to reduce WebSocket message overhead.
 * 4 frames × 32ms = ~128ms of audio per message — within the 0.1–1s
 * best-practice range (21h) for smooth streaming.
 */
const FRAMES_PER_CHUNK = 4;

/**
 * Maximum frames to buffer before force-flushing (21h safety guard).
 * 32 frames × 32ms = ~1.024s — caps at the 1s upper bound so we never
 * trigger a `chunk_size_exceeded` error even if the WebSocket stalls briefly.
 */
const MAX_FRAMES_PER_FLUSH = 32;

/**
 * Clipping detection threshold (21h). If more than this fraction of
 * samples in a chunk are at ±32767 the mic gain is likely too high.
 * We log a warning so the issue surfaces in diagnostics.
 */
const CLIPPING_WARN_FRACTION = 0.05;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScribeCommitStrategy = 'vad' | 'manual';

export interface ScribeConfig {
  /** Commit strategy: 'vad' (auto-commit on silence) or 'manual' (caller commits) */
  commitStrategy?: ScribeCommitStrategy;
  /** Language code (ISO 639-1). Omit for auto-detection. */
  languageCode?: string;
  /** Whether to receive word-level timestamps in committed transcripts */
  includeTimestamps?: boolean;
  /** VAD silence threshold in seconds (0.3–3.0). Default: 1.5 */
  vadSilenceThreshold?: number;
  /** VAD voice activity threshold (0.1–0.9). Lower = more sensitive. Default: 0.4 */
  vadThreshold?: number;
  /** Minimum speech duration in ms before VAD considers it speech (50–2000). Default: 100 */
  minSpeechDurationMs?: number;
  /** Minimum silence duration in ms before VAD commits (50–2000). Default: 100 */
  minSilenceDurationMs?: number;
  /**
   * Previous text context (≤50 chars) sent with the first audio chunk.
   * Improves accuracy by giving the model conversational context —
   * e.g. the agent's last response or the last committed transcript.
   */
  previousText?: string;
  /** Called with live (partial) transcript as user speaks */
  onPartialTranscript?: (text: string) => void;
  /** Called when a segment is committed (final transcript) */
  onCommittedTranscript?: (text: string) => void;
  
  /** Called with committed transcript + word-level timestamps */
  onCommittedTranscriptWithTimestamps?: (data: ScribeTimestampData) => void;
  /** Called when the WebSocket session starts */
  onSessionStarted?: (sessionId: string) => void;
  /** Called on error (WebSocket close, API error, etc.) */
  onError?: (error: ScribeError) => void;
  /** Called when connection state changes */
  onStateChange?: (state: ScribeState) => void;
}

export interface ScribeTimestampData {
  text: string;
  languageCode?: string;
  words: ScribeWord[];
}

export interface ScribeWord {
  text: string;
  start: number;
  end: number;
  type: 'word' | 'spacing' | 'audio_event';
}

export interface ScribeError {
  type: string;
  message: string;
}

export type ScribeState = 'idle' | 'connecting' | 'connected' | 'error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a VoiceProcessor PCM frame (number[] of 16-bit integers)
 * to a base64-encoded byte string for the Scribe API.
 *
 * Each sample is written as a 16-bit little-endian integer (2 bytes),
 * then the entire buffer is base64-encoded.
 *
 * Also checks for audio clipping (21h): if >5% of samples are at the
 * ±32767 ceiling the mic gain is likely too high.
 */
function pcmFramesToBase64(frames: number[][]): string {
  const totalSamples = frames.reduce((sum, f) => sum + f.length, 0);
  const buffer = new ArrayBuffer(totalSamples * 2);
  const view = new DataView(buffer);
  let offset = 0;
  let clippedCount = 0;
  for (const frame of frames) {
    for (let i = 0; i < frame.length; i++) {
      // Clamp to 16-bit range
      const sample = Math.max(-32768, Math.min(32767, frame[i]));
      if (sample === 32767 || sample === -32768) clippedCount++;
      view.setInt16(offset, sample, true); // little-endian
      offset += 2;
    }
  }

  // Clipping warning (21h) — only log occasionally to avoid spam
  if (totalSamples > 0 && clippedCount / totalSamples > CLIPPING_WARN_FRACTION) {
    console.warn(
      `[Scribe] Audio clipping detected: ${((clippedCount / totalSamples) * 100).toFixed(1)}% of samples at ceiling — mic gain may be too high`,
    );
  }

  // Convert bytes to base64 using Latin1 string (safe for 0–255 byte values)
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Invoke an edge function with automatic 401 retry (refresh session once).
 */
async function invokeWithAuth<T = unknown>(
  fnName: string,
  options?: { body?: Record<string, unknown> },
): Promise<{ data: T | null; error: FunctionsHttpError | Error | null }> {
  const first = await supabase.functions.invoke(fnName, options);
  if (!first.error) return first as { data: T; error: null };

  if (first.error instanceof FunctionsHttpError && first.error.context?.status === 401) {
    const { error: refreshErr } = await supabase.auth.refreshSession();
    if (!refreshErr) {
      return (await supabase.functions.invoke(fnName, options)) as {
        data: T;
        error: FunctionsHttpError | null;
      };
    }
  }
  return first as { data: null; error: FunctionsHttpError | Error };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class ScribeServiceImpl {
  private ws: WebSocket | null = null;
  private voiceProcessor: VoiceProcessorType | null = null;
  private config: ScribeConfig = {};
  private _state: ScribeState = 'idle';
  private _sessionId: string | null = null;

  /** Buffer frames to reduce WebSocket message count */
  private frameBuffer: number[][] = [];

  /** Full committed transcript accumulator (brain dump mode) */
  private _fullTranscript = '';

  /** Latest partial transcript (live preview) */
  private _partialTranscript = '';

  /**
   * Previous text context sent with the first audio chunk only (21e).
   * Cleared after the first send. Improves transcription accuracy by
   * giving the model conversational context.
   */
  private _previousText: string | null = null;

  /** Whether the first audio chunk has been sent (for previous_text injection) */
  private _firstChunkSent = false;

  /** Number of consecutive auth retries (max 2) — reset on successful connect */
  private _authRetryCount = 0;
  private static readonly MAX_AUTH_RETRIES = 2;

  /** Number of consecutive session restarts (max 3) — reset when caller disconnects */
  private _sessionRestartCount = 0;
  private static readonly MAX_SESSION_RESTARTS = 3;

  /** Whether a reconnection is in progress (prevents concurrent reconnects) */
  private _isReconnecting = false;

  // -----------------------------------------------------------------------
  // Public getters
  // -----------------------------------------------------------------------

  get state(): ScribeState {
    return this._state;
  }

  get isConnected(): boolean {
    return this._state === 'connected';
  }

  get sessionId(): string | null {
    return this._sessionId;
  }

  /** Full accumulated transcript from all committed segments */
  get fullTranscript(): string {
    return this._fullTranscript;
  }

  /** Latest partial (in-progress) transcript */
  get partialTranscript(): string {
    return this._partialTranscript;
  }

  // -----------------------------------------------------------------------
  // Connect — fetch token, open WebSocket, start audio capture
  // -----------------------------------------------------------------------

  async connect(config: ScribeConfig = {}): Promise<void> {
    if (this._state === 'connected' || this._state === 'connecting') {
      console.log('[Scribe] Already connected or connecting');
      return;
    }

    this.config = config;
    this._fullTranscript = '';
    this._partialTranscript = '';
    this._previousText = config.previousText?.slice(0, 50) || null;
    this._firstChunkSent = false;
    this._authRetryCount = 0;
    this._sessionRestartCount = 0;
    this._isReconnecting = false;
    this.frameBuffer = [];
    this.setState('connecting');

    try {
      await this.connectInternal();
      console.log('[Scribe] Connected and streaming audio');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[Scribe] Connection failed:', error.message);
      this.setState('error');
      this.config.onError?.({ type: 'connection_error', message: error.message });
      // Clean up on failure
      this.cleanupWebSocket();
      await this.stopAudioCapture();
    }
  }

  /**
   * Internal connect — fetch token, open WebSocket, start audio capture.
   * Shared by connect() and smart reconnect flows.
   */
  private async connectInternal(): Promise<void> {
    // 1. Fetch single-use token from our edge function
    const { data, error } = await invokeWithAuth<{ token: string }>('scribe-token');
    if (error || !data?.token) {
      throw new Error(error?.message || 'Failed to get Scribe token');
    }
    const token = data.token;
    console.log('[Scribe] Token obtained');

    // 2. Build WebSocket URL with query parameters
    const config = this.config;
    const params = new URLSearchParams({
      model_id: SCRIBE_MODEL_ID,
      token,
      audio_format: AUDIO_FORMAT,
      commit_strategy: config.commitStrategy || 'vad',
    });
    if (config.includeTimestamps) {
      params.set('include_timestamps', 'true');
    }
    if (config.languageCode) {
      params.set('language_code', config.languageCode);
    }
    if (config.vadSilenceThreshold != null) {
      params.set('vad_silence_threshold_secs', String(config.vadSilenceThreshold));
    }
    if (config.vadThreshold != null) {
      params.set('vad_threshold', String(config.vadThreshold));
    }
    if (config.minSpeechDurationMs != null) {
      params.set('min_speech_duration_ms', String(config.minSpeechDurationMs));
    }
    if (config.minSilenceDurationMs != null) {
      params.set('min_silence_duration_ms', String(config.minSilenceDurationMs));
    }

    const wsUrl = `${SCRIBE_WSS_URL}?${params.toString()}`;

    // 3. Open WebSocket connection
    await this.openWebSocket(wsUrl);

    // 4. Start audio capture via VoiceProcessor (skip if already capturing — reconnect)
    if (!this.voiceProcessor) {
      await this.startAudioCapture();
    }
  }

  // -----------------------------------------------------------------------
  // Disconnect — tear down WebSocket + audio capture
  // -----------------------------------------------------------------------

  async disconnect(): Promise<void> {
    console.log('[Scribe] Disconnecting');

    // Flush any remaining buffered frames before closing
    this.flushFrameBuffer(false);

    await this.stopAudioCapture();
    this.cleanupWebSocket();

    this._sessionId = null;
    this._isReconnecting = false;
    this.frameBuffer = [];
    this.setState('idle');
  }

  // -----------------------------------------------------------------------
  // Reconnect — smart recovery for auth_error + session_time_limit (21g)
  // -----------------------------------------------------------------------

  /**
   * Tear down the current WebSocket (keeping audio capture alive) and
   * reconnect with a fresh token. Preserves fullTranscript across restarts.
   */
  private async reconnect(): Promise<void> {
    if (this._isReconnecting) return;
    this._isReconnecting = true;

    console.log('[Scribe] Reconnecting...');
    this.setState('connecting');

    // Close old WebSocket only (keep VoiceProcessor running)
    this.cleanupWebSocket();
    this.frameBuffer = [];

    try {
      await this.connectInternal();
      this._isReconnecting = false;
      console.log('[Scribe] Reconnected successfully');
    } catch (err) {
      this._isReconnecting = false;
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[Scribe] Reconnect failed:', error.message);
      this.setState('error');
      this.config.onError?.({ type: 'reconnect_failed', message: error.message });
      // Full cleanup — reconnect failed
      this.cleanupWebSocket();
      await this.stopAudioCapture();
      this.setState('idle');
    }
  }

  // -----------------------------------------------------------------------
  // Commit — manually commit the current segment (manual mode only)
  // -----------------------------------------------------------------------

  commit(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[Scribe] Cannot commit — WebSocket not open');
      return;
    }

    // Flush buffered audio with commit flag
    this.flushFrameBuffer(true);
    console.log('[Scribe] Manual commit sent');
  }

  // -----------------------------------------------------------------------
  // Reset transcript — clear accumulated text
  // -----------------------------------------------------------------------

  resetTranscript(): void {
    this._fullTranscript = '';
    this._partialTranscript = '';
  }

  // -----------------------------------------------------------------------
  // Private: WebSocket management
  // -----------------------------------------------------------------------

  private openWebSocket(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      let resolved = false;

      // Timeout if connection takes too long
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.close();
          reject(new Error('WebSocket connection timed out'));
        }
      }, 15_000);

      ws.onopen = () => {
        console.log('[Scribe] WebSocket opened');
        // Wait for session_started message to resolve
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          this.handleMessage(msg);

          // Resolve on session_started
          if (!resolved && msg.message_type === 'session_started') {
            resolved = true;
            clearTimeout(timeout);
            resolve();
          }
        } catch (parseErr) {
          console.warn('[Scribe] Failed to parse message:', parseErr);
        }
      };

      ws.onerror = (event) => {
        console.error('[Scribe] WebSocket error:', event);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(new Error('WebSocket connection error'));
        }
      };

      ws.onclose = (event) => {
        console.log(`[Scribe] WebSocket closed: code=${event.code} reason=${event.reason}`);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(new Error(`WebSocket closed unexpectedly: ${event.reason || event.code}`));
        }
        // If we were connected, transition to idle
        if (this._state === 'connected') {
          this.setState('idle');
          this.stopAudioCapture().catch(() => {});
        }
      };

      this.ws = ws;
    });
  }

  private cleanupWebSocket(): void {
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
      } catch { /* ignore */ }
      this.ws = null;
    }
  }

  // -----------------------------------------------------------------------
  // Private: message handling
  // -----------------------------------------------------------------------

  private handleMessage(msg: Record<string, unknown>): void {
    switch (msg.message_type) {
      case 'session_started': {
        this._sessionId = msg.session_id as string;
        this.setState('connected');
        this.config.onSessionStarted?.(this._sessionId);
        console.log(`[Scribe] Session started: ${this._sessionId}`);
        break;
      }

      case 'partial_transcript': {
        const text = msg.text as string;
        this._partialTranscript = text;
        this.config.onPartialTranscript?.(text);
        break;
      }

      case 'committed_transcript': {
        const text = msg.text as string;
        // Accumulate committed segments with space separator
        if (this._fullTranscript && text) {
          this._fullTranscript += ' ' + text;
        } else if (text) {
          this._fullTranscript = text;
        }
        this._partialTranscript = '';
        this.config.onCommittedTranscript?.(text);
        break;
      }

      case 'committed_transcript_with_timestamps': {
        const data: ScribeTimestampData = {
          text: msg.text as string,
          languageCode: msg.language_code as string | undefined,
          words: (msg.words as ScribeWord[]) || [],
        };
        this.config.onCommittedTranscriptWithTimestamps?.(data);
        break;
      }

      // All error message types from the API
      case 'auth_error':
      case 'quota_exceeded':
      case 'commit_throttled':
      case 'insufficient_audio_activity':
      case 'session_time_limit_exceeded':
      case 'transcriber_error':
      case 'input_error':
      case 'error':
      case 'unaccepted_terms':
      case 'rate_limited':
      case 'queue_overflow':
      case 'resource_exhausted':
      case 'chunk_size_exceeded': {
        const errorMsg = (msg.message as string) || (msg.error as string) || msg.message_type as string;
        console.error(`[Scribe] Error (${msg.message_type}):`, errorMsg);

        const errorType = msg.message_type as string;

        // ---- Smart Recovery (Step 21g) ----

        // auth_error → fetch new token and reconnect (max 2 retries)
        if (errorType === 'auth_error') {
          if (this._authRetryCount < ScribeServiceImpl.MAX_AUTH_RETRIES && !this._isReconnecting) {
            this._authRetryCount++;
            console.log(`[Scribe] Auth error — reconnecting (attempt ${this._authRetryCount}/${ScribeServiceImpl.MAX_AUTH_RETRIES})`);
            this.reconnect().catch(() => {});
            return; // Don't fire onError yet — reconnect will handle it
          }
          // Max retries exhausted — fall through to fatal disconnect
          console.error('[Scribe] Auth error — max retries exhausted');
        }

        // session_time_limit_exceeded → seamlessly restart with transcript continuity
        if (errorType === 'session_time_limit_exceeded') {
          if (this._sessionRestartCount < ScribeServiceImpl.MAX_SESSION_RESTARTS && !this._isReconnecting) {
            this._sessionRestartCount++;
            console.log(`[Scribe] Session time limit — restarting (${this._sessionRestartCount}/${ScribeServiceImpl.MAX_SESSION_RESTARTS})`);
            // Preserve accumulated transcript and use tail as previousText for continuity
            this._previousText = this._fullTranscript.slice(-50) || null;
            this._firstChunkSent = false;
            this.reconnect().catch(() => {});
            return; // Don't fire onError — seamless restart
          }
          console.error('[Scribe] Session time limit — max restarts exhausted');
        }

        // quota_exceeded → disconnect with specific error for VoiceContext fallback
        if (errorType === 'quota_exceeded') {
          this.config.onError?.({
            type: 'quota_exceeded',
            message: 'Transcription quota reached. Falling back to standard input.',
          });
          this.disconnect().catch(() => {});
          return;
        }

        // Non-recoverable errors — fire onError and disconnect
        this.config.onError?.({ type: errorType, message: errorMsg });

        // Fatal errors — disconnect
        const fatalErrors = [
          'auth_error',
          'session_time_limit_exceeded',
          'unaccepted_terms',
          'resource_exhausted',
          'insufficient_audio_activity',
        ];
        if (fatalErrors.includes(errorType)) {
          this.disconnect().catch(() => {});
        }
        break;
      }

      default:
        console.log('[Scribe] Unknown message type:', msg.message_type);
    }
  }

  // -----------------------------------------------------------------------
  // Private: Audio capture via VoiceProcessor
  // -----------------------------------------------------------------------

  private async startAudioCapture(): Promise<void> {
    try {
      // Lazy-import VoiceProcessor (same pattern as WakeWordService)
      const VoiceProcessorModule = require('@picovoice/react-native-voice-processor');
      const VoiceProcessorRef = VoiceProcessorModule.VoiceProcessor ?? VoiceProcessorModule.default;

      if (!VoiceProcessorRef) {
        throw new Error('VoiceProcessor native module not available');
      }

      this.voiceProcessor = VoiceProcessorRef.instance ?? VoiceProcessorRef;

      this.voiceProcessor!.addFrameListener(this.handleAudioFrame);
      this.voiceProcessor!.addErrorListener(this.handleAudioError);
      await this.voiceProcessor!.start(FRAME_LENGTH, SAMPLE_RATE);

      console.log('[Scribe] Audio capture started (VoiceProcessor)');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[Scribe] Failed to start audio capture:', error.message);
      throw error;
    }
  }

  private async stopAudioCapture(): Promise<void> {
    if (!this.voiceProcessor) return;

    try {
      this.voiceProcessor.removeFrameListener(this.handleAudioFrame);
      this.voiceProcessor.removeErrorListener(this.handleAudioError);
      await this.voiceProcessor.stop();
    } catch (err) {
      console.warn('[Scribe] Error stopping audio capture:', err);
    }
    this.voiceProcessor = null;
  }

  /**
   * Called by VoiceProcessor for each PCM audio frame.
   * Buffers frames and sends in batches to reduce WebSocket overhead.
   * Includes clipping detection (21h) and max-chunk safety cap.
   */
  private handleAudioFrame = (frame: number[]): void => {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.frameBuffer.push(frame);

    // Flush at normal batch size, or force-flush at max cap (21h safety)
    if (this.frameBuffer.length >= FRAMES_PER_CHUNK) {
      // Cap to MAX_FRAMES_PER_FLUSH to stay within 1s best-practice upper bound
      if (this.frameBuffer.length > MAX_FRAMES_PER_FLUSH) {
        console.warn(`[Scribe] Frame buffer overflow (${this.frameBuffer.length} frames) — trimming to ${MAX_FRAMES_PER_FLUSH}`);
        this.frameBuffer = this.frameBuffer.slice(-MAX_FRAMES_PER_FLUSH);
      }
      this.flushFrameBuffer(false);
    }
  };

  /**
   * Flush buffered PCM frames to the WebSocket as a single base64 chunk.
   */
  private flushFrameBuffer(commit: boolean): void {
    if (this.frameBuffer.length === 0 && !commit) return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const audioBase64 = this.frameBuffer.length > 0
      ? pcmFramesToBase64(this.frameBuffer)
      : '';
    this.frameBuffer = [];

    const message: Record<string, unknown> = {
      message_type: 'input_audio_chunk',
      audio_base_64: audioBase64,
    };

    // Include previous_text context in the first chunk only (21e)
    if (!this._firstChunkSent && this._previousText) {
      message.previous_text = this._previousText;
      this._previousText = null;
      this._firstChunkSent = true;
    } else if (!this._firstChunkSent) {
      this._firstChunkSent = true;
    }

    if (commit) {
      message.commit = true;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (err) {
      console.warn('[Scribe] Failed to send audio chunk:', err);
    }
  }

  private handleAudioError = (error: Error): void => {
    console.error('[Scribe] VoiceProcessor error:', error.message);
    this.config.onError?.({ type: 'audio_capture_error', message: error.message });
  };

  // -----------------------------------------------------------------------
  // Private: state management
  // -----------------------------------------------------------------------

  private setState(state: ScribeState): void {
    if (this._state === state) return;
    this._state = state;
    this.config.onStateChange?.(state);
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/**
 * Singleton Scribe service instance.
 * Used by VoiceContext for real-time speech-to-text transcription.
 */
export const scribeService = new ScribeServiceImpl();

export default scribeService;
