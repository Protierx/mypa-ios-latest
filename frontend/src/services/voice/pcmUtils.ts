/**
 * PCM Audio Utilities
 *
 * Conversion utilities for OpenAI Realtime API audio format.
 * Realtime API uses: PCM16, 24kHz, mono, little-endian, base64-encoded.
 */

/**
 * Decode a base64 string into a Uint8Array.
 * Works in React Native (Hermes) and web.
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encode a Uint8Array to a base64 string.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Strip the 44-byte WAV header from a base64-encoded WAV file,
 * returning raw PCM16 data as base64.
 */
export function stripWavHeader(wavBase64: string): string {
  const bytes = base64ToBytes(wavBase64);
  // Standard WAV header is 44 bytes for PCM format
  if (bytes.length <= 44) return '';
  const pcmBytes = bytes.slice(44);
  return bytesToBase64(pcmBytes);
}

/**
 * Create a WAV file (base64) from raw PCM16 data (base64).
 * Used to wrap PCM audio from Realtime API for expo-av playback.
 */
export function createWavFromPcm(
  pcmBase64: string,
  sampleRate: number = 24000,
  channels: number = 1,
  bitsPerSample: number = 16,
): string {
  const pcmBytes = base64ToBytes(pcmBase64);
  const dataLength = pcmBytes.length;

  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  // RIFF header
  header[0] = 0x52; header[1] = 0x49; header[2] = 0x46; header[3] = 0x46; // "RIFF"
  view.setUint32(4, 36 + dataLength, true); // File size - 8
  header[8] = 0x57; header[9] = 0x41; header[10] = 0x56; header[11] = 0x45; // "WAVE"

  // fmt chunk
  header[12] = 0x66; header[13] = 0x6D; header[14] = 0x74; header[15] = 0x20; // "fmt "
  view.setUint32(16, 16, true); // Chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true); // Byte rate
  view.setUint16(32, channels * (bitsPerSample / 8), true); // Block align
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  header[36] = 0x64; header[37] = 0x61; header[38] = 0x74; header[39] = 0x61; // "data"
  view.setUint32(40, dataLength, true);

  // Combine header + PCM data
  const wavBytes = new Uint8Array(44 + dataLength);
  wavBytes.set(header);
  wavBytes.set(pcmBytes, 44);

  return bytesToBase64(wavBytes);
}

/**
 * Concatenate multiple base64 PCM chunks into a single base64 string.
 */
export function concatenatePcmChunks(chunks: string[]): string {
  if (chunks.length === 0) return '';
  if (chunks.length === 1) return chunks[0];

  const byteArrays = chunks.map(base64ToBytes);
  const totalLength = byteArrays.reduce((sum, arr) => sum + arr.length, 0);
  const combined = new Uint8Array(totalLength);

  let offset = 0;
  for (const arr of byteArrays) {
    combined.set(arr, offset);
    offset += arr.length;
  }

  return bytesToBase64(combined);
}
