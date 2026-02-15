// AudioSessionService.ts — DND / Phone Call Awareness (Voice Polish Step 3)
//
// Configures the iOS/Android audio session so MYPA pauses when a phone call,
// Siri, or other audio interruption occurs. Exposes an `isInterrupted` flag
// that VoiceContext checks before starting voice or playing TTS.
//
// Limitation (V1): expo-audio detects audio-route interruptions (phone calls,
// Siri) but cannot read iOS Focus/DND state. Full DND detection would need
// a custom native module or react-native-callkeep.

class AudioSessionServiceImpl {
  private _isInterrupted = false;
  private _isConfigured = false;
  private _onInterruption: ((interrupted: boolean) => void) | null = null;

  /** Whether the audio session is currently interrupted (phone call, Siri, etc.) */
  get isInterrupted(): boolean {
    return this._isInterrupted;
  }

  /**
   * Configure the audio session for voice conversations.
   * - `DoNotMix` means iOS will pause our audio when a call/Siri starts
   * - `allowsRecordingIOS` keeps the mic available for ConvAI
   * - `playsInSilentModeIOS` ensures TTS plays even if the mute switch is on
   */
  async configure(): Promise<void> {
    if (this._isConfigured) return;

    try {
      const { setAudioModeAsync } = await import('expo-audio');

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'doNotMix',
      });

      this._isConfigured = true;
      console.log('[AudioSession] Configured — DoNotMix interruption mode');
    } catch (err) {
      console.warn('[AudioSession] Failed to configure audio session:', err);
    }
  }

  /** Register a callback to be notified when interruption state changes */
  onInterruption(callback: (interrupted: boolean) => void): void {
    this._onInterruption = callback;
  }

  /**
   * Mark the session as interrupted or recovered.
   * Called from VoiceContext when ElevenLabs errors/disconnects suggest
   * an audio route interruption, and on session end to reset.
   */
  setInterrupted(interrupted: boolean): void {
    if (this._isInterrupted === interrupted) return; // no-op if unchanged
    this._isInterrupted = interrupted;
    console.log(`[AudioSession] Interrupted: ${interrupted}`);
    this._onInterruption?.(interrupted);
  }

  /** Clean up — remove the listener */
  teardown(): void {
    this._onInterruption = null;
    this._isInterrupted = false;
    this._isConfigured = false;
    console.log('[AudioSession] Torn down');
  }
}

export const audioSessionService = new AudioSessionServiceImpl();
