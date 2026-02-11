/**
 * OpenAI Realtime API Voice Service
 *
 * WebSocket client for the OpenAI Realtime API.
 * Handles: connection lifecycle, audio streaming, function calls,
 * barge-in, and reconnection with exponential backoff.
 *
 * Protocol: wss://api.openai.com/v1/realtime
 * Audio: PCM16, 24kHz, mono, base64-encoded
 *
 * Reference: https://platform.openai.com/docs/guides/realtime
 */

import { supabase } from '../../lib/supabase';
import { concatenatePcmChunks, createWavFromPcm } from './pcmUtils';

// ============================================================================
// Types
// ============================================================================

export type RealtimeEvent =
  | 'connected'
  | 'disconnected'
  | 'transcript'
  | 'audio_delta'
  | 'audio_done'
  | 'response_text'
  | 'function_call'
  | 'speech_started'
  | 'speech_stopped'
  | 'response_done'
  | 'error';

export interface RealtimeTranscriptEvent {
  text: string;
  isFinal: boolean;
}

export interface RealtimeAudioEvent {
  base64: string;
}

export interface RealtimeFunctionCallEvent {
  callId: string;
  name: string;
  arguments: string; // JSON string
}

export interface RealtimeErrorEvent {
  code: string;
  message: string;
}

type EventCallback = (...args: any[]) => void;

// ============================================================================
// Configuration
// ============================================================================

const REALTIME_CONFIG = {
  /** WebSocket URL */
  WS_URL: 'wss://api.openai.com/v1/realtime',
  /** Model to use */
  MODEL: 'gpt-4o-realtime-preview',
  /** Max reconnect attempts before falling back to REST */
  MAX_RECONNECT_ATTEMPTS: 3,
  /** Base delay for exponential backoff (ms) */
  RECONNECT_BASE_DELAY: 1000,
  /** Maximum reconnect delay (ms) */
  RECONNECT_MAX_DELAY: 10000,
  /** Ephemeral key expiry buffer — refresh 60s before expiry */
  KEY_REFRESH_BUFFER_MS: 60000,
  /** WebSocket connection timeout (ms) */
  CONNECTION_TIMEOUT_MS: 10000,
  /** Max base64 chars per audio chunk sent to WebSocket */
  AUDIO_CHUNK_SIZE: 32768,
};

// ============================================================================
// Service
// ============================================================================

class RealtimeVoiceServiceClass {
  private ws: WebSocket | null = null;
  private ephemeralKey: string | null = null;
  private ephemeralKeyExpiresAt: number = 0;
  private reconnectAttempts: number = 0;
  private isConnecting: boolean = false;
  private _isConnected: boolean = false;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private audioChunks: string[] = [];
  private currentResponseId: string | null = null;
  private sessionConfigured: boolean = false;
  private selectedVoice: string = 'ash';
  /** True when server VAD has committed the buffer (avoids duplicate client commit) */
  private vadCommitted: boolean = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Public API ─────────────────────────────────────────────────

  get isConnected(): boolean {
    return this._isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  get failedPermanently(): boolean {
    return this.reconnectAttempts >= REALTIME_CONFIG.MAX_RECONNECT_ATTEMPTS;
  }

  /**
   * Set the voice for TTS responses.
   */
  setVoice(voice: string): void {
    this.selectedVoice = voice;
  }

  /**
   * Connect to the OpenAI Realtime API.
   * Fetches an ephemeral key from the edge function, then opens WebSocket.
   * Returns true if connected successfully, false otherwise.
   */
  async connect(): Promise<boolean> {
    if (this.isConnected) return true;
    if (this.isConnecting) return false;

    this.isConnecting = true;
    try {
      // Get ephemeral key from edge function
      const key = await this.getEphemeralKey();
      if (!key) {
        console.warn('[RealtimeVoice] Failed to get ephemeral key');
        this.isConnecting = false;
        return false;
      }

      // Connect WebSocket
      const connected = await this.openWebSocket(key);
      this.isConnecting = false;

      if (connected) {
        this.reconnectAttempts = 0;
      }

      return connected;
    } catch (err) {
      console.error('[RealtimeVoice] Connection error:', err);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * Disconnect from the Realtime API. Code 1000 = normal close.
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.sessionConfigured = false;
    this._isConnected = false;

    if (this.ws) {
      try {
        this.ws.close(1000, 'Client disconnect');
      } catch {
        // Ignore close errors
      }
      this.ws = null;
    }

    this.emit('disconnected');
  }

  /**
   * Send a complete audio buffer to the Realtime API.
   * Audio must be base64-encoded PCM16 at 24kHz mono.
   */
  sendAudioBuffer(base64Pcm16: string): void {
    if (!this.isConnected) {
      console.warn('[RealtimeVoice] Not connected, cannot send audio');
      return;
    }

    // Send in chunks to avoid exceeding WebSocket message size limits
    for (let i = 0; i < base64Pcm16.length; i += REALTIME_CONFIG.AUDIO_CHUNK_SIZE) {
      const chunk = base64Pcm16.slice(i, i + REALTIME_CONFIG.AUDIO_CHUNK_SIZE);
      this.sendEvent('input_audio_buffer.append', { audio: chunk });
    }
  }

  /**
   * Commit the audio buffer and request a response.
   * Call after sendAudioBuffer to trigger AI processing.
   */
  commitAudioBuffer(): void {
    if (!this.isConnected) return;

    // If server VAD already committed + triggered a response, skip to avoid
    // "buffer too small" and "already has active response" errors.
    if (this.vadCommitted) {
      console.log('[RealtimeVoice] Skipping manual commit — VAD already committed');
      this.vadCommitted = false;
      return;
    }

    this.sendEvent('input_audio_buffer.commit', {});
    // Only request a response if one isn't already in progress
    if (!this.currentResponseId) {
      this.sendEvent('response.create', {});
    }
  }

  /**
   * Cancel the current response (for barge-in).
   * Stops AI generation and clears the input buffer for fresh input.
   */
  cancelResponse(): void {
    if (!this.isConnected) return;

    if (this.currentResponseId) {
      this.sendEvent('response.cancel', {});
    }

    // Clear audio buffer for fresh input
    this.sendEvent('input_audio_buffer.clear', {});
    this.audioChunks = [];
    this.vadCommitted = false;
  }

  /**
   * Send a function call result back to the Realtime API.
   * After sending, triggers a new response so the AI can react to the result.
   */
  sendFunctionCallResult(callId: string, result: string): void {
    if (!this.isConnected) return;

    this.sendEvent('conversation.item.create', {
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: result,
      },
    });

    // Trigger a follow-up response
    this.sendEvent('response.create', {});
  }

  /**
   * Get accumulated audio chunks as a single WAV base64 string for playback.
   * Drains the buffer (resets chunks).
   */
  getAccumulatedAudioAsWav(): string | null {
    if (this.audioChunks.length === 0) return null;
    const pcm = concatenatePcmChunks(this.audioChunks);
    this.audioChunks = [];
    return createWavFromPcm(pcm, 24000, 1, 16);
  }

  /**
   * Clear accumulated audio chunks without creating WAV.
   */
  clearAudioChunks(): void {
    this.audioChunks = [];
  }

  // ── Event Emitter ──────────────────────────────────────────────

  on(event: RealtimeEvent, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: RealtimeEvent, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(...args);
      } catch (err) {
        console.error(`[RealtimeVoice] Error in ${event} listener:`, err);
      }
    });
  }

  // ── Private: Ephemeral Key ─────────────────────────────────────

  private async getEphemeralKey(): Promise<string | null> {
    // Return cached key if still valid
    if (
      this.ephemeralKey &&
      Date.now() < this.ephemeralKeyExpiresAt - REALTIME_CONFIG.KEY_REFRESH_BUFFER_MS
    ) {
      return this.ephemeralKey;
    }

    try {
      // Ensure we have a valid session before calling
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('[RealtimeVoice] No auth session, cannot get ephemeral key');
        return null;
      }

      let { data, error } = await supabase.functions.invoke('realtime-session', {
        body: { voice: this.selectedVoice },
      });

      // On auth error, refresh and retry once
      if (error) {
        const status = (error as any)?.context?.status;
        if (status === 401 || status === 403) {
          console.log('[RealtimeVoice] Auth error, refreshing session and retrying...');
          const { error: refreshErr } = await supabase.auth.refreshSession();
          if (!refreshErr) {
            const retry = await supabase.functions.invoke('realtime-session', {
              body: { voice: this.selectedVoice },
            });
            data = retry.data;
            error = retry.error;
          }
        }
      }

      if (error) {
        // Try to read the error body for details
        let details = '';
        try {
          const ctx = (error as any)?.context;
          if (ctx?.json) {
            const body = await ctx.json();
            details = JSON.stringify(body);
          } else if (ctx?.text) {
            details = await ctx.text();
          }
        } catch { /* ignore */ }
        console.error(
          '[RealtimeVoice] Failed to get ephemeral key:',
          error.message,
          details || '',
        );
        return null;
      }

      if (!data?.value) {
        console.error('[RealtimeVoice] No key in response, got:', JSON.stringify(data));
        return null;
      }

      this.ephemeralKey = data.value;
      // Default to 2 minutes lifetime if no expiry provided
      this.ephemeralKeyExpiresAt = Date.now() + 120_000;

      return this.ephemeralKey;
    } catch (err) {
      console.error('[RealtimeVoice] Ephemeral key fetch error:', err);
      return null;
    }
  }

  // ── Private: WebSocket ─────────────────────────────────────────

  private openWebSocket(ephemeralKey: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const url = `${REALTIME_CONFIG.WS_URL}?model=${REALTIME_CONFIG.MODEL}`;

        // React Native WebSocket doesn't support custom headers.
        // Use subprotocols to pass auth (documented OpenAI pattern for browser/RN).
        // Must include 'openai-beta.realtime-v1' to match the beta client secret.
        this.ws = new WebSocket(url, [
          'realtime',
          `openai-insecure-api-key.${ephemeralKey}`,
          'openai-beta.realtime-v1',
        ]);

        const timeout = setTimeout(() => {
          console.warn('[RealtimeVoice] Connection timeout');
          try { this.ws?.close(); } catch { /* noop */ }
          resolve(false);
        }, REALTIME_CONFIG.CONNECTION_TIMEOUT_MS);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('[RealtimeVoice] WebSocket connected');
          this._isConnected = true;
          this.configureSession();
          this.emit('connected');
          resolve(true);
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          console.log('[RealtimeVoice] WebSocket closed:', event.code, event.reason);
          const wasConnected = this._isConnected;
          this._isConnected = false;
          this.sessionConfigured = false;
          this.emit('disconnected');

          // Auto-reconnect on abnormal close (not intentional disconnect)
          if (wasConnected && event.code !== 1000) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (event) => {
          clearTimeout(timeout);
          console.error('[RealtimeVoice] WebSocket error:', event);
          this.emit('error', {
            code: 'WS_ERROR',
            message: 'WebSocket connection error',
          });
          resolve(false);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data as string);
        };
      } catch (err) {
        console.error('[RealtimeVoice] Failed to create WebSocket:', err);
        resolve(false);
      }
    });
  }

  /**
   * Configure the Realtime session after connection.
   * Sets turn detection (server VAD), audio formats, and voice.
   * Tools are already configured server-side via the ephemeral key session.
   */
  private configureSession(): void {
    if (this.sessionConfigured) return;

    this.sendEvent('session.update', {
      session: {
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1500,
        },
        input_audio_transcription: {
          model: 'whisper-1',
        },
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        voice: this.selectedVoice,
      },
    });

    this.sessionConfigured = true;
  }

  /**
   * Parse and route incoming Realtime API events.
   */
  private handleMessage(rawData: string): void {
    try {
      const event = JSON.parse(rawData);
      const type: string = event.type;

      switch (type) {
        case 'session.created':
        case 'session.updated':
          console.log(`[RealtimeVoice] ${type}`);
          break;

        case 'input_audio_buffer.speech_started':
          console.log('[RealtimeVoice] Speech started (VAD)');
          this.emit('speech_started');
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('[RealtimeVoice] Speech stopped (VAD)');
          this.emit('speech_stopped');
          break;

        case 'input_audio_buffer.committed':
          console.log('[RealtimeVoice] Audio buffer committed');
          // Server VAD auto-committed — mark so client skips duplicate commit
          this.vadCommitted = true;
          break;

        case 'response.created':
          this.currentResponseId = event.response?.id || null;
          break;

        // GA API uses response.output_audio_transcript.* (not response.audio_transcript.*)
        case 'response.output_audio_transcript.delta':
        case 'response.audio_transcript.delta':
          this.emit('transcript', {
            text: event.delta || '',
            isFinal: false,
          } as RealtimeTranscriptEvent);
          break;

        case 'response.output_audio_transcript.done':
        case 'response.audio_transcript.done':
          this.emit('transcript', {
            text: event.transcript || '',
            isFinal: true,
          } as RealtimeTranscriptEvent);
          break;

        // GA API uses response.output_audio.* (not response.audio.*)
        case 'response.output_audio.delta':
        case 'response.audio.delta':
          if (event.delta) {
            this.audioChunks.push(event.delta);
            this.emit('audio_delta', { base64: event.delta } as RealtimeAudioEvent);
          }
          break;

        case 'response.output_audio.done':
        case 'response.audio.done':
          this.emit('audio_done');
          break;

        case 'response.text.delta':
          this.emit('response_text', { text: event.delta || '', isFinal: false });
          break;

        case 'response.text.done':
          this.emit('response_text', { text: event.text || '', isFinal: true });
          break;

        // Conversation lifecycle events (informational, no action needed)
        case 'conversation.item.added':
        case 'conversation.item.done':
        case 'response.output_item.added':
        case 'response.output_item.done':
        case 'response.content_part.added':
        case 'response.content_part.done':
          break;

        case 'response.function_call_arguments.done':
          this.emit('function_call', {
            callId: event.call_id,
            name: event.name,
            arguments: event.arguments || '{}',
          } as RealtimeFunctionCallEvent);
          break;

        case 'response.done':
          this.currentResponseId = null;
          this.vadCommitted = false;
          this.emit('response_done', event.response);
          break;

        case 'error':
          console.error('[RealtimeVoice] Server error:', event.error);
          // Invalidate cached key on version mismatch — next connect will fetch fresh
          if (event.error?.code === 'api_version_mismatch') {
            this.ephemeralKey = null;
            this.ephemeralKeyExpiresAt = 0;
          }
          this.emit('error', {
            code: event.error?.code || 'UNKNOWN',
            message: event.error?.message || 'Unknown error',
          } as RealtimeErrorEvent);
          break;

        default:
          // Log unhandled events in dev mode
          if (__DEV__) {
            console.log('[RealtimeVoice] Unhandled event:', type);
          }
      }
    } catch (err) {
      console.error('[RealtimeVoice] Failed to parse message:', err);
    }
  }

  /**
   * Send a client event to the Realtime API over the WebSocket.
   */
  private sendEvent(type: string, data: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn(`[RealtimeVoice] Cannot send ${type}: not connected`);
      return;
    }

    const message = JSON.stringify({ type, ...data });
    this.ws.send(message);
  }

  // ── Private: Reconnection ──────────────────────────────────────

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= REALTIME_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.log('[RealtimeVoice] Max reconnect attempts reached — falling back to REST');
      this.emit('error', {
        code: 'MAX_RECONNECTS',
        message: 'Failed to reconnect after maximum attempts. Falling back to REST.',
      } as RealtimeErrorEvent);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      REALTIME_CONFIG.RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts - 1),
      REALTIME_CONFIG.RECONNECT_MAX_DELAY,
    );

    console.log(
      `[RealtimeVoice] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${REALTIME_CONFIG.MAX_RECONNECT_ATTEMPTS})`,
    );

    await new Promise<void>((resolve) => {
      this.reconnectTimer = setTimeout(resolve, delay);
    });

    // Refresh ephemeral key for reconnect
    this.ephemeralKey = null;
    await this.connect();
  }

  /**
   * Reset reconnect counter (e.g. after successful user-initiated reconnect).
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }

  /**
   * Dispose of all resources. Call on app teardown.
   */
  dispose(): void {
    this.disconnect();
    this.listeners.clear();
    this.audioChunks = [];
    this.ephemeralKey = null;
  }
}

// Export singleton
export const realtimeVoiceService = new RealtimeVoiceServiceClass();
