/**
 * Type declarations for Picovoice Porcupine React Native SDK
 *
 * The @picovoice/porcupine-react-native and @picovoice/react-native-voice-processor
 * packages don't ship .d.ts files. These declarations provide type safety
 * for our WakeWordService.
 */

declare module '@picovoice/porcupine-react-native' {
  export enum BuiltInKeyword {
    ALEXA = 'ALEXA',
    AMERICANO = 'AMERICANO',
    BLUEBERRY = 'BLUEBERRY',
    BUMBLEBEE = 'BUMBLEBEE',
    COMPUTER = 'COMPUTER',
    GRAPEFRUIT = 'GRAPEFRUIT',
    GRASSHOPPER = 'GRASSHOPPER',
    HEY_GOOGLE = 'HEY_GOOGLE',
    HEY_SIRI = 'HEY_SIRI',
    JARVIS = 'JARVIS',
    OK_GOOGLE = 'OK_GOOGLE',
    PICOVOICE = 'PICOVOICE',
    PORCUPINE = 'PORCUPINE',
    TERMINATOR = 'TERMINATOR',
  }

  export class Porcupine {
    /** Frame length expected by the engine (number of audio samples per frame) */
    readonly frameLength: number;
    /** Audio sample rate expected by the engine */
    readonly sampleRate: number;
    /** Porcupine version string */
    readonly version: string;

    /** Create from built-in keyword(s) */
    static fromBuiltInKeywords(
      accessKey: string,
      keywords: BuiltInKeyword[],
      sensitivities?: number[],
    ): Promise<Porcupine>;

    /** Create from custom .ppn keyword model file(s) */
    static fromKeywordPaths(
      accessKey: string,
      keywordPaths: string[],
      sensitivities?: number[],
      modelPath?: string,
    ): Promise<Porcupine>;

    /** Process a single audio frame. Returns keyword index (≥0) or -1 if no detection. */
    process(frame: number[]): Promise<number>;

    /** Release resources */
    delete(): Promise<void>;
  }

  export class PorcupineError extends Error {
    constructor(message: string);
  }
}

declare module '@picovoice/react-native-voice-processor' {
  export type FrameListener = (frame: number[]) => void | Promise<void>;
  export type ErrorListener = (error: Error) => void;

  export const VoiceProcessor: {
    /** Add a listener that receives audio frames */
    addFrameListener(listener: FrameListener): void;
    /** Remove a previously added frame listener */
    removeFrameListener(listener: FrameListener): void;
    /** Add a listener for audio processing errors */
    addErrorListener(listener: ErrorListener): void;
    /** Remove a previously added error listener */
    removeErrorListener(listener: ErrorListener): void;
    /** Start audio capture with the specified frame length and sample rate */
    start(frameLength: number, sampleRate: number): Promise<void>;
    /** Stop audio capture */
    stop(): Promise<void>;
    /** Whether audio capture is currently active */
    isRecording(): Promise<boolean>;
  };
}
